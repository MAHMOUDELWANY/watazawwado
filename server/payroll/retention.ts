/**
 * Quarterly retention bonus (RULES.md §2c, owner 2026-11-12; BACKLOG MK-02). Pure rules, no database.
 * Super admin only: teachers are told the bonus exists, never how the pool is built or what students paid (§1).
 * - Learners taught: different learners with at least one held lesson with the teacher in the quarter.
 * - Learners who left: moved to another teacher (approved change request) in the quarter, with its reason; or
 *   stopped: taught in the quarter, nothing booked with this teacher since, last lesson over 30 days ago. "Stopped"
 *   is only judged once the quarter is over, so a learner between bookings mid-quarter is not counted as gone.
 *   The admin judges whether a leave was because of the teacher; nothing here decides that.
 * - Pool: 10% of the list price of every full-price lesson held (no package, no code discount). Account balance
 *   (credit) is money, not a discount, so a lesson paid with it still counts as full price.
 * - Eligible on numbers: learners taught >= the minimum (a setting, 5 to start). The other two checks are the admin's.
 */

export const DEFAULT_MIN_LEARNERS = 5;
export const POOL_SHARE = 0.1;
const STOPPED_AFTER_DAYS = 30;

export interface RetentionLesson {
  studentId: string | null;
  learnerName: string | null;
  scheduledStart: string;
  durationMinutes: number;
  status: string;
  bookingType: string | null;
  packageEntitlementId: string | null;
  /** What the family paid in the end (after any code and balance). */
  feeUsd: number | null;
  /** From the lesson's checkout, when a code or balance was applied. */
  redemption?: { listAmount: number; discountAmount: number } | null;
}

export interface RetentionMove { studentId: string; learnerName: string | null; reasonType: string; initiator: string; decidedAt: string }

export interface RetentionLeaver { studentId: string; learnerName: string | null; why: 'moved' | 'stopped'; reasonType: string | null; initiator: string | null }

export interface RetentionSummary {
  quarter: string;
  learnersTaught: number;
  leavers: RetentionLeaver[];
  fullPriceLessons: number;
  fullPriceHours: number;
  poolUsd: number;
  minLearners: number;
  meetsMinimum: boolean;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** "2026-Q4" -> UTC range; null for a malformed quarter. */
export function quarterRange(quarter: string): { start: string; end: string } | null {
  const m = /^(\d{4})-Q([1-4])$/.exec(quarter || '');
  if (!m) return null;
  const y = Number(m[1]);
  if (y < 2020 || y > 2100) return null;
  const q = Number(m[2]);
  return { start: new Date(Date.UTC(y, (q - 1) * 3, 1)).toISOString(), end: new Date(Date.UTC(y, q * 3, 1)).toISOString() };
}

export const currentQuarter = (now = new Date()) => `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;

/** The list price of a held lesson when it was full price, else null. */
export function fullPriceList(l: RetentionLesson): number | null {
  if (l.status !== 'completed' || l.bookingType === 'trial' || l.packageEntitlementId) return null;
  if (l.redemption) return l.redemption.discountAmount > 0 ? null : Number(l.redemption.listAmount) || null;
  const fee = Number(l.feeUsd);
  return Number.isFinite(fee) && fee > 0 ? fee : null;
}

export function summarizeQuarter(input: {
  quarter: string;
  lessons: RetentionLesson[];
  /** Every later lesson with this teacher (after the quarter's lessons), to tell who stopped. */
  laterStudentIds: Set<string>;
  moves: RetentionMove[];
  minLearners?: number;
  now?: Date;
}): RetentionSummary {
  const now = input.now || new Date();
  const minLearners = input.minLearners ?? DEFAULT_MIN_LEARNERS;
  const held = input.lessons.filter((l) => l.status === 'completed' && l.bookingType !== 'trial' && l.studentId);
  const lastHeld = new Map<string, { at: number; name: string | null }>();
  for (const l of held) {
    const at = new Date(l.scheduledStart).getTime();
    const prev = lastHeld.get(l.studentId!);
    if (!prev || at > prev.at) lastHeld.set(l.studentId!, { at, name: l.learnerName });
  }

  const leavers: RetentionLeaver[] = input.moves.map((m) => ({ studentId: m.studentId, learnerName: m.learnerName, why: 'moved', reasonType: m.reasonType, initiator: m.initiator }));
  const moved = new Set(input.moves.map((m) => m.studentId));
  const booked = new Set(input.lessons.filter((l) => l.studentId && new Date(l.scheduledStart).getTime() > now.getTime() && ['pending', 'confirmed', 'rescheduled'].includes(l.status)).map((l) => l.studentId!));
  const range = quarterRange(input.quarter);
  const quarterOver = !range || now.getTime() >= new Date(range.end).getTime();
  for (const [studentId, last] of quarterOver ? lastHeld : new Map<string, { at: number; name: string | null }>()) {
    if (moved.has(studentId) || booked.has(studentId) || input.laterStudentIds.has(studentId)) continue;
    if (now.getTime() - last.at > STOPPED_AFTER_DAYS * 86400000) leavers.push({ studentId, learnerName: last.name, why: 'stopped', reasonType: null, initiator: null });
  }

  let fullPriceLessons = 0;
  let minutes = 0;
  let pool = 0;
  for (const l of input.lessons) {
    const list = fullPriceList(l);
    if (list === null) continue;
    fullPriceLessons++;
    minutes += Number(l.durationMinutes) || 0;
    pool += list * POOL_SHARE;
  }

  return {
    quarter: input.quarter,
    learnersTaught: lastHeld.size,
    leavers,
    fullPriceLessons,
    fullPriceHours: round2(minutes / 60),
    poolUsd: round2(pool),
    minLearners,
    meetsMinimum: lastHeld.size >= minLearners,
  };
}

/** The reason line written on the monthly bonus, also used to spot a quarter that was already paid. */
export const bonusReasonPrefix = (quarter: string) => `Retention bonus ${quarter}`;
