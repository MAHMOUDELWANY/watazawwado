import React from 'react';
import { motion } from 'motion/react';
import type { SceneId } from './types';

// Hand-made SVG scenes (RULES §6b: our own SVG over new assets). Illustrations keep literal brand hex so they look the
// same in light and dark mode (docs/design-system.md §1). Prophets and Sahabah are never drawn (PLAN §3.9).
const C = {
  ink: '#05363F',
  teal: '#087D91',
  paper: '#FAF7F2',
  warm: '#EFE7DC',
  gold: '#E5A93C',
  goldSoft: '#F6D58E',
  copper: '#8B4935',
  crimson: '#C51F24',
  skin: '#E8B48F',
  skin2: '#C98B62',
};

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/** Simple friendly child. Faces are allowed for our own characters (owner, 2026-10-16). */
function Kid({ x, y, scale = 1, shirt, hijab }: { x: number; y: number; scale?: number; shirt: string; hijab?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-18} y={22} width={36} height={44} rx={14} fill={shirt} />
      {hijab ? (
        <path d="M-23 8 a23 25 0 0 1 46 0 v18 q-23 12 -46 0 z" fill={hijab} />
      ) : (
        <path d="M-17 -2 q17 -20 34 0 v4 h-34 z" fill="#2B1B12" />
      )}
      <circle cx={0} cy={6} r={16} fill={C.skin} />
      <circle cx={-6} cy={5} r={1.8} fill="#2B1B12" />
      <circle cx={6} cy={5} r={1.8} fill="#2B1B12" />
      <path d="M-5 12 q5 5 10 0" stroke="#2B1B12" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Yusuf(p: { x: number; y: number; scale?: number }) {
  return <Kid {...p} shirt={C.teal} />;
}
function Maryam(p: { x: number; y: number; scale?: number }) {
  return <Kid {...p} shirt={C.crimson} hijab={C.gold} />;
}

function Mishmish({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={10} rx={20} ry={11} fill="#E08A3C" />
      <circle cx={14} cy={-2} r={10} fill="#E08A3C" />
      <path d="M8 -9 l3 -8 l4 7 z M16 -10 l5 -7 l2 8 z" fill="#E08A3C" />
      <circle cx={17} cy={-3} r={1.4} fill="#2B1B12" />
      <motion.path
        d="M-20 8 q-14 -4 -10 -20"
        stroke="#E08A3C"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        animate={{ rotate: [0, 8, 0] }}
        style={{ transformBox: 'fill-box', transformOrigin: 'right bottom' }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </g>
  );
}

/** The stranger, always from behind and without a face (lesson 1, owner-approved 2026-10-16). */
function Stranger({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-26 70 q0 -52 26 -56 q26 4 26 56 z" fill="#FFFFFF" stroke={C.warm} strokeWidth={2} />
      <circle cx={0} cy={0} r={16} fill="#141414" />
      <path d="M-16 4 q16 10 32 0" stroke="#141414" strokeWidth={8} />
    </g>
  );
}

function Masjid({ y = 210 }: { y?: number }) {
  return (
    <g fill={C.ink} opacity={0.92}>
      <rect x={150} y={y - 70} width={180} height={70} />
      <path d={`M190 ${y - 70} a50 50 0 0 1 100 0 z`} />
      <rect x={110} y={y - 120} width={16} height={120} />
      <path d={`M106 ${y - 120} l12 -22 l12 22 z`} />
      <rect x={354} y={y - 120} width={16} height={120} />
      <path d={`M350 ${y - 120} l12 -22 l12 22 z`} />
      <path d={`M226 ${y} v-38 a14 14 0 0 1 28 0 v38 z`} fill={C.goldSoft} opacity={0.85} />
    </g>
  );
}

function Palm({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill={C.ink} opacity={0.75}>
      <rect x={-3} y={-60} width={6} height={60} rx={3} />
      <path d="M0 -60 q-30 -6 -40 10 q20 -14 40 -10 M0 -60 q30 -6 40 10 q-20 -14 -40 -10 M0 -62 q-8 -26 -26 -30 q16 10 26 30 M0 -62 q8 -26 26 -30 q-16 10 -26 30" />
    </g>
  );
}

function Sky({ from, to }: { from: string; to: string }) {
  const id = `sky-${from.slice(1)}-${to.slice(1)}`;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect x={-400} y={-300} width={1280} height={900} fill={`url(#${id})`} />
    </>
  );
}

function Door({ x, label, color, delay }: { x: number; label: string; color: string; delay: number }) {
  return (
    <motion.g {...rise(delay)}>
      <path d={`M${x - 42} 250 v-110 a42 42 0 0 1 84 0 v110 z`} fill={color} />
      <path d={`M${x - 32} 250 v-104 a32 32 0 0 1 64 0 v104 z`} fill={C.paper} opacity={0.18} />
      <motion.path
        d={`M${x - 32} 250 v-104 a32 32 0 0 1 64 0 v104 z`}
        fill={C.goldSoft}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 1.1, delay: delay + 0.5 }}
      />
      <text x={x} y={276} textAnchor="middle" fontSize={17} fontWeight={700} fill={C.ink} fontFamily="inherit">
        {label}
      </text>
    </motion.g>
  );
}

