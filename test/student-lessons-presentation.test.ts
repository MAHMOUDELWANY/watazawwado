import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import {
  categorizeLessons,
  getLessonDisplayStatus,
  isCoordinationAllowed,
  getLessonStart,
} from '../src/student/lessonsPresentation.js';

/**
 * Focused tests for the My Lessons presentation hardening.
 *
 * These cover ONLY the concrete defects fixed:
 *   - status truthfulness (no false Confirmed / Paid / Completed),
 *   - past-but-unfinalised placements,
 *   - WhatsApp-only coordination eligibility,
 *   - categorization robustness.
 */

const NOW = DateTime.utc(2026, 6, 15, 12, 0, 0).toMillis();
const pastIso = DateTime.utc(2026, 6, 10, 9, 0, 0).toISO()!;
const futureIso = DateTime.utc(2026, 6, 20, 9, 0, 0).toISO()!;
const soonIso = DateTime.utc(2026, 6, 15, 12, 30, 0).toISO()!; // within 60-min grace

const unpaid = { isPendingPayment: true, isAwaitingVerification: false, isPaidOrTrial: false };
const underReview = { isPendingPayment: true, isAwaitingVerification: true, isPaidOrTrial: false };
const paid = { isPendingPayment: false, isAwaitingVerification: false, isPaidOrTrial: true };

describe('Student Lessons — categorization truthfulness', () => {
  it('only genuinely completed bookings appear in the Completed bucket', () => {
    const c = categorizeLessons(
      [{ id: 'c1', status: 'completed', scheduledStart: pastIso }],
      NOW
    );
    assert.equal(c.completed.length, 1);
    assert.equal(c.completed[0].id, 'c1');
  });

  it('a PAST confirmed-but-unfinalised lesson is history, NOT presented as completed', () => {
    const c = categorizeLessons(
      [{ id: 'p1', status: 'confirmed', scheduledStart: pastIso }],
      NOW
    );
    assert.equal(c.completed.length, 0, 'past confirmed must not be marked completed');
    assert.equal(c.upcoming.length, 0);
    assert.equal(c.cancelled.length, 1, 'unfinalised past lesson belongs to history');
    assert.equal(c.cancelled[0].id, 'p1');
  });

  it('past pending / rescheduled lessons are history, not completed', () => {
    const c = categorizeLessons(
      [
        { id: 'p2', status: 'pending', scheduledStart: pastIso },
        { id: 'p3', status: 'rescheduled', scheduledStart: pastIso },
      ],
      NOW
    );
    assert.equal(c.completed.length, 0);
    assert.equal(c.cancelled.length, 2);
  });

  it('an unrecognised status is never silently counted as completed', () => {
    const c = categorizeLessons([{ id: 'x', status: 'weird_state', scheduledStart: pastIso }], NOW);
    assert.equal(c.completed.length, 0);
    assert.equal(c.cancelled.length, 1);
  });

  it('upcoming holds in-flight lessons within the grace window, sorted soonest first', () => {
    const c = categorizeLessons(
      [
        { id: 'u2', status: 'confirmed', scheduledStart: futureIso },
        { id: 'u1', status: 'confirmed', scheduledStart: soonIso },
      ],
      NOW
    );
    assert.deepEqual(c.upcoming.map((b) => b.id), ['u1', 'u2']);
  });

  it('cancelled / no_show are history regardless of time', () => {
    const c = categorizeLessons(
      [
        { id: 'h1', status: 'cancelled', scheduledStart: futureIso },
        { id: 'h2', status: 'no_show', scheduledStart: pastIso },
      ],
      NOW
    );
    assert.equal(c.cancelled.length, 2);
    assert.equal(c.upcoming.length, 0);
  });

  it('empty / malformed input yields empty buckets (no crash)', () => {
    assert.deepEqual(categorizeLessons([], NOW), { all: [], upcoming: [], completed: [], cancelled: [] });
    assert.deepEqual(categorizeLessons(undefined as any, NOW).all, []);
  });

  it('all is the concatenation upcoming -> completed -> cancelled', () => {
    const c = categorizeLessons(
      [
        { id: 'u', status: 'confirmed', scheduledStart: futureIso },
        { id: 'c', status: 'completed', scheduledStart: pastIso },
        { id: 'x', status: 'cancelled', scheduledStart: pastIso },
      ],
      NOW
    );
    assert.deepEqual(c.all.map((b) => b.id), ['u', 'c', 'x']);
  });
});

