import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { emailAllowed, loadPreferences, sanitizePreferences, DEFAULT_PREFERENCES } from '../server/notifications/preferences.js';

const clientWith = (row: any, fail = false) => ({
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => (fail ? { data: null, error: { message: 'boom' } } : { data: row, error: null }) }) }) })
});

describe('RN-07 notification preferences', () => {
  it('everything is on until the account switches something off', async () => {
    assert.deepStrictEqual(await loadPreferences(clientWith(null), 'u1'), DEFAULT_PREFERENCES);
    assert.strictEqual(await emailAllowed(clientWith({ follow_ups: false }), 'u1', 'follow_ups'), false);
    assert.strictEqual(await emailAllowed(clientWith({ follow_ups: false }), 'u1', 'renewal_reminders'), true);
    assert.strictEqual(await emailAllowed(clientWith(null, true), 'u1', 'progress_emails'), true, 'a read error never silences an email');
    assert.strictEqual(await emailAllowed(clientWith({ progress_emails: false }), null, 'progress_emails'), true, 'no account, nothing to look up');
  });

  it('accepts only the three known switches as booleans', () => {
    assert.deepStrictEqual(sanitizePreferences({ follow_ups: false, renewal_reminders: 'no', admin: true }), { follow_ups: false });
    assert.strictEqual(sanitizePreferences({}), null);
    assert.strictEqual(sanitizePreferences([true]), null);
  });

  it('booking and refund notices never ask (only notices with a preference can be silenced)', () => {
    const inbox = fs.readFileSync('server/notifications/inbox.ts', 'utf8');
    assert.ok(inbox.includes('!options.preference ||'));
    assert.ok(fs.readFileSync('server/notifications/lowBalance.ts', 'utf8').includes("{ email: true, preference: 'renewal_reminders' }"));
  });

  it('the profile shows the three switches and says booking emails always arrive', () => {
    const ui = fs.readFileSync('src/student/components/NotificationPreferences.tsx', 'utf8');
    assert.ok(ui.includes("role=\"switch\"") && ui.includes('aria-checked={on}'));
    assert.ok(ui.includes('Booking, lesson reminder and payment emails always arrive.'));
    assert.ok(fs.readFileSync('src/student/pages/StudentProfilePage.tsx', 'utf8').includes('<NotificationPreferences isAr={isAr} />'));
  });
});

describe('RN-07 endpoint', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('needs a signed-in family; teachers are refused; junk is rejected', async () => {
    const url = `${base}/api/student/notification-preferences`;
    assert.strictEqual((await fetch(url)).status, 401);
    assert.strictEqual((await fetch(url, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
    const got = await fetch(url, { headers: { Authorization: 'Bearer dev-student-token' } });
    if (got.status !== 503) {
      assert.strictEqual(got.status, 200);
      assert.deepStrictEqual(((await got.json()) as any).preferences, DEFAULT_PREFERENCES);
    }
    // The dev account has no real user id, so a save is refused before anything is written.
    const put = await fetch(url, { method: 'PUT', headers: { Authorization: 'Bearer dev-student-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ follow_ups: false }) });
    if (put.status !== 503) assert.strictEqual(put.status, 401);
  });
});
