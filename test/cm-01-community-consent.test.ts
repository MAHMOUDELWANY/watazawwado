import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';
import {
  boardGroupFor, buildClassBoard, chooseDisplayName, consentKindFor, firstNameOf, honorPostText, nextHonorStatus,
  toPublicHonorEntry, CLASS_BOARD_MIN_MEMBERS
} from '../server/community/community.js';
import { collectAttendedLessons } from '../server/routes/progress.js';

describe('CM-01 who may decide', () => {
  it('a guardian decides for a linked child', () => {
    assert.strictEqual(consentKindFor({ isPrimary: false, learnerType: 'child', age: 9, guardianLinked: false }), 'guardian');
  });
  it('an adult learner decides for themself', () => {
    assert.strictEqual(consentKindFor({ isPrimary: true, learnerType: 'adult', age: 30, guardianLinked: false }), 'learner');
    assert.strictEqual(consentKindFor({ isPrimary: true, learnerType: 'adult', age: null, guardianLinked: false }), 'learner');
  });
  it('a minor on their own account cannot decide; a guardian tied to the record can', () => {
    assert.strictEqual(consentKindFor({ isPrimary: true, learnerType: 'adult', age: 16, guardianLinked: false }), null);
    assert.strictEqual(consentKindFor({ isPrimary: true, learnerType: 'child', age: null, guardianLinked: false }), null);
    assert.strictEqual(consentKindFor({ isPrimary: true, learnerType: 'child', age: 10, guardianLinked: true }), 'guardian');
  });
});

describe('CM-01 the name shown', () => {
  it('defaults to the first name only', () => {
    assert.strictEqual(firstNameOf('  Maryam Ahmed Hassan '), 'Maryam');
    assert.deepStrictEqual(chooseDisplayName('first', '', 'يوسف محمد'), { ok: true, name: 'يوسف', error: '' });
  });
  it('accepts a short typed name and tidies spaces', () => {
    assert.strictEqual(chooseDisplayName('custom', '  Umm   Yusuf ', 'x').name, 'Umm Yusuf');
  });
  it('refuses contact details, markup, empty and long names', () => {
    for (const bad of ['a@b.co', 'see www.x.org', '+44 7700 900123', '', 'x'.repeat(41)]) {
      assert.strictEqual(chooseDisplayName('custom', bad, 'x').ok, false, bad);
    }
    assert.strictEqual(chooseDisplayName('custom', '<b>Ali</b>', 'x').name, 'bAli/b');
    assert.strictEqual(chooseDisplayName('nope', 'Ali', 'x').ok, false);
  });
});

describe('CM-01 entry status', () => {
  it('the family can say yes, no, change their mind, and withdraw', () => {
    assert.strictEqual(nextHonorStatus('awaiting_consent', 'family_yes'), 'published');
    assert.strictEqual(nextHonorStatus('awaiting_consent', 'family_no'), 'declined');
    assert.strictEqual(nextHonorStatus('declined', 'family_yes'), 'published');
    assert.strictEqual(nextHonorStatus('published', 'family_withdraw'), 'withdrawn');
    assert.strictEqual(nextHonorStatus('withdrawn', 'family_yes'), 'published');
  });
  it('the admin records only a first answer and cannot overrule a family no', () => {
    assert.strictEqual(nextHonorStatus('awaiting_consent', 'admin_record_yes'), 'published');
    assert.strictEqual(nextHonorStatus('declined', 'admin_record_yes'), null);
    assert.strictEqual(nextHonorStatus('withdrawn', 'admin_record_yes'), null);
  });
  it('an entry the admin removed stays off', () => {
    assert.strictEqual(nextHonorStatus('published', 'admin_remove'), 'removed');
    assert.strictEqual(nextHonorStatus('removed', 'family_yes'), null);
    assert.strictEqual(nextHonorStatus('removed', 'admin_record_yes'), null);
  });
});

describe('CM-02 public entry', () => {
  const m = { title_en: 'Memorized Juz Amma', title_ar: 'حفظ جزء عمّ', kind: 'juz_completed' };
  it('shows only published entries and only the public fields', () => {
    const e = toPublicHonorEntry({ id: 'e1', display_name: 'Maryam', published_at: '2026-10-20T10:00:00Z', status: 'published' }, m, null);
    assert.deepStrictEqual(Object.keys(e!).sort(), ['id', 'kind', 'month', 'name', 'subject', 'titleAr', 'titleEn']);
    assert.strictEqual(e!.month, '2026-10');
    assert.strictEqual(toPublicHonorEntry({ id: 'e2', display_name: 'X', published_at: '2026-10-20', status: 'withdrawn' }, m, null), null);
    assert.strictEqual(toPublicHonorEntry({ id: 'e3', display_name: null, published_at: '2026-10-20', status: 'published' }, m, null), null);
  });
  it('the post text names the achievement and links the page in each language', () => {
    const t = honorPostText({ name: 'Maryam', titleEn: m.title_en, titleAr: m.title_ar }, 'https://watazawwado.academy/');
    assert.ok(t.en.includes('Maryam: Memorized Juz Amma') && t.en.endsWith('https://watazawwado.academy/hall-of-honor'));
    assert.ok(t.ar.includes('حفظ جزء عمّ') && t.ar.endsWith('/ar/hall-of-honor'));
  });
});

