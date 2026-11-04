import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Globe, ShieldCheck } from 'lucide-react';
import { useAppLanguage } from '../../lib/language';

/**
 * "The lamp room" (owner's pick, 2026-11-04): every sign-in screen (student dialog, student area, kid link,
 * email code, staff login, set password) is one dark espresso room. A lamp follows the pointer and lights a
 * khatam pattern; the eight-point star is drawn behind the academy's name, which a pen of light writes in the
 * page's language only (Watazawwado left to right, or وتزوّدوا right to left) in our ink: teal, cream, gold,
 * crimson. The form sits on a glass card beside it (below it on phones), and the star's ring closes as you type.
 */

export const VERSE_TEXT = '﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾';
// The Arabic name above the line is the verse's first word, so the line carries on from it.
const VERSE_REST = 'فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ';

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

// Inside the room the stage already shows the verse, so the card's head drops it.
const InRoom = createContext(false);

const rise = (reduce: boolean | null, delay: number) =>
  reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const } };

/** Eight-point star (khatam) in hairlines; --off (1..0) closes the outer ring and --p turns the inner star as the visitor types. */
function Khatam() {
  const sq = 'M-50,-50H50V50H-50Z';
  return (
    <svg viewBox="-100 -100 200 200" className="room-star" aria-hidden="true">
      <g className="kh-spin">
        <circle r="96" pathLength={1} className="kh-draw kh-ring" style={{ animationDelay: '.05s' }} />
        <circle r="96" pathLength={1} className="kh-progress" />
        <circle r="71" pathLength={1} className="kh-draw kh-gold" style={{ animationDelay: '.25s' }} />
        <path d={sq} pathLength={1} className="kh-draw kh-red" style={{ animationDelay: '.45s' }} />
        <path d={sq} pathLength={1} transform="rotate(45)" className="kh-draw kh-red" style={{ animationDelay: '.65s' }} />
        <g className="kh-inner">
          <path d={sq} pathLength={1} transform="scale(.48) rotate(22.5)" className="kh-draw kh-gold" style={{ animationDelay: '.9s' }} />
          <path d={sq} pathLength={1} transform="scale(.48) rotate(67.5)" className="kh-draw kh-gold" style={{ animationDelay: '1.05s' }} />
        </g>
        <circle r="12" pathLength={1} className="kh-draw kh-red" style={{ animationDelay: '1.2s' }} />
      </g>
    </svg>
  );
}

/** Our ink, in the direction the pen moves: teal where it starts, through cream and gold, crimson where it ends; plus a passing sheen. */
function Ink({ id, rtl }: { id: string; rtl: boolean }) {
  return (
    <defs>
      <linearGradient id={id} gradientUnits="objectBoundingBox" x1={rtl ? 1 : 0} y1=".3" x2={rtl ? 0 : 1} y2=".7">
        <stop offset="0" stopColor="#12A4BC" />
        <stop offset=".1" stopColor="#12A4BC" />
        <stop offset=".32" stopColor="#F1DDB2" />
        <stop offset=".55" stopColor="#E5A93C" />
        <stop offset=".8" stopColor="#C9852E" />
        <stop offset="1" stopColor="#C51F24" />
      </linearGradient>
      <linearGradient id={`${id}-sheen`} gradientUnits="userSpaceOnUse" x1="-300" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="#FFF6DC" stopOpacity="0" />
        <stop offset=".5" stopColor="#FFF6DC" stopOpacity=".7" />
        <stop offset="1" stopColor="#FFF6DC" stopOpacity="0" />
        <animateTransform attributeName="gradientTransform" type="translate" from={rtl ? '1300 0' : '0 0'} to={rtl ? '-300 0' : '1600 0'} dur="2.4s" begin={`2.6s;${id}-run.end+5s`} id={`${id}-run`} />
      </linearGradient>
    </defs>
  );
}

