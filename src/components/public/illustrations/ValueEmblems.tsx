import React from 'react';
import {
  GOLD, GOLD_HI, PAPER, PAPER_SHADE, INK, FLAME, CRIMSON_DEEP,
  useGradientIds, GoldGradient, Sparkle, Khatam, OpenMushaf, ClosedMushaf, Glyph,
} from './svgKit';

/**
 * Hand-drawn emblems for the step, principle and philosophy cards (/how-it-works, /about).
 * Same recipe as the subject emblems (96 grid, paper and gold on a deep panel), and each one
 * moves the way its card reads: a check that draws, level bars that rise, a path that walks,
 * sand that falls. All motion classes (ve-*, emblem-*, scene-*) stop for reduced motion.
 */

type EmblemProps = { className?: string };
const SKIN = '#E2B48C';
const TEAL_LIGHT = '#12A4BC';

function Svg({ className, children }: EmblemProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false" fill="none">
      {children}
    </svg>
  );
}

function Glow({ cx = 48, cy = 50, r = 30 }: { cx?: number; cy?: number; r?: number }) {
  return <circle className="emblem-glow" cx={cx} cy={cy} r={r} fill={GOLD} fillOpacity="0.2" />;
}

/** Faceless bust: head and shoulders, centred on the head. */
function Bust({ x, y, r, cloth }: { x: number; y: number; r: number; cloth: string }) {
  return (
    <g>
      <path d={`M${x - r * 2} ${y + r * 3.2} C${x - r * 2} ${y + r * 1.4} ${x - r} ${y + r * 1.1} ${x} ${y + r * 1.1} C${x + r} ${y + r * 1.1} ${x + r * 2} ${y + r * 1.4} ${x + r * 2} ${y + r * 3.2} Z`} fill={cloth} />
      <circle cx={x} cy={y} r={r} fill={SKIN} />
    </g>
  );
}

/* ─── Steps (/how-it-works) ─── */

/** 1. Book: a calendar page, and a gold check that draws itself. */
export function TrialCalendarEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <Glow />
      <rect x="20" y="24" width="56" height="52" rx="7" fill={PAPER} />
      <path d="M20 31 A7 7 0 0 1 27 24 H69 A7 7 0 0 1 76 31 V38 H20 Z" fill={CRIMSON_DEEP} />
      {[34, 62].map((x) => <rect key={x} x={x - 2.5} y="18" width="5" height="12" rx="2.5" fill={`url(#${id.gold})`} />)}
      {[0, 1, 2, 3].map((c) => [0, 1].map((r) => (
        <circle key={`${c}${r}`} cx={30 + c * 12} cy={48 + r * 14} r="2" fill={INK} fillOpacity="0.22" />
      )))}
      <path className="ve-draw" d="M33 57 L44 67 L64 45" stroke={`url(#${id.gold})`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
      <Sparkle x={80} y={20} r={4} delay={0.6} />
      <Sparkle x={14} y={70} r={2.6} delay={1.8} />
    </Svg>
  );
}

/** 2. Meet: a teacher on screen, and level bars rising beside them. */
export function MeetLevelEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <Glow />
      <rect x="14" y="20" width="68" height="46" rx="6" fill="#05434E" stroke={`url(#${id.gold})`} strokeWidth="2" />
      <g>
        <Bust x={34} y={38} r={6.5} cloth={TEAL_LIGHT} />
      </g>
      {[[56, 9], [65, 15], [74, 21]].map(([x, h], i) => (
        <rect key={x} className="ve-rise" style={{ animationDelay: `${i * 0.35}s` }} x={x - 3} y={60 - h} width="6" height={h} rx="2" fill={i === 2 ? GOLD_HI : GOLD} />
      ))}
      <path d="M40 66 L36 76 H60 L56 66" fill={PAPER_SHADE} />
      <rect x="30" y="75" width="36" height="4" rx="2" fill={`url(#${id.gold})`} />
      <Sparkle x={82} y={14} r={3.6} delay={1.2} />
    </Svg>
  );
}

/** 3. Plan: an unrolled scroll with a path walking toward a khatam star. */
export function PlanScrollEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <Glow />
      <rect x="20" y="24" width="56" height="50" rx="3" fill={PAPER} />
      <rect x="14" y="20" width="9" height="58" rx="4.5" fill={`url(#${id.gold})`} />
      <rect x="73" y="20" width="9" height="58" rx="4.5" fill={`url(#${id.gold})`} />
      <path className="ve-march" d="M30 64 C36 48 46 66 52 50 S62 38 64 36" stroke={INK} strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 5" />
      <circle cx="30" cy="64" r="3.6" fill={TEAL_LIGHT} />
      <g className="emblem-twinkle"><Khatam x={65} y={34} size={9} fill={`url(#${id.gold})`} /></g>
      <Sparkle x={86} y={14} r={3.4} delay={0.9} />
    </Svg>
  );
}

