"""
TraceDoc – Cryptographic Audit Writer.
Appends immutable SHA-256 hash-chained records for system and reviewer events.
"""
from __future__ import annotations
import aiosqlite
from app.db import insert
from app.utils.helpers import new_id, now_iso, sha256_str, to_json


async def write_audit(db: aiosqlite.Connection, event_type: str, object_id: str, actor: str = "system", payload: dict | None = None) -> str:
    async with db.execute("SELECT payload_hash FROM audit_events WHERE object_id = ? ORDER BY timestamp DESC LIMIT 1", (object_id,)) as cur:
        prev = await cur.fetchone()

    event_id, ts = new_id(), now_iso()
    p_str = to_json(payload or {})
    payload_hash = sha256_str(f"{event_id}{event_type}{object_id}{ts}{p_str}")

    await insert(db, "audit_events", {
        "event_id": event_id, "event_type": event_type, "object_id": object_id,
        "timestamp": ts, "actor": actor, "payload_hash": payload_hash, "previous_hash": prev["payload_hash"] if prev else None,
    })
    await db.commit()
    return event_id
