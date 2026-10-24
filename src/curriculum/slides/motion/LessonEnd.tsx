import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Lesson } from '../../types';
import { KineticTitle, ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { Backdrop } from './Stage';

/**
 * The end of a lesson, for every series (owner, 2026-10-24: "our background, a better, elegant, creative design"). The
 * khatam star draws itself in gold and opens into light; "زادك الله" and "Lesson complete" rise; the lesson's chapters
 * light up one by one along a gold line, the road just walked; small stars drift up. Drawn on the 1600 × 900 canvas.
 */
export function LessonEnd({ lesson, ar, teacher, onRestart, onClose }: { lesson: Lesson; ar: boolean; teacher: boolean; onRestart: () => void; onClose: () => void }) {
  const reduce = Boolean(useReducedMotion());
  const L = (en: string, a: string) => (ar ? a : en);
  const chapters = lesson.chapters.length ? lesson.chapters : [{ label: lesson.title, page: 0 }];
  const STAR = 'M50 6 L62.5 19.8 L81.1 18.9 L80.2 37.5 L94 50 L80.2 62.5 L81.1 81.1 L62.5 80.2 L50 94 L37.5 80.2 L18.9 81.1 L19.8 62.5 L6 50 L19.8 37.5 L18.9 18.9 L37.5 19.8 Z';
  const n = chapters.length;
  const xs = chapters.map((_, i) => (n === 1 ? 800 : 260 + (i * 1080) / (n - 1)));
  const lineY = 640;
  const d = 0.25; // base delay

  return (
    <motion.div className="absolute inset-0 z-40 overflow-hidden" style={{ background: '#2A0E10' }} dir="ltr"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <Backdrop tone="dark" />

      {/* stars drifting up */}
      {!reduce && Array.from({ length: 26 }, (_, i) => (
        <motion.span key={i} className="pointer-events-none absolute rounded-full" style={{ left: 60 + ((i * 131) % 1480), top: 900, width: i % 4 ? 4 : 7, height: i % 4 ? 4 : 7, background: i % 3 ? '#FBE9C8' : GOLD, boxShadow: '0 0 10px #FFE7A8' }}
          animate={{ y: [-0, -980], opacity: [0, 1, 1, 0] }} transition={{ duration: 9 + (i % 5) * 2, delay: (i % 9) * 0.7, repeat: Infinity, ease: 'linear' }} />
      ))}

      {/* the khatam: drawn, filled, then it radiates */}
      <div className="absolute" style={{ left: 800 - 90, top: 70, width: 180, height: 180 }}>
        {!reduce && [0, 1, 2].map((k) => (
          <motion.span key={k} className="absolute inset-0 rounded-full" style={{ border: `2px solid ${GOLD}` }}
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 2.6], opacity: [0.7, 0] }} transition={{ duration: 3, delay: 1.6 + k, repeat: Infinity, repeatDelay: 0.5 }} />
        ))}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <motion.path d={STAR} fill="none" stroke={GOLD} strokeWidth={2} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 1.4, ease }} />
          <motion.path d={STAR} fill={GOLD} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: '50px 50px', filter: `drop-shadow(0 0 18px ${GOLD})` }} transition={{ delay: reduce ? 0 : 1.2, duration: 0.8, ease }} />
          <motion.circle cx={50} cy={50} r={14} fill="#2A0E10" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: '50px 50px' }} transition={{ delay: reduce ? 0 : 1.6, type: 'spring', bounce: 0.4 }} />
          <motion.path d="M43 50 l5 5 l10 -11" fill="none" stroke={GOLD} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: reduce ? 0 : 1.9, duration: 0.5 }} />
        </svg>
      </div>

      {/* the words */}
      <div className="absolute inset-x-0 text-center" style={{ top: 280 }}>
        <motion.p lang="ar" dir="rtl" className="m-0 font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 52, color: GOLD }} initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: d + 1.6, duration: 0.8, ease }}>
          زادك الله
        </motion.p>
        <div className="mx-auto mt-1 flex justify-center">
          {ar ? (
            <motion.p lang="ar" dir="rtl" className="m-0 font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 92, lineHeight: 1.2, color: '#F6F1E8' }} initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: d + 1.9, duration: 0.9, ease }}>
              خلصنا <span style={{ color: GOLD }}>الدرس</span>
            </motion.p>
          ) : (
            <KineticTitle text="Lesson complete" size={96} delay={d + 1.9} style={{ textAlign: 'center' }} />
          )}
        </div>
        <motion.p className="m-0 mt-3 font-sans font-semibold" style={{ fontSize: 24, color: 'rgba(246,241,232,0.75)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d + 2.6 }}>
          <span dir={ar ? 'rtl' : 'ltr'}>{L(`Lesson ${lesson.number}`, `الدرس ${lesson.number}`)}</span> · {lesson.title} <span style={{ color: 'rgba(246,241,232,0.45)' }}>· {lesson.subjectTitle}</span>
        </motion.p>
      </div>

      {/* the road just walked: every chapter lights up along a gold line */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1600 900" aria-hidden="true">
        <line x1={xs[0]} x2={xs[n - 1]} y1={lineY} y2={lineY} stroke="rgba(246,241,232,0.15)" strokeWidth={2} />
        <motion.line x1={xs[0]} x2={xs[n - 1]} y1={lineY} y2={lineY} stroke={GOLD} strokeWidth={3} style={{ filter: `drop-shadow(0 0 6px ${GOLD})` }}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: d + 2.8, duration: reduce ? 0 : 0.35 * n, ease: 'linear' }} />
      </svg>
      {chapters.map((c, i) => (
        <motion.div key={c.label + i} className="absolute flex flex-col items-center" style={{ left: xs[i] - 90, top: lineY - 17, width: 180 }}
          initial={{ opacity: 0.25 }} animate={{ opacity: 1 }} transition={{ delay: d + 2.8 + 0.35 * i, duration: 0.3 }}>
          <motion.span className="flex h-[34px] w-[34px] items-center justify-center rounded-full font-sans font-bold" style={{ fontSize: 16, color: '#2A0E10' }}
            initial={{ background: 'rgba(246,241,232,0.2)', scale: 0.8 }} animate={{ background: [CRIMSON, GOLD, TEAL][i % 3], scale: [0.8, 1.25, 1] }} transition={{ delay: d + 2.8 + 0.35 * i, duration: 0.5 }}>
            ✓
          </motion.span>
          <span className="mt-3 text-center font-sans font-semibold" style={{ fontSize: 16, lineHeight: 1.25, color: 'rgba(246,241,232,0.85)' }}>{c.label}</span>
        </motion.div>
      ))}

      {/* what next */}
      <motion.div className="absolute inset-x-0 flex flex-col items-center gap-4" style={{ top: 740 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: d + 2.9 + 0.35 * n, duration: 0.6, ease }}>
        {teacher && <p className="m-0 font-sans font-semibold" style={{ fontSize: 20, color: 'rgba(246,241,232,0.7)' }}>{L('Write the lesson report under the slide.', 'اكتب تقرير الحصة تحت الشريحة.')}</p>}
        <div className="flex gap-4">
          <button type="button" onClick={onRestart} className="rounded-full font-sans font-bold text-white" style={{ padding: '12px 28px', fontSize: 20, background: 'rgba(246,241,232,0.1)', boxShadow: 'inset 0 0 0 1px rgba(246,241,232,0.3)' }}>{L('Start again', 'من الأول')}</button>
          <button type="button" onClick={onClose} className="rounded-full font-sans font-bold" style={{ padding: '12px 32px', fontSize: 20, background: GOLD, color: '#1E1410', boxShadow: `0 0 30px 4px ${GOLD}55` }}>{L('Close', 'اقفل')}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
