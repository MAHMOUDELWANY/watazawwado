import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const api = fs.readFileSync('api/index.ts', 'utf8');

describe('P1 testing foundation (docs/testing/findings/p1.md)', () => {
  it('P1-005: the admin student list names each learner\'s teacher (teacher_accounts has no id column)', async () => {
    assert.ok(!api.includes("from('teacher_accounts').select('id, email, display_name')"), 'teacher_accounts has no id column; that select always fails');
    const res = await fetch(`${BASE}/api/dashboard/students`, { headers: { Authorization: 'Bearer dev-super-admin-token' } });
    assert.strictEqual(res.status, 200);
    const { students } = await res.json() as { students: any[] };
    const assigned = students.filter(s => s.assigned_teacher_id);
    if (!assigned.length) return; // nothing to name in this database
    assert.ok(assigned.some(s => s.assigned_teacher_name && s.assigned_teacher_name !== 'Teacher'),
      'at least one assigned learner shows a real teacher name');
  });

  it('P1-001: on a local server only dev tokens get mock student data; real accounts read and write the database', () => {
    assert.ok(!api.includes('(!isProd && req.studentUser?.studentProfile)'), 'mock branch must key on the dev token, not on any profile');
    assert.ok(api.includes('function isDevStudentRequest(req: any): boolean'));
    assert.ok(/return !devAuthDisabled\(\) && !!token && !!devStudentProfiles\[token\];/.test(api));
  });

  it('P1-003: family child cards show the subject and level in words, not ids', async () => {
    const page = fs.readFileSync('src/student/pages/StudentHomePage.tsx', 'utf8');
    assert.ok(!page.includes('max-w-[130px]">{child.learningInterest}</span>'), 'raw learning_interest id');
    const { serviceLabel, levelLabel } = await import('../src/dashboard/lib/labels.ts');
    assert.strictEqual(serviceLabel({ service_id: 'quran-reading' }, false), 'Quran Reading');
    assert.notStrictEqual(serviceLabel({ service_id: 'zad-essentials' }, true), 'zad-essentials');
    assert.strictEqual(levelLabel('beginner', true), 'مبتدئ');
  });

  it('P1-002: a parent who only follows their children gets no teacher at onboarding', () => {
    const onboarding = api.slice(api.indexOf("app.post('/api/student/onboarding'"), api.indexOf("app.post('/api/student/children'"));
    assert.ok(onboarding.includes("const selfLearner = resolvedLearnerType === 'adult' || guardianLearns;"));
    assert.ok(onboarding.includes('if (selfLearner && routedTeacher.id && !req.studentUser?.studentProfile?.assigned_teacher_id)'));
    assert.ok(!onboarding.includes('assignedTeacherId: updatedStudent.assigned_teacher_id || routedTeacher.id,'), 'response must not report a routed teacher for a following parent');
  });

  it('QA teachers never reach the live site', () => {
    const fn = api.slice(api.indexOf('export async function listPublicTeachers'), api.indexOf('export async function listPublicTeachers') + 1500);
    assert.ok(fn.includes("process.env.VERCEL_ENV === 'production'") && fn.includes('+qa-'), 'listPublicTeachers hides +qa- teachers on production');
  });

  it('QA scripts refuse non-QA accounts', async () => {
    const { isQaEmail } = await import('../scripts/qa/lib.ts');
    assert.strictEqual(isQaEmail('mahmoudelwany98+qa-p1-student-1@gmail.com'), true);
    assert.strictEqual(isQaEmail('mahmoudelwany98@gmail.com'), false);
    assert.strictEqual(isQaEmail('someone+qa@gmail.com'), false);
    assert.strictEqual(isQaEmail(null), false);
  });
});
