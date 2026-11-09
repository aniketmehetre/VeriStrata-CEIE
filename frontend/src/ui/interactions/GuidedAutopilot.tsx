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
} from 'lucide-react';

export interface TourStep {
  id: string;
  badge: string;
  title: string;
  narration: string;
  actionHint: string;
  targetHash?: string;
  sceneId?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'hero',
    badge: 'ACT I · SCENE 01',
    title: 'The Autopsy Table & 3D Specimen',
    narration:
      'Welcome to VeriStrata CEIE. We are looking at a live 3D tilted specimen of an applicant’s salary slip resting on our forensic autopsy grid. Notice the cyan sweeping laser bar and the forged ₹95,000 net pay row. Traditional OCR extracts text; VeriStrata treats the document as physical and cryptographic evidence.',
    actionHint: 'Hover your cursor over the document to see reactive 3D parallax tilt.',
    targetHash: '#/',
    sceneId: 'scene-0',
  },
  {
    id: 'layers',
    badge: 'ACT II · SCENE 02',
    title: 'One Coordinate, Four Forensic Strata',
    narration:
      'Here the salary slip explodes into four independent forensic strata in 3D: File DOM revisions, Pixel Error Level Analysis, Typography baseline jitter, and Contextual banking records. Notice the ruby laser piercing coordinate [384, 512, 456, 542]. An alteration can deceive one layer, but cannot lie across all four.',
    actionHint: 'Click the strata filter pills (FILE, PIXEL, TYPO, CONTEXT) to isolate layers.',
    targetHash: '#/',
    sceneId: 'scene-1',
  },
  {
    id: 'trial',
    badge: 'ACT III · SCENE 03',
    title: 'The Trial: Restraint vs. Escalation',
    narration:
      'This is the heart of VeriStrata. On the left: The Clean Twin. The applicant declared ₹65k, paid via two split bank deposits (40k + 25k). Z3 SMT proves SATISFIABILITY, exercising mathematical restraint (Status: Observation, ₹0 residual). On the right: The Tampered Specimen (₹95k). All hypotheses fail (UNSAT), isolating an exact ₹30,000 residual deficit.',
    actionHint: 'Drag the split comparison slider left and right to compare SAT vs UNSAT.',
    targetHash: '#/',
    sceneId: 'scene-2',
  },
  {
    id: 'workbench-preview',
    badge: 'ACT IV · SCENE 04',
    title: 'The 200 DPI Precision Loupe',
    narration:
      'Scene 04 embeds our shared forensic workbench. Hover over the Net Pay cell to trigger the 200 DPI Precision Loupe. At 300% native magnification, we uncover inline font substitution: the tabular Helvetica run is interrupted by an injected Georgia-Italic font object, corroborated by a 1.85pt baseline jitter.',
    actionHint: 'Click the Net Pay box to lock the Precision Loupe magnification.',
    targetHash: '#/',
    sceneId: 'scene-3',
  },
  {
    id: 'seal',
    badge: 'ACT V · SCENE 05',
    title: 'Cryptographic Merkle Seal & Court Dossier',
    narration:
      'In digital forensics, statistical scores are inadmissible without human sign-off and chain of custody. Here, an officer enters written justification and stamps the decision. The double-ring seal updates our tamper-evident SHA-256 Merkle chain and compiles an ISO/IEC 27037 investigation dossier in PDF and JSON.',
    actionHint: 'Type justification notes and click "Sign and Seal Dossier".',
    targetHash: '#/',
    sceneId: 'scene-4',
  },
  {
    id: 'studio-full',
    badge: 'GRAND FINALE · STUDIO',
    title: 'The Full Investigation Darkroom & Compare Mode',
    narration:
      'Now entering the full operational workbench at #/studio. Built with docked hairline panels (Palantir darkroom architecture). The top 44px HUD streams real-time solver telemetry. Center stage offers pan and zoom (0.5x to 4x). And clicking "Contradiction Compare (C)" splits the canvas side-by-side with a live caliper line: 40k + 25k ≠ 95k!',
    actionHint: 'Press "C" or click "Contradiction Compare" in the toolbar to see the side-by-side caliper.',
    targetHash: '#/studio',
  },
];

