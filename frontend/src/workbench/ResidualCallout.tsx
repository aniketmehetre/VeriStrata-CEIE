import React from 'react';
import { AnimatedNumber } from '../ui/vendor/AnimatedNumber';

interface ResidualCalloutProps {
  residualPaise: number;
  hypothesisCount?: number;
  isObservation?: boolean;
  className?: string;
}

export const ResidualCallout: React.FC<ResidualCalloutProps> = ({
  residualPaise,
  hypothesisCount = 3,
  isObservation = false,
  className = '',
}) => {
  const isZero = residualPaise <= 0 || isObservation;

  return (
    <div
      className={`p-4 rounded-panel border text-center transition-all ${
        isZero
          ? 'bg-lime/10 border-lime/40 text-lime'
          : 'bg-ruby/10 border-ruby/40 text-ruby'
      } ${className}`}
    >
      <span className="font-mono text-[10px] tracking-wider uppercase block text-dim mb-1">
        {isZero ? 'CONSTRAINTS FULLY SATISFIED' : 'UNEXPLAINED CONFLICT RESIDUAL'}
      </span>

      <div className={`serif-display text-5xl font-bold tracking-tight ${isZero ? 'text-lime' : 'text-ruby'}`}>
        {isZero ? (
          '₹0'
        ) : (
          <div className="flex items-center justify-center">
            <span>₹</span>
            <AnimatedNumber value={Math.round(residualPaise / 100)} />
          </div>
        )}
      </div>

      <p className="font-mono text-[10px] text-muted mt-1 leading-snug">
        {isZero
          ? 'Reconciled under split payroll credits & calendar window tolerance.'
          : `Unexplained after ${hypothesisCount} tested counterfactual explanations.`}
      </p>
    </div>
  );
};
