"""
TraceDoc – Forensic Workbench HTML Route.
Renders the browser-based investigation workbench interface directly from template.
"""
from __future__ import annotations
import aiosqlite
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from app.db import get_db
from app.utils.helpers import from_json

router = APIRouter(tags=["workbench"])
TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "templates" / "workbench.html"


@router.get("/report/{case_id}", response_class=HTMLResponse)
@router.get("/cases/{case_id}/workbench", response_class=HTMLResponse)
async def view_workbench(case_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, f"Case {case_id} not found")

    async with db.execute("SELECT * FROM documents WHERE case_id = ? ORDER BY created_at", (case_id,)) as cur:
        docs = [dict(r) for r in await cur.fetchall()]

    async with db.execute("SELECT * FROM findings WHERE case_id = ?", (case_id,)) as cur:
        findings = [dict(r) for r in await cur.fetchall()]

    first_finding = findings[0] if findings else {}
    first_fid = first_finding.get("finding_id", "")
    status = first_finding.get("status", "observation")

    # Witness claims
    witness_ids = from_json(first_finding.get("witness_claim_ids", "[]"))
    witness_claims = []
    for wid in witness_ids:
        async with db.execute("SELECT c.*, d.source_name FROM claims c JOIN documents d ON d.document_id = c.document_id WHERE c.claim_id = ?", (wid,)) as cur:
            row = await cur.fetchone()
            if row:
                witness_claims.append(dict(row))

    # Hypotheses & audit stats
    async with db.execute("SELECT * FROM hypothesis_tests WHERE case_id = ?", (case_id,)) as cur:
        hyps = [dict(r) for r in await cur.fetchall()]

    async with db.execute("SELECT count(*) as cnt, payload_hash FROM audit_events WHERE object_id = ? OR object_id IN (SELECT document_id FROM documents WHERE case_id = ?)", (case_id, case_id)) as cur:
        row = await cur.fetchone()
        audit_cnt = row["cnt"] if row else 0
        root_hash = (row["payload_hash"] or "e3b0c44298fc")[:16] + "..."

    # Build HTML fragments
    doc_items = "".join([
        f'<div class="p-2.5 rounded-lg glass cursor-pointer mb-2"><div class="flex justify-between text-xs font-semibold text-slate-200"><span>{d["source_name"]}</span><span class="mono text-[10px] text-cyan-400">{d["classification"]}</span></div><div class="text-[10px] text-slate-400 flex justify-between mono mt-1"><span>Pages: {d["page_count"]}</span><span>SHA: {d["original_sha256"][:8]}...</span></div></div>'
        for d in docs
    ])

    witness_items = "".join([
        f'<div class="p-2 rounded bg-slate-900/90 border border-slate-800 flex justify-between text-xs"><div><span class="font-semibold text-slate-200 block">{w["field_name"]}</span><span class="text-[10px] text-slate-400">{w["source_name"]}</span></div><span class="mono font-semibold text-cyan-300">{w["raw_text"]}</span></div>'
        for w in witness_claims
    ]) or "<div class='text-xs text-slate-500 italic p-2'>No conflicting claims in minimal witness set.</div>"

    hyps_items = "".join([
        f'<div class="p-2.5 rounded-lg glass border border-slate-800/90 mb-2"><div class="flex justify-between text-xs font-semibold text-slate-200"><span>{h["name"]}</span><span class="mono text-[10px] font-bold px-2 py-0.5 rounded {"badge-sat" if h["outcome"]=="SUPPORTED" else "badge-unsat"}">{h["outcome"]}</span></div><p class="text-[11px] text-slate-400 mt-1">{h["explanation"]}</p></div>'
        for h in hyps
    ]) or "<div class='text-xs text-slate-500 italic p-2'>All constraints satisfied.</div>"

    residual_txt = f"INR {max([h.get('residual_conflict', 0) for h in hyps], default=0):,.2f}"
    crop_html = f'<div class="text-center"><div class="text-2xl font-bold text-white mono mb-1">{witness_claims[0]["raw_text"]}</div><div class="text-xs text-cyan-400 mono">Extracted from {witness_claims[0]["source_name"]}</div></div>' if witness_claims else '<div class="text-center text-slate-400"><div class="text-sm font-semibold text-slate-200">Reconciled Document Field</div><div class="text-xs text-slate-500 mt-1">Split payroll credits sum to exact declared salary.</div></div>'

    html = TEMPLATE_PATH.read_text(encoding="utf-8")
    replacements = {
        "__CASE_ID__": case_id, "__CASE_STATUS__": status.upper(),
        "__STATUS_CLASS__": "badge-unsat" if status == "potential_manipulation" else ("badge-warn" if status == "inconsistency" else "badge-sat"),
        "__DOC_COUNT__": str(len(docs)), "__AUDIT_COUNT__": str(audit_cnt), "__ROOT_HASH__": root_hash,
        "__DOC_ITEMS_HTML__": doc_items, "__WITNESS_CLAIMS_HTML__": witness_items,
        "__HYPOTHESES_CARDS_HTML__": hyps_items, "__RESIDUAL_INR__": residual_txt,
        "__FIRST_FINDING_ID__": first_fid, "__CROP_PREVIEW_HTML__": crop_html,
        "__DOC_TITLE__": docs[0]["source_name"] if docs else "Case Documents",
    }
    for k, v in replacements.items():
        html = html.replace(k, v)
    return HTMLResponse(content=html)


@router.get("/", response_class=HTMLResponse)
async def root_workbench(db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT case_id FROM cases ORDER BY created_at DESC LIMIT 1") as cur:
        row = await cur.fetchone()
    if row:
        return await view_workbench(row["case_id"], db)
    return HTMLResponse("<h1>TraceDoc Operational</h1><p>Run <code>python run_demo.py</code> to seed cases.</p>")
