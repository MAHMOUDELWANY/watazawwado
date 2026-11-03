import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip, Badge, Svg, Draw } from './kit';
import { Q, Panel, MUSHAF } from './g-tj1';

/**
 * Tajweed · Level 1 · Lesson 3 · Four Doors (izhar). Adults paper stage with the Mushaf panel. The motion carries the
 * rule: a still noon walks to four arched doors; the first door opens onto the throat, and the n passes through it
 * whole. Izhar words glow mint on the real ayat; whole words are lit, never split letters.
 */

const BASE = '#F6E3B8';
const MINT = '#7FE0C2';
const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';
const lit = (on: boolean) => (on ? { color: MINT, textShadow: `0 0 16px ${MINT}` } : undefined);
const DOORS = [
  { ar: 'ٱلْإِظْهَار', en: 'clear' },
  { ar: 'ٱلْإِدْغَام', en: 'merged' },
  { ar: 'ٱلْإِقْلَاب', en: 'swapped' },
  { ar: 'ٱلْإِخْفَاء', en: 'hidden' },
];

/** Four arched doors, right to left; `open` lights the first. */
function Doors({ shown = 4, open = false, labels = true, y = 260 }: { shown?: number; open?: boolean; labels?: boolean; y?: number }) {
  return (
    <>
      {DOORS.slice(0, shown).map((d, i) => {
        const x = 1380 - i * 160;
        const first = i === 0;
        return (
          <motion.div key={d.en} className="absolute flex flex-col items-center" style={{ left: x - 60, top: y, width: 120 }}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2, duration: 0.6, ease }}>
            <motion.div style={{ width: 110, height: 190, borderRadius: '55px 55px 8px 8px', background: first && open ? GOLD : MUSHAF }}
              initial={false} animate={{ boxShadow: first && open ? `0 0 40px 8px ${GOLD}88` : SHADOW }} />
            {labels && <Q size={24} color={first ? MUSHAF : soft('light')}>{d.ar}</Q>}
            {labels && <span className="font-sans font-bold" style={{ fontSize: 16, color: first ? MUSHAF : soft('light') }}>{d.en}</span>}
          </motion.div>
        );
      })}
    </>
  );
}

/** A tile for a letter. */
function Letter({ x, y, l, color = MUSHAF, delay = 0, glow = false }: { x: number; y: number; l: string; color?: string; delay?: number; glow?: boolean }) {
  return (
    <motion.span className="absolute flex items-center justify-center rounded-[20px]" style={{ left: x - 48, top: y - 50, width: 96, height: 100, background: CARD, boxShadow: glow ? `0 0 0 3px ${MINT}, ${SHADOW}` : SHADOW }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring', bounce: 0.4 }}>
      <Q size={60} color={color}>{l}</Q>
    </motion.span>
  );
}

/** A two-part word card: the n part and the throat-letter part, each in its own box, side by side (RTL). */
function Split({ x, y, left, right, beats, delay = 0 }: { x: number; y: number; left: string; right: string; beats: string; delay?: number }) {
  return (
    <motion.div className="absolute flex items-center gap-5" style={{ left: x, top: y }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.6, ease }}>
      <span className="font-sans font-black" style={{ fontSize: 28, color: TEAL }}>{beats}</span>
      <span className="flex items-center gap-2 rounded-[20px] px-5" dir="rtl" style={{ background: CARD, boxShadow: SHADOW }}>
        <Q size={52} color={INK_TEXT}>{right}</Q>
        <span className="block rounded-full" style={{ width: 4, height: 44, background: MINT }} />
        <Q size={52} color={INK_TEXT}>{left}</Q>
      </span>
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Tj3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Doors open labels={false} y={240} />
      <motion.span className="absolute inline-block rounded-[18px]" style={{ left: 1320, top: 480, padding: '0 20px', background: CARD, boxShadow: SHADOW }} initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.8, ease }}>
        <Q size={56} color={MUSHAF}>نْ</Q>
      </motion.span>
    </>
  );
}

