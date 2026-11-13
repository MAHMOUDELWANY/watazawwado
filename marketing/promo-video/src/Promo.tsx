import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame } from 'remotion';
import {
  Backdrop, Burst, clamp, COPPER, CRIMSON, Flash, FPS, glass, GOLD, GOLD_SOFT, io, Khatam, PAPER, pulse, RIBBON, ribbonText,
  SANS, SERIF, Sfx, shake, Shockwave, Streak, TEAL, TEAL_DEEP,
} from './kit';
import { Captions, fr, wf } from './captions';

export const INK = '#12100E';
export const MUTED = '#453D34';
const TOTAL_SEC = 82.5;
export const TOTAL = fr(TOTAL_SEC);

// Scene starts follow the voice-over (seconds -> frames).
const S = {
  hook: 0, rehook: fr(5.7), p1q: fr(10.6), p1logo: fr(15.9), p1story: fr(19.5), p1ver: fr(22.8),
  p2q: fr(26.7), p2bento: fr(31.1), p3q: fr(42.9), p3place: fr(46.1), p3report: fr(50.1),
  p4q: fr(56.0), p4teacher: fr(58.9), p4time: fr(62.5), p4dev: fr(64.5), p5drama: fr(67.3), p5hint: fr(68.35), cta: fr(74.5),
};
const ORDER = Object.entries(S).sort((a, b) => a[1] - b[1]);
const dur = (k: keyof typeof S) => { const i = ORDER.findIndex(([n]) => n === k); return (i < ORDER.length - 1 ? ORDER[i + 1][1] : TOTAL) - S[k]; };
const isDark = (f: number) => f < S.p1q || (f >= S.p5drama && f < S.p5hint);
const rel = (frame: number, k: keyof typeof S) => frame - S[k];

export const glassLight: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(255,255,255,0.86), rgba(255,255,255,0.62))',
  border: '1.5px solid rgba(139,73,53,0.16)',
  boxShadow: '0 40px 90px rgba(139,73,53,0.18), 0 8px 24px rgba(139,73,53,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
  backdropFilter: 'blur(18px)',
};

/* ================= worlds ================= */

/** The site's paper world: warm paper, slow colour blooms, a faint khatam lattice. */
export const PaperWorld: React.FC = () => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 80), b = Math.cos(f / 110);
  return (
    <AbsoluteFill style={{ background: PAPER, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(50% 32% at ${22 + a * 10}% ${18 + b * 6}%, rgba(18,164,188,0.20), transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(55% 34% at ${80 - a * 10}% ${70 + b * 8}%, rgba(218,121,96,0.22), transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(40% 25% at ${55 + b * 12}% ${45 + a * 8}%, rgba(229,169,60,0.16), transparent 70%)` }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: 0.07 }}>
        <defs>
          <pattern id="lattice" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform={`translate(${(f * 0.4) % 120} ${(f * 0.25) % 120})`}>
            <rect x="35" y="35" width="50" height="50" fill="none" stroke="#8B4935" strokeWidth="2" />
            <rect x="35" y="35" width="50" height="50" fill="none" stroke="#8B4935" strokeWidth="2" transform="rotate(45 60 60)" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#lattice)" />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(130% 90% at 50% 45%, transparent 60%, rgba(139,73,53,0.18))' }} />
    </AbsoluteFill>
  );
};

/** Cross-fades between the dark cinema and the paper world. */
const Worlds: React.FC = () => {
  const f = useCurrentFrame();
  const toLight1 = io(f, S.p1q - 6, S.p1q + 4);
  const toDark = io(f, S.p5drama - 4, S.p5drama + 4);
  const toLight2 = io(f, S.p5hint - 4, S.p5hint + 6);
  const light = toLight1 * (1 - toDark) + toLight2;
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ opacity: Math.min(1, light) }}><PaperWorld /></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ================= shared pieces ================= */

/** Camera rig: perspective + orbit/dolly between two poses over the scene. */
export const Cam: React.FC<{ d: number; from?: [number, number, number]; to?: [number, number, number]; children: React.ReactNode; shakeAt?: number }> = ({ d, from = [0, 0, 1], to = [0, 0, 1.06], children, shakeAt }) => {
  const f = useCurrentFrame();
  const p = io(f, 0, d, 0, 1, Easing.inOut(Easing.sin));
  const rx = from[0] + (to[0] - from[0]) * p, ry = from[1] + (to[1] - from[1]) * p, s = from[2] + (to[2] - from[2]) * p;
  const sh = shakeAt !== undefined ? shake(f, shakeAt, 22, 12) : { x: 0, y: 0 };
  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <AbsoluteFill style={{ transformStyle: 'preserve-3d', transform: `translate(${sh.x}px, ${sh.y}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Scene wrapper: whip in through blur, whip out. */
export const Scene: React.FC<{ d: number; children: React.ReactNode; instant?: boolean }> = ({ d, children, instant }) => {
  const f = useCurrentFrame();
  const i = instant ? 1 : io(f, 0, 10), o = io(f, d - 6, d, 0, 1, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, i * 1.5) * (1 - o), transform: `translateY(${(1 - i) * 90 - o * 90}px) scale(${1.12 - 0.12 * i + o * 0.2})`, filter: `blur(${(1 - i) * 14 + o * 14}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

export const sp = (f: number, at: number, damping = 12, mass = 0.8) => spring({ frame: f - at, fps: FPS, config: { damping, mass } });

/** Text with a filled highlight box that grows behind a phrase (inspired by kinetic "box" type). */
const BoxLine: React.FC<{ pre?: string; box: string; post?: string; at: number; top: number; size?: number; dark?: boolean; boxColor?: string }> = ({ pre, box, post, at, top, size = 78, dark, boxColor }) => {
  const f = useCurrentFrame();
  const t = io(f, at, at + 12);
  const b = io(f, at + 6, at + 18, 0, 1, Easing.out(Easing.cubic));
  const color = dark ? PAPER : INK;
  return (
    <div style={{ position: 'absolute', top, left: 40, right: 40, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.25, color, opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>
      {pre && <span>{pre} </span>}
      <span style={{ position: 'relative', display: 'inline-block', padding: '0 18px' }}>
        <span style={{ position: 'absolute', left: 0, top: '8%', bottom: '4%', width: `${b * 100}%`, background: boxColor ?? (dark ? GOLD : INK), borderRadius: 12 }} />
        <span style={{ position: 'relative', color: b > 0.5 ? (dark ? INK : PAPER) : color }}>{box}</span>
      </span>
      {post && <span> {post}</span>}
    </div>
  );
};

/** The chapter numeral: slams in huge, then settles as the question rises. */
const Chapter: React.FC<{ n: number; d: number; children?: React.ReactNode }> = ({ n, d, children }) => {
  const f = useCurrentFrame();
  const s = sp(f, 0, 10, 0.9);
  const settle = io(f, 16, 34, 0, 1, Easing.inOut(Easing.cubic));
  const scale = interpolate(s, [0, 1], [3.2, 1]) * (1 - settle * 0.55);
  return (
    <Scene d={d}>
      <Cam d={d} from={[6, -10, 1.02]} to={[-2, 8, 1.08]}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 230 - settle * 60, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 760, lineHeight: 1,
          transform: `scale(${scale})`, filter: `blur(${(1 - s) * 18}px) drop-shadow(0 30px 60px rgba(139,73,53,0.25))`, opacity: Math.min(1, s * 1.4), ...ribbonText }}>{n}</div>
        <Shockwave at={4} x={540} y={620} color={GOLD} size={1400} />
        {children}
      </Cam>
    </Scene>
  );
};

/* ================= 0 · hook (dark) ================= */

export const Cursor: React.FC<{ x: number; y: number; press?: number }> = ({ x, y, press = 0 }) => (
  <svg width={70} height={84} viewBox="0 0 70 84" style={{ position: 'absolute', left: x, top: y, transform: `scale(${1 - press * 0.15})`, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))' }}>
    <path d="M6 4 L6 66 L22 52 L34 78 L46 72 L34 47 L56 47 Z" fill="#fff" stroke="#12100E" strokeWidth="4" strokeLinejoin="round" />
  </svg>
);

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('hook');
  const card = Math.min(1, 0.85 + 0.15 * sp(f, 0, 14));
  const swap = f >= rel(wf('Arabic'), 'hook');
  const tCheck = rel(wf('check'), 'hook');
  const cx = interpolate(f, [8, tCheck], [900, 610], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(f, [8, tCheck], [1400, 1012], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const freeze = io(f, tCheck, tCheck + 8);
  const tFive = rel(wf('five', 0), 'hook');
  return (
    <Scene d={d} instant>
      <Cam d={d} from={[8, -14, 0.98]} to={[2, 6, 1.04]}>
        <div style={{ position: 'absolute', left: 120, right: 120, top: 520, height: 600, borderRadius: 44, padding: 50, ...glass, opacity: card,
          transform: `translateY(${(1 - card) * 300}px) rotateX(${(1 - card) * 30}deg)`, filter: `grayscale(${freeze * 0.8}) brightness(${1 - freeze * 0.35})` }}>
          <div style={{ fontFamily: SANS, fontSize: 30, color: GOLD_SOFT, letterSpacing: 4 }}>CHECKOUT</div>
          <div style={{ marginTop: 18, fontFamily: SERIF, fontWeight: 700, fontSize: 64, color: PAPER, lineHeight: 1.15 }}>
            Online <span style={{ display: 'inline-block', padding: '0 14px', borderRadius: 12, background: swap ? TEAL_DEEP : CRIMSON, transform: `scale(${1 + 0.12 * pulse(f, rel(wf('Arabic'), 'hook'), 8)})` }}>{swap ? 'Arabic' : 'Quran'}</span><br />class
          </div>
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontSize: 36, color: 'rgba(250,247,242,0.6)' }}>
            <span>Monthly plan</span><span style={{ filter: 'blur(9px)', color: PAPER }}>$ 00.00</span>
          </div>
          <div style={{ position: 'absolute', left: 50, right: 50, bottom: 50, height: 110, borderRadius: 999, background: CRIMSON, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: SANS, fontWeight: 700, fontSize: 46, color: '#fff', boxShadow: '0 20px 50px rgba(197,31,36,0.45)' }}>Pay now</div>
        </div>
        <Cursor x={cx} y={cy} />
        {[0, 1, 2, 3, 4].map((i) => {
          const s = sp(f, tFive + i * 3, 11);
          return (
            <div key={i} style={{ position: 'absolute', left: 150, right: 150, top: 440 + i * 128, height: 104, borderRadius: 26, ...glass, display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px',
              opacity: Math.min(1, s), transform: `translateY(${(1 - s) * -400}px) rotateX(${(1 - s) * -50}deg)` }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, border: `3px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: GOLD }}>{i + 1}</div>
              <div style={{ height: 18, width: 360 - i * 30, borderRadius: 99, background: 'rgba(250,247,242,0.18)' }} />
            </div>
          );
        })}
      </Cam>
      <Streak at={tFive} y={360} />
    </Scene>
  );
};

