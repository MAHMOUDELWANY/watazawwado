import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { processTrialFollowUps, trialFollowUpNotice } from '../server/notifications/trialFollowUp.js';

const NOW = Date.parse('2026-10-20T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

/** In-memory tables with the PostgREST filters this module uses, plus claim/finalize_notification_event. */
function fakeDb(tables: Record<string, any[]>, clock = { now: NOW }) {
  tables.notification_events ||= [];
  const ev = (key: string) => tables.notification_events.find((e) => e.idempotency_key === key);
  const client = {
    events: { get: (key: string) => ev(key) },
    from(table: string) {
      const filters: ((r: any) => boolean)[] = [];
      let limit = Infinity;
      const chain: any = {
        select: () => chain,
        order: () => chain,
        limit: (n: number) => { limit = n; return chain; },
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return chain; },
        neq: (c: string, v: any) => { filters.push((r) => r[c] !== v); return chain; },
        in: (c: string, vs: any[]) => { filters.push((r) => vs.includes(r[c])); return chain; },
        gte: (c: string, v: any) => { filters.push((r) => r[c] >= v); return chain; },
        lte: (c: string, v: any) => { filters.push((r) => r[c] <= v); return chain; },
        not: (c: string, _op: string, v: any) => { filters.push((r) => (r[c] ?? null) !== v); return chain; },
        rows: () => (tables[table] || []).filter((r) => filters.every((f) => f(r))).slice(0, limit),
        maybeSingle: async () => ({ data: chain.rows()[0] || null, error: null }),
        then: (resolve: any) => resolve({ data: chain.rows(), error: null })
      };
      return chain;
    },
    async rpc(name: string, a: any) {
      const stamp = new Date(clock.now).toISOString();
      if (name === 'claim_notification_event') {
        const cur = ev(a.p_key);
        if (cur && cur.status !== 'failed') return { data: { claimed: false, claim_token: null }, error: null };
        const token = `t${tables.notification_events.length + 1}-${clock.now}`;
        if (cur) Object.assign(cur, { status: 'sending', token, updated_at: stamp });
        else tables.notification_events.push({ idempotency_key: a.p_key, status: 'sending', token, error_details: null, updated_at: stamp });
        return { data: { claimed: true, claim_token: token }, error: null };
      }
      if (name === 'finalize_notification_event') {
        const cur = ev(a.p_key);
        if (cur?.token === a.p_token) Object.assign(cur, { status: a.p_status, token: null, error_details: a.p_error, updated_at: stamp });
        return { data: true, error: null };
      }
      throw new Error(`unexpected rpc ${name}`);
    }
  };
  return client;
}

const trial = (over: Record<string, any> = {}) => ({
  id: 'b1', student_id: 's1', booking_type: 'trial', status: 'completed',
  scheduled_start: hoursAgo(26), scheduled_end: hoursAgo(25.5), created_at: hoursAgo(50), updated_at: hoursAgo(25), ...over
});

function harness(tables: Record<string, any[]>, opts: { emailOk?: boolean; viaParent?: boolean; followUpsOn?: boolean } = {}) {
  const clock = { now: NOW };
  const db = fakeDb({ students: [{ id: 's1', name: 'Maryam' }], ...tables }, clock);
  const emails: any[] = [];
  const notices: any[] = [];
  const deps = {
    send: (async (m: any) => { emails.push(m); return { success: opts.emailOk !== false, status: opts.emailOk === false ? 'failed' : 'sent' }; }) as any,
    notify: (async (_c: any, to: any, n: any) => { notices.push({ to, n }); }) as any,
    resolve: (async () => ({ userId: 'u1', email: 'family@example.com', name: 'Maryam', viaParent: opts.viaParent ?? true })) as any,
    emailLang: (async () => 'en') as any,
    allowed: (async () => opts.followUpsOn !== false) as any
  };
  return { db, emails, notices, clock, run: () => processTrialFollowUps(db, clock.now, deps) };
}

