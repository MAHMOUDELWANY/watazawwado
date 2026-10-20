/**
 * ST-03: booking errors in plain words, in the family's language. The booking repository and the server mostly
 * write English; Arabic users get the Arabic of the known messages, or a plain Arabic sentence with the detail.
 * Presentation only: no rule is decided here.
 */

export const OFFLINE_MESSAGE = "We couldn't reach our server. Please check your internet connection and try again.";

const AR: Array<[RegExp, string]> = [
  [/couldn't reach our server|failed to fetch|network ?error|load failed/i, 'مقدرناش نوصل للموقع. اتأكد من الإنترنت وحاول تاني.'],
  [/valid contact email/i, 'محتاجين إيميل صحيح نتواصل معاك عليه.'],
  [/student.s name/i, 'اكتب اسم الطالب.'],
  [/parent or guardian name/i, 'اكتب اسم ولي الأمر.'],
  [/select an available lesson time|time slot is no longer available|slot is no longer available/i, 'الميعاد ده مبقاش متاح. اختار ميعاد تاني.'],
  [/one free trial|free trial/i, 'الحصة التجريبية المجانية مرة واحدة لكل طالب.'],
  [/verify selected slot|invalid date or time/i, 'في مشكلة في الميعاد اللي اخترته. اختاره تاني من فضلك.'],
  [/terms/i, 'لازم توافق على الشروط الأول.'],
  [/too many requests/i, 'محاولات كتير ورا بعض. استنى دقيقة وحاول تاني.']
];

const GENERIC_EN = 'We could not finish your booking right now. Please try again or message us on WhatsApp.';
const GENERIC_AR = 'تعذر إتمام الحجز دلوقتي. حاول تاني أو كلمنا على واتساب.';
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
