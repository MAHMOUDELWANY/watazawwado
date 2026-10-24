import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type Tone, ink, soft } from './Stage';

/**
 * Shared pieces for the Adults motion stages: faceless SVG people (modern learners only; prophets, companions and angels
 * are never drawn), speech bubbles, small icons and chips, all in the site's colours.
 */

export const CLAY = '#B4552F';
export const SAND = '#E9DCC8';
export const DEEP = '#8B1A1E';

type PersonProps = {
  x: number; y: number; scale?: number; color?: string; hijab?: boolean; sitting?: boolean; lean?: number;
  glow?: boolean; dim?: boolean; delay?: number; flip?: boolean;
};

/** A faceless figure standing (or sitting) with its feet at (x, y). Head, shoulders and a soft robe or shirt. */
export function Person({ x, y, scale = 1, color = CRIMSON, hijab = false, sitting = false, lean = 0, glow = false, dim = false, delay = 0, flip = false }: PersonProps) {
  const h = sitting ? 150 : 210;
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x - 60 * scale, top: y - h * scale, width: 120 * scale, height: h * scale, transformOrigin: 'bottom center' }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: dim ? 0.35 : 1, y: 0, rotate: lean }} transition={{ duration: 0.7, delay, ease }}>
      <svg viewBox={`0 0 120 ${h}`} width="100%" height="100%" style={{ overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined, filter: glow ? `drop-shadow(0 0 16px ${GOLD}AA)` : undefined }}>
        {sitting ? (
          <>
            <path d="M24 150 C 24 104, 34 74, 60 74 C 86 74, 96 104, 96 150 Z" fill={color} />
            <rect x="14" y="132" width="92" height="18" rx="9" fill={color} opacity="0.8" />
          </>
        ) : (
          <path d="M22 210 C 24 150, 30 96, 60 92 C 90 96, 96 150, 98 210 Z" fill={color} />
        )}
        {hijab ? (
          <path d={`M60 ${sitting ? 20 : 38} C 84 ${sitting ? 20 : 38}, 90 ${sitting ? 54 : 72}, 88 ${sitting ? 84 : 102} C 76 ${sitting ? 92 : 110}, 44 ${sitting ? 92 : 110}, 32 ${sitting ? 84 : 102} C 30 ${sitting ? 54 : 72}, 36 ${sitting ? 20 : 38}, 60 ${sitting ? 20 : 38} Z`} fill={color} style={{ filter: 'brightness(0.82)' }} />
        ) : null}
        <circle cx="60" cy={sitting ? 46 : 64} r="24" fill="#E8C9A6" />
        {hijab && <path d={`M36 ${sitting ? 42 : 60} C 38 ${sitting ? 18 : 36}, 82 ${sitting ? 18 : 36}, 84 ${sitting ? 42 : 60} C 80 ${sitting ? 30 : 48}, 40 ${sitting ? 30 : 48}, 36 ${sitting ? 42 : 60} Z`} fill={color} style={{ filter: 'brightness(0.82)' }} />}
        {!hijab && <path d={`M37 ${sitting ? 40 : 58} C 40 ${sitting ? 20 : 38}, 80 ${sitting ? 20 : 38}, 83 ${sitting ? 40 : 58} C 74 ${sitting ? 32 : 50}, 46 ${sitting ? 32 : 50}, 37 ${sitting ? 40 : 58} Z`} fill="#2B1C14" />}
      </svg>
    </motion.div>
  );
}

/** A speech or thought bubble pointing down to (x, y). */
export function Bubble({ x, y, text, tone = 'light', thought = false, accent = false, delay = 0, width = 260, align = 'left' }: {
  x: number; y: number; text: React.ReactNode; tone?: Tone; thought?: boolean; accent?: boolean; delay?: number; width?: number; align?: 'left' | 'right';
}) {
  const bg = accent ? CRIMSON : tone === 'light' ? '#FFFDF8' : 'rgba(246,241,232,0.96)';
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: align === 'left' ? x - 30 : x - width + 30, bottom: 900 - y + 18, width }}
      initial={{ opacity: 0, scale: 0.6, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.7, delay }}>
      <div className="relative rounded-[20px] font-sans" style={{ padding: '12px 16px', background: bg, color: accent ? '#fff' : INK_TEXT, fontSize: 18, lineHeight: 1.3, fontWeight: 600, boxShadow: '0 18px 40px -20px rgba(40,10,5,0.5)', fontStyle: thought ? 'italic' : 'normal' }}>
        {text}
        {thought ? (
          <>
            <span className="absolute rounded-full" style={{ width: 14, height: 14, background: bg, bottom: -16, [align === 'left' ? 'left' : 'right']: 22 }} />
            <span className="absolute rounded-full" style={{ width: 8, height: 8, background: bg, bottom: -28, [align === 'left' ? 'left' : 'right']: 16 }} />
          </>
        ) : (
          <span className="absolute" style={{ bottom: -10, [align === 'left' ? 'left' : 'right']: 24, width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: `12px solid ${bg}` }} />
        )}
      </div>
    </motion.div>
  );
}

