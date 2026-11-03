import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip } from './kit';
import { Q, Panel } from './g-tj1';

/**
 * Tajweed · Level 2 · Lesson 2 · The Throat. The throat drawn as a three-floor tower (the lowest floor nearest the
 * chest): a bead of sound rises and stops on a floor; each floor holds twins, the voiced one drawn as a sound wave and
 * the breathed one as breath. ء closes a door, ع and ح squeeze the walls, غ and خ ripple like a gargle.
 */

export type Floor = 'deep' | 'mid' | 'near';
const FLOORS: Floor[] = ['deep', 'mid', 'near'];
const TINT: Record<Floor, string> = { deep: '#8B1A1E', mid: CRIMSON, near: '#E8705F' };
const NAME: Record<Floor, string> = { deep: 'deepest', mid: 'middle', near: 'nearest' };
const PAIR: Record<Floor, [string, string]> = { deep: ['ء', 'ه'], mid: ['ع', 'ح'], near: ['غ', 'خ'] };
// The tower on the stage (canvas px): floors stack from the bottom.
const X = 1000, W = 170, TOP = 226, FH = 170;
const fy = (f: Floor) => TOP + (2 - FLOORS.indexOf(f)) * FH; // top edge of the floor
const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800 };
const CARD = '#FFFDF8';
const SHADOW = '0 14px 28px -20px rgba(60,30,10,0.6)';

type Fx = 'door' | 'breath' | 'squeeze' | 'voice' | 'gargle';

/** Breath: three soft wisps rising. */
function Breath({ x, y, color = TEAL }: { x: number; y: number; color?: string }) {
  const reduce = useReduce();
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="pointer-events-none absolute block rounded-full" style={{ left: x - 30 + i * 30, top: y, width: 14, height: 40, background: `linear-gradient(${color}00, ${color}AA)`, filter: 'blur(3px)' }}
          initial={{ opacity: 0, y: 10 }} animate={reduce ? { opacity: 0.7, y: -10 } : { opacity: [0, 0.8, 0], y: [10, -50] }} transition={{ duration: 1.6, delay: i * 0.3, repeat: reduce ? 0 : Infinity }} />
      ))}
    </>
  );
}

/** Voice: a wave that keeps running across. */
function Voice({ x, y, color = GOLD }: { x: number; y: number; color?: string }) {
  const reduce = useReduce();
  return (
    <svg className="pointer-events-none absolute" style={{ left: x - 60, top: y - 20, overflow: 'hidden' }} width={120} height={40}>
      <motion.path d="M -120 20 q 15 -16 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
        initial={{ x: 0 }} animate={reduce ? { x: 60 } : { x: [0, 60] }} transition={{ duration: 0.8, repeat: reduce ? 0 : Infinity, ease: 'linear' }} />
    </svg>
  );
}

