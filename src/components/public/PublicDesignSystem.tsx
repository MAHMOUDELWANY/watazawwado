/**
 * WATAZAWWADO PUBLIC DESIGN SYSTEM — React Component Primitives
 * 
 * These components implement the "Study Room" visual language for the public website.
 * They are scoped to public pages and do NOT replace the existing shared ui/ components
 * used by the authenticated dashboard/student/admin areas.
 * 
 * Usage: Import individual components from this file for public page layouts.
 */

import React from 'react';
import { cn } from '../../lib/utils';

// ─── PUBLIC SECTION ─────────────────────────────────────────────────────────
// Consistent section wrapper with vertical rhythm spacing.
// Optional warm background variant for alternating sections.

interface PublicSectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'warm' | 'transition-warm' | 'transition-neutral';
}

export function PublicSection({ id, children, className, variant = 'default' }: PublicSectionProps) {
  const variantClass = {
    default: '',
    warm: 'section-warm',
    'transition-warm': 'section-transition-warm',
    'transition-neutral': 'section-transition-neutral',
  }[variant];

  return (
    <section
      id={id}
      className={cn('public-section', variantClass, className)}
    >
      <div className="public-container">
        {children}
      </div>
    </section>
  );
}

// ─── EDITORIAL HEADING ──────────────────────────────────────────────────────
// Display heading using serif/editorial typography.
// Includes the signature study-line accent mark below.

interface EditorialHeadingProps {
  as?: 'h1' | 'h2' | 'h3';
  children: React.ReactNode;
  className?: string;
  /** Hide the accent line below the heading */
  noAccent?: boolean;
  /** Eyebrow label above the heading */
  eyebrow?: string;
}

export function EditorialHeading({ 
  as: Tag = 'h2', 
  children, 
  className, 
  noAccent = false,
  eyebrow,
}: EditorialHeadingProps) {
  const sizeClasses = {
    h1: 'text-3xl sm:text-4xl lg:text-5xl',
    h2: 'text-2xl sm:text-3xl',
    h3: 'text-xl sm:text-2xl',
  }[Tag];

  return (
    <div className="mb-6">
      {eyebrow && (
        <span className="eyebrow block mb-2">{eyebrow}</span>
      )}
      <Tag
        className={cn(
          'font-editorial font-medium  text-foreground',
          sizeClasses,
          !noAccent && "editorial-heading",
          className
        )}
      >
        {children}
      </Tag>
    </div>
  );
}

// ─── MARGIN NOTE ────────────────────────────────────────────────────────────
// Small editorial annotation that appears alongside content.
// Evokes a teacher's handwritten margin note.

interface MarginNoteProps {
  children: React.ReactNode;
  className?: string;
}

export function MarginNote({ children, className }: MarginNoteProps) {
  return (
    <aside className={cn('margin-note', className)} aria-hidden="true">
      {children}
    </aside>
  );
}

// ─── PORTRAIT FRAME ─────────────────────────────────────────────────────────
// Editorial portrait treatment for Ustadh Mahmoud.
// Warm paper border, subtle shadow, responsive sizing.
// Uses the actual portrait — never AI-generated.

interface PortraitFrameProps {
  src: string;
  alt: string;
  className?: string;
  /** Maximum display width in pixels. Prevents upscaling beyond source resolution. */
  maxWidth?: number;
}

export function PortraitFrame({ src, alt, className, maxWidth = 400 }: PortraitFrameProps) {
  return (
    <div 
      className={cn('portrait-frame', className)}
      style={{ maxWidth: `${maxWidth}px` }}
    >
      <img
        src={src}
        alt={alt}
        // Lazy on purpose: on phones the portrait is below the fold. Wide screens get a
        // media-scoped preload from scripts/prerender-seo.ts instead.
        loading="lazy"
        decoding="async"
        width={maxWidth}
        height={maxWidth}
        className="w-full h-auto object-cover aspect-[4/5]"
      />
    </div>
  );
}

// ─── PUBLIC BUTTON ──────────────────────────────────────────────────────────
// Button variants for public pages using the 4-color Islamic architectural heritage palette.

interface PublicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'teal' | 'terracotta' | 'islamic-gradient' | 'outline-teal' | 'ghost' | 'text';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function PublicButton({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  disabled,
  ...props 
}: PublicButtonProps) {
  const base = "inline-flex items-center justify-center font-medium transition-all ease-premium active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  
  const variants = {
    primary: "btn-primary-material rounded-xl text-white font-bold shadow-md",
    teal: "btn-teal-material rounded-xl text-white font-bold shadow-md",
    terracotta: "btn-terracotta-material rounded-xl text-white font-bold shadow-md",
    'islamic-gradient': "bg-islamic-gradient text-white hover:opacity-95 rounded-xl font-bold shadow-md",
    secondary: "bg-teal-500/10 text-teal-800 dark:text-teal-200 border border-teal-500/30 hover:bg-teal-500/20 rounded-xl font-semibold",
    'outline-teal': "border border-teal-600/40 text-teal-800 dark:text-teal-200 hover:bg-teal-500/10 rounded-xl font-semibold",
    ghost: "text-foreground hover:bg-surface-subtle rounded-xl",
    text: "text-teal-700 dark:text-teal-300 hover:text-teal-800 underline-offset-4 hover:underline",
  };

  const sizes = {
    sm: "h-9 px-3.5 text-sm gap-1.5",
    md: "h-11 px-5 text-sm gap-2",
    lg: "h-13 px-7 text-base gap-2.5",
  };

  return (
    <button
      disabled={disabled}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── PAGE HERO ──────────────────────────────────────────────────────────────
// Shared header for the inner public pages: the khatam field and brand lights bleed to the
// screen edges, a small mihrab arch drawn in the brand ribbon, the title, and a gradient rule.

interface PageHeroProps {
  title: React.ReactNode;
  intro?: React.ReactNode;
  /** Small line under the intro, e.g. a version or "last updated". */
  meta?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHero({ title, intro, meta, children, className }: PageHeroProps) {
  return (
    <header className={cn('page-hero khatam-field brand-lights relative text-center pt-4 pb-10 sm:pb-14', className)}>
      <svg aria-hidden="true" viewBox="0 0 48 56" className="mx-auto mb-5 w-10 h-12">
        <defs>
          <linearGradient id="page-hero-arch" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C51F24" />
            <stop offset="55%" stopColor="#E5A93C" />
            <stop offset="76%" stopColor="#D8C6AE" />
            <stop offset="100%" stopColor="#087D91" />
          </linearGradient>
        </defs>
        <path d="M6 54 V24 A18 18 0 0 1 42 24 V54" fill="none" stroke="url(#page-hero-arch)" strokeWidth="3" strokeLinecap="round" />
        <path d="M15 54 V27 A9 9 0 0 1 33 27 V54" fill="none" stroke="url(#page-hero-arch)" strokeWidth="1.5" strokeOpacity="0.6" />
      </svg>
      <h1 className="font-editorial font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.15] text-foreground max-w-4xl mx-auto">
        {title}
      </h1>
      <span aria-hidden="true" className="block mx-auto mt-5 h-[3px] w-16 rounded-full bg-gradient-to-r from-[#087D91] via-[#C51F24] to-[#E5A93C]" />
      {intro && (
        <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">{intro}</p>
      )}
      {meta && <p className="mt-4 text-xs sm:text-sm font-semibold text-[#087D91] dark:text-[#12A4BC]">{meta}</p>}
      {children}
    </header>
  );
}
