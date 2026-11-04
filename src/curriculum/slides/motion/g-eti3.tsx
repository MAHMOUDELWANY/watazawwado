import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Say } from './g-ea1';
import { StreetCard } from './g-es1';
import { Panel, Hinge, type Pic } from './g-ei3';

/**
 * Egyptian Arabic · Teens · Intermediate · Lesson 3 · You Won't Believe What Happened. Karim's voice note about the
 * final. Reuses the Adults story strip (panels and hinges) with football panels; the voice note's waveform runs under
 * the scene pages, so the learner sees one story told in one breath.
 */

const OMAR = TEAL;
const KARIM = GOLD;
const NOUR = CRIMSON;
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';

/** A voice-note bar at (x, y), its waveform filling as the story goes. */
function VoiceNote({ x, y, fill = 1, delay = 0 }: { x: number; y: number; fill?: number; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex items-center gap-[3px] rounded-full" style={{ left: x - 200, top: y - 32, width: 400, height: 64, padding: '0 22px', background: '#2A1E18', boxShadow: SHADOW }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <span className="mr-2 rounded-full" style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: `16px solid ${GOLD}` }} />
      {Array.from({ length: 40 }, (_, i) => (
        <motion.span key={i} className="rounded-full" style={{ width: 4, background: i / 40 < fill ? GOLD : '#5B6B74' }} initial={{ height: 4 }} animate={{ height: 6 + ((i * 37) % 28) }} transition={{ delay: delay + 0.3 + i * 0.02, duration: 0.3 }} />
      ))}
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Eti3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Panel x={1410} y={420} pic="ball" text="الماتش بدأ" delay={0.2} />
      <Hinge x={1290} y={420} word="وبعدين" delay={0.8} />
      <Panel x={1170} y={420} pic="clock" text="فضلت دقيقة" delay={0.4} />
      <Hinge x={1050} y={420} word="فجأة" delay={1} />
      <Panel x={930} y={420} pic="cup" text="كسبنا!" delay={0.6} />
      <VoiceNote x={1170} y={640} fill={0.6} delay={0.3} />
    </>
  );
}

export function Eti3RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1150} y={230} word="هنلعب الفاينل." id="hanlaab" size={32} />
      <Chip x={1150} y={300} color={CRIMSON} delay={0.4}>the plan: هـ</Chip>
      {lines >= 2 && <StreetCard x={1150} y={430} word="لعبنا الفاينل." id="laabna" size={32} delay={0.2} />}
      {lines >= 2 && <Chip x={1150} y={500} color={GOLD} delay={0.6}>what happened: the past</Chip>}
      {lines >= 3 && (
        <>
          <Panel x={1300} y={660} pic="ball" text="لعبنا" delay={0.1} />
          <Panel x={1000} y={660} pic="goal" text="جبت" delay={0.3} />
        </>
      )}
    </>
  );
}

export function Eti3NoteGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={1.05} color={KARIM} />
      <motion.div className="pointer-events-none absolute rounded-[10px]" style={{ left: 1060, top: 560, width: 40, height: 70, background: '#2A1E18' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} />
      <VoiceNote x={1180} y={320} fill={lines >= 2 ? 0.5 : 0.1} delay={0.2} />
      {lines >= 2 && <Chip x={1180} y={410} color={TEAL} delay={0.3}>Cairo → London</Chip>}
      {lines >= 3 && <Chip x={1180} y={470} color={GOLD} delay={0.3}>like a commentator</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

export function Eti3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={980} y={800} scale={1.05} color={KARIM} />
      <VoiceNote x={1180} y={200} fill={k / 3} />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={980} y={560} id="story-1" text="مش هتصدق اللي حصل في الفاينل!" width={330} size={23} accent delay={0.2} />
          <Panel x={1410} y={480} pic="ball" text="الماتش بدأ" id="story-2" delay={1.2} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Panel x={1360} y={420} pic="clock" text="لما فضلت دقيقة" id="story-3" delay={0.2} />
          <Panel x={1360} y={640} pic="ball" text="وفجأة…" id="story-4" delay={1.2} />
          <Say x={980} y={560} text="وفجأة… الكورة جت عندي!" width={270} size={24} accent delay={1.6} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Panel x={1410} y={480} pic="cup" text="كسبنا الكاس!" id="story-5" delay={0.2} />
          <Say x={980} y={560} text="وفي الآخر… كسبنا الكاس!" width={280} size={24} accent delay={0.6} />
        </React.Fragment>
      )}
    </>
  );
}

function Pair({ a, b, word, color = CRIMSON, joined, ida, idb }: { a: [Pic, string]; b: [Pic, string]; word: string; color?: string; joined: boolean; ida?: string; idb?: string }) {
  return (
    <>
      <motion.div className="absolute" style={{ top: 0, left: 0 }} animate={{ x: joined ? 60 : 0 }} transition={{ duration: 0.7, ease }}>
        <Panel x={1300} y={300} pic={a[0]} text={a[1]} id={ida} />
      </motion.div>
      <motion.div className="absolute" style={{ top: 0, left: 0 }} animate={{ x: joined ? -60 : 0 }} transition={{ duration: 0.7, ease }}>
        <Panel x={1000} y={300} pic={b[0]} text={b[1]} id={idb} delay={0.2} />
      </motion.div>
      {joined && <Hinge x={1150} y={300} word={word} color={color} delay={0.7} />}
    </>
  );
}

