"""
VeriStrata CEIE – Claims & High-Resolution Evidence Crop Router.
Returns structured field claims and extracts high-resolution 200 DPI page crops for visual forensics.
"""
from __future__ import annotations
import io
import aiosqlite
from PIL import Image
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from app.db import get_db
from app.schemas import ClaimOut
from app.utils.helpers import from_json

router = APIRouter(tags=["claims"])


@router.get("/api/cases/{case_id}/claims", response_model=list[ClaimOut])
async def list_claims(case_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute(
        "SELECT c.* FROM claims c JOIN documents d ON d.document_id = c.document_id WHERE d.case_id = ? ORDER BY c.page_index, c.field_name",
        (case_id,),
    ) as cur:
        rows = [dict(r) for r in await cur.fetchall()]
    for r in rows:
        r["bbox_norm"] = from_json(r.get("bbox_norm", "[]"))
        r["alternatives"] = []
    return [ClaimOut(**r) for r in rows]


@router.get("/api/claims/{claim_id}/crop")
async def get_claim_crop(claim_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """
    Extracts high-resolution 200 DPI PNG crop of the exact claim bounding box
    with contextual padding for visual and typographical cross-examination.
    """
    async with db.execute("SELECT * FROM claims WHERE claim_id = ?", (claim_id,)) as cur:
        claim = await cur.fetchone()
    if not claim:
        raise HTTPException(404, "Claim not found")

    claim = dict(claim)
    bbox = from_json(claim.get("bbox_norm", "[]"))

    async with db.execute(
        "SELECT image_path, width_px, height_px FROM page_manifests WHERE document_id = ? AND page_index = ?",
        (claim["document_id"], claim["page_index"]),
    ) as cur:
        page = await cur.fetchone()
    if not page or not Path(page["image_path"]).exists():
        raise HTTPException(404, "Page rendered image not found")

    img = Image.open(page["image_path"])
    w, h = img.size

    # Support both [ymin, xmin, ymax, xmax] in [0, 1000] and [0, 1] float formats
    if len(bbox) == 4:
        scale = 1000.0 if any(b > 1.0 for b in bbox) else 1.0
        # Normalized coordinates: [ymin, xmin, ymax, xmax]
        ymin_px = int(round((bbox[0] / scale) * h))
        xmin_px = int(round((bbox[1] / scale) * w))
        ymax_px = int(round((bbox[2] / scale) * h))
        xmax_px = int(round((bbox[3] / scale) * w))

        # Add 25px visual context padding
        pad = 25
        left = max(0, xmin_px - pad)
        top = max(0, ymin_px - pad)
        right = min(w, xmax_px + pad)
        bottom = min(h, ymax_px + pad)

        if right > left and bottom > top:
            crop = img.crop((left, top, right, bottom))
        else:
            crop = img
    else:
        crop = img

    buf = io.BytesIO()
    crop.save(buf, format="PNG")
    buf.seek(0)

    return Response(
        content=buf.read(),
        media_type="image/png",
        headers={
            "X-Claim-Id": claim_id,
            "X-Document-Id": claim["document_id"],
            "X-Field-Name": claim["field_name"],
            "X-Extractor": claim.get("extractor", "native_pdf"),
            "X-Confidence": str(claim.get("extraction_confidence", 1.0)),
            "X-Bbox-Norm": str(bbox),
        },
    )