/** The three-floor throat. */
function Tower({ lit = [], pairs = [], bead, fx, names = true, dim = false, captions = true }: { lit?: Floor[]; pairs?: Floor[]; bead?: Floor | 'all'; fx?: { floor: Floor; kind: Fx }; names?: boolean; dim?: boolean; captions?: boolean }) {
  const reduce = useReduce();
  const stops = bead === 'all' ? [fy('deep'), fy('mid'), fy('near')].map((t) => t + FH / 2) : bead ? [fy(bead) + FH / 2] : [];
  const squeeze = fx && (fx.kind === 'squeeze');
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: 0, top: 0 }} initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: dim ? 0.4 : 1, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease }}>
      {/* the mouth above, so the learner knows which way is up */}
      <div className="absolute font-sans font-bold uppercase" style={{ left: X, width: W, top: TOP - 26, textAlign: 'center', fontSize: 13, letterSpacing: '0.16em', color: soft('light') }}>↑ to the mouth</div>
      <div className="absolute font-sans font-bold uppercase" style={{ left: X, width: W, top: TOP + 3 * FH + 8, textAlign: 'center', fontSize: 13, letterSpacing: '0.16em', color: soft('light') }}>the chest ↓</div>
      {FLOORS.map((f) => {
        const on = lit.includes(f);
        const sq = squeeze && fx!.floor === f;
        return (
          <React.Fragment key={f}>
            <motion.div className="absolute" style={{ left: X, top: fy(f), width: W, height: FH - 6, borderRadius: f === 'near' ? '40px 40px 10px 10px' : f === 'deep' ? '10px 10px 40px 40px' : 10, background: TINT[f] }}
              initial={false} animate={{ opacity: on ? 0.95 : 0.16 }} transition={{ duration: 0.6, ease }} />
            {/* the walls of a squeezed floor move in */}
            {sq && [0, 1].map((s) => (
              <motion.div key={s} className="absolute" style={{ top: fy(f) - 2, height: FH - 2, width: 40, borderRadius: s ? '40px 0 0 40px' : '0 40px 40px 0', background: '#F6F1E8', left: s ? X + W - 40 : X }}
                initial={{ x: s ? 40 : -40 }} animate={reduce ? { x: s ? -24 : 24 } : { x: s ? [40, -30, -24] : [-40, 30, 24] }} transition={{ duration: 0.9, ease }} />
            ))}
            {fx?.floor === f && fx.kind === 'door' && (
              <motion.div className="absolute" style={{ left: X + 14, top: fy(f) + FH / 2 - 6, width: W - 28, height: 12, borderRadius: 6, background: GOLD, transformOrigin: 'left' }}
                initial={{ scaleX: 0 }} animate={reduce ? { scaleX: 1 } : { scaleX: [0, 1, 1, 0] }} transition={{ duration: 2.2, times: [0, 0.25, 0.7, 1], repeat: reduce ? 0 : Infinity, repeatDelay: 0.4 }} />
            )}
            {fx?.floor === f && fx.kind === 'gargle' && [0, 1, 2].map((i) => (
              <motion.span key={i} className="absolute block rounded-full" style={{ left: X + W / 2 - 18, top: fy(f) + FH / 2 - 18, width: 36, height: 36, border: `3px solid ${CARD}` }}
                initial={{ scale: 0.4, opacity: 0.9 }} animate={reduce ? { scale: 1.6, opacity: 0.5 } : { scale: [0.4, 2.4], opacity: [0.9, 0] }} transition={{ duration: 1.2, delay: i * 0.35, repeat: reduce ? 0 : Infinity }} />
            ))}
            {names && (
              <motion.span className="absolute whitespace-nowrap font-sans font-bold" style={{ left: X - 150, width: 130, top: fy(f) + FH / 2 - 14, textAlign: 'right', fontSize: 20, color: on ? TINT[f] : soft('light') }}
                initial={false} animate={{ opacity: 1 }}>{NAME[f]}</motion.span>
            )}
            {pairs.includes(f) && PAIR[f].map((l, k) => (
              <motion.span key={l} lang="ar" className="absolute flex flex-col items-center justify-center rounded-[18px]" style={{ left: X + W + 40 + k * 120, top: fy(f) + FH / 2 - 52, width: 100, height: 104, background: CARD, boxShadow: SHADOW, ...AR, fontSize: 52, color: TINT[f] }}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 + k * 0.12, ease }}>
                {l}
                {captions && <span className="font-sans" style={{ fontSize: 13, fontWeight: 700, color: k ? TEAL : GOLD, lineHeight: 1 }}>{k ? 'breath' : 'voice'}</span>}
              </motion.span>
            ))}
          </React.Fragment>
        );
      })}
      {stops.length > 0 && (
        <motion.span className="absolute block rounded-full" style={{ left: X + W / 2 - 13, top: 0, width: 26, height: 26, background: GOLD, border: `3px solid ${CARD}`, boxShadow: `0 0 16px ${GOLD}` }}
          initial={{ y: TOP + 3 * FH + 20, opacity: 0 }}
          animate={reduce ? { y: stops[stops.length - 1] - 13, opacity: 1 } : { y: [TOP + 3 * FH + 20, ...stops.map((s) => s - 13)], opacity: [0, ...stops.map(() => 1)] }}
          transition={{ duration: 0.9 * (stops.length + 1), repeat: reduce ? 0 : Infinity, repeatDelay: 1, ease: 'easeInOut' }} />
      )}
    </motion.div>
  );
}

