import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip } from './kit';
import { Q, Panel, MUSHAF } from './g-tj1';

/**
 * Tajweed · Level 2 · Lesson 1 · The Map of the Mouth. One side view of the mouth and throat runs through the level
 * (MAP-level-2.md): an area lights when the page names it, a letter's point glows where it is born, and a bead of air
 * travels up from the throat and stops where the letter is made. Anatomy only, never a person: no eyes, no face.
 */

export type Area = 'jawf' | 'halq' | 'lisan' | 'shafatan' | 'khayshum';
export const AREAS: Area[] = ['jawf', 'halq', 'lisan', 'shafatan', 'khayshum'];
const CORAL = '#E8705F';
const COLOR: Record<Area, string> = { jawf: GOLD, halq: CRIMSON, lisan: CORAL, shafatan: TEAL, khayshum: MUSHAF };
const NAME: Record<Area, string> = { jawf: 'empty space · al-jawf', halq: 'throat · al-halq', lisan: 'tongue · al-lisan', shafatan: 'lips · ash-shafatan', khayshum: 'nose · al-khayshum' };

// The map's box on the stage (canvas px) and its scale from the drawing's 740 × 620 units.
const OX = 790, OY = 225, S = 0.9;
const at = (x: number, y: number) => ({ left: OX + x * S, top: OY + y * S });

/** Where each letter group is born, in drawing units. */
export const P = {
  deep: [242, 565], mid: [242, 485], near: [246, 405], qaf: [268, 332], kaf: [292, 318], middle: [360, 310],
  side: [392, 326], lam: [432, 318], tip: [458, 310], fa: [488, 334], lips: [500, 356], nose: [400, 258], jawf: [360, 345],
} as const;
type Pt = keyof typeof P;

const SHAPE: Record<Area, string> = {
  khayshum: 'M 472 246 C 430 232 330 232 272 262 C 304 282 420 286 476 276 Z',
  jawf: 'M 290 306 C 340 298 430 300 474 310 L 474 346 C 440 336 370 328 320 334 C 282 342 264 380 264 430 L 264 600 L 238 600 L 238 360 C 242 322 262 308 290 306 Z',
  halq: 'M 220 332 L 220 600 L 266 600 L 266 470 C 266 430 256 380 252 340 Z',
  lisan: 'M 470 354 C 450 332 380 320 320 328 C 276 336 254 372 260 430 C 264 460 270 480 272 500 L 302 500 C 302 460 332 420 402 394 C 442 378 470 374 476 364 Z',
  shafatan: 'M 486 322 C 512 326 514 344 500 350 C 514 358 514 384 486 388 C 494 368 494 342 486 322 Z',
};
// Where an area's label line starts, and the row its label sits on (drawing units).
const LABEL: Record<Area, [number, number, number]> = {
  khayshum: [420, 258, 205], jawf: [372, 312, 285], shafatan: [506, 356, 365], lisan: [400, 380, 445], halq: [246, 540, 560],
};
// The bead of air: from the bottom of the throat, up and out through the lips.
// Where a point's tag sits: throat tags left of the throat; mouth tags in a row inside the head, with a thin line down.
const TAG: Record<Pt, [number, number]> = {
  deep: [92, 539], mid: [92, 459], near: [96, 379], qaf: [150, 140], kaf: [265, 140], middle: [265, 140], side: [380, 140],
  lam: [380, 140], tip: [495, 140], fa: [530, 292], lips: [524, 398], nose: [380, 150], jawf: [265, 140],
};
const AIR: [number, number][] = [[242, 590], [242, 470], [248, 380], [270, 336], [330, 330], [420, 334], [492, 352], [580, 354]];

const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800 };

