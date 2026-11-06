import express from 'express';
import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import { canTeacherAccessStudent, canFamilyReadLearner, isUuid } from './progress.js';
import { notifyUser, resolveLearnerAccount } from '../notifications/inbox.js';

/**
 * NX-03: a learner records a recitation (often for a "recite" homework task); the assigned teacher listens and replies
 * in writing before the next lesson. Audio sits in the private "recitations" bucket; every upload and play link is a
 * short-lived signed URL the server issues after its own checks. Recordings are deleted after RETENTION_DAYS.
 */
export const BUCKET = 'recitations';
export const RETENTION_DAYS = 30; // owner 2026-11-02: about 0.5 MB each, keeps storage inside the free plan as families grow
export const PLAY_LINK_SECONDS = 60 * 30;
const EXT: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/mpeg': 'mp3', 'audio/aac': 'aac' };

/** Storage path of a new recording: <learner>/<random>.<ext>; the learner prefix is what ownership checks rely on. */
export function newRecordingPath(studentId: string, contentType: string): string | null {
  const base = String(contentType || '').split(';')[0].trim().toLowerCase();
  const ext = EXT[base];
  if (!ext || !isUuid(studentId)) return null;
  return `${studentId}/${crypto.randomUUID()}.${ext}`;
}

export const pathBelongsTo = (path: string, studentId: string) =>
  typeof path === 'string' && new RegExp(`^${studentId}/[0-9a-f-]{36}\\.(webm|ogg|m4a|mp3|aac)$`).test(path);

type Middleware = (req: any, res: any, next: any) => any;
const COLUMNS = 'id, student_id, homework_id, storage_path, duration_sec, teacher_reply, replied_at, created_at';

async function withPlayLinks(client: any, rows: any[]) {
  if (!rows.length) return [];
  const { data: links } = await client.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.storage_path), PLAY_LINK_SECONDS);
  const byPath = new Map((links || []).map((l: any) => [l.path, l.signedUrl]));
  return rows.map(({ storage_path, ...r }) => ({ ...r, playUrl: byPath.get(storage_path) || null }));
}

