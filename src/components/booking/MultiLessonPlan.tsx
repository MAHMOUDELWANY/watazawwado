import React, { useEffect, useState } from 'react';
import { bookingService } from '../../booking/bookingService';
import { BOOKING_SERVICES } from '../../booking/mockData';
import { DayAvailability, PackageCatalogEntry, TimeSlot } from '../../booking/types';

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
  return requested > 1 && available >= requested && selected.length === requested &&
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
  onNext?: () => void;
  onBack?: () => void;
  onConfirm?: () => void;
  confirming?: boolean;
}

export const MultiLessonPlan: React.FC<Props> = ({ catalog, serviceId, duration, timezone, teacherId, count, onCount, selected, onSelected, phase, onNext, onBack, onConfirm, confirming }) => {
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [period, setPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Current catalog contains a single-lesson baseline for 60-minute religious lessons only.
  // Do not imply the same catalog prices apply to other services or durations.
  const eligible = duration === 60 && ['quran', 'islamic_studies'].includes(BOOKING_SERVICES.find(s => s.id === serviceId)?.group || '');
  const rows = eligible ? catalog.filter(c => c.is_active && c.currency === 'USD' && c.package_type === 'weekly' &&
    Number.isInteger(c.lesson_count) && c.lesson_count >= 1 && Number.isFinite(c.price_amount)) : [];
  const single = rows.find(c => c.lesson_count === 1);
  const options = single ? rows.filter(c => c.lesson_count > 1 && catalogPriceSummary(single, c)) : [];
  const bundle = options.find(c => c.lesson_count === count);
  const price = catalogPriceSummary(single, bundle);

  useEffect(() => {
    if (phase !== 'schedule' || count <= 1) return;
    let active = true;
    setLoading(true);
    setError('');
    bookingService.getAvailability(timezone, duration, teacherId, 60).then(result => {
      if (!active) return;
      setDays(result);
      setPeriod('');
      onSelected([]);
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
      <h3 className="font-serif text-lg">How many lessons would you like to book?</h3>
      <button type="button" aria-pressed={count === 1} onClick={() => onCount(1)} className="rounded-xl border border-border p-3 mr-2">1 lesson — book a single time</button>
      {options.map(row => {
        const details = catalogPriceSummary(single, row)!;
        return <button key={row.id} type="button" aria-pressed={count === row.lesson_count} onClick={() => onCount(row.lesson_count)} className={`block w-full text-left rounded-xl border p-3 ${count === row.lesson_count ? 'border-primary bg-primary/10' : 'border-border'}`}>
          <strong>{row.lesson_count} lessons</strong> · Regular total: {money(details.regular, details.currency)} · {details.saving > 0 && <strong>Save {money(details.saving, details.currency)} · </strong>}Total: {money(details.total, details.currency)} · {money(details.perLesson, details.currency)} / lesson
        </button>;
      })}
      {!eligible && <p className="text-sm text-muted-foreground">Multi-lesson catalog pricing is not available for this subject and duration. You can book one lesson now.</p>}
      {eligible && !single && <p className="text-sm text-muted-foreground">Multi-lesson pricing is temporarily unavailable. You can still book one lesson.</p>}
      <p className="text-xs text-muted-foreground">Multi-lesson choices are fixed prepaid lessons, not a subscription. Times must be chosen before any purchase can be confirmed.</p>
    </section>
  );

  if (phase === 'review') return (
    <section className="space-y-5" aria-label="Multi-lesson review">
      <header className="space-y-1">
        <h2 className="font-serif text-xl font-medium text-foreground">Review your lessons</h2>
        <p className="text-sm text-muted-foreground">
          {BOOKING_SERVICES.find(s => s.id === serviceId)?.name} · {duration} min · {count} lessons
        </p>
      </header>

      {/* 1. What was selected — the actual lesson times, grouped cleanly */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
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
        <p className="text-xs text-muted-foreground">Times shown in {timezone}</p>
      </div>

      {/* 2. Price — total first, then per-lesson, then savings (never inflate the regular price) */}
      {price && (
        <div className="rounded-2xl border border-border bg-surface-subtle p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Price</p>
          <p className="font-serif text-2xl font-bold text-foreground">
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
          className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle"
        >
          Edit times
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!price || selected.length !== count || Boolean(confirming)}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {confirming ? 'Creating plan…' : 'Confirm lesson plan'}
        </button>
      </div>
    </section>
  );

  return <section className="space-y-4" aria-label="Select lesson times">
    <h2 className="font-serif text-xl">Choose your period and actual lesson times</h2>
    <p className="text-sm">{count} lessons · {duration} minutes · times in {timezone}</p>
    {price && <p className="text-sm">Regular total: {money(price.regular, price.currency)} · {price.saving > 0 && <>Save {money(price.saving, price.currency)} · </>}Total: {money(price.total, price.currency)} · {money(price.perLesson, price.currency)} / lesson</p>}
    {loading && <p>Checking live availability…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && <>
      <label htmlFor="lesson-period">Choose your period</label>
      <select id="lesson-period" value={period} onChange={e => { setPeriod(e.target.value); onSelected([]); }} className="block rounded-xl border border-border bg-surface p-3">
        <option value="">Select a month</option>
        {periods.map(month => <option key={month} value={month}>{new Date(`${month}-01T12:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</option>)}
      </select>
      {period && availableDays.length < count && <p role="alert">We found {availableDays.length} available lesson days in this period. Choose fewer lessons or another period.</p>}
      {period && <p aria-live="polite">{selectedInPeriod.length} of {count} lessons selected</p>}
      {availableDays.map(day => <div key={day.dateString} className="rounded-xl border border-border p-3"><h3>{day.dayOfWeek}, {day.monthName} {day.dayOfMonth}</h3><div className="flex flex-wrap gap-2 mt-2">{day.slots.filter(slot => slot.available).map(slot => {
        const chosen = selectedInPeriod.some(item => item.date === day.dateString && item.slot.id === slot.id);
        return <button key={slot.id} type="button" aria-pressed={chosen} className={`rounded-lg border p-2 ${chosen ? 'border-primary bg-primary/10' : 'border-border'}`} onClick={() => {
          const remaining = selectedInPeriod.filter(item => item.date !== day.dateString);
          onSelected(chosen ? remaining : remaining.length < count ? [...remaining, { date: day.dateString, slot }] : selectedInPeriod);
        }}>{slot.timeDisplay}</button>;
      })}</div></div>)}
      {selectedInPeriod.length > 0 && <ol className="list-decimal pl-6">{selectedInPeriod.map(({ date, slot }) => <li key={`${date}-${slot.id}`}>{date} — {slot.timeDisplay}</li>)}</ol>}
      <div className="flex gap-3"><button type="button" onClick={onBack} className="rounded-xl border border-border p-3">Back to lesson count</button><button type="button" disabled={!price || !canReviewLessons(count, availableDays.length, selectedInPeriod)} onClick={onNext} className="rounded-xl bg-primary text-primary-foreground p-3 disabled:opacity-40">Review selected lessons</button></div>
    </>}
  </section>;
};
