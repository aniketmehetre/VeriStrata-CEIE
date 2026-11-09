import React from 'react';
import { formatPaise } from '../lib/format';

export interface KickerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Kicker: React.FC<KickerProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`kicker ${className}`} {...props}>
      {children}
    </div>
  );
};

export interface MoneyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  paise: number;
  size?: 'sm' | 'md' | 'lg' | 'giant';
  variant?: 'default' | 'lime' | 'ruby' | 'muted';
}

export const MoneyText: React.FC<MoneyTextProps> = ({
  paise,
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'text-sm font-medium',
    md: 'text-xl font-bold',
    lg: 'text-3xl font-extrabold',
    giant: 'serif-display text-7xl sm:text-9xl leading-none',
  };

  const colors = {
    default: 'text-[#e8e6df]',
    lime: 'text-[#c6f432]',
    ruby: 'text-[#ff4d6a]',
    muted: 'text-[#aab4c2]',
  };

  return (
    <span
      className={`tabular-mono tracking-tight ${sizes[size]} ${colors[variant]} ${className}`}
      {...props}
    >
      {formatPaise(paise)}
    </span>
  );
};
