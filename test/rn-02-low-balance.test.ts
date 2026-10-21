import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { lowBalanceThreshold, lowBalanceNotice, notifyLowBalance, lowBalanceKey } from '../server/notifications/lowBalance.js';

const ent = (over: Record<string, any> = {}) => ({
  id: 'ent-1',
  status: 'active',
  purchased_quantity: 8,
  remaining_credits: 2,
  learner_student_id: 'stu-1',
  purchaser_account_id: null,
  metadata: {},
  updated_at: 't0',
  ...over
});

/**
 * Minimal Supabase stand-in: one package_entitlements row (with the conditional update the claim uses) and
 * read-only students / profiles rows.
 */
function fakeClient(row: any, other: Record<string, any[]> = {}) {
  const state = { row: structuredClone(row) };
  return {
    state,
    from(table: string) {
      const q: any = { filters: [] as any[], patch: null as any };
      const rows = () => (table === 'package_entitlements' ? [state.row] : other[table] || []);
      const matches = () => rows().filter((r: any) => q.filters.every((f: any) => f(r)));
      const chain = {
        select() { return chain; },
        limit() { return chain; },
        update(patch: any) { q.patch = patch; return chain; },
        eq(col: string, v: any) { q.filters.push((r: any) => r[col] === v); return chain; },
        is(col: string, v: null) {
          const key = col.replace('metadata->>', '');
          q.filters.push((r: any) => (r.metadata?.[key] ?? null) === v);
          return chain;
        },
        async maybeSingle() { return { data: matches()[0] || null, error: null }; },
        then(resolve: any) {
          const found = matches();
          if (found.length && q.patch && table === 'package_entitlements') {
            state.row = { ...state.row, ...q.patch, updated_at: `${state.row.updated_at}+` };
          }
          resolve({ data: found.map((r: any) => ({ ...r })), error: null });
        }
      };
      return chain;
    }
  };
}

const account = async () => ({ userId: 'user-1', email: 'parent@example.com', name: 'Maryam', viaParent: true });
const capture = () => {
  const sent: any[] = [];
  const notify = (async (_c: any, to: any, notice: any, opts: any) => { sent.push({ to, notice, opts }); }) as any;
  return { sent, notify };
};

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
    assert.deepStrictEqual(sent[0].opts, { email: true, preference: 'renewal_reminders' }, 'RN-07: respects the renewal-reminders switch');

    client.state.row = { ...client.state.row, remaining_credits: 0, status: 'exhausted' };
    assert.strictEqual(await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any }), 0);
    assert.strictEqual(await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any }), null);
    assert.strictEqual(sent.length, 2);
  });

  it('a used-up package also gives the admin one follow-up task on the paying account, a low one does not', async () => {
    const tasks: any[] = [];
    const task = (async (_c: any, t: any) => { tasks.push(t); return true; }) as any;
    const notify = (async () => {}) as any;
    const client = fakeClient(ent(), { students: [{ id: 'parent-stu', auth_user_id: 'user-1' }] });
    await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any, task });
    assert.strictEqual(tasks.length, 0, 'nothing at 2 lessons left');
    client.state.row = { ...client.state.row, remaining_credits: 0, status: 'exhausted' };
    await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any, task });
    await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any, task });
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].accountStudentId, 'parent-stu');
    assert.strictEqual(tasks[0].source, 'low_balance');
    assert.strictEqual(tasks[0].dedupeKey, 'low_balance:0:ent-1');
    assert.ok(tasks[0].title.includes('for Maryam'));
  });

  it('sends nothing for a refunded package', async () => {
    const sent: any[] = [];
    const notify = (async () => { sent.push(1); }) as any;
    await notifyLowBalance(fakeClient(ent({ status: 'refunded' })), 'ent-1', { notify, resolve: account as any });
    await notifyLowBalance(fakeClient(ent({ metadata: { refund_requested_at: 'x' } })), 'ent-1', { notify, resolve: account as any });
    assert.strictEqual(sent.length, 0);
  });

  it('tells the person who paid, naming the learner when it is someone else', async () => {
    const client = fakeClient(ent({ purchaser_account_id: 'parent-auth' }), {
      students: [
        { id: 'stu-1', name: 'Yusuf', auth_user_id: 'teen-auth' },
        { id: 'stu-0', name: 'Amina', auth_user_id: 'parent-auth' }
      ],
      profiles: [{ id: 'parent-auth', email: 'amina@example.com' }]
    });
    const { sent, notify } = capture();
    assert.strictEqual(await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any }), 2);
    assert.deepStrictEqual(sent[0].to, { userId: 'parent-auth', email: 'amina@example.com', name: 'Amina' });
    assert.ok(sent[0].notice.title.en.includes('for Yusuf'));
  });

  it('does not name the learner when the learner paid', async () => {
    const client = fakeClient(ent({ purchaser_account_id: 'me' }), {
      students: [{ id: 'stu-1', name: 'Omar', auth_user_id: 'me' }],
      profiles: [{ id: 'me', email: 'omar@example.com' }]
    });
    const { sent, notify } = capture();
    await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any });
    assert.strictEqual(sent[0].to.name, 'Omar');
    assert.ok(!sent[0].notice.title.en.includes(' for '));
  });

  it('backs off when the package changed between read and claim (no stale metadata write)', async () => {
    const client = fakeClient(ent());
    const { sent, notify } = capture();
    const realFrom = client.from.bind(client);
    let reads = 0;
    // After the first read, another writer updates the row (updated_at moves on).
    client.from = ((table: string) => {
      const chain = realFrom(table);
      const maybeSingle = chain.maybeSingle;
      chain.maybeSingle = async () => {
        const r = await maybeSingle();
        if (table === 'package_entitlements' && reads++ === 0) client.state.row = { ...client.state.row, metadata: { note: 'admin' }, updated_at: 't1' };
        return r;
      };
      return chain;
    }) as any;
    assert.strictEqual(await notifyLowBalance(client, 'ent-1', { notify, resolve: account as any }), null);
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(client.state.row.metadata, { note: 'admin' }, 'the other writer\'s metadata is kept');
  });

  it('is called from the outcome route only when a credit was used', () => {
    const src = fs.readFileSync('api/index.ts', 'utf8');
    assert.match(src, /package_entitlement_id && \(status === 'completed' \|\| creditDecision === 'used'\)\) \{\s*waitUntil\(notifyLowBalance\(/);
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
