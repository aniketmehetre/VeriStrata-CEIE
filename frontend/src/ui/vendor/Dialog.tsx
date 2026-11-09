/**
 * Vendor Component: Dialog Modal
 * Source: Watermelon UI / Radix / Motion pattern (Re-skinned for TraceDoc CEIE)
 * License: MIT
 * Date: 2026-11-05
 */
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-3xl',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#07090c]/80 backdrop-blur-md"
          />

          {/* Modal Panel */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
            className={`relative w-full ${maxWidth} max-h-[85vh] bg-[#0e1218] border border-[#3a4757] rounded-[14px] shadow-2xl flex flex-col z-10 overflow-hidden text-[#e8e6df]`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1f2733]">
              <div>
                {title && <h3 className="text-base font-bold text-[#e8e6df] font-sans">{title}</h3>}
                {subtitle && <p className="text-xs text-[#8e98a6] font-mono mt-0.5">{subtitle}</p>}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-[#8e98a6] hover:text-[#e8e6df] hover:bg-[#151b24] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
