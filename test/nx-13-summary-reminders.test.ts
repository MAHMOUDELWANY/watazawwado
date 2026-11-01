import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { DateTime } from 'luxon';
import { dueForReminder, processSummaryReminders, summaryReminderNotice } from '../server/notifications/summaryReminders.js';

const now = DateTime.fromISO('2026-11-01T12:00:00Z', { zone: 'utc' });
const lesson = (status: string, start: string, minutes = 30) => ({ status, scheduled_start: start, duration_minutes: minutes });

/** Minimal fake of the supabase client: every query resolves to the rows given per table. */
function fakeClient(tables: Record<string, any[]>, claimed = true) {
  const calls: any[] = [];
  const q = (rows: any[]) => {
    const p: any = Promise.resolve({ data: rows, error: null });
    for (const m of ['select', 'in', 'not', 'gte', 'lte', 'limit', 'eq']) p[m] = () => p;
    return p;
  };
  return {
    calls,
    from: (t: string) => q(tables[t] || []),
    rpc: async (name: string, args: any) => { calls.push([name, args]); return { data: name === 'claim_notification_event' ? { claimed, claim_token: 'tok' } : null }; },
  };
}

describe('NX-13 summary reminders', () => {
  it('reminds only between 3 and 48 hours after the lesson ended', () => {
    assert.strictEqual(dueForReminder(lesson('completed', '2026-11-01T08:00:00Z'), now), true);
    assert.strictEqual(dueForReminder(lesson('confirmed', '2026-11-01T10:00:00Z'), now), false, 'ended 1.5h ago');
    assert.strictEqual(dueForReminder(lesson('completed', '2026-10-30T08:00:00Z'), now), false, 'older than 48h');
    assert.strictEqual(dueForReminder(lesson('cancelled', '2026-11-01T08:00:00Z'), now), false);
    assert.strictEqual(dueForReminder(lesson('no_show', '2026-11-01T08:00:00Z'), now), false);
  });

  it('skips lessons that have a summary and notifies the teacher once for the rest', async () => {
    const client = fakeClient({
      bookings: [
        { id: 'b1', teacher_id: 't1', status: 'completed', scheduled_start: '2026-11-01T08:00:00Z', duration_minutes: 30, contact_name: 'Amina' },
        { id: 'b2', teacher_id: 't1', status: 'completed', scheduled_start: '2026-11-01T07:00:00Z', duration_minutes: 30, contact_name: 'Yusuf' },
      ],
      lesson_sessions: [{ id: 's2', booking_id: 'b2' }],
      lesson_notes: [{ session_id: 's2' }],
    });
    const sent: any[] = [];
    const r = await processSummaryReminders(client, now, async (_c, to, notice) => { sent.push([to.userId, notice.title.en]); });
    assert.deepStrictEqual(r, { sent: 1, skipped: 1 });
    assert.deepStrictEqual(sent, [['t1', 'A family is waiting for your summary']]);
    assert.ok(client.calls.some(([n, a]) => n === 'claim_notification_event' && a.p_key === 'summary_reminder:b1'));
  });

  it('does not send twice when the reminder was already claimed', async () => {
    const client = fakeClient({ bookings: [{ id: 'b1', teacher_id: 't1', status: 'completed', scheduled_start: '2026-11-01T08:00:00Z', duration_minutes: 30 }] }, false);
    let n = 0;
    const r = await processSummaryReminders(client, now, async () => { n++; });
    assert.strictEqual(n, 0);
    assert.strictEqual(r.sent, 0);
  });

  it('the notice is calm and bilingual, and the cron runs it on production only', () => {
    const n = summaryReminderNotice('Amina');
    assert.match(n.body.ar, /Amina/);
    assert.doesNotMatch(n.body.en + n.title.en, /late|overdue|warning/i);
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.match(api, /VERCEL_ENV === 'production'\) \{\s*try \{ summaryReminders = /);
    assert.match(fs.readFileSync('server/routes/teacherLoad.ts', 'utf8'), /homeworkRate30Days/);
  });
});
