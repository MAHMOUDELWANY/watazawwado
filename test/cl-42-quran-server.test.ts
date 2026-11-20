import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { createQuranFoundation, SCOPES } from '../server/quran/foundation.js';
import { accuracySummary, agreement, HINTS_MIN_RECORDINGS, parseMark, quranTabAllowed, releasedMarks } from '../server/quran/rules.js';
import { registerQuranRoutes } from '../server/routes/quran.js';
import { isChildRoute } from '../server/routes/childDevices.js';
import { fakeDb } from './helpers/fakeDb.js';
import { buildReportDraft } from '../server/classroom/reportDraft.js';

const res = (status: number, body: any) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('CL-42 Quran Foundation client', () => {
  const PAGE = { verses: [{ verse_key: '1:1', chapter_id: 1, verse_number: 1, words: [
    { position: 1, char_type_name: 'word', line_number: 2, text_uthmani_tajweed: 'بِسۡمِ', text_imlaei_simple: 'بسم' },
    { position: 2, char_type_name: 'end', line_number: 2, text_uthmani_tajweed: '١', text_imlaei_simple: '١' },
  ] }] };

  const setup = () => {
    let clock = 1_000_000;
    const calls: Array<{ url: string; init: any }> = [];
    let tokens = 0;
    let reject401 = false;
    const fetch = async (url: string, init: any) => {
      calls.push({ url, init });
      if (url.endsWith('/oauth2/token')) { tokens++; return res(200, { access_token: `tok${tokens}`, expires_in: 3600 }); }
      if (reject401) { reject401 = false; return res(401, {}); }
      return res(200, url.includes('/verses/by_page/') ? PAGE : { verse: { page_number: 42 } });
    };
    const q = createQuranFoundation({ clientId: 'cid', clientSecret: 'secret', fetch, now: () => clock });
    return { q, calls, tok: () => tokens, tick: (ms: number) => { clock += ms; }, fail401: () => { reject401 = true; } };
  };

  it('asks for a token once with Basic auth and the granular scopes, then reuses it; responses are cached', async () => {
    const s = setup();
    const [a, b] = await Promise.all([s.q.page(1), s.q.pageOf('2:255')]);
    await s.q.pageOf('2:255');
    assert.strictEqual(s.tok(), 1);
    const tokenCall = s.calls.find((c) => c.url.endsWith('/oauth2/token'))!;
    assert.strictEqual(tokenCall.init.headers.authorization, `Basic ${Buffer.from('cid:secret').toString('base64')}`);
    assert.strictEqual(new URLSearchParams(tokenCall.init.body).get('scope'), SCOPES);
    assert.strictEqual(s.calls.filter((c) => c.url.includes('/verses/by_key/')).length, 1);
    const api = s.calls.find((c) => c.url.includes('/verses/by_page/'))!;
    assert.deepStrictEqual([api.init.headers['x-auth-token'], api.init.headers['x-client-id']], ['tok1', 'cid']);
    assert.strictEqual(b, 42);
    // Only real words reach the page, with their tajweed markup and simple spelling.
    assert.deepStrictEqual(a.verses[0].words, [{ p: 1, line: 2, t: 'بِسۡمِ', s: 'بسم' }]);
  });

  it('a new token after expiry, and a 401 drops the token and retries once', async () => {
    const s = setup();
    await s.q.page(1);
    s.tick(3600_000);
    await s.q.page(2);
    assert.strictEqual(s.tok(), 2);
    s.fail401();
    await s.q.page(3);
    assert.strictEqual(s.tok(), 3);
  });

  it('refuses pages and reciters outside the mushaf without calling the API', async () => {
    const s = setup();
    await assert.rejects(s.q.page(605), /range/);
    await assert.rejects(s.q.audio(99, 1), /reciter/);
    assert.strictEqual(s.calls.length, 0);
  });
});

