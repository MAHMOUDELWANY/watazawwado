import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createEngine, reacquireTrack, simulcastPull } from '../src/classroom/engine/cloudflareEngine.js';

// Minimal WebRTC fakes: enough for the engine's offer/answer bookkeeping, no media.
const log: string[] = [];
class FakeTrack extends EventTarget {
  stopped = false;
  muted = false;
  constructor(public kind: string, public constraints: MediaTrackConstraints = {}) { super(); }
  stop() { this.stopped = true; }
  getSettings() { return { height: 720 }; }
  getConstraints() { return this.constraints; }
  async applyConstraints() {}
}
class FakePC extends EventTarget {
  transceivers: any[] = [];
  signalingState = 'stable';
  localDescription: any = null;
  connectionState = 'new';
  addTransceiver(track: any, init?: any) {
    const t: any = { mid: `l${this.transceivers.length}`, init, stop() {}, receiver: { track: new FakeTrack('video') } };
    t.sender = { track, replaceTrack: async (x: any) => { log.push('replaceTrack'); t.sender.track = x; }, getParameters: () => ({ encodings: [{}] }), setParameters: async () => {} };
    this.transceivers.push(t);
    return t;
  }
  getTransceivers() { return this.transceivers; }
  async createOffer() { return { type: 'offer', sdp: 'offer' }; }
  async createAnswer() { return { type: 'answer', sdp: 'answer' }; }
  async setLocalDescription(d: any) {
    log.push(`local:${d.type}`);
    this.signalingState = d.type === 'offer' ? 'have-local-offer' : 'stable';
    this.localDescription = d;
  }
  async setRemoteDescription(d: any) {
    log.push(`remote:${d.type}`);
    if (d.type === 'offer') {
      // The fake SFU offer is the JSON list of mids it adds.
      for (const mid of JSON.parse(d.sdp)) this.transceivers.push({ mid, stop() {}, receiver: { track: new FakeTrack('video') }, sender: {} });
      this.signalingState = 'have-remote-offer';
    } else this.signalingState = 'stable';
  }
  close() { this.signalingState = 'closed'; }
}
(globalThis as any).RTCPeerConnection = FakePC;
(globalThis as any).MediaStream = class { t: any[] = []; addTrack(x: any) { this.t.push(x); } getTracks() { return this.t; } };

type Handler = (body: any) => { status?: number; body: any };
let handlers: Record<string, Handler>;
const calls: Array<{ action: string; body: any }> = [];
const fetchImpl = (async (url: string, init: any) => {
  const action = url.split('/rtc/')[1] ?? url.split('/').pop()!;
  const body = JSON.parse(init.body);
  calls.push({ action, body });
  log.push(`rtc:${action}`);
  const h: Handler = handlers[action] ?? (() => ({ body: {} }));
  const r = h(body);
  const status = r.status ?? 200;
  return { ok: status < 400, status, json: async () => r.body } as any;
}) as typeof fetch;

const pullOk = (sessionId: string, mid: string): Handler => (b) => b.sessionDescription
  ? { body: { sessionDescription: { type: 'answer', sdp: 'a' }, tracks: b.tracks.map((t: any) => ({ mid: t.mid })) } }
  : { body: { requiresImmediateRenegotiation: true, sessionDescription: { type: 'offer', sdp: JSON.stringify([mid]) }, tracks: [{ mid, trackName: 'teacher-video', sessionId }] } };

async function joined() {
  const e = createEngine({ fetchImpl });
  await e.join({ bookingId: 'b1', ticket: 't', iceServers: [], role: 'learner' });
  return e;
}

beforeEach(() => {
  log.length = 0;
  calls.length = 0;
  handlers = { session: () => ({ body: { sessionId: 'me' } }), close: (b) => ({ body: { sessionDescription: { type: 'answer', sdp: 'a' }, tracks: b.tracks } }) };
});

