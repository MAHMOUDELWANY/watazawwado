import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip, Badge } from './kit';
import { Q, Panel } from './g-tj1';
import { MouthMap } from './g-tm1';

/**
 * Tajweed · Level 2 · Lesson 3 · The Deepest Tongue (ق ك). A close-up of the back of the mouth: the soft roof above, the
 * back of the tongue below. For ق the back of the tongue rises to the furthest point and the mouth fills (heavy, with a
 * bounce at a stop); for ك it touches one step forward and a puff of breath slips out (light).
 */

const CORAL = '#E8705F';
const CARD = '#FFFDF8';
const SHADOW = '0 14px 28px -20px rgba(60,30,10,0.6)';
const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800 };
// The close-up on the stage (canvas px) and its drawing size.
const OX = 850, OY = 215, VW = 660, VH = 560, S = 0.88;
type Shape = 'rest' | 'qaf' | 'kaf';
// One command structure for every tongue, so the shape can morph.
const TONGUE: Record<Shape, string> = {
  rest: 'M 0 560 L 0 440 C 80 360 180 320 290 315 C 420 310 540 330 660 350 L 660 560 Z',
  qaf: 'M 0 560 L 0 420 C 60 300 150 205 230 206 C 360 212 520 300 660 345 L 660 560 Z',
  kaf: 'M 0 560 L 0 440 C 80 360 230 150 330 146 C 430 146 560 300 660 345 L 660 560 Z',
};
const ROOF = 'M 0 0 L 660 0 L 660 120 C 540 118 440 120 380 128 C 300 140 230 170 190 205 C 160 235 140 262 118 262 C 100 262 96 240 104 222 C 70 200 30 190 0 190 Z';
const PT = { qaf: [214, 196], kaf: [330, 140] } as const;
const at = (x: number, y: number) => ({ left: OX + x * S, top: OY + y * S });
const BELOW = OY + VH * S + 26; // the chip row under the close-up

