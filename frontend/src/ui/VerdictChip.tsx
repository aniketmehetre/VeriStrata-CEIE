import React from 'react';
import { Check, X, ShieldAlert, Sparkles } from 'lucide-react';

export interface VerdictChipProps {
  verdict: 'SAT' | 'UNSAT' | 'OBSERVATION' | 'POTENTIAL MANIPULATION';
  className?: string;
}

export const VerdictChip: React.FC<VerdictChipProps> = ({ verdict, className = '' }) => {
  switch (verdict) {
    case 'SAT':
      return (
        <span
          className={`chip bg-[#c6f432] text-[#07090c] border-[#c6f432] font-bold text-xs uppercase px-2.5 py-1 ${className}`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>SAT</span>
        </span>
      );
    case 'UNSAT':
      return (
        <span
          className={`chip bg-[#ff4d6a] text-[#ffffff] border-[#ff4d6a] font-bold text-xs uppercase px-2.5 py-1 shadow-[0_0_12px_rgba(255,77,106,0.4)] ${className}`}
        >
          <X className="w-3.5 h-3.5 stroke-[3]" />
          <span>UNSAT</span>
        </span>
      );
    case 'OBSERVATION':
      return (
        <span
          className={`chip bg-[#c6f432]/10 border-2 border-[#c6f432] text-[#c6f432] font-bold text-xs uppercase px-3 py-1 ${className}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>OBSERVATION · RESTRAINT</span>
        </span>
      );
    case 'POTENTIAL MANIPULATION':
      return (
        <span
          className={`chip bg-[#ff4d6a]/15 border-2 border-[#ff4d6a] text-[#ff8da0] font-bold text-xs uppercase px-3 py-1 shadow-[0_0_15px_rgba(255,77,106,0.3)] ${className}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#ff4d6a]" />
          <span>POTENTIAL MANIPULATION</span>
        </span>
      );
    default:
      return null;
  }
};
