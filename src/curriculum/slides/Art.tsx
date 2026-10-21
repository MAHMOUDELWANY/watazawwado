import React from 'react';
import { motion } from 'motion/react';
import type { SceneId } from '../types';

// Scene art for the slide system v2. Own SVG (RULES §6b). Literal brand hex so art looks the same in light and dark
// (docs/design-system.md §1). Prophets and companions are never drawn (PLAN §3.9). Canvas: 640 × 560.
/** URL of a curriculum file: paths starting with a subject folder ('zad-teens/l01/doors.webp') are used as they are;
 *  bare paths are Kids files ('l02/sky.webp' → zad-kids). */
export const asset = (path: string) => `/curriculum/${path.startsWith('zad-') ? path : `zad-kids/${path}`}`;

export const P = {
  ink: '#1E1410',
  inkSoft: '#453D34',
  deep: '#05363F',
  teal: '#087D91',
  tealSoft: '#BFE3E6',
  paper: '#FAF7F2',
  card: '#FFFDF7',
  sand: '#EED9B4',
  sandDeep: '#D9B984',
  gold: '#E5A93C',
  goldSoft: '#F6D58E',
  copper: '#8B4935',
  copperSoft: '#C98B62',
  crimson: '#C51F24',
  skin: '#F0C29E',
  skinShade: '#DDA27C',
  hair: '#2B1B12',
  night: '#08262C',
};

const ease = [0.22, 1, 0.36, 1] as const;
const appear = (delay = 0, y = 18) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease },
});

function Defs() {
  return (
    <defs>
      <linearGradient id="g-dawn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F7C98B" />
        <stop offset="0.55" stopColor="#FBE5C2" />
        <stop offset="1" stopColor="#FCF1DC" />
      </linearGradient>
      <linearGradient id="g-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#06222A" />
        <stop offset="1" stopColor="#0E3B44" />
      </linearGradient>
      <linearGradient id="g-room" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFF4E0" />
        <stop offset="1" stopColor="#F4E2C4" />
      </linearGradient>
      <linearGradient id="g-sand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F0DDBA" />
        <stop offset="1" stopColor="#E3C590" />
      </linearGradient>
      <linearGradient id="g-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E3C796" />
        <stop offset="1" stopColor="#CDA86E" />
      </linearGradient>
      <radialGradient id="g-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFF3C9" stopOpacity="0.95" />
        <stop offset="1" stopColor="#FFF3C9" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="g-board" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#174A52" />
        <stop offset="1" stopColor="#0C343B" />
      </linearGradient>
      <filter id="f-soft" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#5B3A1E" floodOpacity="0.18" />
      </filter>
      <filter id="f-chalk">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
      </filter>
    </defs>
  );
}

/* ---------- characters (busts). Faces allowed for our own characters (owner, 2026-10-16). ---------- */

