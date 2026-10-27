import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useCue } from '../sfx';
import { bezier, useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw } from './kit';
import { Hear } from '../Say';
import { WorldScene, AlphabetScene, JoinScene, DotsScene, MarksScene, SoundsScene, AlifScene, NextBodies, Tag } from './g-welcome';

/**
 * Literacy A · Adults · Lesson 1 · Welcome to Arabic. The Reading Map (docs/curriculum/literacy/PLAN.md): a clean route on
 * a paper map from "I can't read a word" to "I can read anything", with milestones. No cast for Adults (DECISIONS §13).
 * The owner approved the look on the cover, the map and right to left (2026-10-27); every page follows it. The
 * explaining moments are shared with Teens (g-welcome.tsx).
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

/* ---------- 2 · a sign you can't read ---------- */

const SIGN_AT = { x: 900, y: 220, w: 560 };
// Inside the sign board (RTL): the second word, الْخُضَارِ, sits on the left half.
const WORD2 = { left: 915, width: 285, top: SIGN_AT.y + 92 + 22 };

export function LwaSignGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  useCue('oops', lines >= 2, 1.8);
  useCue('pop', lines >= 3, 0.4);
  return (
    <>
      {lines >= 1 && <ShopSign x={SIGN_AT.x} y={SIGN_AT.y} w={SIGN_AT.w} />}
      {/* the eye goes to the left, the English way: the reading dot walks left to right and finds nothing */}
      {lines >= 2 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-full" style={{ top: SIGN_AT.y + 240, left: SIGN_AT.x + 20, width: 24, height: 24, background: TEAL, boxShadow: `0 0 0 7px ${TEAL}33` }}
            initial={{ x: 0, opacity: 1 }} animate={{ x: reduce ? 0 : 500, opacity: [1, 1, 0] }} transition={{ duration: 1.6, ease: [0.45, 0, 0.55, 1] }} />
          <motion.span className="pointer-events-none absolute font-sans font-black" style={{ left: 1480, top: 300, fontSize: 64, color: CRIMSON }}
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.6, duration: 0.5 }}>?</motion.span>
          <Tag tone="light" x={1010} y={SIGN_AT.y + 280} color={TEAL} delay={0.2}>from the left →</Tag>
        </>
      )}
      {/* where does one letter end? dashed frames hover over the line, unsure */}
      {lines >= 3 && [0, 1, 2].map((i) => (
        <motion.span key={i} className="pointer-events-none absolute rounded-[10px]" style={{ top: SIGN_AT.y + 92, left: 980 + i * 150, width: 110, height: 110, border: `3px dashed ${GOLD}` }}
          initial={{ opacity: 0, scale: 0.8 }} animate={reduce ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 0.5], scale: 1, x: [0, 12, -8, 0] }} transition={{ duration: 1.6, delay: i * 0.3 }} />
      ))}
      {lines >= 3 && <Tag tone="light" x={1180} y={SIGN_AT.y + 360} color="#B07A1E" delay={0.6}>one letter? two? where is the gap?</Tag>}
    </>
  );
}

/* ---------- the explaining pages, shared with Teens ---------- */

export function LwaWorldGraphic({ lines, tone }: GraphicProps) {
  return <WorldScene lines={lines} tone={tone} third="one script, every country" />;
}

export function Lwa28Graphic({ lines, interaction, tone }: GraphicProps) {
  return <AlphabetScene lines={lines} interaction={interaction} tone={tone} />;
}

export function LwaHandsGraphic({ lines, tone }: GraphicProps) {
  return <JoinScene lines={lines} tone={tone} />;
}

export function LwaDotsGraphic({ lines, tone }: GraphicProps) {
  return <DotsScene lines={lines} tone={tone} rule="count the dots first" />;
}

/** The marks, then the same sign as it is really printed: no marks. */
export function LwaMarksGraphic({ lines, tone }: GraphicProps) {
  return (
    <MarksScene lines={lines} tone={tone} last={
      <motion.div className="pointer-events-none absolute flex flex-col items-center rounded-[20px]" style={{ ...CARD, left: 1270, top: 460, width: 260, padding: '10px 0 12px' }}
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', bounce: 0.3 }}>
        <span className="font-sans font-extrabold uppercase" style={{ fontSize: 13, letterSpacing: '0.14em', color: TEAL }}>on a real sign</span>
        <span lang="ar" style={{ ...AR, fontSize: 44, lineHeight: 1.4, color: DEEP }}>سوق الخضار</span>
        <span className="font-sans font-bold" style={{ fontSize: 15, color: soft('light') }}>no marks at all</span>
      </motion.div>
    } />
  );
}

export function LwaSoundsGraphic({ lines, items, tone }: GraphicProps) {
  return <SoundsScene lines={lines} items={items} tone={tone} />;
}

export function LwaAlifGraphic({ lines, tone }: GraphicProps) {
  return <AlifScene lines={lines} tone={tone} example="f·aa·ther" />;
}

