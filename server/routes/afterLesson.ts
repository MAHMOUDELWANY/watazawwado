import express from 'express';
import { analyzeAttendance } from './attendance.js';
import { isUuid } from './progress.js';
import { buildReportDraft, ROOM_FILE_ID } from '../classroom/reportDraft.js';
import { lessonEndMs } from '../../src/lib/lessonWindow.js';

/**
 * Classroom after the lesson (BUILD-LIST 3.3, 3.5):
 * - Teacher: GET /api/dashboard/bookings/:id/report-draft (the draft from the timeline) and
 *   POST /api/dashboard/bookings/:id/report-files (the room files sent with the report).
 * - Family: GET /api/student/lesson-files (files of the account's lessons, signed links, own learners only).
 * - Super admin: GET /api/admin/lessons/:id (everything about one lesson).
 * The tables are service-role only; every route checks who is asking first.
 */
type Middleware = (req: any, res: any, next: any) => any;
const BUCKET = 'classroom-files';
/** Signed links in the family's lesson list last an hour; the list is fetched again on each visit. */
const LINK_SECONDS = 3600;
const FAMILY_DAYS = 180;
const MAX_FILES = 30;

/** Completed lessons decided by the room (3.2) whose family summary is not written yet: the Today page asks for it. */
export async function reportDueIds(client: any, lessons: Array<{ id: string; status?: string | null }>): Promise<Set<string>> {
  const done = lessons.filter((l) => l.status === 'completed').map((l) => l.id);
  if (!done.length) return new Set();
  const { data: auto } = await client.from('lesson_attendance_verdicts').select('booking_id').in('booking_id', done).eq('verdict', 'completed');
  const ids = (auto || []).map((r: any) => r.booking_id);
  if (!ids.length) return new Set();
  const { data: sessions } = await client.from('lesson_sessions').select('id, booking_id').in('booking_id', ids);
  const bookingOf = new Map((sessions || []).map((s: any) => [s.id, s.booking_id]));
  const { data: notes } = bookingOf.size
    ? await client.from('lesson_notes').select('session_id').in('session_id', [...bookingOf.keys()]).not('family_summary', 'is', null)
    : { data: [] as any[] };
  const written = new Set((notes || []).map((n: any) => bookingOf.get(n.session_id)));
  return new Set(ids.filter((id: string) => !written.has(id)));
}

async function storedFiles(client: any, bookingId: string): Promise<string[]> {
  const { data, error } = await client.storage.from(BUCKET).list(bookingId, { limit: 100 });
  if (error) throw new Error(`storage list: ${error.message}`);
  return (data || []).map((f: any) => String(f.name)).filter((n: string) => ROOM_FILE_ID.test(n));
}

/** Original names of lesson files (lesson_files), by file id; a missing table or row just leaves names out. */
async function fileNames(client: any, bookingIds: string[]): Promise<Record<string, string>> {
  if (!bookingIds.length) return {};
  const { data, error } = await client.from('lesson_files').select('booking_id, file_id, name').in('booking_id', bookingIds);
  if (error) { console.error('[lesson_files]', error.message); return {}; }
  return Object.fromEntries((data || []).map((r: any) => [`${r.booking_id}/${r.file_id}`, String(r.name || '')]));
}

