/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — SERVER WHATSAPP UTILITIES
 * File: api/notifications/whatsapp.ts
 * Role: Contextual WhatsApp link generator for server notifications
 * ====================================================================
 */

export const MAHMOUD_OFFICIAL_PHONE_DISPLAY = '01552425799';
export const MAHMOUD_OFFICIAL_PHONE_INTL = '+201552425799';
export const MAHMOUD_OFFICIAL_PHONE_DIGITS = '201552425799';

export function normalizeWhatsAppDigits(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return MAHMOUD_OFFICIAL_PHONE_DIGITS;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) {
    return `20${digits.slice(1)}`;
  }
  if (digits.length >= 7) return digits;
  return MAHMOUD_OFFICIAL_PHONE_DIGITS;
}

export function buildWhatsAppUrl(messageText?: string, targetPhone?: string): string {
  const digits = normalizeWhatsAppDigits(targetPhone);
  const encoded = messageText ? encodeURIComponent(messageText.trim()) : '';
  return `https://wa.me/${digits}${encoded ? `?text=${encoded}` : ''}`;
}
