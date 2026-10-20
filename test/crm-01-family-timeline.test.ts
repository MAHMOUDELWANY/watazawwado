import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';
import { buildTimeline } from '../server/routes/crm.js';

describe('CRM-01 family timeline', () => {
  it('builds one newest-first timeline for the account and each child', () => {
    const ev = buildTimeline({
      students: [
        { id: 'p', name: 'Amina', created_at: '2026-10-01T10:00:00Z' },
        { id: 'c', name: 'Yusuf', created_at: '2026-10-02T10:00:00Z' }
      ],
      placements: [{ learner_student_id: 'c', service_id: 'quran', created_at: '2026-10-03T10:00:00Z', submitted_at: '2026-10-03T10:20:00Z', suggested_level: 'beginner' }],
      bookings: [
        { id: 'b1', student_id: 'c', booking_type: 'trial', status: 'completed', reference_code: 'WT-1', created_at: '2026-10-04T10:00:00Z', scheduled_start: '2026-10-06T10:00:00Z' },
        { id: 'b2', student_id: 'c', booking_type: 'regular', status: 'confirmed', created_at: '2026-10-08T10:00:00Z', scheduled_start: '2026-10-20T10:00:00Z' }
      ],
      payments: [{ student_id: 'c', amount: 34, currency: 'USD', status: 'refunded', created_at: '2026-10-07T10:00:00Z', confirmed_at: '2026-10-07T10:05:00Z', updated_at: '2026-10-09T10:00:00Z' }],
      notes: [{ student_id: 'c', family_summary: 'Read with care.', private_notes: 'NEVER SHOWN', created_at: '2026-10-06T11:00:00Z' }],
      followUps: [{ status: 'sent', updated_at: '2026-10-07T11:00:00Z' }, { status: 'failed', updated_at: '2026-10-07T12:00:00Z' }]
    });

    const times = ev.map((e) => Date.parse(e.at));
    assert.deepStrictEqual(times, [...times].sort((a, b) => b - a), 'newest first');
    const titles = ev.map((e) => e.title.en);
    for (const t of ['Account created', 'Placement test finished', 'Free trial booked', 'Free trial attended', 'Lesson booked', 'Payment confirmed', 'Refunded', 'Teacher note added', 'Trial follow-up sent']) {
      assert.ok(titles.includes(t), `missing "${t}"`);
    }
    assert.ok(!titles.includes('Lesson confirmed'), 'a future lesson has no outcome yet');
    assert.strictEqual(titles.filter((t) => t === 'Trial follow-up sent').length, 1, 'failed sends are not shown');
    assert.strictEqual(ev.find((e) => e.title.en === 'Free trial attended')?.learnerName, 'Yusuf');
    assert.ok(!JSON.stringify(ev).includes('NEVER SHOWN'), 'private teacher notes never appear');
  });

  describe('endpoint', () => {
    let server: http.Server;
    let base: string;
    before(async () => {
      await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
    });
    after(async () => { await new Promise<void>((r) => server.close(() => r())); });

    it('is for the super admin only', async () => {
      const path = '/api/dashboard/admin/students/00000000-0000-4000-8000-000000000000/timeline';
      assert.strictEqual((await fetch(base + path)).status, 401);
      assert.strictEqual((await fetch(base + path, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
      const asAdmin = await fetch(base + path, { headers: { Authorization: 'Bearer dev-super-admin-token' } });
      assert.ok([404, 503].includes(asAdmin.status), `unknown student: ${asAdmin.status}`);
      const bad = await fetch(`${base}/api/dashboard/admin/students/not-an-id/timeline`, { headers: { Authorization: 'Bearer dev-super-admin-token' } });
      assert.ok([400, 503].includes(bad.status));
    });
  });
});
