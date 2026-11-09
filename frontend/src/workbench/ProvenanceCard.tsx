import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { DocumentItem } from '../types';
import { Kicker } from '../ui/Kicker';

interface ProvenanceCardProps {
  document: DocumentItem | null | undefined;
  mode?: 'preview' | 'full';
  className?: string;
}

export const ProvenanceCard: React.FC<ProvenanceCardProps> = ({
  document,
  mode = 'full',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  if (!document) return null;

  const copyHash = () => {
    if (!document.original_sha256) return;
    navigator.clipboard.writeText(document.original_sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-4 bg-panel border border-line rounded-panel font-mono text-xs space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <Kicker>DOCUMENT PROVENANCE</Kicker>
        <span className="text-[10px] text-dim">{document.classification}</span>
      </div>

      <div className="space-y-1.5 text-text">
        <div className="flex items-center justify-between">
          <span className="text-dim">MIME Type:</span>
          <span className="text-muted">{document.media_type}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-dim">Page Count:</span>
          <span className="text-muted">{document.page_count}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-dim">Classifier Conf:</span>
          <span className="text-lime font-bold">
            {(document.classification_confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-line">
        <div className="text-[10px] text-dim mb-1 flex items-center justify-between">
          <span>SHA-256 CHECKSUM</span>
          {copied && <span className="text-lime text-[9px]">Copied!</span>}
        </div>
        <div className="flex items-center justify-between gap-1 bg-ground p-1.5 rounded border border-line text-[10px] text-cyan break-all">
          <span className="truncate">{document.original_sha256}</span>
          {mode === 'full' && (
            <button
              type="button"
              onClick={copyHash}
              aria-label="Copy SHA-256 hash"
              className="p-1 text-dim hover:text-cyan transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-lime" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
