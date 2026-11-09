import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface StatusLadderProps {
  activeIndex: number; // 0: Observation, 1: Inconsistency, 2: Potential manipulation, 3: Reviewer-confirmed
  className?: string;
}

export const StatusLadder: React.FC<StatusLadderProps> = ({ activeIndex, className = '' }) => {
  const steps = [
    { label: 'Observation', icon: CheckCircle2, defaultColor: 'text-[#c6f432]' },
    { label: 'Inconsistency', icon: AlertCircle, defaultColor: 'text-[#f5a524]' },
    { label: 'Potential manipulation', icon: AlertTriangle, defaultColor: 'text-[#ff4d6a]' },
    { label: 'Reviewer-confirmed', icon: ShieldCheck, defaultColor: 'text-[#5ce1e6]' },
  ];

  return (
    <div className={`space-y-1.5 font-sans ${className}`}>
      {steps.map((step, idx) => {
        const isActive = idx === activeIndex;
        const Icon = step.icon;

        return (
          <div
            key={step.label}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
              isActive
                ? idx === 2
                  ? 'bg-[#ff4d6a]/15 border-[#ff4d6a] text-[#ff8da0] shadow-[0_0_12px_rgba(255,77,106,0.2)] font-semibold'
                  : idx === 0
                  ? 'bg-[#c6f432]/15 border-[#c6f432] text-[#c6f432] font-semibold'
                  : 'bg-[#151b24] border-[#3a4757] text-[#e8e6df] font-semibold'
                : 'bg-[#0e1218]/50 border-transparent text-[#8e98a6] opacity-60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="tabular-mono text-[10px] text-[#8e98a6]">0{idx + 1}</span>
              <span>{step.label}</span>
            </div>
            <Icon className={`w-3.5 h-3.5 ${isActive ? step.defaultColor : 'text-[#8e98a6]'}`} />
          </div>
        );
      })}
    </div>
  );
};
