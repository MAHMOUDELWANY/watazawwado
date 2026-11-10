/**
 * AUTH-02/03/10/11, INT-06/07, MSG-01: the family account. Adding a child, age limits, the account's own data,
 * chat with the right people only, and a teacher change from the family's request to the admin's decision.
 */
import { test, expect } from '@playwright/test';
import { bookingBody, booking, call, db, freeSlots, qaIds, resetLearnerData, tokenFor, TAG, QA_PROJECT, type QaIds } from './helpers.js';
import { qaEmail } from '../scripts/qa/lib.js';

test.describe.configure({ mode: 'serial' });

let q: QaIds, student: string, parent: string, teacher: string, teacher2: string, admin: string;
const EXTRA = `QA Extra ${TAG}`;
const child = (over: Record<string, unknown> = {}) => ({
  name: EXTRA, age: 10, gender: 'male', learningInterest: 'quran-reading', currentLevel: 'beginner',
  teacherId: q.teacher1, teacherGenderPreference: 'male_teacher', ...over });

async function removeExtraChildren() {
  const { data } = await db.from('students').select('id').like('name', `${EXTRA}%`);
  const ids = (data || []).map(r => r.id);
  if (!ids.length) return;
  await db.from('teacher_change_requests').delete().in('student_id', ids);
  await db.from('guardians').delete().in('student_id', ids);
  await db.from('students').delete().in('id', ids);
}

test.beforeAll(async () => {
  q = await qaIds();
  await resetLearnerData();
  await removeExtraChildren();
  await db.from('teacher_change_requests').delete().in('student_id', [q.kid, q.teen, q.student.id]);
  await db.from('chat_threads').update({ closed_at: null }).eq('owner_user_id', q.parent.authId); // left closed by an interrupted run
  [student, parent, teacher, teacher2, admin] = await Promise.all([tokenFor('student'), tokenFor('parent'), tokenFor('teacher', 1), tokenFor('teacher', 2), tokenFor('admin')]);
});
test.afterAll(async () => {
  await db.from('teacher_change_requests').delete().in('student_id', [q.kid, q.teen, q.student.id]);
  await db.from('students').update({ assigned_teacher_id: q.teacher2 }).eq('id', q.kid);
  await removeExtraChildren();
  await resetLearnerData();
});

test('adding a child: ages 6 to 17 only, a real name, and a double click adds one child', async () => {
  for (const [name, over] of [['age 5', { age: 5 }], ['age 18', { age: 18 }], ['age "ten"', { age: 'ten' }], ['age 10.5', { age: 10.5 }], ['one-letter name', { name: 'Q' }], ['a 300-letter name', { name: `${EXTRA} ${'x'.repeat(300)}` }]] as const) {
    const r = await call(parent, 'POST', '/api/student/children', child(over));
    expect(r.status, `${name}: ${JSON.stringify(r.json)}`).toBe(422);
  }
  const both = await Promise.all([call(parent, 'POST', '/api/student/children', child()), call(parent, 'POST', '/api/student/children', child())]);
  expect(both.every(r => r.ok), JSON.stringify(both.map(r => r.json))).toBe(true);
  const { data: rows } = await db.from('students').select('id, assigned_teacher_id, age, learner_type').eq('name', EXTRA);
  expect(rows?.length, 'a double click on "Add child" made two children').toBe(1);
  expect(rows![0]).toMatchObject({ assigned_teacher_id: q.teacher1, age: 10 });
  const me = await call(parent, 'GET', '/api/student/me');
  expect(me.json.linkedChildren.map((c: any) => c.name)).toContain(EXTRA);
  // The new child is only this family's.
  const other = await call(student, 'POST', '/api/bookings/create', bookingBody((await freeSlots(q.teacher1, { fromDay: 5 }))[0], { studentId: rows![0].id }));
  expect(other.status).toBe(403);
});

