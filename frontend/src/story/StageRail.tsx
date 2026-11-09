import React from 'react';
import { useActiveScene } from './scrollStore';

export interface StageRailProps {
  onSelectScene?: (index: number) => void;
}

export const StageRail: React.FC<StageRailProps> = ({ onSelectScene }) => {
  const activeScene = useActiveScene();

  const stages = [
    { num: '01', label: 'SPECIMEN' },
    { num: '02', label: 'LAYERS' },
    { num: '03', label: 'TRIAL' },
    { num: '04', label: 'STUDIO' },
    { num: '05', label: 'SEAL' },
  ];

  const handleClick = (idx: number) => {
    if (onSelectScene) {
      onSelectScene(idx);
    } else {
      const el = document.getElementById(`scene-${idx}`);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside
      aria-label="Story progress navigation"
      className="fixed right-6 sm:right-11 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-5 select-none"
    >
      {stages.map((st, idx) => {
        const isActive = activeScene === idx;

        return (
          <button
            key={st.num}
            type="button"
            onClick={() => handleClick(idx)}
            className="group flex items-center gap-3 text-left cursor-pointer focus:outline-none"
          >
            {/* Dot indicator */}
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-[#c6f432] shadow-[0_0_12px_#c6f432] scale-125'
                  : 'bg-[#3a4757] group-hover:bg-[#8e98a6]'
              }`}
            />

            {/* Label */}
            <span
              className={`font-mono text-[11px] tracking-wider transition-colors duration-200 ${
                isActive
                  ? 'text-[#c6f432] font-bold'
                  : 'text-[#8e98a6] group-hover:text-[#e8e6df]'
              }`}
            >
              {st.num} {st.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
};

