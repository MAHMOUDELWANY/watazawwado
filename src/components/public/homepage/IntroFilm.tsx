import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Camera, Check, KeyRound, Pause, Play, Plane, RotateCcw, Shirt, Smartphone, Wallet } from 'lucide-react';
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

// Scene start times (s), from the word alignment of each take.
const STARTS: Record<Lang, number[]> = {
  ar: [0, 4.4, 6.16, 9.2, 16.23, 21.92, 29.68, 36.88],
  en: [0, 4.16, 5.6, 9.76, 16.48, 22.56, 30.33, 36.96],
};
const LENGTH = 42.2;

// What the voice says, for the caption line.
const LINES: L[] = [
  { en: 'If you left tomorrow... what would you pack?', ar: 'لو سافرتَ غدًا... ماذا تضعُ في حقيبتك؟' },
  { en: 'We know the answer.', ar: 'نحن نعرفُ الجواب.' },
  { en: 'Zad. Provision... for you, and your family.', ar: 'زادٌ... لك، ولأهلِ بيتك.' },
  { en: "Far from home, the Quran and Arabic don't come on their own... they need a teacher who knows you by name.", ar: 'في الغربة، لا يأتي القرآنُ والعربيّةُ وحدهما... يحتاجان معلّمًا، يعرفُك باسمك.' },
  { en: 'Quran and Tajweed... memorisation and revision... the Zad Path... Arabic, and English.', ar: 'قرآنٌ وتجويد... حفظٌ ومراجعة... منهجُ زاد... والعربيّة، والإنجليزيّة.' },
  { en: 'A male or female teacher you choose. Who stays with you, lesson after lesson... and never starts from zero.', ar: 'معلّمٌ أو معلّمةٌ تختارُه أنت، يبقى معك حصّةً بعد حصّة... ولا يبدأُ من الصفر، أبدًا.' },
  { en: 'After every lesson, a note reaches you before you ask... and every homework you finish earns you a new badge!', ar: 'وبعد كلِّ حصّة، يصلُك تقريرٌ قبل أن تسأل... وكلُّ واجبٍ تُنجزُه، تكسبُ به شارةً جديدة!' },
  { en: 'The first lesson... is on us. Come and meet us... and start your Zad, today.', ar: 'الحصّةُ الأولى... علينا. تعالَ نتعرّف... وابدأ زادَك، اليوم.' },
];

