import crypto from 'node:crypto';
import { hijriMonthDay } from '../src/lib/islamicSeason.js';

/**
 * NX-06: gift lessons, seasonal (owner 2026-11-01: "خليها موسمية").
 * A family buys a normal package marked as a gift (metadata.gift); it gets a code. Nobody can book with it until the
 * code is redeemed; redeeming moves the package to the receiver (purchaser and learner). Buying is open only in the
 * gift seasons below; redeeming works any time.
 */
export type GiftSeason = 'ramadan' | 'eid-fitr' | 'dhul-hijjah';

/** Two weeks before Ramadan to the 3rd of Shawwal (Eid al-Fitr), and 1-13 Dhul Hijjah (Eid al-Adha). */
export function giftSeason(date: Date = new Date()): GiftSeason | null {
  const h = hijriMonthDay(date, 'UTC');
  if (!h) return null;
  if ((h.month === 8 && h.day >= 15) || h.month === 9) return 'ramadan';
  if (h.month === 10 && h.day <= 3) return 'eid-fitr';
  if (h.month === 12 && h.day <= 13) return 'dhul-hijjah';
  return null;
}

/** Local testing only: GIFT_SEASON_PREVIEW=on opens the season outside production. */
export function currentGiftSeason(env: Record<string, string | undefined> = process.env, date = new Date()): GiftSeason | null {
  const preview = env.GIFT_SEASON_PREVIEW === 'on' && env.VERCEL_ENV !== 'production' && env.NODE_ENV !== 'production';
  return giftSeason(date) || (preview ? 'ramadan' : null);
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I

/** e.g. WZ-7KQ4-M9TP: easy to read aloud and type on a phone. */
export function makeGiftCode(): string {
  const pick = () => ALPHABET[crypto.randomInt(ALPHABET.length)];
  const part = () => Array.from({ length: 4 }, pick).join('');
  return `WZ-${part()}-${part()}`;
}

export function normalizeGiftCode(raw: unknown): string | null {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = s.startsWith('WZ') ? s.slice(2) : s;
  if (body.length !== 8 || [...body].some((c) => !ALPHABET.includes(c))) return null;
  return `WZ-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** A gift package is usable only after its code was redeemed. */
export const giftLocked = (metadata: any) => Boolean(metadata?.gift) && !metadata.gift.redeemed_at;

export function cleanGiftText(raw: unknown, max: number): string | null {
  const s = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
  return s ? s.slice(0, max) : null;
}
