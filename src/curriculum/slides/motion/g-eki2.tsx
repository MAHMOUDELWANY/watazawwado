import React from 'react';
import { motion } from 'motion/react';
import { CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type GraphicProps } from './Stage';
import { Chip, Person, CLAY } from './kit';
import { Say } from './g-ea1';
import { Verb } from './g-ei1';
import { Timeline } from './g-ei2';

/**
 * Egyptian Arabic · Kids · Intermediate · Lesson 2 · Tomorrow We'll Go to the Zoo. Bedtime at Teta's, then the zoo in
 * the children's heads: a lion, a giraffe and an elephant drawn in code pop up as each child says what they will see.
 * The هـ tag (crimson) snaps onto the front of the verb; the zoo game lines the animals up as the sentence grows.
 */

const ADAM = TEAL;
const ZIAD = GOLD;
const MARIAM = CRIMSON;
const TETA = CLAY;
type Kind = 'lion' | 'giraffe' | 'elephant' | 'ice';

/** A simple animal (or Adam's ice cream) standing on the ground at x. */
function Animal({ x, kind, y = 800, scale = 1, delay = 0 }: { x: number; kind: Kind; y?: number; scale?: number; delay?: number }) {
  const w = 200 * scale;
  const h = 260 * scale;
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x - w / 2, top: y - h, overflow: 'visible' }} width={w} height={h} viewBox="0 0 200 260"
      initial={{ opacity: 0, scale: 0.4, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.8, delay }}>
      {kind === 'lion' && <g><rect x={50} y={150} width={110} height={70} rx={30} fill="#E2B04A" />{[60, 140].map((lx) => <rect key={lx} x={lx} y={200} width={18} height={60} rx={8} fill="#E2B04A" />)}<circle cx={60} cy={130} r={52} fill="#B8732E" /><circle cx={60} cy={130} r={34} fill="#E2B04A" /><circle cx={50} cy={124} r={4} fill={INK_TEXT} /><circle cx={70} cy={124} r={4} fill={INK_TEXT} /></g>}
      {kind === 'giraffe' && <g><rect x={90} y={30} width={30} height={170} rx={12} fill="#E2B04A" /><ellipse cx={120} cy={30} rx={34} ry={22} fill="#E2B04A" /><rect x={60} y={170} width={110} height={50} rx={20} fill="#E2B04A" />{[70, 150].map((lx) => <rect key={lx} x={lx} y={210} width={14} height={50} rx={6} fill="#E2B04A" />)}{[0, 1, 2, 3].map((i) => <circle key={i} cx={i % 2 ? 112 : 98} cy={60 + i * 34} r={8} fill="#8A5A2B" />)}<circle cx={130} cy={26} r={4} fill={INK_TEXT} /></g>}
      {kind === 'elephant' && <g><ellipse cx={110} cy={170} rx={80} ry={56} fill="#9AA3AA" />{[60, 140].map((lx) => <rect key={lx} x={lx} y={200} width={26} height={60} rx={10} fill="#9AA3AA" />)}<circle cx={40} cy={140} r={40} fill="#9AA3AA" /><path d="M14 156 q -10 50 14 70" stroke="#9AA3AA" strokeWidth={16} fill="none" strokeLinecap="round" /><circle cx={34} cy={130} r={4} fill={INK_TEXT} /></g>}
      {kind === 'ice' && <g><polygon points="70,120 130,120 100,250" fill="#D9A066" /><circle cx={85} cy={110} r={26} fill="#F4B6C2" /><circle cx={115} cy={110} r={26} fill="#FFF3D6" /><circle cx={100} cy={84} r={24} fill="#8A5A2B" /></g>}
    </motion.svg>
  );
}

