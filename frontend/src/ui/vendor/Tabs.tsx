/**
 * Vendor Component: Tabs
 * Source: Watermelon UI / Motion pattern (Re-skinned for TraceDoc CEIE)
 * License: MIT
 * Date: 2026-11-05
 */
import React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeId, onChange, className = '' }) => {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 bg-[#151b24] p-1 rounded-xl border border-[#1f2733] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer font-sans select-none ${
              isActive
                ? 'bg-[#0e1218] text-[#c6f432] shadow-sm font-semibold border border-[#3a4757]'
                : 'text-[#8e98a6] hover:text-[#e8e6df]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
