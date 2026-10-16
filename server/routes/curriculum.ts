/**
 * Curriculum routes (docs/curriculum/PLAN.md §4.1–4.2).
 * - Teacher: save a report after class; read a learner's reports.
 * - Student/parent: the map and puzzle for each learner on the account. The curriculum is open only to
 *   accounts with a booking; others get `booked: false` and see it locked.
 * The table is server-only; every route checks ownership first.
 */
import type express from 'express';
import { validateReport, buildStudentMap, type ReportRow } from '../curriculum/reports.js';

type Mw = (req: any, res: any, next: any) => any;

export interface CurriculumDeps {
  getClient: () => any;
  rateLimit: Mw;
  verifyStudentAuth: Mw;
  verifyTeacherAuth: Mw;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string; learnerType: string; isPrimary: boolean }>>;
}

const REPORT_COLUMNS = 'subject, lesson_number, from_page, to_page, strengths, to_reinforce, note, game_result, created_at';
/** Bookings that mean the family has started learning with us (free trial included). */
const BOOKED_STATUSES = ['confirmed', 'rescheduled', 'completed'];

/** A teacher may report only on their own students; the super admin on anyone. */
async function teacherMayTeach(client: any, teacher: any, studentId: string): Promise<boolean> {
  const { data, error } = await client.from('students').select('id, assigned_teacher_id').eq('id', studentId).maybeSingle();
  if (error || !data) return false;
  return teacher?.role === 'super_admin' || data.assigned_teacher_id === teacher?.id;
}

export function registerCurriculumRoutes(app: express.Express, deps: CurriculumDeps) {
  const { getClient, rateLimit, verifyStudentAuth, verifyTeacherAuth, getLearners } = deps;

  app.post('/api/dashboard/curriculum/reports', verifyTeacherAuth, rateLimit, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const parsed = validateReport(req.body);
    if (parsed.ok === false) return res.status(400).json({ error: parsed.error });
    const r = parsed.value;
    if (!(await teacherMayTeach(client, req.teacherUser, r.studentId))) {
      return res.status(403).json({ error: 'You can only report on your own students.' });
    }
    const { error } = await client.from('curriculum_lesson_reports').insert({
      student_id: r.studentId,
      teacher_id: req.teacherUser?.id || null,
      subject: r.subject,
      lesson_number: r.lessonNumber,
      from_page: r.fromPage,
      to_page: r.toPage,
      strengths: r.strengths,
      to_reinforce: r.toReinforce,
      note: r.note,
      game_result: r.gameResult,
    });
    if (error) {
      console.error('[Curriculum report] insert failed:', error.message);
      return res.status(500).json({ error: 'Could not save the report.' });
    }
    return res.status(201).json({ success: true });
  });

  app.get('/api/dashboard/curriculum/students/:id', verifyTeacherAuth, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const studentId = String(req.params.id || '');
    if (!(await teacherMayTeach(client, req.teacherUser, studentId))) return res.status(403).json({ error: 'Forbidden.' });
    const { data, error } = await client
      .from('curriculum_lesson_reports')
      .select(REPORT_COLUMNS)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })
      .limit(1000);
    if (error) return res.status(500).json({ error: 'Could not load reports.' });
    return res.json({ map: buildStudentMap((data || []) as ReportRow[]) });
  });

  app.get('/api/student/curriculum', verifyStudentAuth, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const learners = await getLearners(client, req);
    const ids = learners.map((l) => l.id);
    if (ids.length === 0) return res.json({ booked: false, learners: [] });

    const [{ count }, { data: reports, error }] = await Promise.all([
      client.from('bookings').select('id', { count: 'exact', head: true }).in('student_id', ids).in('status', BOOKED_STATUSES),
      client.from('curriculum_lesson_reports').select(`student_id, ${REPORT_COLUMNS}`).in('student_id', ids).order('created_at', { ascending: true }).limit(2000),
    ]);
    if (error) return res.status(500).json({ error: 'Could not load the curriculum.' });
    const booked = (count || 0) > 0;
    if (!booked) return res.json({ booked: false, learners: [] });

    return res.json({
      booked: true,
      learners: learners.map((l) => ({
        id: l.id,
        name: l.name,
        map: buildStudentMap(((reports || []) as any[]).filter((r) => r.student_id === l.id)),
      })),
    });
  });
}
