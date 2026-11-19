/**
 * Classroom media engine contract (Release 1, Task 5). Framework-free on purpose, so a native app can port it.
 * Mirrors server/classroom/access.ts RoomRole (kept separate: the browser bundle must not import server code).
 */
export type RoomRole = 'teacher' | 'learner' | 'guardian_observer' | 'admin_observer';
export type Side = 'teacher' | 'student';
/**
 * Simulcast rids, best first: Cloudflare's 'asciibetical' priority treats 'a' as most wanted. With our 720p capture
 * a = 720p, b = 360p, c = 180p; a camera that really gives 1080p sends a = 1080p, b = 720p, c = 360p (see quality.ts).
 */
export type Layer = 'a' | 'b' | 'c' | 'audio_only';
/**
 * Kbps fields are -1 when the browser does not report them. outFps: frames a second our camera really sends (-1 when
 * the camera is off or not sending yet); inFps: video frames a second we decode; jitterMs: incoming video jitter.
 * The last three are optional (older clients do not send them) and -1 when unknown.
 */
export type LinkStats = {
  outLossPct: number; inLossPct: number; availableInKbps: number; availableOutKbps: number; rttMs: number;
  outFps?: number; inFps?: number; jitterMs?: number;
};
export type LinkClass = 'good' | 'weak' | 'poor';

export type EngineState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'superseded' | 'ended' | 'left';
/** code: 'superseded' | 'ended' | 'closed' (423) | 'unauthorized' | 'forbidden' | 'http_<status>' | 'track_failed' | a Cloudflare errorCode. */
export type EngineError = { code: string; message: string; trackName?: string };
/** A local camera or mic ended (unplugged, permission revoked): ok = the engine got a new one and sends it (track). */
export type DeviceEvent = { kind: 'audio' | 'video'; ok: boolean; track?: MediaStreamTrack };
/** A pulled track stopped or started getting media; kind is the track name after the side ('video', 'audio', 'screen', ...). */
export type RemoteMuteEvent = { side: Side; kind: string; muted: boolean };

export interface MediaEngine {
  join(opts: { bookingId: string; ticket: string; iceServers: RTCIceServer[]; role: RoomRole }): Promise<void>;
  publishCamera(stream: MediaStream): Promise<void>;
  publishScreen(stream: MediaStream): Promise<void>;
  stopScreen(): Promise<void>;
  /** A new sessionId of the same side is pulled first; that side's old session is closed only after the pull worked. */
  subscribe(remote: { sessionId: string; trackNames: string[] }): Promise<MediaStream>;
  /** Closes and stops every track pulled from that remote session. */
  unsubscribe(remoteSessionId: string): Promise<void>;
  /** 'audio_only' keeps pulling the lowest rid ('c'): Cloudflare's tracks/update has no pause (see sendUpdate). */
  setPreferredLayer(layer: Layer): Promise<void>;
  /** Swap the camera or mic being sent without renegotiating (sender.replaceTrack). The old track is stopped. */
  replaceLocalTrack(kind: 'audio' | 'video', track: MediaStreamTrack): Promise<void>;
  setRecitationMode(on: boolean): Promise<void>;
  getStats(): Promise<LinkStats>;
  leave(): Promise<void>;
  /** This join's Cloudflare session id (share it on the live channel so the other side can subscribe). */
  readonly sessionId: string | null;
  readonly state: EngineState;
  on(event: 'state', cb: (v: EngineState) => void): () => void;
  on(event: 'error', cb: (v: EngineError) => void): () => void;
  on(event: 'device', cb: (v: DeviceEvent) => void): () => void;
  on(event: 'remote-mute', cb: (v: RemoteMuteEvent) => void): () => void;
}

export const trackName = (side: Side, kind: 'audio' | 'video' | 'screen') => `${side}-${kind}`;
export const sideOf = (role: RoomRole): Side | null => (role === 'teacher' ? 'teacher' : role === 'learner' ? 'student' : null);
