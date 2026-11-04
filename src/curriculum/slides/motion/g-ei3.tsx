import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Hear } from '../Say';
import { ArText, Say, Building, ADAM, MONA, SAYED } from './g-ea1';
import { StreetCard } from './g-es1';

/**
 * Egyptian Arabic · Adults · Intermediate · Lesson 3 · And Then… New device: the story strip. Each event of Adam's day
 * is a small framed panel (alarm, taxi, station, train, sea); the four story words are hinges that clip between the
 * panels. Without hinges the panels sit apart like a list; with them they close up into one strip.
 */

const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
export type Pic = 'alarm' | 'taxi' | 'station' | 'train' | 'sea' | 'ball' | 'goal' | 'cup' | 'clock' | 'tree' | 'school' | 'pot';

/** A tiny drawing for each event. */
function Drawing({ pic }: { pic: Pic }) {
  return (
    <svg viewBox="0 0 120 80" width={120} height={80}>
      {pic === 'alarm' && <g><circle cx={60} cy={44} r={26} fill="#FFFDF8" stroke={CRIMSON} strokeWidth={5} /><line x1={60} y1={44} x2={60} y2={28} stroke={INK_TEXT} strokeWidth={4} /><line x1={60} y1={44} x2={72} y2={50} stroke={INK_TEXT} strokeWidth={4} /><circle cx={40} cy={16} r={7} fill={CRIMSON} /><circle cx={80} cy={16} r={7} fill={CRIMSON} /></g>}
      {pic === 'taxi' && <g><rect x={14} y={34} width={92} height={28} rx={8} fill="#2B2B2B" /><rect x={30} y={20} width={58} height={20} rx={6} fill="#2B2B2B" /><rect x={14} y={44} width={92} height={6} fill="#fff" /><circle cx={34} cy={64} r={9} fill={INK_TEXT} /><circle cx={86} cy={64} r={9} fill={INK_TEXT} /></g>}
      {pic === 'station' && <g><rect x={10} y={20} width={100} height={46} rx={10} fill="#D7DEE2" /><rect x={22} y={30} width={26} height={20} rx={4} fill="#9FB3BF" /><rect x={56} y={30} width={26} height={20} rx={4} fill={GOLD} /><rect x={10} y={58} width={100} height={4} fill={CRIMSON} /></g>}
      {pic === 'train' && <g><rect x={40} y={22} width={78} height={40} rx={10} fill="#D7DEE2" /><rect x={40} y={54} width={78} height={4} fill={CRIMSON} />{[0, 1, 2].map((i) => <line key={i} x1={4} y1={30 + i * 12} x2={30} y2={30 + i * 12} stroke={INK_TEXT} strokeWidth={4} strokeLinecap="round" opacity={0.5} />)}</g>}
      {pic === 'ball' && <g><circle cx={60} cy={42} r={26} fill="#fff" stroke={INK_TEXT} strokeWidth={4} /><path d="M60 26 l12 9 l-4 14 h-16 l-4 -14 z" fill={INK_TEXT} /></g>}
      {pic === 'goal' && <g><path d="M14 70 V16 H106 V70" stroke={INK_TEXT} strokeWidth={5} fill="none" />{[0, 1, 2, 3].map((i) => <line key={i} x1={14 + i * 30} y1={16} x2={14 + i * 30} y2={70} stroke={INK_TEXT} strokeWidth={1.5} opacity={0.3} />)}<circle cx={80} cy={52} r={10} fill="#fff" stroke={INK_TEXT} strokeWidth={3} /></g>}
      {pic === 'cup' && <g><path d="M38 8 h44 v14 q0 24 -22 26 q-22 -2 -22 -26 z" fill={GOLD} /><rect x={55} y={48} width={10} height={14} fill={GOLD} /><rect x={44} y={62} width={32} height={8} rx={2} fill={GOLD} /></g>}
      {pic === 'clock' && <g><rect x={24} y={20} width={72} height={44} rx={8} fill="#1E2B33" /><text x={60} y={50} textAnchor="middle" fontSize={20} fontWeight={900} fill="#fff" fontFamily="sans-serif">89'</text></g>}
      {pic === 'tree' && <g><rect x={54} y={44} width={12} height={30} fill="#8A5A2B" /><circle cx={60} cy={34} r={26} fill="#5AA153" /><circle cx={40} cy={44} r={16} fill="#6DB566" /><circle cx={80} cy={44} r={16} fill="#6DB566" /></g>}
      {pic === 'school' && <g><polygon points="60,6 104,30 16,30" fill={CRIMSON} /><rect x={22} y={30} width={76} height={44} fill="#EAD9BE" /><rect x={52} y={48} width={16} height={26} fill="#8A5A2B" />{[30, 80].map((x) => <rect key={x} x={x - 6} y={40} width={14} height={12} fill="#9FB3BF" />)}</g>}
      {pic === 'pot' && <g><path d="M24 34 h72 v20 q0 18 -36 18 q-36 0 -36 -18 z" fill={TEAL} /><rect x={18} y={28} width={84} height={8} rx={4} fill="#0B7C86" />{[0, 1, 2].map((i) => <path key={i} d={`M${44 + i * 16} 22 q -6 -8 0 -16`} stroke={INK_TEXT} strokeWidth={3} fill="none" opacity={0.35} />)}</g>}
      {pic === 'sea' && <g><circle cx={92} cy={22} r={12} fill={GOLD} />{[0, 1].map((i) => <path key={i} d={`M4 ${50 + i * 14} q 14 -10 28 0 t 28 0 t 28 0 t 28 0`} stroke={TEAL} strokeWidth={5} fill="none" />)}</g>}
    </svg>
  );
}

/** A framed story panel centred at (x, y). */
export function Panel({ x, y, pic, text, id, delay = 0, dim = false }: { x: number; y: number; pic: Pic; text: string; id?: string; delay?: number; dim?: boolean }) {
  const cap = <ArText size={20}>{text}</ArText>;
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div className="flex flex-col items-center gap-1 rounded-[16px]" style={{ width: 170, padding: '10px 8px', background: '#FFFDF8', boxShadow: SHADOW, border: `3px solid ${INK_TEXT}22` }}
        initial={{ opacity: 0, y: 18, rotate: -3 }} animate={{ opacity: dim ? 0.4 : 1, y: 0, rotate: 0 }} transition={{ duration: 0.6, delay, ease }}>
        <Drawing pic={pic} />
        {id ? <Hear id={id}>{cap}</Hear> : cap}
      </motion.div>
    </div>
  );
}

