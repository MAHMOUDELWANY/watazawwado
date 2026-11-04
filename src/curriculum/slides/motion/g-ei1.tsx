import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Hear } from '../Say';
import { ArText, Say, Stairs, ADAM, MONA, SAYED } from './g-ea1';
import { BookCard, StreetCard } from './g-es1';

/**
 * Egyptian Arabic · Adults · Intermediate · Lesson 1 · What Did You Do Yesterday? New device: the ending tag. Every verb
 * is a whole-word tile; under it a gold tag snaps in with its ending (-t, -ti, -it) and the person it points to. "He"
 * gets an empty, dashed tag: no ending. A calendar page marks "yesterday" against the seven dots of "every day".
 */

const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';

/** A verb tile (whole word) with its ending tag below; an empty `end` draws a dashed slot. */
export function Verb({ x, y, word, end, who, id, delay = 0, size = 44, hot = false, color = GOLD }: { x: number; y: number; word: string; end: string; who?: string; id?: string; delay?: number; size?: number; hot?: boolean; color?: string }) {
  const tile = (
    <span className="inline-flex rounded-[18px]" style={{ padding: '2px 22px 4px', background: '#FFFDF8', boxShadow: hot ? `0 0 0 4px ${GOLD}, ${SHADOW}` : SHADOW }}>
      <ArText size={size}>{word}</ArText>
    </span>
  );
  return (
    <>
      <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>{id ? <Hear id={id}>{tile}</Hear> : tile}</motion.div>
      </div>
      <div className="absolute" style={{ left: x, top: y + size * 0.9 + 6, transform: 'translate(-50%, 0)' }}>
        <motion.span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full font-sans font-black" style={{ padding: '4px 14px', fontSize: 18, background: end ? color : 'transparent', color: end ? '#fff' : INK_TEXT, border: end ? 'none' : `2px dashed ${INK_TEXT}55` }}
          initial={{ opacity: 0, y: 26, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.7, delay: delay + 0.4 }}>
          {end || '—'}{who && <span className="font-bold" style={{ opacity: 0.85 }}>{who}</span>}
        </motion.span>
      </div>
    </>
  );
}

/** A calendar sheet: seven small days, with one (yesterday) or all (every day) lit. */
export function Week({ x, y, lit, label, delay = 0 }: { x: number; y: number; lit: 'all' | 'one'; label: string; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center gap-2" style={{ left: x - 170, top: y, width: 340 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <div className="flex gap-2">
        {Array.from({ length: 7 }, (_, i) => {
          const on = lit === 'all' || i === 5;
          return <motion.span key={i} className="rounded-[8px]" style={{ width: 38, height: 38, background: on ? (lit === 'all' ? TEAL : CRIMSON) : '#E8DCC8' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + 0.2 + i * 0.07, type: 'spring', bounce: 0.4 }} />;
        })}
      </div>
      <span className="font-sans font-bold" style={{ fontSize: 16, color: INK_TEXT }}>{label}</span>
    </motion.div>
  );
}

/** The three pyramids, for Adam's trip. */
function Pyramids({ delay = 0 }: { delay?: number }) {
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: 820, top: 420 }} width={660} height={380} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay, ease }}>
      <polygon points="40,380 230,110 420,380" fill="#E2C48E" />
      <polygon points="230,110 420,380 300,380" fill="#CFAE73" />
      <polygon points="330,380 480,170 630,380" fill="#E8CF9F" />
      <polygon points="480,170 630,380 540,380" fill="#D6B680" />
    </motion.svg>
  );
}

/* ---------- spark ---------- */

export function Ei1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Pyramids />
      <Person x={1000} y={800} scale={1} color={ADAM} delay={0.3} />
      <Person x={1150} y={800} scale={1} color={SAYED} delay={0.4} />
      <Verb x={1350} y={230} word="رحت" end="-t" who="I" delay={0.8} />
    </>
  );
}

export function Ei1RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Week x={1150} y={200} lit="all" label="every day" />
      <StreetCard x={1150} y={340} word="بروح الشغل كل يوم." id="barooh" size={32} delay={0.4} />
      {lines >= 2 && <Chip x={1150} y={400} color={TEAL} delay={0.2}>بـ = usually</Chip>}
      {lines >= 3 && (
        <>
          <Week x={1150} y={500} lit="one" label="yesterday" delay={0.1} />
          <StreetCard x={1150} y={640} word="امبارح رحت السوق." id="rooht-imbarih" size={32} delay={0.6} />
        </>
      )}
    </>
  );
}

