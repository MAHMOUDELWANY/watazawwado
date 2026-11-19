import { audioConstraints, filterIceServers, opusBitrate, setOpusParams, simulcastEncodings } from './quality';
import type { EngineError, EngineState, Layer, LinkStats, MediaEngine, RoomRole, Side } from './types';
import { sideOf, trackName } from './types';

/**
 * Cloudflare Realtime SFU engine (Release 1, Task 5). Browser-only and framework-free. Every Cloudflare call goes
 * through our proxy (/api/classroom/:id/rtc/*) with the room ticket; no secret ever reaches the browser.
 * One RTCPeerConnection per join; negotiations run one at a time.
 */

/**
 * Pull preferences (Cloudflare OpenAPI 2024-05-21): the preferred rid, falling to the next rid a-z when bandwidth is
 * short or the publisher stops sending it, so a missing layer never freezes the picture.
 */
export const simulcastPull = (layer: Layer | null) => ({
  preferredRid: layer == null ? 'b' : layer === 'audio_only' ? 'c' : layer,
  priorityOrdering: 'asciibetical',
  ridNotAvailable: 'asciibetical',
});
// The proxy allows 120 rtc calls/min per join; layer changes are throttled well under that.
const UPDATE_MIN_GAP_MS = 2_000;
const isVideo = (n: string) => n.endsWith('-video');
/** 'teacher-video' -> 'teacher': which side a pulled track belongs to. */
const sideOfTrack = (n: string) => n.split('-')[0];

type TrackResult = { mid?: string; trackName?: string; sessionId?: string; errorCode?: string; errorDescription?: string };
type TracksResponse = { sessionDescription?: RTCSessionDescriptionInit; requiresImmediateRenegotiation?: boolean; tracks?: TrackResult[] };
type Pulled = { mid: string; sessionId: string; trackName: string };

export class RoomEngineError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'RoomEngineError';
  }
}

/**
 * A camera or mic that ended (unplugged, permission revoked): open the same device again, else the default one.
 * `prev` is the old track's getConstraints(); only a pinned deviceId is dropped for the fallback.
 */
export async function reacquireTrack(
  kind: 'audio' | 'video',
  prev: MediaTrackConstraints = {},
  getUserMedia: (c: MediaStreamConstraints) => Promise<MediaStream> = (c) => navigator.mediaDevices.getUserMedia(c),
): Promise<MediaStreamTrack> {
  const open = async (c: MediaTrackConstraints | true) => {
    const t = (await getUserMedia({ [kind]: c })).getTracks().find((x) => x.kind === kind);
    if (!t) throw new RoomEngineError('no_tracks', `No ${kind} track.`);
    return t;
  };
  try {
    return await open(prev);
  } catch (e) {
    if (prev.deviceId === undefined) throw e;
  }
  const { deviceId: _gone, ...rest } = prev;
  return open(Object.keys(rest).length ? rest : true);
}

