import { DateTime } from 'luxon';

/**
 * RULES.md §2/§5 windows for a student's own lesson, as pure checks (QA-01 tests them without a database).
 * Move: any confirmed lesson up to 1 hour before; a free trial only once.
 * Cancel: a free trial up to 1 hour before; any other lesson up to 3 hours before.
 */

export interface WindowBooking {
  status: string;
  booking_type?: string | null;
  scheduled_start: string;
  reschedule_count?: number | null;
}

export interface WindowBlock { status: 400; error: string; code?: string }

const hoursUntil = (startIso: string, now: DateTime) => DateTime.fromISO(startIso).diff(now, 'hours').hours;

export function studentRescheduleBlock(b: WindowBooking, now: DateTime = DateTime.now()): WindowBlock | null {
  if (!['confirmed', 'rescheduled'].includes(b.status)) {
    return { status: 400, error: 'Only confirmed lessons can be rescheduled.' };
  }
  if (b.booking_type === 'trial' && (b.reschedule_count || 0) >= 1) {
    return { status: 400, error: 'A free trial can be rescheduled only once. You can cancel it and book again after 48 hours.', code: 'TRIAL_RESCHEDULE_USED' };
  }
  if (hoursUntil(b.scheduled_start, now) < 1) {
    return { status: 400, error: 'Lessons can be moved up to 1 hour before they start. For a real emergency, please message us on WhatsApp.', code: 'TOO_LATE' };
  }
  return null;
}

export function studentCancelBlock(b: WindowBooking, now: DateTime = DateTime.now()): WindowBlock | null {
  if (!['confirmed', 'rescheduled'].includes(b.status)) {
    return { status: 400, error: 'This lesson cannot be cancelled.' };
  }
  const isTrial = b.booking_type === 'trial';
  if (hoursUntil(b.scheduled_start, now) < (isTrial ? 1 : 3)) {
    return {
      status: 400,
      error: isTrial
        ? 'A free trial can be cancelled up to 1 hour before it starts.'
        : 'Lessons can be cancelled up to 3 hours before they start. You can still move it up to 1 hour before.',
      code: 'TOO_LATE'
    };
  }
  return null;
}
