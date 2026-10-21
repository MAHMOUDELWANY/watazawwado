import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { BrandLoader } from '../../components/ui/BrandLoader';
import { ErrorState } from '../../components/ErrorState';
import { authedJson } from '../../lib/authedJson';
import { useActiveLearner } from '../activeLearner';
import { MilestoneEmblemByKind } from './StudentProgressPage';

interface ReportData {
  learner: { id: string; name: string; timezone: string };
  subjects: Array<{ id: string; en: string; ar: string; level: { en: string; ar: string } }>;
  weeklyRhythm: { current: number; longest: number };
  month: string;
  lessons: { count: number; minutes: number; weeksWithLesson: number; list: Array<{ id: string; date: string; subject: { en: string; ar: string } | null; teacherName: string | null; durationMinutes: number | null }> };
  milestones: Array<{ id: string; kind: string; title_en: string; title_ar: string; reached_at: string }>;
  summaries: Array<{ date: string; teacherName: string | null; text: string }>;
  nextSteps: string | null;
}

/**
 * PR-08: a one-page monthly progress report per learner, in the site's identity (like the placement report).
 * Clearly a progress report, never a certificate. Only the report prints (#progress-report in index.css); the layout is
 * fluid so it fits A4 and Letter alike.
 */
export default function StudentProgressReportPage({ lang = 'ar' }: { lang?: 'en' | 'ar' }) {
  const isAr = lang === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [params, setParams] = useSearchParams();
  const { activeId } = useActiveLearner();
  const learnerId = params.get('learnerId') || activeId || '';
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.get('month') || '') ? params.get('month')! : DateTime.now().toFormat('yyyy-MM');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const q = new URLSearchParams({ month });
      if (learnerId) q.set('learnerId', learnerId);
      setData(await authedJson<ReportData>(`/api/student/progress/report?${q}`));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [month, learnerId]);
  useEffect(() => { load(); }, [load]);

  const shift = (delta: number) => {
    const next = new URLSearchParams(params);
    next.set('month', DateTime.fromISO(`${month}-01`).plus({ months: delta }).toFormat('yyyy-MM'));
    setParams(next, { replace: true });
  };
  const thisMonth = DateTime.now().toFormat('yyyy-MM');
  const monthLabel = DateTime.fromISO(`${month}-01`).setLocale(isAr ? 'ar' : 'en').toFormat('LLLL yyyy');
  const tz = data?.learner.timezone || 'UTC';
  const day = (iso: string) => DateTime.fromISO(iso).setZone(tz).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL');
  const num = (n: number) => (isAr ? n.toLocaleString('ar-EG') : String(n));

  return (
    <div className="max-w-3xl mx-auto space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-1" role="group" aria-label={t('Choose the month', 'اختار الشهر')}>
          <button type="button" onClick={() => shift(-1)} aria-label={t('Previous month', 'الشهر اللي فات')} className="w-11 h-11 grid place-items-center rounded-xl border border-border hover:bg-surface-subtle focus-ring cursor-pointer">
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className="min-w-[9rem] text-center text-sm font-semibold text-foreground">{monthLabel}</span>
          <button type="button" onClick={() => shift(1)} disabled={month >= thisMonth} aria-label={t('Next month', 'الشهر الجاي')} className="w-11 h-11 grid place-items-center rounded-xl border border-border hover:bg-surface-subtle focus-ring cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-2">
          <Link to={`/student/progress${learnerId ? `?learnerId=${encodeURIComponent(learnerId)}` : ''}`} className="inline-flex items-center h-11 px-4 rounded-lg border border-border text-sm font-medium hover:bg-surface-subtle">
            {t('Back to progress', 'رجوع للمسيرة')}
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!data} className="h-11">
            <Printer className="w-4 h-4" /><span className="ms-1.5">{t('Print / save as PDF', 'اطبع أو احفظ PDF')}</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><BrandLoader size="md" text={t('Preparing the report…', 'بنجهّز التقرير…')} /></div>
      ) : failed || !data ? (
        <ErrorState isAr={isAr} onRetry={load} message={t('We could not prepare this report.', 'معرفناش نجهّز التقرير ده.')} />
      ) : (
        <article id="progress-report" className="relative bg-[#FFFDF8] text-[#1F1A17] rounded-3xl p-2 shadow-xl" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
          <div className="rounded-[20px] border-2 border-[#087D91]/70 p-1.5">
            <div className="relative overflow-hidden rounded-2xl border border-[#D8C6AE] px-5 py-7 sm:px-10 sm:py-9">
              <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#087D91,#D8C6AE,#C51F24)]" aria-hidden="true" />

              <header className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#087D91]">{t('Watazawwado Academy', 'أكاديمية وتزودوا')}</p>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">{t('Monthly progress report', 'تقرير التقدم الشهري')}</h1>
                  <p className="text-sm text-[#6B5E55]">{data.learner.name} · {monthLabel}</p>
                </div>
                <BrandLogo variant="compact" />
              </header>

              <section className="mt-6 grid grid-cols-3 gap-3 text-center" aria-label={t('This month in numbers', 'الشهر ده بالأرقام')}>
                {[
                  [num(data.lessons.count), t('lessons attended', 'حصص حضرها')],
                  [num(data.lessons.minutes), t('minutes of learning', 'دقيقة تعلّم')],
                  [num(data.lessons.weeksWithLesson), t('weeks with a lesson', 'أسابيع فيها حصة')]
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl border border-[#E6DACB] bg-white/70 p-3">
                    <div className="font-display text-2xl font-bold text-[#087D91]">{v}</div>
                    <div className="text-[11px] text-[#6B5E55]">{l}</div>
                  </div>
                ))}
              </section>

              {data.subjects.length > 0 && (
                <section className="mt-5">
                  <h2 className="text-sm font-bold text-[#087D91] mb-2">{t('Where things stand', 'الطالب واقف فين')}</h2>
                  <ul className="flex flex-wrap gap-2">
                    {data.subjects.map((s) => (
                      <li key={s.id} className="px-3 py-1.5 rounded-full text-xs bg-[#087D91]/10 text-[#05363F]">
                        {isAr ? `${s.ar}: ${s.level.ar}` : `${s.en}: ${s.level.en}`}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="mt-5">
                <h2 className="text-sm font-bold text-[#C51F24] mb-2">{t('Milestones this month', 'إنجازات الشهر')}</h2>
                {data.milestones.length ? (
                  <ul className="space-y-1.5">
                    {data.milestones.map((m) => (
                      <li key={m.id} className="flex items-center gap-2 text-sm">
                        <MilestoneEmblemByKind kind={m.kind} className="w-6 h-6 shrink-0" />
                        <span className="font-semibold">{isAr ? m.title_ar : m.title_en}</span>
                        <span className="text-xs text-[#6B5E55]">· {day(m.reached_at)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#6B5E55]">{t('No new milestone this month. Steady lessons are progress too.', 'مفيش إنجاز جديد الشهر ده. والانتظام في الحصص تقدّم برضه.')}</p>
                )}
              </section>

              <section className="mt-5">
                <h2 className="text-sm font-bold text-[#087D91] mb-2">{t('From the teacher', 'من المعلم')}</h2>
                {data.summaries.length ? (
                  <ul className="space-y-2.5">
                    {data.summaries.map((s, i) => (
                      <li key={i} className="text-sm leading-relaxed">
                        <span className="text-xs font-semibold text-[#6B5E55]">{day(s.date)}{s.teacherName ? ` · ${s.teacherName}` : ''}: </span>
                        <span className="text-[#3B322D]">{s.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#6B5E55]">{t('No summaries for this month yet.', 'مفيش ملخصات للشهر ده لسه.')}</p>
                )}
                {data.nextSteps && (
                  <p className="mt-3 rounded-xl border border-dashed border-[#D8C6AE] p-3 text-sm">
                    <span className="font-bold">{t('Next step: ', 'الخطوة الجاية: ')}</span>{data.nextSteps}
                  </p>
                )}
              </section>

              {data.lessons.list.length > 0 && (
                <section className="mt-5">
                  <h2 className="text-sm font-bold text-[#087D91] mb-2">{t('Lessons', 'الحصص')}</h2>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-[#3B322D]">
                    {data.lessons.list.map((l) => (
                      <li key={l.id}>{day(l.date)}{l.subject ? ` · ${isAr ? l.subject.ar : l.subject.en}` : ''}</li>
                    ))}
                  </ul>
                </section>
              )}

              <footer className="mt-7 pt-4 border-t border-[#E6DACB] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6B5E55]">
                <span>{t('This is a progress report, not a certificate.', 'هذا تقرير متابعة للتقدّم، وليس شهادة.')}</span>
                <span dir="ltr">watazawwado.academy · {month}</span>
              </footer>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
