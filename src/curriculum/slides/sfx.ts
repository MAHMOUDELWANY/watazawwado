import { useEffect, useRef } from 'react';

/* ---------- Sound effects for the lesson player (docs/curriculum/RULES.md §1.10) ----------
   Recorded effects generated for us on ElevenLabs (2026-10-24, public/curriculum/sfx, listed in docs/curriculum/
   sources.md): warm and organic (paper, wood, pencil, a small brass bell). The synthesised recipes only stand in until a
   file has loaded. Never music. One sound per moment: when two cues land
   within half a second, only the more important one plays, so a scene never stacks sparkle on chime on click.
   Browsers only allow audio after a user gesture; the teacher's first click on the player unlocks it. */

export type Sound =
  | 'page' | 'pop' | 'whoosh' | 'chime' | 'reveal' | 'brick' | 'thud' | 'lock' | 'sparkle'
  | 'sand' | 'water' | 'pen' | 'strike' | 'poof' | 'correct' | 'oops' | 'praise'
  // the series opening and stamps
  | 'riser' | 'impact' | 'stamp' | 'castKids' | 'castTeens';

const MUTE_KEY = 'curriculum-sfx-muted';
let muted = (() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } })();
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* private mode: the choice lasts this visit only */ }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function noiseBuffer(a: AudioContext) {
  if (noise) return noise;
  noise = a.createBuffer(1, a.sampleRate, a.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

/** One envelope-shaped voice: an oscillator (or noise through a filter) that rises fast and fades out. */
function voice(a: AudioContext, out: AudioNode, t: number, o: {
  type?: OscillatorType | 'noise'; f: number; f2?: number; dur: number; vol: number; attack?: number;
  filter?: { type: BiquadFilterType; f: number; f2?: number; q?: number };
}) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.vol, t + (o.attack ?? 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  let src: AudioScheduledSourceNode;
  if (o.type === 'noise') {
    const n = a.createBufferSource();
    n.buffer = noiseBuffer(a);
    src = n;
  } else {
    const osc = a.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
    src = osc;
  }
  let node: AudioNode = src;
  if (o.filter) {
    const bq = a.createBiquadFilter();
    bq.type = o.filter.type;
    bq.Q.value = o.filter.q ?? 1;
    bq.frequency.setValueAtTime(o.filter.f, t);
    if (o.filter.f2) bq.frequency.exponentialRampToValueAtTime(o.filter.f2, t + o.dur);
    node.connect(bq);
    node = bq;
  }
  node.connect(g).connect(out);
  src.start(t);
  src.stop(t + o.dur + 0.05);
}

const NOTES = { C5: 523.25, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568 };

/** Synthesised recipes: the sound itself for air, sand, water and the page turn, and the fallback for a recording that
 *  has not loaded yet. Short, soft and warm: they mark a moment, they never fill the room. */
const RECIPES: Record<Sound, (a: AudioContext, out: AudioNode, t: number) => void> = {
  page: (a, o, t) => voice(a, o, t, { type: 'noise', f: 0, dur: 0.32, vol: 0.035, attack: 0.04, filter: { type: 'bandpass', f: 1800, f2: 5000, q: 0.8 } }),
  pop: (a, o, t) => voice(a, o, t, { f: 420, f2: 900, dur: 0.12, vol: 0.18 }),
  whoosh: (a, o, t) => voice(a, o, t, { type: 'noise', f: 0, dur: 0.6, vol: 0.05, attack: 0.25, filter: { type: 'bandpass', f: 300, f2: 2400, q: 1.2 } }),
  chime: (a, o, t) => { voice(a, o, t, { f: NOTES.E6, dur: 0.9, vol: 0.12 }); voice(a, o, t + 0.07, { f: NOTES.A5, dur: 1.1, vol: 0.08 }); },
  reveal: (a, o, t) => [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((f, i) => voice(a, o, t + i * 0.09, { type: 'triangle', f, dur: 1.4, vol: 0.09 })),
  brick: (a, o, t) => { voice(a, o, t, { type: 'square', f: 1400, f2: 900, dur: 0.05, vol: 0.05, filter: { type: 'highpass', f: 900 } }); voice(a, o, t, { f: 180, f2: 120, dur: 0.08, vol: 0.12 }); },
  thud: (a, o, t) => { voice(a, o, t, { f: 120, f2: 55, dur: 0.35, vol: 0.3 }); voice(a, o, t, { type: 'noise', f: 0, dur: 0.18, vol: 0.06, filter: { type: 'lowpass', f: 600 } }); },
  lock: (a, o, t) => { voice(a, o, t, { type: 'square', f: 2200, f2: 1600, dur: 0.04, vol: 0.06, filter: { type: 'bandpass', f: 2500, q: 4 } }); voice(a, o, t + 0.11, { type: 'square', f: 1500, f2: 900, dur: 0.06, vol: 0.08, filter: { type: 'bandpass', f: 1800, q: 4 } }); voice(a, o, t + 0.13, { f: 260, f2: 140, dur: 0.12, vol: 0.12 }); },
  sparkle: (a, o, t) => [NOTES.G6, NOTES.E6, NOTES.C6, NOTES.G6].forEach((f, i) => voice(a, o, t + i * 0.06, { f, dur: 0.35, vol: 0.05 })),
  sand: (a, o, t) => voice(a, o, t, { type: 'noise', f: 0, dur: 1.6, vol: 0.035, attack: 0.5, filter: { type: 'highpass', f: 2500, f2: 4500 } }),
  water: (a, o, t) => [0, 0.16, 0.34].forEach((d, i) => voice(a, o, t + d, { f: 500 + i * 120, f2: 1100 + i * 150, dur: 0.16, vol: 0.04 })),
  pen: (a, o, t) => voice(a, o, t, { type: 'noise', f: 0, dur: 0.4, vol: 0.05, attack: 0.05, filter: { type: 'bandpass', f: 3500, q: 2 } }),
  strike: (a, o, t) => { voice(a, o, t, { type: 'noise', f: 0, dur: 0.18, vol: 0.08, filter: { type: 'bandpass', f: 2600, f2: 1200, q: 1.5 } }); voice(a, o, t + 0.32, { type: 'noise', f: 0, dur: 0.18, vol: 0.08, filter: { type: 'bandpass', f: 2600, f2: 1200, q: 1.5 } }); },
  poof: (a, o, t) => voice(a, o, t, { type: 'noise', f: 0, dur: 0.5, vol: 0.06, attack: 0.02, filter: { type: 'lowpass', f: 1800, f2: 200 } }),
  correct: (a, o, t) => { voice(a, o, t, { type: 'triangle', f: NOTES.E5, dur: 0.25, vol: 0.12 }); voice(a, o, t + 0.1, { type: 'triangle', f: NOTES.A5, dur: 0.45, vol: 0.12 }); },
  oops: (a, o, t) => voice(a, o, t, { type: 'triangle', f: 330, f2: 260, dur: 0.3, vol: 0.08 }),
  praise: (a, o, t) => [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.E6].forEach((f, i) => voice(a, o, t + i * 0.07, { type: 'triangle', f, dur: 0.8, vol: 0.08 })),
  riser: (a, o, t) => voice(a, o, t, { type: 'noise', f: 0, dur: 1.6, vol: 0.05, attack: 1.2, filter: { type: 'bandpass', f: 400, f2: 4000, q: 1 } }),
  impact: (a, o, t) => voice(a, o, t, { f: 90, f2: 40, dur: 0.8, vol: 0.35 }),
  stamp: (a, o, t) => voice(a, o, t, { f: 160, f2: 70, dur: 0.2, vol: 0.3 }),
  castKids: (a, o, t) => voice(a, o, t, { f: 300, f2: 700, dur: 0.3, vol: 0.12 }),
  castTeens: (a, o, t) => voice(a, o, t, { type: 'noise', f: 0, dur: 0.5, vol: 0.07, attack: 0.3, filter: { type: 'bandpass', f: 300, f2: 2400, q: 1.2 } }),
};

/** Recorded effects: file in public/curriculum/sfx and its volume (files are levelled to about -18 LUFS; decoration sits
 *  lower than the moments that matter). */
const SAMPLES: Partial<Record<Sound, { file: string; vol: number; rate?: number }>> = {
  page: { file: 'page', vol: 0.25 },
  pop: { file: 'pop', vol: 0.2 },
  whoosh: { file: 'whoosh', vol: 0.28 },
  chime: { file: 'chime', vol: 0.32 },
  reveal: { file: 'reveal', vol: 0.55 },
  brick: { file: 'brick', vol: 0.4 },
  thud: { file: 'thud', vol: 0.38 },
  lock: { file: 'lock', vol: 0.45 },
  sparkle: { file: 'sparkle', vol: 0.32 },
  sand: { file: 'sand', vol: 0.32 },
  water: { file: 'water', vol: 0.4 },
  pen: { file: 'pen', vol: 0.3 },
  strike: { file: 'strike', vol: 0.32 },
  poof: { file: 'poof', vol: 0.35 },
  correct: { file: 'correct', vol: 0.5 },
  oops: { file: 'oops', vol: 0.3 },
  praise: { file: 'praise', vol: 0.5 },
  riser: { file: 'riser', vol: 0.45 },
  impact: { file: 'impact', vol: 0.45 },
  stamp: { file: 'stamp', vol: 0.55 },
  castKids: { file: 'cast-kids', vol: 0.42 },
  castTeens: { file: 'cast-teens', vol: 0.4 },
};
const buffers = new Map<string, AudioBuffer>();
let loading = false;
function loadSamples(a: AudioContext) {
  if (loading) return;
  loading = true;
  new Set(Object.values(SAMPLES).map((x) => x!.file)).forEach((file) => {
    fetch(`/curriculum/sfx/${file}.mp3`)
      .then((r) => r.arrayBuffer())
      .then((b) => a.decodeAudioData(b))
      .then((buf) => buffers.set(file, buf))
      .catch(() => { /* the synthesised recipe stands in */ });
  });
}

/** Called on the teacher's first tap in the player: wakes the audio and fetches the recordings before the first cue. */
export function primeSounds() {
  const a = audio();
  if (a && !muted) loadSamples(a);
}

/** Which cue wins when two land together: the moment itself beats its decoration. */
const PRIORITY: Record<Sound, number> = {
  praise: 4, correct: 4, lock: 3, reveal: 3, oops: 3, thud: 2, brick: 2, strike: 2, chime: 2, poof: 2, water: 2, sand: 2,
  pop: 1, pen: 1, whoosh: 1, sparkle: 1, page: 0, impact: 3, stamp: 2, riser: 1, castKids: 2, castTeens: 2,
};
const WINDOW = 0.5;
let recent: { at: number; prio: number; gain: GainNode }[] = [];

/** Play a sound now, or after `delay` seconds (so it lands with its animation). */
export function play(name: Sound, delay = 0) {
  if (typeof window !== 'undefined') {
    const w = window as unknown as { __sfx?: string[] };
    (w.__sfx ||= []).push(name); // read by the browser checks; cheap and harmless
  }
  if (muted) return;
  const a = audio();
  if (!a) return;
  loadSamples(a);
  const at = a.currentTime + Math.max(0, delay);
  const prio = PRIORITY[name];
  recent = recent.filter((r) => r.at > a.currentTime - 2);
  const clash = recent.filter((r) => Math.abs(r.at - at) < WINDOW);
  if (clash.some((r) => r.prio >= prio)) return;
  clash.forEach((r) => { try { r.gain.disconnect(); } catch { /* already gone */ } });
  recent = recent.filter((r) => !clash.includes(r));
  const quiet = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const master = a.createGain();
  master.gain.value = quiet ? 0.5 : 1;
  master.connect(a.destination);
  recent.push({ at, prio, gain: master });
  try {
    const s = SAMPLES[name];
    const buf = s && buffers.get(s.file);
    if (s && buf) {
      const src = a.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = s.rate ?? 1;
      const g = a.createGain();
      g.gain.value = s.vol;
      src.connect(g).connect(master);
      src.start(at);
    } else RECIPES[name](a, master, at);
  } catch { /* audio is a nicety, never break a slide */ }
}

/** Plays `name` each time `value` goes up (a new pillar, the key going in, a true flag), timed `delay` seconds later.
 *  Going back a step or opening the page never makes a sound. */
export function useCue(name: Sound, value: number | boolean, delay = 0) {
  const n = Number(value);
  const prev = useRef(n);
  useEffect(() => {
    if (n > prev.current) play(name, delay);
    prev.current = n;
  }, [n, name, delay]);
}
