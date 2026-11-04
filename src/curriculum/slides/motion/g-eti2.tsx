import React from 'react';
import { motion } from 'motion/react';
import { CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Say } from './g-ea1';
import { StreetCard } from './g-es1';
import { Pitch, Ball } from './g-egy';
import { Verb } from './g-ei1';
import { Timeline } from './g-ei2';

/**
 * Egyptian Arabic · Teens · Intermediate · Lesson 2 · Tomorrow's Final. The club the night before the final: the coach
 * (brown), Omar (teal), Karim (gold), Nour (crimson, hijab). Reuses the Adults timeline (yesterday · every day ·
 * tomorrow, read right to left) and the prefix tag: هـ is a crimson tag that snaps onto the front of the verb.
 */

const OMAR = TEAL;
const KARIM = GOLD;
const NOUR = CRIMSON;
const COACH = '#5A4636';

function Cup({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x - 40, top: y - 50 }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.9, delay }}>
      <svg width={80} height={100} viewBox="0 0 80 100"><path d="M10 4 h60 v20 q0 30 -30 34 q-30 -4 -30 -34 z" fill={GOLD} /><rect x={34} y={56} width={12} height={20} fill={GOLD} /><rect x={20} y={76} width={40} height={10} rx={3} fill={GOLD} /></svg>
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Eti2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Pitch />
      <Cup x={1440} y={500} delay={0.4} />
      <Timeline y={260} at="future" delay={0.2} />
      <Verb x={1000} y={420} word="هنلعب" end="ha-" who="tomorrow" size={42} color={CRIMSON} delay={1} />
      <Person x={1150} y={800} scale={1} color={KARIM} delay={0.3} />
      <Person x={1300} y={800} scale={1} color={NOUR} hijab delay={0.4} />
    </>
  );
}

export function Eti2RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Timeline y={240} at={lines >= 2 ? 'future' : 'past'} />
      <Verb x={1400} y={400} word="جبت" end="-t" who="yesterday" id="gibt" size={40} />
      {lines >= 2 && <StreetCard x={990} y={430} word="بكرة هنلعب الفاينل." id="hanlaab" size={30} delay={0.2} />}
      {lines >= 3 && <Chip x={990} y={500} color={CRIMSON} delay={0.3}>listen: ha- at the front</Chip>}
    </>
  );
}

export function Eti2NewsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Pitch />
      <Person x={1000} y={800} scale={1.05} color={COACH} />
      <Person x={1180} y={800} scale={0.95} color={OMAR} delay={0.1} />
      <Person x={1300} y={800} scale={0.95} color={NOUR} hijab delay={0.2} />
      <Person x={1420} y={800} scale={0.95} color={KARIM} delay={0.3} />
      {lines >= 2 && <Cup x={1150} y={330} delay={0.2} />}
      {lines >= 2 && <Chip x={1150} y={420} color={CRIMSON} delay={0.5}>tomorrow: the final</Chip>}
      {lines >= 3 && <Chip x={1420} y={500} color={GOLD} delay={0.2}>Karim: something to prove</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

export function Eti2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Pitch />
      <Person x={900} y={800} scale={1.05} color={COACH} />
      <Person x={1100} y={800} scale={0.95} color={KARIM} />
      <Person x={1250} y={800} scale={0.95} color={NOUR} hijab />
      <Person x={1400} y={800} scale={0.95} color={OMAR} />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={900} y={570} id="story-1" text="بكرة هنلعب الفاينل!" width={240} size={26} accent delay={0.2} />
          <Say x={1100} y={420} id="story-2" text="هنلعب الساعة كام يا كابتن؟" width={300} size={24} delay={1.4} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={900} y={570} id="story-3" text="هنبدأ الساعة خمسة. هتيجوا بدري؟" width={330} size={22} delay={0.2} />
          <Say x={1250} y={400} id="story-4" text="أنا هاجي الساعة أربعة!" width={250} size={24} delay={1.4} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1400} y={570} id="story-5" text="وأنا هجيب الكورة." align="right" width={220} size={24} delay={0.2} />
          <Say x={1100} y={420} id="story-6" text="وأنا… مش هنام النهارده!" width={280} size={24} accent delay={1.4} />
        </React.Fragment>
      )}
    </>
  );
}

export function Eti2SwapGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const t = lines >= 2;
  return (
    <>
      <Timeline y={220} at={t ? 'future' : 'now'} />
      <React.Fragment key={t ? 'f' : 'n'}>
        <Verb x={1150} y={400} word={t ? 'هلعب' : 'بلعب'} end={t ? 'ha-' : 'bi-'} who={t ? 'tomorrow' : 'every day'} id={t ? 'halaab' : 'balaab'} size={60} color={t ? CRIMSON : TEAL} hot />
      </React.Fragment>
      {lines >= 3 && <StreetCard x={1150} y={600} word="بكرة هلعب." id="bokra-halaab" size={30} delay={0.2} />}
    </>
  );
}