/** A story word as a hinge between panels. */
export function Hinge({ x, y, word, color = CRIMSON, delay = 0 }: { x: number; y: number; word: string; color?: string; delay?: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div className="rounded-full" style={{ padding: '2px 16px 4px', background: color, boxShadow: SHADOW }} initial={{ opacity: 0, scale: 0.4, y: -30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.7, delay }}>
        <ArText size={24} color="#fff">{word}</ArText>
      </motion.div>
    </div>
  );
}

/* ---------- spark ---------- */

export function Ei3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Panel x={1410} y={430} pic="alarm" text="صحيت متأخر" delay={0.2} />
      <Hinge x={1290} y={430} word="وبعدين" delay={0.8} />
      <Panel x={1170} y={430} pic="taxi" text="خدت تاكسي" delay={0.4} />
      <Hinge x={1050} y={430} word="فجأة" delay={1} />
      <Panel x={930} y={430} pic="train" text="القطر مشي" delay={0.6} />
      <Person x={1170} y={800} scale={0.9} color={ADAM} delay={0.3} />
    </>
  );
}

export function Ei3RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1150} y={230} word="هنمشي الساعة سبعة." id="hanemshi" size={32} />
      <Chip x={1150} y={300} color={CRIMSON} delay={0.4}>the plan: هـ</Chip>
      {lines >= 2 && <StreetCard x={1150} y={430} word="مشينا الساعة سبعة." id="mishina" size={32} delay={0.2} />}
      {lines >= 2 && <Chip x={1150} y={500} color={GOLD} delay={0.6}>what happened: the past</Chip>}
      {lines >= 3 && (
        <>
          <Panel x={1300} y={660} pic="station" text="رحنا" delay={0.1} />
          <Panel x={1000} y={660} pic="sea" text="كلنا" delay={0.3} />
        </>
      )}
    </>
  );
}

export function Ei3BackGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Building x={1120} w={360} />
      <Person x={950} y={800} scale={1.05} color={ADAM} lean={-4} />
      {lines >= 2 && <Person x={1300} y={800} scale={1} color={SAYED} delay={0.1} />}
      {lines >= 2 && <Panel x={960} y={300} pic="train" text="٧:٠٠" delay={0.3} />}
      {lines >= 3 && <Say x={1300} y={570} text="؟" width={80} delay={0.2} />}
    </>
  );
}

/* ---------- zad ---------- */

