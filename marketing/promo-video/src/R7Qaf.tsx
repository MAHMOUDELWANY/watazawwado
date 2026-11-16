import React from 'react';
import { AbsoluteFill, interpolate, spring } from 'remotion';
import { ArCard, Beat, Big, Chips, Loop, Reel, reelTotal, Word, AR, CRIMSON, GOLD_SOFT, INK, SANS, SERIF, TEAL_DEEP, WHITE } from './reel';
import { clamp, FPS } from './kit';
import RAW from './words-v7.json';

/**
 * V7 v2 · "One letter turns your heart into a dog" (22 Nov 2026). Owner feedback 2026-11-16: hook in a second, cuts every
 * beat, two open loops (the test at the end, then "heart or dog?"), Zad throughout, our "Packed!" ending.
 * Arabic syllables are mahmoud-fusha clips; no sound effect sits on them (beats marked quiet).
 */
const W = RAW as Word[];
export const R7_TOTAL = reelTotal(W);

/** One letter, huge, with a pulse on each spoken syllable. */
const Letter: React.FC<{ f: number; ch: string; where: string; color: string; beats?: number[]; dark?: boolean }> = ({ f, ch, where, color, beats = [], dark = true }) => {
  const p = spring({ frame: f, fps: FPS, config: { damping: 10, mass: 0.6 } });
  const hit = beats.reduce((a, b) => a + interpolate(f, [b, b + 3, b + 10], [0, 1, 0], clamp), 0);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 560, height: 560, borderRadius: 999, background: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p * (1 + hit * 0.08)})`,
        boxShadow: `0 0 0 ${hit * 30}px rgba(246,213,142,0.35), 0 26px 44px rgba(0,0,0,0.3)` }}>
        <span style={{ fontFamily: AR, fontSize: 360, color, lineHeight: 1, marginTop: -40 }}>{ch}</span>
      </div>
      <div style={{ marginTop: 40, fontFamily: SERIF, fontWeight: 700, fontStyle: 'italic', fontSize: 76, color: dark ? GOLD_SOFT : CRIMSON, opacity: interpolate(f, [6, 12], [0, 1], clamp) }}>{where}</div>
    </div>
  );
};

const beats: Beat[] = [
  { w: 0, bg: 'crimson', el: (f, d) => <Big f={f} dark={d} lines={['*Careful!*']} size={190} top={560} />, zad: { emote: 'oops', x: 540, y: 1120, size: 560, at: 0 } },
  { w: 1, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['One letter…', 'your *HEART*', 'becomes a *DOG.*']} size={124} top={330} />, zad: { emote: 'search', x: 800, y: 1220, size: 380 } },
  { w: 12, bg: 'cream', quiet: true, el: (f) => <ArCard f={f} ar="قَلْب" tr="qalb" mean="❤️  heart" top={420} size={230} color={TEAL_DEEP} /> },
  { w: 14, bg: 'ink', quiet: true, el: (f) => <ArCard f={f} ar="كَلْب" tr="kalb" mean="🐕  dog" top={420} size={230} color={CRIMSON} />, zad: { emote: 'oops', x: 820, y: 1260, size: 340, at: 6 } },
  { w: 16, bg: 'teal', el: (f, d) => (
    <>
      <Big f={f} dark={d} lines={['Same ending.', 'Different *first letter.*']} size={96} top={260} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', gap: 70, direction: 'rtl' }}>
        {['ق', 'ك'].map((c, i) => (
          <div key={c} style={{ width: 300, height: 300, borderRadius: 50, background: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${spring({ frame: f - 6 - i * 5, fps: FPS, config: { damping: 9 } })}) rotate(${i ? 4 : -4}deg)` }}>
            <span style={{ fontFamily: AR, fontSize: 220, color: i ? CRIMSON : TEAL_DEEP, marginTop: -30 }}>{c}</span>
          </div>
        ))}
      </div>
    </>
  ) },
  { w: 21, bg: 'crimson', el: (f) => <Loop f={f} text="There’s a test at the end." sub="most people fail it 👀" top={380} />, zad: { emote: 'think', x: 540, y: 1150, size: 460 } },
  { w: 34, bg: 'cream', el: (f) => <Letter f={f} ch="ك" where="front · light" color={CRIMSON} dark={false} /> },
  { w: 48, bg: 'cream', quiet: true, el: (f) => <Letter f={f} ch="ك" where="ka · ka · ka" color={CRIMSON} beats={[2, 22, 44]} dark={false} /> },
  { w: 49, bg: 'ink', el: (f) => <Letter f={f} ch="ق" where="way back · deep" color={TEAL_DEEP} />, zad: { emote: 'point', x: 830, y: 1250, size: 360, flip: true } },
  { w: 59, bg: 'ink', quiet: true, el: (f) => <Letter f={f} ch="ق" where="qa · qa · qa" color={TEAL_DEEP} beats={[2, 26, 50]} /> },
  { w: 60, bg: 'sand', el: (f, d) => <Big f={f} dark={d} lines={['✋ Hand on', 'your throat.', 'Feel it *knock?*']} size={116} top={330} />, zad: { emote: 'clap', x: 780, y: 1230, size: 400 } },
  { w: 72, bg: 'crimson', el: (f, d) => <Big f={f} dark={d} lines={['TEST', '*TIME.*']} size={220} top={420} />, zad: { emote: 'spin', x: 540, y: 1180, size: 420 } },
  { w: 75, bg: 'ink', el: (f, d, t) => <><Big f={f} dark={d} lines={['Heart or dog?']} size={110} top={270} /><Chips f={f} items={['❤️  heart', '🐕  dog']} top={560} pick={0} pickAt={t(79)} dark /></>,
    zad: { emote: 'think', x: 800, y: 1230, size: 380 } },
  { w: 78, bg: 'ink', quiet: true, el: (f, d, t) => <><Big f={f} dark={d} lines={['Heart or dog?']} size={110} top={270} /><Chips f={f + 30} items={['❤️  heart', '🐕  dog']} top={560} pick={0} pickAt={t(79) + 30} dark /></>,
    zad: { emote: 'cheer', x: 800, y: 1230, size: 400, at: 34 } },
];

export const R7Qaf: React.FC = () => <Reel vo="vo-v7.mp3" words={W} beats={beats} outro={{ w: 84, next: 'Ten years… and not one “uff”.' }} />;
