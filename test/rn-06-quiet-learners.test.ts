import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { DateTime } from 'luxon';
import { processQuietLearners, quietEmailsEnabled, isQuietRunHour, quietNotice } from '../server/notifications/quietLearners.js';

const now = DateTime.fromISO('2026-11-20T09:00:00Z');
const daysAgo = (n: number) => now.minus({ days: n }).toISO()!;

/** Bookings, notification_events and the claim/finalize RPCs, enough for the job. */
function fakeClient(bookings: any[]) {
  const events = new Map<string, { status: string; token: string; updated_at: string }>();
  const query = (table: string) => {
    const filters: Array<(r: any) => boolean> = [];
    const q: any = {
      select: () => q, order: () => q, limit: () => q, not: () => q, maybeSingle: () => Promise.resolve({ data: null }),
      eq(c: string, v: any) { filters.push((r) => r[c] === v); return q; },
      neq(c: string, v: any) { filters.push((r) => r[c] !== v); return q; },
      in(c: string, v: any[]) { filters.push((r) => v.includes(r[c])); return q; },
      gte(c: string, v: string) { filters.push((r) => String(r[c]) >= v); return q; },
      ilike(c: string, v: string) { filters.push((r) => String(r[c] || '').toLowerCase() === v.replace(/\\(.)/g, '$1').toLowerCase()); return q; },
      like(c: string, v: string) { const prefix = v.replace(/%$/, '').replace(/\\(.)/g, '$1'); filters.push((r) => String(r[c]).startsWith(prefix)); return q; },
      then(resolve: any) {
        const rows = table === 'bookings' ? bookings : table === 'notification_events'
          ? [...events].map(([idempotency_key, e]) => ({ idempotency_key, ...e })) : [];
        resolve({ data: rows.filter((r) => filters.every((f) => f(r))), error: null });
      }
    };
    return q;
  };
  return {
    events,
    from: query,
    rpc: async (name: string, a: any) => {
      if (name === 'claim_notification_event') {
        if (events.get(a.p_key) && events.get(a.p_key)!.status !== 'failed') return { data: { claimed: false } };
        events.set(a.p_key, { status: 'sending', token: 't', updated_at: now.toISO()! });
        return { data: { claimed: true, claim_token: 't' } };
      }
      const e = events.get(a.p_key);
      if (e) e.status = a.p_status;
      return { data: true };
    }
  };
}

const accounts: Record<string, any> = {
  quiet: { userId: 'u1', email: 'quiet@example.com', name: 'Sara', viaParent: false },
  active: { userId: 'u2', email: 'active@example.com', name: 'Omar', viaParent: false },
  trialOnly: { userId: 'u3', email: 'trial@example.com', name: 'Lina', viaParent: false },
  kidQuiet: { userId: 'u4', email: 'family@example.com', name: 'Yusuf', viaParent: true }
};
const bookings = [
  { student_id: 'quiet', status: 'completed', booking_type: 'single', scheduled_start: daysAgo(30), contact_email: 'quiet@example.com' },
  { student_id: 'active', status: 'completed', booking_type: 'single', scheduled_start: daysAgo(40), contact_email: 'active@example.com' },
  { student_id: 'active', status: 'confirmed', booking_type: 'single', scheduled_start: daysAgo(-3), contact_email: 'active@example.com' },
  { student_id: 'trialOnly', status: 'completed', booking_type: 'trial', scheduled_start: daysAgo(30), contact_email: 'trial@example.com' },
  // Yusuf is quiet, but his sister (same family email) had a lesson last week.
  { student_id: 'kidQuiet', status: 'completed', booking_type: 'single', scheduled_start: daysAgo(35), contact_email: 'family@example.com' },
  { student_id: 'kidSister', status: 'completed', booking_type: 'single', scheduled_start: daysAgo(6), contact_email: 'family@example.com' }
];
const deps = (log: string[]) => ({
  resolve: async (_c: any, id: string) => accounts[id] || { userId: null, email: null, name: null, viaParent: false },
  emailLang: async () => 'en' as const,
  allowed: async () => true,
  notify: async () => { log.push('notice'); },
  send: async (o: any) => { log.push(`email:${o.to}`); return { status: 'sent' } as any; },
  task: async (_c: any, t: any) => { log.push(`task:${t.source}`); return true; }
});

describe('RN-06 "we miss you"', () => {
  it('is off unless switched on in production, and runs once a day', () => {
    assert.strictEqual(quietEmailsEnabled({ VERCEL_ENV: 'production' }), false);
    assert.strictEqual(quietEmailsEnabled({ VERCEL_ENV: 'production', QUIET_LEARNER_EMAILS: 'on' }), true);
    assert.strictEqual(isQuietRunHour(now), true);
    assert.strictEqual(isQuietRunHour(now.plus({ hours: 1 })), false);
  });

  it('only paid learners quiet for 21 days, not trial-only, not booked again, not a family with another active child', async () => {
    const log: string[] = [];
    const r = await processQuietLearners(fakeClient(bookings), { now, dryRun: true }, deps(log));
    assert.deepStrictEqual(r.candidates.map((c) => c.email), ['quiet@example.com']);
    assert.deepStrictEqual(log, [], 'the dry run sends nothing');
  });

  it('sends one note, one email and one admin task, then not again within 60 days', async () => {
    const client = fakeClient(bookings);
    const log: string[] = [];
    assert.strictEqual((await processQuietLearners(client, { now }, deps(log))).sent, 1);
    assert.deepStrictEqual(log, ['notice', 'email:quiet@example.com', 'task:quiet_learner']);
    assert.strictEqual((await processQuietLearners(client, { now: now.plus({ days: 1 }) }, deps(log))).sent, 0, 'next day: nothing');
    await processQuietLearners(client, { now: now.plus({ days: 59 }) }, deps(log));
    assert.strictEqual(log.filter((l) => l === 'email:quiet@example.com').length, 1, 'day 59: Sara is not written to again (others may be quiet by then)');
  });

  it('speaks as the team, in both languages, with the child\'s name for a family', () => {
    const n = quietNotice('Yusuf', true);
    assert.match(n.body.en, /Yusuf/);
    assert.match(n.body.ar, /Yusuf/);
    assert.ok(!/Mahmoud|محمود/.test(JSON.stringify(quietNotice(null, false))));
  });

  it('the cron sends only behind the switch; the admin preview is a dry run', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.ok(api.includes('if (cronClient && quietEmailsEnabled() && isQuietRunHour(DateTime.utc()))'));
    assert.ok(api.includes("processQuietLearners(client, { dryRun: true, limit: 500 })"));
  });
});
