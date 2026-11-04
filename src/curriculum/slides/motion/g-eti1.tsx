import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Hear } from '../Say';
import { ArText, Say } from './g-ea1';
import { StreetCard } from './g-es1';
import { Pitch, Ball } from './g-egy';
import { Verb, Week } from './g-ei1';

/**
 * Egyptian Arabic · Teens · Intermediate · Lesson 1 · What Did You Do at the Match? The summer club a year later: Omar
 * (teal), Karim (gold), Nour (crimson, hijab). Reuses the ending tag from Adults Intermediate; new here: the team group
 * chat, where messages carry no names and the ending alone tells you who did what.
 */

const OMAR = TEAL;
const KARIM = GOLD;
const NOUR = CRIMSON;
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';

/** A phone with chat bubbles; `n` bubbles shown. */
function Chat({ msgs, n, id }: { msgs: { t: string; who: string; c: string }[]; n: number; id?: string }) {
  return (
    <motion.div className="pointer-events-none absolute rounded-[36px]" style={{ left: 990, top: 160, width: 340, height: 600, background: '#2A1E18', boxShadow: SHADOW }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
      <div className="absolute inset-x-[14px] top-[44px] bottom-[20px] flex flex-col gap-3 rounded-[24px] p-4" style={{ background: '#F3EEE5' }}>
        <span className="font-sans font-black" style={{ fontSize: 15, color: '#5A4636' }}>Team chat</span>
        {msgs.slice(0, n).map((m, i) => (
          <motion.div key={i} className="pointer-events-auto flex flex-col items-end gap-1" initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.6, delay: i * 0.25 }}>
            <span className="rounded-[16px]" style={{ padding: '4px 14px', background: '#FFFDF8', boxShadow: '0 6px 14px -10px rgba(0,0,0,0.5)' }}>{i === 0 && id ? <Hear id={id}><ArText size={24}>{m.t}</ArText></Hear> : <ArText size={24}>{m.t}</ArText>}</span>
            <span className="rounded-full font-sans font-bold" style={{ padding: '1px 10px', fontSize: 13, background: m.c, color: '#fff' }}>{m.who}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Eti1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Pitch />
      <Ball x={1300} y={735} from={-200} delay={0.4} />
      <Person x={950} y={800} scale={1} color={OMAR} delay={0.2} />
      <Person x={1120} y={800} scale={1} color={NOUR} hijab delay={0.3} />
      <Verb x={1150} y={330} word="جبت" end="-t" who="I scored" size={48} delay={0.8} />
    </>
  );
}

export function Eti1RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Week x={1150} y={200} lit="all" label="every day" />
      <StreetCard x={1150} y={340} word="بلعب كورة كل يوم." id="balaab" size={32} delay={0.4} />
      {lines >= 2 && <Chip x={1150} y={400} color={TEAL} delay={0.2}>بـ = usually</Chip>}
      {lines >= 3 && (
        <>
          <Week x={1150} y={500} lit="one" label="yesterday" delay={0.1} />
          <StreetCard x={1150} y={640} word="امبارح رحت النادي." id="rooht-imbarih" size={32} delay={0.6} />
        </>
      )}
    </>
  );
}

export function Eti1ClubGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Pitch />
      <Person x={900} y={800} scale={1} color={KARIM} lean={-4} />
      {lines >= 2 && <Person x={1180} y={800} scale={1} color={OMAR} delay={0.1} />}
      {lines >= 2 && <Person x={1320} y={800} scale={1} color={NOUR} hijab delay={0.2} />}
      {lines >= 2 && <Ball x={1250} y={560} delay={0.3} />}
      {lines >= 3 && <Say x={900} y={570} text="؟!" width={90} accent delay={0.2} />}
    </>
  );
}

/* ---------- zad ---------- */

export function Eti1StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Pitch />
      <Person x={900} y={800} scale={1} color={KARIM} />
      <Person x={1150} y={800} scale={1} color={OMAR} />
      <Person x={1330} y={800} scale={1} color={NOUR} hijab />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={900} y={570} id="story-1" text="يا عمر! عملت إيه في الماتش؟" width={280} size={24} delay={0.2} />
          <Say x={1150} y={420} id="story-2" text="جبت جون!" width={170} size={28} accent delay={1.4} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={900} y={570} id="story-3" text="بجد؟ ونور؟" width={170} size={26} delay={0.2} />
          <Say x={1150} y={500} id="story-4" text="نور جابت جونين!" width={220} size={26} accent delay={1.2} />
          <Say x={900} y={370} id="story-5" text="إنتي جبتي جونين؟!" width={230} size={24} delay={2.2} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1330} y={570} id="story-6" text="آه! وإنت رحت فين؟" align="right" width={240} size={24} delay={0.2} />
          <Say x={900} y={570} id="story-7" text="نمت…" width={110} size={28} accent delay={1.4} />
        </React.Fragment>
      )}
    </>
  );
}

export function Eti1AnaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Verb x={1150} y={230} word="جبت" end="-t" who="me" id="gibt" size={56} hot />
      <Ball x={1300} y={240} from={-120} delay={0.6} />
      {lines >= 2 && <Chip x={1150} y={370} color={TEAL} delay={0.2}>to a guy: جبت؟ (the same)</Chip>}
      {lines >= 3 && (
        <>
          <Person x={1000} y={800} scale={0.9} color={KARIM} />
          <Person x={1300} y={800} scale={0.9} color={OMAR} />
          <Say x={1000} y={605} id="amalt-eh" text="عملت إيه؟" width={170} size={28} delay={0.3} />
        </>
      )}
    </>
  );
}

