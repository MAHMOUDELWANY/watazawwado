import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { ArText, Say, Stairs, ADAM, MONA, SAYED } from './g-ea1';
import { StreetCard } from './g-es1';
import { Verb } from './g-ei1';

/**
 * Egyptian Arabic · Adults · Intermediate · Lesson 2 · Tomorrow, God Willing. New device: the timeline, read right to
 * left like Arabic: yesterday on the right, every day in the middle, tomorrow on the left. A marker slides along it to
 * the time a verb lives in; the verb's tag shows what moved (the end for the past, the front for بـ and هـ).
 */

const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const STOPS = { past: 1400, now: 1150, future: 900 } as const;
const LABEL = { past: 'امبارح', now: 'كل يوم', future: 'بكرة' } as const;
type When = keyof typeof STOPS;

/** The timeline at height y, with the marker at `at` (or none). */
function Timeline({ y, at, delay = 0 }: { y: number; at?: When; delay?: number }) {
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: 840, top: y - 3, height: 6, width: 620, background: '#E3D3BA' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay, ease }} />
      <motion.span className="pointer-events-none absolute" style={{ left: 832, top: y - 10, width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: '16px solid #E3D3BA' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.6 }} />
      {(Object.keys(STOPS) as When[]).map((w) => (
        <React.Fragment key={w}>
          <span className="pointer-events-none absolute rounded-full" style={{ left: STOPS[w] - 9, top: y - 9, width: 18, height: 18, background: at === w ? CRIMSON : '#CDB898' }} />
          <div className="pointer-events-none absolute" style={{ left: STOPS[w], top: y + 18, transform: 'translateX(-50%)' }}><ArText size={22} color={at === w ? CRIMSON : INK_TEXT}>{LABEL[w]}</ArText></div>
        </React.Fragment>
      ))}
      {at && <motion.span className="pointer-events-none absolute rounded-full" style={{ top: y - 16, width: 32, height: 32, background: `${CRIMSON}33`, border: `3px solid ${CRIMSON}` }} initial={{ left: STOPS.now - 16 }} animate={{ left: STOPS[at] - 16 }} transition={{ type: 'spring', bounce: 0.3, duration: 1, delay: delay + 0.5 }} />}
    </>
  );
}

/** Two train tickets, for the Alexandria trip. */
function Tickets({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <>
      {[0, 1].map((i) => (
        <motion.div key={i} className="pointer-events-none absolute flex items-center justify-center rounded-[10px] font-sans font-black" style={{ left: x - 70 + i * 26, top: y - 40 + i * 14, width: 140, height: 70, background: i ? '#FFFDF8' : GOLD, color: i ? INK_TEXT : '#fff', fontSize: 16, boxShadow: SHADOW, borderLeft: `6px dashed ${i ? GOLD : '#fff'}` }}
          initial={{ opacity: 0, rotate: -20, y: 30 }} animate={{ opacity: 1, rotate: -8 + i * 10, y: 0 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.9, delay: delay + i * 0.15 }}>
          {i ? 'Alexandria' : 'CAIRO → ALEX'}
        </motion.div>
      ))}
    </>
  );
}

/* ---------- spark ---------- */

export function Ei2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Timeline y={260} at="future" delay={0.2} />
      <Verb x={1000} y={450} word="هروح" end="ha-" who="tomorrow" size={44} color={CRIMSON} delay={1} />
      <Person x={1300} y={800} scale={1} color={ADAM} delay={0.3} />
      <Person x={1450} y={800} scale={1} color={MONA} hijab delay={0.4} />
    </>
  );
}

export function Ei2RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Timeline y={240} at={lines >= 2 ? 'future' : 'past'} />
      <Verb x={1400} y={400} word="رحت" end="-t" who="yesterday" id="rooht" size={40} />
      {lines >= 3 && <StreetCard x={980} y={430} word="بكرة هنروح إسكندرية." id="hanrooh" size={30} delay={0.2} />}
      {lines >= 3 && <Chip x={980} y={500} color={CRIMSON} delay={0.6}>listen: ha- at the front</Chip>}
    </>
  );
}

