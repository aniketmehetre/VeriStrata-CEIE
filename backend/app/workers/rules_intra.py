"""
TraceDoc – Intra-Document Rules Worker.
Validates document-internal arithmetic and mandatory fields.
"""
from __future__ import annotations
import aiosqlite
from app.db import insert
from app.utils.helpers import now_iso, to_json
from app.utils.audit import write_audit


async def run_intra_rules(db: aiosqlite.Connection, document_id: str) -> list[dict]:
    async with db.execute("SELECT case_id, classification FROM documents WHERE document_id = ?", (document_id,)) as cur:
        doc = dict(await cur.fetchone())

    async with db.execute("SELECT * FROM claims WHERE document_id = ?", (document_id,)) as cur:
        claims = {r["field_name"]: dict(r) for r in await cur.fetchall()}

    constraints = []

    if doc["classification"] == "SALARY_SLIP":
        # Required fields check
        req = ["net_pay", "gross_pay", "deductions", "employer_name"]
        missing = [f for f in req if f not in claims]
        constraints.append({
            "constraint_id": f"RULE-FIELD-{document_id[:6]}", "case_id": doc["case_id"],
            "rule_name": "RULE-PAYSLIP-FIELD-01", "input_claim_ids": to_json([claims[f]["claim_id"] for f in req if f in claims]),
            "expected_relation": "mandatory_fields_present", "residual": float(len(missing)),
            "outcome": "PASS" if not missing else "FAIL", "created_at": now_iso(),
        })

        # Arithmetic check: gross - deductions == net
        if all(k in claims for k in ["gross_pay", "deductions", "net_pay"]):
            g = int(claims["gross_pay"]["normalized_value"])
            d = int(claims["deductions"]["normalized_value"])
            n = int(claims["net_pay"]["normalized_value"])
            res = abs((g - d) - n)
            constraints.append({
                "constraint_id": f"RULE-ARITH-{document_id[:6]}", "case_id": doc["case_id"],
                "rule_name": "RULE-PAYSLIP-ARITH-01",
                "input_claim_ids": to_json([claims["gross_pay"]["claim_id"], claims["deductions"]["claim_id"], claims["net_pay"]["claim_id"]]),
                "expected_relation": "gross_pay - deductions == net_pay", "residual": float(res) / 100.0,
                "outcome": "PASS" if res <= 100 else "FAIL", "created_at": now_iso(),
            })

    for c in constraints:
        await insert(db, "constraints", c)

    await db.commit()
    await write_audit(db, "INTRA_RULES_COMPLETE", document_id, payload={"count": len(constraints)})
    return constraints
