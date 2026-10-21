import React from 'react';
import type { EmblemId } from './achievements';

/**
 * PR-04 emblems, 96×96, in the house style of the PR-03 progress emblems: gold, teal, paper and ink, Islamic geometry,
 * nothing figurative. A locked emblem is the same drawing as an outline (`.emblem-locked` in index.css).
 */

const GOLD = '#E5A93C';
const GOLD_HI = '#F6D58E';
const GOLD_LO = '#B9782A';
const TEAL = '#087D91';
const TEAL_HI = '#14A3B8';
const TEAL_DEEP = '#054A57';
const PAPER = '#FAF7F2';
const PAPER_SHADE = '#E9DCC6';
const INK = '#8B4935';
const CRIMSON = '#7A1E1A';
const FLAME = '#FFF4D6';

function useIds(...names: string[]) {
  const raw = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return Object.fromEntries(names.map((n) => [n, `${n}-${raw}`])) as Record<string, string>;
}

function GoldDefs({ id }: { id: Record<string, string> }) {
  return (
    <defs>
      <linearGradient id={id.gold} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={GOLD_HI} />
        <stop offset="55%" stopColor={GOLD} />
        <stop offset="100%" stopColor={GOLD_LO} />
      </linearGradient>
      <linearGradient id={id.teal} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={TEAL_HI} />
        <stop offset="100%" stopColor={TEAL} />
      </linearGradient>
    </defs>
  );
}