describe('Student Lessons — status truthfulness', () => {
  it('never labels an unpaid/under-review confirmed lesson as plain Confirmed', () => {
    const s = getLessonDisplayStatus({ status: 'confirmed' }, unpaid, false);
    assert.notEqual(s.label, 'Confirmed');
    assert.equal(s.variant, 'warning');
  });

  it('labels an under-review confirmed lesson as awaiting verification', () => {
    const s = getLessonDisplayStatus({ status: 'confirmed' }, underReview, false);
    assert.match(s.label, /verification/i);
    assert.equal(s.variant, 'warning');
  });

  it('labels a fully paid confirmed lesson as Confirmed (success)', () => {
    const s = getLessonDisplayStatus({ status: 'confirmed' }, paid, false);
    assert.equal(s.label, 'Confirmed');
    assert.equal(s.variant, 'success');
  });

  it('backend pending status maps to Pending Payment (warning) in both languages', () => {
    assert.equal(getLessonDisplayStatus({ status: 'pending' }, unpaid, false).label, 'Pending Payment');
    assert.equal(getLessonDisplayStatus({ status: 'pending' }, unpaid, true).label, 'في انتظار الدفع');
  });

  it('completed / cancelled / no_show / rescheduled map to stable truthful labels', () => {
    assert.equal(getLessonDisplayStatus({ status: 'completed' }, paid, false).label, 'Completed');
    assert.equal(getLessonDisplayStatus({ status: 'cancelled' }, unpaid, false).label, 'Cancelled');
    assert.equal(getLessonDisplayStatus({ status: 'no_show' }, unpaid, false).label, 'No Show');
    assert.equal(getLessonDisplayStatus({ status: 'rescheduled' }, paid, false).label, 'Rescheduled');
  });

  it('an unknown status is shown as unknown, never as Confirmed/Completed', () => {
    const s = getLessonDisplayStatus({ status: 'mystery' }, paid, false);
    assert.equal(s.variant, 'outline');
    assert.notEqual(s.label, 'Confirmed');
    assert.notEqual(s.label, 'Completed');
  });

  it('payment state does not override finalised lifecycle labels', () => {
    // A cancelled lesson with an odd payment summary must still read Cancelled.
    assert.equal(getLessonDisplayStatus({ status: 'cancelled' }, underReview, false).label, 'Cancelled');
  });
});

describe('Student Lessons — WhatsApp-only coordination eligibility', () => {
  it('allows coordination for a future confirmed lesson', () => {
    assert.equal(isCoordinationAllowed({ status: 'confirmed', scheduledStart: futureIso }, NOW), true);
  });

  it('allows coordination for a future rescheduled lesson', () => {
    assert.equal(isCoordinationAllowed({ status: 'rescheduled', scheduledStart: futureIso }, NOW), true);
  });

  it('does NOT allow coordination for pending-payment bookings', () => {
    assert.equal(isCoordinationAllowed({ status: 'pending', scheduledStart: futureIso }, NOW), false);
  });

  it('does NOT allow coordination once the lesson has started/passed', () => {
    assert.equal(isCoordinationAllowed({ status: 'confirmed', scheduledStart: pastIso }, NOW), false);
  });

  it('does NOT allow coordination for completed / cancelled / no_show', () => {
    assert.equal(isCoordinationAllowed({ status: 'completed', scheduledStart: pastIso }, NOW), false);
    assert.equal(isCoordinationAllowed({ status: 'cancelled', scheduledStart: pastIso }, NOW), false);
    assert.equal(isCoordinationAllowed({ status: 'no_show', scheduledStart: pastIso }, NOW), false);
  });

  it('does NOT allow coordination without a valid start time', () => {
    assert.equal(isCoordinationAllowed({ status: 'confirmed' }, NOW), false);
    assert.equal(isCoordinationAllowed({ status: 'confirmed', scheduledStart: 'not-a-date' }, NOW), false);
  });
});

describe('Student Lessons — start parsing', () => {
  it('reads scheduledStart / scheduled_start / lesson_date aliases', () => {
    assert.ok(getLessonStart({ scheduledStart: futureIso })?.isValid);
    assert.ok(getLessonStart({ scheduled_start: futureIso })?.isValid);
    assert.ok(getLessonStart({ lesson_date: futureIso })?.isValid);
  });

  it('returns null for missing or invalid dates', () => {
    assert.equal(getLessonStart({}), null);
    assert.equal(getLessonStart({ scheduledStart: 'garbage' }), null);
  });
});
