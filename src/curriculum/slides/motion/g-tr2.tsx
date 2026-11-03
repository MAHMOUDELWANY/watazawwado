import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip } from './kit';
import { Q, MUSHAF } from './g-tj1';

/**
 * Tajweed · Level 3 · Lesson 2 · Stop and Start. The ayah as a road of word tiles, read right to left. A stop is a gate
 * between two tiles, coloured by its kind (complete, sufficient, good, wrong); the words before it glow in that colour,
 * the words after it wait; going back is an arrow that curves over the road to the tile where the meaning starts.
 */

export type Kind = 'tamm' | 'kafi' | 'hasan' | 'qabih';
const KC: Record<Kind, string> = { tamm: TEAL, kafi: '#3E9C6B', hasan: GOLD, qabih: CRIMSON };
const KN: Record<Kind, string> = { tamm: 'complete · tamm', kafi: 'sufficient · kafi', hasan: 'good · hasan', qabih: 'wrong · qabih' };
const CARD = '#FFFDF8';
const SHADOW = '0 12px 24px -18px rgba(60,30,10,0.6)';
const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800 };
const RIGHT = 1480, GAP = 12;
const bare = (t: string) => t.replace(/[ً-ٰٟۖ-ۭـ]/g, '');

/** Lays tiles out right to left from RIGHT; returns each tile's left edge and width. */
function layout(words: string[], size: number) {
  const out: { x: number; w: number }[] = [];
  let r = RIGHT;
  for (const w of words) {
    const width = Math.round(28 + bare(w).length * size * 0.5);
    out.push({ x: r - width, w: width });
    r -= width + GAP;
  }
  return out;
}

/** A road of words with an optional gate after word `cut`, an optional arrow back to `back`, and a start mark. */
function Road({ words, y, size = 30, cut, kind, back, start, noStart, dimAfter = true, delay = 0 }: {
  words: string[]; y: number; size?: number; cut?: number; kind?: Kind; back?: number; start?: number; noStart?: number; dimAfter?: boolean; delay?: number;
}) {
  const L = layout(words, size);
  const H = size * 2.1;
  const c = kind ? KC[kind] : TEAL;
  const gateX = cut !== undefined ? L[cut].x - GAP / 2 : 0;
  return (
    <>
      {words.map((w, i) => {
        const before = cut !== undefined && i <= cut;
        const after = cut !== undefined && i > cut;
        return (
          <motion.span key={w + i} lang="ar" className="pointer-events-none absolute flex items-center justify-center rounded-[14px]" style={{ left: L[i].x, top: y, width: L[i].w, height: H, background: CARD, boxShadow: SHADOW }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: after && dimAfter ? 0.35 : 1, y: 0, boxShadow: before ? `0 0 0 3px ${c}, ${SHADOW}` : SHADOW }} transition={{ duration: 0.5, delay: delay + i * 0.06, ease }}>
            <Q size={size} color={before ? c : INK_TEXT}>{w}</Q>
          </motion.span>
        );
      })}
      {cut !== undefined && (
        <motion.span className="pointer-events-none absolute block rounded-full" style={{ left: gateX - 4, top: y - 14, width: 8, height: H + 28, background: c, boxShadow: `0 0 16px ${c}` }}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.45, delay: delay + 0.5, ease }} />
      )}
      {back !== undefined && cut !== undefined && (() => {
        const to = L[back].x + L[back].w / 2;
        const from = gateX;
        return (
          <svg className="pointer-events-none absolute" style={{ left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
            <motion.path d={`M ${from} ${y - 8} C ${from} ${y - 80}, ${to} ${y - 80}, ${to} ${y - 12}`} fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 10"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: delay + 0.9, ease }} />
            <motion.path d={`M ${to - 9} ${y - 26} L ${to} ${y - 10} L ${to + 9} ${y - 26}`} fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 1.7 }} />
          </svg>
        );
      })()}
      {start !== undefined && <StartMark x={L[start].x + L[start].w} y={y + H + 10} delay={delay + 0.6} />}
      {noStart !== undefined && <StartMark x={L[noStart].x + L[noStart].w} y={y + H + 10} delay={delay + 0.6} crossed />}
    </>
  );
}

/** "Start here": a small flag under the first word to start from (its right edge, since Arabic reads right to left). */
function StartMark({ x, y, delay, crossed = false }: { x: number; y: number; delay: number; crossed?: boolean }) {
  return (
    <motion.span className="pointer-events-none absolute whitespace-nowrap rounded-full font-sans font-bold" style={{ left: x - 92, top: y, padding: '5px 12px', fontSize: 15, background: crossed ? CRIMSON : TEAL, color: '#fff' }}
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, ease }}>{crossed ? '✕ not from here' : 'start here ←'}</motion.span>
  );
}

