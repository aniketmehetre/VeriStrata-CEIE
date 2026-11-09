import React from 'react';
import { Kicker } from '../../ui/Kicker';
import { Btn } from '../../ui/Btn';
import { StatusPill } from '../../workbench/StatusPill';
import { EvidenceShelf } from '../../workbench/EvidenceShelf';
import { DocumentStage } from '../../workbench/DocumentStage';
import { Inspector } from '../../workbench/Inspector';
import { AuditChain } from '../../workbench/AuditChain';
import { useCaseData } from '../../data/useCaseData';
import { ExternalLink } from 'lucide-react';

export interface StudioSceneProps {
  onOpenFullStudio?: () => void;
}

export const StudioScene: React.FC<StudioSceneProps> = ({ onOpenFullStudio }) => {
  // Use the verified tampered specimen case
  const {
    documents,
    claims,
    hypotheses,
    findings,
    signals,
  } = useCaseData('CASE-TAMPERED-FA106659');

  const activeDoc = documents.find((d) => d.classification === 'SALARY_SLIP') || documents[0];
  const activeDocClaims = claims.filter((c) => c.document_id === activeDoc?.document_id);
  const activeDocSignals = signals.filter((s) => s.document_id === activeDoc?.document_id);

  const primaryFinding = findings[0] || null;
  const witnessClaims = claims.filter((c) => primaryFinding?.witness_claim_ids?.includes(c.claim_id));
  const maxResidualPaise = 3000000; // 30,000 INR

  const handleOpenStudio = () => {
    if (onOpenFullStudio) {
      onOpenFullStudio();
    } else {
      window.location.hash = '#/studio?case=CASE-TAMPERED-FA106659';
    }
  };

  return (
    <section id="scene-3" className="relative w-full min-h-screen autopsy-grid p-4 sm:p-8 lg:p-12 flex flex-col justify-between select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line z-20">
        <div>
          <Kicker>04 / FORENSIC INVESTIGATION WORKBENCH</Kicker>
          <div className="font-mono text-sm text-text font-bold mt-1">
            CASES / <span className="text-ruby-text">CASE-TAMPERED-FA106659</span> / {activeDoc?.source_name || '02_salary_slip.pdf'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill status="potential_manipulation" size="sm" />
          <Btn
            variant="lime"
            className="text-xs font-mono font-bold"
            onClick={handleOpenStudio}
          >
            <span>Enter Complete Investigation Studio &rarr;</span>
          </Btn>
        </div>
      </div>

      {/* 3-Column Preview Workbench Stage (Shared components in mode="preview") */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-6">
        {/* Left Column: Evidence Shelf */}
        <div className="lg:col-span-3">
          <EvidenceShelf
            documents={documents}
            selectedDocId={activeDoc?.document_id || ''}
            claims={claims}
            signals={signals}
            mode="preview"
            onSelectDoc={() => {}}
          />
        </div>

        {/* Center Column: Document Stage */}
        <div className="lg:col-span-5 h-[480px]">
          <DocumentStage
            document={activeDoc}
            claims={activeDocClaims}
            signals={activeDocSignals}
            primaryFinding={primaryFinding}
            selectedClaimId={witnessClaims[0]?.claim_id}
            mode="preview"
          />
        </div>

        {/* Right Column: Inspector */}
        <div className="lg:col-span-4 max-h-[480px] overflow-y-auto pr-1">
          <Inspector
            finding={primaryFinding}
            witnessClaims={witnessClaims}
            documents={documents}
            hypotheses={hypotheses}
            selectedClaim={witnessClaims[0]}
            maxResidualPaise={maxResidualPaise}
            onSelectClaim={() => {}}
            onOpenReviewer={handleOpenStudio}
          />
        </div>
      </div>

      {/* Bottom Strip: Cryptographic Audit Trail */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-line font-mono text-xs z-20">
        <AuditChain mode="preview" />

        <button
          type="button"
          onClick={handleOpenStudio}
          className="text-cyan hover:underline cursor-pointer font-bold flex items-center gap-1 shrink-0"
        >
          <span>Open Full Interactive Studio</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
