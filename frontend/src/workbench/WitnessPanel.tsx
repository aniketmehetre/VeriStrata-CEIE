import React from 'react';
import type { Claim, DocumentItem } from '../types';
import { Kicker } from '../ui/Kicker';

interface WitnessPanelProps {
  witnessClaims: Claim[];
  documents: DocumentItem[];
  selectedClaimId?: string | null;
  onSelectClaim?: (id: string) => void;
  className?: string;
}

export const WitnessPanel: React.FC<WitnessPanelProps> = ({
  witnessClaims,
  documents,
  selectedClaimId,
  onSelectClaim,
  className = '',
}) => {
  if (witnessClaims.length === 0) {
    return (
      <div className={`p-4 bg-panel border border-line rounded-panel text-center text-xs text-muted font-mono ${className}`}>
        No contradiction witness claims isolated.
      </div>
    );
  }

  return (
    <div className={`p-4 bg-panel border border-line rounded-panel space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Kicker>MINIMAL CONTRADICTION WITNESS SET</Kicker>
        <span className="text-[10px] text-ruby font-mono font-bold">
          MINIMAL UNSAT CORE
        </span>
      </div>

      <div className="space-y-2">
        {witnessClaims.map((claim) => {
          const doc = documents.find((d) => d.document_id === claim.document_id);
          const isSelected = claim.claim_id === selectedClaimId;

          return (
            <div
              key={claim.claim_id}
              onClick={() => onSelectClaim && onSelectClaim(claim.claim_id)}
              className={`p-3 rounded-panel border transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-panel-2 border-ruby shadow-[0_0_12px_rgba(255,77,106,0.3)]'
                  : 'bg-ground/80 border-line hover:border-ruby/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-text">{claim.field_name}</span>
                <span className="text-ruby-text text-sm font-bold">{claim.raw_text}</span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-dim mt-1.5">
                <span className="truncate max-w-[160px]">{doc?.source_name || claim.document_id}</span>
                <span className="text-cyan">{(claim.extraction_confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