/** A meaning caption on its own line; `false` meanings are struck through. */
function Meaning({ y, children, color, struck = false, delay = 0.5 }: { y: number; children: React.ReactNode; color: string; struck?: boolean; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute font-serif" style={{ left: 860, width: 620, top: y, textAlign: 'right', fontSize: 26, color: struck ? soft('light') : color, textDecoration: struck ? `line-through ${CRIMSON}` : undefined }}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>{children}</motion.div>
  );
}

/** A labelled box for a passage (an ayah or a group of ayat), used where whole ayat are the units. */
function Block({ x, y, w, title, sub, color, delay = 0, dim = false }: { x: number; y: number; w: number; title: string; sub: string; color: string; delay?: number; dim?: boolean }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col justify-center rounded-[18px]" style={{ left: x, top: y, width: w, height: 110, padding: '0 20px', background: CARD, boxShadow: `0 0 0 3px ${color}66, ${SHADOW}` }}
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: dim ? 0.4 : 1, x: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <span className="font-sans font-black" style={{ fontSize: 22, color }}>{title}</span>
      <span className="font-sans font-bold" style={{ fontSize: 16, color: INK_TEXT }}>{sub}</span>
    </motion.div>
  );
}

const TESTIMONY = ['فَٱعْلَمْ', 'أَنَّهُۥ', 'لَآ', 'إِلَـٰهَ', 'إِلَّا', 'ٱللَّهُ'];
const FATIHA2 = ['ٱلْحَمْدُ', 'لِلَّهِ', 'رَبِّ', 'ٱلْعَـٰلَمِينَ'];
const NISA43 = ['يَـٰٓأَيُّهَا', 'ٱلَّذِينَ', 'ءَامَنُوا۟', 'لَا', 'تَقْرَبُوا۟', 'ٱلصَّلَوٰةَ', 'وَأَنتُمْ', 'سُكَـٰرَىٰ'];

/* ---------- spark ---------- */

export function Tr2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Road words={TESTIMONY} y={300} size={34} />
      <Road words={FATIHA2} y={480} size={34} cut={1} kind="hasan" delay={0.4} />
    </>
  );
}

/** The testimony as a road: a breath cut after لَآ إِلَـٰهَ breaks it; joined, it is true. */
export function Tr2BreathGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const broken = lines === 2;
  return (
    <>
      <Road words={TESTIMONY} y={320} size={36} cut={broken ? 3 : undefined} kind="qabih" />
      {lines === 1 && <Chip x={1170} y={480} color={soft('light')} delay={0.4}>your breath is running out…</Chip>}
      {broken && <Meaning y={470} color={CRIMSON} struck>"there is no god"</Meaning>}
      {lines >= 3 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-full" style={{ left: 880, top: 410, width: 600, height: 8, background: TEAL, transformOrigin: 'right' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, ease }} />
          <Meaning y={450} color={TEAL}>"there is no god except Allah": one breath</Meaning>
        </>
      )}
    </>
  );
}

/* ---------- zad ---------- */

