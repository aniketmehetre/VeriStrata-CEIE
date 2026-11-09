import React, { useState } from 'react';
import { shortHash } from '../lib/format';
import { Copy, Check } from 'lucide-react';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'lime' | 'ruby' | 'cyan' | 'amber';
}

export const Chip: React.FC<ChipProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-[#0e1218]/90 border-[#3a4757] text-[#e8e6df]',
    lime: 'bg-[#c6f432]/10 border-[#c6f432]/40 text-[#c6f432]',
    ruby: 'bg-[#ff4d6a]/10 border-[#ff4d6a]/40 text-[#ff8da0]',
    cyan: 'bg-[#5ce1e6]/10 border-[#5ce1e6]/40 text-[#5ce1e6]',
    amber: 'bg-[#f5a524]/10 border-[#f5a524]/40 text-[#f5a524]',
  };

  return (
    <span
      className={`chip border transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export interface HashChipProps {
  hash: string;
  prefix?: string;
  className?: string;
}

export const HashChip: React.FC<HashChipProps> = ({ hash, prefix = '', className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy hash ${hash}`}
      className={`chip border border-[#3a4757] hover:border-[#5ce1e6]/50 bg-[#0e1218]/90 text-[#aab4c2] hover:text-[#e8e6df] cursor-pointer transition-all active:scale-95 ${className}`}
    >
      {prefix && <span className="text-[#8e98a6]">{prefix}</span>}
      <span className="tabular-mono text-[#e8e6df] font-medium">{shortHash(hash)}</span>
      {copied ? (
        <Check className="w-3 h-3 text-[#c6f432]" />
      ) : (
        <Copy className="w-3 h-3 text-[#8e98a6] group-hover:text-[#e8e6df]" />
      )}
    </button>
  );
};
