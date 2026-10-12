import React, { useEffect, useState } from 'react';
import { bookingService } from '../../booking/bookingService';
import { BOOKING_SERVICES, calculateLessonFee } from '../../booking/mockData';
import { DayAvailability, PackageCatalogEntry, TimeSlot, Language } from '../../booking/types';
import { Check, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export type SelectedLesson = { date: string; slot: TimeSlot };

/** Display helper only. Both amounts originate in the server catalog; never submit these numbers. */
export function catalogPriceSummary(single: PackageCatalogEntry | undefined, bundle: PackageCatalogEntry | undefined) {
  if (!single || !bundle || single.currency !== bundle.currency || single.lesson_count !== 1 ||
      !Number.isFinite(single.price_amount) || !Number.isFinite(bundle.price_amount) ||
      single.price_amount <= 0 || bundle.price_amount <= 0) return null;
  const regularCents = Math.round(single.price_amount * 100) * bundle.lesson_count;
  const finalCents = Math.round(bundle.price_amount * 100);
  return { regular: regularCents / 100, saving: Math.max(0, regularCents - finalCents) / 100,
    total: finalCents / 100, perLesson: finalCents / bundle.lesson_count / 100, currency: bundle.currency };
}

export function canReviewLessons(requested: number, available: number, selected: SelectedLesson[]): boolean {
  return requested > 1 && selected.length === requested &&
    new Set(selected.map(s => s.date)).size === requested;
}

const money = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);

/**
 * Display-only date label. Parses the ISO `YYYY-MM-DD` components directly (UTC) so the
 * label never drifts with the browser timezone — the authoritative lesson times remain the
 * availability-provided UTC fields, never a browser-local reconstruction.
 */
export function formatLessonDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
  });
}

interface Props {
  catalog: PackageCatalogEntry[];
  serviceId: string;
  duration: number;
  timezone: string;
  teacherId?: string;
  count: number;
  onCount: (count: number) => void;
  selected: SelectedLesson[];
  onSelected: (selected: SelectedLesson[]) => void;
  phase: 'quantity' | 'schedule' | 'review';
  lang?: Language;
  onNext?: () => void;
  onBack?: () => void;
  onConfirm?: () => void;
  confirming?: boolean;
}

