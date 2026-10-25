import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, type GraphicProps } from './Stage';
import { Svg, Person, Bubble } from './kit';

/**
 * Three look options for the literacy cast (design §3b, plan Task 3), two pages each: "Meet Baa" and "Three letters, one
 * house". The owner picks one; the others are deleted. Same lines on every option, so only the look differs.
 *   A · Letter friends: the letters are the cast, alive on bright paper.
 *   B · Paper cut: a layered paper world; letters are cut shapes that slot together.
 *   C · Chalkboard: a teacher's board; letters are written in chalk, stroke by stroke.
 */

// Isolated ب as one centreline stroke in a 300 × 300 box (right tip, down into the bowl, left tip), and its dot.
const BAA = 'M 268 128 C 276 176, 252 200, 196 200 L 96 200 C 46 200, 26 186, 30 150';
const DOT = { x: 150, y: 248 };
const WAVE = 'M 0 250 C 40 232, 80 232, 120 250 S 200 268, 240 250 S 320 232, 360 250';

const arFont: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };

/** The letter written stroke by stroke (or at once with reduced motion). */
function BaaStroke({ color, width, delay = 0, chalk = false }: { color: string; width: number; delay?: number; chalk?: boolean }) {
  const reduce = useReduce();
  return (
    <motion.path d={BAA} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
      filter={chalk ? 'url(#chalk)' : undefined}
      initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 1.4, delay, ease: [0.65, 0, 0.35, 1] }} />
  );
}

/** A dot that falls into place under the letter: the one thing that makes ب a ب. */
function FallingDot({ r, fill, delay = 0, stroke }: { r: number; fill: string; delay?: number; stroke?: string }) {
  return (
    <motion.circle cx={DOT.x} cy={DOT.y} r={r} fill={fill} stroke={stroke} strokeWidth={stroke ? 3 : 0}
      initial={{ y: -220, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 1, delay }} />
  );
}

/** Sound rings leaving a mouth point: the letter is said. */
function Rings({ x, y, color }: { x: number; y: number; color: string }) {
  const reduce = useReduce();
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={x} cy={y} r={30} fill="none" stroke={color} strokeWidth={4}
          initial={{ scale: 0.4, opacity: 0.9 }} animate={reduce ? { scale: 1.6, opacity: 0.4 } : { scale: [0.4, 2.4], opacity: [0.9, 0] }}
          transition={{ duration: 1.6, delay: i * 0.35, repeat: reduce ? 0 : Infinity, repeatDelay: 0.4 }}
          style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' as never }} />
      ))}
    </>
  );
}

/** The word بيت growing out of its three letters, with its meaning under it. */
function Word({ x, y, size, color, sub, subColor }: { x: number; y: number; size: number; color: string; sub: string; subColor: string }) {
  return (
    <motion.div className="pointer-events-none absolute text-center" style={{ left: x - 220, top: y, width: 440 }}
      initial={{ opacity: 0, scale: 0.7, filter: 'blur(8px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease }}>
      <div lang="ar" style={{ ...arFont, fontSize: size, lineHeight: 1.2, color }}>بَيْت</div>
      <div className="font-sans font-extrabold" style={{ fontSize: 26, color: subColor, letterSpacing: '0.04em' }}>{sub}</div>
    </motion.div>
  );
}

/** A simple house that rises from the ground: what the word means, drawn. */
function House({ x, y, s = 1, wall, roof, door, line, delay = 0 }: { x: number; y: number; s?: number; wall: string; roof: string; door: string; line?: string; delay?: number }) {
  return (
    <motion.g initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 1, delay }}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <rect x={-90} y={-120} width={180} height={120} rx={10} fill={wall} stroke={line} strokeWidth={line ? 5 : 0} />
        <path d="M -116 -112 L 0 -196 L 116 -112 Z" fill={roof} stroke={line} strokeWidth={line ? 5 : 0} strokeLinejoin="round" />
        <rect x={-24} y={-70} width={48} height={70} rx={24} fill={door} stroke={line} strokeWidth={line ? 4 : 0} />
        <rect x={42} y={-96} width={30} height={30} rx={6} fill="#FFF3D6" stroke={line} strokeWidth={line ? 4 : 0} />
      </g>
    </motion.g>
  );
}

/* ================================================== A · Letter friends ================================================== */