/* ================= 0b · re-hook: "number five" ================= */

const Rehook: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('rehook');
  const tFive = rel(wf('five', 1), 'rehook');
  const focus = io(f, tFive - 6, tFive + 14, 0, 1, Easing.inOut(Easing.cubic));
  const tNever = rel(wf('never'), 'rehook');
  const glitch = f > tNever ? Math.abs(Math.sin(f * 9.1)) : 0;
  return (
    <Scene d={d}>
      <Cam d={d} from={[0, 0, 1]} to={[4, -6, 1.1]}>
        <AbsoluteFill style={{ transform: `translateY(${-focus * 260}px) scale(${1 + focus * 0.45})` }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const five = i === 4;
            return (
              <div key={i} style={{ position: 'absolute', left: 150, right: 150, top: 440 + i * 128, height: 104, borderRadius: 26, ...glass, display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px',
                filter: five ? 'none' : `blur(${focus * 10}px)`, opacity: five ? 1 : 1 - focus * 0.6,
                borderColor: five ? GOLD : undefined, boxShadow: five ? `0 0 ${40 + 40 * focus}px rgba(229,169,60,0.6)` : undefined }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, border: `3px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: GOLD }}>{i + 1}</div>
                {five
                  ? <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 64, ...ribbonText, transform: `scale(${1 + 0.15 * Math.sin(f / 5)})` }}>???</div>
                  : <div style={{ height: 18, width: 360 - i * 30, borderRadius: 99, background: 'rgba(250,247,242,0.18)' }} />}
              </div>
            );
          })}
        </AbsoluteFill>
      </Cam>
      {glitch > 0.5 && <AbsoluteFill style={{ background: `linear-gradient(0deg, transparent ${30 + glitch * 30}%, rgba(18,164,188,0.3) ${30 + glitch * 30}%, rgba(197,31,36,0.3) ${36 + glitch * 30}%, transparent ${36 + glitch * 30}%)`, mixBlendMode: 'screen' }} />}
      <Flash at={d - 4} strength={0.9} />
    </Scene>
  );
};

/* ================= 1 · curriculum ================= */

const Icon: React.FC<{ kind: 'book' | 'person'; x: number; y: number; s: number }> = ({ kind, x, y, s }) => (
  <svg width={190} height={190} viewBox="0 0 100 100" style={{ position: 'absolute', left: x, top: y, transform: `scale(${s})`, opacity: Math.min(1, s) }}>
    {kind === 'book'
      ? <path d="M15 22 Q35 14 50 24 Q65 14 85 22 V80 Q65 72 50 82 Q35 72 15 80 Z M50 24 V82" fill="none" stroke={MUTED} strokeWidth="4" strokeLinejoin="round" />
      : <><circle cx="50" cy="32" r="14" fill="none" stroke={MUTED} strokeWidth="4" /><path d="M22 84 Q22 56 50 56 Q78 56 78 84" fill="none" stroke={MUTED} strokeWidth="4" /></>}
  </svg>
);

const P1Q: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p1q');
  const tT = rel(wf('teacher', 0), 'p1q'), tB = rel(wf('book', 0), 'p1q');
  const wipe = io(f, d - 14, d - 2);
  return (
    <Chapter n={1} d={d}>
      <BoxLine pre="Is there a real" box="curriculum?" at={rel(wf('real'), 'p1q') - 6} top={760} size={84} />
      <div style={{ opacity: 1 - wipe, filter: `grayscale(1) blur(${wipe * 8}px)` }}>
        <Icon kind="person" x={290} y={1000} s={sp(f, tT, 12)} />
        <div style={{ position: 'absolute', left: 500, top: 1060, fontFamily: SERIF, fontSize: 70, color: MUTED, opacity: io(f, tT + 4, tT + 10) }}>+</div>
        <Icon kind="book" x={600} y={1000} s={sp(f, tB, 12)} />
      </div>
      <div style={{ position: 'absolute', top: 1110, left: -200 + wipe * 1500, width: 260, height: 8, borderRadius: 8, background: RIBBON, boxShadow: `0 0 30px ${GOLD}`, opacity: wipe > 0 && wipe < 1 ? 1 : 0 }} />
    </Chapter>
  );
};

const P1Logo: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p1logo');
  const sweep = io(f, 0, 18, 0, 1, Easing.inOut(Easing.cubic));
  const logo = sp(f, 4, 13);
  const tZad = rel(wf('Zad'), 'p1logo');
  const zad = sp(f, tZad, 12);
  const stamp = sp(f, rel(wf('own'), 'p1logo'), 7);
  return (
    <Scene d={d}>
      <Cam d={d} from={[-6, 12, 1]} to={[2, -6, 1.05]}>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          <defs><linearGradient id="rbn"><stop offset="0" stopColor={CRIMSON} /><stop offset="0.5" stopColor={GOLD} /><stop offset="1" stopColor={TEAL} /></linearGradient></defs>
          <path d="M-40 760 C 260 440, 820 1080, 1120 700" fill="none" stroke="url(#rbn)" strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - sweep} />
        </svg>
        <div style={{ position: 'absolute', left: 540 - 330, top: 330, width: 660, transform: `scale(${0.6 + 0.4 * logo}) rotate(${(1 - logo) * -8}deg)`, opacity: Math.min(1, logo),
          clipPath: `inset(0 ${100 - io(f, 4, 20) * 100}% 0 0)`, filter: 'drop-shadow(0 30px 40px rgba(139,73,53,0.25))' }}>
          <Img src={staticFile('img/logo-clean.png')} style={{ width: '100%' }} />
        </div>
        <div style={{ position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 120, letterSpacing: -2, ...ribbonText, opacity: io(f, 8, 18) }}>Watazawwado</div>
        <div style={{ position: 'absolute', top: 930, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - zad) * 60}px)`, opacity: Math.min(1, zad) }}>
          <div style={{ padding: '18px 38px', borderRadius: 999, ...glassLight, fontFamily: SERIF, fontWeight: 700, fontSize: 52, color: INK }}>Zad Path <span style={{ color: COPPER }}>·</span> مسار الأثر</div>
        </div>
        <div style={{ position: 'absolute', top: 1080, left: 600, transform: `scale(${2.4 - 1.4 * stamp}) rotate(-10deg)`, opacity: Math.min(1, stamp),
          padding: '14px 28px', border: `5px solid ${CRIMSON}`, borderRadius: 16, fontFamily: SANS, fontWeight: 700, fontSize: 40, color: CRIMSON, letterSpacing: 3 }}>OUR OWN</div>
      </Cam>
      <Burst at={6} x={540} y={520} n={30} spread={480} color={GOLD} />
    </Scene>
  );
};

