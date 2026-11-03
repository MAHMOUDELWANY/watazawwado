import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip, Badge } from './kit';
import { Q, Panel, MUSHAF } from './g-tj1';

/**
 * Tajweed · Level 1 · Lesson 2 · The Bounce (qalqalah). Adults paper stage with the Mushaf panel. The motion carries the
 * rule: a ball pressed under a closed lid (the letter held still) and released (the bounce), small while reading on,
 * big at a stop. Bounce words glow coral on the real ayat; whole words are lit, never split letters.
 */

const BASE = '#F6E3B8';
const CORAL = '#FF8A7A';
const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';
const lit = (on: boolean) => (on ? { color: CORAL, textShadow: `0 0 16px ${CORAL}` } : undefined);

/** A ball that bounces `h` pixels, forever (or once with reduced motion), with a shadow that shrinks as it rises. */
function Ball({ x, y, h = 60, size = 34, color = CRIMSON, delay = 0 }: { x: number; y: number; h?: number; size?: number; color?: string; delay?: number }) {
  const reduce = useReduce();
  const t = { duration: 0.9, repeat: reduce ? 0 : Infinity, repeatDelay: 0.5, delay, ease: [0.33, 0, 0.67, 1] as const };
  return (
    <>
      <motion.span className="pointer-events-none absolute block rounded-full" style={{ left: x - size * 0.6, top: y + size / 2 - 4, width: size * 1.2, height: 8, background: 'rgba(31,22,18,0.18)' }}
        animate={reduce ? undefined : { scaleX: [1, 0.5, 1] }} transition={t} />
      <motion.span className="pointer-events-none absolute block rounded-full" style={{ left: x - size / 2, top: y - size / 2, width: size, height: size, background: `radial-gradient(circle at 35% 30%, #FFD0C8, ${color})`, boxShadow: `0 0 18px ${color}66` }}
        initial={{ y: 0 }} animate={reduce ? { y: -h / 2 } : { y: [0, -h, 0] }} transition={t} />
    </>
  );
}

/* ---------- spark ---------- */

/** The five letters on a line, each one hopping in turn. */
export function Tj2CoverGraphic(_: GraphicProps) {
  const reduce = useReduce();
  return (
    <div className="absolute flex gap-4" dir="rtl" style={{ left: 880, top: 360 }}>
      {['ق', 'ط', 'ب', 'ج', 'د'].map((l, i) => (
        <motion.span key={l} className="flex items-center justify-center rounded-[22px]" style={{ width: 100, height: 110, background: CARD, boxShadow: SHADOW }}
          initial={{ opacity: 0, y: 30 }} animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -40, 0] }} transition={{ opacity: { delay: 0.3 + i * 0.1 }, y: { duration: 0.7, delay: 1 + i * 0.25, repeat: reduce ? 0 : Infinity, repeatDelay: 2 } }}>
          <Q size={66} color={MUSHAF}>{l}</Q>
        </motion.span>
      ))}
    </div>
  );
}