export function Tj3RecallGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Panel x={880} y={220} w={580} h={240}>
        <Q size={46} color={BASE} clip="ikhlas-4">وَلَمْ يَكُن لَّهُۥ <span style={lit(lines >= 2)}>كُفُوًا أَحَدٌۢ</span></Q>
      </Panel>
      {lines >= 2 && <Chip x={1170} y={510} color={TEAL} delay={0.4}>ku-fu-wan · a-had</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

export function Tj3DoorsGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <Letter x={1000} y={190} l="نْ" />
          <Letter x={1120} y={190} l="دٌ" delay={0.2} />
          <Chip x={1060} y={260} color={TEAL} delay={0.4}>both = n</Chip>
        </>
      )}
      {lines >= 2 && <Doors shown={4} y={320} />}
      {lines >= 3 && <Chip x={1380} y={630} color={GOLD} delay={0.3}>today: door 1</Chip>}
    </>
  );
}

/** A throat in profile with three heights lit, and the six letters in their pairs. */
export function Tj3ThroatGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  const pairs = [['ء', 'ه'], ['ع', 'ح'], ['غ', 'خ']];
  const ys = [600, 500, 400];
  return (
    <>
      {lines >= 1 && (
        <Svg>
          <path d="M 900 800 C 910 720, 960 700, 985 690 L 985 600 C 935 590, 910 545, 910 485 C 910 410, 965 360, 1030 360 C 1100 360, 1150 410, 1150 480 C 1150 500, 1170 520, 1162 532 C 1154 544, 1142 540, 1140 556 C 1138 590, 1110 600, 1070 598 L 1062 690 C 1090 700, 1150 720, 1160 800 Z" fill="#EAD2B6" stroke="#C9A889" strokeWidth={3} />
        </Svg>
      )}
      {lines >= 2 && pairs.map((p, i) => (
        <React.Fragment key={i}>
          <motion.span className="pointer-events-none absolute block rounded-full" style={{ left: 1012, top: ys[i] - 12 + (i === 2 ? 40 : i === 1 ? 40 : 30), width: 24, height: 24, background: MINT, boxShadow: `0 0 14px ${MINT}` }}
            initial={{ opacity: 0 }} animate={reduce ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, delay: i * 0.3, repeat: reduce ? 0 : Infinity }} />
          <Letter x={1300} y={ys[i]} l={p[0]} delay={0.2 + i * 0.3} glow />
          <Letter x={1410} y={ys[i]} l={p[1]} delay={0.3 + i * 0.3} glow />
        </React.Fragment>
      ))}
      {lines >= 3 && (
        <motion.div className="absolute rounded-[16px] px-4" style={{ left: 880, top: 180, background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Q size={30} color={MUSHAF}>أَخِي هَاكَ عِلْمًا حَازَهُ غَيْرُ خَاسِرٍ</Q>
        </motion.div>
      )}
    </>
  );
}

export function Tj3IzharGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <Panel x={880} y={170} w={600} h={210}>
          <Q size={36} color={BASE} clip="masad-2">مَآ أَغْنَىٰ <span style={lit(lines >= 2)}>عَنْهُ</span> مَالُهُۥ وَمَا كَسَبَ</Q>
          <Q size={30} color={BASE} clip="quraysh-4">ٱلَّذِىٓ أَطْعَمَهُم مِّن جُوعٍ وَءَامَنَهُم <span style={lit(lines >= 3)}>مِّنْ خَوْفٍۭ</span></Q>
        </Panel>
      )}
      {lines >= 2 && <Split x={940} y={450} left="عَنْ" right="هُ" beats="an · hu" />}
      {lines >= 3 && <Split x={940} y={590} left="مِّنْ" right="خَوْفٍ" beats="min · khawf" />}
    </>
  );
}

