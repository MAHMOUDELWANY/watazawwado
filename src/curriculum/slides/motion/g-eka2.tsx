import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person, CLAY } from './kit';
import { Hear } from '../Say';
import { ArText, Say } from './g-ea1';

/**
 * Egyptian Arabic · Kids · Advanced · Lesson 2 · Teta's Sayings. Teta's glass jar of sayings: Ziad (gold), Mariam
 * (crimson), Adam (teal), Teta (clay), Tante Soad next door (violet). New device: the jar; paper notes come out of it,
 * and in the wow each note flies to the moment it belongs to.
 */

const ZIAD = GOLD;
const MARIAM = CRIMSON;
const ADAM = TEAL;
const TETA = CLAY;
const SOAD = '#7A5BA6';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const PAPER = '#FFF6DF';

/** The glass jar; its bottom sits at y. */
function Jar({ x, y, delay = 0, open = false }: { x: number; y: number; delay?: number; open?: boolean }) {
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x - 90, top: y - 230, overflow: 'visible' }} width={180} height={230} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <rect x={10} y={40} width={160} height={186} rx={30} fill="#E7F1EF" stroke="#9FB8B3" strokeWidth={5} />
      {[[40, 170, -20], [80, 190, 15], [120, 165, -8], [60, 130, 25], [105, 125, -30]].map(([cx, cy, r], i) => <rect key={i} x={cx - 22} y={cy - 9} width={44} height={18} rx={9} fill={PAPER} stroke="#D8C9A6" strokeWidth={2} transform={`rotate(${r} ${cx} ${cy})`} />)}
      <motion.rect x={0} width={180} height={34} rx={8} fill={CLAY} initial={{ y: 12, rotate: 0 }} animate={open ? { y: -30, rotate: -18 } : { y: 12 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8, delay: delay + 0.4 }} />
    </motion.svg>
  );
}

/** A paper note with a saying, flying from (fx, fy) to (x, y). */
function Note({ x, y, text, id, fx, fy, delay = 0, size = 26 }: { x: number; y: number; text: string; id?: string; fx?: number; fy?: number; delay?: number; size?: number }) {
  const body = <span className="inline-flex rounded-[10px]" style={{ padding: '2px 18px 4px', background: PAPER, border: '2px solid #D8C9A6', boxShadow: SHADOW }}><ArText size={size}>{text}</ArText></span>;
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div initial={fx !== undefined ? { x: fx - x, y: (fy ?? y) - y, scale: 0.2, rotate: -20, opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -6 }} animate={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 1, delay }}>{id ? <Hear id={id}>{body}</Hear> : body}</motion.div>
    </div>
  );
}

function Turtle({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x - 60, top: y - 50 }} width={120} height={60} initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 3, delay, ease: 'linear' }}>
      <ellipse cx={58} cy={34} rx={40} ry={24} fill="#5E9A88" /><path d="M 30 30 L 86 30 M 58 12 L 58 54" stroke="#3F7566" strokeWidth={4} />
      <circle cx={104} cy={34} r={11} fill="#8FBF9F" /><rect x={28} y={50} width={12} height={10} rx={4} fill="#8FBF9F" /><rect x={74} y={50} width={12} height={10} rx={4} fill="#8FBF9F" />
    </motion.svg>
  );
}

function Hands({ x, y, two }: { x: number; y: number; two: boolean }) {
  return (
    <svg className="pointer-events-none absolute" style={{ left: x - 70, top: y - 70, overflow: 'visible' }} width={140} height={120}>
      <motion.path d="M 50 120 L 50 30 Q 50 10 66 10 L 70 10 L 70 120 Z" fill="#E2B48C" animate={two ? { x: [-14, 0, -14, 0] } : { rotate: [-8, 8, -8] }} transition={{ duration: 1.2, delay: 0.4 }} />
      {two && <motion.path d="M 90 120 L 90 30 Q 90 10 74 10 L 70 10 L 70 120 Z" fill="#D9A579" animate={{ x: [14, 0, 14, 0] }} transition={{ duration: 1.2, delay: 0.4 }} />}
      {two && [0, 1, 2].map((i) => <motion.path key={i} d={`M ${40 + i * 30} 0 l ${-6 + i * 6} -20`} stroke={GOLD} strokeWidth={5} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0, 1] }} transition={{ duration: 1.2, delay: 0.4 }} />)}
    </svg>
  );
}

