import React from 'react';
import { AbsoluteFill, Audio, Easing, Sequence, continueRender, delayRender, interpolate, random, staticFile, useCurrentFrame } from 'remotion';

// Brand (docs/design-system.md)
export const PAPER = '#FAF7F2';
export const GOLD = '#E5A93C';
export const GOLD_SOFT = '#F6D58E';
export const CRIMSON = '#C51F24';
export const TEAL = '#12A4BC';
export const TEAL_DEEP = '#087D91';
export const COPPER = '#DA7960';
export const RIBBON = `linear-gradient(100deg, ${CRIMSON}, ${COPPER} 35%, ${GOLD} 65%, ${TEAL})`;
export const SERIF = 'ThmanyahSerif, Georgia, serif';
export const SANS = 'ThmanyahSans, system-ui, sans-serif';
export const FPS = 30;

if (typeof window !== 'undefined') {
  const handle = delayRender('fonts');
  const faces = [
    new FontFace('ThmanyahSerif', `url(${staticFile('fonts/thmanyahserifdisplay-Bold.woff2')})`, { weight: '700' }),
    new FontFace('ThmanyahSerif', `url(${staticFile('fonts/thmanyahserifdisplay-Medium.woff2')})`, { weight: '500' }),
    new FontFace('ThmanyahSans', `url(${staticFile('fonts/thmanyahsans-Regular.woff2')})`, { weight: '400' }),
    new FontFace('ThmanyahSans', `url(${staticFile('fonts/thmanyahsans-Medium.woff2')})`, { weight: '500' }),
    new FontFace('ThmanyahSans', `url(${staticFile('fonts/thmanyahsans-Bold.woff2')})`, { weight: '700' }),
  ];
  Promise.all(faces.map((f) => f.load().then(() => document.fonts.add(f)))).then(() => continueRender(handle));
}

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const io = (f: number, a: number, b: number, from = 0, to = 1, e: (n: number) => number = ease) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: e });
/** A 0→1→0 pulse around frame `at`. */
export const pulse = (f: number, at: number, w = 6) => interpolate(f, [at - 1, at, at + w], [0, 1, 0], clamp);

export const glass: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))',
  border: '1.5px solid rgba(246,213,142,0.38)',
  boxShadow: '0 40px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.28), 0 0 70px rgba(229,169,60,0.14)',
  backdropFilter: 'blur(18px)',
};

export const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 0.7 }) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none"><Audio src={staticFile(`sfx/${src}`)} volume={volume} /></Sequence>
);

/* ---------- background ---------- */

