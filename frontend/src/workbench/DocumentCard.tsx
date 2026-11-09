import React from 'react';
import type { DocumentItem } from '../types';
import { AlertTriangle, FileText } from 'lucide-react';
import { shortHash } from '../lib/format';

interface DocumentCardProps {
  document: DocumentItem;
  isSelected?: boolean;
  claimsCount?: number;
  hasSignals?: boolean;
  mode?: 'preview' | 'full';
  onSelect?: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isSelected = false,
  claimsCount = 0,
  hasSignals = false,
  mode = 'full',
  onSelect,
}) => {
  return (
    <div
      onClick={mode === 'full' ? onSelect : undefined}
      className={`p-3 rounded-panel border transition-all select-none ${
        mode === 'full' ? 'cursor-pointer' : 'cursor-default'
      } ${
        isSelected
          ? 'bg-panel-2 border-cyan/60 shadow-[0_0_12px_rgba(92,225,230,0.15)] text-text'
          : 'bg-panel/80 border-line hover:border-line-strong text-muted'
      }`}
    >
      <div className="flex items-center justify-between text-xs font-mono font-bold">
        <div className="flex items-center gap-1.5 truncate">
          <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan' : 'text-dim'}`} />
          <span className="truncate">{document.source_name}</span>
        </div>
        <span className="text-[10px] text-cyan font-mono px-1.5 py-0.5 rounded bg-panel border border-line shrink-0">
          {document.classification}
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-dim mt-2">
        <span>{claimsCount} claims</span>
        <span>SHA: {shortHash(document.original_sha256)}</span>
      </div>

      {hasSignals && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber font-mono">
          <AlertTriangle className="w-3 h-3 text-amber shrink-0" />
          <span className="truncate">Forensic anomaly detected</span>
        </div>
      )}
    </div>
  );
};