export function Eti3ThenGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Pair a={['ball', 'الماتش بدأ']} b={['goal', 'هما جابوا جون']} word="وبعدين" joined={lines >= 2} />
      {lines >= 2 && <StreetCard x={1150} y={470} word="الماتش بدأ، وبعدين هما جابوا جون." id="wbaadeen" size={26} delay={1} />}
      {lines >= 3 && (
        <>
          <Person x={1300} y={800} scale={0.95} color={OMAR} />
          <Say x={1300} y={600} id="wbaadeen-q" text="وبعدين؟" align="right" width={160} size={28} delay={0.3} />
        </>
      )}
    </>
  );
}

export function Eti3WhenGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Panel x={1300} y={300} pic="clock" text="لما فضلت دقيقة…" id="lamma" />
      <Hinge x={1300} y={420} word="لما" color={TEAL} delay={0.5} />
      {lines >= 2 && <Panel x={1000} y={300} pic="goal" text="عمر جاب جون" id="omar-gab" delay={0.2} />}
      {lines >= 2 && <Person x={1000} y={760} scale={0.75} color={OMAR} delay={0.4} />}
      {lines >= 3 && <Chip x={1150} y={540} color={TEAL} delay={0.2}>لما … + what happened then</Chip>}
    </>
  );
}

export function Eti3SuddenGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Panel x={1300} y={300} pic="goal" text="عمر جاب جون" />
      <Hinge x={1150} y={300} word="فجأة" delay={0.4} />
      <motion.div className="absolute" style={{ top: 0, left: 0 }} animate={{ x: lines >= 2 ? -40 : 0, rotate: lines >= 2 ? -4 : 0 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8, delay: 0.6 }}>
        <Panel x={1000} y={300} pic="ball" text="الكورة جت عندي!" id="fagaa" delay={0.6} />
      </motion.div>
      {lines >= 2 && <Chip x={1150} y={430} color={CRIMSON} delay={0.4}>slower · pause…</Chip>}
      {lines >= 3 && <Person x={1150} y={800} scale={0.95} color={NOUR} hijab lean={-6} />}
      {lines >= 3 && <Say x={1150} y={600} text="؟!" width={90} delay={0.3} />}
    </>
  );
}

export function Eti3EndGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Panel x={1300} y={300} pic="ball" text="الكورة جت عندي" dim />
      <Hinge x={1150} y={300} word="في الآخر" color={GOLD} delay={0.4} />
      {lines >= 2 && <Panel x={980} y={300} pic="cup" text="كسبنا الكاس!" id="fel-akher" delay={0.3} />}
      {lines >= 3 && <Chip x={1150} y={460} color={GOLD} delay={0.2}>did Karim score?</Chip>}
    </>
  );
}

export function Eti3StripGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const story = lines !== 2;
  const panels: [Pic, string][] = [['ball', 'الماتش بدأ'], ['goal', 'جابوا جون'], ['clock', 'فضلت دقيقة'], ['ball', 'الكورة جت عندي'], ['cup', 'كسبنا']];
  const hinges: [string, string][] = [['وبعدين', CRIMSON], ['لما', TEAL], ['فجأة', CRIMSON], ['في الآخر', GOLD]];
  const xs = [1430, 1290, 1150, 1010, 870];
  const ys = [260, 470, 260, 470, 260];
  return (
    <>
      {panels.map(([pic, t], i) => (
        <motion.div key={i} className="absolute" style={{ top: 0, left: 0 }} animate={{ y: story ? 0 : (i % 2 ? 40 : -40), opacity: story ? 1 : 0.75 }} transition={{ duration: 0.7, ease }}>
          <Panel x={xs[i]} y={ys[i]} pic={pic} text={t} id={i === 0 ? 'strip' : undefined} delay={i * 0.12} />
        </motion.div>
      ))}
      {story && hinges.map(([w, c], i) => <Hinge key={w} x={(xs[i] + xs[i + 1]) / 2} y={365} word={w} color={c} delay={0.6 + i * 0.2} />)}
      {lines === 2 && <Chip x={1150} y={650} delay={0.2}>no words: a list of facts</Chip>}
      {lines >= 3 && <Chip x={1150} y={650} color={GOLD} delay={0.3}>four words: a voice note people replay</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Eti3TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={980} y={800} scale={1} color={KARIM} />
      <Person x={1330} y={800} scale={1} color={OMAR} />
      <Say x={980} y={570} id="mosh-hatsadda2" text="مش هتصدق اللي حصل!" width={250} size={24} accent delay={0.2} />
      {lines >= 2 && <Say x={1330} y={570} id="wbaadeen-2" text="وبعدين؟" align="right" width={150} size={28} delay={0.3} />}
      {lines >= 2 && <VoiceNote x={1150} y={260} fill={0.4} delay={0.1} />}
    </>
  );
}

export function Eti3MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <VoiceNote x={1160} y={300} fill={0} />
      <Chip x={1160} y={380} color="#2A1E18" delay={0.4}>1:00</Chip>
      {lines >= 2 && <StreetCard x={1160} y={500} word="مش هتصدق اللي حصل!" size={28} delay={0.2} />}
      {lines >= 2 && <StreetCard x={1160} y={600} word="… وفي الآخر" size={28} delay={0.5} />}
    </>
  );
}

export function Eti3NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Panel x={1300} y={300} pic="sea" text="رحنا البحر" delay={0.2} />
      <Panel x={1000} y={300} pic="station" text="هما راحوا السوق" delay={0.4} />
      {lines >= 2 && <Person x={1150} y={800} scale={1} color={NOUR} hijab />}
      {lines >= 2 && <Say x={1150} y={570} id="rohna" text="رحنا البحر، وهما راحوا السوق." align="right" width={320} size={24} accent delay={0.3} />}
      {lines >= 3 && <Chip x={1150} y={395} color={CRIMSON} delay={0.3}>-na · -u</Chip>}
    </>
  );
}
