import type { EngineError, EngineState, Side } from './types';

/**
 * Classroom Task 12: decides when the room has failed on our side, so the server is told and the Zoom button shows.
 * No 'connected' within CONNECT_TIMEOUT_MS of join, the connection failing twice within ICE_WINDOW_MS (counted
 * across rejoins of the same lesson), or an engine error. Reports at most once per join. Framework-free.
 */
export const CONNECT_TIMEOUT_MS = 20_000;
export const ICE_WINDOW_MS = 2 * 60_000;
export type IncidentKind = 'connect_timeout' | 'ice_failed' | 'engine_error';

/**
 * Not failures of the room: a newer device took over, the lesson stopped, the pass ended. connection_failed is the
 * ICE failure itself, counted by the twice-in-2-minutes rule instead.
 */
const NOT_INCIDENTS = new Set(['superseded', 'ended', 'closed', 'unauthorized', 'forbidden', 'connection_failed', 'not_joined']);
const iceHistory = new Map<string, number[]>();
/** The ICE failure times of one lesson in this tab; a rejoin (a new detector) keeps counting from them. */
export const iceHistoryFor = (bookingId: string) => { if (!iceHistory.has(bookingId)) iceHistory.set(bookingId, []); return iceHistory.get(bookingId)!; };

export function createFallbackDetector(o: {
  side: Side | null;
  report: (kind: IncidentKind, detail: Record<string, unknown>) => void;
  history: number[];
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (id: any) => void;
}) {
  const now = o.now ?? Date.now;
  const setTimer = o.setTimer ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const clearTimer = o.clearTimer ?? ((id: any) => clearTimeout(id));
  let timer: unknown = null;
  let done = false;
  const stop = () => { if (timer != null) clearTimer(timer); timer = null; };
  const fire = (kind: IncidentKind, detail: Record<string, unknown>) => {
    // Observers watch only: their network is not the lesson's.
    if (done || !o.side) return;
    done = true;
    stop();
    o.report(kind, detail);
  };
  return {
    /** Call right before engine.join(). */
    start() {
      stop();
      timer = setTimer(() => { timer = null; fire('connect_timeout', { ms: CONNECT_TIMEOUT_MS }); }, CONNECT_TIMEOUT_MS);
    },
    onState(s: EngineState) {
      if (s === 'connected' || s === 'superseded' || s === 'ended' || s === 'left') stop();
      if (s !== 'failed') return;
      const t = now();
      o.history.push(t);
      const recent = o.history.filter((x) => t - x <= ICE_WINDOW_MS);
      o.history.splice(0, o.history.length, ...recent);
      if (recent.length >= 2) fire('ice_failed', { failures: recent.length });
    },
    onError(e: EngineError) {
      if (NOT_INCIDENTS.has(e.code)) return;
      // A track of the other side not there yet is normal (they are still joining); our own track failing is not.
      if (e.trackName && (!o.side || !e.trackName.startsWith(`${o.side}-`))) return;
      fire('engine_error', { code: e.code, ...(e.trackName ? { trackName: e.trackName } : {}) });
    },
    stop,
  };
}
