import React from 'react';
import { motion, animate, useMotionValue, useTransform } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useCue } from '../sfx';
import { asset } from '../Art';
import { bezier, useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Cut, Draw } from './kit';
import { WriteLetter, LETTERS } from './letters';
import { Hear } from '../Say';

/**
 * Literacy A · Kids · Lesson 1 · Welcome to Arabic. The Letter Train (docs/curriculum/literacy/PLAN.md): a train that
 * faces left, because Arabic goes right to left, crossing six lands to Reading Town. Our neutral literacy cast (Rami,
 * Dalia, Hibr the owl) on the Kids paper stage. The owner approved the look on the cover, the journey and right-to-left
 * (2026-10-26); every page follows it.
 */

const CAST = 'literacy-a-kids/characters';
const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };
const WOOD = '#8B5A3C';

/* ---------- the train (faces left) ---------- */

/** The Letter Train with its nose at (x, y on the rails). Carriages carry letters once they are earned. */
function Train({ x, y, s = 1, cars = 2, letters = [], smoke = true, only }: { x: number; y: number; s?: number; cars?: number; letters?: string[]; smoke?: boolean; only?: number }) {
  const reduce = useReduce();
  const wheel = (cx: number, k: string) => (
    <g key={k}>
      <circle cx={cx} cy={-18} r={18} fill={INK_TEXT} />
      <circle cx={cx} cy={-18} r={7} fill={GOLD} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {Array.from({ length: cars }, (_, i) => {
        if (only !== undefined && i !== only) return null;
        const left = 200 + i * 172;
        const ch = letters[i];
        return (
          <g key={i}>
            <rect x={left - 22} y={-44} width={24} height={8} rx={4} fill={INK_TEXT} />
            <rect x={left} y={-128} width={152} height={94} rx={18} fill={i % 2 ? GOLD : TEAL} />
            <rect x={left - 4} y={-136} width={160} height={14} rx={7} fill={INK_TEXT} opacity={0.85} />
            <rect x={left + 26} y={-110} width={100} height={52} rx={12} fill="#FFF8E8" />
            {ch && <text x={left + 76} y={-66} textAnchor="middle" fontSize={50} fill={CRIMSON} style={AR}>{ch}</text>}
            {wheel(left + 36, 'a')}{wheel(left + 116, 'b')}
          </g>
        );
      })}
      {/* engine: nose on the left, cab on the right */}
      {only === undefined && <>
      <path d="M 12 -34 L -16 -16 L 12 -16 Z" fill={GOLD} />
      <rect x={10} y={-96} width={128} height={62} rx={28} fill={CRIMSON} />
      <rect x={118} y={-146} width={74} height={112} rx={14} fill={CRIMSON} />
      <rect x={110} y={-154} width={90} height={14} rx={7} fill={INK_TEXT} />
      <rect x={132} y={-132} width={46} height={36} rx={9} fill="#FFF3D6" />
      <rect x={36} y={-132} width={24} height={40} rx={6} fill={INK_TEXT} />
      <rect x={28} y={-140} width={40} height={12} rx={6} fill={GOLD} />
      <circle cx={10} cy={-66} r={10} fill="#FFE7A8" />
      {wheel(44, 'e1')}{wheel(102, 'e2')}{wheel(160, 'e3')}
      </>}
      {only === undefined && smoke && !reduce && [0, 1, 2].map((i) => (
        <motion.circle key={i} cx={48} cy={-150} r={14} fill="#FFFFFF" opacity={0.8}
          animate={{ y: [0, -70], x: [0, 30], scale: [0.6, 1.6], opacity: [0.8, 0] }} transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }} />
      ))}
    </g>
  );
}

/** Two rails and wooden ties from x0 to x1 at height y. */
function Track({ x0, x1, y, delay = 0 }: { x0: number; x1: number; y: number; delay?: number }) {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay }}>
      {Array.from({ length: Math.floor((x1 - x0) / 44) }, (_, i) => (
        <rect key={i} x={x0 + 10 + i * 44} y={y - 4} width={14} height={20} rx={3} fill={WOOD} opacity={0.55} />
      ))}
      <rect x={x0} y={y} width={x1 - x0} height={5} rx={2.5} fill="#6B4A36" />
      <rect x={x0} y={y + 10} width={x1 - x0} height={5} rx={2.5} fill="#6B4A36" />
    </motion.g>
  );
}

/* ---------- 0 · cover: the platform, the train, the cast, Hibr's card gets its first letter ---------- */

const HIBR_H = 360;

/** Hibr flies in with his blank card; alif writes itself on it (today's first letter). */
function HibrWithCard({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  const reduce = useReduce();
  const w = HIBR_H * 0.667;
  // the card in hibr-fly.webp: centre at 48.6% × 67.5% of the picture, turned about 17°
  const cx = w * 0.486, cy = HIBR_H * 0.675;
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x - w / 2, top: y - HIBR_H, width: w, height: HIBR_H }}
      initial={reduce ? false : { x: 420, y: -260, rotate: 18, opacity: 0 }} animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.25, duration: 1.6, delay }}>
      <motion.div className="absolute inset-0" animate={reduce ? {} : { y: [0, -10, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: delay + 1.6 }}>
        <img src={asset(`${CAST}/hibr-fly.webp`)} alt="" draggable={false} className="h-full w-full object-contain" style={{ filter: 'drop-shadow(0 18px 18px rgba(60,30,10,0.18))' }} />
        <svg className="absolute overflow-visible" style={{ left: cx - 40, top: cy - 40, width: 80, height: 80 }} viewBox="0 0 80 80">
          <g transform="rotate(17 40 40)">
            <WriteLetter ch="ا" x={40} y={52} size={80} width={30} color={CRIMSON} delay={delay + 1.8} />
          </g>
        </svg>
      </motion.div>
    </motion.div>
  );
}

export function LawCoverGraphic(_: GraphicProps) {
  useCue('whoosh', 1, 0.4);
  return (
    <>
      <Svg>
        <motion.rect x={860} y={796} width={760} height={26} rx={10} fill="#E9D3AE" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
        <Track x0={860} x1={1620} y={770} />
        <motion.g initial={{ x: 500, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.6, ease }}>
          <Train x={900} y={770} s={0.72} cars={2} />
        </motion.g>
      </Svg>
      <HibrWithCard x={1090} y={600} delay={0.9} />
      <Cut src={`${CAST}/dalia-wave`} x={1290} y={812} h={330} delay={1.2} />
      <Cut src={`${CAST}/rami-point`} x={1470} y={812} h={350} flip delay={1.4} />
    </>
  );
}

/* ---------- 1 · the journey: six lands, 32 stations, Reading Town ---------- */

