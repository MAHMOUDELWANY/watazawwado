import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { parseHomework, cleanHomeworkSuggestions, MAX_HOMEWORK } from '../server/routes/homework.js';
import { SURAHS, quranLink } from '../src/lib/surahs.js';
import { homeworkLine } from '../src/lib/homework.js';

describe('NX-02 homework rules', () => {
  it('the surah list is complete (114 surahs, 6236 ayat)', () => {
    assert.strictEqual(SURAHS.length, 114);
    assert.strictEqual(SURAHS.reduce((a, s) => a + s.ayat, 0), 6236);
    assert.strictEqual(SURAHS[66].en, 'Al-Mulk');
    assert.strictEqual(SURAHS[66].ayat, 30);
    assert.strictEqual(quranLink(67, 1, 15), 'https://quran.com/67/1-15');
    assert.strictEqual(quranLink(1, 3, 3), 'https://quran.com/1/3');
  });

  it('accepts a valid range, drops empty free rows, and refuses bad input', () => {
    const ok = parseHomework([{ kind: 'recite', surah: 67, ayah_from: '1', ayah_to: 15 }, { kind: 'task', body: '  ' }, { kind: 'review', body: 'Lesson 2' }]);
    assert.ok(ok.ok);
    assert.deepStrictEqual(ok.ok && ok.value.map((v) => v.kind), ['recite', 'review']);
    assert.deepStrictEqual(parseHomework(undefined), { ok: true, value: [] });
    for (const bad of [
      'x',
      [{ kind: 'sing' }],
      [{ kind: 'recite', surah: 115, ayah_from: 1, ayah_to: 2 }],
      [{ kind: 'recite', surah: 67, ayah_from: 10, ayah_to: 5 }],
      [{ kind: 'recite', surah: 67, ayah_from: 1, ayah_to: 31 }],
      [{ kind: 'task', body: 'x'.repeat(501) }],
      Array.from({ length: MAX_HOMEWORK + 1 }, () => ({ kind: 'task', body: 'read' })),
    ]) {
      assert.strictEqual(parseHomework(bad).ok, false, JSON.stringify(bad).slice(0, 60));
    }
  });

  it("Jalila's suggestions become at most 3 clean lines", () => {
    assert.deepStrictEqual(cleanHomeworkSuggestions('1. Read **page 4**\n- Recite Al-Fatiha\n\n• Write 3 words\n4) extra'), ['Read page 4', 'Recite Al-Fatiha', 'Write 3 words']);
  });

  it('the family line names the surah and range and links to quran.com', () => {
    const hw: any = { kind: 'recite', surah: 67, ayah_from: 1, ayah_to: 15, body: null };
    assert.deepStrictEqual(homeworkLine(hw, true), { title: 'سورة الملك، من آية ١ لـ ١٥', note: null, href: 'https://quran.com/67/1-15', external: true });
    assert.strictEqual(homeworkLine(hw, false).title, 'Surah Al-Mulk, ayat 1-15');
    assert.strictEqual(homeworkLine({ kind: 'review', body: 'Lesson 2' } as any, false).href, '/student/curriculum');
  });

  it('the table is server-only and calm (no due dates, no scores)', () => {
    const sql = fs.readFileSync('supabase/migrations/20261101000000_lesson_homework.sql', 'utf8');
    assert.match(sql, /REVOKE ALL ON public\.lesson_homework FROM anon, authenticated/);
    assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
    assert.doesNotMatch(sql, /due_|score|points/);
    const card = fs.readFileSync('src/student/components/HomeworkCard.tsx', 'utf8');
    assert.doesNotMatch(card, /overdue|\blate\b|متأخر/i);
    assert.match(card, /useReducedMotion/);
  });

  it('the summary route saves homework and the 12-hour reminder mentions it', () => {
    const progress = fs.readFileSync('server/routes/progress.ts', 'utf8');
    assert.match(progress, /parseHomework\(req\.body\?\.homework\)/);
    assert.match(progress, /insertHomework\(client/);
    const routes = fs.readFileSync('server/routes/homework.ts', 'utf8');
    assert.doesNotMatch(routes, /hw\.teacher_id !== req\.teacherUser/, 'a reassigned teacher cannot review');
    const reminders = fs.readFileSync('server/notifications/reminderEngine.ts', 'utf8');
    assert.match(reminders, /from\('lesson_homework'\)/);
  });
});

describe('NX-02 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('guests get nothing', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    assert.strictEqual((await fetch(`${base}/api/student/homework`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/student/homework/${id}/done`, { method: 'POST' })).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/students/${id}/homework`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/homework/${id}/review`, { method: 'POST' })).status, 401);
  });

  it('a teacher review needs a known choice', async () => {
    const r = await fetch(`${base}/api/dashboard/homework/00000000-0000-4000-8000-000000000000/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer dev-teacher-token' }, body: JSON.stringify({ review: 'great' }),
    });
    if (r.status !== 401 && r.status !== 503) assert.strictEqual(r.status, 400);
  });
});