/** Baa comes alive: written, then eyes open, it rocks like a little boat, its dot drops, it says "b". */
export function LookAMeetGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  return (
    <>
      <Svg>
        {lines >= 2 && <motion.path d={WAVE} transform="translate(840 560) scale(1.75)" fill="none" stroke={TEAL} strokeWidth={10} strokeLinecap="round" opacity={0.5}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease }} />}
        <g transform="translate(860 160) scale(2)">
        <motion.g animate={lines >= 2 && !reduce ? { rotate: [-4, 4, -4] } : { rotate: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '50% 100%', transformBox: 'fill-box' as never }}>
          <BaaStroke color={CRIMSON} width={40} />
          {lines >= 1 && (
            <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }} style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' as never }}>
              {[132, 176].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy={196} r={13} fill="#fff" />
                  <motion.circle cx={cx + 3} cy={198} r={6} fill={INK_TEXT} animate={reduce ? {} : { x: [0, 2, -2, 0] }} transition={{ duration: 3, repeat: Infinity }} />
                </g>
              ))}
            </motion.g>
          )}
          {lines >= 2 && <FallingDot r={20} fill={GOLD} delay={0.4} />}
        </motion.g>
        </g>
        {lines >= 3 && <Rings x={1420} y={400} color={GOLD} />}
      </Svg>
      {lines >= 3 && <Bubble x={1400} y={330} text={<span className="font-sans font-extrabold" style={{ fontSize: 40 }}>b!</span>} width={110} delay={0.3} />}
      {lines >= 4 && (
        <>
          <Svg><House x={1420} y={800} s={0.55} wall="#FFD9A8" roof={CRIMSON} door={TEAL} delay={0.4} /></Svg>
          <Word x={1080} y={660} size={84} color={CRIMSON} sub="bayt · house" subColor={TEAL} />
        </>
      )}
    </>
  );
}

/** Three letter friends hop together into one word, and a house pops up behind them. */
export function LookAWordGraphic({ lines }: GraphicProps) {
  const tiles = [{ ch: 'ب', c: CRIMSON }, { ch: 'ي', c: TEAL }, { ch: 'ت', c: GOLD }];
  const joined = lines >= 3;
  return (
    <>
      <Person x={860} y={770} scale={1.2} color={TEAL} />
      <Person x={990} y={770} scale={1.0} color={GOLD} delay={0.2} />
      {lines >= 2 && tiles.map((t, i) => (
        <motion.div key={t.ch} className="pointer-events-none absolute flex items-center justify-center rounded-[28px]"
          style={{ width: 130, height: 150, background: '#FFFDF8', boxShadow: `0 20px 40px -20px rgba(80,30,10,0.5), 0 0 0 4px ${t.c}` }}
          initial={{ left: 1100 + i * 150, top: 120, opacity: 0, rotate: (i - 1) * 14 }}
          animate={joined ? { left: 1370 - i * 132, top: 330, opacity: 0, rotate: 0 } : { left: 1380 - i * 170, top: 300 + (i % 2) * 70, opacity: 1, rotate: (i - 1) * 10 }}
          transition={{ type: 'spring', bounce: 0.35, duration: 1, delay: joined ? 0.1 * i : 0.25 * i }}>
          <span lang="ar" style={{ ...arFont, fontSize: 104, color: t.c, lineHeight: 1 }}>{t.ch}</span>
        </motion.div>
      ))}
      {joined && <Word x={1190} y={300} size={150} color={CRIMSON} sub={lines >= 4 ? 'bayt · house' : ''} subColor={TEAL} />}
      {lines >= 4 && <Svg><House x={1200} y={790} s={0.9} wall="#FFD9A8" roof={CRIMSON} door={TEAL} delay={0.3} /></Svg>}
      {lines >= 1 && <Bubble x={860} y={520} text={<span style={{ fontSize: 24 }}>Look, letters!</span>} delay={0.2} width={210} />}
    </>
  );
}

/* ================================================== B · Paper cut ================================================== */

const KRAFT = '#EAD7B7';
const paperShadow = 'drop-shadow(0 10px 0 rgba(90,50,20,0.22)) drop-shadow(0 18px 18px rgba(90,50,20,0.25))';

/** The paper board the whole option sits on. */
function PaperBoard() {
  return (
    <div className="pointer-events-none absolute rounded-[36px]" style={{ left: 760, top: 150, width: 760, height: 640, background: `radial-gradient(80% 70% at 60% 40%, #F3E4C8, ${KRAFT})`, boxShadow: 'inset 0 0 0 10px #FFF8EA, 0 30px 60px -30px rgba(90,50,20,0.5)' }} />
  );
}

