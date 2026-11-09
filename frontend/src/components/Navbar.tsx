import React from 'react';
import { Shield, Sparkles, AlertTriangle, FileText, PlusCircle, Activity } from 'lucide-react';
import type { HealthInfo, Case } from '../types';

interface NavbarProps {
  health: HealthInfo | null;
  cases: Case[];
  currentCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onLaunchDemo: (type: 'clean' | 'tampered') => void;
  onOpenNewCase: () => void;
  onOpenDossier: () => void;
  loadingDemo: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  cases,
  currentCaseId,
  onSelectCase,
  onLaunchDemo,
  onOpenNewCase,
  onOpenDossier,
  loadingDemo,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-panel border-b border-line px-4 lg:px-8 py-2.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 font-mono text-xs">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-panel bg-cyan/15 border border-cyan/40 shadow-[0_0_12px_rgba(92,225,230,0.3)]">
            <Shield className="w-4 h-4 text-cyan" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-lime animate-pulse border-2 border-ground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-text">
                VeriStrata
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-panel-2 border border-line text-cyan">
                CEIE
              </span>
            </div>
            <p className="text-[10px] text-dim hidden sm:block">
              Counterfactual Evidence Investigation Engine
            </p>
          </div>
        </div>

        {/* Center: Case Quick Switcher */}
        <div className="flex items-center gap-2 max-w-xs md:max-w-md w-full">
          <select
            value={currentCaseId || ''}
            onChange={(e) => onSelectCase(e.target.value)}
            className="w-full bg-ground text-xs text-text border border-line rounded-panel px-3 py-1.5 focus:outline-none focus:border-cyan transition-colors"
          >
            <option value="" disabled>
              Select Investigation Case...
            </option>
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                [{c.status.toUpperCase()}] {c.case_id.slice(0, 18)}... ({c.created_by || 'system'})
              </option>
            ))}
          </select>
        </div>

        {/* Right: Instant Demos & Actions */}
        <div className="flex items-center gap-2">
          {/* Health Pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-panel-2 border border-line text-[11px]">
            <Activity className="w-3.5 h-3.5 text-lime" />
            <span className="text-dim">SMT:</span>
            <span className="text-lime font-bold">{health?.solver || 'ok'}</span>
          </div>

          {/* Quick Demo Clean Button (Restraint) */}
          <button
            type="button"
            onClick={() => onLaunchDemo('clean')}
            disabled={loadingDemo}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-panel text-xs font-semibold bg-lime/15 hover:bg-lime/25 border border-lime/40 text-lime transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            title="Demonstrates mathematical restraint: split credit matches salary"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime" />
            <span>Clean Demo</span>
          </button>

          {/* Quick Demo Tampered Button (Escalation) */}
          <button
            type="button"
            onClick={() => onLaunchDemo('tampered')}
            disabled={loadingDemo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-panel text-xs font-semibold bg-ruby/15 hover:bg-ruby/25 border border-ruby/40 text-ruby-text transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            title="Demonstrates counterfactual conflict detection: INR 95k vs 65k"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-ruby" />
            <span className="hidden md:inline">Tampered Demo</span>
            <span className="md:hidden">Demo</span>
          </button>

          {/* Dossier Trigger */}
          {currentCaseId && (
            <button
              type="button"
              onClick={onOpenDossier}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-panel text-xs font-semibold bg-cyan/15 hover:bg-cyan/25 border border-cyan/40 text-cyan transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-cyan" />
              <span className="hidden sm:inline">Dossier</span>
            </button>
          )}

          {/* New Case Button */}
          <button
            type="button"
            onClick={onOpenNewCase}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-panel text-xs font-semibold bg-panel-2 hover:bg-ground text-text border border-line transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Case</span>
          </button>
        </div>
      </div>
    </header>
  );
};
