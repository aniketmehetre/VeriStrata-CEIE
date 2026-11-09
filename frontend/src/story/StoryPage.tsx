import React from 'react';
import { SpecimenScene } from './scenes/SpecimenScene';
import { LayersScene } from './scenes/LayersScene';
import { TrialScene } from './scenes/TrialScene';
import { StudioScene } from './scenes/StudioScene';
import { SealScene } from './scenes/SealScene';
import { StageRail } from './StageRail';
import { HashTicker } from '../ui/interactions/HashTicker';
import { PaperGrain } from '../ui/interactions/PaperGrain';
import { EvidenceCursor } from '../ui/interactions/EvidenceCursor';
import { Btn } from '../ui/Btn';
import { Shield, ExternalLink, Upload } from 'lucide-react';

export interface StoryPageProps {
  onOpenStudio?: () => void;
  onOpenDossier?: () => void;
  onUploadFiles?: (files: File[]) => void;
}

export const StoryPage: React.FC<StoryPageProps> = ({ onOpenStudio, onOpenDossier, onUploadFiles }) => {
  return (
    <div className="relative w-full bg-[#07090c] text-[#e8e6df] overflow-x-hidden select-none">
      {/* Precision Micro-Interactions */}
      <EvidenceCursor />
      <PaperGrain />

      {/* Top Floating Mini-Nav */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-[#07090c]/70 border-b border-[#1f2733]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#151b24] border border-[#3a4757] flex items-center justify-center text-[#c6f432]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-[#e8e6df] font-sans">
              VeriStrata <span className="text-[#c6f432] font-mono text-xs">CEIE</span>
            </div>
            <div className="font-mono text-[9px] text-[#8e98a6] hidden sm:block">
              THE AUTOPSY TABLE · INVESTIGATION SPECIFICATION
            </div>
          </div>
        </div>

        {/* Actions: Direct Upload + Skip to Studio */}
        <div className="flex items-center gap-3">
          {onUploadFiles && (
            <label className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#5ce1e6]/15 hover:bg-[#5ce1e6]/25 border-2 border-[#5ce1e6] text-[#5ce1e6] hover:text-white font-mono text-xs font-bold cursor-pointer transition-all shadow-[0_0_15px_rgba(92,225,230,0.35)] active:scale-95 animate-pulse">
              <Upload className="w-4 h-4" />
              <span>UPLOAD & AUTO-DOWNLOAD REPORT</span>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onUploadFiles(Array.from(e.target.files));
                  }
                }}
                className="hidden"
              />
            </label>
          )}

          <Btn
            variant="ghost"
            size="sm"
            onClick={onOpenStudio || (() => {
              window.location.hash = '#/studio';
            })}
          >
            <span>Skip to Workbench</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </Btn>
        </div>
      </header>

      {/* Persistent Vertical Stage Rail */}
      <StageRail />

      {/* Scene 1: The Specimen (Hero) */}
      <SpecimenScene
        onDissectClick={() => {
          document.getElementById('scene-1')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onCleanTwinClick={() => {
          document.getElementById('scene-2')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Cryptographic Hash Stream Ticker */}
      <HashTicker />

      {/* Scene 2: Four Layers, One Coordinate (Exploded 3D) */}
      <LayersScene />

      {/* Scene 3: The Trial (Clean vs Tampered Split) */}
      <TrialScene />

      {/* Scene 4: Case Studio Workbench */}
      <StudioScene onOpenFullStudio={onOpenStudio} />

      {/* Scene 5: The Seal & Signed Dossier */}
      <SealScene onOpenDossierModal={onOpenDossier} />

      {/* Footer */}
      <footer className="w-full bg-[#07090c] border-t border-[#1f2733] py-8 px-6 sm:px-12 text-center text-xs font-mono text-[#8e98a6]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>TraceDoc CEIE · Counterfactual Evidence Investigation Engine</div>
          <div className="flex items-center gap-4">
            <a href="#/styleguide" className="hover:text-[#c6f432] transition-colors">
              #/styleguide
            </a>
            <span>•</span>
            <a href="#/studio" className="hover:text-[#c6f432] transition-colors">
              #/studio
            </a>
            <span>•</span>
            <span>ISO/IEC 27037 · Z3 SMT</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

