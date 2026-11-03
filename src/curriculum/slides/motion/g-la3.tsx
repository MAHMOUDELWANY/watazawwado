import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Hear } from '../Say';

/**
 * Literacy A · Lesson 3 (Kids: The Cup Family; Teens and Adults: Cups and Hooks). One set of graphics for the three
 * versions. The motion carries the dots trick again: one cup body (ح) wipes in from the right, the way the pen moves,
 * and a dot drops inside it (ج) or above it (خ); the hook (د) gets its dot (ذ) the same way. No religious content.
 */

const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl', lineHeight: 1 };
const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';

/** A letter drawn in from the right (the pen's direction), on a card; plays `id` on tap. */
function Glyph({ ch, x, y, size = 220, color = CRIMSON, id, delay = 0, card = true, label }: { ch: string; x: number; y: number; size?: number; color?: string; id?: string; delay?: number; card?: boolean; label?: string }) {
  const reduce = useReduce();
  const body = (
    <span className="relative inline-flex flex-col items-center" style={{ padding: card ? '10px 30px 14px' : 0, borderRadius: 30, background: card ? CARD : 'transparent', boxShadow: card ? SHADOW : 'none', pointerEvents: 'auto' }}>
      <motion.span lang="ar" style={{ ...AR, fontSize: size, color, display: 'inline-block', lineHeight: 1.45, padding: '0 6px' }}
        initial={{ clipPath: reduce ? 'inset(0 0 0 0)' : 'inset(0 0 0 100%)' }} animate={{ clipPath: 'inset(0 0 0 0)' }} transition={{ duration: 1.1, delay, ease }}>{ch}</motion.span>
      {label && <span className="font-sans font-black" style={{ fontSize: size * 0.2, color }}>{label}</span>}
    </span>
  );
  return (
    <motion.div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, delay }}>
      {id ? <Hear id={id}>{body}</Hear> : body}
    </motion.div>
  );
}

/** The paper note (kids) or the phone message (teens, adults) with the new letters on it. */
function Paper({ x, y, w = 520, letters, delay = 0 }: { x: number; y: number; w?: number; letters: string[]; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex items-center justify-center gap-8 rounded-[12px]" dir="rtl" style={{ left: x - w / 2, top: y, width: w, height: w * 0.55, background: '#FFFDF5', boxShadow: '0 30px 50px -28px rgba(60,30,10,0.55)', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 38px, rgba(15,163,184,0.18) 38px 40px)' }}
      initial={{ opacity: 0, y: 30, rotate: -10 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ type: 'spring', bounce: 0.3, duration: 1, delay }}>
      {letters.map((l, i) => (
        <motion.span key={i} lang="ar" style={{ ...AR, fontSize: w / (letters.length + 1.6), color: INK_TEXT, paddingBottom: 20 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.4 + i * 0.35 }}>{l}</motion.span>
      ))}
    </motion.div>
  );
}

/* ---------- shared scenes ---------- */

/** Three cups lined up, right to left, each wiping in. */
export function La3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Glyph ch="ح" x={1360} y={420} size={170} color={TEAL} delay={0.2} />
      <Glyph ch="ج" x={1150} y={420} size={170} color={CRIMSON} delay={0.6} />
      <Glyph ch="خ" x={940} y={420} size={170} color={GOLD} delay={1} />
    </>
  );
}

/** Teens and adults: the cups, then the hooks join the line. */
export function Lq3CoverGraphic(_: GraphicProps) {
  return (
    <>
      {['ح', 'ج', 'خ', 'د', 'ذ'].map((l, i) => <Glyph key={l} ch={l} x={1420 - i * 140} y={420} size={110} color={i < 3 ? TEAL : CRIMSON} delay={0.2 + i * 0.3} />)}
    </>
  );
}

/** Kids: Lina finds the note with three cups; Sam wonders. */
export function La3NoteGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Paper x={1100} y={200} letters={['ح', 'ج', 'خ']} />}
      <Person x={870} y={800} scale={0.85} color={TEAL} />
      {lines >= 3 && <Person x={1420} y={800} scale={0.85} color={GOLD} delay={0.2} />}
      {lines >= 2 && <Chip x={1100} y={540} color={GOLD} delay={0.3}>three little cups</Chip>}
    </>
  );
}

/** Teens and adults: a message or sign with the five new letters. */
export function Lq3MessageGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Paper x={1130} y={200} w={600} letters={['ح', 'ج', 'خ', 'د', 'ذ']} />}
      {lines >= 2 && <Chip x={1130} y={560} color={TEAL} delay={0.3}>a cup · a hook</Chip>}
      {lines >= 3 && <Chip x={1130} y={610} color={GOLD} delay={0.3}>same trick: look at the dots</Chip>}
    </>
  );
}