function Door({ x, color, delay = 0 }: { x: number; color: string; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute rounded-t-[60px]" style={{ left: x - 70, top: 470, width: 140, height: 330, background: color, boxShadow: SHADOW }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <span className="absolute rounded-full" style={{ right: 18, top: 170, width: 14, height: 14, background: GOLD }} />
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Eka2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Jar x={1150} y={760} delay={0.2} open />
      <Note x={1000} y={330} text="في التأني السلامة" fx={1150} fy={600} delay={0.8} size={24} />
      <Note x={1320} y={260} text="الجار قبل الدار" fx={1150} fy={600} delay={1.1} size={24} />
      <Note x={1240} y={420} text="إيد لوحدها…" fx={1150} fy={600} delay={1.4} size={24} />
    </>
  );
}

export function Eka2JarGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1400} y={800} scale={1} color={TETA} hijab />
      <Jar x={1150} y={760} open={lines >= 2} />
      {lines >= 2 && <Note x={1150} y={360} text="؟" fx={1150} fy={600} delay={0.8} />}
      {lines >= 3 && <Chip x={950} y={260} color={TEAL} delay={0.2}>a short sentence, very old</Chip>}
      {lines >= 2 && <Person x={900} y={800} scale={0.75} color={ZIAD} delay={0.2} />}
    </>
  );
}

/* ---------- zad ---------- */

export function Eka2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={880} y={800} scale={0.75} color={ZIAD} lean={k === 1 ? 10 : 0} />
      <Person x={1040} y={800} scale={0.75} color={MARIAM} hijab />
      <Person x={1190} y={800} scale={0.75} color={ADAM} />
      <Person x={1400} y={800} scale={1} color={TETA} hijab />
      {k === 1 && <Say key="a" x={1400} y={570} id="story-1" text="على مهلك يا زياد! في التأني السلامة." align="right" width={420} size={21} delay={0.2} />}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1040} y={630} id="story-2" text="يا تيتة، الأوضة كركبة!" width={260} size={23} accent delay={0.2} />
          <Say x={1400} y={460} id="story-3" text="إيد لوحدها ما تسقفش. يلا كلنا مع بعض!" align="right" width={430} size={21} delay={1.6} />
        </React.Fragment>
      )}
      {k === 3 && <Say key="c" x={1400} y={570} id="story-4" text="خدوا المانجا دي لطنط سعاد. الجار قبل الدار." align="right" width={480} size={20} delay={0.2} />}
    </>
  );
}

export function Eka2SlowGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Note x={1150} y={230} text="في التأني السلامة" id="taanni" size={34} />
      {lines >= 2 && <Turtle x={1050} y={560} delay={0.2} />}
      {lines >= 2 && <Chip x={1050} y={600} color={TEAL} delay={1}>slow… and there!</Chip>}
      {lines >= 2 && <Person x={1380} y={800} scale={0.8} color={ZIAD} lean={10} delay={0.1} />}
      {lines >= 3 && (
        <div className="absolute" style={{ left: 1150, top: 330, transform: 'translate(-50%, -50%)' }}>
          <Hear id="ala-mahlak"><span className="inline-flex rounded-full" style={{ padding: '0 16px 2px', background: TETA, boxShadow: SHADOW }}><ArText size={26} color="#fff">على مهلك!</ArText></span></Hear>
        </div>
      )}
    </>
  );
}

