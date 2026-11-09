import React from 'react';

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'lime' | 'paper' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  asAnchor?: boolean;
  href?: string;
}

export const Btn: React.FC<BtnProps> = ({
  variant = 'lime',
  size = 'md',
  className = '',
  children,
  asAnchor = false,
  href,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none font-sans active:scale-[0.98]';

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5 font-semibold',
  };

  const variants = {
    lime: 'bg-[#c6f432] text-[#07090c] hover:bg-[#d4fa55] shadow-[0_0_20px_rgba(198,244,50,0.25)] font-semibold',
    paper: 'bg-[#e9e4d4] text-[#14120d] hover:bg-[#f2efe4] border border-[#d6cfba] shadow-sm font-semibold',
    ghost: 'bg-transparent text-[#e8e6df] hover:bg-[#151b24] border border-[#1f2733] hover:border-[#3a4757]',
    danger: 'bg-[#ff4d6a]/15 text-[#ff8da0] hover:bg-[#ff4d6a]/25 border border-[#ff4d6a]/40 shadow-[0_0_15px_rgba(255,77,106,0.15)] font-semibold',
  };

  const combined = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (asAnchor && href) {
    return (
      <a href={href} className={combined}>
        {children}
      </a>
    );
  }

  return (
    <button className={combined} {...props}>
      {children}
    </button>
  );
};
