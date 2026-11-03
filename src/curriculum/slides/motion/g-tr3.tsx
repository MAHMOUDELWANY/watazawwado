import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip } from './kit';
import { Q, Panel } from './g-tj1';

/**
 * Tajweed · Level 3 · Lesson 3 · Raa in Full (Taysir ar-Rahman, pp. 146-152). Each word is laid out as letter tiles,
 * right to left. A gold lens hops from the raa to the letter the rule tells you to check (its own vowel; the letter
 * before; past a still letter at a stop), then the raa tile takes its weight: heavy is deep maroon with a gold letter,
 * light is paper with a teal letter. A kasra that does not count is struck; a heavy letter after the raa pulls it heavy.
 */

type W = 'heavy' | 'light' | 'both';
const HEAVY = '#5C1A1A', CARD = '#FFFDF8';
const SHADOW = '0 12px 24px -18px rgba(60,30,10,0.6)';
const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800 };
const TW = 92, GAP = 12, RIGHT = 1460;

/** One word as tiles. `raa` is the raa's index, `look` the indices the lens visits in order. */
function Word({ tiles, raa, look = [], weight, y, label, crossed, pull, breakAfter, delay = 0, result = true }: {
  tiles: string[]; raa: number; look?: number[]; weight?: W; y: number; label?: string; crossed?: number; pull?: number; breakAfter?: number; delay?: number; result?: boolean;
}) {
  const xOf = (i: number) => RIGHT - (i + 1) * TW - i * GAP - (breakAfter !== undefined && i > breakAfter ? 40 : 0);
  const end = delay + 0.5 + look.length * 0.55;
  const w = weight;
  const raaBg = w === 'heavy' ? HEAVY : w === 'both' ? '#F6E3B8' : CARD;
  return (
    <>
      {tiles.map((t, i) => {
        const isRaa = i === raa;
        return (
          <motion.span key={i} lang="ar" className="pointer-events-none absolute flex items-center justify-center rounded-[16px]" style={{ left: xOf(i), top: y, width: TW, height: 100, ...AR, fontSize: 52, lineHeight: 1.6, boxShadow: isRaa ? `0 0 0 3px ${GOLD}, ${SHADOW}` : SHADOW }}
            initial={{ opacity: 0, y: 14, background: CARD, color: isRaa ? GOLD : INK_TEXT }}
            animate={{ opacity: 1, y: 0, background: isRaa && w ? raaBg : CARD, color: isRaa && w ? (w === 'light' ? TEAL : w === 'both' ? HEAVY : GOLD) : isRaa ? CRIMSON : INK_TEXT }}
            transition={{ opacity: { delay: delay + i * 0.06 }, y: { delay: delay + i * 0.06 }, background: { delay: end, duration: 0.5 }, color: { delay: end, duration: 0.5 } }}>
            {t}
          </motion.span>
        );
      })}
      {look.map((li, k) => (
        <motion.span key={`lens-${k}`} className="pointer-events-none absolute block rounded-[20px]" style={{ left: xOf(li) - 8, top: y - 8, width: TW + 16, height: 116, border: `4px solid ${GOLD}`, boxShadow: `0 0 18px ${GOLD}88` }}
          initial={{ opacity: 0, scale: 1.15 }} animate={{ opacity: k === look.length - 1 ? 1 : [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: k === look.length - 1 ? 0.35 : 0.55, delay: delay + 0.5 + k * 0.55, times: k === look.length - 1 ? undefined : [0, 0.2, 0.8, 1] }} />
      ))}
      {crossed !== undefined && (
        <motion.span className="pointer-events-none absolute block rounded-full" style={{ left: xOf(crossed) + 8, top: y + 48, width: TW - 16, height: 5, background: CRIMSON, transformOrigin: 'right' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: end - 0.2, duration: 0.35 }} />
      )}
      {pull !== undefined && (
        <svg className="pointer-events-none absolute" style={{ left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
          <motion.path d={`M ${xOf(pull) + TW / 2} ${y + 108} C ${xOf(pull) + TW / 2} ${y + 150}, ${xOf(raa) + TW / 2} ${y + 150}, ${xOf(raa) + TW / 2} ${y + 108}`} fill="none" stroke={breakAfter !== undefined ? soft('light') : CRIMSON} strokeWidth={4} strokeDasharray={breakAfter !== undefined ? '4 8' : undefined} strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 0.6, duration: 0.7 }} />
        </svg>
      )}
      {result && w && label && (
        <motion.span className="pointer-events-none absolute whitespace-nowrap rounded-full font-sans font-bold" style={{ right: 1600 - xOf(tiles.length - 1) + 20 + (breakAfter !== undefined ? 0 : 0), top: y + 32, padding: '7px 16px', fontSize: 17, background: w === 'heavy' ? HEAVY : w === 'light' ? TEAL : GOLD, color: '#fff' }}
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: end + 0.2, ease }}>{label}</motion.span>
      )}
    </>
  );
}

