import React, { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { dashboardFetch } from '../lib/dashboardApi';
import { notify, confirmAction } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { fmtMoney } from './PayStatementView';

/**
 * Super admin: quarterly retention bonus (RULES.md §2c, BACKLOG MK-02). Teachers never see this.
 * Per teacher and quarter: learners taught, who left and why, full-price hours and the pool they built
 * (10% of list per full-price hour). The admin judges the rest, may add a top-up, then pays it as a monthly bonus
 * with a written reason (the existing pay adjustment).
 */

const REASONS: Record<string, [string, string]> = {
  times: ['Times', 'المواعيد'], teacher_gender: ['Teacher gender', 'نوع المعلم'], level_subject: ['Level or subject', 'المستوى أو المادة'],
  siblings: ['Siblings together', 'الإخوة مع بعض'], teacher_reasons: ["Teacher's reasons", 'أسباب من المعلم'], language: ['Language', 'اللغة'],
  fit: ['Not a good fit', 'مش مناسب'], quality: ['Teaching quality', 'جودة التدريس'], learner_attendance: ["Learner's attendance", 'حضور الطالب'],
  respect: ['Respect', 'الاحترام'], safety: ['Safety', 'الأمان'], other: ['Other', 'سبب تاني'],
};

const quarters = () => {
  const now = DateTime.utc();
  return Array.from({ length: 4 }, (_, i) => {
    const d = now.minus({ months: i * 3 });
    return `${d.year}-Q${Math.ceil(d.month / 3)}`;
  });
};

const send = (path: string, method: string, body?: object) =>
  dashboardFetch<any>(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });

