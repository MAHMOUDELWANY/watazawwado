import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, FPS, GOLD, GOLD_SOFT, SANS, SERIF, Sfx, TEAL_DEEP, clamp, io } from './kit';

/**
 * V2 · Fix one letter: ع (Content Calendar, 17 Nov 2026), take 2.
 * Script: the retention method (watazawwado-video-generator SKILL.md): a moment → a consequence → what changed →
 * something to do tonight. Look: paper cut-out explainer (docs/design/INSPIRATION.md).
 * Voice: public/vo-v2.mp3 = owner's English clone (a2, b2, c2) + Fusha clone syllables (f1, f2), offsets below.
 */
export const V2_TOTAL = Math.round(61 * FPS);
const t = (s: number) => Math.round(s * FPS);

const INK = '#1B1512';
const ESPRESSO = '#3B2219';
const SAND = '#D9A441';
const CREAM = '#ECE6DB';
const WHITE = '#FBF8F2';
const AR = 'ThmanyahSerif, "Noto Naskh Arabic", serif';

const CUES: [string, number, number][] = [
  ['You’ve said the word “Arabic” a thousand times', 0.3, 3.5],
  ['but you’ve probably never said its first letter', 3.9, 6.6],
  ['It’s ع', 7.1, 8.2],
  ['English doesn’t have it', 8.5, 9.9],
  ['so we turn it into a plain “a”', 9.98, 12.2],
  ['and that changes things', 12.55, 14.4],
  ['Same word, one sound off…', 15.05, 17.1],
  ['and “he knew” becomes', 17.4, 19.0],
  ['“he was in pain”', 19.05, 20.6],
  ['Here’s what fixes it', 21.05, 22.2],
  ['It’s not in your mouth', 22.6, 23.9],
  ['it’s in your throat', 24.1, 25.4],
  ['Put your hand on your neck', 25.7, 26.95],
  ['Say “aah”', 27.25, 28.5],
  ['Now squeeze the middle of your throat', 28.68, 30.7],
  ['like you’re lifting something heavy', 30.75, 32.7],
  ['Feel that buzz?', 33.15, 34.2],
  ['That’s ع', 34.35, 35.6],
  ['Listen', 35.8, 36.7],
  ['Your turn', 42.0, 43.4],
  ['Hand on your throat', 43.65, 45.1],
  ['Tonight, do it ten times before bed', 50.7, 53.6],
  ['Feel the buzz, and you’ve got it', 53.9, 55.9],
  ['Save this so you don’t forget', 56.5, 58.4],
  ['Pack your zaad', 58.65, 61],
];
// scenes (s)
const SC = { hook: 0, first: 3.6, letter: 7.0, so: 12.45, cons: 14.85, flip: 20.85, hand: 25.5, slam: 34.3, listen: 36.6, you: 41.9, tonight: 50.55, save: 56.35, end: 61 };
const STEPS: [number, string][] = [[0, 'the letter'], [12.45, 'why it matters'], [20.85, 'the fix'], [41.9, 'your turn']];
const F1 = [['أَ', 36.8], ['عَ', 38.34], ['أَ', 39.78], ['عَ', 40.91]] as const;
const F2 = [['عَ', 45.3], ['عِ', 47.73], ['عُ', 49.57]] as const;

/* ---------- paper kit ---------- */

const torn = (seed: string, amp = 1.2, n = 18) => {
  const pts: string[] = [];
  const j = (i: number, k: string) => (random(`${seed}${k}${i}`) - 0.5) * amp;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${Math.max(0, j(i, 't') + amp / 2)}%`);
  for (let i = 0; i <= n; i++) pts.push(`${100 - Math.max(0, j(i, 'r') + amp / 2)}% ${(i / n) * 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - Math.max(0, j(i, 'b') + amp / 2)}%`);
  for (let i = n; i >= 0; i--) pts.push(`${Math.max(0, j(i, 'l') + amp / 2)}% ${(i / n) * 100}%`);
  return `polygon(${pts.join(',')})`;
};
const grain = { backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1.5px), radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1.5px)', backgroundSize: '7px 7px, 11px 11px' };

const Paper: React.FC<{ seed: string; x: number; y: number; w: number; h: number; color: string; rot?: number; children?: React.ReactNode }> =
  ({ seed, x, y, w, h, color, rot = 0, children }) => (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 10px 14px rgba(40,25,15,0.28))' }}>
      <div style={{ position: 'absolute', inset: -10, background: WHITE, clipPath: torn(seed + 'w', 1.6) }} />
      <div style={{ position: 'absolute', inset: 0, background: color, clipPath: torn(seed, 1.4), ...grain }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  );

/** A sticker that slaps in at `at` (local frames) and then breathes a little. */
const Sticker: React.FC<{ at: number; x: number; y: number; size?: number; w?: number; rot?: number; children: React.ReactNode; bg?: string }> =
  ({ at, x, y, size = 260, w, rot = 0, children, bg = WHITE }) => {
    const f = useCurrentFrame();
    if (f < at) return null;
    const p = spring({ frame: f - at, fps: FPS, config: { damping: 9, mass: 0.55, stiffness: 160 } });
    const idle = Math.sin((f - at) / 14 + x) * 1.2;
    const W = w ?? size;
    return (
      <div style={{ position: 'absolute', left: x - W / 2, top: y - size / 2, width: W, height: size, borderRadius: size * 0.16, background: bg,
        border: '10px solid #FFFFFF', boxShadow: `0 ${12 + (1 - p) * 30}px ${22 + (1 - p) * 30}px rgba(40,25,15,${0.3 - (1 - p) * 0.15})`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${0.2 + 0.8 * p + (1 - Math.min(1, p)) * 0.3}) rotate(${rot + idle + (1 - p) * -18}deg)` }}>{children}</div>
    );
  };

