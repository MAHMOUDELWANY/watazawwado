import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * The level dial (docs/design/PROGRESS.md): the badges' clockwork dial ring, one arc per level of the subject.
 * Finished levels are gold, the current one crimson with a gold ring, later ones a faint shadow. It draws once, in the
 * reading direction (clockwise in English, anticlockwise in Arabic). 60 ticks around it like a clock face.
 */
export function LevelDial({ total, current, isAr, size = 200, label }: {
  total: number;
  /** Zero-based index of the level the learner is on. */
  current: number;
  isAr: boolean;
  size?: number;
  /** Accessible summary, e.g. "Level 2 of 5". */
  label: string;
}) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const n = Math.max(1, total);
  const idx = Math.min(Math.max(0, current), n - 1);
  const c = 100, r = 74, gap = n > 1 ? 6 : 0; // degrees between arcs
  const span = (360 - gap * n) / n;
  const pt = (deg: number, rad = r) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(c + rad * Math.cos(a)).toFixed(2)} ${(c + rad * Math.sin(a)).toFixed(2)}`;
  };
  const arc = (i: number) => {
    const a0 = i * (span + gap) + gap / 2;
    const a1 = a0 + span;
    return `M ${pt(a0)} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${pt(a1)}`;
  };
  const num = (v: number) => (isAr ? v.toLocaleString('ar-EG') : String(v));
  const draw = (i: number) => (reduce ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.7, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] as const } });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label} data-testid="level-dial">
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F6D58E" />
            <stop offset="0.55" stopColor="#E5A93C" />
            <stop offset="1" stopColor="#B9782A" />
          </linearGradient>
          <radialGradient id={`f-${uid}`} cx="0.5" cy="0.42" r="0.6">
            <stop offset="0" stopColor="var(--surface, #fff)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--surface, #fff)" stopOpacity="0.7" />
          </radialGradient>
        </defs>
        {/* clock face */}
        <circle cx={c} cy={c} r={94} fill={`url(#f-${uid})`} stroke="#E5A93C" strokeOpacity="0.35" strokeWidth="1" />
        {Array.from({ length: 60 }, (_, k) => {
          const deg = k * 6;
          const long = k % 5 === 0;
          return <path key={k} d={`M ${pt(deg, 90)} L ${pt(deg, long ? 84 : 87)}`} stroke="#B9782A" strokeOpacity={long ? 0.55 : 0.3} strokeWidth={long ? 1.4 : 0.8} strokeLinecap="round" />;
        })}
        {/* level arcs, mirrored for right-to-left reading */}
        <g transform={isAr ? 'translate(200 0) scale(-1 1)' : undefined}>
          {Array.from({ length: n }, (_, i) => (
            <path key={`t${i}`} d={arc(i)} fill="none" stroke="currentColor" className="text-foreground/[0.08]" strokeWidth="12" strokeLinecap="round" />
          ))}
          {Array.from({ length: idx }, (_, i) => (
            <motion.path key={`d${i}`} d={arc(i)} fill="none" stroke={`url(#g-${uid})`} strokeWidth="12" strokeLinecap="round" {...draw(i)} />
          ))}
          <motion.path d={arc(idx)} fill="none" stroke="#E5A93C" strokeWidth="16" strokeLinecap="round" opacity="0.55" {...draw(idx)} />
          <motion.path d={arc(idx)} fill="none" stroke="var(--crimson, #C51F24)" strokeWidth="9" strokeLinecap="round" {...draw(idx)} />
        </g>
        {/* the khatam star at the centre, struck faintly */}
        <path d={Array.from({ length: 16 }, (_, k) => { const a = (k * Math.PI) / 8 - Math.PI / 2; const rr = k % 2 ? 22 : 29; return `${k ? 'L' : 'M'} ${(c + rr * Math.cos(a)).toFixed(1)} ${(c - 18 + rr * Math.sin(a)).toFixed(1)}`; }).join(' ') + ' Z'} fill="#E5A93C" opacity="0.14" />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center" aria-hidden="true">
        <span className="font-display text-[2.6rem] leading-none font-bold text-foreground tabular-nums">{num(idx + 1)}</span>
        <span className="mt-1 text-xs font-semibold text-muted-foreground">{isAr ? `من ${num(n)} مستويات` : `of ${n} levels`}</span>
      </div>
    </div>
  );
}
