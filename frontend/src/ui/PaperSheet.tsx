import React from 'react';

export interface PaperSheetProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const PaperSheet: React.FC<PaperSheetProps> = ({
  title = 'SALARY SLIP',
  subtitle = 'FORM 16A RECORD',
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`relative bg-[#e9e4d4] text-[#14120d] rounded-[6px] shadow-2xl p-6 sm:p-8 select-none transition-transform font-sans ${className}`}
      {...props}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#14120d] mb-4">
        <div>
          <h4 className="font-mono text-xs tracking-wider font-extrabold uppercase text-[#14120d]">
            {title}
          </h4>
          <span className="font-mono text-[10px] text-[#5c5446]">{subtitle}</span>
        </div>
        <div className="font-mono text-[10px] text-[#5c5446] text-right">
          <div>OCT-2026</div>
          <div className="font-semibold text-[#14120d]">AUTHENTIC SPECIMEN</div>
        </div>
      </div>

      {/* Body */}
      {children}
    </div>
  );
};
