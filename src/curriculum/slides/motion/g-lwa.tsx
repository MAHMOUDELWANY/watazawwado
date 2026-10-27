import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useCue } from '../sfx';
import { bezier, useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw } from './kit';
import { Hear } from '../Say';

/**
 * Literacy A · Adults · Lesson 1 · Welcome to Arabic. The Reading Map (docs/curriculum/literacy/PLAN.md): a clean route on
 * a paper map from "I can't read a word" to "I can read anything", with milestones. No cast for Adults (DECISIONS §13).
 * Prototype pages (cover, the map, right to left) for the owner's review before the rest is built.
 */

const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };
const SIGN = 'سُوقُ الْخُضَارِ';
const MAP_PAPER = '#FBF6EC';
const CARD: React.CSSProperties = { background: '#FFFDF8', boxShadow: '0 26px 50px -28px rgba(60,30,10,0.45), 0 0 0 1px rgba(31,22,18,0.06)' };
const DEEP = '#8B1A1E';

/* ---------- the route: 26 stops, right to left, bottom to top ---------- */

const SEGS: number[][][] = [
  [[1480, 730], [1300, 760], [1080, 740], [960, 650]],
  [[960, 650], [840, 560], [1040, 500], [1260, 520]],
  [[1260, 520], [1500, 540], [1480, 360], [1240, 330]],
  [[1240, 330], [1060, 310], [940, 300], [850, 230]],
];
const ROUTE_D = SEGS.map((s, i) => `${i ? '' : `M ${s[0][0]} ${s[0][1]} `}C ${s[1].join(' ')}, ${s[2].join(' ')}, ${s[3].join(' ')}`).join(' ');
const DENSE = SEGS.flatMap((s, i) => bezier(s[0], s[1], s[2], s[3], 80).slice(i ? 1 : 0));
const STOPS = (() => {
  const len = [0];
  for (let i = 1; i < DENSE.length; i++) len.push(len[i - 1] + Math.hypot(DENSE[i].x - DENSE[i - 1].x, DENSE[i].y - DENSE[i - 1].y));
  const total = len[len.length - 1];
  return Array.from({ length: 26 }, (_, k) => DENSE[Math.max(0, len.findIndex((l) => l >= (total * k) / 25))]);
})();
// literacy/PLAN.md, Teens and Adults: the parts and their first lesson.
const STAGES = [
  { name: 'Start', from: 1, to: 1, color: CRIMSON, dx: 30, dy: 44 },
  { name: 'The Letters', from: 2, to: 7, color: TEAL, dx: 0, dy: 46 },
  { name: 'Joining', from: 8, to: 10, color: '#E0603F', dx: -96, dy: 0 },
  { name: 'Vowels and Marks', from: 11, to: 18, color: '#2B4FA8', dx: 0, dy: 50 },
  { name: 'Without Marks', from: 19, to: 21, color: '#7A9A2E', dx: 0, dy: -40 },
  { name: 'The Real World', from: 22, to: 26, color: '#8B4A9C', dx: 0, dy: 44 },
];
const stageOf = (n: number) => STAGES.find((s) => n >= s.from && n <= s.to)!;
const MILESTONES = [
  { at: 1, label: 'How Arabic works', dx: 0, dy: -86 },
  { at: 2, label: 'First word', dx: -40, dy: 26 },
  { at: 18, label: 'First paragraph', dx: 0, dy: -78 },
  { at: 19, label: 'No vowel marks', dx: 10, dy: 60 },
  { at: 23, label: 'First menu', dx: 0, dy: -78 },
  { at: 26, label: 'I can read anything', dx: 40, dy: -74 },
];

function Route({ step }: { step: number }) {
  const reduce = useReduce();
  return (
    <Svg>
      <motion.rect x={790} y={190} width={780} height={630} rx={18} fill={MAP_PAPER} stroke="rgba(31,22,18,0.10)" strokeWidth={2}
        initial={{ opacity: 0, scaleX: 0.2 }} animate={{ opacity: 1, scaleX: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '100% 50%' }} transition={{ duration: 0.9, ease }} />
      {/* map folds */}
      {[1050, 1310].map((x) => <line key={x} x1={x} y1={190} x2={x} y2={820} stroke="rgba(31,22,18,0.06)" strokeWidth={3} />)}
      <Draw d={ROUTE_D} color="rgba(31,22,18,0.45)" width={4} dash="3 12" dur={2.2} delay={0.5} />
      {step >= 2 && STAGES.map((s, i) => {
        const mid = STOPS[Math.round((s.from + s.to) / 2) - 1];
        return (
          <motion.text key={s.name} x={mid.x + s.dx} y={mid.y + s.dy} textAnchor="middle" fontSize={19} fontWeight={800} fill={s.color} className="font-sans"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 + i * 0.2 }}>{s.name}</motion.text>
        );
      })}
      {step >= 1 && STOPS.map((p, k) => (
        <motion.circle key={k} cx={p.x} cy={p.y} r={k === 0 ? 12 : 8} fill={step >= 2 ? stageOf(k + 1).color : '#FFFDF8'} stroke={step >= 2 ? '#FFFDF8' : 'rgba(31,22,18,0.4)'} strokeWidth={3}
          initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
          transition={{ type: 'spring', bounce: 0.5, delay: reduce ? 0 : 0.8 + k * 0.05 }} />
      ))}
    </Svg>
  );
}

