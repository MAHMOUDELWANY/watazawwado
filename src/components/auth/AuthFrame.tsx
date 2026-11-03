import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Globe, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

/**
 * "The Door" (2026-11-03): every sign-in screen (student dialog, student area, kid link, staff login, set password)
 * is one entrance. A full-screen paper (or night) scene with the verse written large and faint behind, the brand
 * ribbon crossing it, and a tall arched door in a gold double frame holding the form, the logo as its keystone.
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

/** The scene's decoration: the verse as a watermark and the ribbon drawing across. Sits behind everything. */
export function EntranceBackdrop() {
  const reduce = useReducedMotion();
  useVerseFont();
  return (
    <div className="entrance-backdrop" aria-hidden="true">
      <p className="entrance-verse" dir="rtl" lang="ar">{VERSE_TEXT}</p>
      <svg className="entrance-ribbon" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="entrance-ribbon-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C51F24" />
            <stop offset="38%" stopColor="#B4552F" />
            <stop offset="62%" stopColor="#E5A93C" />
            <stop offset="100%" stopColor="#12A4BC" />
          </linearGradient>
        </defs>
        <motion.path
          d="M-20 300 C 240 120, 470 360, 720 220 S 1180 60, 1460 170"
          fill="none"
          stroke="url(#entrance-ribbon-g)"
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
    </div>
  );
}

/** The three promises, in the scene's lower corner on wide screens. */
export function EntrancePromises({ isAr }: { isAr: boolean }) {
  const lines = isAr
    ? ['معلم واحد يعرفك باسمك', 'حصة تجريبية مجانية', 'حساب واحد لكل العيلة']
    : ['One teacher who knows you by name', 'A free trial lesson first', 'One account for the whole family'];
  return (
    <ul className="entrance-promises">
      {lines.map((line) => <li key={line}><span className="entrance-dot" aria-hidden="true" />{line}</li>)}
    </ul>
  );
}

/** The keystone and the heading at the top of the door. */
// Pages use the default h1; a dialog over a page passes heading="h2" so the page keeps one h1 (QA-02).
export function AuthPortal({ title, subtitle, titleId, heading: Heading = 'h1' }: { title: React.ReactNode; subtitle?: React.ReactNode; titleId?: string; heading?: 'h1' | 'h2' }) {
  return (
    <div className="door-head">
      <DoorKeystone />
      <Heading id={titleId} className="door-title font-editorial">{title}</Heading>
      {subtitle && <p className="door-subtitle">{subtitle}</p>}
    </div>
  );
}

export function DoorKeystone() {
  return (
    <span className="door-keystone" aria-hidden="true">
      <img src="/logo-256.png" alt="" width={56} height={35} />
    </span>
  );
}

/** Full-page entrance: the scene, a slim top bar, the door in the middle. */
export function AuthPage({ isAr, onToggleLang, children }: { isAr: boolean; onToggleLang?: () => void; children: React.ReactNode }) {
  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="entrance min-h-dvh text-foreground flex flex-col">
      <EntranceBackdrop />
      <header className="entrance-bar">
        <Link to="/" className="entrance-pill">
          <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
          <span>{isAr ? 'رجوع للموقع' : 'Back to the website'}</span>
        </Link>
        <div className="flex items-center gap-2">
          {onToggleLang && (
            <button type="button" onClick={onToggleLang} className="entrance-pill">
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>
          )}
          <ThemeToggle compact className="!w-11 !h-11 !rounded-full" />
        </div>
      </header>
      <main className="relative flex-1 w-full px-4 pt-14 pb-10 flex items-center justify-center">{children}</main>
      <footer className="relative pb-6 flex flex-wrap items-end justify-center lg:justify-between gap-4 px-6 lg:px-10 text-xs text-muted-foreground">
        <span className="hidden lg:block"><EntrancePromises isAr={isAr} /></span>
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--teal)]" aria-hidden="true" />
          {isAr ? 'بياناتك محفوظة عندنا بأمان' : 'Your details are kept safe with us'}
        </span>
      </footer>
    </div>
  );
}

/** The door itself; `wide` for the OTP step. */
export function AuthCard({ children, wide = false, className = '' }: { children: React.ReactNode; wide?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      className={`door w-full ${wide ? 'max-w-lg' : 'max-w-[28rem]'} ${className}`}
    >
      {children}
    </motion.div>
  );
}
