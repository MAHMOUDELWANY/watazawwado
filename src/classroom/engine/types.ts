/**
 * Classroom media engine contract (Release 1, Task 5). Framework-free on purpose, so a native app can port it.
 * Mirrors server/classroom/access.ts RoomRole (kept separate: the browser bundle must not import server code).
 */
export type RoomRole = 'teacher' | 'learner' | 'guardian_observer' | 'admin_observer';
export type Side = 'teacher' | 'student';
/** Simulcast rids: f = 1080p cap, h = 720p, q = 360p, l = 180p. */
export type Layer = 'f' | 'h' | 'q' | 'l' | 'audio_only';
/** Kbps fields are -1 when the browser does not report them. */
export type LinkStats = { outLossPct: number; inLossPct: number; availableInKbps: number; availableOutKbps: number; rttMs: number };
export type LinkClass = 'good' | 'weak' | 'poor';

export type EngineState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'superseded' | 'ended' | 'left';
/** code: 'superseded' | 'ended' | 'closed' (423) | 'unauthorized' | 'forbidden' | 'http_<status>' | 'track_failed' | a Cloudflare errorCode. */
export type EngineError = { code: string; message: string; trackName?: string };

export interface MediaEngine {
  join(opts: { bookingId: string; ticket: string; iceServers: RTCIceServer[]; role: RoomRole }): Promise<void>;
  publishCamera(stream: MediaStream): Promise<void>;
  publishScreen(stream: MediaStream): Promise<void>;
  stopScreen(): Promise<void>;
  /** Subscribing to a new sessionId of the same side first unsubscribes that side's old session. */
  subscribe(remote: { sessionId: string; trackNames: string[] }): Promise<MediaStream>;
  /** Closes and stops every track pulled from that remote session. */
  unsubscribe(remoteSessionId: string): Promise<void>;
  setPreferredLayer(layer: Layer): Promise<void>;
  setRecitationMode(on: boolean): Promise<void>;
  getStats(): Promise<LinkStats>;
  leave(): Promise<void>;
  /** This join's Cloudflare session id (share it on the live channel so the other side can subscribe). */
  readonly sessionId: string | null;
  readonly state: EngineState;
  on(event: 'state', cb: (v: EngineState) => void): () => void;
  on(event: 'error', cb: (v: EngineError) => void): () => void;
}

export const trackName = (side: Side, kind: 'audio' | 'video' | 'screen') => `${side}-${kind}`;
export const sideOf = (role: RoomRole): Side | null => (role === 'teacher' ? 'teacher' : role === 'learner' ? 'student' : null);
