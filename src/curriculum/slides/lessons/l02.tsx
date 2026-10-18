import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from '../Art';
import { Pen, Tag, Print, Layer, at, src, out, type Px, type Built } from '../Scenes';
import { BrickCastle, Burst, Sandstorm, ShootingStar, Ripples, Sprite, Lens, BRICK_COLORS, CASTLE_BRICKS } from '../Motion';
import { play, useCue } from '../sfx';

/* ---------- Lesson 2: Who Made It All? (brief: docs/curriculum/zad-essentials-kids/L02-who-made-it-all.md) ----------
   Paintings in public/curriculum/zad-kids/l02 (owner, ChatGPT). The castle on pages 4, 6 and 8 is drawn in code
   (Motion.tsx), so no painting repeats (RULES.md §1.10). */

const L2: Px = { w: 1448, h: 1086 };
const WAYS = ['It popped out of nothing', 'The bricks built themselves', 'Someone built it'];

/** A toy room: a warm wall, a wooden floor and a kilim rug, drawn in CSS so the castle pages need no painting. */
function Room({ children, className = 'absolute inset-0', label }: { children?: React.ReactNode; className?: string; label?: string }) {
  return (
    <div className={`${className} overflow-hidden rounded-[28px] shadow-[0_30px_60px_-34px_rgba(139,73,53,0.6)]`} role={label ? 'img' : undefined} aria-label={label}
      style={{ background: 'linear-gradient(180deg, #F6E5CC 0%, #F1D9B8 52%, #C98D57 52%, #A86B3C 100%)' }}>
      <div className="absolute inset-x-0 top-[52%] h-[3%]" style={{ background: 'rgba(80,40,20,0.25)' }} />
      <div className="absolute left-[8%] right-[8%] top-[70%] h-[24%] rounded-[50%]"
        style={{ background: `repeating-linear-gradient(90deg, ${P.crimson} 0 18px, ${P.gold} 18px 26px, ${P.teal} 26px 44px, #F3E6CC 44px 50px)`, opacity: 0.55, filter: 'blur(0.4px)' }} />
      {children}
    </div>
  );
}

/** Loose bricks lying on the floor; `wobble` makes them shiver without going anywhere. */
const PILE = Array.from({ length: 11 }, (_, i) => ({ x: 22 + (i % 6) * 10 + (i > 5 ? 5 : 0), y: i > 5 ? 74 : 80, r: ((i * 37) % 30) - 15, c: BRICK_COLORS[i % BRICK_COLORS.length] }));
function LoosePile({ wobble, gone }: { wobble: boolean; gone: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className="absolute inset-0" initial={false} animate={{ opacity: gone ? 0 : 1 }} transition={{ duration: 0.8, delay: gone ? 0.6 : 0 }} aria-hidden="true">
      {PILE.map((b, i) => (
        <motion.span
          key={i} className="absolute block h-[22px] w-[40px] rounded-[4px] border-2 border-black/25"
          style={{ left: `${b.x}%`, top: `${b.y}%`, background: b.c, rotate: `${b.r}deg` }}
          animate={wobble && !reduce ? { rotate: [b.r, b.r + 6, b.r - 6, b.r], y: [0, -3, 0] } : { rotate: b.r, y: 0 }}
          transition={wobble && !reduce ? { duration: 0.45, repeat: 3, delay: i * 0.03 } : { duration: 0.2 }}
        />
      ))}
    </motion.div>
  );
}

