import React, { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { notify, confirmAction } from '../../components/ui/Feedback';
import { PayLines, PayTotals, MonthSelect, fmtMoney, monthLabel } from '../components/PayStatementView';

/**
 * Super admin: Teacher pay (launch plan D). Per month: each teacher's total from their hourly rate and the lessons
 * that count (owner outcome table), bonuses and deductions with a reason, and "Record payment" once the month has
 * ended (method + reference). Recording sends the teacher a payslip. The transfer itself happens outside the site.
 */

const send = (path: string, method: string, body?: object) =>
  dashboardFetch<any>(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });

const field = 'min-h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground w-full';

function TeacherPay({ row, month, isPast, isAr, reload }: { row: any; month: string; isPast: boolean; isAr: boolean; reload: () => void }) {
  const st = row.statement;
  const [rate, setRate] = useState(st.hourlyRate ?? '');
  const [currency, setCurrency] = useState(st.currency || 'USD');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true);
    try { await fn(); notify(ok, 'success'); reload(); }
    catch (e: any) { notify(e?.message || (isAr ? 'حصلت مشكلة' : 'Something went wrong'), 'error'); }
    finally { setBusy(false); }
  };

  const recordPayout = async () => {
    const ok = await confirmAction(
      isAr ? `تسجّل إن ${fmtMoney(st.total, st.currency)} اتحوّلوا لـ ${row.name} عن ${monthLabel(month, true)}؟ هيوصله إيميل بالتفاصيل.`
           : `Record that ${fmtMoney(st.total, st.currency)} was sent to ${row.name} for ${monthLabel(month, false)}? They get a payslip email.`,
      { confirmLabel: isAr ? 'سجّل' : 'Record' }
    );
    if (!ok) return;
    const body = { teacherId: row.teacherId, month, method, reference, confirmAwaiting: st.awaitingCount > 0 };
    await run(() => send('/api/dashboard/payroll/payouts', 'POST', body), isAr ? 'اتسجّل واتبعت الإيصال.' : 'Recorded; payslip sent.');
  };

  return (
    <div className="space-y-5 pt-4">
      <div className="grid sm:grid-cols-[1fr_8rem_auto] gap-2 items-end">
        <label className="text-sm font-semibold text-foreground space-y-1">
          <span>{isAr ? 'سعر الساعة' : 'Hourly rate'}</span>
          <input className={field} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} dir="ltr" />
        </label>
        <label className="text-sm font-semibold text-foreground space-y-1">
          <span>{isAr ? 'العملة' : 'Currency'}</span>
          <input className={`${field} uppercase`} maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} dir="ltr" />
        </label>
        <button type="button" disabled={busy} onClick={() => run(() => send(`/api/dashboard/payroll/rates/${row.teacherId}`, 'PUT', { hourlyRate: Number(rate), currency }), isAr ? 'اتحفظ السعر.' : 'Rate saved.')} className="min-h-11 px-5 rounded-xl border border-border font-semibold text-sm cursor-pointer disabled:opacity-60">
          {isAr ? 'احفظ السعر' : 'Save rate'}
        </button>
      </div>

      <PayLines statement={st} isAr={isAr} onRemoveAdjustment={row.payout ? undefined : (id) => run(() => send(`/api/dashboard/payroll/adjustments/${id}`, 'DELETE'), isAr ? 'اتشال.' : 'Removed.')} />

      {!row.payout && (
        <div className="grid sm:grid-cols-[8rem_1fr_auto] gap-2 items-end">
          <label className="text-sm font-semibold text-foreground space-y-1">
            <span>{isAr ? 'مكافأة أو خصم' : 'Bonus or deduction'}</span>
            <input className={field} inputMode="decimal" placeholder={isAr ? '-50 للخصم' : '-50 to deduct'} value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} dir="ltr" />
          </label>
          <label className="text-sm font-semibold text-foreground space-y-1">
            <span>{isAr ? 'السبب' : 'Reason'}</span>
            <input className={field} value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
          </label>
          <button type="button" disabled={busy || !adjAmount || adjReason.trim().length < 3} onClick={() => run(async () => { await send('/api/dashboard/payroll/adjustments', 'POST', { teacherId: row.teacherId, month, amount: Number(adjAmount), reason: adjReason }); setAdjAmount(''); setAdjReason(''); }, isAr ? 'اتضاف.' : 'Added.')} className="min-h-11 px-5 rounded-xl border border-border font-semibold text-sm cursor-pointer disabled:opacity-60">
            {isAr ? 'أضف' : 'Add'}
          </button>
        </div>
      )}

      {row.payout ? (
        <p className="text-sm rounded-2xl border border-secondary/40 bg-secondary/10 p-3 text-foreground">
          {isAr ? 'اتحوّل' : 'Paid'} {fmtMoney(row.payout.amount, row.payout.currency)} · {row.payout.method}{row.payout.reference ? ` · ${row.payout.reference}` : ''} · {DateTime.fromISO(row.payout.paid_at).toFormat('d LLL yyyy')}
        </p>
      ) : isPast ? (
        <div className="rounded-2xl border border-border p-4 space-y-3">
          <p className="font-semibold text-foreground">{isAr ? 'سجّل التحويل' : 'Record the transfer'}</p>
          {st.awaitingCount > 0 && (
            <p className="text-sm text-amber-800 dark:text-amber-200">{isAr ? `${st.awaitingCount} حصة من غير نتيجة ومش محسوبة.` : `${st.awaitingCount} lesson(s) have no outcome and are not counted.`}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-2">
            <input className={field} aria-label={isAr ? 'طريقة التحويل' : 'Transfer method'} placeholder={isAr ? 'الطريقة (إنستاباي، بنك، Wise…)' : 'Method (Instapay, bank, Wise…)'} value={method} onChange={(e) => setMethod(e.target.value)} />
            <input className={field} aria-label={isAr ? 'رقم العملية' : 'Transfer reference'} placeholder={isAr ? 'رقم العملية (اختياري)' : 'Reference (optional)'} value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <button type="button" disabled={busy || method.trim().length < 2 || st.hourlyRate === null} onClick={recordPayout} className="w-full sm:w-auto min-h-12 px-6 rounded-xl bg-[#0A2E35] text-white font-semibold text-sm cursor-pointer disabled:opacity-50">
            {isAr ? `سجّل ${fmtMoney(st.total, st.currency)} واتبعت الإيصال` : `Record ${fmtMoney(st.total, st.currency)} and send the payslip`}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{isAr ? 'الشهر لسه ما خلصش. التحويل بيتسجّل بين يوم 1 و5 من الشهر اللي بعده.' : 'The month is still running. Record the transfer between the 1st and 5th of next month.'}</p>
      )}
    </div>
  );
}

