import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BrandSpinner } from './BrandLoader';

export type WelcomeRole = 'student' | 'teacher' | 'admin';
export type WelcomeGender = 'male' | 'female' | null | undefined;

const SIGNED_IN_KEY = 'watazawwado_just_signed_in';
/** A sign-in older than this no longer earns the short welcome hold. */
const SIGNED_IN_TTL_MS = 60_000;
export const WELCOME_MIN_MS = 900;

// Titles people put before a name ("Ustadh Mahmoud"); the greeting adds its own.
const TITLES = new Set(['ustadh', 'ustadha', 'ustaz', 'ustaza', 'ustadhah', 'sheikh', 'shaykh', 'dr', 'dr.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'أستاذ', 'أستاذة', 'الأستاذ', 'الأستاذة', 'استاذ', 'استاذة', 'الشيخ', 'شيخ', 'د.']);

/** First usable name from a profile name, or null (emails and generic placeholders are not names). */
export function firstName(name?: string | null): string | null {
  if (!name || name.includes('@')) return null;
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words.find((w) => !TITLES.has(w.toLowerCase()));
  if (!first || /^(student|teacher|admin|طالب|معلم)$/i.test(first)) return null;
  return first;
}

/** The welcome words for each role, in the site's voice (RULES.md §6b). */
export function welcomeGreeting(opts: { role: WelcomeRole; lang: 'ar' | 'en'; name?: string | null; gender?: WelcomeGender }): { title: string; subtitle: string } {
  const n = firstName(opts.name);
  const ar = opts.lang === 'ar';
  if (opts.role === 'student') {
    return ar
      ? { title: n ? `أهلاً يا ${n}` : 'أهلاً وسهلاً', subtitle: 'بنجهّزلك ركنك…' }
      : { title: n ? `Welcome back, ${n}.` : 'Welcome back.', subtitle: 'Getting your corner ready…' };
  }
  if (opts.role === 'teacher') {
    const honorific = opts.gender === 'female' ? 'أستاذة ' : opts.gender === 'male' ? 'أستاذ ' : '';
    return ar
      ? { title: n ? `أهلاً ${honorific}${n}` : 'أهلاً وسهلاً', subtitle: 'طلابك مستنيينك' }
      : { title: n ? `Welcome back, ${n}.` : 'Welcome back.', subtitle: 'Your students are waiting for you.' };
  }
  return ar
    ? { title: n ? `أهلاً ${n}` : 'أهلاً وسهلاً', subtitle: 'بنجهّز لوحة الأكاديمية…' }
    : { title: n ? `Welcome back, ${n}.` : 'Welcome back.', subtitle: 'Getting the academy ready…' };
}

/** Call right after a successful sign-in, before navigating to the portal. */
export function markJustSignedIn(): void {
  try { sessionStorage.setItem(SIGNED_IN_KEY, String(Date.now())); } catch { /* storage blocked */ }
}

/** True once per fresh sign-in; clears the flag so later navigations never hold. */
export function consumeJustSignedIn(now = Date.now()): boolean {
  try {
    const at = Number(sessionStorage.getItem(SIGNED_IN_KEY));
    sessionStorage.removeItem(SIGNED_IN_KEY);
    return at > 0 && now - at < SIGNED_IN_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Whether to show the welcome: always while `loading`, plus a short minimum right after a real sign-in.
 */
export function useWelcomeGate(loading: boolean): boolean {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!loading || !consumeJustSignedIn()) return;
    setHolding(true);
    // Not cleared when loading ends: the hold must still finish.
    timer.current = setTimeout(() => setHolding(false), WELCOME_MIN_MS);
  }, [loading]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return loading || holding;
}

const RIBBON = ['#C51F24', '#8B4935', '#E5A93C', '#087D91'];

function RibbonGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      {RIBBON.map((c, i) => <stop key={c} offset={`${(i / (RIBBON.length - 1)) * 100}%`} stopColor={c} />)}
    </linearGradient>
  );
}

