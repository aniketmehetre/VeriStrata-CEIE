import React from 'react';
import type { Claim, DocumentItem, Finding, Hypothesis } from '../types';
import { DocumentStage } from './DocumentStage';
import { formatPaise } from '../lib/format';
import { VerdictChip } from '../ui/VerdictChip';
import { Kicker } from '../ui/Kicker';

interface ContradictionCompareProps {
  witnessClaims: Claim[];
  documents: DocumentItem[];
  allClaims: Claim[];
  hypotheses: Hypothesis[];
  primaryFinding: Finding | null;
  maxResidualPaise: number;
  onClose: () => void;
  className?: string;
}

export const ContradictionCompare: React.FC<ContradictionCompareProps> = ({
  witnessClaims,
  documents,
  allClaims,
  hypotheses,
  primaryFinding,
  maxResidualPaise,
  onClose,
  className = '',
}) => {
  const claimA = witnessClaims[0];
  const claimB = witnessClaims[1] || witnessClaims[0];

  const docA = documents.find((d) => d.document_id === claimA?.document_id);
  const docB = documents.find((d) => d.document_id === claimB?.document_id);

  const claimsDocA = allClaims.filter((c) => c.document_id === docA?.document_id);
  const claimsDocB = allClaims.filter((c) => c.document_id === docB?.document_id);

  return (
    <div className={`relative w-full h-full min-h-[580px] bg-ground rounded-panel border border-line flex flex-col overflow-hidden select-none ${className}`}>
      {/* Compare Header */}
      <div className="flex items-center justify-between p-3 border-b border-line bg-panel/90 z-20">
        <div className="flex items-center gap-2">
          <Kicker>CONTRADICTION COMPARE MODE</Kicker>
          <span className="text-[10px] text-ruby font-mono font-bold bg-ruby/10 px-2 py-0.5 rounded border border-ruby/30">
            ARITHMETIC BREACH DETECTED
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-mono text-muted hover:text-text px-2.5 py-1 rounded border border-line bg-panel-2 cursor-pointer transition-colors"
        >
          Exit Compare (Esc)
        </button>
      </div>

      {/* Split Stage Area */}
      <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch overflow-hidden">
        {/* Left Document Stage */}
        <div className="lg:col-span-5 h-full border-r border-line flex flex-col">
          <div className="p-2 border-b border-line bg-panel-2 text-[11px] font-mono flex items-center justify-between">
            <span className="text-text font-bold truncate">{docA?.source_name}</span>
            <span className="text-cyan">{docA?.classification}</span>
          </div>
          <div className="flex-1 min-h-[460px]">
            <DocumentStage
              document={docA}
              claims={claimsDocA}
              primaryFinding={primaryFinding}
              selectedClaimId={claimA?.claim_id}
              mode="full"
            />
          </div>
        </div>

        {/* Center Discrepancy Caliper Spine (2 cols) */}
        <div className="lg:col-span-2 bg-panel/95 border-r border-line p-4 flex flex-col justify-between items-center text-center z-10 font-mono">
          <div className="space-y-1 w-full pt-2">
            <Kicker>RESIDUAL GAP</Kicker>
            <div className="serif-display text-4xl sm:text-5xl font-bold text-ruby">
              {formatPaise(maxResidualPaise)}
            </div>
            <div className="text-[9px] text-muted leading-tight">
              Unresolved deficit between declared payroll and banked credits
            </div>
          </div>

          {/* Caliper Line */}
          <div className="w-px flex-1 bg-ruby/40 my-3 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-ground px-1 text-[9px] text-ruby whitespace-nowrap">
              40k + 25k ≠ 95k
            </div>
          </div>

          <div className="space-y-2 w-full pb-2">
            <VerdictChip verdict="UNSAT" />
            <div className="text-[9px] text-dim">
              All {hypotheses.length || 3} hypotheses mathematically rejected by Z3.
            </div>
          </div>
        </div>

        {/* Right Document Stage */}
        <div className="lg:col-span-5 h-full flex flex-col">
          <div className="p-2 border-b border-line bg-panel-2 text-[11px] font-mono flex items-center justify-between">
            <span className="text-text font-bold truncate">{docB?.source_name}</span>
            <span className="text-cyan">{docB?.classification}</span>
          </div>
          <div className="flex-1 min-h-[460px]">
            <DocumentStage
              document={docB}
              claims={claimsDocB}
              primaryFinding={primaryFinding}
              selectedClaimId={claimB?.claim_id}
              mode="full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
