"""
TraceDoc – Common Cryptographic & Serialization Helpers.
"""
from __future__ import annotations
import uuid
import hashlib
import json
from datetime import datetime, timezone


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_str(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def to_json(obj) -> str:
    return json.dumps(obj, default=str, ensure_ascii=False)


def from_json(s: str):
    if not s:
        return []
    try:
        return json.loads(s)
    except Exception:
        return []
