import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type Side = {
  precheck_720: boolean | null; start_height: number | null; min_height: number | null;
  degraded_seconds: number; audio_only_seconds: number; reconnects: number; focus_away_seconds?: number | null;
};
type Lesson = { bookingId: string; scheduledStart: string; learner: string | null; teacher: Side | null; student: Side | null; teacherFailed: boolean };

const thisMonth = () => new Date().toISOString().slice(0, 7);
const shiftMonth = (m: string, by: number) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1 + by, 1)).toISOString().slice(0, 7);
};
/** Whole minutes; under a minute but not zero reads "<1", so a short drop is not hidden. */
const mins = (s: number | null | undefined) => (!s ? '0' : s < 60 ? '<1' : String(Math.round(s / 60)));

/** Classroom Task 11: one teacher's room connection numbers for a month (super admin). Design brief 4.7. */
export function TeacherConnection({ teacher, onClose }: { teacher: { id: string; display_name: string } | null; onClose: () => void }) {
  const { t, isAr } = useT();
  const [month, setMonth] = useState(thisMonth);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { if (!teacher) setMonth(thisMonth()); }, [teacher]);
  useEffect(() => {
    if (!teacher || !/^\d{4}-\d{2}$/.test(month)) return;
    let live = true;
    setLessons(null);
    setError('');
    dashboardFetch<{ lessons: Lesson[] }>(`/api/admin/teachers/${encodeURIComponent(teacher.id)}/connection?month=${month}`)
      .then((d) => live && setLessons(d.lessons || []))
      .catch((e: any) => live && setError(e?.message || t("Couldn't load the connection numbers.", 'معرفناش نجيب أرقام الاتصال.')));
    return () => { live = false; };
  }, [teacher?.id, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const locale = isAr ? 'ar-EG' : 'en-GB';
  const monthLabel = new Date(`${month}-01T12:00:00Z`).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const when = (iso: string) => new Date(iso).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const atNow = month >= thisMonth();

  // Failed lessons first, then by time.
  const rows = [...(lessons || [])].sort((a, b) => Number(b.teacherFailed) - Number(a.teacherFailed) || a.scheduledStart.localeCompare(b.scheduledStart));
  const failed = rows.filter((l) => l.teacherFailed).length;
  const lowest = rows.map((l) => l.teacher?.min_height).filter((h): h is number => typeof h === 'number');
  const lowestTeacher = lowest.length ? Math.min(...lowest) : null;

  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;

  const precheck = (s: Side | null) => (!s || s.precheck_720 == null
    ? <span className="text-muted-foreground">–</span>
    : s.precheck_720
      ? <span className="inline-flex items-center gap-1 text-teal"><Check className="h-4 w-4" aria-hidden="true" />{t('Passed', 'نجح')}</span>
      : <span className="inline-flex items-center gap-1 font-semibold text-accent"><X className="h-4 w-4" aria-hidden="true" />{t('Below 720p', 'أقل من 720p')}</span>);
  const height = (s: Side | null) => (s?.min_height == null
    ? <span className="text-muted-foreground">–</span>
    : <span dir="ltr" className={s.min_height < 480 ? 'font-semibold text-accent' : undefined}>{s.min_height}p</span>);

  // One row per measure, both sides side by side: the same grid on a phone card and in the desktop table.
  const measures: { label: string; cell: (s: Side | null) => React.ReactNode }[] = [
    { label: t('720p check before', 'فحص 720p قبلها'), cell: precheck },
    { label: t('Lowest video', 'أقل جودة فيديو'), cell: height },
    { label: t('Weak video (min)', 'فيديو ضعيف (دقيقة)'), cell: (s) => (s ? mins(s.degraded_seconds) : '–') },
    { label: t('Sound only (min)', 'صوت بس (دقيقة)'), cell: (s) => (s ? mins(s.audio_only_seconds) : '–') },
    { label: t('Reconnects', 'إعادة اتصال'), cell: (s) => (s ? s.reconnects : '–') },
    { label: t('Away from the room (min)', 'برّه الغرفة (دقيقة)'), cell: (s) => (s ? mins(s.focus_away_seconds) : '–') },
  ];

  const failedBadge = (
    <span className="inline-flex items-center gap-1.5 rounded-[var(--r-pill)] bg-sand-light px-2.5 py-1 text-xs font-semibold text-accent dark:bg-sand/40">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      {t('Teacher connection failed', 'اتصال المعلم وقع')}
    </span>
  );

  return (
    <Modal isOpen={Boolean(teacher)} onClose={onClose} maxWidth="3xl"
      title={t(`Connection · ${teacher?.display_name ?? ''}`, `الاتصال · ${teacher?.display_name ?? ''}`)}>
      <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-4 text-start text-sm text-foreground">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label={t('Previous month', 'الشهر اللي فات')}>
            <Prev className="h-5 w-5" aria-hidden="true" />
          </Button>
          <p className="font-editorial text-lg font-semibold" aria-live="polite">{monthLabel}</p>
          <Button variant="outline" size="icon" disabled={atNow} onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label={t('Next month', 'الشهر اللي جاي')}>
            <Next className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {error && <p role="alert" className="font-semibold text-destructive">{error}</p>}
        {!error && !lessons && <div className="skeleton-glass h-32 rounded-[var(--r-3)]" aria-label={t('Loading…', 'جاري التحميل…')} />}
        {lessons && rows.length === 0 && (
          <p className="rounded-[var(--r-3)] border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
            {t('No lessons in our room this month.', 'مفيش حصص في الغرفة الشهر ده.')}
          </p>
        )}

        {rows.length > 0 && (
          <>
            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--r-2)] px-4 py-3 ${failed ? 'bg-sand-light dark:bg-sand/40' : 'bg-teal/10'}`}>
              <p className={`flex items-center gap-1.5 font-semibold ${failed ? 'text-accent' : 'text-teal'}`}>
                {failed ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                {failed
                  ? t(`${failed} failed on the teacher side`, `${failed} وقعوا من ناحية المعلم`)
                  : t('No failed lessons on the teacher side', 'مفيش حصص وقعت من ناحية المعلم')}
              </p>
              <p className="text-muted-foreground">
                {t(`${rows.length} ${rows.length === 1 ? 'lesson' : 'lessons'}`, `${rows.length} حصة`)}
                {lowestTeacher != null && <> · {t('lowest teacher video', 'أقل فيديو للمعلم')} <bdi dir="ltr">{lowestTeacher}p</bdi></>}
              </p>
            </div>

            {/* Phones: one card per lesson. */}
            <ul className="space-y-3 sm:hidden">
              {rows.map((l) => (
                <li key={l.bookingId} className="rounded-[var(--r-3)] border border-border bg-surface p-3.5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold"><bdi>{when(l.scheduledStart)}</bdi>{l.learner && <span className="font-normal text-muted-foreground"> · {l.learner}</span>}</p>
                    {l.teacherFailed && failedBadge}
                  </div>
                  <table className="w-full text-start tabular-nums">
                    <thead className="text-xs text-muted-foreground">
                      <tr>
                        <td />
                        <th scope="col" className="pb-1 text-start font-medium">{t('Teacher', 'المعلم')}</th>
                        <th scope="col" className="pb-1 text-start font-medium">{t('Learner', 'الطالب')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measures.map((m) => (
                        <tr key={m.label}>
                          <th scope="row" className="py-1 pe-3 text-start font-normal text-muted-foreground">{m.label}</th>
                          <td className="py-1 pe-3">{m.cell(l.teacher)}</td>
                          <td className="py-1">{m.cell(l.student)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </li>
              ))}
            </ul>

            {/* Wider screens: a table, each lesson two rows (teacher, learner). */}
            <div className="hidden overflow-x-auto rounded-[var(--r-3)] border border-border sm:block">
              <table className="w-full border-collapse text-start text-[13px] tabular-nums">
                <thead className="bg-surface-subtle text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-start font-medium">{t('Lesson', 'الحصة')}</th>
                    <th scope="col" className="px-3 py-2 text-start font-medium">{t('Side', 'الطرف')}</th>
                    {measures.map((m) => <th key={m.label} scope="col" className="px-3 py-2 text-start font-medium">{m.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <React.Fragment key={l.bookingId}>
                      {([['teacher', l.teacher], ['student', l.student]] as const).map(([side, s], i) => (
                        <tr key={side} className={`${i === 0 ? 'border-t border-border' : ''} ${l.teacherFailed ? 'bg-sand-light/60 dark:bg-sand/20' : ''}`}>
                          {i === 0 && (
                            <th scope="rowgroup" rowSpan={2} className="px-3 py-2 align-top text-start font-normal">
                              <span className="block whitespace-nowrap font-semibold text-foreground"><bdi>{when(l.scheduledStart)}</bdi></span>
                              {l.learner && <span className="block text-muted-foreground">{l.learner}</span>}
                              {l.teacherFailed && <span className="mt-1.5 block">{failedBadge}</span>}
                            </th>
                          )}
                          <td className="px-3 py-1.5 text-muted-foreground">{side === 'teacher' ? t('Teacher', 'المعلم') : t('Learner', 'الطالب')}</td>
                          {measures.map((m) => <td key={m.label} className="px-3 py-1.5">{m.cell(s)}</td>)}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