// The words on screen, by seconds from the start of each scene, on the voice.
const BEATS: Record<Lang, Beat[][]> = {
  ar: [
    [{ at: 0.3, text: 'لو سافرتَ غدًا' }, { at: 1.75, text: 'ماذا تضع' }, { at: 2.4, text: 'في حقيبتك؟', hl: true }],
    [{ at: 0, text: 'نحن نعرف' }, { at: 0.7, text: 'الجواب', hl: true }],
    [{ at: 0, text: 'زاد', hl: true }, { at: 0.88, text: 'لك' }, { at: 1.6, text: 'ولأهل بيتك' }],
    [{ at: 0, text: 'في الغربة' }, { at: 0.88, text: 'القرآن والعربيّة' }, { at: 2.7, text: 'لا يأتيان وحدهما', hl: true }, { at: 3.76, text: 'يحتاجان معلّمًا' }, { at: 5.36, text: 'يعرفك باسمك', hl: true }],
    [{ at: 0, text: 'قرآن وتجويد' }, { at: 1.2, text: 'حفظ ومراجعة' }, { at: 2.58, text: 'منهج زاد', hl: true }, { at: 3.62, text: 'العربيّة' }, { at: 4.58, text: 'الإنجليزيّة' }],
    [{ at: 0, text: 'معلّم أو معلّمة' }, { at: 1.72, text: 'تختاره أنت', hl: true }, { at: 3.1, text: 'يبقى معك' }, { at: 3.88, text: 'حصّة بعد حصّة' }, { at: 5.52, text: 'ولا يبدأ من الصفر' }, { at: 7.04, text: 'أبدًا', hl: true, slice: true }],
    [{ at: 0, text: 'بعد كلّ حصّة' }, { at: 1.2, text: 'يصلك تقرير', hl: true }, { at: 2.24, text: 'قبل أن تسأل' }, { at: 3.44, text: 'وكلّ واجب تنجزه' }, { at: 5.12, text: 'شارة جديدة!', hl: true }],
    [{ at: 0, text: 'الحصّة الأولى' }, { at: 1.28, text: 'علينا', hl: true }, { at: 2.16, text: 'تعالَ نتعرّف' }, { at: 3.48, text: 'ابدأ زادك اليوم', hl: true }],
  ],
  en: [
    [{ at: 0.3, text: 'If you left tomorrow' }, { at: 2.32, text: 'what would you pack?', hl: true }],
    [{ at: 0, text: 'We know' }, { at: 0.4, text: 'the answer', hl: true }],
    [{ at: 0, text: 'Zad', hl: true }, { at: 0.88, text: 'Provision' }, { at: 1.84, text: 'for you' }, { at: 2.72, text: 'and your family' }],
    [{ at: 0, text: 'Far from home' }, { at: 1.28, text: 'the Quran and Arabic' }, { at: 2.4, text: "don't come on their own", hl: true }, { at: 4.0, text: 'they need a teacher' }, { at: 5.08, text: 'who knows you by name', hl: true }],
    [{ at: 0, text: 'Quran & Tajweed' }, { at: 1.36, text: 'Memorisation' }, { at: 3.24, text: 'the Zad Path', hl: true }, { at: 4.4, text: 'Arabic' }, { at: 5.28, text: 'English' }],
    [{ at: 0, text: 'A male or female teacher' }, { at: 1.92, text: 'you choose', hl: true }, { at: 2.88, text: 'who stays with you' }, { at: 4.08, text: 'lesson after lesson' }, { at: 5.76, text: 'never starts' }, { at: 7.04, text: 'from zero', hl: true, slice: true }],
    [{ at: 0, text: 'After every lesson' }, { at: 1.2, text: 'a note reaches you', hl: true }, { at: 2.16, text: 'before you ask' }, { at: 3.4, text: 'every homework' }, { at: 4.88, text: 'a new badge!', hl: true }],
    [{ at: 0, text: 'The first lesson' }, { at: 1.08, text: 'is on us', hl: true }, { at: 2.16, text: 'Come and meet us' }, { at: 3.36, text: 'start your Zad today', hl: true }],
  ],
};

// Cues inside a scene that change the picture (seconds from the scene start).
const CUES: Record<Lang, number[][]> = {
  ar: [[2.4], [0.5], [1.6], [0.9, 3.76, 5.36], [0, 1.2, 2.58, 3.62, 4.58], [1.72, 3.1, 5.52, 7.04], [1.2, 3.44, 5.12], [3.48]],
  en: [[2.32], [0.3], [2.72], [1.0, 4.0, 5.08], [0, 1.36, 3.24, 4.4, 5.28], [1.92, 2.88, 5.76, 7.04], [1.2, 3.4, 4.88], [3.36]],
};

