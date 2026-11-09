import React, { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { useSceneProgress, useReducedMotion } from '../../lib/motion';
import { Kicker } from '../../ui/Kicker';
import { Chip } from '../../ui/Chip';
import { StatusLadder } from '../../ui/StatusLadder';

export const LayersScene: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const progress = useSceneProgress(sceneRef);
  const reducedMotion = useReducedMotion();

  // 0.0 to 0.5: Explode planes in Z
  const z0 = useTransform(progress, [0, 0.45], [0, 0]);
  const z1 = useTransform(progress, [0, 0.45], [0, 95]);
  const z2 = useTransform(progress, [0, 0.45], [0, 190]);
  const z3 = useTransform(progress, [0, 0.45], [0, 285]);

  // Stage rotation easing
  const rotX = useTransform(progress, [0, 0.45], [20, 54]);
  const rotZ = useTransform(progress, [0, 0.45], [-10, -36]);

  // 0.45 to 0.75: Legend entries opacity
  const leg1 = useTransform(progress, [0.45, 0.55], [0.3, 1]);
  const leg2 = useTransform(progress, [0.55, 0.65], [0.3, 1]);
  const leg3 = useTransform(progress, [0.65, 0.75], [0.3, 1]);
  const leg4 = useTransform(progress, [0.75, 0.85], [0.3, 1]);

  // 0.75 to 1.0: Beam scale
  const beamScale = useTransform(progress, [0.65, 0.9], [0, 1]);
  const chipOpacity = useTransform(progress, [0.8, 0.95], [0, 1]);

  const layers = [
    { id: 'FILE', label: '01 / FILE STRUCTURE', z: z0, desc: 'Incremental revision detected in PDF trailer dictionary.' },
    { id: 'PIXEL', label: '02 / PIXEL INTEGRITY (ELA)', z: z1, desc: 'Error-level analysis residual spikes inside net-pay bounding box.' },
    { id: 'TYPOGRAPHY', label: '03 / TYPOGRAPHY', z: z2, desc: 'Georgia-Italic font glyph run departs from baseline Helvetica.' },
    { id: 'CONTEXT', label: '04 / CONTEXT (Z3 SMT)', z: z3, desc: '₹40,000 + ₹25,000 ≠ ₹95,000. All counterfactuals UNSAT.' },
  ];

  return (
    <section id="scene-1" ref={sceneRef} className="relative w-full h-[220vh] autopsy-grid">
      {/* Sticky Child */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-between p-6 sm:p-12 lg:p-16">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Narrative */}
          <div className="lg:col-span-4 space-y-5">
            <Kicker>02 / ONE COORDINATE, FOUR WITNESSES</Kicker>

            <h2 className="serif-display text-4xl sm:text-6xl text-[#e8e6df] leading-[0.98]">
              A forgery has to lie on{' '}
              <span className="italic text-[#ff4d6a]">every layer at once.</span>
            </h2>

            <p className="text-[#aab4c2] text-sm sm:text-base leading-relaxed">
              When an applicant modifies ₹65,000 to ₹95,000, they alter pixels, but they cannot
              alter the mathematical truth across banking records, font glyph metrics, and PDF
              revision dictionaries.
            </p>

            <div className="pt-2">
              <StatusLadder activeIndex={2} />
            </div>

            <motion.div style={{ opacity: chipOpacity }} className="pt-2">
              <Chip variant="ruby" className="text-xs">
                4 LAYERS AGREE · POTENTIAL MANIPULATION
              </Chip>
            </motion.div>
          </div>

          {/* Center Column: 3D Exploded CSS Planes */}
          <div className="lg:col-span-5 relative flex items-center justify-center h-[460px] perspective-1500 select-none">
            <motion.div
              style={{
                rotateX: reducedMotion ? 45 : rotX,
                rotateZ: reducedMotion ? -30 : rotZ,
              }}
              className="relative w-[300px] h-[380px] sm:w-[340px] sm:h-[420px] preserve-3d"
            >
              {layers.map((layer) => (
                <motion.div
                  key={layer.id}
                  style={{
                    z: reducedMotion ? 60 : layer.z,
                  }}
                  className="absolute inset-0 rounded-xl bg-[#0e1218]/90 border border-[#3a4757] p-5 shadow-2xl preserve-3d backdrop-blur-md"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#8e98a6] border-b border-[#1f2733] pb-2">
                    <span>{layer.label}</span>
                    <span className="text-[#5ce1e6]">BBOX 0.61 0.42</span>
                  </div>

                  {/* Faux text lines */}
                  <div className="mt-6 space-y-2.5 opacity-30">
                    <div className="h-2 w-3/4 bg-[#e8e6df] rounded" />
                    <div className="h-2 w-full bg-[#e8e6df] rounded" />
                    <div className="h-2 w-5/6 bg-[#e8e6df] rounded" />
                  </div>

                  {/* Red Witness Bounding Box on each plane */}
                  <div className="absolute right-6 top-[150px] w-28 h-10 border-2 border-[#ff4d6a] bg-[#ff4d6a]/20 rounded flex items-center justify-center shadow-[0_0_15px_rgba(255,77,106,0.3)]">
                    <span className="font-mono text-[9px] font-bold text-[#ff8da0]">
                      ₹95,000 [MUTATED]
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Ruby Cross-Layer Contradiction Laser Beam */}
              <motion.div
                style={{
                  scaleZ: reducedMotion ? 1 : beamScale,
                }}
                className="absolute right-20 top-[170px] w-[3px] h-[320px] bg-[#ff4d6a] shadow-[0_0_24px_6px_#ff4d6a] preserve-3d origin-bottom"
                style-transform="rotateX(90deg)"
              />
            </motion.div>
          </div>

          {/* Right Column: Interactive Layers Legend */}
          <div className="lg:col-span-3 space-y-3">
            {[
              { title: '04 CONTEXT (SMT)', desc: '₹40k + ₹25k cannot equal ₹95k. Z3 solver returns UNSAT with ₹30,000 residual.', op: leg4 },
              { title: '03 TYPOGRAPHY', desc: 'Georgia-Italic font glyph departs from document baseline Helvetica.', op: leg3 },
              { title: '02 PIXEL (ELA)', desc: 'Error-level analysis residual spikes 4.2x inside net pay box.', op: leg2 },
              { title: '01 FILE REVISION', desc: 'A font object not referenced elsewhere found in PDF revision stream.', op: leg1 },
            ].map((item) => (
              <motion.div
                key={item.title}
                style={{ opacity: item.op }}
                className="p-3.5 rounded-xl bg-[#0e1218] border border-[#1f2733] hover:border-[#3a4757] transition-colors"
              >
                <div className="font-mono text-xs font-bold text-[#ff8da0] tracking-wide">
                  {item.title}
                </div>
                <p className="text-xs text-[#aab4c2] mt-1 leading-snug">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

