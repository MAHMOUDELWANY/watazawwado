import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Hear } from '../Say';
import { ArText, Say } from './g-ea1';
import { StreetCard } from './g-es1';
import { Pitch } from './g-egy';
import { Chat } from './g-eti1';
import { VoiceNote } from './g-eti3';

/**
 * Egyptian Arabic · Teens · Advanced · Lesson 3 · Say It Again, Slower! Karim's 40-second voice note: Omar (teal), Karim
 * (gold), Nour (crimson, hijab). New device: the slow-motion wave; stretched out, the glue fades and three anchors
 * (when, what time, where) light up.
 */

const OMAR = TEAL;
const KARIM = GOLD;
const NOUR = CRIMSON;
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';

/** A voice note you can tap to hear (VoiceNote is drawn without a tap target). */
function Note({ x, y, id, delay = 0 }: { x: number; y: number; id?: string; delay?: number }) {
  return (
    <>
      <VoiceNote x={x} y={y} delay={delay} />
      {id && <div className="absolute" style={{ left: x - 200, top: y - 32 }}><Hear id={id}><span className="inline-block" style={{ width: 400, height: 64 }} /></Hear></div>}
    </>
  );
}

/* ---------- the slow-motion wave ---------- */

const BARS = 60;
const ANCHORS: [number, number, string, string][] = [[11, 19, 'الجمعة', 'when'], [29, 38, 'الساعة خمسة', 'what time'], [47, 57, 'ملعب المدرسة', 'where']];
const inAnchor = (i: number) => ANCHORS.some(([a, b]) => i >= a && i <= b);

function SlowWave({ stretched, labels }: { stretched: boolean; labels: number }) {
  const step = stretched ? 10.6 : 5;
  const left = 800;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left, top: 360, height: 96, background: '#2A1E18', boxShadow: SHADOW }} initial={{ width: 20 + BARS * 5 + 20 }} animate={{ width: 20 + BARS * step + 20 }} transition={{ duration: 1.2, ease }} />
      {Array.from({ length: BARS }, (_, i) => {
        const h = 14 + ((i * 37) % 46);
        const key = inAnchor(i);
        return (
          <motion.span key={i} className="pointer-events-none absolute rounded-full" style={{ top: 408 - h / 2, width: stretched ? 5 : 3, height: h, background: stretched && key ? GOLD : '#C9B79C' }}
            initial={{ left: left + 22 + i * 5 }} animate={{ left: left + 22 + i * step, opacity: stretched && !key ? 0.25 : 1 }} transition={{ duration: 1.2, ease }} />
        );
      })}
      {ANCHORS.slice(0, labels).map(([a, b, w, en], i) => {
        const cx = left + 22 + ((a + b) / 2) * step;
        return (
          <React.Fragment key={w}>
            <div className="absolute" style={{ left: cx, top: 310, transform: 'translate(-50%, -50%)' }}>
              <motion.span className="inline-flex rounded-full" style={{ padding: '0 16px 2px', background: GOLD, boxShadow: `0 0 26px 4px ${GOLD}66` }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.2 + i * 0.35, ease }}><ArText size={26} color="#fff">{w}</ArText></motion.span>
            </div>
            {labels >= 3 && <Chip x={cx} y={490} color={TEAL} delay={0.3 + i * 0.3}>{en}</Chip>}
          </React.Fragment>
        );
      })}
    </>
  );
}

/* ---------- spark ---------- */

export function Eta3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Note x={1150} y={260} delay={0.2} />
      <Person x={950} y={800} scale={1} color={NOUR} hijab delay={0.3} />
      <Person x={1350} y={800} scale={1} color={KARIM} delay={0.4} />
      <Say x={950} y={570} text="تاني؟" width={120} size={32} accent delay={1} />
    </>
  );
}

export function Eta3RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1150} y={220} word="الحلو ما يكملش!" id="helw" size={32} />
      <Person x={950} y={800} scale={1} color={OMAR} />
      <Person x={1350} y={800} scale={1} color={NOUR} hijab />
      {lines >= 2 && <Note x={1150} y={350} delay={0.2} />}
      {lines >= 2 && <Chip x={1290} y={400} color={KARIM} delay={0.8}>Karim · full speed</Chip>}
      {lines >= 3 && <Chip x={1150} y={480} color={TEAL} delay={0.2}>even Egyptians ask to repeat</Chip>}
    </>
  );
}

