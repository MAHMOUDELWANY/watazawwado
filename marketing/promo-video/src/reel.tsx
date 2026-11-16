import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from 'remotion';
import { clamp, COPPER, CRIMSON, FPS, GOLD, GOLD_SOFT, PAPER, RIBBON, SANS, SERIF, TEAL, TEAL_DEEP } from './kit';
import { AR, ESPRESSO, INK, Logo, SAND, WHITE, grain } from './V2Ain';
import { fr, makeVO } from './captions';

/**
 * The 2026-11 Shorts engine (owner feedback 2026-11-16: hook in a second, a cut every beat, two open loops, Zad in every
 * video, our own ending). A video is a voice-over plus a list of beats keyed to word indexes; each beat is a hard cut
 * with a punch-in. Zad is the site's 3D mascot, pre-rendered by ZadClip into public/zad/<emote>/element-NNN.png.
 * Signature ending (ours): Zad packs the lesson into the zaad bag, "Packed!", and a teaser for the next pack.
 */

export type Word = [string, number, number];
export type Emote = 'wave' | 'check' | 'oops' | 'think' | 'point' | 'cheer' | 'love' | 'clap' | 'search' | 'proud' | 'spin' | 'dash';
const ZAD_FRAMES: Record<Emote, number> = { wave: 84, check: 105, oops: 99, think: 111, point: 102, cheer: 75, love: 102, clap: 87, search: 132, proud: 93, spin: 66, dash: 90 };

export type Bg = 'cream' | 'ink' | 'crimson' | 'teal' | 'sand' | 'copper' | { img: string; tint?: string };
const BG: Record<string, [string, boolean]> = { cream: [PAPER, false], ink: [ESPRESSO, true], crimson: [CRIMSON, true], teal: [TEAL_DEEP, true], sand: [SAND, false], copper: [COPPER, true] };
export const isDark = (bg: Bg) => (typeof bg === 'string' ? BG[bg][1] : true);

export type ZadSpot = { emote: Emote; x?: number; y?: number; size?: number; flip?: boolean; at?: number };
export type Beat = { w: number; bg: Bg; el: (f: number, dark: boolean, t: (w: number) => number) => React.ReactNode; zad?: ZadSpot; quiet?: boolean; noCaps?: boolean };

/** Zad playing one move from a given frame, popping in with a spring; holds the last frame (his rest pose). */
export const Zad: React.FC<ZadSpot & { from: number }> = ({ emote, from, x = 700, y = 1180, size: s0 = 420, flip }) => {
  const f = useCurrentFrame();
  const size = s0 * 1.6; // the clip has room around Zad for his effects
  const k = Math.max(0, Math.min(ZAD_FRAMES[emote] - 1, f - from));
  const s = spring({ frame: f - from, fps: FPS, config: { damping: 11, mass: 0.6 } });
  if (f < from) return null;
  return (
    <Img src={staticFile(`zad/${emote}/element-${String(k).padStart(ZAD_FRAMES[emote] > 100 ? 3 : 2, '0')}.png`)}
      style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${s * (flip ? -1 : 1)}, ${s})`, transformOrigin: '50% 80%' }} />
  );
};

const Grain: React.FC<{ dark: boolean }> = ({ dark }) => <AbsoluteFill style={{ ...grain, opacity: dark ? 0.5 : 0.8 }} />;

const Background: React.FC<{ bg: Bg; local: number }> = ({ bg, local }) => {
  if (typeof bg !== 'string') {
    const z = interpolate(local, [0, 150], [1.12, 1.0], clamp);
    return (
      <AbsoluteFill style={{ background: ESPRESSO }}>
        <Img src={staticFile(bg.img)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})` }} />
        <AbsoluteFill style={{ background: bg.tint ?? 'linear-gradient(180deg, rgba(27,21,18,0.55), rgba(27,21,18,0.15) 40%, rgba(27,21,18,0.75))' }} />
      </AbsoluteFill>
    );
  }
  const [c, dark] = BG[bg];
  return (
    <AbsoluteFill style={{ background: dark ? `radial-gradient(120% 80% at 50% 35%, ${c}, ${shade(c)})` : `radial-gradient(120% 80% at 50% 35%, #FFFDF8, ${c})` }}>
      <Grain dark={dark} />
    </AbsoluteFill>
  );
};
const shade = (c: string) => ({ [ESPRESSO]: '#1E120C', [CRIMSON]: '#6E0F12', [TEAL_DEEP]: '#043F4A', [COPPER]: '#7A3A28' } as Record<string, string>)[c] ?? '#000';

