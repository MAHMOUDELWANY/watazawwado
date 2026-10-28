import React, { useState } from 'react';
import { DateTime } from 'luxon';

/** One teacher month: totals first, then the lessons (counted or why not). Used by My pay and Payroll. */

export const OUTCOME_TEXT: Record<string, { en: string; ar: string }> = {
  completed: { en: 'Held', ar: 'اتعملت' },
  student_no_show: { en: 'Student did not come (counted)', ar: 'الطالب ما حضرش (محسوبة)' },
  trial: { en: 'Free trial, not paid', ar: 'تجريبية، من غير أجر' },
  cancelled: { en: 'Cancelled in time', ar: 'اتلغت في وقتها' },
  teacher_absent: { en: 'Teacher absent', ar: 'المعلم ما حضرش' },
  technical: { en: 'Technical problem', ar: 'مشكلة تقنية' },
  awaiting: { en: 'Record the outcome to count it', ar: 'سجّل اللي حصل عشان تتحسب' },
  upcoming: { en: 'Coming up', ar: 'جاية' }
};

export const fmtMoney = (n: number | null | undefined, currency: string) =>
  `${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;

export const monthLabel = (month: string, isAr: boolean) =>
  DateTime.fromFormat(month, 'yyyy-MM').setLocale(isAr ? 'ar' : 'en').toFormat('LLLL yyyy');

export function PayTotals({ statement, isAr }: { statement: any; isAr: boolean }) {
  const hours = Math.round((statement.paidMinutes / 60) * 100) / 100;
  const tiles = [
    { label: isAr ? 'المجموع' : 'Total', value: fmtMoney(statement.total, statement.currency), strong: true },
    { label: isAr ? 'حصص محسوبة' : 'Lessons counted', value: String(statement.paidLessons) },
    { label: isAr ? 'ساعات' : 'Hours', value: String(hours) },
    { label: isAr ? 'سعر الساعة' : 'Hourly rate', value: statement.hourlyRate === null ? (isAr ? 'لسه ما اتحددش' : 'Not set yet') : fmtMoney(statement.hourlyRate, statement.currency) }
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
          <p className={`font-display tabular-nums ${t.strong ? 'text-2xl sm:text-3xl font-bold' : 'text-xl sm:text-2xl'} text-foreground`} dir="ltr">{t.value}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t.label}</p>
        </div>
      ))}
    </div>
  );
}

export function PayLines({ statement, isAr, onRemoveAdjustment }: { statement: any; isAr: boolean; onRemoveAdjustment?: (id: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const lines: any[] = statement.lines || [];
  const shown = showAll ? lines : lines.slice(0, 12);
  return (
    <div className="space-y-4">
      {(statement.adjustments || []).length > 0 && (
        <ul className="rounded-2xl border border-border divide-y divide-border">
          {statement.adjustments.map((a: any) => (
            <li key={a.id} className="p-3 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="font-semibold text-foreground">{a.amount > 0 ? (isAr ? 'مكافأة' : 'Bonus') : (isAr ? 'خصم' : 'Deduction')}</span>
                <span className="text-muted-foreground"> · {a.reason}</span>
              </span>
              <span className="flex items-center gap-3 shrink-0">
                <span className={`tabular-nums font-semibold ${a.amount > 0 ? 'text-secondary' : 'text-destructive'}`} dir="ltr">{a.amount > 0 ? '+' : ''}{fmtMoney(a.amount, statement.currency)}</span>
                {onRemoveAdjustment && (
                  <button type="button" onClick={() => onRemoveAdjustment(a.id)} className="min-h-11 px-2 text-xs underline text-muted-foreground cursor-pointer">{isAr ? 'شيل' : 'Remove'}</button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{isAr ? 'مفيش حصص في الشهر ده.' : 'No lessons this month.'}</p>
      ) : (
        <ul className="rounded-2xl border border-border divide-y divide-border">
          {shown.map((l) => {
            const when = DateTime.fromISO(l.date).setLocale(isAr ? 'ar' : 'en').toFormat('ccc d LLL · HH:mm');
            const text = OUTCOME_TEXT[l.outcome] || { en: l.outcome, ar: l.outcome };
            return (
              <li key={l.bookingId} className="p-3 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground truncate">{l.learnerName || l.referenceCode}</span>
                  <span className="block text-muted-foreground">{when} · {l.minutes} {isAr ? 'د' : 'min'} · <span className={l.outcome === 'awaiting' ? 'text-amber-700 dark:text-amber-300 font-semibold' : ''}>{isAr ? text.ar : text.en}</span></span>
                </span>
                <span className={`tabular-nums shrink-0 ${l.paid ? 'font-semibold text-foreground' : 'text-muted-foreground'}`} dir="ltr">{l.paid ? fmtMoney(l.amount, statement.currency) : '–'}</span>
              </li>
            );
          })}
        </ul>
      )}
      {lines.length > 12 && !showAll && (
        <button type="button" onClick={() => setShowAll(true)} className="min-h-11 text-sm font-semibold underline cursor-pointer">
          {isAr ? `اعرض الكل (${lines.length})` : `Show all ${lines.length}`}
        </button>
      )}
    </div>
  );
}

/** Month picker: this month and the 11 before it. */
export function MonthSelect({ value, onChange, isAr }: { value: string; onChange: (m: string) => void; isAr: boolean }) {
  const months = Array.from({ length: 12 }, (_, i) => DateTime.utc().startOf('month').minus({ months: i }).toFormat('yyyy-MM'));
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={isAr ? 'الشهر' : 'Month'}
      className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground"
    >
      {months.map((m) => <option key={m} value={m}>{monthLabel(m, isAr)}</option>)}
    </select>
  );
}