function Strip({ children, clip }: { children: React.ReactNode; clip?: string }) {
  return (
    <Panel x={830} y={108} w={530} h={80}>
      <Q size={32} color="#F6E3B8" clip={clip}>{children}</Q>
    </Panel>
  );
}

/** The three questions to ask, in order: a small flow on the right. */
function Flow({ on }: { on: number }) {
  const steps = ['Does the raa have a vowel? It decides.', 'Still? The vowel before it decides.', 'Stopping, after a still letter? Look one further back.'];
  return (
    <div className="pointer-events-none absolute flex flex-col gap-3" style={{ left: 860, top: 230, width: 600 }}>
      {steps.slice(0, on).map((t, i) => (
        <motion.div key={i} className="flex items-center gap-4 rounded-[18px]" style={{ padding: '14px 20px', background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12, ease }}>
          <span className="flex shrink-0 items-center justify-center rounded-full font-sans font-black" style={{ width: 38, height: 38, background: GOLD, color: '#fff', fontSize: 18 }}>{i + 1}</span>
          <span className="font-sans font-bold" style={{ fontSize: 21, color: INK_TEXT }}>{t}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- spark ---------- */

export function Tr3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Word tiles={['رَ', 'بِّ']} raa={0} look={[0]} weight="heavy" y={260} label="heavy" />
      <Word tiles={['غَ', 'يْ', 'رِ']} raa={2} look={[2]} weight="light" y={430} label="light" delay={0.6} />
    </>
  );
}

export function Tr3WeightsGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Word tiles={['رَ', 'بِّ']} raa={0} weight="heavy" y={230} label="heavy" />
      <Word tiles={['ٱ', 'لرَّ', 'حْ', 'مَـٰ', 'نِ']} raa={1} weight="heavy" y={370} label="heavy" delay={0.2} />
      {lines >= 2 && <Word tiles={['غَ', 'يْ', 'رِ']} raa={2} weight="light" y={510} label="light" />}
      {lines >= 3 && <Chip x={1170} y={660} color={GOLD} delay={0.3}>what decides the weight?</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

/** The lens stays on the raa: its own vowel decides. */
export function Tr3VowelGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Chip x={1170} y={200} color={GOLD} delay={0.2}>look at the raa itself</Chip>
      {lines >= 2 && <Word tiles={['رَ', 'بِّ']} raa={0} look={[0]} weight="heavy" y={260} label="fatha: heavy" />}
      {lines >= 2 && <Word tiles={['ٱ', 'لرُّ', 'و', 'حُ']} raa={1} look={[1]} weight="heavy" y={400} label="damma: heavy" delay={0.3} />}
      {lines >= 3 && <Word tiles={['غَ', 'يْ', 'رِ']} raa={2} look={[2]} weight="light" y={540} label="kasra: light" />}
    </>
  );
}

/** A still raa: the lens hops one tile back to the vowel before it. */
export function Tr3BeforeGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Chip x={1170} y={200} color={GOLD} delay={0.2}>still raa: look one letter back</Chip>
      {lines >= 2 && <Word tiles={['مَّ', 'رْ', 'ضِ', 'يَّ', 'ةً']} raa={1} look={[1, 0]} weight="heavy" y={270} label="fatha before: heavy" />}
      {lines >= 3 && <Word tiles={['فِ', 'رْ', 'عَ', 'وْ', 'نَ']} raa={1} look={[1, 0]} weight="light" y={440} label="kasra before: light" />}
    </>
  );
}

/** At a stop: past a still letter to the vowel further back; a ي before it makes it light. */
export function Tr3StopGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Word tiles={['عَ', 'صْ', 'رْ']} raa={2} look={[2, 1, 0]} weight={lines >= 2 ? 'heavy' : undefined} y={210} label="heavy" />
      {lines >= 2 && <Word tiles={['خُ', 'سْ', 'رْ']} raa={2} look={[2, 1, 0]} weight="heavy" y={340} label="heavy" delay={0.2} />}
      {lines >= 2 && <Word tiles={['حِ', 'جْ', 'رْ']} raa={2} look={[2, 1, 0]} weight="light" y={470} label="light" delay={0.5} />}
      {lines >= 3 && <Word tiles={['خَ', 'يْ', 'رْ']} raa={2} look={[2, 1]} weight="light" y={600} label="ي before: light" />}
    </>
  );
}

