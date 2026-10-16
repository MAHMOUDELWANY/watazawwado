import React from 'react';

/**
 * Illustrated two-tone emblems for the homepage doors (and anywhere a generic icon would feel cheap).
 * Drawn on a 96×96 grid for deep brand backgrounds: paper and gold shapes, one warm light source each.
 * Idle motion comes from the .emblem-glow / .emblem-flicker / .emblem-twinkle / .emblem-float classes
 * in index.css, which reduced motion switches off. Decorative: the link text carries the meaning.
 */

const GOLD = '#E5A93C';
const GOLD_HI = '#F6D58E';
const GOLD_LO = '#B9782A';
const PAPER = '#FAF7F2';
const PAPER_SHADE = '#E9DCC6';
const INK = '#8B4935';
const FLAME = '#FFF4D6';

type EmblemProps = { className?: string };

// useId gives the same value on the server and in the browser; strip the characters url(#…) dislikes.
function useGradientIds(...names: string[]) {
  const base = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return Object.fromEntries(names.map((n) => [n, `${n}-${base}`])) as Record<string, string>;
}

function Svg({ className, children }: EmblemProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false" fill="none">
      {children}
    </svg>
  );
}

function GoldGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={GOLD_HI} />
      <stop offset="55%" stopColor={GOLD} />
      <stop offset="100%" stopColor={GOLD_LO} />
    </linearGradient>
  );
}

/** Four-point sparkle, centred on (x, y). */
function Sparkle({ x, y, r, delay = 0 }: { x: number; y: number; r: number; delay?: number }) {
  const w = r * 0.28;
  return (
    <path
      className="emblem-twinkle"
      style={{ animationDelay: `${delay}s` }}
      d={`M${x} ${y - r} L${x + w} ${y - w} L${x + r} ${y} L${x + w} ${y + w} L${x} ${y + r} L${x - w} ${y + w} L${x - r} ${y} L${x - w} ${y - w} Z`}
      fill={GOLD_HI}
    />
  );
}

/** Eight-point khatam star: two squares, one turned 45°. */
function Khatam({ x, y, size, fill, stroke }: { x: number; y: number; size: number; fill: string; stroke?: string }) {
  const h = size / 2;
  return (
    <g fill={fill} stroke={stroke} strokeWidth={stroke ? 0.8 : undefined} strokeLinejoin="round">
      <rect x={x - h} y={y - h} width={size} height={size} />
      <rect x={x - h} y={y - h} width={size} height={size} transform={`rotate(45 ${x} ${y})`} />
    </g>
  );
}

/** Lessons: an open mushaf resting on a rehal stand, light rising from its pages. */
export function MushafEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  const lines = [35.5, 41, 46.5];
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <circle className="emblem-glow" cx="48" cy="40" r="26" fill={GOLD} fillOpacity="0.22" />
      {/* rehal: two crossed boards */}
      <g stroke={`url(#${id.gold})`} strokeWidth="5.5" strokeLinecap="round">
        <path d="M30 87 L64 50" />
        <path d="M66 87 L32 50" />
      </g>
      <circle cx="48" cy="68.5" r="2.4" fill={GOLD_HI} />
      {/* cover */}
      <path d="M48 61 C40 55 27 53 13 55 V33 C27 31 40 33 48 39 C56 33 69 31 83 33 V55 C69 53 56 55 48 61 Z" fill="#7A1E1A" stroke={GOLD} strokeWidth="1.2" strokeLinejoin="round" />
      {/* pages */}
      <path d="M48 58 C40 52 28 50 16 52 V30 C28 28 40 30 48 36 Z" fill={PAPER} />
      <path d="M48 58 C56 52 68 50 80 52 V30 C68 28 56 30 48 36 Z" fill={PAPER_SHADE} />
      <path d="M48 36 V58" stroke="#CDBB9C" strokeWidth="1" />
      <g stroke={INK} strokeOpacity="0.38" strokeWidth="1.4" strokeLinecap="round">
        {lines.map((y) => (
          <React.Fragment key={y}>
            <path d={`M21 ${y} C29 ${y - 1} 37 ${y} 44 ${y + 4}`} />
            <path d={`M75 ${y} C67 ${y - 1} 59 ${y} 52 ${y + 4}`} />
          </React.Fragment>
        ))}
      </g>
      <g className="emblem-float">
        <Sparkle x={48} y={17} r={6} />
        <Sparkle x={34} y={22} r={2.6} delay={1.1} />
        <Sparkle x={62} y={21} r={3} delay={2} />
      </g>
    </Svg>
  );
}

