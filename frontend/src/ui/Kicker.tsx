import React from 'react';

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