export function createEngine(opts: { apiBase?: string; fetchImpl?: typeof fetch } = {}): MediaEngine {
  const apiBase = opts.apiBase ?? '';
  const doFetch = opts.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  type Ev = 'state' | 'error' | 'device' | 'remote-mute';
  const listeners: Record<Ev, Set<(v: any) => void>> = { state: new Set(), error: new Set(), device: new Set(), 'remote-mute': new Set() };

  let pc: RTCPeerConnection | null = null;
  let bookingId = '';
  let ticket = '';
  let side: Side | null = null;
  let sessionId: string | null = null;
  let state: EngineState = 'idle';
  let recitation = false;
  let queue: Promise<unknown> = Promise.resolve();
  let audioSender: RTCRtpSender | null = null;
  let videoSender: RTCRtpSender | null = null;
  let screenTransceivers: RTCRtpTransceiver[] = [];
  const localTracks = new Set<MediaStreamTrack>();
  let pulled: Pulled[] = [];
  let layer: Layer | null = null;
  let lastUpdateAt = 0;
  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  let prevIn = { lost: 0, received: 0 };
  let prevFrames = { decoded: -1, at: 0 };

  const emit = (event: Ev, v: unknown) => listeners[event].forEach((cb) => { try { cb(v); } catch { /* a listener must not break the engine */ } });
  const setState = (s: EngineState) => {
    if (state === s) return;
    state = s;
    emit('state', s);
  };
  const fail = (e: EngineError) => emit('error', e);
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
  };
  const isFinal = () => state === 'superseded' || state === 'ended' || state === 'left';

  function teardown(final: EngineState) {
    if (updateTimer) clearTimeout(updateTimer);
    localTracks.forEach((t) => t.stop());
    localTracks.clear();
    pc?.close();
    pc = null;
    sessionId = null;
    pulled = [];
    audioSender = videoSender = null;
    screenTransceivers = [];
    setState(final);
  }

  async function api(action: string, body: unknown, keepalive = false): Promise<any> {
    if (!bookingId) throw new RoomEngineError('not_joined', 'join() first');
    const res = await doFetch(`${apiBase}/api/classroom/${encodeURIComponent(bookingId)}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-room-ticket': ticket },
      body: JSON.stringify(body ?? {}),
      keepalive,
    });
    const json: any = await res.json().catch(() => ({}));
    if (res.ok) return json;
    const message = typeof json?.error === 'string' ? json.error : `Request failed (${res.status})`;
    let code = `http_${res.status}`;
    if (res.status === 409 && json?.superseded) code = 'superseded';
    else if (json?.ended) code = res.status === 423 ? 'closed' : 'ended';
    else if (res.status === 502 && json?.code) code = String(json.code);
    else if (res.status === 401) code = 'unauthorized';
    else if (res.status === 403) code = 'forbidden';
    // A newer join replaced this one, or the lesson stopped: stop for good and let the UI explain.
    if (code === 'superseded') teardown('superseded');
    else if (code === 'ended' || code === 'closed') teardown('ended');
    fail({ code, message });
    throw new RoomEngineError(code, message);
  }

  const rtc = (action: 'session' | 'tracks' | 'renegotiate' | 'update' | 'close', body: Record<string, unknown> = {}) =>
    api(`rtc/${action}`, action === 'session' ? body : { sessionId, ...body });

  /** Per-track errorCode values come back inside a 200: report each, return only the good ones. */
  function goodTracks(r: TracksResponse): TrackResult[] {
    const out: TrackResult[] = [];
    for (const t of r.tracks ?? []) {
      if (t.errorCode) fail({ code: t.errorCode, message: t.errorDescription || 'A media track could not be set up.', trackName: t.trackName });
      else out.push(t);
    }
    return out;
  }

  const needPc = () => {
    if (!pc || isFinal()) throw new RoomEngineError('not_joined', 'The room is not open.');
    return pc;
  };

  /**
   * Sends our offer with `call` and applies the answer (Opus fmtp set). If the call fails, the offer is rolled back
   * so the connection is stable again; otherwise the next SFU offer (subscribe renegotiation) would throw.
   */
  async function offerTo(p: RTCPeerConnection, call: (offer: { type: 'offer'; sdp: string }) => Promise<TracksResponse>): Promise<TracksResponse> {
    await p.setLocalDescription(await p.createOffer());
    let r: TracksResponse;
    try {
      r = await call({ type: 'offer', sdp: p.localDescription!.sdp });
    } catch (e) {
      if (p.signalingState === 'have-local-offer') await p.setLocalDescription({ type: 'rollback' }).catch(() => undefined);
      throw e;
    }
    if (r.sessionDescription?.sdp) await p.setRemoteDescription({ type: 'answer', sdp: setOpusParams(r.sessionDescription.sdp) });
    return r;
  }

  /** Offer our new local transceivers, push them to the SFU, apply the answer (with the Opus fmtp set). */
  async function pushLocal(entries: Array<{ transceiver: RTCRtpTransceiver; trackName: string }>) {
    const p = needPc();
    const r = await offerTo(p, (sessionDescription) => rtc('tracks', {
      sessionDescription,
      tracks: entries.map((e) => ({ location: 'local', mid: e.transceiver.mid, trackName: e.trackName })),
    }));
    if (!r.sessionDescription?.sdp) throw new RoomEngineError('no_answer', 'The media service sent no answer.');
    if (goodTracks(r).length < entries.length) throw new RoomEngineError('track_failed', 'Some of your media could not be sent.');
  }

  /** Our camera or mic ended on its own (stop() does not fire 'ended'): get it back, same device else default. */
  function watchEnded(kind: 'audio' | 'video', track: MediaStreamTrack) {
    track.addEventListener('ended', () => {
      if (isFinal() || !localTracks.has(track)) return;
      reacquireTrack(kind, track.getConstraints())
        .then((next) => engine.replaceLocalTrack(kind, next).then(
          () => emit('device', { kind, ok: true, track: next }),
          (e) => { next.stop(); throw e; },
        ))
        .catch(() => emit('device', { kind, ok: false }));
    }, { once: true });
  }

  /** Tells the UI when a pulled track waits for media ("waiting for video...") and when it flows again. */
  function watchRemote(track: MediaStreamTrack, name: string) {
    const s = sideOfTrack(name) as Side;
    const kind = name.slice(s.length + 1);
    const tell = (muted: boolean) => emit('remote-mute', { side: s, kind, muted });
    track.addEventListener('mute', () => tell(true));
    track.addEventListener('unmute', () => tell(false));
    if (track.muted) tell(true);
  }

  async function applyAudioBitrate() {
    if (!audioSender) return;
    const params = audioSender.getParameters();
    if (!params.encodings?.length) params.encodings = [{}];
    params.encodings[0].maxBitrate = opusBitrate(recitation);
    await audioSender.setParameters(params).catch(() => undefined);
  }

  const mySide = () => {
    if (!side) throw new RoomEngineError('forbidden', 'Observers can only watch.');
    return side;
  };

  async function sendUpdate() {
    updateTimer = null;
    const pulledVideo = pulled.filter((t) => isVideo(t.trackName));
    if (!layer || !pulledVideo.length || isFinal()) return;
    lastUpdateAt = Date.now();
    // shortcut: 'audio_only' keeps the lowest rid ('c') and the UI hides the video. tracks/update has no pause, and closing
    // the pull would end the track the UI holds and cost a renegotiation per flip; revisit if 180p still costs too much.
    const r: TracksResponse = await rtc('update', {
      tracks: pulledVideo.map((t) => ({ location: 'remote', mid: t.mid, sessionId: t.sessionId, trackName: t.trackName, simulcast: simulcastPull(layer) })),
    });
    goodTracks(r);
  }

  /** Close the pulled tracks of one remote session (unserialized: callers hold the queue). */
  async function closePulled(remoteSessionId: string) {
    const p = needPc();
    const gone = pulled.filter((t) => t.sessionId === remoteSessionId);
    if (!gone.length) return;
    pulled = pulled.filter((t) => t.sessionId !== remoteSessionId);
    for (const t of gone) {
      const tr = p.getTransceivers().find((x) => x.mid === t.mid);
      tr?.receiver.track.stop();
      tr?.stop();
    }
    // Only mids: the old session may already be gone from the room, and observers may not name 'local'.
    const r = await offerTo(p, (sessionDescription) => rtc('close', { sessionDescription, tracks: gone.map((t) => ({ mid: t.mid })), force: false }));
    goodTracks(r);
  }

  const engine: MediaEngine = {
    get sessionId() { return sessionId; },
    get state() { return state; },

    async join(o) {
      if (pc) throw new RoomEngineError('already_joined', 'Already in the room.');
      bookingId = o.bookingId;
      ticket = o.ticket;
      side = sideOf(o.role as RoomRole);
      setState('connecting');
      const p = new RTCPeerConnection({ iceServers: filterIceServers(o.iceServers), bundlePolicy: 'max-bundle' });
      pc = p;
      p.addEventListener('connectionstatechange', () => {
        if (pc !== p || isFinal()) return;
        if (p.connectionState === 'connected') setState('connected');
        else if (p.connectionState === 'disconnected') setState('reconnecting');
        else if (p.connectionState === 'failed') {
          setState('failed');
          fail({ code: 'connection_failed', message: 'The connection to the room was lost.' });
        }
      });
      try {
        sessionId = (await rtc('session')).sessionId;
      } catch (e) {
        if (!isFinal()) teardown('failed');
        throw e;
      }
    },

    publishCamera(stream) {
      return serial(async () => {
        const p = needPc();
        const s = mySide();
        const entries: Array<{ transceiver: RTCRtpTransceiver; trackName: string }> = [];
        const audio = stream.getAudioTracks()[0];
        const video = stream.getVideoTracks()[0];
        if (audio) {
          await audio.applyConstraints(audioConstraints(recitation)).catch(() => undefined);
          const tr = p.addTransceiver(audio, { direction: 'sendonly' });
          audioSender = tr.sender;
          localTracks.add(audio);
          watchEnded('audio', audio);
          entries.push({ transceiver: tr, trackName: trackName(s, 'audio') });
        }
        if (video) {
          const tr = p.addTransceiver(video, { direction: 'sendonly', sendEncodings: simulcastEncodings(video.getSettings().height) });
          videoSender = tr.sender;
          localTracks.add(video);
          watchEnded('video', video);
          entries.push({ transceiver: tr, trackName: trackName(s, 'video') });
        }
        if (!entries.length) throw new RoomEngineError('no_tracks', 'No camera or microphone track.');
        await pushLocal(entries);
        await applyAudioBitrate();
      });
    },

    publishScreen(stream) {
      return serial(async () => {
        const p = needPc();
        const s = mySide();
        if (screenTransceivers.length) throw new RoomEngineError('already_sharing', 'The screen is already shared.');
        const video = stream.getVideoTracks()[0];
        if (!video) throw new RoomEngineError('no_tracks', 'No screen track.');
        video.contentHint = 'detail';
        const tr = p.addTransceiver(video, { direction: 'sendonly' });
        localTracks.add(video);
        screenTransceivers = [tr];
        // Tab audio, when the browser gives it, travels with the screen under its own name.
        const entries = [{ transceiver: tr, trackName: trackName(s, 'screen') }];
        const audio = stream.getAudioTracks()[0];
        if (audio) {
          const ta = p.addTransceiver(audio, { direction: 'sendonly' });
          localTracks.add(audio);
          screenTransceivers.push(ta);
          entries.push({ transceiver: ta, trackName: `${trackName(s, 'screen')}-audio` });
        }
        await pushLocal(entries);
      });
    },

    stopScreen() {
      return serial(async () => {
        const p = needPc();
        if (!screenTransceivers.length) return;
        const list = screenTransceivers;
        screenTransceivers = [];
        for (const tr of list) {
          if (tr.sender.track) {
            tr.sender.track.stop();
            localTracks.delete(tr.sender.track);
          }
          tr.stop();
        }
        const r = await offerTo(p, (sessionDescription) => rtc('close', { sessionDescription, tracks: list.map((tr) => ({ location: 'local', mid: tr.mid })), force: false }));
        goodTracks(r);
      });
    },

    subscribe(remote) {
      return serial(async () => {
        const p = needPc();
        // The other side may have rejoined with a new session. Its old one is closed only after this pull worked, so a
        // pull of a stale or wrong id never drops the picture that is still playing.
        const sides = new Set(remote.trackNames.map(sideOfTrack));
        const stale = new Set(pulled.filter((t) => t.sessionId !== remote.sessionId && sides.has(sideOfTrack(t.trackName))).map((t) => t.sessionId));
        const r: TracksResponse = await rtc('tracks', {
          tracks: remote.trackNames.map((n) => ({
            location: 'remote',
            sessionId: remote.sessionId,
            trackName: n,
            ...(isVideo(n) ? { simulcast: simulcastPull(layer) } : {}),
          })),
        });
        const ok = goodTracks(r);
        if (r.requiresImmediateRenegotiation && r.sessionDescription?.sdp) {
          await p.setRemoteDescription({ type: 'offer', sdp: r.sessionDescription.sdp });
          await p.setLocalDescription(await p.createAnswer());
          await rtc('renegotiate', { sdp: p.localDescription!.sdp });
        }
        const out = new MediaStream();
        for (const t of ok) {
          const tr = p.getTransceivers().find((x) => x.mid === t.mid);
          if (!tr) continue;
          out.addTrack(tr.receiver.track);
          if (t.mid && t.trackName) {
            pulled.push({ mid: t.mid, sessionId: remote.sessionId, trackName: t.trackName });
            watchRemote(tr.receiver.track, t.trackName);
          }
        }
        if (!out.getTracks().length) throw new RoomEngineError('track_failed', 'The other side is not sending yet.');
        // The old session is usually gone already: a failed close is reported as an error and must not lose the new pull.
        for (const id of stale) await closePulled(id).catch(() => undefined);
        return out;
      });
    },

    unsubscribe(remoteSessionId) {
      return serial(() => closePulled(remoteSessionId));
    },

    async setPreferredLayer(next) {
      if (next === layer) return;
      layer = next;
      if (updateTimer) return; // the pending update sends the latest layer
      const wait = lastUpdateAt + UPDATE_MIN_GAP_MS - Date.now();
      if (wait <= 0) return serial(sendUpdate);
      updateTimer = setTimeout(() => { serial(sendUpdate).catch(() => undefined); }, wait);
    },

    replaceLocalTrack(kind, track) {
      return serial(async () => {
        needPc();
        const sender = kind === 'audio' ? audioSender : videoSender;
        if (!sender) throw new RoomEngineError('not_publishing', `No ${kind} is being sent.`);
        if (kind === 'audio') await track.applyConstraints(audioConstraints(recitation)).catch(() => undefined);
        const old = sender.track;
        // Same kind on the same sender: no renegotiation; the simulcast scales set at publish time stay.
        await sender.replaceTrack(track);
        if (old && old !== track) {
          localTracks.delete(old);
          old.stop();
        }
        localTracks.add(track);
        watchEnded(kind, track);
      });
    },

    async setRecitationMode(on) {
      recitation = on;
      const track = audioSender?.track;
      if (track) await track.applyConstraints(audioConstraints(on)).catch(() => undefined);
      await applyAudioBitrate();
    },

    async getStats(): Promise<LinkStats> {
      const s = { outLossPct: 0, inLossPct: 0, availableInKbps: -1, availableOutKbps: -1, rttMs: 0, outFps: -1, inFps: -1, jitterMs: -1 } satisfies LinkStats;
      if (!pc) return s;
      const report = await pc.getStats();
      let lost = 0;
      let received = 0;
      let decoded = -1;
      // A camera that is off sends black frames slowly: no frame rate then, so it is never read as a starved line.
      const cameraOn = videoSender?.track?.enabled === true && videoSender.track.readyState === 'live';
      report.forEach((r: any) => {
        if (r.type === 'candidate-pair' && r.nominated && r.state === 'succeeded') {
          if (typeof r.currentRoundTripTime === 'number') s.rttMs = Math.round(r.currentRoundTripTime * 1000);
          if (typeof r.availableOutgoingBitrate === 'number') s.availableOutKbps = Math.round(r.availableOutgoingBitrate / 1000);
          if (typeof r.availableIncomingBitrate === 'number') s.availableInKbps = Math.round(r.availableIncomingBitrate / 1000);
        } else if (r.type === 'inbound-rtp') {
          lost += r.packetsLost || 0;
          received += r.packetsReceived || 0;
          if (r.kind === 'video' && typeof r.framesDecoded === 'number') {
            decoded = Math.max(decoded, r.framesDecoded);
            if (typeof r.jitter === 'number') s.jitterMs = Math.max(s.jitterMs, Math.round(r.jitter * 1000));
          }
        } else if (r.type === 'outbound-rtp' && r.kind === 'video' && cameraOn && (r.framesSent || 0) > 30 && typeof r.framesPerSecond === 'number') {
          // Simulcast: the best layer's rate; past the first second, so a fresh join does not read as starved.
          s.outFps = Math.max(s.outFps, r.framesPerSecond);
        } else if (r.type === 'remote-inbound-rtp' && typeof r.fractionLost === 'number') {
          s.outLossPct = Math.max(s.outLossPct, Math.round(r.fractionLost * 1000) / 10);
        }
      });
      // Loss since the previous call, not since the start of the lesson.
      const dLost = Math.max(0, lost - prevIn.lost);
      const dTotal = dLost + Math.max(0, received - prevIn.received);
      prevIn = { lost, received };
      // Video frames decoded a second since the previous call.
      const at = Date.now();
      if (decoded >= 0 && prevFrames.decoded >= 0 && decoded >= prevFrames.decoded && at > prevFrames.at) {
        s.inFps = Math.round(((decoded - prevFrames.decoded) * 1000) / (at - prevFrames.at));
      }
      prevFrames = { decoded, at };
      s.inLossPct = dTotal ? Math.round((dLost / dTotal) * 1000) / 10 : 0;
      return s;
    },

    async leave() {
      if (state === 'left') return;
      // A replaced join leaves silently (the newer device is still in the room); an ended room still logs room_left.
      const wasActive = state !== 'superseded' && !!bookingId;
      teardown('left');
      // keepalive lets this finish during pagehide; sendBeacon cannot carry the ticket header.
      if (wasActive) await api('leave', {}, true).catch(() => undefined);
    },

    on(event: Ev, cb: (v: any) => void) {
      listeners[event].add(cb);
      return () => { listeners[event].delete(cb); };
    },
  };
  return engine;
}
