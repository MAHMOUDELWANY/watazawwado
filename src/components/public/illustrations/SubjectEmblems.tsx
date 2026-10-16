import React from 'react';
import { MushafEmblem } from '../emblems/DoorEmblems';
import {
  GOLD, GOLD_HI, GOLD_LO, PAPER, PAPER_SHADE, INK, FLAME, CRIMSON_DEEP,
  useGradientIds, GoldGradient, Sparkle, Khatam, OpenMushaf, ClosedMushaf, HangingLantern, Glyph,
} from './svgKit';

/**
 * One hand-drawn emblem per subject, for the deep portal at the top of each subject card.
 * 96×96 grid, paper and gold on a deep brand panel (see docs/design-system.md §7). Decorative.
 */

type EmblemProps = { className?: string };

function Svg({ className, children }: EmblemProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false" fill="none">
      {children}
    </svg>
  );
}

/** Tajweed: a mushaf with the arcs of the sound rising from it (makharij). */
function TajweedEmblem({ className }: EmblemProps) {
  return (
    <Svg className={className}>
      <circle className="emblem-glow" cx="48" cy="50" r="28" fill={GOLD} fillOpacity="0.2" />
      {[11, 19, 27].map((r, i) => (
        <path
          key={r}
          className="emblem-twinkle"
          style={{ animationDelay: `${i * 0.6}s` }}
          d={`M${48 - r} 50 A${r} ${r} 0 0 1 ${48 + r} 50`}
          stroke={i === 0 ? GOLD_HI : GOLD}
          strokeOpacity={1 - i * 0.22}
          strokeWidth={3 - i * 0.6}
          strokeLinecap="round"
        />
      ))}
      <circle cx="48" cy="50" r="2.6" fill={FLAME} />
      <OpenMushaf transform="translate(48 66) scale(0.74) translate(-48 -45)" />
      <Sparkle x={20} y={24} r={3} delay={0.5} />
      <Sparkle x={77} y={20} r={4} delay={1.6} />
    </Svg>
  );
}

/** Memorization: a heart drawn in gold around a closed mushaf. */
function HeartMushafEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <circle className="emblem-glow" cx="48" cy="50" r="30" fill={GOLD} fillOpacity="0.2" />
      <path
        d="M48 84 C24 68 12 54 13 39 C14 25 31 18 42 26 C45 28 47 31 48 33 C49 31 51 28 54 26 C65 18 82 25 83 39 C84 54 72 68 48 84 Z"
        fill={GOLD}
        fillOpacity="0.12"
        stroke={`url(#${id.gold})`}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <g className="emblem-float"><ClosedMushaf x={48} y={51} goldId={id.gold} /></g>
      <Sparkle x={80} y={18} r={4} />
      <Sparkle x={16} y={20} r={2.6} delay={1.3} />
    </Svg>
  );
}

/** Revision: an open mushaf inside a circular arrow of light. */
function RevisionEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <circle className="emblem-glow" cx="48" cy="48" r="26" fill={GOLD} fillOpacity="0.22" />
      <path d="M48 14 A34 34 0 1 1 18.6 31" stroke={`url(#${id.gold})`} strokeWidth="4" strokeLinecap="round" />
      <path d="M22.1 24.9 L14.3 28.5 L22.9 33.5 Z" fill={GOLD} stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round" />
      {[[82, 48], [48, 82], [24, 72]].map(([x, y], i) => (
        <circle key={i} className="emblem-twinkle" style={{ animationDelay: `${i * 0.9}s` }} cx={x} cy={y} r="2.2" fill={FLAME} />
      ))}
      <OpenMushaf transform="translate(48 50) scale(0.56) translate(-48 -45)" />
      <Sparkle x={48} y={14} r={4.5} />
    </Svg>
  );
}

