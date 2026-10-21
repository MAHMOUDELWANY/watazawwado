import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { DateTime } from 'luxon';
import { processMonthlyProgressEmails, monthlyEmailsEnabled, reportMonthFor, isSendWindow, summaryLines } from '../server/notifications/monthlyProgress.js';
import { renderMonthlyProgressEmail } from '../server/notifications/emailTemplates.js';

/** A tiny stand-in for the Supabase client: completed bookings, and the notification_events claim/finalize RPCs. */
function fakeClient(bookings: Array<{ student_id: string }>) {
  const events = new Map<string, { status: string; token: string }>();
  const query = (table: string) => {
    const q: any = {
      _filters: [] as Array<(r: any) => boolean>,
      select() { return q; }, eq() { return q; }, not() { return q; }, gte() { return q; }, lt() { return q; }, limit() { return q; },
      in(col: string, vals: string[]) { q._filters.push((r: any) => vals.includes(r[col])); return q; },
      then(resolve: any) {
        const rows = table === 'bookings' ? bookings : [...events].map(([idempotency_key, e]) => ({ idempotency_key, status: e.status }));
        resolve({ data: rows.filter((r: any) => q._filters.every((f: any) => f(r))), error: null });
      }
    };
    return q;
  };
  return {
    events,
    from: query,
    rpc: async (name: string, args: any) => {
      if (name === 'claim_notification_event') {
        const prev = events.get(args.p_key);
        if (prev && prev.status !== 'failed') return { data: { claimed: false } };
        const token = `t-${Math.random()}`;
        events.set(args.p_key, { status: 'sending', token });
        return { data: { claimed: true, claim_token: token } };
      }
      if (name === 'finalize_notification_event') {
        const e = events.get(args.p_key);
        if (e && e.token === args.p_token) e.status = args.p_status;
        return { data: true };
      }
      return { data: null };
    }
  };
}

const accounts: Record<string, any> = {
  adult: { userId: 'u-adult', email: 'adult@example.com', name: 'Sara', viaParent: false },
  kid1: { userId: 'u-parent', email: 'parent@example.com', name: 'Yusuf', viaParent: true },
  kid2: { userId: 'u-parent', email: 'parent@example.com', name: 'Maryam', viaParent: true },
  optout: { userId: 'u-off', email: 'off@example.com', name: 'Omar', viaParent: false }
};
const deps = (sent: string[]) => ({
  resolve: async (_c: any, id: string) => accounts[id],
  emailLang: async () => 'en' as const,
  allowed: async (_c: any, userId: string | null | undefined) => userId !== 'u-off',
  send: async (o: any) => { sent.push(o.to); return { status: 'sent' } as any; }
});
const bookings = [{ student_id: 'adult' }, { student_id: 'adult' }, { student_id: 'kid1' }, { student_id: 'kid2' }, { student_id: 'kid2' }, { student_id: 'optout' }];
const now = DateTime.fromISO('2026-11-01T06:00:00Z');

describe('PR-09 monthly progress email', () => {
  it('is off unless the owner switches it on in production', () => {
    assert.strictEqual(monthlyEmailsEnabled({}), false);
    assert.strictEqual(monthlyEmailsEnabled({ VERCEL_ENV: 'production' }), false);
    assert.strictEqual(monthlyEmailsEnabled({ MONTHLY_PROGRESS_EMAILS: 'on' }), false);
    assert.strictEqual(monthlyEmailsEnabled({ VERCEL_ENV: 'production', MONTHLY_PROGRESS_EMAILS: 'on' }), true);
  });

  it('reports last month, in the first 5 days only', () => {
    assert.strictEqual(reportMonthFor(now), '2026-10');
    assert.strictEqual(reportMonthFor(DateTime.fromISO('2027-01-03T00:00:00Z')), '2026-12');
    assert.strictEqual(isSendWindow(now), true);
    assert.strictEqual(isSendWindow(DateTime.fromISO('2026-11-06T00:00:00Z')), false);
  });

  it('a dry run lists one email per account, skips opted-out accounts, and sends or records nothing', async () => {
    const client = fakeClient(bookings);
    const sent: string[] = [];
    const r = await processMonthlyProgressEmails(client, { now, dryRun: true }, deps(sent));
    assert.deepStrictEqual(r.recipients.map((x) => x.email).sort(), ['adult@example.com', 'parent@example.com']);
    assert.strictEqual(r.skipped, 1);
    assert.deepStrictEqual(r.recipients.find((x) => x.viaParent)!.learners.map((l) => [l.learnerName, l.lessons]), [['Yusuf', 1], ['Maryam', 2]]);
    assert.strictEqual(sent.length, 0);
    assert.strictEqual(client.events.size, 0);
  });

  it('never sends twice for the same month, and a failed send is retried', async () => {
    const client = fakeClient(bookings);
    const sent: string[] = [];
    const first = await processMonthlyProgressEmails(client, { now }, deps(sent));
    assert.strictEqual(first.sent, 2);
    const again = await processMonthlyProgressEmails(client, { now }, deps(sent));
    assert.strictEqual(again.sent, 0);
    assert.strictEqual(sent.length, 2, 'second run sends nothing');
    assert.strictEqual(client.events.get('monthly_progress_done:2026-10')?.status, 'sent', 'the month is marked finished');
    let reads = 0;
    const counting = { ...deps(sent), resolve: async (...a: any[]) => { reads++; return (deps(sent).resolve as any)(...a); } };
    await processMonthlyProgressEmails(client, { now }, counting);
    assert.strictEqual(reads, 0, 'a finished month is not rebuilt');

    const flaky = fakeClient([{ student_id: 'adult' }]);
    let fail = true;
    const d = { ...deps(sent), send: async () => (fail ? { status: 'failed' } : { status: 'sent' }) as any };
    assert.strictEqual((await processMonthlyProgressEmails(flaky, { now }, d)).sent, 0);
    fail = false;
    assert.strictEqual((await processMonthlyProgressEmails(flaky, { now }, d)).sent, 1, 'retried after a failure');
  });

  it('respects the batch limit so the daily email quota keeps room', async () => {
    const client = fakeClient(bookings);
    const sent: string[] = [];
    assert.strictEqual((await processMonthlyProgressEmails(client, { now, limit: 1 }, deps(sent))).sent, 1);
    assert.strictEqual((await processMonthlyProgressEmails(client, { now, limit: 1 }, deps(sent))).sent, 1, 'the next run carries on');
  });

  it('the email links to the report and says how to switch it off', () => {
    const mail = renderMonthlyProgressEmail({ name: '<b>Sara</b>', monthLabel: { en: 'October 2026', ar: 'أكتوبر 2026' }, lines: summaryLines({ viaParent: false, learners: [{ learnerId: 'a', learnerName: 'Sara', lessons: 3 }] }), reportPath: '/student/progress/report?month=2026-10', lang: 'en' });
    assert.ok(mail.html.includes('/student/progress/report?month=2026-10'));
    assert.ok(mail.html.includes('/student/account?tab=preferences'));
    assert.ok(!mail.html.includes('<b>Sara</b>'), 'names are escaped');
    assert.match(mail.text, /3 lessons/);
  });

  it('the cron sends only behind the switch; the admin preview is a dry run', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.ok(api.includes('if (cronClient && monthlyEmailsEnabled() && isSendWindow(DateTime.utc()))'));
    assert.ok(api.includes("app.get('/api/dashboard/admin/monthly-progress/preview', verifyTeacherAuth, requireSuperAdmin"));
    assert.ok(api.includes('processMonthlyProgressEmails(client, { month, dryRun: true, limit: 1000 })'));
  });
});
