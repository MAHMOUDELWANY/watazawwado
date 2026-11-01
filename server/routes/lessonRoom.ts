import express from 'express';
import crypto from 'node:crypto';
import { canFamilyReadLearner, isUuid } from './progress.js';

/**
 * NX-12: the lesson room. The teacher shows curriculum slides and the learner's screen follows, live, over a Supabase
 * Realtime broadcast channel. The channel name is a key the server derives per lesson (HMAC of the booking id), handed
 * only to that lesson's teacher (or the admin) and that learner's family, so nobody else can join or listen.
 * Only the lesson and slide position travel on it; video stays on Zoom.
 */
type Middleware = (req: any, res: any, next: any) => any;

export function roomKey(bookingId: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`lesson-room:${bookingId}`).digest('hex').slice(0, 40);
}

const roomSecret = () => process.env.LESSON_ROOM_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ROOM_STATUSES = ['confirmed', 'rescheduled', 'completed', 'pending'];

export function registerLessonRoomRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
}) {
  const load = async (client: any, id: string) => {
    const { data } = await client.from('bookings').select('id, student_id, teacher_id, status, scheduled_start, service_id, contact_name').eq('id', id).maybeSingle();
    return data && ROOM_STATUSES.includes(data.status) ? data : null;
  };

  app.get('/api/dashboard/lesson-room/:id', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client || !roomSecret()) return res.status(503).json({ error: 'The lesson room is not available.' });
    if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Lesson not found.' });
    const b = await load(client, req.params.id);
    if (!b) return res.status(404).json({ error: 'Lesson not found.' });
    const isAdmin = req.teacherUser?.role === 'super_admin';
    if (!isAdmin && b.teacher_id !== req.teacherUser?.id) return res.status(403).json({ error: 'This is not your lesson.' });
    return res.json({ roomKey: roomKey(b.id, roomSecret()), learnerName: b.contact_name || null, subject: b.service_id || null, start: b.scheduled_start });
  });

  app.get('/api/student/lesson-room/:id', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client || !roomSecret()) return res.status(503).json({ error: 'The lesson room is not available.' });
    if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Lesson not found.' });
    const b = await load(client, req.params.id);
    const learners = await deps.getLearners(client, req);
    if (!b || !canFamilyReadLearner(learners, b.student_id)) return res.status(404).json({ error: 'Lesson not found.' });
    return res.json({ roomKey: roomKey(b.id, roomSecret()), start: b.scheduled_start });
  });
}
