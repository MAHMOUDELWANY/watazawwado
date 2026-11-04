import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person, CLAY } from './kit';
import { Say } from './g-ea1';
import { Panel, Hinge, type Pic } from './g-ei3';

/**
 * Egyptian Arabic · Kids · Intermediate · Lesson 3 · Teta's Story. Teta tells the children about the monkey who took
 * her hat. Reuses the story strip (panels and hinges) with three kid-sized story words: وبعدين، فجأة، في الآخر. The
 * hat flies out of its panel on فجأة and lands back on في الآخر.
 */

const ADAM = TEAL;
const ZIAD = GOLD;
const MARIAM = CRIMSON;
const TETA = CLAY;

function Sofa() {
  return <motion.div className="pointer-events-none absolute rounded-[40px]" style={{ left: 860, top: 640, width: 620, height: 160, background: '#B9785A' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />;
}

/* ---------- spark ---------- */

export function Eki3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Panel x={1410} y={400} pic="tree" text="رحت" delay={0.2} />
      <Hinge x={1290} y={400} word="وبعدين" delay={0.8} />
      <Panel x={1170} y={400} pic="banana" text="موزة" delay={0.4} />
      <Hinge x={1050} y={400} word="فجأة" delay={1} />
      <Panel x={930} y={400} pic="monkey" text="القرد!" delay={0.6} />
      <Person x={1170} y={800} scale={0.9} color={TETA} hijab delay={0.3} />
    </>
  );
}

export function Eki3SofaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Sofa />
      <Person x={1000} y={720} scale={0.9} color={TETA} hijab sitting />
      <Person x={1200} y={720} scale={0.7} color={ZIAD} sitting delay={0.2} />
      <Person x={1330} y={720} scale={0.7} color={MARIAM} hijab sitting delay={0.3} />
      {lines >= 2 && <Say x={1000} y={540} text="لما كنت صغيرة…" width={210} size={26} delay={0.2} />}
      {lines >= 3 && <Chip x={1270} y={430} color={GOLD} delay={0.2}>a story!</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

export function Eki3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Sofa />
      <Person x={960} y={720} scale={0.9} color={TETA} hijab sitting />
      <Person x={1200} y={720} scale={0.7} color={ZIAD} sitting />
      <Person x={1330} y={720} scale={0.7} color={MARIAM} hijab sitting />
      {k === 1 && (
        <React.Fragment key="a">
          <Panel x={1300} y={300} pic="tree" text="جنينة الحيوانات" id="story-1" delay={0.2} />
          <Say x={960} y={540} text="لما كنت صغيرة…" width={210} size={24} delay={0.3} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Panel x={1360} y={300} pic="banana" text="اديته موزة" id="story-2" delay={0.2} />
          <Panel x={1120} y={300} pic="hat" text="خد الطاقية!" id="story-3" delay={1.2} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1200} y={560} id="story-4" text="يا خبر! وبعدين؟" width={200} size={24} accent delay={0.2} />
          <Panel x={1360} y={300} pic="monkey" text="رجّعلي الطاقية" id="story-5" delay={1.2} />
        </React.Fragment>
      )}
    </>
  );
}

function Pair({ a, b, word, color = CRIMSON, joined, id }: { a: [Pic, string]; b: [Pic, string]; word: string; color?: string; joined: boolean; id?: string }) {
  return (
    <>
      <motion.div className="absolute" style={{ top: 0, left: 0 }} animate={{ x: joined ? 60 : 0 }} transition={{ duration: 0.7, ease }}>
        <Panel x={1300} y={300} pic={a[0]} text={a[1]} id={id} />
      </motion.div>
      <motion.div className="absolute" style={{ top: 0, left: 0 }} animate={{ x: joined ? -60 : 0 }} transition={{ duration: 0.7, ease }}>
        <Panel x={1000} y={300} pic={b[0]} text={b[1]} delay={0.2} />
      </motion.div>
      {joined && <Hinge x={1150} y={300} word={word} color={color} delay={0.7} />}
    </>
  );
}

export function Eki3ThenGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Pair a={['monkey', 'شفت القرد']} b={['banana', 'اديته موزة']} word="وبعدين" joined={lines >= 2} id="wbaadeen" />
      {lines >= 3 && (
        <>
          <Person x={1150} y={800} scale={0.8} color={ZIAD} />
          <Say x={1150} y={610} id="wbaadeen-q" text="وبعدين؟" width={150} size={28} accent delay={0.3} />
        </>
      )}
    </>
  );
}