const Pin: React.FC<{ x: number; y: number; on?: number }> = ({ x, y, on = 1 }) => (
  <div style={{ position: 'absolute', left: x - 13, top: y - 13, width: 26, height: 26, borderRadius: 99, opacity: on, transform: `scale(${0.5 + 0.5 * on})`,
    background: `radial-gradient(circle at 35% 35%, #FF7A7A, ${CRIMSON} 60%, #7A1013)`, boxShadow: '0 4px 6px rgba(0,0,0,0.35)' }} />
);

/** Hand-drawn marker stroke along an SVG path. */
const Marker: React.FC<{ d: string; p: number; w?: number; color?: string }> = ({ d, p, w = 14, color = CRIMSON }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={0.92} />
  </svg>
);

const Label: React.FC<{ at: number; x: number; y: number; text: string; size?: number; rot?: number; under?: boolean }> = ({ at, x, y, text, size = 64, rot = -2, under = true }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps: FPS, config: { damping: 11 } });
  const u = io(f, at + 6, at + 16);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, 0) rotate(${rot}deg) scale(${0.5 + 0.5 * p})`, opacity: Math.min(1, p * 1.5),
      filter: 'drop-shadow(0 8px 10px rgba(40,25,15,0.25))' }}>
      <div style={{ background: WHITE, clipPath: torn(text, 3), padding: `${size * 0.3}px ${size * 0.6}px`, fontFamily: SANS, fontWeight: 700, fontSize: size, color: INK, whiteSpace: 'nowrap', position: 'relative' }}>
        {text}
        {under && <div style={{ position: 'absolute', left: size * 0.5, bottom: size * 0.22, height: size * 0.16, width: `calc(${u * 100}% - ${size}px)`, background: CRIMSON, opacity: 0.9 }} />}
      </div>
    </div>
  );
};

const GraphPaper: React.FC = () => (
  <AbsoluteFill style={{ background: CREAM }}>
    <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(120,100,80,0.10) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(120,100,80,0.10) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(90,70,50,0.18))' }} />
  </AbsoluteFill>
);

const Logo: React.FC = () => (
  <div style={{ position: 'absolute', right: 56, top: 70, width: 130, height: 130, border: '2.5px solid rgba(27,21,18,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(251,248,242,0.6)' }}>
    <Img src={staticFile('img/logo-clean.png')} style={{ width: 104, objectFit: 'contain' }} />
  </div>
);

/** Step tracker top-left: four dots and the current step's name. */
const Steps: React.FC = () => {
  const f = useCurrentFrame();
  const idx = STEPS.filter(([s]) => f >= t(s)).length - 1;
  const since = f - t(STEPS[idx][0]);
  const pop = spring({ frame: since, fps: FPS, config: { damping: 10 } });
  return (
    <div style={{ position: 'absolute', left: 56, top: 92, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 34, borderRadius: 12, padding: '8px 18px', transform: `scale(${0.8 + 0.2 * pop})` }}>
        step {idx + 1} · {STEPS[idx][1]}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {STEPS.map((_, i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 99, background: i <= idx ? CRIMSON : 'rgba(27,21,18,0.2)', transform: `scale(${i === idx ? 1 + 0.4 * (1 - pop) : 1})` }} />)}
      </div>
    </div>
  );
};

const Caption: React.FC = () => {
  const f = useCurrentFrame();
  const cue = CUES.find(([, s, e]) => f >= t(s) - 2 && f < t(e));
  if (!cue) return null;
  const p = spring({ frame: f - (t(cue[1]) - 2), fps: FPS, config: { damping: 13, mass: 0.5 } });
  const parts = cue[0].split(/(ع)/);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1470, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 24}px) scale(${0.94 + 0.06 * p})` }}>
      <div style={{ maxWidth: 920, background: INK, color: WHITE, borderRadius: 18, padding: '18px 34px', fontFamily: SANS, fontWeight: 700, fontSize: 54, lineHeight: 1.2, textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.25)' }}>
        {parts.map((x, i) => x === 'ع' ? <span key={i} style={{ fontFamily: AR, color: GOLD_SOFT, fontSize: 66 }}>ع</span> : <React.Fragment key={i}>{x}</React.Fragment>)}
      </div>
    </div>
  );
};