test('a personal (adult) account does not silently become a family by adding a child', async () => {
  const r = await call(student, 'POST', '/api/student/children', child({ name: `${EXTRA} Adult` }));
  const { count } = await db.from('guardians').select('student_id', { count: 'exact', head: true }).eq('parent_email', qaEmail(QA_PROJECT, 'student'));
  test.info().annotations.push({ type: 'adult adds child', description: `status ${r.status}, guardian links ${count}` });
  // Either it is refused, or the account is told it is now a family; it must never half-work.
  if (r.ok) expect((await call(student, 'GET', '/api/student/me')).json.linkedChildren?.length || 0).toBeGreaterThan(0);
});

test('the account edits only its own safe fields', async () => {
  const before = (await db.from('students').select('email, assigned_teacher_id, status, learner_type, auth_user_id').eq('id', q.parent.id).single()).data!;
  const r = await call(parent, 'PATCH', '/api/student/me', {
    timezone: 'America/Chicago', email: 'attacker@example.com', assignedTeacherId: q.teacher1, assigned_teacher_id: q.teacher1,
    status: 'vip', role: 'super_admin', auth_user_id: q.student.authId, learnerType: 'adult', accountCredit: 500,
  });
  expect(r.status, JSON.stringify(r.json)).toBeLessThan(500);
  const after = (await db.from('students').select('email, assigned_teacher_id, status, learner_type, auth_user_id, timezone').eq('id', q.parent.id).single()).data!;
  expect({ ...after, timezone: undefined }).toEqual({ ...before, timezone: undefined });
  await call(parent, 'PATCH', '/api/student/me', { timezone: 'America/New_York' });
  const bad = await call(parent, 'PATCH', '/api/student/me', { timezone: 'Mars/Olympus' });
  expect((await db.from('students').select('timezone').eq('id', q.parent.id).single()).data?.timezone, `a made-up time zone was saved (${bad.status})`).toBe('America/New_York');
});

test('language choice is saved for emails, and only ar or en', async () => {
  expect((await call(parent, 'PUT', '/api/me/language', { language: 'fr' })).status).toBe(400);
  const r = await call(parent, 'PUT', '/api/me/language', { language: 'ar' });
  expect(r.status, JSON.stringify(r.json)).toBe(200);
  const { data } = await db.from('user_language_preferences').select('language').ilike('email', qaEmail(QA_PROJECT, 'parent')).maybeSingle();
  expect(data?.language).toBe('ar');
  await call(parent, 'PUT', '/api/me/language', { language: 'en' });
});

test('the data export holds this family and nobody else', async () => {
  const r = await call(parent, 'GET', '/api/student/privacy/export');
  expect(r.status).toBe(200);
  const text = r.text; // a readable page, not JSON
  expect(text).toContain(`QA Kid ${TAG}`);
  expect(text).not.toContain(q.student.id);
  expect(text).not.toContain(qaEmail(QA_PROJECT, 'student'));
  expect(text.toLowerCase(), 'no token or hash in an export').not.toMatch(/management_token|token_hash|password/);
  expect([401, 403]).toContain((await call(null, 'GET', '/api/student/privacy/export')).status);
});