describe('CL-42 rules', () => {
  it('Quran tracks, Islamic studies and Fusha see the tab; nobody else', () => {
    assert.ok(quranTabAllowed(['tajweed']));
    assert.ok(quranTabAllowed(['english', 'seerah']));
    assert.ok(quranTabAllowed(['modern-standard-arabic']));
    assert.ok(!quranTabAllowed(['english', 'egyptian-arabic', null]));
  });

  it('a mark needs a real ayah, a word, a known type and a short note', () => {
    assert.ok(parseMark({ verseKey: '2:255', word: 3, type: 'tajweed', note: ' madd ' }).ok);
    assert.ok(!parseMark({ verseKey: '1:8', word: 1, type: 'missed' }).ok);
    assert.ok(!parseMark({ verseKey: '115:1', word: 1, type: 'missed' }).ok);
    assert.ok(!parseMark({ verseKey: '1:1', word: 0, type: 'missed' }).ok);
    assert.ok(!parseMark({ verseKey: '1:1', word: 1, type: 'other' }).ok);
    assert.ok(!parseMark({ verseKey: '1:1', word: 1, type: 'added', note: 'x'.repeat(301) }).ok);
  });

  it('marks are released per lesson whose report was sent', () => {
    const marks = [{ booking_id: 'a' }, { booking_id: 'b' }];
    assert.deepStrictEqual(releasedMarks(marks, new Set(['b'])), [{ booking_id: 'b' }]);
  });

  it('agreement is shared words over all flagged words; hints wait for 100 recordings at 90%', () => {
    assert.strictEqual(agreement([], []), 1);
    assert.strictEqual(agreement(['1:1:1', '1:1:2'], ['1:1:2', '1:1:3']), 1 / 3);
    const run = (i: number, same: boolean) => ({ id: String(i), model: 'm', created_at: 'x', reviewed_at: 'y', flags: [{ key: '1:1:1', kind: 'missing' as const }], teacher_marks: [{ key: same ? '1:1:1' : '1:1:2', type: 'missed' }, { key: '1:1:4', type: 'tajweed' }] });
    const almost = accuracySummary(Array.from({ length: HINTS_MIN_RECORDINGS - 1 }, (_, i) => run(i, true)), true);
    assert.deepStrictEqual([almost.reviewed, almost.agreement, almost.ready, almost.hintsOn], [99, 1, false, false]);
    const enough = accuracySummary([...Array.from({ length: 95 }, (_, i) => run(i, true)), ...Array.from({ length: 5 }, (_, i) => run(100 + i, false))], false);
    assert.deepStrictEqual([enough.reviewed, enough.ready, enough.hintsOn], [100, true, false]);
    const waiting = accuracySummary([{ ...run(1, true), reviewed_at: null, teacher_marks: null }], true);
    assert.deepStrictEqual([waiting.reviewed, waiting.waiting], [0, 1]);
  });

  it('the report draft carries the lesson marks, ayat in mushaf order', () => {
    const d = buildReportDraft({ rows: [], stopMs: 0, fileIds: [], sharedIds: [], quranMarks: [{ verse_key: '2:10', type: 'missed' }, { verse_key: '2:9', type: 'tajweed' }, { verse_key: '2:10', type: 'missed' }] });
    assert.deepStrictEqual(d.quran, { total: 3, byType: { missed: 2, tajweed: 1 }, verses: ['2:9', '2:10'] });
    assert.strictEqual(buildReportDraft({ rows: [], stopMs: 0, fileIds: [], sharedIds: [] }).quran, null);
  });

  it('a child phone may read the mushaf and send a detector result, nothing else of the tab', () => {
    assert.ok(isChildRoute('GET', '/api/student/quran/page/12'));
    assert.ok(isChildRoute('GET', '/api/student/quran/audio/7/1'));
    assert.ok(isChildRoute('GET', '/api/student/quran/marks'));
    assert.ok(isChildRoute('POST', '/api/student/quran/detector-runs'));
    assert.ok(!isChildRoute('GET', '/api/dashboard/quran/page/12'));
    assert.ok(!isChildRoute('PUT', '/api/student/quran/marks'));
  });
});

const B1 = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const B2 = '5049fa58-7428-44e4-926b-5e3eb315c5cb';
const S1 = '6049fa58-7428-44e4-926b-5e3eb315c5cb';
const S2 = '7049fa58-7428-44e4-926b-5e3eb315c5cb';
const R1 = '8049fa58-7428-44e4-926b-5e3eb315c5cb';
const R2 = '9049fa58-7428-44e4-926b-5e3eb315c5cb';