// The road runs right to left, like Arabic: station 1 at the bottom right, Reading Town at the top left.
const SEGS: number[][][] = [
  [[1370, 760], [1180, 790], [1000, 770], [880, 680]],
  [[880, 680], [740, 580], [1090, 570], [1290, 510]],
  [[1290, 510], [1520, 440], [1400, 270], [1160, 270]],
  [[1160, 270], [1020, 270], [930, 250], [860, 236]],
];
const ROAD_D = SEGS.map((s, i) => `${i ? '' : `M ${s[0][0]} ${s[0][1]} `}C ${s[1].join(' ')}, ${s[2].join(' ')}, ${s[3].join(' ')}`).join(' ');
const DENSE = SEGS.flatMap((s, i) => bezier(s[0], s[1], s[2], s[3], 80).slice(i ? 1 : 0));
/** 32 stations spread evenly along the road. */
const STATIONS = (() => {
  const len = [0];
  for (let i = 1; i < DENSE.length; i++) len.push(len[i - 1] + Math.hypot(DENSE[i].x - DENSE[i - 1].x, DENSE[i].y - DENSE[i - 1].y));
  const total = len[len.length - 1];
  return Array.from({ length: 32 }, (_, k) => {
    const want = (total * k) / 31;
    const j = len.findIndex((l) => l >= want);
    return DENSE[Math.max(0, j)];
  });
})();
// The parts of the course plan (literacy/PLAN.md, Kids): first and last station of each land.
const LANDS = [
  { name: 'All Aboard', from: 1, to: 1, color: CRIMSON, dx: 0, dy: 44 },
  { name: 'The Letters', from: 2, to: 11, color: TEAL, dx: 0, dy: -30 },
  { name: 'Hold Hands', from: 12, to: 15, color: '#E0603F', dx: -112, dy: 0 },
  { name: 'Little Marks', from: 16, to: 19, color: '#2B4FA8', dx: 0, dy: 50 },
  { name: 'Stretching', from: 20, to: 22, color: '#7A9A2E', dx: 104, dy: 0 },
  { name: 'Special Marks', from: 23, to: 27, color: '#8B4A9C', dx: 0, dy: -46 },
];
const landOf = (n: number) => LANDS.find((l) => n >= l.from && n <= l.to);

function ReadingTown({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  const houses = [{ dx: -70, h: 70, c: '#E9A15A' }, { dx: -10, h: 100, c: CRIMSON }, { dx: 52, h: 80, c: TEAL }, { dx: 108, h: 62, c: GOLD }];
  return (
    <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
      {lit && <motion.circle cx={x + 20} cy={y - 40} r={120} fill={GOLD} initial={{ opacity: 0 }} animate={{ opacity: 0.22 }} transition={{ duration: 1 }} style={{ filter: 'blur(24px)' }} />}
      {houses.map((hs, i) => (
        <g key={i}>
          <rect x={x + hs.dx - 24} y={y - hs.h} width={48} height={hs.h} rx={8} fill={hs.c} />
          <motion.rect x={x + hs.dx - 16} y={y - hs.h + 12} width={32} height={14} rx={3} fill={lit ? '#FFF6D8' : '#FFFFFF'} opacity={lit ? 1 : 0.5}
            animate={lit ? { opacity: [0.5, 1] } : {}} transition={{ duration: 0.6, delay: 0.3 + i * 0.2 }} />
          <rect x={x + hs.dx - 7} y={y - 22} width={14} height={22} rx={7} fill="#5A3020" opacity={0.7} />
        </g>
      ))}
    </motion.g>
  );
}

export function LawTrainGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  useCue('pop', lines >= 2, 0.3);
  useCue('sparkle', lines >= 3, 0.4);
  useCue('whoosh', lines >= 4, 0.2);
  const end = STATIONS[31];
  const start = STATIONS[0];
  return (
    <>
      <Svg>
        {/* the road draws itself, right to left */}
        {lines >= 1 && (
          <>
            <path d={ROAD_D} fill="none" stroke="#E9D3AE" strokeWidth={34} strokeLinecap="round" opacity={0.7} />
            <Draw d={ROAD_D} color="#6B4A36" width={5} dash="2 12" dur={2.4} />
          </>
        )}
        {/* the land names along the road */}
        {lines >= 1 && LANDS.map((l, i) => {
          const mid = STATIONS[Math.round((l.from + l.to) / 2) - 1];
          return (
            <motion.text key={l.name} x={mid.x + l.dx} y={mid.y + l.dy} textAnchor="middle" fontSize={21} fontWeight={800} fill={l.color} className="font-sans"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 + i * 0.25 }}>{l.name}</motion.text>
          );
        })}
        {/* every station is a lesson */}
        {lines >= 2 && STATIONS.map((p, k) => (
          <motion.circle key={k} cx={p.x} cy={p.y} r={k === 0 ? 13 : 9} fill={landOf(k + 1)?.color ?? GOLD} stroke="#FFF8E8" strokeWidth={4}
            initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
            transition={{ type: 'spring', bounce: 0.5, delay: reduce ? 0 : 0.2 + k * 0.05 }} />
        ))}
        {lines >= 2 && (
          <motion.text x={1090} y={410} textAnchor="middle" fontSize={22} fontWeight={700} fill={soft('light')} className="font-sans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
            32 stations · 32 lessons
          </motion.text>
        )}
        {/* the end of the road */}
        {lines >= 3 && <ReadingTown x={end.x - 40} y={end.y - 12} lit />}
        {lines >= 3 && (
          <motion.text x={end.x - 20} y={end.y - 128} textAnchor="middle" fontSize={26} fontWeight={900} fill={CRIMSON} className="font-sans"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring', bounce: 0.4 }}>Reading Town</motion.text>
        )}
        {/* the train waits at station 1 */}
        {lines >= 4 && (
          <motion.g initial={{ x: 160, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.2, ease }}>
            <Train x={start.x - 10} y={start.y - 4} s={0.36} cars={2} />
          </motion.g>
        )}
      </Svg>
      {lines >= 4 && (
        <motion.div className="pointer-events-none absolute flex flex-col items-center" style={{ left: start.x - 120, top: start.y - 150 }}
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.45, delay: 0.9 }}>
          <span className="rounded-full font-sans font-black text-white" style={{ fontSize: 20, padding: '6px 16px', background: CRIMSON, boxShadow: '0 12px 24px -12px rgba(120,20,20,0.7)' }}>We are here!</span>
          <span style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: `12px solid ${CRIMSON}` }} />
        </motion.div>
      )}
    </>
  );
}

/* ---------- 4 · right to left ---------- */

