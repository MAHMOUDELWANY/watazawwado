import crypto from 'node:crypto';
import express from 'express';
import { isUuid } from './progress.js';
import { roomHardCloseMs, roomJoinState } from '../../src/lib/roomWindow.js';
import { CLASSROOM_FILES_BUCKET, FILE_EXT, FILE_ID, MAX_FILE_BYTES, cleanFileName, detectFileType, firstBytes } from './classroom.js';

/**
 * BUILD-LIST 1.4: teacher prep mode. Any time before a lesson ends, its teacher (or a super admin) opens the lesson:
 * picks the slide to start on, uploads PDFs and pictures, and writes private notes. Everything waits in the room: the
 * slide is where the teacher's slides open (unless a rejoin snapshot exists), the files sit in the same bucket folder
 * as room uploads (so the room lists them), and the notes show to the teacher only.
 */
type Middleware = (req: any, res: any, next: any) => any;

const BOOKING_COLS = 'id, student_id, teacher_id, status, scheduled_start, scheduled_end, duration_minutes, contact_name, service_id';
export const MAX_PREP_NOTES = 8000;
export const MAX_PREP_FILES = 20;
const MAX_LINK_SECONDS = 3600;

/** The prepared slide, or undefined when it is not a valid one. null clears it. */
export function cleanSlide(v: unknown): { track: string; number: number; page: number } | null | undefined {
  if (v === null) return null;
  const s = v as any;
  if (!s || typeof s !== 'object' || typeof s.track !== 'string' || !s.track || s.track.length > 100) return undefined;
  if (!Number.isInteger(s.number) || s.number < 1 || s.number > 10_000) return undefined;
  if (!Number.isInteger(s.page) || s.page < 0 || s.page > 10_000) return undefined;
  return { track: s.track, number: s.number, page: s.page };
}