/* ---------- building blocks ---------- */

const pop = (f: number, d = 0, damping = 12) => spring({ frame: f - d, fps: FPS, config: { damping, mass: 0.55 } });

/** Big slammed lines; words wrapped in *stars* get the ribbon and a wiggle. */
export const Big: React.FC<{ f: number; dark: boolean; lines: string[]; size?: number; top?: number; stagger?: number; align?: 'center' | 'left' }> = ({ f, dark, lines, size = 112, top = 360, stagger = 4, align = 'center' }) => (
  <div style={{ position: 'absolute', left: 70, right: 70, top, textAlign: align }}>
    {lines.map((ln, i) => {
      const p = pop(f, i * stagger);
      return (
        <div key={i} style={{ fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.04, letterSpacing: -1.5, color: dark ? WHITE : INK, opacity: Math.min(1, p * 1.4),
          transform: `translateY(${(1 - p) * 60}px) scale(${0.85 + 0.15 * p})`, textShadow: dark ? '0 8px 30px rgba(0,0,0,0.45)' : 'none', marginBottom: 8 }}>
          {ln.split(/(\*[^*]+\*)/).map((part, j) => part.startsWith('*')
            ? <span key={j} style={{ display: 'inline-block', fontStyle: 'italic', color: dark ? GOLD_SOFT : CRIMSON, transform: `rotate(${Math.sin((f - i * stagger) / 5) * 1.5}deg) scale(${1 + 0.12 * (1 - Math.min(1, p))})` }}>{part.slice(1, -1)}</span>
            : <span key={j}>{part}</span>)}
        </div>
      );
    })}
  </div>
);

/** The open-loop sticker: tilted, pulsing, with an eye-catching ribbon edge. */
export const Loop: React.FC<{ f: number; text: string; top?: number; sub?: string }> = ({ f, text, top = 420, sub }) => {
  const p = pop(f, 0, 8);
  const pulse = 1 + Math.sin(f / 4) * 0.025;
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top, transform: `rotate(-3deg) scale(${p * pulse})`, padding: 8, borderRadius: 40, background: RIBBON, boxShadow: '0 24px 40px rgba(0,0,0,0.35)' }}>
      <div style={{ borderRadius: 34, background: WHITE, padding: '40px 46px', textAlign: 'center' }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 84, lineHeight: 1.05, color: INK }}>{text}</div>
        {sub && <div style={{ marginTop: 18, fontFamily: SANS, fontWeight: 700, fontSize: 44, color: CRIMSON, letterSpacing: 2, textTransform: 'uppercase' }}>{sub}</div>}
      </div>
    </div>
  );
};

