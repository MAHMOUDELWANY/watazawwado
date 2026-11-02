import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { confirmDonationSession, donationAmount, LESSON_UNIT_USD } from '../server/routes/sponsorship.js';

const ID = '11111111-2222-3333-4444-555555555555';

/** A fake client holding one donation row; records the update. */
function fakeClient(row: any) {
  const updates: any[] = [];
  return {
    updates,
    rpc: async () => ({ data: 0 }),
    from: (table: string) => {
      const b: any = {
        select: () => b, eq: () => b, insert: async () => ({}),
        maybeSingle: async () => (table === 'sponsorship_donations' ? { data: row } : { data: null }),
        update: (patch: any) => { updates.push(patch); row = { ...row, ...patch }; return { eq: () => ({ eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: { id: ID }, error: null }) }) }) }) }; },
      };
      return b;
    },
  };
}

describe('NX-07 sponsorship fund', () => {
  it('a donation is lessons × the lesson price, or a bounded amount', () => {
    assert.deepStrictEqual(donationAmount({ lessons: 8 }), { amount: 8 * LESSON_UNIT_USD, lessons: 8 });
    assert.ok('error' in donationAmount({ lessons: 5 }));
    assert.deepStrictEqual(donationAmount({ amount: 25.555 }), { amount: 25.56, lessons: null });
    assert.ok('error' in donationAmount({ amount: 2 }));
    assert.ok('error' in donationAmount({ amount: 999999 }));
    assert.ok('error' in donationAmount({ amount: 'abc' }));
  });

  it('confirms only the matching session and amount, once', async () => {
    const c = fakeClient({ id: ID, amount_usd: 36, status: 'pending', stripe_session_id: 'cs_1' });
    const session = { id: 'cs_1', paymentStatus: 'paid', status: 'complete', amountTotal: 36, currency: 'USD', metadata: { targetType: 'donation', targetId: ID } } as any;
    const first = await confirmDonationSession(c, session);
    assert.strictEqual(first.isIdempotent, false);
    assert.strictEqual(c.updates[0].status, 'confirmed');
    const again = await confirmDonationSession(c, session);
    assert.strictEqual(again.isIdempotent, true);
  });

  it('refuses a foreign session or a wrong amount', async () => {
    const base = { id: ID, amount_usd: 36, status: 'pending', stripe_session_id: 'cs_1' };
    await assert.rejects(confirmDonationSession(fakeClient({ ...base }), { id: 'cs_other', amountTotal: 36, currency: 'USD', metadata: { targetId: ID } } as any));
    await assert.rejects(confirmDonationSession(fakeClient({ ...base }), { id: 'cs_1', amountTotal: 1, currency: 'USD', metadata: { targetId: ID } } as any));
    await assert.rejects(confirmDonationSession(fakeClient({ ...base }), { id: 'cs_1', amountTotal: 36, currency: 'EUR', metadata: { targetId: ID } } as any));
  });

  it('the fund is server-only and a grant is atomic', () => {
    const sql = fs.readFileSync('supabase/migrations/20261102000003_sponsorship_fund.sql', 'utf8');
    for (const t of ['sponsorship_donations', 'sponsorship_requests', 'sponsorship_grants']) assert.match(sql, new RegExp(`REVOKE ALL ON public\\.${t} FROM anon, authenticated`));
    assert.match(sql, /pg_advisory_xact_lock/);
    assert.match(sql, /FUND_TOO_LOW/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.grant_sponsorship_atomic[^;]*FROM authenticated/);
  });
});

describe('NX-07 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('guests get nothing', async () => {
    assert.strictEqual((await fetch(`${base}/api/student/sponsorship`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/student/sponsorship/donate`, { method: 'POST' })).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/admin/sponsorship`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/admin/sponsorship/grant`, { method: 'POST' })).status, 401);
  });
});
