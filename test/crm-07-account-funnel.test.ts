import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { DateTime } from 'luxon';
import app from '../api/index.js';
import { buildAccountFunnel, FUNNEL_STEPS } from '../server/routes/funnel.js';

const NOW = DateTime.fromISO('2026-10-21T12:00:00', { zone: 'Africa/Cairo' });
const day = (d: number) => NOW.minus({ days: d }).toUTC().toISO()!;

describe('CRM-07 account funnel', () => {
  const f = buildAccountFunnel({
    now: NOW,
    weeks: 4,
    accounts: [
      { id: 'a1', name: 'Parent A', email: 'A@x.com', onboarding_completed: true, created_at: day(1) },
      { id: 'a2', name: 'Adult B', email: 'b@x.com', onboarding_completed: true, created_at: day(2) },
      { id: 'a3', name: 'New C', email: 'c@x.com', onboarding_completed: false, created_at: day(0) },
      { id: 'old', name: 'Old', email: 'o@x.com', onboarding_completed: true, created_at: day(90) }
    ],
    guardians: [{ student_id: 'kid1', parent_email: 'a@x.com' }],
    bookings: [
      { student_id: 'kid1', booking_type: 'trial', status: 'completed', scheduled_start: day(1) },
      { student_id: 'kid1', booking_type: 'regular', status: 'completed', scheduled_start: day(40) },
      { student_id: 'kid1', booking_type: 'regular', status: 'completed', scheduled_start: day(5) },
      { student_id: 'a2', booking_type: 'trial', status: 'cancelled', scheduled_start: day(1) }
    ],
    payments: [{ student_id: 'kid1', status: 'confirmed' }, { student_id: 'a2', status: 'failed' }]
  });

  it('has the six steps and one row per week, newest first', () => {
    assert.deepStrictEqual([...f.steps], [...FUNNEL_STEPS]);
    assert.strictEqual(f.cohorts.length, 4);
    assert.ok(f.cohorts[0].weekStart > f.cohorts[3].weekStart);
  });
  it('counts each account once per step, through its children too; old sign-ups fall outside', () => {
    const total = (s: string) => f.cohorts.reduce((n, c) => n + (c.counts as any)[s], 0);
    assert.strictEqual(total('signed_up'), 3);
    assert.strictEqual(total('onboarded'), 2);
    assert.strictEqual(total('trial_booked'), 1, 'a cancelled trial is not a booked trial');
    assert.strictEqual(total('trial_attended'), 1);
    assert.strictEqual(total('first_paid'), 1, 'a failed payment is not a payment');
    assert.strictEqual(total('second_month'), 1, 'paid lessons 35 days apart');
  });
  it('every number lists the people behind it', () => {
    for (const c of f.cohorts) for (const s of FUNNEL_STEPS) assert.strictEqual(c.people[s].length, c.counts[s]);
    const paid = f.cohorts.flatMap((c) => c.people.first_paid);
    assert.deepStrictEqual(paid, [{ id: 'a1', name: 'Parent A' }]);
  });
});

describe('CRM-07 endpoint', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });
  it('is admin only', async () => {
    const url = `${base}/api/dashboard/admin/funnel`;
    assert.strictEqual((await fetch(url)).status, 401);
    assert.strictEqual((await fetch(url, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
    const r = await fetch(url, { headers: { Authorization: 'Bearer dev-super-admin-token' } });
    if (r.status === 503) return;
    assert.strictEqual(r.status, 200);
    const body: any = await r.json();
    assert.strictEqual(body.cohorts.length, 8);
  });
});
