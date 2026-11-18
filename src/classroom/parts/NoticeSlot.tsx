import React, { useEffect, useState } from 'react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';

export type RoomNotice = {
  /** Stable per kind ("reconnecting", "weak"): a new key replays the arrival. */
  key: string;
  /** Lower shows first (DESIGN-BRIEF 3.4): fallback 1, reconnecting 3, muted 4, weak line 5, focus 6, welcome back 7. */
  priority: number;
  icon?: React.ReactNode;
  text: React.ReactNode;
  action?: React.ReactNode;
  /** A whole notice of its own (the Zoom fallback brings its own card and its alert role). */
  custom?: React.ReactNode;
};

/**
 * One notice at a time, never over a face: the most important live notice, and "+1" when another is waiting (tap to
 * see it). Desktop: under the top capsule. Phone: just above the control bar, in the thumb zone.
 */
export function NoticeSlot({ notices, className }: { notices: RoomNotice[]; className?: string }) {
  const { t } = useT();
  const sorted = [...notices].sort((a, b) => a.priority - b.priority);
  const [skip, setSkip] = useState(0);
  const topKey = sorted[0]?.key;
  // A new most-important notice always shows first.
  useEffect(() => { setSkip(0); }, [topKey]);
  const shown = sorted.length ? sorted[skip % sorted.length] : null;
  const waiting = sorted.length - 1;

  return (
    <div role="status" aria-live="polite" className={cn('pointer-events-none flex justify-center px-3', className)}>
      {shown && (shown.custom ? <div key={shown.key} className="room-notice pointer-events-auto">{shown.custom}</div> : (
        <div key={shown.key}
          className="room-notice glass-3 pointer-events-auto flex max-w-[min(36rem,100%)] items-center gap-x-3 gap-y-1 rounded-[var(--r-4)] py-2 pe-2 ps-4 text-sm text-foreground">
          {shown.icon && <span className="shrink-0 text-[#F0B54A]" aria-hidden="true">{shown.icon}</span>}
          <span className="min-w-0 py-1 font-medium leading-snug">{shown.text}</span>
          {(shown.action || waiting > 0) && (
            <span className="ms-auto flex shrink-0 items-center gap-1">
              {shown.action}
              {waiting > 0 && (
                <button type="button" onClick={() => setSkip((n) => n + 1)}
                  aria-label={t(`${waiting} more notice`, `فيه ${waiting} تنبيه تاني`)}
                  className="room-press grid h-9 min-w-9 place-items-center rounded-[var(--r-pill)] bg-white/10 px-2 text-[0.78rem] font-semibold tabular-nums text-foreground hover:bg-white/15 focus-ring">
                  <span dir="ltr">+{waiting}</span>
                </button>
              )}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
