import React, { useState } from 'react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';

interface Preview {
  month: string;
  monthLabel: { en: string; ar: string };
  enabled: boolean;
  count: number;
  skipped: number;
  recipients: Array<{ name: string | null; email: string; family: boolean; learners: Array<{ name: string | null; lessons: number }> }>;
}

/** PR-09: who would get last month's progress email. Reads only; nothing is sent from here. */
export function MonthlyProgressPreview() {
  const { t, isAr } = useT();
  const [data, setData] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setLoading(true); setFailed(false);
    dashboardFetch<Preview>('/api/dashboard/admin/monthly-progress/preview')
      .then(setData)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  return (
    <section className="p-6 rounded-2xl glass-card space-y-4" aria-labelledby="monthly-progress-title" data-testid="monthly-progress-preview">
      <div>
        <h2 id="monthly-progress-title" className="text-lg font-display font-bold text-foreground">{t('Monthly progress emails', 'إيميلات التقدّم الشهرية')}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'On the 1st to 5th of each month, one short email per account about last month\'s lessons. They are sent only after the switch is turned on in Vercel (MONTHLY_PROGRESS_EMAILS=on). The preview sends nothing.',
            'من يوم 1 لـ5 في كل شهر، إيميل قصير لكل حساب عن دروس الشهر اللي فات. مش بيتبعت غير لما المفتاح يتفتح في Vercel (MONTHLY_PROGRESS_EMAILS=on). المعاينة مش بتبعت حاجة.'
          )}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={load} isLoading={loading}>{t('Preview recipients', 'اعرض مين هيوصله')}</Button>
      {failed && <p className="text-sm text-destructive" role="alert">{t('Could not build the preview.', 'معرفناش نجهّز المعاينة.')}</p>}
      {data && (
        <div className="space-y-2 text-sm">
          <p>
            <strong>{isAr ? data.monthLabel.ar : data.monthLabel.en}</strong>{' · '}
            {data.enabled ? t('Sending is ON', 'الإرسال شغّال') : t('Sending is OFF', 'الإرسال مقفول')}{' · '}
            {t(`${data.count} accounts`, `${data.count} حساب`)}
            {data.skipped ? t(` (${data.skipped} skipped: emails off or already sent)`, ` (${data.skipped} متساب: الإيميلات مقفولة أو اتبعت قبل كده)`) : ''}
          </p>
          <ul className="divide-y divide-border max-h-80 overflow-y-auto">
            {data.recipients.map((r, i) => (
              <li key={i} className="py-2">
                <span className="font-medium text-foreground">{r.name || t('Family account', 'حساب عيلة')}</span>{' '}
                <span className="text-muted-foreground" dir="ltr">{r.email}</span>
                <span className="block text-xs text-muted-foreground">{r.learners.map((l) => `${l.name || '—'}: ${l.lessons}`).join(' · ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
