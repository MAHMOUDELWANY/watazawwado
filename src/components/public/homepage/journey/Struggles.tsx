import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EXPO, type L } from './Journey';

/**
 * Station 01, before the questions: four situations Western Muslim parents describe. Recognition, not fear: each card
 * names a moment, then turns it with "here" (what changes with one teacher who stays). Cards deal in one by one.
 */

const ITEMS: { glyph: string; moment: L; turn: L }[] = [
  { glyph: 'ض', moment: { en: 'He reads, but the letters are not right yet', ar: 'بيقرأ، بس الحروف لسه مش مظبوطة' }, turn: { en: 'Here: one teacher hears every letter, every lesson', ar: 'هنا: معلّم واحد يسمع كل حرف، كل حصة' } },
  { glyph: '٣٠', moment: { en: 'She memorises, then it slips away', ar: 'بتحفظ، وبعدين الحفظ يتفلّت' }, turn: { en: 'Here: revision is part of the plan, not an afterthought', ar: 'هنا: المراجعة جزء من الخطة، مش حاجة على الهامش' } },
  { glyph: '♡', moment: { en: 'Religion feels like a heavy school subject', ar: 'الدين حاسس إنه مادة تقيلة' }, turn: { en: 'Here: stories, questions, and a teacher they like', ar: 'هنا: قصص وأسئلة، ومعلّم يحبّوه' } },
  { glyph: '↻', moment: { en: 'A new teacher every few weeks, starting over', ar: 'كل كام أسبوع معلّم جديد، ونبدأ من الأول' }, turn: { en: 'Here: the same teacher, who knows where you stopped', ar: 'هنا: نفس المعلّم، وعارف وقفتوا فين' } },
];

export function Struggles({ isEn }: { isEn: boolean }) {
  const reduce = useReducedMotion();
  const t = (l: L) => (isEn ? l.en : l.ar);
  return (
    <ul className="grid gap-4 sm:grid-cols-2 max-w-5xl mx-auto">
      {ITEMS.map((it, k) => (
        <motion.li
          key={it.glyph}
          className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-6 sm:p-7 shadow-[0_20px_50px_-36px_rgba(28,20,17,0.55)]"
          initial={reduce ? false : { opacity: 0, y: 40, rotate: k % 2 ? 1.5 : -1.5, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: EXPO, delay: (k % 2) * 0.09 }}
          whileHover={reduce ? undefined : { y: -4 }}
        >
          <span aria-hidden="true" className="absolute -top-6 -end-3 font-editorial font-bold text-[7rem] leading-none text-[#E5A93C]/15 select-none transition-transform duration-500 group-hover:-rotate-6">{it.glyph}</span>
          <p className="relative font-editorial font-bold text-xl sm:text-2xl leading-snug text-foreground">“{t(it.moment)}”</p>
          <p className="relative mt-4 flex items-start gap-2 text-sm sm:text-base font-semibold text-[#087D91] dark:text-[#12A4BC]">
            <span aria-hidden="true" className="mt-2 h-px w-6 shrink-0 bg-current" />{t(it.turn)}
          </p>
        </motion.li>
      ))}
    </ul>
  );
}
