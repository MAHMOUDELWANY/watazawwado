import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import express from 'express';
import { signTicket } from '../server/classroom/access.js';
import { registerClassroomRoutes, cleanPrecheckDetail, NETTEST_MAX_KB } from '../server/routes/classroom.js';
import { classifyNetwork, detectBrowser, deviceState, permissionSteps } from '../src/classroom/deviceCheck.js';

const UA = {
  chromeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  edgeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  firefoxMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:132.0) Gecko/20100101 Firefox/132.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  chromeIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.81 Mobile Safari/537.36',
};
const en = (e: string) => e;
const ar = (_e: string, a: string) => a;

describe('CL-23 waiting room: browser and device help', () => {
  it('tells the browsers apart, phone or desktop', () => {
    assert.deepStrictEqual(detectBrowser(UA.chromeWin), { browser: 'chrome', mobile: false, ios: false });
    assert.strictEqual(detectBrowser(UA.edgeWin).browser, 'edge');
    assert.strictEqual(detectBrowser(UA.firefoxMac).browser, 'firefox');
    assert.deepStrictEqual(detectBrowser(UA.safariMac), { browser: 'safari', mobile: false, ios: false });
    assert.deepStrictEqual(detectBrowser(UA.safariIphone), { browser: 'safari', mobile: true, ios: true });
    assert.deepStrictEqual(detectBrowser(UA.chromeIphone), { browser: 'chrome', mobile: true, ios: true });
    assert.deepStrictEqual(detectBrowser(UA.chromeAndroid), { browser: 'chrome', mobile: true, ios: false });
  });

  it('reads getUserMedia errors per device', () => {
    assert.strictEqual(deviceState({ name: 'NotAllowedError' }), 'denied');
    assert.strictEqual(deviceState({ name: 'SecurityError' }), 'denied');
    assert.strictEqual(deviceState({ name: 'NotFoundError' }), 'missing');
    assert.strictEqual(deviceState({ name: 'NotReadableError' }), 'error');
    assert.strictEqual(deviceState(null), 'error');
  });

  it('gives each browser its own steps, in both languages, always ending with a way back', () => {
    const steps = (ua: string, t = en) => permissionSteps(detectBrowser(ua), t).join(' | ');
    assert.match(steps(UA.safariIphone), /aA/);
    assert.match(steps(UA.chromeIphone), /Settings app on your phone and find Chrome/);
    assert.match(steps(UA.chromeAndroid), /Permissions/);
    assert.match(steps(UA.firefoxMac), /Blocked/);
    assert.match(steps(UA.edgeWin), /Permissions for this site/);
    assert.match(steps(UA.safariMac), /Settings for This Website/);
    assert.match(steps(UA.chromeWin), /lock or two sliders/);
    for (const ua of Object.values(UA)) {
      assert.match(steps(ua), /Try again/);
      assert.match(steps(ua, ar), /[؀-ۿ]/);
    }
  });

  it('judges the network: good, fair, poor, unknown', () => {
    assert.strictEqual(classifyNetwork(60, 8000), 'good');
    assert.strictEqual(classifyNetwork(220, 3000), 'fair');
    assert.strictEqual(classifyNetwork(500, 8000), 'poor');
    assert.strictEqual(classifyNetwork(80, 400), 'poor');
    assert.strictEqual(classifyNetwork(80, null), 'fair');
    assert.strictEqual(classifyNetwork(null, null), 'unknown');
  });
});