function TeacherQuarter({ row, quarter, isAr, reload }: { row: any; quarter: string; isAr: boolean; reload: () => void }) {
  const s = row.summary;
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [topUp, setTopUp] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState(isAr ? 'شكرًا على حفاظك على طلابك وشغلك الكويس.' : 'Thank you for keeping your learners and for your good work.');
  const [busy, setBusy] = useState(false);
  const total = Math.round((s.poolUsd + (Number(topUp) || 0)) * 100) / 100;
  const prefix = `Retention bonus ${quarter}`;

  const pay = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return notify(t('Enter the amount to pay.', 'اكتب المبلغ.'), 'error');
    const ok = await confirmAction(
      t(`Add ${fmtMoney(n, row.currency)} as a bonus to ${row.name}'s pay this month?`, `تضيف ${fmtMoney(n, row.currency)} مكافأة لمرتب ${row.name} الشهر ده؟`),
      { confirmLabel: t('Add bonus', 'ضيف المكافأة') }
    );
    if (!ok) return;
    setBusy(true);
    try {
      await send('/api/dashboard/payroll/adjustments', 'POST', { teacherId: row.teacherId, month: DateTime.utc().toFormat('yyyy-MM'), amount: n, reason: `${prefix}: ${note.trim()}`.slice(0, 500) });
      notify(t('Bonus added to this month.', 'المكافأة اتضافت للشهر ده.'), 'success');
      reload();
    } catch (e: any) { notify(e?.message || t('Something went wrong', 'حصلت مشكلة'), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <li className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-foreground">{row.name}</p>
        <p className="font-display text-xl font-bold tabular-nums text-foreground" dir="ltr">{fmtMoney(s.poolUsd, 'USD')}</p>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-surface-subtle/60 p-2">
          <dt className="text-xs text-muted-foreground">{t('Learners taught', 'طلاب درّسهم')}</dt>
          <dd className={`font-bold tabular-nums ${s.meetsMinimum ? 'text-secondary' : 'text-foreground'}`}>{s.learnersTaught} / {s.minLearners}</dd>
        </div>
        <div className="rounded-xl bg-surface-subtle/60 p-2">
          <dt className="text-xs text-muted-foreground">{t('Learners who left', 'طلاب مشيوا')}</dt>
          <dd className="font-bold tabular-nums">{s.leavers.length}</dd>
        </div>
        <div className="rounded-xl bg-surface-subtle/60 p-2">
          <dt className="text-xs text-muted-foreground">{t('Full-price hours', 'ساعات بالسعر الكامل')}</dt>
          <dd className="font-bold tabular-nums">{s.fullPriceHours}</dd>
        </div>
      </dl>
      <ul className="text-sm space-y-1" aria-label={t('Checks', 'الشروط')}>
        <li>{s.meetsMinimum ? '✓' : '✗'} {t(`Taught at least ${s.minLearners} learners this quarter`, `درّس ${s.minLearners} طلاب على الأقل في الربع ده`)}</li>
        <li>? {t('No learner left because of the teacher (your judgement, below)', 'ما فيش طالب مشي بسبب المعلم (تقديرك، تحت)')}</li>
        <li>? {t('Your review of performance and commitment', 'تقييمك للأداء والالتزام')}</li>
      </ul>
      {s.leavers.length > 0 && (
        <ul className="text-sm text-muted-foreground space-y-1 border-t border-border pt-2">
          {s.leavers.map((l: any) => (
            <li key={`${l.studentId}-${l.why}`}>
              <span className="text-foreground font-medium">{l.learnerName || t('Learner', 'طالب')}</span>
              {' · '}
              {l.why === 'moved'
                ? `${t('moved to another teacher', 'اتنقل لمعلم تاني')}: ${REASONS[l.reasonType]?.[isAr ? 1 : 0] || l.reasonType}`
                : t('stopped (no lessons for 30+ days, nothing booked)', 'وقف (من غير حصص ٣٠ يوم أو أكتر، ومفيش حجز)')}
            </li>
          ))}
        </ul>
      )}
      {row.paid.length > 0 ? (
        <p className="text-sm font-semibold text-secondary">
          {t('Paid for this quarter: ', 'اتصرفت عن الربع ده: ')}{row.paid.map((p: any) => fmtMoney(p.amount, row.currency)).join(', ')}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 border-t border-border pt-3">
          <label className="block text-sm">
            <span className="text-muted-foreground">{t('Top-up from the academy (USD)', 'زيادة من الأكاديمية (دولار)')}</span>
            <Input type="number" min={0} step="0.01" dir="ltr" className="mt-1" value={topUp} onChange={(e) => setTopUp(e.target.value)} />
            <span className="block mt-1 text-xs text-muted-foreground">{t('Pool + top-up: ', 'المجموع: ')}<b dir="ltr">{fmtMoney(total, 'USD')}</b></span>
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">{t(`Amount to pay (${row.currency})`, `المبلغ اللي هيتصرف (${row.currency})`)}</span>
            <Input type="number" min={0} step="0.01" dir="ltr" className="mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-muted-foreground">{t('Reason the teacher reads on the payslip', 'السبب اللي المعلم هيقراه في كشف المرتب')}</span>
            <span className="mt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0" dir="ltr">{prefix}:</span>
              <Input className="flex-1" value={note} maxLength={400} onChange={(e) => setNote(e.target.value)} />
            </span>
          </label>
          <div className="sm:col-span-2">
            <Button onClick={pay} isLoading={busy} disabled={!amount}>{t('Pay as bonus this month', 'اصرفها مكافأة الشهر ده')}</Button>
          </div>
        </div>
      )}
    </li>
  );
}

export function RetentionBonus({ isAr }: { isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const options = quarters();
  const [quarter, setQuarter] = useState(options[1]);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [min, setMin] = useState('');

  const load = useCallback(() => {
    setError(null);
    dashboardFetch<any>(`/api/dashboard/payroll/retention?quarter=${quarter}`)
      .then((d) => { setData(d); setMin(String(d.minLearners)); })
      .catch((e) => setError(e.message));
  }, [quarter]);
  useEffect(() => { setData(null); load(); }, [load]);

  const saveMin = async () => {
    try { await send('/api/dashboard/payroll/retention/settings', 'PUT', { minLearners: Number(min) }); notify(t('Saved.', 'اتحفظ.'), 'success'); load(); }
    catch (e: any) { notify(e?.message || t('Something went wrong', 'حصلت مشكلة'), 'error'); }
  };

  return (
    <section aria-labelledby="retention-title" className="space-y-4 pt-4 border-t border-border" data-testid="retention-bonus">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="retention-title" className="font-display text-xl sm:text-2xl font-bold text-foreground">{t('Quarterly retention bonus', 'مكافأة الاحتفاظ كل ربع سنة')}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {t('Only you see this. The pool is 10% of the list price of every full-price lesson held (no package, no discount code). Teachers only know the bonus exists.',
               'إنت بس اللي شايف ده. المبلغ = ١٠٪ من السعر الأساسي لكل حصة اتعملت بالسعر الكامل (من غير باقة ولا كود خصم). المعلمين يعرفوا بس إن المكافأة موجودة.')}
          </p>
        </div>
        <select aria-label={t('Quarter', 'الربع')} value={quarter} onChange={(e) => setQuarter(e.target.value)} className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground" dir="ltr">
          {options.map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block text-sm">
          <span className="text-muted-foreground">{t('Minimum learners in a quarter', 'أقل عدد طلاب في الربع')}</span>
          <Input type="number" min={1} max={100} step={1} dir="ltr" className="mt-1 w-28" value={min} onChange={(e) => setMin(e.target.value)} />
        </label>
        <Button variant="outline" onClick={saveMin} disabled={!min || String(data?.minLearners) === min}>{t('Save', 'احفظ')}</Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!data && !error && <p className="text-sm text-muted-foreground">{t('Loading…', 'بنحمّل…')}</p>}
      {data && !data.isOver && <p className="text-sm text-muted-foreground">{t('This quarter is still running; the numbers will grow.', 'الربع ده لسه شغال، والأرقام هتزيد.')}</p>}
      {data && (
        <ul className="space-y-3">
          {data.teachers.map((row: any) => <TeacherQuarter key={row.teacherId} row={row} quarter={data.quarter} isAr={isAr} reload={load} />)}
        </ul>
      )}
    </section>
  );
}
