import { SERVICES_DATA } from '../../data/content';
import { ALL_TIMEZONES } from '../../lib/countryTimezones';

const SERVICES = new Map(SERVICES_DATA.flatMap((p) => p.services).map((s) => [s.id, s]));

/** The lesson's subject in the page's language ("Tajweed" was shown on Arabic pages). */
export function serviceLabel(lesson: { service_id?: string | null; service_name?: string | null }, isAr: boolean): string {
  const s = lesson.service_id ? SERVICES.get(lesson.service_id) : undefined;
  if (s) return isAr ? s.arabicName : s.name;
  return lesson.service_name || '';
}

/** A time zone as a person reads it ("القاهرة", "Warsaw") rather than its IANA id ("Africa/Cairo"). */
export function zoneCity(tz: string | null | undefined, isAr: boolean): string {
  if (!tz) return '';
  const item = ALL_TIMEZONES.find((t) => t.value === tz);
  if (item) return isAr ? item.cityAr : item.city;
  return tz.split('/').pop()!.replace(/_/g, ' ');
}
