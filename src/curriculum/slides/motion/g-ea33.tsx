import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Hear } from '../Say';
import { ArText, Say, Stairs, ADAM, SAYED } from './g-ea1';
import { StreetCard } from './g-es1';

/**
 * Egyptian Arabic · Adults · Advanced · Lesson 3 · At Street Speed. New device: the word stream and its filter. A voice
 * note's words flow as chips; padding words (fillers) fade to grey and drop through the filter, key words (who, what,
 * when) stay lit in their colour. The cast continues from the lift story.
 */

const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
type W = { t: string; key?: 'what' | 'when' | 'do' | 'who' };
const KEYC = { who: TEAL, what: CRIMSON, when: GOLD, do: '#7A4A2A' } as const;
const NOTE: W[] = [{ t: 'بقولك إيه' }, { t: 'يا آدم', key: 'who' }, { t: 'يعني' }, { t: 'الأسانسير جه', key: 'what' }, { t: 'بس بقى' }, { t: 'حد يمضي', key: 'do' }, { t: 'فتعالى', key: 'do' }, { t: 'بقى' }, { t: 'قبل الساعة اتنين', key: 'when' }, { t: 'طب ماشي' }];

/** The note as a stream of chips in rows; `filter` drops the padding. */
function Stream({ filter, delay = 0, id }: { filter: boolean; delay?: number; id?: string }) {
  return (
    <div className="absolute flex flex-wrap justify-center gap-3" style={{ left: 820, top: 200, width: 680, direction: 'rtl' }}>
      {NOTE.map((w, i) => {
        const pad = !w.key;
        const body = <span className="inline-flex rounded-full" style={{ padding: '2px 16px 4px', background: pad ? '#E8DCC8' : KEYC[w.key!], boxShadow: SHADOW }}><ArText size={24} color={pad ? '#8A7A6A' : '#fff'}>{w.t}</ArText></span>;
        return (
          <motion.div key={i} initial={{ opacity: 0, y: -16 }} animate={{ opacity: filter && pad ? 0 : 1, y: filter && pad ? 140 : 0, scale: filter && pad ? 0.6 : 1 }} transition={{ duration: 0.6, delay: delay + (filter ? (pad ? 0.1 : 0) : i * 0.06), ease }}>
            {i === 0 && id ? <Hear id={id}>{body}</Hear> : body}
          </motion.div>
        );
      })}
    </div>
  );
}

/** The filter: a mesh band the padding falls through. */
function Filter({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute rounded-[12px]" style={{ left: 860, top: 470, width: 600, height: 26, background: 'repeating-linear-gradient(90deg, #CDB898 0 6px, transparent 6px 16px)', border: '3px solid #CDB898' }} initial={{ opacity: 0, scaleX: 0.5 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.6, delay, ease }} />
  );
}

function Wave({ x, y, n = 60, delay = 0, color = GOLD }: { x: number; y: number; n?: number; delay?: number; color?: string }) {
  return (
    <motion.div className="pointer-events-none absolute flex items-center gap-[3px] rounded-full" style={{ left: x - 210, top: y - 32, width: 420, height: 64, padding: '0 22px', background: '#2A1E18', boxShadow: SHADOW }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay }}>
      {Array.from({ length: n }, (_, i) => <motion.span key={i} className="rounded-full" style={{ width: 3, background: color }} initial={{ height: 4 }} animate={{ height: 6 + ((i * 41) % 34) }} transition={{ delay: delay + 0.3 + i * 0.01, duration: 0.2 }} />)}
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Ea33CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Stream filter={false} delay={0.2} />
      <Filter delay={0.8} />
      <Person x={1160} y={800} scale={0.9} color={ADAM} delay={0.3} />
    </>
  );
}

export function Ea33RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Chip x={1160} y={200} color={TEAL}>Sounds: endings fall · syllables shrink</Chip>
      {lines >= 2 && (
        <div className="absolute" style={{ left: 950, top: 298 }}>
          <Hear id="fast"><Wave x={210} y={32} delay={0.1} /></Hear>
        </div>
      )}
      {lines >= 3 && <Chip x={1160} y={440} color={GOLD} delay={0.2}>half of it is padding</Chip>}
    </>
  );
}

export function Ea33NoteGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={1} color={GOLD} />
      <Chip x={1000} y={540} delay={0.3}>Karim, downtown</Chip>
      {lines >= 2 && <Wave x={1250} y={260} delay={0.1} />}
      {lines >= 2 && <Wave x={1250} y={350} delay={0.4} />}
      {lines >= 3 && <Stairs />}
      {lines >= 3 && <Person x={1330} y={570} scale={0.9} color={ADAM} delay={0.2} />}
    </>
  );
}

/* ---------- zad ---------- */

export function Ea33StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  const texts: [string, string][] = [['story-1', 'بقولك إيه يا آدم… يعني، الأسانسير جه خلاص.'], ['story-2', 'بس بقى، الراجل عايز حد يمضي، فتعالى بقى قبل الساعة اتنين.'], ['story-3', 'طب ماشي، أنا هستناك تحت. يلا سلام!']];
  return (
    <>
      <Person x={1420} y={800} scale={1} color={ADAM} />
      <Wave x={1150} y={250} />
      <Say x={800} y={560} id={texts[k - 1]?.[0]} text={texts[k - 1]?.[1] ?? ''} width={580} size={19} accent delay={0.3} />
    </>
  );
}