describe('RN-05 trial follow-up', () => {
  it('RN-07: a family that switched off follow-ups gets the on-site notice only, once', async () => {
    const h = harness({ bookings: [trial()] }, { followUpsOn: false });
    assert.strictEqual(await h.run(), 1);
    assert.strictEqual(h.emails.length, 0);
    assert.strictEqual(h.notices.length, 1);
    assert.strictEqual(await h.run(), 0);
  });

  it('sends one email + on-site notice 24 h after an attended trial, and never again', async () => {
    const h = harness({ bookings: [trial()] });
    assert.strictEqual(await h.run(), 1);
    assert.strictEqual(h.emails.length, 1);
    assert.strictEqual(h.notices.length, 1);
    assert.strictEqual(h.notices[0].n.link, '/student/book');
    assert.strictEqual(await h.run(), 0, 'second cron run sends nothing');
    assert.strictEqual(h.emails.length, 1);
  });

  it('waits until 24 h have passed, and skips stale trials', async () => {
    assert.strictEqual(await harness({ bookings: [trial({ scheduled_end: hoursAgo(10) })] }).run(), 0);
    assert.strictEqual(await harness({ bookings: [trial({ scheduled_end: hoursAgo(80), updated_at: hoursAgo(79) })] }).run(), 0, 'recorded more than 72 h ago');
    assert.strictEqual(await harness({ bookings: [trial({ scheduled_end: hoursAgo(15 * 24), updated_at: hoursAgo(1) })] }).run(), 0, 'older than 14 days');
  });

  it('still follows up a trial the teacher recorded days late', async () => {
    assert.strictEqual(await harness({ bookings: [trial({ scheduled_end: hoursAgo(5 * 24), updated_at: hoursAgo(2) })] }).run(), 1);
  });

  it('skips a learner who bought a package after the trial', async () => {
    const pkg = { id: 'p1', learner_student_id: 's1', status: 'active', created_at: hoursAgo(20) };
    assert.strictEqual(await harness({ bookings: [trial()], package_entitlements: [pkg] }).run(), 0);
  });

  it('skips trials that were not attended and learners who already booked a paid lesson', async () => {
    assert.strictEqual(await harness({ bookings: [trial({ status: 'no_show' })] }).run(), 0);
    assert.strictEqual(await harness({ bookings: [trial({ status: 'cancelled' })] }).run(), 0);
    const paid = { id: 'b2', student_id: 's1', booking_type: 'regular', status: 'confirmed', created_at: hoursAgo(5), scheduled_end: hoursAgo(-48) };
    assert.strictEqual(await harness({ bookings: [trial(), paid] }).run(), 0);
  });

  it('only once per learner even with two attended trials', async () => {
    const h = harness({ bookings: [trial(), trial({ id: 'b3', scheduled_end: hoursAgo(30) })] });
    assert.strictEqual(await h.run(), 1);
    assert.strictEqual(h.emails.length, 1);
  });

  it('retries a failing email an hour apart, 3 times at most, then sends the on-site notice only', async () => {
    const h = harness({ bookings: [trial()] }, { emailOk: false });
    await h.run();
    assert.strictEqual(h.emails.length, 1);
    assert.strictEqual(h.notices.length, 0, 'no on-site notice while the email may still go out');
    assert.strictEqual(h.db.events.get('trial_followup:s1')?.status, 'failed');

    h.clock.now += 10 * 60_000;
    await h.run();
    assert.strictEqual(h.emails.length, 1, 'the next 10-minute cron run waits for the hour');

    h.clock.now += 60 * 60_000;
    await h.run();
    h.clock.now += 61 * 60_000;
    await h.run();
    assert.strictEqual(h.emails.length, 3);
    assert.strictEqual(h.notices.length, 1, 'after the last try the family still gets the on-site notice');

    h.clock.now += 5 * 60 * 60_000;
    await h.run();
    assert.strictEqual(h.emails.length, 3, 'no fourth attempt');
    assert.strictEqual(h.notices.length, 1);
  });

  it('includes the teacher family summary and the placement result', async () => {
    const h = harness({
      bookings: [trial()],
      lesson_sessions: [{ id: 'ls1', booking_id: 'b1' }],
      lesson_notes: [{ session_id: 'ls1', family_summary: 'Read Al-Fatiha with care.' }],
      placement_tests: [{ learner_student_id: 's1', status: 'reviewed', admin_level: 'intermediate', suggested_level: 'beginner', created_at: hoursAgo(30) }]
    });
    await h.run();
    const body = h.notices[0].n.body.en;
    assert.ok(body.includes('Read Al-Fatiha with care.'), body);
    assert.ok(body.includes('intermediate level'), 'the admin-reviewed level wins');
    assert.ok(body.includes('Maryam'), 'a parent reads the child\'s name');
    assert.strictEqual(h.emails[0].toName, undefined, 'the parent is not greeted by the child\'s name');
  });

  it('reads warm and calm in both languages', () => {
    const n = trialFollowUpNotice({ learnerName: null, familySummary: null, level: 'beginner' });
    assert.ok(n.body.en.includes('We hope you enjoyed it'));
    assert.ok(n.body.ar.includes('المستوى المبتدئ'));
    for (const w of ['hurry', 'only', 'expire', 'last chance', 'discount']) assert.ok(!n.body.en.toLowerCase().includes(w), w);
  });

  it('runs from the reminder cron', () => {
    assert.match(fs.readFileSync('api/index.ts', 'utf8'), /process\.env\.VERCEL_ENV === 'production' \? await processTrialFollowUps\(cronClient\) : 0/);
  });
});