export function Ei3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Building x={1120} w={360} />
      <Person x={950} y={800} scale={1.05} color={ADAM} />
      <Person x={1300} y={800} scale={1} color={SAYED} />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={1300} y={570} id="story-1" text="إيه يا آدم؟ مش رحت إسكندرية؟" align="right" width={300} size={24} delay={0.2} />
          <Say x={950} y={420} id="story-2" text="رحت… بس صحيت متأخر، وبعدين خدت تاكسي." width={330} size={22} accent delay={1.4} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={950} y={420} id="story-3" text="لما وصلت المحطة، شفت منى في الشباك." width={330} size={22} delay={0.2} />
          <Say x={950} y={560} id="story-4" text="وفجأة… القطر مشي!" width={240} size={26} accent delay={1.4} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1300} y={570} id="story-5" text="يا خبر! وبعدين؟" align="right" width={210} size={26} delay={0.2} />
          <Say x={930} y={360} id="story-6" text="في الآخر ركبت القطر اللي بعده، وكلت سمك مع منى على البحر!" width={540} size={19} accent delay={1.4} />
        </React.Fragment>
      )}
    </>
  );
}

export function Ei3ThenGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const joined = lines >= 2;
  return (
    <>
      <motion.div className="absolute" style={{ top: 0, left: 0 }} animate={{ x: joined ? 60 : 0 }} transition={{ duration: 0.7, ease }}>
        <Panel x={1300} y={300} pic="alarm" text="صحيت متأخر" id="sihit" />
      </motion.div>
      <motion.div className="absolute" style={{ top: 0, left: 0 }} animate={{ x: joined ? -60 : 0 }} transition={{ duration: 0.7, ease }}>
        <Panel x={1000} y={300} pic="taxi" text="خدت تاكسي" delay={0.2} />
      </motion.div>
      {joined && <Hinge x={1150} y={300} word="وبعدين" delay={0.7} />}
      {joined && <StreetCard x={1150} y={470} word="وبعدين خدت تاكسي." id="wbaadeen" size={28} delay={1} />}
      {lines >= 3 && (
        <>
          <Person x={1300} y={800} scale={0.95} color={SAYED} />
          <Say x={1300} y={600} id="wbaadeen-q" text="وبعدين؟" align="right" width={160} size={28} delay={0.3} />
        </>
      )}
    </>
  );
}

export function Ei3WhenGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Panel x={1300} y={300} pic="station" text="لما وصلت المحطة…" id="lamma" />
      <Hinge x={1300} y={420} word="لما" color={TEAL} delay={0.5} />
      {lines >= 2 && <Panel x={1000} y={300} pic="station" text="شفت منى في الشباك" id="shoft-mona" delay={0.2} />}
      {lines >= 2 && <Person x={1000} y={720} scale={0.7} color={MONA} hijab delay={0.4} />}
      {lines >= 3 && <Chip x={1150} y={560} color={TEAL} delay={0.2}>لما … + what happened then</Chip>}
    </>
  );
}

/** The turn: the strip tilts and the train slides out of its panel. */
export function Ei3SuddenGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Panel x={1300} y={300} pic="station" text="شفت منى" />
      <Hinge x={1150} y={300} word="فجأة" delay={0.4} />
      <motion.div className="absolute" style={{ top: 0, left: 0 }} initial={{ x: 0, rotate: 0 }} animate={{ x: lines >= 2 ? -40 : 0, rotate: lines >= 2 ? -4 : 0 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8, delay: 0.6 }}>
        <Panel x={1000} y={300} pic="train" text="القطر مشي!" id="fagaa" delay={0.6} />
      </motion.div>
      {lines >= 2 && <Chip x={1150} y={430} color={CRIMSON} delay={0.4}>slower · lower · pause…</Chip>}
      {lines >= 3 && (
        <>
          <Person x={1300} y={800} scale={0.95} color={SAYED} lean={-6} />
          <Say x={1300} y={600} id="ya-khabar" text="يا خبر!" align="right" width={150} size={28} accent delay={0.3} />
        </>
      )}
    </>
  );
}

export function Ei3EndGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Panel x={1300} y={300} pic="train" text="القطر مشي" dim />
      <Hinge x={1150} y={300} word="في الآخر" color={GOLD} delay={0.4} />
      {lines >= 2 && <Panel x={980} y={300} pic="sea" text="ركبت اللي بعده" id="fel-akher" delay={0.3} />}
      {lines >= 2 && <Person x={1000} y={800} scale={0.9} color={ADAM} delay={0.5} />}
      {lines >= 2 && <Person x={1150} y={800} scale={0.9} color={MONA} hijab delay={0.6} />}
      {lines >= 3 && <Chip x={1150} y={460} color={GOLD} delay={0.2}>آخر = the end</Chip>}
    </>
  );
}