/** The three ways as cards. A way is struck through with the red pen once the next one is shown; the last is ringed. */
function WayCards({ shown, struck, ringed, ar = [], answer, top, fly = false }: {
  shown: boolean[]; struck: boolean[]; ringed: boolean; ar?: (string | undefined)[]; answer?: { en: string; ar: string }; top: number; fly?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <>
      {WAYS.map((w, i) =>
        shown[i] ? (
          <motion.div
            key={w}
            className="absolute flex h-[210px] w-[236px] flex-col items-center justify-center gap-2 rounded-[24px] border-[3px] px-4 text-center"
            style={{ top, left: i * 262, background: '#FFFDF7', borderColor: i === 2 && ringed ? P.gold : '#E3D6B8', boxShadow: i === 2 && ringed ? '0 0 0 6px rgba(229,169,60,0.35), 0 20px 40px -24px rgba(139,73,53,0.7)' : undefined }}
            initial={reduce ? { opacity: 0 } : fly ? { opacity: 0, x: -260 - i * 120, rotate: -8 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={reduce ? { duration: 0.2 } : { type: 'spring', bounce: 0.3, duration: 0.8, delay: fly ? 0.15 + i * 0.18 : 0 }}
          >
            <motion.div className="flex flex-col items-center gap-2" initial={false} animate={{ opacity: struck[i] ? 0.45 : 1 }} transition={{ duration: 0.4 }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full font-sans text-[18px] font-bold text-white" style={{ background: i === 2 ? P.teal : P.copper }}>{i + 1}</span>
              <span className="font-sans text-[23px] font-bold leading-tight" style={{ color: P.ink }}>{i === 2 && answer ? answer.en : w}</span>
            </motion.div>
            {struck[i] && (
              <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 236 210" preserveAspectRatio="none" aria-hidden="true">
                <Pen d="M26 50 L210 170" color={P.crimson} width={8} duration={0.4} delay={fly ? 0.8 : 0} />
                <Pen d="M210 50 L26 170" color={P.crimson} width={8} delay={fly ? 1.1 : 0.32} duration={0.4} />
              </svg>
            )}
            {ar[i] && <Tag style={{ left: '50%', top: -4 }} ar={ar[i]} delay={0.3} size={18}><span /></Tag>}
            {i === 2 && answer && <Tag style={{ left: '50%', top: -4 }} ar={answer.ar} color={P.teal} delay={0.3} size={18}><span /></Tag>}
          </motion.div>
        ) : null,
      )}
    </>
  );
}

/** Plays `name` `times` times, `gap` seconds apart, each time `on` turns true (bricks clicking into place). */
function useRepeat(on: boolean, name: Parameters<typeof play>[0], times: number, gap: number, delay = 0) {
  const was = useRef(on);
  useEffect(() => {
    if (on && !was.current) for (let i = 0; i < times; i++) play(name, delay + i * gap);
    was.current = on;
  }, [on, name, times, gap, delay]);
}

/** p4 Three ways. (1) A ghost castle flickers and vanishes in a puff: nothing comes from nothing. (2) The loose bricks
 *  shiver but never move. (3) A hand places the bricks and the castle builds itself up, brick by brick. */
export function ThreeWaysBuild({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const shown = WAYS.map((_, i) => labels[i] != null);
  const n = shown.filter(Boolean).length;
  const building = shown[2];
  const buildTime = reduce ? 0 : CASTLE_BRICKS * 0.04;
  useCue('poof', n === 1, 0.7);
  useRepeat(n === 2, 'brick', 4, 0.12);
  useRepeat(building, 'brick', 12, buildTime / 12, 0.1);
  useCue('reveal', building, buildTime + 0.3);
  useCue('strike', Math.max(0, n - 1));
  return (
    <div className="absolute left-[720px] top-[140px] h-[640px] w-[760px]" role="img" aria-label={`${label}: ${n} of 3 ways shown`}>
      <Room className="absolute inset-x-0 top-0 h-[400px]">
        {n === 1 && !reduce && (
          <>
            <motion.svg viewBox="0 0 600 420" className="absolute left-[16%] top-[4%] h-[88%] w-[68%]" aria-hidden="true"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0.2, 0.6, 0] }} transition={{ duration: 0.8, times: [0, 0.2, 0.45, 0.6, 1] }}>
              <path d="M80 400 V180 H160 V260 H440 V180 H520 V400 Z M262 400 V320 Q300 280 338 320 V400" fill="none" stroke="#FFFDF7" strokeWidth="5" strokeDasharray="10 10" />
            </motion.svg>
            <Burst x={50} y={50} kind="dust" count={16} seed={11} delay={0.6} spread={22} />
          </>
        )}
        {n === 1 && <Tag style={{ left: '50%', top: '42%' }} color={P.inkSoft} delay={1.3}>Nothing came!</Tag>}
        <LoosePile wobble={n === 2} gone={building} />
        {n === 2 && <Tag style={{ left: '50%', top: '30%' }} color={P.inkSoft} delay={1.2}>Still just bricks</Tag>}
        <BrickCastle built={building} stagger={0.04} className="left-[16%] top-[4%] h-[88%] w-[68%]" />
        {building && (
          <Sprite name="l02/hand-brick.png" enter="right" className="w-[22%]"
            style={{ left: '62%', top: '20%' }}
            animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 1, 0], x: [120, 0, -260, -300], y: [0, 60, -40, -80] }}
          />
        )}
      </Room>
      <WayCards shown={shown} struck={shown.map((s, i) => s && i < 2 && shown[i + 1])} ringed={building} top={420} />
    </div>
  );
}

