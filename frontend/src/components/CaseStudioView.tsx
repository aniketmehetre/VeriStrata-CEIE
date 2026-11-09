import React, { useState, useEffect, useMemo } from 'react';
import type { Case, Finding } from '../types';
import { useCaseData } from '../data/useCaseData';
import { startAnalysis, uploadDocuments } from '../api';
import { WorkbenchShell } from '../workbench/WorkbenchShell';
import { EvidenceShelf } from '../workbench/EvidenceShelf';
import { DocumentStage } from '../workbench/DocumentStage';
import { Inspector } from '../workbench/Inspector';
import { SignalList } from '../workbench/SignalList';
import { AuditChain } from '../workbench/AuditChain';
import { ContradictionCompare } from '../workbench/ContradictionCompare';
import { ThreeForensicCanvas } from './ThreeForensicCanvas';
import { ForensicScanline } from './ForensicScanEffect';
import { SplitSquareVertical } from 'lucide-react';

interface CaseStudioViewProps {
  currentCase: Case;
  onOpenReviewDrawer: (finding: Finding) => void;
  onOpenDossier: () => void;
  onBackToDashboard: () => void;
  onDirectUpload?: (files: File[]) => void;
}

export const CaseStudioView: React.FC<CaseStudioViewProps> = ({
  currentCase,
  onOpenReviewDrawer,
  onOpenDossier,
  onBackToDashboard,
  onDirectUpload,
}) => {
  const {
    documents,
    claims,
    hypotheses,
    findings,
    signals,
    statusInfo,
    isRecordedSample,
    refetch,
  } = useCaseData(currentCase.case_id);

  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [hoveredClaimId, setHoveredClaimId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'claims' | 'signals' | '3d'>('claims');
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Set default selected document
  useEffect(() => {
    if (documents.length > 0 && (!selectedDocId || !documents.some((d) => d.document_id === selectedDocId))) {
      setSelectedDocId(documents[0].document_id);
    }
  }, [documents, selectedDocId]);

  const activeDoc = useMemo(() => {
    return documents.find((d) => d.document_id === selectedDocId) || documents[0];
  }, [documents, selectedDocId]);

  const activeDocClaims = useMemo(() => {
    return claims.filter((c) => c.document_id === activeDoc?.document_id);
  }, [claims, activeDoc]);

  const activeDocSignals = useMemo(() => {
    return signals.filter((s) => s.document_id === activeDoc?.document_id);
  }, [signals, activeDoc]);

  const primaryFinding = findings[0] || null;

  const witnessClaims = useMemo(() => {
    if (!primaryFinding?.witness_claim_ids) return [];
    return claims.filter((c) => primaryFinding.witness_claim_ids.includes(c.claim_id));
  }, [claims, primaryFinding]);

  // Max residual in paise
  const maxResidualPaise = useMemo(() => {
    const maxVal = Math.max(...hypotheses.map((h) => h.residual_conflict || 0), 0);
    return maxVal * 100;
  }, [hypotheses]);

  // Selected claim object
  const selectedClaim = useMemo(() => {
    return claims.find((c) => c.claim_id === (selectedClaimId || witnessClaims[0]?.claim_id));
  }, [claims, selectedClaimId, witnessClaims]);

  // Re-run pipeline analysis
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await startAnalysis(currentCase.case_id);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Upload documents
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

  const canCompare = witnessClaims.length >= 2;

  return (
    <div className="relative w-full min-h-screen bg-ground text-text">
      {/* Forensic Scan Laser Overlay while analyzing */}
      <ForensicScanline scanning={analyzing} />

      {/* Recorded sample banner if offline */}
      {isRecordedSample && (
        <div className="bg-panel border-b border-amber/40 text-amber font-mono text-[11px] py-1 px-4 text-center">
          OFFLINE DEMO MODE: Viewing verified recorded forensic specimen [CASE-TAMPERED-FA106659]
        </div>
      )}

      <WorkbenchShell
        currentCase={currentCase}
        selectedDoc={activeDoc}
        statusInfo={statusInfo}
        primaryFinding={primaryFinding}
        analyzing={analyzing}
        onAnalyze={handleAnalyze}
        onDirectUpload={onDirectUpload}
        onOpenReviewer={() => primaryFinding && onOpenReviewDrawer(primaryFinding)}
        onOpenDossier={onOpenDossier}
        onBackToCases={onBackToDashboard}
        leftDock={
          <EvidenceShelf
            documents={documents}
            selectedDocId={activeDoc?.document_id || ''}
            claims={claims}
            signals={signals}
            mode="full"
            uploading={uploading}
            onSelectDoc={setSelectedDocId}
            onUpload={handleFileUpload}
            onUploadAndDownload={onDirectUpload}
          />
        }
        centerStage={
          isCompareMode && canCompare ? (
            <ContradictionCompare
              witnessClaims={witnessClaims}
              documents={documents}
              allClaims={claims}
              hypotheses={hypotheses}
              primaryFinding={primaryFinding}
              maxResidualPaise={maxResidualPaise}
              onClose={() => setIsCompareMode(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col space-y-3">
              {/* Center Stage Navigation Toolbar */}
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div className="flex items-center gap-1 bg-panel p-1 rounded-panel border border-line font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('claims')}
                    className={`px-3 py-1.5 rounded transition-colors cursor-pointer font-semibold ${
                      activeTab === 'claims'
                        ? 'bg-cyan/20 text-cyan border border-cyan/40 shadow-[0_0_10px_rgba(92,225,230,0.2)]'
                        : 'text-dim hover:text-text'
                    }`}
                  >
                    Specimen Claims ({activeDocClaims.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('signals')}
                    className={`px-3 py-1.5 rounded transition-colors cursor-pointer font-semibold ${
                      activeTab === 'signals'
                        ? 'bg-amber/20 text-amber border border-amber/40 shadow-[0_0_10px_rgba(245,165,36,0.2)]'
                        : 'text-dim hover:text-text'
                    }`}
                  >
                    Forensic Signals ({activeDocSignals.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('3d')}
                    className={`px-3 py-1.5 rounded transition-colors cursor-pointer font-semibold ${
                      activeTab === '3d'
                        ? 'bg-cyan/20 text-cyan border border-cyan/40 shadow-[0_0_10px_rgba(92,225,230,0.2)]'
                        : 'text-dim hover:text-text'
                    }`}
                  >
                    3D Evidence Core
                  </button>
                </div>

                {/* Compare Mode Toggle (when witness claims >= 2) */}
                {canCompare && (
                  <button
                    type="button"
                    onClick={() => setIsCompareMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-ruby/15 hover:bg-ruby/25 text-ruby-text border border-ruby/40 font-mono text-xs font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(255,77,106,0.25)]"
                  >
                    <SplitSquareVertical className="w-3.5 h-3.5 text-ruby" />
                    <span>Contradiction Compare (C)</span>
                  </button>
                )}
              </div>

              {/* Tab Bodies */}
              {activeTab === '3d' ? (
                <div className="flex-1 min-h-[500px]">
                  <ThreeForensicCanvas activeConflict={primaryFinding?.status === 'potential_manipulation'} />
                </div>
              ) : activeTab === 'signals' ? (
                <div className="flex-1 min-h-[460px] p-2">
                  <SignalList
                    signals={activeDocSignals}
                    onFocusSignal={() => setActiveTab('claims')}
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-[500px]">
                  <DocumentStage
                    document={activeDoc}
                    claims={activeDocClaims}
                    signals={activeDocSignals}
                    primaryFinding={primaryFinding}
                    selectedClaimId={selectedClaimId}
                    hoveredClaimId={hoveredClaimId}
                    mode="full"
                    onSelectClaim={setSelectedClaimId}
                    onHoverClaim={setHoveredClaimId}
                  />
                </div>
              )}
            </div>
          )
        }
        rightDock={
          <Inspector
            finding={primaryFinding}
            witnessClaims={witnessClaims}
            documents={documents}
            hypotheses={hypotheses}
            selectedClaim={selectedClaim}
            maxResidualPaise={maxResidualPaise}
            onSelectClaim={setSelectedClaimId}
            onOpenReviewer={() => primaryFinding && onOpenReviewDrawer(primaryFinding)}
          />
        }
        bottomDock={<AuditChain mode="full" />}
      />
    </div>
  );
};
