import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Bubble, Chip } from './kit';
import { Hear } from '../Say';

/**
 * English · Kids · Lesson 1 · The Snake Sound. The Kids paper stage with the literacy cast (Lina teal, Sam gold,
 * faceless). Letters are written stroke by stroke from their starting point; sounds play on tap (a teacher's recording);
 * words play in the English clone. The motion carries blending: sounds slide together until they make a word.
 */

const GREEN = '#4E9F4A';

/** Handwriting centre-lines in a 100 × 150 box (baseline y 125), in writing order. */
const PEN: Record<string, string[]> = {
  s: ['M 68 62 C 56 44, 24 46, 26 68 C 28 88, 72 86, 72 106 C 72 128, 36 132, 24 112'],
  a: ['M 72 70 C 60 44, 22 50, 24 94 C 26 130, 66 128, 72 96', 'M 74 56 L 74 126'],
  t: ['M 48 22 L 48 112 C 48 128, 62 130, 74 120', 'M 26 58 L 72 58'],
};

function Letter({ ch, x, y, size = 300, color = CRIMSON, delay = 0, width = 12, instant = false }: { ch: string; x: number; y: number; size?: number; color?: string; delay?: number; width?: number; instant?: boolean }) {
  const reduce = useReduce();
  const now = instant || reduce;
  const s = size / 150;
  return (
    <Svg>
      <g transform={`translate(${x - 50 * s} ${y - 125 * s}) scale(${s})`}>
        {PEN[ch].map((d, i) => (
          <motion.path key={i} d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: now ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: now ? 0 : 0.9, delay: now ? 0 : delay + i * 0.9, ease: [0.65, 0, 0.35, 1] }} />
        ))}
        {!now && <motion.circle cx={startOf(PEN[ch][0]).x} cy={startOf(PEN[ch][0]).y} r={7} fill={GOLD} initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ delay, duration: 0.5 }} />}
      </g>
    </Svg>
  );
}

function startOf(d: string) {
  const m = d.match(/M\s*([\d.]+)\s+([\d.]+)/);
  return { x: Number(m?.[1] ?? 0), y: Number(m?.[2] ?? 0) };
}

/** A sound in a bubble; plays on tap. */
function Sound({ x, y, id, text, align = 'left', delay = 0 }: { x: number; y: number; id: string; text: string; align?: 'left' | 'right'; delay?: number }) {
  return <Bubble x={x} y={y} width={150} align={align} delay={delay} accent text={<div style={{ textAlign: 'center' }}><Hear id={id}><span className="font-sans font-black" style={{ fontSize: 40, color: '#fff' }}>{text}</span></Hear></div>} />;
}

/** A word card that plays on tap, its first letter in colour. */
function WordCard({ x, y, id, word, color = CRIMSON, delay = 0 }: { x: number; y: number; id: string; word: string; color?: string; delay?: number }) {
  return (
    <motion.div className="absolute rounded-[20px]" style={{ left: x - 90, top: y, width: 180, padding: '10px 0', textAlign: 'center', background: '#FFFDF8', boxShadow: `0 0 0 3px ${color}55, 0 16px 30px -20px rgba(60,30,10,0.6)` }}
      initial={{ opacity: 0, y: 20, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, delay }}>
      <Hear id={id}><span className="font-sans font-black" style={{ fontSize: 40, color: INK_TEXT }}><span style={{ color }}>{word[0]}</span>{word.slice(1)}</span></Hear>
    </motion.div>
  );
}

/** The little snake, a wavy body that slides. */
function Snake({ x, y, slide = false }: { x: number; y: number; slide?: boolean }) {
  const reduce = useReduce();
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x, top: y, overflow: 'visible' }} width={260} height={80}
      initial={{ x: slide && !reduce ? 220 : 0, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 2, ease }}>
      <path d="M 10 50 C 40 10, 70 10, 100 50 S 160 90, 190 50 S 230 20, 248 40" fill="none" stroke={GREEN} strokeWidth={18} strokeLinecap="round" />
      <circle cx={18} cy={46} r={14} fill={GREEN} />
      <circle cx={13} cy={42} r={3} fill="#fff" />
      <path d="M 4 50 l -10 4 l 4 -6 l -4 -6 z" fill={CRIMSON} />
    </motion.svg>
  );
}

/* ---------- spark ---------- */

export function En1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Letter ch="s" x={960} y={560} size={260} color={TEAL} delay={0.2} />
      <Letter ch="a" x={1150} y={560} size={260} color={CRIMSON} delay={1.2} />
      <Letter ch="t" x={1340} y={560} size={260} color={GOLD} delay={2.4} />
      <Snake x={940} y={640} slide />
    </>
  );
}

