import React from 'react';
import { BrandLogo } from './BrandLogo';

export interface BrandSpinnerProps {
  /** Size in pixels or preset alias */
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
  /** Whether to show the central micro-logo (defaults to true for md/lg, false for xs/sm if space is tight) */
  showLogo?: boolean;
  className?: string;
}

/**
 * Micro 4-Color Brand Spinner
 * Replaces generic single-color spinning circles (like Loader2) across buttons,
 * input fields, badges, and micro-interactions with an artisanal 4-color animated emblem.
 */
export function BrandSpinner({
  size = 'sm',
  showLogo,
  className = '',
}: BrandSpinnerProps) {
  // Map preset sizes to pixel dimensions
  const dimension = typeof size === 'number'
    ? size
    : size === 'xs'
    ? 16
    : size === 'sm'
    ? 22
    : size === 'md'
    ? 32
    : 44;

  const displayLogo = showLogo !== undefined ? showLogo : dimension >= 24;

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {/* 4-Color Rotating Conic Ring */}
      <div 
        className="absolute inset-0 rounded-full animate-brand-spin-fast p-[2px]"
        style={{
          background: 'conic-gradient(from 0deg, #C51F24 0%, #8B4935 25%, #D8C6AE 50%, #087D91 75%, #C51F24 100%)',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #fff calc(100% - 2px))',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #fff calc(100% - 2px))',
        }}
      />

      {/* 4 Orbital Light Nodes (Crimson, Terracotta, Sand Gold, Teal) */}
      <div className="absolute inset-0 rounded-full animate-brand-spin-fast pointer-events-none">
        {/* Node 1: Crimson Top */}
        <span 
          className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-full shadow-xs"
          style={{ 
            width: Math.max(3, Math.round(dimension * 0.16)), 
            height: Math.max(3, Math.round(dimension * 0.16)),
            backgroundColor: '#C51F24',
            boxShadow: '0 0 6px #C51F24'
          }} 
        />
        {/* Node 2: Terracotta Right */}
        <span 
          className="absolute top-1/2 -right-0.5 -translate-y-1/2 rounded-full shadow-xs"
          style={{ 
            width: Math.max(3, Math.round(dimension * 0.16)), 
            height: Math.max(3, Math.round(dimension * 0.16)),
            backgroundColor: '#8B4935',
            boxShadow: '0 0 6px #8B4935'
          }} 
        />
        {/* Node 3: Sand Gold Bottom */}
        <span 
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full shadow-xs"
          style={{ 
            width: Math.max(3, Math.round(dimension * 0.16)), 
            height: Math.max(3, Math.round(dimension * 0.16)),
            backgroundColor: '#D8C6AE',
            boxShadow: '0 0 6px #D8C6AE'
          }} 
        />
        {/* Node 4: Teal Left */}
        <span 
          className="absolute top-1/2 -left-0.5 -translate-y-1/2 rounded-full shadow-xs"
          style={{ 
            width: Math.max(3, Math.round(dimension * 0.16)), 
            height: Math.max(3, Math.round(dimension * 0.16)),
            backgroundColor: '#087D91',
            boxShadow: '0 0 6px #087D91'
          }} 
        />
      </div>

      {/* Center Micro Logo or Golden Geometric Core */}
      {displayLogo ? (
        <div 
          className="relative rounded-full bg-[#FAF7F2] dark:bg-[#EDE7DC] flex items-center justify-center overflow-hidden shadow-2xs"
          style={{ width: dimension * 0.65, height: dimension * 0.65 }}
        >
          <img
            src="/logo.png"
            alt="Watazawwado"
            className="w-full h-full object-contain p-[1px]"
          />
        </div>
      ) : (
        <div 
          className="w-1.5 h-1.5 rounded-full bg-accent/80" 
        />
      )}
    </div>
  );
}

export interface BrandLoaderProps {
  /** Size tier: micro (inline/xs/sm), medium, large, full page, or fullscreen overlay */
  size?: 'inline' | 'xs' | 'sm' | 'md' | 'lg' | 'page' | 'fullscreen';
  /** Primary status message */
  text?: string;
  /** Secondary subtitle or helper text */
  subtext?: string;
  /** Show the 4-colored animated progress bar */
  showProgressBar?: boolean;
  className?: string;
}

