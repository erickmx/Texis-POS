import React from 'react';

interface CardProps {
  children: React.ReactNode;
  shadow?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  shadow = false, 
  className = '', 
  as: Component = 'div' 
}) => {
  const baseStyles = 'bg-surface-container-lowest rounded-xl p-6 transition-shadow duration-300';
  const shadowStyles = shadow ? 'shadow-ambient' : '';

  return (
    <Component className={`${baseStyles} ${shadowStyles} ${className}`}>
      {children}
    </Component>
  );
};
