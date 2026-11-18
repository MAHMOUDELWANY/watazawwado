import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';

export const WARN_BEFORE_END_MS = 5 * 60_000;

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Elapsed and remaining of the booked time (spec §4: counts to the booked end, not the hard close). Always visible to
 * the teacher, with a calm warning in the last 5 minutes. The learner gets it behind a clock icon, closed by default,
 * so they do not watch the clock.
 */
export function Timer({ startMs, endMs, now, teacher }: { startMs: number; endMs: number; now: number; teacher: boolean }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const elapsed = Math.max(0, now - startMs);
  const remaining = endMs - now;
  const warn = remaining <= WARN_BEFORE_END_MS;
  const over = remaining < 0;

  const readout = (
    <span className="grid tabular-nums leading-tight">
      <span className="text-sm font-semibold text-foreground">
        {over ? t(`${clock(-remaining)} over`, `زيادة ${clock(-remaining)}`) : t(`${clock(remaining)} left`, `فاضل ${clock(remaining)}`)}
      </span>
      <span className="text-[0.78rem] text-muted-foreground">{t(`${clock(elapsed)} in`, `عدّى ${clock(elapsed)}`)}</span>
    </span>
  );

  if (teacher) {
    return (
      <div role="timer" aria-live={warn ? 'polite' : 'off'}
        className={cn('flex items-center gap-2 rounded-[var(--r-pill)] px-3 py-1.5 transition-colors duration-[var(--dur-ui)]',
          warn ? 'bg-sand-light text-sand-foreground ring-1 ring-sand-border' : 'glass-1')}>
        <Clock className={cn('h-4 w-4 shrink-0', warn ? 'text-accent' : 'text-muted-foreground')} aria-hidden="true" />
        {readout}
        {warn && !over && <span className="sr-only">{t('Five minutes or less left.', 'فاضل خمس دقايق أو أقل.')}</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        aria-label={open ? t('Hide the time', 'اخفي الوقت') : t('Show the time', 'اعرض الوقت')}
        className="glass-1 grid h-11 w-11 place-items-center rounded-full text-foreground focus-ring active:scale-[0.97] transition-transform">
        <Clock className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div className="glass-3 absolute end-0 top-12 z-20 rounded-[var(--r-2)] px-3 py-2 whitespace-nowrap">{readout}</div>
      )}
    </div>
  );
}