/** The academy's name written by a pen of light, in the page's language only. */
function NameInLight({ isAr }: { isAr: boolean }) {
  const id = isAr ? 'room-ink-ar' : 'room-ink-en';
  const word = isAr ? 'وتزوّدوا' : 'Watazawwado';
  const text = isAr
    ? { x: 500, y: 165, className: 'room-text room-text-ar' }
    : { x: 500, y: 140, className: 'room-text room-text-en', textLength: 880, lengthAdjust: 'spacingAndGlyphs' as const };
  return (
    // Keyed by the word so switching language writes the new name from the start.
    <div key={word} className={`room-name ${isAr ? 'is-ar' : 'is-en'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <svg viewBox={isAr ? '0 0 1000 240' : '0 0 1000 190'} className="room-svg" aria-hidden="true">
        <Ink id={id} rtl={isAr} />
        <text {...text} textAnchor="middle" fill={`url(#${id})`}>{word}</text>
        <text {...text} textAnchor="middle" className={`${text.className} room-sheen`} fill={`url(#${id}-sheen)`}>{word}</text>
      </svg>
      <span className="room-nib" aria-hidden="true" />
    </div>
  );
}

/** The stage: the star, the name, and the verse (its English meaning on English pages). */
function EntranceStage({ isAr }: { isAr: boolean }) {
  useVerseFont();
  return (
    <div className="room-stage">
      <Khatam />
      <NameInLight isAr={isAr} />
      {isAr ? (
        <p className="room-tag room-tag-ar" dir="rtl" lang="ar">
          {VERSE_REST}
          <span className="room-tag-ref">البقرة ١٩٧</span>
        </p>
      ) : (
        <p className="room-tag">
          “Take provision, and the best provision is mindfulness of God.”
          <span className="room-tag-ref">Al-Baqarah 2:197</span>
        </p>
      )}
    </div>
  );
}

/** The room every sign-in screen sits in: the lamp, the pattern it lights, a top bar, the stage and the card. */
export function EntranceRoom({ isAr, bar, footer, children }: { isAr: boolean; bar: React.ReactNode; footer?: React.ReactNode; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // The lamp follows a mouse; with no mouse (or a still one) it drifts slowly around the name.
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let last = -1e9;
    let raf = 0;
    const set = (x: number, y: number) => { el.style.setProperty('--lx', `${x}px`); el.style.setProperty('--ly', `${y}px`); };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const box = el.getBoundingClientRect();
      last = performance.now();
      set(e.clientX - box.left, e.clientY - box.top);
    };
    const drift = (t: number) => {
      if (t - last > 2500) {
        const box = el.getBoundingClientRect();
        const stage = el.querySelector('.room-stage')?.getBoundingClientRect();
        const cx = stage ? stage.left - box.left + stage.width / 2 : box.width / 2;
        const cy = stage ? stage.top - box.top + stage.height / 2 : box.height / 3;
        set(cx + Math.sin(t / 2400) * 160, cy + Math.sin(t / 1700) * 110);
      }
      raf = requestAnimationFrame(drift);
    };
    window.addEventListener('pointermove', move);
    raf = requestAnimationFrame(drift);
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, [reduce]);

  // The star's outer ring closes as the visible fields fill in.
  const onInput = () => {
    const el = ref.current;
    if (!el) return;
    const fields = Array.from(el.querySelectorAll<HTMLInputElement>('input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])'))
      .filter((i) => i.offsetParent !== null);
    if (!fields.length) return;
    const p = fields.reduce((sum, i) => sum + Math.min(i.value.length / 6, 1), 0) / fields.length;
    el.style.setProperty('--p', String(p));
    el.style.setProperty('--off', String(1 - p));
  };

  return (
    <InRoom.Provider value={true}>
      <div ref={ref} onInput={onInput} className="room">
        <div className="room-pattern" aria-hidden="true" />
        <div className="room-glow" aria-hidden="true" />
        <header className="entrance-bar">{bar}</header>
        <div className="room-grid">
          <EntranceStage isAr={isAr} />
          <main className="room-main">{children}</main>
        </div>
        {footer}
      </div>
    </InRoom.Provider>
  );
}

/** The logo in the bar; the name itself is written large on the stage, so it is not repeated here. */
export function EntranceLogo({ isAr }: { isAr: boolean }) {
  return <img src="/logo-256.png" alt={isAr ? 'وتزودوا' : 'Watazawwado'} className="w-10 h-auto" />;
}

/** The head of the card: the title and the line under it (and the verse, outside the room). */
// Pages use the default h1; a dialog over a page passes heading="h2" so the page keeps one h1 (QA-02).
export function AuthPortal({ title, subtitle, titleId, heading: Heading = 'h1' }: { title: React.ReactNode; subtitle?: React.ReactNode; titleId?: string; heading?: 'h1' | 'h2' }) {
  const reduce = useReducedMotion();
  const { isAr } = useAppLanguage();
  const inRoom = useContext(InRoom);
  useVerseFont();
  return (
    <div className="ink-head">
      {!inRoom && <motion.p className="ink-verse" dir="rtl" lang="ar" {...rise(reduce, 0)}>{VERSE_TEXT}</motion.p>}
      {/* Our rule: an English page that shows a verse shows its meaning under it. */}
      {!inRoom && !isAr && <motion.p className="ink-verse-meaning" {...rise(reduce, 0.05)}>“And take provisions, but indeed, the best provision is fear of Allah.” Al-Baqarah 2:197</motion.p>}
      <motion.div {...rise(reduce, 0.1)}>
        <Heading id={titleId} className="ink-title font-editorial">{title}</Heading>
      </motion.div>
      {!inRoom && <span className="ink-rule" aria-hidden="true"><span /></span>}
      {subtitle && <motion.p className="ink-subtitle" {...rise(reduce, 0.2)}>{subtitle}</motion.p>}
    </div>
  );
}

/** Full-page sign-in: the room with the logo, the language switch and the way back to the site. */
export function AuthPage({ isAr, onToggleLang, children }: { isAr: boolean; onToggleLang?: () => void; children: React.ReactNode }) {
  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="entrance min-h-dvh text-foreground">
      <EntranceRoom
        isAr={isAr}
        bar={
          <>
            <Link to="/" className="entrance-brand" aria-label={isAr ? 'الصفحة الرئيسية' : 'Home'}><EntranceLogo isAr={isAr} /></Link>
            <div className="flex items-center gap-1.5">
              {onToggleLang && (
                <button type="button" onClick={onToggleLang} className="entrance-link">
                  <Globe className="w-4 h-4" aria-hidden="true" />
                  <span>{isAr ? 'English' : 'عربي'}</span>
                </button>
              )}
              <Link to="/" className="entrance-link">
                <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
                <span>{isAr ? 'رجوع للموقع' : 'Back to the website'}</span>
              </Link>
            </div>
          </>
        }
        footer={
          <footer className="room-footer">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E5A93C]" aria-hidden="true" />
            {isAr ? 'بياناتك محفوظة عندنا بأمان' : 'Your details are kept safe with us'}
          </footer>
        }
      >
        {children}
      </EntranceRoom>
    </div>
  );
}

/** The glass card that holds a sign-in form (a plain column outside the room); `wide` for the OTP step. */
export function AuthCard({ children, wide = false, className = '' }: { children: React.ReactNode; wide?: boolean; className?: string }) {
  return <div className={`ink-column w-full ${wide ? 'max-w-lg' : 'max-w-[26rem]'} ${className}`}>{children}</div>;
}
