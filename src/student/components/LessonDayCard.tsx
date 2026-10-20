import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Clock, ExternalLink, MessageCircle, NotebookPen, Video } from 'lucide-react';
import { buildWhatsAppUrl } from '../../lib/whatsapp';

/** Join opens 10 minutes before the start (ST-01). */
export const JOIN_OPENS_MIN = 10;

/** True when the lesson starts on the viewer's own calendar day (their device time zone). */
export function isLessonDay(startIso: string, now: Date = new Date()): boolean {
  const start = DateTime.fromISO(startIso);
  return start.isValid && start.hasSame(DateTime.fromJSDate(now), 'day');
}

export function joinState(startIso: string, endIso: string | null | undefined, now: Date = new Date()): 'early' | 'open' | 'ended' {
  const start = DateTime.fromISO(startIso);
  const end = endIso ? DateTime.fromISO(endIso) : start.plus({ minutes: 60 });
  const t = DateTime.fromJSDate(now);
  if (t >= end) return 'ended';
  return t >= start.minus({ minutes: JOIN_OPENS_MIN }) ? 'open' : 'early';
}

/** "in 2 h 15 min" / "بعد ساعتين و15 دقيقة"; "now" once it has started. */
export function countdownLabel(startIso: string, isAr: boolean, now: Date = new Date()): string {
  const mins = Math.ceil(DateTime.fromISO(startIso).diff(DateTime.fromJSDate(now), 'minutes').minutes);
  if (mins <= 0) return isAr ? 'الحصة بدأت' : 'Started';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (isAr) {
    const hours = h === 0 ? '' : h === 1 ? 'ساعة' : h === 2 ? 'ساعتين' : `${h} ساعات`;
    const minutes = m === 0 ? '' : `${m} دقيقة`;
    return `بعد ${[hours, minutes].filter(Boolean).join(' و')}`;
  }
  return `in ${[h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ')}`;
}

export function runningLateMessage(ref: string | null | undefined, learnerName: string | null | undefined, isAr: boolean): string {
  const who = learnerName ? (isAr ? ` (${learnerName})` : ` (${learnerName})`) : '';
  return isAr
    ? `السلام عليكم، هتأخر شوية عن حصة النهارده${who}${ref ? `، رقم الحجز ${ref}` : ''}. جاي في السكة إن شاء الله.`
    : `Assalamu alaikum, I'm running a few minutes late for today's lesson${who}${ref ? ` (booking ${ref})` : ''}. On my way, in sha Allah.`;
}

/**
 * ST-01: on lesson day the home page leads with this card: countdown, teacher, subject, Join (from 10 minutes
 * before), what to prepare (the teacher's last "next steps") and a "running late" WhatsApp message to the team.
 */
export function LessonDayCard({ booking, isAr }: { booking: any; isAr: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const start = booking.scheduledStart || booking.scheduled_start;
  const end = booking.scheduledEnd || booking.scheduled_end;
  const state = joinState(start, end, now);
  if (state === 'ended') return null;
  const zoom = String(booking.zoomMeetingLink || booking.zoom_join_url || '').trim();
  const hasZoom = /^https?:\/\//.test(zoom);
  const subject = isAr && booking.serviceArabicTitle ? booking.serviceArabicTitle : booking.serviceTitle;
  const time = DateTime.fromISO(start).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.TIME_SIMPLE);

  return (
    <section aria-labelledby="lesson-day-heading" className="rounded-3xl border border-primary/30 bg-primary/5 p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{isAr ? 'حصة النهارده' : "Today's lesson"}</p>
          <h2 id="lesson-day-heading" className="text-xl sm:text-2xl font-display font-bold text-foreground">
            {subject || (isAr ? 'حصتك' : 'Your lesson')}
            {booking.learnerName ? <span className="text-muted-foreground font-normal"> · {booking.learnerName}</span> : null}
          </h2>
          <p className="text-sm text-muted-foreground">
            {booking.teacherName ? (isAr ? `مع ${booking.teacherName}` : `with ${booking.teacherName}`) : (isAr ? 'مع معلمك' : 'with your teacher')}
          </p>
        </div>
        <div className="text-end">
          <div className="flex items-center gap-1.5 text-sm text-foreground justify-end">
            <Clock className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>{time}</span>
          </div>
          <div className="text-lg font-semibold text-primary" aria-live="polite">{countdownLabel(start, isAr, now)}</div>
        </div>
      </div>

      {booking.prepareNote && (
        <div className="flex items-start gap-2 p-3 rounded-xl glass-surface border border-border-subtle text-sm">
          <NotebookPen className="w-4 h-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-semibold text-foreground">{isAr ? 'جهّز للحصة' : 'Before the lesson'}</div>
            <p className="text-muted-foreground whitespace-pre-wrap">{booking.prepareNote}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        {hasZoom && state === 'open' ? (
          <a href={zoom} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 btn-zoom rounded-xl text-sm sm:text-[15px] font-semibold min-h-[44px]">
            <Video className="w-4 h-4" />
            <span>{isAr ? 'ادخل الحصة' : 'Join the lesson'}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-surface border border-border text-sm text-muted-foreground min-h-[44px]">
            <Video className="w-4 h-4" aria-hidden="true" />
            {hasZoom
              ? (isAr ? `زرار الدخول بيشتغل قبل الحصة بـ ${JOIN_OPENS_MIN} دقايق` : `Join opens ${JOIN_OPENS_MIN} minutes before`)
              : (isAr ? 'رابط زووم بيتجهز، وهيوصلك على الإيميل ويظهر هنا' : 'The Zoom link is on its way by email and will show here')}
          </span>
        )}
        <a
          href={buildWhatsAppUrl(runningLateMessage(booking.referenceCode, booking.learnerName, isAr))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-subtle min-h-[44px]"
        >
          <MessageCircle className="w-4 h-4 text-accent" />
          {isAr ? 'هتأخر شوية' : "I'm running late"}
        </a>
      </div>
    </section>
  );
}
