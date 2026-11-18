import React from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { EXPO, type L } from './Journey';
import { Bezel } from './Premium';

/**
 * Station 01: four situations learners and parents in the West describe. Recognition, not fear: each card
 * names a moment, then turns it with "here". Wide screens: a Z-axis cascade (cards slightly turned, overlapping, each
 * drifting at its own speed as you scroll). Phones: a plain stack, no turns or overlaps.
 */

// Learner-neutral (owner, 2026-11-18: not only families). Each moment carries the medal of what fixes it.
const ITEMS: { medal: string; moment: L; turn: L; tone: string }[] = [
  { medal: 'tajweed', tone: '#C51F24', moment: { en: 'The reading is there, the letters are not right yet', ar: 'القراءة موجودة، بس الحروف لسه مش مظبوطة' }, turn: { en: 'Here: one teacher hears every letter', ar: 'هنا: معلّم واحد يسمع كل حرف' } },
  { medal: 'juz', tone: '#E5A93C', moment: { en: 'Memorised, then it slips away', ar: 'تحفظ، وبعدين الحفظ يتفلّت' }, turn: { en: 'Here: revision is part of the plan', ar: 'هنا: المراجعة جزء من الخطة' } },
  { medal: 'zad-level', tone: '#087D91', moment: { en: 'The deen feels like a heavy school subject', ar: 'الدين بقى مادة تقيلة' }, turn: { en: 'Here: stories, questions, a teacher you like', ar: 'هنا: قصص وأسئلة، ومعلّم تحبّه' } },
  { medal: 'teacher', tone: '#B4552F', moment: { en: 'A new teacher every few weeks', ar: 'كل كام أسبوع معلّم جديد' }, turn: { en: 'Here: the same teacher, who knows where you stopped', ar: 'هنا: نفس المعلّم، وعارف وقفت فين' } },
];
const TURN = [-2.2, 1.6, 1.2, -1.8];
const DRIFT = [70, 20, 110, 40]; // px each card drifts over the section's scroll: different speeds read as depth

function Card({ it, k, isEn, progress, reduce }: { it: (typeof ITEMS)[number]; k: number; isEn: boolean; progress: MotionValue<number>; reduce: boolean }) {
  const y = useTransform(progress, [0, 1], [DRIFT[k], -DRIFT[k]]);
  const t = (l: L) => (isEn ? l.en : l.ar);
  return (
    <motion.li
      className={`relative list-none ${k % 2 ? 'md:mt-16' : ''}`}
      style={reduce ? undefined : { y }}
      initial={reduce ? false : { opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: EXPO, delay: (k % 2) * 0.1 }}
    >
      <div className={`transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] md:hover:rotate-0 md:hover:-translate-y-2`} style={{ rotate: reduce ? undefined : `${TURN[k]}deg` }}>
        <Bezel radius="2rem" core="group relative overflow-hidden p-7 pe-24 sm:p-9 sm:pe-28">
          <img src={`/badges/shelf/${it.medal}.webp`} alt="" aria-hidden="true" width={180} height={180} loading="lazy" decoding="async" className="absolute -top-5 -end-5 w-28 h-28 sm:w-32 sm:h-32 object-contain opacity-90 rotate-12 drop-shadow-[0_16px_18px_rgba(28,20,17,0.35)] transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110" />
          <span aria-hidden="true" className="block h-1 w-10 rounded-full" style={{ background: it.tone }} />
          <p className="relative mt-5 font-editorial font-bold text-2xl sm:text-[1.7rem] leading-snug text-foreground">“{t(it.moment)}”</p>
          <p className="relative mt-5 flex items-start gap-2.5 text-sm sm:text-base font-semibold text-[#087D91] dark:text-[#12A4BC]">
            <span aria-hidden="true" className="mt-2.5 h-px w-7 shrink-0 bg-current" />{t(it.turn)}
          </p>
        </Bezel>
      </div>
    </motion.li>
  );
}

export function Struggles({ isEn }: { isEn: boolean }) {
  const reduce = !!useReducedMotion();
  const ref = React.useRef<HTMLUListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  return (
    <ul ref={ref} className="grid gap-6 md:gap-x-10 md:grid-cols-2 max-w-5xl mx-auto md:pb-16 [&>li]:max-md:![transform:none] [&_div]:max-md:!rotate-0">
      {ITEMS.map((it, k) => <Card key={it.medal} it={it} k={k} isEn={isEn} progress={scrollYProgress} reduce={reduce} />)}
    </ul>
  );
}
