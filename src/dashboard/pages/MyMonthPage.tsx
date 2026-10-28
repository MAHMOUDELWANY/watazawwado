import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { MonthSelect } from '../components/PayStatementView';
import MyPayPage from './MyPayPage';

/**
 * Teacher: My month (launch plan E). Their own teaching month (lessons, hours, students, summaries on time,
 * the families' rating), then their pay for the same month. No student money anywhere.
 */
export default function MyMonthPage() {
  const { isAr } = useT();
  const [month, setMonth] = useState(DateTime.utc().toFormat('yyyy-MM'));
  const [m, setM] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setM(null);
    setError(null);
    dashboardFetch<any>(`/api/dashboard/my-month?month=${month}`).then(setM).catch((e) => setError(e.message));
  }, [month]);

  const n = (v: number) => (isAr ? v.toLocaleString('ar-EG') : String(v));
  const tiles = m ? [
    { value: n(m.lessonsHeld), label: isAr ? 'حصص اتعملت' : 'Lessons held' },
    { value: n(m.hours), label: isAr ? 'ساعات' : 'Hours' },
    { value: n(m.activeStudents), label: isAr ? 'طلاب' : 'Students' },
    { value: n(m.trialsHeld), label: isAr ? 'حصص تجريبية' : 'Free trials' },
    { value: m.summariesWritten ? `${n(m.summariesOnTime)}/${n(m.summariesWritten)}` : '–', label: isAr ? 'ملخصات في خلال 24 ساعة' : 'Summaries within 24 h' },
    { value: m.rating === null ? '–' : `${m.rating}★`, label: m.ratingCount ? (isAr ? `تقييم الأسر (${n(m.ratingCount)})` : `Family rating (${m.ratingCount})`) : (isAr ? 'لسه مفيش تقييم' : 'No ratings yet') }
  ] : [];

  return (
    <div className="space-y-8 pb-12 max-w-4xl" data-testid="my-month">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{isAr ? 'شهري' : 'My month'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? 'حصصك وطلابك وملخصاتك، ومرتبك عن نفس الشهر.' : 'Your lessons, students and summaries, and your pay for the same month.'}</p>
        </div>
        <MonthSelect value={month} onChange={setMonth} isAr={isAr} />
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!m && !error && <p className="text-sm text-muted-foreground">{isAr ? 'بنحمّل…' : 'Loading…'}</p>}
      {m && (
        <section className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
                <p className="font-display text-2xl sm:text-3xl text-foreground tabular-nums" dir="ltr">{t.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t.label}</p>
              </div>
            ))}
          </div>
          {m.summariesMissing > 0 && (
            <p className="text-sm rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-200">
              {isAr ? `${n(m.summariesMissing)} حصة من غير ملخص للأسرة. اكتبها من "كل الحصص".` : `${m.summariesMissing} held lesson(s) have no family summary yet. Write them in All lessons.`}
            </p>
          )}
          {m.studentNoShows > 0 && (
            <p className="text-sm text-muted-foreground">{isAr ? `الطالب ما حضرش في ${n(m.studentNoShows)} حصة (محسوبة لك).` : `Students missed ${m.studentNoShows} lesson(s) (counted for you).`}</p>
          )}
        </section>
      )}

      <MyPayPage month={month} embedded />
    </div>
  );
}