/** A garden: Lina and Sam listen; the snake slides in; the hiss becomes a question. */
export function En1GardenGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg><path d="M 760 790 Q 1140 760 1520 790 L 1520 800 L 760 800 Z" fill={GREEN} opacity={0.35} /></Svg>
      <Person x={880} y={800} scale={1.1} color={TEAL} />
      <Person x={1060} y={800} scale={1} color={GOLD} delay={0.1} />
      {lines >= 1 && <Bubble x={1300} y={560} width={220} delay={0.3} text={<Hear id="s-sound"><span className="font-sans font-black" style={{ fontSize: 40, color: GREEN }}>sssss…</span></Hear>} />}
      {lines >= 2 && <Snake x={1180} y={700} slide />}
      {lines >= 3 && <Bubble x={1060} y={540} width={140} align="right" thought delay={0.3} text={<span className="font-sans font-black" style={{ fontSize: 44, color: CRIMSON }}>?</span>} />}
    </>
  );
}

/* ---------- zad ---------- */

function LetterPage({ lines, ch, color, sound, words, extra }: { lines: number; ch: string; color: string; sound: string; words: { id: string; w: string }[]; extra?: React.ReactNode }) {
  return (
    <>
      {lines >= 1 && <Letter ch={ch} x={1060} y={600} size={420} color={color} width={10} instant={lines > 2} delay={lines >= 3 ? 0 : 0.2} />}
      {lines >= 1 && extra}
      {lines >= 2 && <Sound x={1320} y={330} id={sound} text={`/${ch}/`} align="right" />}
      {lines >= 3 && words.map((w, i) => <WordCard key={w.id} x={1370} y={420 + i * 110} id={w.id} word={w.w} color={color} delay={0.2 + i * 0.2} />)}
    </>
  );
}

export function En1SGraphic({ lines }: GraphicProps) {
  return <LetterPage lines={lines} ch="s" color={TEAL} sound="s-sound" words={[{ id: 'sun', w: 'sun' }, { id: 'sock', w: 'sock' }]} extra={<Snake x={860} y={700} />} />;
}

export function En1AGraphic({ lines }: GraphicProps) {
  return <LetterPage lines={lines} ch="a" color={CRIMSON} sound="a-sound" words={[{ id: 'ant', w: 'ant' }, { id: 'apple', w: 'apple' }]} />;
}

export function En1TGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  return (
    <LetterPage lines={lines} ch="t" color={GOLD} sound="t-sound" words={[{ id: 'tent', w: 'tent' }, { id: 'tap', w: 'tap' }]}
      extra={(
        <div className="pointer-events-none absolute" style={{ left: 820, top: 200, width: 120, height: 120 }}>
          <svg width={120} height={120}><circle cx={60} cy={60} r={52} fill="#FFFDF8" stroke={INK_TEXT} strokeWidth={5} /></svg>
          <motion.div className="absolute inset-0" animate={reduce ? {} : { rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
            <svg width={120} height={120}><line x1={60} y1={60} x2={60} y2={20} stroke={CRIMSON} strokeWidth={5} strokeLinecap="round" /></svg>
          </motion.div>
        </div>
      )} />
  );
}

/** Blending: three sound tiles slide closer and closer until they join into a word; then a-t joins below. */
export function En1BlendGraphic({ lines, items }: GraphicProps) {
  const reduce = useReduce();
  const gap = items >= 1 ? 0 : lines >= 2 ? 50 : 130;
  const tiles = [{ c: 's', col: TEAL }, { c: 'a', col: CRIMSON }, { c: 't', col: GOLD }];
  return (
    <>
      {lines >= 1 && tiles.map((t, i) => (
        <motion.span key={t.c} className="absolute flex items-center justify-center rounded-[24px] font-sans font-black" initial={false}
          animate={{ x: (i - 1) * (150 + gap) }} transition={{ duration: reduce ? 0 : 1.2, ease }}
          style={{ left: 1075, top: 260, width: 150, height: 150, fontSize: 110, color: t.col, background: '#FFFDF8', boxShadow: '0 20px 40px -24px rgba(60,30,10,0.6)' }}>{t.c}</motion.span>
      ))}
      {items >= 1 && (
        <motion.div className="absolute text-center" style={{ left: 800, top: 450, width: 700 }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, delay: 0.6 }}>
          <Hear id="sat"><span className="font-sans font-black" style={{ fontSize: 96, color: INK_TEXT }}>sat</span></Hear>
          <span className="ml-4 font-sans font-bold" style={{ fontSize: 24, color: soft('light') }}>I read it!</span>
        </motion.div>
      )}
      {items >= 2 && (
        <motion.div className="absolute flex items-center gap-6" style={{ left: 920, top: 610 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <span className="font-sans font-black" style={{ fontSize: 56, color: CRIMSON }}>a</span>
          <span className="font-sans font-black" style={{ fontSize: 40, color: soft('light') }}>+</span>
          <span className="font-sans font-black" style={{ fontSize: 56, color: GOLD }}>t</span>
          <span className="font-sans font-black" style={{ fontSize: 40, color: soft('light') }}>→</span>
          <Hear id="at"><span className="font-sans font-black" style={{ fontSize: 72, color: INK_TEXT }}>at</span></Hear>
        </motion.div>
      )}
    </>
  );
}

/* ---------- athar ---------- */

export function En1FindGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Svg>{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={830 + i * 110} y={330} width={70} height={300} rx={10} fill="#E3B67A" />)}<rect x={810} y={400} width={680} height={24} fill="#C99A5C" /><rect x={810} y={540} width={680} height={24} fill="#C99A5C" /></Svg>}
      {lines >= 1 && ['s', 'a', 't', 's', 't', 'a'].map((c, i) => (
        <motion.span key={i} className="pointer-events-none absolute font-sans font-black" style={{ left: 845 + i * 110, top: 440, fontSize: 64, color: [TEAL, CRIMSON, GOLD][('sat'.indexOf(c))] }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>{c}</motion.span>
      ))}
      <Person x={1440} y={800} scale={0.9} color={GOLD} />
    </>
  );
}