/**
 * Premium Brand 4-Color Motion Graphic Loader
 *
 * Infused with the 4 architectural colors of Watazawwado:
 * 1. Andalusian Crimson (#C51F24)
 * 2. Glazed Zellij Teal (#087D91)
 * 3. Cedar Terracotta (#8B4935)
 * 4. Parchment Sand Gold (#D8C6AE)
 *
 * Features an Islamic astrolabe celestial orbit, illuminated emblem sanctuary,
 * specular light sweep, and harmonized multi-color progress indicators.
 */
export function BrandLoader({
  size = 'page',
  text,
  subtext,
  showProgressBar = true,
  className = '',
}: BrandLoaderProps) {
  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. INLINE / XS: For buttons, search inputs, badges, small table cells
  if (size === 'inline' || size === 'xs') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <BrandSpinner size={size === 'xs' ? 'xs' : 'sm'} />
        {text && <span className="text-xs sm:text-sm font-medium text-foreground/80">{text}</span>}
      </div>
    );
  }

  // 2. SM: For card actions, sub-panels, dropdowns
  if (size === 'sm') {
    return (
      <div className={`flex flex-col items-center justify-center p-4 gap-2 ${className}`}>
        <BrandSpinner size="md" showLogo />
        {text && (
          <span className="text-xs font-semibold text-muted-foreground animate-pulse tracking-wide">
            {text}
          </span>
        )}
      </div>
    );
  }

  // Container styling based on size
  const containerClasses =
    size === 'fullscreen'
      ? 'fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex flex-col items-center justify-center p-6'
      : size === 'page'
      ? 'min-h-[50vh] flex flex-col items-center justify-center p-6 sm:p-10 w-full'
      : size === 'lg'
      ? 'py-12 px-6 flex flex-col items-center justify-center w-full'
      : 'py-8 px-4 flex flex-col items-center justify-center w-full'; // md

  const graphicScale = size === 'md' ? 'scale-75 sm:scale-85' : 'scale-95 sm:scale-100';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${containerClasses} ${className}`}
    >
      {/* ─── MASTER MOTION GRAPHIC COMPONENT ───────────────────────────── */}
      <div className={`relative flex items-center justify-center mb-6 select-none ${graphicScale}`}>
        
        {/* 1. Luminous 4-Color Ambient Aura (Glow behind the astrolabe) */}
        {!isReducedMotion && (
          <div
            className="absolute w-44 h-44 rounded-full pointer-events-none animate-brand-aura"
            style={{
              background: 'radial-gradient(circle, rgba(8,125,145,0.25) 0%, rgba(197,31,36,0.2) 35%, rgba(139,73,53,0.15) 70%, transparent 100%)',
            }}
          />
        )}

        {/* 2. Celestial Astrolabe SVG Orbital Graphic */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          
          {/* Astrolabe SVG Ring with 4-Color Flowing Arcs */}
          <svg
            className={`w-full h-full ${!isReducedMotion ? 'animate-brand-spin' : ''}`}
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Four Gradients for the 4 Arcs */}
              <linearGradient id="arc-crimson" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C51F24" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#C51F24" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="arc-terracotta" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B4935" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#8B4935" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="arc-sand" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D8C6AE" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#D8C6AE" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="arc-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#087D91" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#087D91" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Outer Subtle Astrolabe Latitude Guides (Geometric Compass) */}
            <circle
              cx="80"
              cy="80"
              r="75"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3 6"
              className="text-border opacity-60"
            />
            <circle
              cx="80"
              cy="80"
              r="68"
              stroke="currentColor"
              strokeWidth="0.75"
              className="text-border opacity-40"
            />

            {/* 4 Colored Orbital Quadrant Arcs (The Four Pillars) */}
            {/* Arc 1: Andalusian Crimson (0° to 70°) */}
            <path
              d="M 80,8 A 72,72 0 0,1 146,55"
              stroke="url(#arc-crimson)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Arc 2: Cedar Terracotta (90° to 160°) */}
            <path
              d="M 152,80 A 72,72 0 0,1 105,146"
              stroke="url(#arc-terracotta)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Arc 3: Parchment Sand Gold (180° to 250°) */}
            <path
              d="M 80,152 A 72,72 0 0,1 14,105"
              stroke="url(#arc-sand)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Arc 4: Glazed Zellij Teal (270° to 340°) */}
            <path
              d="M 8,80 A 72,72 0 0,1 55,14"
              stroke="url(#arc-teal)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* 4 Glowing Celestial Gem Nodes */}
            <circle cx="146" cy="55" r="4" fill="#C51F24" className="drop-shadow-[0_0_6px_#C51F24]" />
            <circle cx="105" cy="146" r="4" fill="#8B4935" className="drop-shadow-[0_0_6px_#8B4935]" />
            <circle cx="14" cy="105" r="4" fill="#D8C6AE" className="drop-shadow-[0_0_6px_#D8C6AE]" />
            <circle cx="55" cy="14" r="4" fill="#087D91" className="drop-shadow-[0_0_6px_#087D91]" />
          </svg>

          {/* Counter-Rotating Inner Delicate Geometric Orbit */}
          <div 
            className={`absolute inset-3.5 rounded-full pointer-events-none ${
              !isReducedMotion ? 'animate-brand-spin-reverse' : ''
            }`}
          >
            {/* 4 Cardinal Diamond Nodes */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#C51F24]/80 rounded-[1px]" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-[#8B4935]/80 rounded-[1px]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#D8C6AE]/80 rounded-[1px]" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-[#087D91]/80 rounded-[1px]" />
          </div>

          {/* 3. The Central Brand Medallion (Breathing Sanctuary) */}
          <div 
            className={`absolute z-10 flex items-center justify-center ${
              !isReducedMotion ? 'animate-brand-breathe' : ''
            }`}
          >
            {/* Outer 4-Color Gradient Border Ring */}
            <div 
              className="relative p-[2.5px] rounded-2xl sm:rounded-3xl shadow-md overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #C51F24 0%, #8B4935 35%, #D8C6AE 70%, #087D91 100%)',
              }}
            >
              {/* Inner Ivory Silk Plate */}
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-[14px] sm:rounded-[22px] bg-[#FAF7F2] dark:bg-[#EDE7DC] flex items-center justify-center overflow-hidden p-2 shadow-inner">
                
                {/* Logo Image */}
                <img
                  src="/logo.png"
                  alt="Watazawwado Logo"
                  className="w-full h-full object-contain drop-shadow-sm select-none"
                />

                {/* Specular Light Sweep Sheen */}
                {!isReducedMotion && (
                  <div 
                    className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-[inherit]"
                  >
                    <div 
                      className="w-1/2 h-[200%] -top-1/2 bg-gradient-to-r from-transparent via-white/50 dark:via-white/35 to-transparent animate-brand-shimmer pointer-events-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ─── 4-COLOR ANIMATED FLOWING PROGRESS BAR ─────────────────────── */}
      {showProgressBar && (
        <div className="w-48 sm:w-56 h-1.5 bg-secondary/20 dark:bg-surface-subtle rounded-full overflow-hidden mb-3 relative shadow-inner">
          <div
            className={`absolute inset-y-0 start-0 h-full rounded-full w-full origin-left ${
              !isReducedMotion ? 'loading-gradient-flow' : ''
            }`}
            style={{
              background: 'linear-gradient(90deg, #C51F24, #8B4935, #D8C6AE, #087D91, #C51F24)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}

      {/* ─── STATUS MESSAGE & FOUR COLOR BOUNCING DOTS ──────────────────── */}
      <div className="flex flex-col items-center gap-1.5 text-center max-w-sm px-4">
        {text && (
          <h3 className="font-display font-semibold text-base sm:text-lg text-foreground tracking-tight">
            {text}
          </h3>
        )}

        {subtext && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {subtext}
          </p>
        )}

        {/* 4 Bouncing Jewel Beads Indicator (Crimson, Terracotta, Sand, Teal) */}
        {!isReducedMotion && (
          <div className="flex items-center justify-center gap-2 pt-1" aria-hidden="true">
            <span className="w-2 h-2 rounded-full bg-[#C51F24] animate-brand-dot-1 shadow-2xs" />
            <span className="w-2 h-2 rounded-full bg-[#8B4935] animate-brand-dot-2 shadow-2xs" />
            <span className="w-2 h-2 rounded-full bg-[#D8C6AE] animate-brand-dot-3 shadow-2xs" />
            <span className="w-2 h-2 rounded-full bg-[#087D91] animate-brand-dot-4 shadow-2xs" />
          </div>
        )}
      </div>

    </div>
  );
}