/** How it works: a road lit by lanterns, leading to a star on the horizon. */
export function PathEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold', 'road');
  const lamps: Array<[number, number, number, number]> = [
    // x, base y, post height, scale
    [20, 90, 16, 1.15], [33, 64, 11, 0.85], [39, 44, 7, 0.6],
    [76, 90, 16, 1.15], [63, 64, 11, 0.85], [57, 44, 7, 0.6],
  ];
  return (
    <Svg className={className}>
      <defs>
        <GoldGradient id={id.gold} />
        <linearGradient id={id.road} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={PAPER} stopOpacity="0.95" />
          <stop offset="100%" stopColor={PAPER} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <circle className="emblem-glow" cx="48" cy="22" r="13" fill={GOLD} fillOpacity="0.3" />
      <path d="M28 92 H68 L52 30 H44 Z" fill={`url(#${id.road})`} />
      <path d="M48 89 V34" stroke={GOLD} strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
      <Khatam x={48} y={22} size={10} fill={`url(#${id.gold})`} />
      <circle cx="48" cy="22" r="2.2" fill={FLAME} />
      {lamps.map(([x, y, h, s], i) => (
        <g key={i}>
          <path d={`M${x} ${y} V${y - h}`} stroke={PAPER_SHADE} strokeOpacity="0.75" strokeWidth={1.6 * s} strokeLinecap="round" />
          <circle className="emblem-twinkle" style={{ animationDelay: `${(i % 3) * 0.7}s` }} cx={x} cy={y - h - 2.5 * s} r={6 * s} fill={GOLD} fillOpacity="0.35" />
          <rect x={x - 2.5 * s} y={y - h - 5.5 * s} width={5 * s} height={6 * s} rx={1.2 * s} fill={GOLD_HI} />
        </g>
      ))}
    </Svg>
  );
}

/** Teachers: a teacher and a student sitting together under a mihrab arch, a lamp above them. */
export function TeachersEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <path d="M24 90 V47 A24 24 0 0 1 72 47 V90 Z" fill={PAPER} fillOpacity="0.1" />
      <path d="M18 90 V46 A30 30 0 0 1 78 46 V90" stroke={`url(#${id.gold})`} strokeWidth="3.5" strokeLinecap="round" />
      <circle className="emblem-glow" cx="48" cy="34" r="9" fill={GOLD} fillOpacity="0.4" />
      <path d="M48 23 V30" stroke={GOLD} strokeWidth="1" />
      <path className="emblem-flicker" d="M44 30 H52 L50.5 36.5 H45.5 Z" fill={GOLD_HI} />
      {/* teacher */}
      <circle cx="40" cy="54" r="6.5" fill={PAPER} />
      <path d="M27 90 C27 75 33 67 40 67 C47 67 53 75 53 90 Z" fill={PAPER} />
      {/* student */}
      <circle cx="58" cy="62" r="5" fill={GOLD_HI} />
      <path d="M48 90 C48 79 52 73 58 73 C64 73 68 79 68 90 Z" fill={`url(#${id.gold})`} />
      <path d="M51 84 L57.5 82 L64 84 V88.5 L57.5 86.5 L51 88.5 Z" fill={PAPER} stroke={INK} strokeOpacity="0.4" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M22 90 H74" stroke={GOLD} strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Prices: an envelope (the pricing page sells envelopes) sealed with a khatam wax seal. */
export function EnvelopeEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <g className="emblem-float">
        <rect x="14" y="28" width="68" height="48" rx="5" fill={PAPER} />
        <path d="M15 74 L42 53 M81 74 L54 53" stroke="#D9C7A8" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M15 30 L48 57 L81 30 Z" fill={PAPER_SHADE} stroke="#D9C7A8" strokeWidth="1" strokeLinejoin="round" />
        <path d="M20 28 H76" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" />
        <circle className="emblem-glow" cx="48" cy="57" r="14" fill={GOLD} fillOpacity="0.35" />
        <Khatam x={48} y={57} size={17} fill="#B4231F" stroke={GOLD} />
        <circle cx="48" cy="57" r="6" fill={`url(#${id.gold})`} />
        <Khatam x={48} y={57} size={4.4} fill="#B4231F" />
      </g>
      <Sparkle x={76} y={18} r={5} />
      <Sparkle x={20} y={20} r={2.6} delay={1.4} />
    </Svg>
  );
}