function WordCard({ y, children, dir, color, label, delay = 0 }: { y: number; children: React.ReactNode; dir: 'ltr' | 'rtl'; color: string; label: string; delay?: number }) {
  const reduce = useReduce();
  const ltr = dir === 'ltr';
  return (
    <motion.div className="pointer-events-none absolute rounded-[28px]" style={{ left: 820, top: y, width: 660, height: 150, background: '#FFFDF8', boxShadow: '0 26px 50px -28px rgba(80,30,10,0.5)' }}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.9, delay }}>
      <span className="absolute font-sans font-extrabold uppercase" style={{ top: 14, [ltr ? 'left' : 'right']: 24, fontSize: 16, letterSpacing: '0.14em', color }}>{label}</span>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: 26 }}>{children}</div>
      {/* the reading finger: a dot that walks the line, and the underline it leaves behind */}
      <motion.div className="absolute rounded-full" style={{ bottom: 22, left: 110, width: 440, height: 8, background: color, transformOrigin: ltr ? 'left' : 'right' }}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.8, delay: delay + 0.8, ease: [0.45, 0, 0.55, 1] }} />
      <motion.div className="absolute rounded-full" style={{ bottom: 14, width: 24, height: 24, background: color, boxShadow: `0 0 0 6px ${color}33` }}
        initial={{ left: ltr ? 98 : 538 }} animate={{ left: ltr ? 538 : 98 }} transition={{ duration: 1.8, delay: delay + 0.8, ease: [0.45, 0, 0.55, 1] }} />
      <motion.span className="absolute font-sans font-black" style={{ bottom: 6, [ltr ? 'right' : 'left']: 34, fontSize: 40, color }}
        initial={{ opacity: 0, x: ltr ? -20 : 20 }} animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }} transition={{ delay: delay + 2.6 }}>{ltr ? '→' : '←'}</motion.span>
    </motion.div>
  );
}

/** A small book that opens: English on its left edge, Arabic on its right edge. */
function OpeningBook({ x, y, hinge, color, label, delay = 0 }: { x: number; y: number; hinge: 'left' | 'right'; color: string; label: string; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x, top: y, width: 110, height: 120 }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay }}>
      <div className="absolute inset-0 rounded-[6px]" style={{ background: '#FFFDF5', boxShadow: '0 16px 30px -16px rgba(60,30,10,0.5)', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 16px, rgba(31,22,18,0.12) 16px 18px)' }} />
      <motion.div className="absolute inset-0 rounded-[6px]" style={{ background: color, transformOrigin: hinge }}
        initial={{ scaleX: 1 }} animate={{ scaleX: -1 }} transition={{ duration: 1.1, delay: delay + 0.8, ease }} />
      <motion.span className="absolute inset-0 flex items-center justify-center font-sans font-black text-white" style={{ fontSize: 18 }}
        initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.3, delay: delay + 0.8 }}>{label}</motion.span>
      <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ top: 128, fontSize: 17, color: soft('light') }}>opens on the {hinge}</span>
    </motion.div>
  );
}

export function LawRtlGraphic({ lines }: GraphicProps) {
  useCue('pen', lines >= 1, 0.8);
  useCue('pen', lines >= 2, 0.8);
  useCue('whoosh', lines >= 3, 0.2);
  useCue('page', lines >= 4, 0.6);
  return (
    <>
      {lines >= 1 && (
        <WordCard y={170} dir="ltr" color={TEAL} label="English">
          <span className="font-serif" style={{ fontSize: 76, lineHeight: 1, letterSpacing: '0.06em', color: INK_TEXT }}>train</span>
        </WordCard>
      )}
      {lines >= 2 && (
        <WordCard y={350} dir="rtl" color={CRIMSON} label="Arabic">
          <Hear id="qitar"><span lang="ar" style={{ ...AR, fontSize: 84, lineHeight: 1, color: '#8B1A1E' }}>قِطَار</span></Hear>
        </WordCard>
      )}
      {lines >= 4 && (
        <>
          <OpeningBook x={940} y={520} hinge="left" color={TEAL} label="English" />
          <OpeningBook x={1200} y={520} hinge="right" color={CRIMSON} label="عربي" delay={0.4} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Svg>
            <Track x0={760} x1={1620} y={790} />
            <motion.g initial={{ x: 700 }} animate={{ x: 0 }} transition={{ duration: 2, ease }}>
              <Train x={900} y={790} s={0.6} cars={1} />
            </motion.g>
          </Svg>
          <Cut src={`${CAST}/rami-point`} x={1470} y={800} h={lines >= 4 ? 300 : 340} flip delay={0.8} />
        </>
      )}
    </>
  );
}

/* ---------- shared pieces for the other pages ---------- */

const SIGN = 'قِطَارُ الحُرُوف';
const PAPER_CARD: React.CSSProperties = { background: '#FFFDF8', boxShadow: '0 26px 50px -28px rgba(80,30,10,0.5)' };

/** The sign that hangs over the train: two chains and a wooden board with قِطَارُ الحُرُوف (tap to hear it). */
function SignBoard({ x = 900, y = 200, w = 520, wobble = false }: { x?: number; y?: number; w?: number; wobble?: boolean }) {
  const reduce = useReduce();
  return (
    <motion.div className="absolute" style={{ left: x, top: y - 60, width: w, height: 210, transformOrigin: '50% 0%' }}
      initial={reduce ? false : { rotate: -8, y: -40, opacity: 0 }} animate={{ rotate: wobble && !reduce ? [0, 4, -3, 2, 0] : 0, y: 0, opacity: 1 }}
      transition={wobble ? { duration: 0.9 } : { type: 'spring', bounce: 0.35, duration: 1.2 }}>
      {[0.18, 0.82].map((f) => (
        <span key={f} className="absolute" style={{ left: w * f - 3, top: 0, width: 6, height: 66, background: 'repeating-linear-gradient(180deg, #6B4A36 0 8px, transparent 8px 12px)' }} />
      ))}
      <div className="absolute flex items-center justify-center rounded-[22px]" style={{ left: 0, top: 60, width: w, height: 140, background: 'linear-gradient(180deg, #A06A45, #7E4F33)', boxShadow: '0 24px 40px -22px rgba(60,30,10,0.7), inset 0 0 0 6px rgba(255,236,200,0.25)' }}>
        <div className="pointer-events-auto"><Hear id="qitar-al-huruf"><span lang="ar" style={{ ...AR, fontSize: 78, color: '#FFF3D6' }}>{SIGN}</span></Hear></div>
      </div>
    </motion.div>
  );
}

/** A short label in a rounded bubble. */
function Tag({ x, y, children, color = CRIMSON, delay = 0, solid = false }: { x: number; y: number; children: React.ReactNode; color?: string; delay?: number; solid?: boolean }) {
  return (
    <motion.span className="pointer-events-none absolute whitespace-nowrap rounded-full font-sans font-black" style={{ left: x, top: y, transform: 'translateX(-50%)', fontSize: 24, padding: '6px 18px', background: solid ? color : '#FFFDF8', color: solid ? '#fff' : color, boxShadow: '0 14px 28px -16px rgba(60,30,10,0.55)' }}
      initial={{ opacity: 0, scale: 0.6, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.8, delay }}>
      {children}
    </motion.span>
  );
}