export function registerRecitationRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
}) {
  // Family: a one-time upload link for a new recording of one of the account's learners.
  app.post('/api/student/recitations/upload-url', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const learners = await deps.getLearners(client, req);
      const learnerId = String(req.body?.learnerStudentId || '');
      if (!canFamilyReadLearner(learners, learnerId)) return res.status(403).json({ error: 'Choose a learner on your account.' });
      const path = newRecordingPath(learnerId, req.body?.contentType);
      if (!path) return res.status(400).json({ error: 'This recording format is not supported.' });
      const { data, error } = await client.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error || !data) throw new Error(error?.message || 'no upload url');
      return res.json({ path, token: data.token, uploadUrl: data.signedUrl });
    } catch (err: any) {
      console.error('[recitations upload-url]', err?.message || err);
      return res.status(500).json({ error: 'Could not start the upload.' });
    }
  });

  // Family: the upload finished; record it (and tell the teacher).
  app.post('/api/student/recitations', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const learners = await deps.getLearners(client, req);
      const learnerId = String(req.body?.learnerStudentId || '');
      const path = String(req.body?.path || '');
      if (!canFamilyReadLearner(learners, learnerId) || !pathBelongsTo(path, learnerId)) return res.status(403).json({ error: 'This recording is not yours.' });
      const [folder, file] = path.split('/');
      const { data: found } = await client.storage.from(BUCKET).list(folder, { search: file, limit: 1 });
      if (!found?.some((f: any) => f.name === file)) return res.status(400).json({ error: 'The upload did not arrive. Please try again.' });
      let homeworkId: string | null = null;
      if (isUuid(req.body?.homeworkId)) {
        const { data: hw } = await client.from('lesson_homework').select('id, student_id').eq('id', req.body.homeworkId).maybeSingle();
        if (hw?.student_id === learnerId) homeworkId = hw.id;
      }
      const duration = Math.round(Number(req.body?.durationSec));
      const { data: row, error } = await client.from('recitation_recordings').insert({
        student_id: learnerId, homework_id: homeworkId, storage_path: path,
        duration_sec: Number.isFinite(duration) && duration >= 1 && duration <= 600 ? duration : null,
        sent_by: isUuid(req.studentUser?.auth_id) ? req.studentUser.auth_id : null,
      }).select(COLUMNS).single();
      if (error) throw new Error(error.message);
      const { data: st } = await client.from('students').select('name, assigned_teacher_id').eq('id', learnerId).maybeSingle();
      if (isUuid(st?.assigned_teacher_id)) {
        await notifyUser(client, { userId: st.assigned_teacher_id, staff: true }, {
          kind: 'recitation_sent',
          title: { en: 'A new recitation to listen to', ar: 'تلاوة جديدة مستنية تسمعها' },
          body: { en: `${st.name || 'A learner'} sent a recitation. Listen and reply before the next lesson.`, ar: `${st.name || 'طالب'} بعت تلاوة. اسمعها ورد قبل الحصة الجاية.` },
          link: `/dashboard/students/${learnerId}`,
        });
      }
      return res.status(201).json({ recording: (await withPlayLinks(client, [row]))[0] });
    } catch (err: any) {
      console.error('[recitations save]', err?.message || err);
      return res.status(500).json({ error: 'Could not save the recording.' });
    }
  });

  // Family: recent recordings and the teacher's replies.
  app.get('/api/student/recitations', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const learners = await deps.getLearners(client, req);
      const requested = typeof req.query?.learnerId === 'string' ? req.query.learnerId : '';
      if (requested && !canFamilyReadLearner(learners, requested)) return res.status(403).json({ error: 'This learner is not on your account.' });
      const ids = requested ? [requested] : learners.map((l) => l.id);
      if (!ids.length) return res.json({ recordings: [] });
      const { data, error } = await client.from('recitation_recordings').select(COLUMNS).in('student_id', ids).order('created_at', { ascending: false }).limit(20);
      if (error) throw new Error(error.message);
      return res.json({ recordings: await withPlayLinks(client, data || []) });
    } catch (err: any) {
      console.error('[recitations list]', err?.message || err);
      return res.status(500).json({ error: 'Could not load the recordings.' });
    }
  });

  // Teacher: a student's recent recordings to listen to.
  app.get('/api/dashboard/students/:id/recitations', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const access = await canTeacherAccessStudent(client, req.teacherUser, String(req.params.id || ''));
    if (!access.exists) return res.status(404).json({ error: 'Student record not found.' });
    if (!access.allowed) return res.status(403).json({ error: 'This is not your student.' });
    const { data, error } = await client.from('recitation_recordings').select(COLUMNS).eq('student_id', req.params.id).order('created_at', { ascending: false }).limit(10);
    if (error) return res.status(500).json({ error: 'Could not load the recordings.' });
    return res.json({ recordings: await withPlayLinks(client, data || []) });
  });

  // Teacher: a written reply the family sees.
  app.post('/api/dashboard/recitations/:id/reply', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Recording not found.' });
    const text = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, 1000) : '';
    if (text.length < 2) return res.status(400).json({ error: 'Write a short reply.' });
    const { data: rec } = await client.from('recitation_recordings').select('id, student_id').eq('id', req.params.id).maybeSingle();
    if (!rec) return res.status(404).json({ error: 'Recording not found.' });
    const access = await canTeacherAccessStudent(client, req.teacherUser, rec.student_id);
    if (!access.allowed) return res.status(403).json({ error: 'This is not your student.' });
    const { data: row, error } = await client.from('recitation_recordings')
      .update({ teacher_reply: text, replied_by: req.teacherUser?.id || null, replied_at: new Date().toISOString() })
      .eq('id', rec.id).select(COLUMNS).single();
    if (error) return res.status(500).json({ error: 'Could not save the reply.' });
    const userId = (await resolveLearnerAccount(client, rec.student_id)).userId;
    if (userId) {
      await notifyUser(client, { userId }, {
        kind: 'recitation_reply',
        title: { en: 'Your teacher replied to your recitation', ar: 'المعلم رد على تلاوتك' },
        push: { body: { en: 'Your teacher listened to your recitation and wrote back. Come and see!', ar: 'معلمك سمع تلاوتك وردّ عليك. تعالَ شوف!' } },
        body: { en: text.slice(0, 200), ar: text.slice(0, 200) },
        link: '/student',
      });
    }
    return res.json({ recording: row });
  });
}

/** Deletes recordings (audio and rows) older than RETENTION_DAYS; runs from the cron. */
export async function purgeOldRecitations(client: any, now: DateTime = DateTime.utc()): Promise<number> {
  if (!client) return 0;
  const { data: old } = await client.from('recitation_recordings').select('id, storage_path')
    .lt('created_at', now.minus({ days: RETENTION_DAYS }).toISO()).limit(200);
  if (!old?.length) return 0;
  const { error } = await client.storage.from(BUCKET).remove(old.map((r: any) => r.storage_path));
  if (error) { console.warn('[Recitations] purge storage failed:', error.message); return 0; }
  await client.from('recitation_recordings').delete().in('id', old.map((r: any) => r.id));
  return old.length;
}