function Eyes({ y = 0, look = 0 }: { y?: number; look?: number }) {
  return (
    <g>
      {[-15, 15].map((x) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <ellipse rx={5.2} ry={6.2} fill={P.hair} />
          <circle cx={1.6 + look} cy={-2} r={1.8} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

export function Yusuf({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#f-soft)">
      <path d="M-70 150 q0 -70 70 -74 q70 4 70 74 z" fill={P.teal} />
      <path d="M-22 80 q22 22 44 0 l-6 -12 h-32 z" fill="#0A6475" />
      <rect x={-13} y={50} width={26} height={30} rx={10} fill={P.skinShade} />
      <ellipse cx={-47} cy={10} rx={9} ry={12} fill={P.skin} />
      <ellipse cx={47} cy={10} rx={9} ry={12} fill={P.skin} />
      <ellipse cx={0} cy={6} rx={46} ry={50} fill={P.skin} />
      <path d="M-47 -6 q-2 -52 47 -54 q52 2 48 52 q-10 -26 -34 -30 q-30 12 -61 32 z" fill={P.hair} />
      <Eyes y={8} />
      <path d="M-24 -8 q9 -6 18 0 M6 -8 q9 -6 18 0" stroke={P.hair} strokeWidth={3.4} fill="none" strokeLinecap="round" />
      <ellipse cx={-26} cy={26} rx={8} ry={5} fill="#F2A08A" opacity={0.55} />
      <ellipse cx={26} cy={26} rx={8} ry={5} fill="#F2A08A" opacity={0.55} />
      <path d="M-11 30 q11 10 22 0" stroke={P.hair} strokeWidth={3.4} fill="none" strokeLinecap="round" />
    </g>
  );
}

export function Maryam({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#f-soft)">
      <path d="M-66 150 q0 -66 66 -70 q66 4 66 70 z" fill={P.crimson} />
      <path d="M-60 40 q-10 -110 60 -112 q70 2 60 112 q-14 50 -60 52 q-46 -2 -60 -52 z" fill={P.gold} />
      <path d="M-52 30 q-4 -86 52 -88 q56 2 52 88 q-8 40 -52 42 q-44 -2 -52 -42 z" fill="#F0BC55" />
      <ellipse cx={0} cy={6} rx={40} ry={45} fill={P.skin} />
      <path d="M-42 -12 q4 -40 42 -42 q38 2 42 42 q-20 -18 -42 -18 q-22 0 -42 18 z" fill={P.gold} />
      <Eyes y={8} look={0.6} />
      <path d="M-22 -6 q8 -5 16 0 M6 -6 q8 -5 16 0" stroke={P.hair} strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse cx={-23} cy={25} rx={7} ry={4.5} fill="#F2A08A" opacity={0.6} />
      <ellipse cx={23} cy={25} rx={7} ry={4.5} fill="#F2A08A" opacity={0.6} />
      <path d="M-10 28 q10 9 20 0" stroke={P.hair} strokeWidth={3.2} fill="none" strokeLinecap="round" />
    </g>
  );
}

export function Jiddo({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#f-soft)">
      <path d="M-78 160 q0 -78 78 -82 q78 4 78 82 z" fill="#F3EDE3" />
      <path d="M-78 160 q0 -78 78 -82 q-28 30 -30 82 z" fill="#E6DCCB" />
      <ellipse cx={-48} cy={12} rx={9} ry={12} fill={P.copperSoft} />
      <ellipse cx={48} cy={12} rx={9} ry={12} fill={P.copperSoft} />
      <ellipse cx={0} cy={8} rx={46} ry={50} fill={P.copperSoft} />
      <path d="M-40 24 q40 90 80 0 q2 52 -40 66 q-42 -14 -40 -66 z" fill="#F7F4EE" />
      <path d="M-18 26 q18 -8 36 0" stroke="#F7F4EE" strokeWidth={9} strokeLinecap="round" />
      <path d="M-48 -14 a48 30 0 0 1 96 0 z" fill="#FFFFFF" />
      <path d="M-48 -14 h96" stroke="#E2D7C3" strokeWidth={3} />
      <g transform="translate(0 6)">
        {[-16, 16].map((cx) => <path key={cx} d={`M${cx - 6} 0 q6 5 12 0`} stroke={P.hair} strokeWidth={3.4} fill="none" strokeLinecap="round" />)}
      </g>
      <path d="M-26 -4 q10 -5 20 0 M6 -4 q10 -5 20 0" stroke="#F7F4EE" strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Mishmish({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={14} rx={34} ry={18} fill="#E89048" />
      <circle cx={26} cy={-6} r={17} fill="#E89048" />
      <path d="M15 -18 l4 -14 l9 11 z M30 -20 l9 -12 l3 14 z" fill="#E89048" />
      <path d="M22 -6 q3 3 6 0 M32 -6 q3 3 6 0" stroke={P.hair} strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M-14 6 q6 -6 12 0 M-2 4 q6 -6 12 0" stroke="#C96F2C" strokeWidth={3} fill="none" strokeLinecap="round" />
      <motion.path
        d="M-32 14 q-26 -6 -18 -34"
        stroke="#E89048"
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
        animate={{ rotate: [0, 10, 0] }}
        style={{ transformBox: 'fill-box', transformOrigin: 'right bottom' }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </g>
  );
}

/** The stranger, always from behind and without a face (lesson 1, owner-approved 2026-10-16). */
function Stranger({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={206} rx={70} ry={10} fill="#000" opacity={0.08} />
      <path d="M-58 200 q-6 -120 58 -132 q64 12 58 132 z" fill="#FFFFFF" />
      <path d="M-58 200 q-6 -120 58 -132 q-30 40 -26 132 z" fill="#EFEAE0" />
      <path d="M-20 70 q20 14 40 0" stroke="#E5DED0" strokeWidth={4} fill="none" />
      <circle cx={0} cy={34} r={34} fill={P.hair} />
      <path d="M-30 46 q30 22 60 0" stroke={P.hair} strokeWidth={16} strokeLinecap="round" />
    </g>
  );
}

/** The simple masjid of Madinah: palm-trunk pillars and a palm-leaf roof. */
function OldMasjid() {
  return (
    <g>
      <rect x={70} y={250} width={500} height={160} fill="url(#g-wall)" />
      <path d="M60 252 h520 l-14 -26 h-492 z" fill="#8E6A3C" />
      {Array.from({ length: 26 }).map((_, i) => (
        <path key={i} d={`M${76 + i * 19} 228 q8 -10 18 0`} stroke="#6F8F4E" strokeWidth={5} fill="none" strokeLinecap="round" />
      ))}
      {[120, 210, 300, 390, 480].map((x) => (
        <g key={x}>
          <rect x={x} y={252} width={18} height={158} fill="#8B6239" />
          {[270, 300, 330, 360, 390].map((yy) => <path key={yy} d={`M${x} ${yy} h18`} stroke="#734F2C" strokeWidth={2} />)}
        </g>
      ))}
      <rect x={70} y={404} width={500} height={10} fill="#B48A55" />
    </g>
  );
}

function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-6 0 q-4 -90 10 -170 l8 2 q-12 80 -6 168 z" fill="#8B6239" />
      {[[-80, -20], [-60, -60], [70, -24], [52, -64], [-20, -82], [20, -80]].map(([dx, dy], i) => (
        <path key={i} d={`M6 -170 q${dx / 2} ${dy - 10} ${dx} ${dy + 40}`} stroke="#4F7A43" strokeWidth={12} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}

function Dunes() {
  return (
    <g>
      <path d="M0 420 q160 -50 320 -10 q170 40 320 -20 v170 h-640 z" fill="url(#g-sand)" />
      <path d="M0 470 q200 -40 400 0 q140 26 240 0 v90 h-640 z" fill={P.sandDeep} opacity={0.5} />
    </g>
  );
}

/* ---------- scenes ---------- */

/** SVG fallbacks for Lesson 1 scenes without a painting; later lessons are painted (or drawn in code) only. */
const SCENES: Partial<Record<SceneId, () => React.ReactElement>> = {
  doorsHero: () => (
    <>
      <rect width={640} height={560} fill="url(#g-dawn)" />
      <motion.circle cx={320} cy={250} r={230} fill="url(#g-glow)" initial={{ r: 220 }} animate={{ r: [220, 240, 220] }} transition={{ duration: 6, repeat: Infinity }} />
      <Dunes />
      {[{ x: 160, c: P.teal, l: 'Iman' }, { x: 320, c: P.crimson, l: 'Islam' }, { x: 480, c: P.gold, l: 'Ihsan' }].map((d, i) => (
        <motion.g key={d.l} {...appear(0.2 + i * 0.2)}>
          <path d={`M${d.x - 62} 440 v-150 a62 62 0 0 1 124 0 v150 z`} fill={d.c} filter="url(#f-soft)" />
          <path d={`M${d.x - 46} 440 v-140 a46 46 0 0 1 92 0 v140 z`} fill="#FFF6DD" opacity={0.25} />
          <motion.path
            d={`M${d.x - 46} 440 v-140 a46 46 0 0 1 92 0 v140 z`}
            fill="#FFF3C9"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0.45] }}
            transition={{ duration: 2.2, delay: 1 + i * 0.3 }}
          />
          <text x={d.x} y={480} textAnchor="middle" fontSize={26} fontWeight={800} fill={P.ink}>{d.l}</text>
        </motion.g>
      ))}
    </>
  ),
  chalkboard: () => (
    <>
      <rect width={640} height={560} fill="url(#g-room)" />
      <rect x={40} y={40} width={560} height={300} rx={18} fill="#8B6239" />
      <rect x={56} y={56} width={528} height={268} rx={10} fill="url(#g-board)" />
      <motion.text
        x={320}
        y={215}
        textAnchor="middle"
        fontSize={110}
        fontWeight={700}
        fill="#F4F1E6"
        filter="url(#f-chalk)"
        stroke="#F4F1E6"
        strokeWidth={2}
        strokeDasharray="900"
        initial={{ strokeDashoffset: 900, fillOpacity: 0 }}
        animate={{ strokeDashoffset: 0, fillOpacity: 1 }}
        transition={{ strokeDashoffset: { duration: 1.8, ease: 'easeInOut' }, fillOpacity: { duration: 0.6, delay: 1.5 } }}
      >
        7 + 5 = ?
      </motion.text>
      <rect x={60} y={326} width={140} height={12} rx={4} fill="#E9E1CF" />
      <rect x={0} y={420} width={640} height={140} fill="#E6CFA6" />
      <Yusuf x={210} y={400} s={0.85} />
      <Maryam x={430} y={408} s={0.8} />
      <motion.g animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 1.2, delay: 1.6 }}>
        <path d="M268 300 h120 a14 14 0 0 1 14 14 v34 a14 14 0 0 1 -14 14 h-80 l-22 18 v-18 h-18 a14 14 0 0 1 -14 -14 v-34 a14 14 0 0 1 14 -14 z" fill="#fff" filter="url(#f-soft)" />
        <text x={328} y={344} textAnchor="middle" fontSize={30} fontWeight={800} fill={P.ink}>?!</text>
      </motion.g>
    </>
  ),
  jiddo: () => (
    <>
      <rect width={640} height={560} fill="url(#g-room)" />
      <rect x={410} y={60} width={170} height={190} rx={12} fill="#F7E8CC" stroke="#E2CDA6" strokeWidth={6} />
      <path d="M495 70 v170 M420 155 h150" stroke="#E2CDA6" strokeWidth={5} />
      <rect x={250} y={250} width={300} height={220} rx={60} fill={P.copper} filter="url(#f-soft)" />
      <rect x={270} y={360} width={260} height={110} rx={40} fill="#A1593F" />
      <Jiddo x={400} y={262} s={1} />
      <Mishmish x={405} y={430} />
      <rect x={0} y={470} width={640} height={90} fill="#E4CDA3" />
      <Yusuf x={130} y={395} s={0.78} />
      <Maryam x={150} y={470} s={0.6} />
      <g transform="translate(560 430)">
        <rect x={-26} y={-30} width={52} height={40} rx={8} fill="#fff" />
        <path d="M26 -20 q16 0 16 12 q0 12 -16 12" stroke="#fff" strokeWidth={6} fill="none" />
        {[0, 1, 2].map((i) => (
          <motion.path key={i} d={`M${-12 + i * 12} -40 q-6 -12 0 -24`} stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" animate={{ opacity: [0, 0.8, 0], y: [0, -10, -16] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }} />
        ))}
      </g>
    </>
  ),
  madinah: () => (
    <>
      <rect width={640} height={560} fill="url(#g-dawn)" />
      <motion.circle cx={500} cy={130} r={52} fill={P.gold} opacity={0.85} initial={{ cy: 170 }} animate={{ cy: 130 }} transition={{ duration: 3, ease }} />
      <motion.circle cx={500} cy={130} r={120} fill="url(#g-glow)" initial={{ cy: 170 }} animate={{ cy: 130 }} transition={{ duration: 3, ease }} />
      <Palm x={46} y={430} s={1.1} />
      <Palm x={600} y={430} s={0.95} />
      <OldMasjid />
      <Dunes />
      <motion.g initial={{ x: -240, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 2.4, delay: 0.6, ease }}>
        <Stranger x={250} y={290} s={0.62} />
      </motion.g>
    </>
  ),
  stranger: () => (
    <>
      <rect width={640} height={560} fill="url(#g-dawn)" />
      <Dunes />
      <Stranger x={320} y={150} s={1.15} />
      <motion.g {...appear(0.6)}>
        <circle cx={430} cy={250} r={56} fill="none" stroke={P.crimson} strokeWidth={5} strokeDasharray="10 8" />
        <path d="M478 214 l40 -50" stroke={P.crimson} strokeWidth={3} />
        <text x={600} y={150} textAnchor="end" fontSize={30} fontWeight={800} fill={P.crimson}>no dust?</text>
      </motion.g>
      <motion.g {...appear(1.2)}>
        <path d="M200 420 q20 -18 40 0" stroke={P.sandDeep} strokeWidth={6} fill="none" opacity={0.7} />
        <text x={50} y={110} fontSize={30} fontWeight={800} fill={P.crimson}>who is he?</text>
        <path d="M150 120 l90 60" stroke={P.crimson} strokeWidth={3} />
      </motion.g>
    </>
  ),
  sitting: () => (
    <>
      <rect width={640} height={560} fill="url(#g-night)" />
      <motion.ellipse cx={320} cy={210} rx={220} ry={190} fill="url(#g-glow)" opacity={0.35} animate={{ opacity: [0.28, 0.4, 0.28] }} transition={{ duration: 5, repeat: Infinity }} />
      <path d="M220 470 v-220 a100 100 0 0 1 200 0 v220 z" fill="#F6D58E" opacity={0.12} />
      <rect x={0} y={470} width={640} height={90} fill="#0B2E35" />
      <Stranger x={320} y={250} s={1.05} />
      <motion.g {...appear(0.8)}>
        <path d="M120 520 h400" stroke={P.goldSoft} strokeWidth={3} strokeDasharray="4 10" />
        <text x={320} y={545} textAnchor="middle" fontSize={22} fontWeight={700} fill={P.goldSoft}>knee to knee · full attention</text>
      </motion.g>
    </>
  ),
  pillars: () => (
    <>
      <rect width={640} height={560} fill="#FFF8EA" />
      <motion.path {...appear(0)} d="M90 180 l230 -110 l230 110 z" fill={P.ink} />
      <rect x={90} y={180} width={460} height={26} fill={P.inkSoft} />
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.g key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, delay: 0.3 + i * 0.25, ease }} style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}>
          <rect x={112 + i * 88} y={206} width={52} height={240} rx={6} fill={[P.teal, P.crimson, P.gold, P.copper, P.inkSoft][i]} />
          <rect x={104 + i * 88} y={440} width={68} height={16} rx={4} fill="#D9C6A3" />
        </motion.g>
      ))}
      <rect x={70} y={456} width={500} height={30} rx={8} fill="#CBB48A" />
    </>
  ),
  roots: () => (
    <>
      <rect width={640} height={560} fill="#FFF8EA" />
      <rect x={0} y={300} width={640} height={260} fill="#8C6A4E" />
      <rect x={0} y={300} width={640} height={14} fill="#6E8F4A" />
      <motion.g {...appear(0)}>
        <path d="M306 300 q-6 -90 6 -150 h16 q12 60 6 150 z" fill={P.copper} />
        <circle cx={320} cy={110} r={92} fill="#3F7B5C" />
        <circle cx={248} cy={160} r={60} fill="#4E8C68" />
        <circle cx={392} cy={160} r={60} fill="#4E8C68" />
        <circle cx={320} cy={70} r={50} fill="#5DA077" />
      </motion.g>
      {[-150, -90, -30, 30, 90, 150].map((dx, i) => (
        <motion.path
          key={dx}
          d={`M320 306 q${dx * 0.4} 60 ${dx} ${120 + (i % 2) * 40}`}
          stroke={P.goldSoft}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.4 + i * 0.18, ease }}
        />
      ))}
    </>
  ),
  drawing: () => (
    <>
      <rect width={640} height={560} fill="url(#g-room)" />
      <g transform="rotate(-3 300 240)" filter="url(#f-soft)">
        <rect x={120} y={70} width={360} height={330} rx={10} fill="#fff" />
        {[P.crimson, P.teal, P.gold, P.copper].map((c, i) => (
          <motion.path
            key={c}
            d={`M${160 + i * 8} ${330 - i * 50} q${90 - i * 6} -${70 + i * 6} ${200 - i * 16} 0`}
            stroke={c}
            strokeWidth={14}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, delay: 0.3 + i * 0.5, ease }}
          />
        ))}
        <motion.text x={300} y={380} textAnchor="middle" fontSize={26} fontWeight={800} fill={P.ink} {...appear(2.4, 6)}>for Mum ♥</motion.text>
      </g>
      <Maryam x={520} y={430} s={0.78} />
    </>
  ),
  reveal: () => (
    <>
      <rect width={640} height={560} fill="url(#g-night)" />
      {Array.from({ length: 22 }).map((_, i) => (
        <motion.circle key={i} cx={20 + ((i * 97) % 600)} cy={20 + ((i * 53) % 330)} r={i % 3 ? 1.6 : 2.6} fill={P.goldSoft} animate={{ opacity: [0.15, 1, 0.15] }} transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.17 }} />
      ))}
      <motion.circle cx={320} cy={250} r={20} fill={P.goldSoft} initial={{ r: 20, opacity: 0.9 }} animate={{ r: 300, opacity: 0 }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.g initial={{ opacity: 1 }} animate={{ opacity: 0.12 }} transition={{ duration: 3, delay: 0.6 }}>
        <Stranger x={320} y={170} s={1} />
      </motion.g>
    </>
  ),
  doors: () => (
    <>
      <rect width={640} height={560} fill="#FFF8EA" />
      {[{ x: 130, c: P.teal }, { x: 320, c: P.crimson }, { x: 510, c: P.gold }].map((d, i) => (
        <motion.g key={d.x} {...appear(0.15 + i * 0.25)}>
          <path d={`M${d.x - 78} 470 v-200 a78 78 0 0 1 156 0 v200 z`} fill={d.c} filter="url(#f-soft)" />
          <motion.path
            d={`M${d.x - 60} 470 v-190 a60 60 0 0 1 120 0 v190 z`}
            fill="#FFF3C9"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 1.2, delay: 0.8 + i * 0.3 }}
          />
        </motion.g>
      ))}
      <rect x={20} y={470} width={600} height={20} rx={6} fill="#D9C6A3" />
    </>
  ),
  backpack: () => (
    <>
      <rect width={640} height={560} fill="url(#g-room)" />
      <motion.g {...appear(0.1)} filter="url(#f-soft)">
        <path d="M250 150 q70 -90 140 0" stroke="#6E3626" strokeWidth={18} fill="none" strokeLinecap="round" />
        <rect x={210} y={140} width={220} height={290} rx={60} fill={P.copper} />
        <rect x={240} y={270} width={160} height={130} rx={30} fill="#A1593F" />
        <rect x={240} y={262} width={160} height={30} rx={14} fill="#7C3F2C" />
        <circle cx={320} cy={300} r={10} fill={P.gold} />
      </motion.g>
      <motion.g initial={{ y: -140, opacity: 0, rotate: -14 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ duration: 1, delay: 0.9, type: 'spring', bounce: 0.35 }}>
        <rect x={262} y={120} width={116} height={82} rx={8} fill={P.card} stroke={P.gold} strokeWidth={4} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${280 + i * 30} 192 v-38 a12 12 0 0 1 24 0 v38`} fill={[P.teal, P.crimson, P.gold][i]} />
        ))}
      </motion.g>
      <Yusuf x={100} y={420} s={0.7} />
      <Maryam x={540} y={430} s={0.66} />
    </>
  ),
  lego: () => (
    <>
      <rect width={640} height={560} fill="#E9EEF2" />
      <rect x={0} y={400} width={640} height={160} fill="#CDB896" />
      {[
        [210, 330, 220, 70, P.crimson],
        [210, 260, 60, 70, P.gold],
        [370, 260, 60, 70, P.gold],
        [290, 290, 60, 40, P.teal],
        [200, 190, 80, 70, P.teal],
        [360, 190, 80, 70, P.teal],
        [300, 200, 40, 90, P.copper],
      ].map(([x, y, w, h, c], i) => (
        <motion.g key={i} initial={{ y: -260, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 + i * 0.28, type: 'spring', bounce: 0.3 }}>
          <rect x={x as number} y={y as number} width={w as number} height={h as number} rx={4} fill={c as string} />
          {Array.from({ length: Math.floor((w as number) / 20) }).map((_, k) => (
            <rect key={k} x={(x as number) + 5 + k * 20} y={(y as number) - 8} width={12} height={8} rx={2} fill={c as string} />
          ))}
        </motion.g>
      ))}
      <motion.path d="M320 200 v-60 l44 16 l-44 16" fill={P.crimson} stroke={P.ink} strokeWidth={3} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }} />
      <Maryam x={540} y={420} s={0.7} />
      <motion.text x={560} y={250} fontSize={70} fontWeight={900} fill={P.ink} animate={{ y: [250, 236, 250] }} transition={{ duration: 1.6, repeat: Infinity }}>?</motion.text>
    </>
  ),
};

export function SceneArt({ id, label }: { id: SceneId; label: string }) {
  const Draw = SCENES[id];
  if (!Draw) return null; // painted-only scene whose painting has not arrived yet
  return (
    <svg viewBox="0 0 640 560" role="img" aria-label={label} className="block w-full h-full" preserveAspectRatio="xMidYMid slice">
      <Defs />
      <Draw />
    </svg>
  );
}
