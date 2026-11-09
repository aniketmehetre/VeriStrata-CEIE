"""
TraceDoc – Lightweight SQLite Data Layer.
Simple, readable schema and clean dictionary-based DB helpers with automatic Row mapping.
"""
from __future__ import annotations
import aiosqlite
from contextlib import asynccontextmanager
from pathlib import Path
from app.config import settings

DB_PATH = str(settings.db_path)

SCHEMA = """
CREATE TABLE IF NOT EXISTS cases (
    case_id TEXT PRIMARY KEY, created_by TEXT, bundle_type TEXT, status TEXT DEFAULT 'created', retention_policy TEXT DEFAULT '30d', created_at TEXT
);
CREATE TABLE IF NOT EXISTS documents (
    document_id TEXT PRIMARY KEY, case_id TEXT REFERENCES cases(case_id), original_sha256 TEXT, media_type TEXT, page_count INTEGER DEFAULT 0, source_name TEXT, classification TEXT DEFAULT 'UNKNOWN', classification_confidence REAL DEFAULT 0.0, status TEXT DEFAULT 'uploaded', created_at TEXT
);
CREATE TABLE IF NOT EXISTS page_manifests (
    id TEXT PRIMARY KEY, document_id TEXT REFERENCES documents(document_id), page_index INTEGER, image_path TEXT, width_px INTEGER, height_px INTEGER, original_width_pt REAL, original_height_pt REAL, rotation_deg REAL DEFAULT 0, crop_box TEXT, transform_hash TEXT, sha256 TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS claims (
    claim_id TEXT PRIMARY KEY, document_id TEXT REFERENCES documents(document_id), page_index INTEGER, bbox_norm TEXT, coordinate_frame TEXT DEFAULT 'normalized_0_1', field_name TEXT, raw_text TEXT, normalized_value TEXT, datatype TEXT DEFAULT 'text', unit TEXT, currency TEXT, valid_period TEXT, extractor TEXT, extractor_version TEXT, extraction_confidence REAL DEFAULT 1.0, alternatives TEXT DEFAULT '[]', created_at TEXT
);
CREATE TABLE IF NOT EXISTS signals (
    signal_id TEXT PRIMARY KEY, document_id TEXT REFERENCES documents(document_id), method TEXT, evidence_family TEXT, region TEXT, score REAL, quality_flags TEXT, limitations TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS constraints (
    constraint_id TEXT PRIMARY KEY, case_id TEXT REFERENCES cases(case_id), rule_name TEXT, input_claim_ids TEXT, expected_relation TEXT, residual REAL, outcome TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS correlation_edges (
    edge_id TEXT PRIMARY KEY, case_id TEXT REFERENCES cases(case_id), claim_id_a TEXT REFERENCES claims(claim_id), claim_id_b TEXT REFERENCES claims(claim_id), relation_type TEXT, match_score REAL, match_features TEXT, time_window_applied TEXT, outcome TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS hypothesis_tests (
    hypothesis_id TEXT PRIMARY KEY, case_id TEXT REFERENCES cases(case_id), constraint_id TEXT, name TEXT, assumptions TEXT, evidence_used TEXT, outcome TEXT, explanation TEXT, residual_conflict REAL, solver_version TEXT, solver_timeout_ms INTEGER, created_at TEXT
);
CREATE TABLE IF NOT EXISTS findings (
    finding_id TEXT PRIMARY KEY, case_id TEXT REFERENCES cases(case_id), status TEXT, priority TEXT, finding_type TEXT, witness_claim_ids TEXT, supporting_signal_ids TEXT, uncertainty_profile TEXT, review_required INTEGER DEFAULT 0, created_at TEXT
);
CREATE TABLE IF NOT EXISTS review_events (
    review_id TEXT PRIMARY KEY, finding_id TEXT REFERENCES findings(finding_id), actor TEXT, action TEXT, reason TEXT, timestamp TEXT, previous_event_hash TEXT
);
CREATE TABLE IF NOT EXISTS audit_events (
    event_id TEXT PRIMARY KEY, event_type TEXT, object_id TEXT, timestamp TEXT, actor TEXT, payload_hash TEXT, previous_hash TEXT
);
"""


@asynccontextmanager
async def open_db():
    """Context manager for background tasks that automatically attaches Row factory."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def get_db() -> aiosqlite.Connection:
    """Dependency for route handlers."""
    async with open_db() as db:
        yield db


async def insert(db: aiosqlite.Connection, table: str, row: dict):
    """Insert a dictionary into any table without repetitive SQL boilerplate."""
    cols = list(row.keys())
    placeholders = ", ".join(["?"] * len(cols))
    sql = f"INSERT OR REPLACE INTO {table} ({', '.join(cols)}) VALUES ({placeholders})"
    await db.execute(sql, tuple(row.values()))


async def create_all():
    """Initialise database tables and canonical directories."""
    async with open_db() as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.executescript(SCHEMA)
        await db.commit()
    for d in [settings.originals_dir, settings.derivatives_dir]:
        Path(d).mkdir(parents=True, exist_ok=True)
