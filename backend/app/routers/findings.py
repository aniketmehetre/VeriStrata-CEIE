"""
TraceDoc – Findings & Review Router.
Exposes findings, evidence subgraphs, and immutable reviewer actions.
"""
from __future__ import annotations
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db, insert
from app.schemas import FindingOut, ReviewCreate, ReviewEventOut
from app.utils.helpers import new_id, now_iso, sha256_str, from_json
from app.utils.audit import write_audit

router = APIRouter(tags=["findings"])

TRANSITIONS = {"accept": "reviewer_confirmed", "dismiss": "reviewer_dismissed", "annotate": "under_review"}


def _f_dict(row) -> FindingOut:
    d = dict(row)
    d["witness_claim_ids"] = from_json(d.get("witness_claim_ids", "[]"))
    d["supporting_signal_ids"] = from_json(d.get("supporting_signal_ids", "[]"))
    d["uncertainty_profile"] = from_json(d.get("uncertainty_profile", "{}")) or {}
    d["review_required"] = bool(d["review_required"])
    return FindingOut(**d)


@router.get("/api/cases/{case_id}/findings", response_model=list[FindingOut])
async def list_findings(case_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM findings WHERE case_id = ? ORDER BY priority DESC", (case_id,)) as cur:
        return [_f_dict(r) for r in await cur.fetchall()]


@router.get("/api/findings/{finding_id}/evidence")
async def get_finding_evidence(finding_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM findings WHERE finding_id = ?", (finding_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "Finding not found")
    f = _f_dict(row)

    # Witnesses
    witnesses = []
    for cid in f.witness_claim_ids:
        async with db.execute("SELECT * FROM claims WHERE claim_id = ?", (cid,)) as cur:
            cr = await cur.fetchone()
            if cr:
                cd = dict(cr)
                cd["bbox_norm"] = from_json(cd.get("bbox_norm", "[]"))
                cd["alternatives"] = []
                from app.schemas import ClaimOut
                witnesses.append(ClaimOut(**cd))

    from app.workers.graph import build_evidence_graph
    return {"finding": f, "witness_claims": witnesses, "graph": await build_evidence_graph(db, f.case_id)}


@router.post("/api/findings/{finding_id}/review", response_model=ReviewEventOut)
async def review_finding(finding_id: str, body: ReviewCreate, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM findings WHERE finding_id = ?", (finding_id,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, "Finding not found")

    if body.action == "dismiss" and not body.reason.strip():
        raise HTTPException(422, "Reason is required when dismissing a finding")

    # Fetch previous review hash for chaining
    async with db.execute("SELECT previous_event_hash FROM review_events WHERE finding_id = ? ORDER BY timestamp DESC LIMIT 1", (finding_id,)) as cur:
        prev = await cur.fetchone()

    rev_id, ts = new_id(), now_iso()
    chain_hash = sha256_str(f"{rev_id}{body.action}{body.reason}{ts}{prev['previous_event_hash'] if prev else ''}")

    rev_data = {
        "review_id": rev_id, "finding_id": finding_id, "actor": "reviewer", "action": body.action,
        "reason": body.reason, "timestamp": ts, "previous_event_hash": chain_hash,
    }
    await insert(db, "review_events", rev_data)
    await db.execute("UPDATE findings SET status = ? WHERE finding_id = ?", (TRANSITIONS.get(body.action, "under_review"), finding_id))
    await db.commit()
    await write_audit(db, "REVIEW_ACTION", finding_id, actor="reviewer", payload={"action": body.action})
    return ReviewEventOut(**rev_data)


@router.get("/api/findings/{finding_id}/review/history", response_model=list[ReviewEventOut])
async def get_review_history(finding_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM review_events WHERE finding_id = ? ORDER BY timestamp", (finding_id,)) as cur:
        return [ReviewEventOut(**dict(r)) for r in await cur.fetchall()]
