import React from 'react';
import { motion } from 'motion/react';
import { CRIMSON } from '../cinema/Cinema';
import { useReduce } from './Stage';

/**
 * Arabic letters as hand-drawn centreline strokes in a 300 × 300 box (baseline y ≈ 200), in writing order (right to
 * left, dots last), so a letter is written on the stage stroke by stroke and never depends on a font being loaded.
 * Isolated forms. Shapes are ours; stroke order follows the standard teaching order (literacy sources, sources.md §H).
 * Add letters as lessons need them: test/curriculum-letters.test.ts fails when a lesson's vocab uses a missing one.
 */
export const LETTERS: Record<string, { strokes: string[]; dots: { x: number; y: number }[] }> = {
  'ا': { strokes: ['M 156 40 C 150 100, 148 150, 150 205'], dots: [] },
  'ب': { strokes: ['M 268 128 C 276 176, 252 200, 196 200 L 96 200 C 46 200, 26 186, 30 150'], dots: [{ x: 150, y: 248 }] },
  'ت': { strokes: ['M 268 128 C 276 176, 252 200, 196 200 L 96 200 C 46 200, 26 186, 30 150'], dots: [{ x: 172, y: 140 }, { x: 128, y: 140 }] },
  'ث': { strokes: ['M 268 128 C 276 176, 252 200, 196 200 L 96 200 C 46 200, 26 186, 30 150'], dots: [{ x: 172, y: 145 }, { x: 128, y: 145 }, { x: 150, y: 108 }] },
  'ن': { strokes: ['M 232 112 C 244 196, 214 240, 150 240 C 88 240, 58 206, 68 156'], dots: [{ x: 150, y: 160 }] },
  'ي': {
    strokes: ['M 232 118 C 196 104, 160 126, 186 160 C 210 192, 262 206, 240 240 C 218 274, 112 272, 70 226'],
    dots: [{ x: 172, y: 318 }, { x: 128, y: 318 }],
  },
};

const MARKS = /[ً-ٰٟۖ-ۭـ]/g;

/** The distinct letters of an Arabic string, in reading order, without harakat and Quranic marks. */
export function lettersIn(text: string): string[] {
  return [...new Set([...text.replace(MARKS, '')].filter((c) => /[ء-ي]/.test(c)))];
}

/**
 * Writes one letter with its feet on (x, y) of the canvas: strokes draw in order, then the dots pop in. `instant` (or
 * reduced motion) shows the finished letter at once. `size` is the box width in canvas pixels.
 */
export function WriteLetter({ ch, x, y, size = 300, color = CRIMSON, width = 30, delay = 0, speed = 1, instant = false }: {
  ch: string; x: number; y: number; size?: number; color?: string; width?: number; delay?: number; speed?: number; instant?: boolean;
}) {
  const reduce = useReduce();
  const now = instant || reduce;
  const L = LETTERS[ch];
  if (!L) return null;
  const s = size / 300;
  const strokeDur = 1.1 / speed;
  return (
    <g transform={`translate(${x - size / 2} ${y - 200 * s}) scale(${s})`}>
      {L.strokes.map((d, i) => (
        <motion.path key={i} d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: now ? 1 : 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: now ? 0 : strokeDur, delay: now ? 0 : delay + i * strokeDur, ease: [0.65, 0, 0.35, 1] }} />
      ))}
      {L.dots.map((p, i) => (
        <motion.circle key={`d${i}`} cx={p.x} cy={p.y} r={width * 0.62} fill={color}
          initial={{ scale: now ? 1 : 0 }} animate={{ scale: 1 }} style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' as never }}
          transition={now ? { duration: 0 } : { type: 'spring', bounce: 0.5, delay: delay + L.strokes.length * strokeDur + i * 0.2 }} />
      ))}
    </g>
  );
}
