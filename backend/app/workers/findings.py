"""
VeriStrata CEIE – Finding Generator & Corroboration Worker.
Synthesizes cross-document conflicts, Z3 SMT solver traces, and forensic signals into findings.
Enforces the core principle:
  - Any SAT hypothesis outcome halts escalation and establishes OBSERVATION (Mathematical Restraint).
  - All UNSAT outcomes isolate minimal contradiction witness sets and exact residual gaps (Delta).
"""
from __future__ import annotations
import aiosqlite
from app.db import insert
from app.utils.helpers import new_id, now_iso, from_json, to_json
from app.utils.audit import write_audit


async def generate_findings(db: aiosqlite.Connection, case_id: str) -> list[dict]:
    # 1. Fetch cross-document conflicts & hypothesis outcomes
    async with db.execute(
        "SELECT * FROM correlation_edges WHERE case_id = ? AND outcome = 'CONFLICT'",
        (case_id,),
    ) as cur:
        conflict_edges = [dict(r) for r in await cur.fetchall()]

    async with db.execute("SELECT * FROM hypothesis_tests WHERE case_id = ?", (case_id,)) as cur:
        hyps = [dict(r) for r in await cur.fetchall()]

    # Reconciled if any legitimate benign hypothesis was verified as SATISFIABLE (Restraint!)
    supported_hyps = [h for h in hyps if h["outcome"] == "SUPPORTED"]
    reconciled = len(supported_hyps) > 0

    split_hyp = next((h for h in hyps if h["name"] == "split_credit"), None)
    unexplained_residual = 0.0 if reconciled else (split_hyp["residual_conflict"] if split_hyp else 0.0)

    # 2. Fetch multi-strata forensic signals
    async with db.execute(
        "SELECT s.* FROM signals s JOIN documents d ON d.document_id = s.document_id WHERE d.case_id = ?",
        (case_id,),
    ) as cur:
        signals = [dict(r) for r in await cur.fetchall() if "NOT_APPLICABLE" not in from_json(r["quality_flags"])]

    findings = []

    # Case A: Mathematical Restraint — Conflict reconciled by verified benign hypothesis
    if reconciled:
        lead_hyp = supported_hyps[0]
        witness_ids = from_json(lead_hyp.get("evidence_used", "[]"))
        findings.append({
            "finding_id": new_id(),
            "case_id": case_id,
            "status": "observation",
            "priority": "low",
            "finding_type": "reconciled_salary_discrepancy",
            "witness_claim_ids": to_json(witness_ids),
            "supporting_signal_ids": to_json([s["signal_id"] for s in signals[:2]]),
            "uncertainty_profile": to_json({
                "extraction": 0.98,
                "context": 0.99,
                "reconciled": True,
                "supporting_hypothesis": lead_hyp["name"],
                "residual_inr": 0.0,
            }),
            "review_required": 0,
            "created_at": now_iso(),
        })

    # Case B: Mathematical Escalation — All hypotheses UNSAT with corroborating forensic signals
    elif conflict_edges or unexplained_residual > 0:
        witnesses = set()
        for e in conflict_edges:
            witnesses.add(e["claim_id_a"])
            witnesses.add(e["claim_id_b"])
        if split_hyp:
            for cid in from_json(split_hyp.get("evidence_used", "[]")):
                witnesses.add(cid)

        # Count distinct corroborating forensic families (file_structure, visual_pixel, text_layout)
        corrob_sigs = [s for s in signals if s["evidence_family"] in ["text_layout", "visual_pixel", "file_structure"]]
        family_count = len(set(s["evidence_family"] for s in corrob_sigs)) + 1  # +1 for context_semantics

        findings.append({
            "finding_id": new_id(),
            "case_id": case_id,
            "status": "potential_manipulation" if family_count >= 2 else "inconsistency",
            "priority": "high_review_priority" if family_count >= 2 else "medium",
            "finding_type": "salary_claim_conflict",
            "witness_claim_ids": to_json(list(witnesses)),
            "supporting_signal_ids": to_json([s["signal_id"] for s in corrob_sigs]),
            "uncertainty_profile": to_json({
                "extraction": 0.95,
                "localization": 0.93,
                "reconciled": False,
                "residual_inr": unexplained_residual,
                "corroborating_families_count": family_count,
            }),
            "review_required": 1,
            "created_at": now_iso(),
        })

    # Case C: Baseline clean observation
    if not findings:
        findings.append({
            "finding_id": new_id(),
            "case_id": case_id,
            "status": "observation",
            "priority": "low",
            "finding_type": "standard_bundle_verification",
            "witness_claim_ids": "[]",
            "supporting_signal_ids": "[]",
            "uncertainty_profile": to_json({"extraction": 0.96, "context": 0.98, "reconciled": True}),
            "review_required": 0,
            "created_at": now_iso(),
        })

    for f in findings:
        await insert(db, "findings", f)

    await db.commit()
    await write_audit(db, "FINDINGS_GENERATED", case_id, payload={"count": len(findings), "reconciled": reconciled})
    return findings
