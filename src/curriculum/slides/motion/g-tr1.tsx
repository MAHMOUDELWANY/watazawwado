import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip } from './kit';
import { Q, MUSHAF } from './g-tj1';

/**
 * Tajweed · Level 3 · Lesson 1 · Every Stretch, Ranked. The device for the whole of Level 3 (MAP-level-3.md): the
 * recitation ruler. Six counts are six marks on a gold track; each madd is a row whose bar fills to its length, a bead
 * counts the beats, and allowed choices (4 or 5; 2, 4 or 6) are rings on the track. Counts: Hafs by way of ash-Shatibiyyah.
 */

export type Madd = { key: string; en: string; ar: string; counts: number[]; color: string; clip?: string; rank?: number };
// Stage geometry (canvas px).
const LX = 850, LW = 230, TX = 1100, CW = 56, TOP = 236, RH = 84;
const CARD = '#FFFDF8';
const SHADOW = '0 12px 24px -18px rgba(60,30,10,0.6)';

export const M: Record<string, Madd> = {
  natural: { key: 'natural', en: 'natural', ar: 'مَـٰلِكِ', counts: [2], color: TEAL, clip: 'fatiha-4' },
  muttasil: { key: 'muttasil', en: 'muttasil · joined', ar: 'أُو۟لَـٰٓئِكَ', counts: [4, 5], color: CRIMSON, clip: 'baqarah-5', rank: 2 },
  munfasil: { key: 'munfasil', en: 'munfasil · separated', ar: 'بِمَآ أُنزِلَ', counts: [4, 5], color: '#E8705F', clip: 'baqarah-4', rank: 4 },
  lazim: { key: 'lazim', en: 'lazim · fixed', ar: 'ٱلضَّآلِّينَ', counts: [6], color: '#8B1A1E', clip: 'fatiha-7', rank: 1 },
  harfi: { key: 'harfi', en: 'lazim in a letter', ar: 'الٓمٓ', counts: [6], color: '#8B1A1E', clip: 'baqarah-1' },
  aridh: { key: 'aridh', en: "'aridh · at a stop", ar: 'نَسْتَعِينُ', counts: [2, 4, 6], color: GOLD, clip: 'fatiha-5', rank: 3 },
  badal: { key: 'badal', en: 'badal', ar: 'ٱلْـَٔاخِرَةِ', counts: [2], color: MUSHAF, clip: 'baqarah-4', rank: 5 },
  leen: { key: 'leen', en: 'leen · at a stop', ar: 'ٱلصَّيْفِ', counts: [2, 4, 6], color: '#7A8B3A', clip: 'quraysh-2' },
};

/** The count marks across the top. `pulse` makes them light one by one, like a steady beat. */
function Ticks({ pulse = false, mark }: { pulse?: boolean; mark?: number }) {
  const reduce = useReduce();
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <motion.span key={n} className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black" style={{ left: TX + n * CW - 17, top: TOP - 52, width: 34, height: 34, fontSize: 17, background: mark === n ? GOLD : CARD, color: mark === n ? '#fff' : INK_TEXT, boxShadow: SHADOW }}
          initial={{ opacity: 0, y: -8 }} animate={pulse && !reduce ? { opacity: 1, y: 0, scale: [1, 1.25, 1] } : { opacity: 1, y: 0 }}
          transition={pulse && !reduce ? { scale: { duration: 0.4, delay: 0.6 + n * 0.45, repeat: Infinity, repeatDelay: 6 * 0.45 - 0.4 }, opacity: { delay: n * 0.05 } } : { delay: n * 0.05 }}>{n}</motion.span>
      ))}
      <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: TX - 4, top: TOP - 76, fontSize: 12, letterSpacing: '0.16em', color: soft('light') }}>counts</span>
    </>
  );
}

