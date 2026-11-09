import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type {
  Case,
  DocumentItem,
  Claim,
  Hypothesis,
  Finding,
  Signal,
  CaseStatus,
} from '../types';
import {
  fetchDocuments,
  fetchClaims,
  fetchHypotheses,
  fetchFindings,
  fetchSignals,
  fetchCaseStatus,
  fetchCase,
} from '../api';

export interface UseCaseDataResult {
  currentCase: Case | null;
  documents: DocumentItem[];
  claims: Claim[];
  hypotheses: Hypothesis[];
  findings: Finding[];
  signals: Signal[];
  statusInfo: CaseStatus | null;
  loading: boolean;
  error: string | null;
  isRecordedSample: boolean;
  refetch: () => Promise<void>;
}

// Fallback Recorded Sample Fixture
const SAMPLE_CASE: Case = {
  case_id: 'CASE-TAMPERED-FA106659',
  bundle_type: 'LOAN_APPLICATION',
  status: 'potential_manipulation',
  created_at: new Date().toISOString(),
};

const SAMPLE_DOCS: DocumentItem[] = [
  {
    document_id: 'DOC-APP-01',
    case_id: 'CASE-TAMPERED-FA106659',
    source_name: '01_application_form.pdf',
    classification: 'APPLICATION_FORM',
    classification_confidence: 0.98,
    media_type: 'application/pdf',
    page_count: 1,
    original_sha256: '0cce97cb73406db7c126ecbd5897103a8ec30113b290cb698d3aa9723ec54be2',
    status: 'analyzed',
    created_at: new Date().toISOString(),
  },
  {
    document_id: 'DOC-SLIP-02',
    case_id: 'CASE-TAMPERED-FA106659',
    source_name: '02_salary_slip.pdf',
    classification: 'SALARY_SLIP',
    classification_confidence: 0.99,
    media_type: 'application/pdf',
    page_count: 1,
    original_sha256: '88d7374d75d69784df00e125a2fa1743f3ae99b829676e885c3db776d635efb4',
    status: 'analyzed',
    created_at: new Date().toISOString(),
  },
  {
    document_id: 'DOC-BANK-03',
    case_id: 'CASE-TAMPERED-FA106659',
    source_name: '03_bank_statement.pdf',
    classification: 'BANK_STATEMENT',
    classification_confidence: 0.96,
    media_type: 'application/pdf',
    page_count: 1,
    original_sha256: 'b587c1692ae175cb618ff07fdf5eef833b9cf78a9c8f0f096230bf9f43c5b967',
    status: 'analyzed',
    created_at: new Date().toISOString(),
  },
  {
    document_id: 'DOC-EMP-04',
    case_id: 'CASE-TAMPERED-FA106659',
    source_name: '04_employer_declaration.pdf',
    classification: 'EMPLOYER_DECLARATION',
    classification_confidence: 0.94,
    media_type: 'application/pdf',
    page_count: 1,
    original_sha256: '65a570f6f43e1208a13a7e63b65275e533c3ca16641883be1215b4d757dcb2c1',
    status: 'analyzed',
    created_at: new Date().toISOString(),
  },
];