function Chip({ x, y, text, delay }: { x: number; y: number; text: string; delay: number }) {
  return (
    <motion.g {...rise(delay)}>
      <rect x={x - 46} y={y - 16} width={92} height={32} rx={16} fill={C.paper} stroke={C.gold} strokeWidth={2} />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={600} fill={C.ink}>
        {text}
      </text>
    </motion.g>
  );
}

const SCENES: Record<SceneId, () => React.ReactElement> = {
  classroom: () => (
    <>
      <Sky from="#FFF6E8" to="#F3E6D3" />
      <rect x={70} y={40} width={340} height={130} rx={10} fill={C.ink} />
      <motion.text {...rise(0.3)} x={240} y={120} textAnchor="middle" fontSize={54} fontWeight={700} fill={C.paper}>
        7 + 5 = ?
      </motion.text>
      <rect x={-400} y={250} width={1280} height={350} fill="#E3D3BC" />
      <motion.g {...rise(0.6)}>
        <Yusuf x={190} y={196} />
        <Maryam x={290} y={200} scale={0.9} />
      </motion.g>
    </>
  ),
  jiddo: () => (
    <>
      <Sky from="#FFF3DE" to="#F1DFC4" />
      <rect x={300} y={110} width={140} height={120} rx={26} fill={C.copper} />
      <g transform="translate(370 120)">
        <rect x={-30} y={30} width={60} height={70} rx={22} fill="#F3EDE3" />
        <circle cx={0} cy={10} r={22} fill={C.skin2} />
        <path d="M-16 16 q16 26 32 0 q-4 22 -16 24 q-12 -2 -16 -24 z" fill="#F7F4EE" />
        <path d="M-20 -2 a20 16 0 0 1 40 0 z" fill="#FFFFFF" />
        <circle cx={-7} cy={8} r={1.8} fill="#2B1B12" />
        <circle cx={7} cy={8} r={1.8} fill="#2B1B12" />
      </g>
      <Mishmish x={360} y={222} />
      <motion.g {...rise(0.4)}>
        <Yusuf x={150} y={186} />
        <Maryam x={230} y={192} scale={0.9} />
      </motion.g>
      <rect x={-400} y={252} width={1280} height={348} fill="#E7D7BF" />
    </>
  ),
  madinah: () => (
    <>
      <Sky from="#F9D9A7" to="#FBEFDD" />
      <motion.circle cx={380} cy={90} r={34} fill={C.gold} opacity={0.8} initial={{ cy: 120 }} animate={{ cy: 90 }} transition={{ duration: 2 }} />
      <Masjid />
      <Palm x={70} y={220} />
      <Palm x={420} y={225} />
      <rect x={-400} y={210} width={1280} height={390} fill="#E9D2AE" />
      <motion.g initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.6, ease: 'easeOut' }}>
        <Stranger x={160} y={186} />
      </motion.g>
    </>
  ),
  sitting: () => (
    <>
      <Sky from="#1A4A52" to={C.ink} />
      <path d="M180 260 v-130 a60 60 0 0 1 120 0 v130 z" fill={C.goldSoft} opacity={0.22} />
      <motion.circle cx={240} cy={150} r={70} fill={C.goldSoft} opacity={0.18} initial={{ r: 66 }} animate={{ r: [66, 74, 66] }} transition={{ duration: 4, repeat: Infinity }} />
      <rect x={-400} y={250} width={1280} height={350} fill="#0E2A2F" />
      <Stranger x={240} y={190} scale={1.1} />
    </>
  ),
  islam: () => (
    <>
      <Sky from="#EAF4F4" to="#D6E9EA" />
      {['Shahadah', 'Salah', 'Zakah', 'Fasting', 'Hajj'].map((t, i) => (
        <Chip key={t} x={90 + i * 75} y={150 + (i % 2 ? 30 : -30)} text={t} delay={0.15 * i} />
      ))}
    </>
  ),
  iman: () => (
    <>
      <Sky from="#F6EFE4" to="#EADBC6" />
      <motion.g {...rise(0)}>
        <rect x={232} y={60} width={16} height={110} rx={6} fill={C.copper} />
        <circle cx={240} cy={60} r={52} fill={C.teal} opacity={0.9} />
        <circle cx={200} cy={80} r={34} fill={C.teal} opacity={0.75} />
        <circle cx={282} cy={82} r={34} fill={C.teal} opacity={0.75} />
      </motion.g>
      <rect x={-400} y={170} width={1280} height={430} fill="#8C6A4E" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.path
          key={i}
          d={`M240 170 q${(i - 2.5) * 30} 40 ${(i - 2.5) * 70} ${90 + (i % 2) * 20}`}
          stroke={C.goldSoft}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.3 + i * 0.15 }}
        />
      ))}
    </>
  ),
  ihsan: () => (
    <>
      <Sky from="#FFF8EC" to="#F7E7CC" />
      <rect x={140} y={60} width={200} height={150} rx={8} fill="#FFFFFF" stroke={C.warm} strokeWidth={3} />
      {[C.crimson, C.teal, C.gold, C.copper].map((col, i) => (
        <motion.path
          key={col}
          d={`M${170 + i * 10} ${180 - i * 25} q60 -50 ${120 - i * 10} 0`}
          stroke={col}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.3 + i * 0.4 }}
        />
      ))}
      <Maryam x={390} y={190} scale={0.9} />
    </>
  ),
  reveal: () => (
    <>
      <Sky from={C.ink} to="#0B1C1F" />
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.circle
          key={i}
          cx={30 + ((i * 67) % 430)}
          cy={30 + ((i * 41) % 160)}
          r={1.8}
          fill={C.goldSoft}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      <motion.circle cx={240} cy={150} r={10} fill={C.goldSoft} initial={{ r: 10, opacity: 0.9 }} animate={{ r: 140, opacity: 0 }} transition={{ duration: 2.4, repeat: Infinity }} />
      <motion.g initial={{ opacity: 1 }} animate={{ opacity: 0.25 }} transition={{ duration: 2.5, delay: 0.5 }}>
        <Stranger x={240} y={170} />
      </motion.g>
    </>
  ),
  doors: () => (
    <>
      <Sky from="#FBF4E9" to="#EFE2CF" />
      <Door x={120} label="Iman" color={C.teal} delay={0.1} />
      <Door x={240} label="Islam" color={C.crimson} delay={0.4} />
      <Door x={360} label="Ihsan" color={C.gold} delay={0.7} />
    </>
  ),
  backpack: () => (
    <>
      <Sky from="#FFF4E2" to="#F0DEC2" />
      <motion.g {...rise(0.2)}>
        <rect x={180} y={90} width={120} height={150} rx={30} fill={C.copper} />
        <rect x={198} y={150} width={84} height={64} rx={14} fill="#A55E46" />
        <path d="M205 90 q35 -40 70 0" stroke="#6E3626" strokeWidth={10} fill="none" />
        <circle cx={240} cy={182} r={6} fill={C.gold} />
      </motion.g>
      <motion.g initial={{ y: -80, opacity: 0, rotate: -12 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ duration: 0.9, delay: 0.8, type: 'spring' }}>
        <rect x={214} y={60} width={52} height={38} rx={4} fill={C.paper} stroke={C.gold} strokeWidth={2} />
        <path d="M222 92 v-16 a6 6 0 0 1 12 0 v16 M236 92 v-16 a6 6 0 0 1 12 0 v16 M250 92 v-16 a6 6 0 0 1 12 0 v16" stroke={C.teal} strokeWidth={2} fill="none" />
      </motion.g>
      <Yusuf x={100} y={196} />
      <Maryam x={380} y={200} scale={0.9} />
    </>
  ),
  lego: () => (
    <>
      <Sky from="#E8EEF4" to="#D9E2EA" />
      <rect x={-400} y={230} width={1280} height={370} fill="#C9B79C" />
      {[
        [190, 190, 100, 40, C.crimson],
        [190, 150, 30, 40, C.gold],
        [260, 150, 30, 40, C.gold],
        [220, 170, 40, 20, C.teal],
        [180, 110, 40, 40, C.teal],
        [260, 110, 40, 40, C.teal],
      ].map(([x, y, w, h, col], i) => (
        <motion.rect
          key={i}
          x={x as number}
          y={y as number}
          width={w as number}
          height={h as number}
          rx={3}
          fill={col as string}
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: y as number, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 + i * 0.25, type: 'spring' }}
        />
      ))}
      <motion.path d="M200 110 v-26 l20 8 l-20 8" fill={C.crimson} stroke={C.ink} strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} />
      <Maryam x={380} y={196} scale={0.9} />
      <motion.text x={420} y={130} fontSize={36} fontWeight={800} fill={C.ink} animate={{ y: [130, 122, 130] }} transition={{ duration: 1.6, repeat: Infinity }}>
        ?
      </motion.text>
    </>
  ),
};

export function Scene({ id, label }: { id: SceneId; label: string }) {
  const Draw = SCENES[id];
  return (
    <svg viewBox="0 0 480 300" role="img" aria-label={label} className="w-full h-full block" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
      <Draw />
    </svg>
  );
}