/** The mouth and throat in profile, facing right. */
export function MouthMap({ lit = [], labels = [], points = [], air, hum = false, dim = false, delay = 0 }: {
  lit?: Area[]; labels?: Area[]; points?: { at: Pt; tag?: string; color?: string; ring?: boolean }[];
  /** Index of AIR where the bead stops (7 = out of the lips, free flow). */
  air?: number; hum?: boolean; dim?: boolean; delay?: number;
}) {
  const reduce = useReduce();
  const route = air === undefined ? [] : AIR.slice(0, air + 1);
  return (
    <>
      <motion.svg className="pointer-events-none absolute" width={740 * S} height={620 * S} viewBox="0 0 740 620" style={{ left: OX, top: OY, overflow: 'visible' }}
        initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: dim ? 0.45 : 1, filter: 'blur(0px)' }} transition={{ duration: 0.9, delay, ease }}>
        {/* the head and neck: a soft paper silhouette, then one calm line */}
        <path d="M 150 40 C 260 0 400 10 450 90 C 470 130 470 170 465 200 L 520 262 C 528 272 520 282 505 284 L 482 292 C 490 305 500 318 500 326 L 500 388 C 486 396 480 404 482 420 C 484 445 460 462 420 462 C 380 462 340 470 325 500 L 320 610 L 200 610 C 200 520 190 450 170 420 C 120 380 75 330 60 260 C 40 170 70 70 150 40 Z"
          fill="#FFFDF8" fillOpacity={0.75} style={{ filter: 'drop-shadow(0 24px 30px rgba(60,30,10,0.18))' }} />
        <path d="M 150 40 C 260 0 400 10 450 90 C 470 130 470 170 465 200 L 520 262 C 528 272 520 282 505 284 L 482 292 C 490 305 500 318 500 326 M 500 388 C 486 396 480 404 482 420 C 484 445 460 462 420 462 C 380 462 340 470 325 500 L 320 610"
          fill="none" stroke={INK_TEXT} strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" />
        <path d="M 150 40 C 70 70 40 170 60 260 C 75 330 120 380 170 420 C 190 450 200 520 200 610" fill="none" stroke={INK_TEXT} strokeOpacity={0.3} strokeWidth={4} strokeLinecap="round" />
        {/* roof of the mouth: hard palate, then the soft palate curving down; the teeth */}
        <path d="M 478 306 C 430 296 340 292 290 300 C 262 306 248 324 246 352" fill="none" stroke={INK_TEXT} strokeOpacity={0.45} strokeWidth={3} />
        <rect x={474} y={300} width={10} height={22} rx={3} fill="#FFFDF8" stroke={INK_TEXT} strokeOpacity={0.4} />
        <rect x={472} y={366} width={10} height={18} rx={3} fill="#FFFDF8" stroke={INK_TEXT} strokeOpacity={0.4} />
        {AREAS.map((a) => {
          const on = lit.includes(a);
          return (
            <motion.path key={a} d={SHAPE[a]} fill={COLOR[a]} stroke={COLOR[a]} strokeWidth={2}
              strokeDasharray={a === 'jawf' || a === 'khayshum' ? '6 6' : undefined}
              initial={false} animate={{ fillOpacity: on ? (a === 'jawf' ? 0.32 : 0.5) : 0.07, strokeOpacity: on ? 0.95 : 0.25 }} transition={{ duration: 0.6, ease }} />
          );
        })}
        {labels.map((a, i) => {
          const [x, y, row] = LABEL[a];
          return <motion.path key={a} d={`M ${x} ${y} L 600 ${row}`} stroke={COLOR[a]} strokeWidth={2} fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }} />;
        })}
        {hum && [0, 1, 2].map((i) => (
          <motion.path key={i} d={`M ${500 + i * 18} ${238 - i * 4} q 10 18 0 36`} fill="none" stroke={MUSHAF} strokeWidth={3} strokeLinecap="round"
            initial={{ opacity: 0 }} animate={reduce ? { opacity: 0.8 } : { opacity: [0, 0.9, 0] }} transition={{ duration: 1.4, delay: i * 0.25, repeat: reduce ? 0 : Infinity }} />
        ))}
        {points.map((p, i) => {
          const [x, y] = P[p.at];
          const c = p.color ?? CRIMSON;
          return (
            <g key={`${p.at}-${i}`}>
              {p.ring !== false && !reduce && (
                <motion.circle cx={x} cy={y} r={16} fill="none" stroke={c} strokeWidth={3} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  initial={{ opacity: 0.9, scale: 0.6 }} animate={{ opacity: 0, scale: 2 }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 + i * 0.15 }} />
              )}
              <motion.circle cx={x} cy={y} r={9} fill={c} stroke="#FFFDF8" strokeWidth={3} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.45, delay: 0.2 + i * 0.15 }} />
            </g>
          );
        })}
        {points.filter((p) => p.tag && TAG[p.at][1] < 200).map((p, i) => {
          const [tx, ty] = TAG[p.at];
          const [x, y] = P[p.at];
          return <motion.path key={`l-${p.at}-${i}`} d={`M ${tx + 55} ${ty + 52} L ${x} ${y - 10}`} stroke={p.color ?? CRIMSON} strokeWidth={2} strokeDasharray="4 5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }} />;
        })}
        {route.length > 1 && (
          <motion.circle cx={0} cy={0} r={12} fill={GOLD} stroke="#FFFDF8" strokeWidth={3} style={{ filter: `drop-shadow(0 0 8px ${GOLD})` }}
            initial={{ x: route[0][0], y: route[0][1], opacity: 0 }}
            animate={reduce ? { x: route[route.length - 1][0], y: route[route.length - 1][1], opacity: 1 } : { x: route.map((r) => r[0]), y: route.map((r) => r[1]), opacity: [0, ...route.slice(1).map(() => 1)] }}
            transition={{ duration: 0.35 * route.length, repeat: reduce ? 0 : Infinity, repeatDelay: 0.8, ease: 'easeInOut' }} />
        )}
      </motion.svg>
      {labels.map((a, i) => (
        <motion.span key={a} className="pointer-events-none absolute whitespace-nowrap rounded-full font-sans font-bold" style={{ ...at(604, LABEL[a][2] - 17), padding: '6px 14px', fontSize: 17, background: COLOR[a], color: '#fff' }}
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease }}>
          {NAME[a]}
        </motion.span>
      ))}
      {points.filter((p) => p.tag).map((p, i) => {
        const [x, y] = TAG[p.at];
        return (
          <motion.span key={`t-${p.at}-${i}`} lang="ar" dir="rtl" className="pointer-events-none absolute flex items-center justify-center rounded-[12px]" style={{ ...at(x, y), width: 110 * S, height: 46, ...AR, fontSize: 28, color: p.color ?? CRIMSON, background: '#FFFDF8', boxShadow: '0 10px 22px -14px rgba(40,10,5,0.6)' }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 + i * 0.15, ease }}>
            {p.tag}
          </motion.span>
        );
      })}
    </>
  );
}

