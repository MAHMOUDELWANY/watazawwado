/**
 * PR-04: the Islamic season a celebration's wording adapts to (Umm al-Qura calendar, in the learner's time zone).
 * Ramadan = month 9; Eid al-Fitr = 1–3 Shawwal; the first nine days of Dhul Hijjah; Eid al-Adha = 10–13 Dhul Hijjah.
 */
export type IslamicSeason = 'ramadan' | 'dhul-hijjah' | 'eid-fitr' | 'eid-adha' | 'normal';

export function hijriMonthDay(date: Date, timeZone = 'UTC'): { month: number; day: number } | null {
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', timeZone: tz }).formatToParts(date);
  try {
    let parts;
    try { parts = fmt(timeZone); } catch { parts = fmt('UTC'); }
    const month = Number(parts.find((p) => p.type === 'month')?.value);
    const day = Number(parts.find((p) => p.type === 'day')?.value);
    return Number.isInteger(month) && Number.isInteger(day) ? { month, day } : null;
  } catch {
    return null;
  }
}

export function islamicSeasonFor(date: Date = new Date(), timeZone = 'UTC'): IslamicSeason {
  const h = hijriMonthDay(date, timeZone);
  if (!h) return 'normal';
  if (h.month === 9) return 'ramadan';
  if (h.month === 10 && h.day <= 3) return 'eid-fitr';
  if (h.month === 12 && h.day <= 9) return 'dhul-hijjah';
  if (h.month === 12 && h.day <= 13) return 'eid-adha';
  return 'normal';
}