/** Scene: slides in like paper on a desk, slow push-in, slides out. Optional punch-zooms on key words (absolute s). */
const Slide: React.FC<{ dur: number; children: React.ReactNode; from?: 1 | -1; punches?: number[]; start: number }> = ({ dur, children, from = 1, punches = [], start }) => {
  const f = useCurrentFrame();
  const inP = spring({ frame: f, fps: FPS, config: { damping: 15, mass: 0.7 } });
  const outP = io(f, dur - 7, dur, 0, 1, (n) => n * n);
  const push = 1 + (f / Math.max(dur, 1)) * 0.06;
  const punch = punches.reduce((a, s) => a + interpolate(f, [t(s - start) - 1, t(s - start) + 2, t(s - start) + 10], [0, 0.07, 0], clamp), 0);
  return (
    <AbsoluteFill style={{ transform: `translateX(${from * ((1 - inP) * 1100) - outP * 1200 * from}px) rotate(${(1 - inP) * 4 * from - outP * 3}deg) scale(${push + punch})` }}>
      {children}
    </AbsoluteFill>
  );
};

/** Full-screen typographic card (pattern break), torn top and bottom. */
const BigCard: React.FC<{ color: string; children: React.ReactNode; seed: string }> = ({ color, children, seed }) => (
  <AbsoluteFill>
    <div style={{ position: 'absolute', left: -40, right: -40, top: 230, bottom: 420, background: color, clipPath: torn(seed, 2.4, 10), ...grain,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 14px 18px rgba(0,0,0,0.25))' }}>{children}</div>
  </AbsoluteFill>
);

/* ---------- step 1: a moment ---------- */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [t(2.0), t(3.0)], [1, 1000], { ...clamp, easing: (x) => x * x }));
  return (
    <BigCard color={SAND} seed="hook">
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 70, color: INK, opacity: io(f, 0, 6) }}>You’ve said</div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 170, color: CRIMSON, lineHeight: 1.05, whiteSpace: 'nowrap',
        transform: `scale(${spring({ frame: f - t(1.2), fps: FPS, config: { damping: 9 } })})` }}>“Arabic”</div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 120, color: INK, opacity: io(f, t(2.0), t(2.2)), fontVariantNumeric: 'tabular-nums' }}>×{n.toLocaleString('en-US')}</div>
    </BigCard>
  );
};
const First: React.FC = () => {
  const f = useCurrentFrame();
  const ring = io(f, t(5.45 - SC.first), t(5.95 - SC.first));
  return (
    <AbsoluteFill>
      <Paper seed="first" x={60} y={330} w={960} h={900} color={TEAL_DEEP} rot={-1}>
        <div style={{ position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 52, color: WHITE, opacity: io(f, 2, 10) }}>“Arabic” in Arabic:</div>
      </Paper>
      <Sticker at={6} x={540} y={800} w={760} size={380} rot={-2}>
        <span style={{ fontFamily: AR, fontWeight: 700, fontSize: 250, color: INK, lineHeight: 1, marginTop: -40, direction: 'rtl' }}>عَرَبِي</span>
      </Sticker>
      {/* the first letter is on the right: ring it */}
      <Marker d="M 870 640 C 1000 650 1000 960 860 975 C 720 990 650 800 700 700 C 740 620 820 610 900 650" p={ring} w={16} />
      <Label at={t(5.9 - SC.first)} x={760} y={1080} text="its first letter" size={50} rot={3} />
    </AbsoluteFill>
  );
};
const Letter: React.FC = () => {
  const f = useCurrentFrame();
  const L = (s: number) => t(s - SC.letter);
  const x1 = io(f, L(11.05), L(11.35)); const x2 = io(f, L(11.3), L(11.6));
  return (
    <AbsoluteFill>
      <Paper seed="letter" x={60} y={330} w={960} h={900} color={ESPRESSO} rot={1.5}>{null}</Paper>
      <Sticker at={4} x={300} y={700} size={340} rot={-6}><span style={{ fontFamily: AR, fontWeight: 700, fontSize: 280, color: CRIMSON, lineHeight: 1, marginTop: -40 }}>ع</span></Sticker>
      <Label at={L(8.5)} x={300} y={940} text="not in English" size={42} rot={-3} under={false} />
      <Sticker at={L(10.9)} x={800} y={700} size={260} rot={6}><span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 200, color: INK, lineHeight: 1, marginTop: -26 }}>a</span></Sticker>
      <div style={{ position: 'absolute', left: 520, top: 610, fontFamily: SANS, fontWeight: 700, fontSize: 130, color: WHITE, opacity: io(f, L(10.6), L(10.8)) }}>=</div>
      <Marker d="M 500 600 L 660 780" p={x1} w={24} />
      <Marker d="M 660 600 L 500 780" p={x2} w={24} />
    </AbsoluteFill>
  );
};

