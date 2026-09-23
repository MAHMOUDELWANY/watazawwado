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
}

export const MultiLessonPlan: React.FC<Props> = ({ catalog, serviceId, duration, timezone, teacherId, count, onCount, selected, onSelected, phase, onNext, onBack }) => {
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
    <section className="space-y-4" aria-label="Multi-lesson review">
      <h2 className="font-serif text-xl">Review your lesson plan</h2>
      <p>{BOOKING_SERVICES.find(s => s.id === serviceId)?.name} · {duration} minutes · {count} lessons</p>
      <p>These are the actual times you selected ({timezone}); they are not reserved or confirmed yet.</p>
      <ol className="list-decimal pl-6">{selected.map(({ date, slot }) => <li key={`${date}-${slot.id}`}>{date} — {slot.timeDisplay}</li>)}</ol>
      {price && <div className="rounded-xl border border-border p-4 space-y-1"><p>Regular total: {money(price.regular, price.currency)}</p>{price.saving > 0 && <p>You save: {money(price.saving, price.currency)}</p>}<p className="font-bold">Final catalog total: {money(price.total, price.currency)}</p><p>{money(price.perLesson, price.currency)} / lesson</p></div>}
      <p className="rounded-xl bg-amber-500/10 p-4 text-sm">Multi-lesson confirmation is not yet available. The booking service currently confirms one lesson at a time and cannot reserve these times or attach one prepaid entitlement to all of them. No payment has been taken and no lessons have been booked.</p>
      <button type="button" onClick={onBack} className="rounded-xl border border-border p-3">Edit selected times</button>
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
