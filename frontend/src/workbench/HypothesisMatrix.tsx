import React, { useState } from 'react';
import type { Hypothesis } from '../types';
import { Kicker } from '../ui/Kicker';
import { formatPaise } from '../lib/format';
import { Check, X, ChevronDown, ChevronRight, Cpu } from 'lucide-react';

interface HypothesisMatrixProps {
  hypotheses: Hypothesis[];
  className?: string;
}

export const HypothesisMatrix: React.FC<HypothesisMatrixProps> = ({
  hypotheses,
  className = '',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(hypotheses[0]?.hypothesis_id || null);

  return (
    <div className={`p-4 bg-panel border border-line rounded-panel space-y-3 font-mono text-xs ${className}`}>
      <div className="flex items-center justify-between">
        <Kicker>Z3 COUNTERFACTUAL MATRIX</Kicker>
        <span className="text-[10px] text-lime font-bold flex items-center gap-1">
          <Cpu className="w-3 h-3 text-cyan" />
          <span>SOLVER: Z3 v4.14</span>
        </span>
      </div>

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {hypotheses.map((h) => {
          const isSat = h.outcome === 'SUPPORTED';
          const isExpanded = expandedId === h.hypothesis_id;

          return (
            <div
              key={h.hypothesis_id}
              className={`rounded-panel border transition-all ${
                isSat
                  ? 'bg-lime/5 border-lime/40 text-text'
                  : 'bg-ruby/5 border-ruby/40 text-text'
              }`}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : h.hypothesis_id)}
                className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer outline-none"
              >
                <div className="flex items-center gap-2 truncate">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-dim shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-dim shrink-0" />
                  )}
                  <span className={`font-bold truncate ${!isSat ? 'line-through text-muted' : 'text-text'}`}>
                    {h.name}
                  </span>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 ml-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSat
                        ? 'bg-lime/20 text-lime border border-lime/50'
                        : 'bg-ruby/20 text-ruby-text border border-ruby/50'
                    }`}
                  >
                    {isSat ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>{h.outcome}</span>
                  </span>
                </div>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-line text-[11px] text-muted space-y-1.5 leading-relaxed">
                  <p>{h.explanation}</p>
                  {h.residual_conflict > 0 && (
                    <div className="text-[10px] text-ruby-text font-bold">
                      Residual Gap: {formatPaise(h.residual_conflict * 100)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