/** A cinematic still with a slow push (the Adults lessons). */
export const Still: React.FC<{ src: string; f: number; zoom?: number; pan?: number }> = ({ src, f, zoom = 0.0025, pan = 0.5 }) => (
  <Img src={staticFile(`img/${src}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.15 + f * zoom}) translateX(${-f * pan}px)` }} />
);

const P1Story: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p1story');
  const enter = sp(f, 0, 14);
  const through = io(f, 10, 40, 0, 1, Easing.inOut(Easing.cubic));
  const tChars = rel(wf('characters'), 'p1story'), tGames = rel(wf('games'), 'p1story');
  const chars = [{ s: 'maryam-happy.webp', x: -30, y: 1060, d: 0 }, { s: 'noor-happy.webp', x: 800, y: 1020, d: 3 }, { s: 'yusuf-point.webp', x: -40, y: 300, d: 6 }, { s: 'jiddo-explain.webp', x: 790, y: 280, d: 9 }];
  return (
    <Scene d={d}>
      <Cam d={d} from={[0, -24, 1]} to={[0, 18, 1.04]}>
        <div style={{ position: 'absolute', left: 90, right: 90, top: 400, height: 1000, borderRadius: 48, overflow: 'hidden', transform: `translateZ(${(1 - enter) * -900}px)`,
          boxShadow: '0 50px 120px rgba(139,73,53,0.35)', border: '3px solid rgba(255,255,255,0.8)' }}>
          <AbsoluteFill style={{ opacity: 1 - through }}><Img src={staticFile('img/adults-doorway.webp')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 + through * 1.8})`, transformOrigin: '62% 55%' }} /></AbsoluteFill>
          <AbsoluteFill style={{ opacity: through }}><Still src="adults-madinah.webp" f={f} /></AbsoluteFill>
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(12,9,7,0.85))' }} />
          <div style={{ position: 'absolute', left: 50, bottom: 60, fontFamily: SANS, color: GOLD_SOFT, fontSize: 30, letterSpacing: 3 }}>ZAD ESSENTIALS · ADULTS · LESSON 1</div>
          <div style={{ position: 'absolute', left: 50, bottom: 110, fontFamily: SERIF, fontWeight: 700, color: PAPER, fontSize: 70 }}>The Man No One Knew</div>
        </div>
        {chars.map((c) => {
          const s = sp(f, tChars + c.d, 9, 0.7);
          return <Img key={c.s} src={staticFile(`img/${c.s}`)} style={{ position: 'absolute', left: c.x, top: c.y + Math.sin((f + c.d * 7) / 10) * 10, width: 330, opacity: Math.min(1, s),
            transform: `scale(${s}) rotate(${(1 - s) * 25}deg) translateZ(120px)`, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.35))' }} />;
        })}
        {['Islam', 'Iman', 'Ihsan'].map((t, i) => {
          const s = sp(f, tGames + i * 3, 10);
          return <div key={t} style={{ position: 'absolute', left: 170 + i * 260, top: 960, padding: '16px 30px', borderRadius: 18, background: TEAL_DEEP, color: '#fff', fontFamily: SANS, fontWeight: 700, fontSize: 38,
            transform: `scale(${s}) translateZ(160px)`, opacity: Math.min(1, s), boxShadow: '0 0 40px rgba(18,164,188,0.6)' }}>✓ {t}</div>;
        })}
      </Cam>
    </Scene>
  );
};

const P1Versions: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p1ver');
  const cards = [
    { k: 'kids', label: 'Kids', age: '6–11', src: 'kids-doors.webp', rot: -14, x: -330 },
    { k: 'teens', label: 'Teens', age: '12–17', src: 'teens-stars.webp', rot: 0, x: 0 },
    { k: 'adults', label: 'Adults', age: '18+', src: 'adults-cover.webp', rot: 14, x: 330 },
  ];
  return (
    <Scene d={d}>
      <Cam d={d} from={[10, -18, 0.96]} to={[4, 14, 1.04]}>
        <div style={{ position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: INK, opacity: io(f, 0, 10) }}>
          <span style={ribbonText}>3</span> versions, one path
        </div>
        {cards.map((c) => {
          const s = sp(f, rel(wf(c.k), 'p1ver') - 4, 11);
          return (
            <div key={c.k} style={{ position: 'absolute', left: 540 - 170 + c.x, top: 520, width: 340, height: 600, borderRadius: '170px 170px 34px 34px', overflow: 'hidden',
              transform: `translateY(${(1 - s) * 500}px) rotate(${c.rot * s}deg) translateZ(${c.x === 0 ? 80 : 0}px)`, opacity: Math.min(1, s),
              border: '4px solid #fff', boxShadow: '0 40px 80px rgba(139,73,53,0.3)' }}>
              <Img src={staticFile(`img/${c.src}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.2 + f * 0.002})` }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(12,9,7,0.85))' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 40, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 60, color: PAPER }}>{c.label}</div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center', fontFamily: SANS, fontSize: 28, color: GOLD_SOFT }}>{c.age}</div>
            </div>
          );
        })}
      </Cam>
    </Scene>
  );
};

/* ================= 2 · subjects bento ================= */

const P2Q: React.FC = () => (
  <Chapter n={2} d={dur('p2q')}>
    <BoxLine pre="Does it cover what your family" box="actually needs?" at={rel(wf('Does', 0), 'p2q') - 4} top={760} size={76} />
  </Chapter>
);

type Item = { label: string; word: string; nth?: number; note?: string };
const GROUPS: { title: string; color: string; y: number; h: number; items: Item[] }[] = [
  { title: 'Quran', color: GOLD, y: 300, h: 380, items: [{ label: 'Reading', word: 'Quran', nth: 1, note: 'to the Mushaf' }, { label: 'Tajweed', word: 'Tajweed', note: '3 levels' }, { label: 'Memorization & Revision', word: 'memorization', note: 'your goal' }] },
  { title: 'Arabic', color: CRIMSON, y: 710, h: 380, items: [{ label: 'Fusha', word: 'Fusha', note: 'conversation at every level' }, { label: 'Egyptian', word: 'Egyptian', note: 'Franco + Arabic script' }] },
  { title: 'English', color: TEAL, y: 1120, h: 250, items: [{ label: 'Kids: phonics', word: 'English' }, { label: '12+: A1 → C1', word: 'English' }] },
];

const groupStart = (g: (typeof GROUPS)[number]) => wf(g.items[0].word, g.items[0].nth ?? 0);

const P2Bento: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p2bento');
  return (
    <Scene d={d}>
      <Cam d={d} from={[8, -10, 0.98]} to={[2, 8, 1.03]}>
        {GROUPS.map((g, gi) => {
          const t0 = rel(groupStart(g), 'p2bento') - 8;
          const s = sp(f, t0, 12);
          const next = gi < GROUPS.length - 1 ? rel(groupStart(GROUPS[gi + 1]), 'p2bento') - 8 : d - 30;
          const active = f >= t0 && f < next;
          return (
            <div key={g.title} style={{ position: 'absolute', left: 60, right: 60, top: g.y, height: g.h, borderRadius: 40, ...glassLight, padding: '34px 40px', opacity: Math.min(1, s),
              transform: `translateX(${(1 - s) * (gi % 2 ? 900 : -900)}px) rotateY(${(1 - s) * (gi % 2 ? -35 : 35)}deg) scale(${active ? 1.03 : 1})`,
              boxShadow: active ? `0 30px 80px rgba(139,73,53,0.25), 0 0 0 4px ${g.color}66` : glassLight.boxShadow }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 72, color: INK, lineHeight: 1 }}><span style={{ color: g.color }}>●</span> {g.title}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 26 }}>
                {g.items.map((it) => {
                  const ti = rel(wf(it.word, it.nth ?? 0), 'p2bento') - 3;
                  const p = sp(f, ti, 10);
                  const lit = f >= ti;
                  return (
                    <div key={it.label} style={{ padding: '14px 26px', borderRadius: 22, background: lit ? g.color : 'rgba(139,73,53,0.08)', color: lit ? (g.color === GOLD ? INK : '#fff') : MUTED,
                      transform: `scale(${0.85 + 0.15 * Math.min(1, p)})`, opacity: 0.35 + 0.65 * Math.min(1, p), fontFamily: SANS }}>
                      <div style={{ fontWeight: 700, fontSize: 40 }}>{it.label}</div>
                      {it.note && <div style={{ fontSize: 26, opacity: 0.85 }}>{it.note}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Cam>
    </Scene>
  );
};

/* ================= 3 · placement, report, progress ================= */

const P3Q: React.FC = () => (
  <Chapter n={3} d={dur('p3q')}>
    <BoxLine pre="Will you know what happened in" box="class?" at={rel(wf('Will'), 'p3q') - 4} top={760} size={78} />
  </Chapter>
);

const P3Place: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p3place');
  const card = sp(f, 0, 13);
  const levels = ['Foundations', 'Beginner', 'Intermediate', 'Advanced'];
  const needle = interpolate(f, [8, 40, 52], [0, 2.6, 1.15], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const tWrong = rel(wf('wrong'), 'p3place');
  const paper = sp(f, tWrong - 26, 14);
  return (
    <Scene d={d}>
      <Cam d={d} from={[12, 10, 0.98]} to={[4, -10, 1.04]}>
        <div style={{ position: 'absolute', left: 90, right: 90, top: 300, height: 520, borderRadius: 40, ...glassLight, padding: 44, transform: `translateY(${(1 - card) * 400}px)`, opacity: Math.min(1, card) }}>
          <div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: 3, color: COPPER, fontWeight: 700 }}>PLACEMENT TEST</div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 56, color: INK, marginTop: 8 }}>Finding your level…</div>
          <div style={{ position: 'relative', marginTop: 70, height: 26, borderRadius: 99, background: 'rgba(139,73,53,0.12)' }}>
            <div style={{ width: `${(needle / 3) * 100}%`, height: '100%', borderRadius: 99, background: RIBBON }} />
            <div style={{ position: 'absolute', top: -14, left: `calc(${(needle / 3) * 100}% - 27px)`, width: 54, height: 54, borderRadius: 99, background: '#fff', border: `5px solid ${TEAL_DEEP}`, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontFamily: SANS, fontSize: 28, color: MUTED }}>
            {levels.map((l, i) => { const on = Math.round(needle) === i && f > 50; return <span key={l} style={{ fontWeight: on ? 700 : 400, color: on ? TEAL_DEEP : MUTED }}>{l}</span>; })}
          </div>
        </div>
        <div style={{ position: 'absolute', left: 170, right: 170, top: 880, height: 520, background: '#fff', borderRadius: 10, padding: 40, boxShadow: '0 30px 70px rgba(139,73,53,0.25)',
          transform: `translateY(${(1 - paper) * 520}px) rotate(${-3 + paper}deg)`, clipPath: `inset(0 0 ${(1 - Math.min(1, paper)) * 100}% 0)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 44, color: INK }}>Placement report</div>
            <Khatam size={70} fill={1} glow={false} />
          </div>
          {[0.9, 0.7, 0.8, 0.55].map((w, i) => <div key={i} style={{ marginTop: 26, height: 16, width: `${w * 100}%`, borderRadius: 99, background: 'rgba(139,73,53,0.15)' }} />)}
          <div style={{ marginTop: 34, display: 'inline-block', padding: '10px 22px', borderRadius: 12, background: TEAL_DEEP, color: '#fff', fontFamily: SANS, fontWeight: 700, fontSize: 32 }}>Level: Beginner</div>
        </div>
      </Cam>
    </Scene>
  );
};

