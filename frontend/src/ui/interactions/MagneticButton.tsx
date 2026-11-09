import React, { useRef } from 'react';
import { motion, useSpring } from 'motion/react';
import { useReducedMotion } from '../../lib/motion';

export interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const springConfig = { stiffness: 350, damping: 25 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (dist < 80) {
      // Pull by up to 8px
      const pullFactor = 8 / 80;
      x.set(deltaX * pullFactor);
      y.set(deltaY * pullFactor);
    } else {
      x.set(0);
      y.set(0);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x, y }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

