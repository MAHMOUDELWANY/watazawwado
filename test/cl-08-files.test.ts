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
  // In-memory bucket: path -> bytes. Uploads land here directly, as the browser would with the signed token.
  const objects = new Map<string, Buffer>();
  const uploadUrls: Array<{ bucket: string; path: string }> = [];
  const removed: string[] = [];
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
          createSignedUploadUrl: async (path: string) => { uploadUrls.push({ bucket, path }); return { data: { path, token: `tok-${path}`, signedUrl: `https://files.test/upload/${path}` }, error: null }; },
          info: async (path: string) => (objects.has(path) ? { data: { size: objects.get(path)!.length }, error: null } : { data: null, error: { message: 'not found' } }),
          download: (path: string) => ({
            asStream: async () => {
              const buf = objects.get(path);
              if (!buf) return { data: null, error: { message: 'not found' } };
              // Two chunks, so the reader has to stop early instead of buffering the whole file.
              return { data: new ReadableStream({ start(c) { c.enqueue(new Uint8Array(buf.subarray(0, 4))); c.enqueue(new Uint8Array(buf.subarray(4))); c.close(); } }), error: null };
            },
          }),
          remove: async (paths: string[]) => { for (const p of paths) { removed.push(p); objects.delete(p); } return { data: [], error: null }; },
          createSignedUrl: async (path: string, seconds: number) => { signed.push({ path, seconds }); return { data: { signedUrl: `https://files.test/${path}?exp=${seconds}` }, error: null }; },
        };
      },
    },
  };

  before(async () => {
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    registerClassroomRoutes(app, {
      getClient: () => db, classroomEnabled: () => true,
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
  const post = (t: string, path: string, body?: unknown) =>
    fetch(`${base}/api/classroom/${BOOKING_ID}/files${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': t }, body: JSON.stringify(body ?? {}) });
  const askUrl = (t: string, contentType: string, size: number) => post(t, '/upload-url', { contentType, size });
  const confirm = (t: string, fileId: string) => post(t, `/${encodeURIComponent(fileId)}/confirm`);
  /** The three steps, with the browser's direct upload simulated by writing into the fake bucket. */
  const addFile = async (bytes: Buffer, contentType: string) => {
    const r = await askUrl(T, contentType, bytes.length);
    assert.strictEqual(r.status, 200);
    const { fileId, path, token } = await r.json();
    assert.strictEqual(token, `tok-${path}`);
    objects.set(path, bytes);
    return { fileId, path, res: await confirm(T, fileId) };
  };

  it('refuses learner and observer tickets on both steps', async () => {
    assert.strictEqual((await askUrl(L, 'application/pdf', 1000)).status, 403);
    assert.strictEqual((await askUrl(G, 'application/pdf', 1000)).status, 403);
    const fileId = '11111111-1111-4111-8111-111111111111.pdf';
    objects.set(`${BOOKING_ID}/${fileId}`, PDF);
    assert.strictEqual((await confirm(L, fileId)).status, 403);
    assert.strictEqual((await confirm(G, fileId)).status, 403);
    assert.strictEqual(uploadUrls.length, 0);
    assert.strictEqual(signed.length, 0);
    objects.clear();
  });

  it('refuses a type other than PDF, PNG or JPEG, and a declared size over 20 MB', async () => {
    assert.strictEqual((await askUrl(T, 'application/x-msdownload', 1000)).status, 415);
    assert.strictEqual((await askUrl(T, 'application/pdf', 25 * 1024 * 1024)).status, 413);
    assert.strictEqual((await askUrl(T, 'application/pdf', 0)).status, 400);
    assert.strictEqual(uploadUrls.length, 0);
  });

  it('signs an upload only for <bookingId>/<uuid>.<ext> in the private bucket', async () => {
    const r = await askUrl(T, 'image/png', PNG.length);
    const { fileId, path } = await r.json();
    assert.match(fileId, /^[0-9a-f-]{36}\.png$/);
    assert.deepStrictEqual(uploadUrls.at(-1), { bucket: CLASSROOM_FILES_BUCKET, path: `${BOOKING_ID}/${fileId}` });
    assert.strictEqual(path, `${BOOKING_ID}/${fileId}`);
  });

  it('deletes an object whose bytes are not the declared type (415)', async () => {
    const { path, res } = await addFile(EXE, 'application/pdf');
    assert.strictEqual(res.status, 415);
    assert.ok(removed.includes(path));
    assert.ok(!objects.has(path));
    const png = await addFile(PNG, 'application/pdf');
    assert.strictEqual(png.res.status, 415);
    assert.ok(removed.includes(png.path));
  });

  it('deletes an object that is really over 20 MB (413), whatever size was declared', async () => {
    const r = await askUrl(T, 'application/pdf', PDF.length);
    const { fileId, path } = await r.json();
    objects.set(path, Buffer.concat([PDF, Buffer.alloc(20 * 1024 * 1024)]));
    assert.strictEqual((await confirm(T, fileId)).status, 413);
    assert.ok(removed.includes(path));
  });

  it('confirms a real PDF and returns a signed URL that ends no later than the hard close', async () => {
    const { fileId, path, res } = await addFile(PDF, 'application/pdf');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.fileId, fileId);
    assert.ok(body.url.startsWith(`https://files.test/${path}`));
    assert.ok(!removed.includes(path));
    const s = signed.at(-1)!;
    assert.ok(s.seconds > 0 && NOW + s.seconds * 1000 <= HARD_CLOSE, `expiry ${s.seconds}s passes the hard close`);
  });

  it('refuses a confirm for a file that never arrived or a bad id', async () => {
    assert.strictEqual((await confirm(T, '22222222-2222-4222-8222-222222222222.pdf')).status, 404);
    assert.strictEqual((await confirm(T, '../other.pdf')).status, 404);
  });

  it('gives any ticket of the booking a fresh signed URL, and refuses bad ids', async () => {
    const { fileId } = await addFile(JPG, 'image/jpeg');
    const get = (t: string, id: string) => fetch(`${base}/api/classroom/${BOOKING_ID}/files/${id}`, { headers: { 'x-room-ticket': t } });
    const r = await get(L, fileId);
    assert.strictEqual(r.status, 200);
    assert.ok((await r.json()).url.includes(`${BOOKING_ID}/${fileId}`));
    assert.ok(NOW + signed.at(-1)!.seconds * 1000 <= HARD_CLOSE);
    assert.strictEqual((await get(L, '..%2Fother.pdf')).status, 404);
    assert.strictEqual((await get('bad', fileId)).status, 401);
  });
});
