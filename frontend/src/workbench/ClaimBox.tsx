import React from 'react';
import type { Claim } from '../types';
import { bboxToCss } from '../lib/bbox';

interface ClaimBoxProps {
  claim: Claim;
  isWitness?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  mode?: 'preview' | 'full';
  onSelect?: () => void;
  onHover?: (hovering: boolean) => void;
}

export const ClaimBox: React.FC<ClaimBoxProps> = ({
  claim,
  isWitness = false,
  isSelected = false,
  isHovered = false,
  mode = 'full',
  onSelect,
  onHover,
}) => {
  const css = bboxToCss(claim.bbox_norm);

  return (
    <button
      type="button"
      tabIndex={mode === 'full' ? 0 : -1}
      aria-label={`${claim.field_name} ${claim.raw_text}`}
      onClick={mode === 'full' ? onSelect : undefined}
      onMouseEnter={() => onHover && onHover(true)}
      onMouseLeave={() => onHover && onHover(false)}
      onFocus={() => onHover && onHover(true)}
      onBlur={() => onHover && onHover(false)}
      style={{
        left: css.left,
        top: css.top,
        width: css.width,
        height: css.height,
      }}
      className={`absolute cursor-pointer transition-all duration-150 group outline-none ${
        isWitness
          ? 'bg-ruby/18 border-2 border-ruby shadow-[0_0_14px_rgba(255,77,106,0.5)] animate-pulse'
          : isSelected || isHovered
          ? 'bg-cyan/25 border-2 border-cyan shadow-[0_0_12px_rgba(92,225,230,0.6)]'
          : 'bg-cyan/10 border border-cyan/40 hover:bg-cyan/20 hover:border-cyan'
      }`}
    >
      {/* Reticle Corner Brackets (10px) */}
      <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 border-inherit pointer-events-none" />
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 border-inherit pointer-events-none" />
      <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 border-inherit pointer-events-none" />
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 border-inherit pointer-events-none" />

      {/* Floating Field Tag */}
      {(isHovered || isSelected) && (
        <div className="absolute -top-6 left-0 bg-ground/95 text-cyan border border-cyan/50 text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none whitespace-nowrap z-40 shadow-lg">
          <span className="text-dim">{claim.field_name}: </span>
          <span className="font-bold text-text">{claim.raw_text}</span>
        </div>
      )}
    </button>
  );
};
