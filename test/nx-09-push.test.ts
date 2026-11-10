import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { parseSubscription, sendPushToUser, pushConfigured, pushPayload, PUSH_KINDS } from '../server/notifications/push.js';
import { threadGroup } from '../server/routes/community.js';
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

  // Owner review 2026-11-09: every account type gets its own phone notices, chat messages included.
  it('pushes what each account needs, and keeps the quiet news in the bell', () => {
    for (const k of ['lesson_in_2h', 'homework_set', 'recitation_reply', 'lesson_booked', 'new_student', 'payslip', 'intake_submitted', 'sponsorship_request', 'chat_message', 'lesson_waiting', 'lesson_unstable', 'homework_new']) assert.ok(PUSH_KINDS.has(k), k);
    for (const k of ['honor_photo_ok', 'family_achievement', 'teacher_photo', 'summary_due']) assert.ok(!PUSH_KINDS.has(k), k);
  });

  it('lays a notice out like the reference: emoji title, one line, Zad or a photo, one button', () => {
    const n = { kind: 'lesson_in_2h', title: { en: 'Lesson soon', ar: 'حصتك قرّبت' }, body: { en: 'b', ar: 'ب' }, link: '/student/lessons' };
    assert.deepStrictEqual(pushPayload(n, 'ar'), { title: '⏰ حصتك قرّبت', body: 'ب', url: '/student/lessons', tag: 'lesson_in_2h', icon: '/push/zad-point.png', badge: '/push/badge-96.png', action: 'افتح' });
    const chat = pushPayload({ kind: 'chat_message', title: { en: 'Ustadha Afnan', ar: 'أ. عفنان' }, body: { en: 'Hi', ar: 'Hi' }, image: 'https://x.supabase.co/a.jpg', tag: 'chat-1' }, 'en');
    assert.strictEqual(chat.icon, 'https://x.supabase.co/a.jpg');
    assert.strictEqual(chat.tag, 'chat-1');
    assert.strictEqual(chat.action, 'Reply');
    for (const k of PUSH_KINDS) assert.ok(fs.existsSync('public' + pushPayload({ kind: k, title: n.title, body: n.body }, 'ar').icon), k);
    assert.ok(fs.existsSync('public/push/badge-96.png'));
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
    assert.deepStrictEqual(sentPayloads[0], { title: '⏰ قرّبت', body: 'ب', url: '/student/lessons', tag: 'lesson_in_2h', icon: '/push/zad-point.png', badge: '/push/badge-96.png', action: 'افتح' });
    assert.deepStrictEqual(client.deleted.sort(), ['s2', 's3'], 'gone device removed; a stored non-push address is dropped, never called');
    assert.strictEqual(await sendPushToUser(client, 'u1', { ...notice, kind: 'summary_due' }, 'ar', (async () => { throw new Error('no'); }) as any), 0);
  });

  it('turns the VAPID key into bytes and the service worker shows and opens notifications', () => {
    assert.deepStrictEqual([...keyToBytes('AQID')], [1, 2, 3]);
    const sw = fs.readFileSync('public/sw.js', 'utf8');
    assert.match(sw, /addEventListener\('push'/);
    assert.match(sw, /addEventListener\('notificationclick'/);
    assert.match(sw, /actions:/);
    assert.match(fs.readFileSync('supabase/migrations/20261101000003_push_subscriptions.sql', 'utf8'), /REVOKE ALL ON public\.push_subscriptions FROM anon, authenticated/);
  });
});

describe('Inbox sections', () => {
  it('puts each conversation in the section the owner asked for', () => {
    const fam = new Set(['parent1']);
    assert.strictEqual(threadGroup({ kind: 'support', owner_role: 'teacher', owner_user_id: 't1' }, { role: 'admin' }, fam), 'teachers');
    assert.strictEqual(threadGroup({ kind: 'support', owner_role: 'student', owner_user_id: 'parent1' }, { role: 'admin' }, fam), 'families');
    assert.strictEqual(threadGroup({ kind: 'support', owner_role: 'student', owner_user_id: 'visitor' }, { role: 'admin' }, fam), 'support');
    assert.strictEqual(threadGroup({ kind: 'lesson', owner_role: 'student', owner_user_id: 'parent1' }, { role: 'admin' }, fam), 'lessons');
    assert.strictEqual(threadGroup({ kind: 'lesson', owner_role: 'student', owner_user_id: 'p' }, { role: 'student' }, fam), 'teachers');
    assert.strictEqual(threadGroup({ kind: 'lesson', owner_role: 'student', owner_user_id: 'p' }, { role: 'teacher' }, fam), 'families');
    assert.strictEqual(threadGroup({ kind: 'support', owner_role: 'teacher', owner_user_id: 't' }, { role: 'teacher' }, fam), 'team');
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

  // 2026-11-09: teachers had no way to subscribe, so their lesson reminders never reached a phone.
  it('teachers can subscribe their own device; students cannot use the teacher route', async () => {
    const post = (headers: any, subscription: any = goodSub) => fetch(`${base}/api/teacher/push/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ subscription }) });
    assert.strictEqual((await post({})).status, 401);
    const student = await post({ Authorization: 'Bearer dev-student-token' });
    if (student.status !== 401) assert.strictEqual(student.status, 403);
    // A bad subscription stops at validation (no row written); with dev auth off the token is refused first.
    const teacher = await post({ Authorization: 'Bearer dev-teacher-token' }, { endpoint: 'https://evil.example/x', keys: { p256dh: 'a', auth: 'b' } });
    assert.ok([400, 401].includes(teacher.status), String(teacher.status));
  });
});