export const GuidedAutopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const timerRef = useRef<any>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Speech synthesis narration
  const speakNarration = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Navigate to step target
  const goToStep = (index: number) => {
    const target = TOUR_STEPS[index];
    setCurrentStepIndex(index);

    if (target.targetHash && window.location.hash !== target.targetHash) {
      window.location.hash = target.targetHash;
    }

    if (target.sceneId) {
      setTimeout(() => {
        const el = document.getElementById(target.sceneId!);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 80);
    }

    if (voiceEnabled) {
      speakNarration(target.narration);
    }
  };

  // Auto-advance loop when playing
  useEffect(() => {
    if (isPlaying && isOpen) {
      timerRef.current = setTimeout(() => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          goToStep(currentStepIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, 10000); // 10s per scene
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, isOpen]);

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

  const startTour = () => {
    setIsOpen(true);
    goToStep(0);
    setIsPlaying(true);
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={startTour}
          className="fixed bottom-6 left-6 z-40 bg-gradient-to-r from-cyan/20 to-lime/20 hover:from-cyan/30 hover:to-lime/30 border border-cyan/50 text-cyan hover:text-white px-3.5 py-2 rounded-full font-mono text-xs font-bold shadow-[0_0_20px_rgba(92,225,230,0.35)] flex items-center gap-2 cursor-pointer transition-all active:scale-95 animate-pulse"
        >
          <Play className="w-3.5 h-3.5 fill-cyan text-cyan" />
          <span>AUTOPILOT TOUR</span>
        </button>
      )}

      {/* Guided Tour Modal / Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-[460px] z-50 bg-panel/95 backdrop-blur-xl border-2 border-cyan/60 rounded-panel p-5 shadow-[0_0_40px_rgba(0,0,0,0.9),0_0_20px_rgba(92,225,230,0.3)] font-mono text-xs select-none"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />
                <span className="text-[10px] text-cyan font-bold tracking-wider uppercase">
                  {step.badge} ({currentStepIndex + 1}/{TOUR_STEPS.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice toggle */}
                <button
                  type="button"
                  title={voiceEnabled ? 'Mute Voice' : 'Enable Spoken Voice Narration'}
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    if (next) speakNarration(step.narration);
                    else if (window.speechSynthesis) window.speechSynthesis.cancel();
                  }}
                  className={`p-1 rounded border transition-colors ${
                    voiceEnabled ? 'bg-cyan/20 border-cyan text-cyan' : 'border-line text-dim hover:text-text'
                  }`}
                >
                  {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Auto Play / Pause */}
                <button
                  type="button"
                  title={isPlaying ? 'Pause Auto-Advance' : 'Play Auto-Advance'}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-1 rounded border transition-colors ${
                    isPlaying ? 'bg-lime/20 border-lime text-lime' : 'border-line text-dim hover:text-text'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsPlaying(false);
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                  }}
                  className="p-1 rounded text-dim hover:text-text hover:bg-panel-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title & Narration */}
            <div className="py-3.5 space-y-2">
              <h4 className="text-sm font-bold text-text font-sans flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan" />
                <span>{step.title}</span>
              </h4>

              <p className="text-xs text-muted leading-relaxed font-sans font-normal">
                {step.narration}
              </p>

              {/* Action Hint Box */}
              <div className="p-2 rounded bg-ground border border-line text-[11px] text-cyan flex items-start gap-1.5 mt-2">
                <Crosshair className="w-3.5 h-3.5 text-cyan shrink-0 mt-0.5" />
                <span><strong className="text-text font-bold">Try this:</strong> {step.actionHint}</span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full h-1 bg-ground rounded-full overflow-hidden my-2 border border-line">
              <div
                style={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-cyan to-lime transition-all duration-300"
              />
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={currentStepIndex === 0}
                onClick={handlePrev}
                className="flex items-center gap-1 px-2.5 py-1 rounded border border-line text-dim hover:text-text disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {TOUR_STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToStep(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentStepIndex ? 'bg-cyan w-4' : 'bg-dim/40 hover:bg-dim'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-1 rounded bg-cyan text-ground font-bold hover:bg-cyan/90 cursor-pointer shadow-sm active:scale-95"
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