/** A thought cloud above (x, y) with an animal inside. */
function Dream({ x, y, kind, delay = 0 }: { x: number; y: number; kind: Kind; delay?: number }) {
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[50%]" style={{ left: x - 100, top: y - 90, width: 200, height: 180, background: '#FFFDF8', boxShadow: '0 16px 30px -22px rgba(60,30,10,0.6)' }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.7, delay }} />
      <Animal x={x} y={y + 70} kind={kind} scale={0.55} delay={delay + 0.3} />
    </>
  );
}

/* ---------- spark ---------- */

export function Eki2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Animal x={1400} kind="giraffe" delay={0.2} />
      <Animal x={1180} kind="lion" scale={0.8} delay={0.4} />
      <Person x={960} y={800} scale={0.8} color={ZIAD} delay={0.3} />
      <Verb x={980} y={380} word="هشوف" end="ha-" who="I will see" size={44} color={CRIMSON} delay={0.9} />
    </>
  );
}

export function Eki2BedGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[24px]" style={{ left: 880, top: 640, width: 560, height: 160, background: '#3A4E6A' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: 1380, top: 170, width: 70, height: 70, background: '#FFF3C4', boxShadow: '0 0 40px 10px #FFF3C455' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
      <Person x={980} y={700} scale={0.7} color={ZIAD} sitting />
      <Person x={1150} y={700} scale={0.7} color={MARIAM} hijab sitting />
      <Person x={1320} y={700} scale={0.7} color={ADAM} sitting />
      {lines >= 2 && <Chip x={1150} y={300} color={CRIMSON} delay={0.2}>tomorrow: the zoo!</Chip>}
      {lines >= 3 && (
        <>
          <Dream x={980} y={450} kind="lion" delay={0.1} />
          <Dream x={1150} y={420} kind="giraffe" delay={0.3} />
          <Dream x={1320} y={450} kind="ice" delay={0.5} />
        </>
      )}
    </>
  );
}

/* ---------- zad ---------- */

export function Eki2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={880} y={800} scale={1} color={TETA} hijab />
      <Person x={1130} y={800} scale={0.8} color={ZIAD} />
      <Person x={1270} y={800} scale={0.8} color={MARIAM} hijab />
      <Person x={1410} y={800} scale={0.8} color={ADAM} />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={880} y={570} id="story-1" text="بكرة هنروح جنينة الحيوانات!" width={310} size={24} accent delay={0.2} />
          <Say x={1130} y={420} id="story-2" text="هشوف الأسد!" align="right" width={180} size={26} delay={1.4} />
          <Dream x={1300} y={330} kind="lion" delay={1.8} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1270} y={600} id="story-3" text="وأنا هشوف الزرافة!" align="right" width={230} size={24} delay={0.2} />
          <Dream x={1000} y={330} kind="giraffe" delay={0.8} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={880} y={570} id="story-4" text="وآدم هيشوف إيه؟" width={210} size={26} delay={0.2} />
          <Say x={1410} y={600} id="story-5" text="أنا… هاكل آيس كريم!" align="right" width={250} size={24} accent delay={1.4} />
          <Dream x={1250} y={330} kind="ice" delay={1.8} />
        </React.Fragment>
      )}
    </>
  );
}

export function Eki2AnaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Verb x={1150} y={230} word="هشوف" end="ha-" who="I will see" id="hashoof" size={60} color={CRIMSON} hot />
      {lines >= 2 && <Timeline y={420} at="future" delay={0.1} />}
      {lines >= 3 && (
        <>
          <Animal x={1350} kind="lion" scale={0.7} delay={0.1} />
          <Animal x={980} kind="giraffe" scale={0.8} delay={0.3} />
          <Chip x={1350} y={560} color={GOLD} delay={0.5}>هشوف الأسد!</Chip>
          <Chip x={980} y={520} color={GOLD} delay={0.7}>هشوف الزرافة!</Chip>
        </>
      )}
    </>
  );
}

