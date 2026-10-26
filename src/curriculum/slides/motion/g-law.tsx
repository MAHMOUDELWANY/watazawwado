import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useCue } from '../sfx';
import { asset } from '../Art';
import { bezier, useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Cut, Draw } from './kit';
import { WriteLetter } from './letters';
import { Hear } from '../Say';

/**
 * Literacy A · Kids · Lesson 1 · Welcome to Arabic. The Letter Train (docs/curriculum/literacy/PLAN.md): a train that
 * faces left, because Arabic goes right to left, crossing six lands to Reading Town. Our neutral literacy cast (Rami,
 * Dalia, Hibr the owl) on the Kids paper stage. Prototype 2026-10-26: cover, the journey and right-to-left are the look
 * for the owner's review; the other pages are simple drafts until he approves the look.
 */

const CAST = 'literacy-a-kids/characters';
const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };
const WOOD = '#8B5A3C';

/* ---------- the train (faces left) ---------- */

/** The Letter Train with its nose at (x, y on the rails). Carriages carry letters once they are earned. */
function Train({ x, y, s = 1, cars = 2, letters = [], smoke = true }: { x: number; y: number; s?: number; cars?: number; letters?: string[]; smoke?: boolean }) {
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
      <path d="M 12 -34 L -16 -16 L 12 -16 Z" fill={GOLD} />
      <rect x={10} y={-96} width={128} height={62} rx={28} fill={CRIMSON} />
      <rect x={118} y={-146} width={74} height={112} rx={14} fill={CRIMSON} />
      <rect x={110} y={-154} width={90} height={14} rx={7} fill={INK_TEXT} />
      <rect x={132} y={-132} width={46} height={36} rx={9} fill="#FFF3D6" />
      <rect x={36} y={-132} width={24} height={40} rx={6} fill={INK_TEXT} />
      <rect x={28} y={-140} width={40} height={12} rx={6} fill={GOLD} />
      <circle cx={10} cy={-66} r={10} fill="#FFE7A8" />
      {wheel(44, 'e1')}{wheel(102, 'e2')}{wheel(160, 'e3')}
      {smoke && !reduce && [0, 1, 2].map((i) => (
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

/* ---------- the other pages: simple drafts until the owner approves the look ---------- */

function Draft({ lines, pose, x = 1440, h = 420, flip = false, children }: { lines: number; pose: string; x?: number; h?: number; flip?: boolean; children?: React.ReactNode }) {
  return (
    <>
      {children}
      <Cut src={`${CAST}/${pose}`} x={x} y={812} h={h} flip={flip} delay={lines ? 0.2 : 0.6} />
    </>
  );
}

function Panel({ children, top = 220, w = 560 }: { children: React.ReactNode; top?: number; w?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center justify-center rounded-[32px]" style={{ left: 1100 - w / 2 - 60, top, width: w, minHeight: 260, padding: 28, background: '#FFFDF8', boxShadow: '0 26px 50px -28px rgba(80,30,10,0.5)' }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.9 }}>
      {children}
    </motion.div>
  );
}

const SIGN = 'قِطَارُ الحُرُوف';

export function LawSignGraphic({ lines }: GraphicProps) {
  return (
    <Draft lines={lines} pose={lines >= 3 ? 'dalia-think' : 'rami-point'} flip={lines < 3}>
      <Panel><Hear id="qitar-al-huruf"><span lang="ar" style={{ ...AR, fontSize: 92, color: '#8B1A1E' }}>{SIGN}</span></Hear></Panel>
      {lines >= 2 && <motion.span className="pointer-events-none absolute font-sans font-black" style={{ left: 820, top: 520, fontSize: 64, color: CRIMSON }} initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: [0, -8, 8, 0] }} transition={{ duration: 0.8 }}>?!</motion.span>}
    </Draft>
  );
}

export function LawWorldGraphic({ lines }: GraphicProps) {
  return (
    <Draft lines={lines} pose="dalia-wave">
      {lines >= 1 && <Panel><span className="font-sans font-black" style={{ fontSize: 76, color: CRIMSON }}>400,000,000+</span><span className="font-sans font-bold" style={{ fontSize: 26, color: soft('light') }}>people use Arabic every day</span></Panel>}
      {lines >= 2 && <motion.span className="pointer-events-none absolute font-sans font-black" style={{ left: 880, top: 520, fontSize: 40, color: TEAL }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>20+ countries</motion.span>}
    </Draft>
  );
}

const ALPHABET = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ');

export function Law28Graphic({ lines }: GraphicProps) {
  return (
    <Draft lines={lines} pose="hibr-glasses" h={300}>
      <div className="pointer-events-none absolute flex flex-wrap justify-end gap-2" dir="rtl" style={{ left: 780, top: 180, width: 560 }}>
        {ALPHABET.map((c, i) => (
          <motion.span key={i} className="flex items-center justify-center rounded-[14px]" style={{ ...AR, width: 62, height: 62, fontSize: 38, background: '#FFFDF8', color: i % 3 === 0 ? CRIMSON : i % 3 === 1 ? '#0E7C86' : '#B07A1E', boxShadow: '0 10px 20px -14px rgba(60,30,10,0.6)' }}
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.1 + i * 0.04 }}>{c}</motion.span>
        ))}
      </div>
      {lines >= 2 && <motion.span className="pointer-events-none absolute font-serif" style={{ left: 860, top: 600, fontSize: 64, color: INK_TEXT }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>A a</motion.span>}
      {lines >= 3 && <motion.span className="pointer-events-none absolute font-sans font-black" style={{ left: 1040, top: 610, fontSize: 40, color: CRIMSON }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>Arabic: one size</motion.span>}
    </Draft>
  );
}

export function LawHandsGraphic({ lines }: GraphicProps) {
  return (
    <Draft lines={lines} pose="dalia-read">
      <Panel>
        <span lang="ar" style={{ ...AR, fontSize: 96, color: '#8B1A1E' }}>{lines >= 1 ? 'قِطَار' : 'ق ط ا ر'}</span>
        {lines >= 3 && <span className="mt-2 font-sans font-bold" style={{ fontSize: 22, color: soft('light') }}>alif lets go of the next letter: a little gap</span>}
      </Panel>
    </Draft>
  );
}

export function LawDotsGraphic({ lines }: GraphicProps) {
  const ch = lines >= 3 ? 'ث' : lines >= 2 ? 'ب' : '';
  return (
    <Draft lines={lines} pose="hibr-glasses" h={300}>
      <Svg>
        {lines >= 1 && <WriteLetter key="body" ch="ب" x={1020} y={560} size={360} color={CRIMSON} dots={false} />}
        {lines >= 2 && <WriteLetter key={ch} ch={ch} x={1020} y={560} size={360} color={CRIMSON} instant />}
        {lines >= 3 && (
          <>
            <WriteLetter ch="ت" x={860} y={760} size={150} color={TEAL} instant />
            <WriteLetter ch="ب" x={1180} y={760} size={150} color={GOLD} instant />
          </>
        )}
      </Svg>
    </Draft>
  );
}

export function LawMarksGraphic({ lines }: GraphicProps) {
  return (
    <Draft lines={lines} pose="rami-point" flip>
      <Panel>
        <Hear id="ba"><span lang="ar" style={{ ...AR, fontSize: 150, color: '#8B1A1E' }}>{lines >= 2 ? 'بَ' : 'ب'}</span></Hear>
        {lines >= 2 && <span className="font-sans font-black" style={{ fontSize: 44, color: CRIMSON }}>ba</span>}
      </Panel>
    </Draft>
  );
}

export function LawSoundsGraphic({ lines, items }: GraphicProps) {
  const ids = ['haa', 'ayn', 'khaa', 'qaaf'];
  return (
    <Draft lines={lines} pose={lines >= 3 ? 'hibr-oops' : 'hibr-glasses'} h={300}>
      <div className="pointer-events-none absolute flex gap-5" dir="rtl" style={{ left: 800, top: 260 }}>
        {['ح', 'ع', 'خ', 'ق'].map((c, i) => (items > i || lines >= 2) && (
          <motion.div key={c} className="pointer-events-auto flex items-center justify-center rounded-[24px]" style={{ width: 120, height: 140, background: '#FFFDF8', boxShadow: '0 20px 40px -24px rgba(60,30,10,0.55)' }}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.4, delay: i * 0.15 }}>
            <Hear id={ids[i]}><span lang="ar" style={{ ...AR, fontSize: 84, color: '#8B1A1E' }}>{c}</span></Hear>
          </motion.div>
        ))}
      </div>
    </Draft>
  );
}

export function LawAlifGraphic({ lines }: GraphicProps) {
  return (
    <Draft lines={lines} pose={lines >= 4 ? 'rami-write' : 'dalia-wave'}>
      <Svg>{lines >= 1 && <WriteLetter key={lines >= 2 ? 'b' : 'a'} ch="ا" x={1020} y={640} size={460} width={34} color={CRIMSON} />}</Svg>
      {lines >= 1 && <div className="absolute" style={{ left: 940, top: 230, width: 160, height: 420 }}><Hear id="alif"><span style={{ display: 'block', width: 160, height: 420 }} /></Hear></div>}
    </Draft>
  );
}

export function LawTrueGraphic({ lines }: GraphicProps) {
  return <Draft lines={lines} pose="dalia-think" />;
}

export function LawReadGraphic({ lines }: GraphicProps) {
  return (
    <Draft lines={lines} pose="dalia-read">
      <Panel top={190}><Hear id="qitar-al-huruf"><span lang="ar" style={{ ...AR, fontSize: 92, color: '#8B1A1E' }}>{SIGN}</span></Hear></Panel>
    </Draft>
  );
}

export function LawStampGraphic({ lines }: GraphicProps) {
  useCue('stamp', lines >= 1, 0.5);
  return (
    <Draft lines={lines} pose="rami-cheer">
      <Svg>
        <Track x0={760} x1={1300} y={560} />
        <motion.g initial={{ x: 300 }} animate={{ x: 0 }} transition={{ duration: 1.4, ease }}>
          <Train x={800} y={560} s={0.55} cars={lines >= 2 ? 1 : 0} letters={['ا']} />
        </motion.g>
      </Svg>
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black" style={{ left: 900, top: 620, width: 130, height: 130, border: `6px solid ${CRIMSON}`, color: CRIMSON, fontSize: 52 }}
          initial={{ scale: 2.4, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ type: 'spring', bounce: 0.35, delay: 0.4 }}>1</motion.div>
      )}
    </Draft>
  );
}

export function LawNextGraphic({ lines }: GraphicProps) {
  return (
    <Draft lines={lines} pose="hibr-fly" h={300}>
      <Svg>
        {lines >= 2 && ['ث', 'ت', 'ب'].map((c, i) => <WriteLetter key={c} ch={c} x={860 + i * 190} y={560} size={170} color={[GOLD, TEAL, CRIMSON][i]} delay={i * 0.4} />)}
      </Svg>
    </Draft>
  );
}
