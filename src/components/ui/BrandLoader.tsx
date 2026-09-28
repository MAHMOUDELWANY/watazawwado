import React from 'react';
import { BrandLogo } from './BrandLogo';

interface BrandLoaderProps {
  size?: 'inline' | 'sm' | 'md' | 'lg' | 'page';
  text?: string;
  className?: string;
}

export function BrandLoader({ size = 'md', text, className = '' }: BrandLoaderProps) {
  if (size === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 rounded-full border-[1.5px] border-brand border-t-transparent animate-spin shrink-0" />
        {text && <span className="text-body-sm font-medium">{text}</span>}
      </div>
    );
  }

  const logoVariant = size === 'sm' ? 'compact' : size === 'lg' || size === 'page' ? 'large' : 'standard';
  const containerClasses = size === 'page' ? 'min-h-[60vh] flex-col items-center justify-center' : 'flex-col items-center justify-center';

  return (
    <div className={`flex gap-5 ${containerClasses} ${className}`}>
      <div className="relative">
        <div className="absolute -inset-4 bg-brand-gradient opacity-20 blur-2xl rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="relative animate-pulse transition-transform" style={{ animationDuration: '2.5s' }}>
          <BrandLogo variant={logoVariant} />
        </div>
      </div>
      {text && (
        <span className="text-body-sm text-foreground/70 font-medium animate-pulse tracking-wide" style={{ animationDuration: '2.5s' }}>
          {text}
        </span>
      )}
    </div>
  );
}
