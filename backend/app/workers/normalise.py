"""
TraceDoc – Page Normalisation Worker.
Renders document pages to standardized 200 DPI images for review and visual forensics.
"""
from __future__ import annotations
import aiosqlite
import fitz
from PIL import Image
from pathlib import Path
from app.config import settings
from app.db import insert
from app.utils.helpers import new_id, now_iso, sha256_file
from app.utils.audit import write_audit


async def normalise_document(db: aiosqlite.Connection, document_id: str) -> list[dict]:
    async with db.execute("SELECT case_id, media_type FROM documents WHERE document_id = ?", (document_id,)) as cur:
        doc = dict(await cur.fetchone())

    orig_files = list((Path(settings.originals_dir) / doc["case_id"] / document_id).iterdir())
    if not orig_files:
        return []

    deriv_dir = Path(settings.derivatives_dir) / doc["case_id"] / document_id / "pages"
    deriv_dir.mkdir(parents=True, exist_ok=True)
    manifests = []

    if doc["media_type"] == "application/pdf":
        pdf = fitz.open(str(orig_files[0]))
        mat = fitz.Matrix(200 / 72, 200 / 72)
        for i in range(pdf.page_count):
            page = pdf[i]
            img_path = deriv_dir / f"page_{i:04d}.png"
            page.get_pixmap(matrix=mat, alpha=False).save(str(img_path))
            h = sha256_file(str(img_path))
            m = {
                "id": new_id(), "document_id": document_id, "page_index": i, "image_path": str(img_path),
                "width_px": int(page.rect.width * 200/72), "height_px": int(page.rect.height * 200/72),
                "original_width_pt": page.rect.width, "original_height_pt": page.rect.height,
                "rotation_deg": float(page.rotation), "transform_hash": h, "sha256": h, "created_at": now_iso(),
            }
            manifests.append(m)
            await insert(db, "page_manifests", m)
        pdf.close()
    else:
        im = Image.open(str(orig_files[0])).convert("RGB")
        img_path = deriv_dir / "page_0000.png"
        im.save(str(img_path), format="PNG")
        h = sha256_file(str(img_path))
        m = {
            "id": new_id(), "document_id": document_id, "page_index": 0, "image_path": str(img_path),
            "width_px": im.width, "height_px": im.height, "original_width_pt": None, "original_height_pt": None,
            "rotation_deg": 0.0, "transform_hash": h, "sha256": h, "created_at": now_iso(),
        }
        manifests.append(m)
        await insert(db, "page_manifests", m)

    await db.execute("UPDATE documents SET status = 'normalised' WHERE document_id = ?", (document_id,))
    await db.commit()
    await write_audit(db, "PAGES_NORMALISED", document_id, payload={"count": len(manifests)})
    return manifests
