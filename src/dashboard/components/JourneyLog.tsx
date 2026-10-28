import React, { useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import type { DashboardStudentDetail } from '../types';

/**
 * The teacher's journey log for one student (look C, owner 2026-10-28): attendance over the last 12 weeks,
 * then lesson notes and milestones newest first, so the teacher sees the last few lessons before the next one.
 */

const WEEKS = 12;

export function weeklyAttendance(bookings: DashboardStudentDetail['bookings'], now: DateTime, tz: string): number[] {
  const start = now.setZone(tz).startOf('week').minus({ weeks: WEEKS - 1 });
  const counts = Array(WEEKS).fill(0);
  for (const b of bookings || []) {
    if (b.status !== 'completed') continue;
    const at = DateTime.fromISO(b.scheduled_start).setZone(tz);
    const w = Math.floor(at.diff(start, 'weeks').weeks);
    if (at.isValid && w >= 0 && w < WEEKS) counts[w] += 1;
  }
  return counts;
}

type Entry = { id: string; at: string; kind: 'note' | 'milestone'; title: string; body?: string | null };

export function JourneyLog({ detail, tz, isAr }: { detail: DashboardStudentDetail; tz: string; isAr: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const weeks = useMemo(() => weeklyAttendance(detail.bookings, DateTime.now(), tz), [detail.bookings, tz]);
  const attended = weeks.filter((n) => n > 0).length;

  const entries = useMemo<Entry[]>(() => {
    const notes: Entry[] = (detail.notes || []).map((n) => ({
      id: `n-${n.id}`,
      at: n.created_at,
      kind: 'note',
      title: (n.family_summary || n.content || '').split('\n')[0],
      body: n.next_steps ? `${isAr ? 'الجاي: ' : 'Next: '}${n.next_steps}` : null,
    }));
    const milestones: Entry[] = (detail.milestones || []).map((m) => ({
      id: `m-${m.id}`,
      at: m.reached_at,
      kind: 'milestone',
      title: isAr ? m.title_ar : m.title_en,
    }));
    return [...notes, ...milestones].filter((e) => e.title).sort((a, b) => b.at.localeCompare(a.at));
  }, [detail.notes, detail.milestones, isAr]);

  const shown = showAll ? entries : entries.slice(0, 4);
  const day = (iso: string) => DateTime.fromISO(iso).setZone(tz).setLocale(isAr ? 'ar' : 'en').toLocaleString({ weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <section className="rounded-2xl bg-surface border border-border p-5 grid gap-4" aria-labelledby="journey-log-h" data-testid="journey-log">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="journey-log-h" className="font-display text-lg font-bold text-foreground">{isAr ? 'سجل الرحلة' : 'Journey log'}</h2>
        <span className="text-sm text-muted-foreground">
          {isAr ? `حضر في ${attended.toLocaleString('ar-EG')} من آخر ${WEEKS.toLocaleString('ar-EG')} أسبوع` : `Came in ${attended} of the last ${WEEKS} weeks`}
        </span>
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }} role="img" aria-label={isAr ? 'الحضور في آخر 12 أسبوع، الأقدم الأول' : 'Attendance over the last 12 weeks, oldest first'}>
        {weeks.map((n, i) => (
          <span key={i} className={`aspect-square max-w-full rounded ${n >= 2 ? 'bg-[#0A2E35] dark:bg-teal' : n === 1 ? 'bg-teal/70' : 'bg-border'}`} title={String(n)} />
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{isAr ? 'لسه مفيش ملاحظات. بعد أول حصة، اكتب ملخص الأسرة وهيظهر هنا.' : 'No notes yet. After the first lesson, write the family summary and it shows up here.'}</p>
      ) : (
        <ol className="grid">
          {shown.map((e, i) => (
            <li key={e.id} className="grid grid-cols-[18px_minmax(0,1fr)] gap-3 pb-3 relative">
              {i < shown.length - 1 && <span className="absolute top-5 bottom-0 start-[8px] w-0.5 bg-border" aria-hidden="true" />}
              <span className={`mt-1 w-[18px] h-[18px] rounded-full border-[3px] ${e.kind === 'milestone' ? 'border-gold bg-gold' : 'border-teal bg-surface'}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{day(e.at)}{e.kind === 'milestone' ? (isAr ? ' · محطة' : ' · Milestone') : ''}</p>
                <p className="text-sm font-semibold text-foreground">{e.title}</p>
                {e.body && <p className="text-sm text-muted-foreground">{e.body}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
      {entries.length > 4 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="justify-self-start min-h-11 text-sm font-semibold text-teal underline underline-offset-4 cursor-pointer focus-ring">
          {showAll ? (isAr ? 'اعرض أقل' : 'Show less') : (isAr ? `اعرض الكل (${entries.length.toLocaleString('ar-EG')})` : `Show all (${entries.length})`)}
        </button>
      )}
    </section>
  );
}
