import express from 'express';
import { DateTime } from 'luxon';
import { validateSlotAvailability } from '../integrations/availabilityEngine.js';
import { nextWeekSlot } from '../booking/studentWindows.js';

/** QA-07 step 3: the RN-04 next-week suggestion route, moved out of api/index.ts unchanged. */

type Middleware = (req: any, res: any, next: any) => any;

export function registerNextWeekSuggestionRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  getAuthorizedLearnersForStudent: (supabaseAdmin: any, req: any) => Promise<{ id: string; name?: string | null }[]>;
  resolveTeacherMetadata: (idOrEmail: string, client: any) => Promise<{ display_name?: string | null } | null>;
}) {
  const { getAuthorizedLearnersForStudent, resolveTeacherMetadata } = deps;

  // RN-04: "same time next week?" after a lesson attended in the last 7 days, when the teacher is free then and nothing
  // is booked for the coming week yet. A suggestion only: one tap opens the booking flow with that time; nothing is booked.
  app.get('/api/student/next-week-suggestion', deps.verifyStudentAuth, async (req: any, res: any) => {
    try {
      const supabaseAdmin = deps.getClient();
      if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable.' });
      const learners = await getAuthorizedLearnersForStudent(supabaseAdmin, req);
      const requested = typeof req.query?.learnerId === 'string' ? req.query.learnerId.trim() : '';
      if (requested && !learners.some((l) => l.id === requested)) return res.status(403).json({ error: 'This learner is not on your account.' });
      const learnerIds = requested ? [requested] : learners.map((l) => l.id);
      if (!learnerIds.length) return res.json({ suggestion: null });

      const now = DateTime.utc();
      const { data: rows, error } = await supabaseAdmin
        .from('bookings')
        .select('id, student_id, service_id, duration_minutes, scheduled_start, student_timezone, status, teacher_id')
        .in('student_id', learnerIds)
        .gte('scheduled_start', now.minus({ days: 7 }).toISO())
        .order('scheduled_start', { ascending: false })
        .limit(50);
      if (error) return res.status(500).json({ error: 'Could not check your lessons.' });

      const last = (rows || []).find((b: any) => b.status === 'completed' && b.teacher_id);
      if (!last) return res.json({ suggestion: null });
      const alreadyBooked = (rows || []).some((b: any) =>
        b.student_id === last.student_id && ['pending', 'confirmed', 'rescheduled'].includes(b.status) &&
        DateTime.fromISO(b.scheduled_start) > now && DateTime.fromISO(b.scheduled_start) < now.plus({ days: 8 })
      );
      if (alreadyBooked) return res.json({ suggestion: null });

      const slot = nextWeekSlot(last.scheduled_start, Number(last.duration_minutes), now, last.student_timezone);
      if (!slot) return res.json({ suggestion: null });
      // The real engine decides, exactly as for any booking.
      const free = await validateSlotAvailability(slot.startIso, slot.endIso, last.teacher_id);
      if (!free.isAvailable) return res.json({ suggestion: null });

      const teacher = await resolveTeacherMetadata(last.teacher_id, supabaseAdmin);
      return res.json({
        suggestion: {
          fromBookingId: last.id,
          learnerId: last.student_id,
          learnerName: learners.find((l) => l.id === last.student_id)?.name || null,
          serviceId: last.service_id,
          durationMinutes: last.duration_minutes,
          utcStartIso: slot.startIso,
          utcEndIso: slot.endIso,
          teacherName: teacher?.display_name || null
        }
      });
    } catch (err) {
      console.error('[GET /api/student/next-week-suggestion]', err);
      return res.status(500).json({ error: 'Could not check your lessons.' });
    }
  });
}
