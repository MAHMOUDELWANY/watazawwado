import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Camera, Check, KeyRound, Pause, Play, Plane, RotateCcw, Shirt, Smartphone, Volume2, Wallet } from 'lucide-react';
import { ZadRigSvg, type ZadPose } from '../../zad/ZadRig';
import { Medal } from './journey/HeroStage';

/**
 * The homepage intro film, and the brand film for ads (docs/marketing/HOMEPAGE-INTRO-FILM.md, 2026-11-18 v2).
 * No people on camera. Eight scenes on the voice clone (eleven_v4, one emotion per line; marketing/intro-film/vo/
 * *-v2-t1.mp3). Every phrase lands on its word (timings from the forced alignment of the take), the picture changes
 * every one to two seconds, Zad is in every scene, and the pictures are the academy's own: the 3D medals of the
 * student portal and real portal screens (public/media/portal).
 * Nothing loads until play: the voice-over is the only download besides the images already used on the page.
 * A caption line keeps it readable muted. `?film=record` shows the film alone, full screen, for the ad export.
 */

type L = { en: string; ar: string };
type Lang = 'en' | 'ar';
type Beat = { at: number; text: string; hl?: boolean; slice?: boolean };

// Scene start times (s), from the word alignment of each take (marketing/intro-film/vo/*-v3-t1.mp3).
const STARTS: Record<Lang, number[]> = {
  ar: [0, 6.3, 10.7, 16.72, 23.44, 28.56, 32.31],
  en: [0, 5.67, 9.84, 16.32, 22.64, 27.41, 32.24],
};
const LENGTH = 35.7;

// What the voice says, for the caption line.
const LINES: L[] = [
  { en: 'If you could carry just one thing... far from home... what would it be?', ar: 'لو كان لك أن تحمل شيئًا واحدًا فقط... إلى الغربة... ماذا تحمل؟' },
  { en: "The things we fear losing most... don't fit in a suitcase.", ar: 'أثمن ما نخاف أن نفقده... لا تتّسع له حقيبة.' },
  { en: 'The words of Allah... the language of our grandparents... a faith we want our children to keep.', ar: 'كلام الله... ولسان أجدادنا... ودينٌ نريده أن يبقى في أبنائنا.' },
  { en: 'Here, a teacher who knows you by name. Who hears every letter... and never starts from zero.', ar: 'هنا... معلّمٌ يعرفك باسمك، يسمعك حرفًا حرفًا... ولا يبدأ معك من الصفر.' },
  { en: 'After every lesson, you see what you learned... and every step becomes a badge.', ar: 'وبعد كلّ حصّة... يصلك ما تعلّمت، وكلّ خطوة... تصير وسامًا.' },
  { en: '“Take provision, and the best provision is mindfulness of Allah.” (2:197)', ar: '﴿وتزوّدوا فإنّ خير الزاد التقوى﴾ البقرة ١٩٧' },
  { en: 'Your first lesson is on us... start your Zad, today.', ar: 'الحصّة الأولى علينا... ابدأ زادك، اليوم.' },
];

// The words on screen, by seconds from the start of each scene, on the voice. The verse scene (5) shows the verse itself.
const BEATS: Record<Lang, Beat[][]> = {
  ar: [
    [{ at: 0.16, text: 'لو كان لك أن تحمل' }, { at: 1.6, text: 'شيئًا واحدًا فقط', hl: true }, { at: 3.68, text: 'إلى الغربة' }, { at: 4.96, text: 'ماذا تحمل؟', hl: true }],
    [{ at: 0, text: 'أثمن ما نخاف أن نفقده' }, { at: 2.26, text: 'لا تتّسع له حقيبة', hl: true, slice: true }],
    [{ at: 0, text: 'كلام الله', hl: true }, { at: 1.06, text: 'ولسان أجدادنا' }, { at: 2.82, text: 'ودينٌ يبقى' }, { at: 4.9, text: 'في أبنائنا', hl: true }],
    [{ at: 0, text: 'هنا' }, { at: 0.72, text: 'معلّمٌ يعرفك باسمك', hl: true }, { at: 2.72, text: 'يسمعك حرفًا حرفًا' }, { at: 4.8, text: 'ولا يبدأ من الصفر', hl: true, slice: true }],
    [{ at: 0, text: 'بعد كلّ حصّة' }, { at: 1.28, text: 'يصلك ما تعلّمت', hl: true }, { at: 2.67, text: 'وكلّ خطوة' }, { at: 3.76, text: 'تصير وسامًا', hl: true }],
    [{ at: 0, text: '' }],
    [{ at: 0, text: 'الحصّة الأولى' }, { at: 0.81, text: 'علينا', hl: true }, { at: 1.61, text: 'ابدأ زادك اليوم', hl: true }],
  ],
  en: [
    [{ at: 0.08, text: 'If you could carry' }, { at: 1.12, text: 'just ONE thing', hl: true }, { at: 2.72, text: 'far from home' }, { at: 4.24, text: 'what would it be?', hl: true }],
    [{ at: 0, text: 'What we fear losing most' }, { at: 2.33, text: "doesn't fit in a suitcase", hl: true, slice: true }],
    [{ at: 0, text: 'The words of Allah', hl: true }, { at: 1.6, text: "our grandparents' language" }, { at: 3.84, text: 'a faith' }, { at: 5.16, text: 'our children keep', hl: true }],
    [{ at: 0, text: 'Here' }, { at: 0.75, text: 'a teacher who knows your name', hl: true }, { at: 2.8, text: 'who hears every letter' }, { at: 4.72, text: 'never starts from zero', hl: true, slice: true }],
    [{ at: 0, text: 'After every lesson' }, { at: 1.2, text: 'see what you learned', hl: true }, { at: 2.72, text: 'every step' }, { at: 3.44, text: 'becomes a badge', hl: true }],
    [{ at: 0, text: '' }],
    [{ at: 0, text: 'Your first lesson' }, { at: 0.96, text: 'is on us', hl: true }, { at: 1.68, text: 'start your Zad today', hl: true }],
  ],
};

