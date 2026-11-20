import express from 'express';
import crypto from 'node:crypto';
import { canTeacherAccessStudent, canFamilyReadLearner, isUuid, normalizeSubjectSlug } from './progress.js';
import { QuranApiError, RECITERS, type QuranFoundation } from '../quran/foundation.js';
import {
  accuracySummary, MARK_TYPES, parseFlags, parseMark, parseVerseKey, quranTabAllowed, releasedMarks, reportSentBookings,
  WORD_MARK_TYPES, type DetectorFlag,
} from '../quran/rules.js';
import { SURAHS } from '../../src/lib/surahs.js';

/**
 * Classroom BUILD-LIST 4.1-4.5, the Quran tab:
 * - Content (student and dashboard): mushaf pages with tajweed markup, surahs, recitation audio with word timings,
 *   the page of an ayah. Proxied from the Quran Foundation API with our server's credentials.
 * - Family: which learners see the tab, the lesson marks released by a sent report, the detector's flags on a recording
 *   they sent.
 * - Teacher: marks on words of a lesson (4.2) and a blind review of a sent recording (4.5).
 * - Super admin: the detector's agreement with the teachers.
 * Tables are service-role only; every route checks who is asking first.
 */
type Middleware = (req: any, res: any, next: any) => any;
const MARK_COLUMNS = 'id, student_id, booking_id, verse_key, word_position, type, note, created_at';
const CONTENT_CACHE = 'private, max-age=86400';