/** The voiced or breathed mark beside a letter card (k = 0 voiced, 1 breathed). */
function Mark({ floor, k }: { floor: Floor; k: 0 | 1 }) {
  const x = X + W + 90 + k * 120, y = fy(floor) + FH / 2 + 70;
  return k ? <Breath x={x} y={y - 26} /> : <Voice x={x} y={y} />;
}

/** An ayah on a Mushaf strip above the tower; `on` words glow. */
function Strip({ children, clip, size = 32 }: { children: React.ReactNode; clip?: string; size?: number }) {
  return (
    <Panel x={830} y={108} w={530} h={80}>
      <Q size={size} color="#F6E3B8" clip={clip}>{children}</Q>
    </Panel>
  );
}
const glow = (c: string) => ({ color: c, textShadow: `0 0 14px ${c}` });

/* ---------- spark ---------- */

/** The floors light from the bottom up as the bead of sound climbs. */
export function Tm2CoverGraphic(_: GraphicProps) {
  const reduce = useReduce();
  const [k, setK] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setK((v) => (v + 1) % 4), 1100);
    return () => clearInterval(t);
  }, [reduce]);
  return <Tower lit={reduce ? FLOORS : FLOORS.slice(0, k)} pairs={FLOORS} names={false} />;
}

/** Six letters in a row; four get the English sound they are mistaken for; then each pair takes its floor. */
export function Tm2RecallGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  if (lines >= 3) return <Tower lit={FLOORS} pairs={FLOORS} captions={false} />;
  const six: [string, string?][] = [['ء'], ['ه'], ['ع', 'a catch?'], ['ح', 'h?'], ['غ', 'r?'], ['خ', 'k?']];
  return (
    <div className="absolute flex gap-3" dir="rtl" style={{ left: 860, top: 380 }}>
      {six.map(([l, e], i) => (
        <motion.span key={l} className="relative flex flex-col items-center justify-center rounded-[18px]" style={{ width: 96, height: 120, background: CARD, boxShadow: SHADOW }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, type: 'spring', bounce: 0.35 }}>
          <span lang="ar" style={{ ...AR, fontSize: 56, color: CRIMSON, lineHeight: 1.1 }}>{l}</span>
          {lines >= 2 && e && (
            <motion.span dir="ltr" className="absolute font-sans font-black" style={{ bottom: -44, fontSize: 22, color: soft('light') }} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
              {e}
              <motion.span className="absolute left-0 right-0 block" style={{ top: '50%', height: 3, background: CRIMSON, transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }} />
            </motion.span>
          )}
        </motion.span>
      ))}
    </div>
  );
}

/* ---------- zad ---------- */

/** The tower: floors switch on one by one, then the bead of sound climbs them. */
export function Tm2FloorsGraphic({ lines, items }: GraphicProps) {
  if (lines === 0 && items === 0) return null;
  const on = FLOORS.slice(0, Math.max(items, lines >= 3 ? 3 : 0));
  const ar: Record<Floor, string> = { deep: 'أَقْصَى الْحَلْق', mid: 'وَسَطُ الْحَلْق', near: 'أَدْنَى الْحَلْق' };
  return (
    <>
      <Tower lit={on} pairs={lines >= 3 ? FLOORS : []} bead={lines >= 2 ? 'all' : undefined} captions={false} />
      {FLOORS.slice(0, items).map((f) => (
        <motion.span key={f} lang="ar" dir="rtl" className="pointer-events-none absolute whitespace-nowrap" style={{ left: X - 230, width: 210, top: fy(f) + FH / 2 + 12, textAlign: 'right', ...AR, fontSize: 22, color: TINT[f] }}
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease }}>{ar[f]}</motion.span>
      ))}
    </>
  );
}