export const Backdrop: React.FC<{ hue?: number }> = () => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 70);
  const b = Math.cos(f / 95);
  return (
    <AbsoluteFill style={{ background: '#090706', overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(65% 40% at ${50 + a * 12}% ${36 + b * 6}%, rgba(8,125,145,0.55), rgba(5,54,63,0) 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(55% 32% at ${50 - a * 14}% ${92 - b * 5}%, rgba(139,73,53,0.55), rgba(59,34,25,0) 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(30% 20% at ${30 + b * 20}% ${60 + a * 10}%, rgba(229,169,60,0.10), transparent 70%)` }} />
      <Beams />
      <Dust />
      <AbsoluteFill style={{ background: 'radial-gradient(120% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.7))' }} />
    </AbsoluteFill>
  );
};

const Beams: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.35 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', left: 540 - 60, top: -400, width: 120, height: 2600, transformOrigin: '60px 0px',
          transform: `rotate(${-25 + i * 25 + Math.sin(f / (60 + i * 17)) * 8}deg)`,
          background: 'linear-gradient(180deg, rgba(246,213,142,0.35), rgba(246,213,142,0) 60%)', filter: 'blur(30px)' }} />
      ))}
    </AbsoluteFill>
  );
};

const Dust: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({ length: 60 }).map((_, i) => {
        const x = random(`x${i}`) * 1080 + Math.sin(f / 40 + i) * 12;
        const y0 = random(`y${i}`) * 2100 - f * (0.5 + random(`s${i}`) * 1.4);
        const y = ((y0 % 2100) + 2100) % 2100;
        const r = 1.5 + random(`r${i}`) * 4;
        const tw = 0.25 + 0.6 * Math.abs(Math.sin(f / 22 + i));
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: 99, background: GOLD_SOFT, opacity: tw * 0.55, boxShadow: `0 0 ${r * 4}px ${GOLD}` }} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------- motion pieces ---------- */

/** Scene wrapper: zooms in through blur, drifts, zooms out through blur. */
export const Scene: React.FC<{ dur: number; children: React.ReactNode; drift?: number }> = ({ dur, children, drift = 1 }) => {
  const f = useCurrentFrame();
  const inP = io(f, 0, 12);
  const outP = io(f, dur - 7, dur, 0, 1, Easing.in(Easing.cubic));
  const push = 1 + (f / dur) * 0.05 * drift;
  return (
    <AbsoluteFill style={{
      opacity: Math.min(1, inP * 1.4) * (1 - outP),
      transform: `scale(${(1.25 - 0.25 * inP) * push * (1 + outP * 0.35)}) rotate(${(1 - inP) * -3 + outP * 2}deg)`,
      filter: `blur(${(1 - inP) * 18 + outP * 16}px)`,
    }}>{children}</AbsoluteFill>
  );
};

/** White flash on a cut. */
export const Flash: React.FC<{ at: number; strength?: number }> = ({ at, strength = 0.5 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1, at, at + 7], [0, strength, 0], clamp);
  return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${GOLD_SOFT}, rgba(255,255,255,0.6) 40%, transparent 80%)`, opacity: o, mixBlendMode: 'screen', pointerEvents: 'none' }} />;
};

/** Camera shake, decays after `at`. */
export const shake = (f: number, at: number, amp = 18, dur = 12) => {
  if (f < at || f > at + dur) return { x: 0, y: 0 };
  const k = 1 - (f - at) / dur;
  return { x: Math.sin(f * 2.7) * amp * k, y: Math.cos(f * 3.3) * amp * k };
};

/** A sweeping light streak like the reference's laser traces. */
export const Streak: React.FC<{ at: number; y: number; dir?: 1 | -1; color?: string; angle?: number }> = ({ at, y, dir = 1, color = GOLD, angle = 0 }) => {
  const f = useCurrentFrame();
  const p = io(f, at, at + 16, 0, 1, Easing.inOut(Easing.cubic));
  const o = interpolate(f, [at, at + 4, at + 14, at + 22], [0, 1, 1, 0], clamp);
  const x = dir === 1 ? -900 + p * 2900 : 2000 - p * 2900;
  return <div style={{ position: 'absolute', top: y, left: x, width: 900, height: 5, borderRadius: 4, opacity: o, transform: `rotate(${angle}deg)`,
    background: `linear-gradient(${dir === 1 ? 90 : 270}deg, transparent, ${color} 80%, #fff)`, boxShadow: `0 0 24px ${color}, 0 0 70px ${color}` }} />;
};

/** Expanding ring shockwave. */
export const Shockwave: React.FC<{ at: number; x: number; y: number; color?: string; size?: number }> = ({ at, x, y, color = GOLD, size = 900 }) => {
  const f = useCurrentFrame();
  const p = io(f, at, at + 22, 0, 1, Easing.out(Easing.cubic));
  if (f < at) return null;
  return <div style={{ position: 'absolute', left: x - (size * p) / 2, top: y - (size * p) / 2, width: size * p, height: size * p, borderRadius: 9999,
    border: `${6 * (1 - p) + 1}px solid ${color}`, opacity: 1 - p, boxShadow: `0 0 40px ${color}, inset 0 0 40px ${color}` }} />;
};

/** Particle burst from a point. */
export const Burst: React.FC<{ at: number; x: number; y: number; n?: number; color?: string; spread?: number }> = ({ at, x, y, n = 26, color = GOLD_SOFT, spread = 420 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const t = (f - at) / 30;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const ang = (i / n) * Math.PI * 2 + random(`a${at}${i}`) * 0.5;
        const sp = spread * (0.5 + random(`v${at}${i}`) * 0.8);
        const d = sp * (1 - Math.exp(-t * 4));
        const o = Math.max(0, 1 - t * 1.3);
        const r = 4 + random(`r${at}${i}`) * 7;
        return <div key={i} style={{ position: 'absolute', left: x + Math.cos(ang) * d - r / 2, top: y + Math.sin(ang) * d + t * t * 120 - r / 2, width: r, height: r,
          borderRadius: 99, background: i % 3 === 0 ? '#fff' : color, opacity: o, boxShadow: `0 0 ${r * 3}px ${GOLD}` }} />;
      })}
    </>
  );
};

/** The eight-point khatam, drawn as two rotated squares. */
export const Khatam: React.FC<{ size: number; draw?: number; fill?: number; glow?: boolean }> = ({ size, draw = 1, fill = 0, glow = true }) => {
  const len = 4 * 56;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', filter: glow ? `drop-shadow(0 0 ${size * 0.08}px ${GOLD})` : undefined }}>
      <defs>
        <linearGradient id="rib" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={CRIMSON} /><stop offset="35%" stopColor={COPPER} /><stop offset="65%" stopColor={GOLD} /><stop offset="100%" stopColor={TEAL} />
        </linearGradient>
      </defs>
      {[0, 45].map((rot) => (
        <rect key={rot} x="22" y="22" width="56" height="56" rx="3" fill={`rgba(229,169,60,${fill * 0.25})`} stroke="url(#rib)" strokeWidth="3"
          strokeDasharray={len} strokeDashoffset={len * (1 - draw)} transform={`rotate(${rot} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="9" fill="none" stroke={GOLD} strokeWidth="2" opacity={draw} />
    </svg>
  );
};

/** A glowing path that draws itself. */
export const GlowLine: React.FC<{ d: string; progress: number; color?: string; width?: number }> = ({ d, progress, color = GOLD, width = 6 }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - progress}
      style={{ filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 26px ${color})` }} />
  </svg>
);

/** Text with the ribbon gradient fill. */
export const ribbonText: React.CSSProperties = { background: RIBBON, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

/** Small glass label. */
export const Chip: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 28px', borderRadius: 999, fontFamily: SANS, fontWeight: 700, fontSize: 34, color: PAPER, ...glass, ...style }}>{children}</div>
);