/** An ayah on a short Mushaf strip above the map. */
function Strip({ children, clip }: { children: React.ReactNode; clip?: string }) {
  return (
    <Panel x={830} y={132} w={520} h={86}>
      <Q size={34} color="#F6E3B8" clip={clip}>{children}</Q>
    </Panel>
  );
}

const glow = (c: string) => ({ color: c, textShadow: `0 0 14px ${c}` });

/* ---------- spark ---------- */

/** The five areas light in turn, the way the level will visit them. */
export function Tm1CoverGraphic(_: GraphicProps) {
  const reduce = useReduce();
  const [k, setK] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setK((v) => (v + 1) % AREAS.length), 1400);
    return () => clearInterval(t);
  }, [reduce]);
  return <MouthMap lit={reduce ? AREAS : [AREAS[k]]} labels={[AREAS[k]]} air={7} />;
}

/** Three pairs an English ear hears as one: each pair's two points light apart on the map. */
export function Tm1PairsGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null; // the hero title fills the stage on the first step
  const pts: { at: Pt; tag?: string; color?: string; ring?: boolean }[] = [];
  if (lines >= 1) pts.push({ at: 'deep', tag: lines === 1 ? 'ه' : lines === 2 ? 'ء' : undefined, ring: lines <= 2 }, { at: 'mid', tag: lines === 1 ? 'ح' : lines === 2 ? 'ع' : undefined, ring: lines <= 2 });
  if (lines >= 3) pts.push({ at: 'kaf', tag: 'ك', color: CORAL, ring: lines === 3 }, { at: 'qaf', tag: 'ق', color: CORAL, ring: lines === 3 });
  return (
    <>
      <MouthMap lit={lines >= 4 ? AREAS : lines >= 3 ? ['halq', 'lisan'] : lines >= 1 ? ['halq'] : []} labels={lines >= 4 ? AREAS : []} points={lines >= 4 ? [] : pts} />
      {lines >= 1 && lines <= 2 && <Chip x={1060} y={760} color={CRIMSON} delay={0.4}>two depths of the throat</Chip>}
      {lines === 3 && <Chip x={1060} y={760} color={CORAL} delay={0.4}>ق sits behind ك</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

/** The tongue hurries, then is still: listen first, then follow. */
export function Tm1ListenGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  if (lines === 0) return null; // the hero title fills the stage on the first step
  const hurry = lines === 1;
  return (
    <>
      <motion.div className="absolute" style={{ left: 0, top: 0 }} animate={hurry && !reduce ? { x: [0, -2, 2, -1, 0] } : { x: 0 }} transition={{ duration: 0.4, repeat: hurry && !reduce ? Infinity : 0 }}>
        <MouthMap lit={lines >= 1 ? ['lisan'] : []} air={lines >= 3 ? 7 : undefined} />
      </motion.div>
      {lines >= 1 && <Chip x={1100} y={196} color={hurry ? CRIMSON : soft('light')} delay={0.2}>{hurry ? 'the tongue rushing' : 'the tongue waits'}</Chip>}
      {lines >= 2 && <Chip x={1000} y={770} color={GOLD} delay={0.3}>1 · listen</Chip>}
      {lines >= 3 && <Chip x={1210} y={770} color={TEAL} delay={0.4}>2 · recite as you heard</Chip>}
    </>
  );
}

/** The bead of air flows out freely, then stops where each still letter is made. */
export function Tm1FindGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null; // the hero title fills the stage on the first step
  return (
    <>
      <MouthMap lit={lines >= 3 ? ['lisan', 'shafatan'] : []} air={lines === 1 ? 7 : lines === 2 ? 6 : undefined}
        points={lines >= 3 ? [{ at: 'lips', tag: 'أَبْ', color: TEAL }, { at: 'qaf', tag: 'أَقْ', color: CORAL }, { at: 'lam', tag: 'أَلْ', color: CORAL }] : lines === 2 ? [{ at: 'lips', tag: 'أَبْ', color: TEAL }] : []} />
      {lines === 1 && <Chip x={1060} y={770} color={GOLD} delay={0.3}>a vowel: the breath runs out freely</Chip>}
      {lines === 2 && <Chip x={1060} y={770} color={TEAL} delay={0.6}>still ب: the sound stops at the lips</Chip>}
      {lines >= 3 && <Chip x={1060} y={770} color={CRIMSON} delay={0.6}>where it stops = its makhraj</Chip>}
    </>
  );
}