const ZAD: ZadPose[] = ['think', 'wow', 'proud', 'love', 'excited', 'point', 'clap', 'cheer'];
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
  // 0. The hook: things fly into the bag, one every half second, then the question mark.
  if (i === 0) {
    const items = [Plane, Smartphone, Shirt, Wallet, KeyRound, Camera];
    const landed = Math.max(0, Math.floor((t - 0.25) / 0.4));
    return (
      <div className="relative w-[150px] sm:w-[210px]">
        {items.map((Icon, k) => {
          const a = (k / items.length) * Math.PI * 2 - Math.PI / 2;
          return t > k * 0.4 && !reduce ? (
            <motion.span
              key={k}
              className="absolute left-1/2 top-1/2 grid place-items-center w-14 h-14 -ml-7 -mt-7 rounded-2xl bg-[#FAF7F2] text-[#1C1411] shadow-xl"
              initial={{ x: Math.cos(a) * 260, y: Math.sin(a) * 170 - 40, rotate: -30 + k * 12, scale: 1.1 }}
              animate={{ x: 0, y: 30, rotate: 0, scale: 0.2, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.55, 0, 1, 0.45] }}
            >
              <Icon className="w-7 h-7" aria-hidden="true" />
            </motion.span>
          ) : null;
        })}
        <motion.div key={landed} animate={reduce ? undefined : { scaleY: [1, 0.9, 1.04, 1], scaleX: [1, 1.06, 0.98, 1] }} transition={{ duration: 0.3 }} style={{ originY: 1 }}><Bag /></motion.div>
        {t > c[0] && (
          <motion.span className="absolute top-[-6%] -end-16 sm:-end-28 font-editorial font-bold text-7xl sm:text-9xl" style={{ backgroundImage: FOIL, WebkitBackgroundClip: 'text', color: 'transparent' }} {...pop(reduce)}>
            {isEn ? '?' : '؟'}
          </motion.span>
        )}
      </div>
    );
  }
  // 1. "We know the answer": Zad rises out of the bag under a spotlight.
  if (i === 1) return (
    <div className="relative w-[170px] sm:w-[230px]">
      <span aria-hidden="true" className="absolute left-1/2 -top-[120%] h-[220%] w-[160%] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_42%,rgba(246,213,142,0.28)_50%,transparent_58%)]" />
      <motion.div className="absolute left-1/2 -translate-x-1/2 bottom-[48%]" initial={reduce ? false : { y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
        <ZadRigSvg pose={t > c[0] ? 'wow' : 'peek'} size={130} />
      </motion.div>
      <div className="relative"><Bag /></div>
    </div>
  );
  // 2. The name, in gold foil, and who it is for.
  if (i === 2) return (
    <div className="flex items-end justify-center gap-4 sm:gap-6 h-24 sm:h-32">
      {t > c[0] && [{ s: 'h-20 sm:h-28', cov: false }, { s: 'h-20 sm:h-28', cov: true }, { s: 'h-12 sm:h-16', cov: false }, { s: 'h-14 sm:h-20', cov: true }].map((f, k) => (
        <motion.span key={k} className="text-[#F6D58E] drop-shadow-[0_0_18px_rgba(246,213,142,0.5)]" {...pop(reduce, k * 0.12)}>
          <Figure covered={f.cov} className={`${f.s} w-auto`} />
        </motion.span>
      ))}
    </div>
  );
  // 3. Far from home: a night city, one window lit; then a teacher who knows your name.
  if (i === 3) {
    if (t < c[1]) return (
      <svg viewBox="0 0 400 170" className="w-[300px] sm:w-[520px] h-auto" aria-hidden="true">
        <circle cx="330" cy="34" r="16" fill="#F6D58E" opacity=".85" />
        <circle cx="338" cy="28" r="14" fill="#2A1A14" />
        {[[10, 70, 50], [64, 40, 44], [112, 90, 36], [152, 55, 60], [216, 30, 40], [260, 75, 52], [316, 50, 46], [366, 85, 30]].map(([x, y, w], k) => (
          <g key={k}>
            <rect x={x} y={y} width={w} height={170 - y} fill="#140E0B" stroke="#F6D58E" strokeOpacity=".18" />
            {Array.from({ length: 6 }, (_, r) => Array.from({ length: 2 }, (_, q) => (
              <rect key={`${r}-${q}`} x={x + 8 + q * (w / 2 - 4)} y={y + 10 + r * 16} width="8" height="8" rx="1" fill="#F6D58E" opacity={k === 3 && r === 2 && q === 1 && t > c[0] ? 1 : 0.07} />
            )))}
          </g>
        ))}
        {t > c[0] && <motion.circle cx="190" cy="102" r="26" fill="#F6D58E" initial={{ opacity: 0 }} animate={{ opacity: 0.25 }} transition={{ duration: 0.6 }} style={{ filter: 'blur(10px)' }} />}
      </svg>
    );
    const name = isEn ? 'Hi, Yusuf' : 'أهلًا يا يوسف';
    const shown = reduce ? name.length : Math.min(name.length, Math.floor((t - c[1]) * 14));
    return (
      <motion.div className="flex items-center gap-4 rounded-[1.75rem] bg-[#FAF7F2] px-5 py-4 sm:px-7 sm:py-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]" {...pop(reduce)}>
        <Medal id="teacher" eager className="w-16 h-16 sm:w-20 sm:h-20" />
        <div className="text-start">
          <p className="text-xs sm:text-sm font-bold text-[#B4552F]">{isEn ? 'Your teacher' : 'معلّمك'}</p>
          <p className="relative font-editorial font-bold text-2xl sm:text-4xl text-[#1C1411]">
            {name.slice(0, shown)}<span className="inline-block w-[2px] h-[0.9em] align-middle bg-[#C51F24] animate-pulse" />
            {t > c[2] && <motion.span aria-hidden="true" className="absolute -bottom-1 inset-x-0 h-[3px] rounded-full bg-[#E5A93C]" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ originX: isEn ? 0 : 1 }} transition={{ duration: 0.5, ease: EASE }} />}
          </p>
        </div>
      </motion.div>
    );
  }
  // 4. The provisions: each medal lands big, then joins the row in the bag.
  if (i === 4) {
    const sets = [['surah', 'tajweed'], ['juz'], ['zad-level'], ['language-level'], ['language-level']];
    let cur = 0;
    c.forEach((at, k) => { if (t >= at) cur = k; });
    return (
      <div className="flex flex-col items-center gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={cur} className="flex gap-2" initial={reduce ? false : { scale: 0.3, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0.4, y: 80, opacity: 0, transition: { duration: 0.22 } }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
            {sets[cur].map((id) => <Medal key={id} id={id} eager className="w-28 h-28 sm:w-44 sm:h-44" />)}
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-1.5 h-9 sm:h-11">
          {sets.slice(0, cur).flat().map((id, k) => <motion.span key={k} {...pop(reduce)}><Medal id={id} eager className="w-9 h-9 sm:w-11 sm:h-11" /></motion.span>)}
        </div>
      </div>
    );
  }
  // 5. You choose → the same teacher, lesson after lesson → never from zero.
  if (i === 5) {
    if (t < c[1]) return (
      <div className="flex gap-4 sm:gap-8">
        {[{ cov: false, l: { en: 'Male teacher', ar: 'معلّم' } }, { cov: true, l: { en: 'Female teacher', ar: 'معلّمة' } }].map((p, k) => {
          const on = t > c[0] && k === 1;
          return (
            <motion.div key={k} className={`relative flex flex-col items-center gap-2 w-28 sm:w-40 rounded-t-full rounded-b-3xl pt-6 pb-4 border transition-colors duration-500 ${on ? 'border-[#F6D58E] bg-[#F6D58E]/10' : 'border-[#F6D58E]/25 bg-[#FAF7F2]/[0.05]'}`} animate={{ scale: on ? 1.08 : t > c[0] ? 0.92 : 1, opacity: t > c[0] && !on ? 0.5 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              <Figure covered={p.cov} className="w-14 h-14 sm:w-20 sm:h-20 text-[#F6D58E]" />
              <span className="text-xs sm:text-sm font-bold text-[#FAF7F2]/85">{isEn ? p.l.en : p.l.ar}</span>
              {on && <motion.span className="absolute -top-2 -end-2 grid place-items-center w-8 h-8 rounded-full bg-[#087D91] text-[#FAF7F2]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }}><Check className="w-4 h-4" aria-hidden="true" /></motion.span>}
            </motion.div>
          );
        })}
      </div>
    );
    if (t < c[2]) {
      const done = Math.min(6, 1 + Math.floor((t - c[1]) / 0.38));
      return (
        <div className="relative w-[300px] sm:w-[520px] h-24">
          <span className="absolute inset-x-0 top-1/2 h-[2px] bg-[#F6D58E]/20" />
          <motion.span className="absolute top-1/2 h-[2px] bg-[#E5A93C]" style={{ insetInlineStart: 0 }} animate={{ width: `${(done - 1) * 20}%` }} transition={{ duration: 0.35 }} />
          {Array.from({ length: 6 }, (_, k) => (
            <span key={k} className={`absolute top-1/2 w-4 h-4 -mt-2 -ms-2 rounded-full transition-colors duration-300 ${k < done ? 'bg-[#F6D58E] shadow-[0_0_12px_rgba(246,213,142,0.8)]' : 'bg-[#F6D58E]/20'}`} style={{ insetInlineStart: `${k * 20}%` }} />
          ))}
          <motion.span className="absolute top-0 -ms-8" animate={{ insetInlineStart: `${(done - 1) * 20}%` }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
            <Medal id="teacher" eager className="w-16 h-16 -mt-6" />
          </motion.span>
        </div>
      );
    }
    return (
      <div className="relative grid place-items-center">
        <span lang="en" className="font-editorial font-bold text-[7rem] sm:text-[11rem] leading-none text-transparent [-webkit-text-stroke:3px_#F6D58E]">0</span>
        {t > c[3] && !reduce && <motion.span aria-hidden="true" className="absolute h-3 w-[140%] rounded-full bg-[#C51F24] shadow-[0_0_30px_rgba(197,31,36,0.9)]" style={{ rotate: -28 }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.25, ease: EASE }} />}
      </div>
    );
  }
  // 6. The real portal: the teacher's note, a notification, the badges, and a new badge bursting out.
  if (i === 6) {
    const screen = t < c[1] ? 'note' : 'badges';
    return (
      <div className="relative">
        <motion.div className="relative w-[150px] sm:w-[200px] aspect-[390/844] rounded-[1.9rem] p-[5px] bg-[linear-gradient(145deg,#5A4A42,#1C1411_40%,#3B2E28_70%,#120C09)] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)]" initial={reduce ? false : { y: 140, rotate: -8, opacity: 0 }} animate={{ y: 0, rotate: t > c[2] ? -4 : 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
          <div className="relative h-full w-full overflow-hidden rounded-[1.55rem] bg-[#FAF7F2]">
            <AnimatePresence initial={false}>
              <motion.img key={screen} src={`/media/portal/${isEn ? 'en' : 'ar'}-${screen}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover object-top" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} />
            </AnimatePresence>
            <span className="absolute top-1.5 left-1/2 -translate-x-1/2 h-3.5 w-[34%] rounded-full bg-[#0B0806]" />
          </div>
        </motion.div>
        {t > c[0] && t < c[1] + 0.6 && (
          <motion.div className="absolute -top-4 -start-16 sm:-start-28 w-[210px] sm:w-[260px] rounded-2xl bg-[#FAF7F2]/95 backdrop-blur px-3 py-2.5 shadow-2xl text-start" initial={reduce ? false : { y: -30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
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
  // 7. The invitation.
  return (
    <div className="flex flex-col items-center gap-4">
      <ZadRigSvg pose="cheer" size={120} />
      {t > c[0] && (
        <motion.span className="rounded-full bg-[#C51F24] px-6 py-3 text-base sm:text-xl font-bold text-[#FAF7F2] shadow-[0_18px_40px_-12px_rgba(197,31,36,0.8)]" {...pop(reduce)}>
          {isEn ? 'Book the free first lesson' : 'احجز الحصة الأولى مجانًا'}
        </motion.span>
      )}
      <p lang="ar" dir="rtl" className="text-base sm:text-2xl text-[#F6D58E]/85" style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }}>﴿ وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ ﴾</p>
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
  const textOnly = scene === 2; // the name scene: the word is the picture

  return (
    <figure className={record ? 'fixed inset-0 z-[100] bg-black' : 'relative mx-auto w-full max-w-5xl'} aria-label={isEn ? 'Our story in 40 seconds' : 'قصتنا في ٤٠ ثانية'}>
      <div
        className={`relative overflow-hidden ${record ? 'h-full w-full' : 'aspect-[4/5] sm:aspect-video rounded-[1.75rem] sm:rounded-[2.25rem] ring-1 ring-[#F6D58E]/25 shadow-[0_40px_90px_-40px_rgba(28,20,17,0.75)]'}`}
        style={{ background: LIGHT[running ? scene : 7], transition: 'background 0.6s ease' }}
      >
        <audio ref={audioRef} src={isEn ? '/media/intro-film/en.mp3' : '/media/intro-film/ar.mp3'} preload="none" onEnded={() => setState('done')} onPause={() => setState((s) => (s === 'playing' ? 'paused' : s))} />

        {running ? (
          <>
            <Dust reduce={reduce} />
            {/* Hard cut between scenes, with a whip-in and a gold flash. No exit animations: a scene never waits for
                the last one to leave (an exit that never finished once froze the film on one scene). */}
            <motion.div
              key={scene}
              className="absolute inset-0 flex flex-col items-center justify-center gap-[5%] px-6 pb-[13%] pt-[8%]"
              initial={reduce ? { opacity: 0 } : { x: isEn ? '12%' : '-12%', filter: 'blur(14px)', opacity: 0, scale: 1.05 }}
              animate={{ x: 0, filter: 'blur(0px)', opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              <div className={`relative text-center leading-tight min-h-[1.3em] ${textOnly ? '' : 'text-[1.9rem] sm:text-5xl lg:text-6xl'}`} style={zoom.text > 1 ? { zoom: zoom.text } : undefined}>
                {beatIdx >= 0 && (
                  textOnly && beat.hl ? (
                    // The name in gold foil, with a light sweep.
                    <motion.span key={beat.text} className="relative block font-editorial font-bold text-[5rem] sm:text-[9rem] lg:text-[11rem] leading-none" style={{ backgroundImage: FOIL, backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', color: 'transparent' }} initial={reduce ? false : { scale: 1.6, opacity: 0, filter: 'blur(12px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)', backgroundPosition: ['0% 0%', '100% 0%'] }} transition={{ duration: 0.7, ease: EASE, backgroundPosition: { duration: 1.6, ease: 'easeInOut' } }}>
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
          // Poster: Zad waves next to the title and the play button. Painted on first load, nothing else to fetch.
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-6 px-6 text-center">
            <div className="absolute left-1/2 top-[42%] w-[62%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(246,213,142,0.45), rgba(229,169,60,0.16) 55%, transparent)' }} />
            <div className="relative"><ZadRigSvg pose={state === 'done' ? 'cheer' : 'wave'} size={120} /></div>
            <p className="relative font-editorial font-bold text-3xl sm:text-5xl text-[#FAF7F2] leading-tight">
              {state === 'done'
                ? (isEn ? <>The first lesson is <span className="text-[#F6D58E]">on us</span></> : <>الحصّة الأولى <span className="text-[#F6D58E]">علينا</span></>)
                : (isEn ? <>If you left tomorrow, <span className="text-[#F6D58E]">what would you pack?</span></> : <>لو سافرتَ غدًا، <span className="text-[#F6D58E]">ماذا تضع في حقيبتك؟</span></>)}
            </p>
            <div className="relative flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={play}
                className="group inline-flex items-center gap-2.5 rounded-full bg-[#FAF7F2] ps-2 pe-5 py-2 min-h-11 text-[#1C1411] font-bold text-sm sm:text-base shadow-[0_12px_40px_-8px_rgba(229,169,60,0.6)] transition-transform duration-200 hover:scale-[1.04] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60"
                aria-label={state === 'done' ? (isEn ? 'Watch again' : 'شاهد مرة أخرى') : (isEn ? 'Play our story, 40 seconds, with sound' : 'شغّل قصتنا، ٤٠ ثانية بالصوت')}
              >
                <span className="grid place-items-center w-9 h-9 rounded-full bg-[#C51F24] text-[#FAF7F2]">
                  {state === 'done' ? <RotateCcw className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4 fill-current" aria-hidden="true" />}
                </span>
                {state === 'done' ? (isEn ? 'Watch again' : 'شاهد مرة أخرى') : (isEn ? 'Play with sound · 40s' : 'شغّل بالصوت · ٤٠ ثانية')}
              </button>
              {state === 'done' && (
                <button type="button" onClick={onTrial} className="rounded-full bg-[#C51F24] px-5 py-2.5 min-h-11 text-sm sm:text-base font-bold text-[#FAF7F2] shadow-lg hover:bg-[#A8191E] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60">
                  {isEn ? 'Book the free first lesson' : 'احجز الحصة الأولى مجانًا'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Zad rides along in a corner of every scene where he is not the picture. */}
        {running && ![1, 7].includes(scene) && (
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
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.09] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
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
