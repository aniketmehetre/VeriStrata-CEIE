import React, { useState } from 'react';
import type { Claim } from '../types';
import { getClaimCropUrl } from '../api';
import { Kicker } from '../ui/Kicker';
import { RefreshCw, Image as ImageIcon } from 'lucide-react';

interface CropPreviewProps {
  claim: Claim | null | undefined;
  className?: string;
}

export const CropPreview: React.FC<CropPreviewProps> = ({ claim, className = '' }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!claim) return null;

  const cropUrl = getClaimCropUrl(claim.claim_id);

  return (
    <div className={`p-4 bg-panel border border-line rounded-panel space-y-2.5 font-mono text-xs ${className}`}>
      <div className="flex items-center justify-between">
        <Kicker>EVIDENCE IMAGE CROP</Kicker>
        <span className="text-cyan text-[10px] font-bold">200 DPI NATIVE</span>
      </div>

      <div className="relative rounded-panel overflow-hidden border border-line bg-ground flex items-center justify-center p-2 min-h-[90px]">
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-ground text-dim text-[10px]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 text-cyan" />
            Loading 200 DPI Crop...
          </div>
        )}

        {error ? (
          <div className="flex items-center gap-1.5 text-dim text-[10px]">
            <ImageIcon className="w-4 h-4 text-dim" />
            <span>Crop preview unavailable</span>
          </div>
        ) : (
          <img
            src={cropUrl}
            alt={`Crop for ${claim.field_name}`}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={`max-h-24 w-auto object-contain rounded shadow transition-opacity duration-200 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      <div className="space-y-1 text-[10px] text-dim pt-1 border-t border-line">
        <div className="flex justify-between">
          <span>Field:</span>
          <span className="text-text font-bold">{claim.field_name}</span>
        </div>
        <div className="flex justify-between">
          <span>Value:</span>
          <span className="text-cyan font-bold">{claim.raw_text}</span>
        </div>
        <div className="flex justify-between">
          <span>Extractor:</span>
          <span className="text-muted">{claim.extractor}</span>
        </div>
        <div className="flex justify-between">
          <span>Confidence:</span>
          <span className="text-lime font-bold">{(claim.extraction_confidence * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