/** The five areas switch on one by one with their names. */
export function Tm1FiveGraphic({ lines, items }: GraphicProps) {
  if (lines === 0 && items === 0) return null;
  const on = AREAS.slice(0, items);
  return <MouthMap lit={on} labels={on} />;
}

/** The empty space glows and the breath flows through it untouched. */
export function Tm1JawfGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null; // the hero title fills the stage on the first step
  return (
    <>
      {lines >= 3 && <Strip clip="kawthar-1"><span style={glow(GOLD)}>إِنَّآ</span> أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ</Strip>}
      <MouthMap lit={lines >= 1 ? ['jawf'] : []} labels={lines >= 1 ? ['jawf'] : []} air={lines >= 1 ? 7 : undefined}
        points={lines >= 2 ? [{ at: 'jawf', tag: 'ا و ي', color: GOLD, ring: false }] : []} />
      {lines >= 1 && <Chip x={1060} y={770} color={GOLD} delay={0.4}>nothing touches: the breath runs until it ends</Chip>}
    </>
  );
}

/** The throat, floor by floor. */
export function Tm1HalqGraphic({ lines, items }: GraphicProps) {
  if (lines === 0) return null; // the hero title fills the stage on the first step
  const floors: [Pt, string][] = [['deep', 'ء ه'], ['mid', 'ع ح'], ['near', 'غ خ']];
  const n = Math.max(items, lines >= 2 ? 3 : 0);
  return (
    <>
      <MouthMap lit={lines >= 1 ? ['halq'] : []} labels={lines >= 1 ? ['halq'] : []} points={floors.slice(0, n).map(([a, t]) => ({ at: a, tag: t, ring: false }))} />
      {lines >= 3 && <Chip x={1060} y={770} color={CRIMSON} delay={0.3}>four of these six are new to English</Chip>}
    </>
  );
}

/** The tongue, back to tip: each group lights where it touches the roof. */
export function Tm1LisanGraphic({ lines, items }: GraphicProps) {
  if (lines === 0) return null; // the hero title fills the stage on the first step
  const groups: [Pt, string][] = [['qaf', 'ق ك'], ['middle', 'ج ش ي'], ['side', 'ض ل'], ['tip', 'ن ر ت…']];
  const n = Math.max(items, lines >= 3 ? 4 : 0);
  return (
    <>
      <MouthMap lit={lines >= 1 ? ['lisan'] : []} labels={lines >= 1 ? ['lisan'] : []} points={groups.slice(0, n).map(([a, t]) => ({ at: a, tag: t, color: CORAL, ring: false }))} />
      {lines >= 1 && <Chip x={1060} y={770} color={CORAL} delay={0.3}>18 letters: more than all the others together</Chip>}
    </>
  );
}