export function Tj3TanweenGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <Panel x={880} y={170} w={600} h={210}>
          <Q size={36} color={BASE} clip="ikhlas-4">وَلَمْ يَكُن لَّهُۥ <span style={lit(lines >= 2)}>كُفُوًا أَحَدٌۢ</span></Q>
          <Q size={40} color={BASE} clip="qariah-11"><span style={lit(lines >= 3)}>نَارٌ حَامِيَةٌۢ</span></Q>
        </Panel>
      )}
      {lines >= 2 && <Split x={900} y={450} left="كُفُوًا" right="أَحَدٌ" beats="ku-fu-wan · a-had" />}
      {lines >= 3 && <Split x={900} y={590} left="نَارٌ" right="حَامِيَةٌ" beats="naa-run · haa-mi-yah" />}
    </>
  );
}

/** Two stations, far apart: the tongue tip for n, the throat for the letter; a gap with nothing in it. */
export function Tj3WhyGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <Svg>
            <path d="M 900 800 C 910 720, 960 700, 985 690 L 985 600 C 935 590, 910 545, 910 485 C 910 410, 965 360, 1030 360 C 1100 360, 1150 410, 1150 480 C 1150 500, 1170 520, 1162 532 C 1154 544, 1142 540, 1140 556 C 1138 590, 1110 600, 1070 598 L 1062 690 C 1090 700, 1150 720, 1160 800 Z" fill="#EAD2B6" stroke="#C9A889" strokeWidth={3} />
          </Svg>
          <Badge x={1140} y={540} name="check" size={44} color={TEAL} />
          <Chip x={1290} y={520} color={TEAL} delay={0.3}>ن · tongue tip</Chip>
          <Badge x={1022} y={640} name="check" size={44} color={MINT} delay={0.4} />
          <Chip x={1290} y={640} color={MUSHAF} delay={0.6}>ح · the throat</Chip>
        </>
      )}
      {lines >= 2 && <Svg><Draw d="M 1130 560 Q 1080 600 1035 630" color={CRIMSON} width={3} dash="3 9" dur={0.8} /></Svg>}
      {lines >= 2 && <Chip x={1060} y={300} color={CRIMSON} delay={0.4}>too far to blend</Chip>}
    </>
  );
}

/** Quraysh 4 with its two مِّن: the sukoon is circled on one, missing on the other. */
export function Tj3MushafGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <Panel x={860} y={180} w={640} h={180}>
          <Q size={34} color={BASE} clip="quraysh-4">ٱلَّذِىٓ أَطْعَمَهُم <span style={lines >= 3 ? { color: '#FFB4A8' } : undefined}>مِّن جُوعٍ</span> وَءَامَنَهُم <span style={lit(lines >= 2)}>مِّنْ خَوْفٍۭ</span></Q>
        </Panel>
      )}
      {lines >= 2 && (
        <motion.div className="absolute flex flex-col items-center rounded-[20px] px-6 py-2" style={{ left: 1210, top: 420, background: CARD, boxShadow: `0 0 0 3px ${MINT}, ${SHADOW}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Q size={64}>مِّنْ</Q>
          <span className="font-sans font-bold" style={{ fontSize: 16, color: MUSHAF }}>sukoon: clear</span>
        </motion.div>
      )}
      {lines >= 3 && (
        <motion.div className="absolute flex flex-col items-center rounded-[20px] px-6 py-2" style={{ left: 930, top: 420, background: CARD, boxShadow: `0 0 0 3px #FFB4A8, ${SHADOW}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Q size={64}>مِّن</Q>
          <span className="font-sans font-bold" style={{ fontSize: 16, color: CRIMSON }}>no sukoon: another door</span>
        </motion.div>
      )}
      {lines >= 4 && <Chip x={1180} y={650} color={GOLD} delay={0.3}>tanween stacked straight = clear too</Chip>}
    </>
  );
}