export function Eta3NoteGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1400} y={800} scale={1} color={KARIM} />
      <Pitch />
      {lines >= 2 && <Note x={1110} y={260} id="fast" delay={0.2} />}
      {lines >= 2 && <Chip x={1240} y={310} color={KARIM} delay={0.8}>0:40 · no breath</Chip>}
      {lines >= 3 && (
        <>
          <Person x={900} y={800} scale={0.95} color={OMAR} delay={0.1} />
          <Person x={1100} y={800} scale={0.95} color={NOUR} hijab delay={0.2} />
          <Say x={900} y={570} text="؟" width={70} size={30} delay={0.5} />
          <Say x={1100} y={570} text="؟؟" width={80} size={30} delay={0.8} />
          <Chip x={1000} y={420} delay={1.1}>played ×2 · ×3</Chip>
        </>
      )}
    </>
  );
}

/* ---------- zad ---------- */

export function Eta3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={900} y={800} scale={0.95} color={NOUR} hijab />
      <Person x={1150} y={800} scale={0.95} color={OMAR} />
      <Person x={1400} y={800} scale={0.95} color={KARIM} />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={1400} y={580} id="story-1" text="بقولكوا إيه يا جماعة، الماتش بقى يوم الجمعة الساعة خمسة." align="right" width={490} size={19} delay={0.2} />
          <Say x={900} y={420} id="story-2" text="إيه؟ معلش، ممكن تعيد تاني؟ بالراحة شوية!" width={430} size={21} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 2 && <Say key="b" x={1400} y={580} id="story-3" text="الماتش… يوم الجمعة… الساعة خمسة… في ملعب المدرسة." align="right" width={500} size={20} delay={0.2} />}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1150} y={580} id="story-4" text="قصدك الجمعة الجاية؟" width={250} size={24} delay={0.2} />
          <Say x={1400} y={420} id="story-5" text="آه، الجمعة الجاية. ماتتأخروش!" align="right" width={340} size={22} accent delay={1.6} />
        </React.Fragment>
      )}
    </>
  );
}

export function Eta3AgainGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={1} color={NOUR} hijab />
      <Person x={1400} y={800} scale={1} color={KARIM} />
      <Say x={900} y={570} id="teeed" text="معلش، ممكن تعيد تاني؟" width={300} size={26} delay={0.2} />
      <Chip x={1150} y={420} color={CRIMSON} delay={0.8}>to a girl: تعيدي</Chip>
      {lines >= 2 && <StreetCard x={1150} y={230} word="تاني؟" id="tani" size={44} delay={0.2} />}
      {lines >= 2 && <Chip x={1150} y={310} color={TEAL} delay={0.6}>with friends</Chip>}
      {lines >= 3 && <Chip x={1380} y={500} color={GOLD} delay={0.2}>معلش = sorry</Chip>}
    </>
  );
}

/** A palm pressing down, the Egyptian "slow down" gesture. */
function Palm({ x, y }: { x: number; y: number }) {
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x - 60, top: y - 40, overflow: 'visible' }} width={120} height={80} initial={{ y: -10 }} animate={{ y: [-10, 18, -10, 18, -10] }} transition={{ duration: 2.4, ease: 'easeInOut' }}>
      <rect x={10} y={20} width={100} height={40} rx={20} fill="#E2B48C" />
      {[18, 40, 62, 84].map((fx) => <rect key={fx} x={fx} y={8} width={18} height={30} rx={9} fill="#E2B48C" />)}
    </motion.svg>
  );
}

export function Eta3SlowGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1150} y={230} word="بالراحة شوية!" id="belraha" size={40} />
      <Person x={1420} y={800} scale={1} color={KARIM} lean={lines >= 3 ? 0 : -6} />
      {lines >= 2 && (
        <>
          <Chip x={930} y={340} delay={0.1}>speaking</Chip>
          <Chip x={1120} y={340} delay={0.3}>driving</Chip>
          <Chip x={1340} y={340} delay={0.5}>a friend who&apos;s upset</Chip>
        </>
      )}
      {lines >= 3 && <Palm x={1100} y={500} />}
      {lines >= 3 && <Chip x={1100} y={580} color={GOLD} delay={0.4}>hand down, smile</Chip>}
    </>
  );
}

export function Eta3MeanGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={1} color={OMAR} />
      <Person x={1400} y={800} scale={1} color={KARIM} />
      <Say x={900} y={570} id="asdak" text="قصدك الجمعة الجاية؟" width={260} size={26} delay={0.2} />
      {lines >= 2 && <Say x={1400} y={570} text="آه!" align="right" width={90} size={30} accent delay={0.3} />}
      {lines >= 3 && <StreetCard x={1150} y={250} word="يعني إيه ملعب؟" id="yaani-eh" size={34} delay={0.2} />}
      {lines >= 3 && <Chip x={1150} y={330} color={TEAL} delay={0.7}>one word you don&apos;t know</Chip>}
    </>
  );
}

