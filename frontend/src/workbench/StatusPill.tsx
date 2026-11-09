import React from 'react';
import { getStatusStyle } from '../lib/statusStyles';
import type { Finding } from '../types';
import { ShieldCheck, AlertTriangle, ShieldAlert, FileCheck, Clock } from 'lucide-react';

interface StatusPillProps {
  status: Finding['status'] | string | null | undefined;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  className = '',
  size = 'md',
}) => {
  const config = getStatusStyle(status);

  const IconComponent =
    config.iconName === 'ShieldAlert'
      ? ShieldAlert
      : config.iconName === 'AlertTriangle'
      ? AlertTriangle
      : config.iconName === 'FileCheck'
      ? FileCheck
      : config.iconName === 'Clock'
      ? Clock
      : ShieldCheck;

  return (
    <div
      role="status"
      aria-label={config.ariaText}
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold uppercase transition-colors ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } ${config.badgeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span className="tracking-wider">{config.label}</span>
    </div>
  );
};
