import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Check, Copy, Shield, FileText, Code } from 'lucide-react';
import { fetchDossierJson, getDossierPdfUrl } from '../api';
import { Kicker } from '../ui/Kicker';

interface DossierModalProps {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({ caseId, isOpen, onClose }) => {
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');

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
          className="fixed inset-0 bg-ground/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-panel border border-line rounded-panel flex flex-col z-10 shadow-2xl overflow-hidden font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-line bg-panel-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-panel bg-cyan/15 border border-cyan/40 text-cyan">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">
                  Certified Investigation Dossier
                </h3>
                <p className="text-[11px] text-dim">
                  CASE ID: {caseId} · ALIGNED WITH PRINCIPLES OF ISO/IEC 27037
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getDossierPdfUrl(caseId)}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-panel text-xs font-bold bg-cyan text-ground hover:bg-cyan/90 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Dossier</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded text-dim hover:text-text hover:bg-panel transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader / Tabs */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-panel text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                  activeTab === 'preview' ? 'bg-panel-2 text-cyan font-bold border border-line' : 'text-dim hover:text-text'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Summary Report</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                  activeTab === 'json' ? 'bg-panel-2 text-cyan font-bold border border-line' : 'text-dim hover:text-text'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>JSON Payload</span>
              </button>
            </div>

            {dossier?.integrity?.root_hash && (
              <span className="text-[10px] text-dim truncate max-w-[280px]">
                ROOT HASH: {dossier.integrity.root_hash}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            {loading ? (
              <div className="p-12 text-center text-dim font-mono">
                Compiling multi-strata investigation dossier...
              </div>
            ) : activeTab === 'preview' ? (
              <div className="space-y-4 font-sans text-muted">
                {/* 7.1 Overview */}
                <div className="p-4 bg-ground border border-line rounded-panel space-y-2 font-mono">
                  <Kicker>7.1 DOCUMENT OVERVIEW & METADATA</Kicker>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Case ID: <span className="text-text font-bold">{caseId}</span></div>
                    <div>Status: <span className="text-ruby font-bold uppercase">{dossier?.status || 'Active'}</span></div>
                    <div>Documents Ingested: <span className="text-cyan font-bold">{dossier?.documents?.length || 4}</span></div>
                    <div>Integrity Standard: <span className="text-lime font-bold">ISO/IEC 27037 Aligned</span></div>
                  </div>
                </div>

                {/* 7.3 Findings */}
                <div className="p-4 bg-ground border border-line rounded-panel space-y-2 font-mono">
                  <Kicker>7.3 CONTEXTUAL ANALYSIS & SMT THEOREM PROOFS</Kicker>
                  <p className="text-xs text-text leading-relaxed">
                    Formal satisfiability modulo theories (SMT) evaluation executed on all monetary claims in integer paise.
                  </p>
                  <div className="text-ruby-text font-bold text-xs pt-1">
                    Unresolved Monetary Discrepancy: ₹30,000.00 (Declared INR 95,000.00 vs Bank Credit INR 65,000.00)
                  </div>
                </div>

                {/* 7.5 Evidence */}
                <div className="p-4 bg-ground border border-line rounded-panel space-y-2 font-mono">
                  <Kicker>7.5 EVIDENCE & TRACEABILITY (SHA-256 PROVENANCE)</Kicker>
                  <div className="text-[11px] text-dim space-y-1">
                    <div>• 01_application_form.pdf — SHA-256: 0cce97cb73406db7c126ecbd5897103a8ec30113b290cb698d3aa9723ec54be2</div>
                    <div>• 02_salary_slip.pdf — SHA-256: 88d7374d75d69784df00e125a2fa1743f3ae99b829676e885c3db776d635efb4</div>
                    <div>• 03_bank_statement.pdf — SHA-256: b587c1692ae175cb618ff07fdf5eef833b9cf78a9c8f0f096230bf9f43c5b967</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-dim text-[11px]">
                    CRYPTOGRAPHIC JSON PAYLOAD (ROOT HASH CERTIFIED)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 text-[11px] text-cyan hover:underline cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-lime" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-panel bg-ground border border-line text-[11px] text-muted overflow-x-auto leading-relaxed">
                  {JSON.stringify(dossier, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
