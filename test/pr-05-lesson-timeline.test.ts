import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { buildLessonTimeline, FAMILY_SUMMARY_COLUMNS } from '../server/routes/progress.js';
import { achievementLabels, arLessonCount } from '../src/student/components/progress/LessonTimeline.js';

const T = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('PR-05 lesson timeline builder', () => {
  const bookings = [
    { id: 'b1', service_id: 'tajweed', status: 'completed', scheduled_start: '2026-10-01T10:00:00Z', duration_minutes: 45, teacher_id: T, booking_type: 'regular' },
    { id: 'b2', service_id: 'tajweed', status: 'completed', scheduled_start: '2026-10-08T10:00:00Z', duration_minutes: 45, teacher_id: T, booking_type: 'regular' },
    { id: 'b3', service_id: 'tajweed', status: 'cancelled', scheduled_start: '2026-10-09T10:00:00Z', teacher_id: T },
    { id: 'b4', service_id: 'quran-reading', status: 'completed', scheduled_start: '2026-09-20T10:00:00Z', duration_minutes: 30, teacher_id: T, booking_type: 'trial' }
  ];
  const sessions = [
    { id: 's1', booking_id: 'b1', attendance: 'attended' },
    { id: 's2', booking_id: 'b2', attendance: 'missed' }
  ];
  const notes = [
    { id: 'n1', session_id: 's1', family_summary: 'Great work on madd.', achievements: ['Madd rules'], next_steps: 'Revise page 4', private_notes: 'TEACHER ONLY', created_at: '2026-10-01T11:00:00Z' }
  ];

  it('lists attended lessons newest first, once each, skipping missed and cancelled ones', () => {
    const t = buildLessonTimeline({ bookings, lessonSessions: sessions, lessonNotes: notes, teacherNamesById: new Map([[T, 'Ustadha Afnan']]) });
    assert.deepStrictEqual(t.items.map((i) => i.id), ['session:s1', 'booking:b4']);
    assert.strictEqual(t.total, 2);
    const first = t.items[0];
    assert.strictEqual(first.familySummary, 'Great work on madd.');
    assert.strictEqual(first.nextSteps, 'Revise page 4');
    assert.strictEqual(first.teacherName, 'Ustadha Afnan');
    assert.strictEqual(t.items[1].bookingType, 'trial');
  });

  it('never carries private notes', () => {
    const t = buildLessonTimeline({ bookings, lessonSessions: sessions, lessonNotes: notes });
    assert.ok(!JSON.stringify(t).includes('TEACHER ONLY'));
    assert.ok(!FAMILY_SUMMARY_COLUMNS.includes('private_notes'), 'the query never selects them either');
  });

  it('pages 20 at a time', () => {
    const many = Array.from({ length: 45 }, (_, i) => ({ id: `x${i}`, service_id: 'tajweed', status: 'completed', scheduled_start: new Date(Date.UTC(2026, 0, 1 + i)).toISOString() }));
    const p1 = buildLessonTimeline({ bookings: many, lessonSessions: [], lessonNotes: [] });
    const p3 = buildLessonTimeline({ bookings: many, lessonSessions: [], lessonNotes: [], page: 3 });
    assert.strictEqual(p1.items.length, 20);
    assert.ok(p1.hasMore);
    assert.strictEqual(p3.items.length, 5);
    assert.ok(!p3.hasMore);
    assert.strictEqual(p1.items[0].id, 'booking:x44');
  });

  it('helpers: achievement labels and Arabic counting', () => {
    assert.deepStrictEqual(achievementLabels(['A', { title: 'B' }, { label: ' ' }, 3]), ['A', 'B']);
    assert.deepStrictEqual(achievementLabels('Only one'), ['Only one']);
    assert.strictEqual(arLessonCount(1), 'حصة واحدة');
    assert.strictEqual(arLessonCount(2), 'حصتين');
    assert.strictEqual(arLessonCount(5), '٥ حصص');
    assert.strictEqual(arLessonCount(25), '٢٥ حصة');
  });

  it('sits on the progress page under the path', () => {
    const page = fs.readFileSync('src/student/pages/StudentProgressPage.tsx', 'utf8');
    assert.ok(page.includes('<LessonTimeline learnerId={data.learner.id} isAr={isAr} timezone={viewerTz} />'));
  });
});

describe('PR-05 timeline endpoint', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('needs a family account and only shows learners of that family', async () => {
    const url = `${base}/api/student/progress/timeline`;
    assert.strictEqual((await fetch(url)).status, 401);
    assert.strictEqual((await fetch(url, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
    const foreign = await fetch(`${url}?learnerId=99999999-9999-4999-8999-999999999999`, { headers: { Authorization: 'Bearer dev-student-token' } });
    if (foreign.status !== 503) assert.strictEqual(foreign.status, 403);
    const own = await fetch(url, { headers: { Authorization: 'Bearer dev-student-token' } });
    if (own.status === 503) return;
    assert.strictEqual(own.status, 200);
    const body: any = await own.json();
    assert.ok(Array.isArray(body.items) && typeof body.hasMore === 'boolean');
  });
});
