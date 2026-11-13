import React from 'react';
import { interpolate, spring, useCurrentFrame } from 'remotion';
import { clamp, FPS, GOLD, PAPER, SANS, SERIF } from './kit';
import WORDS from './words.json';

type Word = [string, number, number];

/** The voice starts this many seconds into the video. */
export const VO_OFFSET = 0.3;
export const fr = (sec: number) => Math.round((sec + VO_OFFSET) * FPS);

const KEY = new Set(['pay', 'any', 'five', 'never', 'curriculum', 'Watazawwado', 'Zad', 'Path', 'own', 'Animated', 'kids', 'teens', 'adults', 'actually', 'needs',
  'Quran', 'Tajweed', 'memorization', 'revision', 'Fusha', 'conversation', 'Egyptian', 'English', 'know', 'placement', 'wrong', 'report', 'progress', 'stage',
  'life', 'male', 'female', 'stays', 'keeps', 'time', 'zone', 'phone', 'tablet', 'laptop', 'price', "won't", 'hint', 'family', 'discount', 'both', 'credit', 'codes',
  'link', 'yourself', 'free', 'trial', 'ONE', 'one', 'shrug', 'fault', 'plan', 'games', 'stories', 'us', 'card', 'again']);
const isKey = (t: string) => KEY.has(t.replace(/[^A-Za-z']/g, ''));

const CAP_GOLD = 'linear-gradient(100deg, #FFF3D6, #F6D58E 30%, #E5A93C 65%, #DA7960)';
const CAP_INK = 'linear-gradient(100deg, #A3171C, #6E3626 45%, #065F6E)';

/** Word timings (s) for one voice-over: lookups plus kinetic captions. */
export const makeVO = (raw: Word[]) => {
  const W = raw.map(([t, s, e], i, a) => [t === 'path' && a[i - 1]?.[0] === 'Zad' ? 'Path' : t, s, e] as Word);

  /** Start time (s) of the n-th spoken occurrence of a word, punctuation ignored. */
  const wt = (word: string, nth = 0) => {
    const clean = (x: string) => x.toLowerCase().replace(/[^a-z']/g, '');
    const hits = W.filter((w) => clean(w[0]) === clean(word));
    if (!hits[nth]) throw new Error(`word not in voice-over: ${word} #${nth}`);
    return hits[nth][1];
  };
  const wf = (word: string, nth = 0) => fr(wt(word, nth));

  type Chunk = { words: Word[]; start: number; end: number };
  const CHUNKS: Chunk[] = (() => {
    const out: Chunk[] = [];
    let cur: Word[] = [];
    W.forEach((w, i) => {
      cur.push(w);
      const gap = i < W.length - 1 ? W[i + 1][1] - w[2] : 9;
      if (/[.,?]$/.test(w[0]) || cur.length === 3 || gap > 0.35 || i === W.length - 1) {
        out.push({ words: cur, start: cur[0][1], end: cur[cur.length - 1][2] });
        cur = [];
      }
    });
    return out.map((c, i) => ({ ...c, end: i < out.length - 1 ? Math.min(out[i + 1].start, c.end + 1.2) : c.end + 1.4 }));
  })();

  /** Kinetic captions in the lower third; ink on the paper scenes, paper on the dark ones. */
  const Captions: React.FC<{ dark: (f: number) => boolean; top?: number }> = ({ dark, top = 1430 }) => {
    const f = useCurrentFrame();
    const chunk = CHUNKS.find((c) => f >= fr(c.start) - 2 && f < fr(c.end));
    if (!chunk) return null;
    const dk = dark(f);
    const cIn = spring({ frame: f - (fr(chunk.start) - 2), fps: FPS, config: { damping: 14, mass: 0.6 } });
    return (
      <div style={{ position: 'absolute', left: 50, right: 50, top, textAlign: 'center', transform: `translateY(${(1 - cIn) * 40}px) scale(${0.92 + 0.08 * cIn})`, opacity: cIn }}>
        {chunk.words.map(([t, s], i) => {
          const on = f >= fr(s);
          const p = spring({ frame: f - fr(s), fps: FPS, config: { damping: 11, mass: 0.5 } });
          const key = isKey(t);
          const base = dk ? PAPER : '#12100E';
          return (
            <span key={i} style={{
              display: 'inline-block', margin: '0 0.26em', fontFamily: key ? SERIF : SANS, fontWeight: 700, fontSize: key ? 86 : 74, lineHeight: 1.1, letterSpacing: -0.5,
              transformOrigin: '50% 80%', color: base, opacity: on ? 1 : 0,
              transform: `scale(${on ? 1 + 0.16 * (1 - Math.min(1, p)) * (key ? 1.5 : 1) : 0.94}) translateY(${on ? 0 : 8}px) rotate(${on && key ? interpolate(p, [0, 1], [-3, 0], clamp) : 0}deg)`,
              textShadow: dk ? '0 6px 30px rgba(0,0,0,0.85)' : '0 0 24px rgba(250,247,242,0.95), 0 0 6px rgba(250,247,242,0.9)',
              ...(on && key ? { background: dk ? CAP_GOLD : CAP_INK, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textShadow: 'none',
                filter: dk ? `drop-shadow(0 6px 22px rgba(0,0,0,0.9)) drop-shadow(0 0 18px ${GOLD}66)` : 'drop-shadow(0 0 10px rgba(250,247,242,0.9)) drop-shadow(0 2px 2px rgba(18,16,14,0.15))' } : {}),
            }}>{t}</span>
          );
        })}
      </div>
    );
  };

  return { wt, wf, Captions, end: W[W.length - 1][2] };
};

/** The YouTube cut's voice-over (public/vo-full.mp3, faster-whisper, spellings fixed by hand). */
const yt = makeVO(WORDS as Word[]);
export const wt = yt.wt;
export const wf = yt.wf;
export const Captions = yt.Captions;
