import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placementGate, levelFromScore } from '../server/routes/community.js';

/** Minimal stand-in for the Supabase query builder: every chain resolves to the given result. */
function fakeClient(results: { bookings: any; tests: any }) {
  const chain = (result: any): any => new Proxy(() => {}, {
    get: (_t, prop) => (prop === 'then' ? (res: any) => res(result) : () => chain(result))
  });
  return { from: (table: string) => chain(table === 'bookings' ? results.bookings : results.tests) };
}

test('placement status: no test yet, then waiting for review, then done', async () => {
  assert.equal(await placementGate(fakeClient({ bookings: { count: 0 }, tests: { data: [] } }), 's1'), 'PLACEMENT_REQUIRED');
  assert.equal(await placementGate(fakeClient({ bookings: { count: 0 }, tests: { data: [{ status: 'submitted' }] } }), 's1'), 'PLACEMENT_PENDING_REVIEW');
  assert.equal(await placementGate(fakeClient({ bookings: { count: 0 }, tests: { data: [{ status: 'reviewed' }] } }), 's1'), null);
});

test('placement status: a missing table asks nothing', async () => {
  assert.equal(await placementGate(fakeClient({ bookings: { count: 0 }, tests: { error: { message: 'no table' } } }), 's1'), null);
});

test('placement score maps to a level', () => {
  assert.equal(levelFromScore(1, 8), 'beginner');
  assert.equal(levelFromScore(4, 8), 'elementary');
  assert.equal(levelFromScore(6, 8), 'intermediate');
  assert.equal(levelFromScore(8, 8), 'advanced');
});
