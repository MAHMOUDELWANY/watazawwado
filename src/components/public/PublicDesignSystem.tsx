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

// ─── STUDY LINE ─────────────────────────────────────────────────────────────
// A subtle horizontal rule that creates visual continuity between content blocks.
// Evokes ruled notebook lines / reading guides.

interface StudyLineProps {
  className?: string;
  variant?: 'default' | 'accent' | 'gradient' | 'teal';
}

export function StudyLine({ className, variant = 'default' }: StudyLineProps) {
  const variantClass = {
    default: 'study-line',
    accent: 'study-line--accent',
    gradient: 'h-[1px] border-none bg-gradient-to-r from-transparent via-teal-500/30 via-crimson/25 to-transparent',
    teal: 'h-[1px] border-none bg-gradient-to-r from-transparent via-teal-500/40 to-transparent',
  }[variant];

  return (
    <hr
      className={cn(variantClass, 'my-8', className)}
      aria-hidden="true"
    />
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

// ─── EDITORIAL BLOCK ────────────────────────────────────────────────────────
// Open composition content block — NOT a card.
// Uses whitespace and typography for structure instead of borders/shadows.

interface EditorialBlockProps {
  children: React.ReactNode;
  className?: string;
}

export function EditorialBlock({ children, className }: EditorialBlockProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}

// ─── TESTIMONIAL QUOTE ──────────────────────────────────────────────────────
// Editorial blockquote for authentic student/parent testimonials.
// Not a card. Not a carousel item. A deliberate typographic statement.

interface TestimonialQuoteProps {
  quote: string;
  name: string;
  detail?: string;
  className?: string;
}

export function TestimonialQuote({ quote, name, detail, className }: TestimonialQuoteProps) {
  return (
    <blockquote className={cn('relative', className)}>
      {/* Subtle opening quote mark */}
      <span 
        className="absolute -top-4 -left-2 rtl:-right-2 rtl:left-auto text-5xl font-editorial text-secondary/30 select-none leading-none"
        aria-hidden="true"
      >
        "
      </span>
      <p className="text-lg sm:text-xl text-foreground leading-relaxed font-light ps-4 border-s-2 border-secondary/40">
        {quote}
      </p>
      <footer className="mt-4 ps-4">
        <cite className="not-italic text-sm font-semibold text-foreground">{name}</cite>
        {detail && (
          <span className="block text-sm text-muted-foreground mt-0.5">{detail}</span>
        )}
      </footer>
    </blockquote>
  );
}

// ─── LEARNING AREA ITEM ─────────────────────────────────────────────────────
// A learning area entry for the taxonomy grid.
// Editorial layout with vibrant heritage color accents.

interface LearningAreaItemProps {
  title: string;
  description: string;
  areaClass?: string;
  icon?: React.ReactNode;
  badge?: string;
  actionLabel?: string;
  className?: string;
  onClick?: () => void;
}

export function LearningAreaItem({ 
  title, 
  description, 
  areaClass, 
  icon, 
  badge, 
  actionLabel,
  className, 
  onClick 
}: LearningAreaItemProps) {
  const Component = onClick ? 'button' : 'div';
  const isArabic = typeof document !== 'undefined' && document.documentElement.lang === 'ar';
  
  return (
    <Component
      className={cn(
        'text-start group p-6 rounded-2xl border border-border/80 hover:border-border transition-all duration-300',
        'bg-surface/80 hover:bg-surface shadow-xs hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden',
        onClick && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        areaClass,
        className
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {/* Subtle color glow accent top line */}
      <div 
        className="absolute top-0 inset-x-0 h-1 transition-all group-hover:h-1.5"
        style={{ backgroundColor: 'var(--area-accent, var(--teal))' }}
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-3 mb-3">
        {icon && (
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ 
              backgroundColor: 'color-mix(in srgb, var(--area-accent, var(--teal)) 14%, transparent)',
              color: 'var(--area-accent, var(--teal))'
            }}
          >
            {icon}
          </div>
        )}
        {badge && (
          <span 
            className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--area-accent, var(--teal)) 12%, transparent)',
              color: 'var(--area-accent, var(--teal))'
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold text-foreground mb-2 font-editorial group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {onClick && (
        <div 
          className="mt-4 flex items-center gap-1.5 text-xs font-bold transition-all group-hover:gap-2.5"
          style={{ color: 'var(--area-accent, var(--teal))' }}
        >
          <span>{actionLabel || (isArabic ? 'استكشف المسار' : 'Explore Track')}</span>
          <span className="rtl:rotate-180">→</span>
        </div>
      )}
    </Component>
  );
}
