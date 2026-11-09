/**
 * Vendor Component: Scramble Text Reveal
 * Source: React Bits / Tailwind pattern (Re-skinned for TraceDoc CEIE)
 * License: MIT
 * Date: 2026-11-05
 */
import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../../lib/motion';

export interface ScrambleTextProps {
  text: string;
  duration?: number;
  chars?: string;
  className?: string;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  duration = 600,
  chars = '0123456789abcdefABCDEF!@#$%^&*',
  className = '',
}) => {
  const [displayText, setDisplayText] = useState(text);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDisplayText(text);
      return;
    }

    let frame = 0;
    const totalFrames = Math.max(15, Math.floor(duration / 30));
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;

      const scrambled = text
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';
          if (i / text.length < progress) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      setDisplayText(scrambled);

      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, duration, chars, reducedMotion]);

  return <span className={`tabular-mono ${className}`}>{displayText}</span>;
};