export default function PayrollPage() {
  const { isAr } = useT();
  const [month, setMonth] = useState(DateTime.utc().minus({ months: DateTime.utc().day <= 10 ? 1 : 0 }).toFormat('yyyy-MM'));
  const [data, setData] = useState<any>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    dashboardFetch<any>(`/api/dashboard/payroll?month=${month}`).then(setData).catch((e) => setError(e.message));
  }, [month]);
  useEffect(() => { setData(null); load(); }, [load]);

  return (
    <div className="space-y-6 pb-12 max-w-5xl" data-testid="payroll">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{isAr ? 'مرتبات المعلمين' : 'Teacher pay'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'سعر الساعة × مدة الحصص المحسوبة، زائد أو ناقص أي مكافأة أو خصم.' : 'Hourly rate × length of the lessons that count, plus or minus any bonus or deduction.'}
          </p>
        </div>
        <MonthSelect value={month} onChange={setMonth} isAr={isAr} />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!data && !error && <p className="text-sm text-muted-foreground">{isAr ? 'بنحمّل…' : 'Loading…'}</p>}
      {data && (
        <ul className="space-y-3">
          {data.teachers.map((row: any) => {
            const st = row.statement;
            const isOpen = open === row.teacherId;
            return (
              <li key={row.teacherId} className="rounded-2xl border border-border bg-surface p-4">
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : row.teacherId)} className="w-full flex items-center justify-between gap-3 text-start cursor-pointer min-h-11">
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground truncate">{row.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {st.hourlyRate === null ? (isAr ? 'سعر الساعة مش متحدد' : 'No hourly rate yet') : `${st.paidLessons} ${isAr ? 'حصة' : 'lessons'} · ${Math.round(st.paidMinutes / 6) / 10} ${isAr ? 'ساعة' : 'h'}`}
                      {' · '}
                      <span className={row.payout ? 'text-secondary font-semibold' : ''}>{row.payout ? (isAr ? 'اتحوّل' : 'Paid') : (isAr ? 'لسه' : 'Not paid')}</span>
                    </span>
                  </span>
                  <span className="font-display text-xl font-bold tabular-nums text-foreground shrink-0" dir="ltr">{fmtMoney(st.total, st.currency)}</span>
                </button>
                {isOpen && (
                  <>
                    <div className="pt-4"><PayTotals statement={st} isAr={isAr} /></div>
                    <TeacherPay row={row} month={month} isPast={data.isPast} isAr={isAr} reload={load} />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
