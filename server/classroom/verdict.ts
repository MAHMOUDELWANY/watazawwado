import { analyzeAttendance, type AttendanceAnalysis } from '../routes/attendance.js';
import { roomHardCloseMs } from '../../src/lib/roomWindow.js';
import { lessonEndMs } from '../../src/lib/lessonWindow.js';
import { classroomEnabledFor } from './mode.js';
import { notifySuperAdmins, notifyUser, type InboxNotice } from '../notifications/inbox.js';
import { applyNotHeld, openAbsenceCase } from './absence.js';

/**
 * Classroom BUILD-LIST 3.2: the automatic attendance verdict of a room lesson, under RULES.md "What is paid" (§2c).
 * - completed: held (analyzeAttendance: together >= 20 min for 30-min lessons, 30 otherwise).
 * - learner_no_show: the teacher came and stayed past start + 15 min; the learner never came in those 15 minutes.
 * - teacher_no_show: the learner came; the teacher never joined in the lesson window. Also "nobody came" (owner,
 *   2026-11-20), but provisionally: a lesson_absence_cases row the teacher confirms or appeals within 48 h
 *   (server/classroom/absence.ts); the booking changes only when that case is final.
 * - review: anything else (a short lesson, a Zoom fallback that was not held, a teacher who ended before
 *   the 15 minutes): nothing changes on the booking and the super admin is told.
 * The booking moves through the same database functions the teacher's buttons use (teacher_record_lesson_outcome,
 * record_lesson_not_held), so pay, credits and packages follow the existing rules. Lessons that never used our room
 * (classroom off for the teacher) are left to the teacher, as before.
 */
export type Verdict = 'completed' | 'learner_no_show' | 'teacher_no_show' | 'review';
export const NO_SHOW_MINUTES = 15;
/** How far back the sweep looks for lessons nobody ended. */
export const SWEEP_DAYS = 3;
const ACTIVE = ['confirmed', 'rescheduled'];

type Ev = { event: string; role: string; occurred_at: string; source?: string };
type Lesson = { scheduled_start: string; scheduled_end?: string | null; duration_minutes?: number | null };

/** First join of a side (our room or Zoom) inside the room window (10 min before the start to the booked end). */
function firstJoinMs(events: Ev[], role: string, lesson: Lesson): number | null {
  const from = new Date(lesson.scheduled_start).getTime() - 10 * 60_000;
  const to = lessonEndMs(lesson.scheduled_start, lesson.scheduled_end, lesson.duration_minutes);
  const times = events
    .filter((e) => e.role === role && (e.event === 'room_joined' || e.event === 'joined'))
    .map((e) => new Date(e.occurred_at).getTime())
    .filter((t) => t >= from && t <= to);
  return times.length ? Math.min(...times) : null;
}

export function decideVerdict(input: { events: Ev[]; lesson: Lesson; decidedAtMs: number; fallback: boolean }): { verdict: Verdict; reason: string; analysis: AttendanceAnalysis } {
  const { events, lesson, decidedAtMs, fallback } = input;
  const analysis = analyzeAttendance(events as any, lesson);
  const out = (verdict: Verdict, reason: string) => ({ verdict, reason, analysis });
  if (analysis.held) return out('completed', 'held');
  // RULES.md: a lesson that fell back to Zoom follows Zoom attendance; only "held" is decided automatically.
  if (fallback) return out('review', 'zoom_fallback_not_held');
  const cut = new Date(lesson.scheduled_start).getTime() + NO_SHOW_MINUTES * 60_000;
  const teacher = firstJoinMs(events, 'teacher', lesson);
  const learner = firstJoinMs(events, 'student', lesson);
  if (teacher === null) return out('teacher_no_show', learner === null ? 'nobody_came' : 'teacher_never_joined');
  if (learner === null || learner > cut) {
    if (teacher > cut) return out('review', 'teacher_late_past_15');
    if (decidedAtMs < cut) return out('review', 'ended_before_15');
    return out('learner_no_show', learner === null ? 'learner_never_joined' : 'learner_late_past_15');
  }
  return out('review', 'short_together');
}