const P3Report: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p3report');
  const n = sp(f, 2, 11);
  const rows = ['Lesson 3 · Zad Path, done', 'Tajweed: noon sakinah', 'Homework: 10 min revision'];
  const tProg = rel(wf('progress'), 'p3report');
  const big = io(f, tProg - 4, tProg + 30, 0, 72, Easing.out(Easing.cubic));
  const toProg = io(f, tProg - 10, tProg + 4, 0, 1, Easing.inOut(Easing.cubic));
  const tStage = rel(wf('stage'), 'p3report');
  return (
    <Scene d={d}>
      <Cam d={d} from={[-8, 14, 1]} to={[6, -10, 1.06]}>
        <div style={{ position: 'absolute', left: 90, right: 90, top: 330, borderRadius: 40, padding: '34px 40px', ...glassLight, opacity: Math.min(1, n) * (1 - toProg),
          transform: `translateY(${(1 - n) * -500 - toProg * 300}px) scale(${1 - toProg * 0.3})` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <Img src={staticFile('img/logo-clean.png')} style={{ width: 120 }} />
            <div style={{ fontFamily: SANS }}><div style={{ fontSize: 28, color: MUTED }}>Watazawwado · now</div><div style={{ fontSize: 40, fontWeight: 700, color: INK }}>Your lesson report is ready</div></div>
          </div>
          {rows.map((r, i) => {
            const p = io(f, 22 + i * 7, 32 + i * 7);
            return <div key={r} style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '18px 0', borderTop: '1px solid rgba(139,73,53,0.15)', opacity: p }}>
              <div style={{ width: 50, height: 50, borderRadius: 99, background: TEAL_DEEP, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, transform: `scale(${0.6 + 0.4 * p + 0.3 * pulse(f, 30 + i * 7, 6)})` }}>✓</div>
              <div style={{ fontFamily: SANS, fontSize: 36, color: INK }}>{r}</div>
            </div>;
          })}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 280, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 420, lineHeight: 1, opacity: toProg, transform: `scale(${0.7 + 0.3 * toProg})`, ...ribbonText }}>{Math.round(big)}%</div>
        <div style={{ position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 36, color: MUTED, opacity: toProg }}>Example: Tajweed, stage 2 of 3</div>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: toProg }}>
          <path d="M140 1180 C 300 1180, 330 1000, 540 1000 S 780 1180, 940 1040" fill="none" stroke={TEAL} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1"
            strokeDashoffset={1 - io(f, tStage - 4, tStage + 24)} style={{ filter: `drop-shadow(0 0 10px ${TEAL})` }} />
        </svg>
        {[[140, 1180], [540, 1000], [940, 1040]].map(([x, y], i) => {
          const s = sp(f, tStage + i * 9, 9);
          return <div key={i} style={{ position: 'absolute', left: x - 46, top: y - 46, width: 92, height: 92, borderRadius: 99, background: i < 2 ? TEAL_DEEP : '#fff', border: `4px solid ${TEAL}`,
            color: i < 2 ? '#fff' : TEAL_DEEP, fontFamily: SERIF, fontWeight: 700, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s * toProg})`, boxShadow: '0 0 30px rgba(18,164,188,0.5)' }}>{i + 1}</div>;
        })}
      </Cam>
    </Scene>
  );
};

/* ================= 4 · fits your life ================= */

const P4Q: React.FC = () => (
  <Chapter n={4} d={dur('p4q')}>
    <BoxLine pre="Does it fit your" box="life?" at={rel(wf('Does', 1), 'p4q') - 4} top={760} size={86} />
  </Chapter>
);

export const Arch: React.FC<{ x: number; label: string; sub: string; active: number; enter: number; f: number }> = ({ x, label, sub, active, enter, f }) => (
  <div style={{ position: 'absolute', top: 380, left: x, width: 400, height: 620, borderRadius: '200px 200px 36px 36px', ...glassLight, opacity: Math.min(1, enter),
    transform: `rotateY(${(1 - enter) * 80 + Math.sin(f / 18) * 4}deg) scale(${1 + active * 0.07})`, borderColor: active > 0.5 ? GOLD : undefined,
    boxShadow: `0 30px 80px rgba(139,73,53,0.2), 0 0 ${80 * active}px rgba(229,169,60,${0.6 * active})` }}>
    <div style={{ position: 'absolute', top: 36, left: 36, width: 328, height: 328, borderRadius: '164px 164px 24px 24px', background: 'radial-gradient(circle at 50% 30%, rgba(18,164,188,0.35), rgba(8,125,145,0.85))',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Khatam size={150} fill={1} /></div>
    <div style={{ position: 'absolute', top: 395, left: 10, right: 10, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 46, color: INK }}>{label}</div>
    <div style={{ position: 'absolute', top: 462, left: 10, right: 10, textAlign: 'center', fontFamily: SANS, fontSize: 32, color: COPPER }}>{sub}</div>
  </div>
);

const P4Teacher: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p4teacher');
  const a = sp(f, rel(wf('male'), 'p4teacher') - 4, 12), b = sp(f, rel(wf('female'), 'p4teacher') - 4, 12);
  const tStay = rel(wf('stays'), 'p4teacher');
  const pick = io(f, tStay - 8, tStay);
  const lock = sp(f, tStay, 7);
  return (
    <Scene d={d}>
      <Cam d={d} from={[6, -16, 1]} to={[2, 10, 1.04]}>
        <Arch x={90} label="Ustadh" sub="Male teacher" active={pick} enter={a} f={f} />
        <Arch x={590} label="Ustadha" sub="Female teacher" active={0} enter={b * (1 - pick * 0.45)} f={f} />
        <div style={{ position: 'absolute', top: 960, left: 230, width: 120, height: 120, borderRadius: 99, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${lock})`, boxShadow: `0 0 60px ${GOLD}` }}>
          <svg width="56" height="64" viewBox="0 0 50 56"><path d={`M13 24 V16 a12 12 0 0 1 24 0 V${24 - 8 * (1 - Math.min(1, lock))}`} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" /><rect x="5" y="24" width="40" height="30" rx="7" fill={INK} /></svg>
        </div>
        <Shockwave at={tStay} x={290} y={1020} size={520} />
      </Cam>
    </Scene>
  );
};