/** The hat flies out of its panel on فجأة. */
export function Eki3SuddenGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Panel x={1300} y={300} pic="banana" text="اديته موزة" />
      <Hinge x={1150} y={300} word="فجأة" delay={0.4} />
      <Panel x={1000} y={300} pic="monkey" text="خد الطاقية!" id="fagaa" delay={0.6} />
      {lines >= 2 && (
        <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 80, y: -220 }} animate={{ x: 0, y: 0 }} transition={{ duration: 1.2, delay: 0.3, ease }}>
          <Panel x={920} y={540} pic="hat" text="!!" />
        </motion.div>
      )}
      {lines >= 3 && (
        <>
          <Person x={1350} y={800} scale={0.8} color={MARIAM} hijab />
          <Say x={1350} y={610} id="ya-khabar" text="يا خبر!" align="right" width={140} size={28} accent delay={0.3} />
        </>
      )}
    </>
  );
}

export function Eki3EndGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Panel x={1300} y={300} pic="monkey" text="خد الطاقية" dim />
      <Hinge x={1150} y={300} word="في الآخر" color={GOLD} delay={0.4} />
      {lines >= 2 && <Panel x={980} y={300} pic="hat" text="رجّعلي الطاقية" id="fel-akher" delay={0.3} />}
      {lines >= 3 && <Panel x={1150} y={560} pic="banana" text="وكل الموزة!" delay={0.2} />}
    </>
  );
}

/** The wow: four pictures, three hinges drop in, and the strip is a story. */
export function Eki3StripGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const panels: [Pic, string][] = [['tree', 'رحت'], ['banana', 'اديته موزة'], ['monkey', 'خد الطاقية'], ['hat', 'رجّعها']];
  const hinges: [string, string][] = [['وبعدين', CRIMSON], ['وفجأة', CRIMSON], ['في الآخر', GOLD]];
  const xs = [1420, 1240, 1060, 880];
  return (
    <>
      {panels.map(([pic, t], i) => <Panel key={pic} x={xs[i]} y={i % 2 ? 470 : 260} pic={pic} text={t} id={i === 0 ? 'strip' : undefined} delay={i * 0.15} />)}
      {lines >= 2 && hinges.map(([w, c], i) => <Hinge key={w} x={(xs[i] + xs[i + 1]) / 2} y={365} word={w} color={c} delay={0.2 + i * 0.25} />)}
      {lines >= 3 && <Chip x={1150} y={640} color={GOLD} delay={0.3}>now you can tell any story!</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Eki3TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Sofa />
      <Person x={1000} y={720} scale={0.9} color={TETA} hijab sitting />
      <Person x={1300} y={800} scale={0.85} color={ADAM} />
      <Say x={1000} y={540} id="wbaadeen-2" text="وبعدين؟" width={150} size={28} delay={0.3} />
      {lines >= 2 && (
        <>
          <Hinge x={1300} y={300} word="وبعدين" delay={0.1} />
          <Hinge x={1300} y={370} word="فجأة" delay={0.3} />
          <Hinge x={1300} y={440} word="في الآخر" color={GOLD} delay={0.5} />
        </>
      )}
    </>
  );
}

export function Eki3MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <motion.div key={i} className="pointer-events-none absolute rounded-[14px]" style={{ left: 880 + (i % 2) * 290, top: 190 + Math.floor(i / 2) * 230, width: 260, height: 200, background: '#FFFDF8', border: '3px dashed #C9B79A' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.15 }} />
      ))}
      {lines >= 2 && (
        <>
          <Hinge x={1155} y={290} word="وبعدين" delay={0.2} />
          <Hinge x={1155} y={520} word="في الآخر" color={GOLD} delay={0.4} />
        </>
      )}
    </>
  );
}

export function Eki3NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.svg className="pointer-events-none absolute" style={{ left: 760, top: 640 }} width={760} height={160} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        {[0, 1, 2].map((i) => <path key={i} d={`M0 ${40 + i * 40} q 95 -24 190 0 t 190 0 t 190 0 t 190 0`} stroke={TEAL} strokeWidth={6} fill="none" opacity={0.5 - i * 0.12} />)}
      </motion.svg>
      <Person x={1000} y={640} scale={0.8} color={ZIAD} />
      <Person x={1150} y={640} scale={0.8} color={MARIAM} hijab />
      <Person x={1300} y={640} scale={0.8} color={ADAM} />
      {lines >= 2 && <Say x={1150} y={450} id="rohna" text="رحنا البحر!" width={180} size={28} accent delay={0.2} />}
      {lines >= 3 && <Chip x={1150} y={300} color={CRIMSON} delay={0.3}>-na = we</Chip>}
    </>
  );
}