const SAMPLE_CLAIMS: Claim[] = [
  {
    claim_id: 'CLM-NETPAY-001',
    document_id: 'DOC-SLIP-02',
    page_index: 0,
    bbox_norm: [0.55, 0.44, 0.88, 0.52],
    field_name: 'monthly_net_pay',
    raw_text: '₹95,000.00',
    normalized_value: '9500000',
    datatype: 'monetary',
    extractor: 'pdf_text_parser',
    extraction_confidence: 0.98,
    source_name: '02_salary_slip.pdf',
  },
  {
    claim_id: 'CLM-BANKCREDIT-001',
    document_id: 'DOC-BANK-03',
    page_index: 0,
    bbox_norm: [0.45, 0.58, 0.85, 0.66],
    field_name: 'salary_credit_primary',
    raw_text: '₹65,000.00',
    normalized_value: '6500000',
    datatype: 'monetary',
    extractor: 'pdf_text_parser',
    extraction_confidence: 0.99,
    source_name: '03_bank_statement.pdf',
  },
  {
    claim_id: 'CLM-BASIC-001',
    document_id: 'DOC-SLIP-02',
    page_index: 0,
    bbox_norm: [0.55, 0.28, 0.85, 0.35],
    field_name: 'basic_pay',
    raw_text: '₹40,000.00',
    normalized_value: '4000000',
    datatype: 'monetary',
    extractor: 'pdf_text_parser',
    extraction_confidence: 0.99,
    source_name: '02_salary_slip.pdf',
  },
  {
    claim_id: 'CLM-HRA-001',
    document_id: 'DOC-SLIP-02',
    page_index: 0,
    bbox_norm: [0.55, 0.36, 0.85, 0.43],
    field_name: 'hra',
    raw_text: '₹25,000.00',
    normalized_value: '2500000',
    datatype: 'monetary',
    extractor: 'pdf_text_parser',
    extraction_confidence: 0.99,
    source_name: '02_salary_slip.pdf',
  },
];

const SAMPLE_HYPOTHESES: Hypothesis[] = [
  {
    hypothesis_id: 'HYP-SPLIT-01',
    case_id: 'CASE-TAMPERED-FA106659',
    name: 'H_split (Split Payroll Credits)',
    description: 'Checks if net salary is satisfied by multiple bank credit line items.',
    outcome: 'REJECTED',
    residual_conflict: 30000,
    explanation: 'Subsets sum to INR 65,000.00; residual deficit of INR 30,000.00 remains unassigned.',
    parameters: '{}',
    created_at: new Date().toISOString(),
  },
  {
    hypothesis_id: 'HYP-DELAY-02',
    case_id: 'CASE-TAMPERED-FA106659',
    name: 'H_delay (Posting Lag Tolerance)',
    description: 'Accounts for weekend or holiday bank clearing window shifts.',
    outcome: 'REJECTED',
    residual_conflict: 30000,
    explanation: 'Expanding search window by +/- 5 days yields zero matching credit transactions.',
    parameters: '{}',
    created_at: new Date().toISOString(),
  },
  {
    hypothesis_id: 'HYP-GROSS-03',
    case_id: 'CASE-TAMPERED-FA106659',
    name: 'H_gross (Gross-vs-Net Deduction Shift)',
    description: 'Verifies whether tax deductions or PF withholding explain divergence.',
    outcome: 'REJECTED',
    residual_conflict: 30000,
    explanation: 'Declared gross INR 65,000.00 cannot reconcile net declared pay of INR 95,000.00.',
    parameters: '{}',
    created_at: new Date().toISOString(),
  },
];

const SAMPLE_FINDINGS: Finding[] = [
  {
    finding_id: 'FND-SALARY-001',
    case_id: 'CASE-TAMPERED-FA106659',
    title: 'Cross-Document Net Salary Arithmetic Contradiction',
    summary: 'Declared net pay of INR 95,000.00 exceeds bank credits of INR 65,000.00 by INR 30,000.00. SMT constraints UNSAT across all legitimate hypotheses.',
    status: 'potential_manipulation',
    priority: 1,
    witness_claim_ids: ['CLM-NETPAY-001', 'CLM-BANKCREDIT-001'],
    supporting_signal_ids: ['SIG-FONT-01', 'SIG-ELA-02'],
    uncertainty_profile: { confidence: 0.99, residual: 30000 },
    review_required: true,
    created_at: new Date().toISOString(),
  },
];

const SAMPLE_SIGNALS: Signal[] = [
  {
    signal_id: 'SIG-FONT-01',
    document_id: 'DOC-SLIP-02',
    detector_name: 'font_baseline_anomaly_detector',
    severity: 'high',
    score: 0.94,
    bbox_norm: [0.55, 0.44, 0.88, 0.52],
    metadata: {
      substituted_font: 'Georgia-Italic',
      body_font: 'Helvetica',
      baseline_jitter_pt: 1.85,
    },
    created_at: new Date().toISOString(),
    source_name: '02_salary_slip.pdf',
  },
  {
    signal_id: 'SIG-ELA-02',
    document_id: 'DOC-SLIP-02',
    detector_name: 'pixel_error_level_analysis',
    severity: 'high',
    score: 0.88,
    bbox_norm: [0.55, 0.44, 0.88, 0.52],
    metadata: {
      quantization_delta: 28.4,
      compression_quality: 'Q75_mismatch',
    },
    created_at: new Date().toISOString(),
    source_name: '02_salary_slip.pdf',
  },
];