/** The back of the mouth in close-up. */
function Closeup({ shape = 'rest', labels = false, heavy = false, bounce = false, breath = false, points = [], cycle = false }: {
  shape?: Shape; labels?: boolean; heavy?: boolean; bounce?: boolean; breath?: boolean; points?: ('qaf' | 'kaf')[];
  /** Loop: touch at ق, then at ك, for ever (keyframes, so it needs no timer). */
  cycle?: boolean;
}) {
  const reduce = useReduce();
  const loop = cycle && !reduce;
  const LOOP = { duration: 3.6, repeat: Infinity, times: [0, 0.15, 0.45, 0.6, 0.9, 1], ease: 'easeInOut' as const };
  return (
    <>
      <motion.svg className="pointer-events-none absolute" width={VW * S} height={VH * S} viewBox={`0 0 ${VW} ${VH}`} style={{ left: OX, top: OY, overflow: 'visible' }}
        initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease }}>
        <defs>
          <clipPath id="tm3-frame"><rect x={0} y={0} width={VW} height={VH} rx={40} /></clipPath>
        </defs>
        <g clipPath="url(#tm3-frame)">
          {/* the space of the mouth: it darkens when ق fills it */}
          <motion.rect x={0} y={0} width={VW} height={VH} initial={false} animate={{ fill: heavy ? '#5C1A1A' : '#F3DCD2' }} transition={{ duration: 0.6 }} />
          <path d={ROOF} fill="#F2B8AC" stroke="#C9877A" strokeWidth={3} />
          {loop
            ? (['rest', 'qaf', 'kaf'] as const).map((t) => (
                <motion.path key={t} d={TONGUE[t]} fill={CORAL} stroke="#B9503F" strokeWidth={3} initial={{ opacity: t === 'rest' ? 1 : 0 }}
                  animate={t === 'rest' ? { opacity: 1 } : { opacity: t === 'qaf' ? [0, 1, 1, 0, 0, 0] : [0, 0, 0, 1, 1, 0] }} transition={t === 'rest' ? undefined : LOOP} />
              ))
            : <motion.path initial={false} animate={{ d: TONGUE[shape] }} transition={{ duration: reduce ? 0 : 0.7, ease }} fill={CORAL} stroke="#B9503F" strokeWidth={3} />}
          {/* the throat opening at the back (left) */}
          <rect x={0} y={250} width={26} height={170} fill="#8B1A1E" opacity={0.25} />
        </g>
        <rect x={0} y={0} width={VW} height={VH} rx={40} fill="none" stroke={INK_TEXT} strokeOpacity={0.18} strokeWidth={3} />
        {(['qaf', 'kaf'] as const).map((p) => {
          const [x, y] = PT[p];
          const c = p === 'qaf' ? CRIMSON : TEAL;
          const on = points.includes(p);
          return (
            <g key={p}>
              {on && !reduce && <motion.circle cx={x} cy={y} r={16} fill="none" stroke={c} strokeWidth={3} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                initial={{ opacity: 0.9, scale: 0.6 }} animate={{ opacity: 0, scale: 2.2 }} transition={{ duration: 1.4, repeat: Infinity }} />}
              <motion.circle cx={x} cy={y} r={11} fill={c} stroke={CARD} strokeWidth={3} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                initial={{ scale: 0 }} animate={{ scale: on ? 1 : 0 }} transition={{ type: 'spring', bounce: 0.45 }} />
            </g>
          );
        })}
        {bounce && [0, 1].map((i) => (
          <motion.circle key={i} cx={PT.qaf[0]} cy={PT.qaf[1] + 30} r={30} fill="none" stroke={GOLD} strokeWidth={4} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={{ opacity: 0.9, scale: 0.5 }} animate={reduce ? { opacity: 0.6, scale: 1.4 } : { opacity: [0.9, 0], scale: [0.5, 2.6] }} transition={{ duration: 1.1, delay: 0.5 + i * 0.25, repeat: reduce ? 0 : Infinity, repeatDelay: 0.6 }} />
        ))}
      </motion.svg>
      {breath && [0, 1, 2].map((i) => (
        <motion.span key={i} className="pointer-events-none absolute block rounded-full" style={{ ...at(PT.kaf[0] + 20, PT.kaf[1] + 28 + i * 14), width: 46, height: 12, background: `linear-gradient(90deg, ${TEAL}CC, ${TEAL}00)`, filter: 'blur(2px)' }}
          initial={{ opacity: 0, x: 0 }} animate={reduce ? { opacity: 0.7, x: 60 } : { opacity: [0, 0.9, 0], x: [0, 220] }} transition={{ duration: 1.3, delay: 0.5 + i * 0.18, repeat: reduce ? 0 : Infinity, repeatDelay: 0.5 }} />
      ))}
      {labels && (
        <>
          <Chip x={OX + 470 * S} y={OY + 40 * S} color="#C9877A" delay={0.3}>the roof of the mouth</Chip>
          <Chip x={OX + 150 * S} y={OY + 290 * S} color="#8B1A1E" delay={0.4}>soft roof · uvula</Chip>
          <Chip x={OX + 470 * S} y={OY + 440 * S} color="#B9503F" delay={0.5}>back of the tongue</Chip>
          <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ ...at(VW - 170, VH + 6), fontSize: 13, letterSpacing: '0.16em', color: soft('light') }}>front of the mouth →</span>
          <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ ...at(0, VH + 6), fontSize: 13, letterSpacing: '0.16em', color: soft('light') }}>← the throat</span>
        </>
      )}
      {/* both tags stay mounted and fade, so switching between ق and ك never remounts them */}
      {(['qaf', 'kaf'] as const).map((p) => (
        <motion.span key={`t-${p}`} lang="ar" className="pointer-events-none absolute flex items-center justify-center rounded-[14px]" style={{ ...at(PT[p][0] - 32, PT[p][1] - 104), width: 64, height: 60, background: CARD, boxShadow: SHADOW, ...AR, fontSize: 38, color: p === 'qaf' ? CRIMSON : TEAL }}
          initial={{ opacity: 0, y: 8 }}
          animate={loop ? { opacity: p === 'qaf' ? [0, 1, 1, 0, 0, 0] : [0, 0, 0, 1, 1, 0], y: 0 } : points.includes(p) ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={loop ? LOOP : { duration: 0.4, ease }}>{p === 'qaf' ? 'ق' : 'ك'}</motion.span>
      ))}
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
const glow = (c: string) => ({ color: c, textShadow: `0 0 14px ${c}` });

/** A word card: Arabic, and its meaning under it. */
function WordCard({ x, y, ar, en, color, icon, delay = 0, struck = false }: { x: number; y: number; ar: string; en: string; color: string; icon?: string; delay?: number; struck?: boolean }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center justify-center rounded-[22px]" style={{ left: x, top: y, width: 250, height: 170, background: CARD, boxShadow: `0 0 0 3px ${color}55, ${SHADOW}` }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <span lang="ar" dir="rtl" style={{ ...AR, fontSize: 60, lineHeight: 1.25, color: struck ? soft('light') : color, textDecoration: struck ? `line-through ${CRIMSON}` : undefined }}>{ar}</span>
      <span className="font-sans font-bold" style={{ fontSize: 20, color: INK_TEXT }}>{en}</span>
      {icon && <Badge x={220} y={30} name={icon} size={46} color={color} delay={delay + 0.3} />}
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Tm3CoverGraphic(_: GraphicProps) {
  return <Closeup cycle />;
}

/** Two pairs that differ only by ق or ك; then both letters on the map, side by side. */
export function Tm3RecallGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  if (lines >= 3) return <MouthMap lit={['lisan']} points={[{ at: 'qaf', tag: 'ق' }, { at: 'kaf', tag: 'ك', color: TEAL }]} />;
  return (
    <>
      <WordCard x={880} y={230} ar="قَلْب" en="a heart" color={CRIMSON} icon="heart" />
      <WordCard x={1170} y={230} ar="كَلْب" en="a dog" color={TEAL} delay={0.2} />
      {lines >= 2 && <WordCard x={880} y={450} ar="قُلْ" en="say" color={CRIMSON} icon="chat" />}
      {lines >= 2 && <WordCard x={1170} y={450} ar="كُلْ" en="eat" color={TEAL} delay={0.2} icon="bowl" />}
    </>
  );
}

/* ---------- zad ---------- */

/** The close-up arrives; the tongue rises to the back point, then to the point one step forward. */
export function Tm3ZoomGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const shape: Shape = lines >= 3 ? 'kaf' : lines === 2 ? 'qaf' : 'rest';
  return <Closeup shape={shape} labels={lines === 1} points={lines >= 3 ? ['qaf', 'kaf'] : lines === 2 ? ['qaf'] : []} />;
}

