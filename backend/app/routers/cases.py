"""
TraceDoc – Case Lifecycle Router.
Case creation, status polling, evidence graph export, and audit queries.
"""
from __future__ import annotations
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db, insert
from app.schemas import CaseCreate, CaseOut, JobStatusOut
from app.utils.helpers import new_id, now_iso
from app.utils.audit import write_audit

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=list[CaseOut])
async def list_cases(db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM cases ORDER BY created_at DESC") as cur:
        return [CaseOut(**dict(r)) for r in await cur.fetchall()]


@router.post("/demo")
async def create_demo_case(body: dict, db: aiosqlite.Connection = Depends(get_db)):
    bundle_type = body.get("bundle_type", "clean")
    from pathlib import Path
    from app.config import settings
    from app.workers.ingest import quarantine_upload
    from app.workers.normalise import normalise_document
    from app.workers.classify import classify_document
    from app.workers.extract_pdf import extract_native_pdf
    from app.workers.forensics_structural import analyse_pdf_structure
    from app.workers.forensics_pixel import analyse_pixels
    from app.workers.rules_intra import run_intra_rules
    from app.workers.correlation import correlate_bundle
    from app.workers.hypothesis import test_hypotheses
    from app.workers.graph import build_evidence_graph
    from app.workers.findings import generate_findings

    folder_name = "clean_bundle" if bundle_type == "clean" else "tampered_bundle"
    bundle_dir = settings.data_dir / "synthetic" / folder_name
    if not bundle_dir.exists():
        # Fallback to root/data/synthetic
        bundle_dir = Path(__file__).resolve().parent.parent.parent / "data" / "synthetic" / folder_name

    case_id, ts = new_id(), now_iso()
    case_data = {
        "case_id": case_id,
        "created_by": f"demo_{bundle_type}",
        "bundle_type": "LOAN_APPLICATION",
        "status": "created",
        "retention_policy": "30d",
        "created_at": ts,
    }
    await insert(db, "cases", case_data)
    await db.commit()
    await write_audit(db, "CASE_CREATED", case_id, actor="demo_runner")

    # Ingest PDFs
    pdf_files = sorted(bundle_dir.glob("*.pdf"))
    for f in pdf_files:
        doc = await quarantine_upload(db, f.read_bytes(), f.name, case_id)
        await normalise_document(db, doc.document_id)
        await classify_document(db, doc.document_id)

    async with db.execute("SELECT * FROM documents WHERE case_id = ?", (case_id,)) as cur:
        docs = [dict(r) for r in await cur.fetchall()]

    for d in docs:
        did = d["document_id"]
        await extract_native_pdf(db, did)
        await analyse_pdf_structure(db, did)
        await analyse_pixels(db, did, 0)
        await run_intra_rules(db, did)

    await correlate_bundle(db, case_id)
    await test_hypotheses(db, case_id)
    await build_evidence_graph(db, case_id)
    await generate_findings(db, case_id)

    await db.execute("UPDATE cases SET status = 'complete' WHERE case_id = ?", (case_id,))
    await db.commit()
    return {"ok": True, "case_id": case_id, "bundle_type": bundle_type}


@router.post("", response_model=CaseOut, status_code=201)
async def create_case(body: CaseCreate, db: aiosqlite.Connection = Depends(get_db)):
    case_id, ts = new_id(), now_iso()
    case_data = {
        "case_id": case_id, "created_by": body.created_by, "bundle_type": body.bundle_type,
        "status": "created", "retention_policy": body.retention_policy, "created_at": ts,
    }
    await insert(db, "cases", case_data)
    await db.commit()
    await write_audit(db, "CASE_CREATED", case_id, actor=body.created_by)
    return CaseOut(**case_data)


@router.get("/{case_id}", response_model=CaseOut)
async def get_case(case_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404, f"Case {case_id} not found")
    return CaseOut(**dict(row))


@router.get("/{case_id}/status", response_model=JobStatusOut)
async def get_case_status(case_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404, f"Case {case_id} not found")

    async with db.execute("SELECT event_type FROM audit_events WHERE object_id = ?", (case_id,)) as cur:
        events = {r["event_type"] for r in await cur.fetchall()}

    stages = {
        "upload": "complete",
        "normalised": "complete" if "PAGES_NORMALISED" in events else "pending",
        "extracted": "complete" if "CLAIMS_EXTRACTED" in events else "pending",
        "forensics": "complete" if "STRUCTURAL_ANALYSIS_COMPLETE" in events else "pending",
        "hypothesis": "complete" if "HYPOTHESES_COMPLETE" in events else "pending",
        "findings": "complete" if "FINDINGS_GENERATED" in events else "pending",
    }
    return JobStatusOut(
        case_id=case_id, status=dict(row)["status"], stages=stages, warnings=[], created_at=dict(row)["created_at"],
    )


@router.get("/{case_id}/graph")
async def get_case_graph(case_id: str, db: aiosqlite.Connection = Depends(get_db)):
    from app.workers.graph import build_evidence_graph
    return await build_evidence_graph(db, case_id)


@router.get("/{case_id}/hypotheses")
async def get_case_hypotheses(case_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM hypothesis_tests WHERE case_id = ?", (case_id,)) as cur:
        return [dict(r) for r in await cur.fetchall()]


@router.get("/{case_id}/signals")
async def get_case_signals(case_id: str, db: aiosqlite.Connection = Depends(get_db)):
    from app.utils.helpers import from_json
    async with db.execute(
        "SELECT s.*, d.source_name FROM signals s JOIN documents d ON d.document_id = s.document_id WHERE d.case_id = ?",
        (case_id,),
    ) as cur:
        rows = [dict(r) for r in await cur.fetchall()]
    for r in rows:
        r["metadata"] = from_json(r.get("metadata", "{}"))
        r["bbox_norm"] = from_json(r.get("bbox_norm", "[]"))
    return rows


@router.get("/{case_id}/audit")
async def get_case_audit(case_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute(
        "SELECT * FROM audit_events WHERE object_id = ? OR object_id IN (SELECT document_id FROM documents WHERE case_id = ?) ORDER BY timestamp",
        (case_id, case_id),
    ) as cur:
        return [dict(r) for r in await cur.fetchall()]
