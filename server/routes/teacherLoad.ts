import express from 'express';
import { DateTime } from 'luxon';

/**
 * CRM-08: per teacher, for the super admin only: active students, this week's lessons, hours offered vs booked,
 * lessons the teacher moved (with reasons) and how often the family summary was written after lessons. No money.
 */
const LESSON_STATUSES = ['confirmed', 'rescheduled', 'completed'];

const minutes = (hhmmss: string) => {
  const [h, m] = String(hhmmss).split(':').map(Number);
  return h * 60 + (m || 0);
};

/** Weekly hours offered, from the active availability intervals (end 23:59 counts as midnight). */
export function offeredHours(rows: Array<{ start_time: string; end_time: string; is_active?: boolean }>): number {
  const total = rows
    .filter((r) => r.is_active !== false)
    .reduce((sum, r) => {
      const end = String(r.end_time).startsWith('23:59') ? 24 * 60 : minutes(r.end_time);
      return sum + Math.max(0, end - minutes(r.start_time));
    }, 0);
  return Math.round((total / 60) * 10) / 10;
}

export const notesRate = (completed: number, withSummary: number) => (completed ? Math.round((withSummary / completed) * 100) : null);

type Middleware = (req: any, res: any, next: any) => any;

export function registerTeacherLoadRoutes(app: express.Express, deps: { getClient: () => any; verifyTeacherAuth: Middleware; requireSuperAdmin: Middleware }) {
  app.get('/api/dashboard/admin/teacher-load', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    try {
      const now = DateTime.utc();
      const weekStart = now.startOf('week');
      const weekEnd = weekStart.plus({ weeks: 1 });
      const since30 = now.minus({ days: 30 });

      const { data: accounts } = await client.from('teacher_accounts').select('email, role').eq('is_active', true);
      const emails = (accounts || []).map((a: any) => String(a.email).toLowerCase());
      const { data: profiles } = emails.length ? await client.from('profiles').select('id, email, display_name').in('email', emails) : { data: [] as any[] };
      const teachers = profiles || [];
      const ids = teachers.map((t: any) => t.id);
      if (!ids.length) return res.json({ weekStart: weekStart.toISODate(), teachers: [] });

      const [students, week, availability, moves, completed] = await Promise.all([
        client.from('students').select('assigned_teacher_id').in('assigned_teacher_id', ids).eq('status', 'active').limit(5000),
        client.from('bookings').select('teacher_id, duration_minutes').in('teacher_id', ids).in('status', LESSON_STATUSES)
          .gte('scheduled_start', weekStart.toISO()).lt('scheduled_start', weekEnd.toISO()).limit(5000),
        client.from('availability').select('teacher_id, start_time, end_time, is_active').in('teacher_id', ids),
        client.from('teacher_lesson_moves').select('teacher_id, reason, old_start, new_start, created_at').in('teacher_id', ids)
          .gte('created_at', since30.toISO()).order('created_at', { ascending: false }).limit(1000),
        client.from('bookings').select('id, teacher_id').in('teacher_id', ids).eq('status', 'completed')
          .gte('scheduled_start', since30.toISO()).lte('scheduled_start', now.toISO()).limit(5000)
      ]);
      const completedRows = completed.data || [];
      const { data: sessions } = completedRows.length
        ? await client.from('lesson_sessions').select('id, booking_id').in('booking_id', completedRows.map((b: any) => b.id))
        : { data: [] as any[] };
      const { data: notes } = (sessions || []).length
        ? await client.from('lesson_notes').select('session_id').in('session_id', sessions.map((s: any) => s.id)).not('family_summary', 'is', null)
        : { data: [] as any[] };
      const summarisedSessions = new Set((notes || []).map((n: any) => n.session_id));
      const summarisedBookings = new Set((sessions || []).filter((s: any) => summarisedSessions.has(s.id)).map((s: any) => s.booking_id));

      const role = new Map((accounts || []).map((a: any) => [String(a.email).toLowerCase(), a.role]));
      const out = teachers.map((t: any) => {
        const mine = (rows: any[] | null, key = 'teacher_id') => (rows || []).filter((r: any) => r[key] === t.id);
        const weekRows = mine(week.data);
        const done = mine(completedRows);
        const teacherMoves = mine(moves.data);
        return {
          teacherId: t.id,
          name: t.display_name || t.email,
          role: role.get(String(t.email).toLowerCase()) || 'teacher',
          activeStudents: mine(students.data, 'assigned_teacher_id').length,
          lessonsThisWeek: weekRows.length,
          hoursBookedThisWeek: Math.round((weekRows.reduce((s: number, b: any) => s + (Number(b.duration_minutes) || 0), 0) / 60) * 10) / 10,
          hoursOfferedPerWeek: offeredHours(mine(availability.data)),
          moves30Days: teacherMoves.length,
          recentMoves: teacherMoves.slice(0, 3).map((m: any) => ({ reason: m.reason, from: m.old_start, to: m.new_start, at: m.created_at })),
          completed30Days: done.length,
          notesRate30Days: notesRate(done.length, done.filter((b: any) => summarisedBookings.has(b.id)).length)
        };
      }).sort((a: any, b: any) => b.lessonsThisWeek - a.lessonsThisWeek);
      return res.json({ weekStart: weekStart.toISODate(), teachers: out });
    } catch (err) {
      console.error('[GET /api/dashboard/admin/teacher-load]', err);
      return res.status(500).json({ error: 'Could not load the teacher view.' });
    }
  });
}
