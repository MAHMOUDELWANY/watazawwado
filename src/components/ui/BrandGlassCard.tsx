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
  
  if (intensity === 'none') {
    return (
      <div className={`glass-card rounded-[24px] sm:rounded-[32px] ${interactive ? 'glass-hover cursor-pointer' : ''} ${className}`}>
        {children}
      </div>
    );
  }

  const borderPadding = intensity === 'high' ? 'p-[2px]' : 'p-[1px]';

  return (
    <div className={`relative rounded-[24px] sm:rounded-[32px] overflow-hidden ${interactive ? 'group cursor-pointer glass-hover' : ''} ${className}`}>
      {/* 4-Color Gradient Border Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-interactive opacity-40 dark:opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Beige / Neutral middle layer for gradient balance */}
      <div className="absolute inset-0 bg-gradient-to-tr from-secondary/50 to-transparent opacity-50 mix-blend-overlay" />

      {/* Content Container (clips out the middle of the gradient) */}
      <div className={`relative h-full w-full ${borderPadding} bg-clip-padding`}>
        <div className="relative h-full w-full rounded-[calc(24px-1px)] sm:rounded-[calc(32px-1px)] glass-card border-none shadow-none">
          {children}
        </div>
      </div>
    </div>
  );
}
