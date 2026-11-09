"""
TraceDoc – Dossier router.
GET /api/cases/{case_id}/dossier?format=json|pdf
"""
from __future__ import annotations
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from app.db import get_db

router = APIRouter(tags=["dossier"])


@router.get("/api/cases/{case_id}/dossier")
async def export_dossier(
    case_id: str,
    format: str = Query("json", pattern="^(json|pdf)$"),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,)) as cur:
        case = await cur.fetchone()
    if not case:
        raise HTTPException(404, f"Case {case_id} not found")

    from app.workers.dossier import generate_dossier
    content, media_type, filename = await generate_dossier(db, case_id, format)

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

