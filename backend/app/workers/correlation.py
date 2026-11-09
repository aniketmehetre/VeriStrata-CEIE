"""
VeriStrata CEIE – Strata IV: Cross-Document Correlation Worker.
Reconciles identities and financial claims across the multi-document case bundle:
  - RapidFuzz token-sort fuzzy matching for employer and applicant entities (threshold >= 85%).
  - Cross-document arithmetic comparison between payslip, employer declaration, application form, and bank credits.
"""
from __future__ import annotations
import re
import aiosqlite
from rapidfuzz import fuzz
from app.db import insert
from app.utils.helpers import new_id, now_iso, to_json
from app.utils.audit import write_audit


def _clean_org(name: str) -> str:
    """Normalize organization names by stripping corporate suffixes and punctuation."""
    if not name:
        return ""
    n = re.sub(r"\b(pvt|ltd|limited|private|inc|llc|corp|corporation|enterprises)\b", "", name.lower())
    return re.sub(r"[^\w\s]", "", n).strip()


async def correlate_bundle(db: aiosqlite.Connection, case_id: str) -> list[dict]:
    async with db.execute(
        "SELECT c.*, d.classification, d.source_name FROM claims c JOIN documents d ON d.document_id = c.document_id WHERE d.case_id = ?",
        (case_id,),
    ) as cur:
        claims = [dict(r) for r in await cur.fetchall()]

    edges: list[dict] = []

    # ── 1. Employer & Applicant Entity Resolution (RapidFuzz >= 85%) ──────────
    employers = [c for c in claims if c["field_name"] == "employer_name"]
    for i in range(len(employers)):
        for j in range(i + 1, len(employers)):
            ca, cb = employers[i], employers[j]
            if ca["document_id"] != cb["document_id"]:
                org_a = _clean_org(ca.get("normalized_value") or ca.get("raw_text", ""))
                org_b = _clean_org(cb.get("normalized_value") or cb.get("raw_text", ""))
                score = fuzz.token_sort_ratio(org_a, org_b)

                # Strict >= 85% threshold per Phase 3 specifications
                outcome = "CORROBORATE" if score >= 85.0 else ("CONFLICT" if score < 60.0 else "PARTIAL")

                edges.append({
                    "edge_id": new_id(),
                    "case_id": case_id,
                    "claim_id_a": ca["claim_id"],
                    "claim_id_b": cb["claim_id"],
                    "relation_type": "entity_employer_match",
                    "match_score": float(score),
                    "match_features": to_json({"token_sort_ratio": score, "entity_a": org_a, "entity_b": org_b, "threshold": 85}),
                    "time_window_applied": None,
                    "outcome": outcome,
                    "created_at": now_iso(),
                })

    # Bank statement transaction narration check against employer name
    b_narrations = [c for c in claims if c["classification"] == "BANK_STATEMENT" and "credit" in c["field_name"].lower()]
    for emp in employers:
        emp_clean = _clean_org(emp.get("normalized_value") or emp.get("raw_text", ""))
        for bn in b_narrations:
            narr = (bn.get("raw_text") or "").lower()
            token_set = fuzz.token_set_ratio(emp_clean, narr)
            if token_set >= 75:
                edges.append({
                    "edge_id": new_id(),
                    "case_id": case_id,
                    "claim_id_a": emp["claim_id"],
                    "claim_id_b": bn["claim_id"],
                    "relation_type": "entity_payroll_narration_match",
                    "match_score": float(token_set),
                    "match_features": to_json({"token_set_ratio": token_set, "employer": emp_clean, "narration": narr}),
                    "time_window_applied": "monthly",
                    "outcome": "CORROBORATE",
                    "created_at": now_iso(),
                })

    # ── 2. Financial Claims Cross-Document Reconciliations ────────────────────
    p_nets = [c for c in claims if c["classification"] == "SALARY_SLIP" and c["field_name"] == "net_pay"]
    e_nets = [c for c in claims if c["classification"] == "EMPLOYER_DECLARATION" and c["field_name"] == "monthly_net_pay"]
    a_incs = [c for c in claims if c["classification"] == "APPLICATION_FORM" and c["field_name"] in ["declared_income", "monthly_income"]]
    b_rows = [c for c in claims if c["classification"] == "BANK_STATEMENT" and c["field_name"] == "salary_credit_row"]

    tol_paise = 50000  # INR 500 in integer paise

    for p in p_nets:
        try:
            p_val = int(p["normalized_value"] or 0)
        except Exception:
            p_val = 0

        # A. Payslip vs Employer Declaration
        for e in e_nets:
            try:
                e_val = int(e["normalized_value"] or 0)
            except Exception:
                e_val = 0
            res = abs(p_val - e_val)
            is_match = (res <= tol_paise)
            edges.append({
                "edge_id": new_id(),
                "case_id": case_id,
                "claim_id_a": p["claim_id"],
                "claim_id_b": e["claim_id"],
                "relation_type": "RULE-CROSS-EMP-01",
                "match_score": 100.0 if is_match else 0.0,
                "match_features": to_json({"residual_inr": res / 100.0, "tolerance_inr": tol_paise / 100.0}),
                "time_window_applied": "monthly",
                "outcome": "CORROBORATE" if is_match else "CONFLICT",
                "created_at": now_iso(),
            })

        # B. Payslip vs Application Form Income
        for a in a_incs:
            try:
                a_val = int(a["normalized_value"] or 0)
            except Exception:
                a_val = 0
            res = abs(p_val - a_val)
            is_match = (res <= tol_paise)
            edges.append({
                "edge_id": new_id(),
                "case_id": case_id,
                "claim_id_a": p["claim_id"],
                "claim_id_b": a["claim_id"],
                "relation_type": "RULE-CROSS-APP-01",
                "match_score": 100.0 if is_match else 0.0,
                "match_features": to_json({"residual_inr": res / 100.0, "tolerance_inr": tol_paise / 100.0}),
                "time_window_applied": "monthly",
                "outcome": "CORROBORATE" if is_match else "CONFLICT",
                "created_at": now_iso(),
            })

        # C. Payslip vs Bank Credits Aggregate
        if b_rows:
            sum_b = sum(int(b["normalized_value"] or 0) for b in b_rows)
            res_b = abs(p_val - sum_b)
            is_b_match = (res_b <= tol_paise)
            edges.append({
                "edge_id": new_id(),
                "case_id": case_id,
                "claim_id_a": p["claim_id"],
                "claim_id_b": b_rows[0]["claim_id"],
                "relation_type": "RULE-CROSS-BANK-01",
                "match_score": 100.0 if is_b_match else 0.0,
                "match_features": to_json({
                    "residual_inr": res_b / 100.0,
                    "credits_count": len(b_rows),
                    "sum_credits_inr": sum_b / 100.0,
                    "tolerance_inr": tol_paise / 100.0,
                }),
                "time_window_applied": "monthly",
                "outcome": "CORROBORATE" if is_b_match else "CONFLICT",
                "created_at": now_iso(),
            })

    for edge in edges:
        await insert(db, "correlation_edges", edge)

    await db.commit()
    await write_audit(db, "CORRELATION_COMPLETE", case_id, payload={"count": len(edges)})
    return edges