describe('CL-42 Quran routes', () => {
  let server: http.Server;
  let base: string;
  const db = fakeDb({
    bookings: [
      { id: B1, teacher_id: 't1', student_id: S1, service_id: 'quran-reading' },
      { id: B2, teacher_id: 't1', student_id: S1, service_id: 'quran-reading' },
    ],
    students: [{ id: S1, learning_interest: 'english', assigned_teacher_id: 't1' }, { id: S2, learning_interest: 'english', assigned_teacher_id: 't2' }],
    lesson_sessions: [{ id: 'ses-1', booking_id: B1 }, { id: 'ses-2', booking_id: B2 }],
    lesson_notes: [],
    recitation_recordings: [{ id: R1, student_id: S1 }, { id: R2, student_id: S2 }],
  });
  const teacherAuth = (req: any, res: any, next: any) => {
    const id = req.headers['x-teacher'];
    if (!id) return res.status(401).json({ error: 'auth' });
    req.teacherUser = { id, role: id === 'admin' ? 'super_admin' : 'teacher' };
    next();
  };
  const studentAuth = (req: any, _res: any, next: any) => { req.studentUser = { auth_id: req.headers['x-family'] }; next(); };
  const superOnly = (req: any, res: any, next: any) => (req.teacherUser.role === 'super_admin' ? next() : res.status(403).json({ error: 'no' }));
  const fakeQuran: any = { page: async (n: number) => ({ page: n, verses: [] }), chapters: async () => [], pageOf: async () => 1, audio: async () => ({}) };

  before(async () => {
    const app = express();
    app.use(express.json());
    registerQuranRoutes(app, {
      getClient: () => db, quran: () => fakeQuran, verifyTeacherAuth: teacherAuth, verifyStudentAuth: studentAuth, requireSuperAdmin: superOnly,
      rateLimit: (_q: any, _s: any, n: any) => n(), hintsFlag: () => false,
      getLearners: async (_c: any, req: any) => (req.studentUser.auth_id === 'fam1' ? [{ id: S1, name: 'Yusuf' }] : [{ id: S2, name: 'Other' }]),
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });
  const call = (method: string, path: string, headers: Record<string, string>, body?: unknown) =>
    fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });

  it('the tab shows for a learner with a Quran lesson, not for a learner with none', async () => {
    assert.deepStrictEqual((await (await call('GET', '/api/student/quran/access', { 'x-family': 'fam1' })).json() as any).learners, [{ id: S1, name: 'Yusuf' }]);
    assert.deepStrictEqual((await (await call('GET', '/api/student/quran/access', { 'x-family': 'fam2' })).json() as any).learners, []);
  });

  it('content is served from the server-side client', async () => {
    const r = await call('GET', '/api/student/quran/page/3', { 'x-family': 'fam1' });
    assert.deepStrictEqual(await r.json(), { page: 3, verses: [] });
    assert.match(r.headers.get('cache-control') || '', /max-age/);
    assert.strictEqual((await call('GET', '/api/dashboard/quran/verse/1:9', { 'x-teacher': 't1' })).status, 404);
  });

  it('only the lesson\'s teacher (or the super admin) marks words; one mark per word, changed in place', async () => {
    assert.strictEqual((await call('PUT', `/api/dashboard/bookings/${B1}/quran-marks`, { 'x-teacher': 't2' }, { verseKey: '1:2', word: 2, type: 'missed' })).status, 403);
    assert.strictEqual((await call('PUT', `/api/dashboard/bookings/${B1}/quran-marks`, { 'x-teacher': 't1' }, { verseKey: '1:2', word: 99, type: 'nope' })).status, 400);
    const first: any = await (await call('PUT', `/api/dashboard/bookings/${B1}/quran-marks`, { 'x-teacher': 't1' }, { verseKey: '1:2', word: 2, type: 'missed' })).json();
    const again: any = await (await call('PUT', `/api/dashboard/bookings/${B1}/quran-marks`, { 'x-teacher': 't1' }, { verseKey: '1:2', word: 2, type: 'tajweed', note: 'madd' })).json();
    assert.strictEqual(first.mark.id, again.mark.id);
    assert.strictEqual(db.tables.quran_marks.length, 1);
    assert.strictEqual(db.tables.quran_marks[0].student_id, S1);
    await call('PUT', `/api/dashboard/bookings/${B2}/quran-marks`, { 'x-teacher': 'admin' }, { verseKey: '1:3', word: 1, type: 'wrong_word' });
    const list: any = await (await call('GET', `/api/dashboard/bookings/${B1}/quran-marks`, { 'x-teacher': 't1' })).json();
    assert.deepStrictEqual(list.marks.map((m: any) => [m.verseKey, m.word, m.type, m.note]), [['1:2', 2, 'tajweed', 'madd']]);
    assert.strictEqual((await call('GET', `/api/dashboard/bookings/${B1}/quran-marks`, { 'x-teacher': 't2' })).status, 403);
  });

  it('the learner sees a lesson\'s marks only after its report was sent; other families never', async () => {
    const before: any = await (await call('GET', `/api/student/quran/marks?learnerId=${S1}`, { 'x-family': 'fam1' })).json();
    assert.deepStrictEqual(before.marks, []);
    db.tables.lesson_notes.push({ session_id: 'ses-1', family_summary: 'Well done' });
    const afterSend: any = await (await call('GET', `/api/student/quran/marks?learnerId=${S1}`, { 'x-family': 'fam1' })).json();
    assert.deepStrictEqual(afterSend.marks.map((m: any) => m.bookingId), [B1]);
    assert.strictEqual((await call('GET', `/api/student/quran/marks?learnerId=${S1}`, { 'x-family': 'fam2' })).status, 403);
  });

  it('a teacher removes only marks of their lesson', async () => {
    const id = db.tables.quran_marks.find((m: any) => m.booking_id === B1).id;
    assert.strictEqual((await call('DELETE', `/api/dashboard/bookings/${B1}/quran-marks/${id}`, { 'x-teacher': 't2' })).status, 403);
    assert.strictEqual((await call('DELETE', `/api/dashboard/bookings/${B1}/quran-marks/${id}`, { 'x-teacher': 't1' })).status, 200);
    assert.ok(!db.tables.quran_marks.some((m: any) => m.id === id));
  });

  it('detector results: own recording only, flags inside the assigned part, once per recording', async () => {
    const body = { learnerId: S1, recordingId: R1, surah: 1, ayahFrom: 1, ayahTo: 7, model: 'tarteel-whisper-base', flags: [{ key: '1:2:2', kind: 'missing' }] };
    assert.strictEqual((await call('POST', '/api/student/quran/detector-runs', { 'x-family': 'fam1' }, { ...body, recordingId: R2 })).status, 403);
    assert.strictEqual((await call('POST', '/api/student/quran/detector-runs', { 'x-family': 'fam2' }, body)).status, 403);
    assert.strictEqual((await call('POST', '/api/student/quran/detector-runs', { 'x-family': 'fam1' }, { ...body, flags: [{ key: '2:1:1', kind: 'missing' }] })).status, 400);
    assert.strictEqual((await call('POST', '/api/student/quran/detector-runs', { 'x-family': 'fam1' }, { ...body, ayahTo: 8 })).status, 400);
    assert.strictEqual((await call('POST', '/api/student/quran/detector-runs', { 'x-family': 'fam1' }, body)).status, 201);
    assert.strictEqual((await call('POST', '/api/student/quran/detector-runs', { 'x-family': 'fam1' }, body)).status, 409);
  });

  it('blind review: the learner\'s teacher marks the recording without seeing the flags; the super admin sees agreement', async () => {
    const view: any = await (await call('GET', `/api/dashboard/recitations/${R1}/quran-review`, { 'x-teacher': 't1' })).json();
    assert.deepStrictEqual(view.review, { surah: 1, ayahFrom: 1, ayahTo: 7, marks: [], reviewedAt: null });
    assert.ok(!('flags' in view.review));
    assert.strictEqual((await call('GET', `/api/dashboard/recitations/${R1}/quran-review`, { 'x-teacher': 't2' })).status, 403);
    assert.strictEqual((await call('POST', `/api/dashboard/recitations/${R1}/quran-review`, { 'x-teacher': 't1' }, { marks: [{ key: '2:1:1', type: 'missed' }] })).status, 400);
    assert.strictEqual((await call('POST', `/api/dashboard/recitations/${R1}/quran-review`, { 'x-teacher': 't1' }, { marks: [{ key: '1:2:2', type: 'missed' }] })).status, 200);
    assert.strictEqual((await call('GET', '/api/admin/quran/accuracy', { 'x-teacher': 't1' })).status, 403);
    const acc: any = await (await call('GET', '/api/admin/quran/accuracy', { 'x-teacher': 'admin' })).json();
    assert.deepStrictEqual([acc.reviewed, acc.agreement, acc.ready, acc.hintsOn], [1, 1, false, false]);
  });
});