/** Two words to read alone, a dot under each sound to point at. */
export function En1ReadGraphic({ lines }: GraphicProps) {
  const word = (w: string, id: string, top: number, delay: number) => (
    <motion.div className="absolute flex flex-col items-center" style={{ left: 840, top, width: 620 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.6, ease }}>
      <Hear id={id}><span className="font-sans font-black" style={{ fontSize: 130, lineHeight: 1, color: INK_TEXT, letterSpacing: '0.06em' }}>{w}</span></Hear>
      <div className="mt-2 flex gap-12">{[...w].map((_, i) => <span key={i} className="block rounded-full" style={{ width: 16, height: 16, background: [TEAL, CRIMSON, GOLD][i % 3] }} />)}</div>
    </motion.div>
  );
  return (
    <>
      {lines >= 1 && word('at', 'at', 220, 0.1)}
      {lines >= 2 && word('sat', 'sat', 450, 0.1)}
      {lines >= 3 && <Chip x={1150} y={720} strong delay={0.3}>You just read English!</Chip>}
    </>
  );
}

/* ---------- ahd ---------- */

export function En1MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={900} y={800} scale={1.1} color={TEAL} />
      {lines >= 1 && (
        <Svg>
          <g transform="translate(1060 470)"><path d="M 0 0 L 40 0 L 40 70 Q 40 92 70 92 L 96 92 L 96 120 L 30 120 Q 0 120 0 90 Z" fill={TEAL} /></g>
          <g transform="translate(1230 480)"><circle cx={50} cy={60} r={52} fill={CRIMSON} /><rect x={46} y={0} width={8} height={18} fill="#6B3B1F" /></g>
          <g transform="translate(1390 470)"><rect x={0} y={30} width={90} height={90} rx={14} fill={GOLD} /><circle cx={45} cy={20} r={20} fill={GOLD} /></g>
        </Svg>
      )}
      {lines >= 2 && (
        <>
          <Chip x={1110} y={620} color={TEAL} delay={0.2}>s · sock</Chip>
          <Chip x={1280} y={620} color={CRIMSON} delay={0.4}>a · apple</Chip>
          <Chip x={1435} y={620} color={GOLD} delay={0.6}>t · toy</Chip>
        </>
      )}
    </>
  );
}

export function En1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <WordCard x={960} y={300} id="pin" word="pin" color={TEAL} />
          <WordCard x={1160} y={300} id="pan" word="pan" color={CRIMSON} delay={0.2} />
          <WordCard x={1360} y={300} id="tin" word="tin" color={GOLD} delay={0.4} />
        </>
      )}
      {lines >= 2 && (
        <div className="pointer-events-none absolute flex gap-10" style={{ left: 980, top: 470 }}>
          {['i', 'p', 'n'].map((c, i) => (
            <motion.span key={c} className="flex items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 100, height: 100, fontSize: 60, background: [GOLD, TEAL, CRIMSON][i] }}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 + i * 0.25 }}>{c}</motion.span>
          ))}
        </div>
      )}
      {lines >= 3 && <Person x={1440} y={800} scale={0.9} color={GOLD} />}
    </>
  );
}
