import React, { useState } from 'react';
import { Kicker } from '../../ui/Kicker';
import { Btn } from '../../ui/Btn';
import { Chip } from '../../ui/Chip';
import { StatusLadder } from '../../ui/StatusLadder';
import { ExternalLink } from 'lucide-react';

export interface StudioSceneProps {
  onOpenFullStudio?: () => void;
}

export const StudioScene: React.FC<StudioSceneProps> = ({ onOpenFullStudio }) => {
  const [activeToggle, setActiveToggle] = useState<'witness' | 'fields' | 'font' | 'ela'>('witness');
  const [loupeActive, setLoupeActive] = useState<boolean>(true);

  return (
    <section id="scene-3" className="relative w-full min-h-screen autopsy-grid p-6 sm:p-12 lg:p-16 flex flex-col justify-between select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#1f2733] z-20">
        <div>
          <Kicker>04 / FORENSIC INVESTIGATION WORKBENCH</Kicker>
          <div className="font-mono text-sm text-[#e8e6df] font-bold mt-1">
            CASES / <span className="text-[#ff8da0]">CASE-TAMPERED-FA106659</span> / 02_salary_slip.pdf
          </div>
        </div>

        {/* Layer Toggle Pills */}
        <div className="flex items-center gap-1.5 bg-[#151b24] p-1 rounded-xl border border-[#1f2733] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveToggle('witness')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
              activeToggle === 'witness'
                ? 'bg-[#ff4d6a] text-white shadow-[0_0_12px_rgba(255,77,106,0.4)]'
                : 'text-[#8e98a6] hover:text-[#e8e6df]'
            }`}
          >
            WITNESS
          </button>
          <button
            type="button"
            onClick={() => setActiveToggle('fields')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
              activeToggle === 'fields'
                ? 'bg-[#e9e4d4] text-[#14120d]'
                : 'text-[#8e98a6] hover:text-[#e8e6df]'
            }`}
          >
            FIELDS
          </button>
          <button
            type="button"
            onClick={() => setActiveToggle('font')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
              activeToggle === 'font'
                ? 'bg-[#e9e4d4] text-[#14120d]'
                : 'text-[#8e98a6] hover:text-[#e8e6df]'
            }`}
          >
            FONT ANOMALY
          </button>
          <button
            type="button"
            onClick={() => setActiveToggle('ela')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
              activeToggle === 'ela'
                ? 'bg-[#e9e4d4] text-[#14120d]'
                : 'text-[#8e98a6] hover:text-[#e8e6df]'
            }`}
          >
            ELA
          </button>
        </div>
      </div>

      {/* 3-Column Workbench Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-6">
        {/* Left Column: Evidence Shelf */}
        <div className="lg:col-span-3 space-y-3 bg-[#0e1218] border border-[#1f2733] rounded-[14px] p-4 h-[480px] overflow-y-auto">
          <Kicker>EVIDENCE SHELF · 4 BUNDLE FILES</Kicker>

          <div className="space-y-2 pt-2">
            {[
              { name: '01_application_form.pdf', cls: 'APPLICATION_FORM', sha: '0cce97cb', active: false },
              { name: '02_salary_slip.pdf', cls: 'SALARY_SLIP', sha: '88d7374d', active: true },
              { name: '03_bank_statement.pdf', cls: 'BANK_STATEMENT', sha: 'b587c169', active: false },
              { name: '04_employer_declaration.pdf', cls: 'EMPLOYER_DECLARATION', sha: '65a570f6', active: false },
            ].map((doc) => (
              <div
                key={doc.name}
                className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                  doc.active
                    ? 'bg-[#ff4d6a]/8 border-[#ff4d6a] text-[#e8e6df] shadow-sm'
                    : 'bg-[#151b24]/60 border-[#1f2733] text-[#8e98a6] hover:border-[#3a4757]'
                }`}
              >
                <div className="font-mono font-bold truncate">{doc.name}</div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8e98a6] mt-1.5">
                  <span className="text-[#5ce1e6]">{doc.cls}</span>
                  <span>SHA: {doc.sha}…</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: 200 DPI Specimen Viewer with Bounding Box & Precision Loupe */}
        <div className="lg:col-span-5 relative bg-[#07090c] border border-[#3a4757] rounded-[14px] p-6 h-[480px] flex items-center justify-center overflow-hidden shadow-2xl">
          {/* Document Graphic Mockup */}
          <div className="w-[320px] bg-[#e9e4d4] text-[#14120d] p-5 rounded-[6px] shadow-lg font-mono text-[11px] space-y-2 select-none relative">
            <div className="font-bold border-b border-[#14120d]/30 pb-1 text-xs">
              SALARY SLIP · NORTHSTAR TECHNOLOGIES
            </div>
            <div className="flex justify-between py-0.5">
              <span>Basic Salary</span>
              <span>₹40,000.00</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>House Rent Allowance</span>
              <span>₹25,000.00</span>
            </div>

            {/* Target Bounding Box */}
            <div
              data-loupe="true"
              onClick={() => setLoupeActive(!loupeActive)}
              className="p-2 border-2 border-[#ff4d6a] bg-[#ff4d6a]/18 rounded cursor-pointer relative group"
            >
              <div className="flex justify-between text-xs font-bold text-[#991b1b]">
                <span>Net Pay</span>
                <span style={{ fontFamily: 'Georgia, serif' }} className="text-lg italic font-extrabold">
                  ₹95,000
                </span>
              </div>
              <div className="text-[8px] font-mono text-[#991b1b] mt-0.5">
                claim · monthly_net_pay · 9500000 paise
              </div>
            </div>

            <div className="pt-2 text-[9px] text-[#5c5446]">Authorized Signatory</div>
          </div>

          {/* Interactive Loupe Circle */}
          {loupeActive && (
            <div className="absolute right-4 top-4 w-44 h-44 rounded-full border-2 border-[#5ce1e6] bg-[#0e1218]/95 shadow-[0_0_30px_rgba(92,225,230,0.3)] p-3 flex flex-col justify-between items-center text-center z-30">
              <span className="font-mono text-[9px] font-bold text-[#5ce1e6] tracking-wider uppercase">
                PRECISION LOUPE 200 DPI
              </span>
              <div className="text-2xl font-bold italic text-[#ff4d6a]" style={{ fontFamily: 'Georgia, serif' }}>
                ₹95,000
              </div>
              <div className="font-mono text-[8px] text-[#8e98a6] leading-tight">
                GLYPH RUN ≠ BASELINE<br />
                FONT OBJECT: Georgia-Italic
              </div>
            </div>
          )}
        </div>

        {/* Right Column: SMT Counterfactual Matrix & Minimal Witness */}
        <div className="lg:col-span-4 space-y-4 bg-[#0e1218] border border-[#1f2733] rounded-[14px] p-5 h-[480px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <Kicker>FINDING · SALARY CONFLICT</Kicker>
            <Chip variant="ruby" className="text-[10px] font-bold">
              POTENTIAL MANIPULATION
            </Chip>
          </div>

          {/* Status Ladder */}
          <StatusLadder activeIndex={2} />

          {/* Residual Conflict Display */}
          <div className="p-3.5 rounded-xl bg-[#ff4d6a]/10 border border-[#ff4d6a]/40 text-center">
            <span className="font-mono text-[10px] text-[#ff8da0] block uppercase tracking-wider">
              UNEXPLAINED CONFLICT RESIDUAL
            </span>
            <div className="serif-display text-4xl text-[#ff4d6a] font-bold mt-1">
              ₹30,000
            </div>
            <span className="text-[10px] text-[#8e98a6] font-mono mt-1 block">
              unexplained after 3 tested counterfactuals
            </span>
          </div>

          {/* Minimal Witness Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="font-mono text-[10px] text-[#8e98a6] uppercase tracking-wider block">
              MINIMAL CONTRADICTION WITNESS SET
            </span>
            <div className="flex flex-col gap-1.5 font-mono text-[11px]">
              <div className="p-2 rounded bg-[#151b24] border border-[#ff4d6a]/40 text-[#e8e6df] flex justify-between">
                <span>02_salary_slip.pdf [net_pay]</span>
                <span className="font-bold text-[#ff8da0]">₹95,000</span>
              </div>
              <div className="p-2 rounded bg-[#151b24] border border-[#1f2733] text-[#e8e6df] flex justify-between">
                <span>03_bank_statement.pdf [credit]</span>
                <span className="font-bold text-[#c6f432]">₹65,000</span>
              </div>
            </div>
          </div>

          <Btn
            variant="lime"
            className="w-full mt-2"
            onClick={onOpenFullStudio || (() => {
              window.location.hash = '#/studio';
            })}
          >
            Open Complete Investigation Studio &rarr;
          </Btn>
        </div>
      </div>

      {/* Bottom Strip: Cryptographic Audit Trail */}
      <div className="flex items-center justify-between pt-4 border-t border-[#1f2733] font-mono text-xs text-[#8e98a6] z-20">
        <div className="flex items-center gap-2">
          <span>AUDIT CHAIN:</span>
          <Chip variant="default" className="text-[10px]">INGEST 0cce…4be2</Chip>
          <span>&rarr;</span>
          <Chip variant="default" className="text-[10px]">EXTRACT 88d7…efb4</Chip>
          <span>&rarr;</span>
          <Chip variant="ruby" className="text-[10px]">SMT_UNSAT ₹30,000</Chip>
          <span>&rarr;</span>
          <Chip variant="lime" className="text-[10px]">MERKLE ROOT</Chip>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.hash = '#/studio';
          }}
          className="text-[#c6f432] hover:underline cursor-pointer font-bold flex items-center gap-1"
        >
          <span>Open Full Interactive Studio</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
