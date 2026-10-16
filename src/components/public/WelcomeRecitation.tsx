import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { playWelcome, useWelcomeAudio } from '../../lib/welcomeAudio';

/**
 * Homepage, first visit of the session: tries to start the welcome recitation by itself.
 * Browsers usually block sound until the visitor taps, so the first time ever we also show an
 * animated hint with a sound button; any tap on the page starts it too. After that, the
 * recitation can be played again any time from the button under the verse (homepage only).
 * Client-only: everything runs inside useEffect.
 */

const SESSION_KEY = 'wz_welcome_recitation_played';
const HINT_KEY = 'wz_sound_hint_seen';
const EVENTS = ['touchend', 'pointerup', 'click', 'keydown'] as const;

const read = (store: () => Storage, key: string) => { try { return store().getItem(key); } catch { return null; } };
const write = (store: () => Storage, key: string) => { try { store().setItem(key, '1'); } catch { /* storage blocked */ } };

export function WelcomeRecitation({ isAr }: { isAr: boolean }) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || read(() => sessionStorage, SESSION_KEY)) return;
    let done = false;
    let busy = false;

    const started = () => {
      done = true;
      removeListeners();
      write(() => sessionStorage, SESSION_KEY);
      write(() => localStorage, HINT_KEY);
      setShowHint(false);
    };

    const onInteraction = (e: Event) => {
      if (busy || done) return;
      // Closing the hint must not start the sound.
      if ((e.target as Element | null)?.closest?.('[data-sound-dismiss]')) return;
      busy = true;
      playWelcome().then((ok) => { busy = false; if (ok) started(); });
    };
    const removeListeners = () => EVENTS.forEach((ev) => window.removeEventListener(ev, onInteraction, true));
    EVENTS.forEach((ev) => window.addEventListener(ev, onInteraction, { capture: true, passive: true }));

    playWelcome(false).then((ok) => {
      if (ok) started();
      else if (!done && !read(() => localStorage, HINT_KEY)) setShowHint(true);
    });

    return removeListeners;
  }, []);

  const dismiss = () => {
    write(() => localStorage, HINT_KEY);
    setShowHint(false);
  };

  return (
    <AnimatePresence>
      {showHint && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260, delay: 0.8 }}
          className="fixed bottom-24 sm:bottom-5 inset-x-4 sm:inset-x-auto sm:start-5 z-50 sm:max-w-sm"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className="relative overflow-hidden rounded-2xl border border-[#087D91]/30 bg-surface/95 backdrop-blur-md shadow-2xl shadow-[#087D91]/20 p-4 flex items-center gap-4">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#087D91] via-[#E5A93C] to-[#C51F24]" aria-hidden="true" />
            {/* No onClick: the page-wide tap listener above starts the sound and hides this hint. */}
            <button
              type="button"
              className="relative shrink-0 w-14 h-14 rounded-full bg-[#087D91] text-white flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#087D91]"
              aria-label={isAr ? 'تشغيل تلاوة الترحيب' : 'Play the welcome recitation'}
            >
              {[0, 0.6].map((delay) => (
                <motion.span
                  key={delay}
                  className="absolute inset-0 rounded-full border-2 border-[#087D91]"
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, delay, ease: 'easeOut' }}
                  aria-hidden="true"
                />
              ))}
              <motion.span animate={{ rotate: [0, -10, 10, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.4 }}>
                <Volume2 className="w-6 h-6" aria-hidden="true" />
              </motion.span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground text-sm">
                {isAr ? 'اضغط على زر الصوت 🎧' : 'Tap the sound button 🎧'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                {isAr
                  ? 'عشان تسمع تلاوة الترحيب ﴿وتزودوا فإن خير الزاد التقوى﴾. وتقدر تسمعها تاني من الزر اللي تحت الآية.'
                  : 'to hear our welcome recitation. You can play it again from the button under the verse.'}
              </p>
            </div>
            <button
              type="button"
              data-sound-dismiss
              onClick={dismiss}
              className="self-start shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-subtle cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Floating "stop" button while the recitation plays, on every public page (PublicLayout). */
export function WelcomeStopButton({ isAr }: { isAr: boolean }) {
  const { playing, stop } = useWelcomeAudio();
  return (
    <AnimatePresence>
      {playing && (
        <motion.button
          type="button"
          onClick={stop}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 start-4 sm:start-6 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#087D91] text-white text-sm font-semibold shadow-lg shadow-[#087D91]/30 hover:bg-[#06697A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#087D91] cursor-pointer"
          aria-label={isAr ? 'إيقاف التلاوة' : 'Stop the recitation'}
        >
          <span className="flex items-end gap-0.5 h-3" aria-hidden="true">
            <span className="w-0.5 bg-white/90 rounded-full animate-[recitation_0.9s_ease-in-out_infinite] h-full" />
            <span className="w-0.5 bg-white/90 rounded-full animate-[recitation_0.9s_ease-in-out_0.2s_infinite] h-2/3" />
            <span className="w-0.5 bg-white/90 rounded-full animate-[recitation_0.9s_ease-in-out_0.4s_infinite] h-1/2" />
          </span>
          <VolumeX className="w-4 h-4" aria-hidden="true" />
          {isAr ? 'إيقاف التلاوة' : 'Stop recitation'}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
