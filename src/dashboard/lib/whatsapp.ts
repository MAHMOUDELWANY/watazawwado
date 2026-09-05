/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — DASHBOARD WHATSAPP UTILITIES
 * File: src/dashboard/lib/whatsapp.ts
 * Role: WhatsApp utilities for Dashboard actions & Truthful Contact
 * ====================================================================
 */

export const MAHMOUD_OFFICIAL_PHONE_DISPLAY = '01552425799';
export const MAHMOUD_OFFICIAL_PHONE_INTL = '+201552425799';
export const MAHMOUD_OFFICIAL_PHONE_DIGITS = '201552425799';

export function isValidPhoneNumber(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7;
}

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

export function buildContextualWhatsAppUrl(
  phone?: string | null,
  messageText?: string
): string | null {
  if (!isValidPhoneNumber(phone)) {
    return null;
  }

  const targetDigits = normalizeWhatsAppDigits(phone);
  const encodedMsg = messageText ? encodeURIComponent(messageText.trim()) : '';

  return `https://wa.me/${targetDigits}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
}
