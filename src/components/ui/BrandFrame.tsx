import React from 'react';

interface BrandFrameProps {
  children: React.ReactNode;
  variant?: 'full' | 'subtle' | 'edge';
  className?: string;
  innerClassName?: string;
  onClick?: () => void;
}

export function BrandFrame({ 
  children, 
  variant = 'subtle', 
  className = '', 
  innerClassName = '',
  onClick 
}: BrandFrameProps) {
  
  const variantStyles = {
    full: 'p-[2px] bg-brand-gradient shadow-md rounded-2xl',
    subtle: 'p-[1.5px] bg-brand-gradient shadow-sm rounded-xl',
    edge: 'border-l-[3px] border-l-brand rounded-r-xl border-t border-r border-b border-border shadow-sm'
  };

  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5' : '';

  if (variant === 'edge') {
    return (
      <div className={`glass-card overflow-hidden ${variantStyles[variant]} ${interactiveClasses} ${className}`} onClick={onClick}>
        <div className={`w-full h-full ${innerClassName}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden ${variantStyles[variant]} ${interactiveClasses} ${className}`} onClick={onClick}>
      <div className={`w-full h-full rounded-[inherit] bg-surface-warm glass-card flex flex-col ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}