/** Sound rings from a point (the letter is speaking). */
function Rings({ x, y, color = GOLD, r = 40 }: { x: number; y: number; color?: string; r?: number }) {
  const reduce = useReduce();
  return (
    <Svg>
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={4} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
          initial={{ scale: 0.6, opacity: 0.9 }} animate={reduce ? { scale: 1.4, opacity: 0.4 } : { scale: [0.6, 2.2], opacity: [0.9, 0] }}
          transition={{ duration: 1.6, delay: i * 0.35, repeat: reduce ? 0 : Infinity, repeatDelay: 0.4 }} />
      ))}
    </Svg>
  );
}

/* ---------- 2 · a sign nobody can read ---------- */

export function LawSignGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  useCue('oops', lines >= 2, 1.8);
  useCue('sparkle', lines >= 3, 0.8);
  return (
    <>
      <Svg>
        <Track x0={760} x1={1620} y={790} />
        <Train x={860} y={790} s={0.55} cars={2} />
      </Svg>
      {lines >= 1 && <SignBoard wobble={lines >= 2} />}
      {/* Rami reads from the left, the English way: the finger walks left to right and gets nowhere */}
      {lines >= 2 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-full" style={{ top: 352, left: 930, width: 26, height: 26, background: TEAL, boxShadow: `0 0 0 7px ${TEAL}33` }}
            initial={{ x: 0, opacity: 1 }} animate={{ x: reduce ? 0 : 440, opacity: [1, 1, 0] }} transition={{ duration: 1.6, ease: [0.45, 0, 0.55, 1] }} />
          <motion.span className="pointer-events-none absolute font-sans font-black" style={{ left: 1250, top: 370, fontSize: 72, color: CRIMSON }}
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1, rotate: reduce ? 0 : [0, -10, 8, 0] }} transition={{ delay: 1.6, duration: 0.6 }}>?!</motion.span>
          <Tag x={1030} y={410} color={TEAL} delay={0.2}>from the left →</Tag>
        </>
      )}
      {/* Dalia's idea: a light pulses at the other end of the sign */}
      {lines >= 3 && (
        <motion.span className="pointer-events-none absolute rounded-full" style={{ left: 1403, top: 253, width: 34, height: 34, background: GOLD }}
          initial={{ scale: 0, opacity: 0 }} animate={reduce ? { scale: 1, opacity: 1 } : { scale: [1, 1.5, 1], opacity: 1, boxShadow: [`0 0 0 0 ${GOLD}aa`, `0 0 0 22px ${GOLD}00`] }}
          transition={{ duration: 1.4, delay: 0.8, repeat: reduce ? 0 : Infinity }} />
      )}
      {lines >= 3 && <Cut src={`${CAST}/dalia-think`} x={1250} y={812} h={330} delay={0.2} />}
      {lines >= 1 && <Cut src={`${CAST}/rami-point`} x={1460} y={812} h={360} flip delay={0.3} />}
    </>
  );
}

/* ---------- 3 · a language of millions: a globe of lights ---------- */

const G = { cx: 1110, cy: 450, r: 245, lon0: 25, lat0: 18 };
const rad = (d: number) => (d * Math.PI) / 180;
/** Orthographic projection of (lat, lon) onto the globe; null when it is on the far side. */
function project(lat: number, lon: number) {
  const f = rad(lat), l = rad(lon - G.lon0), f0 = rad(G.lat0);
  const front = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
  if (front <= 0.05) return null;
  return { x: G.cx + G.r * Math.cos(f) * Math.sin(l), y: G.cy - G.r * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l)), z: front };
}
const GRID = (() => {
  const out: { x: number; y: number; z: number }[] = [];
  for (let lat = -78; lat <= 78; lat += 9) for (let lon = -180; lon < 180; lon += 9) { const p = project(lat, lon); if (p) out.push(p); }
  return out;
})();
// The countries where Arabic is the main language (the Arab League), one light each.
const ARAB = [[32, -7], [28, 3], [34, 9], [27, 17], [26, 30], [15, 30], [20, -10], [24, 45], [15, 48], [21, 57], [24, 54], [25, 51], [26, 50.5],
  [29, 47.5], [33, 44], [35, 38], [31, 36], [34, 36], [31.9, 35.2], [5, 46], [11.6, 43], [-12, 43.8]].map(([a, b]) => project(a, b)!).filter(Boolean);
// Learners everywhere else on this side of the world.
const WORLD = [[51.5, 0], [48.8, 2.3], [52.5, 13.4], [41, 29], [6.5, 3.4], [-1.3, 36.8], [-26, 28], [25, 67], [28.6, 77], [55.7, 37.6], [40.4, -3.7],
  [59.3, 18], [45.5, 9.2], [9, 38.7], [-4.3, 15.3], [14.7, -17.4], [3.1, 101.7], [23.8, 90.4], [43.2, 76.9], [-33.9, 18.4]].map(([a, b]) => project(a, b)).filter(Boolean) as { x: number; y: number }[];

function Counter({ to, delay = 0 }: { to: number; delay?: number }) {
  const reduce = useReduce();
  const mv = useMotionValue(reduce ? to : 0);
  const text = useTransform(mv, (v) => `${Math.round(v).toLocaleString('en-US')}+`);
  React.useEffect(() => { if (reduce) return; const c = animate(mv, to, { duration: 2.2, delay, ease: [0.22, 1, 0.36, 1] }); return () => c.stop(); }, [mv, to, delay, reduce]);
  return <motion.span>{text}</motion.span>;
}

export function LawWorldGraphic({ lines }: GraphicProps) {
  useCue('sparkle', lines >= 1, 0.3);
  useCue('pop', lines >= 2, 0.2);
  useCue('sparkle', lines >= 3, 0.3);
  return (
    <>
      <Svg>
        <defs>
          <radialGradient id="lawGlobe" cx="40%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#E3F4F2" /><stop offset="70%" stopColor="#B9E1DE" /><stop offset="100%" stopColor="#8FC9C6" />
          </radialGradient>
        </defs>
        <motion.g initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }} transition={{ duration: 1, ease }}>
          <circle cx={G.cx} cy={G.cy} r={G.r} fill="url(#lawGlobe)" />
          {GRID.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.6} fill="#0E7C86" opacity={0.12 + p.z * 0.3} />)}
          <circle cx={G.cx} cy={G.cy} r={G.r} fill="none" stroke="#0E7C86" strokeWidth={3} opacity={0.35} />
        </motion.g>
        {lines >= 1 && ARAB.map((p, i) => (
          <motion.circle key={`a${i}`} cx={p.x} cy={p.y} r={9} fill={GOLD} stroke="#FFF6D8" strokeWidth={3} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%', filter: `drop-shadow(0 0 8px ${GOLD})` }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.3 + i * 0.06 }} />
        ))}
        {lines >= 3 && WORLD.map((p, i) => (
          <motion.circle key={`w${i}`} cx={p.x} cy={p.y} r={7} fill={CRIMSON} stroke="#FFF6D8" strokeWidth={2.5} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 + i * 0.08 }} />
        ))}
      </Svg>
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute flex flex-col items-center rounded-[26px]" style={{ ...PAPER_CARD, left: 880, top: 690, width: 460, padding: '10px 0 12px' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <span className="font-sans font-black" style={{ fontSize: 50, lineHeight: 1.05, color: CRIMSON }}><Counter to={400000000} delay={0.3} /></span>
          <span className="font-sans font-bold" style={{ fontSize: 19, color: soft('light') }}>people use Arabic every day</span>
        </motion.div>
      )}
      {lines >= 2 && <Tag x={1250} y={248} color="#B07A1E" solid={false}>20+ countries</Tag>}
      {lines >= 3 && <Cut src={`${CAST}/dalia-wave`} x={1470} y={812} h={330} delay={0.4} />}
      {lines >= 3 && <Tag x={1470} y={440} color={TEAL} delay={1}>Me too!</Tag>}
    </>
  );
}