/** Student: the eight-point khatam star draws itself in the ribbon colours. */
function KhatamDrawing({ still }: { still: boolean }) {
  const draw = still ? { pathLength: 1 } : { pathLength: [0, 1, 1], opacity: [1, 1, 0.35] };
  const loop = still ? undefined : { duration: 2.4, times: [0, 0.7, 1], repeat: Infinity, ease: 'easeInOut' as const };
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32" aria-hidden="true">
      <defs><RibbonGradient id="welcome-ribbon-star" /></defs>
      <motion.rect x="27" y="27" width="66" height="66" rx="3" fill="none" stroke="url(#welcome-ribbon-star)" strokeWidth="3" strokeLinejoin="round" initial={{ pathLength: still ? 1 : 0 }} animate={draw} transition={loop} />
      <motion.rect x="27" y="27" width="66" height="66" rx="3" fill="none" stroke="url(#welcome-ribbon-star)" strokeWidth="3" strokeLinejoin="round" transform="rotate(45 60 60)" initial={{ pathLength: still ? 1 : 0 }} animate={draw} transition={loop && { ...loop, delay: 0.25 }} />
      <circle cx="60" cy="60" r="9" fill="none" stroke="#E5A93C" strokeWidth="2" />
    </svg>
  );
}

/** Teacher: a mihrab arch with a lantern glowing inside. */
function MihrabLantern({ still }: { still: boolean }) {
  return (
    <svg viewBox="0 0 120 140" className="w-32 h-36" aria-hidden="true">
      <defs>
        <radialGradient id="welcome-lantern-glow">
          <stop offset="0%" stopColor="#E5A93C" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#E5A93C" stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.circle cx="60" cy="74" r="34" fill="url(#welcome-lantern-glow)" animate={still ? undefined : { opacity: [0.45, 1, 0.45], scale: [0.92, 1.05, 0.92] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '60px 74px' }} />
      <path d="M14 134 V58 C14 30 36 12 60 6 C84 12 106 30 106 58 V134" fill="none" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" />
      <path d="M26 134 V62 C26 40 42 25 60 20 C78 25 94 40 94 62 V134" fill="none" stroke="#8B4935" strokeOpacity="0.5" strokeWidth="1.5" />
      <line x1="60" y1="20" x2="60" y2="56" stroke="#8B4935" strokeWidth="1.5" />
      <path d="M52 60 H68 L72 70 L66 92 H54 L48 70 Z" fill="#E5A93C" fillOpacity="0.25" stroke="#E5A93C" strokeWidth="2" strokeLinejoin="round" />
      <path d="M50 56 H70 L68 60 H52 Z" fill="#8B4935" />
      <circle cx="60" cy="76" r="4" fill="#E5A93C" />
    </svg>
  );
}

/** Admin: the logo ribbon unfurls under the wordmark. */
function LogoRibbon({ still, isAr }: { still: boolean; isAr: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3" aria-hidden="true">
      <span className="font-editorial text-4xl sm:text-5xl font-bold text-ribbon leading-tight">{isAr ? 'وتزودوا' : 'Watazawwado'}</span>
      <svg viewBox="0 0 200 24" className="w-52 h-6">
        <defs><RibbonGradient id="welcome-ribbon-band" /></defs>
        <motion.path d="M4 12 C40 0 60 24 100 12 C140 0 160 24 196 12" fill="none" stroke="url(#welcome-ribbon-band)" strokeWidth="5" strokeLinecap="round"
          initial={{ pathLength: still ? 1 : 0 }} animate={still ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
          transition={still ? undefined : { duration: 2.2, times: [0, 0.75, 1], repeat: Infinity, ease: 'easeInOut' }}
          style={isAr ? { transform: 'scaleX(-1)', transformOrigin: 'center' } : undefined} />
      </svg>
    </div>
  );
}

export interface WelcomeLoaderProps {
  role: WelcomeRole;
  lang: 'ar' | 'en';
  name?: string | null;
  gender?: WelcomeGender;
}

/** Full-screen welcome shown while the account loads after sign-in. Each role has its own figure. */
export function WelcomeLoader({ role, lang, name, gender }: WelcomeLoaderProps) {
  const still = Boolean(useReducedMotion());
  const isAr = lang === 'ar';
  const { title, subtitle } = welcomeGreeting({ role, lang, name, gender });
  return (
    <div
      role="status"
      aria-live="polite"
      dir={isAr ? 'rtl' : 'ltr'}
      lang={lang}
      className="fixed inset-0 z-[70] isolate bg-background text-foreground khatam-field brand-lights flex flex-col items-center justify-center gap-7 px-6 text-center"
    >
      <motion.div initial={still ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {role === 'student' ? <KhatamDrawing still={still} /> : role === 'teacher' ? <MihrabLantern still={still} /> : <LogoRibbon still={still} isAr={isAr} />}
      </motion.div>
      <motion.div className="space-y-2 max-w-md" initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold leading-snug">{title}</h1>
        <p className="text-base text-muted-foreground">{subtitle}</p>
      </motion.div>
      <BrandSpinner size="md" />
    </div>
  );
}