/** A rounded chip; the strong one glows in crimson. */
export function Chip({ x, y, children, strong = false, color, delay = 0, tone = 'light' }: { x: number; y: number; children: React.ReactNode; strong?: boolean; color?: string; delay?: number; tone?: Tone }) {
  const bg = color ?? (strong ? CRIMSON : tone === 'light' ? '#FFFDF8' : 'rgba(246,241,232,0.95)');
  return (
    <motion.span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full font-sans font-bold" style={{ left: x, top: y, padding: '8px 16px', fontSize: 18, background: bg, color: strong || color ? '#fff' : INK_TEXT, boxShadow: strong ? `0 0 30px 6px ${CRIMSON}55` : '0 10px 24px -14px rgba(0,0,0,0.45)' }}
      initial={{ opacity: 0, y: 12, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, delay, ease }}>
      {children}
    </motion.span>
  );
}

/** A big caption inside the graphic area, words rising from a blur. */
export function Big({ x, y, w = 720, children, tone, size = 56, delay = 0.3, align = 'center' }: { x: number; y: number; w?: number; children: React.ReactNode; tone: Tone; size?: number; delay?: number; align?: 'center' | 'left' }) {
  return (
    <motion.p className="pointer-events-none absolute m-0 font-serif" style={{ left: x, top: y, width: w, fontSize: size, lineHeight: 1.05, color: ink(tone), textAlign: align }}
      initial={{ opacity: 0, y: 26, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay, ease }}>
      {children}
    </motion.p>
  );
}

/** Arabic beneath an English label. */
export function Ar({ children, size = 24, color = DEEP, style }: { children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }) {
  return <span lang="ar" dir="rtl" className="font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: size, color, ...style }}>{children}</span>;
}

/** A full-canvas SVG layer for lines and shapes. */
export function Svg({ children }: { children: React.ReactNode }) {
  return <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">{children}</svg>;
}

/** A line that draws itself. */
export function Draw({ d, color = GOLD, width = 3, delay = 0, dur = 1.2, dash, glow = false, opacity = 1 }: { d: string; color?: string; width?: number; delay?: number; dur?: number; dash?: string; glow?: boolean; opacity?: number }) {
  return (
    <motion.path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={opacity}
      style={glow ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: dur, delay, ease: [0.65, 0, 0.35, 1] }} />
  );
}

/** A horizontal meter that fills to `value` (0–1). */
export function Meter({ x, y, w = 420, value, color = GOLD, label, sub, tone, delay = 0, strong = false }: { x: number; y: number; w?: number; value: number; color?: string; label: string; sub?: string; tone: Tone; delay?: number; strong?: boolean }) {
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x, top: y, width: w }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <span className="font-sans font-bold" style={{ fontSize: strong ? 24 : 20, color: ink(tone) }}>{label}</span>
        {sub && <span className="font-sans font-semibold" style={{ fontSize: 15, color: soft(tone) }}>{sub}</span>}
      </div>
      <div className="h-[16px] overflow-hidden rounded-full" style={{ background: tone === 'light' ? 'rgba(31,22,18,0.08)' : 'rgba(246,241,232,0.12)' }}>
        <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${color})`, boxShadow: strong ? `0 0 18px 4px ${color}88` : undefined }} initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ duration: 1.1, delay: delay + 0.3, ease }} />
      </div>
    </motion.div>
  );
}

/* ---------- icons (24 × 24 grid, stroked) ---------- */

const ICONS: Record<string, string> = {
  book: 'M4 5c3-1 6-1 8 1v14c-2-2-5-2-8-1zM20 5c-3-1-6-1-8 1v14c2-2 5-2 8-1z',
  scroll: 'M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2M9 9h6M9 13h6',
  sun: 'M3 17h18M6 17a6 6 0 0 1 12 0M12 5v2M5 9l1.5 1.5M19 9l-1.5 1.5',
  pen: 'M15 4l5 5L9 20H4v-5zM13 6l5 5',
  light: 'M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3',
  chain: 'M9 15l6-6M7 11l-2 2a3 3 0 0 0 4 4l2-2M17 13l2-2a3 3 0 0 0-4-4l-2 2',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  head: 'M8 20v-3a6 6 0 1 1 8-6v2l2 2h-2v3h-3v2',
  mail: 'M3 6h18v12H3zM3 6l9 7 9-7',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20h4',
  chat: 'M4 5h16v11H9l-5 4z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  coin: 'M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
  bowl: 'M3 11h18a9 9 0 0 1-18 0zM8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4',
  shirt: 'M8 3l4 2 4-2 5 4-3 3-2-1v12H8V9l-2 1-3-3z',
  car: 'M3 15l2-6h14l2 6v3H3zM7 18v2M17 18v2M6 15h.01M18 15h.01',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  house: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
  gift: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0',
  check: 'M5 12l5 5L20 7',
  door: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16M14 12h.01',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
};

export function Icon({ name, size = 40, color = INK_TEXT, width = 1.8 }: { name: keyof typeof ICONS | string; size?: number; color?: string; width?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] ?? ICONS.check} />
    </svg>
  );
}

/** An icon in a soft round badge, placed at its centre. */
export function Badge({ x, y, name, size = 76, color = CRIMSON, bg, delay = 0, glow = false }: { x: number; y: number; name: string; size?: number; color?: string; bg?: string; delay?: number; glow?: boolean }) {
  return (
    <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: x - size / 2, top: y - size / 2, width: size, height: size, background: bg ?? '#FFFDF8', boxShadow: glow ? `0 0 34px 8px ${GOLD}88` : '0 14px 30px -16px rgba(40,10,5,0.5)' }}
      initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.7, delay }}>
      <Icon name={name} size={size * 0.5} color={color} />
    </motion.div>
  );
}

export { CRIMSON, GOLD, TEAL };