/** Three cups side by side; after the question, a ring on each dot (or on the empty cup). */
export function La3GuessGraphic({ lines, interaction }: GraphicProps) {
  const show = lines >= 1 || interaction;
  return (
    <>
      {show && (
        <>
          <Glyph ch="ح" x={1360} y={400} size={160} color={INK_TEXT} />
          <Glyph ch="ج" x={1150} y={400} size={160} color={INK_TEXT} delay={0.2} />
          <Glyph ch="خ" x={940} y={400} size={160} color={INK_TEXT} delay={0.4} />
        </>
      )}
      {interaction && (
        <>
          <Chip x={1360} y={560} color={TEAL}>no dot</Chip>
          <Chip x={1150} y={560} color={CRIMSON} delay={0.2}>dot inside</Chip>
          <Chip x={940} y={560} color={GOLD} delay={0.4}>dot on top</Chip>
        </>
      )}
    </>
  );
}

/** One letter, big, with its sound tag; `breath` adds fog puffs for the breathy ح. */
function LetterPage({ lines, ch, sound, sub, id, color, breath = false }: { lines: number; ch: string; sound: string; sub: string; id: string; color: string; breath?: boolean }) {
  const reduce = useReduce();
  return (
    <>
      {lines >= 1 && <Glyph ch={ch} x={1120} y={380} size={240} color={color} id={id} />}
      {lines >= 2 && (
        <motion.div className="pointer-events-none absolute flex flex-col items-center rounded-[24px]" style={{ left: 1330, top: 560, width: 190, padding: '10px 0 12px', background: CARD, boxShadow: SHADOW }}
          initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <span className="font-sans font-black" style={{ fontSize: 52, lineHeight: 1, color }}>{sound}</span>
          <span className="mt-1 font-sans font-bold" style={{ fontSize: 17, color: soft('light') }}>{sub}</span>
        </motion.div>
      )}
      {breath && lines >= 2 && [0, 1, 2].map((i) => (
        <motion.span key={i} className="pointer-events-none absolute block rounded-full" style={{ left: 880 + i * 30, top: 520 - i * 30, width: 60 + i * 20, height: 40 + i * 14, background: 'rgba(200,220,235,0.7)', filter: 'blur(6px)' }}
          initial={{ opacity: 0 }} animate={reduce ? { opacity: 0.7 } : { opacity: [0, 0.8, 0], x: [0, -30] }} transition={{ duration: 1.8, delay: i * 0.3, repeat: reduce ? 0 : Infinity }} />
      ))}
    </>
  );
}

export const La3HaaGraphic = ({ lines }: GraphicProps) => <LetterPage lines={lines} ch="ح" sound="ḥ" sub="a breathy h" id="hhaa" color={TEAL} breath />;
export const La3JeemGraphic = ({ lines }: GraphicProps) => <LetterPage lines={lines} ch="ج" sound="j" sub="like jam" id="jeem" color={CRIMSON} />;
export const La3KhaaGraphic = ({ lines }: GraphicProps) => <LetterPage lines={lines} ch="خ" sound="kh" sub="a soft gargle" id="khaa" color={GOLD} />;

/** Teens and adults: all three cups at once, each with its sound. */
export function Lq3CupsGraphic({ lines }: GraphicProps) {
  const cups = [{ ch: 'ح', s: 'ḥ', id: 'hhaa', c: TEAL }, { ch: 'ج', s: 'j', id: 'jeem', c: CRIMSON }, { ch: 'خ', s: 'kh', id: 'khaa', c: GOLD }];
  const shown = lines >= 3 ? 3 : lines >= 2 ? 2 : lines >= 1 ? 1 : 0;
  return <>{cups.slice(0, shown).map((c, i) => <Glyph key={c.ch} ch={c.ch} x={1360 - i * 220} y={400} size={150} color={c.c} id={c.id} label={c.s} />)}</>;
}

/** The hooks: د, then its dot makes ذ. */
export function Lq3HooksGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Glyph ch="د" x={1300} y={400} size={180} color={CRIMSON} id="daal" label="d" />}
      {lines >= 2 && <Glyph ch="ذ" x={1020} y={400} size={180} color={GOLD} id="dhaal" label="dh" delay={0.2} />}
      {lines >= 3 && <Chip x={1160} y={620} color={TEAL} delay={0.3}>dh: like "this"</Chip>}
    </>
  );
}

/** The dots trick, again: one body, the dot moves; then the hook does the same. */
export function La3TrickGraphic({ lines, items }: GraphicProps) {
  const steps = items > 0 ? items : lines;
  const cup = steps >= 3 ? 'خ' : steps >= 2 ? 'ج' : 'ح';
  const c = steps >= 3 ? GOLD : steps >= 2 ? CRIMSON : TEAL;
  return (
    <>
      {steps >= 1 && <Glyph key={cup} ch={cup} x={1160} y={400} size={240} color={c} />}
      {steps >= 1 && <Chip x={1160} y={630} color={c} delay={0.3}>{steps >= 3 ? 'dot on top: kh' : steps >= 2 ? 'dot inside: j' : 'no dot: ḥ'}</Chip>}
    </>
  );
}

