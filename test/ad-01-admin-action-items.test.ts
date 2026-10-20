import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';

const KEYS = ['follow_ups', 'pay_later', 'refunds', 'placements', 'unread_chats', 'health', 'no_zoom_24h'];

describe('AD-01 admin overview: what needs me today', () => {
  it('the overview leads with the action items, before follow-ups and the numbers', () => {
    const page = fs.readFileSync('src/dashboard/pages/OverviewPage.tsx', 'utf8');
    const at = page.indexOf('<ActionItems />');
    assert.ok(at > 0 && at < page.indexOf('<FollowUpsCard />') && at < page.indexOf('Action Alerts'));
  });

  it('uses the same filters as the pages it links to', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const startAt = api.indexOf("app.get('/api/dashboard/admin/action-items'");
    const route = api.slice(startAt, api.indexOf('\napp.', startAt + 10));
    assert.ok(route.includes(".eq('status', 'pending').eq('payment_plan', 'pay_later')"), 'pay later = the pay-later page');
    assert.ok(route.includes(".eq('metadata->>source', 'cancellation_credit').not('metadata->>refund_requested_at', 'is', null)"), 'refunds = the refund list');
    assert.ok(route.includes('computeHealth(supabase'), 'health = the health page');
  });

  describe('endpoint', () => {
    let server: http.Server;
    let base: string;
    before(async () => {
      await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
    });
    after(async () => { await new Promise<void>((r) => server.close(() => r())); });

    it('is admin-only and returns every item with a count and a link', async () => {
      const path = `${base}/api/dashboard/admin/action-items`;
      assert.strictEqual((await fetch(path)).status, 401);
      assert.strictEqual((await fetch(path, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
      const r = await fetch(path, { headers: { Authorization: 'Bearer dev-super-admin-token' } });
      if (r.status === 503) return;
      assert.strictEqual(r.status, 200);
      const body: any = await r.json();
      assert.deepStrictEqual(body.items.map((i: any) => i.key), KEYS);
      for (const i of body.items) assert.ok(Number.isInteger(i.count) && i.link.startsWith('/dashboard'), JSON.stringify(i));
    });
  });
});
