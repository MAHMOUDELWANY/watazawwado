import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { UserCheck } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type AttendanceEvent = {
  source: 'site' | 'zoom';
  event: 'link_opened' | 'meeting_started' | 'meeting_ended' | 'joined' | 'left' | 'waiting_room_joined';
  role: 'teacher' | 'student' | 'unknown';
  participant_name: string | null;
  occurred_at: string;
};

/** Who opened the lesson link on our site and what Zoom reported (joined, left, start and end), in time order. */
export function LessonAttendance({ bookingId }: { bookingId: string }) {
  const { t, isAr } = useT();
  const [events, setEvents] = useState<AttendanceEvent[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [summary, setSummary] = useState<{ held: boolean; togetherMinutes: number; requiredMinutes: number; joins: { teacher: number; student: number }; unstable: string | null } | null>(null);

  useEffect(() => {
    let alive = true;
    dashboardFetch<{ events: AttendanceEvent[]; summary?: any }>(`/api/dashboard/bookings/${encodeURIComponent(bookingId)}/attendance`)
      .then(r => { if (alive) { setEvents(r?.events || []); setSummary(r?.summary || null); } })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [bookingId]);

  const who = (e: AttendanceEvent) =>
    e.role === 'teacher' ? t('Teacher', 'المعلم') : e.role === 'student' ? t('Student', 'الطالب') : '';

  const label = (e: AttendanceEvent) => {
    switch (e.event) {
      case 'link_opened': return t(`${who(e)} clicked the lesson link`, `${who(e)} ضغط على رابط الحصة`);
      case 'meeting_started': return t('Meeting started', 'الحصة بدأت');
      case 'meeting_ended': return t('Meeting ended', 'الحصة خلصت');
      case 'joined': return t(`${who(e)} joined Zoom`, `${who(e)} دخل Zoom`);
      case 'left': return t(`${who(e)} left Zoom`, `${who(e)} خرج من Zoom`);
      case 'waiting_room_joined': return t(`${who(e)} is in the waiting room`, `${who(e)} في غرفة الانتظار`);
    }
  };

  const fmt = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);

  return (
    <div className="glass-card p-4 rounded-xl border border-border shadow-2xs space-y-3">
      <div className="border-b border-border pb-2">
        <span className="text-sm font-semibold tracking-wider text-muted-foreground flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          {t('Attendance', 'الحضور')}
        </span>
      </div>
      {summary && (events?.length || 0) > 0 && (
        <p className={`text-sm rounded-lg px-3 py-2 border ${summary.held ? 'border-success/30 bg-success/10' : 'border-warning/30 bg-warning/10 text-warning-ink'}`}>
          {summary.held
            ? t(`Held: together ${summary.togetherMinutes} min (needs ${summary.requiredMinutes}).`, `اتعملت: مع بعض ${summary.togetherMinutes} دقيقة (المطلوب ${summary.requiredMinutes}).`)
            : t(`Not held yet: together ${summary.togetherMinutes} of ${summary.requiredMinutes} min.`, `لسه ما اتحسبتش: مع بعض ${summary.togetherMinutes} من ${summary.requiredMinutes} دقيقة.`)}
          {' '}{t(`Joins: teacher ${summary.joins.teacher}, student ${summary.joins.student}.`, `مرات الدخول: المعلم ${summary.joins.teacher}، الطالب ${summary.joins.student}.`)}
          {summary.unstable && <strong>{' '}{t('Unstable connection.', 'اتصال غير مستقر.')}</strong>}
        </p>
      )}
      {failed ? (
        <p className="text-sm text-muted-foreground">{t('Could not load attendance.', 'مقدرناش نحمّل الحضور.')}</p>
      ) : events === null ? (
        <p className="text-sm text-muted-foreground">{t('Loading…', 'بنحمّل…')}</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('Nothing recorded for this lesson yet.', 'لسه مفيش حاجة متسجلة للحصة دي.')}</p>
      ) : (
        <ol className="space-y-1.5">
          {events.map((e, i) => (
            <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="text-foreground">
                {label(e)}
                {e.participant_name && e.role === 'student' ? <span className="text-muted-foreground"> · <bdi>{e.participant_name}</bdi></span> : null}
              </span>
              <time dateTime={e.occurred_at} className="text-muted-foreground tabular-nums">{fmt(e.occurred_at)}</time>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * Owner review 2026-11-07: before a lesson is recorded as done, say plainly when our records show nobody
 * (or only one side) came, so a lesson nobody attended is not marked "completed" by habit.
 */
export function AttendanceHint({ bookingId }: { bookingId: string }) {
  const { t } = useT();
  const [seen, setSeen] = useState<{ teacher: boolean; student: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    dashboardFetch<{ summary?: { teacher: boolean; student: boolean } }>(`/api/dashboard/bookings/${encodeURIComponent(bookingId)}/attendance`)
      .then(r => { if (alive && r?.summary) setSeen({ teacher: r.summary.teacher, student: r.summary.student }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [bookingId]);
  if (!seen || (seen.teacher && seen.student)) return null;
  const text = !seen.teacher && !seen.student
    ? t('Our records show nobody opened this lesson: not you (Start) and not the student. If the lesson did not happen, choose No-show, Technical problem or "I could not attend" instead.',
        'سجلاتنا بتقول إن محدش فتح الحصة دي: لا إنت (زرار ابدأ) ولا الطالب. لو الحصة ما اتعملتش، اختار غياب أو مشكلة تقنية أو "ماقدرتش أحضر".')
    : !seen.student
      ? t('Our records show the student never opened the lesson link. If they did not come, choose No-show instead.',
          'سجلاتنا بتقول إن الطالب ما فتحش رابط الحصة. لو ما حضرش، اختار غياب.')
      : t('Our records show you did not start this lesson from the site. If you were there, carry on.',
          'سجلاتنا بتقول إنك ما بدأتش الحصة من الموقع. لو كنت موجود كمّل عادي.');
  return <p role="status" className="text-sm rounded-xl border border-warning/30 bg-warning/10 text-warning-ink p-3">{text}</p>;
}
