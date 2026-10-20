import { describe, it } from 'node:test';
import assert from 'node:assert';
import { lowBalanceThreshold, lowBalanceNotice, notifyLowBalance, lowBalanceKey } from '../server/notifications/lowBalance.js';

const ent = (over: Record<string, any> = {}) => ({
  id: 'ent-1',
  status: 'active',
  purchased_quantity: 8,
  remaining_credits: 2,
  learner_student_id: 'stu-1',
  metadata: {},
  ...over
});

/** Minimal Supabase stand-in for one package_entitlements row, with the conditional update the claim uses. */
function fakeClient(row: any) {
  const state = { row: structuredClone(row) };
  return {
    state,
    from() {
      const q: any = { filters: [] as any[], patch: null as any };
      const chain = {
        select() { return chain; },
        update(patch: any) { q.patch = patch; return chain; },
        eq(_c: string, v: any) { q.filters.push((r: any) => r.id === v); return chain; },
        is(col: string, v: null) {
          const key = col.replace('metadata->>', '');
          q.filters.push((r: any) => (r.metadata?.[key] ?? null) === v);
          return chain;
        },
        async maybeSingle() { return { data: q.filters.every((f: any) => f(state.row)) ? state.row : null, error: null }; },
        then(resolve: any) {
          const match = q.filters.every((f: any) => f(state.row));
          if (match && q.patch) state.row = { ...state.row, ...q.patch };
          resolve({ data: match ? [{ id: state.row.id }] : [], error: null });
        }
      };
      return chain;
    }
  };
}

const account = async () => ({ userId: 'user-1', email: 'parent@example.com', name: 'Maryam', viaParent: true });

describe('RN-02 low-balance notice', () => {
  it('fires at 2 and 0 only, for real packages that are not refunded', () => {
    assert.strictEqual(lowBalanceThreshold(ent()), 2);
    assert.strictEqual(lowBalanceThreshold(ent({ remaining_credits: 0, status: 'exhausted' })), 0);
    assert.strictEqual(lowBalanceThreshold(ent({ remaining_credits: 1 })), null);
    assert.strictEqual(lowBalanceThreshold(ent({ remaining_credits: 3 })), null);
    assert.strictEqual(lowBalanceThreshold(ent({ status: 'refunded' })), null);
    assert.strictEqual(lowBalanceThreshold(ent({ status: 'cancelled' })), null);
    assert.strictEqual(lowBalanceThreshold(ent({ metadata: { refund_requested_at: '2026-10-20' } })), null);
    assert.strictEqual(lowBalanceThreshold(ent({ metadata: { source: 'cancellation_credit' }, purchased_quantity: 1, remaining_credits: 0 })), null);
    assert.strictEqual(lowBalanceThreshold(ent({ purchased_quantity: 2 })), null);
    assert.strictEqual(lowBalanceThreshold(ent({ metadata: { [lowBalanceKey(2)]: '2026-10-19' } })), null);
  });

  it('sends one notice per threshold, even when called twice', async () => {
    const client = fakeClient(ent());
    const sent: any[] = [];
    const notify = (async (_c: any, to: any, notice: any, opts: any) => { sent.push({ to, notice, opts }); }) as any;

    assert.strictEqual(await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any }), 2);
    assert.strictEqual(await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any }), null);
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].opts.email, true);
    assert.strictEqual(sent[0].to.name, null, 'the parent is not greeted by the child\'s name');
    assert.ok(sent[0].notice.title.en.includes('for Maryam'));

    client.state.row = { ...client.state.row, remaining_credits: 0, status: 'exhausted' };
    assert.strictEqual(await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any }), 0);
    assert.strictEqual(await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any }), null);
    assert.strictEqual(sent.length, 2);
  });

  it('sends nothing for a refunded package', async () => {
    const sent: any[] = [];
    const notify = (async () => { sent.push(1); }) as any;
    await notifyLowBalance(fakeClient(ent({ status: 'refunded' })), 'ent-1', { notify, resolve: account as any });
    await notifyLowBalance(fakeClient(ent({ metadata: { refund_requested_at: 'x' } })), 'ent-1', { notify, resolve: account as any });
    assert.strictEqual(sent.length, 0);
  });

  it('uses calm words, no urgency', () => {
    for (const t of [2, 0] as const) {
      const n = lowBalanceNotice(t, 8, null);
      const text = `${n.title.en} ${n.body.en}`.toLowerCase();
      for (const w of ['hurry', 'only', 'expire', 'last chance', 'now!', 'don\'t miss']) assert.ok(!text.includes(w), `"${w}" in: ${text}`);
    }
    assert.strictEqual(lowBalanceNotice(2, 12, null).body.ar.includes('12 حصة'), true);
  });
});