const P4Time: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p4time');
  const cities = ['London', 'Toronto', 'Sydney'];
  const settle = io(f, 4, 40, 0, 1, Easing.out(Easing.cubic));
  return (
    <Scene d={d}>
      <Cam d={d} from={[0, -12, 1]} to={[0, 12, 1.05]}>
        {cities.map((c, i) => {
          const s = sp(f, i * 4, 11);
          const ang = 150 + 1440 * (1 - settle);
          return (
            <div key={c} style={{ position: 'absolute', left: 70 + i * 330, top: 560, width: 280, textAlign: 'center', transform: `scale(${s}) translateY(${Math.sin(f / 12 + i) * 8}px)` }}>
              <div style={{ width: 250, height: 250, margin: '0 auto', borderRadius: 999, position: 'relative', ...glassLight }}>
                {Array.from({ length: 12 }).map((_, j) => <div key={j} style={{ position: 'absolute', left: 123, top: 14, width: 4, height: j % 3 ? 10 : 20, background: COPPER, transformOrigin: '2px 111px', transform: `rotate(${j * 30}deg)` }} />)}
                <div style={{ position: 'absolute', left: 121, top: 68, width: 8, height: 57, borderRadius: 8, background: INK, transformOrigin: '4px 57px', transform: `rotate(${ang}deg)` }} />
                <div style={{ position: 'absolute', left: 122, top: 40, width: 6, height: 85, borderRadius: 6, background: CRIMSON, transformOrigin: '3px 85px', transform: `rotate(${ang * 12}deg)` }} />
              </div>
              <div style={{ marginTop: 20, fontFamily: SERIF, fontWeight: 700, fontSize: 44, color: INK }}>{c}</div>
              <div style={{ fontFamily: SANS, fontSize: 32, color: TEAL_DEEP, opacity: settle }}>5:00 PM</div>
            </div>
          );
        })}
      </Cam>
    </Scene>
  );
};

