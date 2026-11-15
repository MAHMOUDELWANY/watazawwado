/**
 * ====================================================================
 * WATAZAWWADO — DASHBOARD WHATSAPP UTILITIES
 * File: src/dashboard/lib/whatsapp.ts
 * Role: WhatsApp utilities for Dashboard actions & Truthful Contact
 * ====================================================================
 */

import { normalizeWhatsAppDigits } from '../../lib/whatsapp';

export function isValidPhoneNumber(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7;
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
