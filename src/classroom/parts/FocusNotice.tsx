import { useEffect, useRef, useState } from 'react';
import type { RoomEvent } from '../../lib/roomEvents';

/** Spec §4: the teacher hears about it only after 10 seconds away. */
export const FOCUS_GRACE_MS = 10_000;
/** How long the learner's "welcome back" stays in the notice slot. */
export const WELCOME_BACK_MS = 6000;

export const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Learner side: reports leaving and coming back (visibilitychange and window blur). True for a few seconds after a
 * return that came after the grace, unless the teacher turned the warning off; the room shows "welcome back" then.
 */
export function useLearnerFocus(enabled: boolean, send: (e: RoomEvent) => void, warningOff: boolean): boolean {
  const awaySince = useRef<number | null>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const away = () => {
      if (awaySince.current != null) return;
      awaySince.current = Date.now();
      send({ t: 'focus', away: true, at: awaySince.current });
    };
    const back = () => {
      if (document.visibilityState === 'hidden' || awaySince.current == null) return;
      const gone = Date.now() - awaySince.current;
      awaySince.current = null;
      send({ t: 'focus', away: false, at: Date.now() });
      if (gone >= FOCUS_GRACE_MS && !warningOff) setWaiting(true);
    };
    const onVis = () => (document.visibilityState === 'hidden' ? away() : back());
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', away);
    window.addEventListener('focus', back);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', away);
      window.removeEventListener('focus', back);
    };
  }, [enabled, send, warningOff]);

  useEffect(() => {
    if (!waiting) return;
    const id = window.setTimeout(() => setWaiting(false), WELCOME_BACK_MS);
    return () => window.clearTimeout(id);
  }, [waiting]);

  return waiting;
}

/** Teacher side: how long the learner has been off the lesson screen, once past the grace; null otherwise. */
export function teacherAwayMs(awayAt: number | null, now: number, warningOff: boolean): number | null {
  if (awayAt == null || warningOff) return null;
  // The learner's clock stamps `at`; clamp so a skewed clock never shows a negative or huge time.
  const gone = Math.min(Math.max(0, now - awayAt), 6 * 3600_000);
  return gone < FOCUS_GRACE_MS ? null : gone;
}
