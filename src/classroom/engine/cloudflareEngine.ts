import { audioConstraints, filterIceServers, opusBitrate, setOpusParams } from './quality';
import type { EngineError, EngineState, Layer, LinkStats, MediaEngine, RoomRole, Side } from './types';
import { sideOf, trackName } from './types';

/**
 * Cloudflare Realtime SFU engine (Release 1, Task 5). Browser-only and framework-free. Every Cloudflare call goes
 * through our proxy (/api/classroom/:id/rtc/*) with the room ticket; no secret ever reaches the browser.
 * One RTCPeerConnection per join; negotiations run one at a time.
 */

/** Simulcast layers by rid: target height and max bitrate. Scale is computed from the captured height (never < 1). */
const VIDEO_LAYERS = [
  { rid: 'f', height: 1080, maxBitrate: 2_500_000 },
  { rid: 'h', height: 720, maxBitrate: 1_200_000 },
  { rid: 'q', height: 360, maxBitrate: 500_000 },
  { rid: 'l', height: 180, maxBitrate: 150_000 },
] as const;
// The proxy allows 120 rtc calls/min per join; layer changes are throttled well under that.
const UPDATE_MIN_GAP_MS = 2_000;

type TrackResult = { mid?: string; trackName?: string; sessionId?: string; errorCode?: string; errorDescription?: string };
type TracksResponse = { sessionDescription?: RTCSessionDescriptionInit; requiresImmediateRenegotiation?: boolean; tracks?: TrackResult[] };
type Pulled = { mid: string; sessionId: string; trackName: string };

export class RoomEngineError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'RoomEngineError';
  }
}

