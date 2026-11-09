import React, { useState } from 'react';
import { Kicker } from '../../ui/Kicker';
import { VerdictChip } from '../../ui/VerdictChip';
import { Check, X, MoveHorizontal } from 'lucide-react';
import { AnimatedNumber } from '../../ui/vendor/AnimatedNumber';

export interface TrialSceneProps {
  cleanResidual?: number;
  tamperedResidual?: number;
}

export const TrialScene: React.FC<TrialSceneProps> = ({
  cleanResidual = 0,
  tamperedResidual = 3000000, // 30,000 INR in paise
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(10, Math.min(90, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPos((prev) => Math.max(10, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPos((prev) => Math.min(90, prev + 5));
    } else if (e.key === 'Home') {
      setSliderPos(15);
    } else if (e.key === 'End') {
      setSliderPos(85);
    }
  };

  return (
    <section
      id="scene-2"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerMove={handlePointerMove}
      className="relative w-full min-h-screen autopsy-grid flex flex-col justify-between p-6 sm:p-12 lg:p-16 select-none overflow-hidden"
    >
      {/* Title Header */}
      <div className="text-center space-y-2 max-w-3xl mx-auto z-20">
        <Kicker>03 / THE TRIAL: RESTRAINT VS ESCALATION</Kicker>
        <h2 className="serif-display text-4xl sm:text-6xl text-[#e8e6df]">
          Same engine.{' '}
          <span className="italic text-[#ff4d6a]">Opposite verdicts.</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#8e98a6] font-mono">
          DRAG THE FORENSIC SLIDER TO COMPARE RESTORATIVE RESTRAINT AGAINST MATHEMATICAL CONTRADICTION
        </p>
      </div>

      {/* Main Split Compare Canvas */}
      <div className="relative w-full max-w-6xl mx-auto h-[540px] sm:h-[580px] rounded-[14px] border border-[#3a4757] overflow-hidden my-auto shadow-2xl bg-[#07090c]">
        {/* LEFT HALF: CLEAN BUNDLE (LIME TINT) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden bg-gradient-to-br from-[#c6f432]/8 via-[#0e1218] to-[#07090c] p-6 sm:p-10 flex flex-col justify-between"
          style={{ width: `${sliderPos}%` }}
        >
          <div className="space-y-4 max-w-md min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="kicker text-[#c6f432]">CLEAN BUNDLE · BEAT 1</span>
              <VerdictChip verdict="SAT" />
            </div>

            {/* Arithmetic Equation */}
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#e8e6df] pt-2">
              <span>₹40,000 + ₹25,000</span>
              <span className="text-[#c6f432] block sm:inline sm:ml-2">= ₹65,000</span>
            </div>

            {/* Hypothesis Checklist */}
            <div className="space-y-2 pt-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#c6f432] font-semibold">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>split_credit: SUPPORTED</span>
              </div>
              <div className="flex items-center gap-2 text-[#8e98a6]">
                <span className="w-4 h-4 text-center">—</span>
                <span>posting_delay: not needed</span>
              </div>
              <div className="flex items-center gap-2 text-[#8e98a6]">
                <span className="w-4 h-4 text-center">—</span>
                <span>gross_net_confusion: not needed</span>
              </div>
            </div>
          </div>

          {/* Giant ₹0 Residual */}
          <div className="space-y-1 min-w-[280px]">
            <div className="text-[10px] font-mono text-[#8e98a6] uppercase tracking-wider">
              UNEXPLAINED RESIDUAL
            </div>
            <div className="serif-display text-6xl sm:text-8xl text-[#c6f432] leading-none">
              <AnimatedNumber value={cleanResidual / 100} prefix="₹" />
            </div>
            <div className="pt-3">
              <VerdictChip verdict="OBSERVATION" />
            </div>
          </div>
        </div>

        {/* RIGHT HALF: TAMPERED BUNDLE (RUBY TINT) */}
        <div
          className="absolute inset-y-0 right-0 overflow-hidden bg-gradient-to-bl from-[#ff4d6a]/15 via-[#0e1218] to-[#07090c] p-6 sm:p-10 flex flex-col justify-between items-end text-right"
          style={{ width: `${100 - sliderPos}%` }}
        >
          <div className="space-y-4 max-w-md min-w-[280px]">
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <VerdictChip verdict="UNSAT" />
              <span className="kicker text-[#ff8da0]">TAMPERED BUNDLE · BEAT 2</span>
            </div>

            {/* Arithmetic Equation */}
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#e8e6df] pt-2">
              <span>₹40,000 + ₹25,000</span>
              <span className="text-[#ff4d6a] block sm:inline sm:ml-2">≠ ₹95,000</span>
            </div>

            {/* Hypothesis Checklist */}
            <div className="space-y-2 pt-2 text-xs font-mono">
              <div className="flex items-center justify-end gap-2 text-[#ff8da0] font-semibold line-through">
                <span>split_credit: REJECTED</span>
                <X className="w-4 h-4 stroke-[3] text-[#ff4d6a]" />
              </div>
              <div className="flex items-center justify-end gap-2 text-[#ff8da0] font-semibold line-through">
                <span>posting_delay: REJECTED</span>
                <X className="w-4 h-4 stroke-[3] text-[#ff4d6a]" />
              </div>
              <div className="flex items-center justify-end gap-2 text-[#ff8da0] font-semibold line-through">
                <span>gross_net_confusion: REJECTED</span>
                <X className="w-4 h-4 stroke-[3] text-[#ff4d6a]" />
              </div>
            </div>
          </div>

          {/* Giant ₹30,000 Residual */}
          <div className="space-y-1 min-w-[280px]">
            <div className="text-[10px] font-mono text-[#ff8da0] uppercase tracking-wider">
              UNEXPLAINED RESIDUAL CONFLICT
            </div>
            <div className="serif-display text-6xl sm:text-8xl text-[#ff4d6a] leading-none">
              <AnimatedNumber value={tamperedResidual / 100} prefix="₹" />
            </div>
            <div className="pt-3 flex justify-end">
              <VerdictChip verdict="POTENTIAL MANIPULATION" />
            </div>
          </div>
        </div>

        {/* DRAGGABLE DIVIDER & SLIDER GRIP */}
        <div
          style={{ left: `${sliderPos}%` }}
          className="absolute inset-y-0 w-0.5 bg-[#e8e6df] z-30 cursor-ew-resize flex items-center justify-center -translate-x-1/2"
        >
          <button
            type="button"
            role="slider"
            aria-valuenow={Math.round(sliderPos)}
            aria-label="Compare Clean vs Tampered bundle"
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            className="w-12 h-12 rounded-full bg-[#151b24] border-2 border-[#e8e6df] text-[#e8e6df] hover:border-[#c6f432] hover:text-[#c6f432] flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.8)] cursor-ew-resize transition-transform hover:scale-110 active:scale-95"
          >
            <MoveHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs font-mono text-[#8e98a6] pt-4">
        Z3 SMT FORMULA: (c1 + c2 == S_declared) · PAIRWISE VERIFIED IN INTEGER PAISE
      </div>
    </section>
  );
};
