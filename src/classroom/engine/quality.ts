import type { Layer, LinkClass, LinkStats } from './types';

/** Kbps each simulcast layer needs on our 720p capture (a 1080p sender's 'a' needs more; the SFU's asciibetical priority then falls back to 'b'). */
export const LAYER_NEED_KBPS: Record<Exclude<Layer, 'audio_only'>, number> = { a: 1200, b: 450, c: 150 };
const LADDER: Layer[] = ['a', 'b', 'c', 'audio_only'];
export const STEP_DOWN_LOSS_PCT = 8;
export const STEP_UP_STABLE_MS = 10_000;
/** After falling from the top layer, wait this long before climbing back to it blind (bandwidth unknown). */
export const TOP_RETRY_MS = 60_000;

/** Publisher ladder: height and max bitrate, best first. Three layers are sent, never more. */
const RUNGS = [
  { height: 1080, maxBitrate: 2_500_000 },
  { height: 720, maxBitrate: 1_200_000 },
  { height: 360, maxBitrate: 450_000 },
  { height: 180, maxBitrate: 150_000 },
];
const topRung = (captureHeight: number) => (captureHeight >= 1080 ? 0 : 1);

/** Simulcast encodings for a camera of this height: a/b/c, 1080p on top only when the camera really gives 1080p. */
export function simulcastEncodings(captureHeight = 720): RTCRtpEncodingParameters[] {
  const h = captureHeight > 0 ? captureHeight : 720;
  const top = topRung(h);
  return RUNGS.slice(top, top + 3).map((r, i) => ({ rid: 'abc'[i], maxBitrate: r.maxBitrate, scaleResolutionDownBy: Math.max(1, h / r.height) }));
}

/** Height a received layer shows; topHeight is the sender's capture height (720 unless known). */
export function layerHeight(layer: Layer, topHeight = 720): number | null {
  if (layer === 'audio_only') return null;
  const top = topRung(topHeight);
  return RUNGS[top + 'abc'.indexOf(layer)].height;
}

const known = (kbps: number) => kbps >= 0;
/**
 * Chrome's availableIncomingBitrate follows what already flows (it ramps for seconds after a join and plateaus just
 * above the layer being received), so on its own it is no limit. It counts only while the link shows stress.
 */
export const STRESS_LOSS_PCT = 2;
export const STRESS_RTT_MS = 300;
const inKbps = (s: LinkStats) => (s.inLossPct > STRESS_LOSS_PCT || s.rttMs > STRESS_RTT_MS ? s.availableInKbps : -1);
const fits = (layer: Layer, kbps: number) => layer === 'audio_only' || !known(kbps) || kbps >= LAYER_NEED_KBPS[layer];

/** What createLayerPicker knows beyond one reading: how long loss has been exactly 0, and whether we just fell from 'a'. */
export type ClimbGuard = { zeroLossMs: number; fellFromTopRecently: boolean };

/**
 * Receiver-side layer choice. Steps down one layer on loss over 8%, and to the best layer that fits when the
 * incoming bitrate is below the current layer's need while the link shows stress (inKbps). Steps up one layer only after `stableForMs` >= 10 s of a
 * clean link (the caller times stability; see createLayerPicker). When the browser does not report the incoming
 * bitrate (-1, usual in Chrome), it never climbs above the middle layer unless loss has been 0 for 10 s and it did
 * not fall from the top layer in the last minute (`guard`; without one it stays at 'b').
 */
export function pickLayer(raw: LinkStats, current: Layer, stableForMs = 0, guard?: ClimbGuard): Layer {
  const s = { ...raw, availableInKbps: inKbps(raw) };
  const i = LADDER.indexOf(current);
  if (s.inLossPct > STEP_DOWN_LOSS_PCT) {
    const down = Math.min(i + 1, LADDER.length - 1);
    return LADDER.slice(down).find((l) => fits(l, s.availableInKbps))!;
  }
  if (!fits(current, s.availableInKbps)) return LADDER.slice(i).find((l) => fits(l, s.availableInKbps))!;
  const up = LADDER[i - 1];
  if (!up || stableForMs < STEP_UP_STABLE_MS || !fits(up, s.availableInKbps)) return current;
  if (up === 'a' && !known(s.availableInKbps) && (!guard || guard.zeroLossMs < STEP_UP_STABLE_MS || guard.fellFromTopRecently)) return current;
  return up;
}

/** Stateful wrapper: times the clean link and the zero-loss run, and remembers the last fall from 'a'. */
export function createLayerPicker(start: Layer = 'b', now: () => number = Date.now) {
  let layer = start;
  let cleanSince: number | null = null;
  let zeroSince: number | null = null;
  let fellFromTopAt = -Infinity;
  return (s: LinkStats): Layer => {
    const t = now();
    const clean = s.inLossPct <= STEP_DOWN_LOSS_PCT && fits(layer, inKbps(s));
    cleanSince = clean ? cleanSince ?? t : null;
    zeroSince = s.inLossPct === 0 ? zeroSince ?? t : null;
    const next = pickLayer(s, layer, cleanSince == null ? 0 : t - cleanSince, {
      zeroLossMs: zeroSince == null ? 0 : t - zeroSince,
      fellFromTopRecently: t - fellFromTopAt < TOP_RETRY_MS,
    });
    if (next !== layer) {
      cleanSince = null;
      if (layer === 'a') fellFromTopAt = t;
    }
    return (layer = next);
  };
}

