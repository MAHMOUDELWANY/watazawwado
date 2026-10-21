import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Star } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

/** ST-02: a teacher's own average from families, shown only from 5 ratings (single ratings stay with the admin). */
export function TeacherRatingNote() {
  const { t } = useT();
  const [d, setD] = useState<{ count: number; average: number | null; minimum: number } | null>(null);
  useEffect(() => { dashboardFetch<typeof d>('/api/dashboard/me/lesson-feedback').then(setD).catch(() => {}); }, []);
  if (!d || d.count === 0) return null;
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="teacher-rating">
      <Star className="w-4 h-4 fill-gold text-gold" aria-hidden="true" />
      {d.average != null
        ? t(`Families rate your lessons ${d.average} / 5 on average (${d.count} ratings).`, `متوسط تقييم الأسر لدروسك ${d.average} من 5 (${d.count} تقييم).`)
        : t(`Your average appears after ${d.minimum} ratings (${d.count} so far).`, `المتوسط هيظهر بعد ${d.minimum} تقييمات (لحد دلوقتي ${d.count}).`)}
    </p>
  );
}

interface AdminFeedback {
  byTeacher: Array<{ teacherId: string; teacherName: string | null; count: number; average: number }>;
  items: Array<{ bookingId: string; learnerName: string | null; teacherName: string | null; rating: number; comment: string | null; createdAt: string }>;
}

/** ST-02: super admin view of ratings and comments after lessons. */
export function AdminLessonFeedback() {
  const { t, isAr } = useT();
  const [data, setData] = useState<AdminFeedback | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { dashboardFetch<AdminFeedback>('/api/dashboard/admin/lesson-feedback').then(setData).catch(() => setFailed(true)); }, []);

  return (
    <section className="p-6 rounded-2xl glass-card space-y-4" aria-labelledby="lesson-feedback-admin-title" data-testid="admin-lesson-feedback">
      <div>
        <h2 id="lesson-feedback-admin-title" className="text-lg font-display font-bold text-foreground">{t('After-lesson ratings', 'تقييمات بعد الدرس')}</h2>
        <p className="text-sm text-muted-foreground">{t('Only you see single ratings and comments; teachers see their average from 5 ratings.', 'التقييمات والتعليقات دي ليك بس؛ المعلم بيشوف متوسطه بعد 5 تقييمات.')}</p>
      </div>
      {failed ? (
        <p className="text-sm text-destructive" role="alert">{t('Could not load ratings.', 'معرفناش نحمّل التقييمات.')}</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">{t('Loading…', 'بنحمّل…')}</p>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('No ratings yet.', 'لسه مفيش تقييمات.')}</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {data.byTeacher.map((b) => (
              <li key={b.teacherId} className="text-sm px-3 py-1.5 rounded-full bg-surface-subtle">
                {b.teacherName || t('Teacher', 'معلم')}: <strong>{b.average}</strong> / 5 · {b.count}
              </li>
            ))}
          </ul>
          <ul className="divide-y divide-border">
            {data.items.map((i) => (
              <li key={i.bookingId} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-foreground" aria-label={`${i.rating} / 5`}>{'★'.repeat(i.rating)}<span className="text-muted-foreground">{'★'.repeat(5 - i.rating)}</span></span>
                  <span>{i.learnerName || '—'}</span>
                  <span className="text-muted-foreground">{i.teacherName || ''}</span>
                  <span className="text-xs text-muted-foreground ms-auto">{DateTime.fromISO(i.createdAt).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL yyyy')}</span>
                </div>
                {i.comment && <p className="mt-1 text-muted-foreground whitespace-pre-line">{i.comment}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