/* ---------- 5 · 28 letters, no capitals ---------- */

const ALPHABET = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ');

export function Law28Graphic({ lines, interaction }: GraphicProps) {
  useCue('pop', lines >= 1, 0.2);
  useCue('reveal', lines >= 2, 0.2);
  useCue('correct', interaction, 0.4);
  return (
    <>
      {/* the 28 cards, right to left like the alphabet itself */}
      <div className="pointer-events-none absolute grid grid-cols-7 gap-[8px]" dir="rtl" style={{ left: 800, top: 168 }}>
        {ALPHABET.map((c, i) => (
          <motion.span key={i} className="flex items-center justify-center rounded-[14px]" style={{ ...AR, ...PAPER_CARD, width: 60, height: 60, fontSize: 36, color: i % 3 === 0 ? CRIMSON : i % 3 === 1 ? '#0E7C86' : '#B07A1E' }}
            initial={{ opacity: 0, scale: 0.3, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.1 + i * 0.045 }}>{c}</motion.span>
        ))}
      </div>
      {lines >= 1 && (
        <>
          <Tag x={1350} y={200} color={CRIMSON} solid>Arabic: 28</Tag>
          <Tag x={1350} y={262} color={TEAL}>English: 26</Tag>
        </>
      )}
      {/* English has two sizes of every letter… */}
      {lines >= 2 && (
        <motion.div className="pointer-events-none absolute flex items-end justify-center gap-3 rounded-[26px]" style={{ ...PAPER_CARD, left: 820, top: 500, width: 230, height: 170, paddingBottom: 30 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <motion.span className="font-serif" style={{ fontSize: 96, lineHeight: 0.8, color: INK_TEXT }} initial={{ x: 20 }} animate={{ x: 0 }} transition={{ delay: 0.5, duration: 0.6, ease }}>A</motion.span>
          <motion.span className="font-serif" style={{ fontSize: 60, lineHeight: 0.8, color: INK_TEXT }} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6, ease }}>a</motion.span>
          <span className="absolute font-sans font-extrabold uppercase" style={{ top: 12, fontSize: 15, letterSpacing: '0.14em', color: TEAL }}>English · 2 sizes</span>
        </motion.div>
      )}
      {/* …Arabic has one */}
      {lines >= 3 && (
        <motion.div className="pointer-events-none absolute flex items-end justify-center rounded-[26px]" style={{ ...PAPER_CARD, left: 1080, top: 500, width: 230, height: 170, paddingBottom: 22 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <span style={{ ...AR, fontSize: 96, lineHeight: 1, color: '#8B1A1E' }}>ب</span>
          <span className="absolute font-sans font-extrabold uppercase" style={{ top: 12, fontSize: 15, letterSpacing: '0.14em', color: CRIMSON }}>Arabic · 1 size</span>
        </motion.div>
      )}
      {interaction && (
        <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black" style={{ left: 1180, top: 690, width: 150, height: 150, border: `6px solid ${CRIMSON}`, color: CRIMSON, fontSize: 22, lineHeight: 1.1, textAlign: 'center' }}
          initial={{ scale: 2.2, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -10 }} transition={{ type: 'spring', bounce: 0.35, delay: 0.3 }}>
          <span><span style={{ fontSize: 54 }}>0</span><br />capitals</span>
        </motion.div>
      )}
      <Cut src={`${CAST}/hibr-glasses`} x={1460} y={812} h={300} delay={0.6} />
    </>
  );
}

/* ---------- 6 · letters hold hands ---------- */

const PIECES = [{ ch: 'ق', x: 1290 }, { ch: 'ط', x: 1150 }, { ch: 'ا', x: 1010 }, { ch: 'ر', x: 870 }];

export function LawHandsGraphic({ lines }: GraphicProps) {
  const joined = lines >= 1;
  useCue('whoosh', lines >= 1, 0.2);
  useCue('pen', lines >= 2, 0.3);
  useCue('pop', lines >= 3, 0.4);
  return (
    <>
      {/* four letters on their own slide together and become one word */}
      {PIECES.map((p, i) => (
        <motion.span key={p.ch} className="pointer-events-none absolute flex items-center justify-center rounded-[22px]" style={{ ...AR, ...PAPER_CARD, left: p.x - 55, top: 440, width: 110, height: 130, fontSize: 76, color: '#8B1A1E' }}
          initial={{ opacity: 0, y: -30 }} animate={joined ? { opacity: 0, x: 1080 - p.x, y: -200, scale: 0.6 } : { opacity: 1, y: 0 }}
          transition={joined ? { duration: 0.7, ease, delay: i * 0.05 } : { type: 'spring', bounce: 0.4, delay: 0.2 + i * 0.12 }}>{p.ch}</motion.span>
      ))}
      {joined && (
        <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-[28px]" style={{ ...PAPER_CARD, left: 860, top: 190, width: 440, height: 190 }}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, delay: 0.55 }}>
          <span style={{ ...AR, fontSize: 120, lineHeight: 1, color: '#8B1A1E' }}>قطار</span>
        </motion.div>
      )}
      {/* the flowing line, drawn the Arabic way: right to left */}
      {lines >= 2 && <Svg><Draw d="M 1270 410 C 1180 440, 1000 380, 890 410" color={GOLD} width={7} dur={1.4} delay={0.2} /></Svg>}
      {lines >= 2 && <Tag x={1080} y={430} color="#B07A1E" delay={1.2}>one flowing line</Tag>}
      {/* most letters hold the next one's hand; alif lets go */}
      {lines >= 3 && (
        <>
          {[{ w: 'بَا', label: 'holds hands', color: TEAL, x: 840 }, { w: 'اب', label: 'lets go: a gap', color: CRIMSON, x: 1090 }].map((c, i) => (
            <motion.div key={c.w} className="pointer-events-none absolute flex flex-col items-center rounded-[24px]" style={{ ...PAPER_CARD, left: c.x, top: 540, width: 210, padding: '6px 0 14px' }}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.2 + i * 0.3 }}>
              <span lang="ar" style={{ ...AR, fontSize: 84, lineHeight: 1.25, color: '#8B1A1E', letterSpacing: i ? '0.18em' : undefined }}>{c.w}</span>
              <span className="font-sans font-black" style={{ fontSize: 20, color: c.color }}>{c.label}</span>
            </motion.div>
          ))}
        </>
      )}
      <Cut src={`${CAST}/dalia-read`} x={1460} y={812} h={340} delay={0.6} />
    </>
  );
}

