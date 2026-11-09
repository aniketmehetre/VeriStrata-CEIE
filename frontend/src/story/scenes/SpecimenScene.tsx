import React, { useRef, useState, useEffect } from 'react';
import { Kicker } from '../../ui/Kicker';
import { Btn } from '../../ui/Btn';
import { HashChip, Chip } from '../../ui/Chip';
import { PaperSheet } from '../../ui/PaperSheet';
import { MagneticButton } from '../../ui/interactions/MagneticButton';
import { ArrowDown, Cpu, AlertTriangle } from 'lucide-react';
import { useReducedMotion } from '../../lib/motion';

export interface SpecimenSceneProps {
  onDissectClick?: () => void;
  onCleanTwinClick?: () => void;
}

export const SpecimenScene: React.FC<SpecimenSceneProps> = ({
  onDissectClick,
  onCleanTwinClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      setTilt({ x: dy * -6, y: dx * 6 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reducedMotion]);

  return (
    <section
      id="scene-0"
      ref={containerRef}
      className="relative w-full min-h-screen autopsy-grid overflow-hidden flex flex-col justify-between p-6 sm:p-12 lg:p-16 select-none"
    >
      {/* Background Ambient Glows */}
      <div
        className="pointer-events-none absolute w-[760px] h-[640px] rounded-full blur-[140px] opacity-25"
        style={{
          top: '30%',
          right: '5%',
          background: 'radial-gradient(circle, #ff4d6a 0%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-10 bottom-10 left-10"
        style={{
          background: 'radial-gradient(circle, #5ce1e6 0%, transparent 70%)',
        }}
      />

      {/* Main Grid Content */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto">
        {/* Left Column: Headline & Sub-copy */}
        <div className="lg:col-span-7 space-y-6 max-w-2xl">
          <Kicker>EVIDENCE-FIRST DOCUMENT FORENSICS</Kicker>

          <h1 className="serif-display text-5xl sm:text-7xl lg:text-[96px] leading-[0.94] text-[#e8e6df] tracking-tight">
            Don&apos;t trust the pixels.{' '}
            <span className="italic text-[#ff4d6a] block sm:inline">Cross-examine them.</span>
          </h1>

          <p className="text-[#aab4c2] text-lg sm:text-xl font-sans leading-relaxed max-w-xl">
            VeriStrata tests legitimate hypotheses before raising a single alarm. One forged
            salary slip is dissected across pixel, typography, and mathematical layers
            using Z3 SMT theorem proving.
          </p>

          <div className="flex items-center gap-4 pt-2 flex-wrap">
            <MagneticButton>
              <Btn
                variant="paper"
                size="lg"
                onClick={onDissectClick || (() => {
                  document.getElementById('scene-1')?.scrollIntoView({ behavior: 'smooth' });
                })}
              >
                Dissect the forged slip
              </Btn>
            </MagneticButton>

            <Btn
              variant="ghost"
              size="lg"
              onClick={onCleanTwinClick || (() => {
                document.getElementById('scene-2')?.scrollIntoView({ behavior: 'smooth' });
              })}
            >
              See the clean twin
            </Btn>
          </div>
        </div>

        {/* Right Column: Specimen Slip (The Forgery) */}
        <div className="lg:col-span-5 relative flex justify-center perspective-1600 py-6">
          {/* Floating Chips around Specimen */}
          <div className="absolute -top-6 left-0 z-30 hidden sm:block">
            <HashChip hash="0cce97cb66b012aabee28240e99de090f3db51bc00a33f7ddcd658a79c034be2" prefix="SHA-256 " />
          </div>

          <div className="absolute top-1/2 -right-4 z-30 hidden sm:block">
            <Chip variant="ruby" className="text-[11px]">
              <AlertTriangle className="w-3 h-3 text-[#ff4d6a]" />
              <span>FONT OBJECT ≠ BASELINE</span>
            </Chip>
          </div>

          <div className="absolute -bottom-8 left-6 z-30 hidden sm:block">
            <Chip variant="lime" className="text-[11px]">
              <Cpu className="w-3 h-3 text-[#c6f432]" />
              <span>z3 · 40,000 + 25,000 ≠ 95,000</span>
            </Chip>
          </div>

          {/* 3D Tilted Paper Specimen with Ghost Sheets */}
          <div
            className="relative preserve-3d transition-transform duration-200 ease-out"
            style={{
              transform: reducedMotion
                ? 'none'
                : `rotateY(${-18 + tilt.y}deg) rotateX(${6 + tilt.x}deg) rotateZ(-3deg)`,
            }}
          >
            {/* Ghost Sheet 2 (Deepest) */}
            <div
              className="absolute inset-0 bg-[#0e1218] border border-[#3a4757] rounded-[6px] opacity-35"
              style={{ transform: 'translateZ(-120px)' }}
            />

            {/* Ghost Sheet 1 (Middle) */}
            <div
              className="absolute inset-0 bg-[#0e1218] border border-[#3a4757] rounded-[6px] opacity-55"
              style={{ transform: 'translateZ(-60px)' }}
            />

            {/* Foreground Real Specimen Sheet */}
            <PaperSheet
              title="SALARY SLIP · NORTHSTAR TECHNOLOGIES"
              subtitle="EMPLOYEE: ROHAN MEHTA · PAN: ABCDE1234F"
              className="w-[340px] sm:w-[420px] shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_80px_rgba(255,77,106,0.2)]"
            >
              {/* Sweeping Cyan Laser */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[6px]">
                <div
                  className="animate-laser absolute left-0 right-0 h-[2px] bg-[#5ce1e6] shadow-[0_0_24px_#5ce1e6]"
                />
              </div>

              {/* Rows */}
              <div className="space-y-3 font-mono text-xs text-[#14120d]">
                <div className="flex justify-between py-1 border-b border-[#14120d]/20">
                  <span className="font-medium">Basic Salary</span>
                  <span className="font-bold">₹40,000.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#14120d]/20">
                  <span className="font-medium">House Rent Allowance</span>
                  <span className="font-bold">₹25,000.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#14120d]/20">
                  <span className="font-medium">Gross Remuneration</span>
                  <span className="font-bold">₹65,000.00</span>
                </div>

                {/* Forged Row with Font Anomaly */}
                <div className="mt-4 p-3 rounded bg-[#ff4d6a]/12 border-2 border-[#ff4d6a] relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold uppercase text-[10px] text-[#991b1b] block">
                        Net Take-Home Pay
                      </span>
                      <span className="text-[9px] text-[#991b1b]">bbox 0.61 0.42 0.82 0.47</span>
                    </div>

                    {/* Mismatched Georgia Italic Font */}
                    <span
                      style={{ fontFamily: 'Georgia, serif' }}
                      className="text-3xl font-bold italic text-[#991b1b] tracking-wide"
                    >
                      ₹95,000
                    </span>
                  </div>

                  <div className="mt-1 text-[9px] font-mono text-[#991b1b] font-semibold">
                    [!] Font Substitution Detected: Georgia-Italic departs from document baseline
                  </div>
                </div>

                {/* Signature Squiggle */}
                <div className="pt-4 flex items-center justify-between">
                  <div className="text-[10px] text-[#5c5446]">Authorized Signatory</div>
                  <svg className="w-24 h-8 text-[#14120d]" viewBox="0 0 100 30" fill="none" stroke="currentColor">
                    <path d="M5 20 Q 25 5, 45 22 T 85 10 T 95 25" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </PaperSheet>
          </div>
        </div>
      </div>

      {/* Bottom Kicker Bar */}
      <div className="relative z-10 flex items-center justify-between pt-8 border-t border-[#1f2733]/60 text-xs">
        <Kicker className="flex items-center gap-2">
          <ArrowDown className="w-3.5 h-3.5 text-[#c6f432] animate-bounce" />
          <span>SCROLL TO DISSECT THE EVIDENCE</span>
        </Kicker>

        <div className="font-mono text-[11px] text-[#8e98a6] hidden sm:block">
          Z3 SMT THEOREM PROVER · SHA-256 MERKLE ANCHOR
        </div>
      </div>
    </section>
  );
};
