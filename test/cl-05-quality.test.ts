import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pickLayer, createLayerPicker, layerHeight, simulcastEncodings, classifyLink, blameSide, audioConstraints, opusBitrate, setOpusParams, filterIceServers, STEP_UP_STABLE_MS, TOP_RETRY_MS } from '../src/classroom/engine/quality.js';
import type { LinkStats } from '../src/classroom/engine/types.js';

const clean = (kbps: number, extra: Partial<LinkStats> = {}): LinkStats => ({ outLossPct: 0, inLossPct: 0, availableInKbps: kbps, availableOutKbps: kbps, rttMs: 80, ...extra });

describe('CL-05 adaptive layers and link quality', () => {
  it('a 720p camera sends three distinct layers a/b/c (720/360/180), never two 720p ones', () => {
    assert.deepStrictEqual(simulcastEncodings(720), [
      { rid: 'a', maxBitrate: 1_200_000, scaleResolutionDownBy: 1 },
      { rid: 'b', maxBitrate: 450_000, scaleResolutionDownBy: 2 },
      { rid: 'c', maxBitrate: 150_000, scaleResolutionDownBy: 4 },
    ]);
    assert.deepStrictEqual(simulcastEncodings(undefined), simulcastEncodings(720));
  });

  it('1080p is the top layer only when the camera really gives 1080p, and there are never more than 3 layers', () => {
    const full = simulcastEncodings(1080);
    assert.deepStrictEqual(full.map((e) => [e.rid, e.scaleResolutionDownBy]), [['a', 1], ['b', 1.5], ['c', 3]]);
    assert.strictEqual(full[0].maxBitrate, 2_500_000);
    for (const h of [480, 720, 1080, 1440]) assert.strictEqual(simulcastEncodings(h).length, 3);
    assert.ok(simulcastEncodings(480).every((e) => e.scaleResolutionDownBy! >= 1));
  });

  it('layerHeight maps a received layer to its height', () => {
    assert.deepStrictEqual(['a', 'b', 'c', 'audio_only'].map((l) => layerHeight(l as any)), [720, 360, 180, null]);
    assert.strictEqual(layerHeight('a', 1080), 1080);
    assert.strictEqual(layerHeight('c', 1080), 360);
  });

  it('10% loss at a steps down to b', () => {
    assert.strictEqual(pickLayer(clean(3000, { inLossPct: 10 }), 'a'), 'b');
  });

  it('3 Mbps clean at c waits 10 s before stepping up, one layer at a time, never above a', () => {
    assert.strictEqual(STEP_UP_STABLE_MS, 10_000);
    assert.strictEqual(pickLayer(clean(3000), 'c'), 'c');
    assert.strictEqual(pickLayer(clean(3000), 'c', 9_999), 'c');
    assert.strictEqual(pickLayer(clean(3000), 'c', 10_000), 'b');
    assert.strictEqual(pickLayer(clean(3000), 'b', 10_000), 'a');
    assert.strictEqual(pickLayer(clean(3000), 'a', 60_000), 'a');
  });

  it('bitrate below a layer need drops to the layer that fits', () => {
    assert.strictEqual(pickLayer(clean(1000), 'a'), 'b');
    assert.strictEqual(pickLayer(clean(1000), 'b', 60_000), 'b');
    assert.strictEqual(pickLayer(clean(200), 'a'), 'c');
  });

  it('0.1 Mbps is audio only', () => {
    assert.strictEqual(pickLayer(clean(100), 'a'), 'audio_only');
    assert.strictEqual(pickLayer(clean(100), 'audio_only', 60_000), 'audio_only');
  });

  it('unknown incoming bitrate (-1) adapts on loss, and climbs above b only with the zero-loss guard', () => {
    assert.strictEqual(pickLayer(clean(-1), 'c', 10_000), 'b');
    assert.strictEqual(pickLayer(clean(-1, { inLossPct: 9 }), 'c'), 'audio_only');
    assert.strictEqual(pickLayer(clean(-1), 'b', 60_000), 'b', 'no guard: stays at the middle layer');
    assert.strictEqual(pickLayer(clean(-1), 'b', 10_000, { zeroLossMs: 9_999, fellFromTopRecently: false }), 'b');
    assert.strictEqual(pickLayer(clean(-1), 'b', 10_000, { zeroLossMs: 10_000, fellFromTopRecently: true }), 'b');
    assert.strictEqual(pickLayer(clean(-1), 'b', 10_000, { zeroLossMs: 10_000, fellFromTopRecently: false }), 'a');
  });

  it('createLayerPicker, bitrate unknown: starts at b, needs 10 s of zero loss for a, and waits a minute after falling from a', () => {
    let t = 0;
    const pick = createLayerPicker(undefined, () => t);
    const at = (ms: number, s: LinkStats) => { t = ms; return pick(s); };
    assert.strictEqual(at(0, clean(-1)), 'b');
    assert.strictEqual(at(5_000, clean(-1, { inLossPct: 1 })), 'b', 'small loss: clean but not zero');
    assert.strictEqual(at(14_000, clean(-1)), 'b', 'clean 14 s but zero loss only 0 s');
    assert.strictEqual(at(24_000, clean(-1)), 'a');
    assert.strictEqual(at(26_000, clean(-1, { inLossPct: 12 })), 'b', 'fell from a');
    assert.strictEqual(at(40_000, clean(-1)), 'b');
    assert.strictEqual(at(26_000 + TOP_RETRY_MS - 1, clean(-1)), 'b', 'still inside the retry window');
    assert.strictEqual(at(26_000 + TOP_RETRY_MS, clean(-1)), 'a');
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
