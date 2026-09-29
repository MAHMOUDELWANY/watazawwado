import React from 'react';
import { BrandLogo } from './BrandLogo';

interface BrandLoaderProps {
  size?: 'inline' | 'sm' | 'md' | 'lg' | 'page';
  text?: string;
  className?: string;
}

export function BrandLoader({ size = 'page', text, className = '' }: BrandLoaderProps) {
  const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (size === 'inline' || size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`w-5 h-5 opacity-90 ${!isReducedMotion ? "animate-pulse" : ""}`}>
          <img src="/logo.png" alt="Loading..." className="w-full h-full object-contain" />
        </div>
        {text && <span className="text-sm font-medium">{text}</span>}
      </div>
    );
  }

  const containerClasses = size === 'page' ? 'min-h-[50vh] flex-col items-center justify-center w-full' : 'flex-col items-center justify-center p-8 w-full';

  return (
    <div className={`flex ${containerClasses} ${className}`}>
      <div className="relative mb-6">
        <div 
          className="relative transition-transform" 
          style={!isReducedMotion ? { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {}}
        >
          {/* Logo */}
          <BrandLogo variant="standard" />
        </div>
      </div>
      
      {/* 4-Color Animated Progress Bar */}
      <div className="w-48 h-1.5 bg-secondary/20 rounded-full overflow-hidden mb-4 relative shadow-inner">
        <div 
          className="absolute inset-y-0 start-0 h-full rounded-full w-full loading-gradient-flow origin-left"
          style={!isReducedMotion ? { 
            background: 'linear-gradient(90deg, #C51F24, #8B4935, #D8C6AE, #087D91, #C51F24)',
            backgroundSize: '200% 100%'
          } : {
            background: 'linear-gradient(90deg, #C51F24, #087D91)',
          }}
        />
      </div>

      {text && (
        <span 
          className="text-sm text-foreground/70 font-medium tracking-wide animate-pulse" 
        >
          {text}
        </span>
      )}
    </div>
  );
}
