import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const sql = fs.readFileSync('supabase/migrations/20261023000000_teacher_rls_intake_students_lockdown.sql', 'utf-8');
const api = fs.readFileSync('api/index.ts', 'utf-8');

test('intake, offer and review rows are super-admin only', () => {
  for (const t of ['student_intakes', 'learning_offers', 'intake_review_events']) {
    assert.ok(sql.includes(`DROP POLICY IF EXISTS "Teacher allowlist access to ${t}" ON public.${t};`), `${t} teacher policy dropped`);
    assert.ok(sql.includes(`CREATE POLICY "Super admin manages ${t}" ON public.${t}`), `${t} super admin policy`);
  }
});

test('teachers can no longer insert or delete students from the browser', () => {
  assert.ok(sql.includes('DROP POLICY IF EXISTS "Teacher scoped access to students"'));
  assert.ok(sql.includes('FOR SELECT TO authenticated') && sql.includes('FOR UPDATE TO authenticated'));
  assert.ok(!/Teacher (reads|updates) assigned students[^;]*FOR ALL/.test(sql));
  assert.ok(sql.includes('REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.students FROM authenticated;'));
});

test('AI brief never sends private lesson notes to the model', () => {
  const start = api.indexOf("app.post('/api/dashboard/students/:id/ai-brief'");
  const route = api.slice(start, api.indexOf('generateContent', start));
  assert.ok(start > 0 && !route.includes('private_notes:') && !route.includes('observations, private_notes'));
});