export function Tj3MistakesGraphic({ lines, items }: GraphicProps) {
  const wrong = ['an-nnn-hu', 'a-hu', 'a-na-hu'];
  return (
    <>
      {lines >= 1 && <Split x={980} y={190} left="عَنْ" right="هُ" beats="an · hu" />}
      {wrong.slice(0, Math.max(lines, items)).map((w, i) => (
        <motion.div key={w} className="absolute flex items-center gap-4 rounded-[18px] px-5 py-2" style={{ left: 980, top: 340 + i * 110, background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5, ease }}>
          <span className="font-sans font-black" style={{ fontSize: 30, color: CRIMSON, textDecoration: 'line-through' }}>{w}</span>
          <span className="font-sans font-bold" style={{ fontSize: 18, color: soft('light') }}>{['a long hum', 'the n dropped', 'a vowel added'][i]}</span>
        </motion.div>
      ))}
    </>
  );
}

/* ---------- athar ---------- */

export function Tj3SpotGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return <Doors open labels y={260} />;
}

export function Tj3ReciteGraphic({ lines, interaction }: GraphicProps) {
  if (lines === 0) return null;
  const rows = [
    { c: 'asr-1', t: 'وَٱلْعَصْرِ' },
    { c: 'asr-2', t: <>إِنَّ ٱلْإِنسَـٰنَ لَفِى <span style={lit(lines >= 2)}>خُسْرٍ</span></> },
    { c: 'asr-3', t: <><span style={lit(lines >= 2)}>إِلَّا</span> ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ</> },
  ];
  return (
    <>
      <Panel x={860} y={170} w={640} h={330}>
        {rows.map((r) => <Q key={r.c} size={34} color={BASE} clip={r.c}>{r.t}</Q>)}
      </Panel>
      {interaction && [0, 1, 2].map((i) => (
        <motion.span key={i} className="absolute block rounded-full" style={{ left: 840, top: 230 + i * 90, width: 22, height: 22, border: `3px solid ${GOLD}` }} initial={{ background: 'transparent' }} animate={{ background: i === 1 ? GOLD : TEAL }} transition={{ delay: 0.3 + i * 0.3 }} />
      ))}
    </>
  );
}

/* ---------- ahd ---------- */

export function Tj3MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Badge x={1160} y={330} name="book" size={130} color={MUSHAF} />
      {lines >= 2 && (
        <motion.div className="absolute flex flex-col items-center rounded-[20px] px-6 py-2" style={{ left: 1090, top: 470, background: CARD, boxShadow: `0 0 0 3px ${MINT}, ${SHADOW}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Q size={60}>نْ</Q>
          <span className="font-sans font-bold" style={{ fontSize: 16, color: MUSHAF }}>your clue</span>
        </motion.div>
      )}
    </>
  );
}

/** The second door lights; the n walks into it and disappears. */
export function Tj3NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      {DOORS.map((d, i) => (
        <motion.div key={d.en} className="absolute" style={{ left: 1320 - i * 160, top: 280, width: 110, height: 190, borderRadius: '55px 55px 8px 8px', background: i === 1 && lines >= 1 ? GOLD : MUSHAF, opacity: i === 0 ? 0.4 : 1 }}
          initial={{ opacity: 0 }} animate={{ opacity: i === 0 ? 0.4 : 1 }} transition={{ delay: i * 0.1 }} />
      ))}
      {lines >= 1 && (
        <motion.span className="absolute inline-block rounded-[18px]" style={{ left: 1190, top: 500, padding: '0 20px', background: CARD, boxShadow: SHADOW }} initial={{ opacity: 1, scale: 1 }} animate={{ opacity: lines >= 3 ? 0.2 : 1, scale: lines >= 3 ? 0.6 : 1 }} transition={{ duration: 0.9, ease }}>
          <Q size={56} color={MUSHAF}>نْ</Q>
        </motion.span>
      )}
      {lines >= 3 && <Chip x={1215} y={250} color={GOLD} delay={0.3}>door 2: merged</Chip>}
    </>
  );
}
