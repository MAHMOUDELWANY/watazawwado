import express from 'express';
import { DateTime } from 'luxon';
import { waitUntil } from '@vercel/functions';
import { validateSlotAvailability } from '../integrations/availabilityEngine.js';
import { getActiveGoogleConnection } from '../integrations/syncEngine.js';
import { deleteGoogleCalendarEvent } from '../integrations/googleCalendar.js';
import { processIntegrationJobs } from '../integrations/worker.js';
import { notifyUser, notifySuperAdmins, resolveLearnerAccount } from '../notifications/inbox.js';
import { resolveEmailLanguage } from '../notifications/dispatcher.js';
import { renderTeacherNotification } from '../notifications/emailTemplates.js';
import { sendEmail } from '../notifications/emailService.js';

/**
 * AD-02b: the super admin moves an upcoming lesson to another teacher (RULES.md §1: booked lessons stay with their
 * teacher until the admin moves or cancels them). Same time, same price, same payment and the same Zoom meeting
 * (one academy Zoom account; the lesson's teacher starts it as host). What changes: bookings.teacher_id, the old
 * teacher's Google Calendar event is removed, and the usual booking_sync job puts the lesson on the new teacher's
 * calendar. The database part is one transaction (admin_move_booking_teacher).
 */
export const MOVABLE_STATUSES = ['pending', 'confirmed', 'rescheduled'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Teacher = { id: string; email: string; display_name: string; role: string; is_active: boolean };

export interface LessonTeacherMoveDeps {
  getClient: () => any;
  verifyTeacherAuth: express.RequestHandler;
  requireSuperAdmin: express.RequestHandler;
  resolveTeacher: (idOrEmail: string, client: any) => Promise<Teacher | null>;
  /** Defaults to validateSlotAvailability for the new teacher. */
  isTeacherFree?: (startIso: string, endIso: string, teacherId: string) => Promise<{ isAvailable: boolean; conflictReason?: string }>;
  /** Calendar clean-up, calendar sync and notices; defaults to afterTeacherMove. Runs after the response. */
  afterMove?: (client: any, move: CompletedMove, resolveTeacher: LessonTeacherMoveDeps['resolveTeacher']) => Promise<void>;
  runInBackground?: (p: Promise<unknown>) => void;
}

export interface CompletedMove {
  moveId: string;
  booking: any;
  fromTeacherId: string | null;
  toTeacher: Teacher;
  oldGoogleEventId: string | null;
  syncQueued: boolean;
}

/** Why a lesson cannot be moved, or null. Only upcoming pending/confirmed/rescheduled lessons can. */
export function moveRefusal(b: { status: string; scheduled_start: string }, now = Date.now()): string | null {
  if (!MOVABLE_STATUSES.includes(b.status)) return 'Only upcoming lessons that are not cancelled or finished can be moved.';
  const start = Date.parse(b.scheduled_start);
  if (!Number.isFinite(start) || start <= now) return 'Only upcoming lessons that are not cancelled or finished can be moved.';
  return null;
}

export function parseMoveBody(body: any): { teacherId: string; reason: string } | { error: string } {
  const teacherId = typeof body?.teacherId === 'string' ? body.teacherId.trim() : '';
  if (!teacherId) return { error: 'Choose the teacher to move the lesson to.' };
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  if (reason.length < 3 || reason.length > 500) return { error: 'Write a short reason (3 to 500 characters).' };
  return { teacherId, reason };
}

/** SQL errors from admin_move_booking_teacher → status + message safe to show. */
export function moveErrorResponse(err: any): { status: number; error: string } {
  const code = String(err?.code || '');
  if (code === '23P01') return { status: 409, error: 'That teacher already has a lesson at this time.' };
  if (code === '23503') return { status: 400, error: 'That teacher has no sign-in account yet, so lessons cannot be moved to them.' };
  if (code === 'P0002') return { status: 404, error: 'Lesson not found.' };
  if (['P0003', 'P0004', 'P0005'].includes(code)) return { status: 409, error: String(err.message) };
  if (code === 'P0001') return { status: 400, error: String(err.message) };
  return { status: 500, error: 'The lesson could not be moved. Please try again.' };
}

const BOOKING_COLUMNS = 'id, reference_code, status, scheduled_start, scheduled_end, duration_minutes, teacher_id, student_id, student_name, contact_name, service_name, student_timezone, booking_type';

export function registerLessonTeacherMoveRoutes(app: express.Express, deps: LessonTeacherMoveDeps) {
  const { getClient, verifyTeacherAuth, requireSuperAdmin, resolveTeacher } = deps;
  const isTeacherFree = deps.isTeacherFree || validateSlotAvailability;
  const afterMove = deps.afterMove || afterTeacherMove;
  const runInBackground = deps.runInBackground || waitUntil;

  app.post('/api/dashboard/admin/bookings/:id/move-teacher', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const bookingId = String(req.params.id || '');
      if (!UUID_RE.test(bookingId)) return res.status(400).json({ error: 'Invalid lesson id.' });
      const parsed = parseMoveBody(req.body);
      if ('error' in parsed) return res.status(400).json({ error: parsed.error });

      const { data: booking, error: bErr } = await client.from('bookings').select(BOOKING_COLUMNS).eq('id', bookingId).maybeSingle();
      if (bErr) throw bErr;
      if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
      const refusal = moveRefusal(booking);
      if (refusal) return res.status(409).json({ error: refusal });

      const target = await resolveTeacher(parsed.teacherId, client);
      if (!target || !UUID_RE.test(target.id)) return res.status(400).json({ error: 'That teacher was not found.' });
      if (!target.is_active) return res.status(400).json({ error: 'That teacher account is not active.' });
      if (!['teacher', 'super_admin'].includes(target.role)) return res.status(400).json({ error: 'That account is not a teacher.' });
      if (target.id === booking.teacher_id) return res.status(409).json({ error: 'This lesson is already with that teacher.' });

      // The new teacher's own hours, Google Calendar and lessons (RULES.md §1). The database constraint
      // still refuses an overlap if two moves race.
      const endIso = booking.scheduled_end
        || DateTime.fromISO(booking.scheduled_start, { zone: 'utc' }).plus({ minutes: Number(booking.duration_minutes) || 30 }).toISO();
      const free = await isTeacherFree(booking.scheduled_start, endIso, target.id);
      if (!free.isAvailable) {
        return res.status(409).json({ error: `That teacher is not free at this time. ${free.conflictReason || ''}`.trim() });
      }

      const { data: result, error: rpcErr } = await client.rpc('admin_move_booking_teacher', {
        p_booking_id: bookingId,
        p_new_teacher_id: target.id,
        p_reason: parsed.reason,
        p_moved_by: UUID_RE.test(String(req.teacherUser?.id || '')) ? req.teacherUser.id : null
      });
      if (rpcErr) {
        const mapped = moveErrorResponse(rpcErr);
        if (mapped.status === 500) console.error('[move-teacher] rpc failed', rpcErr);
        return res.status(mapped.status).json({ error: mapped.error });
      }

      const move: CompletedMove = {
        moveId: result?.move_id,
        booking,
        fromTeacherId: result?.from_teacher_id ?? booking.teacher_id ?? null,
        toTeacher: target,
        oldGoogleEventId: result?.old_google_event_id ?? null,
        syncQueued: Boolean(result?.sync_queued)
      };
      runInBackground(afterMove(client, move, resolveTeacher).catch((err) => console.error('[move-teacher] follow-up failed', err)));

      res.json({
        success: true,
        bookingId,
        teacher: { id: target.id, name: target.display_name },
        message: 'Lesson moved. Same time, same price and the same Zoom link.'
      });
    } catch (err) {
      console.error('[POST /api/dashboard/admin/bookings/:id/move-teacher]', err);
      res.status(500).json({ error: 'The lesson could not be moved. Please try again.' });
    }
  });
}