/** p6 Clues of a maker: the castle Yusuf built, now read like a detective. The bricks shine as they fit together, the
 *  gate really swings open, and Mishmish walks in to play. */
export function CastleClues({ labels, label }: { labels: (string | null)[]; label: string }) {
  const n = labels.filter(Boolean).length;
  useCue('sparkle', n >= 1, 0.1);
  useCue('lock', n >= 2, 0.1);
  useCue('chime', n >= 2, 0.6);
  useCue('pop', n >= 3, 0.5);
  return (
    <Room className="absolute left-[700px] top-[120px] h-[640px] w-[800px]" label={`${label}: ${n} of 3 clues`}>
      <BrickCastle built stagger={0} shine={n >= 1} open={n >= 2} className="left-[10%] top-[6%] h-[80%] w-[80%]" />
      {n >= 3 && (
        <>
          <Sprite name="characters/mishmish-walk.png" enter="left" delay={0.3} className="w-[18%]" style={{ left: '22%', top: '62%' }} />
          <Burst x={50} y={66} kind="sparks" count={14} seed={5} delay={0.6} />
        </>
      )}
      {n >= 1 && <Tag style={{ left: '22%', top: '18%' }} delay={0.5}>{labels[0]}</Tag>}
      {n >= 2 && <Tag style={{ left: '30%', top: '93%' }} delay={0.8}>{labels[1]}</Tag>}
      {n >= 3 && <Tag style={{ left: '72%', top: '93%' }} color={P.teal} delay={0.9}>{labels[2]}</Tag>}
    </Room>
  );
}

/** p8 At-Tur 52:35: the three cards fly back in from page 4 and land under the castle; the ayah's own words drop onto
 *  the two impossible ways; the question turns the third card into the answer. */
export function ThreeWaysQuran({ v, label }: { v: Built; label: string }) {
  const on = v.lines >= 1;
  useCue('whoosh', on, 0.1);
  useCue('strike', on, 0.8);
  useCue('pop', v.evidence, 0.3);
  useCue('reveal', v.interaction, 0.2);
  return (
    <div className="absolute left-[720px] top-[140px] h-[640px] w-[760px]" role="img" aria-label={label}>
      <Room className="absolute inset-x-0 top-0 h-[300px]">
        <BrickCastle built stagger={0} open={v.interaction} className="left-[24%] top-[4%] h-[92%] w-[52%]" />
        {v.interaction && <Burst x={50} y={70} kind="sparks" count={18} seed={9} delay={0.3} />}
      </Room>
      <WayCards
        shown={[on, on, on]} struck={[on, on, false]} ringed={on} fly top={330}
        ar={v.evidence ? ['مِنْ غَيْرِ شَىْءٍ', 'هُمُ ٱلْخَـٰلِقُونَ'] : []}
        answer={v.interaction ? { en: 'Allah made them', ar: 'الخالق' } : undefined}
      />
    </div>
  );
}

