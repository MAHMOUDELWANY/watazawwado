import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCloudflareRealtime, CloudflareRealtimeError } from '../server/integrations/cloudflareRealtime';

const env = {
  CLOUDFLARE_REALTIME_APP_ID: 'app1',
  CLOUDFLARE_REALTIME_APP_TOKEN: 'apptok',
  CLOUDFLARE_TURN_KEY_ID: 'key1',
  CLOUDFLARE_TURN_KEY_API_TOKEN: 'turntok',
};

type Call = { url: string; method: string; headers: Record<string, string>; body: any };

function fake(status: number, json: unknown) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit = {}) => {
    calls.push({
      url,
      method: init.method || 'GET',
      headers: init.headers as Record<string, string>,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(JSON.stringify(json), { status });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const BASE = 'https://rtc.live.cloudflare.com/v1';

test('configured is false when any variable is missing', () => {
  assert.equal(createCloudflareRealtime({ env }).configured, true);
  for (const k of Object.keys(env)) {
    const partial = { ...env, [k]: '' };
    assert.equal(createCloudflareRealtime({ env: partial }).configured, false, k);
  }
});

test('session calls use the app URLs and the app token', async () => {
  const { calls, fetchImpl } = fake(201, { sessionId: 's1' });
  const cf = createCloudflareRealtime({ env, fetchImpl });

  assert.deepEqual(await cf.newSession(), { sessionId: 's1' });
  await cf.tracksNew('s1', { sessionDescription: { type: 'offer', sdp: 'x' }, tracks: [{ location: 'local', mid: '0', trackName: 'cam' }] });
  await cf.renegotiate('s1', 'answer-sdp');
  await cf.tracksUpdate('s1', { tracks: [] });
  await cf.tracksClose('s1', { tracks: [{ mid: '0' }], force: true });

  assert.deepEqual(
    calls.map((c) => `${c.method} ${c.url}`),
    [
      `POST ${BASE}/apps/app1/sessions/new`,
      `POST ${BASE}/apps/app1/sessions/s1/tracks/new`,
      `PUT ${BASE}/apps/app1/sessions/s1/renegotiate`,
      `PUT ${BASE}/apps/app1/sessions/s1/tracks/update`,
      `PUT ${BASE}/apps/app1/sessions/s1/tracks/close`,
    ],
  );
  for (const c of calls) assert.equal(c.headers.Authorization, 'Bearer apptok');
  assert.deepEqual(calls[2].body, { sessionDescription: { type: 'answer', sdp: 'answer-sdp' } });
  assert.deepEqual(calls[4].body, { tracks: [{ mid: '0' }], force: true });
});

test('session id is URL-encoded', async () => {
  const { calls, fetchImpl } = fake(200, {});
  await createCloudflareRealtime({ env, fetchImpl }).tracksUpdate('a/b', { tracks: [] });
  assert.equal(calls[0].url, `${BASE}/apps/app1/sessions/a%2Fb/tracks/update`);
});

test('iceServers posts ttl with the TURN token and returns the iceServers array', async () => {
  const servers = [{ urls: ['stun:stun.cloudflare.com:3478'] }, { urls: ['turn:turn.cloudflare.com:3478'], username: 'u', credential: 'c' }];
  const { calls, fetchImpl } = fake(201, { iceServers: servers });
  const cf = createCloudflareRealtime({ env, fetchImpl });

  assert.deepEqual(await cf.iceServers(), servers);
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].url, `${BASE}/turn/keys/key1/credentials/generate-ice-servers`);
  assert.equal(calls[0].headers.Authorization, 'Bearer turntok');
  assert.deepEqual(calls[0].body, { ttl: 10800 });

  await cf.iceServers(600);
  assert.deepEqual(calls[1].body, { ttl: 600 });
});

test('a 500 response throws CloudflareRealtimeError with status and errorCode', async () => {
  const { fetchImpl } = fake(500, { errorCode: 'internal', errorDescription: 'boom' });
  const cf = createCloudflareRealtime({ env, fetchImpl });
  await assert.rejects(cf.newSession(), (e: unknown) => {
    assert.ok(e instanceof CloudflareRealtimeError);
    assert.equal(e.status, 500);
    assert.equal(e.errorCode, 'internal');
    return true;
  });
});

test('a 2xx response with a top-level errorCode also throws', async () => {
  const { fetchImpl } = fake(200, { errorCode: 'bad_sdp', errorDescription: 'nope' });
  const cf = createCloudflareRealtime({ env, fetchImpl });
  await assert.rejects(cf.renegotiate('s1', 'x'), (e: unknown) => {
    assert.ok(e instanceof CloudflareRealtimeError);
    assert.equal(e.status, 200);
    assert.equal(e.errorCode, 'bad_sdp');
    return true;
  });
});

test('calls throw without config and never hit the network', async () => {
  const { calls, fetchImpl } = fake(200, {});
  const cf = createCloudflareRealtime({ env: {}, fetchImpl });
  await assert.rejects(cf.newSession(), CloudflareRealtimeError);
  await assert.rejects(cf.iceServers(), CloudflareRealtimeError);
  assert.equal(calls.length, 0);
});
