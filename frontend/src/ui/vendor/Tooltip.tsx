/**
 * Vendor Component: Tooltip
 * Source: Watermelon UI (Re-skinned for TraceDoc CEIE)
 * License: MIT
 * Date: 2026-11-05
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-[#151b24] border border-[#3a4757] text-[11px] font-mono text-[#e8e6df] whitespace-nowrap shadow-xl z-50 pointer-events-none"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

