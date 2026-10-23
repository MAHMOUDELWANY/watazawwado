import { useSyncExternalStore } from 'react';

/**
 * One shared player for the site's welcome recitation (﴿وتزودوا فإن خير الزاد التقوى﴾, public/welcome.mp3),
 * used by the homepage (first visit) and the menu (play again any time).
 *
 * Mobile notes:
 * - Browsers only allow sound from a user "activation" (tap release / click / key). play() outside
 *   one is refused, and callers then wait for the next tap.
 * - iOS ignores audio.volume, so the fade-in goes through a Web Audio gain node there, created
 *   inside the user gesture. Like all Web Audio on iOS, it follows the phone's silent switch.
 */

const SRC = '/welcome.mp3';
const TARGET_VOLUME = 0.5;
const FADE_S = 1.5;

let audio: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let volumeWorks = true;
let raf: number | null = null;
let playing = false;
const listeners = new Set<() => void>();

const setPlaying = (value: boolean) => {
  playing = value;
  listeners.forEach((fn) => fn());
};

function getAudio(): HTMLAudioElement {
  if (audio) return audio;
  audio = new Audio(SRC);
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  audio.addEventListener('ended', () => setPlaying(false));
  // iOS: the volume property is read-only (always 1), so a volume fade does nothing there.
  audio.volume = 0.5;
  volumeWorks = audio.volume === 0.5;
  audio.volume = 0;
  return audio;
}

function setUpGain(el: HTMLAudioElement): boolean {
  if (gain) return true;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return false;
  try {
    ctx = new Ctx();
    gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
    el.volume = 1;
    return true;
  } catch {
    return false;
  }
}

/**
 * Starts the recitation from the beginning with a soft fade-in. Resolves false if the browser refused.
 * inGesture=false is the page-load attempt: skipped on iOS, whose gain node must be made inside a tap.
 */
export async function playWelcome(inGesture = true): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const el = getAudio();
  if (!inGesture && !volumeWorks) return false;
  const useGain = !volumeWorks && setUpGain(el);
  if (raf) cancelAnimationFrame(raf);
  el.currentTime = 0;
  if (useGain && gain && ctx) gain.gain.value = 0;
  else el.volume = 0;
  try {
    if (ctx) void ctx.resume();
    await el.play();
  } catch {
    return false;
  }
  setPlaying(true);
  if (useGain && gain && ctx) {
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(TARGET_VOLUME, ctx.currentTime + FADE_S);
  } else {
    const start = performance.now();
    const step = (now: number) => {
      // rAF's timestamp is the frame start, which can be slightly before `start`; never hand volume a negative value.
      const t = Math.min(1, Math.max(0, (now - start) / (FADE_S * 1000)));
      el.volume = TARGET_VOLUME * t;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  return true;
}

export function stopWelcome() {
  if (raf) cancelAnimationFrame(raf);
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  setPlaying(false);
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** { playing, play, stop } for any component; all share the same player. */
export function useWelcomeAudio() {
  const isPlaying = useSyncExternalStore(subscribe, () => playing, () => false);
  return { playing: isPlaying, play: playWelcome, stop: stopWelcome };
}
