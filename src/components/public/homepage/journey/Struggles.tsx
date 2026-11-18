import React from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { EXPO, type L } from './Journey';
import { Bezel } from './Premium';

/**
 * Station 01, before the questions: four situations Western Muslim parents describe. Recognition, not fear: each card
 * names a moment, then turns it with "here". Wide screens: a Z-axis cascade (cards slightly turned, overlapping, each
 * drifting at its own speed as you scroll). Phones: a plain stack, no turns or overlaps.
 */

const ITEMS: { glyph: string; moment: L; turn: L; tone: string }[] = [
  { glyph: 'ض', tone: '#C51F24', moment: { en: 'He reads, but the letters are not right yet', ar: 'بيقرأ، بس الحروف لسه مش مظبوطة' }, turn: { en: 'Here: one teacher hears every letter, every lesson', ar: 'هنا: معلّم واحد يسمع كل حرف، كل حصة' } },
  { glyph: '٣٠', tone: '#E5A93C', moment: { en: 'She memorises, then it slips away', ar: 'بتحفظ، وبعدين الحفظ يتفلّت' }, turn: { en: 'Here: revision is part of the plan, not an afterthought', ar: 'هنا: المراجعة جزء من الخطة، مش حاجة على الهامش' } },
  { glyph: '♡', tone: '#087D91', moment: { en: 'Religion feels like a heavy school subject', ar: 'الدين حاسس إنه مادة تقيلة' }, turn: { en: 'Here: stories, questions, and a teacher they like', ar: 'هنا: قصص وأسئلة، ومعلّم يحبّوه' } },
  { glyph: '↻', tone: '#B4552F', moment: { en: 'A new teacher every few weeks, starting over', ar: 'كل كام أسبوع معلّم جديد، ونبدأ من الأول' }, turn: { en: 'Here: the same teacher, who knows where you stopped', ar: 'هنا: نفس المعلّم، وعارف وقفتوا فين' } },
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
        <Bezel radius="2rem" core="relative overflow-hidden p-7 sm:p-9">
          <span aria-hidden="true" className="absolute -top-8 -end-2 font-editorial font-bold text-[8.5rem] leading-none select-none" style={{ color: it.tone, opacity: 0.1 }}>{it.glyph}</span>
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
      {ITEMS.map((it, k) => <Card key={it.glyph} it={it} k={k} isEn={isEn} progress={scrollYProgress} reduce={reduce} />)}
    </ul>
  );
}