/** The same Adults lesson on every device. */
export const Screen: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <Still src="adults-doorway.webp" f={f} zoom={0.003} pan={0.2} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(12,9,7,0.8))' }} />
  </AbsoluteFill>
);

const P4Devices: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p4dev');
  const ph = sp(f, rel(wf('phone'), 'p4dev') - 4, 11), tb = sp(f, rel(wf('tablet'), 'p4dev') - 4, 11), lp = sp(f, rel(wf('laptop'), 'p4dev') - 4, 11);
  return (
    <Scene d={d}>
      <Cam d={d} from={[14, -20, 0.98]} to={[6, 16, 1.04]}>
        <div style={{ position: 'absolute', left: 90, top: 380, width: 900, transform: `translateZ(${(1 - lp) * -1200}px) translateY(${(1 - lp) * 300}px)`, opacity: Math.min(1, lp) }}>
          <div style={{ height: 540, borderRadius: '26px 26px 0 0', background: '#1b1816', padding: 18, boxShadow: '0 40px 90px rgba(139,73,53,0.3)' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 10, overflow: 'hidden' }}><Screen f={f} /></div>
          </div>
          <div style={{ height: 36, margin: '0 -50px', borderRadius: '0 0 30px 30px', background: 'linear-gradient(180deg, #d8d2ca, #a9a29a)' }} />
        </div>
        <div style={{ position: 'absolute', left: 30, top: 720, width: 380, height: 500, borderRadius: 36, background: '#1b1816', padding: 16, transform: `rotate(-8deg) translateX(${(1 - tb) * -600}px) translateZ(140px)`, opacity: Math.min(1, tb), boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden' }}><Screen f={f + 20} /></div>
        </div>
        <div style={{ position: 'absolute', left: 710, top: 700, width: 280, height: 560, borderRadius: 50, background: '#1b1816', padding: 12, transform: `rotate(9deg) translateY(${(1 - ph) * 700}px) translateZ(220px)`, opacity: Math.min(1, ph), boxShadow: '0 40px 80px rgba(0,0,0,0.35)' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 40, overflow: 'hidden' }}><Screen f={f + 40} /></div>
        </div>
      </Cam>
    </Scene>
  );
};

/* ================= 5 · the price (dark) ================= */

const P5Drama: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p5drama');
  const five = sp(f, 0, 8, 0.9);
  return (
    <Scene d={d}>
      <Cam d={d} from={[0, 0, 1]} to={[2, -4, 1.06]}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 760, lineHeight: 1, opacity: Math.min(1, five),
          transform: `scale(${interpolate(five, [0, 1], [3, 1])})`, filter: `blur(${(1 - five) * 16}px) drop-shadow(0 0 60px rgba(229,169,60,0.6))`, ...ribbonText }}>5</div>
        <Shockwave at={2} x={540} y={740} size={1500} />
        <Burst at={2} x={540} y={740} n={40} spread={620} />
      </Cam>
      <Flash at={2} strength={0.5} />
    </Scene>
  );
};

