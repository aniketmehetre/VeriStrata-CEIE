"""
TraceDoc – Structured Field Extraction Worker (PyMuPDF).
Parses key-value pairs and tabular layouts into source-linked claims with bounding boxes.
"""
from __future__ import annotations
import re
import fitz
import aiosqlite
from pathlib import Path
from app.config import settings
from app.db import insert
from app.utils.helpers import new_id, now_iso, to_json
from app.utils.audit import write_audit

# Field extraction dictionary: maps field_name to (match_keywords, data_type)
# Specific phrases ("monthly net pay") precede general ones ("net pay")
FIELD_MAP = {
    "monthly_net_pay": (["monthly net pay"], "currency"),
    "net_pay": (["net pay", "net salary", "take home"], "currency"),
    "gross_pay": (["gross pay", "gross salary"], "currency"),
    "deductions": (["total deductions", "deductions"], "currency"),
    "declared_income": (["declared income", "monthly income"], "currency"),
    "employer_name": (["employer name", "company name"], "string"),
    "employee_name": (["employee name"], "string"),
    "applicant_name": (["applicant name"], "string"),
    "month_year": (["pay period month", "pay period"], "string"),
    "application_date": (["application date"], "date"),
    "statement_period": (["statement period"], "string"),
    "account_holder": (["account holder"], "string"),
}


def _norm_amt(s: str) -> str | None:
    digits = re.sub(r"[^\d.]", "", s)
    return str(int(round(float(digits) * 100))) if digits else None


def _get_val(lines: list[dict], i: int) -> tuple[str, list[float]]:
    """Get value string and bounding box from current or next line."""
    t = lines[i]["text"]
    if ":" in t and len(t.split(":", 1)[1].strip()) > 0:
        return t.split(":", 1)[1].strip(), lines[i]["bbox"]
    if i + 1 < len(lines):
        return lines[i + 1]["text"].strip(), lines[i + 1]["bbox"]
    return t.strip(), lines[i]["bbox"]


async def extract_native_pdf(db: aiosqlite.Connection, document_id: str) -> list[dict]:
    async with db.execute("SELECT case_id, media_type FROM documents WHERE document_id = ?", (document_id,)) as cur:
        doc = await cur.fetchone()
    if not doc or doc["media_type"] != "application/pdf":
        return []

    orig_files = list((Path(settings.originals_dir) / doc["case_id"] / document_id).iterdir())
    if not orig_files:
        return []

    pdf = fitz.open(str(orig_files[0]))
    claims = []

    for page_idx in range(pdf.page_count):
        page = pdf[page_idx]
        w, h = page.rect.width, page.rect.height
        lines = []

        # Read line spans and compute normalized bounding box [0..1]
        for b in page.get_text("dict").get("blocks", []):
            for l in b.get("lines", []):
                txt = "".join([s["text"] for s in l.get("spans", [])]).strip()
                if txt:
                    bx = l.get("bbox", [0, 0, 0, 0])
                    lines.append({
                        "text": txt,
                        "bbox": [round(bx[0]/w, 4), round(bx[1]/h, 4), round(bx[2]/w, 4), round(bx[3]/h, 4)],
                    })

        # Match fields against schema
        seen = set()
        for i, l in enumerate(lines):
            lt = l["text"].lower()

            # Check standard fields
            for field, (keywords, ftype) in FIELD_MAP.items():
                if field not in seen and any(k in lt for k in keywords):
                    val, bbox = _get_val(lines, i)
                    norm_val = _norm_amt(val) if ftype == "currency" else val.title()
                    seen.add(field)
                    claims.append({
                        "claim_id": new_id(), "document_id": document_id, "page_index": page_idx,
                        "bbox_norm": to_json(bbox), "field_name": field, "raw_text": f"{field}: {val}",
                        "normalized_value": norm_val, "datatype": ftype, "extractor": "native_pdf",
                        "extractor_version": fitz.__version__, "extraction_confidence": 0.95, "created_at": now_iso(),
                    })
                    break

            # Bank Statement salary credit row
            if ("cr" in lt or "sal" in lt) and not lt.startswith("credit transaction"):
                amt_m = re.findall(r"([\d,]+(?:\.\d{2})?)", lt)
                if amt_m:
                    claims.append({
                        "claim_id": new_id(), "document_id": document_id, "page_index": page_idx,
                        "bbox_norm": to_json(l["bbox"]), "field_name": "salary_credit_row", "raw_text": lt,
                        "normalized_value": _norm_amt(amt_m[-1]), "datatype": "currency", "extractor": "native_pdf",
                        "extractor_version": fitz.__version__, "extraction_confidence": 0.95, "created_at": now_iso(),
                    })

    pdf.close()
    for c in claims:
        await insert(db, "claims", c)

    await db.commit()
    await write_audit(db, "CLAIMS_EXTRACTED", document_id, payload={"count": len(claims)})
    return claims