export function Ei1StairsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Stairs />
      <Person x={980} y={800} scale={1.05} color={ADAM} lean={-3} />
      {lines >= 1 && <Person x={1330} y={570} scale={1} color={MONA} hijab delay={0.3} />}
      {lines >= 2 && <Chip x={1150} y={250} color={CRIMSON} delay={0.6}>Friday: a day off</Chip>}
      {lines >= 3 && <Say x={1330} y={350} text="؟" width={80} delay={0.2} />}
    </>
  );
}

/* ---------- zad ---------- */

export function Ei1StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Stairs />
      <Person x={980} y={800} scale={1.05} color={ADAM} />
      <Person x={1330} y={570} scale={1} color={MONA} hijab />
      {k >= 2 && <Person x={1150} y={800} scale={1} color={SAYED} delay={0.1} />}
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={1330} y={330} id="story-1" text="صباح الخير يا آدم! عملت إيه امبارح؟" align="right" width={330} size={24} delay={0.2} />
          <Say x={980} y={560} id="story-2" text="رحت الأهرامات!" width={230} size={26} accent delay={1.4} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1330} y={330} id="story-3" text="بجد؟ مع مين؟" align="right" width={200} size={26} delay={0.2} />
          <Say x={980} y={560} id="story-4" text="مع عم سيد. هو راح معايا." width={280} size={24} accent delay={1.4} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1150} y={570} id="story-5" text="وإنتي يا منى، رحتي فين امبارح؟" align="right" width={310} size={22} delay={0.2} />
          <Say x={1330} y={330} id="story-6" text="أنا؟ رحت الشغل… زي كل يوم!" align="right" width={300} size={24} accent delay={1.6} />
        </React.Fragment>
      )}
    </>
  );
}

export function Ei1AnaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Verb x={1150} y={230} word="رحت" end="-t" who="me" id="rooht" size={56} hot />
      {lines >= 2 && (
        <>
          <StreetCard x={1380} y={420} word="رحت الشغل." id="rooht-shoghl" size={30} delay={0.2} />
          <StreetCard x={1150} y={420} word="رحت السوق." id="rooht-soo2" size={30} delay={0.4} />
          <StreetCard x={920} y={420} word="رحت الأهرامات." size={30} delay={0.6} />
          <Chip x={1150} y={470} delay={0.9}>no word for "to"</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Person x={1000} y={800} scale={0.9} color={ADAM} />
          <Person x={1300} y={800} scale={0.9} color={MONA} hijab />
          <Say x={1300} y={605} id="amalt-eh" text="عملت إيه؟" align="right" width={180} size={28} delay={0.3} />
        </>
      )}
    </>
  );
}

export function Ei1EntaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1350} y={800} scale={1} color={ADAM} />
      <Verb x={1350} y={300} word="رحت" end="-t" who="you, a man" id="rooht-feen" />
      {lines >= 2 && <Person x={950} y={800} scale={1} color={MONA} hijab delay={0.1} />}
      {lines >= 2 && <Verb x={950} y={300} word="رحتي" end="-ti" who="you, a woman" id="roohti-feen" delay={0.3} hot />}
      {lines >= 3 && (
        <>
          <Chip x={950} y={420} color={CRIMSON} delay={0.2}>إنتي · اسمِك · رحتي</Chip>
        </>
      )}
    </>
  );
}

export function Ei1HuwaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1350} y={800} scale={1} color={SAYED} />
      <Verb x={1350} y={300} word="راح" end="" who="" id="rah" hot />
      <Chip x={1350} y={420} color={TEAL} delay={0.8}>raaḥ: the long aa is back</Chip>
      {lines >= 2 && <Person x={950} y={800} scale={1} color={MONA} hijab delay={0.1} />}
      {lines >= 2 && <Verb x={950} y={300} word="راحت" end="-it" who="her" id="rahit" delay={0.3} />}
      {lines >= 3 && <StreetCard x={1150} y={520} word="هو راح معايا." id="rah-maaya" size={30} delay={0.2} />}
    </>
  );
}

