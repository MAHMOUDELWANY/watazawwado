import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type Step = 'signed_up' | 'onboarded' | 'trial_booked' | 'trial_attended' | 'first_paid' | 'second_month';
interface Cohort { weekStart: string; counts: Record<Step, number>; people: Record<Step, Array<{ id: string; name: string }>> }

/**
 * CRM-07: accounts by sign-up week through each step, real counts only. Click a number to see who is behind it.
 */
export function AccountFunnel() {
  const { t, isAr } = useT();
  const [data, setData] = useState<{ steps: Step[]; cohorts: Cohort[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<{ week: string; step: Step } | null>(null);

  useEffect(() => {
    dashboardFetch<{ steps: Step[]; cohorts: Cohort[] }>('/api/dashboard/admin/funnel?weeks=8')
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const label: Record<Step, string> = {
    signed_up: t('Signed up', 'سجّلوا'),
    onboarded: t('Set up done', 'كمّلوا البيانات'),
    trial_booked: t('Trial booked', 'حجزوا تجربة'),
    trial_attended: t('Trial attended', 'حضروا التجربة'),
    first_paid: t('First payment', 'أول دفع'),
    second_month: t('Second month', 'الشهر التاني')
  };
  const selected = open && data?.cohorts.find((c) => c.weekStart === open.week);

  return (
    <section className="p-6 rounded-2xl glass-card space-y-4" aria-labelledby="account-funnel-title" data-testid="account-funnel">
      <div>
        <h2 id="account-funnel-title" className="text-lg font-display font-bold text-foreground">{t('Account funnel by sign-up week', 'رحلة الحسابات حسب أسبوع التسجيل')}</h2>
        <p className="text-sm text-muted-foreground">{t('Real counts only. Click a number to see the people.', 'أرقام حقيقية بس. اضغط على أي رقم تشوف مين ورا.')}</p>
      </div>
      {failed ? (
        <p className="text-sm text-destructive" role="alert">{t('Could not load the funnel.', 'معرفناش نحمّل الأرقام.')}</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">{t('Loading…', 'بنحمّل…')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th scope="col" className="text-start font-medium py-2 pe-3">{t('Week of', 'أسبوع')}</th>
                {data.steps.map((s) => <th key={s} scope="col" className="text-center font-medium py-2 px-2 whitespace-nowrap">{label[s]}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map((c) => (
                <tr key={c.weekStart} className="border-t border-border">
                  <th scope="row" className="text-start font-medium py-2 pe-3 whitespace-nowrap">
                    {DateTime.fromISO(c.weekStart).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL')}
                  </th>
                  {data.steps.map((s) => (
                    <td key={s} className="text-center py-1 px-1">
                      {c.counts[s] > 0 ? (
                        <button
                          type="button"
                          onClick={() => setOpen(open?.week === c.weekStart && open.step === s ? null : { week: c.weekStart, step: s })}
                          aria-expanded={open?.week === c.weekStart && open.step === s}
                          className="min-w-11 min-h-11 rounded-lg font-semibold text-foreground hover:bg-surface-subtle focus-ring cursor-pointer"
                        >
                          {c.counts[s]}
                        </button>
                      ) : <span className="text-muted-foreground">0</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && open && (
        <div className="rounded-xl border border-border p-3" aria-live="polite">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {label[open.step]} · {DateTime.fromISO(open.week).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL yyyy')}
          </p>
          <ul className="flex flex-wrap gap-2">
            {selected.people[open.step].map((p) => (
              <li key={p.id}>
                <Link to={`/dashboard/students/${p.id}`} className="inline-flex items-center min-h-9 px-3 rounded-full bg-surface-subtle text-sm hover:text-primary">{p.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