/** The lips close; then the nose hums, the one area that makes no letter. */
export function Tm1LipsNoseGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null; // the hero title fills the stage on the first step
  const lit: Area[] = [...(lines >= 1 ? ['shafatan' as Area] : []), ...(lines >= 2 ? ['khayshum' as Area] : [])];
  return (
    <>
      {lines >= 3 && <Strip clip="kawthar-1"><span style={glow('#7FD1BE')}>إِنَّآ</span> أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ</Strip>}
      <MouthMap lit={lit} labels={lit} hum={lines >= 2} points={lines >= 1 ? [{ at: 'fa', tag: 'ف', color: TEAL, ring: false }, { at: 'lips', tag: 'ب م و', color: TEAL, ring: false }] : []} />
      {lines >= 3 && <Chip x={1060} y={770} color={MUSHAF} delay={0.3}>pinch the nose: the hum of نّ stops</Chip>}
    </>
  );
}

/** The first ayah of Al-Fatiha tours the map: each letter's point lights in the order it is recited. */
export function Tm1FatihaGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null; // the hero title fills the stage on the first step
  // ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ, letter by letter (the opening hamza, then ل ح م د ل ل ه ر ب ع ـٰ ل م ي ن).
  const tour: [Pt, string][] = [['deep', CRIMSON], ['lam', CORAL], ['mid', CRIMSON], ['lips', TEAL], ['tip', CORAL], ['lam', CORAL], ['deep', CRIMSON], ['tip', CORAL],
    ['lips', TEAL], ['mid', CRIMSON], ['jawf', GOLD], ['lam', CORAL], ['lips', TEAL], ['jawf', GOLD], ['tip', CORAL]];
  const shown = lines >= 3 ? tour : tour.filter(([, c]) => c !== GOLD);
  const lit: Area[] = lines >= 3 ? ['halq', 'lisan', 'shafatan', 'jawf'] : lines >= 2 ? ['halq', 'lisan', 'shafatan'] : [];
  return (
    <>
      {lines >= 1 && <Strip clip="fatiha-2">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ</Strip>}
      <MouthMap lit={lit} labels={lines >= 3 ? lit : []} points={lines >= 2 ? shown.map(([a, c]) => ({ at: a, color: c, ring: false })) : []} />
      {lines >= 3 && <Chip x={1060} y={770} color={GOLD} delay={0.5}>4 of the 5 areas, in 4 words</Chip>}
      {lines >= 4 && <Chip x={1060} y={720} color={CRIMSON} delay={0.3}>17 times a day, at least</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

/** The ayah above an unlit map: the learner names the areas (the answer is on the reveal, not on the map). */
export function Tm1ReciteGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null; // the hero title fills the stage on the first step
  return (
    <>
      {lines >= 1 && <Strip clip="fatiha-2">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ</Strip>}
      <MouthMap air={7} />
    </>
  );
}

/* ---------- ahd ---------- */

/** The three pairs of the week, each pair's two points on the map. */
export function Tm1MissionGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null; // the hero title fills the stage on the first step
  return (
    <>
      <MouthMap lit={['halq', 'lisan']} points={lines >= 1 ? [{ at: 'deep', tag: 'ه ء', ring: false }, { at: 'mid', tag: 'ح ع', ring: false }, { at: 'kaf', tag: 'ك', color: CORAL, ring: false }, { at: 'qaf', tag: 'ق', color: CORAL, ring: false }] : []} />
      {lines >= 1 && <Chip x={1060} y={770} color={CRIMSON} delay={0.4}>one pair · ten times a day</Chip>}
    </>
  );
}

/** The throat alone, its three floors waiting. */
export function Tm1NextGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null; // the hero title fills the stage on the first step
  return (
    <>
      <MouthMap lit={['halq']} labels={['halq']} dim={false} points={lines >= 1 ? [{ at: 'deep' }, { at: 'mid' }, { at: 'near' }] : []} />
      {lines >= 2 && <Chip x={1060} y={770} color={CRIMSON} delay={0.3}>next: three floors, six letters</Chip>}
    </>
  );
}
