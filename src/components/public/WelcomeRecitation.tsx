import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VolumeX } from 'lucide-react';
import { playWelcome, useWelcomeAudio } from '../../lib/welcomeAudio';

/**
 * Homepage, first visit of the session: tries to start the welcome recitation by itself.
 * Browsers usually block sound until the visitor taps, so the first tap on the page starts it.
 * No "turn the sound on" prompt (owner, 2026-10-27): only a floating mute button while it plays.
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

/**
 * Mute control while the recitation plays (owner, 2026-10-27): a round button floating at the screen's edge, a third of
 * the way down, clear of the header, the learning guide and back-to-top. It can be dragged anywhere on the screen.
 */
export function WelcomeMuteButton({ isAr }: { isAr: boolean }) {
  const { playing, stop } = useWelcomeAudio();
  const bounds = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const label = isAr ? 'إيقاف التلاوة' : 'Stop the recitation';
  return (
    <div ref={bounds} className="fixed inset-x-2 top-20 bottom-24 z-[46] pointer-events-none" aria-hidden={!playing}>
      <AnimatePresence>
        {playing && (
          <motion.button
            type="button"
            drag
            dragConstraints={bounds}
            dragMomentum={false}
            dragElastic={0.08}
            onDragStart={() => { dragged.current = true; }}
            onClick={() => { if (dragged.current) { dragged.current = false; return; } stop(); }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', damping: 24, stiffness: 340 }}
            className="pointer-events-auto absolute end-1 top-[22%] w-14 h-14 grid place-items-center rounded-full bg-[var(--teal)] text-white touch-none cursor-grab active:cursor-grabbing shadow-[0_12px_28px_-10px_rgba(5,54,63,0.7)] ring-1 ring-[#E5A93C]/50 focus-ring"
            aria-label={label}
            title={label}
          >
            <span className="absolute inset-0 rounded-full border-2 border-[var(--teal)] animate-ping opacity-30 motion-reduce:hidden" aria-hidden="true" />
            <VolumeX className="w-5 h-5" aria-hidden="true" />
            <span className="absolute bottom-2 inset-x-0 flex justify-center items-end gap-[2px] h-1.5" aria-hidden="true">
              <span className="w-[2px] h-full bg-white/80 rounded-full animate-[recitation_0.9s_ease-in-out_infinite]" />
              <span className="w-[2px] h-2/3 bg-white/80 rounded-full animate-[recitation_0.9s_ease-in-out_0.2s_infinite]" />
              <span className="w-[2px] h-1/2 bg-white/80 rounded-full animate-[recitation_0.9s_ease-in-out_0.4s_infinite]" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