/** ق: the back of the tongue presses high; the mouth fills (heavy). Then Al-Ikhlas. */
export function Tm3QafGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {lines >= 3 && <Strip clip="ikhlas-1"><span style={glow('#FF9C8C')}>قُلْ</span> هُوَ ٱللَّهُ أَحَدٌ</Strip>}
      <Closeup shape="qaf" points={['qaf']} heavy={lines >= 2} />
      <Chip x={OX + 290} y={BELOW + 14} color={CRIMSON} delay={0.4}>{lines >= 2 ? 'ق fills the mouth: a heavy letter' : 'ق: the furthest back, a firm press'}</Chip>
    </>
  );
}

/** ك: one step forward, a puff of breath slips out; the mouth stays light. Then Al-Kawthar. */
export function Tm3KafGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {lines >= 3 && <Strip clip="kawthar-1">إِنَّآ <span style={glow('#7FD1BE')}>أَعْطَيْنَـٰكَ</span> <span style={glow('#7FD1BE')}>ٱلْكَوْثَرَ</span></Strip>}
      <Closeup shape="kaf" points={['kaf']} breath />
      <Chip x={OX + 290} y={BELOW + 14} color={TEAL} delay={0.4}>{lines >= 2 ? 'ك stays light: the mouth does not fill' : 'ك: one step forward, then a breath'}</Chip>
    </>
  );
}