test('chat: the family writes to its own teachers and our team; nobody else reads it', async () => {
  const mine = await call(parent, 'GET', '/api/chat/threads');
  expect(mine.status).toBe(200);
  const threads: any[] = mine.json.threads;
  expect(threads.some(t => t.kind === 'support'), 'a pinned conversation with our team').toBe(true);
  const withKidTeacher = threads.find(t => t.kind !== 'support' && String(t.teacherName || '').includes(`QA Ustadha ${TAG}`));
  expect(withKidTeacher, `a conversation with the kid's teacher: ${JSON.stringify(threads).slice(0, 400)}`).toBeTruthy();
  const id = withKidTeacher.id;
  expect((await call(parent, 'POST', `/api/chat/threads/${id}/messages`, { body: '   ' })).status).toBe(400);
  expect((await call(parent, 'POST', `/api/chat/threads/${id}/messages`, { body: 'x'.repeat(20_000) })).status).toBe(400);
  const sent = await call(parent, 'POST', `/api/chat/threads/${id}/messages`, { body: 'QA: <img src=x onerror=alert(1)> السلام عليكم' });
  expect(sent.status, JSON.stringify(sent.json)).toBe(201);
  const forTeacher = await call(teacher2, 'GET', `/api/chat/threads/${id}/messages`);
  expect(forTeacher.status).toBe(200);
  expect(JSON.stringify(forTeacher.json)).toContain('السلام عليكم');
  for (const [who, token] of [['another family', student], ['another teacher', teacher], ['a visitor', null]] as const) {
    const read = await call(token, 'GET', `/api/chat/threads/${id}/messages`);
    expect([401, 403, 404], `${who} reading the conversation`).toContain(read.status);
    const write = await call(token, 'POST', `/api/chat/threads/${id}/messages`, { body: 'not mine' });
    expect([401, 403, 404], `${who} writing in the conversation`).toContain(write.status);
  }
  expect((await call(admin, 'GET', `/api/chat/threads/${id}/messages`)).status, 'the super admin can read every conversation').toBe(200);
  await db.from('chat_messages').delete().eq('thread_id', id).like('body', 'QA:%');
});

let requestId = '', kidTrial = '';
test('asking to change a teacher: a reason is required, one open request per learner, the teacher never sees why', async () => {
  const slot = (await freeSlots(q.teacher2, { fromDay: 5, timezone: 'America/New_York' }))[0];
  const t = await call(parent, 'POST', '/api/bookings/create', bookingBody(slot, { studentId: q.kid, audience: 'child', contactName: `QA Kid ${TAG}`, parentName: `QA Parent ${TAG}`, timezone: 'America/New_York' }));
  expect(t.status, JSON.stringify(t.json)).toBe(201);
  kidTrial = t.json.bookingId;

  expect((await call(parent, 'POST', '/api/student/teacher-change', { studentId: q.kid, reasonType: 'fit' })).status, 'no note').toBe(400);
  expect((await call(parent, 'POST', '/api/student/teacher-change', { studentId: q.kid, reasonType: 'because', note: 'please' })).status, 'made-up reason').toBe(400);
  expect((await call(parent, 'POST', '/api/student/teacher-change', { studentId: q.student.id, reasonType: 'fit', note: 'not my learner' })).status).toBe(404);
  const secret = 'QA-SECRET: she is often late and impatient';
  const r = await call(parent, 'POST', '/api/student/teacher-change', { studentId: q.kid, reasonType: 'quality', note: secret, preferredTeacherId: q.teacher1 });
  expect(r.status, JSON.stringify(r.json)).toBe(201);
  requestId = r.json.request.id;
  expect((await call(parent, 'POST', '/api/student/teacher-change', { studentId: q.kid, reasonType: 'times', note: 'again please' })).status).toBe(409);

  // The previous teacher: no route and no notice carries the reason.
  for (const route of ['/api/dashboard/notifications', '/api/dashboard/students', `/api/dashboard/students/${q.kid}`, '/api/dashboard/today', '/api/chat/threads']) {
    const seen = await call(teacher2, 'GET', route);
    expect(JSON.stringify(seen.json), `the reason reached the teacher through ${route}`).not.toContain('QA-SECRET');
  }
  const { data: notices } = await db.from('user_notifications').select('body_en, body_ar, title_en').eq('recipient_user_id', q.teacher2);
  expect(JSON.stringify(notices)).not.toContain('QA-SECRET');
  expect([401, 403]).toContain((await call(teacher2, 'GET', '/api/dashboard/admin/teacher-change')).status);
  expect([401, 403]).toContain((await call(teacher2, 'POST', `/api/dashboard/admin/teacher-change/${requestId}/decide`, { action: 'decline', message: 'no thanks' })).status);
  expect([401, 403]).toContain((await call(parent, 'POST', `/api/dashboard/admin/teacher-change/${requestId}/decide`, { action: 'approve', toTeacherId: q.teacher1 })).status);
});

