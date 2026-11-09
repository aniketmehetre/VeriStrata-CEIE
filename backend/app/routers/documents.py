"""
TraceDoc – Document Ingestion & Pipeline Orchestration Router.
Handles document uploads, manual classification overrides, and async analysis pipeline execution.
"""
from __future__ import annotations
import aiosqlite
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, BackgroundTasks
from app.db import get_db, open_db
from app.schemas import DocumentOut, ClassificationOverride
from app.utils.audit import write_audit
from app.workers.ingest import quarantine_upload
from app.workers.normalise import normalise_document
from app.workers.classify import classify_document
from app.workers.extract_pdf import extract_native_pdf
from app.workers.extract_ocr import extract_ocr
from app.workers.forensics_structural import analyse_pdf_structure
from app.workers.forensics_pixel import analyse_pixels
from app.workers.rules_intra import run_intra_rules
from app.workers.correlation import correlate_bundle
from app.workers.hypothesis import test_hypotheses
from app.workers.graph import build_evidence_graph
from app.workers.findings import generate_findings

router = APIRouter(tags=["documents"])


@router.post("/api/cases/{case_id}/documents", response_model=list[DocumentOut], status_code=201)
async def upload_documents(
    case_id: str, background_tasks: BackgroundTasks, files: list[UploadFile] = File(...), db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT case_id FROM cases WHERE case_id = ?", (case_id,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, f"Case {case_id} not found")

    docs = []
    for f in files:
        doc = await quarantine_upload(db, await f.read(), f.filename or "doc", case_id)
        docs.append(doc)
        background_tasks.add_task(_process_upload, doc.document_id)
    return docs


async def _process_upload(doc_id: str):
    async with open_db() as db:
        await normalise_document(db, doc_id)
        await classify_document(db, doc_id)


@router.get("/api/cases/{case_id}/documents", response_model=list[DocumentOut])
async def list_documents(case_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM documents WHERE case_id = ? ORDER BY created_at", (case_id,)) as cur:
        return [DocumentOut(**dict(r)) for r in await cur.fetchall()]


@router.get("/api/documents/{document_id}/pages/{page_index}")
async def get_document_page_image(document_id: str, page_index: int, db: aiosqlite.Connection = Depends(get_db)):
    from fastapi.responses import FileResponse, Response
    from pathlib import Path
    async with db.execute(
        "SELECT image_path FROM page_manifests WHERE document_id = ? AND page_index = ?",
        (document_id, page_index),
    ) as cur:
        row = await cur.fetchone()
    if not row or not row["image_path"] or not Path(row["image_path"]).exists():
        raise HTTPException(404, "Page manifest or rendered image not found")
    return FileResponse(row["image_path"], media_type="image/png")


@router.post("/api/cases/{case_id}/documents/{document_id}/classify")
async def override_classification(case_id: str, document_id: str, body: ClassificationOverride, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("UPDATE documents SET classification = ?, classification_confidence = 1.0 WHERE document_id = ?", (body.override, document_id))
    await db.commit()
    await write_audit(db, "CLASSIFICATION_OVERRIDE", document_id, actor="reviewer", payload={"override": body.override})
    return {"ok": True, "classification": body.override}


@router.post("/api/cases/{case_id}/analyze")
async def start_analysis(case_id: str, background_tasks: BackgroundTasks, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT case_id FROM cases WHERE case_id = ?", (case_id,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, f"Case {case_id} not found")

    await db.execute("UPDATE cases SET status = 'analyzing' WHERE case_id = ?", (case_id,))
    await db.commit()
    background_tasks.add_task(_run_full_pipeline, case_id)
    return {"ok": True, "case_id": case_id, "status": "analyzing", "poll": f"/api/cases/{case_id}/status"}


async def _run_full_pipeline(case_id: str):
    """Executes the full forensic and reasoning pipeline sequentially."""
    async with open_db() as db:
        async with db.execute("SELECT * FROM documents WHERE case_id = ?", (case_id,)) as cur:
            docs = [dict(r) for r in await cur.fetchall()]

        for d in docs:
            did = d["document_id"]
            if d["status"] in ["uploaded", "quarantined"]:
                await normalise_document(db, did)
            if d["classification"] == "UNKNOWN":
                await classify_document(db, did)
            await extract_native_pdf(db, did)
            await extract_ocr(db, did)
            await analyse_pdf_structure(db, did)
            await analyse_pixels(db, did, 0)
            await run_intra_rules(db, did)

        # Cross-document correlation, Z3 theorem solving, and finding generation
        await correlate_bundle(db, case_id)
        await test_hypotheses(db, case_id)
        await build_evidence_graph(db, case_id)
        await generate_findings(db, case_id)

        await db.execute("UPDATE cases SET status = 'complete' WHERE case_id = ?", (case_id,))
        await db.commit()