export type VerdictDeps = {
  now?: () => number;
  classroomEnabled?: (teacherId: string) => boolean;
  /** The side effects the teacher's outcome path runs (trial follow-up, referral, low balance). */
  afterOutcome?: (client: any, booking: any, status: 'completed' | 'no_show', creditDecision: 'used' | 'returned') => Promise<void> | void;
  notifyAdmins?: (client: any, notice: InboxNotice) => Promise<void>;
  notifyFamily?: typeof notifyUser;
};

const BOOKING_COLS = 'id, student_id, teacher_id, status, booking_type, package_entitlement_id, scheduled_start, scheduled_end, duration_minutes, reference_code, contact_name';

export type VerdictResult = { decided: false; why: string } | { decided: true; verdict: Verdict; reason: string; applied: boolean };

/**
 * Decides and applies the verdict of one lesson, once. Called by the teacher's End (trigger 'end') and the sweep.
 * Skips lessons already recorded (status no longer confirmed/rescheduled), lessons not over yet (no End and before the
 * hard close), and lessons that never used our room. The verdict row is the claim: a second caller finds it and stops.
 */
export async function runRoomVerdict(client: any, bookingId: string, trigger: 'end' | 'sweep', deps: VerdictDeps = {}): Promise<VerdictResult> {
  const now = deps.now ?? Date.now;
  const classroomEnabled = deps.classroomEnabled ?? ((id: string) => classroomEnabledFor(id));
  const notifyAdmins = deps.notifyAdmins ?? notifySuperAdmins;
  const notifyFamily = deps.notifyFamily ?? notifyUser;

  const { data: booking, error } = await client.from('bookings').select(BOOKING_COLS).eq('id', bookingId).maybeSingle();
  if (error) throw new Error(`bookings: ${error.message}`);
  if (!booking) return { decided: false, why: 'not_found' };
  if (!ACTIVE.includes(booking.status) || !booking.teacher_id) return { decided: false, why: 'status' };

  const [{ data: events, error: evErr }, { data: room, error: roomErr }, { data: incidents, error: incErr }, { data: claimed, error: claimErr }] = await Promise.all([
    client.from('lesson_attendance_events').select('source, event, role, occurred_at').eq('booking_id', bookingId).order('occurred_at', { ascending: true }).limit(500),
    client.from('lesson_room_state').select('ended_at').eq('booking_id', bookingId).maybeSingle(),
    client.from('classroom_incidents').select('id').eq('booking_id', bookingId).limit(1),
    client.from('lesson_attendance_verdicts').select('verdict').eq('booking_id', bookingId).maybeSingle(),
  ]);
  for (const e of [evErr, roomErr, incErr, claimErr]) if (e) throw new Error(`verdict read: ${e.message}`);
  if (claimed) return { decided: false, why: 'already' };
  const rows: Ev[] = events || [];
  const usedRoom = rows.some((e) => e.source === 'room');
  if (!usedRoom && !classroomEnabled(booking.teacher_id)) return { decided: false, why: 'not_room' };
  const endedAt = room?.ended_at ? new Date(room.ended_at).getTime() : null;
  if (endedAt === null && now() < roomHardCloseMs(booking)) return { decided: false, why: 'not_over' };

  const fallback = (incidents || []).length > 0 || rows.some((e) => e.source === 'zoom' && (e.event === 'joined' || e.event === 'meeting_started'));
  const decidedAtMs = Math.min(now(), endedAt ?? Infinity);
  const { verdict, reason, analysis } = decideVerdict({ events: rows, lesson: booking, decidedAtMs, fallback });
  const detail = { togetherMinutes: analysis.togetherMinutes, requiredMinutes: analysis.requiredMinutes, joins: analysis.joins, teacherFirstJoin: analysis.teacherFirstJoin, studentFirstJoin: analysis.studentFirstJoin, fallback };

  const { error: insErr } = await client.from('lesson_attendance_verdicts').insert({ booking_id: bookingId, verdict, reason, trigger, applied: false, detail, decided_at: new Date(now()).toISOString() });
  if (insErr) {
    if (insErr.code === '23505') return { decided: false, why: 'already' };
    throw new Error(`lesson_attendance_verdicts: ${insErr.message}`);
  }

  const who = `${booking.contact_name || booking.reference_code || bookingId} (${booking.reference_code || ''})`;
  try {
    if (verdict === 'completed' || verdict === 'learner_no_show') {
      const status = verdict === 'completed' ? 'completed' : 'no_show';
      // RULES.md: a student no-show is paid, so a package lesson is used, as if it was held.
      const creditDecision = verdict === 'completed' ? 'returned' : 'used';
      const { error: rpcErr } = await client.rpc('teacher_record_lesson_outcome', {
        p_booking_id: bookingId, p_teacher_id: booking.teacher_id, p_outcome: status, p_notes: null, p_covered_material: null, p_no_show_credit_decision: creditDecision,
      });
      if (rpcErr) throw new Error(rpcErr.message);
      if (deps.afterOutcome) await deps.afterOutcome(client, booking, status, creditDecision);
    } else if (verdict === 'teacher_no_show' && reason === 'nobody_came') {
      await openAbsenceCase(client, booking, { now, notifyFamily });
    } else if (verdict === 'teacher_no_show') {
      await applyNotHeld(client, booking, 'teacher_absent', { notifyFamily });
      await notifyAdmins(client, {
        kind: 'lesson_not_held',
        title: { en: 'Teacher no-show recorded automatically', ar: 'اتسجّل غياب المعلم تلقائي' },
        body: { en: `${who}: the learner came to the room and the teacher never joined. The lesson is unpaid and the learner got a credit.`, ar: `${who}: الطالب دخل الغرفة والمعلم ما دخلش. الحصة مش مدفوعة للمعلم والطالب خد رصيد.` },
        link: `/dashboard/admin/lessons/${bookingId}`,
      });
    } else {
      await notifyAdmins(client, {
        kind: 'attendance_review',
        title: { en: 'A lesson needs your attendance decision', ar: 'حصة محتاجة قرارك في الحضور' },
        body: { en: `${who}: the room could not decide (${reason}). Look at the lesson and record what happened.`, ar: `${who}: الغرفة ماقدرتش تقرر (${reason}). شوف الحصة وسجّل اللي حصل.` },
        link: `/dashboard/admin/lessons/${bookingId}`,
      });
    }
  } catch (err) {
    // Not applied: drop the claim so the next sweep tries again.
    await client.from('lesson_attendance_verdicts').delete().eq('booking_id', bookingId);
    throw err;
  }
  const applied = verdict !== 'review' && reason !== 'nobody_came';
  if (applied) {
    const { error: upErr } = await client.from('lesson_attendance_verdicts').update({ applied: true }).eq('booking_id', bookingId);
    if (upErr) console.error('[verdict] applied flag', upErr.message);
  }
  return { decided: true, verdict, reason, applied };
}

/** Cron: every room lesson of the last SWEEP_DAYS past its hard close that nobody recorded yet. */
export async function sweepRoomVerdicts(client: any, deps: VerdictDeps = {}): Promise<{ decided: number; failed: number }> {
  const now = deps.now ?? Date.now;
  const out = { decided: 0, failed: 0 };
  const { data, error } = await client.from('bookings').select('id, scheduled_start, scheduled_end, duration_minutes')
    .in('status', ACTIVE).not('teacher_id', 'is', null)
    .gte('scheduled_start', new Date(now() - SWEEP_DAYS * 86_400_000).toISOString())
    .lte('scheduled_start', new Date(now()).toISOString())
    .order('scheduled_start', { ascending: true }).limit(200);
  if (error) throw new Error(`bookings: ${error.message}`);
  for (const b of (data || []).filter((x: any) => roomHardCloseMs(x) <= now())) {
    try {
      if ((await runRoomVerdict(client, b.id, 'sweep', deps)).decided) out.decided++;
    } catch (err) {
      out.failed++;
      console.error('[verdict sweep]', b.id, err);
    }
  }
  return out;
}
