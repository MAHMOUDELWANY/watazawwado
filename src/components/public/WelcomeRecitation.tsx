import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VolumeX } from 'lucide-react';
import { playWelcome, useWelcomeAudio } from '../../lib/welcomeAudio';

/**
 * Homepage, first visit of the session: tries to start the welcome recitation by itself.
 * Browsers usually block sound until the visitor taps, so the first tap on the page starts it.
 * No "turn the sound on" prompt (owner, 2026-10-27): only a mute control in the header while it plays.
 * The recitation can be played again any time from the button under the verse (homepage only).
 * Client-only: everything runs inside useEffect.
 */

const SESSION_KEY = 'wz_welcome_recitation_played';
const EVENTS = ['touchend', 'pointerup', 'click', 'keydown'] as const;

const read = (store: () => Storage, key: string) => { try { return store().getItem(key); } catch { return null; } };
const write = (store: () => Storage, key: string) => { try { store().setItem(key, '1'); } catch { /* storage blocked */ } };

export function WelcomeRecitation(_props: { isAr: boolean }) {
  useEffect(() => {
    if (typeof window === 'undefined' || read(() => sessionStorage, SESSION_KEY)) return;
    let done = false;
    let busy = false;

    const started = () => {
      done = true;
      removeListeners();
      write(() => sessionStorage, SESSION_KEY);
    };

    const onInteraction = () => {
      if (busy || done) return;
      busy = true;
      playWelcome().then((ok) => { busy = false; if (ok) started(); });
    };
    const removeListeners = () => EVENTS.forEach((ev) => window.removeEventListener(ev, onInteraction, true));
    EVENTS.forEach((ev) => window.addEventListener(ev, onInteraction, { capture: true, passive: true }));

    playWelcome(false).then((ok) => { if (ok) started(); });

    return removeListeners;
  }, []);

  return null;
}

/** Mute control while the recitation plays: sits in the site header, beside the language switch (owner, 2026-10-27). */
export function WelcomeMuteButton({ isAr }: { isAr: boolean }) {
  const { playing, stop } = useWelcomeAudio();
  return (
    <AnimatePresence initial={false}>
      {playing && (
        <motion.button
          type="button"
          onClick={stop}
          initial={{ opacity: 0, scale: 0.7, width: 0 }}
          animate={{ opacity: 1, scale: 1, width: 44 }}
          exit={{ opacity: 0, scale: 0.7, width: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 380 }}
          className="relative shrink-0 h-11 grid place-items-center rounded-xl bg-[var(--teal)] text-white shadow-2xs hover:bg-[var(--teal-hover)] cursor-pointer focus-ring overflow-hidden"
          aria-label={isAr ? 'إيقاف التلاوة' : 'Stop the recitation'}
          title={isAr ? 'إيقاف التلاوة' : 'Stop the recitation'}
        >
          <VolumeX className="w-[18px] h-[18px]" aria-hidden="true" />
          <span className="absolute bottom-1.5 inset-x-0 flex justify-center items-end gap-[2px] h-1.5" aria-hidden="true">
            <span className="w-[2px] h-full bg-white/80 rounded-full animate-[recitation_0.9s_ease-in-out_infinite]" />
            <span className="w-[2px] h-2/3 bg-white/80 rounded-full animate-[recitation_0.9s_ease-in-out_0.2s_infinite]" />
            <span className="w-[2px] h-1/2 bg-white/80 rounded-full animate-[recitation_0.9s_ease-in-out_0.4s_infinite]" />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
