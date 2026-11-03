import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Globe, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAppLanguage } from '../../lib/language';

/**
 * "Paper and ink" (owner's pick, 2026-11-03): every sign-in screen (student dialog, student area, kid link,
 * email code, staff login, set password) is a full page of cream paper (espresso at night) with no card.
 * One centred column: the verse in gold, the title set large in the editorial serif, a gold hairline with a
 * diamond, hairline fields and one crimson button. Luxury by restraint: space, type and two colours.
 */

export const VERSE_TEXT = '﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾';

// Thmanyah has no ornate Quranic brackets: the verse uses Amiri Quran, loaded for these letters only (as on the homepage).
export function useVerseFont() {
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById('verse-font-auth') || document.getElementById('verse-font')) return;
    const link = document.createElement('link');
    link.id = 'verse-font-auth';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap&text=' + encodeURIComponent(Array.from(new Set(VERSE_TEXT)).join(''));
    document.head.appendChild(link);
  }, []);
}

/** The paper itself: grain and one warm lamp-light above the column. Sits behind everything. */
export function EntranceBackdrop() {
  useVerseFont();
  return <div className="entrance-backdrop" aria-hidden="true" />;
}

const rise = (reduce: boolean | null, delay: number) =>
  reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const } };

/** The head of every sign-in page: the verse, the title, the gold hairline, the line under it. */
// Pages use the default h1; a dialog over a page passes heading="h2" so the page keeps one h1 (QA-02).
export function AuthPortal({ title, subtitle, titleId, heading: Heading = 'h1' }: { title: React.ReactNode; subtitle?: React.ReactNode; titleId?: string; heading?: 'h1' | 'h2' }) {
  const reduce = useReducedMotion();
  const { isAr } = useAppLanguage();
  useVerseFont();
  return (
    <div className="ink-head">
      <motion.p className="ink-verse" dir="rtl" lang="ar" {...rise(reduce, 0)}>{VERSE_TEXT}</motion.p>
      {/* Our rule: an English page that shows a verse shows its meaning under it. */}
      {!isAr && <motion.p className="ink-verse-meaning" {...rise(reduce, 0.05)}>“And take provisions, but indeed, the best provision is fear of Allah.” Al-Baqarah 2:197</motion.p>}
      <motion.div {...rise(reduce, 0.1)}>
        <Heading id={titleId} className="ink-title font-editorial">{title}</Heading>
      </motion.div>
      <span className="ink-rule" aria-hidden="true"><span /></span>
      {subtitle && <motion.p className="ink-subtitle" {...rise(reduce, 0.2)}>{subtitle}</motion.p>}
    </div>
  );
}

/** Full-page sign-in: the paper, a slim top bar, the column in the middle. */
export function AuthPage({ isAr, onToggleLang, children }: { isAr: boolean; onToggleLang?: () => void; children: React.ReactNode }) {
  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="entrance min-h-dvh text-foreground flex flex-col">
      <EntranceBackdrop />
      <header className="entrance-bar">
        <Link to="/" className="entrance-link">
          <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
          <span>{isAr ? 'رجوع للموقع' : 'Back to the website'}</span>
        </Link>
        <div className="flex items-center gap-1">
          {onToggleLang && (
            <button type="button" onClick={onToggleLang} className="entrance-link">
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'English' : 'عربي'}</span>
            </button>
          )}
          <ThemeToggle compact className="!w-11 !h-11 !rounded-full !bg-transparent !border-0 !shadow-none" />
        </div>
      </header>
      <main className="relative flex-1 w-full px-6 pt-8 pb-12 flex items-center justify-center">{children}</main>
      <footer className="relative pb-7 text-center text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--gold-deep,#B9782A)]" aria-hidden="true" />
          {isAr ? 'بياناتك محفوظة عندنا بأمان' : 'Your details are kept safe with us'}
        </span>
      </footer>
    </div>
  );
}

/** The column that holds a sign-in form; `wide` for the OTP step. */
export function AuthCard({ children, wide = false, className = '' }: { children: React.ReactNode; wide?: boolean; className?: string }) {
  return <div className={`ink-column w-full ${wide ? 'max-w-lg' : 'max-w-[25rem]'} ${className}`}>{children}</div>;
}
