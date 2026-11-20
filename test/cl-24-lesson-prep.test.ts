import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import express from 'express';
import { registerLessonPrepRoutes, cleanSlide } from '../server/routes/lessonPrep.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';
import { startingLesson } from '../src/classroom/parts/Curriculum.js';

const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const START = Date.parse('2026-11-22T10:00:00Z');
const PDF = Buffer.from('%PDF-1.7\n0000000000');

function fakeDb(tables: Record<string, any[]>) {
  const rows = (t: string) => (tables[t] ||= []);
  const objects = new Map<string, Buffer>();
  const removed: string[] = [];
  const storage = {
    objects, removed,
    from: () => ({
      createSignedUploadUrl: async (path: string) => ({ data: { token: `tok:${path}`, signedUrl: `https://up/${path}` }, error: null }),
      createSignedUrl: async (path: string, seconds: number) => ({ data: { signedUrl: `https://get/${path}?s=${seconds}` }, error: null }),
      info: async (path: string) => (objects.has(path) ? { data: { size: objects.get(path)!.length }, error: null } : { data: null, error: { message: 'none' } }),
      download: (path: string) => ({
        asStream: async () => ({ data: new ReadableStream({ start(c) { c.enqueue(new Uint8Array(objects.get(path)!)); c.close(); } }), error: null }),
      }),
      remove: async (paths: string[]) => { for (const p of paths) { objects.delete(p); removed.push(p); } return { error: null }; },
      list: async (folder: string) => ({ data: [...objects.keys()].filter((k) => k.startsWith(`${folder}/`)).map((k) => ({ name: k.slice(folder.length + 1) })), error: null }),
    }),
  };
  return {
    tables, storage,
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      let del = false;
      const b: any = {
        select: () => b, order: () => b, limit: () => b,
        delete: () => { del = true; return b; },
        // A list read (or a delete) is awaited on the builder itself.
        then: (ok: any, bad: any) => {
          const hit = rows(t).filter((r) => filters.every((f) => f(r)));
          if (del) tables[t] = rows(t).filter((r) => !hit.includes(r));
          return Promise.resolve({ data: del ? null : hit, error: null }).then(ok, bad);
        },
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        is: (c: string, v: any) => { filters.push((r) => (r[c] ?? null) === v); return b; },
        maybeSingle: async () => ({ data: rows(t).find((r) => filters.every((f) => f(r))) ?? null, error: null }),
        insert: async (row: any) => { rows(t).push(...(Array.isArray(row) ? row : [row])); return { error: null }; },
        upsert: async (row: any, opts: { onConflict: string }) => {
          const keys = opts.onConflict.split(',').map((k) => k.trim());
          const i = rows(t).findIndex((r) => keys.every((k) => r[k] === row[k]));
          if (i < 0) rows(t).push({ ...row }); else if (!(opts as any).ignoreDuplicates) Object.assign(rows(t)[i], row);
          return { error: null };
        },
      };
      return b;
    },
  };
}

describe('CL-24 prepared slide', () => {
  it('cleanSlide keeps a valid slide, clears with null, refuses anything else', () => {
    assert.deepStrictEqual(cleanSlide({ track: 'quran-kids', number: 3, page: 2, extra: 1 }), { track: 'quran-kids', number: 3, page: 2 });
    assert.strictEqual(cleanSlide(null), null);
    for (const bad of [{}, { track: '', number: 1, page: 0 }, { track: 'x', number: 0, page: 0 }, { track: 'x', number: 1, page: -1 }, { track: 'x', number: 1.5, page: 0 }, 'x']) {
      assert.strictEqual(cleanSlide(bad), undefined, JSON.stringify(bad));
    }
  });
  it('a rejoin snapshot still wins over the prepared slide (sent as lastReport)', () => {
    const tracks = [{ id: 'a', group: 'quran', lessons: { 1: {}, 2: {} } }, { id: 'b', group: 'quran', lessons: { 1: {} } }];
    const prepared = { serviceId: null, learnerType: null, lastReport: { track: 'a', number: 2, page: 4 } };
    assert.deepStrictEqual(startingLesson(tracks, undefined, prepared), { track: 'a', number: 2, page: 4 });
    assert.deepStrictEqual(startingLesson(tracks, { track: 'b', number: 1, page: 1, step: 0 }, prepared), { track: 'b', number: 1, page: 1 });
  });
});

