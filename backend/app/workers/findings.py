"""
TraceDoc – Finding Generator & Corroboration Worker.
Synthesizes cross-document conflicts, Z3 solver traces, and forensic signals into findings.
"""
from __future__ import annotations
import aiosqlite
from app.db import insert
from app.utils.helpers import new_id, now_iso, from_json, to_json
from app.utils.audit import write_audit


async def generate_findings(db: aiosqlite.Connection, case_id: str) -> list[dict]:
    # 1. Fetch conflicts & hypothesis outcomes
    async with db.execute("SELECT * FROM correlation_edges WHERE case_id = ? AND outcome = 'CONFLICT'", (case_id,)) as cur:
        conflict_edges = [dict(r) for r in await cur.fetchall()]

    async with db.execute("SELECT * FROM hypothesis_tests WHERE case_id = ?", (case_id,)) as cur:
        hyps = [dict(r) for r in await cur.fetchall()]

    # Reconciled if the core salary reconciliation hypothesis (split_credit) is SUPPORTED
    split_hyp = next((h for h in hyps if h["name"] == "split_credit"), None)
    reconciled = split_hyp is not None and split_hyp["outcome"] == "SUPPORTED"
    unexplained_residual = split_hyp["residual_conflict"] if split_hyp else 0.0

    # 2. Fetch signals
    async with db.execute(
        "SELECT s.* FROM signals s JOIN documents d ON d.document_id = s.document_id WHERE d.case_id = ?",
        (case_id,),
    ) as cur:
        signals = [dict(r) for r in await cur.fetchall() if "NOT_APPLICABLE" not in from_json(r["quality_flags"])]

    findings = []

    # Case A: Conflict reconciled by supported benign hypothesis (Restraint)
    if reconciled:
        findings.append({
            "finding_id": new_id(), "case_id": case_id, "status": "observation", "priority": "low",
            "finding_type": "reconciled_salary_discrepancy",
            "witness_claim_ids": split_hyp["evidence_used"] if split_hyp else "[]",
            "supporting_signal_ids": to_json([s["signal_id"] for s in signals[:2]]),
            "uncertainty_profile": to_json({"extraction": 0.95, "context": 0.95, "reconciled": True}),
            "review_required": 0, "created_at": now_iso(),
        })

    # Case B: Discrepancy remains unexplained (Detection)
    elif conflict_edges or unexplained_residual > 0:
        witnesses = set()
        for e in conflict_edges:
            witnesses.add(e["claim_id_a"])
            witnesses.add(e["claim_id_b"])
        if split_hyp:
            for cid in from_json(split_hyp["evidence_used"]):
                witnesses.add(cid)

        # Multi-family corroboration
        corrob_sigs = [s for s in signals if s["evidence_family"] in ["text_layout", "visual_pixel", "file_structure"]]
        family_count = len(set(s["evidence_family"] for s in corrob_sigs)) + 1  # +1 for context_semantics

        findings.append({
            "finding_id": new_id(), "case_id": case_id,
            "status": "potential_manipulation" if family_count >= 2 else "inconsistency",
            "priority": "high_review_priority" if family_count >= 2 else "medium",
            "finding_type": "salary_claim_conflict",
            "witness_claim_ids": to_json(list(witnesses)),
            "supporting_signal_ids": to_json([s["signal_id"] for s in corrob_sigs]),
            "uncertainty_profile": to_json({"extraction": 0.94, "localization": 0.91, "residual_inr": unexplained_residual}),
            "review_required": 1, "created_at": now_iso(),
        })

    # Case C: Baseline clean observation
    if not findings:
        findings.append({
            "finding_id": new_id(), "case_id": case_id, "status": "observation", "priority": "low",
            "finding_type": "standard_bundle_verification", "witness_claim_ids": "[]", "supporting_signal_ids": "[]",
            "uncertainty_profile": to_json({"extraction": 0.95, "context": 0.95}), "review_required": 0, "created_at": now_iso(),
        })

    for f in findings:
        await insert(db, "findings", f)

    await db.commit()
    await write_audit(db, "FINDINGS_GENERATED", case_id, payload={"count": len(findings)})
    return findings
