import React from 'react';
import { interpolate, spring } from 'remotion';
import { Beat, Big, Bubble, Chips, Loop, Reel, reelTotal, Word, CRIMSON, GOLD_SOFT, INK, SANS, SERIF, TEAL_DEEP, WHITE } from './reel';
import { clamp, FPS } from './kit';
import RAW from './words-v4.json';

/** V4 v2 · "Would you hand your child to a stranger?" (19 Nov 2026). Parents; loops: "a better way… keep watching", "the best part?". */
const W = RAW as Word[];
export const R4_TOTAL = reelTotal(W);

/** A video-call tile where an unknown person joins: a grey "?" avatar, no face. */
const Call: React.FC<{ f: number }> = ({ f }) => {
  const p = spring({ frame: f, fps: FPS, config: { damping: 13 } });
  const join = interpolate(f, [18, 26], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top: 300, height: 760, borderRadius: 44, background: '#1E1714', border: '10px solid #2E2420', transform: `scale(${0.8 + 0.2 * p})`, opacity: p, overflow: 'hidden', boxShadow: '0 30px 50px rgba(0,0,0,0.5)' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 300, height: 300, borderRadius: 999, background: '#4A3F39', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${join})` }}>
          <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 200, color: '#8E857B' }}>?</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 30, bottom: 30, background: 'rgba(0,0,0,0.55)', color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 40, padding: '12px 24px', borderRadius: 16, opacity: join }}>
        Unknown has joined
      </div>
      <div style={{ position: 'absolute', right: 30, top: 30, width: 26, height: 26, borderRadius: 99, background: CRIMSON, opacity: Math.floor(f / 8) % 2 ? 1 : 0.3 }} />
    </div>
  );
};

/** Teacher profile rows sliding in: who they are, before anything is booked. */
const Profiles: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: 'absolute', left: 80, right: 80, top: 300 }}>
    {[['Who they are', TEAL_DEEP], ['What they teach', CRIMSON], ['How they teach', '#DA7960']].map(([t, c], i) => {
      const p = spring({ frame: f - i * 6, fps: FPS, config: { damping: 12 } });
      return (
        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 34, marginBottom: 34, padding: 30, borderRadius: 36, background: WHITE, boxShadow: '0 18px 30px rgba(0,0,0,0.18)',
          transform: `translateX(${(1 - p) * (i % 2 ? 700 : -700)}px) rotate(${(i - 1) * 1.5}deg)` }}>
          <div style={{ flex: '0 0 150px', height: 150, borderRadius: 99, background: c, border: '8px solid #fff', boxShadow: '0 6px 12px rgba(0,0,0,0.15)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 62, color: INK }}>{t}</div>
            <div style={{ marginTop: 16, height: 20, width: '85%', borderRadius: 10, background: 'rgba(27,21,18,0.12)' }} />
            <div style={{ marginTop: 14, height: 20, width: '60%', borderRadius: 10, background: 'rgba(27,21,18,0.12)' }} />
          </div>
        </div>
      );
    })}
  </div>
);

const beats: Beat[] = [
  { w: 0, bg: { img: 'thumbs/v4.png' }, el: (f, d) => <Big f={f} dark={d} lines={['Would you hand', 'your child', 'to a *stranger?*']} size={120} top={300} />, zad: { emote: 'oops', x: 540, y: 1290, size: 460, at: 0 } },
  { w: 8, bg: 'crimson', el: (f, d) => <Big f={f} dark={d} lines={['Most parents', '*do.*']} size={150} top={500} /> },
  { w: 11, bg: 'ink', el: (f) => <Call f={f} /> },
  { w: 25, bg: 'teal', el: (f) => <Loop f={f} text="There’s a better way." sub="it starts before lesson 1 👀" top={380} />, zad: { emote: 'think', x: 540, y: 1150, size: 460 } },
  { w: 38, bg: 'cream', el: (f) => <Profiles f={f} />, zad: { emote: 'point', x: 860, y: 1260, size: 340, flip: true, at: 10 } },
  { w: 50, bg: 'crimson', el: (f, d) => <Big f={f} dark={d} lines={['Then', '*YOU*', 'choose.']} size={190} top={330} />, zad: { emote: 'clap', x: 800, y: 1240, size: 380 } },
  { w: 53, bg: 'cream', el: (f, d, t) => <><Big f={f} dark={d} lines={['Your call:']} size={110} top={300} /><Chips f={f} items={['Male teacher', 'Female teacher']} top={520} pick={1} pickAt={t(58)} /></> },
  { w: 60, bg: 'sand', el: (f) => <Loop f={f} text="And the best part?" sub="👇" top={480} />, zad: { emote: 'search', x: 540, y: 1180, size: 440 } },
  { w: 64, bg: 'ink', el: (f, d, t) => <><Big f={f} dark={d} lines={['Before day one…']} size={96} top={260} /><Bubble f={f - (t(71) - 6)} who="Your teacher" text="Tell me a little about Yusuf 🙂" top={560} /></>,
    zad: { emote: 'love', x: 780, y: 1250, size: 380, at: 20 } },
  { w: 77, bg: 'teal', el: (f, d) => <Big f={f} dark={d} lines={['Wherever you book:', 'see the teacher', '*FIRST.*']} size={110} top={360} /> },
  { w: 86, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['Nobody should', 'learn their deen', 'from a *stranger.*']} size={110} top={360} />, zad: { emote: 'proud', x: 540, y: 1200, size: 420 } },
];

export const R4Choose: React.FC = () => <Reel vo="vo-v4.mp3" words={W} beats={beats} outro={{ w: 94, next: '3 Arabic words your kids say every day… without knowing.' }} />;