const SAMPLE_STATUS: CaseStatus = {
  case_id: 'CASE-TAMPERED-FA106659',
  status: 'complete',
  warnings: [],
  created_at: new Date().toISOString(),
  stages: {
    ingestion: 'complete',
    classification: 'complete',
    extraction: 'complete',
    forensics: 'complete',
    hypothesis: 'complete',
    dossier: 'complete',
  },
};

export function useCaseData(caseId: string | null | undefined): UseCaseDataResult {
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [statusInfo, setStatusInfo] = useState<CaseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecordedSample, setIsRecordedSample] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!caseId) {
      // Use sample data when no case is selected
      setCurrentCase(SAMPLE_CASE);
      setDocuments(SAMPLE_DOCS);
      setClaims(SAMPLE_CLAIMS);
      setHypotheses(SAMPLE_HYPOTHESES);
      setFindings(SAMPLE_FINDINGS);
      setSignals(SAMPLE_SIGNALS);
      setStatusInfo(SAMPLE_STATUS);
      setIsRecordedSample(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [cs, docs, cls, hyps, fnds, sigs, st] = await Promise.all([
        fetchCase(caseId).catch(() => null),
        fetchDocuments(caseId),
        fetchClaims(caseId),
        fetchHypotheses(caseId),
        fetchFindings(caseId),
        fetchSignals(caseId),
        fetchCaseStatus(caseId).catch(() => null),
      ]);

      setCurrentCase(cs || { case_id: caseId, bundle_type: 'LOAN_APPLICATION', status: 'analyzed', created_at: new Date().toISOString() });
      setDocuments(docs);
      setClaims(cls);
      setHypotheses(hyps);
      setFindings(fnds);
      setSignals(sigs);
      setStatusInfo(st);
      setIsRecordedSample(false);
    } catch (err: any) {
      console.warn('Backend unavailable or case query failed, activating Recorded sample:', err);
      setCurrentCase({ ...SAMPLE_CASE, case_id: caseId });
      setDocuments(SAMPLE_DOCS);
      setClaims(SAMPLE_CLAIMS);
      setHypotheses(SAMPLE_HYPOTHESES);
      setFindings(SAMPLE_FINDINGS);
      setSignals(SAMPLE_SIGNALS);
      setStatusInfo(SAMPLE_STATUS);
      setIsRecordedSample(true);
      setError(err?.message || 'Using recorded forensic sample');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling with backoff while status is running
  useEffect(() => {
    if (!caseId || isRecordedSample) return;
    if (statusInfo?.status !== 'running' && statusInfo?.status !== 'processing') return;

    let delay = 1000;
    let timer: any;

    const poll = async () => {
      try {
        const st = await fetchCaseStatus(caseId);
        setStatusInfo(st);
        if (st.status === 'complete' || st.status === 'error') {
          loadData();
          return;
        }
      } catch {
        delay = Math.min(3000, delay * 1.5);
      }
      timer = setTimeout(poll, delay);
    };

    timer = setTimeout(poll, delay);
    return () => clearTimeout(timer);
  }, [caseId, statusInfo?.status, isRecordedSample, loadData]);

  return {
    currentCase,
    documents,
    claims,
    hypotheses,
    findings,
    signals,
    statusInfo,
    loading,
    error,
    isRecordedSample,
    refetch: loadData,
  };
}

// Case Context for App-Wide Persistence
interface CaseContextValue {
  activeCaseId: string | null;
  setActiveCaseId: (id: string) => void;
}

export const CaseContext = createContext<CaseContextValue>({
  activeCaseId: null,
  setActiveCaseId: () => { },
});

export const useActiveCase = () => useContext(CaseContext);
