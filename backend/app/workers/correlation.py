"""
TraceDoc – Cross-Document Correlation Worker.
Fuzzy matches entity names and compares financial claims across the case bundle.
"""
from __future__ import annotations
import re
import aiosqlite
from rapidfuzz import fuzz
from app.db import insert
from app.utils.helpers import new_id, now_iso, to_json
from app.utils.audit import write_audit


def _clean_org(name: str) -> str:
    n = re.sub(r"\b(pvt|ltd|limited|private|inc|llc|corp)\b", "", (name or "").lower())
    return re.sub(r"[^\w\s]", "", n).strip()


async def correlate_bundle(db: aiosqlite.Connection, case_id: str) -> list[dict]:
    async with db.execute(
        "SELECT c.*, d.classification FROM claims c JOIN documents d ON d.document_id = c.document_id WHERE d.case_id = ?",
        (case_id,),
    ) as cur:
        claims = [dict(r) for r in await cur.fetchall()]

    edges = []

    # 1. Employer Entity Resolution
    employers = [c for c in claims if c["field_name"] == "employer_name"]
    for i in range(len(employers)):
        for j in range(i + 1, len(employers)):
            ca, cb = employers[i], employers[j]
            if ca["document_id"] != cb["document_id"]:
                score = fuzz.token_sort_ratio(_clean_org(ca["normalized_value"]), _clean_org(cb["normalized_value"]))
                outcome = "CORROBORATE" if score >= 85 else ("CONFLICT" if score < 60 else "PARTIAL")
                edges.append({
                    "edge_id": new_id(), "case_id": case_id, "claim_id_a": ca["claim_id"], "claim_id_b": cb["claim_id"],
                    "relation_type": "entity_employer_match", "match_score": float(score),
                    "match_features": to_json({"score": score}), "time_window_applied": None, "outcome": outcome, "created_at": now_iso(),
                })

    # 2. Financial Amount Cross-Document Checks
    p_nets = [c for c in claims if c["classification"] == "SALARY_SLIP" and c["field_name"] == "net_pay"]
    e_nets = [c for c in claims if c["classification"] == "EMPLOYER_DECLARATION" and c["field_name"] == "monthly_net_pay"]
    a_incs = [c for c in claims if c["classification"] == "APPLICATION_FORM" and c["field_name"] == "declared_income"]
    b_rows = [c for c in claims if c["classification"] == "BANK_STATEMENT" and c["field_name"] == "salary_credit_row"]

    for p in p_nets:
        p_val = int(p["normalized_value"] or 0)

        # vs Employer Declaration
        for e in e_nets:
            e_val = int(e["normalized_value"] or 0)
            res = abs(p_val - e_val)
            edges.append({
                "edge_id": new_id(), "case_id": case_id, "claim_id_a": p["claim_id"], "claim_id_b": e["claim_id"],
                "relation_type": "RULE-CROSS-EMP-01", "match_score": 100.0 if res <= 50000 else 0.0,
                "match_features": to_json({"residual_inr": res / 100.0}), "time_window_applied": "monthly",
                "outcome": "CORROBORATE" if res <= 50000 else "CONFLICT", "created_at": now_iso(),
            })

        # vs Application Income
        for a in a_incs:
            a_val = int(a["normalized_value"] or 0)
            res = abs(p_val - a_val)
            edges.append({
                "edge_id": new_id(), "case_id": case_id, "claim_id_a": p["claim_id"], "claim_id_b": a["claim_id"],
                "relation_type": "RULE-CROSS-APP-01", "match_score": 100.0 if res <= 50000 else 0.0,
                "match_features": to_json({"residual_inr": res / 100.0}), "time_window_applied": "monthly",
                "outcome": "CORROBORATE" if res <= 50000 else "CONFLICT", "created_at": now_iso(),
            })

        # vs Bank Credits
        if b_rows:
            sum_b = sum(int(b["normalized_value"] or 0) for b in b_rows)
            res_b = abs(p_val - sum_b)
            edges.append({
                "edge_id": new_id(), "case_id": case_id, "claim_id_a": p["claim_id"], "claim_id_b": b_rows[0]["claim_id"],
                "relation_type": "RULE-CROSS-BANK-01", "match_score": 100.0 if res_b <= 50000 else 0.0,
                "match_features": to_json({"residual_inr": res_b / 100.0, "credits_count": len(b_rows)}),
                "time_window_applied": "monthly", "outcome": "CORROBORATE" if res_b <= 50000 else "CONFLICT",
                "created_at": now_iso(),
            })

    for edge in edges:
        await insert(db, "correlation_edges", edge)

    await db.commit()
    await write_audit(db, "CORRELATION_COMPLETE", case_id, payload={"count": len(edges)})
    return edges