/** Teens and adults: د and ذ, like alif, never hold hands with the next letter. */
export function Lq3RuleGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute flex items-center gap-3 rounded-[24px] px-8" dir="rtl" style={{ left: 900, top: 230, background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span lang="ar" style={{ ...AR, fontSize: 120, color: INK_TEXT, paddingBottom: 24 }}>دَجَاجٌ</span>
        </motion.div>
      )}
      {lines >= 2 && (
        <>
          <Chip x={1170} y={470} color={CRIMSON} delay={0.5}>د and ا let go of the next letter</Chip>
        </>
      )}
      {lines >= 3 && <Chip x={1170} y={520} color={TEAL} delay={0.3}>six letters do this: ا د ذ ر ز و</Chip>}
    </>
  );
}

/** A row of letters for a "tap every ..." question. */
export function La3FindGraphic({ lines, interaction }: GraphicProps) {
  if (!lines && !interaction) return null;
  return (
    <>
      <Person x={1440} y={800} scale={0.85} color={GOLD} />
      <Paper x={1060} y={220} w={560} letters={['ج', 'ح', 'خ', 'ج', 'ب', 'ح']} />
    </>
  );
}

/** Words built from the letters so far: each card shows the word, its sound and meaning; tap to hear. */
function Words({ lines, words }: { lines: number; words: { w: string; t: string; m: string; id: string }[] }) {
  const shown = Math.min(words.length, Math.max(0, lines));
  return (
    <>
      {words.slice(0, shown).map((w, i) => (
        <motion.div key={w.id} className="absolute flex items-center gap-6 rounded-[24px]" style={{ left: 880, top: 190 + i * 170, width: 600, padding: '0 28px', background: CARD, boxShadow: SHADOW }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
          <div className="flex flex-col">
            <span className="font-sans font-black" style={{ fontSize: 28, color: CRIMSON }}>{w.t}</span>
            <span className="font-sans font-bold" style={{ fontSize: 18, color: soft('light') }}>{w.m}</span>
          </div>
          <span className="ml-auto" style={{ pointerEvents: 'auto' }}><Hear id={w.id}><span lang="ar" style={{ ...AR, fontSize: 84, color: INK_TEXT, paddingBottom: 16, display: 'inline-block' }}>{w.w}</span></Hear></span>
        </motion.div>
      ))}
    </>
  );
}

export const La3WordGraphic = ({ lines }: GraphicProps) => <Words lines={lines >= 2 ? 1 : 0} words={[{ w: 'تَاجٌ', t: 'taajun', m: 'a crown', id: 'taaj' }]} />;
export const Lq3WordsGraphic = ({ lines }: GraphicProps) => (
  <Words lines={lines + (lines >= 2 ? 1 : 0)} words={[{ w: 'تَاجٌ', t: 'taajun', m: 'a crown', id: 'taaj' }, { w: 'دَجَاجٌ', t: 'dajaajun', m: 'chicken', id: 'dajaaj' }, { w: 'ذُبَابٌ', t: 'dhubaabun', m: 'flies', id: 'dhubaab' }]} />
);

export function La3MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Paper x={1100} y={190} letters={['ح', 'ج', 'خ']} />}
      <Person x={1430} y={800} scale={0.85} color={TEAL} delay={0.2} />
    </>
  );
}

export function Lq3MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Paper x={1100} y={190} w={600} letters={['ح', 'ج', 'خ', 'د', 'ذ']} />}
      {lines >= 2 && <Chip x={1100} y={560} color={GOLD} delay={0.3}>one photo, five letters</Chip>}
    </>
  );
}

/** The next family peeks in from the left. */
function NextUp({ lines, letters }: { lines: number; letters: string[] }) {
  return (
    <>
      {lines >= 1 && (
        <div className="pointer-events-none absolute flex gap-12" dir="rtl" style={{ right: 140, top: 300 }}>
          {letters.map((l, i) => (
            <motion.span key={l} lang="ar" style={{ ...AR, fontSize: 130, lineHeight: 1.4, color: lines >= 2 ? INK_TEXT : 'rgba(31,22,18,0.15)' }}
              initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2, duration: 0.7, ease }}>{l}</motion.span>
          ))}
        </div>
      )}
      {lines >= 3 && <Chip x={1120} y={600} color={GOLD} delay={0.3}>next time</Chip>}
    </>
  );
}

export const La3NextGraphic = ({ lines }: GraphicProps) => <NextUp lines={lines} letters={['د', 'ذ', 'ر', 'ز']} />;
export const Lq3NextGraphic = ({ lines }: GraphicProps) => <NextUp lines={lines} letters={['ر', 'ز', 'س', 'ش']} />;
