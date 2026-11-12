import { DateTime } from 'luxon';

/**
 * A lesson's date and time as people say them, in the page's language (P4-010, P4-021): "Monday 16 November",
 * "الاثنين ١٦ نوفمبر", "5:00 pm", "٥:٠٠ م". Falls back to the raw text when it cannot be read.
 */
const locale = (isAr: boolean) => (isAr ? 'ar-EG' : 'en-GB');

/** `YYYY-MM-DD` → weekday, day and month. */
export function humanDate(date: string, isAr: boolean): string {
  const d = DateTime.fromISO(date);
  return d.isValid ? d.setLocale(locale(isAr)).toFormat('cccc d LLLL') : date;
}

/** "05:00 PM" or "17:00" → the clock time in the page's language. */
export function humanTime(time: string, isAr: boolean): string {
  const raw = (time || '').trim();
  const t = ['hh:mm a', 'h:mm a', 'HH:mm'].map((f) => DateTime.fromFormat(raw, f, { locale: 'en-US' })).find((x) => x.isValid);
  return t ? t.setLocale(locale(isAr)).toLocaleString(DateTime.TIME_SIMPLE) : raw;
}