/** Removes the old teacher's calendar event. Never throws; returns what happened. */
async function removeOldCalendarEvent(fromTeacherId: string | null, eventId: string | null): Promise<'none' | 'done' | 'failed'> {
  if (!eventId) return 'none';
  if (!fromTeacherId) return 'failed';
  try {
    const conn = await getActiveGoogleConnection(fromTeacherId);
    if (!conn?.accessToken) return 'failed';
    return (await deleteGoogleCalendarEvent(conn.accessToken, eventId)) ? 'done' : 'failed';
  } catch (err) {
    console.warn('[move-teacher] old calendar event not removed', err);
    return 'failed';
  }
}

function lessonWhen(b: any, zone: string, locale: string): string {
  const start = DateTime.fromISO(b.scheduled_start, { zone: 'utc' }).setZone(zone).setLocale(locale);
  return start.isValid ? start.toFormat('cccc d LLLL · h:mm a') : '';
}

async function emailTeacher(t: Teacher | null, eventType: 'new_booking' | 'cancelled', summary: string, summaryAr: string, b: any) {
  if (!t?.email || !t.is_active) return;
  try {
    const lang = await resolveEmailLanguage(t.email);
    // No prices or payment details: teachers never see money (RULES.md §1).
    const mail = renderTeacherNotification({
      eventType,
      summary,
      summaryAr,
      details: [
        ['Student', 'الطالب', b.student_name || b.contact_name || ''],
        ['Subject', 'المادة', b.service_name || ''],
        ['When (Cairo)', 'الموعد (القاهرة)', lessonWhen(b, 'Africa/Cairo', lang === 'ar' ? 'ar-EG' : 'en-GB')],
        ['Length', 'المدة', `${Number(b.duration_minutes) || 30} min`],
        ['Booking ref', 'رقم الحجز', b.reference_code || '']
      ],
      lang
    });
    await sendEmail({ to: t.email, toName: t.display_name || undefined, ...mail, from: 'hr' });
  } catch (err) {
    console.warn('[move-teacher] teacher email failed', err);
  }
}

