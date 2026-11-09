import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BrandSpinner } from './BrandLoader';
import { ZadRig, type ZadPose } from '../zad/ZadRig';

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

/** Zad greets every account in its own way: a wave for learners and families, a hand on the heart for teachers, calm for the admin. */
const WELCOME_POSE: Record<WelcomeRole, ZadPose> = { student: 'wave', teacher: 'thanks', admin: 'idle' };

export interface WelcomeLoaderProps {
  role: WelcomeRole;
  lang: 'ar' | 'en';
  name?: string | null;
  gender?: WelcomeGender;
}

/** Full-screen welcome shown while the account loads after sign-in, with Zad. */
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
        <ZadRig pose={WELCOME_POSE[role]} size={132} />
      </motion.div>
      <motion.div className="space-y-2 max-w-md" initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold leading-snug">{title}</h1>
        <p className="text-base text-muted-foreground">{subtitle}</p>
      </motion.div>
      <BrandSpinner size="md" />
    </div>
  );
}
