"""
TraceDoc – Claims & Evidence Crop Router.
Returns structured field claims and extracts high-resolution page crops.
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
    async with db.execute("SELECT * FROM claims WHERE claim_id = ?", (claim_id,)) as cur:
        claim = await cur.fetchone()
    if not claim:
        raise HTTPException(404, "Claim not found")

    claim = dict(claim)
    bbox = from_json(claim["bbox_norm"])

    async with db.execute("SELECT image_path FROM page_manifests WHERE document_id = ? AND page_index = ?", (claim["document_id"], claim["page_index"])) as cur:
        page = await cur.fetchone()
    if not page or not Path(page["image_path"]).exists():
        raise HTTPException(404, "Page image not found")

    img = Image.open(page["image_path"])
    w, h = img.size
    if len(bbox) == 4:
        pad = 20
        crop = img.crop((max(0, int(bbox[0]*w) - pad), max(0, int(bbox[1]*h) - pad), min(w, int(bbox[2]*w) + pad), min(h, int(bbox[3]*h) + pad)))
    else:
        crop = img

    buf = io.BytesIO()
    crop.save(buf, format="PNG")
    buf.seek(0)
    return Response(
        content=buf.read(), media_type="image/png",
        headers={"X-Claim-Id": claim_id, "X-Extractor": claim["extractor"], "X-Confidence": str(claim["extraction_confidence"])},
    )
