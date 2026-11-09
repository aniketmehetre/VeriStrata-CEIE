import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X,
  ShieldCheck,
  CheckCircle,
  XCircle,
  MessageSquare,
  History,
  Send,
} from 'lucide-react';
import type { Finding, ReviewEvent } from '../types';
import { submitReview, fetchReviewHistory } from '../api';

interface ReviewDrawerProps {
  finding: Finding | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export const ReviewDrawer: React.FC<ReviewDrawerProps> = ({
  finding,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const [action, setAction] = useState<'accept' | 'dismiss' | 'annotate'>('accept');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ReviewEvent[]>([]);

  useEffect(() => {
    if (finding && isOpen) {
      fetchReviewHistory(finding.finding_id)
        .then(setHistory)
        .catch(console.error);
    }
  }, [finding, isOpen]);

  if (!isOpen || !finding) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action === 'dismiss' && !reason.trim()) {
      setError('A written justification is mandatory when dismissing a finding.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await submitReview(
        finding.finding_id,
        action,
        reason.trim() || 'Reviewed and signed by officer.'
      );

      // Trigger celebratory confetti if accepted or reviewed
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#38bdf8', '#10b981', '#ffffff'],
      });

      setReason('');
      onReviewSubmitted();
      const updatedHistory = await fetchReviewHistory(finding.finding_id);
      setHistory(updatedHistory);
    } catch (err: any) {
      setError(err.message || 'Review submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        />

        {/* Slide-in Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="relative w-full max-w-lg h-full glass-panel-glow border-l border-cyan-500/30 p-6 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white mono">
                    Investigator Review Action
                  </h3>
                  <p className="text-[11px] text-slate-400 mono">
                    Tamper-Evident SHA-256 Hash Chain
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Finding Overview */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider mono font-semibold">
                TARGET FINDING: {finding.finding_id.slice(0, 14)}...
              </span>
              <h4 className="text-sm font-bold text-white">{finding.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{finding.summary}</p>
            </div>

            {/* Review Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 mono block mb-2">
                  SELECT REVIEW ACTION:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAction('accept')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      action === 'accept'
                        ? 'bg-rose-950/70 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                    <span className="text-[11px] font-bold block">Confirm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAction('dismiss')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      action === 'dismiss'
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <span className="text-[11px] font-bold block">Dismiss</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAction('annotate')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      action === 'annotate'
                        ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <span className="text-[11px] font-bold block">Annotate</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mono block mb-1">
                  JUSTIFICATION / AUDIT NOTE:
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter court-admissible justification notes or context..."
                  className="w-full bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-cyan-400 mono resize-none"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs mono">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 text-xs font-bold mono shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Cryptographically Signing...' : 'Commit Immutable Review Signature'}</span>
              </button>
            </form>

            {/* Cryptographic Hash Chain Audit History */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mono">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>AUDIT TRAIL CHAIN ({history.length} Events)</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((ev) => (
                  <div
                    key={ev.review_id}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-cyan-300 font-semibold">
                      <span className="uppercase">{ev.action}</span>
                      <span className="text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-300">{ev.reason}</div>
                    <div className="text-[9px] text-slate-500 truncate">
                      Chain Hash: {ev.previous_event_hash}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center mono pt-2 border-t border-slate-800">
            PROTECTED BY SHA-256 PREVIOUS-HASH LINKING
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