export function Ei2NewsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Stairs />
      <Person x={980} y={800} scale={1.05} color={ADAM} />
      <Person x={1330} y={570} scale={1} color={MONA} hijab lean={4} />
      <Tickets x={1250} y={300} delay={0.4} />
      {lines >= 2 && <Chip x={1020} y={360} color={TEAL} delay={0.2}>tomorrow: one day by the sea</Chip>}
      {lines >= 3 && <Say x={980} y={560} text="؟ ؟ ؟" width={120} delay={0.2} />}
    </>
  );
}

/* ---------- zad ---------- */

export function Ei2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Stairs />
      <Person x={980} y={800} scale={1.05} color={ADAM} />
      <Person x={1330} y={570} scale={1} color={MONA} hijab />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={1330} y={330} id="story-1" text="بكرة هنروح إسكندرية!" align="right" width={260} size={26} accent delay={0.2} />
          <Say x={980} y={560} id="story-2" text="بجد؟ هتمشوا إمتى؟" width={240} size={26} delay={1.4} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1330} y={330} id="story-3" text="هنمشي الساعة سبعة الصبح، إن شاء الله." align="right" width={380} size={22} delay={0.2} />
          <Say x={980} y={560} id="story-4" text="وهتعملوا إيه هناك؟" width={240} size={26} delay={1.4} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1330} y={330} id="story-5" text="هناكل سمك ونقعد على البحر. هتيجي معانا؟" align="right" width={400} size={22} delay={0.2} />
          <Say x={980} y={560} id="story-6" text="أكيد هاجي!" width={180} size={28} accent delay={1.6} />
        </React.Fragment>
      )}
    </>
  );
}

/** The بـ tag drops off and the هـ tag snaps on: the same verb moves to tomorrow. */
export function Ei2SwapGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const tomorrow = lines >= 2;
  return (
    <>
      <Timeline y={220} at={tomorrow ? 'future' : 'now'} />
      <React.Fragment key={tomorrow ? 'f' : 'n'}>
        <Verb x={1150} y={400} word={tomorrow ? 'هروح' : 'بروح'} end={tomorrow ? 'ha-' : 'bi-'} who={tomorrow ? 'tomorrow' : 'every day'} id={tomorrow ? 'harooh' : 'barooh'} size={60} color={tomorrow ? CRIMSON : TEAL} hot />
      </React.Fragment>
      {lines >= 3 && <StreetCard x={1150} y={600} word="بكرة هروح الشغل." id="bokra-harooh" size={30} delay={0.2} />}
    </>
  );
}

export function Ei2WhoGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Verb x={1380} y={220} word="هتروح" end="ha-t" who="you (m)" id="hatrooh" size={36} color={CRIMSON} />
      <Verb x={1080} y={220} word="هتروحي" end="ha-t…i" who="you (f)" id="hatroohi" size={36} color={CRIMSON} delay={0.2} />
      {lines >= 2 && (
        <>
          <Verb x={1380} y={400} word="هيروح" end="ha-y" who="him" id="hayrooh" size={36} color={CRIMSON} delay={0.1} />
          <Verb x={1080} y={400} word="هتروح" end="ha-t" who="her" size={36} color={CRIMSON} delay={0.3} />
          <Verb x={1230} y={570} word="هنروح" end="ha-n" who="us" id="hanrooh-2" size={36} color={CRIMSON} delay={0.5} />
        </>
      )}
      {lines >= 3 && <Chip x={1230} y={720} color={GOLD} delay={0.3}>هـ + the present you know</Chip>}
    </>
  );
}

export function Ei2MishGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Verb x={1150} y={230} word="مش هروح" end="mish ha-" who="won't" id="mish-harooh" size={52} color={CRIMSON} />
      {lines >= 2 && <Chip x={1150} y={360} color={TEAL} delay={0.2}>مش بروح · مش هروح</Chip>}
      {lines >= 3 && (
        <>
          <Person x={1200} y={800} scale={1} color={SAYED} />
          <Say x={1200} y={570} id="andi-shoghl" text="أنا مش هروح، عندي شغل." align="right" width={300} size={24} delay={0.3} />
        </>
      )}
    </>
  );
}