/** Stars over the garden in sky.webp (px), lit one after another, and the lines that join some of them. */
const STARS = [[180, 90], [330, 210], [470, 70], [610, 260], [700, 140], [860, 60], [930, 300], [1090, 200], [1180, 80], [1310, 160], [1250, 330], [420, 330]];
const CONSTELLATION = 'M860 60 L1090 200 L1180 80 L1310 160 L1250 330 M180 90 L330 210 L470 70';

/** p9 Who made the sky? The stars come out one by one and join into shapes; a shooting star crosses; the ayah names the
 *  skies and the earth; the question draws one arc over the whole sky: only Allah. */
export function SkyStars({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  useCue('sparkle', v.lines >= 1, 0.3);
  useCue('whoosh', v.lines >= 2, 0.4);
  useCue('pop', v.evidence, 0.4);
  useCue('reveal', v.interaction, 0.4);
  return (
    <Print name="l02/sky" label={label}>
      {v.lines >= 1 && !reduce && STARS.map(([x, y], i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ ...at(L2, x, y), background: '#FFF6D8', boxShadow: '0 0 14px 5px rgba(255,236,170,0.8)' }}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0.55, 1], scale: 1 }}
          transition={{ duration: 2.4, delay: 0.2 + i * 0.12, ease: 'easeInOut' }}
        />
      ))}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${L2.w} ${L2.h}`} preserveAspectRatio="none" aria-hidden="true">
        {v.lines >= 1 && <Pen d={CONSTELLATION} color="rgba(255,246,216,0.7)" width={2} delay={1.8} duration={1.6} />}
        {v.interaction && <Pen d="M120 560 C420 40 1030 40 1330 560" color={P.goldSoft} width={6} dash="12 14" duration={1.6} glow />}
      </svg>
      {v.lines >= 2 && <ShootingStar x1={10} y1={8} x2={62} y2={30} delay={0.3} />}
      {v.lines >= 2 && <Tag style={at(L2, 724, 420)} color={P.ink} delay={0.9}>Nobody has ever made a sky</Tag>}
      {v.evidence && <Tag style={at(L2, 1060, 250)} ar="ٱلسَّمَـٰوَٰتِ" color={P.teal} delay={0.4}>the skies</Tag>}
      {v.evidence && <Tag style={at(L2, 1180, 800)} ar="ٱلْأَرْضَ" color={P.copper} delay={0.9}>the earth</Tag>}
      {v.interaction && <Tag style={at(L2, 724, 110)} color={P.crimson} delay={1.4} size={26}>Only Allah</Tag>}
    </Print>
  );
}

/** p11 Made ready to know Him: the lock is our heart and mind, the key is Islam, and the key slides into the lock it was
 *  made for, with a click and a burst of light. lock-base.webp is lock.webp with the key painted out; key.webp is the
 *  key cut out (ffmpeg, from the owner's painting). Key motion numbers are % of the key box (708 × 380 px). */
export function KeyFits({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const inLock = v.lines >= 2;
  useCue('whoosh', inLock, 0.1);
  useCue('lock', inLock, 1.15);
  useCue('sparkle', inLock, 1.3);
  useCue('pop', v.evidence, 0.3);
  useCue('chime', v.interaction, 0.5);
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px]" role="img" aria-label={label}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(139,73,53,0.6)]" style={{ background: '#FBF5EA' }}>
        <Layer name="l02/lock-base" filter="none" />
        <motion.img
          src={src('l02/key')} alt="" aria-hidden="true" draggable={false}
          className="absolute select-none" style={{ ...at(L2, 740, 400), width: `${(708 / L2.w) * 100}%`, height: `${(380 / L2.h) * 100}%` }}
          initial={false}
          animate={inLock
            ? { x: ['0%', '-66.4%', '-82.8%'], y: ['0%', '-11.4%', '-11.4%'], clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 0% 0%)', 'inset(0% 0% 0% 20.6%)'] }
            : { x: '0%', y: '0%', clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={reduce ? { duration: 0 } : { duration: 1.5, times: [0, 0.7, 1], ease: 'easeInOut' }}
        />
        {inLock && !reduce && (
          <motion.span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ ...at(L2, 300, 550), width: '30%', height: '40%', background: 'radial-gradient(circle, rgba(255,226,150,0.75), rgba(255,226,150,0) 65%)', mixBlendMode: 'screen' }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6] }} transition={{ duration: 1.8, delay: 1.1, ease: out }}
          />
        )}
      </div>
      {inLock && <Burst x={(300 / L2.w) * 100} y={(540 / L2.h) * 100} kind="sparks" count={18} seed={4} delay={1.2} />}
      {v.lines >= 1 && <Tag style={at(L2, 330, 960)} delay={0.4}>Your heart and mind</Tag>}
      {inLock && <Tag style={at(L2, 720, 770)} color={P.teal} delay={1.4}>Islam</Tag>}
      {v.evidence && <Tag style={at(L2, 1080, 200)} ar="فِطْرَتَ ٱللَّهِ" color={P.copper} delay={0.3}>the fitrah of Allah</Tag>}
      {v.interaction && <Tag style={at(L2, 1080, 980)} color={P.crimson} delay={0.5}>One Maker made both</Tag>}
    </div>
  );
}

/** p12 Allah says: Look! When the ayah is read, the camera travels to each of its four signs in turn (camels, sky,
 *  mountains, earth), pins its word there, then pulls back to show all four. */
const LOOK_AT = [
  { x: 230, y: 420, ar: 'ٱلْإِبِلِ', en: 'the camels', color: P.copper },
  { x: 900, y: 150, ar: 'ٱلسَّمَآءِ', en: 'the sky', color: P.teal },
  { x: 1160, y: 520, ar: 'ٱلْجِبَالِ', en: 'the mountains', color: P.crimson },
  { x: 700, y: 900, ar: 'ٱلْأَرْضِ', en: 'the earth', color: '#9A6A12' },
];
const TOUR = 5.5;
export function LookFour({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const zoom = 1.7;
  const xs = LOOK_AT.map((t) => -zoom * ((t.x / L2.w) * 100 - 50));
  const ys = LOOK_AT.map((t) => -zoom * ((t.y / L2.h) * 100 - 50));
  useCue('whoosh', v.lines >= 2, 0.1);
  useEffect(() => { if (v.evidence) LOOK_AT.forEach((_, i) => play('pop', reduce ? 0.2 * i : 0.9 + i * 1.1)); }, [v.evidence, reduce]);
  const tour = v.evidence && !reduce;
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px]" role="img" aria-label={label}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(139,73,53,0.6)]">
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={tour
            ? { scale: [1, zoom, zoom, zoom, zoom, 1], x: ['0%', ...xs.map((x) => `${x}%`), '0%'], y: ['0%', ...ys.map((y) => `${y}%`), '0%'] }
            : { scale: 1, x: '0%', y: '0%' }}
          transition={tour ? { duration: TOUR, times: [0, 0.18, 0.38, 0.58, 0.78, 1], ease: 'easeInOut' } : { duration: 0.6 }}
        >
          <Layer name="l02/look" filter="none" />
          {v.evidence && LOOK_AT.map((t, i) => (
            <Tag key={t.en} style={at(L2, t.x, t.y)} ar={t.ar} color={t.color} delay={reduce ? 0.2 * i : 0.9 + i * 1.1}>{t.en}</Tag>
          ))}
        </motion.div>
        {v.lines >= 2 && !v.evidence && <Tag style={at(L2, 724, 560)} color={P.crimson} size={34}>Look!</Tag>}
      </div>
    </div>
  );
}

/** p13 The camel's desert kit. A sandstorm blows across the camel; each item opens a lens on its part and shows it
 *  working: the clear eyelid slides over the eye, the sand bounces off the lashes, the nostrils close, the feet spread.
 *  Spots are % of camel.webp (contain fit, so they map 1:1 onto the box). */
const KIT = [
  { x: 80.9, y: 9.5, lx: 50, ly: 34 },
  { x: 80.6, y: 8.6, lx: 50, ly: 34 },
  { x: 88.6, y: 10.6, lx: 66, ly: 42 },
  { x: 47.2, y: 93, lx: 26, ly: 58 },
];
export function CamelKit({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const n = labels.filter(Boolean).length;
  const k = KIT[n - 1];
  useCue('sand', n >= 2, 0);
  useCue('pop', n, 0.2);
  return (
    <Print name="l02/camel" label={`${label}: ${n} of 4`}>
      {n >= 2 && <div className="absolute inset-0 overflow-hidden rounded-[28px]"><Sandstorm count={46} strength={1.2} /></div>}
      {/* Earlier parts keep a small numbered pin. */}
      {KIT.slice(0, Math.max(0, n - 1)).map((p, i) => (
        <span key={i} className="pointer-events-none absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white font-sans text-[15px] font-bold text-white"
          style={{ left: `${p.x}%`, top: `${p.y}%`, background: P.teal }}>{i + 1}</span>
      ))}
      {k && (
        <Lens key={n} src={src('l02/camel')} x={k.x} y={k.y} lx={k.lx} ly={k.ly} box={{ w: 760, h: 570 }} size={250} zoom={n === 4 ? 2.6 : 3.4} label={labels[n - 1] ?? undefined}>
          {n === 1 && !reduce && (
            <motion.div className="absolute inset-0" style={{ background: 'linear-gradient(100deg, rgba(150,210,230,0) 0%, rgba(150,210,230,0.55) 45%, rgba(150,210,230,0) 70%)' }}
              initial={{ x: '-100%' }} animate={{ x: ['-100%', '0%', '0%', '-100%'] }} transition={{ duration: 2.2, delay: 0.8, repeat: Infinity, repeatDelay: 0.8, times: [0, 0.3, 0.7, 1] }} />
          )}
          {n === 2 && <Sandstorm count={18} seed={8} strength={1.6} />}
          {n === 3 && (
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
              <Pen d="M50 22 L50 40 M44 34 L50 40 L56 34 M50 78 L50 60 M44 66 L50 60 L56 66" color={P.gold} width={4} delay={0.8} duration={0.6} glow />
            </svg>
          )}
          {n === 4 && (
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
              <Pen d="M30 70 L10 70 M16 64 L10 70 L16 76 M70 70 L90 70 M84 64 L90 70 L84 76" color={P.gold} width={4} delay={0.8} duration={0.6} glow />
            </svg>
          )}
        </Lens>
      )}
    </Print>
  );
}

/* ---------- moments on story pages: motion over the painting ---------- */

/** p3 The castle: sparkles round the castle as Maryam sees it. lego.webp in the picture-book box (cover fit). */
export function CastleSparkle({ v }: { v: Built }) {
  useCue('sparkle', v.lines >= 2, 0.2);
  return v.lines >= 2 ? <Burst x={65} y={52} kind="sparks" count={20} seed={2} spread={26} delay={0.1} /> : null;
}

/** p5 Crash! The tower bursts into bricks that land and stay where they fall. */
export function CrashBricks({ v }: { v: Built }) {
  useCue('thud', v.lines >= 2, 0.15);
  useCue('brick', v.lines >= 2, 0.5);
  useCue('brick', v.lines >= 3, 0.1);
  return v.lines >= 2 ? <Burst x={82} y={42} kind="bricks" count={18} seed={21} floor={84} spread={22} /> : null;
}

/** p17 Next time: rings spread round the spinning boat. boat.webp in the cliffhanger box (cover fit). */
export function BoatRipples({ v }: { v: Built }) {
  useCue('water', v.lines >= 3, 0.2);
  return v.lines >= 3 ? <Ripples x={50} y={66} w={70} /> : null;
}

/** p16 My Zad: today's provision, a magnifier for the clue hunt, drops into Jiddo's bag. */
export function MagnifierDrop({ v }: { v: Built }) {
  useCue('pop', v.lines >= 2, 0.5);
  return v.lines >= 2 ? <Sprite name="l02/magnifier.png" enter="drop" delay={0.2} className="w-[34%]" style={{ left: '33%', top: '30%', rotate: '-14deg' }} /> : null;
}
