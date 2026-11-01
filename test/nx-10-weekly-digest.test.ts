import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DateTime } from 'luxon';
import { digestParagraphs, digestWeek, isDigestDay, weeklyDigestEnabled, homeworkText, processWeeklyDigest } from '../server/notifications/weeklyDigest.js';
import { renderWeeklyDigestEmail } from '../server/notifications/emailTemplates.js';

describe('NX-10 weekly digest by email', () => {
  it('goes out on Sunday afternoon (UTC), on production unless switched off', () => {
    assert.strictEqual(isDigestDay(DateTime.fromISO('2026-11-08T13:00:00Z', { zone: 'utc' })), true);
    assert.strictEqual(isDigestDay(DateTime.fromISO('2026-11-08T09:00:00Z', { zone: 'utc' })), false);
    assert.strictEqual(isDigestDay(DateTime.fromISO('2026-11-07T13:00:00Z', { zone: 'utc' })), false);
    assert.strictEqual(weeklyDigestEnabled({ VERCEL_ENV: 'production' }), true);
    assert.strictEqual(weeklyDigestEnabled({ VERCEL_ENV: 'production', WEEKLY_DIGEST_EMAILS: 'off' }), false);
    assert.strictEqual(weeklyDigestEnabled({}), false, 'never from a test or local run');
    assert.strictEqual(digestWeek(DateTime.fromISO('2026-11-08T13:00:00Z', { zone: 'utc' })).key, '2026-W45');
  });

  it('one family email: each child, the teacher\'s words, the homework', () => {
    const p = digestParagraphs([
      { learnerId: 'a', learnerName: 'Amina', lessons: 2, summary: 'Great tajweed today.', homework: [homeworkText({ kind: 'recite', surah: 67, ayah_from: 1, ayah_to: 15, body: null })] },
      { learnerId: 'b', learnerName: 'Yusuf', lessons: 1, summary: null, homework: [] },
    ], true);
    assert.deepStrictEqual(p.map((x) => x.en), [
      'Amina took 2 lessons this week.', 'From the teacher: Great tajweed today.', 'Homework for next time: Surah Al-Mulk, ayat 1-15.',
      'Yusuf took 1 lesson this week.',
    ]);
    assert.strictEqual(p[0].ar, 'حصص Amina الأسبوع ده: درسين.', 'neutral for a boy or a girl');
    const mail = renderWeeklyDigestEmail({ name: null, paragraphs: p, lang: 'en' });
    assert.match(JSON.stringify(mail), /Your week with us/);
    assert.match(JSON.stringify(mail), /tab=preferences/, 'has the way to turn it off');
  });

  it('respects the progress-email switch and never sends twice', async () => {
    const sent: string[] = [];
    const tables: Record<string, any[]> = {
      bookings: [{ student_id: 's1' }, { student_id: 's1' }],
      lesson_notes: [], lesson_homework: [], notification_events: [],
    };
    const q = (rows: any[]) => { const p: any = Promise.resolve({ data: rows, error: null }); for (const m of ['select', 'eq', 'not', 'gte', 'lt', 'limit', 'in', 'is', 'order']) p[m] = () => p; return p; };
    const client = { from: (t: string) => q(tables[t] || []), rpc: async (n: string) => ({ data: n === 'claim_notification_event' ? { claimed: true, claim_token: 't' } : null }) };
    const deps = {
      resolve: async () => ({ userId: 'u1', email: 'fam@example.com', name: 'Amina', viaParent: true }) as any,
      emailLang: async () => 'en' as const,
      notify: async () => {},
      send: async (m: any) => { sent.push(m.to); return { status: 'sent' } as any; },
    };
    const now = DateTime.fromISO('2026-11-08T13:00:00Z', { zone: 'utc' });
    const off = await processWeeklyDigest(client, { now }, { ...deps, allowed: async () => false });
    assert.strictEqual(off.sent, 0);
    const on = await processWeeklyDigest(client, { now }, { ...deps, allowed: async () => true });
    assert.strictEqual(on.sent, 1);
    assert.deepStrictEqual(sent, ['fam@example.com']);
  });
});