/** Baa cut from crimson paper slides in; layered paper waves carry it like a boat; a gold paper dot is pinned under it. */
export function LookBMeetGraphic({ lines }: GraphicProps) {
  return (
    <>
      <PaperBoard />
      <Svg>
        {lines >= 2 && [0, 1].map((i) => (
          <motion.path key={i} d={`M 760 ${600 + i * 40} C 860 ${570 + i * 40}, 960 ${630 + i * 40}, 1060 ${600 + i * 40} S 1260 ${570 + i * 40}, 1360 ${600 + i * 40} S 1500 ${630 + i * 40}, 1520 ${600 + i * 40} L 1520 790 L 760 790 Z`}
            fill={i ? '#0B7F90' : TEAL} style={{ filter: paperShadow }} initial={{ y: 120 }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: i * 0.15, ease }} />
        ))}
        <motion.g initial={{ x: 500, rotate: 30, opacity: 0 }} animate={{ x: 0, rotate: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.25, duration: 1.2 }}>
          <g transform="translate(960 230) scale(1.45)" style={{ filter: paperShadow }}>
            <path d={BAA} fill="none" stroke={CRIMSON} strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" />
            <path d={BAA} fill="none" stroke="#E2453F" strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" transform="translate(-3 -4)" />
            {lines >= 2 && <FallingDot r={22} fill={GOLD} delay={0.5} stroke="#C98A1E" />}
          </g>
        </motion.g>
        {lines >= 3 && <Rings x={1400} y={420} color={CRIMSON} />}
      </Svg>
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute font-sans font-extrabold" style={{ left: 800, top: 190, fontSize: 22, color: '#7A4B22', padding: '6px 14px', background: '#FFF8EA', borderRadius: 10, boxShadow: '0 8px 0 rgba(90,50,20,0.18)' }}
          initial={{ opacity: 0, rotate: -6, y: -20 }} animate={{ opacity: 1, rotate: -3, y: 0 }} transition={{ duration: 0.6, ease }}>a little boat</motion.div>
      )}
      {lines >= 3 && <Bubble x={1330} y={330} text={<span className="font-sans font-extrabold" style={{ fontSize: 40 }}>b!</span>} width={110} delay={0.3} />}
      {lines >= 4 && <Word x={1140} y={655} size={70} color="#FFF8EA" sub="bayt · house" subColor="#FFF8EA" />}
    </>
  );
}

/** Three paper letters slot side by side; paper pieces stack into a house. */
export function LookBWordGraphic({ lines }: GraphicProps) {
  const tiles = [{ ch: 'ب', c: CRIMSON }, { ch: 'ي', c: TEAL }, { ch: 'ت', c: '#D9901F' }];
  const joined = lines >= 3;
  return (
    <>
      <PaperBoard />
      <Person x={880} y={750} scale={1.1} color={TEAL} />
      <Person x={1000} y={750} scale={0.92} color="#D9901F" delay={0.2} />
      {lines >= 2 && tiles.map((t, i) => (
        <motion.div key={t.ch} className="pointer-events-none absolute flex items-center justify-center"
          style={{ width: 132, height: 150, background: t.c, borderRadius: 12, filter: paperShadow, clipPath: 'polygon(4% 2%, 97% 0, 100% 96%, 2% 100%)' }}
          initial={{ left: 1120 + i * 140, top: 820, rotate: (i - 1) * 18 }}
          animate={joined ? { left: 1352 - i * 136, top: 250, rotate: 0 } : { left: 1360 - i * 170, top: 300 + (i % 2) * 60, rotate: (i - 1) * 8 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 1, delay: 0.2 * i }}>
          <span lang="ar" style={{ ...arFont, fontSize: 100, color: '#FFF8EA', lineHeight: 1 }}>{t.ch}</span>
        </motion.div>
      ))}
      {joined && <Word x={1200} y={430} size={120} color={CRIMSON} sub={lines >= 4 ? 'bayt · house' : ''} subColor="#7A4B22" />}
      {lines >= 4 && <Svg><g style={{ filter: paperShadow }}><House x={1240} y={790} s={0.75} wall="#F7C98B" roof={CRIMSON} door={TEAL} delay={0.3} /></g></Svg>}
      {lines >= 1 && <Bubble x={890} y={520} text={<span style={{ fontSize: 24 }}>Look, letters!</span>} delay={0.2} width={210} />}
    </>
  );
}