export function registerLessonPrepRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyTeacherAuth: Middleware;
  rateLimit: Middleware;
  now?: () => number;
}) {
  const now = deps.now ?? Date.now;
  const iso = () => new Date(now()).toISOString();

  /** The booking when the caller is its teacher (or a super admin) and it is still ahead or on; else sends the error. */
  const prepBooking = async (req: any, res: any): Promise<{ client: any; booking: any } | null> => {
    const stop = (status: number, error: string) => { res.status(status).json({ error }); return null; };
    const client = deps.getClient();
    if (!client) return stop(503, 'The lesson room is not available.');
    const id = String(req.params.id || '');
    if (!isUuid(id)) return stop(404, 'Lesson not found.');
    const { data: booking, error } = await client.from('bookings').select(BOOKING_COLS).eq('id', id).maybeSingle();
    if (error) throw new Error(`bookings: ${error.message}`);
    if (!booking) return stop(404, 'Lesson not found.');
    const me = req.teacherUser;
    if (!me?.id) return stop(401, 'Please sign in again.');
    if (me.role !== 'super_admin' && booking.teacher_id !== me.id) return stop(403, 'This is not your lesson.');
    if (!['confirmed', 'rescheduled'].includes(booking.status)) return stop(409, 'This lesson is not active.');
    if (roomJoinState(booking, now()) === 'ended') return stop(423, 'This lesson is over.');
    return { client, booking };
  };
  const loadPrep = async (client: any, id: string) => {
    const [{ data, error }, { data: rows, error: filesErr }] = await Promise.all([
      client.from('lesson_prep').select('notes, slide').eq('booking_id', id).maybeSingle(),
      client.from('lesson_files').select('file_id, name, created_at').eq('booking_id', id).eq('source', 'prep'),
    ]);
    if (error) throw new Error(`lesson_prep: ${error.message}`);
    if (filesErr) throw new Error(`lesson_files: ${filesErr.message}`);
    const files = [...(rows || [])].sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at)))
      .map((r: any) => ({ fileId: String(r.file_id), name: String(r.name) }));
    return { notes: (data?.notes as string) || '', slide: data?.slide ?? null, files };
  };
  const savePrep = async (client: any, booking: any, req: any, patch: Record<string, unknown>) => {
    const { error } = await client.from('lesson_prep').upsert(
      { booking_id: booking.id, teacher_user_id: String(req.teacherUser.id), ...patch, updated_at: iso() },
      { onConflict: 'booking_id' },
    );
    if (error) throw new Error(`lesson_prep: ${error.message}`);
  };
  const fail = (res: any, err: unknown, where: string) => {
    console.error(`[lesson prep ${where}]`, err);
    return res.status(500).json({ error: 'The lesson could not be prepared right now.' });
  };

  app.get('/api/dashboard/classroom/:id/prep', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    try {
      const got = await prepBooking(req, res);
      if (!got) return;
      const { client, booking } = got;
      const [prep, learner, service, report] = await Promise.all([
        loadPrep(client, booking.id),
        booking.student_id ? client.from('students').select('name, learner_type').eq('id', booking.student_id).maybeSingle() : { data: null },
        booking.service_id ? client.from('services').select('title, arabic_title').eq('id', booking.service_id).maybeSingle() : { data: null },
        // The same "where this learner stopped" the room's enter uses.
        booking.student_id
          ? client.from('curriculum_lesson_reports').select('subject, lesson_number, to_page').eq('student_id', booking.student_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
          : { data: null },
      ]);
      const seconds = Math.min(MAX_LINK_SECONDS, Math.floor((roomHardCloseMs(booking) - now()) / 1000));
      const bucket = client.storage.from(CLASSROOM_FILES_BUCKET);
      const files = await Promise.all(prep.files.map(async (f) => {
        const { data } = await bucket.createSignedUrl(`${booking.id}/${f.fileId}`, Math.max(1, seconds));
        return { ...f, url: data?.signedUrl ?? null };
      }));
      const type = learner?.data?.learner_type;
      return res.json({
        lesson: {
          id: booking.id,
          startsAt: booking.scheduled_start,
          hardCloseAt: new Date(roomHardCloseMs(booking)).toISOString(),
          learnerName: learner?.data?.name || booking.contact_name || null,
          learnerType: type === 'child' || type === 'adult' ? type : null,
          serviceId: booking.service_id || null,
          subjectLabel: service?.data?.title ? { en: service.data.title, ar: service.data.arabic_title || service.data.title } : null,
          roomOpen: roomJoinState(booking, now()) === 'open',
        },
        lastReport: report?.data ? { track: report.data.subject, number: report.data.lesson_number, page: report.data.to_page ?? 0 } : null,
        prep: { notes: prep.notes, slide: prep.slide, files },
        serverNow: now(),
      });
    } catch (err) {
      return fail(res, err, 'get');
    }
  });

  // Notes and the slide save as the teacher works (each field only when sent).
  app.put('/api/dashboard/classroom/:id/prep', deps.verifyTeacherAuth, async (req: any, res: any) => {
    try {
      const b = req.body || {};
      const patch: Record<string, unknown> = {};
      if (b.notes !== undefined) {
        if (typeof b.notes !== 'string' || b.notes.length > MAX_PREP_NOTES) return res.status(400).json({ error: `notes must be text of up to ${MAX_PREP_NOTES} characters.` });
        patch.notes = b.notes;
      }
      if (b.slide !== undefined) {
        const slide = cleanSlide(b.slide);
        if (slide === undefined) return res.status(400).json({ error: 'slide must be { track, number, page }.' });
        patch.slide = slide;
      }
      if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to save.' });
      const got = await prepBooking(req, res);
      if (!got) return;
      await savePrep(got.client, got.booking, req, patch);
      return res.json({ ok: true });
    } catch (err) {
      return fail(res, err, 'put');
    }
  });

  // Files: the same two steps as the room (signed direct upload, then a server check of size and first bytes).
  app.post('/api/dashboard/classroom/:id/prep/files/upload-url', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    try {
      const contentType = String(req.body?.contentType || '').toLowerCase();
      const size = Number(req.body?.size);
      if (!FILE_EXT[contentType]) return res.status(415).json({ error: 'Use a PDF, PNG or JPEG file.' });
      if (!Number.isInteger(size) || size < 1) return res.status(400).json({ error: 'size must be the file size in bytes.' });
      if (size > MAX_FILE_BYTES) return res.status(413).json({ error: 'The file is larger than 20 MB.' });
      const got = await prepBooking(req, res);
      if (!got) return;
      if ((await loadPrep(got.client, got.booking.id)).files.length >= MAX_PREP_FILES) return res.status(409).json({ error: `Up to ${MAX_PREP_FILES} files per lesson.` });
      const fileId = `${crypto.randomUUID()}.${FILE_EXT[contentType]}`;
      const path = `${got.booking.id}/${fileId}`;
      const { data, error } = await got.client.storage.from(CLASSROOM_FILES_BUCKET).createSignedUploadUrl(path);
      if (error || !data?.token) throw new Error(`signed upload: ${error?.message || 'none'}`);
      return res.json({ fileId, path, token: data.token });
    } catch (err) {
      return fail(res, err, 'files/upload-url');
    }
  });

  app.post('/api/dashboard/classroom/:id/prep/files/:fileId/confirm', deps.verifyTeacherAuth, async (req: any, res: any) => {
    try {
      const fileId = String(req.params.fileId || '');
      if (!FILE_ID.test(fileId)) return res.status(404).json({ error: 'File not found.' });
      const got = await prepBooking(req, res);
      if (!got) return;
      const { client, booking } = got;
      const bucket = client.storage.from(CLASSROOM_FILES_BUCKET);
      const path = `${booking.id}/${fileId}`;
      const info = await bucket.info(path);
      if (info.error || !info.data) return res.status(404).json({ error: 'The file did not arrive.' });
      const drop = async () => { const { error } = await bucket.remove([path]); if (error) console.error('[lesson prep] files/remove', error.message); };
      if (!(Number(info.data.size) <= MAX_FILE_BYTES)) { await drop(); return res.status(413).json({ error: 'The file is larger than 20 MB.' }); }
      const head = await firstBytes(bucket, path, 16);
      const declared = Object.keys(FILE_EXT).find((k) => fileId.endsWith(`.${FILE_EXT[k]}`));
      if (!head || detectFileType(head) !== declared) { await drop(); return res.status(415).json({ error: 'Use a PDF, PNG or JPEG file.' }); }
      const name = cleanFileName(req.body?.name);
      const { error } = await client.from('lesson_files').upsert(
        { booking_id: booking.id, file_id: fileId, name, source: 'prep', created_at: iso() },
        { onConflict: 'booking_id,file_id' },
      );
      if (error) throw new Error(`lesson_files: ${error.message}`);
      return res.json({ fileId, name });
    } catch (err) {
      return fail(res, err, 'files/confirm');
    }
  });

  app.delete('/api/dashboard/classroom/:id/prep/files/:fileId', deps.verifyTeacherAuth, async (req: any, res: any) => {
    try {
      const fileId = String(req.params.fileId || '');
      if (!FILE_ID.test(fileId)) return res.status(404).json({ error: 'File not found.' });
      const got = await prepBooking(req, res);
      if (!got) return;
      const prep = await loadPrep(got.client, got.booking.id);
      // Only a file this prep added; a file shown in the room stays (it is part of the lesson record).
      if (!prep.files.some((f) => f.fileId === fileId)) return res.status(404).json({ error: 'File not found.' });
      const { error } = await got.client.storage.from(CLASSROOM_FILES_BUCKET).remove([`${got.booking.id}/${fileId}`]);
      if (error) throw new Error(`files/remove: ${error.message}`);
      const { error: rowErr } = await got.client.from('lesson_files').delete().eq('booking_id', got.booking.id).eq('file_id', fileId);
      if (rowErr) throw new Error(`lesson_files: ${rowErr.message}`);
      return res.json({ ok: true });
    } catch (err) {
      return fail(res, err, 'files/delete');
    }
  });
}
