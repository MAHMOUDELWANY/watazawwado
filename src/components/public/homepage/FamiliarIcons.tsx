import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

/**
 * "Sound familiar?": one small drawing per pain, in the brand's line style (ink strokes, one crimson or gold accent).
 * Each plays a short loop only while it is on screen; with reduced motion it is a still drawing.
 */

const INK = 'currentColor';
const CRIMSON = '#C51F24';
const GOLD = '#E5A93C';
const LOOP = { repeat: Infinity, repeatDelay: 2.2 };

type Kind = 'teacher' | 'plan' | 'interest' | 'time';

export function FamiliarIcon({ kind }: { kind: Kind }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: '-15% 0px' });
  const still = Boolean(useReducedMotion());
  const play = inView && !still;
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="grid place-items-center shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-surface-warm/70 dark:bg-white/[0.04] ring-1 ring-border/70 text-foreground/80"
    >
      <svg viewBox="5 5 38 38" className="w-9 h-9 sm:w-10 sm:h-10" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {kind === 'teacher' && <Teacher play={play} />}
        {kind === 'plan' && <Plan play={play} />}
        {kind === 'interest' && <Interest play={play} />}
        {kind === 'time' && <Time play={play} />}
      </svg>
    </span>
  );
}

/** A teacher leaves and a new one arrives: the same chair, a different face every time. */
function Teacher({ play }: { play: boolean }) {
  const t = { duration: 2.4, ease: 'easeInOut' as const, times: [0, 0.35, 0.5, 0.65, 1], ...LOOP };
  return (
    <>
      <path d="M10 41h28" stroke={INK} />
      <motion.g
        animate={play ? { x: [0, 0, -14, 14, 0], opacity: [1, 1, 0, 0, 1] } : { x: 0, opacity: 1 }}
        transition={t}
      >
        <circle cx="24" cy="16" r="6" stroke={INK} />
        <path d="M14 36c1.5-6.5 5.5-10 10-10s8.5 3.5 10 10" stroke={INK} />
      </motion.g>
      <motion.path
        d="M35 9a9 9 0 0 1 4 6M13 9a9 9 0 0 0-4 6"
        stroke={CRIMSON}
        animate={play ? { opacity: [0, 0, 1, 1, 0], rotate: [0, 0, 20, 40, 40] } : { opacity: 0 }}
        style={{ originX: '24px', originY: '15px' }}
        transition={t}
      />
    </>
  );
}

/** Lessons with no plan: the path is drawn, wanders, and ends in a question. */
function Plan({ play }: { play: boolean }) {
  const t = { duration: 2.6, ease: 'easeInOut' as const, ...LOOP };
  return (
    <>
      <circle cx="9" cy="38" r="2.5" stroke={INK} />
      <motion.path
        d="M11 36c6-6 12 2 16-5s-4-9 0-14"
        stroke={INK}
        strokeDasharray="2 3.5"
        animate={play ? { pathLength: [0.2, 1, 1], opacity: [1, 1, 0.5] } : { pathLength: 1, opacity: 1 }}
        transition={t}
      />
      <motion.g
        animate={play ? { opacity: [0.25, 0.25, 1, 1], y: [3, 3, 0, 0] } : { opacity: 1, y: 0 }}
        transition={{ ...t, times: [0, 0.55, 0.75, 1] }}
      >
        <path d="M33 9.5a4.5 4.5 0 1 1 6.2 4.2c-1.4.6-2.2 1.6-2.2 3.1" stroke={CRIMSON} />
        <circle cx="37" cy="21.5" r="0.9" fill={CRIMSON} stroke="none" />
      </motion.g>
    </>
  );
}

/** A child who loved it for a month: the lamp's flame burns bright, then sinks low. */
function Interest({ play }: { play: boolean }) {
  const t = { duration: 2.8, ease: 'easeInOut' as const, times: [0, 0.3, 0.75, 1], ...LOOP };
  return (
    <>
      <path d="M16 36h16l-2 5H18z" stroke={INK} />
      <path d="M24 36v-6" stroke={INK} />
      <motion.path
        d="M24 30c-4.5-2.5-5.5-7-2.5-11.5 1 2.5 2.5 3.5 3.5 2 .8-2-.2-4.5-1-6.5 4.5 2.5 6.5 8 4 12.5-1 2-2.4 3-4 3.5z"
        stroke={GOLD}
        fill={GOLD}
        fillOpacity={0.2}
        style={{ originX: '24px', originY: '30px' }}
        animate={play ? { scale: [1, 1.08, 0.45, 1], opacity: [1, 1, 0.35, 1] } : { scale: 1, opacity: 1 }}
        transition={t}
      />
    </>
  );
}

/** Times that never fit: the hands spin past the week and never settle. */
function Time({ play }: { play: boolean }) {
  return (
    <>
      <circle cx="24" cy="25" r="14" stroke={INK} />
      <path d="M20 8h8M24 8v3" stroke={INK} />
      <motion.path
        d="M24 25V16"
        stroke={INK}
        style={{ originX: '24px', originY: '25px' }}
        animate={play ? { rotate: [0, 360, 720] } : { rotate: 0 }}
        transition={{ duration: 2.4, ease: [0.6, 0, 0.3, 1], ...LOOP }}
      />
      <motion.path
        d="M24 25l6 4"
        stroke={CRIMSON}
        style={{ originX: '24px', originY: '25px' }}
        animate={play ? { rotate: [0, 120, 240] } : { rotate: 0 }}
        transition={{ duration: 2.4, ease: [0.6, 0, 0.3, 1], ...LOOP }}
      />
      <circle cx="24" cy="25" r="1.4" fill={INK} stroke="none" />
    </>
  );
}
