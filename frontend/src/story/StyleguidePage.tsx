import React, { useState } from 'react';
import { Btn } from '../ui/Btn';
import { Chip, HashChip } from '../ui/Chip';
import { Kicker } from '../ui/Kicker';
import { MoneyText } from '../ui/MoneyText';
import { StatusLadder } from '../ui/StatusLadder';
import { PaperSheet } from '../ui/PaperSheet';
import { VerdictChip } from '../ui/VerdictChip';
import { Dialog } from '../ui/vendor/Dialog';
import { Drawer } from '../ui/vendor/Drawer';
import { Tabs } from '../ui/vendor/Tabs';
import { Accordion } from '../ui/vendor/Accordion';
import { SpotlightPanel } from '../ui/vendor/SpotlightPanel';
import { ScrambleText } from '../ui/vendor/ScrambleText';
import { AnimatedNumber } from '../ui/vendor/AnimatedNumber';
import { Tooltip } from '../ui/vendor/Tooltip';
import { ArrowLeft } from 'lucide-react';

export const StyleguidePage: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('one');

  return (
    <div className="w-full min-h-screen bg-[#07090c] text-[#e8e6df] p-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f2733] pb-4">
        <div>
          <a
            href="#/"
            className="text-xs font-mono text-[#8e98a6] hover:text-[#c6f432] flex items-center gap-1.5 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Story</span>
          </a>
          <h1 className="serif-display text-4xl text-[#e8e6df]">VeriStrata Autopsy Styleguide</h1>
          <p className="text-xs font-mono text-[#8e98a6] mt-1">
            CORE DESIGN TOKENS · PRIMITIVES · VENDOR EXTENSIONS
          </p>
        </div>
      </div>

      {/* 1. Buttons */}
      <section className="space-y-4">
        <Kicker>01 / BUTTON VARIANTS</Kicker>
        <div className="flex items-center gap-4 flex-wrap">
          <Btn variant="lime">Lime Variant (Primary)</Btn>
          <Btn variant="paper">Paper Variant (Document)</Btn>
          <Btn variant="ghost">Ghost Variant</Btn>
          <Btn variant="danger">Danger Variant</Btn>
          <Btn variant="lime" disabled>
            Disabled
          </Btn>
        </div>
      </section>

      {/* 2. Chips & Hashes */}
      <section className="space-y-4">
        <Kicker>02 / CHIPS & HASH CHIPS</Kicker>
        <div className="flex items-center gap-3 flex-wrap">
          <Chip variant="default">Default Chip</Chip>
          <Chip variant="lime">Lime Chip (SAT)</Chip>
          <Chip variant="ruby">Ruby Chip (UNSAT)</Chip>
          <Chip variant="cyan">Cyan Chip (Laser)</Chip>
          <Chip variant="amber">Amber Chip (Warning)</Chip>
          <HashChip hash="0cce97cb66b012aabee28240e99de090f3db51bc00a33f7ddcd658a79c034be2" prefix="SHA-256 " />
        </div>
      </section>

      {/* 3. Verdict Chips */}
      <section className="space-y-4">
        <Kicker>03 / VERDICT CHIPS</Kicker>
        <div className="flex items-center gap-3 flex-wrap">
          <VerdictChip verdict="SAT" />
          <VerdictChip verdict="UNSAT" />
          <VerdictChip verdict="OBSERVATION" />
          <VerdictChip verdict="POTENTIAL MANIPULATION" />
        </div>
      </section>

      {/* 4. Money Text & Animated Numbers */}
      <section className="space-y-4">
        <Kicker>04 / MONEY FORMATTING (INTEGER PAISE)</Kicker>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end bg-[#0e1218] p-6 rounded-xl border border-[#1f2733]">
          <div>
            <span className="text-[10px] font-mono text-[#8e98a6] block">6,500,000 PAISE</span>
            <MoneyText paise={6500000} size="md" variant="lime" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#8e98a6] block">3,000,000 PAISE (RESIDUAL)</span>
            <MoneyText paise={3000000} size="lg" variant="ruby" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#8e98a6] block">ANIMATED NUMBER</span>
            <span className="text-2xl font-bold font-mono text-[#c6f432]">
              <AnimatedNumber value={65000} prefix="₹" />
            </span>
          </div>
        </div>
      </section>

      {/* 5. Status Ladder & Paper Sheet */}
      <section className="space-y-4">
        <Kicker>05 / STATUS LADDER & PAPER SPECIMEN SHEET</Kicker>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <StatusLadder activeIndex={2} />
          <PaperSheet title="SALARY SLIP SPECIMEN" subtitle="NORTHSTAR TECHNOLOGIES">
            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span>Basic Salary</span>
                <span>₹40,000.00</span>
              </div>
              <div className="flex justify-between font-bold text-[#991b1b]">
                <span>Net Pay</span>
                <span>₹95,000.00</span>
              </div>
            </div>
          </PaperSheet>
        </div>
      </section>

      {/* 6. Spotlight Panel & Scramble Text */}
      <section className="space-y-4">
        <Kicker>06 / INTERACTION EFFECTS (SPOTLIGHT & SCRAMBLE)</Kicker>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SpotlightPanel className="p-6">
            <h4 className="text-base font-bold text-[#e8e6df]">Interactive Spotlight Card</h4>
            <p className="text-xs text-[#aab4c2] mt-2">
              Move your mouse over this card to see the radial cyan highlight at 8% opacity.
            </p>
          </SpotlightPanel>

          <div className="p-6 rounded-xl bg-[#0e1218] border border-[#1f2733] space-y-2">
            <h4 className="text-base font-bold text-[#e8e6df]">Scramble Text Effect</h4>
            <div className="font-mono text-sm text-[#5ce1e6]">
              <ScrambleText text="0x7a29e4d1b8c049fa982a17ef01c38e92" />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Modals & Sheets */}
      <section className="space-y-4">
        <Kicker>07 / DIALOGS & DRAWERS</Kicker>
        <div className="flex items-center gap-4">
          <Btn variant="paper" onClick={() => setDialogOpen(true)}>
            Open Dialog Modal
          </Btn>
          <Btn variant="ghost" onClick={() => setDrawerOpen(true)}>
            Open Reviewer Drawer
          </Btn>
          <Tooltip content="Tooltip details for investigator">
            <span className="text-xs font-mono text-[#5ce1e6] underline cursor-help">
              Hover for Tooltip
            </span>
          </Tooltip>
        </div>
      </section>

      {/* 8. Tabs & Accordion */}
      <section className="space-y-4 max-w-xl">
        <Kicker>08 / TABS & ACCORDION ROWS</Kicker>
        <Tabs
          activeId={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'one', label: 'PREVIEW' },
            { id: 'two', label: 'JSON TREE' },
            { id: 'three', label: 'PDF EXPORT' },
          ]}
        />

        <Accordion
          items={[
            {
              id: 'split',
              title: 'Hypothesis: split_credit',
              badge: <VerdictChip verdict="SAT" />,
              content: 'Sum of bank credit deposits (40,000 + 25,000) matches declared salary 65,000.',
            },
            {
              id: 'delay',
              title: 'Hypothesis: posting_delay',
              badge: <VerdictChip verdict="UNSAT" />,
              content: 'Extended 7-day settlement window found zero matching payroll records.',
            },
          ]}
        />
      </section>

      {/* Dialog Instance */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Sample Dossier Dialog"
        subtitle="INVESTIGATION DOSSIER SPECIFICATION"
      >
        <p className="text-xs text-[#aab4c2] leading-relaxed">
          This dialog uses the re-skinned tokens from `design-system/MASTER.md`. Press Escape or
          the close button to exit.
        </p>
      </Dialog>

      {/* Drawer Instance */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Sample Reviewer Drawer"
        subtitle="SHA-256 HASH CHAINING"
      >
        <p className="text-xs text-[#aab4c2] leading-relaxed">
          Slide-in sheet for human investigator signing. Press Escape to close.
        </p>
      </Drawer>
    </div>
  );
};
