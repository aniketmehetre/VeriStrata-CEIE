import React from 'react';
import type { Finding, Claim, DocumentItem, Hypothesis } from '../types';
import { StatusPill } from './StatusPill';
import { StatusLadder } from '../ui/StatusLadder';
import { WitnessPanel } from './WitnessPanel';
import { ResidualCallout } from './ResidualCallout';
import { HypothesisMatrix } from './HypothesisMatrix';
import { CropPreview } from './CropPreview';
import { Btn } from '../ui/Btn';
import { Kicker } from '../ui/Kicker';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface InspectorProps {
  finding: Finding | null | undefined;
  witnessClaims: Claim[];
  documents: DocumentItem[];
  hypotheses: Hypothesis[];
  selectedClaim: Claim | null | undefined;
  maxResidualPaise: number;
  onSelectClaim: (id: string) => void;
  onOpenReviewer: () => void;
  className?: string;
}

export const Inspector: React.FC<InspectorProps> = ({
  finding,
  witnessClaims,
  documents,
  hypotheses,
  selectedClaim,
  maxResidualPaise,
  onSelectClaim,
  onOpenReviewer,
  className = '',
}) => {
  const isEscalated = finding?.status === 'potential_manipulation';
  const isObservation = finding?.status === 'observation' || !finding;
  const isReviewed = finding?.status === 'reviewer_confirmed' || finding?.status === 'reviewer_dismissed';

  // Map status to 0..3 step in StatusLadder
  const statusStepIndex = isReviewed ? 3 : isEscalated ? 2 : finding?.status === 'inconsistency' ? 1 : 0;

  return (
    <div className={`space-y-4 font-mono text-xs ${className}`}>
      {/* 1. Finding Header & Status Ladder */}
      <div className="p-4 bg-panel border border-line rounded-panel space-y-3">
        <div className="flex items-center justify-between">
          <Kicker>PRIMARY FINDING · CONFLICT</Kicker>
          <StatusPill status={finding?.status || 'observation'} size="sm" />
        </div>

        <StatusLadder activeIndex={statusStepIndex} />

        {finding && (
          <p className="text-[11px] text-muted leading-relaxed font-sans pt-1 border-t border-line">
            {finding.summary}
          </p>
        )}
      </div>

      {/* 2. Residual Conflict Display */}
      <ResidualCallout
        residualPaise={maxResidualPaise}
        hypothesisCount={hypotheses.length}
        isObservation={isObservation}
      />

      {/* 3. Minimal Witness Claims */}
      <WitnessPanel
        witnessClaims={witnessClaims}
        documents={documents}
        selectedClaimId={selectedClaim?.claim_id}
        onSelectClaim={onSelectClaim}
      />

      {/* 4. High-Resolution Crop Preview */}
      {selectedClaim && <CropPreview claim={selectedClaim} />}

      {/* 5. Z3 Theorem Prover Counterfactual Matrix */}
      <HypothesisMatrix hypotheses={hypotheses} />

      {/* Pinned Primary CTA Button */}
      <div className="pt-2">
        {isReviewed ? (
          <div className="p-3 bg-panel-2 border border-cyan/40 rounded-panel text-center text-cyan font-mono text-xs space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-cyan" />
              <span>CRYPTOGRAPHICALLY SEALED</span>
            </div>
            <p className="text-[10px] text-dim">
              Adjudication signed and hashed into Merkle audit log.
            </p>
          </div>
        ) : (
          <Btn
            variant="lime"
            className="w-full font-bold shadow-lg"
            onClick={onOpenReviewer}
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            <span>Open Investigator Review</span>
          </Btn>
        )}
      </div>
    </div>
  );
};