/** Aqeedah: a single mosque lamp, one clear light. */
function LampEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold', 'glass');
  return (
    <Svg className={className}>
      <defs>
        <GoldGradient id={id.gold} />
        <linearGradient id={id.glass} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF1CC" />
          <stop offset="100%" stopColor="#F2B24C" />
        </linearGradient>
      </defs>
      <circle className="emblem-glow" cx="48" cy="58" r="34" fill={GOLD} fillOpacity="0.2" />
      <path d="M48 6 L34 29 M48 6 L62 29 M48 6 V29" stroke={GOLD} strokeOpacity="0.8" strokeWidth="1.2" />
      <rect x="31" y="28" width="34" height="4.5" rx="1.5" fill={`url(#${id.gold})`} />
      <path d="M34 32.5 H62 C62 42 72 48 72 58 C72 70 61 78 48 78 C35 78 24 70 24 58 C24 48 34 42 34 32.5 Z" fill={`url(#${id.glass})`} />
      <circle className="emblem-glow" cx="48" cy="58" r="13" fill="#FFFFFF" fillOpacity="0.5" />
      <g className="emblem-flicker">
        <path d="M48 47 C51.5 51.5 53.5 54.5 53.5 57 A5.5 5.5 0 0 1 42.5 57 C42.5 54.5 44.5 51.5 48 47 Z" fill="#F2A93B" />
        <path d="M48 52 C49.8 54.3 50.8 55.8 50.8 57.2 A2.8 2.8 0 0 1 45.2 57.2 C45.2 55.8 46.2 54.3 48 52 Z" fill={FLAME} />
      </g>
      <path d="M25.5 52 C38 55 58 55 70.5 52" stroke={GOLD_LO} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M34 32.5 H62 C62 42 72 48 72 58 C72 70 61 78 48 78 C35 78 24 70 24 58 C24 48 34 42 34 32.5 Z" stroke={`url(#${id.gold})`} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M42 77.5 H54 L48 88 Z" fill={`url(#${id.gold})`} />
      <Sparkle x={78} y={22} r={3.4} delay={0.8} />
    </Svg>
  );
}

/** Fiqh: a prayer mat with a ewer for wudu, water dripping from its spout. */
function PrayerMatEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <circle className="emblem-glow" cx="44" cy="50" r="32" fill={GOLD} fillOpacity="0.18" />
      <rect x="12" y="18" width="44" height="66" rx="3" fill="#8E1F1F" stroke={GOLD} strokeWidth="1.4" />
      <rect x="16" y="22" width="36" height="58" rx="2" stroke={GOLD} strokeOpacity="0.55" strokeWidth="1" />
      <path d="M22 76 V44 A12 12 0 0 1 46 44 V76" stroke={`url(#${id.gold})`} strokeWidth="1.6" />
      <Khatam x={34} y={47} size={6} fill={GOLD_HI} />
      <g stroke={GOLD} strokeOpacity="0.7" strokeWidth="1" strokeLinecap="round">
        {[16, 20, 24, 28, 32, 36, 40, 44, 48, 52].map((x) => <path key={x} d={`M${x} 84 V89`} />)}
      </g>
      {/* ewer (ibreeq) */}
      <path d="M65 72 C58 70 56 62 54 56" stroke={`url(#${id.gold})`} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M79 58 C88 60 88 74 81 78" stroke={GOLD_LO} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M64 86 C60 80 60 70 66 64 C68 62 68 58 67 54 H77 C76 58 76 62 78 64 C84 70 84 80 80 86 Z" fill={`url(#${id.gold})`} />
      <path d="M66 54 C66 49 69 46 72 46 C75 46 78 49 78 54 Z" fill={GOLD_HI} />
      <circle cx="72" cy="44" r="1.6" fill={GOLD_HI} />
      <rect x="63" y="85" width="18" height="3" rx="1.2" fill={GOLD_LO} />
      <path d="M62 72 H82" stroke={PAPER} strokeOpacity="0.5" strokeWidth="1" />
      {[[53, 62], [52.4, 68.5]].map(([x, y], i) => (
        <path key={i} className="emblem-twinkle" style={{ animationDelay: `${i * 0.8}s` }} d={`M${x} ${y - 2.6} C${x + 1.6} ${y - 0.4} ${x + 1.8} ${y + 1.6} ${x} ${y + 1.8} C${x - 1.8} ${y + 1.6} ${x - 1.6} ${y - 0.4} ${x} ${y - 2.6} Z`} fill="#CFEFF5" />
      ))}
    </Svg>
  );
}

