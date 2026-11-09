import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';
import { useReducedMotion } from '../../lib/motion';

export const EvidenceCursor: React.FC = () => {
  const [isLoupe, setIsLoupe] = useState(false);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { stiffness: 500, damping: 40 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Only activate for desktop fine pointer
    if (window.matchMedia('(pointer: coarse)').matches || reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-loupe]')) {
        setIsLoupe(true);
      } else {
        setIsLoupe(false);
      }
    };

    const handleMouseLeave = () => setVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY, visible, reducedMotion]);

  if (!visible || reducedMotion) return null;

  return (
    <motion.div
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      className={`fixed top-0 left-0 pointer-events-none z-50 rounded-full flex items-center justify-center transition-all duration-200 ${
        isLoupe
          ? 'w-[72px] h-[72px] border-2 border-[#5ce1e6] bg-[#5ce1e6]/10 shadow-[0_0_20px_rgba(92,225,230,0.4)] backdrop-blur-[1px]'
          : 'w-[14px] h-[14px] border border-[#c6f432] bg-[#c6f432]/20'
      }`}
    >
      {isLoupe && (
        <span className="font-mono text-[9px] font-bold text-[#5ce1e6] tracking-wider select-none animate-pulse">
          INSPECT
        </span>
      )}
    </motion.div>
  );
};

