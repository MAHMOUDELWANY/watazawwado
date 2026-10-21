import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import { CalendarClock, X } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { useActiveLearner } from '../activeLearner';

interface Suggestion {
  fromBookingId: string;
  learnerId: string;
  learnerName: string | null;
  durationMinutes: number;
  utcStartIso: string;
  teacherName: string | null;
}

const DISMISS_KEY = 'watazawwado_next_week_dismissed';

/**
 * RN-04: after a lesson, "same time next week?" when the teacher is free then. One tap opens the booking flow with
 * that time chosen; nothing is booked until the family confirms (no recurring bookings, by decision).
 */
export function NextWeekSuggestion({ isAr, timezone }: { isAr: boolean; timezone: string }) {
  const { activeId } = useActiveLearner();
  const [s, setS] = useState<Suggestion | null>(null);

  useEffect(() => {
    let cancelled = false;
    const q = activeId ? `?learnerId=${encodeURIComponent(activeId)}` : '';
    authedJson<{ suggestion: Suggestion | null }>(`/api/student/next-week-suggestion${q}`)
      .then((d) => {
        if (cancelled || !d?.suggestion) return;
        let dismissed: string | null = null;
        try { dismissed = window.localStorage.getItem(DISMISS_KEY); } catch { /* storage blocked */ }
        if (dismissed !== d.suggestion.utcStartIso) setS(d.suggestion);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeId]);

  if (!s) return null;
  const when = DateTime.fromISO(s.utcStartIso).setZone(timezone || 'UTC').setLocale(isAr ? 'ar' : 'en');
  const label = when.isValid ? when.toFormat(isAr ? 'cccc، d LLLL، h:mm a' : 'cccc d LLLL, h:mm a') : '';
  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, s.utcStartIso); } catch { /* storage blocked */ }
    setS(null);
  };
  const href = `/student/book?repeat=${encodeURIComponent(s.fromBookingId)}&slot=${encodeURIComponent(s.utcStartIso)}`;

  return (
    <section data-testid="next-week-suggestion" className="relative flex items-center gap-3 p-4 rounded-2xl glass-card border border-[var(--teal)]/30" aria-labelledby="next-week-title">
      <CalendarClock className="w-6 h-6 text-[var(--teal)] shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 id="next-week-title" className="text-sm font-semibold text-foreground">
          {isAr ? 'نفس الميعاد الأسبوع الجاي؟' : 'Same time next week?'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {label}
          {s.teacherName ? (isAr ? ` مع ${s.teacherName}` : ` with ${s.teacherName}`) : ''}
          {s.learnerName ? ` · ${s.learnerName}` : ''}
        </p>
      </div>
      <Link to={href} className="inline-flex items-center min-h-11 px-4 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold shrink-0">
        {isAr ? 'احجزها' : 'Book it'}
      </Link>
      <button type="button" onClick={dismiss} aria-label={isAr ? 'مش دلوقتي' : 'Not now'} className="tap-44 relative w-8 h-8 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle cursor-pointer shrink-0">
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </section>
  );
}