/** Seerah: a path to a distant dome under a crescent. */
function SeerahEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold', 'road', 'moon');
  return (
    <Svg className={className}>
      <defs>
        <GoldGradient id={id.gold} />
        <linearGradient id={id.road} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={PAPER} stopOpacity="0.95" />
          <stop offset="100%" stopColor={PAPER} stopOpacity="0.2" />
        </linearGradient>
        <mask id={id.moon}>
          <circle cx="68" cy="20" r="9" fill="#fff" />
          <circle cx="72" cy="16.5" r="8" fill="#000" />
        </mask>
      </defs>
      <circle className="emblem-glow" cx="66" cy="20" r="15" fill={GOLD} fillOpacity="0.3" />
      <circle cx="68" cy="20" r="9" fill={GOLD_HI} mask={`url(#${id.moon})`} />
      <path d="M8 52 H88" stroke={GOLD} strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M24 92 H72 L52 52 H44 Z" fill={`url(#${id.road})`} />
      <path d="M48 89 V56" stroke={GOLD} strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
      {/* the dome and a minaret on the horizon */}
      <circle className="emblem-glow" cx="48" cy="42" r="12" fill={GOLD} fillOpacity="0.28" />
      <rect x="39" y="43" width="18" height="9" fill={PAPER} />
      <path d="M39 43.5 A9 9 0 0 1 57 43.5 Z" fill={`url(#${id.gold})`} />
      <path d="M48 34.5 V30" stroke={GOLD_HI} strokeWidth="1.2" strokeLinecap="round" />
      <rect x="61" y="32" width="3.6" height="20" fill={PAPER_SHADE} />
      <path d="M60.4 32.5 L62.8 26 L65.2 32.5 Z" fill={GOLD} />
      <rect x="45.5" y="46" width="5" height="6" rx="2.5" fill={INK} fillOpacity="0.55" />
      <Sparkle x={24} y={22} r={3} delay={0.7} />
      <Sparkle x={36} y={12} r={2} delay={1.8} />
    </Svg>
  );
}

/** Islamic studies basics: a lantern lighting a small stack of books. */
function LanternBookEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <HangingLantern x={48} top={2} s={1.1} goldId={id.gold} />
      <ellipse className="emblem-glow" cx="48" cy="80" rx="30" ry="8" fill={GOLD} fillOpacity="0.3" />
      <rect x="24" y="80" width="48" height="9" rx="2" fill={CRIMSON_DEEP} stroke={GOLD} strokeWidth="1" />
      <path d="M28 84.5 H68" stroke={GOLD_HI} strokeOpacity="0.7" strokeWidth="1" />
      <rect x="29" y="71" width="38" height="9" rx="2" fill={PAPER} />
      <rect x="29" y="71" width="6" height="9" rx="1.5" fill={`url(#${id.gold})`} />
      <Sparkle x={80} y={30} r={3.4} delay={0.4} />
      <Sparkle x={16} y={44} r={2.4} delay={1.5} />
    </Svg>
  );
}

/** Modern Standard Arabic: an inkwell and qalam beside the letter ع. */
function InkwellEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <circle className="emblem-glow" cx="66" cy="44" r="24" fill={GOLD} fillOpacity="0.24" />
      <Glyph x={67} y={42} size={42} fill={PAPER}>ع</Glyph>
      <path d="M33 64 L60 16" stroke={PAPER_SHADE} strokeWidth="4" strokeLinecap="round" />
      <path d="M58.5 18.6 L61.8 12.8 L62.6 19.2 Z" fill={GOLD_HI} />
      <path d="M58 21 L61 16" stroke={GOLD} strokeWidth="4.4" strokeLinecap="butt" />
      <rect x="26" y="58" width="16" height="7" rx="1.5" fill={`url(#${id.gold})`} />
      <path d="M24 88 C20 88 17 85 17 81 V72 C17 67 21 65 25 65 H43 C47 65 51 67 51 72 V81 C51 85 48 88 44 88 Z" fill="#3B2219" stroke={`url(#${id.gold})`} strokeWidth="1.8" />
      <path d="M22 73 H46" stroke={GOLD} strokeOpacity="0.5" strokeWidth="1" />
      <Sparkle x={86} y={16} r={3} delay={1.1} />
      <Sparkle x={84} y={72} r={2.4} delay={0.3} />
    </Svg>
  );
}

/** Arabic conversation: two round speech bubbles, أ and ع. */
function ConversationEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <circle className="emblem-glow" cx="48" cy="48" r="30" fill={GOLD} fillOpacity="0.2" />
      <path d="M22 18 H46 A12 12 0 0 1 58 30 V40 A12 12 0 0 1 46 52 H32 L20 62 L22 51 A12 12 0 0 1 10 40 V30 A12 12 0 0 1 22 18 Z" fill={PAPER} />
      <Glyph x={34} y={34} size={28} fill={INK}>أ</Glyph>
      <g className="emblem-float">
        <path d="M50 42 H74 A12 12 0 0 1 86 54 V64 A12 12 0 0 1 74 76 L76 87 L64 76 H50 A12 12 0 0 1 38 64 V54 A12 12 0 0 1 50 42 Z" fill={`url(#${id.gold})`} />
        <Glyph x={62} y={58} size={28} fill={CRIMSON_DEEP}>ع</Glyph>
      </g>
      <Sparkle x={80} y={22} r={3.4} delay={0.9} />
    </Svg>
  );
}

