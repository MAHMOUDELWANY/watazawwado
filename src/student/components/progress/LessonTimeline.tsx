import React, { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Card } from '../../../components/ui/Card';
import { ErrorState } from '../../../components/ErrorState';
import { BrandSpinner } from '../../../components/ui/BrandLoader';
import { authedJson } from '../../../lib/authedJson';

export interface TimelineItem {
  id: string;
  date: string;
  durationMinutes: number | null;
  bookingType: string | null;
  subject: { id: string; en: string; ar: string; color: string } | null;
  teacherName: string | null;
  familySummary: string | null;
  achievements: unknown;
  nextSteps: string | null;
}

interface TimelinePage { items: TimelineItem[]; page: number; total: number; hasMore: boolean }

/** Achievements are stored as a list of strings or {title|label|name} objects. */
export function achievementLabels(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' && raw.trim() ? [raw] : [];
  return list
    .map((x: any) => (typeof x === 'string' ? x : x && typeof x === 'object' ? String(x.title || x.label || x.name || '') : ''))
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Arabic counting: حصة واحدة، حصتين، ٣–١٠ حصص، ١١+ حصة. */
export function arLessonCount(n: number): string {
  if (n === 1) return 'حصة واحدة';
  if (n === 2) return 'حصتين';
  return `${n.toLocaleString('ar-EG')} ${n <= 10 ? 'حصص' : 'حصة'}`;
}

/** PR-05: attended lessons, newest first, with what the teacher shared with the family. 20 at a time. */
export function LessonTimeline({ learnerId, isAr, timezone }: { learnerId: string | null; isAr: boolean; timezone: string }) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError(false);
    try {
      const q = new URLSearchParams({ page: String(nextPage) });
      if (learnerId) q.set('learnerId', learnerId);
      const data = await authedJson<TimelinePage>(`/api/student/progress/timeline?${q}`);
      setItems((prev) => (nextPage === 1 ? data.items : [...prev, ...data.items]));
      setPage(data.page);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  useEffect(() => { setItems([]); load(1); }, [load]);

  const when = (iso: string) => {
    const dt = DateTime.fromISO(iso).setZone(timezone || 'UTC');
    return dt.isValid ? dt.setLocale(isAr ? 'ar' : 'en').toLocaleString({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  };

  return (
    <Card className="p-5 sm:p-6" data-testid="lesson-timeline">
      <section aria-labelledby="lesson-timeline-title">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 id="lesson-timeline-title" className="font-display text-lg sm:text-xl font-bold text-foreground">
            {isAr ? 'سجل الحصص' : 'Lesson timeline'}
          </h2>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">
              {isAr ? arLessonCount(total) : `${total} ${total === 1 ? 'lesson' : 'lessons'}`}
            </span>
          )}
        </div>

        {error && items.length === 0 ? (
          <ErrorState isAr={isAr} onRetry={() => load(1)} message={isAr ? 'معرفناش نحمّل سجل الحصص.' : 'We could not load the lesson timeline.'} />
        ) : !loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isAr ? 'أول ما تحضر أول حصة، هتلاقيها هنا ومعاها ملخص المعلم.' : 'Once you attend your first lesson, it appears here with your teacher’s summary.'}
          </p>
        ) : (
          <ol className="relative space-y-4 border-s-2 border-border-subtle ps-5">
            {items.map((it) => {
              const achievements = achievementLabels(it.achievements);
              return (
                <li key={it.id} className="relative" data-testid="timeline-item">
                  <span
                    aria-hidden="true"
                    className="absolute -start-[1.72rem] top-1.5 w-3 h-3 rounded-full ring-4 ring-background"
                    style={{ backgroundColor: it.subject?.color || '#087D91' }}
                  />
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <time dateTime={it.date} className="text-sm font-semibold text-foreground">{when(it.date)}</time>
                    {it.subject && <span className="text-xs text-muted-foreground">· {isAr ? it.subject.ar : it.subject.en}</span>}
                    {it.teacherName && <span className="text-xs text-muted-foreground">· {isAr ? `مع ${it.teacherName}` : `with ${it.teacherName}`}</span>}
                    {it.bookingType === 'trial' && <span className="text-[11px] font-semibold text-[#B9782A] dark:text-[#E5A93C]">{isAr ? 'حصة تجريبية' : 'Free trial'}</span>}
                  </div>
                  {it.familySummary ? (
                    <p className="mt-1 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{it.familySummary}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">{isAr ? 'المعلم لسه ماكتبش ملخص للحصة دي.' : 'No summary from the teacher for this lesson yet.'}</p>
                  )}
                  {achievements.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {achievements.map((a) => (
                        <li key={a} className="text-xs px-2 py-0.5 rounded-full bg-[#E5A93C]/12 text-[#8B4935] dark:text-[#F6D58E] border border-[#E5A93C]/30">{a}</li>
                      ))}
                    </ul>
                  )}
                  {it.nextSteps && (
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">{isAr ? 'المطلوب للحصة الجاية: ' : 'For next time: '}</span>
                      {it.nextSteps}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {(hasMore || (loading && items.length > 0)) && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => load(page + 1)}
              disabled={loading}
              className="inline-flex items-center gap-2 min-h-11 px-5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface-subtle disabled:opacity-60 cursor-pointer focus-ring"
            >
              {loading && <BrandSpinner size={14} />}
              {isAr ? 'اعرض حصص أقدم' : 'Show older lessons'}
            </button>
          </div>
        )}
        {loading && items.length === 0 && (
          <div className="flex justify-center py-6" role="status" aria-label={isAr ? 'جارٍ التحميل' : 'Loading'}><BrandSpinner size={20} /></div>
        )}
        {error && items.length > 0 && (
          <p className="mt-3 text-xs text-destructive text-center" role="alert">{isAr ? 'معرفناش نحمّل الحصص الأقدم. جرّب تاني.' : 'Could not load older lessons. Please try again.'}</p>
        )}
      </section>
    </Card>
  );
}
