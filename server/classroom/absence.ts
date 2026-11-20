import { notifySuperAdmins, notifyUser, type InboxNotice } from '../notifications/inbox.js';

/**
 * Owner decision 2026-11-20: a room lesson nobody came to (neither the teacher nor the learner joined) is recorded as
 * "teacher absent", provisionally. The teacher confirms or appeals with a reason within APPEAL_HOURS; no answer makes
 * it final. An appeal goes to the super admin: accept (and pick what really happened) or reject (stays teacher absent).
 *
 * The booking is changed only when the case becomes final, through the same functions the dashboard buttons use
 * (record_lesson_not_held, teacher_record_lesson_outcome), so pay and credits follow RULES.md "What is paid" and no
 * credit given to the family ever has to be taken back (there is no function that reverses a not-held lesson).
 */
export const APPEAL_HOURS = 48;
export const APPEAL_MIN = 10;
export const APPEAL_MAX = 2000;
export type AbsenceOutcome = 'teacher_absent' | 'learner_no_show' | 'completed' | 'no_fault';
export type AbsenceResolution = 'confirmed' | 'expired' | 'appeal_accepted' | 'appeal_rejected';
/** What the admin may pick when accepting an appeal. */
export const APPEAL_OUTCOMES: AbsenceOutcome[] = ['learner_no_show', 'completed', 'no_fault'];
const ACTIVE = ['confirmed', 'rescheduled'];
const BOOKING_COLS = 'id, student_id, teacher_id, status, booking_type, package_entitlement_id, scheduled_start, reference_code, contact_name';

export type AbsenceDeps = {
  now?: () => number;
  afterOutcome?: (client: any, booking: any, status: 'completed' | 'no_show', creditDecision: 'used' | 'returned') => Promise<void> | void;
  notifyAdmins?: (client: any, notice: InboxNotice) => Promise<void>;
  notifyFamily?: typeof notifyUser;
};

/** Records "not held: teacher absent" (or a no-fault technical one) and tells the family their lesson came back. */
export async function applyNotHeld(client: any, booking: any, reason: 'teacher_absent' | 'technical', deps: AbsenceDeps = {}) {
  const notifyFamily = deps.notifyFamily ?? notifyUser;
  const { data, error } = await client.rpc('record_lesson_not_held', { p_booking_id: booking.id, p_reason: reason });
  if (error) throw new Error(error.message);
  if (!data?.creditId) return;
  const { data: credit } = await client.from('package_entitlements').select('purchaser_account_id').eq('id', data.creditId).maybeSingle();
  if (!credit?.purchaser_account_id) return;
  await notifyFamily(client, { userId: credit.purchaser_account_id }, {
    kind: 'lesson_not_held',
    title: { en: 'Your lesson is back in your wallet', ar: 'حصتك رجعت لمحفظتك' },
    body: reason === 'teacher_absent'
      ? { en: 'Your teacher could not come to the lesson, so you have a lesson credit to book again. We are sorry.', ar: 'المعلم ماقدرش يحضر الحصة، فرجعتلك كرصيد تحجز بيه تاني. نعتذر لك.' }
      : { en: 'A lesson could not take place, so you have a lesson credit to book again. We are sorry.', ar: 'حصة ما اتعملتش، فرجعتلك كرصيد تحجز بيه تاني. نعتذر لك.' },
    link: '/student/wallet',
  });
}

/** Opens the provisional case (called by the verdict for "nobody came"). The insert is the claim. */
export async function openAbsenceCase(client: any, booking: any, deps: AbsenceDeps = {}) {
  const now = (deps.now ?? Date.now)();
  const { error } = await client.from('lesson_absence_cases').insert({
    booking_id: booking.id, teacher_user_id: booking.teacher_id, status: 'open',
    deadline_at: new Date(now + APPEAL_HOURS * 3_600_000).toISOString(), created_at: new Date(now).toISOString(),
  });
  if (error && error.code !== '23505') throw new Error(`lesson_absence_cases: ${error.message}`);
  // The dashboard card is the main signal; the bell makes sure the teacher sees it even before opening the dashboard.
  await (deps.notifyFamily ?? notifyUser)(client, { userId: booking.teacher_id, staff: true }, {
    kind: 'lesson_absence',
    title: { en: 'A lesson was recorded as missed', ar: 'حصة اتسجلت إنها فاتت' },
    body: { en: `Nobody joined ${booking.contact_name || 'the lesson'} (${booking.reference_code || ''}). Confirm or appeal within ${APPEAL_HOURS} hours.`, ar: `محدش دخل حصة ${booking.contact_name || ''} (${booking.reference_code || ''}). أكّد أو اعترض خلال ${APPEAL_HOURS} ساعة.` },
    link: '/dashboard',
  });
}

