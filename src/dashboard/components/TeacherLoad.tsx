import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

interface Row {
  teacherId: string;
  name: string;
  activeStudents: number;
  lessonsThisWeek: number;
  hoursBookedThisWeek: number;
  hoursOfferedPerWeek: number;
  moves30Days: number;
  recentMoves: Array<{ reason: string | null; from: string; to: string; at: string }>;
  completed30Days: number;
  notesRate30Days: number | null;
}

/** CRM-08: load and care per teacher (super admin only; no money). */
export function TeacherLoad() {
  const { t, isAr } = useT();
  const [data, setData] = useState<{ weekStart: string; teachers: Row[] } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { dashboardFetch<{ weekStart: string; teachers: Row[] }>('/api/dashboard/admin/teacher-load').then(setData).catch(() => setFailed(true)); }, []);
  const fmt = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL HH:mm');

  return (
    <section className="p-6 rounded-2xl glass-card space-y-4" aria-labelledby="teacher-load-title" data-testid="teacher-load">
      <div>
        <h2 id="teacher-load-title" className="text-lg font-display font-bold text-foreground">{t('Teachers: load and care', 'المعلمين: الحمل والمتابعة')}</h2>
        <p className="text-sm text-muted-foreground">{t('This week (from Monday, UTC) and the last 30 days.', 'الأسبوع ده (من الاتنين، بتوقيت UTC) وآخر 30 يوم.')}</p>
      </div>
      {failed ? (
        <p className="text-sm text-destructive" role="alert">{t('Could not load the teacher view.', 'معرفناش نحمّل بيانات المعلمين.')}</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">{t('Loading…', 'بنحمّل…')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th scope="col" className="text-start font-medium py-2 pe-3">{t('Teacher', 'المعلم')}</th>
                <th scope="col" className="text-center font-medium py-2 px-2">{t('Active students', 'طلاب نشطين')}</th>
                <th scope="col" className="text-center font-medium py-2 px-2">{t('Lessons this week', 'دروس الأسبوع')}</th>
                <th scope="col" className="text-center font-medium py-2 px-2">{t('Hours booked / offered', 'ساعات محجوزة / متاحة')}</th>
                <th scope="col" className="text-center font-medium py-2 px-2">{t('Moved (30 days)', 'اتنقلت (30 يوم)')}</th>
                <th scope="col" className="text-center font-medium py-2 px-2">{t('Family summary written', 'ملخص الأسرة اتكتب')}</th>
              </tr>
            </thead>
            <tbody>
              {data.teachers.map((r) => (
                <tr key={r.teacherId} className="border-t border-border align-top">
                  <th scope="row" className="text-start font-medium py-2 pe-3">{r.name}</th>
                  <td className="text-center py-2 px-2">{r.activeStudents}</td>
                  <td className="text-center py-2 px-2">{r.lessonsThisWeek}</td>
                  <td className="text-center py-2 px-2 whitespace-nowrap">{r.hoursBookedThisWeek} / {r.hoursOfferedPerWeek}</td>
                  <td className="text-center py-2 px-2">
                    {r.moves30Days}
                    {r.recentMoves.length > 0 && (
                      <details className="text-start text-xs mt-1">
                        <summary className="cursor-pointer text-muted-foreground">{t('Reasons', 'الأسباب')}</summary>
                        <ul className="mt-1 space-y-1">
                          {r.recentMoves.map((m, i) => (
                            <li key={i}><span className="text-muted-foreground">{fmt(m.from)} → {fmt(m.to)}:</span> {m.reason || '—'}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </td>
                  <td className="text-center py-2 px-2">{r.notesRate30Days == null ? '—' : `${r.notesRate30Days}% (${r.completed30Days})`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-2">{t('Moves are recorded from 21 October 2026.', 'النقل بيتسجّل من 21 أكتوبر 2026.')}</p>
        </div>
      )}
    </section>
  );
}