/** One madd on the ruler: its word, its name, its bar and its allowed lengths. */
function Row({ m, i, dim = false, count = true, rank, delay = 0 }: { m: Madd; i: number; dim?: boolean; count?: boolean; rank?: number; delay?: number }) {
  const reduce = useReduce();
  const y = TOP + i * RH;
  const lo = Math.min(...m.counts), hi = Math.max(...m.counts);
  const choice = m.counts.length > 1;
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: 0, top: 0 }} initial={{ opacity: 0, x: 24 }} animate={{ opacity: dim ? 0.3 : 1, x: 0 }} transition={{ duration: 0.6, delay, ease }}>
      {/* the word and its name */}
      <div className="absolute flex items-center justify-between rounded-[16px]" style={{ left: LX, top: y, width: LW, height: RH - 14, padding: '0 14px', background: CARD, boxShadow: SHADOW, borderInlineStart: `6px solid ${m.color}` }}>
        <span className="font-sans font-bold" style={{ fontSize: 15, color: INK_TEXT, lineHeight: 1.15, maxWidth: 92 }}>{m.en}</span>
        <Q size={26} color={m.color} clip={m.clip}>{m.ar}</Q>
      </div>
      {rank && (
        <span className="absolute flex items-center justify-center rounded-full font-sans font-black" style={{ left: LX - 46, top: y + (RH - 14) / 2 - 18, width: 36, height: 36, fontSize: 18, background: m.color, color: '#fff' }}>{rank}</span>
      )}
      {/* the track, then the bar to the shortest allowed length, then a lighter run to the longest */}
      <div className="absolute rounded-full" style={{ left: TX, top: y + 26, width: 6 * CW, height: 18, background: 'rgba(31,22,18,0.08)' }} />
      <motion.div className="absolute rounded-full" style={{ left: TX, top: y + 26, height: 18, background: m.color, transformOrigin: 'left', width: lo * CW }}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : 0.25 * lo, delay: delay + 0.3, ease: 'linear' }} />
      {hi > lo && (
        <motion.div className="absolute rounded-full" style={{ left: TX + lo * CW - 9, top: y + 26, height: 18, width: (hi - lo) * CW + 9, background: `repeating-linear-gradient(90deg, ${m.color}66 0 8px, ${m.color}22 8px 14px)`, transformOrigin: 'left' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : 0.25 * (hi - lo), delay: delay + 0.3 + 0.25 * lo, ease: 'linear' }} />
      )}
      {choice && m.counts.map((c) => (
        <motion.span key={c} className="absolute block rounded-full" style={{ left: TX + c * CW - 13, top: y + 22, width: 26, height: 26, border: `4px solid ${m.color}`, background: CARD }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: delay + 0.6 + c * 0.08 }} />
      ))}
      {!choice && count && (
        <motion.span className="absolute block rounded-full" style={{ left: TX - 11, top: y + 24, width: 22, height: 22, background: CARD, border: `3px solid ${m.color}` }}
          initial={{ x: 0 }} animate={reduce ? { x: lo * CW } : { x: [0, lo * CW, lo * CW] }} transition={{ duration: 0.45 * lo + 0.8, times: [0, 0.45 * lo / (0.45 * lo + 0.8), 1], delay: delay + 0.4, repeat: reduce ? 0 : Infinity, ease: 'linear' }} />
      )}
      <span className="absolute font-sans font-black" style={{ left: TX + 6 * CW + 18, top: y + 20, fontSize: 20, color: m.color, whiteSpace: 'nowrap' }}>{m.counts.join(' · ')}</span>
    </motion.div>
  );
}

function Ruler({ rows, pulse = false, mark, ranks = false, dimFrom }: { rows: Madd[]; pulse?: boolean; mark?: number; ranks?: boolean; dimFrom?: number }) {
  return (
    <>
      <Ticks pulse={pulse} mark={mark} />
      {rows.map((m, i) => <Row key={m.key + i} m={m} i={i} rank={ranks ? m.rank : undefined} dim={dimFrom !== undefined && i >= dimFrom} delay={i * 0.12} />)}
    </>
  );
}

const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800 };
const below = (rows: number) => TOP + rows * RH + 18;

/* ---------- spark ---------- */

export function Tr1CoverGraphic(_: GraphicProps) {
  return <Ruler rows={[M.natural, M.badal, M.munfasil, M.muttasil, M.aridh, M.lazim]} />;
}

/** The beat first, then Level 1's three stretches side by side on the same marks. */
export function Tr1RulerGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Ticks pulse />
      {lines >= 2 && [M.natural, M.muttasil, M.lazim].map((m, i) => <Row key={m.key} m={m} i={i} delay={i * 0.15} />)}
      {lines >= 3 && <Chip x={1150} y={below(3)} color={GOLD} delay={0.3}>the same measure, first ayah to last</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

/** A madd letter alone stays at two; a hamza or a sukoon after it makes it longer. */
export function Tr1CausesGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const card = (t: string, x: number, c: string, d: number, sub?: string) => (
    <motion.span key={t} lang="ar" className="absolute flex flex-col items-center justify-center rounded-[18px]" style={{ left: x, top: 230, width: 110, height: 120, background: CARD, boxShadow: SHADOW, ...AR, fontSize: 56, color: c }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: d, type: 'spring', bounce: 0.35 }}>
      {t}{sub && <span className="font-sans" style={{ fontSize: 14, fontWeight: 700, color: INK_TEXT }}>{sub}</span>}
    </motion.span>
  );
  const row = (i: number, m: Madd, cause?: string) => (
    <React.Fragment key={m.key}>
      <Row m={m} i={i} />
      {cause && (
        <motion.span lang="ar" className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: LX - 64, top: TOP + i * RH + 8, width: 54, height: 54, background: CRIMSON, color: '#fff', ...AR, fontSize: 40, lineHeight: 1 }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.5 }}>{cause}</motion.span>
      )}
    </React.Fragment>
  );
  return (
    <>
      {lines === 1 && ['ا', 'و', 'ي'].map((t, i) => card(t, 900 + i * 140, TEAL, i * 0.15, 'a madd letter'))}
      {lines >= 2 && <Ticks />}
      {lines >= 2 && row(1, M.natural)}
      {lines >= 3 && row(2, { ...M.munfasil, en: '+ a hamza after it' }, 'ء')}
      {lines >= 3 && row(3, { ...M.lazim, en: '+ a sukoon after it' }, 'ـْ')}
    </>
  );
}

