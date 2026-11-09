import React from 'react';
import type { Signal } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface SignalListProps {
  signals: Signal[];
  onFocusSignal?: (signal: Signal) => void;
  className?: string;
}

export const SignalList: React.FC<SignalListProps> = ({
  signals,
  onFocusSignal,
  className = '',
}) => {
  if (signals.length === 0) {
    return (
      <div className={`p-8 text-center bg-panel border border-line rounded-panel text-muted font-mono text-xs space-y-2 ${className}`}>
        <CheckCircle2 className="w-8 h-8 text-lime mx-auto opacity-80" />
        <div className="text-text font-bold">No Strata Anomalies Detected</div>
        <p className="text-[11px] text-dim">
          Pixel compression (ELA), copy-move keypoints, and typographical baselines verify within standard tolerances.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 font-mono text-xs ${className}`}>
      <div className="text-dim">
        Pixel and micro-typographical anomaly detectors (ELA, baseline jitter, copy-move clusters):
      </div>

      <div className="space-y-2.5">
        {signals.map((sig) => (
          <div
            key={sig.signal_id}
            className="p-3.5 rounded-panel bg-panel border border-ruby/40 space-y-2"
          >
            <div className="flex items-center justify-between font-bold">
              <span className="text-ruby-text uppercase">{sig.detector_name.replace(/_/g, ' ')}</span>
              <span className="px-2 py-0.5 rounded bg-ruby/20 text-ruby-text text-[10px] border border-ruby/40 uppercase">
                SEVERITY: {sig.severity}
              </span>
            </div>

            <div className="flex items-center justify-between text-dim">
              <span>Detector Score: <span className="text-text font-bold">{sig.score.toFixed(3)}</span></span>
              {onFocusSignal && (
                <button
                  type="button"
                  onClick={() => onFocusSignal(sig)}
                  className="text-[10px] text-cyan hover:underline cursor-pointer"
                >
                  Show on page &rarr;
                </button>
              )}
            </div>

            {sig.metadata && Object.keys(sig.metadata).length > 0 && (
              <div className="text-[10px] text-dim bg-ground p-2 rounded border border-line leading-relaxed font-mono">
                {Object.entries(sig.metadata).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-dim">{k}:</span>
                    <span className="text-text font-bold">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
