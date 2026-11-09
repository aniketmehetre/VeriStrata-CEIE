"""
TraceDoc – Document Classifier Worker.
Identifies document type based on keyword vocabulary and file hints.
"""
from __future__ import annotations
import aiosqlite
import fitz
from pathlib import Path
from app.config import settings
from app.utils.audit import write_audit

DOC_KEYWORDS = {
    "SALARY_SLIP": ["net pay", "gross pay", "deductions", "payslip", "salary slip", "earnings"],
    "BANK_STATEMENT": ["account number", "statement period", "opening balance", "closing balance", "credit", "debit"],
    "APPLICATION_FORM": ["applicant", "declared income", "loan amount", "application date"],
    "EMPLOYER_DECLARATION": ["employment period", "monthly net pay", "confirm", "employer", "designation"],
}


async def classify_document(db: aiosqlite.Connection, document_id: str) -> dict:
    async with db.execute("SELECT * FROM documents WHERE document_id = ?", (document_id,)) as cur:
        doc = dict(await cur.fetchone())

    text = ""
    orig_files = list((Path(settings.originals_dir) / doc["case_id"] / document_id).iterdir())
    if orig_files and doc["media_type"] == "application/pdf":
        try:
            pdf = fitz.open(str(orig_files[0]))
            text = " ".join([pdf[i].get_text() for i in range(min(2, pdf.page_count))]).lower()
            pdf.close()
        except Exception:
            pass

    # Score matches
    scores = {
        dtype: sum(1 for kw in kws if kw in text) / len(kws)
        for dtype, kws in DOC_KEYWORDS.items()
    }
    # Filename booster
    fn = doc["source_name"].lower()
    for dtype in DOC_KEYWORDS:
        if dtype.split("_")[0].lower() in fn:
            scores[dtype] += 0.3

    best_type = max(scores, key=scores.get)
    best_score = scores[best_type]
    doc_type = best_type if best_score >= 0.05 else "UNKNOWN"

    await db.execute(
        "UPDATE documents SET classification = ?, classification_confidence = ?, status = 'classified' WHERE document_id = ?",
        (doc_type, best_score, document_id),
    )
    await db.commit()
    await write_audit(db, "CLASSIFICATION_COMPLETE", document_id, payload={"type": doc_type, "confidence": best_score})
    return {"doc_type": doc_type, "confidence": best_score}