/* ---------- 7 · dots make letters (the wow) ---------- */

const BOAT = { x: 1030, y: 560, size: 380 };
const DOTS: Record<'none' | 'b' | 't' | 'th', { x: number; y: number }[]> = {
  none: [], b: LETTERS['ب'].dots, t: LETTERS['ت'].dots, th: LETTERS['ث'].dots,
};
const SOUND = { none: '', b: 'b', t: 't', th: 'th' } as const;

export function LawDotsGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  const [late, setLate] = React.useState(false);
  React.useEffect(() => {
    if (lines !== 3) { setLate(false); return; }
    const t = window.setTimeout(() => setLate(true), 2200);
    return () => window.clearTimeout(t);
  }, [lines]);
  const state: keyof typeof DOTS = lines >= 4 || (lines === 3 && late) ? 'th' : lines === 3 ? 't' : lines === 2 ? 'b' : 'none';
  const s = BOAT.size / 300;
  useCue('pen', lines >= 1, 0.2);
  useCue('pop', lines >= 2, 0.4);
  useCue('pop', lines >= 3, 0.3);
  useCue('sparkle', lines >= 4, 0.3);
  // the dots stay the same three circles: they fly from one place to the next, so the learner sees them move
  const at = DOTS[state];
  return (
    <>
      <Svg>
        {lines >= 1 && <WriteLetter ch="ب" x={BOAT.x} y={BOAT.y} size={BOAT.size} color={CRIMSON} dots={false} speed={0.9} />}
        <g transform={`translate(${BOAT.x - BOAT.size / 2} ${BOAT.y - 200 * s}) scale(${s})`}>
          {[0, 1, 2].map((i) => {
            const p = at[i];
            return (
              <motion.circle key={i} cx={0} cy={0} r={19} fill={CRIMSON} initial={{ x: 150, y: -120, scale: 0 }}
                animate={p ? { x: p.x, y: p.y, scale: 1 } : { x: 150, y: -120, scale: 0 }}
                transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0.4, duration: 1, delay: i * 0.12 }} />
            );
          })}
        </g>
      </Svg>
      {state !== 'none' && (
        <motion.span key={state} className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black text-white" style={{ left: 1210, top: 230, width: 110, height: 110, background: TEAL, fontSize: 48, boxShadow: '0 18px 30px -16px rgba(14,124,134,0.7)' }}
          initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.5 }}>{SOUND[state]}</motion.span>
      )}
      {/* the whole family in a row */}
      {lines >= 4 && (
        <div className="pointer-events-none absolute flex gap-4" dir="rtl" style={{ left: 840, top: 640 }}>
          {[['ب', 'b'], ['ت', 't'], ['ث', 'th']].map(([c, snd], i) => (
            <motion.div key={c} className="flex flex-col items-center rounded-[20px]" style={{ ...PAPER_CARD, width: 120, padding: '2px 0 8px' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.2 }}>
              <span style={{ ...AR, fontSize: 60, lineHeight: 1.3, color: '#8B1A1E' }}>{c}</span>
              <span className="font-sans font-black" style={{ fontSize: 22, color: TEAL }}>{snd}</span>
            </motion.div>
          ))}
        </div>
      )}
      <Cut src={`${CAST}/hibr-glasses`} x={1460} y={812} h={300} delay={0.6} />
    </>
  );
}

/* ---------- 8 · little marks are vowels ---------- */