/** The deepest floor: ء closes a door, ه lets breath through; then Al-Ikhlas. */
export function Tm2DeepGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {lines >= 3 && <Strip clip="ikhlas-1">قُلْ <span style={glow('#FF9C8C')}>هُوَ</span> <span style={glow('#FF9C8C')}>ٱللَّهُ</span> <span style={glow(GOLD)}>أَحَدٌ</span></Strip>}
      <Tower lit={['deep']} pairs={['deep']} bead="deep" fx={{ floor: 'deep', kind: lines === 2 ? 'breath' : 'door' }} />
      {lines >= 1 && <Mark floor="deep" k={0} />}
      {lines >= 2 && <Breath x={X + W / 2} y={fy('deep') + 40} color="#FFFDF8" />}
      {lines >= 2 && <Mark floor="deep" k={1} />}
      {lines === 1 && <Chip x={1090} y={772} color={GOLD} delay={0.4}>ء: the door closes, then opens</Chip>}
      {lines >= 2 && <Chip x={1090} y={772} color={TEAL} delay={0.4}>ه: the door stays open</Chip>}
    </>
  );
}

/** The middle floor: the walls squeeze in; ع with the voice on, ح with breath only; then Al-Fatiha. */
export function Tm2MidGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {lines >= 3 && <Strip clip="fatiha-2"><span style={glow('#FF9C8C')}>ٱلْحَمْدُ</span> لِلَّهِ رَبِّ <span style={glow(GOLD)}>ٱلْعَـٰلَمِينَ</span></Strip>}
      <Tower lit={['mid']} pairs={['mid']} fx={{ floor: 'mid', kind: 'squeeze' }} />
      <Mark floor="mid" k={0} />
      {lines >= 2 && <Mark floor="mid" k={1} />}
      <Chip x={1090} y={772} color={CRIMSON} delay={0.4}>{lines >= 2 ? 'same squeeze: voice in ع, breath in ح' : 'ع: squeeze, voice on'}</Chip>
    </>
  );
}

/** The nearest floor: a gargle ripple; غ voiced, خ breathed; then Al-Falaq. */
export function Tm2NearGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {lines >= 3 && <Strip clip="falaq-2" size={26}>مِن شَرِّ مَا <span style={glow(TEAL)}>خَلَقَ</span> ۝ وَمِن شَرِّ <span style={glow(GOLD)}>غَاسِقٍ</span> إِذَا وَقَبَ</Strip>}
      <Tower lit={['near']} pairs={['near']} bead="near" fx={{ floor: 'near', kind: 'gargle' }} />
      <Mark floor="near" k={0} />
      {lines >= 2 && <Mark floor="near" k={1} />}
      <Chip x={1090} y={772} color="#E8705F" delay={0.4}>{lines >= 2 ? 'خ: the same gargle, breath only' : 'غ: a gentle gargle, voice on'}</Chip>
    </>
  );
}

