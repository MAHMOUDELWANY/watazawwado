import React from 'react';
import { motion } from 'motion/react';
import { CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person, CLAY } from './kit';
import { Say } from './g-ea1';
import { StreetCard } from './g-es1';
import { TetaDoor } from './g-egy';
import { Verb } from './g-ei1';
import { Panel } from './g-ei3';

/**
 * Egyptian Arabic · Kids · Intermediate · Lesson 1 · Where Did You Go, Ziad? Back at Teta's flat: Adam (teal), Ziad
 * (gold), Mariam (crimson, hijab), Teta (clay, hijab). Reuses the ending tag; new here: the going song, where the four
 * verbs light up one after another like a clapping game, each above the person it points to.
 */

const ADAM = TEAL;
const ZIAD = GOLD;
const MARIAM = CRIMSON;
const TETA = CLAY;

/* ---------- spark ---------- */

export function Eki1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <TetaDoor open />
      <Person x={1380} y={800} scale={1} color={TETA} hijab delay={0.2} />
      <Person x={920} y={800} scale={0.8} color={ZIAD} delay={0.3} />
      <Person x={1010} y={800} scale={0.8} color={MARIAM} hijab delay={0.4} />
      <Verb x={950} y={360} word="رحت" end="-t" who="I went" size={46} delay={0.8} />
    </>
  );
}

export function Eki1HomeGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <TetaDoor open={lines >= 1} />
      <Person x={1150} y={800} scale={0.8} color={ZIAD} delay={0.3} />
      <Person x={1240} y={800} scale={0.8} color={MARIAM} hijab delay={0.4} />
      {lines >= 2 && <Person x={900} y={800} scale={1} color={TETA} hijab delay={0.1} />}
      {lines >= 2 && <Chip x={1420} y={400} color={TEAL} delay={0.4}>Adam?</Chip>}
      {lines >= 3 && <Say x={900} y={570} text="؟" width={80} delay={0.2} />}
    </>
  );
}

/* ---------- zad ---------- */

export function Eki1StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={880} y={800} scale={1} color={TETA} hijab />
      <Person x={1150} y={800} scale={0.8} color={ZIAD} />
      <Person x={1290} y={800} scale={0.8} color={MARIAM} hijab />
      {k >= 3 && <Person x={1430} y={800} scale={0.8} color={ADAM} delay={0.1} />}
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={880} y={570} id="story-1" text="رحت فين يا زياد؟" width={230} size={26} delay={0.2} />
          <Say x={1150} y={460} id="story-2" text="رحت الجنينة!" width={190} size={26} accent delay={1.4} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={880} y={570} id="story-3" text="ومريم راحت فين؟" width={220} size={26} delay={0.2} />
          <Say x={1290} y={460} id="story-4" text="أنا رحت مع زياد!" align="right" width={220} size={26} accent delay={1.4} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={880} y={570} id="story-5" text="وإنت يا آدم؟" width={180} size={26} delay={0.2} />
          <Say x={1430} y={460} id="story-6" text="أنا… رحت المطبخ!" align="right" width={230} size={26} accent delay={1.4} />
        </React.Fragment>
      )}
    </>
  );
}

export function Eki1AnaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Verb x={1150} y={230} word="رحت" end="-t" who="I went" id="rooht" size={60} hot />
      {lines >= 2 && (
        <>
          <Panel x={1360} y={480} pic="tree" text="رحت الجنينة" id="rooht-gneena" delay={0.1} />
          <Panel x={1150} y={480} pic="school" text="رحت المدرسة" delay={0.3} />
          <Panel x={940} y={480} pic="pot" text="رحت المطبخ" id="rooht-matbakh" delay={0.5} />
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={640} color={GOLD} delay={0.2}>رحت … ؟</Chip>}
    </>
  );
}

export function Eki1EntiGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1350} y={800} scale={0.9} color={ZIAD} />
      <Verb x={1350} y={330} word="رحت فين؟" end="-t" who="a boy" id="rooht-feen" size={40} />
      {lines >= 2 && <Person x={950} y={800} scale={0.9} color={MARIAM} hijab delay={0.1} />}
      {lines >= 2 && <Verb x={950} y={330} word="رحتي فين؟" end="-ti" who="a girl" id="roohti-feen" size={40} delay={0.3} hot />}
      {lines >= 3 && <Chip x={950} y={450} color={CRIMSON} delay={0.2}>إنتي · رحتي</Chip>}
    </>
  );
}

