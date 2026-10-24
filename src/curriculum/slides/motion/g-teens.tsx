import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useCue } from '../sfx';
import { Orb, bezier, useReduce, soft, INK_TEXT, type GraphicProps } from './Stage';
import { Cut, Person, Bubble } from './kit';

/**
 * Teens motion stages (2026-10-24): the Adults system, bolder and quicker. Thick ink, stamps, red string on a case
 * board, an argument that tests each option. Our own cast (Zayn, Noor, Ethan…) stand on the stage as the investigators.
 */

const TEENS = 'zad-teens/characters';
const fast = { duration: 0.5, ease };

/** A rubber stamp that thumps on at an angle. */
function Stamp({ x, y, text, color = CRIMSON, rotate = -8, delay = 0, size = 30 }: { x: number; y: number; text: string; color?: string; rotate?: number; delay?: number; size?: number }) {
  return (
    <motion.span className="absolute whitespace-nowrap rounded-[8px] font-sans font-black uppercase" style={{ left: x, top: y, padding: '6px 14px', fontSize: size, letterSpacing: '0.08em', color, border: `4px solid ${color}`, background: 'rgba(255,253,248,0.85)' }}
      initial={{ opacity: 0, scale: 2.2, rotate }} animate={{ opacity: 1, scale: 1, rotate }} transition={{ type: 'spring', bounce: 0.25, duration: 0.45, delay }}>
      {text}
    </motion.span>
  );
}

/** An evidence card pinned to the board. */
function Evidence({ x, y, title, children, delay = 0, tilt = -2 }: { x: number; y: number; title: string; children?: React.ReactNode; delay?: number; tilt?: number }) {
  return (
    <motion.div className="absolute" style={{ left: x, top: y, width: 300, padding: '16px 18px 18px', background: '#FFFDF8', boxShadow: '0 24px 44px -24px rgba(30,10,5,0.6), 0 0 0 1px rgba(31,22,18,0.08)' }}
      initial={{ opacity: 0, y: -30, rotate: tilt * 3 }} animate={{ opacity: 1, y: 0, rotate: tilt }} transition={{ type: 'spring', bounce: 0.3, duration: 0.6, delay }}>
      <span className="absolute rounded-full" style={{ left: 140, top: -9, width: 18, height: 18, background: CRIMSON, boxShadow: '0 3px 6px rgba(0,0,0,0.35)' }} />
      <p className="m-0 font-sans font-black uppercase" style={{ fontSize: 24, lineHeight: 1.05, color: INK_TEXT, letterSpacing: '0.02em' }}>{title}</p>
      {children}
    </motion.div>
  );
}

/* ======================================================================================================================
 * Teens L1 · Something doesn't add up. A case board: Madinah in the middle of the desert, roads in from every side; a
 * traveller arrives and the road sticks to him (dust, cracked lips, tired eyes); a clean arrival is stamped LOCAL; then
 * the town's web of people, his strings that don't hold, NOT LOCAL; red string ties the two: CONTRADICTION. Zayn is on
 * the case.
 * ==================================================================================================================== */

const M = { x: 1150, y: 500 };
const ROADS = [
  { from: [780, 800], c1: [850, 640] },
  { from: [1540, 260], c1: [1400, 300] },
  { from: [800, 230], c1: [900, 330] },
];
const T_ROUTE = bezier([780, 800], [850, 640], [1000, 560], [M.x - 90, M.y + 30], 36);
const PEOPLE = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + 0.2;
  const r = i % 2 ? 170 : 115;
  return { x: M.x + Math.cos(a) * r * 1.35, y: M.y + Math.sin(a) * r * 0.9 };
});