/** 47:19 in two lines of tiles: a lock over the testimony, then the good stop at ۗ. */
export function Tr2KnowGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const line2 = ['وَٱسْتَغْفِرْ', 'لِذَنۢبِكَ', 'وَلِلْمُؤْمِنِينَ', 'وَٱلْمُؤْمِنَـٰتِ ۗ'];
  const line3 = ['وَٱللَّهُ', 'يَعْلَمُ', 'مُتَقَلَّبَكُمْ', 'وَمَثْوَىٰكُمْ'];
  return (
    <>
      <Road words={TESTIMONY} y={230} size={28} />
      <Road words={line2} y={380} size={28} cut={lines >= 3 ? 3 : undefined} kind="kafi" delay={0.2} dimAfter={false} />
      <Road words={line3} y={530} size={28} start={lines >= 3 ? 0 : undefined} delay={0.4} />
      {lines >= 2 && (() => {
        const T = layout(TESTIMONY, 28);
        return <motion.div className="pointer-events-none absolute rounded-[16px]" style={{ left: T[5].x - 10, top: 218, width: T[2].x + T[2].w - T[5].x + 20, height: 84, border: `3px solid ${TEAL}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} />;
      })()}
      {lines >= 2 && <Chip x={1060} y={318} color={TEAL} delay={0.4}>one sentence: never cut</Chip>}
      {lines >= 3 && <Chip x={1060} y={468} color="#3E9C6B" delay={0.5}>ۗ stopping is better here</Chip>}
    </>
  );
}

/** Four kinds, green to red: what is left before the stop, and what comes after it. */
export function Tr2FourGraphic({ lines, items }: GraphicProps) {
  if (lines === 0 && items === 0) return null;
  const kinds: [Kind, string][] = [['tamm', 'meaning whole · a new subject next'], ['kafi', 'meaning whole · the subject goes on'], ['hasan', 'words make sense · lean on what follows'], ['qabih', 'meaning cut or reversed']];
  const n = Math.max(items, lines >= 3 ? 4 : lines >= 2 ? 3 : 2);
  return (
    <div className="absolute flex flex-col gap-4" style={{ left: 860, top: 220, width: 600 }}>
      {kinds.slice(0, n).map(([k, d], i) => (
        <motion.div key={k} className="flex items-center gap-5 rounded-[20px]" style={{ padding: '14px 22px', background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: i * 0.08, ease }}>
          <span className="block shrink-0 rounded-full" style={{ width: 8, height: 54, background: KC[k], boxShadow: `0 0 12px ${KC[k]}` }} />
          <span className="flex flex-col">
            <span className="font-sans font-black" style={{ fontSize: 24, color: KC[k] }}>{KN[k]}</span>
            <span className="font-sans font-bold" style={{ fontSize: 17, color: INK_TEXT }}>{d}</span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/** 2:5 closes a passage, 2:6 opens a new group (complete); 2:7 continues 2:6 (sufficient). */
export function Tr2CompleteGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Block x={1150} y={250} w={320} title="Al-Baqarah 1–5" sub="the people of guidance" color={TEAL} />
      <motion.span className="pointer-events-none absolute block rounded-full" style={{ left: 1128, top: 236, width: 8, height: 138, background: TEAL, boxShadow: `0 0 16px ${TEAL}` }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.5 }} />
      <Block x={850} y={250} w={260} title="Al-Baqarah 6–7" sub="a new group" color="#3E9C6B" delay={0.3} />
      <Chip x={1128} y={392} color={TEAL} delay={0.7}>complete</Chip>
      {lines >= 2 && (
        <>
          <Block x={1150} y={480} w={320} title="Al-Baqarah 6" sub="ends: لَا يُؤْمِنُونَ" color="#3E9C6B" />
          <motion.span className="pointer-events-none absolute block rounded-full" style={{ left: 1128, top: 466, width: 8, height: 138, background: '#3E9C6B', boxShadow: '0 0 16px #3E9C6B' }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.5 }} />
          <Block x={850} y={480} w={260} title="Al-Baqarah 7" sub="still about them" color="#3E9C6B" delay={0.3} />
          <svg className="pointer-events-none absolute" style={{ left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
            <motion.path d="M 1300 600 C 1300 660, 980 660, 980 600" fill="none" stroke="#3E9C6B" strokeWidth={3} strokeDasharray="6 8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.8 }} />
          </svg>
          <Chip x={1140} y={660} color="#3E9C6B" delay={1}>sufficient: the meaning still links them</Chip>
        </>
      )}
      {lines >= 3 && <Chip x={1140} y={720} color={INK_TEXT} delay={0.3}>stop, breathe, start straight on</Chip>}
    </>
  );
}

/** Stop after لِلَّهِ, go back to ٱلْحَمْدُ; at the ayah's end you may start the next ayah. */
export function Tr2GoodGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Road words={FATIHA2} y={300} size={36} cut={1} kind="hasan" back={lines >= 2 ? 0 : undefined} noStart={lines >= 2 ? 2 : undefined} />
      {lines >= 1 && <Meaning y={420} color={GOLD} delay={0.6}>"all praise is for Allah": the words stand</Meaning>}
      {lines >= 3 && (
        <>
          <Road words={['ٱلْعَـٰلَمِينَ ۝', 'ٱلرَّحْمَـٰنِ', 'ٱلرَّحِيمِ']} y={540} size={32} cut={0} kind="kafi" start={1} dimAfter={false} />
          <Chip x={1160} y={690} color="#3E9C6B" delay={0.6}>at an ayah's end: start the next ayah</Chip>
        </>
      )}
    </>
  );
}

/** An-Nisa' 43: a cut after ٱلصَّلَوٰةَ forbids the prayer; go back and carry on to the end of the phrase. */
export function Tr2WrongGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const top = NISA43.slice(0, 5), rest = NISA43.slice(5);
  return (
    <>
      <Road words={top} y={250} size={30} />
      <Road words={rest} y={380} size={30} cut={lines >= 2 ? 0 : undefined} kind="qabih" dimAfter delay={0.2} />
      {lines >= 2 && <Meaning y={500} color={CRIMSON} struck>"do not approach the prayer"</Meaning>}
      {lines >= 2 && <Meaning y={545} color={TEAL} delay={0.8}>"…while you are intoxicated": the ayah's meaning</Meaning>}
      {lines >= 3 && <Chip x={1160} y={640} color={GOLD} delay={0.6}>stuck here? go back before it, and read on</Chip>}
    </>
  );
}

/** Where to start: after the ۗ of 47:19 (yes), and after a good stop mid-ayah (go back, not from here). */
export function Tr2StartGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Road words={['وَٱلْمُؤْمِنَـٰتِ ۗ', 'وَٱللَّهُ', 'يَعْلَمُ', 'مُتَقَلَّبَكُمْ']} y={250} size={30} cut={0} kind="kafi" start={1} dimAfter={false} />
      {lines >= 2 && <Road words={FATIHA2} y={430} size={30} cut={1} kind="hasan" back={0} noStart={2} delay={0.2} />}
      {lines >= 3 && <Chip x={1160} y={600} color={TEAL} delay={0.4}>start where a meaning starts</Chip>}
    </>
  );
}

/** The Mushaf's stopping signs as cards, then the pair in 2:2. */
export function Tr2SignsGraphic({ lines, items }: GraphicProps) {
  if (lines === 0 && items === 0) return null;
  const signs: [string, string, string][] = [['مـ', 'must stop', CRIMSON], ['لا', 'do not stop', '#8B1A1E'], ['ج', 'either', TEAL], ['صلى', 'joining is better', '#3E9C6B'], ['قلى', 'stopping is better', GOLD], ['∴', 'one of the two', MUSHAF]];
  const n = Math.max(items, lines >= 2 ? 6 : 0);
  return (
    <>
      {signs.slice(0, n).map(([s, d, c], i) => (
        <motion.div key={s} className="pointer-events-none absolute flex flex-col items-center justify-center rounded-[18px]" style={{ left: 860 + (i % 3) * 205, top: 210 + Math.floor(i / 3) * 150, width: 190, height: 130, background: CARD, boxShadow: `0 0 0 3px ${c}55, ${SHADOW}` }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.07, ease }}>
          <span lang="ar" style={{ ...AR, fontSize: 46, color: c, lineHeight: 1.2 }}>{s}</span>
          <span className="font-sans font-bold" style={{ fontSize: 17, color: INK_TEXT }}>{d}</span>
        </motion.div>
      ))}
      {lines >= 3 && <Road words={['ذَٰلِكَ', 'ٱلْكِتَـٰبُ', 'لَا', 'رَيْبَ ۛ', 'فِيهِ ۛ', 'هُدًى', 'لِّلْمُتَّقِينَ']} y={540} size={26} cut={3} kind="kafi" start={4} dimAfter={false} />}
    </>
  );
}

/* ---------- athar ---------- */

export function Tr2ReciteGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Block x={1150} y={240} w={320} title="2:1–5" sub="stop at the end: complete" color={TEAL} />
      <Block x={850} y={240} w={270} title="2:6–7" sub="2:6 end: sufficient" color="#3E9C6B" delay={0.2} />
      <Road words={['لَا', 'رَيْبَ ۛ', 'فِيهِ ۛ', 'هُدًى']} y={420} size={30} cut={lines >= 2 ? 1 : undefined} kind="kafi" dimAfter={false} delay={0.3} />
      {lines >= 2 && <Chip x={1160} y={540} color={GOLD} delay={0.5}>say each stop's kind before you take it</Chip>}
    </>
  );
}

/* ---------- ahd ---------- */

export function Tr2MissionGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Road words={TESTIMONY} y={300} size={34} />
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: 880, top: 390, width: 600, height: 8, background: TEAL, transformOrigin: 'right' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.6, ease }} />
      {lines >= 2 && <Chip x={1180} y={440} color={TEAL} delay={0.3}>one breath, every time</Chip>}
    </>
  );
}

/** The raa, heavy and light: next lesson. */
export function Tr2NextGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const card = (t: string, sub: string, x: number, dark: boolean, d: number) => (
    <motion.div className="pointer-events-none absolute flex flex-col items-center justify-center rounded-[24px]" style={{ left: x, top: 260, width: 240, height: 240, background: dark ? '#5C1A1A' : CARD, boxShadow: SHADOW }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: d, type: 'spring', bounce: 0.35 }}>
      <span lang="ar" style={{ ...AR, fontSize: 92, lineHeight: 1.5, color: dark ? GOLD : TEAL }}>{t}</span>
      <span className="font-sans font-bold" style={{ fontSize: 20, marginTop: 8, color: dark ? '#F6E3B8' : INK_TEXT }}>{sub}</span>
    </motion.div>
  );
  return (
    <>
      {card('رَ', 'heavy', 1220, true, 0.2)}
      {lines >= 2 && card('رِ', 'light', 920, false, 0.4)}
      {lines >= 2 && <Chip x={1170} y={560} color={CRIMSON} delay={0.6}>next: raa, in every case</Chip>}
    </>
  );
}
