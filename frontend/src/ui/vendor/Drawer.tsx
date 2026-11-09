/**
 * Vendor Component: Slide-in Sheet / Drawer
 * Source: Watermelon UI / Motion pattern (Re-skinned for TraceDoc CEIE)
 * License: MIT
 * Date: 2026-11-05
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) => {
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
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#07090c]/75 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className={`relative w-full ${maxWidth} h-full bg-[#0e1218] border-l border-[#3a4757] p-6 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl text-[#e8e6df]`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1f2733] pb-4 mb-4">
              <div>
                {title && <h3 className="text-base font-bold text-[#e8e6df] font-sans">{title}</h3>}
                {subtitle && <p className="text-xs text-[#8e98a6] font-mono mt-0.5">{subtitle}</p>}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="p-1.5 rounded-lg text-[#8e98a6] hover:text-[#e8e6df] hover:bg-[#151b24] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
