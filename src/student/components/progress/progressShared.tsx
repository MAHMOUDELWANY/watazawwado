import React from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import type { SubjectProgressModel, ProgressFamilySummaryItem } from '../../pages/StudentProgressPage';

/** Shared pieces of the progress views (owner's pick 2026-10-28: calm board for adults and parents, road for children). */

export function formatDay(iso: string | null | undefined, tz: string, isAr: boolean): string {
  if (!iso) return '';
  const dt = DateTime.fromISO(iso).setZone(tz);
  return dt.isValid ? dt.setLocale(isAr ? 'ar' : 'en').toLocaleString({ weekday: 'long', day: 'numeric', month: 'long' }) : '';
}

export function formatDayTime(iso: string | null | undefined, tz: string, isAr: boolean): string {
  if (!iso) return '';
  const dt = DateTime.fromISO(iso).setZone(tz);
  return dt.isValid ? dt.setLocale(isAr ? 'ar' : 'en').toLocaleString({ weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
}

/** Weeks-in-a-row line. A pause is "resting", never "lost". */
export function rhythmText(current: number, longest: number, isAr: boolean): string {
  if (current > 0) return isAr ? `${current.toLocaleString('ar-EG')} أسابيع ورا بعض` : `${current} ${current === 1 ? 'week' : 'weeks'} in a row`;
  if (longest > 0) return isAr ? 'في استراحة، وأي حصة ترجّعها' : 'Resting. One lesson starts it again';
  return isAr ? 'لسه هنبدأ' : 'Not started yet';
}

/** The newest teacher note shared with the family. */
export function TeacherNote({ note, tz, isAr }: { note: ProgressFamilySummaryItem | undefined; tz: string; isAr: boolean }) {
  if (!note || !(note.family_summary || note.homework || note.next_steps)) return null;
  return (
    <section className="rounded-2xl bg-surface border border-border p-4 grid gap-2" data-testid="latest-teacher-note">
      <p className="text-xs font-semibold text-muted-foreground">
        {isAr ? 'من المعلم' : 'From your teacher'} · {formatDay(note.created_at, tz, isAr)}
      </p>
      <div className="border-s-[3px] border-gold ps-3 grid gap-1.5 text-[15px] leading-relaxed text-foreground">
        {note.family_summary && <p>{note.family_summary}</p>}
        {note.homework && <p><span className="font-semibold">{isAr ? 'الواجب: ' : 'Homework: '}</span>{note.homework}</p>}
        {note.next_steps && <p><span className="font-semibold">{isAr ? 'الجاي: ' : 'Next: '}</span>{note.next_steps}</p>}
      </div>
    </section>
  );
}

/** One clear action at the end: the booked lesson, or a full-width button to book one. */
export function NextLessonAction({ subject, tz, isAr }: { subject: SubjectProgressModel; tz: string; isAr: boolean }) {
  const next = subject.nextBookedLesson;
  if (next) {
    return (
      <Link
        to="/student/lessons"
        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 min-h-14 focus-ring"
        data-testid="progress-next-lesson"
      >
        <span className="grid">
          <span className="text-xs font-semibold text-muted-foreground">{isAr ? 'الحصة الجاية' : 'Next lesson'}</span>
          <span className="font-semibold text-foreground">{formatDayTime(next.scheduledStart, tz, isAr)}</span>
        </span>
        <span className="text-sm font-semibold text-teal underline underline-offset-4">{isAr ? 'حصصي' : 'My lessons'}</span>
      </Link>
    );
  }
  return (
    <Link
      to="/student/book"
      className="flex items-center justify-center w-full min-h-12 rounded-2xl bg-[#0A2E35] text-white font-semibold focus-ring"
      data-testid="progress-book-cta"
    >
      {isAr ? 'احجز الحصة الجاية' : 'Book the next lesson'}
    </Link>
  );
}
