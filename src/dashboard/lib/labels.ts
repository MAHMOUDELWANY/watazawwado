import { SERVICES_DATA } from '../../data/content';
import { ALL_TIMEZONES } from '../../lib/countryTimezones';

const ALL_SERVICES = SERVICES_DATA.flatMap((p) => p.services);
const SERVICES = new Map(ALL_SERVICES.map((s) => [s.id, s]));

/** The lesson's subject in the page's language ("Tajweed" was shown on Arabic pages). Finds it by id, or by its English name. */
export function serviceLabel(lesson: { service_id?: string | null; service_name?: string | null }, isAr: boolean): string {
  const s = (lesson.service_id ? SERVICES.get(lesson.service_id) : undefined)
    || (lesson.service_name ? ALL_SERVICES.find((x) => x.name === lesson.service_name) : undefined);
  if (s) return isAr ? s.arabicName : s.name;
  return lesson.service_name || lesson.service_id || '';
}

const LEVELS: Record<string, [string, string]> = {
  beginner: ['Beginner', 'مبتدئ'], elementary: ['Elementary', 'أساسي'],
  intermediate: ['Intermediate', 'متوسط'], advanced: ['Advanced', 'متقدم'],
};

const BOOKING_STATUS: Record<string, [string, string]> = {
  pending: ['waiting for payment', 'مستنية الدفع'], confirmed: ['confirmed', 'مؤكدة'], completed: ['held', 'تمت'],
  cancelled: ['cancelled', 'ملغية'], rescheduled: ['moved', 'اتغير ميعادها'], no_show: ['did not come', 'محضرش'],
};

/** A booking status in words ("rescheduled" was shown raw on Arabic pages). */
export function bookingStatusLabel(status: string | null | undefined, isAr: boolean): string {
  if (!status) return '';
  const s = BOOKING_STATUS[status];
  return s ? s[isAr ? 1 : 0] : status;
}

// Where a lead came from, in words; unknown codes stay as they are.
const LEAD_SOURCES: Record<string, [string, string]> = {
  web_booking_modal: ['Website booking', 'حجز من الموقع'], student_portal: ['Student account', 'حساب الطالب'],
  portal: ['Student account', 'حساب الطالب'], invite: ['Invite link', 'رابط دعوة'], manual: ['Added by hand', 'اتضاف يدوي'],
  trial_followup: ['After the trial', 'بعد التجربة'], quiet_learner: ['Quiet learner', 'طالب غايب'],
  low_balance: ['Low balance', 'رصيد قليل'], client: ['Website', 'الموقع'], api: ['Website', 'الموقع'],
};

export function leadSourceLabel(source: string | null | undefined, isAr: boolean): string {
  if (!source) return '';
  const s = LEAD_SOURCES[source];
  return s ? s[isAr ? 1 : 0] : source;
}

/** A learner's level in the page's language. */
export function levelLabel(level: string | null | undefined, isAr: boolean): string {
  if (!level) return '';
  const l = LEVELS[level.toLowerCase()];
  return l ? l[isAr ? 1 : 0] : level;
}

/** A time zone as a person reads it ("القاهرة", "Warsaw") rather than its IANA id ("Africa/Cairo"). */
export function zoneCity(tz: string | null | undefined, isAr: boolean): string {
  if (!tz) return '';
  const item = ALL_TIMEZONES.find((t) => t.value === tz);
  if (item) return isAr ? item.cityAr : item.city;
  return tz.split('/').pop()!.replace(/_/g, ' ');
}