export const MultiLessonPlan: React.FC<Props> = ({
  catalog,
  serviceId,
  duration,
  timezone,
  teacherId,
  count,
  onCount,
  selected,
  onSelected,
  phase,
  lang = 'ar',
  onNext,
  onBack,
  onConfirm,
  confirming
}) => {
  const isAr = lang === 'ar';
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [period, setPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Current catalog contains a single-lesson baseline for 60-minute religious lessons only.
  const eligible = duration === 60 && ['quran', 'islamic_studies'].includes(BOOKING_SERVICES.find(s => s.id === serviceId)?.group || '');
  const rows = eligible ? catalog.filter(c => c.is_active && c.currency === 'USD' && c.package_type === 'weekly' &&
    Number.isInteger(c.lesson_count) && c.lesson_count >= 1 && Number.isFinite(c.price_amount)) : [];
  const single = rows.find(c => c.lesson_count === 1);
  const options = single ? rows.filter(c => c.lesson_count > 1 && catalogPriceSummary(single, c)) : [];
  const bundle = options.find(c => c.lesson_count === count);
  let price = catalogPriceSummary(single, bundle);

  // Fallback calculation if not in DB catalog:
  if (!price && count > 1) {
    const singleFee = calculateLessonFee(serviceId, duration, false);
    let perLessonDiscount = 0;
    if (count >= 12) perLessonDiscount = 0.15;
    else if (count >= 8) perLessonDiscount = 0.11;
    else if (count >= 4) perLessonDiscount = 0.06;
    const total = Math.round(singleFee * count * (1 - perLessonDiscount));
    const perLesson = Math.round((total / count) * 100) / 100;
    const regular = singleFee * count;
    price = {
      regular,
      saving: Math.max(0, regular - total),
      total,
      perLesson,
      currency: 'USD'
    };
  }

  useEffect(() => {
    if (phase !== 'schedule' || count <= 1) return;
    let active = true;
    setLoading(true);
    setError('');
    bookingService.getAvailability(timezone, duration, teacherId, 60).then(result => {
      if (!active) return;
      setDays(result);
      const uniquePeriods = [...new Set(result.map(d => d.dateString.slice(0, 7)))];
      setPeriod(uniquePeriods[0] || '');
    }).catch(() => { if (active) { setDays([]); setError('Availability could not be verified. Please try again later.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [phase, count, duration, timezone, teacherId]);

  const periods = [...new Set(days.map(day => day.dateString.slice(0, 7)))];
  // One lesson per day: avoids counting overlapping start times as separate lessons.
  const availableDays = days.filter(day => day.dateString.startsWith(period) && day.isAvailable && day.slots.some(slot => slot.available));
  const selectedInPeriod = selected.filter(item => availableDays.some(day => day.dateString === item.date && day.slots.some(slot => slot.id === item.slot.id && slot.available)));

  if (phase === 'quantity') return (
    <section className="space-y-3 border-t border-border pt-5" aria-label="Lesson quantity">
      <h3 className="font-display text-lg">How many lessons would you like to book?</h3>
      <button type="button" aria-pressed={count === 1} onClick={() => onCount(1)} className="rounded-xl border border-border p-3 mr-2">1 lesson — book a single time</button>
      {options.map(row => {
        const details = catalogPriceSummary(single, row)!;
        return <button key={row.id} type="button" aria-pressed={count === row.lesson_count} onClick={() => onCount(row.lesson_count)} className={`block w-full text-left rounded-xl border p-3 ${count === row.lesson_count ? 'border-primary bg-secondary/30' : 'border-border'}`}>
          <strong>{row.lesson_count} lessons</strong> · Regular total: {money(details.regular, details.currency)} · {details.saving > 0 && <strong>Save {money(details.saving, details.currency)} · </strong>}Total: {money(details.total, details.currency)} · {money(details.perLesson, details.currency)} / lesson
        </button>;
      })}
      {!eligible && <p className="text-sm text-muted-foreground">Multi-lesson catalog pricing is not available for this subject and duration. You can book one lesson now.</p>}
      {eligible && !single && <p className="text-sm text-muted-foreground">Multi-lesson pricing is temporarily unavailable. You can still book one lesson.</p>}
      <p className="text-sm text-muted-foreground">Multi-lesson choices are fixed prepaid lessons, not a subscription. Times must be chosen before any purchase can be confirmed.</p>
    </section>
  );

  if (phase === 'review') return (
    <section className="space-y-5" aria-label="Multi-lesson review">
      <header className="space-y-1">
        <h2 className="font-display text-xl font-medium text-foreground">{isAr ? 'مراجعة مواعيد الدروس' : 'Review your lessons'}</h2>
        <p className="text-sm text-muted-foreground">
          {BOOKING_SERVICES.find(s => s.id === serviceId)?.name} · {duration} min · {count} lessons
        </p>
      </header>

      {/* 1. What was selected — the actual lesson times, grouped cleanly */}
      <div className="rounded-2xl border border-border glass-card p-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Your selected times
        </p>
        <ul className="divide-y divide-border-subtle">
          {selected.map(({ date, slot }) => (
            <li key={`${date}-${slot.id}`} className="flex items-baseline justify-between gap-3 py-2">
              <span className="text-sm text-muted-foreground">{formatLessonDay(date)}</span>
              <span className="text-sm font-medium text-foreground tabular-nums">{slot.timeDisplay}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">Times shown in {timezone}</p>
      </div>

      {/* 2. Price — total first, then per-lesson, then savings (never inflate the regular price) */}
      {price && (
        <div className="rounded-2xl border border-border glass-surface p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Price</p>
          <p className="font-display text-2xl font-bold text-foreground">
            {money(price.total, price.currency)}{' '}
            <span className="font-sans text-sm font-medium text-muted-foreground">total</span>
          </p>
          <p className="text-sm text-muted-foreground">{money(price.perLesson, price.currency)} / lesson</p>
          {price.saving > 0 && (
            <p className="text-sm font-medium text-success">
              You save: {money(price.saving, price.currency)}
              <span className="font-normal text-muted-foreground"> · regular total: {money(price.regular, price.currency)}</span>
            </p>
          )}
        </div>
      )}

      {/* 3. What happens on confirm — one line, then one clarification */}
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>Your selected times will be checked again before the lesson plan is created.</p>
        <p>Payment is handled separately. These times are not confirmed until the plan is created and payment is confirmed.</p>
      </div>

      {/* 4. Actions — one obvious primary CTA, edit stays secondary */}
      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle cursor-pointer"
        >
          {isAr ? 'تعديل المواعيد' : 'Edit times'}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={selected.length !== count || Boolean(confirming)}
          className="rounded-xl btn-primary-material px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 cursor-pointer"
        >
          {confirming
            ? (isAr ? 'جارٍ تسجيل خطة الدروس...' : 'Creating plan…')
            : (isAr ? 'تأكيد خطة الدروس والمتابعة للدفع' : 'Confirm lesson plan & Proceed')}
        </button>
      </div>
    </section>
  );

  const canReview = selected.length === count && new Set(selected.map(s => s.date)).size === count;

  return (
    <section className="space-y-5" aria-label="Select lesson times">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold text-foreground">
          {isAr ? 'اختر مواعيد دروس الباقة' : 'Choose your lesson dates & times'}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {count} {isAr ? 'حصص' : 'lessons'} · {duration} {isAr ? 'دقيقة لكل حصة' : 'min each'} · {isAr ? 'المواعيد بحسب توقيت' : 'Times in'} {timezone}
        </p>
      </div>

      {price && (
        <div className="p-3.5 rounded-2xl glass-surface border border-border flex items-center justify-between text-xs sm:text-sm">
          <div>
            <span className="text-muted-foreground me-1">{isAr ? 'إجمالي الباقة:' : 'Total:'}</span>
            <strong className="text-foreground font-bold text-base">{money(price.total, price.currency)}</strong>
            <span className="text-muted-foreground ms-1">({money(price.perLesson, price.currency)} / {isAr ? 'حصة' : 'lesson'})</span>
          </div>
          {price.saving > 0 && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              {isAr ? `وفرت ${money(price.saving, price.currency)}` : `Saved ${money(price.saving, price.currency)}`}
            </span>
          )}
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {isAr ? 'جارٍ التحقق من المواعيد المتاحة…' : 'Checking live availability…'}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="lesson-period" className="text-xs sm:text-sm font-bold text-foreground">
                {isAr ? 'الشهر المحدد:' : 'Month:'}
              </label>
              <select
                id="lesson-period"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="rounded-xl border border-border glass-card px-3 py-2 text-sm text-foreground"
              >
                {periods.map(month => (
                  <option key={month} value={month}>
                    {new Date(`${month}-01T12:00:00Z`).toLocaleString(isAr ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  </option>
                ))}
              </select>
            </div>

            <div className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl border ${
              canReview
                ? 'bg-teal-500/15 border-teal-500/30 text-teal-800 dark:text-teal-200'
                : 'bg-primary/10 border-primary/20 text-primary'
            }`}>
              {isAr ? (
                `${selected.length} من أصل ${count} مواعيد مختارة`
              ) : (
                <>{selectedInPeriod.length} of {count} lessons selected</>
              )}
            </div>
          </div>

          {period && availableDays.length < count && (
            <p role="alert" className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {isAr
                ? `وجدنا ${availableDays.length} أيام دروس متاحة في هذا الشهر فقط. اختر عدداً أقل أو شهراً آخر.`
                : `We found ${availableDays.length} available lesson days in this period. Choose fewer lessons or another period.`}
            </p>
          )}

          <div className="space-y-3 max-h-[46vh] overflow-y-auto pe-1">
            {availableDays.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {isAr ? 'لا توجد مواعيد متاحة في هذا الشهر، يرجى اختيار شهر آخر.' : 'No available slots found for this month, please select another.'}
              </p>
            ) : (
              availableDays.map(day => (
                <div key={day.dateString} className="rounded-2xl border border-border glass-surface p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-foreground">
                    <span>{day.dayOfWeek}, {day.monthName} {day.dayOfMonth}</span>
                    {selected.some(item => item.date === day.dateString) && (
                      <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded">
                        {isAr ? 'تم اختيار موعد' : 'Slot selected'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {day.slots.filter(slot => slot.available).map(slot => {
                      const isChosen = selected.some(item => item.date === day.dateString && item.slot.id === slot.id);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          aria-pressed={isChosen}
                          onClick={() => {
                            if (isChosen) {
                              onSelected(selected.filter(item => !(item.date === day.dateString && item.slot.id === slot.id)));
                            } else {
                              const withoutSameDate = selected.filter(item => item.date !== day.dateString);
                              if (withoutSameDate.length < count) {
                                onSelected([...withoutSameDate, { date: day.dateString, slot }]);
                              }
                            }
                          }}
                          className={`rounded-xl border px-3 py-2 text-xs sm:text-sm transition-all cursor-pointer font-medium ${
                            isChosen
                              ? 'border-teal-500 bg-teal-500/25 text-teal-950 dark:text-teal-100 ring-2 ring-teal-500/40 font-bold shadow-xs'
                              : 'border-border glass-card hover:border-teal-500/40 text-foreground'
                          }`}
                        >
                          {slot.timeDisplay}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {selected.length > 0 && (
            <div className="p-3 rounded-2xl glass-card border border-border space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                {isAr ? 'المواعيد التي اخترتها:' : 'Selected dates:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {selected.map(({ date, slot }) => (
                  <span
                    key={`${date}-${slot.id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-800 dark:text-teal-200 border border-teal-500/30 text-xs font-semibold"
                  >
                    <span>{formatLessonDay(date)}</span>
                    <span className="opacity-70">•</span>
                    <span>{slot.timeDisplay}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              {isAr ? '← رجوع لاختيار الباقة' : '← Back to lesson count'}
            </button>
            <button
              type="button"
              disabled={!canReview}
              onClick={onNext}
              className={`px-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                canReview
                  ? 'btn-primary-material text-white shadow-lg shadow-primary/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-muted text-muted-foreground/50 border border-border cursor-not-allowed opacity-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isAr
                  ? (canReview ? 'متابعة إلى مراجعة وتأكيد المواعيد' : `يرجى تحديد كافة المواعيد (${selected.length}/${count})`)
                  : (canReview ? 'Review Selected Lessons' : `Select All Lesson Times (${selected.length}/${count})`)}
              </span>
            </button>
          </div>
        </>
      )}
    </section>
  );
};