export function Eki2EntiGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1350} y={800} scale={0.9} color={ZIAD} />
      <Verb x={1350} y={330} word="هتشوف إيه؟" end="ha-t" who="a boy" id="hatshoof" size={38} color={CRIMSON} />
      {lines >= 2 && <Person x={950} y={800} scale={0.9} color={MARIAM} hijab delay={0.1} />}
      {lines >= 2 && <Verb x={950} y={330} word="هتشوفي إيه؟" end="ha-t…i" who="a girl" id="hatshoofi" size={38} color={CRIMSON} delay={0.3} hot />}
      {lines >= 3 && <Chip x={1150} y={460} color={GOLD} delay={0.2}>هشوف…</Chip>}
    </>
  );
}

export function Eki2HuwaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1380} y={800} scale={0.85} color={ZIAD} />
      <Animal x={1250} kind="lion" scale={0.6} delay={0.4} />
      <Verb x={1330} y={300} word="هيشوف" end="ha-y" who="a boy" id="ziad-hayshoof" size={40} color={CRIMSON} />
      {lines >= 2 && <Person x={900} y={800} scale={0.85} color={MARIAM} hijab delay={0.1} />}
      {lines >= 2 && <Animal x={1040} kind="giraffe" scale={0.7} delay={0.4} />}
      {lines >= 2 && <Verb x={960} y={300} word="هتشوف" end="ha-t" who="a girl" id="mariam-hatshoof" size={40} color={CRIMSON} delay={0.3} />}
      {lines >= 3 && <Chip x={1150} y={430} color={GOLD} delay={0.2}>هيـ boy · هتـ girl</Chip>}
    </>
  );
}

/** The wow: the zoo grows one animal at a time as the sentence grows. */
export function Eki2GameGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const zoo: Kind[] = ['lion', 'giraffe', 'elephant'];
  const n = Math.min(lines, 3);
  return (
    <>
      <Verb x={1150} y={220} word="هشوف…" end="ha-" who="I will see" id="game" size={46} color={CRIMSON} />
      {zoo.slice(0, n).map((k, i) => <Animal key={k} x={1380 - i * 230} kind={k} scale={0.75} delay={0.2} />)}
      {lines >= 3 && <Chip x={1150} y={360} color={GOLD} delay={0.4}>الأسد · والزرافة · والفيل…</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Eki2TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={1} color={TETA} hijab />
      <Person x={1380} y={800} scale={0.85} color={ADAM} />
      <Say x={900} y={570} id="hatshoof-bokra" text="هتشوف إيه بكرة؟" width={220} size={26} delay={0.2} />
      {lines >= 2 && <Say x={1380} y={590} text="هشوف…" align="right" width={130} size={28} accent delay={0.3} />}
      {lines >= 2 && <Animal x={1180} kind="elephant" scale={0.6} delay={0.5} />}
    </>
  );
}

export function Eki2MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: 1360, top: 170, width: 60, height: 60, background: '#FFF3C4' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      <Person x={1000} y={800} scale={0.8} color={ADAM} />
      <Person x={1300} y={800} scale={1} color={CLAY} delay={0.2} />
      <Say x={1000} y={600} text="بكرة هـ…" width={150} size={28} accent delay={0.4} />
      {lines >= 2 && <Say x={1300} y={560} text="هتعمل إيه بكرة؟" align="right" width={220} size={24} delay={0.3} />}
    </>
  );
}

export function Eki2NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={1} color={TETA} hijab sitting={false} />
      <Person x={1250} y={800} scale={0.75} color={ZIAD} delay={0.2} />
      <Person x={1380} y={800} scale={0.75} color={MARIAM} hijab delay={0.3} />
      {lines >= 2 && <Say x={1000} y={570} id="teta-story" text="لما كنت صغيرة… رحت نفس الجنينة. وبعدين…" width={460} size={20} accent delay={0.2} />}
      {lines >= 3 && <Chip x={1150} y={300} color={CRIMSON} delay={0.3}>وبعدين…</Chip>}
    </>
  );
}
