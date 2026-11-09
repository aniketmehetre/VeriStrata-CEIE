import React, { useEffect, useState } from 'react';
import { shortHash } from '../../lib/format';
import { useReducedMotion } from '../../lib/motion';

export interface HashTickerProps {
  hashes?: string[];
  className?: string;
}

const DEFAULT_HASHES = [
  '0cce97cb66b012aabee28240e99de090f3db51bc00a33f7ddcd658a79c034be2',
  '88d7374dcbd4f21c543a59705003bf3488c9cfd066a48977020b98f3681efb41',
  'b587c16967b2acae9dc847303579cd91b9e2e7e6bdcce7cb15b0df0f93b94783',
  '65a570f6b508a8f5fc4bc1b70ecb28373d5cb414081a4843129a38384ab1f094',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'fa106659728441ef30302834b9d09230571d87f7d39103859231f28b70e1c2a3',
];

export const HashTicker: React.FC<HashTickerProps> = ({
  hashes = DEFAULT_HASHES,
  className = '',
}) => {
  const [items, setItems] = useState<string[]>(hashes);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (hashes.length > 0) setItems(hashes);
  }, [hashes]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#07090c] border-y border-[#1f2733] py-2 select-none ${className}`}
    >
      {/* Edge gradient masks */}
      <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[#07090c] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[#07090c] to-transparent z-10 pointer-events-none" />

      {/* Marquee Content */}
      <div
        className={`flex items-center gap-6 whitespace-nowrap group ${
          reducedMotion ? 'overflow-x-auto' : 'animate-marquee hover:[animation-play-state:paused]'
        }`}
        style={{
          animation: reducedMotion ? 'none' : 'marquee 45s linear infinite',
        }}
      >
        {[...items, ...items, ...items].map((h, idx) => (
          <div key={`${h}-${idx}`} className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5ce1e6]/60" />
            <span className="text-[#8e98a6]">SHA-256</span>
            <span className="text-[#e8e6df] font-medium">{shortHash(h)}</span>
            <span className="text-[#1f2733] mx-2">/</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

