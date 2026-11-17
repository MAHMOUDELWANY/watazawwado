import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pickLayer, classifyLink, blameSide, audioConstraints, opusBitrate, setOpusParams, filterIceServers, STEP_UP_STABLE_MS } from '../src/classroom/engine/quality.js';
import type { LinkStats } from '../src/classroom/engine/types.js';

const clean = (kbps: number, extra: Partial<LinkStats> = {}): LinkStats => ({ outLossPct: 0, inLossPct: 0, availableInKbps: kbps, availableOutKbps: kbps, rttMs: 80, ...extra });

describe('CL-05 adaptive layers and link quality', () => {
  it('10% loss at h steps down to q', () => {
    assert.strictEqual(pickLayer(clean(3000, { inLossPct: 10 }), 'h'), 'q');
  });

  it('3 Mbps clean at q waits 10 s before stepping up, one layer at a time, never above f', () => {
    assert.strictEqual(STEP_UP_STABLE_MS, 10_000);
    assert.strictEqual(pickLayer(clean(3000), 'q'), 'q');
    assert.strictEqual(pickLayer(clean(3000), 'q', 9_999), 'q');
    assert.strictEqual(pickLayer(clean(3000), 'q', 10_000), 'h');
    assert.strictEqual(pickLayer(clean(3000), 'h', 10_000), 'f');
    assert.strictEqual(pickLayer(clean(3000), 'f', 60_000), 'f');
  });

  it('bitrate below a layer need drops to the layer that fits', () => {
    assert.strictEqual(pickLayer(clean(1000), 'f'), 'q');
    assert.strictEqual(pickLayer(clean(1000), 'q', 60_000), 'q');
    assert.strictEqual(pickLayer(clean(200), 'h'), 'l');
  });

  it('0.1 Mbps is audio only', () => {
    assert.strictEqual(pickLayer(clean(100), 'f'), 'audio_only');
    assert.strictEqual(pickLayer(clean(100), 'audio_only', 60_000), 'audio_only');
  });

  it('unknown incoming bitrate (-1) adapts on loss only', () => {
    assert.strictEqual(pickLayer(clean(-1), 'q', 10_000), 'h');
    assert.strictEqual(pickLayer(clean(-1, { inLossPct: 9 }), 'l'), 'audio_only');
  });

  it('classifyLink', () => {
    assert.strictEqual(classifyLink(clean(3000)), 'good');
    assert.strictEqual(classifyLink(clean(3000, { inLossPct: 5 })), 'weak');
    assert.strictEqual(classifyLink(clean(300)), 'weak');
    assert.strictEqual(classifyLink(clean(3000, { outLossPct: 15 })), 'poor');
    assert.strictEqual(classifyLink(clean(100)), 'poor');
    assert.strictEqual(classifyLink(clean(3000, { rttMs: 700 })), 'poor');
  });

  it('blameSide: my outgoing loss 15% and their incoming fine is me', () => {
    assert.strictEqual(blameSide(clean(3000, { outLossPct: 15 }), clean(3000)), 'me');
    assert.strictEqual(blameSide(clean(3000), clean(3000, { outLossPct: 15 })), 'them');
    assert.strictEqual(blameSide(clean(3000), clean(3000)), 'unknown');
    assert.strictEqual(blameSide(clean(3000, { outLossPct: 15 }), null), 'unknown');
  });

  it('audio constraints and Opus bitrate follow recitation mode', () => {
    assert.deepStrictEqual(audioConstraints(false), { echoCancellation: true, autoGainControl: true, noiseSuppression: true });
    assert.deepStrictEqual(audioConstraints(true), { echoCancellation: true, autoGainControl: true, noiseSuppression: false });
    assert.deepStrictEqual([opusBitrate(false), opusBitrate(true)], [64000, 128000]);
  });

  it('setOpusParams rewrites the Opus fmtp: stereo off and always the 128 kbps ceiling', () => {
    const sdp = 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 0\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1;stereo=1;maxaveragebitrate=32000\r\na=rtpmap:0 PCMU/8000\r\n';
    const out = setOpusParams(sdp);
    assert.match(out, /a=fmtp:111 minptime=10;useinbandfec=1;stereo=0;maxaveragebitrate=128000;sprop-stereo=0\r\n/);
    const noFmtp = setOpusParams('m=audio 9 UDP 109\r\na=rtpmap:109 opus/48000/2\r\n');
    assert.match(noFmtp, /a=rtpmap:109 opus\/48000\/2\r\na=fmtp:109 stereo=0;sprop-stereo=0;maxaveragebitrate=128000\r\n/);
  });

  it('filterIceServers drops TURN on port 53', () => {
    const out = filterIceServers([
      { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] },
      { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turn:turn.cloudflare.com:53?transport=udp', 'turns:turn.cloudflare.com:443?transport=tcp'], username: 'u', credential: 'c' },
      { urls: 'turn:turn.cloudflare.com:53' },
    ]);
    assert.deepStrictEqual(out, [
      { urls: ['stun:stun.cloudflare.com:3478'] },
      { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turns:turn.cloudflare.com:443?transport=tcp'], username: 'u', credential: 'c' },
    ]);
  });
});