export function Tr1NaturalGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Ticks pulse={lines >= 2} />
      <Row m={M.natural} i={1} />
      {lines >= 3 && <Chip x={1150} y={below(2)} color={TEAL} delay={0.3}>the base every stretch is measured from</Chip>}
    </>
  );
}

export function Tr1HamzaGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Ticks />
      <Row m={M.muttasil} i={1} />
      {lines >= 2 && <Row m={M.munfasil} i={2} />}
      {lines >= 3 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-[14px]" style={{ left: TX + 4 * CW - 20, top: TOP + RH - 6, width: CW + 40, height: 2 * RH, border: `3px dashed ${GOLD}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} />
          <Chip x={1150} y={below(3)} color={GOLD} delay={0.4}>choose 4 or 5, then keep it</Chip>
        </>
      )}
    </>
  );
}

export function Tr1SukoonGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Ticks mark={6} />
      <Row m={M.lazim} i={0} />
      {lines >= 2 && <Row m={M.harfi} i={1} />}
      {lines >= 3 && <Row m={M.aridh} i={2} />}
      {lines >= 3 && <Chip x={1150} y={below(3)} color={GOLD} delay={0.4}>fixed sukoon: always 6 · a stop: your choice</Chip>}
    </>
  );
}

export function Tr1SmallGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Ticks />
      <Row m={M.badal} i={1} />
      {lines >= 2 && <Row m={M.leen} i={2} />}
      {lines >= 3 && <Chip x={1150} y={below(3)} color={MUSHAF} delay={0.3}>small, but still on the ruler</Chip>}
    </>
  );
}

/** The ruler becomes a ladder: the five ranked madds, strongest at the top, lit rank by rank. */
export function Tr1RankedGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const ladder = [M.lazim, M.muttasil, M.aridh, M.munfasil, M.badal];
  return (
    <>
      <Ticks />
      {ladder.map((m, i) => <Row key={m.key} m={m} i={i} rank={lines >= 2 ? m.rank : undefined} dim={lines < 2} delay={i * 0.1} />)}
      <motion.span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: LX - 60, top: TOP - 50, fontSize: 12, letterSpacing: '0.16em', color: CRIMSON }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>↑ strongest</motion.span>
      {lines >= 3 && <Chip x={1150} y={below(5)} color={CRIMSON} delay={0.3}>a fixed cause beats one that comes and goes</Chip>}
    </>
  );
}

/** Al-Baqarah 2:4: its four kinds of madd light on the ruler as the lines name them. */
export function Tr1EvidenceGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const rows = [{ ...M.natural, ar: 'يُؤْمِنُونَ', clip: 'baqarah-4' }, M.munfasil, M.badal, { ...M.aridh, ar: 'يُوقِنُونَ', clip: 'baqarah-4' }];
  return (
    <>
      <Ticks />
      {rows.slice(0, lines >= 2 ? 4 : 3).map((m, i) => <Row key={m.key} m={m} i={i} delay={i * 0.15} />)}
      {lines >= 3 && <Chip x={1150} y={below(4)} color={GOLD} delay={0.3}>one ayah, four kinds, one ruler</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

/** Only the sixth mark lit: the question is which stretches always reach it. */
export function Tr1SixGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Ticks mark={6} />
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: TX, top: TOP + 40, height: 18, width: 6 * CW, background: `linear-gradient(90deg, ${GOLD}22, ${GOLD})`, transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, ease: 'linear' }} />
    </>
  );
}

export function Tr1ReciteGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return <Ruler rows={[M.natural, M.muttasil, M.munfasil, M.lazim, M.aridh]} />;
}

/* ---------- ahd ---------- */

export function Tr1MissionGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Ruler rows={[M.muttasil, M.munfasil, M.aridh]} />
      {lines >= 2 && <Chip x={1150} y={below(3)} color={TEAL} delay={0.3}>my lengths: written down, kept all week</Chip>}
    </>
  );
}

/** The ruler steps back; a real ayah with its stopping marks comes forward. */
export function Tr1NextGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Ruler rows={[M.natural, M.muttasil, M.lazim]} dimFrom={0} />
      <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-[18px]" style={{ left: 850, top: 540, width: 600, height: 96, background: MUSHAF, boxShadow: `inset 0 0 0 5px ${GOLD}` }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease }}>
        <Q size={34} color="#F6E3B8">ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ <span style={{ color: GOLD, textShadow: `0 0 12px ${GOLD}` }}>ۛ</span> فِيهِ <span style={{ color: GOLD, textShadow: `0 0 12px ${GOLD}` }}>ۛ</span> هُدًى لِّلْمُتَّقِينَ</Q>
      </motion.div>
      {lines >= 2 && <Chip x={1150} y={668} color={MUSHAF} delay={0.4}>Al-Baqarah 2:2 · stop at one mark, not both</Chip>}
    </>
  );
}