export function Eki1HuwaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 0 }} animate={{ x: 120 }} transition={{ duration: 1.4, delay: 0.4 }}>
        <Person x={1220} y={800} scale={0.9} color={ZIAD} />
      </motion.div>
      <Verb x={1350} y={330} word="راح" end="" id="ziad-rah" hot />
      {lines >= 2 && (
        <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 0 }} animate={{ x: -120 }} transition={{ duration: 1.4, delay: 0.4 }}>
          <Person x={1070} y={800} scale={0.9} color={MARIAM} hijab />
        </motion.div>
      )}
      {lines >= 2 && <Verb x={950} y={330} word="راحت" end="-it" who="a girl" id="mariam-rahit" delay={0.3} />}
      {lines >= 3 && <Chip x={1150} y={460} color={GOLD} delay={0.2}>a boy: nothing · a girl: -it</Chip>}
    </>
  );
}

/** The wow: the four verbs light up in turn above their people, like a clapping song. */
export function Eki1SongGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const row: [string, string, string, string, boolean][] = [['رحت', '-t', 'me', TEAL, false], ['رحتي', '-ti', 'you, a girl', CRIMSON, true], ['راح', '', 'him', GOLD, false], ['راحت', '-it', 'her', CRIMSON, true]];
  return (
    <>
      {row.map(([w, end, who, c, hijab], i) => {
        const x = 1420 - i * 190;
        return (
          <React.Fragment key={w}>
            <motion.div className="absolute" style={{ left: 0, top: 0 }} animate={lines >= 3 ? { y: [0, -24, 0] } : { y: 0 }} transition={{ delay: i * 0.35, duration: 0.5, repeat: lines >= 3 ? Infinity : 0, repeatDelay: 1.1 }}>
              <Verb x={x} y={300} word={w} end={end} who={who} id={i === 0 ? 'song' : undefined} size={40} delay={i * 0.3} />
            </motion.div>
            {lines >= 2 && <Person x={x} y={800} scale={0.8} color={c} hijab={hijab} delay={0.1 + i * 0.15} />}
          </React.Fragment>
        );
      })}
    </>
  );
}

/* ---------- athar ---------- */

export function Eki1TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <TetaDoor open />
      <Person x={900} y={800} scale={1} color={TETA} hijab />
      <Person x={1380} y={800} scale={0.85} color={ADAM} />
      <Say x={900} y={570} id="rooht-feen-naharda" text="رحت فين النهارده؟" width={240} size={26} delay={0.2} />
      {lines >= 2 && <Say x={1380} y={590} text="رحت…" align="right" width={120} size={28} accent delay={0.3} />}
    </>
  );
}

export function Eki1MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={0.8} color={ADAM} delay={0.2} />
      <Person x={1300} y={800} scale={1} color={CLAY} delay={0.3} />
      <Say x={1000} y={600} text="رحت فين النهارده؟" width={230} size={24} delay={0.5} />
      {lines >= 2 && <StreetCard x={1300} y={300} word="رحت…" size={34} delay={0.2} />}
    </>
  );
}

export function Eki1NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.svg className="pointer-events-none absolute" style={{ left: 1260, top: 380 }} width={240} height={420} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
        <rect x={100} y={60} width={40} height={360} rx={12} fill="#E2B04A" />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={i % 2 ? 132 : 108} cy={90 + i * 60} r={10} fill="#8A5A2B" />)}
        <ellipse cx={140} cy={50} rx={46} ry={30} fill="#E2B04A" />
      </motion.svg>
      <Person x={900} y={800} scale={1} color={TETA} hijab />
      <Person x={1100} y={800} scale={0.8} color={ZIAD} delay={0.2} />
      <Person x={1200} y={800} scale={0.8} color={MARIAM} hijab delay={0.3} />
      {lines >= 2 && <Say x={900} y={570} id="bokra-zoo" text="بكرة هنروح جنينة الحيوانات!" width={320} size={24} accent delay={0.2} />}
      {lines >= 3 && <Chip x={1150} y={330} color={CRIMSON} delay={0.3}>tomorrow</Chip>}
    </>
  );
}