/**
 * A starved line can be lossless: the encoder then sends a frame or two a second (live run, scenario 12). Measured frame
 * rates catch it: below POOR_FPS is poor, below WEAK_FPS weak. A camera that is off reports -1, never "starved".
 */
export const POOR_FPS = 5;
export const WEAK_FPS = 10;
const fps = (v: number | undefined) => (v == null ? -1 : v);
const starvedOut = (s: LinkStats) => known(fps(s.outFps)) && fps(s.outFps) < WEAK_FPS;
const starvedIn = (s: LinkStats) => known(fps(s.inFps)) && fps(s.inFps) < WEAK_FPS;
const sendsWell = (s: LinkStats) => fps(s.outFps) >= WEAK_FPS;

/** Our own line. Few frames received is not counted here: that is the sender's line (or ours, per blameSide). */
export function classifyLink(s: LinkStats): LinkClass {
  const loss = Math.max(s.inLossPct, s.outLossPct);
  const kbps = inKbps(s);
  const jitter = fps(s.jitterMs);
  const out = fps(s.outFps);
  if (loss > STEP_DOWN_LOSS_PCT || s.rttMs > 600 || jitter > 150 || (known(out) && out < POOR_FPS) || (known(kbps) && kbps < LAYER_NEED_KBPS.c)) return 'poor';
  if (loss > 3 || s.rttMs > 300 || jitter > 50 || starvedOut(s) || (known(kbps) && kbps < LAYER_NEED_KBPS.b)) return 'weak';
  return 'good';
}

const weakOut = (s: LinkStats) => s.outLossPct > STEP_DOWN_LOSS_PCT || starvedOut(s) || (known(s.availableOutKbps) && s.availableOutKbps < LAYER_NEED_KBPS.b);
// Incoming loss and few frames are caused by the sender's uplink, so "incoming fine" means bandwidth and delay only.
const fineIn = (s: LinkStats) => s.rttMs <= 600 && (!known(s.availableInKbps) || s.availableInKbps >= LAYER_NEED_KBPS.b);

/**
 * Who to tell "your connection is weak": the side whose outgoing link is weak while the other's incoming is fine, or
 * the side that decodes few frames while the other really sends plenty (its download is the starved one).
 */
export function blameSide(local: LinkStats, remoteReport: LinkStats | null): 'me' | 'them' | 'unknown' {
  if (!remoteReport) return 'unknown';
  if (weakOut(local) && fineIn(remoteReport)) return 'me';
  if (weakOut(remoteReport) && fineIn(local)) return 'them';
  if (starvedIn(local) && sendsWell(remoteReport)) return 'me';
  if (starvedIn(remoteReport) && sendsWell(local)) return 'them';
  return 'unknown';
}

export const audioConstraints = (recitationMode: boolean) => ({ echoCancellation: true, autoGainControl: true, noiseSuppression: !recitationMode });
export const opusBitrate = (recitationMode: boolean) => (recitationMode ? 128_000 : 64_000);

/** The fmtp ceiling is negotiated once; the live rate is sender maxBitrate (opusBitrate), so recitation can raise it mid-lesson. */
export const OPUS_FMTP_MAX_BITRATE = 128_000;

/** Sets stereo off and maxaveragebitrate=128000 on the Opus fmtp line of an SDP (adds the line when missing). */
export function setOpusParams(sdp: string): string {
  const pt = /a=rtpmap:(\d+) opus\/48000/i.exec(sdp)?.[1];
  if (!pt) return sdp;
  const want: Array<[string, string]> = [['stereo', '0'], ['sprop-stereo', '0'], ['maxaveragebitrate', String(OPUS_FMTP_MAX_BITRATE)]];
  const fmtp = new RegExp(`^a=fmtp:${pt} ([^\\r\\n]*)`, 'm');
  const m = fmtp.exec(sdp);
  if (!m) {
    return sdp.replace(new RegExp(`(a=rtpmap:${pt} opus/48000[^\\r\\n]*)(\\r?\\n)`, 'i'), `$1$2a=fmtp:${pt} ${want.map((p) => p.join('=')).join(';')}$2`);
  }
  const params = m[1].split(';').filter(Boolean).map((p) => p.split('=') as [string, string]);
  for (const [k, v] of want) {
    const hit = params.find((p) => p[0] === k);
    if (hit) hit[1] = v;
    else params.push([k, v]);
  }
  return sdp.replace(fmtp, `a=fmtp:${pt} ${params.map((p) => p.join('=')).join(';')}`);
}

/** Drops ICE URLs on port 53: browsers time out on them and delay the connection. */
export function filterIceServers(servers: RTCIceServer[]): RTCIceServer[] {
  const ok = (u: string) => !/:53(\?|$)/.test(u);
  return servers.flatMap((s) => {
    if (typeof s.urls === 'string') return ok(s.urls) ? [s] : [];
    const urls = s.urls.filter(ok);
    return urls.length ? [{ ...s, urls }] : [];
  });
}