/* ---------- 11 · true or false: the map waits at stop 1 ---------- */

export function LwaTrueGraphic(_: GraphicProps) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center justify-center rounded-[22px]" style={{ ...CARD, left: 1330, top: 560, width: 200, height: 200, background: MAP_PAPER }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.4 }}>
      <svg width={140} height={110} viewBox="0 0 140 110" className="overflow-visible">
        <path d="M 120 90 C 80 100, 40 90, 30 60 C 20 30, 60 20, 110 20" fill="none" stroke="rgba(31,22,18,0.4)" strokeWidth={3} strokeDasharray="3 8" strokeLinecap="round" />
        <circle cx={120} cy={90} r={9} fill={CRIMSON} />
        <circle cx={110} cy={20} r={6} fill="#8B4A9C" />
      </svg>
      <span className="font-sans font-black" style={{ fontSize: 16, color: CRIMSON }}>stop 1 · check</span>
    </motion.div>
  );
}

/* ---------- 12 · back to the sign ---------- */

export function LwaReadGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  useCue('sparkle', lines >= 1, 0.3);
  useCue('whoosh', lines >= 1, 0.9);
  return (
    <>
      {lines >= 1 && <ShopSign x={SIGN_AT.x} y={SIGN_AT.y} w={SIGN_AT.w} />}
      {lines >= 1 && (
        <>
          <motion.span className="pointer-events-none absolute rounded-full" style={{ left: SIGN_AT.x + SIGN_AT.w - 30, top: SIGN_AT.y + 70, width: 34, height: 34, background: GOLD, boxShadow: `0 0 18px ${GOLD}` }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} />
          <motion.div className="pointer-events-none absolute rounded-full" style={{ top: SIGN_AT.y + 240, left: SIGN_AT.x + 500, width: 24, height: 24, background: CRIMSON, boxShadow: `0 0 0 7px ${CRIMSON}33` }}
            initial={{ x: 0 }} animate={{ x: reduce ? 0 : -480 }} transition={{ duration: 2, delay: 0.8, ease: [0.45, 0, 0.55, 1] }} />
          <Tag tone="light" x={1260} y={SIGN_AT.y + 280} color={CRIMSON} solid delay={0.4}>← start on the right</Tag>
        </>
      )}
      {/* the second word, framed: alif is in it twice */}
      {lines >= 2 && (
        <>
          <motion.span className="pointer-events-none absolute rounded-[14px]" style={{ left: WORD2.left, top: WORD2.top - 10, width: WORD2.width, height: 120, border: `4px solid ${GOLD}` }}
            initial={{ opacity: 0, scale: 1.2 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, delay: 0.3 }} />
          <Tag tone="light" x={WORD2.left + WORD2.width / 2} y={WORD2.top + 200} color={TEAL} delay={0.8}>second word · alif × 2</Tag>
        </>
      )}
    </>
  );
}

/* ---------- 13 · first milestone ---------- */

export function LwaMilestoneGraphic({ lines }: GraphicProps) {
  useCue('stamp', lines >= 1, 1.1);
  const start = STOPS[0];
  if (lines < 1) return null;
  return (
    <>
      <Route step={2} />
      <Svg>
        <motion.g initial={{ scale: 3, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
          transition={{ type: 'spring', bounce: 0.35, delay: 1 }}>
          <circle cx={start.x} cy={start.y} r={30} fill="rgba(197,31,36,0.12)" stroke={CRIMSON} strokeWidth={5} />
          <path d={`M ${start.x - 13} ${start.y} l 9 10 l 18 -20`} fill="none" stroke={CRIMSON} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </Svg>
      <Flag x={start.x - 110} y={start.y - 84} label="Milestone 1 ✓ How Arabic works" color={CRIMSON} strong delay={1.4} />
      {lines >= 2 && <Flag x={1100} y={420} label="Mission: find alif this week" color={TEAL} delay={0.4} />}
    </>
  );
}

/* ---------- 14 · next time ---------- */

export function LwaNextGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  useCue('pop', lines >= 2, 0.3);
  useCue('pop', lines >= 3, 0.6);
  const two = STOPS[1];
  return (
    <>
      <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 2 ? 0.35 : 1 }} transition={{ duration: 0.8 }}>
        <Route step={2} />
        <Svg>
          <motion.circle cx={two.x} cy={two.y} r={20} fill="none" stroke={TEAL} strokeWidth={4} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
            animate={reduce ? { opacity: 1 } : { scale: [0.6, 1.6], opacity: [1, 0] }} transition={{ duration: 1.6, repeat: reduce ? 0 : Infinity }} />
        </Svg>
      </motion.div>
      {lines >= 1 && <Flag x={two.x - 60} y={two.y - 84} label="Next stop: the letters" color={TEAL} strong delay={0.4} />}
      <NextBodies lines={lines} tone={tone} y={470} />
      {lines >= 3 && <Tag tone={tone} x={1110} y={540} color="#B07A1E" delay={0.8}>one body · three letters</Tag>}
    </>
  );
}