/** 12-point rosette with a numeral: the lesson-count emblems. Ring of small diamonds from 50 up. */
function Rosette({ label, core, ring }: { label: string; core: 'teal' | 'ink' | 'gold' | 'crimson'; ring: boolean }) {
  const id = useIds('gold', 'teal');
  const coreFill = core === 'teal' ? `url(#${id.teal})` : core === 'ink' ? INK : core === 'crimson' ? CRIMSON : `url(#${id.gold})`;
  const points = Array.from({ length: 24 }, (_, i) => {
    const r = i % 2 === 0 ? 36 : 29;
    const a = (Math.PI * 2 * i) / 24 - Math.PI / 2;
    return `${(48 + r * Math.cos(a)).toFixed(1)},${(48 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return (
    <>
      <GoldDefs id={id} />
      <circle className="emblem-glow" cx="48" cy="48" r="40" fill={GOLD} fillOpacity="0.18" />
      {ring && Array.from({ length: 16 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 16;
        const x = 48 + 43 * Math.cos(a), y = 48 + 43 * Math.sin(a);
        return <rect key={i} x={x - 2} y={y - 2} width="4" height="4" transform={`rotate(45 ${x} ${y})`} fill={GOLD_HI} />;
      })}
      <polygon points={points} fill={`url(#${id.gold})`} stroke={GOLD_LO} strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="48" cy="48" r="21" fill={coreFill} stroke={PAPER} strokeWidth="1.6" />
      <text x="48" y="49" textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize={label.length > 2 ? 15 : 18} fill={PAPER}>
        {label}
      </text>
    </>
  );
}

function FirstLesson() {
  const id = useIds('gold', 'teal');
  return (
    <>
      <GoldDefs id={id} />
      <circle className="emblem-glow" cx="48" cy="54" r="30" fill={GOLD} fillOpacity="0.22" />
      <path d="M48 8 V16" stroke={GOLD_LO} strokeWidth="2" strokeLinecap="round" />
      <path d="M38 22 C38 17 58 17 58 22 L62 28 H34 Z" fill={`url(#${id.gold})`} stroke={GOLD_LO} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M34 28 H62 L66 66 C66 72 30 72 30 66 Z" fill={`url(#${id.teal})`} stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M48 28 V70 M37 30 L35 68 M59 30 L61 68" stroke={GOLD_HI} strokeOpacity="0.55" strokeWidth="1" />
      <path className="emblem-flicker" d="M48 38 C53 45 54 51 48 58 C42 51 43 45 48 38 Z" fill={FLAME} stroke={GOLD_HI} strokeWidth="1" />
      <path d="M32 72 H64 L60 80 H36 Z" fill={`url(#${id.gold})`} stroke={GOLD_LO} strokeWidth="1.2" strokeLinejoin="round" />
    </>
  );
}

/** Four crescents in a row under one arch: four weeks on the same rhythm. */
function Rhythm4() {
  const id = useIds('gold', 'teal');
  return (
    <>
      <GoldDefs id={id} />
      <circle className="emblem-glow" cx="48" cy="50" r="34" fill={GOLD} fillOpacity="0.2" />
      <path d="M12 78 V44 C12 24 30 12 48 12 C66 12 84 24 84 44 V78" stroke={`url(#${id.gold})`} strokeWidth="3" strokeLinecap="round" />
      <path d="M8 80 H88" stroke={`url(#${id.gold})`} strokeWidth="3" strokeLinecap="round" />
      {[22, 38, 54, 70].map((x, i) => (
        <g key={x} transform={`translate(${x} ${56 - (i % 2) * 8})`}>
          <path d="M6 -9 A9 9 0 1 0 6 9 A7 7 0 1 1 6 -9 Z" fill={i === 3 ? GOLD_HI : `url(#${id.teal})`} stroke={GOLD_LO} strokeWidth="0.8" />
        </g>
      ))}
    </>
  );
}

/** A date palm with twelve fronds: three months of steady growth. */
function Rhythm12() {
  const id = useIds('gold', 'teal');
  return (
    <>
      <GoldDefs id={id} />
      <circle className="emblem-glow" cx="48" cy="40" r="32" fill={GOLD} fillOpacity="0.2" />
      <path d="M47 84 C45 66 46 50 48 34 C50 50 51 66 49 84 Z" fill={INK} stroke={GOLD_LO} strokeWidth="1" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = -170 + (i * 160) / 11;
        return (
          <path key={i} d="M48 34 C56 28 66 28 74 32 C66 33 56 34 48 34 Z" fill={i % 3 === 0 ? `url(#${id.gold})` : `url(#${id.teal})`} transform={`rotate(${a + 90} 48 34)`} />
        );
      })}
      <g fill={GOLD_HI} stroke={GOLD_LO} strokeWidth="0.6">
        <circle cx="42" cy="40" r="2.4" /><circle cx="46" cy="42" r="2.4" /><circle cx="51" cy="42" r="2.4" /><circle cx="55" cy="40" r="2.4" />
      </g>
      <path d="M30 84 H66" stroke={`url(#${id.gold})`} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

/** A wheel of 52 segments, all lit: a full year. */
function Rhythm52() {
  const id = useIds('gold', 'teal');
  return (
    <>
      <GoldDefs id={id} />
      <circle className="emblem-glow" cx="48" cy="48" r="42" fill={GOLD} fillOpacity="0.18" />
      {Array.from({ length: 52 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 52 - Math.PI / 2;
        const x1 = 48 + 30 * Math.cos(a), y1 = 48 + 30 * Math.sin(a);
        const x2 = 48 + 40 * Math.cos(a), y2 = 48 + 40 * Math.sin(a);
        return <line key={i} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke={i % 13 === 0 ? GOLD_HI : GOLD} strokeWidth="2.6" strokeLinecap="round" />;
      })}
      <circle cx="48" cy="48" r="25" fill={`url(#${id.teal})`} stroke={PAPER} strokeWidth="1.6" />
      <g fill={`url(#${id.gold})`}>
        <rect x="38" y="38" width="20" height="20" rx="2" />
        <rect x="38" y="38" width="20" height="20" rx="2" transform="rotate(45 48 48)" />
      </g>
      <circle cx="48" cy="48" r="4.5" fill={FLAME} />
    </>
  );
}

/** Open mushaf on a rehal with a crimson ribbon: a surah memorised. */
function Surah() {
  const id = useIds('gold', 'teal');
  return (
    <>
      <GoldDefs id={id} />
      <circle className="emblem-glow" cx="48" cy="44" r="32" fill={GOLD} fillOpacity="0.22" />
      <g stroke={`url(#${id.gold})`} strokeWidth="5" strokeLinecap="round">
        <path d="M30 84 L62 52" />
        <path d="M66 84 L34 52" />
      </g>
      <path d="M48 62 C40 56 27 54 14 56 V32 C27 30 40 32 48 38 C56 32 69 30 82 32 V56 C69 54 56 56 48 62 Z" fill={TEAL_DEEP} stroke={GOLD} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M48 59 C40 53 28 51 17 53 V30 C28 28 40 30 48 36 Z" fill={PAPER} />
      <path d="M48 59 C56 53 68 51 79 53 V30 C68 28 56 30 48 36 Z" fill={PAPER_SHADE} />
      <g stroke="#CDBB9C" strokeWidth="1"><path d="M23 37 C30 36 38 37 44 40 M23 43 C30 42 38 43 44 46 M52 40 C58 37 66 36 73 37 M52 46 C58 43 66 42 73 43" /></g>
      <path d="M48 36 V70 L44 66 M48 70 L52 66" stroke={CRIMSON} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path className="emblem-twinkle" d="M48 10 L49.8 15.2 L55 17 L49.8 18.8 L48 24 L46.2 18.8 L41 17 L46.2 15.2 Z" fill={GOLD_HI} />
    </>
  );
}

/** A closed mushaf with a gold spine and a geometric border: a full juz. */
function Juz() {
  const id = useIds('gold', 'teal');
  return (
    <>
      <GoldDefs id={id} />
      <circle className="emblem-glow" cx="48" cy="48" r="38" fill={GOLD} fillOpacity="0.2" />
      <rect x="22" y="14" width="54" height="68" rx="5" fill={CRIMSON} stroke={`url(#${id.gold})`} strokeWidth="2.4" />
      <rect x="22" y="14" width="10" height="68" rx="3" fill={`url(#${id.gold})`} />
      <rect x="38" y="22" width="32" height="52" rx="3" fill="none" stroke={GOLD} strokeWidth="1.4" strokeDasharray="3 2.5" />
      <g transform="translate(54 48)">
        <rect x="-10" y="-10" width="20" height="20" rx="2" fill={`url(#${id.gold})`} />
        <rect x="-10" y="-10" width="20" height="20" rx="2" fill={`url(#${id.gold})`} transform="rotate(45)" />
        <circle r="5.5" fill={`url(#${id.teal})`} stroke={PAPER} strokeWidth="1" />
      </g>
    </>
  );
}

/** The letter nūn with its dot and a madd mark in a tile: a tajweed rule mastered. */
function Tajweed() {
  const id = useIds('gold', 'teal');
  return (
    <>
      <GoldDefs id={id} />
      <circle className="emblem-glow" cx="48" cy="48" r="38" fill={GOLD} fillOpacity="0.2" />
      <rect x="16" y="16" width="64" height="64" rx="14" fill={`url(#${id.teal})`} stroke={`url(#${id.gold})`} strokeWidth="2.6" />
      <rect x="22" y="22" width="52" height="52" rx="10" fill="none" stroke={GOLD_HI} strokeOpacity="0.6" strokeWidth="1" />
      <path d="M30 46 C30 64 66 64 66 46" stroke={PAPER} strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="48" cy="40" r="4" fill={GOLD_HI} />
      <path d="M34 30 C40 26 46 32 52 28 C56 26 60 27 62 29" stroke={GOLD_HI} strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </>
  );
}

/** A mihrab arch with an open book inside: a level or a book completed. */
function Level() {
  const id = useIds('gold', 'teal');
  return (
    <>
      <GoldDefs id={id} />
      <path d="M20 86 V46 C20 27 34 16 48 12 C62 16 76 27 76 46 V86 Z" fill={TEAL_DEEP} stroke={`url(#${id.gold})`} strokeWidth="3" strokeLinejoin="round" />
      <circle className="emblem-glow" cx="48" cy="50" r="20" fill={GOLD} fillOpacity="0.35" />
      <path d="M48 66 C42 62 34 61 27 62 V46 C34 45 42 46 48 50 C54 46 62 45 69 46 V62 C62 61 54 62 48 66 Z" fill={PAPER} stroke={GOLD} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M48 50 V66" stroke={PAPER_SHADE} strokeWidth="1.4" />
      <g stroke={GOLD_HI} strokeWidth="1.6" strokeLinecap="round"><path d="M48 24 V36 M38 28 L42 38 M58 28 L54 38" /></g>
      <path d="M16 86 H80" stroke={`url(#${id.gold})`} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

/** The khatam star: a recognition the teacher wrote in their own words. */
function Teacher() {
  const id = useIds('gold', 'teal');
  return (
    <>
      <GoldDefs id={id} />
      <circle className="emblem-glow" cx="48" cy="48" r="36" fill={GOLD} fillOpacity="0.22" />
      <g fill={`url(#${id.gold})`} stroke={GOLD_LO} strokeWidth="1.2" strokeLinejoin="round">
        <rect x="24" y="24" width="48" height="48" rx="4" />
        <rect x="24" y="24" width="48" height="48" rx="4" transform="rotate(45 48 48)" />
      </g>
      <circle cx="48" cy="48" r="15" fill={`url(#${id.teal})`} stroke={PAPER} strokeWidth="1.5" />
      <path d="M48 40 L50.4 45.6 L56 48 L50.4 50.4 L48 56 L45.6 50.4 L40 48 L45.6 45.6 Z" fill={FLAME} />
    </>
  );
}

const DRAWINGS: Record<EmblemId, () => React.ReactElement> = {
  'first-lesson': FirstLesson,
  'lessons-10': () => <Rosette label="10" core="teal" ring={false} />,
  'lessons-25': () => <Rosette label="25" core="ink" ring={false} />,
  'lessons-50': () => <Rosette label="50" core="crimson" ring={true} />,
  'lessons-100': () => <Rosette label="100" core="teal" ring={true} />,
  'rhythm-4': Rhythm4,
  'rhythm-12': Rhythm12,
  'rhythm-52': Rhythm52,
  surah: Surah,
  juz: Juz,
  tajweed: Tajweed,
  level: Level,
  teacher: Teacher
};

export function AchievementEmblem({ id, earned = true, className = 'w-16 h-16' }: { id: EmblemId; earned?: boolean; className?: string }) {
  const Drawing = DRAWINGS[id] || Teacher;
  return (
    <svg viewBox="0 0 96 96" className={`${className} ${earned ? '' : 'emblem-locked'}`} aria-hidden="true" focusable="false" fill="none">
      <Drawing />
    </svg>
  );
}

export const EMBLEM_IDS = Object.keys(DRAWINGS) as EmblemId[];
