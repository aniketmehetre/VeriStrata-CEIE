import React from 'react';
import type { DocumentItem, Claim, Signal } from '../types';
import { DocumentCard } from './DocumentCard';
import { ProvenanceCard } from './ProvenanceCard';
import { Kicker } from '../ui/Kicker';
import { Upload } from 'lucide-react';

interface EvidenceShelfProps {
  documents: DocumentItem[];
  selectedDocId: string;
  claims: Claim[];
  signals: Signal[];
  mode?: 'preview' | 'full';
  uploading?: boolean;
  onSelectDoc: (id: string) => void;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export const EvidenceShelf: React.FC<EvidenceShelfProps> = ({
  documents,
  selectedDocId,
  claims,
  signals,
  mode = 'full',
  uploading = false,
  onSelectDoc,
  onUpload,
  className = '',
}) => {
  const activeDoc = documents.find((d) => d.document_id === selectedDocId) || documents[0];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="p-4 bg-panel border border-line rounded-panel">
        <div className="flex items-center justify-between mb-3">
          <Kicker>EVIDENCE SHELF · {documents.length} BUNDLE FILES</Kicker>
          <span className="text-[11px] text-cyan font-mono font-semibold">
            {documents.length} Files
          </span>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {documents.map((doc) => {
            const isSelected = doc.document_id === selectedDocId;
            const docClaimsCount = claims.filter((c) => c.document_id === doc.document_id).length;
            const hasSignals = signals.some((s) => s.document_id === doc.document_id);

            return (
              <DocumentCard
                key={doc.document_id}
                document={doc}
                isSelected={isSelected}
                claimsCount={docClaimsCount}
                hasSignals={hasSignals}
                mode={mode}
                onSelect={() => onSelectDoc(doc.document_id)}
              />
            );
          })}
        </div>

        {mode === 'full' && onUpload && (
          <div className="mt-4 pt-3 border-t border-line">
            <label className="flex items-center justify-center gap-2 w-full p-2.5 rounded-panel border border-dashed border-cyan/40 hover:border-cyan bg-cyan/5 hover:bg-cyan/10 text-cyan text-xs font-mono font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Ingesting...' : '+ Ingest PDF to Bundle'}</span>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={onUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>

      {activeDoc && <ProvenanceCard document={activeDoc} mode={mode} />}
    </div>
  );
};
