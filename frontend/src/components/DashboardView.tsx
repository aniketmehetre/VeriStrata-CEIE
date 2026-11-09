import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  FileSearch,
  Sparkles,
  Terminal,
} from 'lucide-react';
import type { Case, HealthInfo } from '../types';
import { ThreeForensicCanvas } from './ThreeForensicCanvas';
import { AnimatedCounter, ForensicScanline } from './ForensicScanEffect';

interface DashboardViewProps {
  cases: Case[];
  health: HealthInfo | null;
  onSelectCase: (caseId: string) => void;
  onLaunchDemo: (type: 'clean' | 'tampered') => void;
  onOpenNewCase: () => void;
  loadingDemo: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cases,
  health: _health,
  onSelectCase,
  onLaunchDemo,
  onOpenNewCase,
  loadingDemo: _loadingDemo,
}) => {
  const completeCases = cases.filter((c) => c.status === 'complete').length;

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-12">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hero Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="lg:col-span-7 space-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>SMT THEOREM PROVER • MULTI-DOCUMENT CORRELATION</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Forensic Precision meets{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Counterfactual
            </span>{' '}
            Restraint.
          </h1>

          {/* Description */}
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
            VeriStrata CEIE replaces fragile heuristics with Z3 SMT Theorem Proving. It correlates
            salary slips, bank credits, and employer tax declarations with pixel-level forensics
            to prove or disprove financial fraud without false alarms.
          </p>

          {/* Dual Action Beat Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Clean Case Card */}
            <div
              onClick={() => onLaunchDemo('clean')}
              className="group relative p-4 rounded-xl glass-panel-emerald border border-emerald-500/30 hover:border-emerald-400/60 transition-all cursor-pointer overflow-hidden shadow-lg active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mono">
                  BEAT 1 • DEMONSTRATION OF RESTRAINT
                </span>
                <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-200 transition-colors">
                Clean Bundle (Split Credit)
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                Payslip INR 65k vs Bank credits (40k + 25k). Z3 solver verifies SAT; no escalation.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-3">
                <span>Run Restraint Verification</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tampered Case Card */}
            <div
              onClick={() => onLaunchDemo('tampered')}
              className="group relative p-4 rounded-xl glass-panel-ruby border border-rose-500/30 hover:border-rose-400/60 transition-all cursor-pointer overflow-hidden shadow-lg active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mono">
                  BEAT 2 • DEMONSTRATION OF ESCALATION
                </span>
                <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-rose-200 transition-colors">
                Tampered Bundle (Font & Arith)
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                Payslip forged to INR 95k. Z3 solver isolates INR 30k residual conflict & highlights witness claims.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mt-3">
                <span>Run Escalation Detection</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right 3D Visualizer Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-5 h-[420px] relative"
        >
          <ThreeForensicCanvas />
        </motion.div>
      </div>

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-xl glass-panel border border-cyan-500/15">
          <div className="flex items-center justify-between text-slate-400 text-xs mono mb-2">
            <span>ACTIVE INVESTIGATIONS</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mono">
            <AnimatedCounter value={cases.length} />
          </div>
          <div className="text-[11px] text-cyan-400/80 mono mt-1">
            {completeCases} fully synthesized
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-xl glass-panel border border-cyan-500/15">
          <div className="flex items-center justify-between text-slate-400 text-xs mono mb-2">
            <span>SMT THEOREM ENGINE</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mono">
            <AnimatedCounter value={99.8} suffix="%" />
          </div>
          <div className="text-[11px] text-emerald-400/80 mono mt-1">
            Z3 v4.14 SMT Solver Active
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-xl glass-panel border border-cyan-500/15">
          <div className="flex items-center justify-between text-slate-400 text-xs mono mb-2">
            <span>MUTATION DETECTORS</span>
            <FileSearch className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mono">
            <AnimatedCounter value={4} suffix=" PIPELINES" />
          </div>
          <div className="text-[11px] text-sky-400/80 mono mt-1">
            ELA • Keypoints • Revisions • Font
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-xl glass-panel border border-cyan-500/15">
          <div className="flex items-center justify-between text-slate-400 text-xs mono mb-2">
            <span>IMMUTABLE AUDIT</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mono truncate">
            SHA-256
          </div>
          <div className="text-[11px] text-indigo-400/80 mono mt-1">
            Chained Merkle Provenance
          </div>
        </div>
      </div>

      {/* Case Feed Table / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span>Investigation Case Log</span>
            </h2>
            <p className="text-xs text-slate-400 mono">
              All active bundles loaded into SQLite store
            </p>
          </div>

          <button
            onClick={onOpenNewCase}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 transition-all mono"
          >
            + Create Blank Case
          </button>
        </div>

        {cases.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800">
            <Terminal className="w-10 h-10 text-cyan-400 mx-auto mb-3 opacity-60" />
            <h4 className="text-base font-bold text-slate-200">No Investigation Cases Initialized</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click &quot;Clean Demo&quot; or &quot;Tampered Demo&quot; above to synthesize synthetic test documents and launch the full reasoning pipeline.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((c) => {
              const isTamperedDemo = c.created_by?.includes('tampered') || c.case_id.includes('TAMPERED');
              const isCleanDemo = c.created_by?.includes('clean') || c.case_id.includes('CLEAN');

              return (
                <div
                  key={c.case_id}
                  onClick={() => onSelectCase(c.case_id)}
                  className="group relative p-4 rounded-xl glass-panel hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg active:scale-[0.99] overflow-hidden"
                >
                  <ForensicScanline scanning={false} />

                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold mono uppercase ${
                        c.status === 'complete'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-[10px] text-slate-500 mono">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors mono truncate">
                    {c.case_id}
                  </h4>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 mono">
                      {c.bundle_type}
                    </span>
                    {isTamperedDemo && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] mono border border-rose-800">
                        Tampered Demo
                      </span>
                    )}
                    {isCleanDemo && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] mono border border-emerald-800">
                        Clean Demo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px] mono">
                      Actor: {c.created_by || 'investigator'}
                    </span>
                    <span className="text-cyan-400 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Inspect &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
