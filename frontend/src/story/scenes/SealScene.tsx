import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Kicker } from '../../ui/Kicker';
import { Btn } from '../../ui/Btn';
import { Chip } from '../../ui/Chip';
import { CheckCircle, XCircle, MessageSquare, ShieldCheck, Download } from 'lucide-react';
import { shortHash } from '../../lib/format';

export interface SealSceneProps {
  onOpenDossierModal?: () => void;
}

export const SealScene: React.FC<SealSceneProps> = ({ onOpenDossierModal }) => {
  const [action, setAction] = useState<'accept' | 'dismiss' | 'annotate'>('accept');
  const [reason, setReason] = useState(
    'Audited numerical stream against bank statement and verified font substitution in PDF revision dictionary.'
  );
  const [isSealed, setIsSealed] = useState(false);
  const [shake, setShake] = useState(false);

  const prevHash = 'c6c9d6d7f5e142ee493c698fb70e7a3696466c431f7e05862891e9716f28b70e';
  const newHash = '7a29e4d1b8c049fa982a17ef01c38e9281a94bc7201948ba9e120f8c2e9140ab';

  const handleSignAndSeal = () => {
    if (reason.length < 20) return;
    setShake(true);
    setTimeout(() => setShake(false), 200);
    setIsSealed(true);
  };

  return (
    <section
      id="scene-4"
      className={`relative w-full min-h-screen autopsy-grid p-6 sm:p-12 lg:p-16 flex flex-col justify-between select-none transition-transform duration-100 ${
        shake ? 'translate-x-1 -translate-y-1' : ''
      }`}
    >
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto z-20">
        <Kicker>05 / IMMUTABLE HUMAN ACCOUNTABILITY</Kicker>
        <h2 className="serif-display text-4xl sm:text-6xl text-[#e8e6df]">
          The machine proposes.{' '}
          <span className="italic text-[#c6f432]">A human signs.</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#8e98a6] font-mono">
          ISO/IEC 27037 FORENSIC PROVENANCE · CRYPTOGRAPHIC MERKLE STAMP
        </p>
      </div>

      {/* Main Grid: Reviewer Form Left vs Stamped Dossier Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-6xl mx-auto w-full my-auto py-6 z-20">
        {/* Left Column: Reviewer Card */}
        <div className="lg:col-span-6 bg-[#0e1218] border border-[#3a4757] rounded-[14px] p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#1f2733] pb-3">
            <span className="font-mono text-xs font-bold text-[#e8e6df] uppercase">
              INVESTIGATOR SIGN & SEAL
            </span>
            <Chip variant="lime" className="text-[10px]">
              SHA-256 LINKED
            </Chip>
          </div>

          {/* Action Segmented Buttons */}
          <div>
            <label className="text-xs font-mono text-[#8e98a6] block mb-2 font-bold">
              REVIEW ACTION:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction('accept')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-sans ${
                  action === 'accept'
                    ? 'bg-[#c6f432]/15 border-[#c6f432] text-[#c6f432] font-semibold'
                    : 'bg-[#151b24] border-[#1f2733] text-[#8e98a6]'
                }`}
              >
                <CheckCircle className="w-4 h-4 mx-auto mb-1 text-[#c6f432]" />
                <span className="text-[11px] block">Confirm</span>
              </button>

              <button
                type="button"
                onClick={() => setAction('dismiss')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-sans ${
                  action === 'dismiss'
                    ? 'bg-[#ff4d6a]/15 border-[#ff4d6a] text-[#ff8da0] font-semibold'
                    : 'bg-[#151b24] border-[#1f2733] text-[#8e98a6]'
                }`}
              >
                <XCircle className="w-4 h-4 mx-auto mb-1 text-[#ff8da0]" />
                <span className="text-[11px] block">Dismiss</span>
              </button>

              <button
                type="button"
                onClick={() => setAction('annotate')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-sans ${
                  action === 'annotate'
                    ? 'bg-[#f5a524]/15 border-[#f5a524] text-[#f5a524] font-semibold'
                    : 'bg-[#151b24] border-[#1f2733] text-[#8e98a6]'
                }`}
              >
                <MessageSquare className="w-4 h-4 mx-auto mb-1 text-[#f5a524]" />
                <span className="text-[11px] block">Annotate</span>
              </button>
            </div>
          </div>

          {/* Justification Textarea with 20-char min */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono text-[#8e98a6] font-bold">
                JUSTIFICATION (REQUIRED):
              </label>
              <span
                className={`font-mono text-[10px] ${
                  reason.length >= 20 ? 'text-[#c6f432]' : 'text-[#ff4d6a]'
                }`}
              >
                {reason.length} / 20 MIN
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter investigator forensic justification..."
              className="w-full bg-[#07090c] text-xs text-[#e8e6df] font-mono border border-[#1f2733] focus:border-[#c6f432] rounded-xl p-3 focus:outline-none resize-none"
            />
          </div>

          {/* Hashes Info */}
          <div className="space-y-1.5 pt-1 text-[11px] font-mono">
            <div className="flex justify-between text-[#8e98a6]">
              <span>PREVIOUS HASH:</span>
              <span className="text-[#e8e6df]">{shortHash(prevHash)}</span>
            </div>
            <div className="flex justify-between text-[#8e98a6]">
              <span>PENDING SIGNATURE:</span>
              <span className="text-[#c6f432]">{shortHash(newHash)}</span>
            </div>
          </div>

          {/* Sign and Seal Button */}
          <Btn
            variant="lime"
            size="lg"
            className="w-full"
            disabled={reason.length < 20 || isSealed}
            onClick={handleSignAndSeal}
          >
            <ShieldCheck className="w-5 h-5 mr-1" />
            <span>{isSealed ? 'DOCUMENT SEALED & HASH-CHAINED' : 'SIGN AND SEAL DOSSIER'}</span>
          </Btn>
        </div>

        {/* Right Column: Tactile Dossier Paper with Stamped Ruby Seal */}
        <div className="lg:col-span-6 relative flex justify-center perspective-1500">
          <div
            className="relative w-[340px] sm:w-[420px] bg-[#e9e4d4] text-[#14120d] rounded-[6px] p-6 shadow-2xl font-mono text-xs select-none space-y-3"
            style={{
              transform: 'rotate(2.5deg)',
            }}
          >
            {/* Header */}
            <div className="border-b-2 border-[#14120d] pb-2 flex justify-between items-center">
              <div>
                <div className="font-extrabold text-sm tracking-wider">INVESTIGATION DOSSIER</div>
                <div className="text-[9px] text-[#5c5446]">ALIGNED WITH PRINCIPLES OF ISO/IEC 27037</div>
              </div>
              <div className="text-right text-[10px] text-[#5c5446]">
                CASE 20ACA934<br />
                OCT 2026
              </div>
            </div>

            {/* Sections 7.1 to 7.6 list */}
            <div className="space-y-2 text-[10px] text-[#3d382e] pt-1">
              <div className="flex justify-between">
                <span className="font-bold">7.1 Document Overview</span>
                <span>4 PDFS VERIFIED</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">7.2 Extracted Information</span>
                <span>28 CLAIMS STORED</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">7.3 Contextual Analysis</span>
                <span>Z3 UNSAT (₹30,000)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">7.4 Visual Forensics</span>
                <span>FONT MUTATION DETECTED</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">7.5 Evidence Traceability</span>
                <span>3 WITNESS CLAIMS</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">7.6 Summary & Limitations</span>
                <span>SHA-256 ROOT ANCHOR</span>
              </div>
            </div>

            {/* Simulated text lines */}
            <div className="space-y-1.5 pt-2 opacity-35">
              <div className="h-1.5 w-full bg-[#14120d] rounded" />
              <div className="h-1.5 w-5/6 bg-[#14120d] rounded" />
              <div className="h-1.5 w-4/6 bg-[#14120d] rounded" />
            </div>

            {/* THE CIRCULAR RUBY SEAL STAMP */}
            <AnimatePresence>
              {isSealed && (
                <motion.div
                  initial={{ scale: 2.2, opacity: 0, rotate: -25 }}
                  animate={{ scale: 1, opacity: 0.95, rotate: -14 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 300 }}
                  className="absolute right-4 bottom-8 w-44 h-44 rounded-full border-4 border-double border-[#ff4d6a] text-[#ff4d6a] p-3 flex flex-col justify-between items-center text-center shadow-xl backdrop-blur-[0.5px]"
                >
                  <span className="font-mono text-[9px] font-extrabold tracking-widest uppercase">
                    REVIEWER-CONFIRMED
                  </span>
                  <div className="serif-display text-3xl font-extrabold italic">
                    Sealed
                  </div>
                  <div className="font-mono text-[8px] tracking-wider uppercase font-bold">
                    {shortHash(newHash)} · TRACEDOC
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Export Trigger */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-[#1f2733] font-mono text-xs text-[#8e98a6] gap-4 z-20">
        <div>
          ROOT INTEGRITY: <span className="text-[#c6f432]">VERIFIED BY Z3 THEOREM ENGINE</span>
        </div>

        <Btn
          variant="paper"
          size="md"
          onClick={onOpenDossierModal || (() => {
            window.location.hash = '#/studio';
          })}
        >
          <Download className="w-4 h-4 mr-2" />
          <span>Export Full Investigation Dossier (PDF & JSON)</span>
        </Btn>
      </div>
    </section>
  );
};
