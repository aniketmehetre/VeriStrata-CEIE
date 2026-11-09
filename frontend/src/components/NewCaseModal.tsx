import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FolderPlus } from 'lucide-react';
import { createCase, uploadDocuments, startAnalysis } from '../api';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (caseId: string) => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({ isOpen, onClose, onCaseCreated }) => {
  const [bundleType, setBundleType] = useState('LOAN_APPLICATION');
  const [createdBy, setCreatedBy] = useState('investigator_01');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const c = await createCase(createdBy);
      if (files.length > 0) {
        await uploadDocuments(c.case_id, files);
        await startAnalysis(c.case_id);
      }
      onCaseCreated(c.case_id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg glass-panel-glow border border-cyan-500/30 rounded-2xl p-6 z-10 shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white mono">Initialize Investigation Case</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mono block mb-1">
                BUNDLE TYPE:
              </label>
              <select
                value={bundleType}
                onChange={(e) => setBundleType(e.target.value)}
                className="w-full bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-cyan-400 mono"
              >
                <option value="LOAN_APPLICATION">LOAN_APPLICATION (Retail / SME Lending)</option>
                <option value="INSURANCE_CLAIM">INSURANCE_CLAIM (Medical / Property)</option>
                <option value="VENDOR_INVOICE">VENDOR_INVOICE (Procurement / AP Discrepancy)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mono block mb-1">
                INVESTIGATOR CALLSIGN / ID:
              </label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                className="w-full bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-cyan-400 mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mono block mb-1">
                INGEST DOCUMENTS (OPTIONAL):
              </label>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full bg-slate-950 text-xs text-slate-400 border border-slate-800 rounded-xl p-2 focus:outline-none focus:border-cyan-400 mono file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300"
              />
              <span className="text-[10px] text-slate-500 mt-1 block mono">
                {files.length} document(s) staged for quarantine & normalisation
              </span>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 text-xs font-bold mono shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Initializing Case & Storage...' : 'Create Case & Launch Pipeline'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
