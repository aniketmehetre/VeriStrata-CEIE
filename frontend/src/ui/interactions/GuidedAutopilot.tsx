import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Crosshair,
  Eye,
  FileSearch,
} from 'lucide-react';

export interface TourStep {
  id: string;
  badge: string;
  title: string;
  narration: string;
  actionHint: string;
  targetHash?: string;
  sceneId?: string;
  targetSelector?: string;
  targetLabel?: string;
  pauseDurationMs?: number;
  onExecute?: () => void;
}

export const GuidedAutopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const stepTimerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const stepStartTimeRef = useRef<number>(0);

  const TOUR_STEPS: TourStep[] = [
    {
      id: 'hero',
      badge: 'ACT I · SPECIMEN INTAKE',
      title: '3D Tilted Autopsy Table & Net Pay Forgery',
      narration:
        'Step 1: Document Ingestion. We are looking at a live 3D tilted specimen of an applicant’s salary slip. Notice the cyan scanning laser and the highlighted Net Pay row of ₹95,000.00. While conventional OCR blindly accepts this text, VeriStrata treats the document as physical and cryptographic evidence.',
      actionHint: 'Target locked on Net Pay row: ₹95,000.00. Examining sub-pixel font boundary.',
      targetHash: '#/',
      sceneId: 'scene-0',
      targetSelector: '#scene-0',
      targetLabel: 'SPECIMEN: SALARY SLIP (CLAIMED NET PAY: ₹95,000.00)',
      pauseDurationMs: 4500,
    },
    {
      id: 'layers',
      badge: 'ACT II · MULTI-STRATA FORENSICS',
      title: 'Four Independent Strata Pierced by Ruby Laser',
      narration:
        'Step 2: 4-Strata Forensics. The salary slip explodes into four distinct glass strata in 3D: PDF DOM revision trailers (/Prev), JPEG Error Level Analysis (ELA) quantization heatmaps, font baseline jitter, and bank records. The ruby laser pierces through coordinate [384, 512, 456, 542]. An alteration cannot lie across all four strata.',
      actionHint: 'Ruby laser crosshair locked on coordinate [384, 512, 456, 542].',
      targetHash: '#/',
      sceneId: 'scene-1',
      targetSelector: '#scene-1',
      targetLabel: '4-STRATA CONVERGENCE: PDF DOM + PIXEL ELA + TYPOGRAPHY + SMT',
      pauseDurationMs: 5000,
      onExecute: () => {
        // Trigger layer isolate buttons if present
        const btn = document.querySelector('button[title*="Isolate"], button:has-text("Isolate")');
        if (btn) (btn as HTMLButtonElement).click();
      },
    },
    {
      id: 'trial',
      badge: 'ACT III · MATHEMATICAL RESTRAINT',
      title: 'The Trial: The Clean Twin vs. Tampered Specimen',
      narration:
        'Step 3: SMT Counterfactual Reasoning. Watch the interactive comparison slider. On the left: The Clean Twin. The applicant declared ₹65,000, paid across two split deposits (40k + 25k). Z3 SMT proves SATISFIABILITY—exercising Mathematical Restraint (Status: Observation, ₹0 residual). On the right: The Tampered Specimen (₹95,000). All hypotheses fail (UNSAT), proving an irreconcilable ₹30,000 residual deficit.',
      actionHint: 'Automatically sweeping comparison slider: SAT (Observation) ➔ UNSAT (Manipulation).',
      targetHash: '#/',
      sceneId: 'scene-2',
      targetSelector: '#scene-2',
      targetLabel: 'Z3 THEOREM PROVER: SPLIT-PAYMENT RESTRAINT VS. UNSAT ESCALATION',
      pauseDurationMs: 5500,
      onExecute: () => {
        // Find compare slider and animate
        const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
        if (slider) {
          slider.value = '20';
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          setTimeout(() => {
            slider.value = '80';
            slider.dispatchEvent(new Event('input', { bubbles: true }));
          }, 2000);
        }
      },
    },
    {
      id: 'studio-hud',
      badge: 'ACT IV · FORENSIC DARKROOM',
      title: 'Unified Studio Workbench & 44px Telemetry HUD',
      narration:
        'Step 4: Unified Investigation Studio. Now transitioning to #/studio. Built with docked hairline darkroom panels. The top 44px HUD displays real-time solver telemetry, sub-second latency (142ms), active specimen classification, and finding status.',
      actionHint: 'Target locked on Top HUD: Streaming Z3 solver telemetry and audit state.',
      targetHash: '#/studio',
      targetSelector: 'header',
      targetLabel: '44px PIPELINE HUD: REAL-TIME SOLVER TELEMETRY & AUDIT STATE',
      pauseDurationMs: 4000,
    },
    {
      id: 'studio-loupe',
      badge: 'ACT V · SUB-PIXEL MAGNIFICATION',
      title: '200 DPI Specimen Canvas & Live Precision Loupe',
      narration:
        'Step 5: 200 DPI Precision Loupe. Sweeping across the high-resolution specimen canvas. The circular Loupe provides 300% sub-pixel magnification, exposing inline font substitution: the tabular Helvetica run is interrupted by an injected Georgia-Italic numeral, corroborated by a 1.85pt baseline jitter.',
      actionHint: 'Hovering over Net Pay row with 300% sub-pixel Loupe magnification.',
      targetHash: '#/studio',
      targetSelector: 'main, [data-stage="canvas"], .relative.w-full.h-full',
      targetLabel: '200 DPI PRECISION LOUPE: 300% SUB-PIXEL FONT & PIXEL INSPECTION',
      pauseDurationMs: 4500,
    },
    {
      id: 'studio-compare',
      badge: 'ACT VI · CONTRADICTION PROOF',
      title: 'Contradiction Compare Mode & The Animated Caliper',
      narration:
        'Step 6: Contradiction Compare. Splitting the canvas side-by-side: Salary Slip on the left, Bank Statement on the right. Notice the animated neon Caliper Line physically connecting the declared ₹95,000 on page 1 to the actual ₹40,000 + ₹25,000 deposits on page 3. The proof is undeniable: 40k + 25k ≠ 95k (Residual: ₹30,000.00).',
      actionHint: 'Caliper measurement line bridging Salary Slip ➔ Bank Statement.',
      targetHash: '#/studio',
      targetSelector: 'button:has(svg), .font-mono',
      targetLabel: 'CONTRADICTION CALIPER LINE: ₹40,000 + ₹25,000 ≠ ₹95,000 (Δ = ₹30,000)',
      pauseDurationMs: 5500,
      onExecute: () => {
        // Trigger Compare Mode key 'c'
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
      },
    },
    {
      id: 'studio-dossier',
      badge: 'ACT VII · CRYPTOGRAPHIC DOSSIER',
      title: 'ISO/IEC 27037 Audit Trail & Double-Ring Seal',
      narration:
        'Step 7: Certified Dossier Export. Every click, zoom, and human reviewer action is cryptographically chained using SHA-256 previous-event hashing per ISO/IEC 27037. The double-ring stamped seal verifies the Merkle provenance, generating ready-to-file court dossiers in both PDF and JSON.',
      actionHint: 'Opening Cryptographic Dossier modal and stamping audit seal.',
      targetHash: '#/studio',
      targetSelector: 'header, button',
      targetLabel: 'CRYPTOGRAPHIC AUDIT CHAIN: SHA-256 MERKLE ROOT & PDF DOSSIER',
      pauseDurationMs: 4500,
      onExecute: () => {
        // Trigger Dossier key 'd'
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
      },
    },
  ];

  const step = TOUR_STEPS[currentStepIndex];

  // Auto-detect ?demo=auto in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'auto' || window.location.hash.includes('demo=auto')) {
      setTimeout(() => {
        startTour();
      }, 800);
    }
  }, []);

  // Update Spotlight Rect based on target element
  const updateSpotlight = (stepItem: TourStep) => {
    let el: HTMLElement | null = null;
    if (stepItem.sceneId) {
      el = document.getElementById(stepItem.sceneId);
    }
    if (!el && stepItem.targetSelector) {
      el = document.querySelector(stepItem.targetSelector) as HTMLElement;
    }

    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightRect({
        top: Math.max(10, rect.top + window.scrollY),
        left: Math.max(10, rect.left + window.scrollX),
        width: Math.min(window.innerWidth - 20, rect.width || 400),
        height: Math.min(window.innerHeight - 20, rect.height || 250),
      });
    } else {
      setSpotlightRect(null);
    }
  };

  // Speech synthesis narration
  const speakNarration = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Execute and navigate to step
  const goToStep = (index: number) => {
    const target = TOUR_STEPS[index];
    setCurrentStepIndex(index);
    setProgressPercent(0);

    // Route hash check
    if (target.targetHash && !window.location.hash.startsWith(target.targetHash)) {
      window.location.hash = target.targetHash;
    }

    // Scroll to scene if exists
    if (target.sceneId) {
      setTimeout(() => {
        const el = document.getElementById(target.sceneId!);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 120);
    }

    // Trigger physical in-scene actions
    setTimeout(() => {
      updateSpotlight(target);
      if (target.onExecute) {
        try {
          target.onExecute();
        } catch (e) {
          console.warn('Step onExecute:', e);
        }
      }
    }, 350);

    // Voice narration
    if (voiceEnabled) {
      speakNarration(target.narration);
    }

    // Reset countdown timer
    const duration = target.pauseDurationMs || 4500;
    stepStartTimeRef.current = Date.now();

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - stepStartTimeRef.current;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgressPercent(pct);
    }, 50);

    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (isPlaying) {
      stepTimerRef.current = setTimeout(() => {
        if (index < TOUR_STEPS.length - 1) {
          goToStep(index + 1);
        } else {
          setIsPlaying(false);
          setProgressPercent(100);
        }
      }, duration);
    }
  };

  // Auto-play state change effect
  useEffect(() => {
    if (isPlaying && isOpen) {
      const duration = step.pauseDurationMs || 4500;
      stepStartTimeRef.current = Date.now();

      stepTimerRef.current = setTimeout(() => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          goToStep(currentStepIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, duration);
    } else {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, currentStepIndex, isOpen]);

  // Keyboard shortcut listener: P
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;
        e.preventDefault();
        if (isOpen) {
          setIsPlaying(!isPlaying);
        } else {
          startTour();
        }
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsPlaying(false);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isPlaying]);

  const startTour = () => {
    setIsOpen(true);
    setIsPlaying(true);
    goToStep(0);
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      setIsOpen(false);
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  return (
    <>
      {/* 1. Floating Launch Pill (Always Visible on Screen) */}
      {!isOpen && (
        <button
          type="button"
          onClick={startTour}
          className="fixed bottom-6 left-6 z-50 bg-[#0c121e]/90 hover:bg-[#131c2e] border-2 border-[#5ce1e6] text-[#5ce1e6] hover:text-white px-4 py-2.5 rounded-full font-mono text-xs font-bold shadow-[0_0_25px_rgba(92,225,230,0.5)] flex items-center gap-2.5 cursor-pointer transition-all active:scale-95 group animate-pulse"
        >
          <div className="w-5 h-5 rounded-full bg-[#5ce1e6]/20 flex items-center justify-center border border-[#5ce1e6]/60">
            <Play className="w-3 h-3 fill-[#5ce1e6] text-[#5ce1e6] ml-0.5 group-hover:scale-110 transition-transform" />
          </div>
          <span className="tracking-wide">▶ START GUIDED LIVE DEMO</span>
          <span className="text-[10px] bg-[#5ce1e6]/20 px-1.5 py-0.5 rounded text-[#5ce1e6] border border-[#5ce1e6]/30">
            KEY: P
          </span>
        </button>
      )}

      {/* 2. Visual Spotlight & Holographic Target Highlighting Box */}
      {isOpen && (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          {/* Ambient Darkened Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300" />

          {/* Glowing Target Reticle Beacon */}
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={
              spotlightRect
                ? {
                    position: 'absolute',
                    top: Math.max(20, spotlightRect.top),
                    left: Math.max(20, spotlightRect.left),
                    width: Math.min(window.innerWidth - 40, spotlightRect.width),
                    height: Math.min(window.innerHeight - 40, spotlightRect.height),
                  }
                : undefined
            }
            className={`border-2 border-[#5ce1e6] rounded-xl shadow-[0_0_50px_rgba(92,225,230,0.4),inset_0_0_30px_rgba(92,225,230,0.15)] flex flex-col justify-between p-4 pointer-events-none animate-pulse ${
              spotlightRect
                ? ''
                : 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[960px] h-[55%]'
            }`}
          >
            {/* Corner Crosshairs */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 bg-[#090d16]/90 border border-[#5ce1e6] px-3 py-1.5 rounded text-[11px] font-mono text-[#5ce1e6] font-bold shadow-lg">
                <Crosshair className="w-3.5 h-3.5 text-[#5ce1e6] animate-spin" style={{ animationDuration: '6s' }} />
                <span>{step.targetLabel || 'ACTIVE FORENSIC TARGET FOCUS'}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#090d16]/90 border border-[#c6f432] px-3 py-1.5 rounded text-[11px] font-mono text-[#c6f432] font-bold shadow-lg">
                <Eye className="w-3.5 h-3.5" />
                <span>INSPECTOR CAMERA LOCKED</span>
              </div>
            </div>

            {/* Simulated Center Holographic Reticle */}
            <div className="self-center flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full border border-[#5ce1e6]/60 flex items-center justify-center animate-ping" style={{ animationDuration: '3s' }}>
                <div className="w-6 h-6 rounded-full bg-[#5ce1e6]/30 border border-[#5ce1e6]" />
              </div>
              <div className="bg-[#090d16]/95 border border-[#5ce1e6]/50 px-3 py-1 rounded text-[10px] font-mono text-slate-300">
                {step.actionHint}
              </div>
            </div>

            {/* Bottom Status Ticker */}
            <div className="flex justify-between items-end text-[10px] font-mono text-slate-400 bg-[#090d16]/80 p-2 rounded border border-slate-800">
              <span>COORDINATES: AUTO-CALIBRATING</span>
              <span>SMT STATUS: FORMAL VERIFICATION ACTIVE</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. Floating Director / Tour HUD Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-8 sm:w-[500px] z-50 bg-[#0b0f19]/95 backdrop-blur-2xl border-2 border-[#5ce1e6] rounded-xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.95),0_0_30px_rgba(92,225,230,0.35)] font-mono text-xs select-none"
          >
            {/* Top Bar with Step Counters & Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5ce1e6] animate-ping" />
                <span className="text-[11px] text-[#5ce1e6] font-bold tracking-wider uppercase">
                  {step.badge} ({currentStepIndex + 1}/{TOUR_STEPS.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice Narration Toggle */}
                <button
                  type="button"
                  title={voiceEnabled ? 'Mute Audio Narration' : 'Enable Spoken Voice Narration'}
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    if (next) speakNarration(step.narration);
                    else if (window.speechSynthesis) window.speechSynthesis.cancel();
                  }}
                  className={`p-1.5 rounded border transition-colors ${
                    voiceEnabled ? 'bg-[#5ce1e6]/20 border-[#5ce1e6] text-[#5ce1e6]' : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Auto Play / Pause Toggle */}
                <button
                  type="button"
                  title={isPlaying ? 'Pause Auto-Advance' : 'Resume Auto-Advance'}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-1.5 rounded border transition-colors ${
                    isPlaying ? 'bg-[#c6f432]/20 border-[#c6f432] text-[#c6f432]' : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                {/* Close Tour */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsPlaying(false);
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                  }}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step Title & Live Explanatory Text */}
            <div className="py-3.5 space-y-2">
              <h4 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5ce1e6]" />
                <span>{step.title}</span>
              </h4>

              <p className="text-slate-300 leading-relaxed font-sans text-xs bg-slate-900/60 p-2.5 rounded border border-slate-800">
                {step.narration}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-[#c6f432] bg-[#c6f432]/10 border border-[#c6f432]/30 px-2.5 py-1.5 rounded">
                <FileSearch className="w-3.5 h-3.5 text-[#c6f432] shrink-0" />
                <span className="truncate">{step.actionHint}</span>
              </div>
            </div>

            {/* Step Pause Countdown Progress Bar */}
            <div className="space-y-1.5 pt-1 pb-3">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>
                  {isPlaying ? 'PAUSING FOR DEMONSTRATION...' : 'PAUSED'}
                </span>
                <span className="text-[#5ce1e6] font-bold">
                  {isPlaying ? `Next step auto-advances (${progressPercent}%)` : 'Click Next ➔'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#5ce1e6] to-[#c6f432]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={currentStepIndex === 0}
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {/* Step indicator dots */}
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToStep(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'w-5 bg-[#5ce1e6] shadow-[0_0_8px_#5ce1e6]'
                        : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded bg-[#5ce1e6] text-[#07090c] font-bold hover:bg-[#7cf2f6] transition-all shadow-[0_0_15px_rgba(92,225,230,0.4)] active:scale-95"
              >
                <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
