import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { buildMonthlyReport, buildLessonTimeline, REPORT_MONTH_RE } from '../server/routes/progress.js';

const item = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id, date, durationMinutes: 45, subject: { id: 'tajweed', en: 'Tajweed', ar: 'التجويد', color: '#087D91' }, teacherName: 'Ustadh A', familySummary: null, nextSteps: null, ...extra
});

describe('PR-08 monthly report builder', () => {
  it('counts lessons, minutes and weeks of the month in the learner time zone', () => {
    const r = buildMonthlyReport({
      month: '2026-10',
      timezone: 'Africa/Cairo',
      items: [
        item('a', '2026-10-01T08:00:00Z'),
        item('b', '2026-10-02T08:00:00Z'),
        item('c', '2026-10-15T08:00:00Z', { familySummary: 'Good focus.', nextSteps: 'Revise surah' }),
        item('late', '2026-10-31T23:30:00Z') // already 1 November in Cairo
      ],
      milestones: [
        { id: 'm1', kind: 'surah_memorized', title_en: 'Al-Mulk', title_ar: 'الملك', reached_at: '2026-10-20T10:00:00Z' },
        { id: 'm0', kind: 'custom', title_en: 'Old', title_ar: 'قديم', reached_at: '2026-09-10T10:00:00Z' }
      ]
    });
    const ids = r.lessons.list.map((l) => l.id);
    assert.ok(!ids.includes('late'), 'a lesson that is November in Cairo is not October');
    assert.ok(ids.includes('a') && ids.includes('b') && ids.includes('c'));
    assert.strictEqual(r.lessons.minutes, r.lessons.count * 45);
    assert.ok(r.lessons.weeksWithLesson >= 2);
    assert.deepStrictEqual(r.milestones.map((m) => m.id), ['m1']);
    assert.strictEqual(r.summaries.length, 1);
    assert.strictEqual(r.nextSteps, 'Revise surah');
  });

  it('condenses long summaries and keeps the six latest', () => {
    const long = 'x'.repeat(500);
    const items = Array.from({ length: 8 }, (_, i) => item(`s${i}`, `2026-10-${String(i + 1).padStart(2, '0')}T08:00:00Z`, { familySummary: long }));
    const r = buildMonthlyReport({ month: '2026-10', timezone: 'UTC', items, milestones: [] });
    assert.strictEqual(r.summaries.length, 6);
    assert.ok(r.summaries.every((s) => s.text.length <= 320 && s.text.endsWith('…')));
  });

  it('the timeline gives the report every lesson, not one page', () => {
    const bookings = Array.from({ length: 30 }, (_, i) => ({ id: `b${i}`, status: 'completed', service_id: 'tajweed', scheduled_start: new Date(Date.UTC(2026, 9, 1, i)).toISOString() }));
    assert.strictEqual(buildLessonTimeline({ bookings, lessonSessions: [], lessonNotes: [], page: -1 }).items.length, 30);
    assert.ok(REPORT_MONTH_RE.test('2026-10') && !REPORT_MONTH_RE.test('2026-13') && !REPORT_MONTH_RE.test('26-10'));
  });

  it('the page says it is a progress report, not a certificate, and only the report prints', () => {
    const page = fs.readFileSync('src/student/pages/StudentProgressReportPage.tsx', 'utf8');
    assert.ok(page.includes('This is a progress report, not a certificate.') && page.includes('هذا تقرير متابعة للتقدّم، وليس شهادة.'));
    assert.ok(page.includes('id="progress-report"'));
    assert.match(fs.readFileSync('src/index.css', 'utf8'), /#progress-report, #progress-report \* \{ visibility: visible; \}/);
    assert.ok(fs.readFileSync('src/student/StudentApp.tsx', 'utf8').includes('path="/progress/report"'));
  });
});

describe('PR-08 report endpoint', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('is for the family only', async () => {
    const url = `${base}/api/student/progress/report?month=2026-10`;
    assert.strictEqual((await fetch(url)).status, 401);
    assert.strictEqual((await fetch(url, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
    const foreign = await fetch(`${url}&learnerId=99999999-9999-4999-8999-999999999999`, { headers: { Authorization: 'Bearer dev-student-token' } });
    if (foreign.status !== 503) assert.strictEqual(foreign.status, 403);
  });
});