describe('CL-23 precheck detail and network test', () => {
  const NOW = Date.parse('2026-11-20T09:55:00Z');
  const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
  const SECRET = 'room-secret';
  const tables: Record<string, any[]> = { bookings: [{ id: BOOKING_ID, teacher_id: 'u-1', student_id: 'child-1', status: 'confirmed' }], lesson_quality: [] };
  const db = {
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        maybeSingle: async () => ({ data: (tables[t] ||= []).find((r) => filters.every((f) => f(r))) ?? null, error: null }),
        upsert: async (row: any) => {
          const i = tables[t].findIndex((r) => r.booking_id === row.booking_id && r.side === row.side);
          if (i < 0) tables[t].push({ ...row }); else Object.assign(tables[t][i], row);
          return { error: null };
        },
      };
      return b;
    },
  };
  let server: http.Server;
  let base: string;
  const pass = (_q: any, _s: any, next: any) => next();
  before(async () => {
    const app = express();
    app.use(express.json());
    registerClassroomRoutes(app, {
      getClient: () => db, classroomEnabled: () => true, cloudflare: () => null,
      verifyTeacherAuth: pass, verifyStudentAuth: pass, getLearners: async () => [],
      rateLimit: pass, roomRateLimit: pass, requireSuperAdmin: pass, secret: () => SECRET, now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });
  const ticket = signTicket({ bookingId: BOOKING_ID, role: 'learner', userId: 'parent-1', exp: NOW + 60_000, joinId: 'j', studentId: 'child-1' }, SECRET);
  const precheck = (body: unknown) => fetch(`${base}/api/classroom/${BOOKING_ID}/precheck`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': ticket }, body: JSON.stringify(body) });

  it('stores the device and network results with the 720p check, dropping unknown keys', async () => {
    const detail = { camera: 'denied', mic: 'ok', speakerTested: true, latencyMs: 84, downKbps: 5200, relay: 'ok', network: 'good', browser: 'safari', mobile: true, extra: 'x' };
    assert.strictEqual((await precheck({ precheck720: false, startHeight: null, detail })).status, 200);
    const row = tables.lesson_quality.find((r) => r.side === 'student');
    const { extra: _x, ...kept } = detail;
    assert.deepStrictEqual(row.precheck_detail, kept);
  });

  it('a wrong detail value is 400; an old client without detail still works', async () => {
    for (const detail of [{ camera: 'maybe' }, { latencyMs: -1 }, { downKbps: 1.5 }, { mobile: 'yes' }, [1], 'x']) {
      assert.strictEqual((await precheck({ precheck720: true, startHeight: 720, detail })).status, 400, JSON.stringify(detail));
    }
    assert.strictEqual((await precheck({ precheck720: true, startHeight: 720 })).status, 200);
    assert.deepStrictEqual(cleanPrecheckDetail({ latencyMs: null, downKbps: null }), { latencyMs: null, downKbps: null });
  });

  it('nettest needs the pass, answers empty for latency and N KB for speed, capped', async () => {
    const get = (kb: string, tk = ticket) => fetch(`${base}/api/classroom/${BOOKING_ID}/nettest?kb=${kb}`, { headers: { 'x-room-ticket': tk } });
    assert.strictEqual((await get('0', '')).status, 401);
    const ping = await get('0');
    assert.strictEqual(ping.status, 200);
    assert.strictEqual(ping.headers.get('cache-control'), 'no-store');
    assert.strictEqual((await ping.arrayBuffer()).byteLength, 0);
    assert.strictEqual((await (await get('256')).arrayBuffer()).byteLength, 256 * 1024);
    assert.strictEqual((await (await get('99999')).arrayBuffer()).byteLength, NETTEST_MAX_KB * 1024);
    assert.strictEqual((await (await get('abc')).arrayBuffer()).byteLength, 0);
  });
});

describe('CL-23 wiring', () => {
  const src = fs.readFileSync('src/classroom/WaitingRoom.tsx', 'utf8');
  it('asks the mic and the camera separately, shows per-browser steps, and records the results', () => {
    assert.match(src, /ask\(\{ audio: audioFor/);
    assert.match(src, /ask\(\{ video: videoFor/);
    assert.doesNotMatch(src, /getUserMedia\(\{ video: videoFor\(cameraId\), audio/);
    assert.match(src, /permissionSteps\(who, t\)/);
    assert.match(src, /runNetworkTest\(bookingId, ticket, iceServers\)/);
    assert.match(src, /detail: \{/);
    assert.match(src, /setSinkId/);
    assert.match(fs.readFileSync('src/classroom/ClassroomPage.tsx', 'utf8'), /iceServers=\{entry\.iceServers\}/);
  });
});
