import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
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
  startAnalysis,
  uploadDocuments,
  getDocumentPageUrl,
  getClaimCropUrl,
} from '../api';
import { ForensicScanline } from './ForensicScanEffect';
import { ThreeForensicCanvas } from './ThreeForensicCanvas';

interface CaseStudioViewProps {
  currentCase: Case;
  onOpenReviewDrawer: (finding: Finding) => void;
  onOpenDossier: () => void;
  onBackToDashboard: () => void;
}

export const CaseStudioView: React.FC<CaseStudioViewProps> = ({
  currentCase,
  onOpenReviewDrawer,
  onOpenDossier,
  onBackToDashboard,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [statusInfo, setStatusInfo] = useState<CaseStatus | null>(null);

  const [activeTab, setActiveTab] = useState<'claims' | 'signals' | '3d'>('claims');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [hoveredClaimId, setHoveredClaimId] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Load all case data
  const loadCaseData = async () => {
    try {
      const [docs, cls, hyps, fnds, sigs, st] = await Promise.all([
        fetchDocuments(currentCase.case_id),
        fetchClaims(currentCase.case_id),
        fetchHypotheses(currentCase.case_id),
        fetchFindings(currentCase.case_id),
        fetchSignals(currentCase.case_id),
        fetchCaseStatus(currentCase.case_id).catch(() => null),
      ]);

      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].document_id);
      }
      setClaims(cls);
      setHypotheses(hyps);
      setFindings(fnds);
      setSignals(sigs);
      setStatusInfo(st);

      // Default select first witness claim if findings exist
      if (fnds.length > 0 && fnds[0].witness_claim_ids.length > 0) {
        setSelectedClaimId(fnds[0].witness_claim_ids[0]);
      }
    } catch (err) {
      console.error('Error loading case data:', err);
    }
  };

  useEffect(() => {
    loadCaseData();
  }, [currentCase.case_id]);

  // Handle re-triggering analysis pipeline
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await startAnalysis(currentCase.case_id);
      // Poll until complete
      const interval = setInterval(async () => {
        const st = await fetchCaseStatus(currentCase.case_id);
        setStatusInfo(st);
        if (st.status === 'complete') {
          clearInterval(interval);
          setAnalyzing(false);
          loadCaseData();
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setAnalyzing(false);
    }
  };

  // Handle file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      await uploadDocuments(currentCase.case_id, files);
      await handleAnalyze();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const activeDoc = documents.find((d) => d.document_id === selectedDocId);
  const activeDocClaims = claims.filter((c) => c.document_id === selectedDocId);
  const activeDocSignals = signals.filter((s) => s.document_id === selectedDocId);

  const primaryFinding = findings[0];
  const isEscalated = primaryFinding?.status === 'potential_manipulation';
  const isInconsistency = primaryFinding?.status === 'inconsistency';

  const maxResidual = Math.max(
    ...hypotheses.map((h) => h.residual_conflict || 0),
    0
  );

  const witnessClaims = claims.filter((c) =>
    primaryFinding?.witness_claim_ids?.includes(c.claim_id)
  );

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Status HUD */}
      <div className="glass-panel rounded-2xl p-4 lg:p-6 border border-cyan-500/20 relative overflow-hidden">
        <ForensicScanline scanning={analyzing} />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToDashboard}
                className="text-xs text-slate-400 hover:text-cyan-400 mono flex items-center gap-1 transition-colors"
              >
                &larr; Cases Dashboard
              </button>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-cyan-400 mono">Investigation Studio</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold text-white mono tracking-tight">
                {currentCase.case_id}
              </h2>

              {/* Status Pill */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase mono shadow-lg ${
                  isEscalated
                    ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                    : isInconsistency
                    ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50'
                    : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                }`}
              >
                {isEscalated ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                ) : isInconsistency ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
                <span>
                  {primaryFinding
                    ? primaryFinding.status.replace('_', ' ')
                    : currentCase.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mono">
              BUNDLE: {currentCase.bundle_type} • DOCUMENTS: {documents.length} • EXTRACTED CLAIMS: {claims.length}
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{analyzing ? 'Reasoning Pipeline Running...' : 'Re-run Pipeline'}</span>
            </button>

            {primaryFinding && (
              <button
                onClick={() => onOpenReviewDrawer(primaryFinding)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500/20 to-blue-600/30 hover:from-cyan-500/30 hover:to-blue-600/40 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>Reviewer Sign & Stamp</span>
              </button>
            )}

            <button
              onClick={onOpenDossier}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>

        {/* Pipeline Stage Bar */}
        {statusInfo?.stages && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-[11px] mono">
            {Object.entries(statusInfo.stages).map(([stage, st]) => (
              <div
                key={stage}
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  st === 'complete'
                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                <div className="font-semibold uppercase text-[10px]">{stage}</div>
                <div className="text-[9px] text-slate-400">{st}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main 3-Column Investigative Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Shelf (4 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl p-4 border border-cyan-500/15">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mono flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Evidence Bundle</span>
              </h3>
              <span className="text-[11px] text-cyan-400 mono font-semibold">
                {documents.length} Files
              </span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {documents.map((doc) => {
                const isSelected = doc.document_id === selectedDocId;
                const docClaimsCount = claims.filter((c) => c.document_id === doc.document_id).length;
                const hasSignals = signals.some((s) => s.document_id === doc.document_id);

                return (
                  <div
                    key={doc.document_id}
                    onClick={() => setSelectedDocId(doc.document_id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                      <span className="truncate">{doc.source_name}</span>
                      <span className="text-[10px] text-cyan-400 mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
                        {doc.classification}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mono mt-2">
                      <span>{docClaimsCount} claims</span>
                      <span className="truncate max-w-[100px]">SHA: {doc.original_sha256.slice(0, 8)}...</span>
                    </div>

                    {hasSignals && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400 mono">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Forensic anomaly detected</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ingest Additional Files */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <label className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/30 text-cyan-300 text-xs font-semibold cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Ingesting...' : '+ Ingest PDF to Bundle'}</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Active Document Metadata */}
          {activeDoc && (
            <div className="glass-panel rounded-2xl p-4 border border-cyan-500/15 space-y-2 text-xs mono">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                DOCUMENT PROVENANCE
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">MIME Type:</span>
                <span>{activeDoc.media_type}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Page Count:</span>
                <span>{activeDoc.page_count}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Classifier Conf:</span>
                <span className="text-emerald-400">{(activeDoc.classification_confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[10px] text-slate-500">SHA-256 Checksum:</div>
                <div className="flex items-center justify-between gap-1 text-[10px] text-cyan-300 mt-1 break-all bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="truncate">{activeDoc.original_sha256}</span>
                  <button
                    onClick={() => copyHash(activeDoc.original_sha256)}
                    className="p-1 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                {copiedHash && (
                  <span className="text-[9px] text-emerald-400">Copied to clipboard!</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center Column: Stage (Document Viewer & Bounding Box HUD) (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20">
            {/* View Tabs */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('claims')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'claims'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Document Claims ({activeDocClaims.length})
                </button>
                <button
                  onClick={() => setActiveTab('signals')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'signals'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Forensic Signals ({activeDocSignals.length})
                </button>
                <button
                  onClick={() => setActiveTab('3d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === '3d'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  3D Evidence Core
                </button>
              </div>

              <span className="text-[11px] text-slate-400 mono hidden sm:block">
                Page 1 • 200 DPI
              </span>
            </div>

            {/* Stage Body */}
            {activeTab === '3d' ? (
              <div className="h-[520px]">
                <ThreeForensicCanvas activeConflict={isEscalated} />
              </div>
            ) : activeTab === 'signals' ? (
              <div className="space-y-3 min-h-[460px]">
                <div className="text-xs text-slate-400 mono">
                  Pixel-level anomaly detectors (Error Level Analysis, Copy-Move keypoints, Font inconsistencies):
                </div>

                {activeDocSignals.length === 0 ? (
                  <div className="p-8 text-center glass-panel rounded-xl border border-slate-800 text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    No pixel or structural anomalies detected on this document.
                  </div>
                ) : (
                  activeDocSignals.map((sig) => (
                    <div
                      key={sig.signal_id}
                      className="p-3.5 rounded-xl glass-panel-ruby border border-rose-500/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                        <span className="mono uppercase">{sig.detector_name}</span>
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 text-[10px] mono border border-rose-800">
                          SEVERITY: {sig.severity}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mono">
                        Detector Score: <span className="font-bold text-white">{sig.score.toFixed(3)}</span>
                      </div>
                      {sig.metadata && Object.keys(sig.metadata).length > 0 && (
                        <div className="text-[10px] text-slate-400 mono bg-slate-950/80 p-2 rounded border border-slate-800">
                          {JSON.stringify(sig.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Claims View with Rendered Page Image & Interactive Bounding Box Overlays */
              <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-[#07090e] shadow-2xl min-h-[500px]">
                {activeDoc && (
                  <div className="relative w-full h-auto">
                    {/* Rendered 200 DPI Document Image */}
                    <img
                      src={getDocumentPageUrl(activeDoc.document_id, 0)}
                      alt="Rendered page"
                      className="w-full h-auto object-contain block opacity-95 transition-opacity duration-300"
                    />

                    {/* Interactive Bounding Boxes Overlay */}
                    {activeDocClaims.map((claim) => {
                      const bbox = claim.bbox_norm || [0, 0, 0, 0];
                      if (bbox.length < 4) return null;

                      const [x0, y0, x1, y1] = bbox;
                      const isWitness = primaryFinding?.witness_claim_ids?.includes(claim.claim_id);
                      const isSelected = claim.claim_id === selectedClaimId;
                      const isHovered = claim.claim_id === hoveredClaimId;

                      const left = `${x0 * 100}%`;
                      const top = `${y0 * 100}%`;
                      const width = `${(x1 - x0) * 100}%`;
                      const height = `${(y1 - y0) * 100}%`;

                      return (
                        <div
                          key={claim.claim_id}
                          onClick={() => setSelectedClaimId(claim.claim_id)}
                          onMouseEnter={() => setHoveredClaimId(claim.claim_id)}
                          onMouseLeave={() => setHoveredClaimId(null)}
                          style={{ left, top, width, height }}
                          className={`absolute cursor-pointer transition-all duration-200 group ${
                            isWitness
                              ? 'bg-rose-500/25 border-2 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
                              : isSelected || isHovered
                              ? 'bg-cyan-500/30 border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                              : 'bg-cyan-500/10 border border-cyan-400/40 hover:bg-cyan-500/25 hover:border-cyan-300'
                          }`}
                        >
                          {/* Floating Field Tag */}
                          <div className="absolute -top-5 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 text-cyan-300 border border-cyan-500/50 text-[9px] px-1.5 py-0.5 rounded mono pointer-events-none whitespace-nowrap z-30 shadow-md">
                            {claim.field_name}: {claim.raw_text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SMT Reasoning Engine & Witness Resolution (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Contradiction Witness Claims Card */}
          <div className="glass-panel-glow rounded-2xl p-4 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Contradiction Witness</span>
              </h3>
              <span className="text-[10px] text-cyan-300 mono font-semibold">
                MINIMAL UNSAT CORE
              </span>
            </div>

            {witnessClaims.length > 0 ? (
              <div className="space-y-2">
                {witnessClaims.map((w) => (
                  <div
                    key={w.claim_id}
                    onClick={() => setSelectedClaimId(w.claim_id)}
                    className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/40 hover:border-rose-400 transition-all cursor-pointer shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{w.field_name}</span>
                      <span className="mono font-bold text-rose-300 text-sm">{w.raw_text}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mono mt-1 flex items-center justify-between">
                      <span>Source: {documents.find((d) => d.document_id === w.document_id)?.source_name}</span>
                      <span className="text-cyan-400">Conf: {(w.extraction_confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}

                {/* Conflict Amount Callout */}
                {maxResidual > 0 && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-center space-y-1">
                    <span className="text-[10px] text-rose-300 uppercase tracking-wider mono font-bold block">
                      ARITHMETIC DISCREPANCY UNRESOLVED BY Z3
                    </span>
                    <span className="text-2xl font-extrabold text-white mono">
                      INR {maxResidual.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-[11px] text-rose-200/90 leading-tight">
                      No permutation of split payroll, tax deduction, or posting delay satisfies constraints.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/30 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="text-xs font-bold text-slate-200">Constraint Satisfiability Verified</div>
                <div className="text-[11px] text-slate-400">
                  Declared payroll credits reconcile with bank credits. Zero contradiction witness.
                </div>
              </div>
            )}
          </div>

          {/* High-Resolution Claim Crop Preview */}
          {selectedClaimId && (
            <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mono">
                <span>EVIDENCE IMAGE CROP</span>
                <span className="text-cyan-400 text-[10px]">200 DPI Native</span>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2 min-h-[90px]">
                <img
                  src={getClaimCropUrl(selectedClaimId)}
                  alt="High res crop"
                  className="max-h-24 object-contain shadow-md rounded"
                />
              </div>

              {(() => {
                const c = claims.find((cl) => cl.claim_id === selectedClaimId);
                if (!c) return null;
                return (
                  <div className="text-[10px] text-slate-400 mono space-y-0.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Field:</span>
                      <span className="text-slate-200 font-semibold">{c.field_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Value:</span>
                      <span className="text-cyan-300 font-semibold">{c.raw_text}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Extractor:</span>
                      <span>{c.extractor}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Z3 Theorem Prover Counterfactual Matrix */}
          <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mono flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Z3 Counterfactual Matrix</span>
              </h3>
              <span className="text-[10px] text-emerald-400 mono">SOLVER: Z3 v4.14</span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {hypotheses.map((h) => {
                const isSat = h.outcome === 'SUPPORTED';
                return (
                  <div
                    key={h.hypothesis_id}
                    className={`p-3 rounded-xl border transition-all ${
                      isSat
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="mono">{h.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold mono ${
                          isSat ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                        }`}
                      >
                        {h.outcome}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {h.explanation}
                    </p>

                    {h.residual_conflict > 0 && (
                      <div className="text-[10px] text-rose-400 mono mt-1 font-semibold">
                        Residual: INR {h.residual_conflict.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