function Flag({ x, y, label, color, delay = 0, strong = false }: { x: number; y: number; label: string; color: string; delay?: number; strong?: boolean }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center" style={{ left: x - 110, top: y, width: 220 }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.4, delay }}>
      <span className="whitespace-nowrap rounded-full font-sans font-black" style={{ fontSize: strong ? 20 : 16, padding: strong ? '6px 16px' : '4px 12px', background: strong ? color : '#FFFDF8', color: strong ? '#fff' : color, boxShadow: '0 10px 20px -12px rgba(60,30,10,0.5)', border: strong ? undefined : `2px solid ${color}` }}>{label}</span>
    </motion.div>
  );
}

export function LwaMapGraphic({ lines }: GraphicProps) {
  useCue('page', lines >= 1, 0.2);
  useCue('pop', lines >= 2, 0.6);
  useCue('sparkle', lines >= 3, 0.3);
  useCue('chime', lines >= 4, 0.5);
  const start = STOPS[0];
  return (
    <>
      <Route step={lines >= 2 ? 2 : 1} />
      {lines >= 2 && (
        <motion.span className="pointer-events-none absolute font-sans font-bold" style={{ left: 816, top: 786, fontSize: 18, color: soft('light') }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
          26 lessons · 6 stages
        </motion.span>
      )}
      {lines >= 3 && MILESTONES.slice(1).map((m, i) => {
        const p = STOPS[m.at - 1];
        return <Flag key={m.at} x={p.x + m.dx} y={p.y + m.dy} label={m.label} color={stageOf(m.at).color} delay={0.2 + i * 0.25} />;
      })}
      {lines >= 4 && (
        <>
          <Flag x={start.x - 110} y={start.y - 74} label="You are here · How Arabic works" color={CRIMSON} strong delay={0.4} />
          <Svg>
            <motion.circle cx={start.x} cy={start.y} r={22} fill="none" stroke={CRIMSON} strokeWidth={4} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
              initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: [0.6, 1.8], opacity: [1, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: 0.6 }} />
          </Svg>
        </>
      )}
    </>
  );
}

/* ---------- 0 · cover: a shop sign at the start of the route ---------- */

function ShopSign({ x, y, w = 560, delay = 0 }: { x: number; y: number; w?: number; delay?: number }) {
  return (
    <motion.div className="absolute" style={{ left: x, top: y, width: w }}
      initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.3, duration: 1.1, delay }}>
      {/* the awning */}
      <div className="flex overflow-hidden rounded-t-[14px]" style={{ height: 46 }}>
        {Array.from({ length: 10 }, (_, i) => <span key={i} style={{ flex: 1, background: i % 2 ? '#FFFDF8' : TEAL }} />)}
      </div>
      <div className="flex" style={{ height: 18 }}>
        {Array.from({ length: 10 }, (_, i) => <span key={i} style={{ flex: 1, background: i % 2 ? '#FFFDF8' : TEAL, borderBottomLeftRadius: 999, borderBottomRightRadius: 999 }} />)}
      </div>
      <div className="pointer-events-auto mt-3 flex items-center justify-center rounded-[16px]" style={{ height: 130, background: DEEP, boxShadow: '0 24px 40px -22px rgba(60,20,10,0.7), inset 0 0 0 5px rgba(229,169,60,0.5)' }}>
        <Hear id="suq-al-khudar"><span lang="ar" style={{ ...AR, fontSize: 76, color: '#FFF3D6' }}>{SIGN}</span></Hear>
      </div>
    </motion.div>
  );
}