export function Eka2ClapGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Note x={1150} y={230} text="إيد لوحدها ما تسقفش" id="eed" size={34} />
      {lines >= 2 && <Hands x={980} y={440} two={false} />}
      {lines >= 2 && <Chip x={980} y={480} delay={0.3}>one hand: …</Chip>}
      {lines >= 2 && <Hands x={1320} y={440} two />}
      {lines >= 2 && <Chip x={1320} y={480} color={GOLD} delay={0.8}>two hands: clap!</Chip>}
      {lines >= 3 && (
        <>
          <Person x={1000} y={800} scale={0.7} color={ZIAD} delay={0.1} />
          <Person x={1150} y={800} scale={0.7} color={MARIAM} hijab delay={0.2} />
          <Person x={1300} y={800} scale={0.7} color={ADAM} delay={0.3} />
        </>
      )}
    </>
  );
}

export function Eka2JaarGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Note x={1150} y={230} text="الجار قبل الدار" id="gaar" size={34} />
      {lines >= 2 && <Door x={1360} color="#B9785A" />}
      {lines >= 2 && <Door x={940} color={SOAD} delay={0.2} />}
      {lines >= 2 && <Chip x={1360} y={430} delay={0.4}>Teta</Chip>}
      {lines >= 2 && <Chip x={940} y={430} color={SOAD} delay={0.6}>Tante Soad</Chip>}
      {lines >= 3 && (
        <motion.span className="pointer-events-none absolute rounded-full" style={{ top: 600, width: 90, height: 40, background: '#FFFDF8', boxShadow: `inset 0 -14px 0 ${GOLD}` }} initial={{ left: 1315 }} animate={{ left: 985 }} transition={{ duration: 1.6, delay: 0.3, ease }} />
      )}
    </>
  );
}

/** The wow: three notes fly from the jar to their three moments. */
export function Eka2NotesGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const moments: [string, string, string][] = [['running on the stairs', 'في التأني السلامة', TEAL], ['a messy room', 'إيد لوحدها ما تسقفش', GOLD], ['fresh mango', 'الجار قبل الدار', SOAD]];
  return (
    <>
      <Jar x={1420} y={780} open={lines >= 3} />
      {lines >= 2 && moments.map(([m, , c], i) => <Chip key={m} x={900} y={230 + i * 150} color={c} delay={0.2 + i * 0.2}>{m}</Chip>)}
      {lines >= 3 && moments.map(([m, s], i) => <Note key={s} x={1170} y={250 + i * 150} text={s} fx={1420} fy={620} delay={0.6 + i * 0.5} size={24} />)}
      {lines >= 3 && <div className="absolute" style={{ left: 1170, top: 700, transform: 'translate(-50%, -50%)' }}><Hear id="three"><span className="inline-flex rounded-full font-sans font-bold" style={{ padding: '6px 16px', fontSize: 16, background: TETA, color: '#fff' }}>▶ all three</span></Hear></div>}
    </>
  );
}

/* ---------- athar ---------- */

export function Eka2TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={950} y={800} scale={0.8} color={ZIAD} lean={10} />
      <Say x={950} y={620} id="rushing" text="أنا بجري على السلم!" width={250} size={24} delay={0.2} />
      <Jar x={1380} y={780} open={lines >= 2} />
      {lines >= 2 && <Chip x={1150} y={300} color={TETA} delay={0.3}>be Teta: which note?</Chip>}
    </>
  );
}

export function Eka2MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Jar x={1150} y={780} />
      <Person x={1420} y={800} scale={1} color={TETA} hijab />
      {lines >= 2 && <Note x={1150} y={300} text="…" fx={1150} fy={620} delay={0.3} size={32} />}
      {lines >= 2 && <Chip x={1150} y={380} color={TEAL} delay={0.9}>your own jar</Chip>}
    </>
  );
}

export function Eka2NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Door x={1400} color={SOAD} />
      <Person x={1250} y={800} scale={1} color={SOAD} hijab />
      {lines >= 2 && <Person x={950} y={800} scale={0.8} color={ZIAD} delay={0.1} />}
      {lines >= 2 && <Say x={950} y={620} id="arfeen" text="عارفين ليه…؟" width={190} size={28} accent delay={0.3} />}
      {lines >= 3 && <Chip x={1100} y={300} color={CRIMSON} delay={0.2}>next: Ziad&apos;s joke</Chip>}
    </>
  );
}