describe('CM-03 class board', () => {
  const st = (over: any) => ({ assigned_teacher_id: 't1', age: null, learner_type: 'adult', gender: 'female', ...over });
  it('groups by teacher and age group; teens and adults also by gender', () => {
    assert.strictEqual(boardGroupFor(st({ learner_type: 'child', gender: 'male' })), boardGroupFor(st({ learner_type: 'child', gender: 'female' })));
    assert.notStrictEqual(boardGroupFor(st({ age: 14, gender: 'male' })), boardGroupFor(st({ age: 14, gender: 'female' })));
    assert.notStrictEqual(boardGroupFor(st({ age: 14 })), boardGroupFor(st({ age: 30 })));
    assert.notStrictEqual(boardGroupFor(st({})), boardGroupFor(st({ assigned_teacher_id: 't2' })));
    assert.strictEqual(boardGroupFor(st({ assigned_teacher_id: null })), null);
  });
  const mem = (id: string, lessons: number, rhythm: number) => ({ studentId: id, displayName: id.toUpperCase(), lessonsThisMonth: lessons, rhythm });
  it('needs the viewer on it and at least three learners', () => {
    assert.strictEqual(CLASS_BOARD_MIN_MEMBERS, 3);
    assert.strictEqual(buildClassBoard([mem('a', 1, 1), mem('b', 2, 2)], 'a'), null);
    assert.strictEqual(buildClassBoard([mem('a', 1, 1), mem('b', 2, 2), mem('c', 3, 3)], 'z'), null);
  });
  it('orders by lessons this month, then rhythm, with no rank and no ids', () => {
    const rows = buildClassBoard([mem('a', 2, 1), mem('b', 4, 1), mem('c', 2, 5)], 'a')!;
    assert.deepStrictEqual(rows.map((r) => r.name), ['B', 'C', 'A']);
    assert.deepStrictEqual(Object.keys(rows[0]).sort(), ['isYou', 'lessonsThisMonth', 'name', 'rhythm']);
    assert.strictEqual(rows.find((r) => r.isYou)!.name, 'A');
  });
});

describe('CM-03 attended lessons are counted like the progress page', () => {
  it('a session decides for its booking; a completed booking alone counts once', () => {
    const bookings = [
      { id: 'b1', status: 'completed', scheduled_start: '2026-10-01T10:00:00Z', service_id: 'tajweed' },
      { id: 'b2', status: 'completed', scheduled_start: '2026-10-08T10:00:00Z' },
      { id: 'b3', status: 'completed', scheduled_start: '2026-10-15T10:00:00Z' }
    ];
    const sessions = [{ id: 's1', booking_id: 'b1', attendance: 'attended' }, { id: 's3', booking_id: 'b3', attendance: 'missed' }];
    const out = collectAttendedLessons(bookings, sessions, 'quran-reading');
    assert.deepStrictEqual(out.map((l) => l.id), ['session:s1', 'booking:b2']);
  });
});

describe('CM endpoints guard who may act', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });
  const post = (path: string, token?: string, body: any = {}) => fetch(`${base}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body)
  });
  const id = '99999999-9999-4999-8999-999999999999';

  it('family routes need a family account', async () => {
    assert.strictEqual((await fetch(`${base}/api/student/community`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/student/community`, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
    assert.strictEqual((await post(`/api/student/community/honor/${id}/decision`, undefined, { decision: 'yes' })).status, 401);
    const foreign = await fetch(`${base}/api/student/community?learnerId=${id}`, { headers: { Authorization: 'Bearer dev-student-token' } });
    if (foreign.status !== 503) assert.strictEqual(foreign.status, 403);
    const board = await post('/api/student/community/class-board', 'dev-student-token', { learnerId: id, join: true, nameChoice: 'first' });
    if (board.status !== 503) assert.strictEqual(board.status, 403);
  });
  it('admin routes are for the super admin only', async () => {
    assert.strictEqual((await fetch(`${base}/api/dashboard/honor`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/honor`, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
    assert.strictEqual((await post('/api/dashboard/honor/nominate', 'dev-teacher-token', { milestoneId: id })).status, 403);
    assert.ok([401, 403].includes((await post(`/api/dashboard/honor/${id}/record-consent`, 'dev-student-token', { decision: 'yes', note: 'x' })).status));
  });
  it('the class board needs a staff account; the public page needs none', async () => {
    assert.strictEqual((await fetch(`${base}/api/dashboard/class-board`)).status, 401);
    const pub = await fetch(`${base}/api/public/hall-of-honor`);
    assert.ok([200, 500, 503].includes(pub.status));
    if (pub.status === 200) assert.ok(Array.isArray(((await pub.json()) as any).entries));
  });
});