/** The wow: five panels apart (a list), then the hinges drop in and the strip closes up (a story). */
export function Ei3StripGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const story = lines !== 2;
  const panels: [Pic, string][] = [['alarm', 'صحيت متأخر'], ['taxi', 'خدت تاكسي'], ['station', 'وصلت'], ['train', 'القطر مشي'], ['sea', 'ركبت اللي بعده']];
  const hinges: [string, string][] = [['وبعدين', CRIMSON], ['لما', TEAL], ['فجأة', CRIMSON], ['في الآخر', GOLD]];
  const xs = [1430, 1290, 1150, 1010, 870];
  const ys = [260, 470, 260, 470, 260];
  return (
    <>
      {panels.map(([pic, t], i) => (
        <motion.div key={pic} className="absolute" style={{ top: 0, left: 0 }} animate={{ y: story ? 0 : (i % 2 ? 40 : -40), opacity: story ? 1 : 0.75 }} transition={{ duration: 0.7, ease }}>
          <Panel x={xs[i]} y={ys[i]} pic={pic} text={t} id={i === 0 ? 'strip' : undefined} delay={i * 0.12} />
        </motion.div>
      ))}
      {story && hinges.map(([w, c], i) => <Hinge key={w} x={(xs[i] + xs[i + 1]) / 2} y={365} word={w} color={c} delay={0.6 + i * 0.2} />)}
      {lines === 2 && <Chip x={1150} y={650} delay={0.2}>no words: a list of facts</Chip>}
      {lines >= 3 && <Chip x={1150} y={650} color={GOLD} delay={0.3}>four words: a story</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Ei3TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Building x={1120} w={360} />
      <Person x={950} y={800} scale={1.05} color={ADAM} />
      <Person x={1300} y={800} scale={1} color={SAYED} />
      <Say x={1300} y={570} id="amalt-eh-naharda" text="عملت إيه النهارده؟" align="right" width={240} size={26} delay={0.2} />
      {lines >= 2 && hinges4.map(([w, c], i) => <Hinge key={w} x={950} y={250 + i * 70} word={w} color={c} delay={0.1 + i * 0.2} />)}
      {lines >= 3 && <Say x={1300} y={420} id="wbaadeen-2" text="وبعدين؟" align="right" width={150} size={28} accent delay={0.3} />}
    </>
  );
}
const hinges4: [string, string][] = [['وبعدين', CRIMSON], ['لما', TEAL], ['فجأة', CRIMSON], ['في الآخر', GOLD]];

export function Ei3MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[36px]" style={{ left: 1030, top: 170, width: 260, height: 480, background: '#1E2B33', boxShadow: SHADOW }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="absolute flex items-center gap-[3px] rounded-full" style={{ left: 24, top: 200, width: 212, height: 64, padding: '0 16px', background: CRIMSON }}>
          {Array.from({ length: 22 }, (_, i) => (
            <motion.span key={i} className="rounded-full" style={{ width: 4, background: '#fff' }} initial={{ height: 4 }} animate={{ height: 8 + ((i * 29) % 30) }} transition={{ delay: 0.5 + i * 0.04, duration: 0.3 }} />
          ))}
        </div>
        <span className="absolute font-sans font-bold" style={{ left: 30, top: 280, fontSize: 16, color: '#fff' }}>1:00</span>
      </motion.div>
      {lines >= 2 && <Chip x={1160} y={700} color={GOLD} delay={0.2}>وبعدين · لما · فجأة · في الآخر</Chip>}
    </>
  );
}

export function Ei3NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Panel x={1300} y={300} pic="sea" text="رحنا البحر" delay={0.2} />
      <Panel x={1000} y={300} pic="station" text="هما راحوا السوق" delay={0.4} />
      {lines >= 2 && <Person x={1150} y={800} scale={1} color={MONA} hijab />}
      {lines >= 2 && <Say x={1150} y={570} id="rohna" text="رحنا البحر، وهما راحوا السوق." align="right" width={320} size={24} accent delay={0.3} />}
      {lines >= 3 && <Chip x={1150} y={395} color={CRIMSON} delay={0.3}>-na · -u</Chip>}
    </>
  );
}