describe('CL-24 prep routes', () => {
  let server: http.Server;
  let base: string;
  let clock = START - 2 * 24 * 3600_000;
  const db = fakeDb({
    bookings: [{ id: BOOKING_ID, teacher_id: 'teacher-1', student_id: 'child-1', status: 'confirmed', scheduled_start: new Date(START).toISOString(), scheduled_end: new Date(START + 30 * 60_000).toISOString(), duration_minutes: 30, contact_name: 'Yusuf', service_id: 'quran-kids' }],
    students: [{ id: 'child-1', name: 'Yusuf', learner_type: 'child' }],
    services: [{ id: 'quran-kids', title: 'Quran for Kids', arabic_title: 'القرآن للأطفال' }],
    curriculum_lesson_reports: [{ student_id: 'child-1', subject: 'quran-kids', lesson_number: 4, to_page: 6 }],
    profiles: [{ id: 'teacher-1', display_name: 'Ustadha Afnan' }],
  });
  const client = { ...db, storage: db.storage, from: db.from };
  const teacherAuth = (req: any, res: any, next: any) => {
    const id = req.headers['x-teacher'];
    if (!id) return res.status(401).json({ error: 'auth' });
    req.teacherUser = { id, role: id === 'admin-1' ? 'super_admin' : 'teacher' };
    next();
  };
  const pass = (_q: any, _s: any, next: any) => next();

  before(async () => {
    const app = express();
    app.use(express.json());
    registerLessonPrepRoutes(app, { getClient: () => client, verifyTeacherAuth: teacherAuth, rateLimit: pass, now: () => clock });
    registerClassroomRoutes(app, {
      getClient: () => client, classroomEnabled: () => true,
      cloudflare: () => ({ configured: true, iceServers: async () => [] }) as any,
      verifyTeacherAuth: teacherAuth,
      verifyStudentAuth: (req: any, _res: any, next: any) => { req.studentUser = { auth_id: 'parent-1' }; next(); },
      getLearners: async () => [{ id: 'child-1', name: 'Yusuf', learnerType: 'child' }],
      rateLimit: pass, roomRateLimit: pass, requireSuperAdmin: pass, secret: () => 'room-secret', now: () => clock,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const prep = (who: string, method = 'GET', path = '', body?: unknown) =>
    fetch(`${base}/api/dashboard/classroom/${BOOKING_ID}/prep${path}`, { method, headers: { 'content-type': 'application/json', ...(who ? { 'x-teacher': who } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const row = () => db.tables.lesson_prep?.[0];
  const named = () => (db.tables.lesson_files || []).map((r) => ({ fileId: r.file_id, name: r.name, source: r.source }));

  it('only the lesson\'s teacher or a super admin, days before the lesson', async () => {
    assert.strictEqual((await prep('')).status, 401);
    assert.strictEqual((await prep('teacher-2')).status, 403);
    assert.strictEqual((await prep('admin-1')).status, 200);
    const res = await prep('teacher-1');
    assert.strictEqual(res.status, 200);
    const body: any = await res.json();
    assert.strictEqual(body.lesson.learnerName, 'Yusuf');
    assert.strictEqual(body.lesson.learnerType, 'child');
    assert.strictEqual(body.lesson.roomOpen, false);
    assert.deepStrictEqual(body.lastReport, { track: 'quran-kids', number: 4, page: 6 });
    assert.deepStrictEqual(body.prep, { notes: '', slide: null, files: [] });
  });

  it('saves notes and the slide, and checks them', async () => {
    assert.strictEqual((await prep('teacher-1', 'PUT', '', { notes: 'Revise ghunnah' })).status, 200);
    assert.strictEqual((await prep('teacher-1', 'PUT', '', { slide: { track: 'quran-kids', number: 5, page: 0 } })).status, 200);
    assert.strictEqual(row().notes, 'Revise ghunnah');
    assert.deepStrictEqual(row().slide, { track: 'quran-kids', number: 5, page: 0 });
    assert.strictEqual(row().teacher_user_id, 'teacher-1');
    for (const body of [{}, { notes: 5 }, { notes: 'x'.repeat(8001) }, { slide: { track: 'x' } }]) {
      assert.strictEqual((await prep('teacher-1', 'PUT', '', body)).status, 400, JSON.stringify(body));
    }
    assert.strictEqual((await prep('teacher-2', 'PUT', '', { notes: 'hack' })).status, 403);
    assert.strictEqual(row().notes, 'Revise ghunnah');
  });

  let fileId = '';
  it('uploads a file in two steps into the lesson\'s room folder, with its name', async () => {
    assert.strictEqual((await prep('teacher-1', 'POST', '/files/upload-url', { contentType: 'text/html', size: 10 })).status, 415);
    assert.strictEqual((await prep('teacher-1', 'POST', '/files/upload-url', { contentType: 'application/pdf', size: 30 * 1024 * 1024 })).status, 413);
    const up: any = await (await prep('teacher-1', 'POST', '/files/upload-url', { contentType: 'application/pdf', size: PDF.length })).json();
    fileId = up.fileId;
    assert.strictEqual(up.path, `${BOOKING_ID}/${fileId}`);
    assert.strictEqual((await prep('teacher-1', 'POST', `/files/${fileId}/confirm`, { name: 'Page 12.pdf' })).status, 404, 'not uploaded yet');
    db.storage.objects.set(up.path, PDF);
    const ok = await prep('teacher-1', 'POST', `/files/${fileId}/confirm`, { name: 'Page 12.pdf' });
    assert.strictEqual(ok.status, 200);
    assert.deepStrictEqual(named(), [{ fileId, name: 'Page 12.pdf', source: 'prep' }]);
    const got: any = await (await prep('teacher-1')).json();
    assert.strictEqual(got.prep.files[0].name, 'Page 12.pdf');
    assert.match(got.prep.files[0].url, /^https:\/\/get\//);
  });

  it('a file whose bytes are not what it claims is removed', async () => {
    const up: any = await (await prep('teacher-1', 'POST', '/files/upload-url', { contentType: 'application/pdf', size: 10 })).json();
    db.storage.objects.set(up.path, Buffer.from('<html>evil</html>'));
    assert.strictEqual((await prep('teacher-1', 'POST', `/files/${up.fileId}/confirm`, { name: 'x.pdf' })).status, 415);
    assert.ok(db.storage.removed.includes(up.path));
    assert.strictEqual(named().length, 1);
  });

  it('in the room: the teacher\'s slides open on the prepared slide, the notes and files are there; the learner sees neither', async () => {
    clock = START - 5 * 60_000;
    const t: any = await (await fetch(`${base}/api/dashboard/classroom/${BOOKING_ID}/enter`, { headers: { 'x-teacher': 'teacher-1' } })).json();
    assert.deepStrictEqual(t.lastReport, { track: 'quran-kids', number: 5, page: 0 });
    assert.strictEqual(t.prepNotes, 'Revise ghunnah');
    const list: any = await (await fetch(`${base}/api/classroom/${BOOKING_ID}/files`, { headers: { 'x-room-ticket': t.ticket } })).json();
    assert.deepStrictEqual(list.files, [{ fileId, name: 'Page 12.pdf', prepared: true }]);
    const l: any = await (await fetch(`${base}/api/student/classroom/${BOOKING_ID}/enter`)).json();
    assert.strictEqual(l.role, 'learner');
    assert.strictEqual(l.prepNotes, undefined);
    assert.strictEqual((await fetch(`${base}/api/classroom/${BOOKING_ID}/files`, { headers: { 'x-room-ticket': l.ticket } })).status, 403);

    // A file added in the room keeps its original name (control characters dropped); a prepared one keeps its own.
    const roomFile = '0a6c3c55-1111-4222-8333-444455556666.png';
    const nameIt = (tk: string, id: string, name: unknown) => fetch(`${base}/api/classroom/${BOOKING_ID}/files/${id}/name`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': tk }, body: JSON.stringify({ name }) });
    assert.strictEqual((await nameIt(t.ticket, roomFile, 'board.png')).status, 404, 'not in storage');
    db.storage.objects.set(`${BOOKING_ID}/${roomFile}`, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    assert.strictEqual((await nameIt(l.ticket, roomFile, 'x.png')).status, 403, 'teacher only');
    assert.strictEqual((await nameIt(t.ticket, roomFile, 'Sura\u0007 Al-Fil.png')).status, 200);
    assert.strictEqual((await nameIt(t.ticket, fileId, 'renamed.pdf')).status, 200);
    const after: any = await (await fetch(`${base}/api/classroom/${BOOKING_ID}/files`, { headers: { 'x-room-ticket': t.ticket } })).json();
    assert.deepStrictEqual(after.files.find((f: any) => f.fileId === roomFile), { fileId: roomFile, name: 'Sura Al-Fil.png', prepared: false });
    assert.strictEqual(after.files.find((f: any) => f.fileId === fileId).name, 'Page 12.pdf');
    db.tables.lesson_files = db.tables.lesson_files.filter((r) => r.file_id !== roomFile);
    db.storage.objects.delete(`${BOOKING_ID}/${roomFile}`);
  });

  it('removes a prepared file; closed once the lesson is over', async () => {
    clock = START - 60 * 60_000;
    assert.strictEqual((await prep('teacher-1', 'DELETE', `/files/${fileId}`)).status, 200);
    assert.deepStrictEqual(named(), []);
    assert.ok(!db.storage.objects.has(`${BOOKING_ID}/${fileId}`));
    clock = START + 2 * 3600_000;
    assert.strictEqual((await prep('teacher-1')).status, 423);
    db.tables.bookings[0].status = 'cancelled';
    clock = START - 60 * 60_000;
    assert.strictEqual((await prep('teacher-1')).status, 409);
  });
});

describe('CL-24 wiring', () => {
  const read = (p: string) => fs.readFileSync(p, 'utf8');
  it('route, lesson-card link, room file list and notes are in place', () => {
    assert.match(read('api/index.ts'), /registerLessonPrepRoutes\(app, /);
    assert.match(read('src/dashboard/DashboardApp.tsx'), /path="\/prepare\/:id"/);
    assert.match(read('src/dashboard/pages/TodayPage.tsx'), /<PrepareLessonLink /);
    const page = read('src/classroom/ClassroomPage.tsx');
    assert.match(page, /<PrepNotes text=\{entry\.prepNotes\}/);
    assert.match(page, /\/files`, \{ headers: \{ 'x-room-ticket': ticket \} \}/);
    assert.match(page, /\/name`, \{/);
    assert.match(read('supabase/migrations/20261120100000_classroom_before_lesson.sql'), /CREATE TABLE IF NOT EXISTS public\.lesson_files/);
    const sql = read('supabase/migrations/20261120100000_classroom_before_lesson.sql');
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.lesson_prep/);
    assert.match(sql, /REVOKE ALL ON TABLE public\.lesson_prep FROM anon, authenticated/);
  });
});