export function Eti1EntiGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1150} y={800} scale={1} color={NOUR} hijab />
      <Verb x={1150} y={250} word="جبتي" end="-ti" who="you, a girl" id="gibti" size={52} hot />
      {lines >= 2 && <Chip x={1150} y={380} color={CRIMSON} delay={0.2}>إنتي · جبتي</Chip>}
      {lines >= 3 && <StreetCard x={1150} y={480} word="رحتي فين؟" id="roohti" size={30} delay={0.2} />}
    </>
  );
}

export function Eti1HuwaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1350} y={800} scale={1} color={OMAR} />
      <Verb x={1350} y={280} word="جاب" end="" id="gab" hot />
      <Chip x={1350} y={400} color={TEAL} delay={0.8}>gaab: the long aa is back</Chip>
      {lines >= 2 && <Person x={950} y={800} scale={1} color={NOUR} hijab delay={0.1} />}
      {lines >= 2 && <Verb x={950} y={280} word="جابت" end="-it" who="her" id="gabit" delay={0.3} />}
      {lines >= 3 && <Chip x={1150} y={500} color={GOLD} delay={0.2}>the shortest word = he</Chip>}
    </>
  );
}

export function Eti1TuneGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows: [string | undefined, string, string, string, string][] = [['nimt', 'نمت', 'نمتي', 'نام', 'نامت'], ['rooht', 'رحت', 'رحتي', 'راح', 'راحت'], [undefined, 'جبت', 'جبتي', 'جاب', 'جابت']];
  return (
    <>
      {rows.slice(0, lines).map(([id, me, you, him, her], r) => (
        <React.Fragment key={me}>
          <Verb x={1430} y={210 + r * 180} word={me} end="-t" id={id} size={34} delay={0.1} />
          <Verb x={1230} y={210 + r * 180} word={you} end="-ti" size={34} delay={0.3} />
          <Verb x={1030} y={210 + r * 180} word={him} end="" size={34} delay={0.5} />
          <Verb x={850} y={210 + r * 180} word={her} end="-it" size={34} delay={0.7} />
        </React.Fragment>
      ))}
    </>
  );
}

/** The wow: a chat without names; the ending tags reveal who. */
export function Eti1ChatGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const reveal = lines >= 3;
  const msgs = [
    { t: 'جبت جون.', who: reveal ? 'me' : '?', c: reveal ? GOLD : '#9A8F86' },
    { t: 'جابت جونين!', who: reveal ? 'her' : '?', c: reveal ? CRIMSON : '#9A8F86' },
    { t: 'رحتي فين؟', who: reveal ? 'you, a girl' : '?', c: reveal ? CRIMSON : '#9A8F86' },
    { t: 'نمت…', who: reveal ? 'me' : '?', c: reveal ? GOLD : '#9A8F86' },
  ];
  return <Chat msgs={msgs} n={lines >= 2 ? 4 : 1} id="chat" />;
}

/* ---------- athar ---------- */

export function Eti1TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Pitch />
      <Person x={980} y={800} scale={1} color={KARIM} />
      <Person x={1330} y={800} scale={1} color={NOUR} hijab />
      <Say x={1330} y={570} id="amalti-eh" text="عملتي إيه امبارح؟" align="right" width={240} size={26} delay={0.2} />
      {lines >= 2 && <Chip x={980} y={420} color={TEAL} delay={0.2}>وصاحبك عمل إيه؟</Chip>}
    </>
  );
}

export function Eti1MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const msgs = [
    { t: 'امبارح…', who: 'me', c: GOLD },
    { t: 'امبارح…', who: 'a girl', c: CRIMSON },
    { t: 'امبارح…', who: 'a guy', c: TEAL },
  ];
  return <Chat msgs={msgs} n={lines >= 2 ? 3 : 1} />;
}

export function Eti1NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Pitch />
      <motion.div className="pointer-events-none absolute" style={{ left: 1420, top: 420 }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.9, delay: 0.3 }}>
        <svg width={80} height={100} viewBox="0 0 80 100"><path d="M10 4 h60 v20 q0 30 -30 34 q-30 -4 -30 -34 z" fill={GOLD} /><rect x={34} y={56} width={12} height={20} fill={GOLD} /><rect x={20} y={76} width={40} height={10} rx={3} fill={GOLD} /></svg>
      </motion.div>
      <Person x={1000} y={800} scale={1} color="#5A4636" />
      <Person x={1200} y={800} scale={0.95} color={OMAR} delay={0.2} />
      <Person x={1330} y={800} scale={0.95} color={NOUR} hijab delay={0.3} />
      {lines >= 2 && <Say x={1000} y={570} id="bokra-hanlaab" text="بكرة هنلعب الفاينل!" width={250} size={26} accent delay={0.2} />}
      {lines >= 3 && <Chip x={1150} y={300} color={CRIMSON} delay={0.3}>هـ = tomorrow</Chip>}
    </>
  );
}
