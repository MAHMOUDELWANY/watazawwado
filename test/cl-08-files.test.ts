import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { signTicket } from '../server/classroom/access.js';
import { registerClassroomRoutes, detectFileType, CLASSROOM_FILES_BUCKET } from '../server/routes/classroom.js';
import { roomHardCloseMs } from '../src/lib/roomWindow.js';

const NOW = Date.parse('2026-11-20T10:05:00Z');
const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const SECRET = 'room-secret';
const booking = {
  id: BOOKING_ID, student_id: 'child-1', teacher_id: 'teacher-1', status: 'confirmed',
  scheduled_start: '2026-11-20T10:00:00Z', scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf',
};
const HARD_CLOSE = roomHardCloseMs(booking);

const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(100)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100)]);
const EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(100)]);

describe('CL-08 detectFileType', () => {
  it('reads PDF, PNG and JPEG magic bytes and nothing else', () => {
    assert.strictEqual(detectFileType(PDF), 'application/pdf');
    assert.strictEqual(detectFileType(PNG), 'image/png');
    assert.strictEqual(detectFileType(JPG), 'image/jpeg');
    assert.strictEqual(detectFileType(EXE), null);
    assert.strictEqual(detectFileType(Buffer.alloc(0)), null);
  });
});

describe('CL-08 files routes', () => {
  let server: http.Server;
  let base: string;
  const uploads: Array<{ bucket: string; path: string; contentType: string; size: number }> = [];
  const signed: Array<{ path: string; seconds: number }> = [];
  const sessions = {
    teacher: { joinId: 'jt', userId: 'teacher-1', at: 'x' },
    learner: { joinId: 'jl', userId: 'parent-1', at: 'x' },
  };
  const db = {
    from(t: string) {
      const b: any = {
        select: () => b,
        eq: () => b,
        maybeSingle: async () => ({ data: t === 'bookings' ? booking : t === 'lesson_room_state' ? { snapshot: { sessions } } : null, error: null }),
      };
      return b;
    },
    storage: {
      from(bucket: string) {
        return {
          upload: async (path: string, body: Buffer, opts: any) => { uploads.push({ bucket, path, contentType: opts.contentType, size: body.length }); return { data: { path }, error: null }; },
          createSignedUrl: async (path: string, seconds: number) => { signed.push({ path, seconds }); return { data: { signedUrl: `https://files.test/${path}?exp=${seconds}` }, error: null }; },
        };
      },
    },
  };

  before(async () => {
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    registerClassroomRoutes(app, {
      getClient: () => db,
      cloudflare: () => null,
      verifyTeacherAuth: (_q: any, _s: any, next: any) => next(),
      verifyStudentAuth: (_q: any, _s: any, next: any) => next(),
      getLearners: async () => [],
      rateLimit: (_q: any, _s: any, next: any) => next(),
      roomRateLimit: (_q: any, _s: any, next: any) => next(),
      secret: () => SECRET,
      now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const ticket = (role: string, userId: string, joinId: string) =>
    signTicket({ bookingId: BOOKING_ID, role: role as any, userId, exp: HARD_CLOSE, joinId, studentId: 'child-1' }, SECRET);
  const T = ticket('teacher', 'teacher-1', 'jt');
  const L = ticket('learner', 'parent-1', 'jl');
  const G = ticket('guardian_observer', 'parent-2', 'jg');
  const upload = (t: string, body: Buffer, type: string) =>
    fetch(`${base}/api/classroom/${BOOKING_ID}/files`, { method: 'POST', headers: { 'content-type': type, 'x-room-ticket': t }, body });

  it('refuses learner and observer tickets', async () => {
    assert.strictEqual((await upload(L, PDF, 'application/pdf')).status, 403);
    assert.strictEqual((await upload(G, PDF, 'application/pdf')).status, 403);
    assert.strictEqual(uploads.length, 0);
  });

  it('refuses an .exe, even when it claims to be a PDF', async () => {
    assert.strictEqual((await upload(T, EXE, 'application/x-msdownload')).status, 415);
    assert.strictEqual((await upload(T, EXE, 'application/pdf')).status, 415);
    assert.strictEqual((await upload(T, PNG, 'application/pdf')).status, 415);
    assert.strictEqual(uploads.length, 0);
  });

  it('refuses files over 20 MB', async () => {
    const big = Buffer.concat([PDF, Buffer.alloc(20 * 1024 * 1024)]);
    assert.strictEqual((await upload(T, big, 'application/pdf')).status, 413);
    assert.strictEqual(uploads.length, 0);
  });

  it('stores a PDF privately and returns a signed URL that ends no later than the hard close', async () => {
    const res = await upload(T, PDF, 'application/pdf');
    assert.strictEqual(res.status, 200);
    const { fileId, url } = await res.json();
    assert.match(fileId, /^[0-9a-f-]{36}\.pdf$/);
    assert.deepStrictEqual(uploads[0], { bucket: CLASSROOM_FILES_BUCKET, path: `${BOOKING_ID}/${fileId}`, contentType: 'application/pdf', size: PDF.length });
    assert.ok(url.startsWith('https://files.test/'));
    const s = signed.at(-1)!;
    assert.ok(s.seconds > 0 && NOW + s.seconds * 1000 <= HARD_CLOSE, `expiry ${s.seconds}s passes the hard close`);
  });

  it('gives any ticket of the booking a fresh signed URL, and refuses bad ids', async () => {
    const res = await upload(T, JPG, 'image/jpeg');
    const { fileId } = await res.json();
    const get = (t: string, id: string) => fetch(`${base}/api/classroom/${BOOKING_ID}/files/${id}`, { headers: { 'x-room-ticket': t } });
    const r = await get(L, fileId);
    assert.strictEqual(r.status, 200);
    assert.ok((await r.json()).url.includes(`${BOOKING_ID}/${fileId}`));
    assert.ok(NOW + signed.at(-1)!.seconds * 1000 <= HARD_CLOSE);
    assert.strictEqual((await get(L, '..%2Fother.pdf')).status, 404);
    assert.strictEqual((await get('bad', fileId)).status, 401);
  });
});
