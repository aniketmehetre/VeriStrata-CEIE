import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1500,
  className = '',
}) => {
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!countRef.current) return;
    const targetObj = { val: 0 };

    const anim = animate(targetObj, {
      val: value,
      duration: duration,
      ease: 'outExpo',
      onUpdate: () => {
        if (countRef.current) {
          countRef.current.textContent = `${prefix}${Math.round(targetObj.val).toLocaleString()}${suffix}`;
        }
      },
    });

    return () => {
      if (anim && typeof anim.pause === 'function') {
        anim.pause();
      }
    };
  }, [value, prefix, suffix, duration]);

  return <span ref={countRef} className={className}>{prefix}0{suffix}</span>;
};

interface ForensicScanlineProps {
  scanning?: boolean;
}

export const ForensicScanline: React.FC<ForensicScanlineProps> = ({ scanning = true }) => {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lineRef.current || !scanning) return;

    const anim = animate(lineRef.current, {
      translateY: ['0%', '800%'],
      opacity: [0, 1, 1, 0],
      duration: 3000,
      loop: true,
      ease: 'inOutQuad',
    });

    return () => {
      if (anim && typeof anim.pause === 'function') {
        anim.pause();
      }
    };
  }, [scanning]);

  if (!scanning) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <div
        ref={lineRef}
        className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f0ff]"
      />
    </div>
  );
};
