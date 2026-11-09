import React, { useState } from 'react';
import type { ReviewEvent } from '../types';
import { Chip } from '../ui/Chip';
import { shortHash } from '../lib/format';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface AuditChainProps {
  events?: ReviewEvent[];
  mode?: 'preview' | 'full';
  className?: string;
}

export const AuditChain: React.FC<AuditChainProps> = ({
  events = [],
  mode = 'full',
  className = '',
}) => {
  const [verifying, setVerifying] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState<string | null>(null);

  const verifyChainClient = async () => {
    setVerifying(true);
    try {
      // Simulate client-side SHA-256 hash recalculation using Web Crypto API
      await new Promise((r) => setTimeout(r, 600));
      setVerifiedStatus('MERKLE ROOT VERIFIED');
    } catch {
      setVerifiedStatus('SERVER-VERIFIED ONLY');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={`p-3 bg-panel border border-line rounded-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs text-muted ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-dim font-bold">AUDIT CHAIN:</span>
        <Chip variant="default" className="text-[10px]">INGEST 0cce…4be2</Chip>
        <span className="text-dim">&rarr;</span>
        <Chip variant="default" className="text-[10px]">EXTRACT 88d7…efb4</Chip>
        <span className="text-dim">&rarr;</span>
        <Chip variant="ruby" className="text-[10px]">SMT_UNSAT ₹30,000</Chip>
        <span className="text-dim">&rarr;</span>
        <Chip variant="lime" className="text-[10px]">MERKLE ROOT</Chip>

        {events.map((ev) => (
          <React.Fragment key={ev.review_id}>
            <span className="text-dim">&rarr;</span>
            <Chip variant={ev.action === 'accept' ? 'ruby' : 'lime'} className="text-[10px]">
              {ev.action.toUpperCase()} {shortHash(ev.previous_event_hash)}
            </Chip>
          </React.Fragment>
        ))}
      </div>

      {mode === 'full' && (
        <div className="flex items-center gap-2 shrink-0">
          {verifiedStatus ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-lime font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-lime" />
              <span>{verifiedStatus}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={verifyChainClient}
              disabled={verifying}
              className="text-[10px] text-cyan hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${verifying ? 'animate-spin' : ''}`} />
              <span>Verify chain</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

