import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { qa, skipReason, type Qa } from './helpers/qa.js';
import { listRoutes, fill, type Route } from './helpers/routes.js';

/**
 * P3, AUTH-07: the right role, someone else's data. The QA student (teacher 1) and the QA parent's child (teacher 2)
 * each have a real lesson; then every route that takes an id or a learner is called by the other family and by the
 * other teacher. A read that answers 200 or names the other family is a leak; a write that answers 2xx is a hole.
 */

const routes = listRoutes();
// Every column that points at a learner (pg_constraint, 2026-11-11): nothing new may point at the other family's child.
const LEARNER_COLUMNS = ['guardians.student_id', 'bookings.student_id', 'lesson_notes.student_id', 'payments.student_id', 'package_entitlements.learner_student_id',
  'student_intakes.learner_student_id', 'learning_offers.learner_student_id', 'placement_tests.learner_student_id', 'curriculum_lesson_reports.student_id',
  'learner_milestones.student_id', 'lesson_feedback.student_id', 'honor_entries.student_id', 'lesson_homework.student_id', 'program_signups.student_id',
  'recitation_recordings.student_id', 'review_cards.student_id', 'child_devices.learner_id', 'sponsorship_requests.learner_student_id', 'homework_sets.student_id',
  'teacher_change_requests.student_id'];

