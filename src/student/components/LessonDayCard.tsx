import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Clock, ExternalLink, MessageCircle, NotebookPen, Video } from 'lucide-react';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { authedJson } from '../../lib/authedJson';
import { TeacherFace } from '../../components/TeacherFace';

/** Join opens 10 minutes before the start (ST-01). */
// The Zoom link is shown only from 5 minutes before the start, on every page (owner, 2026-11-06).
export const JOIN_OPENS_MIN = 5;

/** Re-renders every interval so join buttons open on time without a reload. */
export function useNowTick(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

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
    ? `السلام عليكم، سأتأخر قليلًا عن حصة اليوم${who}${ref ? `، رقم الحجز ${ref}` : ''}. أنا في الطريق إن شاء الله.`
    : `Assalamu alaikum, I'm running a few minutes late for today's lesson${who}${ref ? ` (booking ${ref})` : ''}. On my way, in sha Allah.`;
}

type Live = { teacherIn: boolean; studentIn: boolean };

/** Owner review 2026-11-09: who is in the lesson room now; asked every 30 s while the lesson link is open. */
export function useLessonLive(bookingId: string | undefined, enabled: boolean): Live | null {
  const [live, setLive] = useState<Live | null>(null);
  useEffect(() => {
    if (!bookingId || !enabled) { setLive(null); return; }
    let stop = false;
    const load = () => authedJson<Live>(`/api/student/bookings/${encodeURIComponent(bookingId)}/live`).then((r) => { if (!stop) setLive(r); }).catch(() => {});
    load();
    const id = window.setInterval(load, 30_000);
    return () => { stop = true; window.clearInterval(id); };
  }, [bookingId, enabled]);
  return live;
}

/** The line Zad says about the lesson room, or null when there is nothing to say yet. */
export function liveLine(live: Live | null, started: boolean, isAr: boolean): { text: string; tone: 'waiting' | 'live' | 'calm' } | null {
  if (!live) return null;
  if (live.teacherIn && !live.studentIn) return { text: isAr ? 'معلمك دخل ومستنيك، يلا ادخل!' : 'Your teacher is in and waiting for you. Jump in!', tone: 'waiting' };
  if (live.teacherIn && live.studentIn) return { text: isAr ? 'الحصة شغالة دلوقتي' : 'Your lesson is live', tone: 'live' };
  if (live.studentIn) return { text: isAr ? 'إنت في الغرفة، ومعلمك جاي حالًا' : "You're in. Your teacher is on the way", tone: 'calm' };
  if (started) return { text: isAr ? 'الحصة بدأت، ومعلمك لسه ما دخلش' : "The lesson has started; your teacher hasn't joined yet", tone: 'calm' };
  return null;
}

export function LiveLessonPill({ line }: { line: NonNullable<ReturnType<typeof liveLine>> }) {
  const tone = line.tone === 'waiting'
    ? 'bg-accent/15 border-accent/50 text-foreground'
    : line.tone === 'live' ? 'bg-success/15 border-success/40 text-foreground' : 'glass-surface border-border-subtle text-muted-foreground';
  return (
    <div role="status" aria-live="polite" className={`inline-flex items-center gap-2.5 ps-1 pe-3.5 py-1 rounded-full border text-sm font-semibold ${tone}`}>
      <img src="/zad-notification-192.png" alt="" aria-hidden="true" className={`w-8 h-8 rounded-full ${line.tone === 'waiting' ? 'motion-safe:animate-bounce' : ''}`} />
      {line.tone !== 'calm' && <span className="relative flex w-2 h-2"><span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-current" /></span>}
      <span>{line.text}</span>
    </div>
  );
}

/**
 * ST-01: on lesson day the home page leads with this card: countdown, teacher, subject, Join (from 5 minutes
 * before), what to prepare (the teacher's last "next steps") and a "running late" WhatsApp message to the team.
 */
export function LessonDayCard({ booking, isAr }: { booking: any; isAr: boolean }) {
  const now = useNowTick();

  const start = booking.scheduledStart || booking.scheduled_start;
  const end = booking.scheduledEnd || booking.scheduled_end;
  const state = joinState(start, end, now);
  const live = useLessonLive(booking.id, state === 'open');
  if (state === 'ended') return null;
  const line = liveLine(live, now.getTime() >= new Date(start).getTime(), isAr);
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
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {booking.teacherName && <TeacherFace name={booking.teacherName} size={24}>{null}</TeacherFace>}
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

      {line && <LiveLessonPill line={line} />}

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
              ? (isAr ? `يعمل زر الدخول قبل الحصة بـ ${JOIN_OPENS_MIN} دقائق` : `Join opens ${JOIN_OPENS_MIN} minutes before`)
              : (isAr ? 'يُجهَّز رابط Zoom، وسيصلك على البريد ويظهر هنا' : 'The Zoom link is on its way by email and will show here')}
          </span>
        )}
        {state === 'open' && (
          /* NX-12: the slides the teacher is showing, beside the Zoom call. */
          <a href={`/student/room/${booking.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-subtle min-h-[44px]">
            {isAr ? 'شرائح الدرس' : 'Lesson slides'}
          </a>
        )}
        <a
          href={buildWhatsAppUrl(runningLateMessage(booking.referenceCode, booking.learnerName, isAr))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-subtle min-h-[44px]"
        >
          <MessageCircle className="w-4 h-4 text-accent" />
          {isAr ? 'سأتأخر قليلًا' : "I'm running late"}
        </a>
      </div>
    </section>
  );
}
