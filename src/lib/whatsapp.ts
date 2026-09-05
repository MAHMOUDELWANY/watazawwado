/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — WHATSAPP UTILITIES
 * File: src/lib/whatsapp.ts
 * Role: Contextual WhatsApp Link Generator (Free, Smart, No Paid API)
 * ====================================================================
 */

export const MAHMOUD_OFFICIAL_PHONE_DISPLAY = '01552425799';
export const MAHMOUD_OFFICIAL_PHONE_INTL = '+201552425799';
export const MAHMOUD_OFFICIAL_PHONE_DIGITS = '201552425799';

/**
 * Normalizes phone numbers safely for WhatsApp URL target digits.
 */
export function normalizeWhatsAppDigits(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return MAHMOUD_OFFICIAL_PHONE_DIGITS;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) {
    // Egyptian local mobile 01xxxxxxxxx -> 201xxxxxxxxx
    return `20${digits.slice(1)}`;
  }
  if (digits.length >= 7) return digits;
  return MAHMOUD_OFFICIAL_PHONE_DIGITS;
}

/**
 * Builds a direct, safe WhatsApp link with optional pre-filled text.
 * Never constructs generic untargeted URLs.
 */
export function buildWhatsAppUrl(messageText?: string, targetPhone?: string): string {
  const digits = normalizeWhatsAppDigits(targetPhone);
  const encoded = messageText ? encodeURIComponent(messageText.trim()) : '';
  return `https://wa.me/${digits}${encoded ? `?text=${encoded}` : ''}`;
}

/**
 * Contextual WhatsApp link after booking (Trial or Regular Lesson).
 */
export function buildBookingWhatsAppUrl(params: {
  bookingRef: string;
  serviceName: string;
  date: string;
  timeDisplay: string;
  timezone: string;
  isTrial: boolean;
  learnerName: string;
}): string {
  const text = params.isTrial
    ? `Assalamu Alaikum Ustadh Mahmoud, I have just booked my Free Trial lesson for ${params.serviceName}.\n` +
      `Booking Ref: ${params.bookingRef}\n` +
      `Date: ${params.date} at ${params.timeDisplay} (${params.timezone})\n` +
      `Learner: ${params.learnerName}`
    : `Assalamu Alaikum Ustadh Mahmoud, I have just booked a 1-on-1 lesson for ${params.serviceName}.\n` +
      `Booking Ref: ${params.bookingRef}\n` +
      `Date: ${params.date} at ${params.timeDisplay} (${params.timezone})\n` +
      `Learner: ${params.learnerName}`;

  return buildWhatsAppUrl(text);
}

/**
 * Contextual WhatsApp link for payment inquiry or verification.
 */
export function buildPaymentWhatsAppUrl(params: {
  bookingRef?: string;
  serviceName?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
}): string {
  const details = [
    params.bookingRef ? `Booking Ref: ${params.bookingRef}` : null,
    params.serviceName ? `Service: ${params.serviceName}` : null,
    params.amount && params.currency ? `Amount: ${params.amount} ${params.currency}` : null,
    params.paymentMethod ? `Method: ${params.paymentMethod}` : null
  ].filter(Boolean).join('\n');

  const text = `Assalamu Alaikum Ustadh Mahmoud, I have a question regarding lesson payment.\n${details ? `\n${details}` : ''}`;
  return buildWhatsAppUrl(text);
}

/**
 * Contextual WhatsApp link for rescheduling / cancellation inquiries.
 */
export function buildRescheduleWhatsAppUrl(params: {
  bookingRef: string;
  serviceName: string;
  date?: string;
  timeDisplay?: string;
}): string {
  const text = `Assalamu Alaikum Ustadh Mahmoud, I would like to inquire about rescheduling/managing my lesson.\n` +
    `Booking Ref: ${params.bookingRef}\n` +
    `Service: ${params.serviceName}` +
    (params.date && params.timeDisplay ? `\nScheduled For: ${params.date} at ${params.timeDisplay}` : '');

  return buildWhatsAppUrl(text);
}

/**
 * General inquiry WhatsApp link.
 */
export function buildGeneralInquiryWhatsAppUrl(topic?: string): string {
  const text = topic
    ? `Assalamu Alaikum Ustadh Mahmoud, I would like to ask about ${topic}.`
    : `Assalamu Alaikum Ustadh Mahmoud, I would like to ask about your personalized 1-on-1 lessons.`;
  return buildWhatsAppUrl(text);
}
