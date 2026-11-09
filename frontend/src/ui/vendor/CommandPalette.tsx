/**
 * Vendor Component: Command Palette (Cmd+K)
 * Source: Watermelon UI / cmdk pattern (Re-skinned for TraceDoc CEIE)
 * License: MIT
 * Date: 2026-11-05
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search } from 'lucide-react';

export interface CommandAction {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, actions }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle palette
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (e.key === 'ArrowDown' && isOpen) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp' && isOpen) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter' && isOpen && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].onSelect();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#07090c]/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="relative w-full max-w-xl bg-[#0e1218] border border-[#3a4757] rounded-[14px] shadow-2xl overflow-hidden z-10 text-[#e8e6df]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1f2733]">
              <Search className="w-4 h-4 text-[#8e98a6]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or jump to scene..."
                className="w-full bg-transparent text-sm text-[#e8e6df] placeholder-[#8e98a6] focus:outline-none font-sans"
                autoFocus
              />
              <span className="font-mono text-[10px] bg-[#151b24] px-1.5 py-0.5 rounded text-[#8e98a6] border border-[#1f2733]">
                ESC
              </span>
            </div>

            {/* Actions List */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8e98a6] font-mono">
                  No matching commands found.
                </div>
              ) : (
                filtered.map((action, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        action.onSelect();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#151b24] text-[#c6f432] font-semibold'
                          : 'text-[#e8e6df] hover:bg-[#151b24]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 opacity-75" />
                        <span>{action.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#8e98a6]">{action.category}</span>
                        {action.shortcut && (
                          <kbd className="font-mono text-[10px] bg-[#07090c] px-1.5 py-0.5 rounded border border-[#1f2733] text-[#8e98a6]">
                            {action.shortcut}
                          </kbd>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