/** Al-Ikhlas on the panel; the last word of every ayah lights coral, and a ball bounces at the end of each line. */
export function Tj2RecallGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const on = lines >= 2;
  const rows: [string, string, string][] = [['ikhlas-1', 'قُلْ هُوَ ٱللَّهُ', 'أَحَدٌ'], ['ikhlas-2', 'ٱللَّهُ', 'ٱلصَّمَدُ'], ['ikhlas-3', 'لَمْ يَلِدْ وَلَمْ', 'يُولَدْ'], ['ikhlas-4', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا', 'أَحَدٌۢ']];
  return (
    <>
      <Panel x={880} y={190} w={560} h={470}>
        {rows.map(([c, a, b]) => <Q key={c} size={46} color={BASE} clip={c}>{a} <span style={lit(on)}>{b}</span></Q>)}
      </Panel>
      {lines >= 3 && rows.map((_, i) => <Ball key={i} x={850} y={260 + i * 110} h={36} size={22} delay={i * 0.35} />)}
    </>
  );
}

/* ---------- zad ---------- */

/** The five letters arrive one by one; the memory phrase gathers them; still letters bounce, voweled ones do not. */
export function Tj2FiveGraphic({ lines, items }: GraphicProps) {
  const letters = ['ق', 'ط', 'ب', 'ج', 'د'];
  return (
    <>
      <div className="absolute flex gap-4" dir="rtl" style={{ left: 880, top: 200 }}>
        {letters.slice(0, Math.max(items, lines >= 1 ? 5 : 0)).map((l, i) => (
          <motion.span key={l} className="flex items-center justify-center rounded-[20px]" style={{ width: 96, height: 104, background: CARD, boxShadow: items > i ? `0 0 0 4px ${CORAL}, ${SHADOW}` : SHADOW }}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.4, delay: items ? 0 : i * 0.12 }}>
            <Q size={62} color={MUSHAF}>{l}</Q>
          </motion.span>
        ))}
      </div>
      {lines >= 1 && <motion.div className="absolute" style={{ left: 1010, top: 330 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <span className="inline-block rounded-[18px]" style={{ padding: '0 24px', background: MUSHAF }}><Q size={52} color={GOLD}>قُطْبُ جَدٍّ</Q></span>
      </motion.div>}
      {lines >= 2 && (
        <motion.div className="absolute flex items-center gap-4" style={{ left: 900, top: 500 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="inline-block rounded-[18px]" style={{ padding: '0 22px', background: CARD, boxShadow: `0 0 0 3px ${CORAL}` }}><Q size={52}>أَقْ</Q></span>
          <span className="font-sans font-bold" style={{ fontSize: 22, color: CRIMSON }}>still → bounce</span>
        </motion.div>
      )}
      {lines >= 2 && <Ball x={1250} y={505} h={50} size={30} />}
      {lines >= 3 && (
        <motion.div className="absolute flex items-center gap-4" style={{ left: 900, top: 620 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="inline-block rounded-[18px]" style={{ padding: '0 22px', background: CARD, boxShadow: SHADOW }}><Q size={52}>قَ</Q></span>
          <span className="font-sans font-bold" style={{ fontSize: 22, color: soft('light') }}>with a vowel → read normally</span>
        </motion.div>
      )}
    </>
  );
}

/** A lid presses a ball down (the closed letter); pressure builds; the lid lifts and the ball springs up with echo rings. */
export function Tj2WhyGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  const released = lines >= 3;
  return (
    <>
      <div className="absolute" style={{ left: 1040, top: 640, width: 260, height: 14, borderRadius: 8, background: MUSHAF }} />
      {lines >= 1 && (
        <motion.div className="absolute rounded-[10px]" style={{ left: 1060, top: 562, width: 220, height: 18, background: GOLD, transformOrigin: '10px 50%' }}
          initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1, rotate: released ? -35 : 0 }} transition={{ duration: 0.7, ease }} />
      )}
      <motion.span className="absolute block rounded-full" style={{ left: 1140, width: 60, height: 60, background: `radial-gradient(circle at 35% 30%, #FFD0C8, ${CRIMSON})` }}
        initial={false} animate={released ? (reduce ? { top: 380 } : { top: [580, 300, 560, 420, 560] }) : { top: 580, scaleY: lines >= 2 ? 0.7 : 1 }}
        transition={released ? { duration: 1.6, ease: 'easeOut' } : { duration: 0.5 }} />
      {lines >= 2 && !released && [0, 1, 2].map((i) => (
        <motion.span key={i} className="absolute block rounded-full" style={{ left: 1110 - i * 30, top: 590, width: 10, height: 10, background: CRIMSON }} animate={reduce ? undefined : { x: [-4, 4, -4] }} transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 }} />
      ))}
      {released && [0, 1].map((i) => (
        <motion.span key={i} className="absolute block rounded-full" style={{ left: 1170 - 40 - i * 30, top: 330 - i * 30, width: 80 + i * 60, height: 80 + i * 60, border: `3px solid ${CORAL}` }}
          initial={{ opacity: 0.9, scale: 0.5 }} animate={{ opacity: 0, scale: 1.4 }} transition={{ duration: 1.2, delay: 0.3 + i * 0.2, repeat: reduce ? 0 : Infinity, repeatDelay: 0.8 }} />
      ))}
      {lines >= 1 && <Chip x={1170} y={680} color={MUSHAF} delay={0.3}>the letter: closed and strong</Chip>}
      {lines >= 2 && <Chip x={900} y={560} color={CRIMSON} delay={0.2}>still: the sound is held</Chip>}
      {released && <Chip x={1400} y={300} color={CORAL} delay={0.6}>the release: the bounce</Chip>}
    </>
  );
}

