import React from 'react';

interface BrandGlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'high' | 'subtle' | 'none';
  interactive?: boolean;
}

export function BrandGlassCard({ 
  children, 
  className = '', 
  intensity = 'subtle',
  interactive = false
}: BrandGlassCardProps) {
  
  // High intensity means thicker border and brighter gradient
  // Subtle means thinner border
  // None means standard glass card without the four-color frame
  
  const baseClasses = `
    relative overflow-hidden rounded-[24px] sm:rounded-[32px]
    bg-surface/80 dark:bg-surface/70
    backdrop-blur-xl saturate-150
    shadow-[0_8px_32px_rgba(0,0,0,0.04)]
    dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]
    transition-all duration-300
    ${interactive ? 'hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:scale-[0.98]' : ''}
  `;

  if (intensity === 'none') {
    return (
      <div className={`${baseClasses} border border-border/50 ${className}`}>
        {children}
      </div>
    );
  }

  const borderPadding = intensity === 'high' ? 'p-[2px]' : 'p-[1px]';

  return (
    <div className={`relative rounded-[24px] sm:rounded-[32px] overflow-hidden ${interactive ? 'group' : ''} ${className}`}>
      {/* 4-Color Gradient Border Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-interactive opacity-40 dark:opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Beige / Neutral middle layer for gradient balance */}
      <div className="absolute inset-0 bg-gradient-to-tr from-secondary/50 to-transparent opacity-50 mix-blend-overlay" />

      {/* Content Container (clips out the middle of the gradient) */}
      <div className={`relative h-full w-full ${baseClasses} ${borderPadding} bg-clip-padding`}>
        <div className="relative h-full w-full rounded-[calc(24px-1px)] sm:rounded-[calc(32px-1px)] bg-surface/90 dark:bg-surface/80 backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
