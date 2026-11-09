import type {
  Case,
  DocumentItem,
  Claim,
  Signal,
  Hypothesis,
  Finding,
  ReviewEvent,
  AuditEvent,
  EvidenceGraph,
  HealthInfo,
  CaseStatus,
} from './types';

const BASE_URL = '';

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchCases(): Promise<Case[]> {
  const res = await fetch(`${BASE_URL}/api/cases`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function fetchCase(caseId: string): Promise<Case> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}`);
  if (!res.ok) throw new Error(`Failed to fetch case ${caseId}`);
  return res.json();
}

export async function createCase(createdBy = 'investigator_ui'): Promise<Case> {
  const res = await fetch(`${BASE_URL}/api/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bundle_type: 'LOAN_APPLICATION', created_by: createdBy }),
  });
  if (!res.ok) throw new Error('Failed to create case');
  return res.json();
}

export async function createDemoCase(bundleType: 'clean' | 'tampered'): Promise<{ ok: boolean; case_id: string; bundle_type: string }> {
  const res = await fetch(`${BASE_URL}/api/cases/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bundle_type: bundleType }),
  });
  if (!res.ok) throw new Error(`Failed to create ${bundleType} demo`);
  return res.json();
}

export async function fetchDocuments(caseId: string): Promise<DocumentItem[]> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function uploadDocuments(caseId: string, files: File[]): Promise<DocumentItem[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload documents');
  return res.json();
}

export async function startAnalysis(caseId: string): Promise<{ ok: boolean; status: string }> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/analyze`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to start analysis');
  return res.json();
}

export async function fetchCaseStatus(caseId: string): Promise<CaseStatus> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/status`);
  if (!res.ok) throw new Error('Failed to fetch case status');
  return res.json();
}

export async function fetchClaims(caseId: string): Promise<Claim[]> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/claims`);
  if (!res.ok) throw new Error('Failed to fetch claims');
  return res.json();
}

export function getClaimCropUrl(claimId: string): string {
  return `${BASE_URL}/api/claims/${claimId}/crop`;
}

export function getDocumentPageUrl(documentId: string, pageIndex = 0): string {
  return `${BASE_URL}/api/documents/${documentId}/pages/${pageIndex}`;
}

export async function fetchHypotheses(caseId: string): Promise<Hypothesis[]> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/hypotheses`);
  if (!res.ok) throw new Error('Failed to fetch hypotheses');
  return res.json();
}

export async function fetchSignals(caseId: string): Promise<Signal[]> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/signals`);
  if (!res.ok) throw new Error('Failed to fetch signals');
  return res.json();
}

export async function fetchFindings(caseId: string): Promise<Finding[]> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/findings`);
  if (!res.ok) throw new Error('Failed to fetch findings');
  return res.json();
}

export async function fetchFindingEvidence(findingId: string): Promise<{
  finding: Finding;
  witness_claims: Claim[];
  graph: EvidenceGraph;
}> {
  const res = await fetch(`${BASE_URL}/api/findings/${findingId}/evidence`);
  if (!res.ok) throw new Error('Failed to fetch finding evidence');
  return res.json();
}

export async function submitReview(
  findingId: string,
  action: 'accept' | 'dismiss' | 'annotate',
  reason: string
): Promise<ReviewEvent> {
  const res = await fetch(`${BASE_URL}/api/findings/${findingId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Review submission failed' }));
    throw new Error(err.detail || 'Review submission failed');
  }
  return res.json();
}

export async function fetchReviewHistory(findingId: string): Promise<ReviewEvent[]> {
  const res = await fetch(`${BASE_URL}/api/findings/${findingId}/review/history`);
  if (!res.ok) throw new Error('Failed to fetch review history');
  return res.json();
}

export async function fetchCaseAudit(caseId: string): Promise<AuditEvent[]> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/audit`);
  if (!res.ok) throw new Error('Failed to fetch audit log');
  return res.json();
}

export async function fetchCaseGraph(caseId: string): Promise<EvidenceGraph> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/graph`);
  if (!res.ok) throw new Error('Failed to fetch case graph');
  return res.json();
}

export async function fetchDossierJson(caseId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/cases/${caseId}/dossier?format=json`);
  if (!res.ok) throw new Error('Failed to fetch JSON dossier');
  return res.json();
}

export function getDossierPdfUrl(caseId: string): string {
  return `${BASE_URL}/api/cases/${caseId}/dossier?format=pdf`;
}

export async function uploadAndAutoDownloadReport(
  files: File[],
  onStatusUpdate?: (stage: string) => void
): Promise<{ caseId: string; pdfUrl: string }> {
  onStatusUpdate?.('Initializing Case...');
  const newCase = await createCase('auditor_ui');
  const caseId = newCase.case_id;

  onStatusUpdate?.(`Ingesting ${files.length} document(s)...`);
  await uploadDocuments(caseId, files);

  onStatusUpdate?.('Running 4-Strata Forensics & Z3 SMT Solver...');
  await startAnalysis(caseId);

  // Poll until complete
  let attempts = 0;
  while (attempts < 60) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const st = await fetchCaseStatus(caseId);
      if (st.status === 'complete') break;
    } catch {
      // ignore transient poll error
    }
    attempts++;
  }

  onStatusUpdate?.('Downloading Certified Court Dossier (PDF)...');
  const pdfUrl = getDossierPdfUrl(caseId);

  // Trigger browser download
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `veristrata_court_dossier_${caseId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { caseId, pdfUrl };
}