export function TeensStrangerGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  const map = lines >= 1 && lines < 4;
  const town = lines >= 4;
  useCue('pen', lines >= 1);
  useCue('sand', lines >= 2, 0.3);
  useCue('stamp', lines >= 3, 0.9);
  useCue('whoosh', lines >= 4);
  useCue('stamp', lines >= 4, 2.2);
  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {map && (
          <motion.div key="map" className="absolute inset-0" style={{ transformOrigin: `${M.x}px ${M.y}px` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 2.4, transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] } }}>
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
              {ROADS.map((r, i) => (
                <motion.path key={i} d={`M ${r.from[0]} ${r.from[1]} Q ${r.c1[0]} ${r.c1[1]} ${M.x} ${M.y}`} fill="none" stroke={INK_TEXT} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: reduce ? 0 : i * 0.2, ease }} />
              ))}
              <motion.circle cx={M.x} cy={M.y} r={92} fill="rgba(197,31,36,0.08)" stroke={CRIMSON} strokeWidth={4} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            </svg>
            <span className="absolute -translate-x-1/2 font-sans font-black uppercase" style={{ left: M.x, top: M.y - 18, fontSize: 26, letterSpacing: '0.08em', color: CRIMSON }}>Madinah</span>
            <span className="absolute font-sans font-black uppercase" style={{ left: 820, top: 610, fontSize: 18, letterSpacing: '0.3em', color: soft('light') }}>desert · days</span>
            <span className="absolute font-sans font-black uppercase" style={{ left: 1330, top: 330, fontSize: 18, letterSpacing: '0.3em', color: soft('light') }}>desert · days</span>
            {/* 2. a traveller comes in, and the road sticks to him */}
            {lines >= 2 && (
              <>
                {T_ROUTE.filter((_, i) => i % 3 === 0).map((p, i) => (
                  <motion.span key={i} className="absolute rounded-full" style={{ left: p.x, top: p.y, width: 8, height: 8, background: '#B98A5A' }}
                    initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0.3], scale: [0.5, 1.4, 2], y: [0, -8, -16] }} transition={{ duration: 1.2, delay: reduce ? 0 : 0.2 + i * 0.08 }} />
                ))}
                <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 780, y: 800 }} animate={{ x: T_ROUTE.map((p) => p.x), y: T_ROUTE.map((p) => p.y) }} transition={{ duration: reduce ? 0 : 1.4, ease: 'easeInOut' }}>
                  <Orb size={28} style={{ filter: 'sepia(0.7) saturate(0.6) brightness(0.85)' }} />
                </motion.div>
                {['dust', 'cracked lips', 'tired eyes'].map((t, i) => (
                  <Stamp key={t} x={820 + i * 30} y={680 + i * 46} text={t} color="#8B5A2B" rotate={-6 + i * 4} size={20} delay={1.3 + i * 0.25} />
                ))}
              </>
            )}
            {/* 3. a clean arrival would be a local */}
            {lines >= 3 && (
              <Evidence x={1170} y={200} title="Arrives clean" delay={0.2} tilt={2}>
                <div className="relative mt-3 h-[96px]"><div className="absolute" style={{ left: 40, top: 35 }}><Orb size={44} glow={1.3} /></div>
                  <span className="absolute font-sans font-bold" style={{ left: 90, top: 22, fontSize: 18, color: soft('light') }}>no sign of travel</span></div>
                <Stamp x={150} y={104} text="Local" color={TEAL} rotate={-10} delay={0.7} size={26} />
              </Evidence>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. inside the town: everyone knows everyone, nobody knows him */}
      <AnimatePresence>
        {town && (
          <motion.div key="town" className="absolute inset-0" style={{ transformOrigin: `${M.x}px ${M.y}px` }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2, ease }}>
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
              {PEOPLE.flatMap((p, i) => PEOPLE.slice(i + 1).filter((q) => Math.hypot(p.x - q.x, p.y - q.y) < 260).map((q, j) => (
                <motion.line key={`${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={INK_TEXT} strokeWidth={2} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} transition={{ duration: 0.4, delay: reduce ? 0 : 0.3 + (i + j) * 0.03 }} />
              )))}
              {PEOPLE.slice(0, 6).map((p, i) => (
                <motion.line key={`x${i}`} x1={M.x} y1={M.y} x2={p.x} y2={p.y} stroke={CRIMSON} strokeWidth={4} strokeDasharray="8 8"
                  initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: [0, 0.7, 0.7], opacity: [1, 1, 0.1] }} transition={{ duration: 1.1, delay: reduce ? 0 : 0.8 + i * 0.08, times: [0, 0.5, 1] }} />
              ))}
              {/* the red string between the two cards */}
              <motion.path d="M 1010 300 C 1100 380, 1220 380, 1310 300" fill="none" stroke={CRIMSON} strokeWidth={4} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 1.8 }} />
            </svg>
            {PEOPLE.map((p, i) => (
              <motion.span key={i} className="absolute rounded-full" style={{ left: p.x - 10, top: p.y - 10, width: 20, height: 20, background: INK_TEXT }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: reduce ? 0 : i * 0.03 }} />
            ))}
            <div className="absolute" style={{ left: M.x, top: M.y }}><Orb size={44} glow={1.4} /></div>
            <span className="absolute -translate-x-1/2 whitespace-nowrap font-sans font-black uppercase" style={{ left: M.x, top: M.y + 200, fontSize: 20, letterSpacing: '0.12em', color: INK_TEXT }}>everyone knew everyone</span>
            <Evidence x={780} y={190} title="Arrives clean" tilt={-3}><div className="h-[48px]" /><Stamp x={70} y={58} text="Local" color={TEAL} rotate={-10} size={24} /></Evidence>
            <Evidence x={1170} y={190} title="Nobody knew him" delay={0.9} tilt={3}><div className="h-[48px]" /><Stamp x={40} y={58} text="Not local" rotate={8} size={24} delay={1.3} /></Evidence>
            <Stamp x={940} y={400} text="Contradiction" rotate={-6} size={40} delay={2.2} />
          </motion.div>
        )}
      </AnimatePresence>
      {lines >= 1 && <Cut src={`${TEENS}/zayn-think`} x={1480} y={822} h={300} ratio={0.374} delay={0.4} bounce={0.15} />}
    </div>
  );
}

/* ======================================================================================================================
 * Teens L2 · Only three options. The universe as a disc of stars with a start line under it ("it began"); three slots,
 * and a fourth that is crossed out; a scan line tests them; then each option shows itself as a little experiment:
 * an empty box with an arrow that never reaches; a loop that has to exist before it exists; a cause outside the circle
 * with an arrow in. The learner calls the verdicts.
 * ==================================================================================================================== */

const U = { x: 1140, y: 330, r: 120 };
const SLOTS = [840, 1050, 1260];
const SLOT_Y = 560;
const STARS = Array.from({ length: 26 }, (_, i) => ({ a: i * 2.4, r: 18 + ((i * 37) % 95) }));

export function TeensOptionsGraphic({ lines, items }: GraphicProps) {
  const reduce = useReduce();
  useCue('reveal', lines >= 1, 0.3);
  useCue('strike', lines >= 2, 1.2);
  useCue('whoosh', lines >= 3);
  useCue('pop', items);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
            {/* the timeline: nothing to the left, a start point, then the universe */}
            <motion.line x1={800} y1={U.y} x2={U.x - U.r - 30} y2={U.y} stroke={soft('light')} strokeWidth={3} strokeDasharray="4 10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={fast} />
            <motion.circle cx={U.x} cy={U.y} r={U.r} fill="#1A1420" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.2, duration: 0.8, delay: 0.3 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
          </svg>
          {STARS.map((s, i) => (
            <motion.span key={i} className="absolute rounded-full" style={{ left: U.x + Math.cos(s.a) * s.r - 2, top: U.y + Math.sin(s.a) * s.r - 2, width: i % 4 ? 3 : 5, height: i % 4 ? 3 : 5, background: i % 3 ? '#FFF2CF' : GOLD }}
              initial={{ opacity: 0, x: -Math.cos(s.a) * s.r, y: -Math.sin(s.a) * s.r }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 1, delay: reduce ? 0 : 0.5 + i * 0.01, ease }} />
          ))}
          <motion.span className="absolute rounded-full" style={{ left: U.x - U.r - 40, top: U.y - 10, width: 20, height: 20, background: CRIMSON, boxShadow: `0 0 24px 6px ${CRIMSON}88` }} initial={{ scale: 0 }} animate={{ scale: [0, 1.6, 1] }} transition={{ duration: 0.5, delay: 0.2 }} />
          <span className="absolute font-sans font-black uppercase" style={{ left: U.x - U.r - 130, top: U.y + 22, fontSize: 18, letterSpacing: '0.12em', color: CRIMSON }}>it began</span>
          <span className="absolute font-sans font-black uppercase" style={{ left: 800, top: U.y - 40, fontSize: 16, letterSpacing: '0.12em', color: soft('light') }}>before: ?</span>
        </>
      )}
      {/* 2. three slots, and no fourth */}
      {lines >= 2 && SLOTS.map((x, i) => (
        <motion.div key={i} className="absolute rounded-[18px]" style={{ left: x - 98, top: SLOT_Y, width: 196, height: 170, border: `3px solid ${INK_TEXT}`, background: items > i ? '#FFFDF8' : 'rgba(255,253,248,0.5)' }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fast, delay: reduce ? 0 : i * 0.12 }}>
          <span className="absolute flex items-center justify-center rounded-full font-sans font-black text-white" style={{ left: -16, top: -16, width: 36, height: 36, fontSize: 20, background: INK_TEXT }}>{i + 1}</span>
        </motion.div>
      ))}
      {lines >= 2 && (
        <motion.div className="absolute" style={{ left: 1385, top: SLOT_Y + 20, width: 80, height: 130, border: `3px dashed ${soft('light')}`, borderRadius: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <span className="absolute inset-0 flex items-center justify-center font-sans font-black" style={{ fontSize: 34, color: soft('light') }}>4?</span>
          <motion.span className="absolute left-[-10px] top-1/2 h-[5px] w-[100px] origin-left rounded-full" style={{ background: CRIMSON, rotate: -30 }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3, delay: 1.2 }} />
        </motion.div>
      )}
      {/* 3. the test: a scan line passes over the slots */}
      {lines >= 3 && !reduce && (
        <motion.div className="absolute" style={{ top: SLOT_Y - 20, height: 210, width: 6, background: TEAL, boxShadow: `0 0 26px 8px ${TEAL}88`, borderRadius: 3 }}
          initial={{ left: 720, opacity: 0 }} animate={{ left: [720, 1380], opacity: [0, 1, 1, 0] }} transition={{ duration: 1.6, ease: 'easeInOut' }} />
      )}
      {lines >= 3 && <span className="absolute -translate-x-1/2 font-sans font-black uppercase" style={{ left: 1050, top: SLOT_Y + 190, fontSize: 18, letterSpacing: '0.16em', color: TEAL }}>test: can it actually happen?</span>}

      {/* the three experiments */}
      {items >= 1 && <OptionNothing x={SLOTS[0]} />}
      {items >= 2 && <OptionSelf x={SLOTS[1]} />}
      {items >= 3 && <OptionOutside x={SLOTS[2]} />}
      {lines >= 1 && <Cut src={`${TEENS}/noor-think`} x={1500} y={822} h={290} ratio={0.396} delay={0.5} bounce={0.15} />}
    </div>
  );
}

function SlotText({ x, text }: { x: number; text: string }) {
  return <motion.span className="absolute -translate-x-1/2 text-center font-sans font-black" style={{ left: x, top: SLOT_Y + 118, width: 200, fontSize: 17, lineHeight: 1.1, color: INK_TEXT }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>{text}</motion.span>;
}

/** Nothing at all: an empty box; the arrow towards the universe starts and never arrives. */
function OptionNothing({ x }: { x: number }) {
  return (
    <>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
        <rect x={x - 34} y={SLOT_Y + 30} width={68} height={60} rx={6} fill="none" stroke={INK_TEXT} strokeWidth={3} strokeDasharray="5 6" />
        <text x={x} y={SLOT_Y + 70} textAnchor="middle" fill={soft('light')} style={{ font: '900 24px var(--font-sans, sans-serif)' }}>0</text>
        <motion.path d={`M ${x + 40} ${SLOT_Y + 40} Q ${x + 120} ${SLOT_Y - 80} ${U.x - 90} ${U.y + 90}`} fill="none" stroke={CRIMSON} strokeWidth={4} strokeDasharray="6 8"
          initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: [0, 0.35, 0.35], opacity: [1, 1, 0.15] }} transition={{ duration: 1.8, times: [0, 0.5, 1] }} />
      </svg>
      <SlotText x={x} text="from nothing at all" />
    </>
  );
}

/** It made itself: a loop arrow round a little universe that would have to exist before it exists. */
function OptionSelf({ x }: { x: number }) {
  const reduce = useReduce();
  return (
    <>
      <motion.svg className="absolute overflow-visible" style={{ left: x - 50, top: SLOT_Y + 14, width: 100, height: 100 }} viewBox="-50 -50 100 100" animate={reduce ? {} : { rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
        <path d="M 34 -10 A 36 36 0 1 1 10 -34" fill="none" stroke={GOLD} strokeWidth={5} strokeLinecap="round" />
        <path d="M 4 -44 L 16 -34 L 2 -24" fill="none" stroke={GOLD} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
      <span className="absolute rounded-full" style={{ left: x - 16, top: SLOT_Y + 48, width: 32, height: 32, background: '#1A1420' }} />
      <SlotText x={x} text="made itself" />
    </>
  );
}

/** Something outside it: a cause outside the circle, and an arrow that goes in. */
function OptionOutside({ x }: { x: number }) {
  return (
    <>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
        <circle cx={x + 20} cy={SLOT_Y + 60} r={34} fill="#1A1420" />
        <motion.circle cx={x - 60} cy={SLOT_Y + 46} r={10} fill={TEAL} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
        <motion.path d={`M ${x - 48} ${SLOT_Y + 50} L ${x - 6} ${SLOT_Y + 58}`} fill="none" stroke={TEAL} strokeWidth={4} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3 }} />
      </svg>
      <SlotText x={x} text="something outside it" />
    </>
  );
}

/* ======================================================================================================================
 * Teens L3 · Two bosses. Test it small first: one shop rises. Two bosses step in, each with a power bar at 100%; total
 * power, nobody can stop them. Boss A: open — the shutter rolls up; Boss B: shut — it slams down; the shutter jams
 * between them. Who wins? Each branch strikes out one boss's "total" power.
 * ==================================================================================================================== */

const SHOP = { x: 960, y: 330, w: 320, h: 340 };

export function TeensBossesGraphic({ lines, items }: GraphicProps) {
  const reduce = useReduce();
  const shutter = items >= 2 ? 1 : items >= 1 ? 0.15 : 1; // fraction of the door covered
  const jam = items >= 2;
  useCue('brick', lines >= 1, 0.3);
  useCue('pop', lines >= 2);
  useCue('whoosh', items >= 1, 0.4);
  useCue('thud', items >= 2, 0.5);
  useCue('strike', items >= 3, 1);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute" style={{ left: SHOP.x, top: SHOP.y, width: SHOP.w, height: SHOP.h }} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.25, duration: 0.7 }}>
          {/* the shop front */}
          <div className="absolute inset-0 rounded-t-[14px]" style={{ background: '#E9DCC8', border: `4px solid ${INK_TEXT}` }} />
          <div className="absolute left-0 right-0 top-0 flex items-center justify-center rounded-t-[10px] font-sans font-black uppercase" style={{ height: 66, background: INK_TEXT, color: '#FFF8EC', fontSize: 30, letterSpacing: '0.3em' }}>Shop</div>
          {/* the doorway and its roller shutter */}
          <div className="absolute overflow-hidden" style={{ left: 40, right: 40, top: 96, bottom: 0, background: '#FFE7B0' }}>
            <motion.div className="absolute left-0 right-0 top-0" style={{ background: `repeating-linear-gradient(180deg, #8C8C8C 0 14px, #6F6F6F 14px 18px)` }} initial={false}
              animate={jam && !reduce ? { height: ['100%', '55%', '90%', '60%', '85%', '70%'] } : { height: `${shutter * 100}%` }}
              transition={jam && !reduce ? { duration: 2.4, delay: 0.6, ease: 'easeInOut' } : { type: 'spring', bounce: 0.15, duration: 0.9, delay: 0.4 }} />
          </div>
        </motion.div>
      )}
      {lines >= 1 && <span className="absolute -translate-x-1/2 font-sans font-black uppercase" style={{ left: SHOP.x + SHOP.w / 2, top: SHOP.y + SHOP.h + 14, fontSize: 18, letterSpacing: '0.16em', color: soft('light') }}>test it small first</span>}
      {/* 2–3. two bosses with total power */}
      {lines >= 2 && (
        <>
          <Person x={850} y={700} color={TEAL} scale={1.05} />
          <Person x={1390} y={700} color={CRIMSON} scale={1.05} flip />
          <PowerBar x={758} label="Boss A" color={TEAL} struck={items >= 3} strikeDelay={1.4} />
          <PowerBar x={1296} label="Boss B" color={CRIMSON} struck={items >= 3} strikeDelay={2.2} />
        </>
      )}
      {lines >= 3 && items < 3 && <span className="absolute -translate-x-1/2 whitespace-nowrap font-sans font-black uppercase" style={{ left: 1120, top: 200, fontSize: 22, letterSpacing: '0.12em', color: CRIMSON }}>nobody can stop them</span>}
      {items >= 1 && <Bubble x={830} y={472} text="Open the shop." delay={0.1} width={190} />}
      {items >= 2 && <Bubble x={1410} y={472} text="Keep it shut." delay={0.1} width={180} align="right" accent />}
      {items >= 3 && (
        <>
          <motion.p className="absolute m-0 -translate-x-1/2 font-sans font-black" style={{ left: 1120, top: 186, fontSize: 52, color: INK_TEXT }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}>Who wins?</motion.p>
          <Branch x={770} y={752} text="A wins → B wasn't all-powerful" delay={1.1} />
          <Branch x={1150} y={752} text="B wins → A wasn't" delay={1.9} />
        </>
      )}
    </div>
  );
}

function PowerBar({ x, label, color, struck, strikeDelay }: { x: number; label: string; color: string; struck: boolean; strikeDelay: number }) {
  return (
    <motion.div className="absolute" style={{ left: x, top: 330, width: 190 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fast, delay: 0.3 }}>
      <div className="flex items-baseline justify-between whitespace-nowrap font-sans font-black uppercase" style={{ fontSize: 14, letterSpacing: '0.08em', color: INK_TEXT }}><span>{label}</span><span style={{ color }}>100% power</span></div>
      <div className="relative mt-1 h-[14px] overflow-hidden rounded-full" style={{ background: 'rgba(31,22,18,0.1)' }}>
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8, delay: 0.5, ease }} />
      </div>
      {struck && <motion.span className="absolute left-[-6px] top-[10px] h-[5px] w-[202px] origin-left rounded-full" style={{ background: INK_TEXT, rotate: -4 }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3, delay: strikeDelay }} />}
    </motion.div>
  );
}

function Branch({ x, y, text, delay }: { x: number; y: number; text: string; delay: number }) {
  return (
    <motion.span className="absolute whitespace-nowrap rounded-full font-sans font-black" style={{ left: x, top: y, padding: '8px 16px', fontSize: 18, background: INK_TEXT, color: '#FFF8EC' }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fast, delay }}>
      {text}
    </motion.span>
  );
}
