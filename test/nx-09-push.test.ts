import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { parseSubscription, sendPushToUser, pushConfigured, PUSH_KINDS } from '../server/notifications/push.js';
import { keyToBytes } from '../src/student/components/PushToggle.js';

const goodSub = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'BNc', auth: 'xyz' } };

function fakeClient(subs: any[]) {
  const deleted: string[] = [];
  const q = (rows: any[]) => {
    const p: any = Promise.resolve({ data: rows, error: null });
    p.select = () => p; p.eq = (_k: string, v: string) => { p._last = v; return p; }; p.limit = () => p;
    p.update = () => p; p.delete = () => { const d: any = { eq: (_k: string, v: string) => { deleted.push(v); return Promise.resolve({}); } }; return d; };
    return p;
  };
  return { deleted, from: () => q(subs) };
}

describe('NX-09 web push', () => {
  it('accepts only https push services with both keys', () => {
    assert.deepStrictEqual(parseSubscription(goodSub), goodSub);
    assert.ok(parseSubscription({ ...goodSub, endpoint: 'https://web.push.apple.com/QGuQyavXut' }));
    assert.ok(parseSubscription({ ...goodSub, endpoint: 'https://wns2-db5p.notify.windows.com/w/?token=x' }));
    for (const bad of [null, {}, { ...goodSub, endpoint: 'http://x' }, { ...goodSub, endpoint: 'javascript:alert(1)' }, { endpoint: goodSub.endpoint, keys: { p256dh: 'a' } },
      { ...goodSub, endpoint: 'https://169.254.169.254/latest' }, { ...goodSub, endpoint: 'https://evil.example/fcm.googleapis.com' },
      { ...goodSub, endpoint: 'https://fcm.googleapis.com.evil.example/x' }, { ...goodSub, endpoint: 'https://fcm.googleapis.com:8443/x' },
      { ...goodSub, endpoint: 'https://evil.example\@fcm.googleapis.com/x' }, { ...goodSub, endpoint: 'https://user@fcm.googleapis.com/x' },
      { ...goodSub, endpoint: 'https://FCM.googleapis.com/x' }, { ...goodSub, endpoint: 'https://fcm.googleapis.com/a b' }]) {
      assert.strictEqual(parseSubscription(bad), null, JSON.stringify(bad));
    }
  });

  // Owner review 2026-11-07: a teacher's phone also buzzes for a lesson booked, moved or cancelled, and 2 hours before.
  it('only lesson reminders and changes, gift notes, recitation replies and the quiet-learner nudge buzz a phone', () => {
    assert.deepStrictEqual([...PUSH_KINDS].sort(), ['gift_redeemed', 'lesson_booked', 'lesson_cancelled', 'lesson_in_12h', 'lesson_in_2h', 'lesson_rescheduled', 'quiet_learner', 'recitation_reply', 'teacher_lesson_in_2h']);
  });

  it('sends nothing without keys, and removes a device the push service says is gone', async () => {
    const notice = { kind: 'lesson_in_2h', title: { en: 'Soon', ar: 'قرّبت' }, body: { en: 'b', ar: 'ب' }, link: '/student/lessons' };
    assert.strictEqual(pushConfigured({}), false);
    process.env.VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    process.env.VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls';
    const client = fakeClient([{ id: 's1', endpoint: 'https://fcm.googleapis.com/a', p256dh: 'k', auth: 'a' }, { id: 's2', endpoint: 'https://fcm.googleapis.com/b', p256dh: 'k', auth: 'a' }, { id: 's3', endpoint: 'https://169.254.169.254/x', p256dh: 'k', auth: 'a' }]);
    const sentPayloads: any[] = [];
    const n = await sendPushToUser(client, 'u1', notice, 'ar', (async (sub: any, payload: any) => {
      if (sub.endpoint === 'https://fcm.googleapis.com/b') throw Object.assign(new Error('gone'), { statusCode: 410 });
      sentPayloads.push(JSON.parse(payload));
    }) as any);
    assert.strictEqual(n, 1);
    assert.deepStrictEqual(sentPayloads[0], { title: 'قرّبت', body: 'ب', url: '/student/lessons', tag: 'lesson_in_2h', icon: '/zaadi-notification-192.png' });
    assert.deepStrictEqual(client.deleted.sort(), ['s2', 's3'], 'gone device removed; a stored non-push address is dropped, never called');
    assert.strictEqual(await sendPushToUser(client, 'u1', { ...notice, kind: 'summary_due' }, 'ar', (async () => { throw new Error('no'); }) as any), 0);
  });

  it('turns the VAPID key into bytes and the service worker shows and opens notifications', () => {
    assert.deepStrictEqual([...keyToBytes('AQID')], [1, 2, 3]);
    const sw = fs.readFileSync('public/sw.js', 'utf8');
    assert.match(sw, /addEventListener\('push'/);
    assert.match(sw, /addEventListener\('notificationclick'/);
    assert.match(fs.readFileSync('supabase/migrations/20261101000003_push_subscriptions.sql', 'utf8'), /REVOKE ALL ON public\.push_subscriptions FROM anon, authenticated/);
  });
});

describe('NX-09 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('subscribing needs a signed-in real account', async () => {
    const post = (headers: any) => fetch(`${base}/api/student/push/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ subscription: goodSub }) });
    assert.strictEqual((await post({})).status, 401);
    const dev = await post({ Authorization: 'Bearer dev-student-token' });
    if (dev.status !== 401) assert.strictEqual(dev.status, 403);
    assert.strictEqual((await fetch(`${base}/api/push/public-key`)).status, 200);
  });
});
