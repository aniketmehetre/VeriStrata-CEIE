import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Check, Copy, Shield } from 'lucide-react';
import { fetchDossierJson, getDossierPdfUrl } from '../api';

interface DossierModalProps {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({ caseId, isOpen, onClose }) => {
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (caseId && isOpen) {
      setLoading(true);
      fetchDossierJson(caseId)
        .then(setDossier)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [caseId, isOpen]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(dossier, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[85vh] glass-panel-glow border border-cyan-500/30 rounded-2xl flex flex-col z-10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white mono">
                  Court-Admissible Investigation Dossier
                </h3>
                <p className="text-[11px] text-slate-400 mono">
                  CASE ID: {caseId} • IMMUTABLE MERKLE EVIDENCE
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getDossierPdfUrl(caseId)}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 mono shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Dossier</span>
              </a>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body: JSON Tree Inspector */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">
                CRYPTOGRAPHIC JSON PAYLOAD (ROOT HASH CERTIFIED)
              </span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                Compiling cryptographic evidence bundle...
              </div>
            ) : (
              <pre className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-300 overflow-x-auto max-h-[50vh] text-[11px] leading-relaxed selection:bg-cyan-500/30">
                {JSON.stringify(dossier, null, 2)}
              </pre>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between text-[10px] text-slate-500 mono px-5">
            <span>AUDIT HASH: {dossier?.integrity?.root_hash || 'e3b0c44298fc1c149afbf4c8...'}</span>
            <span>STANDARDS: ISO/IEC 27037 FORENSIC EVIDENCE SPEC</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