/** Questions: a fanoos lantern with a flickering flame, a light for the way. */
export function LanternEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold', 'glass');
  return (
    <Svg className={className}>
      <defs>
        <GoldGradient id={id.gold} />
        <linearGradient id={id.glass} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFEFC2" />
          <stop offset="100%" stopColor="#F2B24C" />
        </linearGradient>
      </defs>
      <circle className="emblem-glow" cx="48" cy="52" r="30" fill={GOLD} fillOpacity="0.2" />
      <circle cx="48" cy="10" r="3" stroke={GOLD} strokeWidth="1.8" />
      <path d="M48 13 V18" stroke={GOLD} strokeWidth="1.6" />
      <path d="M36 30 C36 22 42 18 48 18 C54 18 60 22 60 30 Z" fill={`url(#${id.gold})`} />
      <rect x="33" y="29" width="30" height="5" rx="1.5" fill={GOLD} />
      <path d="M34 34 H62 L67 55 L59 72 H37 L29 55 Z" fill={`url(#${id.glass})`} />
      <circle className="emblem-glow" cx="48" cy="49" r="11" fill="#FFFFFF" fillOpacity="0.45" />
      <g className="emblem-flicker">
        <path d="M48 39 C51.5 43.5 53.5 46.5 53.5 49 A5.5 5.5 0 0 1 42.5 49 C42.5 46.5 44.5 43.5 48 39 Z" fill="#F2A93B" />
        <path d="M48 44 C49.8 46.3 50.8 47.8 50.8 49.2 A2.8 2.8 0 0 1 45.2 49.2 C45.2 47.8 46.2 46.3 48 44 Z" fill={FLAME} />
      </g>
      <g stroke={GOLD_LO} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M42 34 L39 55 L43 72 M54 34 L57 55 L53 72 M29.5 55 H66.5" />
      </g>
      <path d="M34 34 H62 L67 55 L59 72 H37 L29 55 Z" stroke={`url(#${id.gold})`} strokeWidth="2.2" strokeLinejoin="round" />
      <rect x="37" y="72" width="22" height="5" rx="1.5" fill={`url(#${id.gold})`} />
      <path d="M42 77 H54 L48 85 Z" fill={GOLD_LO} />
    </Svg>
  );
}

/** Your account: an arched door left ajar, warm light spilling out onto the floor. */
export function DoorAjarEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold', 'light');
  return (
    <Svg className={className}>
      <defs>
        <GoldGradient id={id.gold} />
        <linearGradient id={id.light} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF6DD" />
          <stop offset="100%" stopColor="#F2B24C" />
        </linearGradient>
      </defs>
      <path className="emblem-glow" d="M26 88 H70 L88 95 H8 Z" fill={GOLD} fillOpacity="0.4" />
      <path d="M26 88 V42 A22 22 0 0 1 70 42 V88 Z" fill={`url(#${id.light})`} />
      <circle className="emblem-glow" cx="48" cy="58" r="15" fill="#FFFFFF" fillOpacity="0.5" />
      <Khatam x={48} y={56} size={8} fill="#C51F24" />
      <circle cx="48" cy="56" r="2" fill={GOLD_HI} />
      <path d="M24 88 V42 A24 24 0 0 1 72 42 V88" stroke={`url(#${id.gold})`} strokeWidth="3.5" strokeLinecap="round" />
      {/* the open leaf, swung toward us on its hinge */}
      <path d="M70 88 V40 C75 30 81 25 87 23 V94 Z" fill="#5A2A1E" stroke={GOLD} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M74 84 V43 C77 37 80 34 83 32 V88 Z" stroke={GOLD} strokeOpacity="0.5" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="79" cy="63" r="1.9" fill={GOLD_HI} />
      <Sparkle x={36} y={30} r={2.6} delay={0.8} />
    </Svg>
  );
}
