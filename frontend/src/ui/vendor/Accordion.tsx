/**
 * Vendor Component: Accordion / Disclosure Rows
 * Source: Watermelon UI / Motion pattern (Re-skinned for TraceDoc CEIE)
 * License: MIT
 * Date: 2026-11-05
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  badge?: React.ReactNode;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpenId,
  className = '',
}) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId || null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isOpen = item.id === openId;

        return (
          <div
            key={item.id}
            className="rounded-xl bg-[#0e1218] border border-[#1f2733] overflow-hidden transition-colors"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-[#e8e6df] hover:bg-[#151b24] transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <span>{item.title}</span>
                {item.badge}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#8e98a6] transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[#c6f432]' : ''
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-[#1f2733] bg-[#07090c]/40 px-3.5 py-3 text-xs text-[#aab4c2]"
                >
                  {item.content}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