/** ق bounces, ك breathes: the two exits shown in turn. */
export function Tm3BounceGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const qaf = lines === 1;
  return (
    <>
      <Closeup shape={qaf ? 'qaf' : 'kaf'} points={[qaf ? 'qaf' : 'kaf']} bounce={qaf} breath={!qaf} heavy={qaf} />
      <Chip x={OX + 290} y={BELOW + 14} color={qaf ? GOLD : TEAL} delay={0.2}>{qaf ? 'ق at a stop: it bounces' : lines >= 3 ? 'two exits: a bounce, or a breath' : 'ك at a stop: only a breath'}</Chip>
    </>
  );
}

/** قُلْ at the back, كُفُوًا one step forward; كُفُوًا said with ق is struck through. */
export function Tm3IkhlasGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  if (lines >= 3) {
    return (
      <>
        <WordCard x={880} y={300} ar="كُفُوًا" en="an equal" color={TEAL} />
        <WordCard x={1170} y={300} ar="قُفُوًا" en="not a word of the ayah" color={CRIMSON} delay={0.3} struck />
      </>
    );
  }
  const qaf = lines === 1;
  return <Closeup shape={qaf ? 'qaf' : 'kaf'} points={[qaf ? 'qaf' : 'kaf']} heavy={qaf} breath={!qaf} />;
}

/** Four slip cards: the wrong sound struck through, the right letter and what fixes it. */
export function Tm3SlipsGraphic({ lines, items }: GraphicProps) {
  if (lines === 0 && items === 0) return null;
  const cards: [string, string, string, string][] = [['k', 'ق', 'move the touch back', CRIMSON], ["a hamza ('alb)", 'ق', 'the tongue must touch', CRIMSON], ['g', 'ق', 'g sits where ك is: go back', CRIMSON], ['a heavy ك', 'ك', 'keep it light, a breath', TEAL]];
  const n = Math.max(items, lines >= 3 ? 4 : lines >= 2 ? 2 : 1);
  return (
    <div className="absolute flex flex-col gap-4" style={{ left: 860, top: 210, width: 600 }}>
      {cards.slice(0, n).map(([bad, good, note, c], i) => (
        <motion.div key={i} className="flex items-center justify-between rounded-[20px]" style={{ padding: '10px 24px', background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
          <span className="relative font-sans font-black" style={{ fontSize: 26, color: soft('light') }}>
            {bad}
            <motion.span className="absolute left-0 right-0 block" style={{ top: '50%', height: 4, background: CRIMSON, transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.4 }} />
          </span>
          <span lang="ar" style={{ ...AR, fontSize: 52, color: c, lineHeight: 1.2 }}>{good}</span>
          <span className="font-sans font-bold" style={{ fontSize: 18, color: INK_TEXT, width: 240, textAlign: 'right' }}>{note}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- athar ---------- */

export function Tm3ReciteGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Strip clip="ikhlas-4">وَلَمْ <span style={glow('#7FD1BE')}>يَكُن</span> لَّهُۥ <span style={glow('#7FD1BE')}>كُفُوًا</span> أَحَدٌۢ</Strip>
      <Closeup cycle />
    </>
  );
}

/* ---------- ahd ---------- */

export function Tm3MissionGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <WordCard x={880} y={230} ar="قَلْب" en="a heart" color={CRIMSON} icon="heart" />
      <WordCard x={1170} y={230} ar="كَلْب" en="a dog" color={TEAL} delay={0.2} />
      <WordCard x={880} y={450} ar="قُلْ" en="say" color={CRIMSON} delay={0.3} />
      <WordCard x={1170} y={450} ar="كُلْ" en="eat" color={TEAL} delay={0.4} />
      {lines >= 2 && <Chip x={1170} y={650} color={GOLD} delay={0.3}>once a day · feel the step</Chip>}
    </>
  );
}

/** Back on the map: the middle of the tongue lights with its three letters. */
export function Tm3NextGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return <MouthMap lit={['lisan']} points={lines >= 2 ? [{ at: 'qaf', ring: false }, { at: 'middle', tag: 'ج ش ي', color: CORAL }] : [{ at: 'qaf', tag: 'ق ك', ring: false }]} />;
}