export function LawMarksGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  const L = { x: 1010, y: 540, size: 380 };
  const s = L.size / 300;
  useCue('pop', lines >= 1, 0.7);
  useCue('chime', lines >= 2, 0.3);
  return (
    <>
      <Svg>
        <WriteLetter ch="ب" x={L.x} y={L.y} size={L.size} color={CRIMSON} instant />
        {/* the fatha: a small slanted line that drops onto the letter */}
        {lines >= 1 && (
          <g transform={`translate(${L.x - L.size / 2} ${L.y - 200 * s}) scale(${s})`}>
            <motion.line x1={122} y1={96} x2={182} y2={66} stroke={GOLD} strokeWidth={18} strokeLinecap="round"
              initial={reduce ? false : { y: -160, opacity: 0, rotate: -40 }} animate={{ y: 0, opacity: 1, rotate: 0 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
              transition={{ type: 'spring', bounce: 0.45, duration: 1.1, delay: 0.3 }} />
          </g>
        )}
      </Svg>
      {lines >= 2 && <Rings x={L.x} y={L.y - 120} color={GOLD} r={70} />}
      {lines >= 2 && (
        <div className="pointer-events-auto absolute" style={{ left: L.x - 150, top: L.y - 300, width: 300, height: 340 }}>
          <Hear id="ba"><span style={{ display: 'block', width: 300, height: 340 }} /></Hear>
        </div>
      )}
      {lines >= 2 && <Tag x={1230} y={260} color={CRIMSON} solid delay={0.4}>b → ba</Tag>}
      {/* the marks live above and below */}
      {lines >= 3 && (
        <div className="pointer-events-none absolute flex gap-4" dir="rtl" style={{ left: 840, top: 660 }}>
          {[['بَ', 'ba', 'above'], ['بِ', 'bi', 'below'], ['بُ', 'bu', 'above']].map(([c, snd, where], i) => (
            <motion.div key={c} className="flex flex-col items-center rounded-[20px]" style={{ ...PAPER_CARD, width: 120, padding: '0 0 8px' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.2 }}>
              <span style={{ ...AR, fontSize: 60, lineHeight: 1.4, color: '#8B1A1E' }}>{c}</span>
              <span className="font-sans font-black" style={{ fontSize: 20, color: TEAL }}>{snd} <span style={{ color: soft('light'), fontWeight: 700, fontSize: 15 }}>{where}</span></span>
            </motion.div>
          ))}
        </div>
      )}
      <Cut src={`${CAST}/rami-point`} x={1460} y={812} h={350} flip delay={0.6} />
    </>
  );
}

/* ---------- 9 · new sounds from the throat ---------- */

const DEEP_SOUNDS = [{ c: 'ح', id: 'haa' }, { c: 'ع', id: 'ayn' }, { c: 'خ', id: 'khaa' }, { c: 'ق', id: 'qaaf' }];

export function LawSoundsGraphic({ lines, items }: GraphicProps) {
  const reduce = useReduce();
  const throat = { x: 985, y: 610 };
  useCue('pop', lines >= 1, 0.3);
  useCue('poof', lines >= 3, 0.6);
  useCue('chime', items, 0.2);
  return (
    <>
      {/* the four sounds English does not have */}
      {lines >= 1 && (
        <div className="absolute flex gap-4" dir="rtl" style={{ left: 820, top: 168 }}>
          {DEEP_SOUNDS.map((d, i) => {
            const on = items === i + 1;
            return (
              <motion.div key={d.c} className="flex items-center justify-center rounded-[24px]" style={{ ...PAPER_CARD, width: 116, height: 128, outline: on ? `4px solid ${GOLD}` : undefined }}
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0, scale: on ? 1.12 : 1 }} transition={{ type: 'spring', bounce: 0.4, delay: items ? 0 : 0.2 + i * 0.15 }}>
                <Hear id={d.id}><span lang="ar" style={{ ...AR, fontSize: 80, color: '#8B1A1E' }}>{d.c}</span></Hear>
              </motion.div>
            );
          })}
        </div>
      )}
      {/* where they come from: deep in the throat */}
      {lines >= 2 && (
        <Svg>
          <motion.g initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease }}>
            <path d="M 860 800 C 870 720, 930 700, 955 690 L 955 600 C 905 590, 880 545, 880 485 C 880 410, 935 360, 1000 360 C 1070 360, 1120 410, 1120 480 C 1120 500, 1140 520, 1132 532 C 1124 544, 1112 540, 1110 556 C 1108 590, 1080 600, 1040 598 L 1032 690 C 1060 700, 1120 720, 1130 800 Z"
              fill="#EAD2B6" stroke="#C9A889" strokeWidth={3} />
            <path d="M 1000 360 C 1060 340, 1120 380, 1124 440 C 1080 420, 1020 410, 960 430 C 930 440, 900 470, 885 500 C 880 420, 930 365, 1000 360 Z" fill="#3A2A22" opacity={0.85} />
          </motion.g>
          <motion.circle cx={throat.x} cy={throat.y} r={30} fill={GOLD} style={{ filter: `drop-shadow(0 0 14px ${GOLD})`, transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
            initial={{ scale: 0, opacity: 0 }} animate={reduce ? { scale: 1, opacity: 0.9 } : { scale: [0.8, 1.15, 0.8], opacity: 0.9 }} transition={{ duration: 1.2, repeat: reduce ? 0 : Infinity, delay: 0.6 }} />
          {[0, 1, 2].map((i) => (
            <motion.path key={i} d={`M ${1150 + i * 26} ${505 - i * 16} q 18 ${28 + i * 16} 0 ${56 + i * 32}`} fill="none" stroke={TEAL} strokeWidth={5} strokeLinecap="round"
              initial={{ opacity: 0 }} animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 0] }} transition={{ duration: 1.4, delay: 0.8 + i * 0.2, repeat: reduce ? 0 : Infinity }} />
          ))}
        </Svg>
      )}
      {lines >= 2 && <Tag x={985} y={750} color="#B07A1E" delay={0.8}>deep in the throat</Tag>}
      {lines >= 4 && <Tag x={830} y={560} color={CRIMSON} solid delay={0.3}>hand here!</Tag>}
      {/* Hibr tries one: his glasses fog up */}
      <Cut src={`${CAST}/${lines >= 3 ? 'hibr-oops' : 'hibr-glasses'}`} x={1430} y={812} h={310} delay={0.5} />
      {lines >= 3 && [0, 1, 2, 3].map((i) => (
        <motion.span key={i} className="pointer-events-none absolute rounded-full" style={{ left: 1370 + i * 26, top: 585 + (i % 2) * 14, width: 44, height: 44, background: '#FFFFFF', filter: 'blur(8px)' }}
          initial={{ opacity: 0, scale: 0.3 }} animate={reduce ? { opacity: 0.8 } : { opacity: [0, 0.9, 0.6], scale: [0.3, 1.2, 1] }} transition={{ duration: 1.2, delay: 0.6 + i * 0.12 }} />
      ))}
    </>
  );
}

/* ---------- 10 · meet alif ---------- */

export function LawAlifGraphic({ lines }: GraphicProps) {
  const A = { x: 900, y: 650, size: 600 };
  useCue('pen', lines >= 2, 0.5);
  useCue('chime', lines >= 3, 0.3);
  useCue('pen', lines >= 4, 0.8);
  return (
    <>
      <Svg>
        {lines >= 1 && <WriteLetter key={lines >= 2 ? 'write' : 'show'} ch="ا" x={A.x} y={A.y} size={A.size} width={30} color={CRIMSON} instant={lines < 2} delay={0.6} speed={0.6} />}
        {/* where the pen starts, and which way it goes */}
        {lines >= 2 && lines < 4 && (
          <>
            <motion.circle cx={A.x + 12} cy={A.y - 320} r={16} fill={GOLD} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }} transition={{ type: 'spring', bounce: 0.5 }} />
            <Draw d={`M ${A.x + 90} ${A.y - 300} L ${A.x + 90} ${A.y - 40}`} color={TEAL} width={6} dur={1.8} delay={0.6} />
            <motion.path d={`M ${A.x + 72} ${A.y - 62} L ${A.x + 90} ${A.y - 36} L ${A.x + 108} ${A.y - 62}`} fill="none" stroke={TEAL} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.3 }} />
          </>
        )}
      </Svg>
      {lines >= 2 && lines < 4 && <Tag x={A.x + 150} y={A.y - 340} color={TEAL} delay={0.3}>start at the top</Tag>}
      {lines >= 3 && <Rings x={A.x + 12} y={A.y - 170} color={GOLD} r={60} />}
      {lines >= 3 && <Tag x={1150} y={A.y - 220} color={CRIMSON} solid delay={0.3}>aa</Tag>}
      {lines >= 3 && <Tag x={1150} y={A.y - 150} color={INK_TEXT} delay={0.6}>f·aa·ther</Tag>}
      {lines >= 1 && (
        <div className="pointer-events-auto absolute" style={{ left: A.x - 80, top: A.y - 340, width: 180, height: 360 }}>
          <Hear id="alif"><span style={{ display: 'block', width: 180, height: 360 }} /></Hear>
        </div>
      )}
      {/* now you: three alifs on paper */}
      {lines >= 4 && (
        <motion.div className="pointer-events-none absolute rounded-[10px]" style={{ left: 1040, top: 560, width: 250, height: 190, background: '#FFFDF5', transform: 'rotate(-3deg)', boxShadow: '0 22px 40px -24px rgba(60,30,10,0.55)', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 36px, rgba(15,163,184,0.18) 36px 38px)' }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <svg className="absolute inset-0 overflow-visible" viewBox="0 0 250 190">
            {[0, 1, 2].map((i) => <WriteLetter key={i} ch="ا" x={190 - i * 66} y={160} size={150} width={22} color={INK_TEXT} delay={0.7 + i * 0.9} />)}
          </svg>
        </motion.div>
      )}
      <Cut src={`${CAST}/${lines >= 4 ? 'rami-write' : 'dalia-wave'}`} x={1440} y={812} h={lines >= 4 ? 330 : 340} delay={0.4} />
    </>
  );
}

