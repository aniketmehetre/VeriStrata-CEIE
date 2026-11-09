import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Sparkles,
  Database,
  ArrowRight,
  Cpu,
  Layers,
  FileSearch,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import type { Case, HealthInfo } from '../types';
import { AnimatedCounter } from './ForensicScanEffect';
import { ThreeForensicCanvas } from './ThreeForensicCanvas';
import { ForensicScanline } from './ForensicScanEffect';

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
  onSelectCase,
  onLaunchDemo,
  onOpenNewCase,
}) => {
  const completeCases = cases.filter((c) => c.status === 'complete' || c.status === 'analyzed').length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-10">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hero Messaging */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 space-y-6"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-panel bg-panel border border-line text-cyan font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />
            <span>SMT THEOREM PROVER · MULTI-DOCUMENT CORRELATION</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text leading-[1.1] font-sans">
            Forensic Precision meets{' '}
            <span className="text-cyan">
              Counterfactual
            </span>{' '}
            Restraint.
          </h1>

          {/* Description */}
          <p className="text-muted text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
            VeriStrata CEIE replaces fragile heuristics with Z3 SMT Theorem Proving. It correlates
            salary slips, bank credits, and employer declarations with pixel-level forensics
            to prove or disprove financial inconsistencies without false alarms.
          </p>

          {/* Dual Action Beat Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Clean Case Card */}
            <div
              onClick={() => onLaunchDemo('clean')}
              className="group relative p-4 rounded-panel bg-panel hover:bg-panel-2 border border-lime/30 hover:border-lime/60 transition-all cursor-pointer overflow-hidden shadow-lg active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-lime uppercase tracking-wider font-mono">
                  BEAT 1 · DEMONSTRATION OF RESTRAINT
                </span>
                <Sparkles className="w-4 h-4 text-lime group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-text group-hover:text-lime transition-colors">
                Clean Bundle (Split Credit)
              </h3>
              <p className="text-xs text-muted mt-1 leading-snug">
                Payslip INR 65k vs Bank credits (40k + 25k). Z3 solver verifies SAT; no escalation.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-lime font-mono font-bold mt-3">
                <span>Run Restraint Verification</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tampered Case Card */}
            <div
              onClick={() => onLaunchDemo('tampered')}
              className="group relative p-4 rounded-panel bg-panel hover:bg-panel-2 border border-ruby/30 hover:border-ruby/60 transition-all cursor-pointer overflow-hidden shadow-lg active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-ruby-text uppercase tracking-wider font-mono">
                  BEAT 2 · DEMONSTRATION OF ESCALATION
                </span>
                <ShieldAlert className="w-4 h-4 text-ruby group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-text group-hover:text-ruby-text transition-colors">
                Tampered Bundle (Font & Arith)
              </h3>
              <p className="text-xs text-muted mt-1 leading-snug">
                Payslip tampered to INR 95k. Z3 solver isolates INR 30k residual conflict & highlights witness claims.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-ruby-text font-mono font-bold mt-3">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Card 1 */}
        <div className="p-4 rounded-panel bg-panel border border-line">
          <div className="flex items-center justify-between text-dim text-xs mb-2">
            <span>ACTIVE INVESTIGATIONS</span>
            <Layers className="w-4 h-4 text-cyan" />
          </div>
          <div className="text-3xl font-bold text-text">
            <AnimatedCounter value={cases.length} />
          </div>
          <div className="text-[11px] text-cyan mt-1">
            {completeCases} fully synthesized
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-panel bg-panel border border-line">
          <div className="flex items-center justify-between text-dim text-xs mb-2">
            <span>SMT THEOREM ENGINE</span>
            <Cpu className="w-4 h-4 text-lime" />
          </div>
          <div className="text-3xl font-bold text-text">
            <AnimatedCounter value={99.8} suffix="%" />
          </div>
          <div className="text-[11px] text-lime mt-1">
            Z3 v4.14 SMT Solver Active
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-panel bg-panel border border-line">
          <div className="flex items-center justify-between text-dim text-xs mb-2">
            <span>MUTATION DETECTORS</span>
            <FileSearch className="w-4 h-4 text-cyan" />
          </div>
          <div className="text-3xl font-bold text-text">
            <AnimatedCounter value={4} suffix=" PIPELINES" />
          </div>
          <div className="text-[11px] text-cyan mt-1">
            ELA · Keypoints · Revisions · Font
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-panel bg-panel border border-line">
          <div className="flex items-center justify-between text-dim text-xs mb-2">
            <span>IMMUTABLE AUDIT</span>
            <ShieldCheck className="w-4 h-4 text-lime" />
          </div>
          <div className="text-2xl font-bold text-text truncate">
            SHA-256
          </div>
          <div className="text-[11px] text-lime mt-1">
            Chained Merkle Provenance
          </div>
        </div>
      </div>

      {/* Case Feed Table / Grid */}
      <div className="space-y-4 font-mono">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan" />
              <span>Investigation Case Log</span>
            </h2>
            <p className="text-xs text-dim">
              All active bundles loaded into SQLite store
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNewCase}
            className="px-3 py-1.5 rounded-panel text-xs font-semibold bg-cyan/15 hover:bg-cyan/25 border border-cyan/40 text-cyan transition-all cursor-pointer"
          >
            + Create Blank Case
          </button>
        </div>

        {cases.length === 0 ? (
          <div className="p-12 text-center bg-panel rounded-panel border border-line">
            <Terminal className="w-10 h-10 text-cyan mx-auto mb-3 opacity-60" />
            <h4 className="text-base font-bold text-text">No Investigation Cases Initialized</h4>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
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
                  className="group relative p-4 rounded-panel bg-panel hover:bg-panel-2 border border-line hover:border-cyan/50 transition-all cursor-pointer shadow-lg active:scale-[0.99] overflow-hidden"
                >
                  <ForensicScanline scanning={false} />

                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'complete' || c.status === 'analyzed'
                          ? 'bg-lime/15 text-lime border border-lime/40'
                          : 'bg-amber/15 text-amber border border-amber/40'
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-[10px] text-dim">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-text group-hover:text-cyan transition-colors truncate">
                    {c.case_id}
                  </h4>

                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-ground text-[10px] text-muted border border-line">
                      {c.bundle_type}
                    </span>
                    {isTamperedDemo && (
                      <span className="px-1.5 py-0.5 rounded bg-ruby/15 text-ruby-text text-[10px] border border-ruby/40">
                        Tampered Demo
                      </span>
                    )}
                    {isCleanDemo && (
                      <span className="px-1.5 py-0.5 rounded bg-lime/15 text-lime text-[10px] border border-lime/40">
                        Clean Demo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-line text-xs">
                    <span className="text-dim text-[11px]">
                      Actor: {c.created_by || 'investigator'}
                    </span>
                    <span className="text-cyan text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