export function Eta3GlueGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const words: [string, boolean, string?][] = [['بقولكوا إيه', true, 'ba2olko'], ['يا جماعة', true], ['الماتش', false], ['بقى', true, 'baa'], ['يوم الجمعة', false], ['الساعة خمسة', false]];
  const faded = lines >= 2;
  return (
    <>
      <div className="pointer-events-none absolute flex flex-wrap justify-center gap-3" style={{ left: 820, top: 230, width: 660, direction: 'rtl' }}>
        {words.map(([w, glue, id], i) => {
          const body = <span className="inline-flex rounded-[12px]" style={{ padding: '2px 16px 4px', background: faded ? (glue ? '#E9E1D4' : TEAL) : '#FFFDF8', boxShadow: SHADOW }}><ArText size={30} color={faded && !glue ? '#fff' : faded ? '#9A8F86' : undefined}>{w}</ArText></span>;
          return (
            <motion.span key={w} className="pointer-events-auto" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, scale: faded && glue ? 0.9 : 1 }} transition={{ duration: 0.5, delay: faded ? 0.1 * i : 0.15 * i, ease }}>{id ? <Hear id={id}>{body}</Hear> : body}</motion.span>
          );
        })}
      </div>
      {faded && <Chip x={950} y={420} delay={0.6}>glue: little news</Chip>}
      {lines >= 3 && <Chip x={1330} y={420} color={TEAL} delay={0.2}>the news comes right after</Chip>}
      <Person x={1150} y={800} scale={1} color={KARIM} />
    </>
  );
}

/** The wow: the note stretched; glue fades, three anchors glow. */
export function Eta3SlowMoGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const stretched = lines >= 2;
  return (
    <>
      <Chip x={1440} y={200} color={stretched ? TEAL : KARIM}>{stretched ? '0.5×' : '1×'}</Chip>
      <SlowWave stretched={stretched} labels={stretched ? (lines >= 3 ? 3 : 2) : 0} />
      {lines >= 2 && <div className="absolute" style={{ left: 1150, top: 640, transform: 'translate(-50%, -50%)' }}><Hear id="anchors"><span className="inline-flex rounded-full" style={{ padding: '2px 18px 4px', background: '#FFFDF8', boxShadow: SHADOW }}><ArText size={26}>الجمعة · الساعة خمسة · ملعب المدرسة</ArText></span></Hear></div>}
    </>
  );
}

/* ---------- athar ---------- */

export function Eta3TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Note x={1150} y={240} id="note-t" />
      <Person x={1420} y={800} scale={1} color={NOUR} hijab />
      {lines >= 2 && (
        <>
          <Chip x={950} y={350} color={TEAL} delay={0.1}>تاني؟</Chip>
          <Chip x={1140} y={350} color={GOLD} delay={0.3}>بالراحة شوية</Chip>
          <div className="absolute" style={{ left: 1100, top: 450, transform: 'translate(-50%, -50%)' }}>
            <motion.span className="inline-flex rounded-full" style={{ padding: '0 16px 2px', background: CRIMSON, boxShadow: SHADOW }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6, ease }}><ArText size={24} color="#fff">يوم… الساعة… في…</ArText></motion.span>
          </div>
        </>
      )}
    </>
  );
}

export function Eta3MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const msgs = [
    { t: '▶ 0:30', who: 'a friend', c: KARIM },
    { t: 'تاني؟ بالراحة شوية', who: 'me', c: TEAL },
    { t: 'يوم… الساعة… في…', who: 'me', c: TEAL },
  ];
  return <Chat msgs={msgs} n={lines >= 2 ? 3 : 1} />;
}

export function Eta3NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Pitch />
      <Person x={950} y={800} scale={0.95} color={OMAR} />
      <Person x={1150} y={800} scale={1} color={NOUR} hijab glow={lines >= 2} />
      <Person x={1350} y={800} scale={0.95} color={KARIM} />
      {lines >= 2 && (
        <>
          <motion.div className="pointer-events-none absolute" style={{ left: 1110, top: 470 }} initial={{ opacity: 0, y: 40, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.9, delay: 0.2 }}>
            <svg width={80} height={100} viewBox="0 0 80 100"><path d="M10 4 h60 v20 q0 30 -30 34 q-30 -4 -30 -34 z" fill={GOLD} /><rect x={34} y={56} width={12} height={20} fill={GOLD} /><rect x={20} y={76} width={40} height={10} rx={3} fill={GOLD} /></svg>
          </motion.div>
          <Say x={1350} y={420} id="eed-slow" text="إيد… لوحدها… ما تسقفش!" align="right" width={310} size={24} accent delay={1} />
        </>
      )}
      {lines >= 3 && <Chip x={950} y={300} color={CRIMSON} delay={0.2}>next: a review match</Chip>}
    </>
  );
}