// Cues inside a scene that change the picture (seconds from the scene start).
const CUES: Record<Lang, number[][]> = {
  ar: [[1.6, 3.68, 4.96], [2.26], [0, 1.06, 2.82], [0.72, 2.72, 4.8], [1.28, 2.67, 3.76], [1.28], [1.61]],
  en: [[1.12, 2.72, 4.24], [2.33], [0, 1.6, 3.84], [0.75, 2.8, 4.72], [1.2, 2.72, 3.44], [1.36], [1.68]],
};

const ZAD: ZadPose[] = ['think', 'sad', 'love', 'wave', 'clap', 'dua', 'cheer'];
const EASE = [0.22, 1, 0.36, 1] as const;
const FOIL = 'linear-gradient(100deg,#B4552F 0%,#F6D58E 30%,#FFF1C9 45%,#E5A93C 60%,#F6D58E 75%,#B4552F 100%)';

/** Zad's travel bag: crimson leather, gold stitching, the khatam clasp. */
export function Bag() {
  return (
    <svg viewBox="0 0 210 190" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="hero-bag-leather" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D3363C" /><stop offset="1" stopColor="#951419" /></linearGradient>
      </defs>
      <path d="M70 66c0-38 70-38 70 0" fill="none" stroke="#951419" strokeWidth="10" strokeLinecap="round" />
      <rect x="18" y="66" width="174" height="118" rx="26" fill="url(#hero-bag-leather)" />
      <rect x="28" y="76" width="154" height="98" rx="20" fill="none" stroke="#F6D58E" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="5 5" />
      <path d="M34 70 H176" stroke="#F6D58E" strokeWidth="4" strokeDasharray="3 3" />
      <path d="M18 92c0-14 12-26 26-26h122c14 0 26 12 26 26v14c0 4-3 7-7 8l-80 18-80-18c-4-1-7-4-7-8z" fill="url(#hero-bag-leather)" />
      <path d="M30 100c0-9 7-16 16-16h118c9 0 16 7 16 16v4l-75 17-75-17z" fill="none" stroke="#F6D58E" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="5 5" />
      <g transform="translate(105 122)">
        <rect x="-13" y="-13" width="26" height="26" rx="4" fill="#E5A93C" />
        <rect x="-13" y="-13" width="26" height="26" rx="4" fill="#E5A93C" transform="rotate(45)" />
        <circle r="5.5" fill="#951419" />
      </g>
    </svg>
  );
}

/** A simple figure: plain, or with the head covered. */
function Figure({ covered, className }: { covered?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {covered ? <path d="M13 21c0-8 5-13 11-13s11 5 11 13v5c-3 3-7 4-11 4s-8-1-11-4z" fill="currentColor" opacity=".9" /> : null}
      <circle cx="24" cy={covered ? 19 : 17} r={covered ? 6 : 7.5} fill={covered ? '#2A1A14' : 'currentColor'} />
      <path d="M8 46c0-10 7-15 16-15s16 5 16 15z" fill="currentColor" />
    </svg>
  );
}

