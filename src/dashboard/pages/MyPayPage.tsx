import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { authedJson } from '../../lib/authedJson';
import { useT } from '../../lib/language';
import { PayLines, PayTotals, MonthSelect, fmtMoney, monthLabel } from '../components/PayStatementView';

/**
 * Teacher: My pay (launch plan D). This month so far (it grows with each lesson whose outcome is recorded),
 * which lessons count and why, and the payslips. Nothing about what students pay.
 */
export default function MyPayPage() {
  const { isAr } = useT();
  const [month, setMonth] = useState(DateTime.utc().toFormat('yyyy-MM'));
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    authedJson<any>(`/api/teacher-pay/me?month=${month}`).then(setData).catch((e) => setError(e.message));
  }, [month]);

  const st = data?.statement;
  const isCurrent = month === DateTime.utc().toFormat('yyyy-MM');

  return (
    <div className="space-y-6 pb-12 max-w-4xl" data-testid="my-pay">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{isAr ? 'مرتبي' : 'My pay'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'بيتحسب من سعر ساعتك ومدة كل حصة. بيتحوّل بين يوم 1 و5 من الشهر اللي بعده.' : 'From your hourly rate and each lesson\'s length. Sent between the 1st and 5th of the next month.'}
          </p>
        </div>
        <MonthSelect value={month} onChange={setMonth} isAr={isAr} />
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!st && !error && <p className="text-sm text-muted-foreground">{isAr ? 'بنحمّل…' : 'Loading…'}</p>}

      {st && (
        <>
          {data.payout ? (
            <div className="rounded-2xl border border-secondary/40 bg-secondary/10 p-4 text-sm text-foreground">
              {isAr
                ? `اتحوّل ${fmtMoney(data.payout.amount, data.payout.currency)} يوم ${DateTime.fromISO(data.payout.paid_at).setLocale('ar').toFormat('d LLLL')} عن طريق ${data.payout.method}${data.payout.reference ? ` (${data.payout.reference})` : ''}.`
                : `Paid ${fmtMoney(data.payout.amount, data.payout.currency)} on ${DateTime.fromISO(data.payout.paid_at).toFormat('d LLLL')} by ${data.payout.method}${data.payout.reference ? ` (${data.payout.reference})` : ''}.`}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isCurrent
                ? (isAr ? 'الشهر لسه شغال: الرقم بيزيد مع كل حصة.' : 'This month is still running: the total grows with each lesson.')
                : (isAr ? 'لسه ما اتحوّلش.' : 'Not paid yet.')}
            </p>
          )}
          {st.awaitingCount > 0 && (
            <p className="text-sm rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-200">
              {isAr ? `${st.awaitingCount} حصة لسه ما سجلتش اللي حصل فيها، فمش محسوبة. سجّلها من "كل الحصص".` : `${st.awaitingCount} lesson(s) have no outcome yet, so they are not counted. Record them in All lessons.`}
            </p>
          )}
          <PayTotals statement={st} isAr={isAr} />
          <PayLines statement={st} isAr={isAr} />
        </>
      )}

      {data?.history?.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-foreground">{isAr ? 'اللي اتحوّل قبل كده' : 'Payslips'}</h2>
          <ul className="rounded-2xl border border-border divide-y divide-border">
            {data.history.map((h: any) => (
              <li key={h.month} className="p-3 flex items-center justify-between gap-3 text-sm">
                <span>{monthLabel(String(h.month).slice(0, 7), isAr)} · {h.method}</span>
                <span className="font-semibold tabular-nums" dir="ltr">{fmtMoney(h.amount, h.currency)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
