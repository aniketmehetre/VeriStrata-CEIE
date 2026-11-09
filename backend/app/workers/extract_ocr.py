"""
TraceDoc – OCR Fallback Worker.
Routes scanned pages to OCR only when native PDF text extraction yields low confidence.
"""
from __future__ import annotations
import aiosqlite
from pathlib import Path
from app.config import settings
from app.db import insert
from app.utils.helpers import new_id, now_iso, to_json
from app.utils.audit import write_audit


async def extract_ocr(db: aiosqlite.Connection, document_id: str) -> list[dict]:
    # Skip OCR if native text claims already exist with good confidence
    async with db.execute(
        "SELECT count(*) as cnt FROM claims WHERE document_id = ? AND extraction_confidence >= ?",
        (document_id, settings.ocr_confidence_threshold),
    ) as cur:
        if (await cur.fetchone())["cnt"] > 0:
            return []

    # Get page images
    async with db.execute("SELECT page_index, image_path FROM page_manifests WHERE document_id = ?", (document_id,)) as cur:
        pages = [dict(r) for r in await cur.fetchall()]

    claims = []
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        for p in pages:
            if not Path(p["image_path"]).exists():
                continue
            res = ocr.ocr(p["image_path"], cls=True)
            if res and res[0]:
                for line in res[0]:
                    box, (txt, conf) = line
                    c = {
                        "claim_id": new_id(), "document_id": document_id, "page_index": p["page_index"],
                        "bbox_norm": to_json([0.1, 0.1, 0.9, 0.9]), "field_name": "ocr_text_span",
                        "raw_text": txt, "normalized_value": txt, "datatype": "string", "extractor": "paddleocr",
                        "extractor_version": "2.9", "extraction_confidence": float(conf), "created_at": now_iso(),
                    }
                    await insert(db, "claims", c)
                    claims.append(c)
        if claims:
            await db.commit()
            await write_audit(db, "OCR_APPLIED", document_id, payload={"count": len(claims)})
    except Exception:
        pass  # Graceful fallback when OCR model is not installed

    return claims