/** 4. Learn: a laptop lesson, the voice in waves, and a chat bubble floating up. */
export function LessonLaptopEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <Glow />
      <rect x="18" y="26" width="52" height="36" rx="4" fill="#05434E" stroke={`url(#${id.gold})`} strokeWidth="2" />
      <Bust x={40} y={40} r={6} cloth={GOLD} />
      {[7, 12].map((r, i) => (
        <path key={r} className="emblem-twinkle" style={{ animationDelay: `${i * 0.5}s` }} d={`M${52 + r * 0.2} ${40 - r} A${r} ${r} 0 0 1 ${52 + r * 0.2} ${40 + r}`} stroke={GOLD_HI} strokeWidth="1.8" strokeLinecap="round" />
      ))}
      <path d="M12 62 H76 L72 69 H16 Z" fill={PAPER_SHADE} />
      <g className="emblem-float">
        <path d="M64 10 H84 A5 5 0 0 1 89 15 V25 A5 5 0 0 1 84 30 H72 L66 35 V30 H64 A5 5 0 0 1 59 25 V15 A5 5 0 0 1 64 10 Z" fill={PAPER} />
        {[67, 74, 81].map((x, i) => <circle key={x} className="emblem-twinkle" style={{ animationDelay: `${i * 0.3}s` }} cx={x} cy="20" r="2" fill={TEAL_LIGHT} />)}
      </g>
    </Svg>
  );
}

/* ─── Principles (/how-it-works) ─── */

/** Mastery before speed: an hourglass, sand falling slowly. */
export function HourglassEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <Glow />
      <path d="M32 20 H64 C64 36 52 42 50 48 C52 54 64 60 64 76 H32 C32 60 44 54 46 48 C44 42 32 36 32 20 Z" fill={PAPER} fillOpacity="0.22" stroke={PAPER} strokeOpacity="0.7" strokeWidth="1.5" />
      <path className="ve-sand-top" d="M36 26 H60 C59 35 51 40 48 46 C45 40 37 35 36 26 Z" fill={GOLD} />
      <rect className="ve-stream" x="47.2" y="46" width="1.6" height="24" fill={GOLD_HI} />
      <path className="ve-sand-bottom" d="M36 72 C38 63 44 60 48 60 C52 60 58 63 60 72 Z" fill={GOLD} />
      <rect x="26" y="15" width="44" height="6" rx="3" fill={`url(#${id.gold})`} />
      <rect x="26" y="75" width="44" height="6" rx="3" fill={`url(#${id.gold})`} />
      <Sparkle x={80} y={30} r={3.4} delay={0.4} />
      <Sparkle x={16} y={60} r={2.6} delay={1.6} />
    </Svg>
  );
}

/** Understand what you learn: an open mushaf, and the letters of فهم rising into light. */
export function UnderstandEmblem({ className }: EmblemProps) {
  return (
    <Svg className={className}>
      <Glow cy={40} r={28} />
      {['ف', 'ه', 'م'].map((ch, i) => (
        <Glyph key={ch} x={34 + i * 14} y={28 + (i % 2) * 6} size={15} fill={i === 1 ? FLAME : GOLD_HI} className="scene-drift" style={{ animationDelay: `${i * 1.1}s` }}>{ch}</Glyph>
      ))}
      <OpenMushaf transform="translate(48 64) scale(0.78) translate(-48 -45)" />
    </Svg>
  );
}

/** A small habit, every week: seven days under a crescent, lighting up one by one. */
export function WeekHabitEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  const days = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI * (0.95 - i * 0.15);
    return [48 + Math.cos(a) * 32, 66 - Math.sin(a) * 26];
  });
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <Glow cy={54} />
      <path d="M52 22 A13 13 0 1 1 40 40 A10 10 0 1 0 52 22 Z" fill={`url(#${id.gold})`} />
      {days.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5.2" fill={PAPER} fillOpacity="0.2" stroke={PAPER} strokeOpacity="0.5" strokeWidth="1" />
          <circle className="ve-seq" style={{ animationDelay: `${i * 0.45}s` }} cx={x} cy={y} r="4" fill={GOLD_HI} />
        </g>
      ))}
      <Sparkle x={78} y={18} r={3} delay={0.8} />
    </Svg>
  );
}

/** Manners before knowledge: a heart of light resting above a closed mushaf. */
export function AdabEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <Glow cy={36} r={26} />
      <g className="emblem-float">
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (Math.PI / 6) * (i + 1) + Math.PI;
          return <path key={i} className="emblem-twinkle" style={{ animationDelay: `${i * 0.4}s` }} d={`M${48 + Math.cos(a) * 20} ${36 + Math.sin(a) * 20} L${48 + Math.cos(a) * 26} ${36 + Math.sin(a) * 26}`} stroke={GOLD_HI} strokeWidth="2" strokeLinecap="round" />;
        })}
        <path className="ve-beat" d="M48 48 C38 41 32 36 32 29 C32 24 36 21 40 21 C44 21 46 23 48 26 C50 23 52 21 56 21 C60 21 64 24 64 29 C64 36 58 41 48 48 Z" fill="#E0484C" stroke={GOLD_HI} strokeWidth="1.4" />
      </g>
      <ClosedMushaf x={48} y={70} goldId={id.gold} />
    </Svg>
  );
}

