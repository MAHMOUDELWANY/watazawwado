import React from 'react';
import { BrandLogo } from './BrandLogo';

interface BrandLoaderProps {
  size?: 'inline' | 'sm' | 'md' | 'lg' | 'page';
  text?: string;
  className?: string;
}

export function BrandLoader({ size = 'md', text, className = '' }: BrandLoaderProps) {
  const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (size === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`w-5 h-5 opacity-90 ${!isReducedMotion ? "animate-pulse" : ""}`}>
          <img src="/logo.png" alt="Loading..." className="w-full h-full object-contain" />
        </div>
        {text && <span className="text-body-sm font-medium">{text}</span>}
      </div>
    );
  }

  const containerClasses = size === 'page' ? 'min-h-[50vh] flex-col items-center justify-center' : 'flex-col items-center justify-center';

  return (
    <div className={`flex gap-4 ${containerClasses} ${className}`}>
      <div className="relative">
        <div 
          className="relative transition-transform" 
          style={!isReducedMotion ? { animation: 'brandBreath 3s ease-in-out infinite' } : {}}
        >
          {/* Constrain page loaders to compact (48px-56px) so it's not giant */}
          <BrandLogo variant="compact" />
        </div>
      </div>
      {text && (
        <span 
          className="text-sm text-foreground/70 font-medium tracking-wide" 
          style={!isReducedMotion ? { animation: 'brandOpacityBreath 3s ease-in-out infinite' } : {}}
        >
          {text}
        </span>
      )}
    </div>
  );
}