/* ---------- 11 · true or false (the game fills the page) ---------- */

export function LawTrueGraphic(_: GraphicProps) {
  return <Cut src={`${CAST}/dalia-think`} x={1440} y={812} h={360} delay={0.4} />;
}

/* ---------- 12 · read the sign ---------- */

export function LawReadGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  useCue('sparkle', lines >= 1, 0.3);
  useCue('whoosh', lines >= 1, 0.9);
  return (
    <>
      <Svg>
        <Track x0={760} x1={1620} y={790} />
        <Train x={860} y={790} s={0.55} cars={2} />
      </Svg>
      <SignBoard />
      {/* start on the right: a light at the right end, then the reading finger walks right to left */}
      {lines >= 1 && (
        <>
          <motion.span className="pointer-events-none absolute rounded-full" style={{ left: 1403, top: 253, width: 34, height: 34, background: GOLD, boxShadow: `0 0 18px ${GOLD}` }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} />
          <motion.div className="pointer-events-none absolute rounded-full" style={{ top: 352, left: 1370, width: 26, height: 26, background: CRIMSON, boxShadow: `0 0 0 7px ${CRIMSON}33` }}
            initial={{ x: 0 }} animate={{ x: reduce ? 0 : -440 }} transition={{ duration: 2, delay: 0.8, ease: [0.45, 0, 0.55, 1] }} />
          <Tag x={1240} y={410} color={CRIMSON} solid delay={0.4}>← start on the right</Tag>
        </>
      )}
      {lines >= 2 && <Cut src={`${CAST}/hibr-glasses`} x={1460} y={812} h={300} delay={0.3} />}
      {lines >= 2 && <Tag x={1460} y={470} color={TEAL} delay={0.8}>alif × 2</Tag>}
    </>
  );
}

/* ---------- 13 · our first stamp ---------- */

export function LawStampGraphic({ lines }: GraphicProps) {
  useCue('stamp', lines >= 1, 0.9);
  useCue('whoosh', lines >= 2, 0.2);
  return (
    <>
      {/* the ticket: 32 stations, the first one stamped */}
      {lines >= 1 && <motion.div className="pointer-events-none absolute rounded-[22px]" style={{ ...PAPER_CARD, left: 896, top: 168, width: 470, height: 270, padding: '16px 22px', backgroundImage: 'radial-gradient(circle at 0 50%, transparent 14px, #FFFDF8 15px), radial-gradient(circle at 100% 50%, transparent 14px, #FFFDF8 15px)' }}
        initial={{ opacity: 0, rotate: -6, y: 20 }} animate={{ opacity: 1, rotate: -2, y: 0 }} transition={{ type: 'spring', bounce: 0.3, duration: 1 }}>
        <p className="m-0 font-sans font-black uppercase" style={{ fontSize: 17, letterSpacing: '0.16em', color: CRIMSON }}>Letter Train · Ticket</p>
        <div className="mt-3 grid grid-cols-8 gap-[10px]" dir="rtl">
          {Array.from({ length: 32 }, (_, i) => (
            <span key={i} className="flex items-center justify-center rounded-full font-sans font-bold" style={{ width: 40, height: 40, border: `2px dashed ${i ? 'rgba(31,22,18,0.22)' : CRIMSON}`, fontSize: 13, color: 'rgba(31,22,18,0.4)' }}>{i + 1}</span>
          ))}
        </div>
      </motion.div>}
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black" style={{ left: 1298, top: 208, width: 64, height: 64, border: `5px solid ${CRIMSON}`, color: CRIMSON, fontSize: 30, background: 'rgba(197,31,36,0.08)' }}
          initial={{ scale: 3, opacity: 0, rotate: -40 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ type: 'spring', bounce: 0.3, delay: 0.8 }}>✓</motion.div>
      )}
      {/* a new carriage joins the train with alif riding in it */}
      <Svg>
        <Track x0={760} x1={1330} y={700} />
        <Train x={800} y={700} s={0.6} cars={1} letters={[]} smoke />
        {lines >= 2 && (
          <motion.g initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4, ease }}>
            <Train x={800} y={700} s={0.6} cars={2} letters={['', 'ا']} smoke={false} only={1} />
          </motion.g>
        )}
      </Svg>
      <Cut src={`${CAST}/rami-cheer`} x={1450} y={812} h={380} delay={lines >= 1 ? 1.1 : 0.4} />
    </>
  );
}

/* ---------- 14 · next time ---------- */

export function LawNextGraphic({ lines }: GraphicProps) {
  useCue('whoosh', lines >= 1, 0.2);
  useCue('pop', lines >= 3, 0.6);
  return (
    <>
      <Svg>
        <Track x0={760} x1={1620} y={790} />
        <motion.g initial={{ x: 0 }} animate={{ x: lines >= 1 ? -40 : 0 }} transition={{ duration: 2, ease }}>
          <Train x={1240} y={790} s={0.5} cars={2} letters={['ا']} />
        </motion.g>
        {/* three boats wait on the platform; next time their dots arrive */}
        {lines >= 2 && ['ث', 'ت', 'ب'].map((c, i) => (
          <WriteLetter key={c} ch={c} x={860 + i * 210} y={560} size={190} color={[GOLD, TEAL, CRIMSON][i]} dots={false} delay={0.2 + i * 0.3} />
        ))}
        {lines >= 3 && ['ث', 'ت', 'ب'].map((c, i) => (
          <WriteLetter key={`${c}d`} ch={c} x={860 + i * 210} y={560} size={190} color={[GOLD, TEAL, CRIMSON][i]} instant delay={0} />
        ))}
      </Svg>
      {lines >= 1 && <Tag x={1000} y={210} color={CRIMSON} solid delay={0.6}>← Station 2</Tag>}
      {lines >= 3 && <Tag x={1070} y={630} color="#B07A1E" delay={0.8}>the boat family</Tag>}
      <motion.div className="absolute" initial={false} animate={{ y: lines >= 1 ? -20 : 0 }}>
        <Cut src={`${CAST}/hibr-fly`} x={1400} y={520} h={300} delay={0.4} />
      </motion.div>
    </>
  );
}
