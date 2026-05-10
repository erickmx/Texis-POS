import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'rounded-xl px-5 h-12 transition-all duration-200 font-medium hover:shadow-ambient active:scale-[0.98]';
  const variants = {
    primary: 'bg-talavera text-white',
    secondary: 'bg-secondary-container text-white',
    ghost: 'bg-transparent border border-solid border-outline-variant hover:bg-surface-container-low',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
