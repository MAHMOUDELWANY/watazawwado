import React from 'react';

/**
 * Shared pieces for the hand-drawn subject emblems and study scenes.
 * Same palette and recipe as ../emblems/DoorEmblems.tsx (paper + gold on a deep brand panel).
 */

export const GOLD = '#E5A93C';
export const GOLD_HI = '#F6D58E';
export const GOLD_LO = '#B9782A';
export const PAPER = '#FAF7F2';
export const PAPER_SHADE = '#E9DCC6';
export const INK = '#8B4935';
export const FLAME = '#FFF4D6';
export const CRIMSON_DEEP = '#7A1E1A';

// useId is the same on the server and in the browser; strip the characters url(#…) dislikes.
export function useGradientIds(...names: string[]) {
  const base = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return Object.fromEntries(names.map((n) => [n, `${n}-${base}`])) as Record<string, string>;
}

export function GoldGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={GOLD_HI} />
      <stop offset="55%" stopColor={GOLD} />
      <stop offset="100%" stopColor={GOLD_LO} />
    </linearGradient>
  );
}

/** Four-point sparkle centred on (x, y). */
export function Sparkle({ x, y, r, delay = 0, fill = GOLD_HI }: { x: number; y: number; r: number; delay?: number; fill?: string }) {
  const w = r * 0.28;
  return (
    <path
      className="emblem-twinkle"
      style={{ animationDelay: `${delay}s` }}
      d={`M${x} ${y - r} L${x + w} ${y - w} L${x + r} ${y} L${x + w} ${y + w} L${x} ${y + r} L${x - w} ${y + w} L${x - r} ${y} L${x - w} ${y - w} Z`}
      fill={fill}
    />
  );
}

/** Eight-point khatam star: two squares, one turned 45°. */
export function Khatam({ x, y, size, fill, stroke }: { x: number; y: number; size: number; fill: string; stroke?: string }) {
  const h = size / 2;
  return (
    <g fill={fill} stroke={stroke} strokeWidth={stroke ? 0.8 : undefined} strokeLinejoin="round">
      <rect x={x - h} y={y - h} width={size} height={size} />
      <rect x={x - h} y={y - h} width={size} height={size} transform={`rotate(45 ${x} ${y})`} />
    </g>
  );
}

/**
 * An open mushaf drawn around (48, 45) on the 96 grid; place it with `transform`.
 * `flutter` makes the right-hand page lift gently from the spine.
 */
export function OpenMushaf({ transform, flutter = false }: { transform?: string; flutter?: boolean }) {
  const lines = [35.5, 41, 46.5];
  return (
    <g transform={transform}>
      <path d="M48 61 C40 55 27 53 13 55 V33 C27 31 40 33 48 39 C56 33 69 31 83 33 V55 C69 53 56 55 48 61 Z" fill={CRIMSON_DEEP} stroke={GOLD} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M48 58 C40 52 28 50 16 52 V30 C28 28 40 30 48 36 Z" fill={PAPER} />
      <g className={flutter ? 'scene-flutter' : undefined} style={flutter ? { transformOrigin: '0% 50%' } : undefined}>
        <path d="M48 58 C56 52 68 50 80 52 V30 C68 28 56 30 48 36 Z" fill={PAPER_SHADE} />
        <g stroke={INK} strokeOpacity="0.38" strokeWidth="1.4" strokeLinecap="round">
          {lines.map((y) => <path key={y} d={`M75 ${y} C67 ${y - 1} 59 ${y} 52 ${y + 4}`} />)}
        </g>
      </g>
      <path d="M48 36 V58" stroke="#CDBB9C" strokeWidth="1" />
      <g stroke={INK} strokeOpacity="0.38" strokeWidth="1.4" strokeLinecap="round">
        {lines.map((y) => <path key={y} d={`M21 ${y} C29 ${y - 1} 37 ${y} 44 ${y + 4}`} />)}
      </g>
    </g>
  );
}

/** A closed mushaf seen from the front, centred on (x, y), 24×30. */
export function ClosedMushaf({ x, y, goldId }: { x: number; y: number; goldId: string }) {
  return (
    <g>
      <rect x={x - 10} y={y - 15} width="24" height="30" rx="2" fill={PAPER_SHADE} />
      <rect x={x - 12} y={y - 15} width="24" height="30" rx="2.5" fill={CRIMSON_DEEP} stroke={`url(#${goldId})`} strokeWidth="1.6" />
      <rect x={x - 8.5} y={y - 11.5} width="17" height="23" rx="1.5" stroke={GOLD} strokeOpacity="0.6" strokeWidth="0.8" />
      <Khatam x={x} y={y} size={8} fill={`url(#${goldId})`} />
      <circle cx={x} cy={y} r="1.6" fill={CRIMSON_DEEP} />
    </g>
  );
}

/** A small fanoos lantern hanging from (x, top); `s` scales it. Flame flickers, glow breathes. */
export function HangingLantern({ x, top, s = 1, goldId }: { x: number; top: number; s?: number; goldId: string }) {
  return (
    <g transform={`translate(${x} ${top}) scale(${s})`}>
      <g className="scene-swing" style={{ transformOrigin: '50% 0%' }}>
        <path d="M0 0 V10" stroke={GOLD} strokeWidth="1.4" />
        <circle className="emblem-glow" cx="0" cy="30" r="20" fill={GOLD} fillOpacity="0.28" />
        <path d="M-8 18 C-8 13 -4 10 0 10 C4 10 8 13 8 18 Z" fill={`url(#${goldId})`} />
        <rect x="-10" y="17" width="20" height="3.5" rx="1" fill={GOLD} />
        <path d="M-9 20.5 H9 L12 33 L7 43 H-7 L-12 33 Z" fill="#FFE3A3" />
        <path className="emblem-flicker" d="M0 25 C2.6 28.5 4 30.6 4 32.4 A4 4 0 0 1 -4 32.4 C-4 30.6 -2.6 28.5 0 25 Z" fill="#F2A93B" />
        <path d="M-9 20.5 H9 L12 33 L7 43 H-7 L-12 33 Z M-12 33 H12" stroke={GOLD_LO} strokeWidth="1.2" strokeLinejoin="round" />
        <rect x="-7" y="43" width="14" height="3.5" rx="1" fill={`url(#${goldId})`} />
        <path d="M-4 46.5 H4 L0 52 Z" fill={GOLD_LO} />
      </g>
    </g>
  );
}

/** Arabic or Latin glyph, centred; the page font carries the letter shape. */
export function Glyph({ x, y, size, fill, children, className, style }: {
  x: number; y: number; size: number; fill: string; children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={fill}
      textAnchor="middle"
      dominantBaseline="central"
      fontWeight={700}
      className={className}
      style={{ fontFamily: "'Thmanyah Serif Display', 'Amiri', 'Thmanyah Sans', serif", ...style }}
    >
      {children}
    </text>
  );
}
