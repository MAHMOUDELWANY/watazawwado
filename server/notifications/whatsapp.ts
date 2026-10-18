/**
 * ====================================================================
 * WATAZAWWADO — SERVER WHATSAPP UTILITIES
 * File: server/notifications/whatsapp.ts
 * Role: Contextual WhatsApp link generator for server notifications
 * ====================================================================
 */

export const ACADEMY_PHONE_DISPLAY = '+48 508 157 886';
export const ACADEMY_PHONE_INTL = '+48508157886';
export const ACADEMY_PHONE_DIGITS = '48508157886';

export function normalizeWhatsAppDigits(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return ACADEMY_PHONE_DIGITS;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) {
    return `20${digits.slice(1)}`;
  }
  if (digits.length >= 7) return digits;
  return ACADEMY_PHONE_DIGITS;
}

export function buildWhatsAppUrl(messageText?: string, targetPhone?: string): string {
  const digits = normalizeWhatsAppDigits(targetPhone);
  const encoded = messageText ? encodeURIComponent(messageText.trim()) : '';
  return `https://wa.me/${digits}${encoded ? `?text=${encoded}` : ''}`;
}