export function Ei1MoreGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows: [string, string, string, string, string][] = [
    ['shiribt', 'شربت', 'شربتي', 'شرب', 'شربت'],
    ['shuft', 'شفت', 'شفتي', 'شاف', 'شافت'],
    ['kalt', 'كلت', 'كلتي', 'كل', 'كلت'],
  ];
  return (
    <>
      {rows.slice(0, lines).map(([id, me, you, him, her], r) => (
        <React.Fragment key={id}>
          <Verb x={1430} y={210 + r * 180} word={me} end="-t" id={id} size={34} delay={0.1} />
          <Verb x={1230} y={210 + r * 180} word={you} end="-ti" size={34} delay={0.3} />
          <Verb x={1030} y={210 + r * 180} word={him} end="" size={34} delay={0.5} />
          <Verb x={850} y={210 + r * 180} word={her} end="-it" size={34} delay={0.7} />
        </React.Fragment>
      ))}
    </>
  );
}

/** The wow: the Cairo endings line up beside the Fusha ones. */
export function Ei1PatternGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const cairo: [string, string, string, string?][] = [['رحت', '-t', 'me', 'rooht-2'], ['رحت', '-t', 'you (m)'], ['رحتي', '-ti', 'you (f)', 'roohti'], ['راح', '', 'him', 'rah-2'], ['راحت', '-it', 'her', 'rahit-2']];
  const fusha = ['ذَهَبْتُ', 'ذَهَبْتَ', 'ذَهَبْتِ', 'ذَهَبَ', 'ذَهَبَتْ'];
  return (
    <>
      {cairo.map(([w, end, who, id], i) => <Verb key={i} x={1340} y={215 + i * 112} word={w} end={end} who={who} id={id} size={32} delay={i * 0.15} />)}
      {lines >= 2 && fusha.map((w, i) => <BookCard key={w} x={1020} y={230 + i * 112} word={w} size={32} delay={0.2 + i * 0.15} />)}
      {lines >= 3 && <Chip x={1180} y={760} color={GOLD} delay={0.3}>same endings, fewer vowels</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Ei1TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Stairs />
      <Person x={980} y={800} scale={1.05} color={ADAM} />
      <Person x={1330} y={570} scale={1} color={MONA} hijab />
      <Say x={1330} y={330} id="amalti-eh" text="عملتي إيه امبارح؟" align="right" width={240} size={26} delay={0.3} />
      {lines >= 2 && (
        <>
          <Chip x={980} y={300} color={TEAL} delay={0.1}>رحت…</Chip>
          <Chip x={980} y={360} color={TEAL} delay={0.3}>كلت…</Chip>
          <Chip x={980} y={420} color={TEAL} delay={0.5}>شفت…</Chip>
        </>
      )}
    </>
  );
}

export function Ei1MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[36px]" style={{ left: 1030, top: 170, width: 260, height: 500, background: '#2A1E18', boxShadow: SHADOW }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="absolute flex items-center gap-[3px] rounded-full" style={{ left: 24, top: 210, width: 212, height: 64, padding: '0 16px', background: TEAL }}>
          {Array.from({ length: 22 }, (_, i) => (
            <motion.span key={i} className="rounded-full" style={{ width: 4, background: '#fff' }} initial={{ height: 4 }} animate={{ height: 8 + ((i * 37) % 30) }} transition={{ delay: 0.5 + i * 0.04, duration: 0.3 }} />
          ))}
        </div>
        <span className="absolute font-sans font-bold" style={{ left: 30, top: 290, fontSize: 16, color: '#fff' }}>0:30</span>
      </motion.div>
      {lines >= 2 && <Chip x={1160} y={720} color={GOLD} delay={0.2}>عملت إيه النهارده؟</Chip>}
    </>
  );
}

export function Ei1NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.svg className="pointer-events-none absolute" style={{ left: 760, top: 620 }} width={760} height={180} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        {[0, 1, 2].map((i) => <motion.path key={i} d={`M0 ${40 + i * 40} q 95 -24 190 0 t 190 0 t 190 0 t 190 0`} stroke={TEAL} strokeWidth={6} fill="none" opacity={0.5 - i * 0.12} initial={{ x: -40 }} animate={{ x: 0 }} transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }} />)}
      </motion.svg>
      <Person x={1000} y={640} scale={0.9} color={ADAM} />
      <Person x={1300} y={640} scale={0.9} color={MONA} hijab />
      {lines >= 2 && <Say x={1300} y={420} id="bokra-hanrooh" text="بكرة هنروح إسكندرية!" align="right" width={280} size={26} accent delay={0.2} />}
      {lines >= 3 && <Chip x={1150} y={230} color={CRIMSON} delay={0.3}>هـ = tomorrow</Chip>}
    </>
  );
}
