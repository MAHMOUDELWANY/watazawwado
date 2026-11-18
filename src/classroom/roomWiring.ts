import { layerHeight } from './engine/quality';
import type { Layer } from './engine/types';

/** Small pure pieces of the room page's wiring (review 2026-11-18), kept here so they can be tested without React. */

/** H2: a failed subscribe is tried again after 1 s, 2 s, 4 s, ... never more than 15 s apart. */
export const SUBSCRIBE_RETRY_MAX_MS = 15_000;
export const subscribeRetryMs = (attempt: number) => Math.min(1000 * 2 ** Math.max(0, attempt), SUBSCRIBE_RETRY_MAX_MS);

/** M5: server clock minus device clock, taking the request's midpoint as the moment the server answered. */
export const clockOffsetMs = (serverNow: number, sentAt: number, receivedAt: number) => Math.round(serverNow - (sentAt + receivedAt) / 2);

/** M6: why the server says the room is over for this pass. */
export const END_REASONS = ['cancelled', 'moved', 'reassigned', 'closed', 'ended'] as const;
export type EndReason = (typeof END_REASONS)[number];

export type RoomCheck =
  | { kind: 'open'; serverNow: number | null }
  | { kind: 'over'; reason: EndReason }
  | { kind: 'superseded' }
  | { kind: 'unknown' };

/** Reads any classroom answer (/state, /quality, /connected, /end) for "the room is over" or "a newer device took the seat". */
export function readRoomAnswer(status: number, body: any): RoomCheck {
  if (status === 409 && body?.superseded) return { kind: 'superseded' };
  if (status >= 400 && body?.ended) return { kind: 'over', reason: (END_REASONS as readonly string[]).includes(body.reason) ? body.reason : 'closed' };
  // The pass's expiry is the hard close: an expired pass means the room closed.
  if (status === 401) return { kind: 'over', reason: 'closed' };
  if (status >= 200 && status < 300) return { kind: 'open', serverNow: Number.isFinite(body?.serverNow) ? body.serverNow : null };
  return { kind: 'unknown' };
}

export type QualityTotals = { degradedSeconds: number; audioOnlySeconds: number; reconnects: number; minHeight: number | null };

/**
 * M4: with my uplink to blame, the damage shows in the layer the OTHER side receives of me (their quality report),
 * so that layer is what lands on my record. Unknown (no report yet): nothing is added.
 */
export function addQualityStep(q: QualityTotals, layer: Layer | null, stepSeconds: number): void {
  if (!layer) return;
  if (layer === 'audio_only') q.audioOnlySeconds += stepSeconds;
  if (layer !== 'a') q.degradedSeconds += stepSeconds;
  const h = layerHeight(layer);
  if (h != null) q.minHeight = q.minHeight == null ? h : Math.min(q.minHeight, h);
}
