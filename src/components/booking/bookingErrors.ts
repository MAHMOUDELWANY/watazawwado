/**
 * ST-03: booking errors in plain words, in the family's language. The booking repository and the server mostly
 * write English; Arabic users get the Arabic of the known messages, or a plain Arabic sentence with the detail.
 * Presentation only: no rule is decided here.
 */

export const OFFLINE_MESSAGE = "We couldn't reach our server. Please check your internet connection and try again.";

const AR: Array<[RegExp, string]> = [
  [/couldn't reach our server|failed to fetch|network ?error|load failed/i, 'تعذّر الوصول إلى الموقع. تأكد من الإنترنت وحاول مرة أخرى.'],
  [/valid contact email/i, 'نحتاج إلى بريد صحيح نتواصل معك عليه.'],
  [/student.s name/i, 'اكتب اسم الطالب.'],
  [/parent or guardian name/i, 'اكتب اسم ولي الأمر.'],
  [/which child this lesson is for/i, 'اختر الطفل اللي الحصة دي له.'],
  [/already has a lesson at that time/i, 'الطالب عنده حصة تانية في نفس الوقت ده. اختر موعدًا آخر.'],
  [/select an available lesson time|no longer available|no longer in the teacher|outside the teacher|just been booked|just taken/i, 'هذا الموعد لم يعد متاحًا. اختر موعدًا آخر.'],
  // Specific trial messages first: the general one below used to swallow all of them.
  [/last free trial was cancelled or missed/i, 'آخر حصة تجريبية اتلغت أو فاتت، فتقدر تحجز تجربة جديدة بعد ٤٨ ساعة من إلغائها. الحصص العادية متاحة في أي وقت.'],
  [/family account can have up to/i, 'حساب الأسرة له ٥ حصص تجريبية بحد أقصى. تقدر تحجز حصة عادية في أي وقت، أو كلّمنا لو محتاج تجربة زيادة.'],
  [/used up its free trials/i, 'الحساب ده استخدم كل الحصص التجريبية المتاحة. تقدر تحجز حصة عادية في أي وقت.'],
  [/one free trial|free trial/i, 'الحصة التجريبية المجانية مرة واحدة لكل طالب.'],
  [/verify selected slot|invalid date or time/i, 'هناك مشكلة في الموعد الذي اخترته. اختره مرة أخرى من فضلك.'],
  [/terms/i, 'لازم توافق على الشروط الأول.'],
  [/too many requests/i, 'محاولات كثيرة متتالية. انتظر دقيقة وحاول مرة أخرى.']
];

const GENERIC_EN = 'We could not finish your booking right now. Please try again or message us on WhatsApp.';
const GENERIC_AR = 'تعذّر إتمام الحجز الآن. حاول مرة أخرى أو راسلنا على واتساب.';
const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

export function bookingErrorText(message: string | null | undefined, isEn: boolean): string {
  const msg = String(message || '').trim();
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (isOffline || /failed to fetch|network ?error|load failed/i.test(msg)) {
    return isEn ? OFFLINE_MESSAGE : AR[0][1];
  }
  if (!msg) return isEn ? GENERIC_EN : GENERIC_AR;
  if (isEn || hasArabic(msg)) return msg;
  const known = AR.find(([re]) => re.test(msg));
  // Unknown English detail: a plain Arabic sentence, with the detail kept for support.
  return known ? known[1] : `${GENERIC_AR} (${msg})`;
}