/* ---------- step 2: a consequence ---------- */
const So: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <BigCard color={CRIMSON} seed="so">
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 96, color: WHITE, transform: `scale(${spring({ frame: f, fps: FPS, config: { damping: 10 } })})` }}>and that changes</div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 230, color: GOLD_SOFT, lineHeight: 1,
        transform: `scale(${spring({ frame: f - t(13.36 - SC.so), fps: FPS, config: { damping: 8 } })})` }}>things.</div>
    </BigCard>
  );
};
const Cons: React.FC = () => {
  const f = useCurrentFrame();
  const L = (s: number) => t(s - SC.cons);
  const arrow = io(f, L(18.3), L(18.9));
  const shakeK = interpolate(f, [L(20.0), L(20.05), L(20.6)], [0, 1, 0], clamp);
  const sx = Math.sin(f * 2.9) * 16 * shakeK;
  const card = (word: string, gloss: string, at: number, y: number, color: string, ring: number, ringX: number, extra?: React.ReactNode) => {
    if (f < at) return null;
    const p = spring({ frame: f - at, fps: FPS, config: { damping: 13 } });
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${(1 - p) * 300}px)`, opacity: p }}>
        <Paper seed={word} x={100} y={y} w={880} h={330} color={color} rot={y < 700 ? -1.5 : 1.5}>
          <div style={{ position: 'absolute', right: 70, top: 20, fontFamily: AR, fontWeight: 700, fontSize: 200, color: WHITE, direction: 'rtl', lineHeight: 1.3 }}>{word}</div>
          <div style={{ position: 'absolute', left: 60, top: 120, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 64, color: GOLD_SOFT }}>{gloss}</div>
          {extra}
        </Paper>
        <Marker d={`M ${ringX + 70} ${y + 60} C ${ringX + 150} ${y + 70} ${ringX + 150} ${y + 270} ${ringX + 60} ${y + 280} C ${ringX - 30} ${y + 285} ${ringX - 40} ${y + 90} ${ringX + 80} ${y + 70}`} p={ring} w={12} color={GOLD} />
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ transform: `translateX(${sx}px)` }}>
      <Label at={6} x={540} y={300} text="same word, one sound off" size={50} />
      {card('عَلِمَ', 'he knew', L(17.5), 470, TEAL_DEEP, io(f, L(17.9), L(18.3)), 760)}
      <Marker d="M 540 820 C 520 870 560 900 540 950 M 505 915 L 540 955 L 575 915" p={arrow} w={12} color={INK} />
      {card('أَلِمَ', 'he was in pain', L(19.1), 990, ESPRESSO, io(f, L(19.9), L(20.3)), 760,
        <div style={{ position: 'absolute', left: 60, top: 210, opacity: io(f, L(20.0), L(20.2)) }}>
          {/* a plaster sticker */}
          <div style={{ width: 150, height: 54, borderRadius: 27, background: COPPER, border: '6px solid #fff', transform: 'rotate(-14deg)', boxShadow: '0 6px 10px rgba(0,0,0,0.3)' }} />
        </div>)}
    </AbsoluteFill>
  );
};

/* ---------- step 3: what changed ---------- */
const Flip: React.FC = () => {
  const f = useCurrentFrame();
  const L = (s: number) => t(s - SC.flip);
  const strike = io(f, L(23.25), L(23.6));
  const throat = spring({ frame: f - L(24.5), fps: FPS, config: { damping: 8 } });
  return (
    <BigCard color={WHITE} seed="flip">
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, color: INK, opacity: io(f, L(21.1), L(21.4)) }}>the fix is not in your</div>
      <div style={{ position: 'relative', fontFamily: SERIF, fontWeight: 700, fontSize: 170, color: INK, opacity: io(f, L(22.7), L(23.0)), filter: `grayscale(1)` }}>
        mouth
        <div style={{ position: 'absolute', left: -20, right: -20, top: '52%', height: 22, background: CRIMSON, transformOrigin: 'left', transform: `scaleX(${strike}) rotate(-4deg)`, borderRadius: 11 }} />
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, color: INK, opacity: io(f, L(24.1), L(24.3)), marginTop: 30 }}>it’s in your</div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 230, color: CRIMSON, lineHeight: 1, transform: `scale(${throat}) rotate(${(1 - throat) * -8}deg)` }}>throat.</div>
    </BigCard>
  );
};

const MID: [number, number] = [478, 780];
const Silhouette: React.FC<{ buzz?: number }> = ({ buzz = 0 }) => {
  const f = useCurrentFrame();
  return (
    <>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <path fill={INK} d="M300 420 C300 290 400 230 480 235 C580 240 640 320 640 410 L672 470 L640 485 L650 540 C650 580 620 595 580 590 L560 640
          L560 960 C700 980 820 1040 860 1180 L180 1180 C220 1040 320 980 400 960 L400 700 C330 650 300 540 300 420 Z" />
        <path d="M470 600 L478 780 L470 940" stroke={COPPER} strokeWidth={22} strokeLinecap="round" fill="none" opacity={0.85} />
      </svg>
      {buzz > 0 && [0, 1, 2].map((i) => {
        const k = (f / 8 + i / 3) % 1;
        return <div key={i} style={{ position: 'absolute', left: MID[0] - (40 + k * 130), top: MID[1] - (24 + k * 76), width: 2 * (40 + k * 130), height: 2 * (24 + k * 76),
          borderRadius: '50%', border: `6px solid ${GOLD}`, opacity: (1 - k) * buzz }} />;
      })}
      <div style={{ position: 'absolute', left: MID[0] - 32, top: MID[1] - 32, width: 64, height: 64, borderRadius: 99, background: GOLD,
        opacity: 0.25 + 0.75 * buzz, filter: 'blur(8px)', transform: `scale(${1 + 0.2 * Math.sin(f / 2.2) * buzz})` }} />
    </>
  );
};
/** A flat hand, palm resting on the side of the neck. */
const Hand: React.FC<{ p: number }> = ({ p }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, transform: `translate(${(1 - p) * 420}px, ${(1 - p) * 260}px)`, opacity: Math.min(1, p * 2) }}>
    <g fill={COPPER} stroke={WHITE} strokeWidth={8} strokeLinejoin="round">
      <path d="M560 700 C600 690 640 700 700 720 L900 800 C940 815 950 860 905 870 L700 830 L700 900 C700 940 660 960 620 950 L560 930 Z" />
      <rect x="610" y="690" width="210" height="42" rx="21" transform="rotate(-8 610 690)" />
      <rect x="600" y="740" width="230" height="42" rx="21" transform="rotate(-2 600 740)" />
      <rect x="600" y="790" width="220" height="42" rx="21" transform="rotate(4 600 790)" />
    </g>
  </svg>
);
const HandScene: React.FC = () => {
  const f = useCurrentFrame();
  const L = (s: number) => t(s - SC.hand);
  const hand = spring({ frame: f - L(25.7), fps: FPS, config: { damping: 14 } });
  const buzz = io(f, L(28.75), L(30.2));
  const lift = spring({ frame: f - L(31.4), fps: FPS, config: { damping: 9 } });
  const aah = spring({ frame: f - L(27.3), fps: FPS, config: { damping: 9 } });
  return (
    <AbsoluteFill>
      <Paper seed="hand" x={60} y={210} w={960} h={1040} color={SAND} rot={1}>{null}</Paper>
      <AbsoluteFill><Silhouette buzz={buzz} /></AbsoluteFill>
      <Hand p={hand} />
      {f >= L(27.3) && (
        <div style={{ position: 'absolute', left: 690, top: 300, transform: `scale(${aah})`, transformOrigin: 'left bottom' }}>
          <div style={{ background: WHITE, border: `6px solid ${INK}`, borderRadius: 40, padding: '14px 34px', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 80, color: INK }}>aah…</div>
        </div>
      )}
      {/* "lifting something heavy": a weight rises */}
      {f >= L(31.0) && (
        <div style={{ position: 'absolute', left: 110, top: 1000 - lift * 120, transform: `rotate(${-6 + lift * 6}deg)` }}>
          <div style={{ width: 190, height: 140, background: ESPRESSO, border: '8px solid #fff', borderRadius: 18, boxShadow: '0 14px 18px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 44, color: GOLD_SOFT }}>20 kg</div>
        </div>
      )}
      <Label at={L(33.15)} x={820} y={1080} text="buzz?" size={74} rot={4} />
    </AbsoluteFill>
  );
};
const Slam: React.FC = () => {
  const f = useCurrentFrame();
  const p = spring({ frame: f - t(34.6 - SC.slam), fps: FPS, config: { damping: 7, mass: 0.6 } });
  const zoom = 1 + io(f, 0, 30) * 0.25;
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${MID[0]}px ${MID[1]}px` }}>
      <Paper seed="hand" x={60} y={210} w={960} h={1040} color={SAND} rot={1}>{null}</Paper>
      <AbsoluteFill><Silhouette buzz={1} /></AbsoluteFill>
      {f >= t(34.6 - SC.slam) && (
        <div style={{ position: 'absolute', left: MID[0] - 150, top: MID[1] - 170, width: 300, height: 300, borderRadius: 50, background: WHITE, border: '12px solid #fff',
          boxShadow: '0 16px 26px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${2.2 - 1.2 * p}) rotate(${(1 - p) * 20 - 4}deg)`, opacity: Math.min(1, p * 2) }}>
          <span style={{ fontFamily: AR, fontWeight: 700, fontSize: 230, color: CRIMSON, lineHeight: 1, marginTop: -30 }}>ع</span>
        </div>
      )}
      <Pin x={MID[0] + 120} y={MID[1] - 150} on={io(f, t(34.75 - SC.slam), t(34.85 - SC.slam))} />
    </AbsoluteFill>
  );
};