/** A giant numeral badge for countdown beats. */
export const Num: React.FC<{ f: number; n: number; label: string; dark: boolean; top?: number }> = ({ f, n, label, dark, top = 260 }) => {
  const p = pop(f, 0, 9);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 230, height: 230, borderRadius: 999, background: RIBBON, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p}) rotate(${(1 - p) * -90}deg)`,
        boxShadow: '0 18px 30px rgba(0,0,0,0.3)', border: `10px solid ${WHITE}` }}>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 150, color: WHITE, lineHeight: 1 }}>{n}</span>
      </div>
      <div style={{ marginTop: 30, fontFamily: SANS, fontWeight: 700, fontSize: 54, color: dark ? GOLD_SOFT : INK, opacity: pop(f, 5), padding: '0 80px', textAlign: 'center', lineHeight: 1.2 }}>{label}</div>
    </div>
  );
};

/** A big Arabic word on a card, with its transliteration and meaning. */
export const ArCard: React.FC<{ f: number; ar: string; tr?: string; mean?: string; top?: number; size?: number; color?: string }> = ({ f, ar, tr, mean, top = 640, size = 200, color = CRIMSON }) => {
  const p = pop(f, 0, 10);
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top, borderRadius: 48, background: WHITE, border: `10px solid ${WHITE}`, boxShadow: '0 26px 44px rgba(0,0,0,0.3)',
      transform: `scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * 6}deg)`, opacity: Math.min(1, p * 1.5), overflow: 'hidden' }}>
      <div style={{ height: 14, background: RIBBON }} />
      <div style={{ direction: 'rtl', textAlign: 'center', fontFamily: AR, fontSize: size, lineHeight: 1.45, color, padding: '10px 30px 0' }}>{ar}</div>
      {(tr || mean) && (
        <div style={{ textAlign: 'center', paddingBottom: 34 }}>
          {tr && <span style={{ fontFamily: SERIF, fontWeight: 700, fontStyle: 'italic', fontSize: 66, color: INK }}>{tr}</span>}
          {mean && <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: TEAL_DEEP, marginTop: 6, opacity: pop(f, 8) }}>{mean}</div>}
        </div>
      )}
    </div>
  );
};

/** A quote card (ayah or hadith): Arabic on top, English under it, the reference last. */
export const Quote: React.FC<{ f: number; ar?: string; en?: string; source: string; top?: number; arSize?: number; enAt?: number }> = ({ f, ar, en, source, top = 330, arSize = 84, enAt = 0 }) => {
  const p = pop(f, 0, 14);
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top, borderRadius: 44, background: WHITE, padding: '54px 56px 44px', boxShadow: '0 26px 44px rgba(0,0,0,0.28)',
      transform: `translateY(${(1 - p) * 120}px)`, opacity: p }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 14, background: RIBBON, borderRadius: '44px 44px 0 0' }} />
      {ar && <div style={{ direction: 'rtl', textAlign: 'center', fontFamily: AR, fontSize: arSize, lineHeight: 1.7, color: INK }}>{ar}</div>}
      {en && <div style={{ marginTop: ar ? 24 : 0, fontFamily: SERIF, fontWeight: 700, fontSize: 58, lineHeight: 1.2, color: INK, textAlign: 'center', opacity: interpolate(f, [enAt, enAt + 8], [0, 1], clamp) }}>{en}</div>}
      <div style={{ marginTop: 26, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 34, color: '#6B6158', letterSpacing: 1 }}>{source}</div>
    </div>
  );
};

/** A row of chips that land one by one; `pick` turns one teal with a tick. */
export const Chips: React.FC<{ f: number; items: string[]; top?: number; pick?: number; pickAt?: number; dark?: boolean }> = ({ f, items, top = 760, pick, pickAt = 0, dark }) => (
  <div style={{ position: 'absolute', left: 80, right: 80, top, display: 'flex', flexDirection: 'column', gap: 30 }}>
    {items.map((it, i) => {
      const p = pop(f, 3 + i * 4);
      const on = pick === i && f >= pickAt;
      const q = on ? pop(f, pickAt, 8) : 0;
      return (
        <div key={i} style={{ borderRadius: 999, padding: '30px 50px', fontFamily: SANS, fontWeight: 700, fontSize: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: on ? TEAL : dark ? 'rgba(255,255,255,0.12)' : WHITE, color: on || dark ? WHITE : INK, border: `6px solid ${on ? WHITE : dark ? 'rgba(255,255,255,0.35)' : 'rgba(27,21,18,0.12)'}`,
          transform: `translateX(${(1 - p) * (i % 2 ? 300 : -300)}px) scale(${1 + q * 0.06})`, opacity: p, boxShadow: on ? `0 0 0 ${q * 14}px rgba(18,164,188,0.25)` : 'none' }}>
          <span>{it}</span>{on && <span style={{ transform: `scale(${q})` }}>✓</span>}
        </div>
      );
    })}
  </div>
);

/** A chat bubble that types its message. */
export const Bubble: React.FC<{ f: number; who: string; text: string; top?: number }> = ({ f, who, text, top = 520 }) => {
  const p = pop(f, 0, 12);
  const n = Math.floor(interpolate(f, [10, 10 + text.length * 1.1], [0, text.length], clamp));
  const typing = f < 10;
  return (
    <div style={{ position: 'absolute', left: 90, right: 150, top, transform: `scale(${p})`, transformOrigin: '0% 100%' }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: GOLD_SOFT, marginBottom: 14, marginLeft: 20 }}>{who}</div>
      <div style={{ background: WHITE, borderRadius: '50px 50px 50px 12px', padding: '40px 48px', fontFamily: SANS, fontWeight: 700, fontSize: 64, lineHeight: 1.2, color: INK, boxShadow: '0 20px 34px rgba(0,0,0,0.3)' }}>
        {typing ? <span style={{ letterSpacing: 10, color: '#8E857B' }}>{'•••'.slice(0, 1 + (Math.floor(f / 4) % 3))}</span> : text.slice(0, n)}
      </div>
    </div>
  );
};

/* ---------- the signature ending ---------- */

const Outro: React.FC<{ f: number; next: string }> = ({ f, next }) => {
  const bag = pop(f, 0, 10);
  const stamp = pop(f, 6, 7);
  const card = pop(f, 30, 12);
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', transform: `rotate(-6deg) scale(${stamp * 1.0 + (1 - stamp) * 2.2})`, opacity: Math.min(1, stamp * 2) }}>
        <span style={{ display: 'inline-block', padding: '18px 54px', border: `10px solid ${GOLD_SOFT}`, borderRadius: 26, fontFamily: SERIF, fontWeight: 700, fontSize: 130, color: GOLD_SOFT, letterSpacing: 4 }}>PACKED ✓</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: WHITE, opacity: pop(f, 14) }}>
        That’s your <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>zaad</span> for today.
      </div>
      <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', left: 540 - 200, top: 920, width: 400, transform: `scale(${bag}) rotate(${Math.sin(f / 9) * 2}deg)`, filter: 'drop-shadow(0 20px 26px rgba(0,0,0,0.45))' }} />
      <div style={{ position: 'absolute', left: 90, right: 90, top: 1350, borderRadius: 36, background: WHITE, padding: '30px 40px', transform: `translateY(${(1 - card) * 300}px)`, opacity: card, boxShadow: '0 20px 34px rgba(0,0,0,0.35)' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: CRIMSON }}>NEXT PACK ›</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 68, lineHeight: 1.1, color: INK, marginTop: 8 }}>{next}</div>
      </div>
    </>
  );
};

/* ---------- the reel ---------- */

export const reelTotal = (words: Word[]) => fr(words[words.length - 1][2]) + 75;

export const Reel: React.FC<{ vo: string; words: Word[]; beats: Beat[]; outro: { w: number; next: string } }> = ({ vo, words, beats, outro }) => {
  const f = useCurrentFrame();
  const t = (w: number) => fr(words[w][1]);
  const all: Beat[] = [...beats, { w: outro.w, bg: 'ink', el: (lf) => <Outro f={lf} next={outro.next} />, zad: { emote: 'check', x: 540, y: 800, size: 400, at: 4 }, noCaps: true }];
  const starts = all.map((b, i) => (i === 0 ? 0 : t(b.w)));
  let i = starts.length - 1;
  while (i > 0 && f < starts[i]) i--;
  const b = all[i];
  const local = f - starts[i];
  const dark = isDark(b.bg);
  const punch = interpolate(local, [0, 7], [1.07, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  const total = reelTotal(words);
  const VO = makeVO(words.filter((w) => !/[؀-ۿ]/.test(w[0])));
  return (
    <AbsoluteFill style={{ background: ESPRESSO, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <Background bg={b.bg} local={local} />
        {b.el(local, dark, (w) => t(w) - starts[i])}
        {b.zad && <Zad {...b.zad} from={starts[i] + (b.zad.at ?? 2)} />}
      </AbsoluteFill>
      {!b.noCaps && <VO.Captions dark={() => dark} top={1500} />}
      {/* progress ribbon on top: how much is left is part of the hook */}
      <div style={{ position: 'absolute', left: 0, top: 0, height: 12, width: `${(f / total) * 100}%`, background: RIBBON }} />
      <Logo />
      {all.map((x, k) => (k > 0 && !x.quiet ? <Sequence key={k} from={starts[k]} durationInFrames={20}><Audio src={staticFile('sfx/pop.mp3')} volume={0.22} /></Sequence> : null))}
      <Sequence from={fr(0)}><Audio src={staticFile(vo)} /></Sequence>
    </AbsoluteFill>
  );
};

export { CRIMSON, GOLD, GOLD_SOFT, TEAL, TEAL_DEEP, COPPER, INK, WHITE, AR, SANS, SERIF, ESPRESSO, SAND };

/** Index of the n-th spoken occurrence of a word (punctuation and case ignored). */
export const idx = (words: Word[], word: string, nth = 0) => {
  const c = (x: string) => x.toLowerCase().replace(/[^a-z0-9']/g, '');
  const hits = words.map((w, i) => [c(w[0]), i] as const).filter(([x]) => x === c(word));
  if (!hits[nth]) throw new Error(`word not found: ${word} #${nth}`);
  return hits[nth][1];
};

/** One frame of a Zad move, for stills and carousels (frame picked where the pose reads best). */
export const ZadStill: React.FC<{ emote: Emote; k: number; x: number; y: number; size: number; flip?: boolean; rot?: number }> = ({ emote, k, x, y, size, flip, rot = 0 }) => (
  <Img src={staticFile(`zad/${emote}/element-${String(Math.min(k, ZAD_FRAMES[emote] - 1)).padStart(ZAD_FRAMES[emote] > 100 ? 3 : 2, '0')}.png`)}
    style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scaleX(${flip ? -1 : 1}) rotate(${rot}deg)` }} />
);