/** Two short passages reading on: the still letter in the middle glows and bounces small. */
export function Tj2SmallGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <Panel x={860} y={190} w={620} h={250}>
          <Q size={44} color={BASE} clip="fil-2">أَلَمْ <span style={lit(lines >= 2)}>يَجْعَلْ</span> كَيْدَهُمْ فِى تَضْلِيلٍ</Q>
          <Q size={44} color={BASE} clip="ikhlas-3">لَمْ <span style={lit(lines >= 3)}>يَلِدْ</span> وَلَمْ يُولَدْ</Q>
        </Panel>
      )}
      {lines >= 2 && <Ball x={1170} y={520} h={30} size={24} />}
      {lines >= 2 && <Chip x={1170} y={580} color={CORAL} delay={0.2}>small bounce · qalqalah sughra</Chip>}
      {lines >= 2 && <Chip x={1170} y={640} color={soft('light')} delay={0.4}>yaj-'al, not yaja-'al</Chip>}
    </>
  );
}

/** Al-Falaq's five endings light one by one, and each gets a big ball. */
export function Tj2BigGraphic({ lines }: GraphicProps) {
  const rows: [string, string, string][] = [['falaq-1', 'قُلْ أَعُوذُ بِرَبِّ', 'ٱلْفَلَقِ'], ['falaq-2', 'مِن شَرِّ مَا', 'خَلَقَ'], ['falaq-3', 'وَمِن شَرِّ غَاسِقٍ إِذَا', 'وَقَبَ'], ['falaq-4', 'وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى', 'ٱلْعُقَدِ'], ['falaq-5', 'وَمِن شَرِّ حَاسِدٍ إِذَا', 'حَسَدَ']];
  if (lines === 0) return null;
  const on = lines >= 2;
  return (
    <>
      <Panel x={900} y={180} w={600} h={460}>
        {rows.map(([c, a, b]) => <Q key={c} size={36} color={BASE} clip={c}>{a} <span style={lit(on)}>{b}</span></Q>)}
      </Panel>
      {lines >= 3 && rows.map((_, i) => <Ball key={i} x={860} y={250 + i * 82} h={56} size={26} delay={i * 0.3} />)}
      {on && <Chip x={1200} y={680} color={CORAL} delay={0.4}>big bounce at the stop · qalqalah kubra</Chip>}
    </>
  );
}

/** تَبَّ held on a gold bar, then the biggest bounce. */
export function Tj2BiggestGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  return (
    <>
      {lines >= 1 && (
        <Panel x={860} y={200} w={620} h={200}>
          <Q size={50} color={BASE} clip="masad-1">تَبَّتْ يَدَآ أَبِى لَهَبٍ <span style={lit(lines >= 2)}>وَتَبَّ</span></Q>
        </Panel>
      )}
      {lines >= 2 && (
        <motion.div className="absolute rounded-full" style={{ left: 940, top: 470, height: 16, background: GOLD, transformOrigin: 'left', width: 300 }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : 1.2, ease: 'linear' }} />
      )}
      {lines >= 2 && <Chip x={1090} y={510} color={GOLD} delay={0.3}>hold the doubled ب</Chip>}
      {lines >= 2 && <Ball x={1310} y={560} h={110} size={44} delay={1.3} />}
      {lines >= 3 && <Chip x={1310} y={640} color={CRIMSON} delay={0.3}>the strongest bounce</Chip>}
    </>
  );
}