export function Ea33FillersGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const f: [string, string, string][] = [['يعني', 'I mean', 'yaani'], ['بقى', 'so', 'baa'], ['طب', 'OK', 'tab'], ['بقولك إيه', 'listen…', 'ba2ollak']];
  return (
    <>
      {f.map(([w, m, id], i) => (
        <React.Fragment key={w}>
          <div className="absolute" style={{ left: 1400 - i * 170, top: 260, transform: 'translate(-50%, -50%)' }}>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: lines >= 3 ? 0.45 : 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.15 }}>
              <Hear id={id}><span className="inline-flex rounded-full" style={{ padding: '2px 16px 4px', background: '#E8DCC8', boxShadow: SHADOW }}><ArText size={28} color="#5A4636">{w}</ArText></span></Hear>
            </motion.div>
          </div>
          <Chip x={1400 - i * 170} y={310} delay={0.3 + i * 0.15}>{m}</Chip>
        </React.Fragment>
      ))}
      {lines >= 2 && <Chip x={1150} y={430} color={GOLD} delay={0.2}>time to think · almost no meaning</Chip>}
      {lines >= 3 && <Chip x={1150} y={500} color={CRIMSON} delay={0.3}>the real news comes right after</Chip>}
    </>
  );
}

/** Long words split into their pieces. */
export function Ea33RunGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const Row = ({ y, whole, id, parts, delay = 0 }: { y: number; whole: string; id: string; parts: string[]; delay?: number }) => (
    <>
      <StreetCard x={1380} y={y} word={whole} id={id} size={34} delay={delay} />
      {parts.map((p, i) => <Chip key={p} x={1180 - i * 130} y={y - 20} color={[TEAL, CRIMSON, GOLD][i]} delay={delay + 0.5 + i * 0.2}>{p}</Chip>)}
    </>
  );
  return (
    <>
      <Row y={260} whole="بقولك" id="ba2ollak-2" parts={['بـ', 'أقول', 'لك']} />
      {lines >= 2 && <Row y={430} whole="هستناك" id="hastannak" parts={['هـ', 'أستنى', 'ك']} delay={0.1} />}
      {lines >= 3 && <Chip x={1150} y={580} color={GOLD} delay={0.2}>learn the pieces once</Chip>}
    </>
  );
}

export function Ea33ThreeGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Chip x={1000} y={200} color={TEAL}>who</Chip>
      <Chip x={1150} y={200} color={CRIMSON}>what</Chip>
      <Chip x={1300} y={200} color={GOLD}>when</Chip>
      {lines >= 2 && (
        <>
          <StreetCard x={1150} y={330} word="الأسانسير جه." id="key-what" size={30} delay={0.1} />
          <StreetCard x={1150} y={430} word="قبل الساعة اتنين." id="key-when" size={30} delay={0.3} />
          <StreetCard x={1150} y={530} word="تعالى." id="key-do" size={30} delay={0.5} />
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={640} color={GOLD} delay={0.2}>catch these = you understood</Chip>}
    </>
  );
}

export function Ea33ReplyGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={1} color={ADAM} />
      <Wave x={1250} y={250} n={30} />
      <Chip x={1250} y={310} delay={0.4}>short · warm</Chip>
      {lines >= 2 && <Say x={1000} y={560} id="gay-halan" text="ماشي، جاي حالاً." width={210} size={26} accent delay={0.2} />}
      {lines >= 3 && <Say x={1250} y={480} id="hakoon" text="تمام، الساعة واحدة هكون عندك." align="right" width={330} size={22} delay={0.2} />}
    </>
  );
}

/** The wow: the stream drops its padding through the filter; five key pieces stay. */
export function Ea33FilterGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Stream filter={lines >= 2} id="filtered" />
      <Filter />
      {lines >= 3 && <Chip x={1160} y={560} color={GOLD} delay={0.3}>a wall of sound → five pieces</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Ea33TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={1} color={ADAM} />
      <div className="absolute" style={{ left: 1050, top: 228 }}>
        <Hear id="note-2"><Wave x={210} y={32} color={CRIMSON} /></Hear>
      </div>
      {lines >= 2 && (
        <>
          <Chip x={1120} y={380} color={TEAL} delay={0.1}>who?</Chip>
          <Chip x={1260} y={380} color={CRIMSON} delay={0.3}>what?</Chip>
          <Chip x={1400} y={380} color={GOLD} delay={0.5}>when?</Chip>
        </>
      )}
    </>
  );
}

export function Ea33MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      {[0, 1, 2].map((i) => <Wave key={i} x={1160} y={230 + i * 110} n={40} delay={i * 0.2} />)}
      {lines >= 2 && <Chip x={1160} y={580} color={GOLD} delay={0.2}>who · what · when</Chip>}
    </>
  );
}

export function Ea33NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[10px]" style={{ left: 1180, top: 420, width: 180, height: 380, background: '#C9CED2', boxShadow: SHADOW }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <motion.span className="absolute rounded-[6px]" style={{ left: 20, width: 140, height: 120, background: '#E8D5B4' }} initial={{ top: 240 }} animate={{ top: 20 }} transition={{ duration: 2, delay: 0.4, ease }} />
      </motion.div>
      {lines >= 2 && <Person x={1000} y={800} scale={0.95} color="#8A5A3C" hijab />}
      {lines >= 2 && <Person x={1440} y={800} scale={0.9} color={SAYED} delay={0.2} />}
      {lines >= 2 && <Say x={1000} y={570} id="ya-reet" text="يا ريت كان جه من زمان!" width={270} size={24} accent delay={0.3} />}
      {lines >= 3 && <Chip x={1000} y={330} color={CRIMSON} delay={0.2}>يا ريت · لو</Chip>}
    </>
  );
}
