/**
 * ====================================================================
 * WATAZAWWADO — WHATSAPP UTILITIES
 * File: src/lib/whatsapp.ts
 * Role: Contextual WhatsApp Link Generator (Free, Smart, No Paid API)
 * ====================================================================
 */

export const ACADEMY_PHONE_DISPLAY = '+48 508 157 886';
export const ACADEMY_PHONE_INTL = '+48508157886';
export const ACADEMY_PHONE_DIGITS = '48508157886';

/**
 * Normalizes phone numbers safely for WhatsApp URL target digits.
 */
export function normalizeWhatsAppDigits(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return ACADEMY_PHONE_DIGITS;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) {
    // Egyptian local mobile 01xxxxxxxxx -> 201xxxxxxxxx
    return `20${digits.slice(1)}`;
  }
  if (digits.length >= 7) return digits;
  return ACADEMY_PHONE_DIGITS;
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
    ? `Assalamu alaikum Watazawwado team, I have just booked my Free Trial lesson for ${params.serviceName}.\n` +
      `Booking Ref: ${params.bookingRef}\n` +
      `Date: ${params.date} at ${params.timeDisplay} (${params.timezone})\n` +
      `Learner: ${params.learnerName}`
    : `Assalamu alaikum Watazawwado team, I have just booked a 1-on-1 lesson for ${params.serviceName}.\n` +
      `Booking Ref: ${params.bookingRef}\n` +
      `Date: ${params.date} at ${params.timeDisplay} (${params.timezone})\n` +
      `Learner: ${params.learnerName}`;

  return buildWhatsAppUrl(text);
}