const activeAt = (f: number, s: number, len = 0.9) => interpolate(f, [t(s) - 3, t(s), t(s + len), t(s + len) + 6], [0, 1, 1, 0], clamp);
const Wave: React.FC<{ on: number; x: number; y: number }> = ({ on, x, y }) => {
  const f = useCurrentFrame();
  return (
    <svg width={160} height={120} style={{ position: 'absolute', left: x, top: y, opacity: on }}>
      {[0, 1, 2, 3, 4].map((i) => { const h = 20 + 70 * Math.abs(Math.sin(f / 3 + i * 1.3)) * on; return <rect key={i} x={10 + i * 30} y={60 - h / 2} width={16} height={h} rx={8} fill={CRIMSON} />; })}
    </svg>
  );
};
const Listen: React.FC = () => {
  const f = useCurrentFrame() + t(SC.listen);
  const hamza = Math.max(activeAt(f, F1[0][1]), activeAt(f, F1[2][1]));
  const ain = Math.max(activeAt(f, F1[1][1]), activeAt(f, F1[3][1]));
  const card = (glyph: string, label: string, on: number, x: number, color: string, seed: string) => (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${-on * 30}px)` }}>
      <Paper seed={seed} x={x} y={430} w={440} h={700} color={color} rot={x < 300 ? -2 : 2}>
        <div style={{ position: 'absolute', left: 50, top: 70, width: 340, height: 360, background: WHITE, border: '10px solid #fff', borderRadius: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 ${12 + on * 20}px ${22 + on * 20}px rgba(0,0,0,0.25)`, transform: `scale(${1 + 0.08 * on})` }}>
          <span style={{ fontFamily: AR, fontWeight: 700, fontSize: 250, color: on > 0.5 ? CRIMSON : INK, lineHeight: 1, marginTop: -40 }}>{glyph}</span>
        </div>
        <div style={{ position: 'absolute', top: 470, width: '100%', textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 40, color: WHITE }}>{label}</div>
        <Wave on={on} x={140} y={540} />
      </Paper>
    </div>
  );
  return (
    <AbsoluteFill>
      <Label at={4} x={540} y={270} text="Listen" size={70} />
      {card('أَ', 'a clean stop', hamza, 70, ESPRESSO, 'la')}
      {card('عَ', 'squeezed, buzzing', ain, 570, TEAL_DEEP, 'lb')}
    </AbsoluteFill>
  );
};

