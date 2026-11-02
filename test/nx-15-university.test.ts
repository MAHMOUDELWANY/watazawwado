import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { canTeach, earnsLicence, subjectFor, UNIVERSITY_SUBJECTS } from '../server/routes/university.js';

/** A fake client: teacher_subjects answers with `status` for the given email and subject, or an error. */
function fakeClient(rows: Record<string, 'licensed' | 'training'>, fail = false) {
  return {
    from: (table: string) => {
      const f: Record<string, any> = {};
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { f[c] = v; return b; },
        maybeSingle: async () => {
          if (table === 'profiles') return { data: f.id === 'u1' ? { email: 'teacher@example.com' } : null };
          if (fail) return { data: null, error: { message: 'down' } };
          const status = rows[`${f.teacher_email}|${f.subject}`];
          return { data: status ? { status } : null, error: null };
        },
      };
      return b;
    },
    auth: { admin: { getUserById: async () => ({ data: null }) } },
  };
}

describe('NX-15 Watazawwado University', () => {
  it('maps services and retired services to the eight subjects', () => {
    assert.strictEqual(UNIVERSITY_SUBJECTS.length, 8);
    assert.strictEqual(subjectFor('tajweed'), 'tajweed');
    assert.strictEqual(subjectFor('quran-revision'), 'quran-memorization');
    assert.strictEqual(subjectFor('arabic-foundations'), 'modern-standard-arabic');
    assert.strictEqual(subjectFor('fiqh'), null);
    assert.strictEqual(subjectFor(null), null);
  });

  it('a teacher teaches only licensed subjects (by user id or email)', async () => {
    const client = fakeClient({ 'teacher@example.com|tajweed': 'licensed', 'teacher@example.com|english': 'training' });
    assert.strictEqual(await canTeach(client, 'u1', 'tajweed'), true);
    assert.strictEqual(await canTeach(client, 'Teacher@Example.com', 'tajweed'), true);
    assert.strictEqual(await canTeach(client, 'u1', 'english'), false, 'training is not a licence');
    assert.strictEqual(await canTeach(client, 'u1', 'seerah'), false, 'no row, no licence');
    assert.strictEqual(await canTeach(client, 'u1', 'quran-revision'), false, 'retired service needs memorization');
  });

  it('subjects outside the catalog and a failed lookup never block', async () => {
    assert.strictEqual(await canTeach(fakeClient({}), 'u1', 'islamic-studies'), true);
    assert.strictEqual(await canTeach(fakeClient({}, true), 'u1', 'tajweed'), true);
  });

  it('the test and the observed lesson together earn the subject', () => {
    assert.strictEqual(earnsLicence({ test_passed_at: 'x', observed_passed_at: null }), false);
    assert.strictEqual(earnsLicence({ test_passed_at: null, observed_passed_at: 'x' }), false);
    assert.strictEqual(earnsLicence({ test_passed_at: 'x', observed_passed_at: 'y' }), true);
  });

  it('the table is server-only and existing teachers keep their subjects', () => {
    const sql = fs.readFileSync('supabase/migrations/20261102000002_teacher_subjects.sql', 'utf8');
    assert.match(sql, /REVOKE ALL ON public\.teacher_subjects FROM anon, authenticated/);
    assert.match(sql, /INSERT INTO public\.teacher_subjects[\s\S]*CROSS JOIN/);
    for (const s of UNIVERSITY_SUBJECTS) assert.ok(sql.includes(`('${s}')`), s);
  });
});

describe('NX-15 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('guests get nothing', async () => {
    assert.strictEqual((await fetch(`${base}/api/dashboard/university/me`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/admin/university`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/admin/university/a@b.c/tajweed`, { method: 'POST' })).status, 401);
  });
});