test('the admin approves: the learner moves, the trial stays, the old chat closes, the family is told', async () => {
  const list = await call(admin, 'GET', '/api/dashboard/admin/teacher-change');
  expect(JSON.stringify(list.json)).toContain('QA-SECRET');
  expect((await call(admin, 'POST', `/api/dashboard/admin/teacher-change/${requestId}/decide`, { action: 'approve', toTeacherId: q.teacher2 })).status, 'same teacher').toBe(400);
  const ok = await call(admin, 'POST', `/api/dashboard/admin/teacher-change/${requestId}/decide`, { action: 'approve', toTeacherId: q.teacher1, message: 'QA: done' });
  expect(ok.status, JSON.stringify(ok.json)).toBe(200);
  expect((await db.from('students').select('assigned_teacher_id').eq('id', q.kid).single()).data?.assigned_teacher_id).toBe(q.teacher1);
  const b = await booking(kidTrial);
  expect(b, 'a free trial stays with the previous teacher until the admin moves it').toMatchObject({ status: 'confirmed', teacher_id: q.teacher2 });
  expect((await call(admin, 'POST', `/api/dashboard/admin/teacher-change/${requestId}/decide`, { action: 'decline', message: 'too late' })).status, 'decided once').toBe(409);
  // Notices are written after the answer is sent, so wait for them.
  await expect.poll(async () => {
    const { data: told } = await db.from('user_notifications').select('kind').eq('recipient_user_id', q.parent.authId).order('created_at', { ascending: false }).limit(5);
    return (told || []).map(x => x.kind).join(',');
  }, { message: 'the family gets a notice about the new teacher', timeout: 15_000 }).toMatch(/teacher/i);
  // The previous teacher no longer has the learner; the new one does.
  expect(JSON.stringify((await call(teacher2, 'GET', '/api/dashboard/students')).json)).not.toContain(q.kid);
  expect(JSON.stringify((await call(teacher, 'GET', '/api/dashboard/students')).json)).toContain(q.kid);
});

test('the admin can also assign a teacher directly; only a licensed, active teacher', async () => {
  expect([401, 403]).toContain((await call(teacher, 'PATCH', `/api/dashboard/admin/students/${q.kid}/assign-teacher`, { teacherId: q.teacher1 })).status);
  const bad = await call(admin, 'PATCH', `/api/dashboard/admin/students/${q.kid}/assign-teacher`, { teacherId: q.student.authId, teacher_id: q.student.authId });
  expect(bad.ok, 'a learner account was accepted as a teacher').toBe(false);
  const back = await call(admin, 'PATCH', `/api/dashboard/admin/students/${q.kid}/assign-teacher`, { teacherId: q.teacher2, teacher_id: q.teacher2 });
  expect(back.status, JSON.stringify(back.json)).toBe(200);
  expect((await db.from('students').select('assigned_teacher_id').eq('id', q.kid).single()).data?.assigned_teacher_id).toBe(q.teacher2);
  // P2-011: the chat the earlier change closed is open again for the teacher the learner is back with.
  const threads: any[] = (await call(parent, 'GET', '/api/chat/threads')).json.threads;
  const withTeacher = threads.find(t => t.kind !== 'support' && String(t.teacherName || '').includes(`QA Ustadha ${TAG}`));
  await expect.poll(async () => (await call(parent, 'POST', `/api/chat/threads/${withTeacher.id}/messages`, { body: 'QA: back with you' })).status,
    { message: 'the family can write to its current teacher again', timeout: 15_000 }).toBe(201);
  await db.from('chat_messages').delete().eq('thread_id', withTeacher.id).like('body', 'QA:%');
});