/* ---------- step 4: something to do ---------- */
const You: React.FC = () => {
  const f = useCurrentFrame() + t(SC.you);
  return (
    <AbsoluteFill>
      <Label at={4} x={540} y={270} text="Your turn" size={70} />
      <Paper seed="you" x={50} y={460} w={980} h={720} color={ESPRESSO} rot={-1}>{null}</Paper>
      {F2.map(([g, s], i) => {
        const act = activeAt(f, s, 0.6);
        const ring = io(f, t(s + 0.6), t(s + 1.9), 0, 1, (n) => n);
        const cx = 210 + i * 330;
        return (
          <React.Fragment key={i}>
            <Sticker at={10 + i * 5} x={cx} y={760 - act * 30} size={270} rot={[-5, 3, -2][i]} bg={act > 0.5 ? '#FFF6E2' : WHITE}>
              <span style={{ fontFamily: AR, fontWeight: 700, fontSize: 190, color: act > 0.5 ? CRIMSON : INK, lineHeight: 1, marginTop: -26 }}>{g}</span>
            </Sticker>
            <svg width={120} height={120} style={{ position: 'absolute', left: cx - 60, top: 960, opacity: ring > 0 && ring < 1 ? 1 : 0 }}>
              <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(251,248,242,0.25)" strokeWidth="10" />
              <circle cx="60" cy="60" r="44" fill="none" stroke={GOLD} strokeWidth="10" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring} transform="rotate(-90 60 60)" strokeLinecap="round" />
            </svg>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
/** Yellow notepad with tonight's exercise written in. */
const Tonight: React.FC = () => {
  const f = useCurrentFrame();
  const L = (s: number) => t(s - SC.tonight);
  const lines: [string, number][] = [['hand on your throat', 51.0], ['“aah” → squeeze', 52.0], ['عَ  عِ  عُ', 52.7], ['× 10 before bed', 53.2]];
  const tick = (i: number) => io(f, L(54.0 + i * 0.35), L(54.3 + i * 0.35));
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 260, width: 840, height: 1040, background: '#F6E79A', borderRadius: 10, transform: 'rotate(-2deg)',
        boxShadow: '0 18px 26px rgba(40,25,15,0.3)', backgroundImage: 'linear-gradient(transparent 94px, rgba(8,125,145,0.35) 96px)', backgroundSize: '100% 98px', backgroundPosition: '0 150px' }}>
        <div style={{ position: 'absolute', left: 90, top: 0, bottom: 0, width: 3, background: 'rgba(197,31,36,0.5)' }} />
        <div style={{ height: 70, background: '#E9D77E', borderRadius: '10px 10px 0 0', borderBottom: '3px solid rgba(0,0,0,0.08)' }} />
        <div style={{ position: 'absolute', left: 130, top: 120, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 90, color: CRIMSON, opacity: io(f, 0, 8) }}>Tonight</div>
        {lines.map(([txt, s], i) => {
          const w = io(f, L(s), L(s) + 14);
          return (
            <div key={i} style={{ position: 'absolute', left: 130, top: 268 + i * 98 * 1.4, display: 'flex', alignItems: 'center', gap: 30 }}>
              <div style={{ width: 60, height: 60, border: `6px solid ${INK}`, borderRadius: 8, position: 'relative' }}>
                <svg width={80} height={80} style={{ position: 'absolute', left: -6, top: -18, overflow: 'visible' }}>
                  <path d="M8 40 L30 62 L74 6" stroke={CRIMSON} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tick(i)} />
                </svg>
              </div>
              <div style={{ fontFamily: txt.includes('عَ') ? AR : SERIF, fontStyle: txt.includes('عَ') ? 'normal' : 'italic', fontWeight: 700, fontSize: txt.includes('عَ') ? 96 : 60, direction: txt.includes('عَ') ? 'rtl' : 'ltr', lineHeight: 1.4, color: INK,
                clipPath: `inset(-20% ${100 - w * 100}% -20% 0)` }}>{txt}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 770, top: 1180, transform: `rotate(${-30 + Math.sin(f / 3) * 4}deg)`, opacity: io(f, L(51.0), L(51.2)) * (1 - io(f, L(55.6), L(55.9))) }}>
        <div style={{ width: 26, height: 260, background: GOLD, border: '5px solid #fff', borderRadius: 6 }} />
      </div>
    </AbsoluteFill>
  );
};
const Save: React.FC = () => {
  const f = useCurrentFrame();
  const L = (s: number) => t(s - SC.save);
  const bm = spring({ frame: f - 4, fps: FPS, config: { damping: 8 } });
  const drop = spring({ frame: f - L(58.6), fps: FPS, config: { damping: 9, mass: 0.8 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 540 - 130, top: 330, transform: `scale(${bm}) rotate(${(1 - bm) * 30}deg)` }}>
        <svg width={260} height={320} viewBox="0 0 260 320">
          <path d="M30 20 H230 V300 L130 230 L30 300 Z" fill={CRIMSON} stroke="#fff" strokeWidth={16} strokeLinejoin="round" />
        </svg>
      </div>
      <Label at={L(56.6)} x={540} y={700} text="Save this for tonight" size={64} />
      <Paper seed="end" x={240} y={880} w={600} h={460} color={TEAL_DEEP} rot={1.5}>
        <div style={{ position: 'absolute', left: 160, top: 50 + (1 - drop) * -500, opacity: Math.min(1, drop * 3), transform: `rotate(${(1 - drop) * 20}deg)` }}>
          <Img src={staticFile('img/zaad-bag.svg')} style={{ width: 270, filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.35))' }} />
        </div>
        <div style={{ position: 'absolute', bottom: 40, width: '100%', textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 60, color: WHITE, opacity: io(f, L(58.9), L(59.3)) }}>Pack your zaad</div>
      </Paper>
    </AbsoluteFill>
  );
};

export const V2Ain: React.FC = () => {
  const seq = (a: number, b: number, el: React.ReactNode, from: 1 | -1 = 1, punches: number[] = []) => (
    <Sequence from={t(a)} durationInFrames={t(b) - t(a)}><Slide dur={t(b) - t(a)} from={from} punches={punches} start={a}>{el}</Slide></Sequence>
  );
  const cuts = [SC.first, SC.letter, SC.so, SC.cons, SC.flip, SC.hand, SC.listen, SC.you, SC.tonight, SC.save];
  return (
    <AbsoluteFill>
      <GraphPaper />
      {seq(SC.hook, SC.first, <Hook />, 1, [1.26, 2.32])}
      {seq(SC.first, SC.letter, <First />, -1, [5.48])}
      {seq(SC.letter, SC.so, <Letter />, 1, [7.54, 11.6])}
      {seq(SC.so, SC.cons, <So />, -1, [13.36])}
      {seq(SC.cons, SC.flip, <Cons />, 1, [17.96, 20.02])}
      {seq(SC.flip, SC.hand, <Flip />, -1, [23.32, 24.64])}
      {seq(SC.hand, SC.slam, <HandScene />, 1, [27.56, 33.44])}
      <Sequence from={t(SC.slam)} durationInFrames={t(SC.listen) - t(SC.slam)}><Slam /></Sequence>
      {seq(SC.listen, SC.you, <Listen />, 1)}
      {seq(SC.you, SC.tonight, <You />, -1)}
      {seq(SC.tonight, SC.save, <Tonight />, 1, [51.92])}
      <Sequence from={t(SC.save)}><Slide dur={99999} start={SC.save} punches={[56.54]}><Save /></Slide></Sequence>
      <Steps />
      <Logo />
      <Caption />
      <Audio src={staticFile('vo-v2.mp3')} />

      {/* Sound follows motion (no music, RULES §1.6). Nothing sits on the Arabic syllables. */}
      {cuts.map((s) => <Sfx key={s} at={t(s) - 3} src="paper/slide.mp3" volume={0.32} />)}
      {[SC.so, SC.flip].map((s) => <Sfx key={'tear' + s} at={t(s) - 2} src="paper/tear-s.mp3" volume={0.3} />)}
      <Sfx at={t(1.2)} src="paper/slap-s.mp3" volume={0.35} />
      {Array.from({ length: 8 }).map((_, i) => <Sfx key={'tk' + i} at={t(2.0) + i * 4} src="wv/tick-sound.wav" volume={0.12} />)}
      <Sfx at={t(3.6) + 6} src="paper/slap-s.mp3" volume={0.35} />
      <Sfx at={t(5.45)} src="paper/marker-s.mp3" volume={0.35} />
      <Sfx at={t(7.0) + 4} src="paper/slap-s.mp3" volume={0.35} />
      <Sfx at={t(10.9)} src="paper/slap-s.mp3" volume={0.3} />
      <Sfx at={t(11.05)} src="paper/marker-s.mp3" volume={0.4} />
      <Sfx at={t(13.36)} src="wv/dull-thud.wav" volume={0.3} />
      <Sfx at={t(17.5)} src="paper/slap-s.mp3" volume={0.3} />
      <Sfx at={t(18.3)} src="paper/marker-s.mp3" volume={0.3} />
      <Sfx at={t(19.1)} src="paper/slap-s.mp3" volume={0.3} />
      <Sfx at={t(20.0)} src="wv/dull-thud.wav" volume={0.3} />
      <Sfx at={t(23.25)} src="paper/marker-s.mp3" volume={0.4} />
      <Sfx at={t(23.8)} src="riser.mp3" volume={0.15} />
      <Sfx at={t(24.5)} src="wv/bass-impact.wav" volume={0.22} />
      <Sfx at={t(25.7)} src="wv/swish-whoosh-large.wav" volume={0.2} />
      <Sfx at={t(27.3)} src="wv/message-pop-reply.wav" volume={0.25} />
      <Sfx at={t(31.4)} src="wv/dull-thud.wav" volume={0.25} />
      <Sfx at={t(33.15)} src="paper/slap-s.mp3" volume={0.3} />
      <Sfx at={t(34.6)} src="wv/bass-impact.wav" volume={0.28} />
      <Sfx at={t(34.65)} src="correct.mp3" volume={0.2} />
      <Sfx at={t(42.0) + 10} src="paper/slap-s.mp3" volume={0.3} />
      {[51.0, 52.0, 52.7, 53.2].map((s) => <Sfx key={'w' + s} at={t(s)} src="paper/marker-s.mp3" volume={0.3} />)}
      {[0, 1, 2, 3].map((i) => <Sfx key={'ck' + i} at={t(54.0 + i * 0.35)} src="wv/tick-sound.wav" volume={0.2} />)}
      <Sfx at={t(56.35) + 4} src="wv/pop-hand.wav" volume={0.3} />
      <Sfx at={t(58.6)} src="wv/dull-thud.wav" volume={0.3} />
    </AbsoluteFill>
  );
};
