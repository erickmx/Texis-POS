import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'primary', 
  children, 
  className = '' 
}) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold tracking-wide uppercase';
  const variants = {
    primary: 'bg-primary-fixed text-primary',
    secondary: 'bg-secondary-fixed text-secondary-container',
    outline: 'border border-solid border-outline-variant text-on-surface-variant',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
