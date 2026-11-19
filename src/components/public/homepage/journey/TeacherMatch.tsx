import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Moon, Sun, CalendarDays } from 'lucide-react';
import { Medal } from './HeroStage';
import { EXPO } from './Journey';

/**
 * "A teacher you choose" (owner, 2026-11-18: no profiles on the homepage, make the idea richer): three quick choices,
 * and a teacher card assembles itself from them on the other side. It scales with the team: no names, no photos.
 * The button opens the free first lesson, where the real profiles are.
 */

type L = { en: string; ar: string };
const WHO: { id: string; l: L; covered: boolean }[] = [
  { id: 'm', l: { en: 'Male teacher', ar: 'معلّم' }, covered: false },
  { id: 'f', l: { en: 'Female teacher', ar: 'معلّمة' }, covered: true },
];
const WHAT: { id: string; medal: string; l: L }[] = [
  { id: 'quran', medal: 'surah', l: { en: 'Quran', ar: 'القرآن' } },
  { id: 'tajweed', medal: 'tajweed', l: { en: 'Tajweed', ar: 'التجويد' } },
  { id: 'zad', medal: 'zad-level', l: { en: 'Zad Path', ar: 'منهج زاد' } },
  { id: 'lang', medal: 'language-level', l: { en: 'Arabic · English', ar: 'عربي · إنجليزي' } },
];
const WHEN: { id: string; icon: typeof Sun; l: L }[] = [
  { id: 'am', icon: Sun, l: { en: 'Mornings', ar: 'الصبح' } },
  { id: 'pm', icon: Moon, l: { en: 'Evenings', ar: 'بالليل' } },
  { id: 'wk', icon: CalendarDays, l: { en: 'Weekends', ar: 'الويك إند' } },
];

function Figure({ covered }: { covered: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="w-16 h-16" aria-hidden="true">
      {covered ? <path d="M13 21c0-8 5-13 11-13s11 5 11 13v5c-3 3-7 4-11 4s-8-1-11-4z" fill="currentColor" opacity=".9" /> : null}
      <circle cx="24" cy={covered ? 19 : 17} r={covered ? 6 : 7.5} fill={covered ? '#2A1A14' : 'currentColor'} />
      <path d="M8 46c0-10 7-15 16-15s16 5 16 15z" fill="currentColor" />
    </svg>
  );
}

function Chips<T extends { id: string; l: L }>({ items, value, onPick, isEn, render }: { items: T[]; value: string; onPick: (id: string) => void; isEn: boolean; render?: (it: T) => React.ReactNode }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onPick(it.id)}
            className={`inline-flex items-center gap-2 min-h-11 rounded-full px-4 text-sm font-bold transition-[background-color,box-shadow,color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${on ? 'bg-[#C51F24] text-[#FAF7F2] shadow-[0_8px_20px_-8px_rgba(197,31,36,0.6)]' : 'bg-white/80 text-[#1C1411] ring-1 ring-[#1C1411]/10 hover:ring-[#C51F24]/40 dark:bg-[#FAF7F2]/[0.07] dark:text-[#FAF7F2] dark:ring-[#F6D58E]/20'}`}
          >
            {render?.(it)}{isEn ? it.l.en : it.l.ar}
          </button>
        );
      })}
    </div>
  );
}

export function TeacherMatch({ isEn, onTrial }: { isEn: boolean; onTrial: () => void }) {
  const reduce = useReducedMotion();
  const [who, setWho] = React.useState('f');
  const [what, setWhat] = React.useState('quran');
  const [when, setWhen] = React.useState('pm');
  const w = WHO.find((x) => x.id === who)!;
  const s = WHAT.find((x) => x.id === what)!;
  const n = WHEN.find((x) => x.id === when)!;
  const t = (l: L) => (isEn ? l.en : l.ar);
  const swap = reduce ? {} : { initial: { opacity: 0, y: 10, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -8, scale: 0.95 }, transition: { duration: 0.35, ease: EXPO } };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-center">
      <div className="space-y-5">
        <p className="text-xs font-bold tracking-wide text-[#A8191E] dark:text-[#F6D58E]/80">{isEn ? 'Try it: who, what, when' : 'جرّب: مين، إيه، إمتى'}</p>
        <Chips items={WHO} value={who} onPick={setWho} isEn={isEn} />
        <Chips items={WHAT} value={what} onPick={setWhat} isEn={isEn} />
        <Chips items={WHEN} value={when} onPick={setWhen} isEn={isEn} render={(it) => <it.icon className="w-4 h-4" aria-hidden="true" />} />
      </div>

      {/* The card that assembles from the choices. */}
      <div className="relative mx-auto w-full max-w-[19rem]">
        <span aria-hidden="true" className="absolute -inset-6 rounded-full bg-[radial-gradient(closest-side,rgba(229,169,60,0.3),transparent)]" />
        <div className="relative rounded-t-[9rem] rounded-b-[2rem] bg-[linear-gradient(170deg,#FFFFFF,#FAF3E6)] p-6 pt-10 text-center shadow-[0_40px_70px_-30px_rgba(92,52,30,0.45)] ring-1 ring-[#E5A93C]/40">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={who} className="mx-auto grid place-items-center w-24 h-24 rounded-full bg-[linear-gradient(145deg,#E3343A,#951419)] text-[#F6D58E]" {...swap}>
              <Figure covered={w.covered} />
            </motion.div>
          </AnimatePresence>
          <p className="mt-3 font-editorial font-bold text-xl text-[#1C1411]">{t(w.l)}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={what} className="flex items-center gap-1.5 rounded-full bg-[#1C1411]/[0.06] ps-1 pe-3 py-1 text-sm font-bold text-[#1C1411]" {...swap}>
                <Medal id={s.medal} eager className="w-8 h-8" />{t(s.l)}
              </motion.span>
            </AnimatePresence>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={when} className="flex items-center gap-1 rounded-full bg-[#1C1411]/[0.06] px-3 py-1.5 text-sm font-bold text-[#1C1411]" {...swap}>
                <n.icon className="w-3.5 h-3.5" aria-hidden="true" />{t(n.l)}
              </motion.span>
            </AnimatePresence>
          </div>
          <ul className="mt-4 space-y-1.5 text-start text-sm text-[#1C1411]/80">
            {[{ en: 'Stays with you, lesson after lesson', ar: 'يكمّل معاك حصة بعد حصة' }, { en: 'Writes to you after every lesson', ar: 'يكتب لك بعد كل حصة' }].map((x) => (
              <li key={x.en} className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0 text-[#087D91]" aria-hidden="true" />{t(x)}</li>
            ))}
          </ul>
          <button type="button" onClick={onTrial} className="liquid-cta mt-5 w-full min-h-12 rounded-full bg-[#C51F24] px-5 font-bold text-[#FAF7F2] shadow-[0_14px_30px_-12px_rgba(197,31,36,0.7)] hover:bg-[#A8191E] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60">
            {isEn ? 'Meet your teacher free' : 'قابل معلّمك مجانًا'}
          </button>
        </div>
      </div>
    </div>
  );
}