const HintCard: React.FC<{ at: number; i: number; title: string; sub: string; children: React.ReactNode; f: number }> = ({ at, i, title, sub, children, f }) => {
  const s = sp(f, at, 11);
  const sweep = ((f - at) * 4) % 200 - 30;
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top: 370 + i * 320, height: 280, borderRadius: 40, ...glassLight, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 34, padding: '0 44px',
      transform: `translateX(${(1 - s) * (i % 2 ? 900 : -900)}px) rotateY(${(1 - s) * (i % 2 ? -40 : 40)}deg) rotateZ(${(i - 1) * 2}deg)`, opacity: Math.min(1, s) }}>
      <div style={{ position: 'relative', width: 170, height: 170, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
      <div><div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: 3, color: COPPER, fontWeight: 700 }}>{sub}</div><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 54, color: INK, lineHeight: 1.1 }}>{title}</div></div>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(110deg, transparent ${sweep}%, rgba(255,255,255,0.7) ${sweep + 6}%, transparent ${sweep + 12}%)` }} />
    </div>
  );
};

const P5Hint: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('p5hint');
  const t1 = rel(wf('siblings'), 'p5hint') - 4, t2 = rel(wf('Inviting'), 'p5hint') - 4, t3 = rel(wf('codes'), 'p5hint') - 6;
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const code = Array.from({ length: 6 }).map((_, i) => chars[Math.floor(random(`c${i}${Math.floor(f / 2)}`) * chars.length)]).join('');
  const hint = sp(f, 0, 9);
  return (
    <Scene d={d}>
      <Cam d={d} from={[10, -12, 0.98]} to={[2, 10, 1.03]}>
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 76, color: INK, transform: `scale(${hint})` }}>
          families <span style={ribbonText}>save</span>
        </div>
        <HintCard at={t1} i={0} title="Family discount" sub="SIBLINGS" f={f}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 150, ...ribbonText }}>%</div>
        </HintCard>
        <HintCard at={t2} i={1} title="Credit for you both" sub="INVITE A FRIEND" f={f}>
          {[0, 1, 2].map((k) => <div key={k} style={{ position: 'absolute', width: 110, height: 110, borderRadius: 99, background: `radial-gradient(circle at 35% 30%, #fff8, ${GOLD} 50%, #B9782A)`, boxShadow: `0 0 30px ${GOLD}`,
            transform: `translate(${(k - 1) * 34}px, ${-((f - t2 - k * 4) > 0 ? Math.abs(Math.sin((f - t2 - k * 4) / 6)) * 40 : 0)}px) rotateY(${f * 10 + k * 40}deg)` }} />)}
        </HintCard>
        <HintCard at={t3} i={2} title={f > t3 + 30 ? '• • • • • •' : code} sub="CODES · NOW AND THEN" f={f}>
          <svg width="160" height="110" viewBox="0 0 160 110"><path d="M10 10 H150 V40 A15 15 0 0 0 150 70 V100 H10 V70 A15 15 0 0 0 10 40 Z" fill={CRIMSON} /><text x="80" y="66" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="30" fill="#fff">CODE</text></svg>
        </HintCard>
      </Cam>
    </Scene>
  );
};

/* ================= CTA: link in bio -> the site ================= */

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('cta');
  const card = sp(f, 0, 13);
  const tLink = rel(wf('link'), 'cta');
  const tap = pulse(f, tLink + 6, 8);
  const cx = interpolate(f, [4, tLink + 4], [980, 640], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(f, [4, tLink + 4], [1500, 1035], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const open = io(f, tLink + 14, tLink + 34, 0, 1, Easing.inOut(Easing.cubic));
  const tBook = rel(wf('book', 1), 'cta');
  const btn = 1 + (f > tBook ? 0.06 * Math.sin((f - tBook) / 4) : 0);
  const end = io(f, d - 60, d - 40);
  return (
    <Scene d={d + 6}>
      <Cam d={d} from={[6, -10, 1]} to={[0, 6, 1.04]}>
        <div style={{ position: 'absolute', left: 110, right: 110, top: 560, height: 560, borderRadius: 48, ...glassLight, padding: 50, transform: `translateY(${(1 - card) * 500}px) scale(${1 - open * 0.15})`, opacity: Math.min(1, card) * (1 - open),
          display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 200, height: 200, borderRadius: 999, background: PAPER, border: `5px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(139,73,53,0.2)' }}>
            <Img src={staticFile('img/logo-clean.png')} style={{ width: 160 }} />
          </div>
          <div style={{ marginTop: 26, fontFamily: SERIF, fontWeight: 700, fontSize: 60, color: INK }}>Watazawwado</div>
          <div style={{ fontFamily: SANS, fontSize: 32, color: MUTED }}>Online Quran, Islamic studies & Arabic</div>
          <div style={{ marginTop: 34, padding: '22px 60px', borderRadius: 999, background: INK, color: PAPER, fontFamily: SANS, fontWeight: 700, fontSize: 40, transform: `scale(${1 - tap * 0.08})`,
            boxShadow: `0 0 0 ${tap * 30}px rgba(229,169,60,${0.35 * tap})` }}>Link in bio</div>
        </div>
        {open < 0.5 && <Cursor x={cx} y={cy} press={tap} />}
        <div style={{ position: 'absolute', left: 265, top: 250, width: 550, height: 1080, borderRadius: 66, background: '#1b1816', padding: 14, transform: `scale(${0.3 + 0.7 * open}) translateY(${(1 - open) * 600}px)`,
          opacity: open * (1 - end), boxShadow: '0 60px 120px rgba(139,73,53,0.35)' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 58, overflow: 'hidden', background: PAPER }}>
            <AbsoluteFill style={{ background: 'radial-gradient(60% 40% at 30% 20%, rgba(18,164,188,0.25), transparent 70%), radial-gradient(60% 40% at 80% 70%, rgba(218,121,96,0.25), transparent 70%)' }} />
            <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 22, color: MUTED }}>watazawwado.academy</div>
            <Img src={staticFile('img/logo-clean.png')} style={{ position: 'absolute', top: 120, left: 150, width: 270 }} />
            <div style={{ position: 'absolute', top: 330, left: 40, right: 40, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 58, color: INK, lineHeight: 1.15 }}>Your first lesson<br /><span style={ribbonText}>is free</span></div>
            {['30 minutes, free', 'No card needed', 'Choose a male or female teacher'].map((t, i) => (
              <div key={t} style={{ position: 'absolute', top: 520 + i * 70, left: 50, right: 60, fontFamily: SANS, fontSize: 30, color: INK, opacity: io(f, tLink + 30 + i * 5, tLink + 40 + i * 5) }}>
                <span style={{ color: TEAL_DEEP, fontWeight: 700 }}>✓</span> {t}
              </div>
            ))}
            <div style={{ position: 'absolute', left: 50, right: 50, bottom: 110, height: 110, borderRadius: 999, background: CRIMSON, color: '#fff', fontFamily: SANS, fontWeight: 700, fontSize: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${btn})`, boxShadow: '0 20px 50px rgba(197,31,36,0.4)' }}>Book your free trial</div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: end, transform: `scale(${0.85 + 0.15 * end})` }}>
          <Img src={staticFile('img/logo-clean.png')} style={{ width: 620 }} />
          <div style={{ marginTop: 20, fontFamily: SERIF, fontWeight: 700, fontSize: 110, ...ribbonText }}>Watazawwado</div>
          <div style={{ marginTop: 14, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: INK }}>watazawwado.academy · link in bio</div>
        </div>
      </Cam>
      <Burst at={tLink + 6} x={660} y={1040} n={20} spread={260} color={GOLD} />
    </Scene>
  );
};

