import React, { useEffect, useRef, useState } from 'react';
import { EyeOff, Hourglass } from 'lucide-react';
import { useT } from '../../lib/language';
import type { RoomEvent } from '../../lib/roomEvents';

/** Spec §4: the teacher hears about it only after 10 seconds away. */
export const FOCUS_GRACE_MS = 10_000;

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Learner side: reports leaving and coming back (visibilitychange and window blur), and on return after the grace
 * shows "your teacher is waiting" for a few seconds, unless the teacher turned the warning off.
 */
export function LearnerFocus({ send, warningOff }: { send: (e: RoomEvent) => void; warningOff: boolean }) {
  const { t } = useT();
  const awaySince = useRef<number | null>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
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
  }, [send, warningOff]);

  useEffect(() => {
    if (!waiting) return;
    const id = window.setTimeout(() => setWaiting(false), 6000);
    return () => window.clearTimeout(id);
  }, [waiting]);

  if (!waiting) return null;
  return (
    <p role="status" className="glass-3 flex items-center gap-2 rounded-[var(--r-pill)] px-4 py-2 text-sm font-medium text-foreground">
      <Hourglass className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      {t('Welcome back. Your teacher is waiting for you.', 'أهلاً بيك تاني. المعلم مستنيك.')}
    </p>
  );
}

/** Teacher side: "not on the lesson screen · 0:42" once the learner has been away for the grace period. */
export function TeacherFocus({ awayAt, now, warningOff, onTurnOff }: { awayAt: number | null; now: number; warningOff: boolean; onTurnOff: () => void }) {
  const { t } = useT();
  if (awayAt == null || warningOff) return null;
  // The learner's clock stamps `at`; clamp so a skewed clock never shows a negative or huge time.
  const gone = Math.min(Math.max(0, now - awayAt), 6 * 3600_000);
  if (gone < FOCUS_GRACE_MS) return null;
  return (
    <div role="status" className="glass-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[var(--r-3)] px-4 py-2 text-sm text-foreground">
      <span className="flex items-center gap-2 font-medium">
        <EyeOff className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <span className="tabular-nums">{t(`Not on the lesson screen · ${mmss(gone)}`, `مش على شاشة الحصة · ${mmss(gone)}`)}</span>
      </span>
      <button type="button" onClick={onTurnOff} className="text-teal underline underline-offset-4 focus-ring rounded">
        {t('I asked them to; stop warning', 'أنا اللي طلبت؛ وقّف التنبيه')}
      </button>
    </div>
  );
}
