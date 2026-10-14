/**
 * Signed hand-off of the AI's final profile + assessment from /api/intake/turn to
 * /api/intake/complete, so the browser can carry the result but cannot edit it.
 */

import { createHmac, timingSafeEqual } from 'crypto';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(`intake-assessment:${body}`).digest('base64url');
}

export function createIntakeToken(authUserId: string, profile: unknown, assessment: unknown, secret: string, now = Date.now()): string {
  if (!secret) throw new Error('Intake signing secret is not configured.');
  const body = Buffer.from(JSON.stringify({ u: authUserId, p: profile, a: assessment, t: now })).toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

/** Returns the signed profile + assessment, or null if the token is forged, edited, expired or someone else's. */
export function readIntakeToken(token: unknown, authUserId: string, secret: string, now = Date.now()): { profile: unknown; assessment: unknown } | null {
  if (typeof token !== 'string' || !secret) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body, secret));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (data?.u !== authUserId || typeof data.t !== 'number' || now - data.t > MAX_AGE_MS) return null;
    return { profile: data.p, assessment: data.a };
  } catch {
    return null;
  }
}
