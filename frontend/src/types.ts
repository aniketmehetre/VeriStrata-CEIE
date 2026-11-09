export interface Case {
  case_id: string;
  created_by?: string;
  bundle_type: string;
  status: string;
  retention_policy?: string;
  created_at: string;
}

export interface DocumentItem {
  document_id: string;
  case_id: string;
  original_sha256: string;
  media_type: string;
  page_count: number;
  source_name: string;
  classification: string;
  classification_confidence: number;
  status: string;
  created_at: string;
}

export interface Claim {
  claim_id: string;
  document_id: string;
  page_index: number;
  bbox_norm: number[]; // [x0, y0, x1, y1]
  field_name: string;
  raw_text: string;
  normalized_value: string | null;
  datatype: string;
  extractor: string;
  extraction_confidence: number;
  source_name?: string;
}

export interface Signal {
  signal_id: string;
  document_id: string;
  detector_name: string;
  severity: 'low' | 'medium' | 'high';
  score: number;
  bbox_norm: number[];
  metadata: Record<string, any>;
  created_at: string;
  source_name?: string;
}

export interface Hypothesis {
  hypothesis_id: string;
  case_id: string;
  name: string;
  description: string;
  outcome: 'SUPPORTED' | 'REJECTED' | 'INCONCLUSIVE';
  residual_conflict: number;
  explanation: string;
  parameters: string;
  created_at: string;
}

export interface Finding {
  finding_id: string;
  case_id: string;
  title: string;
  summary: string;
  status: 'potential_manipulation' | 'inconsistency' | 'observation' | 'reviewer_confirmed' | 'reviewer_dismissed' | 'under_review';
  priority: number;
  witness_claim_ids: string[];
  supporting_signal_ids: string[];
  uncertainty_profile: Record<string, any>;
  review_required: boolean;
  created_at: string;
}

export interface ReviewEvent {
  review_id: string;
  finding_id: string;
  actor: string;
  action: 'accept' | 'dismiss' | 'annotate';
  reason: string;
  timestamp: string;
  previous_event_hash: string;
}

export interface AuditEvent {
  event_id: string;
  event_type: string;
  object_id: string;
  actor: string;
  timestamp: string;
  payload_hash: string;
  previous_hash: string;
  payload: string;
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  [key: string]: any;
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
  weight?: number;
}

export interface EvidenceGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface HealthInfo {
  status: string;
  db: string;
  ocr: string;
  solver: string;
  version: string;
}

export interface CaseStatus {
  case_id: string;
  status: string;
  stages: Record<string, string>;
  warnings: string[];
  created_at: string;
}