/** Egyptian Arabic: a speech bubble holding the pyramids and a wave of the Nile. */
function NileEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <circle className="emblem-glow" cx="48" cy="44" r="32" fill={GOLD} fillOpacity="0.2" />
      <path d="M28 14 H68 A14 14 0 0 1 82 28 V54 A14 14 0 0 1 68 68 H42 L24 82 L28 68 A14 14 0 0 1 14 54 V28 A14 14 0 0 1 28 14 Z" fill={PAPER} />
      <circle className="emblem-glow" cx="64" cy="30" r="7" fill={GOLD} fillOpacity="0.35" />
      <circle cx="64" cy="30" r="4.5" fill={GOLD} />
      <path d="M48 57 L58 41 L68 57 Z" fill={GOLD_HI} />
      <path d="M24 57 L38 33 L52 57 Z" fill={`url(#${id.gold})`} />
      <path d="M38 33 L52 57 H42 Z" fill={GOLD_LO} fillOpacity="0.6" />
      <path d="M20 61 C26 57 32 65 38 61 S50 57 56 61 S68 65 76 61" stroke="#087D91" strokeWidth="2.6" strokeLinecap="round" />
      <Sparkle x={84} y={80} r={3.4} delay={0.6} />
    </Svg>
  );
}

/** One wooden letter block: front face with a letter, a top and a side for depth. */
function Block({ x, y, s, letter, front, ink }: { x: number; y: number; s: number; letter: string; front: string; ink: string }) {
  return (
    <g>
      <path d={`M${x} ${y} L${x + 6} ${y - 6} H${x + s + 6} L${x + s} ${y} Z`} fill={PAPER_SHADE} />
      <path d={`M${x + s} ${y} L${x + s + 6} ${y - 6} V${y + s - 6} L${x + s} ${y + s} Z`} fill="#CDB693" />
      <rect x={x} y={y} width={s} height={s} rx="2" fill={front} />
      <Glyph x={x + s / 2} y={y + s / 2} size={s * 0.78} fill={ink}>{letter}</Glyph>
    </g>
  );
}

/** Arabic foundations: the first letters as building blocks, أ on top of ب and ت. */
function LetterBlocksEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <ellipse className="emblem-glow" cx="48" cy="62" rx="40" ry="30" fill={GOLD} fillOpacity="0.2" />
      <Block x={14} y={60} s={26} letter="ت" front={PAPER} ink={CRIMSON_DEEP} />
      <Block x={44} y={60} s={26} letter="ب" front={`url(#${id.gold})`} ink={CRIMSON_DEEP} />
      <g className="emblem-float"><Block x={29} y={28} s={26} letter="أ" front={PAPER} ink={INK} /></g>
      <Sparkle x={76} y={22} r={3.6} delay={0.4} />
      <Sparkle x={16} y={30} r={2.4} delay={1.4} />
    </Svg>
  );
}

/** English: two speech bubbles, A and ع, the way the two languages meet in a lesson. */
function EnglishEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <circle className="emblem-glow" cx="48" cy="48" r="30" fill={GOLD} fillOpacity="0.2" />
      <path d="M16 16 H50 A6 6 0 0 1 56 22 V46 A6 6 0 0 1 50 52 H26 L16 62 V52 A6 6 0 0 1 10 46 V22 A6 6 0 0 1 16 16 Z" fill={PAPER} />
      <Glyph x={33} y={35} size={26} fill="#05434E" style={{ fontFamily: "'Thmanyah Serif Display', Georgia, serif" }}>A</Glyph>
      <g className="emblem-float">
        <path d="M46 40 H80 A6 6 0 0 1 86 46 V70 A6 6 0 0 1 80 76 V86 L70 76 H46 A6 6 0 0 1 40 70 V46 A6 6 0 0 1 46 40 Z" fill={`url(#${id.gold})`} />
        <Glyph x={63} y={57} size={26} fill={CRIMSON_DEEP}>ع</Glyph>
      </g>
      <Sparkle x={80} y={20} r={3.4} delay={1} />
    </Svg>
  );
}

/** Subject id (SERVICES_DATA) → its emblem. */
export const SUBJECT_EMBLEMS: Record<string, React.ComponentType<EmblemProps>> = {
  'quran-reading': MushafEmblem,
  'tajweed': TajweedEmblem,
  'quran-memorization': HeartMushafEmblem,
  'quran-revision': RevisionEmblem,
  'aqeedah': LampEmblem,
  'fiqh': PrayerMatEmblem,
  'seerah': SeerahEmblem,
  'islamic-studies': LanternBookEmblem,
  'modern-standard-arabic': InkwellEmblem,
  'arabic-conversation': ConversationEmblem,
  'egyptian-arabic': NileEmblem,
  'arabic-foundations': LetterBlocksEmblem,
  'english': EnglishEmblem,
};
