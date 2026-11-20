import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { ScanSearch } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type Summary = {
  reviewed: number; waiting: number; agreement: number; ready: boolean; hintsOn: boolean;
  rows: Array<{ id: string; model: string; reviewedAt: string; teacher: number; detector: number; agreement: number }>;
};
const MIN_RECORDINGS = 100;
const MIN_AGREEMENT = 0.9;
const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Classroom 4.5 (super admin): how often the in-browser word check agrees with our teachers on the same recordings.
 * Tajweed hints stay off for learners until 100 reviewed recordings agree 90% or more AND the owner turns them on
 * (QURAN_TAJWEED_HINTS=on). Numbers only: no names, no audio.
 */
export default function QuranAccuracyPage() {
  const { t, isAr } = useT();
  const [data, setData] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => { dashboardFetch<Summary>('/api/admin/quran/accuracy').then(setData).catch(() => setFailed(true)); }, []);

  return (
    <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><ScanSearch className="h-6 w-6 text-teal" aria-hidden="true" />{t('Word check accuracy', 'دقة مراجعة الكلمات')}</h1>
      <p className="text-sm text-muted-foreground">{t(
        'Teachers mark sent recordings by ear without seeing the word check. Agreement per recording is the words both flagged over all words either flagged. Automatic tajweed hints stay off until 100 recordings average 90% or more.',
        'المعلمين بيعلّموا التسجيلات بودنهم من غير ما يشوفوا مراجعة الكلمات. الاتفاق في كل تسجيل = الكلمات اللي الاتنين علّموها على كل الكلمات اللي أي حد علّمها. تلميحات التجويد التلقائية مقفولة لحد ما ١٠٠ تسجيل يوصلوا ٩٠٪ أو أكتر.')}</p>
      {failed && <p role="alert" className="text-sm text-destructive">{t('Could not load the numbers.', 'الأرقام ما اتحملتش.')}</p>}
      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4"><div className="text-xs text-muted-foreground">{t('Reviewed recordings', 'تسجيلات اتراجعت')}</div><div className="text-2xl font-bold tabular-nums">{data.reviewed} / {MIN_RECORDINGS}</div><div className="text-xs text-muted-foreground">{t(`${data.waiting} waiting for a teacher`, `${data.waiting} مستنيين معلم`)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">{t('Average agreement', 'متوسط الاتفاق')}</div><div className="text-2xl font-bold tabular-nums">{data.reviewed ? pct(data.agreement) : '–'}</div><div className="text-xs text-muted-foreground">{t(`Needed: ${pct(MIN_AGREEMENT)}`, `المطلوب: ${pct(MIN_AGREEMENT)}`)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">{t('Tajweed hints for learners', 'تلميحات التجويد للطلاب')}</div>
              <div className="mt-1"><Badge variant={data.hintsOn ? 'success' : 'default'}>{data.hintsOn ? t('On', 'شغالة') : t('Off', 'مقفولة')}</Badge></div>
              <div className="mt-1 text-xs text-muted-foreground">{data.ready ? t('The bar is met; the owner decides.', 'وصلنا للحد؛ القرار للمالك.') : t('The bar is not met yet.', 'لسه ما وصلناش للحد.')}</div></Card>
          </div>
          {data.rows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-subtle text-xs text-muted-foreground">
                  <tr><th className="p-2 text-start">{t('Reviewed', 'اتراجع')}</th><th className="p-2 text-start">{t('Teacher marks', 'علامات المعلم')}</th><th className="p-2 text-start">{t('Check flags', 'علامات المراجعة')}</th><th className="p-2 text-start">{t('Agreement', 'الاتفاق')}</th><th className="p-2 text-start">{t('Model', 'النموذج')}</th></tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-2 tabular-nums">{DateTime.fromISO(r.reviewedAt).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL yyyy')}</td>
                      <td className="p-2 tabular-nums">{r.teacher}</td>
                      <td className="p-2 tabular-nums">{r.detector}</td>
                      <td className="p-2 tabular-nums font-semibold">{pct(r.agreement)}</td>
                      <td className="p-2 text-xs text-muted-foreground" dir="ltr">{r.model}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
