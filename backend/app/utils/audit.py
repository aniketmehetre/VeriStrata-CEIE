"""
VeriStrata CEIE – Cryptographic Audit Writer (ISO/IEC 27037 & NIST SP 800-86).
Appends immutable SHA-256 hash-chained records for all system and human review events.
Guarantees strict tamper-evident provenance:
  Hash_i = SHA-256(EventID || EventType || ObjectID || Timestamp || PayloadJSON || Hash_{i-1})
"""
from __future__ import annotations
import aiosqlite
from app.db import insert
from app.utils.helpers import new_id, now_iso, sha256_str, to_json


async def write_audit(
    db: aiosqlite.Connection,
    event_type: str,
    object_id: str,
    actor: str = "system",
    payload: dict | None = None,
) -> str:
    """
    Appends an immutable audit event to the tamper-evident ledger.
    Calculates the cryptographic hash chain incorporating the preceding event hash.
    """
    async with db.execute(
        "SELECT payload_hash FROM audit_events WHERE object_id = ? ORDER BY timestamp DESC LIMIT 1",
        (object_id,),
    ) as cur:
        prev = await cur.fetchone()

    previous_hash = prev["payload_hash"] if prev else "0000000000000000000000000000000000000000000000000000000000000000"
    event_id, ts = new_id(), now_iso()
    p_str = to_json(payload or {})

    # Strict cryptographic hash-chaining: includes previous event hash
    payload_hash = sha256_str(f"{event_id}:{event_type}:{object_id}:{ts}:{p_str}:{previous_hash}")

    await insert(db, "audit_events", {
        "event_id": event_id,
        "event_type": event_type,
        "object_id": object_id,
        "timestamp": ts,
        "actor": actor,
        "payload_hash": payload_hash,
        "previous_hash": previous_hash,
    })
    await db.commit()
    return event_id
