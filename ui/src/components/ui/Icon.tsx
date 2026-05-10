import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconProps {
  icon: LucideIcon;
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({ 
  icon: LucideIcon, 
  size = 20, 
  className = 'text-primary', 
  strokeWidth = 2 
}) => {
  return (
    <LucideIcon 
      size={size} 
      className={className} 
      strokeWidth={strokeWidth} 
    />
  );
};
