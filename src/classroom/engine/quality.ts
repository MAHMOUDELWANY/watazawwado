import type { Layer, LinkClass, LinkStats } from './types';

/** Kbps each simulcast layer needs, best first. */
export const LAYER_NEED_KBPS: Record<Exclude<Layer, 'audio_only'>, number> = { f: 2500, h: 1200, q: 500, l: 150 };
const LADDER: Layer[] = ['f', 'h', 'q', 'l', 'audio_only'];
export const STEP_DOWN_LOSS_PCT = 8;
export const STEP_UP_STABLE_MS = 10_000;

const known = (kbps: number) => kbps >= 0;
const fits = (layer: Layer, kbps: number) => layer === 'audio_only' || !known(kbps) || kbps >= LAYER_NEED_KBPS[layer];

/**
 * Receiver-side layer choice. Steps down one layer on loss over 8%, and to the best layer that fits when the
 * incoming bitrate is below the current layer's need. Steps up one layer only after `stableForMs` >= 10 s of a
 * clean link (the caller times stability; see createLayerPicker).
 */
export function pickLayer(s: LinkStats, current: Layer, stableForMs = 0): Layer {
  const i = LADDER.indexOf(current);
  if (s.inLossPct > STEP_DOWN_LOSS_PCT) {
    const down = Math.min(i + 1, LADDER.length - 1);
    return LADDER.slice(down).find((l) => fits(l, s.availableInKbps))!;
  }
  if (!fits(current, s.availableInKbps)) return LADDER.slice(i).find((l) => fits(l, s.availableInKbps))!;
  const up = LADDER[i - 1];
  if (up && stableForMs >= STEP_UP_STABLE_MS && fits(up, s.availableInKbps)) return up;
  return current;
}

/** Stateful wrapper: times how long the link has been clean before letting pickLayer step up. */
export function createLayerPicker(start: Layer = 'h', now: () => number = Date.now) {
  let layer = start;
  let cleanSince: number | null = null;
  return (s: LinkStats): Layer => {
    const t = now();
    const clean = s.inLossPct <= STEP_DOWN_LOSS_PCT && fits(layer, s.availableInKbps);
    cleanSince = clean ? cleanSince ?? t : null;
    const next = pickLayer(s, layer, cleanSince == null ? 0 : t - cleanSince);
    if (next !== layer) cleanSince = null;
    return (layer = next);
  };
}

export function classifyLink(s: LinkStats): LinkClass {
  const loss = Math.max(s.inLossPct, s.outLossPct);
  if (loss > STEP_DOWN_LOSS_PCT || s.rttMs > 600 || (known(s.availableInKbps) && s.availableInKbps < LAYER_NEED_KBPS.l)) return 'poor';
  if (loss > 3 || s.rttMs > 300 || (known(s.availableInKbps) && s.availableInKbps < LAYER_NEED_KBPS.q)) return 'weak';
  return 'good';
}

const weakOut = (s: LinkStats) => s.outLossPct > STEP_DOWN_LOSS_PCT || (known(s.availableOutKbps) && s.availableOutKbps < LAYER_NEED_KBPS.q);
// Incoming loss is caused by the sender's uplink, so "incoming fine" means bandwidth and delay, not loss.
const fineIn = (s: LinkStats) => s.rttMs <= 600 && (!known(s.availableInKbps) || s.availableInKbps >= LAYER_NEED_KBPS.q);

/** Who to tell "your connection is weak": the side whose outgoing link is weak while the other's incoming is fine. */
export function blameSide(local: LinkStats, remoteReport: LinkStats | null): 'me' | 'them' | 'unknown' {
  if (!remoteReport) return 'unknown';
  if (weakOut(local) && fineIn(remoteReport)) return 'me';
  if (weakOut(remoteReport) && fineIn(local)) return 'them';
  return 'unknown';
}

export const audioConstraints = (recitationMode: boolean) => ({ echoCancellation: true, autoGainControl: true, noiseSuppression: !recitationMode });
export const opusBitrate = (recitationMode: boolean) => (recitationMode ? 128_000 : 64_000);

/** Sets stereo off and maxaveragebitrate on the Opus fmtp line of an SDP (adds the line when missing). */
export function setOpusParams(sdp: string, bitrate: number): string {
  const pt = /a=rtpmap:(\d+) opus\/48000/i.exec(sdp)?.[1];
  if (!pt) return sdp;
  const want: Array<[string, string]> = [['stereo', '0'], ['sprop-stereo', '0'], ['maxaveragebitrate', String(bitrate)]];
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