/* ================= HUD: 1/5 progress ================= */

const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const starts = [S.p1q, S.p2q, S.p3q, S.p4q, S.p5drama];
  const show = io(f, S.p1q, S.p1q + 10) * (1 - io(f, S.cta, S.cta + 10));
  if (show <= 0) return null;
  const cur = starts.filter((s) => f >= s).length;
  const dk = isDark(f);
  return (
    <div style={{ position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: show }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 26px', borderRadius: 999, ...(dk ? glass : glassLight) }}>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 36, color: dk ? PAPER : INK }}>{cur}<span style={{ opacity: 0.4 }}>/5</span></span>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = io(f, starts[i], starts[i] + 12);
          return <div key={i} style={{ width: 54, height: 10, borderRadius: 99, background: dk ? 'rgba(250,247,242,0.2)' : 'rgba(18,16,14,0.12)', overflow: 'hidden' }}>
            <div style={{ width: `${fill * 100}%`, height: '100%', background: i === 4 ? `linear-gradient(90deg, ${GOLD}, ${CRIMSON})` : RIBBON }} />
          </div>;
        })}
      </div>
    </div>
  );
};

/* ================= timeline + sound ================= */

export const Promo: React.FC = () => {
  const scenes: [keyof typeof S, React.ReactNode][] = [
    ['hook', <Hook />], ['rehook', <Rehook />], ['p1q', <P1Q />], ['p1logo', <P1Logo />], ['p1story', <P1Story />], ['p1ver', <P1Versions />],
    ['p2q', <P2Q />], ['p2bento', <P2Bento />], ['p3q', <P3Q />], ['p3place', <P3Place />], ['p3report', <P3Report />],
    ['p4q', <P4Q />], ['p4teacher', <P4Teacher />], ['p4time', <P4Time />], ['p4dev', <P4Devices />], ['p5drama', <P5Drama />], ['p5hint', <P5Hint />], ['cta', <Cta />],
  ];
  const cuts = ORDER.map(([, v]) => v).filter((v) => v > 0);
  const chapters = [S.p1q, S.p2q, S.p3q, S.p4q];
  return (
    <AbsoluteFill style={{ background: '#090706' }}>
      <Worlds />
      {scenes.map(([k, node]) => <Sequence key={k} from={S[k]} durationInFrames={dur(k)}>{node}</Sequence>)}
      <Hud />
      <Captions dark={isDark} />

      <Sequence from={fr(0)} layout="none"><Audio src={staticFile('vo-full.mp3')} /></Sequence>

      {/* Restrained sound (ad reviewer, 2026-10-24): one soft whoosh per cut, heavier hits only on the logo and the numbers, silence before "five". */}
      {cuts.filter((c) => !chapters.includes(c) && c !== S.p5drama).map((c) => <Sfx key={c} at={c - 4} src="wv/fast-whoosh.wav" volume={0.55} />)}
      {chapters.map((c) => (
        <React.Fragment key={c}>
          <Sfx at={c - 5} src="wv/swish-whoosh-large.wav" volume={0.35} />
          <Sfx at={c + 2} src="el/slam.mp3" volume={0.55} />
        </React.Fragment>
      ))}
      {/* hook */}
      <Sfx at={0} src="wv/deep-whoosh.wav" volume={0.25} />
      <Sfx at={wf('Arabic') - 1} src="wv/mouse-click-2.wav" volume={0.6} />
      <Sfx at={wf('five', 0) + 12} src="wv/tick-sound.wav" volume={0.8} />
      <Sfx at={wf('five', 1)} src="wv/dull-thud.wav" volume={0.5} />
      <Sfx at={wf('never') + 2} src="wv/glitch-logo.wav" volume={0.35} />
      {/* 1 */}
      <Sfx at={S.p1logo} src="el/shimmer.mp3" volume={0.6} />
      <Sfx at={S.p1logo + 4} src="wv/bass-impact.wav" volume={0.5} />
      <Sfx at={wf('own')} src="el/stamp.mp3" volume={0.45} />
      <Sfx at={S.p1story + 4} src="el/glass.mp3" volume={0.4} />
      {['kids', 'teens', 'adults'].map((w) => <Sfx key={w} at={wf(w) - 4} src="wv/pop-hand.wav" volume={0.5} />)}
      {/* 2 */}
      {GROUPS.map((g) => <Sfx key={g.title} at={groupStart(g) - 8} src="el/glass.mp3" volume={0.45} />)}
      {/* 3 */}
      <Sfx at={wf('wrong') - 26} src="el/print.mp3" volume={0.45} />
      <Sfx at={S.p3report + 2} src="wv/message-pop-reply.wav" volume={0.55} />
      <Sfx at={wf('progress') - 4} src="counter.mp3" volume={0.35} />
      {/* 4 */}
      <Sfx at={wf('stays')} src="lock.mp3" volume={0.6} />
      <Sfx at={wf('laptop') - 6} src="el/glass.mp3" volume={0.4} />
      {/* 5 */}
      <Sfx at={S.p5drama + 2} src="el/slam.mp3" volume={0.75} />
      <Sfx at={S.p5drama + 2} src="wv/bass-impact.wav" volume={0.45} />
      {['siblings', 'Inviting', 'codes'].map((w) => <Sfx key={w} at={wf(w) - 6} src="el/glass.mp3" volume={0.45} />)}
      <Sfx at={wf('credit')} src="wv/several-coins.wav" volume={0.45} />
      {/* CTA */}
      <Sfx at={wf('link') + 6} src="el/tap.mp3" volume={0.7} />
      <Sfx at={wf('book', 1)} src="wv/message-pop-reply.wav" volume={0.6} />
      <Sfx at={TOTAL - 64} src="el/shimmer.mp3" volume={0.5} />
    </AbsoluteFill>
  );
};