/** ٱلْقَدْرِ: heavy at the stop of 97:1, light when 97:3 is read on; خَيْرٌ the other way round. */
export function Tr3SameGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Strip clip={lines >= 3 ? 'qadr-3' : 'qadr-1'}>{lines >= 3 ? 'لَيْلَةُ ٱلْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ' : 'إِنَّآ أَنزَلْنَـٰهُ فِى لَيْلَةِ ٱلْقَدْرِ'}</Strip>
      {lines >= 2 && <Word tiles={['قَ', 'دْ', 'رْ']} raa={2} look={[2, 1, 0]} weight="heavy" y={250} label="97:1, stopping: heavy" />}
      {lines >= 3 && <Word key="j" tiles={['قَ', 'دْ', 'رِ']} raa={2} look={[2]} weight="light" y={400} label="97:3, reading on: light" />}
      {lines >= 3 && <Word key="k" tiles={['خَ', 'يْ', 'رٌ']} raa={2} look={[2]} weight="heavy" y={550} label="خَيْرٌ read on: heavy" delay={0.8} />}
    </>
  );
}

/** ٱرْجِعِىٓ: the lens finds the kasra of the joining hamza, strikes it, and the raa stays heavy. */
export function Tr3WaslGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Word tiles={['ٱِ', 'رْ', 'جِ', 'عِ', 'ىٓ']} raa={1} look={[1, 0]} crossed={lines >= 2 ? 0 : undefined} weight={lines >= 2 ? 'heavy' : undefined} y={250} label="the joining kasra does not count: heavy" />
      {lines >= 3 && (
        <>
          <Word tiles={['رَ', 'بِّ', 'كِ']} raa={0} weight="heavy" y={430} label="heavy" result />
          <Word tiles={['رَا', 'ضِ', 'يَ', 'ةً']} raa={0} weight="heavy" y={560} label="heavy" delay={0.2} />
        </>
      )}
    </>
  );
}

/** A kasra before, but a heavy ص after in the same word pulls the raa heavy; across a word gap it cannot. */
export function Tr3IstilaGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Word tiles={['مِ', 'رْ', 'صَا', 'دِ']} raa={1} look={[1, 0]} pull={lines >= 2 ? 2 : undefined} weight={lines >= 2 ? 'heavy' : undefined} y={250} label="ص after it, same word: heavy" />
      {lines >= 3 && <Word tiles={['بِ', 'رْ', 'صَ', 'بْ']} raa={1} look={[1, 0]} pull={2} breakAfter={1} weight="light" y={470} label="ص in the next word: light" />}
    </>
  );
}

/** The both-ways words: the raa tile split, the preferred way marked. */
export function Tr3BothGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {lines >= 2 && <Word tiles={['فِ', 'رْ', 'قٍ']} raa={1} weight="both" y={220} label="فِرْقٍ read on · light preferred" />}
      {lines >= 2 && <Word tiles={['يَ', 'سْ', 'رْ']} raa={2} weight="both" y={350} label="يَسْرِ stopping · light preferred" delay={0.2} />}
      {lines >= 2 && <Word tiles={['قِ', 'طْ', 'رْ']} raa={2} weight="both" y={480} label="ٱلْقِطْرِ stopping · light preferred" delay={0.4} />}
      {lines >= 3 && <Word tiles={['مِ', 'صْ', 'رْ']} raa={2} weight="both" y={610} label="مِصْرَ stopping · heavy preferred" />}
    </>
  );
}

/* ---------- athar ---------- */

export function Tr3ReciteGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Strip clip="qadr-3">لَيْلَةُ ٱلْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ</Strip>
      <Flow on={3} />
      {lines >= 2 && <Chip x={1170} y={560} color={CRIMSON} delay={0.3}>then the exceptions: a joining kasra · a heavy letter after</Chip>}
    </>
  );
}

/* ---------- ahd ---------- */

export function Tr3MissionGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Flow on={3} />
      {lines >= 2 && <Word tiles={['فِ', 'رْ', 'قٍ']} raa={1} weight="both" y={540} label="my choice: kept all week" />}
    </>
  );
}

/** Part B: a madd before a hamza, its bar reaching 4 or 5. */
export function Tr3NextGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Word tiles={['جَ', 'آ', 'ءَ']} raa={-1} y={280} result={false} />
      {lines >= 2 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-full" style={{ left: 1000, top: 440, height: 18, width: 4 * 70, background: CRIMSON, transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, ease: 'linear' }} />
          <motion.div className="pointer-events-none absolute rounded-full" style={{ left: 1000 + 4 * 70 - 9, top: 440, height: 18, width: 79, background: `repeating-linear-gradient(90deg, ${CRIMSON}66 0 8px, ${CRIMSON}22 8px 14px)`, transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3, delay: 1 }} />
          <Chip x={1170} y={500} color={CRIMSON} delay={1.2}>next: the stretch before a hamza</Chip>
        </>
      )}
    </>
  );
}