export function createEngine(opts: { apiBase?: string; fetchImpl?: typeof fetch } = {}): MediaEngine {
  const apiBase = opts.apiBase ?? '';
  const doFetch = opts.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const listeners = { state: new Set<(v: any) => void>(), error: new Set<(v: any) => void>() };

  let pc: RTCPeerConnection | null = null;
  let bookingId = '';
  let ticket = '';
  let side: Side | null = null;
  let sessionId: string | null = null;
  let state: EngineState = 'idle';
  let recitation = false;
  let queue: Promise<unknown> = Promise.resolve();
  let audioSender: RTCRtpSender | null = null;
  let screenTransceivers: RTCRtpTransceiver[] = [];
  const localTracks = new Set<MediaStreamTrack>();
  const pulledVideo: Pulled[] = [];
  let layer: Layer | null = null;
  let lastUpdateAt = 0;
  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  let prevIn = { lost: 0, received: 0 };

  const emit = (event: 'state' | 'error', v: unknown) => listeners[event].forEach((cb) => { try { cb(v); } catch { /* a listener must not break the engine */ } });
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

  /** Offer our new local transceivers, push them to the SFU, apply the answer (with the Opus fmtp set). */
  async function pushLocal(entries: Array<{ transceiver: RTCRtpTransceiver; trackName: string }>) {
    const p = needPc();
    await p.setLocalDescription(await p.createOffer());
    const r: TracksResponse = await rtc('tracks', {
      sessionDescription: { type: 'offer', sdp: p.localDescription!.sdp },
      tracks: entries.map((e) => ({ location: 'local', mid: e.transceiver.mid, trackName: e.trackName })),
    });
    if (!r.sessionDescription?.sdp) throw new RoomEngineError('no_answer', 'The media service sent no answer.');
    await p.setRemoteDescription({ type: 'answer', sdp: setOpusParams(r.sessionDescription.sdp, opusBitrate(recitation)) });
    if (goodTracks(r).length < entries.length) throw new RoomEngineError('track_failed', 'Some of your media could not be sent.');
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
    if (!layer || !pulledVideo.length || isFinal()) return;
    lastUpdateAt = Date.now();
    // shortcut: 'audio_only' asks for the 180p layer and the UI hides the video; Cloudflare has no pause in tracks/update.
    const rid = layer === 'audio_only' ? 'l' : layer;
    const r: TracksResponse = await rtc('update', {
      tracks: pulledVideo.map((t) => ({ location: 'remote', mid: t.mid, sessionId: t.sessionId, trackName: t.trackName, simulcast: { preferredRid: rid } })),
    });
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
          entries.push({ transceiver: tr, trackName: trackName(s, 'audio') });
        }
        if (video) {
          const h = video.getSettings().height || 720;
          const tr = p.addTransceiver(video, {
            direction: 'sendonly',
            sendEncodings: VIDEO_LAYERS.map((l) => ({ rid: l.rid, maxBitrate: l.maxBitrate, scaleResolutionDownBy: Math.max(1, h / l.height) })),
          });
          localTracks.add(video);
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
        await p.setLocalDescription(await p.createOffer());
        const r: TracksResponse = await rtc('close', {
          sessionDescription: { type: 'offer', sdp: p.localDescription!.sdp },
          tracks: list.map((tr) => ({ location: 'local', mid: tr.mid })),
          force: false,
        });
        if (r.sessionDescription?.sdp) await p.setRemoteDescription({ type: 'answer', sdp: setOpusParams(r.sessionDescription.sdp, opusBitrate(recitation)) });
        goodTracks(r);
      });
    },

    subscribe(remote) {
      return serial(async () => {
        const p = needPc();
        const isVideo = (n: string) => n.endsWith('-video');
        const r: TracksResponse = await rtc('tracks', {
          tracks: remote.trackNames.map((n) => ({
            location: 'remote',
            sessionId: remote.sessionId,
            trackName: n,
            ...(isVideo(n) ? { simulcast: { preferredRid: layer && layer !== 'audio_only' ? layer : 'h' } } : {}),
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
          if (t.mid && t.trackName && isVideo(t.trackName)) pulledVideo.push({ mid: t.mid, sessionId: remote.sessionId, trackName: t.trackName });
        }
        if (!out.getTracks().length) throw new RoomEngineError('track_failed', 'The other side is not sending yet.');
        return out;
      });
    },

    async setPreferredLayer(next) {
      if (next === layer) return;
      layer = next;
      if (updateTimer) return; // the pending update sends the latest layer
      const wait = lastUpdateAt + UPDATE_MIN_GAP_MS - Date.now();
      if (wait <= 0) return serial(sendUpdate);
      updateTimer = setTimeout(() => { serial(sendUpdate).catch(() => undefined); }, wait);
    },

    async setRecitationMode(on) {
      recitation = on;
      const track = audioSender?.track;
      if (track) await track.applyConstraints(audioConstraints(on)).catch(() => undefined);
      await applyAudioBitrate();
    },

    async getStats(): Promise<LinkStats> {
      const s: LinkStats = { outLossPct: 0, inLossPct: 0, availableInKbps: -1, availableOutKbps: -1, rttMs: 0 };
      if (!pc) return s;
      const report = await pc.getStats();
      let lost = 0;
      let received = 0;
      report.forEach((r: any) => {
        if (r.type === 'candidate-pair' && r.nominated && r.state === 'succeeded') {
          if (typeof r.currentRoundTripTime === 'number') s.rttMs = Math.round(r.currentRoundTripTime * 1000);
          if (typeof r.availableOutgoingBitrate === 'number') s.availableOutKbps = Math.round(r.availableOutgoingBitrate / 1000);
          if (typeof r.availableIncomingBitrate === 'number') s.availableInKbps = Math.round(r.availableIncomingBitrate / 1000);
        } else if (r.type === 'inbound-rtp') {
          lost += r.packetsLost || 0;
          received += r.packetsReceived || 0;
        } else if (r.type === 'remote-inbound-rtp' && typeof r.fractionLost === 'number') {
          s.outLossPct = Math.max(s.outLossPct, Math.round(r.fractionLost * 1000) / 10);
        }
      });
      // Loss since the previous call, not since the start of the lesson.
      const dLost = Math.max(0, lost - prevIn.lost);
      const dTotal = dLost + Math.max(0, received - prevIn.received);
      prevIn = { lost, received };
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

    on(event: 'state' | 'error', cb: (v: any) => void) {
      listeners[event].add(cb);
      return () => { listeners[event].delete(cb); };
    },
  };
  return engine;
}
