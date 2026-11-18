import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MushafEmblem, PathEmblem } from '../emblems/DoorEmblems';

/**
 * Homepage hero visual (owner, 2026-11-17: no teacher photos up top). Our name is a call to take provision, so the
 * hero packs Zad's travel bag: the four kinds of learning lift off one by one and drop into the bag, the bag glows
 * fuller, then the cycle starts again. Same visual language as the intro film (docs/marketing/HOMEPAGE-INTRO-FILM.md).
 * Decorative: the hero text names the subjects. Reduced motion shows the tokens resting around the bag.
 */

type L = { en: string; ar: string };
type Token = { label: L; left: number; top: number; glyph: React.ReactNode };

const GLYPH = 'font-editorial font-bold text-[#F6D58E] leading-none drop-shadow-[0_0_12px_rgba(229,169,60,0.45)]';

const TOKENS: Token[] = [
  { label: { en: 'Quran', ar: 'القرآن' }, left: 16, top: 28, glyph: <MushafEmblem className="w-9 h-9 sm:w-14 sm:h-14" /> },
  { label: { en: 'Zad Path', ar: 'منهج زاد' }, left: 38, top: 15, glyph: <PathEmblem className="w-9 h-9 sm:w-14 sm:h-14" /> },
  { label: { en: 'Arabic', ar: 'العربية' }, left: 62, top: 15, glyph: <span lang="ar" className={`${GLYPH} text-3xl sm:text-5xl`}>ض</span> },
  { label: { en: 'English', ar: 'الإنجليزية' }, left: 84, top: 28, glyph: <span lang="en" className={`${GLYPH} text-2xl sm:text-4xl`}>Aa</span> },
];

const BAG = { left: 50, top: 62 }; // where the tokens drop: the bag's mouth, in % of the stage
const CYCLE = 11; // seconds: four drops, then a moment with the full bag
const SLOT = 0.19; // share of the cycle between two drops
const DROP = 0.1; // share of the cycle a drop takes

// The arch: a true semicircle on top of a 5:6 stage (41.667% of its height is half its width).
const ARCH: React.CSSProperties = { borderRadius: '50% 50% 2rem 2rem / 41.667% 41.667% 2rem 2rem' };

function Bag() {
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

export function HeroBag({ isEn }: { isEn: boolean }) {
  const reduce = useReducedMotion();
  const loop = { duration: CYCLE, repeat: Infinity, ease: 'easeInOut' as const };
  const drops = TOKENS.map((_, i) => 0.04 + i * SLOT + DROP); // the moment each token lands

  return (
    <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[400px] lg:max-w-[480px]" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[48%] opacity-70 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(229,169,60,0.3), rgba(197,31,36,0.14), transparent)' }} />

      <div
        className="khatam-window relative overflow-hidden aspect-[5/6] shadow-[0_40px_80px_-40px_rgba(28,20,17,0.7)]"
        style={{ ...ARCH, background: 'radial-gradient(70% 55% at 50% 72%, #4A2A1E 0%, #2A1A14 55%, #1C1411 100%)' }}
      >
        {/* The bag's light grows with every drop. */}
        <motion.div
          className="absolute left-1/2 top-[66%] w-[70%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(246,213,142,0.6), rgba(229,169,60,0.2) 55%, transparent)' }}
          animate={reduce ? undefined : { opacity: [0.25, 0.25, 0.42, 0.58, 0.74, 0.95, 0.95, 0.25], scale: [0.9, 0.9, 0.96, 1.02, 1.08, 1.16, 1.16, 0.9] }}
          transition={reduce ? undefined : { ...loop, times: [0, drops[0] - 0.01, drops[0], drops[1], drops[2], drops[3], 0.93, 1] }}
          initial={{ opacity: reduce ? 0.7 : 0.25 }}
        />

        {/* The bag dips a little as each token lands. */}
        <motion.div
          className="absolute w-[46%]"
          style={{ left: `${BAG.left}%`, top: `${BAG.top - 14}%`, translateX: '-50%' }}
          animate={reduce ? undefined : { y: [0, ...drops.flatMap(() => [0, 6, 0]), 0] }}
          transition={reduce ? undefined : { ...loop, ease: 'easeOut', times: [0, ...drops.flatMap((d) => [d - 0.005, d + 0.01, d + 0.04]), 1] }}
        >
          <Bag />
        </motion.div>

        {TOKENS.map((tk, i) => {
          const s = 0.04 + i * SLOT;
          const dx = `${BAG.left - tk.left}%`;
          const dy = `${BAG.top - tk.top}%`;
          return (
            // Each token rides a layer the size of the stage, so its % moves are % of the stage.
            <motion.div
              key={tk.label.en}
              className="absolute inset-0"
              animate={reduce ? undefined : { x: ['0%', '0%', dx, dx, '0%', '0%'], y: ['0%', '0%', dy, dy, '0%', '0%'] }}
              transition={reduce ? undefined : { ...loop, times: [0, s, s + DROP, 0.93, 0.94, 1] }}
            >
              <motion.div
                className="absolute flex flex-col items-center gap-1.5 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${tk.left}%`, top: `${tk.top}%` }}
                animate={reduce ? undefined : { scale: [1, 1.08, 0.25, 0.25, 0.8, 1], opacity: [1, 1, 0, 0, 0, 1] }}
                transition={reduce ? undefined : { ...loop, times: [0, s + 0.02, s + DROP, 0.93, 0.94, 1] }}
              >
                <span className="grid place-items-center w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.4rem] border border-[#F6D58E]/25 bg-[#FAF7F2]/[0.07] backdrop-blur-[2px] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                  {tk.glyph}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#FAF7F2]/85 whitespace-nowrap">{isEn ? tk.label.en : tk.label.ar}</span>
              </motion.div>
            </motion.div>
          );
        })}

        <p className="absolute inset-x-0 bottom-[3.5%] text-center font-editorial text-sm sm:text-lg text-[#F6D58E]">
          {isEn ? 'Provision that grows with every lesson' : 'زادٌ يكبر مع كل حصة'}
        </p>
      </div>
    </div>
  );
}
