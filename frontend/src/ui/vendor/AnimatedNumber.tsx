/**
 * Vendor Component: Animated Number
 * Source: Motion Primitives (Re-skinned for TraceDoc CEIE)
 * License: MIT
 * Date: 2026-11-05
 */
import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../../lib/motion';

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  formatter,
  className = '',
}) => {
  const [current, setCurrent] = useState(value);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setCurrent(value);
      return;
    }

    const start = current;
    const end = value;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutExpo: 1 - Math.pow(2, -10 * progress)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const nextVal = Math.round(start + (end - start) * ease);
      setCurrent(nextVal);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCurrent(end);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, duration, reducedMotion]);

  const displayString = formatter ? formatter(current) : current.toLocaleString('en-IN');

  return (
    <span className={`tabular-mono ${className}`}>
      {prefix}
      {displayString}
      {suffix}
    </span>
  );
};

