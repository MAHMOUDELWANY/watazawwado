/**
 * Classroom timeline client (Release 1, Task 7). Live events travel on the room channel (useLessonRoom.publishEvent);
 * this file saves the ones the server keeps, in batches every 30 s and on pagehide, and restores the room on rejoin.
 */
import type { RoomEvent } from '../lib/roomEvents';

/** Types the server stores (the rest are live only). The server re-checks the sender's role. */
export const PERSISTED: ReadonlySet<RoomEvent['t']> = new Set(['slide', 'board', 'pdf', 'reaction', 'focus', 'quality', 'layout', 'end']);
export const FLUSH_EVERY_MS = 30_000;
const MAX_BATCH = 50; // the server refuses more in one call
const KEEPALIVE_MAX = 60_000; // browsers cap keepalive bodies at 64 kB

export type RoomSnapshot = {
  slide?: { track: string; number: number; page: number; step: number };
  board?: { sceneVersion: number; elements: unknown[]; learnerDraw: boolean };
  /** Notes on file pages, by `boardSurface(fileId, page)`. */
  boards?: Record<string, { sceneVersion: number; elements: unknown[]; learnerDraw: boolean }>;
  /** The teacher's "learner can draw" (older rooms keep it only on `board`). */
  learnerDraw?: boolean;
  pdf?: { fileId: string; page: number };
  layout?: 'conversation' | 'content' | 'screen';
};

type Item = { at: number; event: RoomEvent };

export function createTimelineBatcher(
  bookingId: string,
  ticket: () => string,
  opts: { fetch?: typeof fetch; everyMs?: number; listen?: boolean } = {},
) {
  const doFetch: typeof fetch = opts.fetch ?? ((input, init) => fetch(input, init));
  let queue: Item[] = [];

  const flush = async (keepalive = false): Promise<void> => {
    if (!queue.length) return;
    let batch = queue.splice(0, MAX_BATCH);
    let body = JSON.stringify({ events: batch });
    // A board can be large; on pagehide send the rest without it (the last 30 s flush already saved a recent board).
    if (keepalive && body.length > KEEPALIVE_MAX) {
      batch = batch.filter((x) => x.event.t !== 'board');
      body = JSON.stringify({ events: batch });
      if (!batch.length) return;
    }
    try {
      const res = await doFetch(`/api/classroom/${bookingId}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-room-ticket': ticket() },
        body,
        keepalive,
      });
      // shortcut: only a server error is retried; a refused pass (401/409) drops the batch, the room screen handles it.
      if (res.status >= 500 && !keepalive) queue = [...batch, ...queue].slice(-MAX_BATCH * 4);
    } catch {
      if (!keepalive) queue = [...batch, ...queue].slice(-MAX_BATCH * 4);
    }
    if (queue.length >= MAX_BATCH) return flush(keepalive);
  };

  const push = (event: RoomEvent) => {
    if (!PERSISTED.has(event.t)) return;
    // Board snapshots are debounced to the flush interval: only the latest one per page waits in the queue.
    if (event.t === 'board') queue = queue.filter((x) => x.event.t !== 'board' || x.event.surface !== event.surface);
    queue.push({ at: Date.now(), event });
    if (queue.length >= MAX_BATCH) void flush();
  };

  const timer = setInterval(() => { void flush(); }, opts.everyMs ?? FLUSH_EVERY_MS);
  const onPageHide = () => { void flush(true); };
  const listen = opts.listen ?? typeof window !== 'undefined';
  if (listen) window.addEventListener('pagehide', onPageHide);

  const stop = () => {
    clearInterval(timer);
    if (listen) window.removeEventListener('pagehide', onPageHide);
    return flush(true);
  };

  return { push, flush, stop };
}

/** Rejoin: the latest slide, board, pdf and layout, and the ms left to the hard close. Null when it cannot be read. */
export async function restoreState(bookingId: string, ticket: string, doFetch: typeof fetch = (input, init) => fetch(input, init)): Promise<{ snapshot: RoomSnapshot; remainingMs: number } | null> {
  try {
    const res = await doFetch(`/api/classroom/${bookingId}/state`, { headers: { 'x-room-ticket': ticket } });
    if (!res.ok) return null;
    const body = await res.json();
    return body && typeof body.snapshot === 'object' && Number.isFinite(body.remainingMs) ? body : null;
  } catch {
    return null;
  }
}