describe('CL-16 media engine', () => {
  it('pulls video with asciibetical simulcast, middle layer first; audio_only keeps the lowest rid', async () => {
    assert.deepStrictEqual(simulcastPull(null), { preferredRid: 'b', priorityOrdering: 'asciibetical', ridNotAvailable: 'asciibetical' });
    assert.strictEqual(simulcastPull('audio_only').preferredRid, 'c');
    const e = await joined();
    handlers.tracks = pullOk('S1', 'r1');
    await e.subscribe({ sessionId: 'S1', trackNames: ['teacher-video'] });
    assert.deepStrictEqual(calls.find((c) => c.action === 'tracks')!.body.tracks[0].simulcast, simulcastPull(null));
    await e.setPreferredLayer('audio_only');
    const upd = calls.find((c) => c.action === 'update')!;
    assert.deepStrictEqual(upd.body.tracks[0].simulcast, simulcastPull('audio_only'));
  });

  it('a failing pull of a new session keeps the old one; a working pull closes the old one after it', async () => {
    const e = await joined();
    handlers.tracks = pullOk('S1', 'r1');
    await e.subscribe({ sessionId: 'S1', trackNames: ['teacher-video'] });
    handlers.tracks = () => ({ status: 502, body: { error: 'gone', code: 'session_error' } });
    await assert.rejects(e.subscribe({ sessionId: 'STALE', trackNames: ['teacher-video'] }));
    assert.ok(!calls.some((c) => c.action === 'close'), 'nothing closed');
    calls.length = 0;
    handlers.tracks = pullOk('S2', 'r2');
    await e.subscribe({ sessionId: 'S2', trackNames: ['teacher-video'] });
    assert.deepStrictEqual(calls.map((c) => c.action), ['tracks', 'renegotiate', 'close']);
    assert.deepStrictEqual(calls[2].body.tracks, [{ mid: 'r1' }]);
  });

  it('a failed close rolls the local offer back so later SFU offers still apply', async () => {
    const e = await joined();
    handlers.tracks = pullOk('S1', 'r1');
    await e.subscribe({ sessionId: 'S1', trackNames: ['teacher-video'] });
    handlers.close = () => ({ status: 500, body: {} });
    log.length = 0;
    await assert.rejects(e.unsubscribe('S1'));
    assert.deepStrictEqual(log.filter((l) => l.startsWith('local:')), ['local:offer', 'local:rollback']);
    handlers.tracks = pullOk('S2', 'r2');
    await e.subscribe({ sessionId: 'S2', trackNames: ['teacher-video'] });
  });

  it("emits 'remote-mute' when a pulled track waits for media and when it flows again", async () => {
    const e = await joined();
    const seen: any[] = [];
    e.on('remote-mute', (v) => seen.push(v));
    handlers.tracks = pullOk('S1', 'r1');
    const s = await e.subscribe({ sessionId: 'S1', trackNames: ['teacher-video'] });
    const track = s.getTracks()[0] as unknown as FakeTrack;
    track.dispatchEvent(new Event('mute'));
    track.dispatchEvent(new Event('unmute'));
    assert.deepStrictEqual(seen, [{ side: 'teacher', kind: 'video', muted: true }, { side: 'teacher', kind: 'video', muted: false }]);
  });

  it('replaceLocalTrack swaps the sender track without any rtc call; an ended camera with no device left emits device ok=false', async () => {
    const e = createEngine({ fetchImpl });
    await e.join({ bookingId: 'b1', ticket: 't', iceServers: [], role: 'teacher' });
    handlers.tracks = (b) => ({ body: { sessionDescription: { type: 'answer', sdp: 'a' }, tracks: b.tracks.map((t: any) => ({ mid: t.mid, trackName: t.trackName })) } });
    const cam = new FakeTrack('video');
    await e.publishCamera({ getAudioTracks: () => [], getVideoTracks: () => [cam] } as any);
    assert.strictEqual(calls.at(-1)!.body.tracks.length, 1);
    calls.length = 0;
    const next = new FakeTrack('video');
    await e.replaceLocalTrack('video', next as any);
    assert.strictEqual(calls.length, 0);
    assert.ok(cam.stopped);
    const events: any[] = [];
    e.on('device', (v) => events.push(v));
    next.dispatchEvent(new Event('ended')); // node has no navigator.mediaDevices: reacquire fails
    await new Promise((r) => setTimeout(r, 10));
    assert.deepStrictEqual(events, [{ kind: 'video', ok: false }]);
  });

  it('sessionId is cleared on leave', async () => {
    const e = await joined();
    assert.strictEqual(e.sessionId, 'me');
    await e.leave();
    assert.strictEqual(e.sessionId, null);
  });
});

describe('CL-16 reacquireTrack', () => {
  it('reopens the same device, else falls back to the default one', async () => {
    const asked: unknown[] = [];
    const gum = async (c: MediaStreamConstraints) => {
      asked.push(c);
      if ((c.video as any)?.deviceId) throw Object.assign(new Error('gone'), { name: 'OverconstrainedError' });
      return { getTracks: () => [new FakeTrack('video')] } as any;
    };
    const t = await reacquireTrack('video', { deviceId: { exact: 'cam-1' }, height: 720 }, gum);
    assert.strictEqual(t.kind, 'video');
    assert.deepStrictEqual(asked, [{ video: { deviceId: { exact: 'cam-1' }, height: 720 } }, { video: { height: 720 } }]);
    asked.length = 0;
    await reacquireTrack('audio', { deviceId: { exact: 'mic' } }, async (c) => { (asked as unknown[]).push(c); if ((c.audio as any)?.deviceId) throw new Error('x'); return { getTracks: () => [new FakeTrack('audio')] } as any; });
    assert.deepStrictEqual(asked[1], { audio: true });
  });

  it('with no pinned device a failure is final', async () => {
    await assert.rejects(reacquireTrack('audio', {}, async () => { throw new Error('denied'); }));
  });
});