export function registerQuranRoutes(app: express.Express, deps: {
  getClient: () => any;
  quran: () => QuranFoundation | null;
  verifyTeacherAuth: Middleware;
  verifyStudentAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
  hintsFlag?: () => boolean;
  now?: () => number;
}) {
  const now = deps.now ?? Date.now;
  const db = (res: any) => {
    const c = deps.getClient();
    if (!c) res.status(503).json({ error: 'Database service unavailable.' });
    return c;
  };
  const failContent = (res: any, err: any, what: string) => {
    if (err instanceof QuranApiError && (err.status === 400 || err.status === 404)) return res.status(err.status).json({ error: 'Not found in the mushaf.' });
    console.error(`[quran ${what}]`, err?.message || err);
    return res.status(502).json({ error: 'The mushaf could not load. Please try again.' });
  };

  // ---- content: the same reads for families (and child phones) and for staff ------------------------------------
  for (const [prefix, auth] of [['/api/student/quran', deps.verifyStudentAuth], ['/api/dashboard/quran', deps.verifyTeacherAuth]] as const) {
    const withApi = (handler: (q: QuranFoundation, req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
      const q = deps.quran();
      if (!q) return res.status(503).json({ error: 'The mushaf is not set up yet.' });
      return handler(q, req, res);
    };
    app.get(`${prefix}/page/:n`, auth, withApi(async (q, req, res) => {
      try { res.set('Cache-Control', CONTENT_CACHE); return res.json(await q.page(Number(req.params.n))); } catch (err) { return failContent(res, err, 'page'); }
    }));
    app.get(`${prefix}/chapters`, auth, withApi(async (q, _req, res) => {
      try { res.set('Cache-Control', CONTENT_CACHE); return res.json({ chapters: await q.chapters(), reciters: RECITERS }); } catch (err) { return failContent(res, err, 'chapters'); }
    }));
    app.get(`${prefix}/verse/:key`, auth, withApi(async (q, req, res) => {
      if (!parseVerseKey(req.params.key)) return res.status(404).json({ error: 'Not found in the mushaf.' });
      try { res.set('Cache-Control', CONTENT_CACHE); return res.json({ page: await q.pageOf(req.params.key) }); } catch (err) { return failContent(res, err, 'verse'); }
    }));
    app.get(`${prefix}/audio/:reciter/:chapter`, auth, withApi(async (q, req, res) => {
      try { res.set('Cache-Control', CONTENT_CACHE); return res.json(await q.audio(Number(req.params.reciter), Number(req.params.chapter))); } catch (err) { return failContent(res, err, 'audio'); }
    }));
  }

  // ---- family -----------------------------------------------------------------------------------------------------
  /** The account's learners who study a Quran track, Islamic studies or Fusha (their own subject or a booked lesson). */
  const quranLearners = async (client: any, req: any) => {
    const learners = await deps.getLearners(client, req);
    if (!learners.length) return [];
    const ids = learners.map((l) => l.id);
    const [{ data: students, error }, { data: bookings, error: bErr }] = await Promise.all([
      client.from('students').select('id, learning_interest').in('id', ids),
      client.from('bookings').select('student_id, service_id').in('student_id', ids).limit(2000),
    ]);
    if (error) throw new Error(`students: ${error.message}`);
    if (bErr) throw new Error(`bookings: ${bErr.message}`);
    const subjects = new Map<string, Array<string | null>>(ids.map((id) => [id, []]));
    for (const s of students || []) subjects.get(s.id)?.push(normalizeSubjectSlug(s.learning_interest));
    for (const b of bookings || []) subjects.get(b.student_id)?.push(normalizeSubjectSlug(b.service_id));
    return learners.filter((l) => quranTabAllowed(subjects.get(l.id) || []));
  };

  app.get('/api/student/quran/access', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      return res.json({ learners: (await quranLearners(client, req)).map((l) => ({ id: l.id, name: l.name })) });
    } catch (err) {
      console.error('[quran access]', err);
      return res.status(500).json({ error: 'Could not check the Quran tab.' });
    }
  });

  // Marks of the learner's lessons whose report the teacher sent; nothing from a lesson still waiting for its report.
  app.get('/api/student/quran/marks', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const learners = await deps.getLearners(client, req);
      const learnerId = String(req.query?.learnerId || '');
      if (!canFamilyReadLearner(learners, learnerId)) return res.status(403).json({ error: 'This learner is not on your account.' });
      const { data, error } = await client.from('quran_marks').select(MARK_COLUMNS).eq('student_id', learnerId).order('created_at', { ascending: false }).limit(500);
      if (error) throw new Error(`quran_marks: ${error.message}`);
      const rows = data || [];
      const sent = await reportSentBookings(client, [...new Set<string>(rows.map((r: any) => r.booking_id))]);
      return res.json({ marks: releasedMarks(rows, sent).map(publicMark) });
    } catch (err) {
      console.error('[quran marks family]', err);
      return res.status(500).json({ error: 'Could not load the marks.' });
    }
  });

  // 4.4: the detector's word flags travel with a recording the learner chose to send to the teacher (NX-03).
  app.post('/api/student/quran/detector-runs', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const learners = await deps.getLearners(client, req);
      const learnerId = String(req.body?.learnerId || '');
      if (!canFamilyReadLearner(learners, learnerId)) return res.status(403).json({ error: 'This learner is not on your account.' });
      const recordingId = String(req.body?.recordingId || '');
      if (!isUuid(recordingId)) return res.status(400).json({ error: 'recordingId is required.' });
      const { data: rec, error } = await client.from('recitation_recordings').select('id, student_id').eq('id', recordingId).maybeSingle();
      if (error) throw new Error(`recitation_recordings: ${error.message}`);
      if (!rec || rec.student_id !== learnerId) return res.status(403).json({ error: 'This recording is not yours.' });
      const range = parseRange(req.body);
      if (!range) return res.status(400).json({ error: 'Choose a surah and an ayah range.' });
      const model = typeof req.body?.model === 'string' && req.body.model.length <= 200 ? req.body.model : '';
      if (!model) return res.status(400).json({ error: 'model is required.' });
      const flags = parseFlags(req.body?.flags, (vk) => inRange(vk, range));
      if (!flags) return res.status(400).json({ error: 'The flags do not match the assigned part.' });
      const { data: existing } = await client.from('quran_detector_runs').select('id').eq('recording_id', recordingId).maybeSingle();
      if (existing) return res.status(409).json({ error: 'This recording already has a result.' });
      const row = { id: crypto.randomUUID(), student_id: learnerId, recording_id: recordingId, surah: range.surah, ayah_from: range.from, ayah_to: range.to, model, flags };
      const { error: insErr } = await client.from('quran_detector_runs').insert(row);
      if (insErr) throw new Error(`quran_detector_runs: ${insErr.message}`);
      return res.status(201).json({ run: { id: row.id } });
    } catch (err) {
      console.error('[quran detector-runs]', err);
      return res.status(500).json({ error: 'Could not save the result.' });
    }
  });

  // ---- teacher: marks in a lesson ---------------------------------------------------------------------------------
  const ownLesson = async (client: any, req: any, res: any) => {
    const id = String(req.params.id || '');
    if (!isUuid(id)) { res.status(404).json({ error: 'Lesson not found.' }); return null; }
    const { data: b, error } = await client.from('bookings').select('id, teacher_id, student_id').eq('id', id).maybeSingle();
    if (error) throw new Error(`bookings: ${error.message}`);
    if (!b || !isUuid(b.student_id)) { res.status(404).json({ error: 'Lesson not found.' }); return null; }
    if (req.teacherUser?.role !== 'super_admin' && b.teacher_id !== req.teacherUser?.id) { res.status(403).json({ error: 'This lesson is not yours.' }); return null; }
    return b;
  };

  app.get('/api/dashboard/bookings/:id/quran-marks', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const b = await ownLesson(client, req, res); if (!b) return;
      const { data, error } = await client.from('quran_marks').select(MARK_COLUMNS).eq('booking_id', b.id).order('created_at', { ascending: true }).limit(1000);
      if (error) throw new Error(`quran_marks: ${error.message}`);
      return res.json({ marks: (data || []).map(publicMark) });
    } catch (err) {
      console.error('[quran marks get]', err);
      return res.status(500).json({ error: 'Could not load the marks.' });
    }
  });

  // One mark per word per lesson: marking a word again changes its type or note.
  app.put('/api/dashboard/bookings/:id/quran-marks', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const parsed = parseMark(req.body);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    try {
      const b = await ownLesson(client, req, res); if (!b) return;
      const at = new Date(now()).toISOString();
      const row = { ...parsed.value, booking_id: b.id, student_id: b.student_id, teacher_id: req.teacherUser?.id || null, updated_at: at };
      const { data: existing } = await client.from('quran_marks').select('id, created_at').eq('booking_id', b.id).eq('verse_key', row.verse_key).eq('word_position', row.word_position).maybeSingle();
      const full = { id: existing?.id || crypto.randomUUID(), created_at: existing?.created_at || at, ...row };
      const { error } = await client.from('quran_marks').upsert(full, { onConflict: 'booking_id,verse_key,word_position' });
      if (error) throw new Error(`quran_marks: ${error.message}`);
      return res.json({ mark: publicMark(full) });
    } catch (err) {
      console.error('[quran marks put]', err);
      return res.status(500).json({ error: 'Could not save the mark.' });
    }
  });

  app.delete('/api/dashboard/bookings/:id/quran-marks/:markId', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    if (!isUuid(req.params.markId)) return res.status(404).json({ error: 'Mark not found.' });
    try {
      const b = await ownLesson(client, req, res); if (!b) return;
      const { error } = await client.from('quran_marks').delete().eq('id', req.params.markId).eq('booking_id', b.id);
      if (error) throw new Error(`quran_marks: ${error.message}`);
      return res.json({ ok: true });
    } catch (err) {
      console.error('[quran marks delete]', err);
      return res.status(500).json({ error: 'Could not remove the mark.' });
    }
  });

  // ---- teacher: blind review of a sent recording (4.5); the detector's flags are never shown here ----------------
  const ownRun = async (client: any, req: any, res: any) => {
    if (!isUuid(req.params.id)) { res.status(404).json({ error: 'Recording not found.' }); return null; }
    const { data: run, error } = await client.from('quran_detector_runs').select('id, student_id, surah, ayah_from, ayah_to, teacher_marks, reviewed_at').eq('recording_id', req.params.id).maybeSingle();
    if (error) throw new Error(`quran_detector_runs: ${error.message}`);
    if (!run) { res.status(404).json({ error: 'This recording has no detector result.' }); return null; }
    const access = await canTeacherAccessStudent(client, req.teacherUser, run.student_id);
    if (!access.allowed) { res.status(403).json({ error: 'This is not your student.' }); return null; }
    return run;
  };

  app.get('/api/dashboard/recitations/:id/quran-review', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const run = await ownRun(client, req, res); if (!run) return;
      return res.json({ review: { surah: run.surah, ayahFrom: run.ayah_from, ayahTo: run.ayah_to, marks: run.teacher_marks || [], reviewedAt: run.reviewed_at ?? null } });
    } catch (err) {
      console.error('[quran review get]', err);
      return res.status(500).json({ error: 'Could not load the review.' });
    }
  });

  app.post('/api/dashboard/recitations/:id/quran-review', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const run = await ownRun(client, req, res); if (!run) return;
      const range = { surah: run.surah, from: run.ayah_from, to: run.ayah_to };
      const raw = req.body?.marks;
      const marks: Array<{ key: string; type: string }> = [];
      if (!Array.isArray(raw) || raw.length > 500) return res.status(400).json({ error: 'marks must be a list.' });
      for (const m of raw) {
        const k = typeof m?.key === 'string' ? /^(\d{1,3}:\d{1,3}):(\d{1,3})$/.exec(m.key) : null;
        if (!k || !inRange(k[1], range) || !(MARK_TYPES as readonly string[]).includes(m?.type)) return res.status(400).json({ error: 'A mark is outside the recorded part.' });
        marks.push({ key: m.key, type: m.type });
      }
      const { error } = await client.from('quran_detector_runs').update({ teacher_marks: marks, reviewed_by: req.teacherUser?.id || null, reviewed_at: new Date(now()).toISOString() }).eq('id', run.id);
      if (error) throw new Error(`quran_detector_runs: ${error.message}`);
      return res.json({ ok: true, words: marks.filter((m) => WORD_MARK_TYPES.includes(m.type)).length });
    } catch (err) {
      console.error('[quran review post]', err);
      return res.status(500).json({ error: 'Could not save the review.' });
    }
  });

  // ---- super admin: the accuracy harness (no names, no audio: numbers per recording) ------------------------------
  app.get('/api/admin/quran/accuracy', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const { data, error } = await client.from('quran_detector_runs').select('id, flags, teacher_marks, reviewed_at, created_at, model').order('created_at', { ascending: false }).limit(2000);
      if (error) throw new Error(`quran_detector_runs: ${error.message}`);
      return res.json(accuracySummary((data || []) as any, deps.hintsFlag?.() ?? false));
    } catch (err) {
      console.error('[quran accuracy]', err);
      return res.status(500).json({ error: 'Could not load the accuracy.' });
    }
  });
}

const publicMark = (m: any) => ({ id: m.id, bookingId: m.booking_id, verseKey: m.verse_key, word: m.word_position, type: m.type, note: m.note ?? null, createdAt: m.created_at });

type Range = { surah: number; from: number; to: number };
function parseRange(b: any): Range | null {
  const surah = Number(b?.surah), from = Number(b?.ayahFrom), to = Number(b?.ayahTo);
  const s = SURAHS.find((x) => x.n === surah);
  if (!s || !Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > s.ayat) return null;
  return { surah, from, to };
}
const inRange = (verseKey: string, r: Range) => {
  const v = parseVerseKey(verseKey);
  return Boolean(v && v[0] === r.surah && v[1] >= r.from && v[1] <= r.to);
};
export type { DetectorFlag };
