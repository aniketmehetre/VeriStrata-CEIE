import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  CheckCircle,
  XCircle,
  MessageSquare,
  History,
  Send,
  Check,
} from 'lucide-react';
import type { Finding, ReviewEvent } from '../types';
import { submitReview, fetchReviewHistory } from '../api';
import { Kicker } from '../ui/Kicker';

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
  const [stampSeal, setStampSeal] = useState<'accept' | 'dismiss' | 'annotate' | null>(null);

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

      // Trigger Stamped Seal Animation
      setStampSeal(action);

      setTimeout(() => {
        setStampSeal(null);
        setReason('');
        onReviewSubmitted();
        fetchReviewHistory(finding.finding_id).then(setHistory);
      }, 1400);
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
          className="fixed inset-0 bg-ground/80 backdrop-blur-sm transition-opacity"
        />

        {/* Slide-in Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="relative w-full max-w-lg h-full bg-panel border-l border-line p-6 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-panel bg-cyan/15 border border-cyan/40 text-cyan">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text font-mono">
                    Investigator Review Action
                  </h3>
                  <p className="text-[11px] text-dim font-mono">
                    Cryptographic SHA-256 Provenance Chain
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded text-dim hover:text-text hover:bg-panel-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Finding Overview */}
            <div className="p-3.5 rounded-panel bg-panel-2 border border-line space-y-1.5">
              <Kicker>TARGET FINDING · {finding.finding_id.slice(0, 14)}…</Kicker>
              <h4 className="text-sm font-bold text-text">{finding.title}</h4>
              <p className="text-xs text-muted leading-relaxed font-sans">{finding.summary}</p>
            </div>

            {/* Review Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-text font-mono block mb-2">
                  SELECT REVIEW ACTION:
                </label>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <button
                    type="button"
                    onClick={() => setAction('accept')}
                    className={`p-2.5 rounded-panel border text-center transition-all cursor-pointer ${
                      action === 'accept'
                        ? 'bg-ruby/20 border-ruby text-ruby-text shadow-[0_0_12px_rgba(255,77,106,0.3)]'
                        : 'bg-panel-2 border-line text-dim hover:border-line-strong'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 mx-auto mb-1 text-ruby" />
                    <span className="text-[11px] font-bold block">Confirm manipulation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAction('dismiss')}
                    className={`p-2.5 rounded-panel border text-center transition-all cursor-pointer ${
                      action === 'dismiss'
                        ? 'bg-lime/20 border-lime text-lime shadow-[0_0_12px_rgba(198,244,50,0.3)]'
                        : 'bg-panel-2 border-line text-dim hover:border-line-strong'
                    }`}
                  >
                    <XCircle className="w-4 h-4 mx-auto mb-1 text-lime" />
                    <span className="text-[11px] font-bold block">Dismiss as explained</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAction('annotate')}
                    className={`p-2.5 rounded-panel border text-center transition-all cursor-pointer ${
                      action === 'annotate'
                        ? 'bg-cyan/20 border-cyan text-cyan shadow-[0_0_12px_rgba(92,225,230,0.3)]'
                        : 'bg-panel-2 border-line text-dim hover:border-line-strong'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 mx-auto mb-1 text-cyan" />
                    <span className="text-[11px] font-bold block">Annotate only</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text font-mono block mb-1">
                  OFFICER JUSTIFICATION & EVIDENCE CITATION:
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder={
                    action === 'dismiss'
                      ? 'Written justification required (e.g., split payment confirmed via alternate bank folio)...'
                      : 'Enter investigator justification notes or context...'
                  }
                  className="w-full bg-ground border border-line rounded-panel p-2.5 text-xs text-text placeholder-dim focus:outline-none focus:border-cyan font-mono resize-none"
                />
                {action === 'dismiss' && (
                  <span className="text-[10px] text-amber font-mono mt-0.5 block">
                    * Written justification is required by forensic audit standards.
                  </span>
                )}
              </div>

              {error && (
                <div className="p-2 rounded bg-ruby/15 border border-ruby text-ruby-text text-xs font-mono">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-panel bg-cyan text-ground font-mono font-bold text-xs hover:bg-cyan/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Committing to Hash Chain...' : 'Stamp Decision & Sign Merkle Block'}</span>
              </button>
            </form>

            {/* Audit History Timeline */}
            <div className="pt-4 border-t border-line space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-dim">
                <History className="w-3.5 h-3.5 text-cyan" />
                <span>Tamper-Evident History ({history.length})</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <div className="text-[11px] text-dim font-mono italic">
                    No review actions recorded yet.
                  </div>
                ) : (
                  history.map((h) => (
                    <div
                      key={h.review_id}
                      className="p-2 rounded bg-panel-2 border border-line text-[10px] font-mono space-y-0.5"
                    >
                      <div className="flex justify-between font-bold">
                        <span className={h.action === 'accept' ? 'text-ruby' : 'text-lime'}>
                          {h.action.toUpperCase()}
                        </span>
                        <span className="text-dim">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-text">{h.reason}</div>
                      <div className="text-dim truncate">PREV HASH: {h.previous_event_hash}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Stamped Seal Overlay Animation */}
          {stampSeal && (
            <motion.div
              initial={{ scale: 2.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center bg-ground/85 z-50 pointer-events-none"
            >
              <div
                className={`p-6 rounded-full border-4 ${
                  stampSeal === 'accept'
                    ? 'border-cyan text-cyan shadow-[0_0_35px_rgba(92,225,230,0.6)]'
                    : 'border-lime text-lime shadow-[0_0_35px_rgba(198,244,50,0.6)]'
                } flex flex-col items-center justify-center text-center font-mono font-bold rotate-[-12deg]`}
              >
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-inherit flex flex-col items-center justify-center p-2">
                  <Check className="w-8 h-8 mb-1" />
                  <span className="text-[9px] tracking-wider uppercase">
                    {stampSeal === 'accept' ? 'REVIEWER CONFIRMED' : 'DISMISSED / EXPLAINED'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