describe('P3 ownership: the same role never reaches another family\'s or another teacher\'s data', () => {
  let q: Qa, ids: Awaited<ReturnType<Qa['qaIds']>>, student: string, parent: string, teacher1: string, teacher2: string;
  let mine = { id: '', ref: '' }, theirs = { id: '', ref: '' }, theirDevice = '', theirTest = '';
  const TAG = () => q.TAG;

  const footprint = async (learnerId: string) => {
    const counts: Record<string, number> = {};
    await Promise.all(LEARNER_COLUMNS.map(async (tc) => {
      const [table, column] = tc.split('.');
      const { count, error } = await q.db.from(table).select('*', { count: 'exact', head: true }).eq(column, learnerId);
      counts[tc] = error ? -1 : count || 0;
    }));
    return counts;
  };
  const sweep = async (list: Route[], probe: (r: Route) => Promise<string | null>) => {
    const wrong: string[] = [];
    for (let i = 0; i < list.length; i += 8) wrong.push(...(await Promise.all(list.slice(i, i + 8).map(probe))).filter((x): x is string => !!x));
    return wrong;
  };
  const hit = (r: Route, token: string, id: string, query = '') => q.call(token, r.method, fill(r.path, id) + query, r.method === 'GET' || r.method === 'DELETE' ? undefined : {});

  before(async () => {
    const ready = await qa();
    if (!ready) return;
    q = ready;
    ids = await q.qaIds();
    await q.resetLearnerData();
    [student, parent, teacher1, teacher2] = await Promise.all([q.tokenFor('student'), q.tokenFor('parent'), q.tokenFor('teacher', 1), q.tokenFor('teacher', 2)]);
    const s1 = await q.freeSlots(ids.teacher1, { fromDay: 8 });
    const s2 = await q.freeSlots(ids.teacher2, { fromDay: 8 });
    const a = await q.call(student, 'POST', '/api/bookings/create', q.bookingBody(s1[0]));
    const b = await q.call(parent, 'POST', '/api/bookings/create', q.bookingBody(s2[1], { studentId: ids.kid, teacherId: ids.teacher2, audience: 'child', parentName: `QA Parent ${TAG()}`, contactName: `QA Kid ${TAG()}` }));
    assert.strictEqual(a.status, 201, JSON.stringify(a.json));
    assert.strictEqual(b.status, 201, JSON.stringify(b.json));
    mine = { id: a.json.bookingId, ref: a.json.referenceCode };
    theirs = { id: b.json.bookingId, ref: b.json.referenceCode };
    const device = await q.call(parent, 'POST', '/api/student/child-devices', { learnerId: ids.kid, name: 'QA phone' });
    theirDevice = device.json?.id || '';
    const placement = await q.call(parent, 'POST', '/api/placement/start', { learnerStudentId: ids.kid, serviceId: 'quran-reading', level: 'beginner' });
    theirTest = placement.json?.test?.id || placement.json?.id || placement.json?.testId || '';
  });
  after(async () => {
    if (!q) return;
    await q.db.from('child_devices').delete().in('owner_user_id', [ids.student.authId, ids.parent.authId]);
    await q.db.from('placement_tests').delete().in('learner_student_id', [ids.student.id, ids.kid, ids.teen]);
    await q.resetLearnerData();
  });

  it('a family reads nothing of another family through any GET route, by id or by ?learnerId', async (t) => {
    if (!q) return t.skip(skipReason);
    const theirNames = new RegExp(`QA (Kid|Teen|Parent) ${TAG()}|${theirs.ref}|${ids.kid}|${ids.teen}`);
    const gets = routes.filter(r => r.guard === 'student' && r.method === 'GET');
    const wrong = await sweep(gets, async (r) => {
      const res = await hit(r, student, theirs.id, `?learnerId=${ids.kid}&studentId=${ids.kid}&childId=${ids.kid}`);
      if (r.path.includes(':') && res.ok) return `answered for another family's id: GET ${r.path} -> ${res.status} ${res.text.slice(0, 80)}`;
      if (theirNames.test(res.text)) return `names the other family: GET ${r.path} -> ${res.status} ${res.text.match(theirNames)?.[0]}`;
      return null;
    });
    assert.deepStrictEqual(wrong, []);
    if (theirTest) assert.ok(!(await q.call(student, 'GET', `/api/placement/${theirTest}/report`)).ok, 'another child\'s placement report');
    const cal = await q.call(student, 'GET', '/api/student/bookings');
    assert.ok(cal.text.includes(mine.ref) && !cal.text.includes(theirs.ref), 'my lessons list holds my lesson only');
  });

  it('a family changes nothing of another family: their lesson, their device, their child', async (t) => {
    if (!q) return t.skip(skipReason);
    const before = { kid: await footprint(ids.kid), teen: await footprint(ids.teen), lesson: await q.booking(theirs.id) };
    const writes = routes.filter(r => r.guard === 'student' && r.method !== 'GET' && r.path.includes(':'));
    const wrong = await sweep(writes, async (r) => {
      const res = await hit(r, student, r.path.includes('child-devices') ? theirDevice || theirs.id : theirs.id);
      return res.ok ? `wrote with another family's id: ${r.method} ${r.path} -> ${res.status} ${res.text.slice(0, 80)}` : null;
    });
    assert.deepStrictEqual(wrong, []);

    // Naming their child in the body: refused, or done for my own learner, never for theirs.
    const foreign = { learnerId: ids.kid, learnerStudentId: ids.kid, studentId: ids.kid, childId: ids.kid };
    const bodies: [string, Record<string, unknown>][] = [
      ['/api/placement/start', { ...foreign, serviceId: 'quran-reading', level: 'beginner' }],
      ['/api/student/child-devices', { ...foreign, name: 'not mine' }],
      ['/api/student/recitations/upload-url', { ...foreign, contentType: 'audio/webm', seconds: 5 }],
      ['/api/student/teacher-change', { ...foreign, reason: 'QA: testing that a family cannot ask for another family\'s child.' }],
      ['/api/student/packages/select', { ...foreign, packageCatalogId: ids.kid, acceptedTerms: true, acceptedEarlyStart: true }],
    ];
    for (const [route, body] of bodies) {
      const res = await q.call(student, 'POST', route, body);
      assert.ok(!res.text.includes(ids.kid) && !new RegExp(`QA Kid ${TAG()}`).test(res.text), `${route} answered about their child: ${res.status} ${res.text.slice(0, 120)}`);
    }
    assert.deepStrictEqual(await footprint(ids.kid), before.kid, 'no new row points at their child');
    assert.deepStrictEqual(await footprint(ids.teen), before.teen);
    const lesson = await q.booking(theirs.id);
    assert.deepStrictEqual([lesson.status, lesson.scheduled_start, lesson.updated_at], [before.lesson.status, before.lesson.scheduled_start, before.lesson.updated_at], 'their lesson is untouched');
    if (theirDevice) {
      const { data } = await q.db.from('child_devices').select('id, revoked_at').eq('id', theirDevice).maybeSingle();
      assert.ok(data && !data.revoked_at, 'their child device is still linked');
    }
  });

  it('a teacher reads and changes only their own learners and lessons', async (t) => {
    if (!q) return t.skip(skipReason);
    // The QA student and their lesson belong to teacher 1; teacher 2 tries every teacher route on them.
    const mineOnly = new RegExp(`QA Student ${TAG()}|${mine.ref}|\\+qa-${q.QA_PROJECT}-student-1`);
    const before = { learner: await footprint(ids.student.id), lesson: await q.booking(mine.id), row: (await q.db.from('students').select('*').eq('id', ids.student.id).single()).data };
    const teacherRoutes = routes.filter(r => r.guard === 'teacher');
    const wrong = await sweep(teacherRoutes, async (r) => {
      const target = /bookings|lesson-room|trials|recitations|homework\/:id|homework-sets\/:id/.test(r.path) ? mine.id : ids.student.id;
      const res = await hit(r, teacher2, target);
      if (r.path.includes(':') && res.ok) return `another teacher's learner or lesson: ${r.method} ${r.path} -> ${res.status} ${res.text.slice(0, 80)}`;
      if (mineOnly.test(res.text)) return `names another teacher's learner: ${r.method} ${r.path} -> ${res.status} ${res.text.match(mineOnly)?.[0]}`;
      return null;
    });
    assert.deepStrictEqual(wrong, []);
    assert.deepStrictEqual(await footprint(ids.student.id), before.learner, 'nothing was written about the learner');
    const lesson = await q.booking(mine.id);
    assert.deepStrictEqual([lesson.status, lesson.scheduled_start, lesson.updated_at], [before.lesson.status, before.lesson.scheduled_start, before.lesson.updated_at]);
    assert.deepStrictEqual((await q.db.from('students').select('*').eq('id', ids.student.id).single()).data, before.row, 'the learner\'s row is untouched');

    // P3-010: a homework set of teacher 1's learner. Teacher 2 may neither read it nor decide on it.
    const { data: hw, error: hwErr } = await q.db.from('homework_sets').insert({
      student_id: ids.student.id, teacher_id: ids.teacher1, track: 'quran-reading', lesson_number: 1, from_page: 1, to_page: 2, kind: 'part',
      title_en: 'QA homework', title_ar: 'QA', status: 'submitted', score: 1, total: 5, variants: [{ questions: [] }],
    }).select('id').single();
    assert.ok(hw, hwErr?.message);
    t.after(() => q.db.from('homework_sets').delete().eq('id', hw!.id));
    const read = await q.call(teacher2, 'GET', `/api/dashboard/students/${ids.student.id}/homework-sets`);
    assert.ok(!read.ok && !read.text.includes('QA homework'), `teacher 2 read the homework of teacher 1's learner: ${read.status}`);
    const decide = await q.call(teacher2, 'POST', `/api/dashboard/homework-sets/${hw!.id}/decision`, { decision: 'accept' });
    assert.ok(!decide.ok, `teacher 2 decided on it: ${decide.status}`);
    assert.strictEqual((await q.db.from('homework_sets').select('status').eq('id', hw!.id).single()).data?.status, 'submitted');
    assert.strictEqual((await q.call(teacher1, 'GET', `/api/dashboard/students/${ids.student.id}/homework-sets`)).status, 200, 'their own teacher reads it');

    // The learner's own teacher does reach them, and sees no money.
    const own = await q.call(teacher1, 'GET', `/api/dashboard/students/${ids.student.id}`);
    assert.strictEqual(own.status, 200, own.text.slice(0, 120));
    const ownLesson = await q.call(teacher1, 'GET', `/api/dashboard/bookings/${mine.id}`);
    assert.strictEqual(ownLesson.status, 200);
    // P3-011: the admin sees money, but nobody gets the stored token hash.
    const asAdmin = await q.call(await q.tokenFor('admin'), 'GET', `/api/dashboard/bookings/${mine.id}`);
    assert.strictEqual(asAdmin.status, 200);
    assert.ok(/fee_amount/.test(asAdmin.text) && !/management_token/.test(asAdmin.text), 'admin: money yes, token hash no');
    for (const res of [own, ownLesson, await q.call(teacher1, 'GET', '/api/dashboard/bookings'), await q.call(teacher1, 'GET', '/api/dashboard/today')]) {
      assert.ok(!/fee_amount|price_paid|"amount"|payment_reference|management_token|hold_expires/i.test(res.text), `money or secrets in a teacher response: ${res.text.match(/fee_amount|price_paid|"amount"|payment_reference|management_token|hold_expires/i)?.[0]}`);
    }
  });
});
