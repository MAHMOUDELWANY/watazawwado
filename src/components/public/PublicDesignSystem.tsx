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
          'font-editorial font-medium tracking-tight text-foreground',
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
  variant?: 'default' | 'accent';
}

export function StudyLine({ className, variant = 'default' }: StudyLineProps) {
  return (
    <hr
      className={cn(
        variant === 'accent' ? 'study-line--accent' : 'study-line',
        'my-8',
        className
      )}
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
// Button variants for public pages using the new brand palette.
// These use teal as primary action, NOT sage-green.
// Separate from the shared ui/Button to avoid impacting authenticated areas.

interface PublicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'text';
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
  const base = "inline-flex items-center justify-center font-medium transition-all ease-premium active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover rounded-md shadow-sm",
    secondary: "bg-secondary/40 text-foreground hover:bg-secondary/60 rounded-md border border-border-subtle",
    ghost: "text-foreground hover:bg-muted rounded-md",
    text: "text-primary hover:text-primary-hover underline-offset-4 hover:underline",
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
        className="absolute -top-4 -left-2 rtl:-right-2 rtl:left-auto text-5xl font-editorial text-accent/20 select-none leading-none"
        aria-hidden="true"
      >
        "
      </span>
      <p className="text-lg sm:text-xl text-foreground leading-relaxed font-light ps-4 border-s-2 border-accent/30">
        {quote}
      </p>
      <footer className="mt-4 ps-4">
        <cite className="not-italic text-sm font-medium text-foreground">{name}</cite>
        {detail && (
          <span className="block text-xs text-muted-foreground mt-0.5">{detail}</span>
        )}
      </footer>
    </blockquote>
  );
}

// ─── LEARNING AREA ITEM ─────────────────────────────────────────────────────
// A learning area entry for the taxonomy grid.
// Editorial layout, not a card. Uses accent color coding per area.

interface LearningAreaItemProps {
  title: string;
  description: string;
  areaClass?: string;
  className?: string;
  onClick?: () => void;
}

export function LearningAreaItem({ title, description, areaClass, className, onClick }: LearningAreaItemProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      className={cn(
        'text-start group p-5 rounded-lg border border-border-subtle hover:border-border transition-all',
        'hover:bg-surface-subtle/50',
        onClick && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        areaClass,
        className
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {/* Accent bar */}
      <div 
        className="w-8 h-0.5 mb-3 rounded-full transition-all group-hover:w-12"
        style={{ backgroundColor: 'var(--area-accent, var(--accent))' }}
        aria-hidden="true"
      />
      <h3 className="text-lg font-semibold text-foreground mb-1.5 font-editorial">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Component>
  );
}
