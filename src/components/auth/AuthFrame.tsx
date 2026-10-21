import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Globe, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

/**
 * Shared look of every sign-in screen (student modal, student area, staff login, set password):
 * a deep mihrab portal with the logo in a paper arch, the logo ribbon drawing once under it,
 * then the form on a glass-3 card. Same palette in light and dark (docs/design-system.md §8).
 */
// Pages use the default h1; a dialog over a page passes heading="h2" so the page keeps one h1 (QA-02).
export function AuthPortal({ title, subtitle, titleId, heading: Heading = 'h1' }: { title: React.ReactNode; subtitle?: React.ReactNode; titleId?: string; heading?: 'h1' | 'h2' }) {
  const reduce = useReducedMotion();
  return (
    <>
      <div className="auth-portal khatam-window" aria-hidden="true">
        <span className="door-glow" />
        <span className="auth-medallion">
          <img src="/logo-256.png" alt="" width={76} height={47} className="w-[76px] h-auto" />
        </span>
        <svg viewBox="0 0 240 24" className="auth-ribbon" preserveAspectRatio="none">
          <defs>
            <linearGradient id="auth-ribbon-g" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#C51F24" />
              <stop offset="38%" stopColor="#B4552F" />
              <stop offset="62%" stopColor="#E5A93C" />
              <stop offset="100%" stopColor="#12A4BC" />
            </linearGradient>
          </defs>
          <motion.path
            d="M4 16 C 60 2, 100 24, 120 12 S 190 2, 236 10"
            fill="none"
            stroke="url(#auth-ribbon-g)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.2, ease: [0.65, 0, 0.35, 1] }}
          />
        </svg>
      </div>
      <div className="px-6 sm:px-8 pt-6 text-center">
        <Heading id={titleId} className="font-editorial text-2xl sm:text-[1.75rem] font-bold text-foreground leading-snug">{title}</Heading>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">{subtitle}</p>}
      </div>
    </>
  );
}

/** Full-page sign-in backdrop: khatam field and brand lights, a slim top bar, the card in the middle. */
export function AuthPage({ isAr, onToggleLang, children }: { isAr: boolean; onToggleLang?: () => void; children: React.ReactNode }) {
  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="khatam-field brand-lights min-h-dvh bg-background text-foreground flex flex-col">
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 flex items-center justify-between gap-3">
        <Link to="/" className="btn-glass is-pill !min-h-10 !px-4 text-sm">
          <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
          <span>{isAr ? 'رجوع للموقع' : 'Back to the website'}</span>
        </Link>
        <div className="flex items-center gap-2">
          {onToggleLang && (
            <button type="button" onClick={onToggleLang} className="btn-glass is-pill !min-h-10 !px-3.5 text-sm">
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>
          )}
          <ThemeToggle compact className="!w-10 !h-10 !rounded-full" />
        </div>
      </header>
      <main className="flex-1 w-full px-4 py-8 sm:py-12 flex items-center justify-center">{children}</main>
      <footer className="pb-6 text-center text-xs text-muted-foreground">
        <span className="glass-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--teal)]" aria-hidden="true" />
          {isAr ? 'بياناتك محفوظة عندنا بأمان' : 'Your details are kept safe with us'}
        </span>
      </footer>
    </div>
  );
}

/** The card itself; `wide` for the OTP step. */
export function AuthCard({ children, wide = false, className = '' }: { children: React.ReactNode; wide?: boolean; className?: string }) {
  return (
    <div className={`auth-card glass-3 w-full ${wide ? 'max-w-lg' : 'max-w-md'} ${className}`}>{children}</div>
  );
}
