import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { parseProgram, isJoinable } from '../server/routes/programs.js';

describe('NX-08 seasonal programs', () => {
  it('a program needs both titles and a start on or before its end', () => {
    const ok = parseProgram({ title_en: 'Ramadan challenge', title_ar: 'تحدي رمضان', starts_on: '2027-02-08', ends_on: '2027-03-09', is_published: true });
    assert.ok(ok.ok && ok.value.is_published === true && ok.value.description_en === null);
    for (const bad of [
      { title_en: 'x', title_ar: 'تحدي', starts_on: '2027-02-08', ends_on: '2027-03-09' },
      { title_en: 'Ramadan', title_ar: 'رمضان', starts_on: '2027-03-09', ends_on: '2027-02-08' },
      { title_en: 'Ramadan', title_ar: 'رمضان', starts_on: '8/2/2027', ends_on: '2027-03-09' },
      { title_en: 'Ramadan', title_ar: 'رمضان', starts_on: '2027-02-30', ends_on: '2027-03-09' },
    ]) assert.strictEqual(parseProgram(bad).ok, false, JSON.stringify(bad));
  });

  it('families can join a published program until its last day', () => {
    assert.strictEqual(isJoinable({ is_published: true, ends_on: '2026-11-30' }, '2026-11-30'), true);
    assert.strictEqual(isJoinable({ is_published: true, ends_on: '2026-11-29' }, '2026-11-30'), false);
    assert.strictEqual(isJoinable({ is_published: false, ends_on: '2026-12-30' }, '2026-11-30'), false);
  });

  it('the tables are server-only', () => {
    const sql = fs.readFileSync('supabase/migrations/20261101000002_seasonal_programs.sql', 'utf8');
    assert.match(sql, /REVOKE ALL ON public\.seasonal_programs FROM anon, authenticated/);
    assert.match(sql, /REVOKE ALL ON public\.program_signups FROM anon, authenticated/);
    assert.match(sql, /PRIMARY KEY \(program_id, student_id\)/, 'a learner joins once');
  });
});

describe('NX-08 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('only the super admin manages programs; guests see nothing', async () => {
    assert.strictEqual((await fetch(`${base}/api/student/programs`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/programs`)).status, 401);
    const teacher = await fetch(`${base}/api/dashboard/programs`, { headers: { Authorization: 'Bearer dev-teacher-token' } });
    if (teacher.status !== 401) assert.strictEqual(teacher.status, 403);
  });
});