/* ================================================== C · Chalkboard ================================================== */

const CHALK = '#F4F1E6';

/** The board: slate green in a wooden frame, with chalk dust at the bottom. */
function Board() {
  return (
    <>
      <div className="pointer-events-none absolute rounded-[20px]" style={{ left: 760, top: 150, width: 760, height: 620, background: 'radial-gradient(90% 80% at 50% 40%, #2F5A4E, #1D3B33)', boxShadow: 'inset 0 0 0 14px #8B5A34, inset 0 0 0 18px #6E4426, inset 0 0 80px rgba(0,0,0,0.5), 0 30px 60px -30px rgba(0,0,0,0.6)' }} />
      <svg className="pointer-events-none absolute" width="0" height="0">
        <filter id="chalk"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="5" /></filter>
      </svg>
    </>
  );
}

/** Baa written in chalk; a chalk boat line under it; the dot is tapped in with a puff of dust; "b" written beside it. */
export function LookCMeetGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Board />
      <Svg>
        <defs><filter id="chalk"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="5" /></filter></defs>
        <g transform="translate(940 220) scale(1.45)"><BaaStroke color={CHALK} width={26} chalk /></g>
        {lines >= 2 && (
          <g transform="translate(940 220) scale(1.45)">
            <motion.path d="M 20 222 C 80 262, 240 262, 290 222" fill="none" stroke={TEAL} strokeWidth={6} strokeDasharray="10 12" filter="url(#chalk)"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease }} />
            <FallingDot r={15} fill={CHALK} delay={0.6} />
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.circle key={i} cx={DOT.x} cy={DOT.y} r={3} fill={CHALK} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0], x: (i - 2) * 22, y: -10 - (i % 2) * 14 }} transition={{ duration: 0.9, delay: 1.2 }} />
            ))}
          </g>
        )}
      </Svg>
      {lines >= 3 && (
        <motion.div className="pointer-events-none absolute font-serif italic" style={{ left: 1360, top: 260, fontSize: 96, color: GOLD }}
          initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }} animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 0.9, ease }}>b</motion.div>
      )}
      {lines >= 4 && <Word x={1140} y={600} size={78} color={CHALK} sub="bayt · house" subColor={GOLD} />}
    </>
  );
}

/** Three letters chalked far apart, then rewritten joined as one word; a chalk house draws itself. */
export function LookCWordGraphic({ lines }: GraphicProps) {
  const joined = lines >= 3;
  return (
    <>
      <Board />
      <Person x={880} y={740} scale={1.1} color={TEAL} />
      <Person x={1000} y={740} scale={0.92} color={GOLD} delay={0.2} />
      {lines >= 2 && ['ب', 'ي', 'ت'].map((ch, i) => (
        <motion.span key={ch} lang="ar" className="pointer-events-none absolute" style={{ ...arFont, left: 1380 - i * 180, top: 230, fontSize: 110, color: CHALK, lineHeight: 1 }}
          initial={{ opacity: 0, clipPath: 'inset(0 0 0 100%)' }} animate={{ opacity: joined ? 0.18 : 1, clipPath: 'inset(0 0 0 0%)' }} transition={{ duration: 0.7, delay: joined ? 0 : 0.4 * i }}>{ch}</motion.span>
      ))}
      {joined && <Word x={1180} y={360} size={140} color={CHALK} sub={lines >= 4 ? 'bayt · house' : ''} subColor={GOLD} />}
      {lines >= 4 && (
        <Svg>
          <g transform="translate(1240 740) scale(0.8)" fill="none" stroke={CHALK} strokeWidth={6} strokeLinejoin="round" filter="url(#chalk)">
            {['M -90 0 L -90 -120 L 90 -120 L 90 0 Z', 'M -116 -112 L 0 -196 L 116 -112', 'M -24 0 L -24 -46 C -24 -76, 24 -76, 24 -46 L 24 0', 'M 42 -96 h 30 v 30 h -30 Z'].map((d, i) => (
              <motion.path key={i} d={d} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.3 + i * 0.4 }} />
            ))}
          </g>
        </Svg>
      )}
      {lines >= 1 && <Bubble x={870} y={530} text={<span style={{ fontSize: 24 }}>Look, letters!</span>} delay={0.2} width={210} />}
    </>
  );
}