/* ─── Philosophy (/about) ─── */

/** Start from where you are: three steps, and a sprout growing on the first one. */
export function FirstStepEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <Glow cx={52} cy={52} />
      <rect x="14" y="64" width="22" height="14" rx="2" fill={PAPER} />
      <rect x="37" y="50" width="22" height="28" rx="2" fill={PAPER} fillOpacity="0.75" />
      <rect x="60" y="36" width="22" height="42" rx="2" fill={PAPER} fillOpacity="0.5" />
      <g className="ve-grow">
        <path d="M25 64 V50" stroke="#3FA36B" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M25 54 C18 54 15 49 15 45 C21 45 25 48 25 54 Z" fill="#4DB37A" />
        <path d="M25 51 C31 51 35 46 35 41 C29 41 25 45 25 51 Z" fill="#6CC892" />
      </g>
      <g className="emblem-twinkle"><Khatam x={71} y={24} size={10} fill={`url(#${id.gold})`} /></g>
    </Svg>
  );
}

/** A safe space to make mistakes: a mihrab arch sheltering a heart that beats softly. */
export function ShelterEmblem({ className }: EmblemProps) {
  const id = useGradientIds('gold');
  return (
    <Svg className={className}>
      <defs><GoldGradient id={id.gold} /></defs>
      <Glow cy={52} r={28} />
      <path d="M22 82 V44 C22 26 34 14 48 12 C62 14 74 26 74 44 V82" fill={TEAL_LIGHT} fillOpacity="0.14" stroke={`url(#${id.gold})`} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M30 82 V46 C30 32 38 23 48 21 C58 23 66 32 66 46 V82" stroke={GOLD} strokeOpacity="0.45" strokeWidth="1.2" />
      <circle className="emblem-glow" cx="48" cy="54" r="15" fill={FLAME} fillOpacity="0.3" />
      <path className="ve-beat" d="M48 66 C39 59 34 55 34 49 C34 45 37 42 41 42 C44 42 46 44 48 47 C50 44 52 42 55 42 C59 42 62 45 62 49 C62 55 57 59 48 66 Z" fill="#E0484C" stroke={GOLD_HI} strokeWidth="1.4" />
      <Sparkle x={14} y={22} r={3} delay={0.5} />
      <Sparkle x={84} y={30} r={3.6} delay={1.5} />
    </Svg>
  );
}

/** One teacher, lesson after lesson: teacher and student joined by a thread of light. */
export function SameTeacherEmblem({ className }: EmblemProps) {
  return (
    <Svg className={className}>
      <Glow />
      <Bust x={30} y={38} r={8} cloth={GOLD} />
      <Bust x={68} y={46} r={6.2} cloth={TEAL_LIGHT} />
      <path className="ve-march" d="M38 60 C46 72 54 72 60 64" stroke={GOLD_HI} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="2.5 4" />
      <path className="ve-march" d="M30 22 C40 10 60 12 68 30" stroke={GOLD} strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 4" />
      <Sparkle x={49} y={13} r={3.6} delay={0.4} />
      <Sparkle x={84} y={72} r={2.8} delay={1.4} />
    </Svg>
  );
}

/** A direct relationship: two speech bubbles taking turns, nobody in between. */
export function ConversationEmblem({ className }: EmblemProps) {
  return (
    <Svg className={className}>
      <Glow />
      <g className="ve-turn-a">
        <path d="M14 22 H52 A7 7 0 0 1 59 29 V43 A7 7 0 0 1 52 50 H28 L19 58 V50 H14 A7 7 0 0 1 7 43 V29 A7 7 0 0 1 14 22 Z" fill={PAPER} />
        <path d="M17 32 H48 M17 40 H38" stroke={INK} strokeOpacity="0.4" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <g className="ve-turn-b">
        <path d="M44 46 H82 A7 7 0 0 1 89 53 V67 A7 7 0 0 1 82 74 H77 V82 L68 74 H44 A7 7 0 0 1 37 67 V53 A7 7 0 0 1 44 46 Z" fill={TEAL_LIGHT} />
        {[53, 63, 73].map((x, i) => <circle key={x} className="emblem-twinkle" style={{ animationDelay: `${i * 0.3}s` }} cx={x} cy="60" r="2.6" fill={PAPER} />)}
      </g>
      <Sparkle x={80} y={18} r={3.4} delay={0.7} />
    </Svg>
  );
}