/** Three mistake cards, each crossed with what to do instead. */
export function Tj2MistakesGraphic({ lines, items }: GraphicProps) {
  const cards = [{ bad: 'yaja-‘al', good: 'yaj-‘al', note: 'no added vowel' }, { bad: 'AD! (a cough)', good: 'ad·', note: 'light and quick' }, { bad: 'ad (flat)', good: 'ad·', note: 'let it echo' }];
  const n = Math.max(items, lines);
  return (
    <div className="absolute flex flex-col gap-4" style={{ left: 880, top: 200, width: 560 }}>
      {cards.slice(0, n).map((c, i) => (
        <motion.div key={i} className="flex items-center justify-between rounded-[20px]" style={{ padding: '16px 24px', background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
          <span className="relative font-sans font-black" style={{ fontSize: 30, color: soft('light') }}>
            {c.bad}
            <motion.span className="absolute left-0 right-0 block" style={{ top: '50%', height: 4, background: CRIMSON, transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.4 }} />
          </span>
          <span className="font-sans font-black" style={{ fontSize: 30, color: TEAL }}>{c.good}</span>
          <span className="font-sans font-bold" style={{ fontSize: 18, color: INK_TEXT }}>{c.note}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- athar ---------- */

export function Tj2SpotGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <Panel x={880} y={190} w={600} h={420}>
      {['قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', 'مِن شَرِّ مَا خَلَقَ', 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', 'وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ', 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ'].map((a, i) => <Q key={i} size={34} color={BASE} clip={i === 0 ? 'falaq-1' : i === 4 ? 'falaq-5' : undefined}>{a}</Q>)}
    </Panel>
  );
}

/** Both surahs on two panels; nine endings get a teacher's dot when the learner recites. */
export function Tj2ReciteGraphic({ lines, interaction }: GraphicProps) {
  if (lines === 0) return null;
  const ikhlas = ['قُلْ هُوَ ٱللَّهُ أَحَدٌ', 'ٱللَّهُ ٱلصَّمَدُ', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ'];
  const falaq = ['قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', 'مِن شَرِّ مَا خَلَقَ', 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', 'وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ', 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ'];
  const col = (rows: string[], x: number, off: number, title: string) => (
    <div className="absolute flex flex-col gap-1" style={{ left: x, top: 180, width: 330 }}>
      <span className="font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.16em', color: MUSHAF }}>{title}</span>
      {rows.map((a, i) => (
        <div key={i} className="flex items-center justify-between rounded-[12px]" style={{ padding: '0 12px', height: 56, background: MUSHAF }}>
          <motion.span className="block shrink-0 rounded-full" style={{ width: 20, height: 20, border: `3px solid ${GOLD}` }} initial={false} animate={{ background: interaction ? (off + i === 7 ? GOLD : TEAL) : 'transparent' }} transition={{ delay: interaction ? 0.3 + (off + i) * 0.2 : 0 }} />
          <Q size={20} color={BASE}>{a}</Q>
        </div>
      ))}
    </div>
  );
  return (
    <>
      {col(ikhlas, 1160, 0, 'Al-Ikhlas')}
      {col(falaq, 810, 4, 'Al-Falaq')}
    </>
  );
}

/* ---------- ahd ---------- */

export function Tj2MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Badge x={1160} y={330} name="book" size={130} color={MUSHAF} />
      {lines >= 1 && <Ball x={1160} y={470} h={50} size={30} />}
      {lines >= 2 && ['ق', 'ب', 'د'].map((l, i) => (
        <motion.span key={l} className="absolute flex items-center justify-center rounded-[18px]" style={{ left: 980 + i * 130, top: 560, width: 96, height: 96, background: CARD, boxShadow: `0 0 0 3px ${CORAL}, ${SHADOW}` }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.25, type: 'spring', bounce: 0.4 }}>
          <Q size={52} color={MUSHAF}>{l}</Q>
        </motion.span>
      ))}
    </>
  );
}

/** A still noon walks towards four arched doors; the first one lights. */
export function Tj2NextGraphic({ lines }: GraphicProps) {
  const doors = [0, 1, 2, 3];
  return (
    <>
      {doors.map((d) => (
        <motion.div key={d} className="absolute" style={{ left: 880 + d * 150, top: 300, width: 110, height: 200, borderRadius: '55px 55px 8px 8px', background: lines >= 3 && d === 3 ? GOLD : MUSHAF, boxShadow: lines >= 3 && d === 3 ? `0 0 40px 8px ${GOLD}88` : SHADOW }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: lines >= 2 || d === 3 ? 1 : 0.25, y: 0 }} transition={{ delay: d * 0.15, duration: 0.6, ease }} />
      ))}
      {lines >= 1 && (
        <motion.span className="absolute inline-block rounded-[18px]" style={{ left: 1400, top: 560, padding: '0 20px', background: CARD, boxShadow: SHADOW }} initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1, ease }}>
          <Q size={56} color={MUSHAF}>نْ</Q>
        </motion.span>
      )}
      {lines >= 3 && <Chip x={1385} y={530} color={GOLD} delay={0.4}>door 1: clear</Chip>}
    </>
  );
}
