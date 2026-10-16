import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateReport, buildStudentMap, type ReportRow } from '../server/curriculum/reports';
import { lesson01 } from '../src/curriculum/content/zad-kids/l01-the-visitor-in-white';

const STUDENT = '11111111-2222-3333-4444-555555555555';
const base = { studentId: STUDENT, subject: 'zad-kids', lessonNumber: 1, fromPage: 1, toPage: 5 };

describe('Teacher report validation', () => {
  it('accepts a valid report and keeps only the lesson’s own outcomes', () => {
    const r = validateReport({ ...base, strengths: [lesson01.outcomes[0], 'made up'], toReinforce: [lesson01.outcomes[1], lesson01.outcomes[0]], note: '  good  ' });
    assert.equal(r.ok, true);
    if (r.ok !== true) return;
    assert.deepEqual(r.value.strengths, [lesson01.outcomes[0]]);
    assert.deepEqual(r.value.toReinforce, [lesson01.outcomes[1]], 'an outcome cannot be both strong and to reinforce');
    assert.equal(r.value.note, 'good');
  });

  it('rejects unknown lessons, bad students and page ranges outside the lesson', () => {
    assert.equal(validateReport({ ...base, studentId: 'x' }).ok, false);
    assert.equal(validateReport({ ...base, lessonNumber: 99 }).ok, false);
    assert.equal(validateReport({ ...base, fromPage: 4, toPage: 3 }).ok, false);
    assert.equal(validateReport({ ...base, toPage: lesson01.pages.length + 1 }).ok, false);
    assert.equal(validateReport({ ...base, fromPage: 0 }).ok, false);
  });

  it('cleans the game result', () => {
    const r = validateReport({ ...base, gameResult: { iman: { correct: 2, total: 2 }, bad: { correct: 5, total: 2 }, 'DROP TABLE': { correct: 1, total: 1 } } });
    assert.equal(r.ok, true);
    if (r.ok !== true) return;
    assert.deepEqual(r.value.gameResult, { iman: { correct: 2, total: 2 } });
  });
});

describe('Student map (puzzle)', () => {
  const row = (from: number, to: number, at: string, extra: Partial<ReportRow> = {}): ReportRow => ({
    subject: 'zad-kids', lesson_number: 1, from_page: from, to_page: to, strengths: [], to_reinforce: [], note: null, game_result: null, created_at: at, ...extra,
  });

  it('adds pages from every class and marks the lesson complete when all pages are covered', () => {
    const total = lesson01.pages.length;
    const partial = buildStudentMap([row(1, 5, '2026-10-16T10:00:00Z'), row(4, 8, '2026-10-17T10:00:00Z')]);
    const l1 = partial[0].lessons[0];
    assert.deepEqual(l1.coveredPages, [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.equal(l1.complete, false);
    assert.equal(partial[0].coveredLessons, 1);
    const full = buildStudentMap([row(1, 8, '2026-10-16T10:00:00Z'), row(9, total, '2026-10-18T10:00:00Z', { strengths: ['x'], note: 'latest' })]);
    assert.equal(full[0].lessons[0].complete, true);
    assert.equal(full[0].lessons[0].lastNote, 'latest', 'the latest report wins');
  });

  it('shows the whole plan as pieces and no subjects without reports', () => {
    const map = buildStudentMap([row(1, 2, '2026-10-16T10:00:00Z')]);
    assert.equal(map.length, 1);
    assert.equal(map[0].lessons.length, 37);
    assert.equal(buildStudentMap([]).length, 0);
  });

  it('a draft lesson is not opened to students', () => {
    assert.equal(buildStudentMap([row(1, 2, '2026-10-16T10:00:00Z')])[0].lessons[0].available, lesson01.reviewed);
  });
});

describe('Curriculum routes and table stay locked down', () => {
  const routes = readFileSync('server/routes/curriculum.ts', 'utf8');
  const sql = readFileSync('supabase/migrations/20261016000006_curriculum_lesson_reports.sql', 'utf8');

  it('every route checks auth and teacher ownership', () => {
    assert.match(routes, /post\('\/api\/dashboard\/curriculum\/reports', verifyTeacherAuth/);
    assert.match(routes, /get\('\/api\/dashboard\/curriculum\/students\/:id', verifyTeacherAuth/);
    assert.match(routes, /get\('\/api\/student\/curriculum', verifyStudentAuth/);
    assert.equal((routes.match(/teacherMayTeach\(client, req\.teacherUser/g) || []).length, 2);
  });

  it('students get nothing without a booking', () => {
    assert.match(routes, /if \(!booked\) return res\.json\(\{ booked: false, learners: \[\] \}\)/);
  });

  it('the table is server-only', () => {
    assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /REVOKE ALL ON TABLE public\.curriculum_lesson_reports FROM anon/);
    assert.match(sql, /REVOKE ALL ON TABLE public\.curriculum_lesson_reports FROM authenticated/);
    assert.doesNotMatch(sql, /CREATE POLICY/);
  });
});
