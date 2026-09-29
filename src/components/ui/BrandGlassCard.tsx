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
      <div className={`glass-card ${interactive ? 'glass-hover cursor-pointer' : ''} ${className}`}>
        {children}
      </div>
    );
  }

  // Use the new glass-brand-edge and glass-specular classes
  return (
    <div className={`glass-card glass-brand-edge glass-specular ${interactive ? 'glass-hover cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  );
}
