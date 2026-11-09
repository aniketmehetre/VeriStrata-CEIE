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
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-cyan-500/15 px-4 lg:px-8 py-3 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Shield className="w-5 h-5 text-cyan-300" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                VeriStrata
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mono">
                CEIE v1.1
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mono hidden sm:block">
              Counterfactual Evidence Investigation Engine
            </p>
          </div>
        </div>

        {/* Center: Case Quick Switcher */}
        <div className="flex items-center gap-2 max-w-xs md:max-w-md w-full">
          <select
            value={currentCaseId || ''}
            onChange={(e) => onSelectCase(e.target.value)}
            className="w-full bg-slate-900/90 text-xs text-slate-200 border border-slate-700/80 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 mono transition-all"
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
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">SMT Z3:</span>
            <span className="text-emerald-400 font-semibold">{health?.solver || 'ok'}</span>
          </div>

          {/* Quick Demo Clean Button (Restraint) */}
          <button
            onClick={() => onLaunchDemo('clean')}
            disabled={loadingDemo}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95 disabled:opacity-50"
            title="Demonstrates mathematical restraint: split credit matches salary"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Clean Demo</span>
          </button>

          {/* Quick Demo Tampered Button (Escalation) */}
          <button
            onClick={() => onLaunchDemo('tampered')}
            disabled={loadingDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)] active:scale-95 disabled:opacity-50"
            title="Demonstrates counterfactual conflict detection: INR 95k vs 65k"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Tampered Demo</span>
            <span className="md:hidden">Demo</span>
          </button>

          {/* Dossier Trigger */}
          {currentCaseId && (
            <button
              onClick={onOpenDossier}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">Dossier</span>
            </button>
          )}

          {/* New Case Button */}
          <button
            onClick={onOpenNewCase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Case</span>
          </button>
        </div>
      </div>
    </header>
  );
};