export function Eti2WhoGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Verb x={1380} y={220} word="هتلعب" end="ha-t" who="you (guy)" id="hatlaab" size={36} color={CRIMSON} />
      <Verb x={1080} y={220} word="هتلعبي" end="ha-t…i" who="you (girl)" id="hatlaabi" size={36} color={CRIMSON} delay={0.2} />
      {lines >= 2 && (
        <>
          <Verb x={1380} y={400} word="هيلعب" end="ha-y" who="he" id="haylaab" size={36} color={CRIMSON} delay={0.1} />
          <Verb x={1080} y={400} word="هتلعب" end="ha-t" who="she" size={36} color={CRIMSON} delay={0.3} />
          <Verb x={1230} y={570} word="هنلعب" end="ha-n" who="we" id="hanlaab-2" size={36} color={CRIMSON} delay={0.5} />
        </>
      )}
      {lines >= 3 && <Chip x={1230} y={720} color={GOLD} delay={0.3}>هـ + the present you know</Chip>}
    </>
  );
}

export function Eti2MishGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Verb x={1150} y={230} word="مش هنام" end="mish ha-" who="won't" id="mish-hanam" size={52} color={CRIMSON} />
      {lines >= 2 && (
        <>
          <Person x={1000} y={800} scale={1} color={KARIM} />
          <Person x={1300} y={800} scale={0.95} color={NOUR} hijab />
          <Say x={1300} y={570} text="؟!" align="right" width={90} delay={0.3} />
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={360} color={TEAL} delay={0.2}>مش بلعب · مش هلعب</Chip>}
    </>
  );
}

export function Eti2SureGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Verb x={1150} y={230} word="هاجي" end="ha-" who="I'll come" size={48} color={CRIMSON} />
      {lines >= 2 && (
        <>
          <StreetCard x={1330} y={420} word="هاجي أكيد." id="akeed" size={30} delay={0.2} />
          <StreetCard x={980} y={420} word="هاجي إن شاء الله." id="inshallah" size={30} delay={0.4} />
          <Chip x={1330} y={490} color={TEAL} delay={0.6}>for sure</Chip>
          <Chip x={980} y={490} color={GOLD} delay={0.8}>God willing</Chip>
        </>
      )}
    </>
  );
}

export function Eti2LineGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Timeline y={220} />
      <Verb x={1400} y={360} word="جبت" end="-t" who="the end" id="gibt-2" size={40} color={GOLD} />
      <Verb x={1150} y={360} word="بجيب" end="bi-" who="the front" id="bageeb" size={40} color={TEAL} delay={0.3} />
      <Verb x={900} y={360} word="هجيب" end="ha-" who="the front" id="hageeb" size={40} color={CRIMSON} delay={0.6} />
      {lines >= 2 && <Chip x={1150} y={520} delay={0.2}>past: the end · every day and tomorrow: the front</Chip>}
      {lines >= 3 && <Chip x={1150} y={590} color={GOLD} delay={0.3}>any day</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Eti2TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Pitch />
      <Person x={980} y={800} scale={1} color={KARIM} />
      <Person x={1330} y={800} scale={1.05} color={COACH} />
      <Say x={1330} y={570} id="hatamel-eh" text="هتعمل إيه بكرة؟" align="right" width={220} size={26} delay={0.2} />
      {lines >= 2 && (
        <>
          <Chip x={980} y={340} color={CRIMSON} delay={0.1}>هـ…</Chip>
          <Chip x={980} y={400} color={CRIMSON} delay={0.3}>مش هـ…</Chip>
          <Chip x={980} y={460} color={TEAL} delay={0.5}>أكيد · إن شاء الله</Chip>
        </>
      )}
    </>
  );
}

export function Eti2MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[36px]" style={{ left: 1030, top: 170, width: 260, height: 480, background: '#2A1E18' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="absolute flex items-center gap-[3px] rounded-full" style={{ left: 24, top: 200, width: 212, height: 64, padding: '0 16px', background: CRIMSON }}>
          {Array.from({ length: 22 }, (_, i) => <motion.span key={i} className="rounded-full" style={{ width: 4, background: '#fff' }} initial={{ height: 4 }} animate={{ height: 8 + ((i * 23) % 30) }} transition={{ delay: 0.5 + i * 0.04, duration: 0.3 }} />)}
        </div>
      </motion.div>
      {lines >= 2 && <Chip x={1160} y={700} color={GOLD} delay={0.2}>plan (هـ) → what happened (the past)</Chip>}
    </>
  );
}

export function Eti2NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Pitch />
      <motion.div className="pointer-events-none absolute rounded-[14px] font-sans font-black" style={{ left: 1040, top: 200, padding: '8px 24px', fontSize: 36, background: '#2A1E18', color: '#fff' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        1 – 1 · 89'
      </motion.div>
      {lines >= 2 && <Person x={1150} y={800} scale={1} color={KARIM} lean={-6} delay={0.1} />}
      {lines >= 2 && <Ball x={1250} y={775} from={-120} delay={0.3} />}
      {lines >= 3 && <Say x={1150} y={570} id="mosh-hatsadda2" text="مش هتصدق اللي حصل!" width={260} size={26} accent delay={0.2} />}
    </>
  );
}
