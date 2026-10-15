import React, { useEffect, useRef, useState } from 'react';
import { VolumeX } from 'lucide-react';

/**
 * Plays the site's welcome recitation (﴿وتزودوا فإن خير الزاد التقوى﴾, public/welcome.mp3) once per
 * browser session, on the visitor's first interaction with the homepage, fading in from silence to
 * 50% over 1.5s. A small "stop" button shows while it plays.
 *
 * Mobile notes:
 * - Browsers only allow sound from "activation" events. A finger touch activates on release
 *   (touchend / pointerup / click), not on touchstart / pointerdown, so we listen to those.
 *   If play() is refused we keep listening and try again on the next interaction.
 * - iOS ignores audio.volume, so the fade goes through a Web Audio gain node there (where
 *   available). Like all Web Audio on iOS, that follows the phone's silent switch.
 *
 * Client-only: everything runs inside useEffect. Mounted once on the homepage.
 */

const SRC = '/welcome.mp3';
const SESSION_KEY = 'wz_welcome_recitation_played';
const TARGET_VOLUME = 0.5;
const FADE_S = 1.5;
const EVENTS = ['touchend', 'pointerup', 'click', 'keydown'] as const;

export function WelcomeRecitation({ isAr }: { isAr: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* storage blocked: still play once for this page view */
    }

    const audio = new Audio(SRC);
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audioRef.current = audio;
    audio.addEventListener('ended', () => setPlaying(false));

    // iOS: the volume property is read-only (always 1), so a volume fade does nothing there.
    audio.volume = 0.5;
    const volumeWorks = audio.volume === 0.5;
    audio.volume = 0;

    let busy = false;
    let done = false;

    const fadeWithVolume = () => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / (FADE_S * 1000));
        audio.volume = TARGET_VOLUME * t;
        if (t < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    };

    /** Routes the element through a gain node (created inside the user gesture, as iOS requires). */
    const setUpGain = (): boolean => {
      if (gainRef.current) return true;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return false;
      try {
        const ctx: AudioContext = new Ctx();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
        audio.volume = 1;
        ctxRef.current = ctx;
        gainRef.current = gain;
        void ctx.resume();
        return true;
      } catch {
        return false;
      }
    };

    const onInteraction = () => {
      if (busy || done) return;
      busy = true;
      const useGain = !volumeWorks && setUpGain();
      audio
        .play()
        .then(() => {
          done = true;
          removeListeners();
          try {
            sessionStorage.setItem(SESSION_KEY, '1');
          } catch {}
          setPlaying(true);
          const gain = gainRef.current;
          const ctx = ctxRef.current;
          if (useGain && gain && ctx) {
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(TARGET_VOLUME, ctx.currentTime + FADE_S);
          } else {
            fadeWithVolume();
          }
        })
        .catch(() => {
          // Refused (not an activation event yet) or failed to load: stay silent, try on the next tap.
          busy = false;
        });
    };

    const removeListeners = () => {
      EVENTS.forEach((e) => window.removeEventListener(e, onInteraction, true));
    };
    EVENTS.forEach((e) => window.addEventListener(e, onInteraction, { capture: true, passive: true }));

    return () => {
      removeListeners();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Leaving the homepage takes the stop button away, so fade the recitation out with it.
      if (!audio.paused) {
        const gain = gainRef.current;
        const ctx = ctxRef.current;
        if (gain && ctx) {
          gain.gain.cancelScheduledValues(ctx.currentTime);
          gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
          setTimeout(() => {
            audio.pause();
            void ctx.close();
          }, 550);
        } else {
          const from = audio.volume;
          const start = performance.now();
          const out = (now: number) => {
            const t = Math.min(1, (now - start) / 500);
            audio.volume = from * (1 - t);
            if (t < 1) requestAnimationFrame(out);
            else audio.pause();
          };
          requestAnimationFrame(out);
        }
      }
    };
  }, []);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
  };

  if (!playing) return null;

  return (
    <button
      type="button"
      onClick={stop}
      className="fixed bottom-5 start-5 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#087D91] text-white text-sm font-semibold shadow-lg shadow-[#087D91]/30 hover:bg-[#06697A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#087D91] cursor-pointer"
      aria-label={isAr ? 'إيقاف التلاوة' : 'Stop the recitation'}
    >
      <span className="flex items-end gap-0.5 h-3" aria-hidden="true">
        <span className="w-0.5 bg-white/90 rounded-full animate-[recitation_0.9s_ease-in-out_infinite] h-full" />
        <span className="w-0.5 bg-white/90 rounded-full animate-[recitation_0.9s_ease-in-out_0.2s_infinite] h-2/3" />
        <span className="w-0.5 bg-white/90 rounded-full animate-[recitation_0.9s_ease-in-out_0.4s_infinite] h-1/2" />
      </span>
      <VolumeX className="w-4 h-4" aria-hidden="true" />
      {isAr ? 'إيقاف التلاوة' : 'Stop recitation'}
    </button>
  );
}
