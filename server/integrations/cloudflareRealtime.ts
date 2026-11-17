// Cloudflare Realtime SFU + TURN over HTTPS. Secrets stay on the server.
// Schema: https://developers.cloudflare.com/realtime/static/realtime-api-2024-05-21.yaml

const BASE = 'https://rtc.live.cloudflare.com/v1';
const DEFAULT_TURN_TTL_SEC = 3 * 60 * 60;

export type SessionDescription = { type: 'offer' | 'answer'; sdp: string };

export type TrackObject = {
  location: 'local' | 'remote';
  mid?: string;
  sessionId?: string;
  trackName?: string;
  bidirectionalMediaStream?: boolean;
  kind?: string;
  simulcast?: {
    preferredRid?: string;
    priorityOrdering?: 'none' | 'asciibetical';
    ridNotAvailable?: 'none' | 'asciibetical';
  };
};

export type TracksNewBody = {
  sessionDescription?: SessionDescription;
  autoDiscover?: boolean;
  tracks: TrackObject[];
};

export class CloudflareRealtimeError extends Error {
  constructor(public status: number, public errorCode: string | null, message: string) {
    super(message);
    this.name = 'CloudflareRealtimeError';
  }
}

export function createCloudflareRealtime(opts: { fetchImpl?: typeof fetch; env?: NodeJS.ProcessEnv } = {}) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const env = opts.env ?? process.env;
  const appId = env.CLOUDFLARE_REALTIME_APP_ID || '';
  const appToken = env.CLOUDFLARE_REALTIME_APP_TOKEN || '';
  const turnKeyId = env.CLOUDFLARE_TURN_KEY_ID || '';
  const turnToken = env.CLOUDFLARE_TURN_KEY_API_TOKEN || '';
  const configured = Boolean(appId && appToken && turnKeyId && turnToken);

  async function call(method: 'POST' | 'PUT', path: string, token: string, body?: unknown): Promise<any> {
    if (!configured) throw new CloudflareRealtimeError(0, 'not_configured', 'Cloudflare Realtime is not configured');
    const res = await fetchImpl(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json: any = await res.json().catch(() => null);
    // A 2xx can still carry a top-level errorCode (per the OpenAPI schema).
    if (!res.ok || json?.errorCode) {
      const code = typeof json?.errorCode === 'string' ? json.errorCode : null;
      throw new CloudflareRealtimeError(res.status, code, `Cloudflare Realtime ${method} ${path.replace(appId, '{app}')} failed: ${res.status} ${json?.errorDescription ?? ''}`.trim());
    }
    return json;
  }

  const session = (id: string) => `/apps/${encodeURIComponent(appId)}/sessions/${encodeURIComponent(id)}`;

  return {
    configured,
    async newSession(): Promise<{ sessionId: string }> {
      const json = await call('POST', `/apps/${encodeURIComponent(appId)}/sessions/new`, appToken);
      return { sessionId: json.sessionId };
    },
    tracksNew: (sessionId: string, body: TracksNewBody) => call('POST', `${session(sessionId)}/tracks/new`, appToken, body),
    renegotiate: (sessionId: string, sdp: string) =>
      call('PUT', `${session(sessionId)}/renegotiate`, appToken, { sessionDescription: { type: 'answer', sdp } }),
    tracksUpdate: (sessionId: string, body: unknown) => call('PUT', `${session(sessionId)}/tracks/update`, appToken, body),
    tracksClose: (sessionId: string, body: unknown) => call('PUT', `${session(sessionId)}/tracks/close`, appToken, body),
    async iceServers(ttlSec: number = DEFAULT_TURN_TTL_SEC): Promise<RTCIceServer[]> {
      const json = await call('POST', `/turn/keys/${encodeURIComponent(turnKeyId)}/credentials/generate-ice-servers`, turnToken, { ttl: ttlSec });
      return json.iceServers;
    },
  };
}