export function Ei2InshallahGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1150} y={230} word="إن شاء الله" id="inshallah" size={46} delay={0.1} />
      {lines >= 2 && (
        <>
          <Chip x={950} y={340} delay={0.1}>a friend</Chip>
          <Chip x={1150} y={340} delay={0.3}>a shop</Chip>
          <Chip x={1350} y={340} delay={0.5}>an office</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Timeline y={520} at="future" delay={0.1} />
          <StreetCard x={1150} y={640} word="بعد بكرة" id="baad-bokra" size={28} delay={0.5} />
          <StreetCard x={900} y={640} word="الأسبوع الجاي" id="usbooa-gay" size={28} delay={0.7} />
        </>
      )}
    </>
  );
}

/** The wow: one verb sits at all three stops. */
export function Ei2LineGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Timeline y={220} />
      <Verb x={STOPS.past} y={360} word="رحت" end="-t" who="the end" id="rooht-2" size={40} color={GOLD} />
      <Verb x={STOPS.now} y={360} word="بروح" end="bi-" who="the front" id="barooh-2" size={40} color={TEAL} delay={0.3} />
      <Verb x={STOPS.future} y={360} word="هروح" end="ha-" who="the front" id="harooh-2" size={40} color={CRIMSON} delay={0.6} />
      {lines >= 2 && <Chip x={1150} y={520} delay={0.2}>past: the end moves · present and future: the front</Chip>}
      {lines >= 3 && <Chip x={1150} y={590} color={GOLD} delay={0.3}>any day of your life</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Ei2TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={980} y={800} scale={1.05} color={ADAM} />
      <Person x={1330} y={800} scale={1} color={MONA} hijab />
      <Say x={1330} y={570} id="hatamel-eh" text="هتعمل إيه بكرة؟" align="right" width={220} size={26} delay={0.2} />
      {lines >= 2 && (
        <>
          <Chip x={980} y={300} color={CRIMSON} delay={0.1}>هـ…</Chip>
          <Chip x={980} y={360} color={CRIMSON} delay={0.3}>هـ…</Chip>
          <Chip x={980} y={420} color={CRIMSON} delay={0.5}>مش هـ…</Chip>
          <Chip x={980} y={480} color={TEAL} delay={0.7}>إن شاء الله</Chip>
        </>
      )}
    </>
  );
}

export function Ei2MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const days = ['Fri', 'Sat', 'Sun'];
  return (
    <>
      {days.map((d, i) => (
        <motion.div key={d} className="pointer-events-none absolute flex flex-col items-center rounded-[18px]" style={{ left: 880 + i * 200, top: 200, width: 170, height: 260, background: '#FFFDF8', boxShadow: SHADOW, padding: 14 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: i * 0.15, ease }}>
          <span className="font-sans font-black" style={{ fontSize: 18, color: CRIMSON }}>{d}</span>
          {[0, 1, 2].map((r) => <span key={r} className="mt-4 rounded-full" style={{ width: 120, height: 8, background: '#E8DCC8' }} />)}
        </motion.div>
      ))}
      {lines >= 2 && <Chip x={1150} y={520} color={GOLD} delay={0.2}>5 × هـ · 1 × مش هـ</Chip>}
    </>
  );
}

export function Ei2NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[26px]" style={{ top: 420, width: 520, height: 200, background: '#D7DEE2', boxShadow: SHADOW }} initial={{ left: 840 }} animate={{ left: lines >= 2 ? 770 : 840, opacity: lines >= 2 ? 0.35 : 1 }} transition={{ duration: 2.2, ease }}>
        {[0, 1, 2].map((i) => <span key={i} className="absolute rounded-[8px]" style={{ left: 40 + i * 160, top: 34, width: 120, height: 80, background: '#9FB3BF' }} />)}
        <span className="absolute" style={{ left: 0, top: 150, width: 520, height: 10, background: CRIMSON }} />
      </motion.div>
      {lines >= 2 && <Person x={1400} y={800} scale={1} color={ADAM} lean={-8} delay={0.2} />}
      {lines >= 2 && <Say x={1400} y={570} id="fagaa" text="وفجأة… القطر مشي!" align="right" width={260} size={26} accent delay={0.6} />}
      {lines >= 3 && <Chip x={1100} y={320} color={CRIMSON} delay={0.3}>وبعدين · فجأة</Chip>}
    </>
  );
}
