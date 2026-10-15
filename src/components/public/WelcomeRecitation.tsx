import React, { useEffect, useRef, useState } from 'react';
import { VolumeX } from 'lucide-react';

/**
 * Plays the site's welcome recitation (﴿وتزودوا فإن خير الزاد التقوى﴾, public/welcome.mp3) once per
 * browser session, on the visitor's first interaction with the homepage (browsers block sound
 * before a click or tap). It fades in from silence to 50% over 1.5s, and a small "stop" button is
 * shown while it plays so the visitor can always silence it.
 *
 * Client-only: everything runs inside useEffect. Mount it once on the homepage.
 */

const SRC = '/welcome.mp3';
const SESSION_KEY = 'wz_welcome_recitation_played';
const TARGET_VOLUME = 0.5;
const FADE_MS = 1500;
const EVENTS = ['pointerdown', 'touchstart', 'click', 'keydown'] as const;

export function WelcomeRecitation({ isAr }: { isAr: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
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
    audio.volume = 0;
    audioRef.current = audio;
    audio.addEventListener('ended', () => setPlaying(false));

    const fadeIn = () => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / FADE_MS);
        audio.volume = TARGET_VOLUME * t;
        if (t < 1) fadeRef.current = requestAnimationFrame(step);
      };
      fadeRef.current = requestAnimationFrame(step);
    };

    const onFirstInteraction = () => {
      removeListeners();
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {}
      audio
        .play()
        .then(() => {
          setPlaying(true);
          fadeIn();
        })
        .catch(() => {
          // Blocked by the browser or the file failed to load: stay silent, never break the page.
          setPlaying(false);
        });
    };

    const removeListeners = () => {
      EVENTS.forEach((e) => window.removeEventListener(e, onFirstInteraction, true));
    };

    EVENTS.forEach((e) => window.addEventListener(e, onFirstInteraction, { capture: true, passive: true }));

    return () => {
      removeListeners();
      if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
      // Leaving the homepage takes the stop button away, so fade the recitation out with it.
      if (!audio.paused) {
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
    };
  }, []);

  const stop = () => {
    const audio = audioRef.current;
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
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