/** Three floors of twins: the voiced column glows gold with waves, the breathed column teal with breath. */
export function Tm2PatternGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Tower lit={FLOORS} pairs={FLOORS} />
      {lines >= 2 && FLOORS.map((f) => <React.Fragment key={f}><Mark floor={f} k={0} /><Mark floor={f} k={1} /></React.Fragment>)}
      {lines >= 2 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-[24px]" style={{ left: X + W + 30, top: TOP - 8, width: 120, height: 3 * FH + 4, border: `3px solid ${GOLD}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
          <motion.div className="pointer-events-none absolute rounded-[24px]" style={{ left: X + W + 150, top: TOP - 8, width: 120, height: 3 * FH + 4, border: `3px solid ${TEAL}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
        </>
      )}
      {lines >= 3 && <Chip x={1090} y={772} color={INK_TEXT} delay={0.3}>hand on the throat: buzz = voice</Chip>}
    </>
  );
}

/** نَعْبُدُ: the ع on the middle floor; said as a hamza, the word drops to the wrong floor and breaks. */
export function Tm2MeaningGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const wrong = lines === 2;
  return (
    <>
      <Tower lit={wrong ? ['deep'] : ['mid']} pairs={[]} bead={wrong ? 'deep' : 'mid'} fx={wrong ? undefined : { floor: 'mid', kind: 'squeeze' }} names />
      <motion.span lang="ar" className="absolute flex items-center justify-center rounded-[20px]" style={{ left: X + W + 40, top: 420, width: 250, height: 110, background: CARD, boxShadow: wrong ? `0 0 0 3px ${CRIMSON}, ${SHADOW}` : `0 0 0 3px ${GOLD}, ${SHADOW}` }}
        key={wrong ? 'w' : 'r'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <span dir="rtl" style={{ ...AR, fontSize: 54, lineHeight: 1.3, color: wrong ? soft('light') : INK_TEXT, textDecoration: wrong ? `line-through ${CRIMSON}` : undefined }}>{wrong ? 'نَأْبُدُ' : 'نَعْبُدُ'}</span>
      </motion.span>
      <Chip x={X + W + 165} y={540} color={wrong ? CRIMSON : GOLD} delay={0.3}>{wrong ? 'not the word that was revealed' : 'ع from the middle floor'}</Chip>
    </>
  );
}

/** Four slip cards: the wrong sound struck through, the right letter with its floor. */
export function Tm2SlipsGraphic({ lines, items }: GraphicProps) {
  if (lines === 0 && items === 0) return null;
  const cards: [string, string, string, Floor][] = [['h', 'ح', 'middle floor · squeeze', 'mid'], ['a catch', 'ع', 'middle floor · squeeze + voice', 'mid'], ['k', 'خ', 'nearest floor · breath', 'near'], ['r or g', 'غ', 'nearest floor · voice', 'near']];
  return (
    <div className="absolute flex flex-col gap-4" style={{ left: 860, top: 210, width: 600 }}>
      {cards.slice(0, Math.max(items, lines >= 3 ? 4 : lines >= 2 ? 2 : 0)).map(([bad, good, note, f], i) => (
        <motion.div key={good} className="flex items-center justify-between rounded-[20px]" style={{ padding: '10px 24px', background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: i % 2 ? 0.15 : 0, ease }}>
          <span className="relative font-sans font-black" style={{ fontSize: 28, color: soft('light') }}>
            {bad}
            <motion.span className="absolute left-0 right-0 block" style={{ top: '50%', height: 4, background: CRIMSON, transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.4 }} />
          </span>
          <span lang="ar" style={{ ...AR, fontSize: 52, color: TINT[f], lineHeight: 1.2 }}>{good}</span>
          <span className="font-sans font-bold" style={{ fontSize: 18, color: INK_TEXT, width: 250, textAlign: 'right' }}>{note}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- athar ---------- */

/** The tower with its six letters, captions hidden: the learner feels for the voice. */
export function Tm2VoiceGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return <Tower lit={FLOORS} pairs={FLOORS} captions={false} />;
}

/** Al-Falaq above the tower; the bead climbs all three floors. */
export function Tm2ReciteGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Strip clip="falaq-5">وَمِن شَرِّ <span style={glow('#FF9C8C')}>حَاسِدٍ</span> إِذَا <span style={glow('#FF9C8C')}>حَسَدَ</span></Strip>
      <Tower lit={FLOORS} pairs={FLOORS} bead="all" />
    </>
  );
}

/* ---------- ahd ---------- */

export function Tm2MissionGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Tower lit={lines >= 2 ? FLOORS : ['mid']} pairs={lines >= 2 ? FLOORS : ['mid']} bead={lines >= 2 ? 'all' : 'mid'} />
      {lines >= 1 && <Chip x={1090} y={772} color={CRIMSON} delay={0.4}>{lines >= 2 ? 'once a day, bottom floor up' : 'every salah: the ع of نَعْبُدُ'}</Chip>}
    </>
  );
}

/** The tower steps back; above it, the back of the tongue waits with ق and ك. */
export function Tm2NextGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Tower lit={FLOORS} pairs={[]} dim />
      {lines >= 1 && ['ق', 'ك'].map((l, i) => (
        <motion.span key={l} lang="ar" className="absolute flex items-center justify-center rounded-[18px]" style={{ left: X + W + 60 + i * 120, top: 230, width: 100, height: 100, background: CARD, boxShadow: `0 0 0 3px #E8705F, ${SHADOW}`, ...AR, fontSize: 52, color: '#E8705F' }}
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.2, type: 'spring', bounce: 0.4 }}>{l}</motion.span>
      ))}
      {lines >= 2 && <Chip x={1090} y={772} color="#E8705F" delay={0.3}>next: the deepest part of the tongue</Chip>}
    </>
  );
}