export function registerAfterLessonRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyTeacherAuth: Middleware;
  verifyStudentAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
  now?: () => number;
}) {
  const now = deps.now ?? Date.now;
  const db = (res: any) => {
    const c = deps.getClient();
    if (!c) res.status(503).json({ error: 'Database service unavailable.' });
    return c;
  };
  /** The booking, when the caller is its teacher or the super admin; otherwise answers and returns null. */
  const ownLesson = async (client: any, req: any, res: any) => {
    const id = String(req.params.id || '');
    if (!isUuid(id)) { res.status(404).json({ error: 'Lesson not found.' }); return null; }
    const { data: b, error } = await client.from('bookings').select('id, teacher_id, student_id, status, scheduled_start, scheduled_end, duration_minutes').eq('id', id).maybeSingle();
    if (error) throw new Error(`bookings: ${error.message}`);
    if (!b) { res.status(404).json({ error: 'Lesson not found.' }); return null; }
    if (req.teacherUser?.role !== 'super_admin' && b.teacher_id !== req.teacherUser?.id) { res.status(403).json({ error: 'This lesson is not yours.' }); return null; }
    return b;
  };

  app.get('/api/dashboard/bookings/:id/report-draft', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const b = await ownLesson(client, req, res); if (!b) return;
      const [{ data: rows, error }, { data: room }, { data: shared }, fileIds, { data: quranMarks }] = await Promise.all([
        client.from('lesson_timeline_events').select('type, actor_role, payload, occurred_at').eq('booking_id', b.id).in('type', ['slide', 'reaction', 'end', 'talk', 'correction', 'check_answer']).order('occurred_at', { ascending: true }).limit(5000),
        client.from('lesson_room_state').select('ended_at').eq('booking_id', b.id).maybeSingle(),
        client.from('lesson_shared_files').select('file_id').eq('booking_id', b.id),
        storedFiles(client, b.id),
        // 4.2: the lesson's Quran marks (an unapplied table reads as none).
        client.from('quran_marks').select('verse_key, type').eq('booking_id', b.id).limit(1000),
      ]);
      if (error) throw new Error(`lesson_timeline_events: ${error.message}`);
      if (!(rows || []).length && !fileIds.length && !(quranMarks || []).length) return res.json({ draft: null });
      const end = lessonEndMs(b.scheduled_start, b.scheduled_end, b.duration_minutes);
      const stopMs = Math.min(room?.ended_at ? Date.parse(room.ended_at) : end, now());
      const draft = buildReportDraft({ rows: rows || [], stopMs, fileIds, sharedIds: (shared || []).map((s: any) => s.file_id), quranMarks: quranMarks || [] });
      const names = await fileNames(client, [b.id]);
      return res.json({ draft: { ...draft, files: draft.files.map((f) => ({ ...f, name: names[`${b.id}/${f.fileId}`] || null })) } });
    } catch (err) {
      console.error('[GET report-draft]', err);
      return res.status(500).json({ error: 'Could not build the report draft.' });
    }
  });

  // The teacher's choice of room files for the report: replaces the set (an empty list sends none).
  app.post('/api/dashboard/bookings/:id/report-files', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const list = req.body?.fileIds;
    if (!Array.isArray(list) || list.length > MAX_FILES || !list.every((f: unknown) => typeof f === 'string' && ROOM_FILE_ID.test(f))) {
      return res.status(400).json({ error: `fileIds must be a list of up to ${MAX_FILES} lesson files.` });
    }
    try {
      const b = await ownLesson(client, req, res); if (!b) return;
      const stored = new Set(await storedFiles(client, b.id));
      const wanted = [...new Set(list as string[])];
      if (!wanted.every((f) => stored.has(f))) return res.status(404).json({ error: 'A file is not part of this lesson.' });
      const { error: delErr } = await client.from('lesson_shared_files').delete().eq('booking_id', b.id);
      if (delErr) throw new Error(`lesson_shared_files: ${delErr.message}`);
      if (wanted.length) {
        const { error } = await client.from('lesson_shared_files').insert(wanted.map((f) => ({ booking_id: b.id, file_id: f, added_by: req.teacherUser?.id || null })));
        if (error) throw new Error(`lesson_shared_files: ${error.message}`);
      }
      return res.json({ files: wanted });
    } catch (err) {
      console.error('[POST report-files]', err);
      return res.status(500).json({ error: 'Could not attach the files.' });
    }
  });

  // Family (a child's own phone too, narrowed to that child): the files sent with each lesson's report.
  app.get('/api/student/lesson-files', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const learners = await deps.getLearners(client, req);
      const requested = typeof req.query?.learnerId === 'string' ? req.query.learnerId : '';
      if (requested && !learners.some((l) => l.id === requested)) return res.status(403).json({ error: 'This learner is not on your account.' });
      const ids = requested ? [requested] : learners.map((l) => l.id);
      if (!ids.length) return res.json({ files: {} });
      const { data: lessons, error } = await client.from('bookings').select('id').in('student_id', ids).eq('status', 'completed')
        .gte('scheduled_start', new Date(now() - FAMILY_DAYS * 86_400_000).toISOString()).limit(500);
      if (error) throw new Error(`bookings: ${error.message}`);
      const bookingIds = (lessons || []).map((l: any) => l.id);
      if (!bookingIds.length) return res.json({ files: {} });
      const { data: shared, error: sErr } = await client.from('lesson_shared_files').select('booking_id, file_id, created_at').in('booking_id', bookingIds).limit(1000);
      if (sErr) throw new Error(`lesson_shared_files: ${sErr.message}`);
      const names = await fileNames(client, bookingIds);
      const out: Record<string, Array<{ fileId: string; kind: 'pdf' | 'image'; url: string; name: string | null }>> = {};
      const bucket = client.storage.from(BUCKET);
      for (const s of shared || []) {
        const { data, error: urlErr } = await bucket.createSignedUrl(`${s.booking_id}/${s.file_id}`, LINK_SECONDS);
        if (urlErr || !data?.signedUrl) continue;
        (out[s.booking_id] ||= []).push({ fileId: s.file_id, kind: String(s.file_id).endsWith('.pdf') ? 'pdf' : 'image', url: data.signedUrl, name: names[`${s.booking_id}/${s.file_id}`] || null });
      }
      return res.json({ files: out });
    } catch (err) {
      console.error('[GET /api/student/lesson-files]', err);
      return res.status(500).json({ error: 'Could not load the lesson files.' });
    }
  });

  // Super admin: one lesson, everything the room recorded about it.
  app.get('/api/admin/lessons/:id', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const id = String(req.params.id || '');
      if (!isUuid(id)) return res.status(404).json({ error: 'Lesson not found.' });
      const { data: b, error } = await client.from('bookings')
        .select('id, reference_code, contact_name, student_id, teacher_id, service_id, booking_type, status, not_held_reason, scheduled_start, scheduled_end, duration_minutes').eq('id', id).maybeSingle();
      if (error) throw new Error(`bookings: ${error.message}`);
      if (!b) return res.status(404).json({ error: 'Lesson not found.' });
      const q = (t: string, cols: string) => client.from(t).select(cols).eq('booking_id', id);
      const [att, timeline, verdict, late, quality, incidents, observations, seats, rating, shared, teacher] = await Promise.all([
        q('lesson_attendance_events', 'source, event, role, participant_name, occurred_at').order('occurred_at', { ascending: true }).limit(1000),
        q('lesson_timeline_events', 'type, actor_role, payload, occurred_at').order('occurred_at', { ascending: true }).limit(3000),
        q('lesson_attendance_verdicts', 'verdict, reason, trigger, applied, detail, decided_at').maybeSingle(),
        q('teacher_late_reasons', 'late_minutes, reason, status, admin_note, reviewed_at, created_at').maybeSingle(),
        q('lesson_quality', 'side, precheck_720, start_height, min_height, degraded_seconds, audio_only_seconds, reconnects, focus_away_seconds, updated_at'),
        q('classroom_incidents', 'kind, side, created_at').order('created_at', { ascending: true }),
        q('admin_observations', 'admin_user_id, started_at, ended_at, notes').order('started_at', { ascending: true }),
        q('lesson_room_seats', 'seat, user_id, updated_at'),
        q('lesson_feedback', 'rating, comment, created_at').maybeSingle(),
        q('lesson_shared_files', 'file_id, created_at'),
        b.teacher_id ? client.from('profiles').select('display_name').eq('id', b.teacher_id).maybeSingle() : { data: null },
      ]);
      for (const r of [att, timeline, verdict, late, quality, incidents, observations, seats, rating, shared]) if (r.error) throw new Error(r.error.message);
      const events = att.data || [];
      const a = analyzeAttendance(events, b);
      const sideTimes = (role: string) => events.filter((e: any) => e.role === role && ['room_joined', 'room_left', 'joined', 'left'].includes(e.event))
        .map((e: any) => ({ at: e.occurred_at, event: e.event.replace('room_', ''), source: e.source }));
      // Board scenes are not timeline rows; anything large (stats) stays out of the readable list.
      const tl = (timeline.data || []).map((r: any) => ({ at: r.occurred_at, type: r.type, by: r.actor_role, payload: r.type === 'quality' ? { side: r.payload?.side, layer: r.payload?.layer, link: r.payload?.link } : r.payload }));
      const earlyEnd = tl.filter((r: any) => r.type === 'end' && r.payload?.early).map((r: any) => ({ at: r.at, minutesEarly: r.payload.minutesEarly, reason: r.payload.reason }));
      return res.json({
        lesson: { id: b.id, referenceCode: b.reference_code, learnerName: b.contact_name, teacherName: teacher?.data?.display_name || null, serviceId: b.service_id, bookingType: b.booking_type, status: b.status, notHeldReason: b.not_held_reason, scheduledStart: b.scheduled_start, scheduledEnd: b.scheduled_end, durationMinutes: b.duration_minutes },
        attendance: { togetherMinutes: a.togetherMinutes, requiredMinutes: a.requiredMinutes, held: a.held, joins: a.joins, unstable: a.unstable, teacher: sideTimes('teacher'), student: sideTimes('student') },
        verdict: verdict.data || null,
        lateness: late.data || null,
        earlyEnd,
        quality: quality.data || [],
        incidents: incidents.data || [],
        adminObservations: observations.data || [],
        guardianObservations: (seats.data || []).filter((s: any) => String(s.seat).startsWith('guardian_observer:')).map((s: any) => ({ userId: s.user_id, lastEnteredAt: s.updated_at })),
        rating: rating.data || null,
        sharedFiles: (shared.data || []).map((s: any) => s.file_id),
        timeline: tl,
      });
    } catch (err) {
      console.error('[GET /api/admin/lessons/:id]', err);
      return res.status(500).json({ error: 'Could not load this lesson.' });
    }
  });
}
