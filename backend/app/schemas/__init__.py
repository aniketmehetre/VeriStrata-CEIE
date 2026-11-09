"""
TraceDoc – Pydantic v2 Data Contracts.
Shared request and response schemas across all API endpoints.
"""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel


class CaseCreate(BaseModel):
    bundle_type: str = "LOAN_APPLICATION"
    created_by: str = "investigator"
    retention_policy: str = "30d"


class CaseOut(BaseModel):
    case_id: str
    created_by: Optional[str] = "investigator"
    bundle_type: str = "LOAN_APPLICATION"
    status: str
    retention_policy: Optional[str] = "30d"
    created_at: str


class DocumentOut(BaseModel):
    document_id: str
    case_id: str
    original_sha256: str
    media_type: str
    page_count: int
    source_name: str
    classification: str
    classification_confidence: float
    status: str
    created_at: str


class ClassificationOverride(BaseModel):
    override: str


class ClaimOut(BaseModel):
    claim_id: str
    document_id: str
    page_index: int
    bbox_norm: list[float]
    field_name: str
    raw_text: str
    normalized_value: Optional[str]
    datatype: str
    unit: Optional[str] = None
    currency: Optional[str] = None
    extractor: str
    extractor_version: str
    extraction_confidence: float
    alternatives: list[dict] = []
    created_at: str


class SignalOut(BaseModel):
    signal_id: str
    document_id: str
    method: str
    evidence_family: str
    region: dict
    score: Optional[float]
    quality_flags: list[str]
    limitations: Optional[str]
    created_at: str


class HypothesisTestOut(BaseModel):
    hypothesis_id: str
    case_id: str
    constraint_id: Optional[str]
    name: str
    assumptions: dict
    evidence_used: list[str]
    outcome: str
    explanation: Optional[str]
    residual_conflict: Optional[float]
    solver_version: Optional[str]
    solver_timeout_ms: Optional[int]
    created_at: str


class FindingOut(BaseModel):
    finding_id: str
    case_id: str
    status: str
    priority: str
    finding_type: str
    witness_claim_ids: list[str]
    supporting_signal_ids: list[str]
    uncertainty_profile: dict
    review_required: bool
    created_at: str


class ReviewCreate(BaseModel):
    action: Literal["accept", "dismiss", "annotate", "request_more_info"]
    reason: str = ""
    annotation: str = ""


class ReviewEventOut(BaseModel):
    review_id: str
    finding_id: str
    actor: str
    action: str
    reason: Optional[str]
    timestamp: str
    previous_event_hash: Optional[str]


class JobStatusOut(BaseModel):
    case_id: str
    status: str
    stages: dict[str, str]
    warnings: list[str]
    created_at: str


class HealthOut(BaseModel):
    status: str
    db: str
    ocr: str
    solver: str
    version: str