/**
 * Makes a case final and applies its outcome to the booking. The status change is the claim, so two callers (the
 * teacher's Confirm and the sweep, or two admin clicks) can never apply twice; a failed apply puts the case back.
 */
export async function finalizeAbsence(client: any, bookingId: string, from: 'open' | 'appealed', outcome: AbsenceOutcome, resolution: AbsenceResolution, extra: { decidedBy?: string | null; adminNote?: string | null } = {}, deps: AbsenceDeps = {}): Promise<boolean> {
  const now = new Date((deps.now ?? Date.now)()).toISOString();
  const { data: claimed, error } = await client.from('lesson_absence_cases')
    .update({ status: 'final', resolution, outcome, decided_by: extra.decidedBy ?? null, decided_at: now, admin_note: extra.adminNote ?? null })
    .eq('booking_id', bookingId).eq('status', from).select('booking_id');
  if (error) throw new Error(`lesson_absence_cases: ${error.message}`);
  if (!claimed?.length) return false;
  try {
    const { data: booking, error: bErr } = await client.from('bookings').select(BOOKING_COLS).eq('id', bookingId).maybeSingle();
    if (bErr) throw new Error(`bookings: ${bErr.message}`);
    // Someone already recorded the lesson another way (an admin cancel, a move): nothing left to apply.
    if (!booking || !ACTIVE.includes(booking.status)) return true;
    if (outcome === 'teacher_absent' || outcome === 'no_fault') {
      await applyNotHeld(client, booking, outcome === 'teacher_absent' ? 'teacher_absent' : 'technical', deps);
    } else {
      const status = outcome === 'completed' ? 'completed' : 'no_show';
      // RULES.md: a learner no-show is paid, so a package lesson is used, as if it was held.
      const creditDecision = outcome === 'completed' ? 'returned' : 'used';
      const { error: rpcErr } = await client.rpc('teacher_record_lesson_outcome', {
        p_booking_id: bookingId, p_teacher_id: booking.teacher_id, p_outcome: status, p_notes: null, p_covered_material: null, p_no_show_credit_decision: creditDecision,
      });
      if (rpcErr) throw new Error(rpcErr.message);
      if (deps.afterOutcome) await deps.afterOutcome(client, booking, status, creditDecision);
    }
    await client.from('lesson_absence_cases').update({ applied_at: now }).eq('booking_id', bookingId);
    await client.from('lesson_attendance_verdicts').update({ applied: true }).eq('booking_id', bookingId);
    return true;
  } catch (err) {
    await client.from('lesson_absence_cases').update({ status: from, resolution: null, outcome: null, decided_by: null, decided_at: null, admin_note: null }).eq('booking_id', bookingId);
    throw err;
  }
}

/** Cron: open cases past their 48 hours become final as "teacher absent". */
export async function sweepAbsenceCases(client: any, deps: AbsenceDeps = {}): Promise<{ finalized: number; failed: number }> {
  const now = (deps.now ?? Date.now)();
  const out = { finalized: 0, failed: 0 };
  const { data, error } = await client.from('lesson_absence_cases').select('booking_id')
    .eq('status', 'open').lte('deadline_at', new Date(now).toISOString()).order('deadline_at', { ascending: true }).limit(100);
  if (error) throw new Error(`lesson_absence_cases: ${error.message}`);
  for (const c of data || []) {
    try {
      if (await finalizeAbsence(client, c.booking_id, 'open', 'teacher_absent', 'expired', {}, deps)) out.finalized++;
    } catch (err) {
      out.failed++;
      console.error('[absence sweep]', c.booking_id, err);
    }
  }
  return out;
}

/** While a case is not final the booking must not be recorded another way (the outcome buttons, "not held"). */
export async function absenceCaseOpen(client: any, bookingId: string): Promise<boolean> {
  const { data } = await client.from('lesson_absence_cases').select('status').eq('booking_id', bookingId).maybeSingle();
  return Boolean(data && data.status !== 'final');
}

export const notifyAppeal = (client: any, who: string, deps: AbsenceDeps = {}) => (deps.notifyAdmins ?? notifySuperAdmins)(client, {
  kind: 'absence_appeal',
  title: { en: 'A teacher appealed a missed lesson', ar: 'معلم اعترض على حصة متسجلة غياب' },
  body: { en: `${who} says the "nobody came" record is wrong. Read the reason and decide.`, ar: `${who} بيقول إن تسجيل "محدش حضر" غلط. اقرا السبب وقرّر.` },
  link: '/dashboard/absence-appeals',
});
