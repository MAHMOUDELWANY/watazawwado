import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { createCrmTask } from '../server/routes/crm.js';
import { bucketTask, followUpMessage } from '../src/dashboard/components/FollowUps.js';

describe('CRM-04 follow-up tasks', () => {
  it('groups tasks into overdue, today and this week', () => {
    const now = new Date(2026, 9, 20, 15, 0);
    assert.strictEqual(bucketTask(new Date(2026, 9, 19, 23, 0).toISOString(), now), 'overdue');
    assert.strictEqual(bucketTask(new Date(2026, 9, 20, 8, 0).toISOString(), now), 'today', 'earlier today is today, not overdue');
    assert.strictEqual(bucketTask(new Date(2026, 9, 20, 23, 59).toISOString(), now), 'today');
    assert.strictEqual(bucketTask(new Date(2026, 9, 26, 9, 0).toISOString(), now), 'week');
    assert.strictEqual(bucketTask(new Date(2026, 9, 28, 9, 0).toISOString(), now), null);
  });

  it('the WhatsApp greeting comes from the academy team', () => {
    assert.ok(followUpMessage('Amina', false).includes('Watazawwado Academy team'));
    assert.ok(followUpMessage(null, true).includes('فريق أكاديمية وتزودوا'));
    assert.ok(!/mahmoud|محمود/i.test(followUpMessage('x', false) + followUpMessage('x', true)));
  });

  it('automatic tasks use a dedupe key so a trial gets one task', async () => {
    const calls: any[] = [];
    const client = { from: () => ({ upsert: async (row: any, opts: any) => { calls.push({ row, opts }); return { error: null }; }, insert: async () => ({ error: null }) }) };
    assert.strictEqual(await createCrmTask(client, { accountStudentId: 's1', title: 't', dueAt: new Date(), source: 'trial_followup', dedupeKey: 'trial:b1' }), true);
    assert.deepStrictEqual(calls[0].opts, { onConflict: 'dedupe_key', ignoreDuplicates: true });
    assert.strictEqual(calls[0].row.dedupe_key, 'trial:b1');
    assert.strictEqual(await createCrmTask(null, { accountStudentId: 's1', title: 't', dueAt: new Date() }), false);
  });

  it('every attended free trial creates a follow-up', () => {
    const src = fs.readFileSync('api/index.ts', 'utf8');
    assert.match(src, /status === 'completed' && existingBooking\.booking_type === 'trial'[\s\S]{0,200}createCrmTask\(/);
    assert.ok(src.includes("dedupeKey: `trial:${existingBooking.id}`"));
  });

  describe('endpoints', () => {
    let server: http.Server;
    let base: string;
    const id = '00000000-0000-4000-8000-000000000000';
    before(async () => {
      await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
    });
    after(async () => { await new Promise<void>((r) => server.close(() => r())); });

    it('are for the super admin only and validate input', async () => {
      const calls: [string, string, any?][] = [
        ['GET', '/api/dashboard/admin/crm/tasks'],
        ['GET', `/api/dashboard/admin/students/${id}/crm/tasks`],
        ['POST', `/api/dashboard/admin/students/${id}/crm/tasks`, { title: 'x', dueAt: '2026-10-21T09:00:00Z' }],
        ['PATCH', `/api/dashboard/admin/crm/tasks/${id}`, { done: true }]
      ];
      for (const [method, path, body] of calls) {
        const init = (token?: string) => ({ method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
        assert.strictEqual((await fetch(base + path, init())).status, 401, `${method} ${path}`);
        assert.strictEqual((await fetch(base + path, init('dev-teacher-token'))).status, 403, `${method} ${path}`);
      }
      const admin = { 'Content-Type': 'application/json', Authorization: 'Bearer dev-super-admin-token' };
      const noDate = await fetch(`${base}/api/dashboard/admin/students/${id}/crm/tasks`, { method: 'POST', headers: admin, body: JSON.stringify({ title: 'x' }) });
      assert.ok([400, 503].includes(noDate.status));
      const badDone = await fetch(`${base}/api/dashboard/admin/crm/tasks/${id}`, { method: 'PATCH', headers: admin, body: JSON.stringify({ done: 'yes' }) });
      assert.ok([400, 503].includes(badDone.status));
    });
  });
});