export function LwaCoverGraphic(_: GraphicProps) {
  useCue('page', 1, 0.3);
  useCue('pen', 1, 1.6);
  return (
    <>
      <Route step={1} />
      <ShopSign x={900} y={340} w={560} delay={1.4} />
      <Svg>
        {/* the first step on the route: a pin drops on stop 1 */}
        <motion.g initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 2.4 }}>
          <path d={`M ${STOPS[0].x} ${STOPS[0].y - 6} c -20 -26, -26 -40, -26 -52 a 26 26 0 0 1 52 0 c 0 12, -6 26, -26 52 z`} fill={CRIMSON} />
          <circle cx={STOPS[0].x} cy={STOPS[0].y - 58} r={9} fill="#FFFDF8" />
        </motion.g>
      </Svg>
    </>
  );
}

/* ---------- 4 · right to left ---------- */

function ReadLine({ y, dir, color, label, children, delay = 0 }: { y: number; dir: 'ltr' | 'rtl'; color: string; label: string; children: React.ReactNode; delay?: number }) {
  const ltr = dir === 'ltr';
  return (
    <motion.div className="pointer-events-none absolute rounded-[22px]" style={{ ...CARD, left: 820, top: y, width: 680, height: 140 }}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.25, duration: 0.8, delay }}>
      <span className="absolute font-sans font-extrabold uppercase" style={{ top: 12, [ltr ? 'left' : 'right']: 24, fontSize: 14, letterSpacing: '0.16em', color }}>{label}</span>
      <div className="pointer-events-auto absolute inset-x-0 flex justify-center" style={{ top: 26 }}>{children}</div>
      <motion.div className="absolute rounded-full" style={{ bottom: 18, left: 120, width: 440, height: 5, background: color, transformOrigin: ltr ? 'left' : 'right' }}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.6, delay: delay + 0.6, ease: [0.45, 0, 0.55, 1] }} />
      <motion.span className="absolute font-sans font-black" style={{ bottom: 4, [ltr ? 'right' : 'left']: 60, fontSize: 32, color }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 2.2 }}>{ltr ? '→' : '←'}</motion.span>
    </motion.div>
  );
}

export function LwaRtlGraphic({ lines }: GraphicProps) {
  useCue('pen', lines >= 1, 0.7);
  useCue('pen', lines >= 2, 0.7);
  useCue('page', lines >= 3, 0.6);
  useCue('pop', lines >= 4, 0.4);
  return (
    <>
      {lines >= 1 && (
        <ReadLine y={170} dir="ltr" color={TEAL} label="English">
          <span className="font-serif" style={{ fontSize: 58, lineHeight: 1.1, color: INK_TEXT }}>Vegetable Market</span>
        </ReadLine>
      )}
      {lines >= 2 && (
        <ReadLine y={340} dir="rtl" color={CRIMSON} label="Arabic">
          <Hear id="suq-al-khudar"><span lang="ar" style={{ ...AR, fontSize: 64, lineHeight: 1.2, color: DEEP }}>{SIGN}</span></Hear>
        </ReadLine>
      )}
      {/* a menu folds open from the right-hand side */}
      {lines >= 3 && (
        <motion.div className="pointer-events-none absolute" style={{ left: 860, top: 530, width: 300, height: 230 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="absolute inset-0 rounded-[8px]" style={{ ...CARD, backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 22px, rgba(31,22,18,0.10) 22px 24px)', backgroundPosition: '0 40px' }} />
          <motion.div className="absolute rounded-[8px]" style={{ right: 0, top: 0, width: 150, height: 230, background: TEAL, transformOrigin: 'left' }}
            initial={{ scaleX: 1 }} animate={{ scaleX: -1 }} transition={{ duration: 1.2, delay: 0.6, ease }} />
          <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ top: 240, fontSize: 17, color: soft('light') }}>opens from the right</span>
        </motion.div>
      )}
      {/* numbers: the one thing that still goes left to right */}
      {lines >= 4 && (
        <motion.div className="pointer-events-none absolute flex flex-col items-center rounded-[22px]" style={{ ...CARD, left: 1220, top: 540, width: 280, padding: '14px 0 18px' }}
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.35 }}>
          <span className="font-sans font-extrabold uppercase" style={{ fontSize: 14, letterSpacing: '0.16em', color: GOLD }}>The exception</span>
          <span className="mt-1 font-sans font-black" style={{ fontSize: 64, lineHeight: 1.1, color: INK_TEXT, direction: 'ltr' }}>2026</span>
          <motion.span className="rounded-full" style={{ width: 180, height: 5, background: GOLD, transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.6, ease }} />
          <span className="mt-3 font-sans font-bold" style={{ fontSize: 17, color: soft('light') }}>numbers: left to right →</span>
        </motion.div>
      )}
    </>
  );
}
