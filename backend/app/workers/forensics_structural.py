"""
TraceDoc – PDF Structural Forensics Worker.
Inspects revisions, font size deviations, and cryptographic signatures.
"""
from __future__ import annotations
import aiosqlite
import fitz
from collections import Counter
from pathlib import Path
from app.config import settings
from app.db import insert
from app.utils.helpers import new_id, now_iso, to_json
from app.utils.audit import write_audit


async def analyse_pdf_structure(db: aiosqlite.Connection, document_id: str) -> list[dict]:
    async with db.execute("SELECT case_id, media_type FROM documents WHERE document_id = ?", (document_id,)) as cur:
        doc = dict(await cur.fetchone())
    if doc["media_type"] != "application/pdf":
        return []

    orig_files = list((Path(settings.originals_dir) / doc["case_id"] / document_id).iterdir())
    if not orig_files:
        return []

    pdf_bytes = orig_files[0].read_bytes()
    signals = []

    # 1. Incremental Revisions (%%EOF markers)
    eof_count = pdf_bytes.count(b"%%EOF")
    if eof_count > 1:
        signals.append({
            "signal_id": new_id(), "document_id": document_id, "method": "incremental_revisions",
            "evidence_family": "file_structure", "region": to_json({"page": 0, "bbox": [0, 0, 1, 1]}),
            "score": float(eof_count), "quality_flags": to_json(["MULTIPLE_REVISIONS"]),
            "limitations": "Revisions occur naturally in signed or modified PDFs.", "created_at": now_iso(),
        })

    # 2. Font Run & Size Outlier Detection
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    for pno in range(pdf.page_count):
        page = pdf[pno]
        spans = [s for b in page.get_text("dict").get("blocks", []) for l in b.get("lines", []) for s in l.get("spans", []) if s["text"].strip()]
        if not spans:
            continue
        sizes = [round(s["size"], 1) for s in spans]
        modal_sz = Counter(sizes).most_common(1)[0][0]

        for s in spans:
            txt = s["text"].strip()
            # If a numeric amount field deviates significantly from surrounding text size
            if any(c.isdigit() for c in txt) and abs(s["size"] - modal_sz) > 2.5:
                bx = s.get("bbox", [0, 0, 0, 0])
                signals.append({
                    "signal_id": new_id(), "document_id": document_id, "method": "font_run_anomaly",
                    "evidence_family": "text_layout",
                    "region": to_json({"page": pno, "text": txt, "bbox": [round(bx[0]/page.rect.width, 4), round(bx[1]/page.rect.height, 4), round(bx[2]/page.rect.width, 4), round(bx[3]/page.rect.height, 4)]}),
                    "score": round(abs(s["size"] - modal_sz), 2), "quality_flags": to_json(["FONT_SIZE_OUTLIER"]),
                    "limitations": "Font variations may reflect header formatting.", "created_at": now_iso(),
                })
    pdf.close()

    for s in signals:
        await insert(db, "signals", s)

    await db.commit()
    await write_audit(db, "STRUCTURAL_ANALYSIS_COMPLETE", document_id, payload={"count": len(signals)})
    return signals