/**
 * After the move: remove the old calendar event, run the queued calendar sync for the new teacher, then tell the
 * family (on-site), the old and the new teacher (on-site + their usual lesson email). Never throws.
 */
export async function afterTeacherMove(client: any, move: CompletedMove, resolveTeacher: LessonTeacherMoveDeps['resolveTeacher']): Promise<void> {
  const b = move.booking;
  const cleanup = await removeOldCalendarEvent(move.fromTeacherId, move.oldGoogleEventId);
  if (move.moveId) {
    const { error } = await client.from('booking_teacher_moves').update({ calendar_cleanup: cleanup }).eq('id', move.moveId);
    if (error) console.warn('[move-teacher] cleanup state not saved', error.message);
  }
  if (cleanup === 'failed') {
    await notifySuperAdmins(client, {
      kind: 'teacher_move_calendar',
      title: { en: 'Old calendar event left in place', ar: 'الميعاد القديم لسه في كالندر المدرس' },
      body: {
        en: `Lesson ${b.reference_code} moved to ${move.toTeacher.display_name}, but its event could not be removed from the previous teacher's Google Calendar. Please remove it by hand.`,
        ar: `الحصة ${b.reference_code} اتنقلت لـ ${move.toTeacher.display_name}، بس معرفناش نشيل الميعاد من Google Calendar بتاع المدرس القديم. شيله بإيدك لو سمحت.`
      },
      link: '/dashboard/bookings'
    });
  }

  if (move.syncQueued) {
    try {
      await processIntegrationJobs(1, undefined, b.id);
    } catch (err) {
      console.warn('[move-teacher] calendar sync left for the cron worker', err);
    }
  }

  const learner = b.student_name || b.contact_name || 'Student';
  const newName = move.toTeacher.display_name || 'your new teacher';

  // The family: on-site, plain wording, only the new teacher's display name.
  try {
    const account = await resolveLearnerAccount(client, b.student_id);
    if (account.userId) {
      const zone = b.student_timezone || 'Africa/Cairo';
      await notifyUser(client, { userId: account.userId }, {
        kind: 'lesson_teacher_changed',
        title: { en: 'Your lesson has a new teacher', ar: 'حصتك بقى ليها مدرس جديد' },
        body: {
          en: `${learner}'s lesson on ${lessonWhen(b, zone, 'en-GB')} is now with ${newName}. Same time, same Zoom link, nothing else changes.`,
          ar: `حصة ${learner} يوم ${lessonWhen(b, zone, 'ar-EG')} بقت مع ${newName}. نفس الميعاد ونفس رابط Zoom، ومفيش أي حاجة تانية اتغيرت.`
        },
        link: '/student/lessons'
      });
    }
  } catch (err) {
    console.warn('[move-teacher] family notice failed', err);
  }

  // The previous teacher.
  if (move.fromTeacherId) {
    const from = await resolveTeacher(move.fromTeacherId, client).catch(() => null);
    await notifyUser(client, { userId: move.fromTeacherId, staff: true }, {
      kind: 'lesson_moved_away',
      title: { en: 'A lesson moved to another teacher', ar: 'حصة اتنقلت لمدرس تاني' },
      body: {
        en: `${learner}'s lesson on ${lessonWhen(b, 'Africa/Cairo', 'en-GB')} (Cairo) is now with another teacher. It is off your schedule.`,
        ar: `حصة ${learner} يوم ${lessonWhen(b, 'Africa/Cairo', 'ar-EG')} (بتوقيت القاهرة) بقت مع مدرس تاني، واتشالت من جدولك.`
      },
      link: '/dashboard/bookings'
    });
    await emailTeacher(from, 'cancelled',
      `The lesson with ${learner} was moved to another teacher. It is off your schedule.`,
      `حصة ${learner} اتنقلت لمدرس تاني، واتشالت من جدولك.`, b);
  }

  // The new teacher.
  await notifyUser(client, { userId: move.toTeacher.id, staff: true }, {
    kind: 'lesson_moved_to_you',
    title: { en: 'A lesson was moved to you', ar: 'اتنقلت ليك حصة' },
    body: {
      en: `${learner}'s lesson on ${lessonWhen(b, 'Africa/Cairo', 'en-GB')} (Cairo) is now yours. It is on your schedule.`,
      ar: `حصة ${learner} يوم ${lessonWhen(b, 'Africa/Cairo', 'ar-EG')} (بتوقيت القاهرة) بقت معاك، وهتلاقيها في جدولك.`
    },
    link: '/dashboard/bookings'
  });
  await emailTeacher(move.toTeacher, 'new_booking',
    `The lesson with ${learner} was moved to you. It is on your schedule.`,
    `حصة ${learner} اتنقلت ليك، وهتلاقيها في جدولك.`, b);
}
