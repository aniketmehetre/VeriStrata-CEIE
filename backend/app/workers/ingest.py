"""
TraceDoc – Quarantine Upload Worker.
Validates file integrity, calculates SHA-256 digests, and stores originals in quarantine.
"""
from __future__ import annotations
import aiosqlite
import fitz
from pathlib import Path
from fastapi import HTTPException
from app.config import settings
from app.db import insert
from app.schemas import DocumentOut
from app.utils.helpers import new_id, now_iso, sha256_bytes
from app.utils.audit import write_audit

ALLOWED_MIME = {
    b"%PDF": ("application/pdf", "pdf"),
    b"\x89PNG": ("image/png", "png"),
    b"\xff\xd8": ("image/jpeg", "jpeg"),
}


async def quarantine_upload(db: aiosqlite.Connection, file_bytes: bytes, filename: str, case_id: str) -> DocumentOut:
    # 1. Size check
    if len(file_bytes) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(422, f"File exceeds {settings.max_file_size_mb}MB limit")

    # 2. Magic signature check
    mime, ext = None, None
    for magic, (m, e) in ALLOWED_MIME.items():
        if file_bytes.startswith(magic):
            mime, ext = m, e
            break
    if not mime:
        raise HTTPException(422, f"Unsupported file type. Allowed: PDF, PNG, JPEG")

    # 3. Page count
    page_count = 1
    if mime == "application/pdf":
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        page_count = doc.page_count
        doc.close()

    # 4. Hash & Save
    file_hash = sha256_bytes(file_bytes)
    doc_id = new_id()
    created_at = now_iso()

    store_dir = Path(settings.originals_dir) / case_id / doc_id
    store_dir.mkdir(parents=True, exist_ok=True)
    (store_dir / f"original.{ext}").write_bytes(file_bytes)

    doc_data = {
        "document_id": doc_id, "case_id": case_id, "original_sha256": file_hash,
        "media_type": mime, "page_count": page_count, "source_name": filename,
        "classification": "UNKNOWN", "classification_confidence": 0.0, "status": "quarantined",
        "created_at": created_at,
    }
    await insert(db, "documents", doc_data)
    await db.commit()
    await write_audit(db, "UPLOAD_ACCEPTED", case_id, payload={"document_id": doc_id, "sha256": file_hash})
    return DocumentOut(**doc_data)