/** Gold dust drifting up through every scene. Positions are fixed, so it never jumps between renders. */
const DUST = Array.from({ length: 22 }, (_, k) => ({ x: (k * 37) % 100, d: 6 + ((k * 13) % 7), delay: (k * 0.7) % 6, s: 2 + (k % 3) }));
function Dust({ reduce }: { reduce: boolean }) {
  if (reduce) return null;
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {DUST.map((p, k) => (
        <motion.span
          key={k}
          className="absolute bottom-0 rounded-full bg-[#F6D58E]"
          style={{ left: `${p.x}%`, width: p.s, height: p.s, boxShadow: '0 0 8px rgba(246,213,142,0.9)' }}
          animate={{ y: ['0%', '-900%'], opacity: [0, 0.8, 0] }}
          transition={{ duration: p.d, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

/** One phrase at a time: mask reveal, a crimson bar under the lifted word, a slice for the turn. */
function Kinetic({ beat, reduce, big }: { beat: Beat; reduce: boolean; big?: boolean }) {
  return (
    <div className="relative inline-block overflow-hidden px-3 pb-1">
      {beat.hl && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[6%] top-[16%] rounded-xl bg-[#C51F24] shadow-[0_10px_30px_-8px_rgba(197,31,36,0.8)]"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.3, ease: EASE, delay: 0.05 }}
        />
      )}
      <motion.span
        className={`relative block font-editorial font-bold leading-[1.18] ${beat.hl ? 'text-[#FAF7F2]' : 'text-[#F6D58E]'} ${big ? 'text-[3.4rem] sm:text-8xl lg:text-9xl' : ''}`}
        initial={reduce ? { opacity: 0 } : { y: '110%', rotate: 3 }}
        animate={reduce ? { opacity: 1 } : { y: 0, rotate: 0 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        {beat.text}
      </motion.span>
      {beat.slice && !reduce && (
        <motion.span
          aria-hidden="true"
          className="absolute -inset-y-6 w-[16%] bg-[#FAF7F2] mix-blend-overlay"
          style={{ rotate: 18 }}
          initial={{ left: '-25%' }}
          animate={{ left: '125%' }}
          transition={{ duration: 0.45, delay: 0.2, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}

const pop = (reduce: boolean, delay = 0) => (reduce ? {} : { initial: { opacity: 0, scale: 0.6, y: 30 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { type: 'spring' as const, stiffness: 240, damping: 18, delay } });

/** The picture of each scene. `t` is seconds since the scene began, `c` its cues. */
function Picture({ i, t, c, isEn, reduce }: { i: number; t: number; c: number[]; isEn: boolean; reduce: boolean }) {
  // 0. The hook: everyday things circle the bag; at "one thing" they fall away and the bag glows; a plane leaves; "?".
  if (i === 0) {
    const items = [Plane, Smartphone, Shirt, Wallet, KeyRound, Camera];
    const one = t >= c[0];
    return (
      <div className="relative w-[150px] sm:w-[200px]">
        {items.map((Icon, k) => {
          const a = (k / items.length) * Math.PI * 2 + (reduce ? 0 : t * 0.9);
          return (
            <span
              key={k}
              className="absolute left-1/2 top-1/2 grid place-items-center w-12 h-12 -ml-6 -mt-6 rounded-2xl bg-[#FAF7F2] text-[#1C1411] shadow-xl transition-[opacity,transform] duration-700"
              style={{ transform: one ? `translate(${Math.cos(a) * 160}px, ${260}px) rotate(40deg)` : `translate(${Math.cos(a) * 170}px, ${Math.sin(a) * 105}px)`, opacity: one ? 0 : 1 }}
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
            </span>
          );
        })}
        {one && <motion.span aria-hidden="true" className="absolute inset-[-40%] rounded-full bg-[radial-gradient(closest-side,rgba(255,241,201,0.75),rgba(229,169,60,0.25)_55%,transparent)]" initial={reduce ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, ease: EASE }} />}
        <div className="relative"><Bag /></div>
        {t >= c[1] && !reduce && (
          <svg viewBox="0 0 400 140" className="absolute -top-24 -inset-x-28 sm:-inset-x-40 h-auto overflow-visible" aria-hidden="true">
            <motion.path d="M10 130 C 120 -10, 280 -10, 390 40" fill="none" stroke="#F6D58E" strokeWidth="2" strokeDasharray="6 8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: EASE }} />
          </svg>
        )}
        {t >= c[2] && (
          <motion.span className="absolute top-[-8%] -end-16 sm:-end-24 font-editorial font-bold text-7xl sm:text-9xl" style={{ backgroundImage: FOIL, WebkitBackgroundClip: 'text', color: 'transparent' }} {...pop(reduce)}>
            {isEn ? '?' : '؟'}
          </motion.span>
        )}
      </div>
    );
  }
  // 1. The precious thing glows above the bag; the bag tries to close and cannot hold it.
  if (i === 1) return (
    <div className="relative w-[150px] sm:w-[200px] pt-24 sm:pt-32">
      <motion.div className="absolute left-1/2 top-0 -translate-x-1/2" animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
        <span aria-hidden="true" className="absolute inset-[-35%] rounded-full bg-[radial-gradient(closest-side,rgba(255,241,201,0.8),transparent)]" />
        <Medal id="surah" eager className={`relative ${t >= c[0] ? 'w-36 h-36 sm:w-48 sm:h-48' : 'w-28 h-28 sm:w-36 sm:h-36'} transition-[width,height] duration-700`} />
      </motion.div>
      <motion.div className="relative" animate={t >= c[0] && !reduce ? { x: [0, -10, 10, -8, 8, 0], rotate: [0, -3, 3, -2, 2, 0] } : undefined} transition={{ duration: 0.6 }}><Bag /></motion.div>
    </div>
  );
  // 2. What we carry instead: the words of Allah, our grandparents' language, a faith that stays in our children.
  if (i === 2) {
    const n = c.filter((at) => t >= at).length;
    return (
      <div className="flex items-end justify-center gap-6 sm:gap-12">
        {n >= 1 && <motion.div className="flex flex-col items-center gap-2" {...pop(reduce)}><Medal id="surah" eager className={n === 1 ? 'w-36 h-36 sm:w-44 sm:h-44' : 'w-24 h-24 sm:w-28 sm:h-28'} /></motion.div>}
        {n >= 2 && (
          <motion.div className="relative grid place-items-center" {...pop(reduce)}>
            <Medal id="language-level" eager className={n === 2 ? 'w-36 h-36 sm:w-44 sm:h-44' : 'w-24 h-24 sm:w-28 sm:h-28'} />
            {['أ', 'ب', 'ض'].map((ch, k) => (
              <motion.span key={ch} lang="ar" className="absolute font-bold text-2xl sm:text-3xl text-[#F6D58E]" style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }} initial={reduce ? false : { y: 0, opacity: 0 }} animate={{ y: -90 - k * 18, x: (k - 1) * 40, opacity: [0, 1, 0.7] }} transition={{ duration: 1.6, delay: 0.2 + k * 0.2, ease: EASE }}>{ch}</motion.span>
            ))}
          </motion.div>
        )}
        {n >= 3 && (
          <motion.div className="flex items-end gap-1 text-[#F6D58E] drop-shadow-[0_0_18px_rgba(246,213,142,0.55)]" {...pop(reduce)}>
            <Figure className="h-24 sm:h-32 w-auto" />
            <Figure covered className="h-14 sm:h-20 w-auto" />
            <Figure className="h-12 sm:h-16 w-auto" />
          </motion.div>
        )}
      </div>
    );
  }
  // 3. A teacher who knows your name → hears every letter → never starts from zero.
  if (i === 3) {
    if (t < c[1]) {
      const name = isEn ? 'Hi, Yusuf' : 'أهلًا يا يوسف';
      const shown = reduce ? name.length : Math.max(0, Math.min(name.length, Math.floor((t - c[0]) * 14)));
      return (
        <motion.div className="flex items-center gap-4 rounded-[1.75rem] bg-[#FAF7F2] px-5 py-4 sm:px-7 sm:py-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]" {...pop(reduce)}>
          <Medal id="teacher" eager className="w-16 h-16 sm:w-20 sm:h-20" />
          <div className="text-start">
            <p className="text-xs sm:text-sm font-bold text-[#B4552F]">{isEn ? 'Your teacher' : 'معلّمك'}</p>
            <p className="font-editorial font-bold text-2xl sm:text-4xl text-[#1C1411] min-w-[7ch]">{name.slice(0, shown)}<span className="inline-block w-[2px] h-[0.9em] align-middle bg-[#C51F24] animate-pulse" /></p>
          </div>
        </motion.div>
      );
    }
    if (t < c[2]) {
      // Every letter heard: a word lights letter by letter over a live sound wave.
      const word = 'بِسْمِ اللهِ';
      const lit = reduce ? 99 : Math.floor((t - c[1]) * 5);
      return (
        <div className="flex flex-col items-center gap-4">
          <p lang="ar" dir="rtl" className="text-5xl sm:text-7xl" style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }}>
            {Array.from(word).map((ch, k) => <span key={k} className="transition-colors duration-300" style={{ color: k <= lit ? '#F6D58E' : 'rgba(250,247,242,0.25)' }}>{ch}</span>)}
          </p>
          <div className="flex items-end gap-1.5 h-12" aria-hidden="true">
            {Array.from({ length: 18 }, (_, k) => <span key={k} className="w-1.5 rounded-full bg-[#E5A93C]" style={{ height: `${reduce ? 40 : 20 + Math.abs(Math.sin(t * 9 + k * 0.7)) * 80}%` }} />)}
          </div>
        </div>
      );
    }
    return (
      <div className="relative grid place-items-center">
        <span lang="en" className="font-editorial font-bold text-[7rem] sm:text-[11rem] leading-none text-transparent [-webkit-text-stroke:3px_#F6D58E]">0</span>
        {!reduce && <motion.span aria-hidden="true" className="absolute h-3 w-[140%] rounded-full bg-[#C51F24] shadow-[0_0_30px_rgba(197,31,36,0.9)]" style={{ rotate: -28 }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3, delay: 0.35, ease: EASE }} />}
      </div>
    );
  }
  // 4. The real portal: the teacher's note, a notification, the badges, and a new badge bursting out.
  if (i === 4) {
    const screen = t < c[1] ? 'note' : 'badges';
    return (
      <div className="relative">
        <motion.div className="relative w-[150px] sm:w-[200px] aspect-[390/844] rounded-[1.9rem] p-[5px] bg-[linear-gradient(145deg,#5A4A42,#1C1411_40%,#3B2E28_70%,#120C09)] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)]" initial={reduce ? false : { y: 140, rotate: -8, opacity: 0 }} animate={{ y: 0, rotate: t > c[2] ? -4 : 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
          <div className="relative h-full w-full overflow-hidden rounded-[1.55rem] bg-[#FAF7F2]">
            {(['note', 'badges'] as const).map((sc) => (
              <img key={sc} src={`/media/portal/${isEn ? 'en' : 'ar'}-${sc}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500" style={{ opacity: sc === screen ? 1 : 0 }} />
            ))}
            <span className="absolute top-1.5 left-1/2 -translate-x-1/2 h-3.5 w-[34%] rounded-full bg-[#0B0806]" />
          </div>
        </motion.div>
        {t > c[0] && t < c[1] + 0.5 && (
          <motion.div className="absolute -top-4 -start-16 sm:-start-28 w-[210px] sm:w-[260px] rounded-2xl bg-[#FAF7F2] px-3 py-2.5 shadow-2xl text-start" initial={reduce ? false : { y: -30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#087D91]"><span className="grid place-items-center w-4 h-4 rounded-full bg-[#087D91] text-[#FAF7F2]"><Check className="w-2.5 h-2.5" aria-hidden="true" /></span>{isEn ? 'From your teacher' : 'من المعلّم'}</p>
            <p className="mt-0.5 text-xs sm:text-sm font-bold text-[#1C1411] leading-snug">{isEn ? 'Beautiful recitation today. Homework: verses 1–30.' : 'ما شاء الله، تلاوة هادئة اليوم. الواجب: الآيات ١–٣٠.'}</p>
          </motion.div>
        )}
        {t > c[2] && (
          <div className="absolute top-1/2 -end-20 sm:-end-32 -translate-y-1/2">
            {!reduce && Array.from({ length: 12 }, (_, k) => (
              <motion.span key={k} aria-hidden="true" className="absolute left-1/2 top-1/2 h-[3px] w-10 rounded-full bg-[#F6D58E]" style={{ rotate: k * 30, originX: 0 }} initial={{ scaleX: 0, x: 20, opacity: 1 }} animate={{ scaleX: 1, x: 90, opacity: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} />
            ))}
            <motion.span className="block" initial={reduce ? false : { scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>
              <Medal id={isEn ? 'homework-10' : 'homework-10-ar'} eager className="w-28 h-28 sm:w-40 sm:h-40" />
            </motion.span>
          </div>
        )}
      </div>
    );
  }
  // 5. The verse we are named after, said in full: gold calligraphy, a slow khatam turning behind it.
  if (i === 5) return (
    <div className="relative grid place-items-center w-full">
      <motion.svg viewBox="0 0 200 200" className="absolute w-[320px] sm:w-[440px] opacity-40" aria-hidden="true" animate={reduce ? undefined : { rotate: 30 }} transition={{ duration: 6, ease: 'linear' }}>
        <g transform="translate(100 100)" fill="none" stroke="#E5A93C" strokeWidth="1.2">
          <rect x="-62" y="-62" width="124" height="124" rx="8" />
          <rect x="-62" y="-62" width="124" height="124" rx="8" transform="rotate(45)" />
          <circle r="86" strokeDasharray="2 5" />
        </g>
      </motion.svg>
      <motion.p lang="ar" dir="rtl" className="relative px-4 text-center text-[2.6rem] leading-[1.7] sm:text-7xl sm:leading-[1.5]" style={{ fontFamily: "'Amiri Quran', var(--font-serif)", backgroundImage: FOIL, backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', color: 'transparent' }} initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, backgroundPosition: ['0% 0%', '100% 0%'] }} transition={{ duration: 1, ease: EASE, backgroundPosition: { duration: 3, ease: 'easeInOut' } }}>
        <span className="block">﴿ وَتَزَوَّدُوا</span>
        {t >= c[0] && <motion.span className="block" initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ ﴾</motion.span>}
      </motion.p>
    </div>
  );
  // 6. The invitation.
  return (
    <div className="flex flex-col items-center gap-4">
      <ZadRigSvg pose="cheer" size={130} />
      {t >= c[0] && (
        <motion.span className="rounded-full bg-[#C51F24] px-7 py-3.5 text-lg sm:text-2xl font-bold text-[#FAF7F2] shadow-[0_18px_40px_-12px_rgba(197,31,36,0.8)]" {...pop(reduce)}>
          {isEn ? 'Book the free first lesson' : 'احجز الحصة الأولى مجانًا'}
        </motion.span>
      )}
      <p className="font-editorial font-bold text-xl sm:text-3xl text-[#F6D58E]">{isEn ? 'Watazawwado' : 'وتزوّدوا'}</p>
    </div>
  );
}

// Film grain: a tiny noise tile, drawn once.
export const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")";

// Each scene's light: espresso always, the glow moves and changes warmth.
const LIGHT = [
  'radial-gradient(60% 55% at 50% 60%, #4A2A1E 0%, #22150F 60%, #0E0907 100%)',
  'radial-gradient(55% 60% at 50% 30%, #5A3422 0%, #24160F 60%, #0E0907 100%)',
  'radial-gradient(70% 60% at 50% 45%, #6A2A1E 0%, #2A1712 60%, #0E0907 100%)',
  'radial-gradient(70% 60% at 30% 30%, #3A2A24 0%, #1A110D 60%, #0A0706 100%)',
  'radial-gradient(65% 60% at 50% 45%, #5A3A1E 0%, #24160F 60%, #0E0907 100%)',
  'radial-gradient(70% 60% at 70% 40%, #4A2A1E 0%, #22150F 60%, #0E0907 100%)',
  'radial-gradient(70% 60% at 50% 55%, #55301F 0%, #24160F 60%, #0E0907 100%)',
  'radial-gradient(75% 65% at 50% 40%, #6A3A1E 0%, #2A1A14 55%, #140E0B 100%)',
];

export function IntroFilm({ isEn, onTrial, record = false }: { isEn: boolean; onTrial: () => void; record?: boolean }) {
  const reduce = !!useReducedMotion() && !record;
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [state, setState] = React.useState<'idle' | 'playing' | 'paused' | 'done'>('idle');
  const [now, setNow] = React.useState(0);
  const lang: Lang = isEn ? 'en' : 'ar';
  const starts = STARTS[lang];

  // A language switch mid-film starts over in the new language.
  React.useEffect(() => { audioRef.current?.pause(); setState('idle'); setNow(0); }, [isEn]);

  // While playing, follow the audio clock every frame so the words land on the voice.
  React.useEffect(() => {
    if (state !== 'playing') return;
    let raf = 0;
    const tick = () => { setNow(audioRef.current?.currentTime ?? 0); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const play = () => {
    const a = audioRef.current;
    if (!a) return;
    if (state === 'done' || state === 'idle') { a.currentTime = 0; setNow(0); }
    void a.play().then(() => setState('playing')).catch(() => setState('idle'));
  };

  // On play, fetch every picture the film uses, so nothing pops in late.
  React.useEffect(() => {
    if (state !== 'playing') return;
    const L = isEn ? 'en' : 'ar';
    ['surah', 'tajweed', 'juz', 'zad-level', 'language-level', 'teacher', isEn ? 'homework-10' : 'homework-10-ar'].map((m) => `/badges/shelf/${m}.webp`)
      .concat([`/media/portal/${L}-note.webp`, `/media/portal/${L}-badges.webp`])
      .forEach((src) => { const im = new Image(); im.src = src; });
  }, [state, isEn]);

  // The ad export: larger pictures on a full screen (the scenes are drawn for a ~1024 px stage).
  const [zoom, setZoom] = React.useState({ pic: 1, text: 1 });
  React.useEffect(() => {
    if (!record) return;
    const on = () => {
      const w = window.innerWidth, h = window.innerHeight;
      setZoom(h > w ? { pic: w / 600, text: 1.6 } : { pic: h / 820, text: 1.5 });
    };
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [record]);

  // The ad export (?film=record) starts the film from a page script once the page is ready.
  React.useEffect(() => {
    if (!record) return;
    (window as unknown as { __playFilm?: () => void }).__playFilm = play;
  });

  let scene = 0;
  starts.forEach((st, k) => { if (now >= st) scene = k; });
  const local = now - starts[scene];
  const beats = BEATS[lang][scene];
  let beatIdx = -1;
  beats.forEach((b, k) => { if (local >= b.at) beatIdx = k; });
  const beat = beats[Math.max(0, beatIdx)];
  const running = state === 'playing' || state === 'paused';
  const textOnly = false;
  const noWords = scene === 5; // the verse scene: the verse is the picture

  return (
    <figure className={record ? 'fixed inset-0 z-[100] bg-black' : 'relative mx-auto w-full max-w-5xl'} aria-label={isEn ? 'Our story in 35 seconds' : 'قصتنا في ٣٥ ثانية'}>
      <div
        className={`relative overflow-hidden ${record ? 'h-full w-full' : 'aspect-[4/5] sm:aspect-video rounded-[1.75rem] sm:rounded-[2.25rem] ring-1 ring-[#F6D58E]/25 shadow-[0_40px_90px_-40px_rgba(28,20,17,0.75)]'}`}
        style={{ background: LIGHT[running ? scene : 6], transition: 'background 0.6s ease' }}
      >
        <audio ref={audioRef} src={isEn ? '/media/intro-film/en-v3.mp3' : '/media/intro-film/ar-v3.mp3'} preload="none" onEnded={() => setState('done')} onPause={() => setState((s) => (s === 'playing' ? 'paused' : s))} />

        {running ? (
          <>
            <Dust reduce={reduce} />
            {/* Hard cut between scenes, with a whip-in and a gold flash. No exit animations: a scene never waits for
                the last one to leave (an exit that never finished once froze the film on one scene). */}
            <motion.div
              key={scene}
              className="absolute inset-0 flex flex-col items-center justify-center gap-[5%] px-6 pb-[13%] pt-[8%]"
              initial={reduce ? { opacity: 0 } : record ? { x: isEn ? '12%' : '-12%', opacity: 0, scale: 1.05 } : { x: isEn ? '12%' : '-12%', filter: 'blur(14px)', opacity: 0, scale: 1.05 }}
              animate={record ? { x: 0, opacity: 1, scale: 1 } : { x: 0, filter: 'blur(0px)', opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              <div className={`relative text-center leading-tight min-h-[1.3em] ${textOnly ? '' : 'text-[1.9rem] sm:text-5xl lg:text-6xl'}`} style={zoom.text > 1 ? { zoom: zoom.text } : undefined}>
                {beatIdx >= 0 && !noWords && (
                  textOnly && beat.hl ? (
                    // The name in gold foil, with a light sweep.
                    <motion.span key={beat.text} className="relative block font-editorial font-bold text-[5rem] sm:text-[9rem] lg:text-[11rem] leading-none" style={{ backgroundImage: FOIL, backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', color: 'transparent' }} initial={reduce ? false : record ? { scale: 1.6, opacity: 0 } : { scale: 1.6, opacity: 0, filter: 'blur(12px)' }} animate={record ? { scale: 1, opacity: 1, backgroundPosition: ['0% 0%', '100% 0%'] } : { scale: 1, opacity: 1, filter: 'blur(0px)', backgroundPosition: ['0% 0%', '100% 0%'] }} transition={{ duration: 0.7, ease: EASE, backgroundPosition: { duration: 1.6, ease: 'easeInOut' } }}>
                      {beat.text}
                    </motion.span>
                  ) : (
                    <Kinetic key={beat.text} beat={beat} reduce={reduce} big={textOnly} />
                  )
                )}
              </div>
              <div className="relative w-full flex justify-center" style={zoom.pic > 1 ? { zoom: zoom.pic } : undefined}><Picture i={scene} t={local} c={CUES[lang][scene]} isEn={isEn} reduce={reduce} /></div>
            </motion.div>
            {!reduce && <motion.div key={`flash-${scene}`} aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(closest-side,rgba(255,241,201,0.55),transparent)]" initial={{ opacity: scene === 0 ? 0 : 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.35 }} />}
          </>
        ) : (
          // Poster: the thumbnail (owner, 2026-11-18): the hook in gold, the bag with Zad peeking out, travel things and two
          // medals around it, one big play button. Plain markup and CSS only, painted on first load; the medals are
          // already on the page (hero orbit), so nothing new is fetched.
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[52%] w-[70%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(246,213,142,0.42), rgba(229,169,60,0.14) 55%, transparent)' }} />
            {state !== 'done' ? (
              <>
                {/* A beam of light falls on the open bag. */}
                <div aria-hidden="true" className="absolute left-1/2 top-0 h-full w-[55%] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,241,201,0.22),rgba(255,241,201,0.06)_55%,transparent_80%)] [clip-path:polygon(38%_0,62%_0,100%_100%,0_100%)]" />
                {/* The hook, in two strokes: gold foil, then the question on a crimson bar. */}
                <div className="absolute inset-x-0 top-[6%] px-5 text-center">
                  <p className="font-editorial font-bold leading-[1.05] text-[2.4rem] sm:text-6xl lg:text-7xl" style={{ backgroundImage: FOIL, WebkitBackgroundClip: 'text', color: 'transparent' }}>
                    {isEn ? 'Just ONE thing…' : 'شيءٌ واحدٌ فقط…'}
                  </p>
                  <p className="mt-2 sm:mt-3 inline-block rounded-xl bg-[#C51F24] px-4 py-1 font-editorial font-bold text-[1.6rem] sm:text-4xl lg:text-5xl text-[#FAF7F2] shadow-[0_14px_30px_-10px_rgba(197,31,36,0.9)] -rotate-1">
                    {isEn ? 'what would you carry?' : 'ماذا تحمل معك؟'}
                  </p>
                </div>
                {/* The bag glows from inside; the answer rises out of it; everyday things are left behind, crossed out. */}
                <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 w-[30%] sm:w-[17%] max-w-[200px]" aria-hidden="true">
                  <span className="absolute inset-[-55%] rounded-full bg-[radial-gradient(closest-side,rgba(255,241,201,0.7),rgba(229,169,60,0.28)_50%,transparent)]" />
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-[62%] w-[78%]"><Medal id="surah" eager className="w-full h-auto drop-shadow-[0_0_30px_rgba(255,241,201,0.9)]" /></span>
                  <div className="relative drop-shadow-[0_30px_40px_rgba(0,0,0,0.65)]"><Bag /></div>
                  {[{ I: Smartphone, x: '-75%', y: '-5%', r: -14 }, { I: Wallet, x: '-95%', y: '60%', r: 10 }, { I: KeyRound, x: '150%', y: '-12%', r: 12 }, { I: Shirt, x: '165%', y: '55%', r: -10 }].map(({ I, x, y, r }, k) => (
                    <span key={k} className="absolute top-0 left-0 grid place-items-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FAF7F2]/90 text-[#1C1411]/70 shadow-[0_14px_24px_-10px_rgba(0,0,0,0.7)]" style={{ left: x, top: y, transform: `rotate(${r}deg)` }}>
                      <I className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                      <span className="absolute h-[3px] w-[130%] rounded-full bg-[#C51F24] rotate-[-35deg]" />
                    </span>
                  ))}
                </div>
                {/* Zad, wide-eyed, beside the bag. */}
                <div className="absolute top-[44%] start-[3%] sm:start-[22%]" aria-hidden="true"><ZadRigSvg pose="wow" size={110} /></div>
                {/* One big play button: glass ring, crimson core, a slow pulse. */}
                <div className="absolute inset-x-0 bottom-[4%] flex flex-col items-center gap-2">
                  <button
                    id="intro-film-play"
                    type="button"
                    onClick={play}
                    className="group relative grid place-items-center w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-full bg-[#FAF7F2]/15 ring-1 ring-[#FAF7F2]/40 transition-transform duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/70"
                    aria-label={isEn ? 'Play our story, 35 seconds, with sound' : 'شغّل قصتنا، ٣٥ ثانية بالصوت'}
                  >
                    <span aria-hidden="true" className="absolute inset-0 rounded-full ring-2 ring-[#F6D58E]/60 animate-ping [animation-duration:2.2s]" />
                    <span className="grid place-items-center w-14 h-14 sm:w-[4.2rem] sm:h-[4.2rem] rounded-full bg-[linear-gradient(145deg,#E3343A,#951419)] text-[#FAF7F2] shadow-[0_12px_30px_-6px_rgba(197,31,36,0.9),inset_0_1px_1px_rgba(255,255,255,0.35)]">
                      <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-[2px] rtl:-translate-x-[2px] rtl:-scale-x-100" aria-hidden="true" />
                    </span>
                  </button>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0E0907]/70 px-3 py-1 text-xs sm:text-sm font-bold text-[#FAF7F2]/90">
                    <Volume2 className="w-4 h-4 text-[#F6D58E]" aria-hidden="true" />{isEn ? 'Sound on · 35 seconds' : 'علّي الصوت · ٣٥ ثانية'}
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-6 px-6 text-center">
                <div className="relative"><ZadRigSvg pose="cheer" size={120} /></div>
                <p className="relative font-editorial font-bold text-3xl sm:text-5xl text-[#FAF7F2] leading-tight">
                  {isEn ? <>The first lesson is <span className="text-[#F6D58E]">on us</span></> : <>الحصّة الأولى <span className="text-[#F6D58E]">علينا</span></>}
                </p>
                <div className="relative flex flex-col sm:flex-row items-center gap-3">
                  <button type="button" id="intro-film-play" onClick={play} className="inline-flex items-center gap-2.5 rounded-full bg-[#FAF7F2] ps-2 pe-5 py-2 min-h-11 text-[#1C1411] font-bold text-sm sm:text-base transition-transform duration-200 hover:scale-[1.04] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60">
                    <span className="grid place-items-center w-9 h-9 rounded-full bg-[#C51F24] text-[#FAF7F2]"><RotateCcw className="w-4 h-4" aria-hidden="true" /></span>
                    {isEn ? 'Watch again' : 'شاهد مرة أخرى'}
                  </button>
                  <button type="button" onClick={onTrial} className="rounded-full bg-[#C51F24] px-5 py-2.5 min-h-11 text-sm sm:text-base font-bold text-[#FAF7F2] shadow-lg hover:bg-[#A8191E] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60">
                    {isEn ? 'Book the free first lesson' : 'احجز الحصة الأولى مجانًا'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zad rides along in a corner of every scene where he is not the picture. */}
        {running && scene !== 6 && (
          <motion.div key={`zad-${scene}`} className="absolute top-3 start-3 sm:top-5 sm:start-5 pointer-events-none" aria-hidden="true" initial={reduce ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
            <ZadRigSvg pose={ZAD[scene]} size={record ? 170 : 64} glow={false} />
          </motion.div>
        )}

        {/* Caption line: the whole sentence, for watching muted. */}
        {running && (
          <figcaption className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-10 sm:px-10 sm:pb-7 bg-gradient-to-t from-[#0E0907]/95 to-transparent pointer-events-none">
            <p className={`mx-auto max-w-3xl text-center leading-snug text-[#FAF7F2]/85 ${record ? 'text-[2.6rem] px-8 pb-12' : 'text-sm sm:text-lg'}`}>{isEn ? LINES[scene].en : LINES[scene].ar}</p>
          </figcaption>
        )}

        {/* How far along: a thin gold line (keeps people watching to the end). */}
        {running && <span aria-hidden="true" className="absolute bottom-0 start-0 h-[3px] bg-[linear-gradient(90deg,#C51F24,#E5A93C)]" style={{ width: `${Math.min(100, (now / LENGTH) * 100)}%` }} />}

        {/* Film grain and a soft vignette over everything. */}
        {/* (The ad export skips the blend: full-screen blending stalls the recorder.) */}
        <div aria-hidden="true" className={`absolute inset-0 pointer-events-none ${record ? 'opacity-[0.04]' : 'opacity-[0.09] mix-blend-overlay'}`} style={{ backgroundImage: GRAIN }} />
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none shadow-[inset_0_0_140px_rgba(0,0,0,0.6)]" />

        {running && !record && (
          <button
            type="button"
            onClick={() => (state === 'playing' ? audioRef.current?.pause() : play())}
            className="absolute top-3 end-3 sm:top-5 sm:end-5 grid place-items-center w-11 h-11 rounded-full bg-[#FAF7F2]/15 text-[#FAF7F2] backdrop-blur hover:bg-[#FAF7F2]/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6D58E]"
            aria-label={state === 'playing' ? (isEn ? 'Pause' : 'إيقاف مؤقت') : (isEn ? 'Play' : 'تشغيل')}
          >
            {state === 'playing' ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4 fill-current" aria-hidden="true" />}
          </button>
        )}
      </div>
    </figure>
  );
}
