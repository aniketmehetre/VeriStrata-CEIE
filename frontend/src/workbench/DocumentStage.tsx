import React, { useState, useRef, useCallback, useMemo } from 'react';
import type { DocumentItem, Claim, Signal, Finding } from '../types';
import { ClaimBox } from './ClaimBox';
import { getDocumentPageUrl } from '../api';
import { ZoomIn, ZoomOut, Maximize2, AlertCircle, RefreshCw, Crosshair } from 'lucide-react';
import { bboxToCss } from '../lib/bbox';

interface DocumentStageProps {
  document: DocumentItem | null | undefined;
  claims: Claim[];
  signals?: Signal[];
  primaryFinding?: Finding | null;
  selectedClaimId?: string | null;
  hoveredClaimId?: string | null;
  mode?: 'preview' | 'full';
  onSelectClaim?: (id: string) => void;
  onHoverClaim?: (id: string | null) => void;
  className?: string;
}

export const DocumentStage: React.FC<DocumentStageProps> = ({
  document,
  claims,
  signals = [],
  primaryFinding,
  selectedClaimId,
  hoveredClaimId,
  mode = 'full',
  onSelectClaim,
  onHoverClaim,
  className = '',
}) => {
  // Layer Toggles
  const [showFields, setShowFields] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  const [showWitness, setShowWitness] = useState(true);

  // Pan & Zoom State (0.5x to 4x)
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Live Loupe State
  const [loupeActive, setLoupeActive] = useState(mode === 'preview');
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0 });
  const [loupeZoom, setLoupeZoom] = useState(3);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  // Image load state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const imageUrl = document ? getDocumentPageUrl(document.document_id, 0) : '';

  // Sort claims in reading order (y0 then x0) for keyboard navigation
  const sortedClaims = useMemo(() => {
    return [...claims].sort((a, b) => {
      const yDiff = (a.bbox_norm?.[1] || 0) - (b.bbox_norm?.[1] || 0);
      if (Math.abs(yDiff) > 0.05) return yDiff;
      return (a.bbox_norm?.[0] || 0) - (b.bbox_norm?.[0] || 0);
    });
  }, [claims]);

  // Active or hovered claim
  const activeClaim = useMemo(() => {
    return claims.find((c) => c.claim_id === (hoveredClaimId || selectedClaimId));
  }, [claims, hoveredClaimId, selectedClaimId]);

  // Handle Wheel Zoom & Alt+Wheel for Loupe Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.altKey) {
      e.preventDefault();
      setLoupeZoom((z) => Math.min(6, Math.max(2, z + (e.deltaY < 0 ? 0.5 : -0.5))));
    } else if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale((s) => Math.min(4, Math.max(0.5, s + (e.deltaY < 0 ? 0.2 : -0.2))));
    }
  }, []);

  // Handle Drag to Pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && (e.shiftKey || scale > 1)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setLoupePos({ x, y });

    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  }, [isPanning, startPan]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Keyboard navigation for roving focus
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '0') {
      resetView();
    } else if (e.key === '+' || e.key === '=') {
      setScale((s) => Math.min(4, s + 0.25));
    } else if (e.key === '-') {
      setScale((s) => Math.max(0.5, s - 0.25));
    }
  }, [resetView]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHoveringCanvas(true)}
      onMouseLeave={() => {
        setIsHoveringCanvas(false);
        setIsPanning(false);
      }}
      className={`relative w-full h-full min-h-[500px] bg-ground border border-line rounded-panel overflow-hidden flex flex-col justify-between select-none outline-none autopsy-grid ${className}`}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-line bg-panel/90 backdrop-blur z-20">
        {/* Layer Chips */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            aria-pressed={showWitness}
            onClick={() => setShowWitness(!showWitness)}
            className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
              showWitness
                ? 'bg-ruby text-white shadow-[0_0_10px_rgba(255,77,106,0.4)]'
                : 'text-dim hover:text-text bg-panel-2'
            }`}
          >
            WITNESS
          </button>
          <button
            type="button"
            aria-pressed={showFields}
            onClick={() => setShowFields(!showFields)}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              showFields
                ? 'bg-cyan/20 text-cyan border border-cyan/40'
                : 'text-dim hover:text-text bg-panel-2'
            }`}
          >
            FIELDS ({claims.length})
          </button>
          <button
            type="button"
            aria-pressed={showSignals}
            onClick={() => setShowSignals(!showSignals)}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              showSignals
                ? 'bg-amber/20 text-amber border border-amber/40'
                : 'text-dim hover:text-text bg-panel-2'
            }`}
          >
            SIGNALS ({signals.length})
          </button>
        </div>

        {/* Pan / Zoom / Loupe Controls */}
        <div className="flex items-center gap-2 font-mono text-xs text-muted">
          <button
            type="button"
            title="Toggle Live Loupe"
            onClick={() => setLoupeActive(!loupeActive)}
            className={`p-1.5 rounded border transition-colors ${
              loupeActive ? 'bg-cyan/20 border-cyan text-cyan' : 'border-line text-dim hover:text-text'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Zoom Out (-)"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="p-1.5 rounded border border-line text-dim hover:text-text"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center text-[11px] tabular-mono text-cyan">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            title="Zoom In (+)"
            onClick={() => setScale((s) => Math.min(4, s + 0.25))}
            className="p-1.5 rounded border border-line text-dim hover:text-text"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Reset View (0)"
            onClick={resetView}
            className="p-1.5 rounded border border-line text-dim hover:text-text"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport with Shared Transform Container */}
      <div
        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair"
        onDoubleClick={resetView}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 120ms cubic-bezier(.22,1,.36,1)',
          }}
          className="relative max-w-full max-h-full shadow-2xl rounded-[4px] overflow-hidden"
        >
          {/* Skeleton Loader */}
          {!imageLoaded && !imageError && (
            <div className="w-[480px] h-[640px] bg-panel-2 animate-pulse flex items-center justify-center text-dim font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan" />
              Loading 200 DPI Specimen...
            </div>
          )}

          {/* Error State */}
          {imageError && (
            <div className="w-[480px] h-[640px] bg-panel border border-ruby/40 flex flex-col items-center justify-center p-6 text-center text-ruby-text font-mono text-xs space-y-3">
              <AlertCircle className="w-8 h-8 text-ruby" />
              <div>Failed to render document page</div>
              <button
                type="button"
                onClick={() => {
                  setImageError(false);
                  setImageLoaded(false);
                }}
                className="px-3 py-1.5 bg-ruby/20 border border-ruby text-ruby-text rounded font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* 200 DPI Rendered Document Image */}
          {imageUrl && (
            <img
              ref={imageRef}
              src={imageUrl}
              alt="200 DPI Document Specimen"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`block max-h-[75vh] w-auto object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-95' : 'opacity-0'
              }`}
            />
          )}

          {/* Overlays: Signal Regions */}
          {imageLoaded && showSignals && signals.map((sig) => {
            const css = bboxToCss(sig.bbox_norm);
            return (
              <div
                key={sig.signal_id}
                style={{
                  left: css.left,
                  top: css.top,
                  width: css.width,
                  height: css.height,
                }}
                className="absolute border border-dashed border-amber bg-amber/10 pointer-events-none z-10"
              />
            );
          })}

          {/* Overlays: Claim Bounding Boxes */}
          {imageLoaded && showFields && sortedClaims.map((claim) => {
            const isWitness = primaryFinding?.witness_claim_ids?.includes(claim.claim_id);
            if (isWitness && !showWitness) return null;

            return (
              <ClaimBox
                key={claim.claim_id}
                claim={claim}
                isWitness={isWitness}
                isSelected={claim.claim_id === selectedClaimId}
                isHovered={claim.claim_id === hoveredClaimId}
                mode={mode}
                onSelect={() => onSelectClaim && onSelectClaim(claim.claim_id)}
                onHover={(hovering) => onHoverClaim && onHoverClaim(hovering ? claim.claim_id : null)}
              />
            );
          })}
        </div>

        {/* Live Loupe (180px Circle following pointer) */}
        {loupeActive && isHoveringCanvas && imageLoaded && imageRef.current && (
          <div
            style={{
              left: `${loupePos.x + 24}px`,
              top: `${loupePos.y - 90}px`,
              backgroundImage: `url(${imageUrl})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${imageRef.current.width * loupeZoom}px ${imageRef.current.height * loupeZoom}px`,
              backgroundPosition: `-${loupePos.x * loupeZoom - 90}px -${loupePos.y * loupeZoom - 90}px`,
            }}
            className="absolute pointer-events-none w-[180px] h-[180px] rounded-full border-2 border-cyan shadow-[0_0_25px_rgba(92,225,230,0.4)] bg-ground z-50 overflow-hidden flex flex-col justify-between p-2"
          >
            {/* Center Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-full h-px bg-cyan" />
              <div className="h-full w-px bg-cyan absolute" />
            </div>

            <span className="font-mono text-[8px] font-bold text-cyan tracking-wider uppercase z-10 bg-ground/80 px-1 rounded self-center">
              LOUPE {loupeZoom}X · 200 DPI
            </span>

            {activeClaim && (
              <div className="font-mono text-[8px] text-text z-10 bg-ground/90 p-1 rounded border border-line">
                <div className="text-cyan font-bold truncate">{activeClaim.field_name}</div>
                <div className="text-dim">Conf: {(activeClaim.extraction_confidence * 100).toFixed(0)}%</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coordinate Readout Bar (Bottom-Left) */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-line bg-panel/90 backdrop-blur z-20 font-mono text-[11px]">
        {activeClaim ? (
          <div
            onClick={() => {
              const bboxStr = activeClaim.bbox_norm?.map((v) => v.toFixed(3)).join(' ') || '';
              navigator.clipboard.writeText(bboxStr);
            }}
            title="Click to copy coordinates"
            className="flex items-center gap-2 text-cyan cursor-pointer hover:underline"
          >
            <span className="text-dim">COORDS:</span>
            <span>
              x0 {activeClaim.bbox_norm?.[0]?.toFixed(3)} y0 {activeClaim.bbox_norm?.[1]?.toFixed(3)} x1 {activeClaim.bbox_norm?.[2]?.toFixed(3)} y1 {activeClaim.bbox_norm?.[3]?.toFixed(3)}
            </span>
          </div>
        ) : (
          <div className="text-dim">HOVER OR FOCUS FIELD TO INSPECT COORDINATES</div>
        )}

        <div className="text-dim hidden sm:block">
          PAGE 1 · 200 DPI NATIVE
        </div>
      </div>
    </div>
  );
};
