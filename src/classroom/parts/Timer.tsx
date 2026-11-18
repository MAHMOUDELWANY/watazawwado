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

/** Numbers inside Arabic text keep their own direction. */
const Num = ({ children }: { children: React.ReactNode }) => <bdi dir="ltr" className="tabular-nums">{children}</bdi>;

/**
 * Remaining of the booked time (spec §4: counts to the booked end, not the hard close).
 * - teacher / observer: always visible in the top capsule, a thin gold line fills as the lesson goes; the last
 *   5 minutes turn copper on sand, and running over reads "+2:10" in copper (being over is not an error). A screen
 *   reader hears it once at 5 minutes and once at the end, never per second.
 * - learner: behind a clock button, closed by default, so they do not watch the clock.
 * - kid: no numbers at all, a lantern that fills; a tap says "About 10 minutes left".
 */
export function Timer({ startMs, endMs, now, mode }: { startMs: number; endMs: number; now: number; mode: 'teacher' | 'observer' | 'learner' | 'kid' }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const total = Math.max(1, endMs - startMs);
  const remaining = endMs - now;
  const progress = Math.min(1, Math.max(0, (now - startMs) / total));
  const warn = remaining <= WARN_BEFORE_END_MS;
  const over = remaining < 0;
  const announce = over ? t('The lesson time is over.', 'وقت الحصة خلص.') : warn ? t('Five minutes or less left.', 'فاضل خمس دقايق أو أقل.') : '';

  if (mode === 'teacher' || mode === 'observer') {
    return (
      <span role="timer" aria-live="off" className={cn('relative flex items-center gap-1.5 rounded-[var(--r-pill)] px-2.5 py-1 transition-colors duration-[var(--dur-ui)]',
        warn && 'bg-[#3D2A20] text-[#F2B39F]')}>
        <span className="text-sm font-semibold">
          {over ? <Num>+{clock(-remaining)}</Num> : <>{t('', 'فاضل ')}<Num>{clock(remaining)}</Num>{t(' left', '')}</>}
        </span>
        <span aria-hidden="true" className="absolute inset-x-2.5 -bottom-px h-[2px] overflow-hidden rounded-full bg-white/10">
          <span className={cn('block h-full origin-left rounded-full rtl:origin-right', warn ? 'bg-[#DA7960]' : 'bg-[#F0B54A]')}
            style={{ transform: `scaleX(${progress})` }} />
        </span>
        <span className="sr-only" aria-live="polite">{announce}</span>
      </span>
    );
  }

  const minutesLeft = Math.max(1, Math.round(remaining / 60_000));
  const kid = mode === 'kid';
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        aria-label={open ? t('Hide the time', 'اخفي الوقت') : t('Show the time', 'اعرض الوقت')}
        className="room-press glass-1 grid h-11 w-11 place-items-center rounded-full text-foreground focus-ring">
        {kid ? <Lantern fill={1 - progress} /> : <Clock className="h-5 w-5" aria-hidden="true" />}
      </button>
      {open && (
        <div className="room-sheet glass-3 absolute end-0 top-12 z-20 whitespace-nowrap rounded-[var(--r-3)] px-3.5 py-2 text-sm font-medium text-foreground [transform-origin:top_right] rtl:[transform-origin:top_left]">
          {kid
            ? (over ? t('Almost done!', 'خلاص قرّبنا!') : t(`About ${minutesLeft} minutes left`, `فاضل حوالي ${minutesLeft} دقيقة`))
            : over ? <><Num>+{clock(-remaining)}</Num> {t('over', 'زيادة')}</> : <>{t('', 'فاضل ')}<Num>{clock(remaining)}</Num>{t(' left', '')}</>}
        </div>
      )}
    </div>
  );
}

/** A small lantern whose light goes down as the lesson goes on (child mode, no numbers). */
function Lantern({ fill }: { fill: number }) {
  const h = Math.round(14 * Math.max(0.1, fill));
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M9 3h6M12 3v2" stroke="#D8C6AE" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 8c0-1.7 2.2-3 5-3s5 1.3 5 3v10c0 .6-.4 1-1 1H8c-.6 0-1-.4-1-1V8z" fill="none" stroke="#D8C6AE" strokeWidth="1.5" />
      <rect x="8.5" y={19 - h - 0.5} width="7" height={h} rx="1.5" fill="#F0B54A" opacity="0.9" />
    </svg>
  );
}
