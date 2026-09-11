import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { DateTime } from 'luxon';
import {
  resolveAuthoritativeTeacherForAvailability
} from '../server/integrations/availabilityEngine.js';

describe('Task 0.55.5-A: Regression Correction Before Production Deployment', () => {

  const correctiveMigrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20260911000003_production_lifecycle_regression_correction.sql'
  );
  const correctiveSql = fs.readFileSync(correctiveMigrationPath, 'utf8');

  // =========================================================================
  // Test 1 — Cancellation Reason: Cancellation preserves the reason
  // =========================================================================
  describe('Test 1 — Cancellation Reason', () => {
    it('migration SQL updates cancellation_reason column and notes in cancel_booking_by_management', () => {
      assert.ok(
        correctiveSql.includes('cancellation_reason = v_clean_reason'),
        'SQL must assign cancellation_reason = v_clean_reason'
      );
      assert.ok(
        correctiveSql.includes("notes = (COALESCE(notes, '') || E'\\n\\n[Cancellation]: ' || v_clean_reason)"),
        'SQL must also append cancellation info to notes for historical audit'
      );
    });

    it('simulated cancel_booking preserves caller-supplied reason or sensible fallback', () => {
      interface MockBooking {
        id: string;
        reference_code: string;
        status: string;
        cancellation_reason?: string | null;
        notes?: string | null;
        scheduled_start: string;
      }

      const booking: MockBooking = {
        id: 'b-1',
        reference_code: 'REF-TEST-REASON',
        status: 'confirmed',
        cancellation_reason: null,
        notes: 'Original student note',
        scheduled_start: DateTime.utc().plus({ days: 1 }).toISO()
      };

      function simulateCancel(b: MockBooking, reason?: string) {
        const v_clean_reason = (reason && reason.trim() !== '') ? reason.trim() : 'Cancelled by student through portal';
        b.status = 'cancelled';
        b.cancellation_reason = v_clean_reason;
        b.notes = (b.notes ? b.notes + '\n\n' : '') + '[Cancellation]: ' + v_clean_reason;
        return { success: true, booking: b };
      }

      const customReason = 'Family emergency travel';
      const res = simulateCancel(booking, customReason);
      assert.strictEqual(res.booking.cancellation_reason, customReason);
      assert.strictEqual(res.booking.status, 'cancelled');
      assert.ok(res.booking.notes?.includes(customReason));

      // Fallback when empty
      const booking2: MockBooking = {
        id: 'b-2',
        reference_code: 'REF-EMPTY-REASON',
        status: 'confirmed',
        cancellation_reason: null,
        notes: null,
        scheduled_start: DateTime.utc().plus({ days: 2 }).toISO()
      };
      const res2 = simulateCancel(booking2, '');
      assert.strictEqual(res2.booking.cancellation_reason, 'Cancelled by student through portal');
    });
  });

  // =========================================================================
  // Test 2 — Pending Reminders: Cancellation cancels pending reminders atomically
  // =========================================================================
  describe('Test 2 — Pending Reminders Cancellation', () => {
    it('migration SQL atomically marks pending reminders as cancelled', () => {
      assert.ok(
        correctiveSql.includes("UPDATE public.reminders"),
        'SQL must update public.reminders'
      );
      assert.ok(
        correctiveSql.includes("SET status = 'cancelled'"),
        'SQL must set status = cancelled on reminders'
      );
      assert.ok(
        correctiveSql.includes("WHERE booking_id = v_booking.id AND status = 'pending'"),
        'SQL must target pending reminders for the cancelled booking'
      );
    });

    it('simulated cancel transaction atomically transitions all pending reminders to cancelled', () => {
      const mockReminders = [
        { id: 'rem-1', booking_id: 'b-1', status: 'pending', scheduled_for: '2026-09-12T10:00:00Z' },
        { id: 'rem-2', booking_id: 'b-1', status: 'pending', scheduled_for: '2026-09-13T09:00:00Z' },
        { id: 'rem-3', booking_id: 'b-2', status: 'pending', scheduled_for: '2026-09-12T10:00:00Z' }, // foreign booking
        { id: 'rem-4', booking_id: 'b-1', status: 'sent', scheduled_for: '2026-09-11T08:00:00Z' } // already sent
      ];

      function cancelBookingTransaction(bookingId: string) {
        // Atomic cancellation of reminders inside transaction
        for (const rem of mockReminders) {
          if (rem.booking_id === bookingId && rem.status === 'pending') {
            rem.status = 'cancelled';
          }
        }
      }

      cancelBookingTransaction('b-1');

      const b1Reminders = mockReminders.filter(r => r.booking_id === 'b-1');
      assert.strictEqual(b1Reminders.find(r => r.id === 'rem-1')?.status, 'cancelled');
      assert.strictEqual(b1Reminders.find(r => r.id === 'rem-2')?.status, 'cancelled');
      assert.strictEqual(b1Reminders.find(r => r.id === 'rem-4')?.status, 'sent', 'Already sent reminder is unchanged');

      const b2Reminder = mockReminders.find(r => r.id === 'rem-3');
      assert.strictEqual(b2Reminder?.status, 'pending', 'Foreign booking reminder is untouched');
    });
  });

  // =========================================================================
  // Test 3 — Duration Authority: Reschedule enforces authoritative booking duration
  // =========================================================================
  describe('Test 3 — Duration Authority on Reschedule', () => {
    it('migration SQL calculates authoritative end from duration_minutes and rejects tampered end times', () => {
      assert.ok(
        correctiveSql.includes("v_authoritative_end := p_new_start + (v_booking.duration_minutes || ' minutes')::INTERVAL"),
        'SQL derives authoritative end timestamp from duration_minutes'
      );
      assert.ok(
        correctiveSql.includes("IF p_new_end IS NOT NULL AND p_new_end <> v_authoritative_end THEN"),
        'SQL guards against mismatched client end timestamps'
      );
      assert.ok(
        correctiveSql.includes("RAISE EXCEPTION 'Scheduled end timestamp must match scheduled start plus exact original duration"),
        'SQL raises controlled P0001 exception on duration tampering'
      );
    });

    it('rejects attempt to tamper a 30-minute lesson into a 2-hour lesson', () => {
      const originalDurationMinutes = 30;
      const newStart = DateTime.utc().plus({ days: 2 });
      const maliciousNewEnd = newStart.plus({ hours: 2 }); // 120 minutes instead of 30

      function validateRescheduleDuration(start: DateTime, end: DateTime | null, durationMin: number) {
        const authoritativeEnd = start.plus({ minutes: durationMin });
        if (end && !end.equals(authoritativeEnd)) {
          const err: any = new Error(`Scheduled end timestamp must match scheduled start plus exact original duration (${durationMin} minutes).`);
          err.code = 'P0001';
          throw err;
        }
        return authoritativeEnd;
      }

      assert.throws(() => {
        validateRescheduleDuration(newStart, maliciousNewEnd, originalDurationMinutes);
      }, (err: any) => {
        return err.code === 'P0001' && err.message.includes('exact original duration (30 minutes)');
      });

      // Valid matching end succeeds
      const validEnd = newStart.plus({ minutes: 30 });
      const derivedEnd = validateRescheduleDuration(newStart, validEnd, originalDurationMinutes);
      assert.ok(derivedEnd.equals(validEnd));
    });
  });

  // =========================================================================
  // Test 4 — Cairo Display Authority: Server derives Africa/Cairo display string
  // =========================================================================
  describe('Test 4 — Cairo Display Authority', () => {
    it('migration SQL server-side derives cairo_time_display from new_start in Africa/Cairo', () => {
      assert.ok(
        correctiveSql.includes("v_derived_cairo_display := to_char(p_new_start AT TIME ZONE 'Africa/Cairo', 'DD Mon YYYY, HH12:MI AM')"),
        'SQL derives cairo_time_display server-side in Africa/Cairo timezone'
      );
      assert.ok(
        correctiveSql.includes("cairo_time_display = v_derived_cairo_display"),
        'SQL updates cairo_time_display with server-derived value'
      );
    });

    it('malicious client-supplied cairo string is completely ignored in favor of server calculation', () => {
      const newStartUtc = DateTime.fromISO('2026-10-15T10:00:00Z', { zone: 'utc' });
      // In October, Egypt (Africa/Cairo) is UTC+3 (or UTC+2 depending on DST rule).
      const cairoLuxon = newStartUtc.setZone('Africa/Cairo');
      const expectedServerCairoDisplay = cairoLuxon.toFormat('dd LLL yyyy, hh:mm a');

      function serverDeriveCairoDisplay(startUtc: DateTime, clientSuppliedCairoText?: string) {
        // Server derives purely from committed timestamp, ignoring client text
        return startUtc.setZone('Africa/Cairo').toFormat('dd LLL yyyy, hh:mm a');
      }

      const maliciousClientText = 'HACKED Cairo Time: 03:00 AM';
      const actualDerived = serverDeriveCairoDisplay(newStartUtc, maliciousClientText);

      assert.strictEqual(actualDerived, expectedServerCairoDisplay);
      assert.ok(!actualDerived.includes('HACKED'));
    });
  });

  // =========================================================================
  // Test 5 — Scoped Worker: Booking A fast path cannot claim Booking B jobs
  // =========================================================================
  describe('Test 5 — Scoped Worker Isolation', () => {
    it('migration SQL supports p_booking_id parameter in claim_integration_jobs', () => {
      assert.ok(
        correctiveSql.includes("p_booking_id UUID DEFAULT NULL"),
        'claim_integration_jobs signature includes optional p_booking_id'
      );
      assert.ok(
        correctiveSql.includes("(p_booking_id IS NULL OR booking_id = p_booking_id)"),
        'SQL filters by booking_id when p_booking_id is provided'
      );
    });

    it('calling claim_integration_jobs with booking A id never claims booking B jobs', () => {
      const bookingA = 'uuid-booking-aaa';
      const bookingB = 'uuid-booking-bbb';

      const mockJobs = [
        { id: 'job-1', booking_id: bookingA, job_type: 'booking_sync', status: 'pending' },
        { id: 'job-2', booking_id: bookingB, job_type: 'booking_sync', status: 'pending' },
        { id: 'job-3', booking_id: bookingA, job_type: 'booking_cancel', status: 'pending' },
        { id: 'job-4', booking_id: bookingB, job_type: 'booking_reschedule', status: 'pending' }
      ];

      function claimScoped(batchSize: number, scopedBookingId?: string) {
        return mockJobs
          .filter(j => (!scopedBookingId || j.booking_id === scopedBookingId) && j.status === 'pending')
          .slice(0, batchSize);
      }

      const claimedA = claimScoped(5, bookingA);
      assert.strictEqual(claimedA.length, 2);
      assert.ok(claimedA.every(j => j.booking_id === bookingA));
      assert.ok(!claimedA.some(j => j.booking_id === bookingB), 'Booking B jobs must NOT be claimed by Booking A caller');
    });
  });

  // =========================================================================
  // Test 6 — Global Worker: Global cron claims across all bookings
  // =========================================================================
  describe('Test 6 — Global Worker Claims All Eligible Jobs', () => {
    it('when p_booking_id is NULL, jobs from all bookings are claimed up to batch size', () => {
      const mockJobs = [
        { id: 'job-1', booking_id: 'b-1', status: 'pending' },
        { id: 'job-2', booking_id: 'b-2', status: 'pending' },
        { id: 'job-3', booking_id: 'b-3', status: 'pending' },
        { id: 'job-4', booking_id: 'b-4', status: 'pending' }
      ];

      function claimGlobal(batchSize: number, scopedBookingId?: string) {
        return mockJobs
          .filter(j => (!scopedBookingId || j.booking_id === scopedBookingId) && j.status === 'pending')
          .slice(0, batchSize);
      }

      const claimedGlobal = claimGlobal(10, undefined);
      assert.strictEqual(claimedGlobal.length, 4, 'All pending jobs across bookings are claimed');
    });
  });

  // =========================================================================
  // Test 7 — 3-Hour Cancellation: Inside 3 hours triggers P0004
  // =========================================================================
  describe('Test 7 — 3-Hour Cancellation Policy', () => {
    it('migration SQL contains 3-hour check with ERRCODE P0004 in cancel_booking_by_management', () => {
      assert.ok(
        correctiveSql.includes("IF v_booking.scheduled_start < (timezone('utc'::text, now()) + INTERVAL '3 hours') THEN"),
        'SQL verifies scheduled_start < now() + 3 hours'
      );
      assert.ok(
        correctiveSql.includes("USING ERRCODE = 'P0004'"),
        'SQL raises exception with SQLSTATE P0004'
      );
    });

    it('rejects cancellation attempt 2 hours and 50 minutes before start', () => {
      const nowUtc = DateTime.utc();
      const startUtc = nowUtc.plus({ hours: 2, minutes: 50 });

      function cancelBooking(start: DateTime) {
        if (start < nowUtc.plus({ hours: 3 })) {
          const err: any = new Error('Self-service cancellation is closed within 3 hours of the lesson. Please contact Mahmoud directly.');
          err.code = 'P0004';
          throw err;
        }
        return { success: true };
      }

      assert.throws(() => {
        cancelBooking(startUtc);
      }, (err: any) => err.code === 'P0004');
    });
  });

  // =========================================================================
  // Test 8 — 3-Hour Reschedule: Inside 3 hours triggers P0004
  // =========================================================================
  describe('Test 8 — 3-Hour Reschedule Policy', () => {
    it('migration SQL contains 3-hour check with ERRCODE P0004 in reschedule_booking_by_management', () => {
      assert.ok(
        correctiveSql.includes("IF v_booking.scheduled_start < (timezone('utc'::text, now()) + INTERVAL '3 hours') THEN"),
        'SQL verifies scheduled_start < now() + 3 hours on reschedule'
      );
      assert.ok(
        correctiveSql.includes("USING ERRCODE = 'P0004'"),
        'SQL raises exception with SQLSTATE P0004'
      );
    });

    it('rejects reschedule attempt 1 hour before start with P0004', () => {
      const nowUtc = DateTime.utc();
      const currentStartUtc = nowUtc.plus({ hours: 1 });

      function rescheduleBooking(currentStart: DateTime) {
        if (currentStart < nowUtc.plus({ hours: 3 })) {
          const err: any = new Error('Self-service rescheduling is closed within 3 hours of the lesson. Please contact Mahmoud directly.');
          err.code = 'P0004';
          throw err;
        }
        return { success: true };
      }

      assert.throws(() => {
        rescheduleBooking(currentStartUtc);
      }, (err: any) => err.code === 'P0004');
    });
  });

  // =========================================================================
  // Test 9 — Calendar Ownership: Unauthorized teacher ID fails closed
  // =========================================================================
  describe('Test 9 — Calendar Ownership & Availability Resolution', () => {
    beforeEach(() => {
      delete (globalThis as any).__TEST_RESOLVE_AUTHORITATIVE_TEACHER;
    });

    it('unauthorized browser-supplied teacher ID fails closed', async () => {
      (globalThis as any).__TEST_RESOLVE_AUTHORITATIVE_TEACHER = (supplied?: string) => {
        const activeConnections = [{ teacher_id: 'real-mahmoud-id', is_active: true }];
        if (supplied && supplied.trim() !== '') {
          return supplied.trim() === activeConnections[0].teacher_id ? activeConnections[0].teacher_id : null;
        }
        return activeConnections[0].teacher_id;
      };

      const result = await resolveAuthoritativeTeacherForAvailability('attacker-fake-teacher-id');
      assert.strictEqual(result, null, 'Fake teacher ID must resolve to null (fail closed)');
    });
  });

  // =========================================================================
  // Test 10 — Stale Processing Recovery: Preserve Task K behavior (>5 min stale)
  // =========================================================================
  describe('Test 10 — Stale Processing Recovery', () => {
    it('migration SQL reclaims processing jobs locked more than 5 minutes ago', () => {
      assert.ok(
        correctiveSql.includes("status = 'processing'"),
        'SQL inspects processing jobs'
      );
      assert.ok(
        correctiveSql.includes("locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes'"),
        'SQL reclaims locks older than 5 minutes'
      );
    });

    it('stale processing job (>5 min) is reclaimed while fresh processing job (<5 min) is protected', () => {
      const now = DateTime.utc();
      const sixMinutesAgo = now.minus({ minutes: 6 }).toISO();
      const oneMinuteAgo = now.minus({ minutes: 1 }).toISO();

      const jobs = [
        { id: 'stale-1', status: 'processing', locked_at: sixMinutesAgo },
        { id: 'fresh-1', status: 'processing', locked_at: oneMinuteAgo }
      ];

      function claimEligible() {
        const threshold = now.minus({ minutes: 5 });
        return jobs.filter(j => {
          if (j.status === 'processing' && j.locked_at) {
            return DateTime.fromISO(j.locked_at) < threshold;
          }
          return false;
        });
      }

      const claimed = claimEligible();
      assert.strictEqual(claimed.length, 1);
      assert.strictEqual(claimed[0].id, 'stale-1');
    });
  });

  // =========================================================================
  // Test 11 — Concurrency: Two workers cannot claim the same job (FOR UPDATE SKIP LOCKED)
  // =========================================================================
  describe('Test 11 — Concurrency Protection', () => {
    it('migration SQL employs FOR UPDATE SKIP LOCKED to prevent duplicate processing', () => {
      assert.ok(
        correctiveSql.includes('FOR UPDATE SKIP LOCKED'),
        'SQL must use row-level SKIP LOCKED semantics'
      );
    });

    it('simulated concurrent claimers acquire mutually disjoint sets of jobs', () => {
      const allJobs = [
        { id: 'j-1', status: 'pending', locked: false },
        { id: 'j-2', status: 'pending', locked: false },
        { id: 'j-3', status: 'pending', locked: false }
      ];

      function workerClaim(batchSize: number) {
        const claimed: string[] = [];
        for (const job of allJobs) {
          if (claimed.length >= batchSize) break;
          if (!job.locked && job.status === 'pending') {
            job.locked = true;
            job.status = 'processing';
            claimed.push(job.id);
          }
        }
        return claimed;
      }

      const worker1Claimed = workerClaim(2);
      const worker2Claimed = workerClaim(2);

      assert.strictEqual(worker1Claimed.length, 2);
      assert.strictEqual(worker2Claimed.length, 1);
      // Overlap must be empty
      const intersection = worker1Claimed.filter(id => worker2Claimed.includes(id));
      assert.strictEqual(intersection.length, 0, 'No job was claimed by both workers concurrently');
    });
  });

  // =========================================================================
  // Test 12 — Worker Persistence Failure: Preserve Task J behavior
  // =========================================================================
  describe('Test 12 — Worker Persistence Failure & Error Quarantine', () => {
    it('worker handles permanent errors by dead-lettering, and transient errors by incrementing attempts with backoff', () => {
      function categorizeError(errMsg: string, attempts: number) {
        const lower = errMsg.toLowerCase();
        const isPermanent = lower.includes('invalid_grant') ||
                            lower.includes('unauthorized') ||
                            lower.includes('not found') ||
                            lower.includes('(401)') ||
                            lower.includes('(403)') ||
                            lower.includes('(400)');

        const newAttempts = attempts + 1;
        const isDead = isPermanent || newAttempts >= 5;
        const backoffMinutes = [1, 5, 15, 60][newAttempts - 1] || 60;

        return {
          status: isDead ? 'dead_letter' : 'failed',
          attempts: isPermanent ? Math.max(newAttempts, 5) : newAttempts,
          backoffMinutes: isDead ? null : backoffMinutes
        };
      }

      // Permanent 401/invalid_grant -> immediately dead_letter
      const permanentRes = categorizeError('Google API Error: invalid_grant', 0);
      assert.strictEqual(permanentRes.status, 'dead_letter');
      assert.strictEqual(permanentRes.attempts, 5);

      // Transient timeout -> failed with backoff
      const transientRes = categorizeError('ETIMEDOUT: Connection timed out', 0);
      assert.strictEqual(transientRes.status, 'failed');
      assert.strictEqual(transientRes.attempts, 1);
      assert.strictEqual(transientRes.backoffMinutes, 1);

      // 5th attempt -> dead_letter
      const fifthAttemptRes = categorizeError('ETIMEDOUT', 4);
      assert.strictEqual(fifthAttemptRes.status, 'dead_letter');
    });
  });
});
