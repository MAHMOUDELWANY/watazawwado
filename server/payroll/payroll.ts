/**
 * Teacher pay (launch plan D, owner decisions 2026-10-28). Pure rules, no database:
 * - D2: one fixed hourly rate per teacher; a lesson counts by its length (45 min = 0.75 h).
 * - D7: the teacher's own pay currency.
 * - D5 / S1-S4 outcome table:
 *     completed lesson                         -> paid
 *     free trial                               -> not paid
 *     student no-show (broke the policy)       -> paid
 *     cancelled in time / teacher absent /
 *     technical problem on our side            -> not paid (the student got the lesson back)
 *     pay-later or package lesson              -> paid like any lesson (the academy collects)
 *   A lesson whose time passed without an outcome waits ("not recorded yet") and counts once recorded.
 * - D6: a month is a calendar month (UTC); bonuses and deductions are added with a reason; the admin records the payout.
 * Never reads what the student paid: the teacher's pay depends only on the rate and the length.
 */

export interface PayLesson {
  id: string;
  referenceCode: string | null;
  scheduledStart: string;
  durationMinutes: number;
  status: string;
  bookingType: string | null;
  notHeldReason: string | null;
  learnerName: string | null;
}

export type PayOutcome = 'completed' | 'student_no_show' | 'trial' | 'cancelled' | 'teacher_absent' | 'technical' | 'awaiting' | 'upcoming';

export interface PayLine {
  bookingId: string;
  referenceCode: string | null;
  date: string;
  learnerName: string | null;
  minutes: number;
  outcome: PayOutcome;
  paid: boolean;
  amount: number;
}

export interface PayAdjustment { id: string; amount: number; reason: string; createdAt?: string }

export interface PayStatement {
  month: string;
  hourlyRate: number | null;
  currency: string;
  lines: PayLine[];
  paidLessons: number;
  paidMinutes: number;
  lessonsTotal: number;
  adjustments: PayAdjustment[];
  adjustmentsTotal: number;
  total: number;
  /** Lessons whose time passed with no outcome yet: they count once the teacher records them. */
  awaitingCount: number;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** "2026-10" -> first and first-of-next-month as UTC ISO strings; null for a malformed month. */
export function monthRange(month: string): { start: string; end: string; firstDay: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month || '');
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12 || y < 2020 || y > 2100) return null;
  const start = new Date(Date.UTC(y, mo - 1, 1));
  const end = new Date(Date.UTC(y, mo, 1));
  return { start: start.toISOString(), end: end.toISOString(), firstDay: start.toISOString().slice(0, 10) };
}

export const currentMonth = (now = new Date()) => now.toISOString().slice(0, 7);

export function lessonOutcome(l: PayLesson, now = new Date()): PayOutcome {
  if (l.bookingType === 'trial') return 'trial';
  if (l.status === 'completed') return 'completed';
  if (l.status === 'no_show') return 'student_no_show';
  if (l.status === 'cancelled') {
    if (l.notHeldReason === 'teacher_absent') return 'teacher_absent';
    if (l.notHeldReason === 'technical') return 'technical';
    return 'cancelled';
  }
  return new Date(l.scheduledStart).getTime() <= now.getTime() ? 'awaiting' : 'upcoming';
}

const PAID: PayOutcome[] = ['completed', 'student_no_show'];

export function buildStatement(
  month: string,
  rate: { hourlyRate: number; currency: string } | null,
  lessons: PayLesson[],
  adjustments: PayAdjustment[],
  now = new Date()
): PayStatement {
  const hourly = rate ? Number(rate.hourlyRate) : 0;
  const lines: PayLine[] = lessons
    .filter((l) => l.status !== 'pending') // an unpaid held time is not a lesson yet
    .map((l) => {
      const outcome = lessonOutcome(l, now);
      const paid = PAID.includes(outcome);
      const minutes = Number(l.durationMinutes) || 0;
      return {
        bookingId: l.id,
        referenceCode: l.referenceCode,
        date: l.scheduledStart,
        learnerName: l.learnerName,
        minutes,
        outcome,
        paid,
        amount: paid ? round2((hourly * minutes) / 60) : 0
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const paidLines = lines.filter((x) => x.paid);
  const lessonsTotal = round2(paidLines.reduce((s, x) => s + x.amount, 0));
  const adjustmentsTotal = round2(adjustments.reduce((s, a) => s + Number(a.amount), 0));
  return {
    month,
    hourlyRate: rate ? hourly : null,
    currency: rate?.currency || 'USD',
    lines,
    paidLessons: paidLines.length,
    paidMinutes: paidLines.reduce((s, x) => s + x.minutes, 0),
    lessonsTotal,
    adjustments,
    adjustmentsTotal,
    total: Math.max(0, round2(lessonsTotal + adjustmentsTotal)),
    awaitingCount: lines.filter((x) => x.outcome === 'awaiting').length
  };
}

export const OUTCOME_LABELS: Record<PayOutcome, { en: string; ar: string }> = {
  completed: { en: 'Held', ar: 'اتعملت' },
  student_no_show: { en: 'Student did not come', ar: 'الطالب ما حضرش' },
  trial: { en: 'Free trial (not paid)', ar: 'حصة تجريبية (من غير أجر)' },
  cancelled: { en: 'Cancelled in time', ar: 'اتلغت في وقتها' },
  teacher_absent: { en: 'Teacher absent', ar: 'المعلم ما حضرش' },
  technical: { en: 'Technical problem', ar: 'مشكلة تقنية' },
  awaiting: { en: 'Outcome not recorded yet', ar: 'لسه ما اتسجلتش' },
  upcoming: { en: 'Coming up', ar: 'جاية' }
};
