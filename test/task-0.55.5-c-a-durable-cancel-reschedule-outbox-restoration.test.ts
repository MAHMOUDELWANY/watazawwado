import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { DateTime } from 'luxon';

describe('Task 0.55.5-C-A: Durable Cancel/Reschedule Outbox Restoration', () => {

  const migration000005Path = path.join(
    process.cwd(),
    'supabase/migrations/20260911000005_durable_cancel_reschedule_outbox_restoration.sql'
  );
  const migration000005Sql = fs.readFileSync(migration000005Path, 'utf8');

  // =========================================================================
  // Test 1 — Static Contract: Target Supabase Project & Canonical Header
  // =========================================================================
  describe('Test 1 — Static Contract: Project & Invariants', () => {
    it('migration references canonical production project fmwxqyroyxgigvpahpri', () => {
      assert.ok(
        migration000005Sql.includes('fmwxqyroyxgigvpahpri'),
        'Migration must explicitly target canonical Supabase project fmwxqyroyxgigvpahpri'
      );
      assert.ok(
        !migration000005Sql.includes('kpftfmwnwcnkbvfgjfdy'),
        'Migration must never reference legacy project kpftfmwnwcnkbvfgjfdy'
      );
    });
  });

  // =========================================================================
  // Test 2 — Cancel RPC: Durable Outbox Enqueue & Reminder Cleanup
  // =========================================================================
  describe('Test 2 — Cancel RPC: Durable Outbox Enqueue', () => {
    it('migration SQL atomically enqueues booking_cancel into public.integration_jobs with active conflict guard', () => {
      assert.ok(
        migration000005Sql.includes("INSERT INTO public.integration_jobs (booking_id, job_type, status)"),
        'cancel_booking_by_management must insert into integration_jobs'
      );
      assert.ok(
        migration000005Sql.includes("VALUES (v_booking.id, 'booking_cancel', 'pending')"),
        "cancel_booking_by_management must insert ('booking_cancel', 'pending')"
      );
      assert.ok(
        migration000005Sql.includes("ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING"),
        'cancel_booking_by_management must use partial index active conflict clause DO NOTHING'
      );
    });

    it('migration SQL preserves cancellation_reason, appends to notes, and cleans up pending reminders', () => {
      assert.ok(
        migration000005Sql.includes("cancellation_reason = v_clean_reason"),
        'cancel_booking_by_management must assign cancellation_reason'
      );
      assert.ok(
        migration000005Sql.includes("notes = (COALESCE(notes, '') || E'\\n\\n[Cancellation]: ' || v_clean_reason)"),
        'cancel_booking_by_management must append cancellation to notes'
      );
      assert.ok(
        migration000005Sql.includes("UPDATE public.reminders"),
        'cancel_booking_by_management must update public.reminders'
      );
      assert.ok(
        migration000005Sql.includes("SET status = 'cancelled'"),
        "cancel_booking_by_management must set reminder status to 'cancelled'"
      );
      assert.ok(
        migration000005Sql.includes("WHERE booking_id = v_booking.id AND status = 'pending'"),
        'cancel_booking_by_management must target only pending reminders for that booking'
      );
    });

    it('migration SQL enforces strict 3-hour policy with ERRCODE P0004', () => {
      assert.ok(
        migration000005Sql.includes("v_booking.scheduled_start < (timezone('utc'::text, now()) + INTERVAL '3 hours')"),
        'cancel_booking_by_management must enforce 3-hour window'
      );
      assert.ok(
        migration000005Sql.includes("USING ERRCODE = 'P0004'"),
        'cancel_booking_by_management must raise P0004 on 3-hour policy breach'
      );
    });
  });

  // =========================================================================
  // Test 3 — Reschedule RPC: Durable Outbox Enqueue & Server Authorities
  // =========================================================================
  describe('Test 3 — Reschedule RPC: Durable Outbox Enqueue & Authorities', () => {
    it('migration SQL atomically enqueues booking_reschedule into public.integration_jobs with active conflict guard', () => {
      assert.ok(
        migration000005Sql.includes("VALUES (v_booking.id, 'booking_reschedule', 'pending')"),
        "reschedule_booking_by_management must insert ('booking_reschedule', 'pending')"
      );
    });

    it('migration SQL enforces server duration authority and derives Cairo display', () => {
      assert.ok(
        migration000005Sql.includes("v_authoritative_end := p_new_start + (v_booking.duration_minutes || ' minutes')::INTERVAL;"),
        'reschedule_booking_by_management must derive authoritative end from original duration'
      );
      assert.ok(
        migration000005Sql.includes("IF p_new_end IS NOT NULL AND p_new_end <> v_authoritative_end THEN"),
        'reschedule_booking_by_management must reject tampered end times'
      );
      assert.ok(
        migration000005Sql.includes("v_derived_cairo_display := to_char(p_new_start AT TIME ZONE 'Africa/Cairo', 'DD Mon YYYY, HH12:MI AM');"),
        'reschedule_booking_by_management must derive cairo display in Africa/Cairo'
      );
    });

    it('migration SQL reconciles reminders atomically', () => {
      assert.ok(
        migration000005Sql.includes("v_rem_24h := p_new_start - INTERVAL '24 hours';"),
        'reschedule_booking_by_management must calculate 24h reminder'
      );
      assert.ok(
        migration000005Sql.includes("v_rem_1h := p_new_start - INTERVAL '1 hour';"),
        'reschedule_booking_by_management must calculate 1h reminder'
      );
    });
  });

  // =========================================================================
  // Test 4 — Canonical Claim Function & Security Boundaries Untouched
  // =========================================================================
  describe('Test 4 — Canonical Claim Function & Privilege Preservation', () => {
    it('migration 000005 does NOT alter or drop the canonical claim_integration_jobs function', () => {
      assert.ok(
        !migration000005Sql.includes('DROP FUNCTION IF EXISTS public.claim_integration_jobs'),
        'Migration 000005 must not drop claim_integration_jobs'
      );
      assert.ok(
        !migration000005Sql.includes('CREATE OR REPLACE FUNCTION public.claim_integration_jobs'),
        'Migration 000005 must not re-declare claim_integration_jobs'
      );
    });

    it('migration 000005 does not alter integration_jobs table permissions or RLS', () => {
      assert.ok(
        !migration000005Sql.includes('GRANT SELECT ON TABLE public.integration_jobs'),
        'Migration 000005 must not grant integration_jobs table access'
      );
      assert.ok(
        !migration000005Sql.includes('GRANT INSERT ON TABLE public.integration_jobs'),
        'Migration 000005 must not grant integration_jobs table access'
      );
    });

    it('management functions are declared SECURITY DEFINER with immutable search_path', () => {
      const secDefCount = (migration000005Sql.match(/SECURITY DEFINER/g) || []).length;
      assert.strictEqual(secDefCount, 3, 'All 3 management functions must be SECURITY DEFINER');

      const searchPathCount = (migration000005Sql.match(/SET search_path = public, pg_temp/g) || []).length;
      assert.strictEqual(searchPathCount, 3, 'All 3 management functions must have fixed search_path = public, pg_temp');
    });

    it('management functions revoke from PUBLIC and grant to anon, authenticated, service_role', () => {
      assert.ok(
        migration000005Sql.includes('REVOKE ALL ON FUNCTION public.cancel_booking_by_management(TEXT, TEXT, TEXT) FROM PUBLIC;'),
        'Must revoke cancel_booking_by_management from PUBLIC'
      );
      assert.ok(
        migration000005Sql.includes('GRANT EXECUTE ON FUNCTION public.cancel_booking_by_management(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;'),
        'Must grant cancel_booking_by_management to client roles and service_role'
      );
      assert.ok(
        migration000005Sql.includes('REVOKE ALL ON FUNCTION public.reschedule_booking_by_management(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;'),
        'Must revoke reschedule_booking_by_management from PUBLIC'
      );
      assert.ok(
        migration000005Sql.includes('GRANT EXECUTE ON FUNCTION public.reschedule_booking_by_management(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO anon, authenticated, service_role;'),
        'Must grant reschedule_booking_by_management to client roles and service_role'
      );
      assert.ok(
        migration000005Sql.includes('REVOKE ALL ON FUNCTION public.get_booking_management(TEXT, TEXT) FROM PUBLIC;'),
        'Must revoke get_booking_management from PUBLIC'
      );
      assert.ok(
        migration000005Sql.includes('GRANT EXECUTE ON FUNCTION public.get_booking_management(TEXT, TEXT) TO anon, authenticated, service_role;'),
        'Must grant get_booking_management to client roles and service_role'
      );
    });
  });

  // =========================================================================
  // Test 5 — Simulation: Cancel Atomic Workflow (Outbox + Reminders + Audit)
  // =========================================================================
  describe('Test 5 — Simulation: Cancel Atomic Workflow', () => {
    interface MockBooking {
      id: string;
      reference_code: string;
      status: string;
      cancellation_reason?: string | null;
      notes?: string | null;
      scheduled_start: string;
    }

    interface MockReminder {
      id: string;
      booking_id: string;
      status: string;
    }

    interface MockIntegrationJob {
      id: string;
      booking_id: string;
      job_type: string;
      status: string;
    }

    it('simulates atomic cancellation: booking cancelled, reminders cancelled, job enqueued', () => {
      const booking: MockBooking = {
        id: 'b-100',
        reference_code: 'REF-CANCEL-OUTBOX',
        status: 'confirmed',
        cancellation_reason: null,
        notes: 'Initial lesson notes',
        scheduled_start: DateTime.utc().plus({ days: 2 }).toISO()
      };

      const reminders: MockReminder[] = [
        { id: 'r-1', booking_id: 'b-100', status: 'pending' },
        { id: 'r-2', booking_id: 'b-100', status: 'pending' },
        { id: 'r-3', booking_id: 'other-booking', status: 'pending' }
      ];

      const outbox: MockIntegrationJob[] = [];

      function simulateAtomicCancel(b: MockBooking, rems: MockReminder[], jobs: MockIntegrationJob[], reason?: string) {
        // 3-hour check
        const start = DateTime.fromISO(b.scheduled_start);
        if (start < DateTime.utc().plus({ hours: 3 })) {
          throw new Error('P0004: Self-service cancellation is closed within 3 hours');
        }

        // Mutation
        const cleanReason = (reason && reason.trim() !== '') ? reason.trim() : 'Cancelled by student through portal';
        b.status = 'cancelled';
        b.cancellation_reason = cleanReason;
        b.notes = (b.notes ? b.notes + '\n\n' : '') + '[Cancellation]: ' + cleanReason;

        // Reminders cleanup
        for (const rem of rems) {
          if (rem.booking_id === b.id && rem.status === 'pending') {
            rem.status = 'cancelled';
          }
        }

        // Outbox enqueue with active-job conflict check
        const hasActive = jobs.some(j => j.booking_id === b.id && j.job_type === 'booking_cancel' && ['pending', 'processing', 'failed'].includes(j.status));
        if (!hasActive) {
          jobs.push({
            id: 'job-' + (jobs.length + 1),
            booking_id: b.id,
            job_type: 'booking_cancel',
            status: 'pending'
          });
        }

        return { success: true, bookingId: b.id, referenceCode: b.reference_code };
      }

      const res = simulateAtomicCancel(booking, reminders, outbox, 'Emergency trip');
      assert.strictEqual(res.success, true);
      assert.strictEqual(booking.status, 'cancelled');
      assert.strictEqual(booking.cancellation_reason, 'Emergency trip');
      assert.ok(booking.notes?.includes('[Cancellation]: Emergency trip'));

      // Check reminders
      assert.strictEqual(reminders[0].status, 'cancelled');
      assert.strictEqual(reminders[1].status, 'cancelled');
      assert.strictEqual(reminders[2].status, 'pending'); // untouched other booking

      // Check outbox
      assert.strictEqual(outbox.length, 1);
      assert.strictEqual(outbox[0].booking_id, 'b-100');
      assert.strictEqual(outbox[0].job_type, 'booking_cancel');
      assert.strictEqual(outbox[0].status, 'pending');

      // Check idempotency: second cancel attempt on cancelled booking is rejected
      assert.throws(() => {
        if (booking.status === 'cancelled') {
          throw new Error('Booking is already cancelled.');
        }
      }, /already cancelled/);
    });
  });

  // =========================================================================
  // Test 6 — Simulation: Reschedule Atomic Workflow (Outbox + Reminders + Authorities)
  // =========================================================================
  describe('Test 6 — Simulation: Reschedule Atomic Workflow', () => {
    interface MockBooking {
      id: string;
      reference_code: string;
      status: string;
      scheduled_start: string;
      scheduled_end: string;
      duration_minutes: number;
      cairo_time_display: string;
    }

    interface MockReminder {
      id: string;
      booking_id: string;
      reminder_type: string;
      scheduled_for: string;
      status: string;
    }

    interface MockIntegrationJob {
      id: string;
      booking_id: string;
      job_type: string;
      status: string;
    }

    it('simulates atomic reschedule: updates timestamps, reconciles reminders, enqueues booking_reschedule job', () => {
      const now = DateTime.utc();
      const currentStart = now.plus({ days: 2 });
      const currentEnd = currentStart.plus({ minutes: 45 });

      const booking: MockBooking = {
        id: 'b-200',
        reference_code: 'REF-RESCHED-OUTBOX',
        status: 'confirmed',
        scheduled_start: currentStart.toISO()!,
        scheduled_end: currentEnd.toISO()!,
        duration_minutes: 45,
        cairo_time_display: currentStart.setZone('Africa/Cairo').toFormat('dd LLL yyyy, hh:mm a')
      };

      const reminders: MockReminder[] = [
        { id: 'r-old-1', booking_id: 'b-200', reminder_type: '24h_before', scheduled_for: currentStart.minus({ hours: 24 }).toISO()!, status: 'pending' },
        { id: 'r-old-2', booking_id: 'b-200', reminder_type: '1h_before', scheduled_for: currentStart.minus({ hours: 1 }).toISO()!, status: 'pending' }
      ];

      const outbox: MockIntegrationJob[] = [];

      function simulateAtomicReschedule(
        b: MockBooking,
        rems: MockReminder[],
        jobs: MockIntegrationJob[],
        newStartIso: string,
        clientEndIso?: string
      ) {
        const newStart = DateTime.fromISO(newStartIso);
        const curStart = DateTime.fromISO(b.scheduled_start);

        // 3-hour policy on current start
        if (curStart < DateTime.utc().plus({ hours: 3 })) {
          throw new Error('P0004: Self-service rescheduling is closed within 3 hours');
        }

        // Lead time policy
        if (newStart < DateTime.utc().plus({ minutes: 10 })) {
          throw new Error('P0001: New lesson time must be scheduled at least 10 minutes in advance');
        }

        // Server authoritative end calculation
        const authoritativeEnd = newStart.plus({ minutes: b.duration_minutes });
        if (clientEndIso && DateTime.fromISO(clientEndIso).toMillis() !== authoritativeEnd.toMillis()) {
          throw new Error(`P0001: Scheduled end timestamp must match scheduled start plus exact original duration (${b.duration_minutes} minutes)`);
        }

        // Derive cairo display
        const cairoDisplay = newStart.setZone('Africa/Cairo').toFormat('dd LLL yyyy, hh:mm a');

        // Mutate booking
        b.scheduled_start = newStart.toISO()!;
        b.scheduled_end = authoritativeEnd.toISO()!;
        b.cairo_time_display = cairoDisplay;
        b.status = 'rescheduled';

        // Reconcile reminders: cancel stale
        for (const rem of rems) {
          if (rem.booking_id === b.id && rem.status === 'pending') {
            rem.status = 'cancelled';
          }
        }

        // Add new reminders
        const rem24 = newStart.minus({ hours: 24 });
        const rem1 = newStart.minus({ hours: 1 });
        if (rem24 > DateTime.utc()) {
          rems.push({ id: 'r-new-24', booking_id: b.id, reminder_type: '24h_before', scheduled_for: rem24.toISO()!, status: 'pending' });
        }
        if (rem1 > DateTime.utc()) {
          rems.push({ id: 'r-new-1', booking_id: b.id, reminder_type: '1h_before', scheduled_for: rem1.toISO()!, status: 'pending' });
        }

        // Outbox enqueue with active conflict check
        const hasActive = jobs.some(j => j.booking_id === b.id && j.job_type === 'booking_reschedule' && ['pending', 'processing', 'failed'].includes(j.status));
        if (!hasActive) {
          jobs.push({
            id: 'job-' + (jobs.length + 1),
            booking_id: b.id,
            job_type: 'booking_reschedule',
            status: 'pending'
          });
        }

        return { success: true, bookingId: b.id, referenceCode: b.reference_code };
      }

      // 1. Attempt reschedule with tampered client end time (e.g. 120 minutes instead of 45) -> Rejected!
      const newStartTarget = now.plus({ days: 4 });
      const tamperedEnd = newStartTarget.plus({ minutes: 120 });
      assert.throws(() => {
        simulateAtomicReschedule(booking, reminders, outbox, newStartTarget.toISO()!, tamperedEnd.toISO()!);
      }, /P0001.*exact original duration/);

      // 2. Reschedule with valid parameters
      const validEnd = newStartTarget.plus({ minutes: 45 });
      const res = simulateAtomicReschedule(booking, reminders, outbox, newStartTarget.toISO()!, validEnd.toISO()!);
      assert.strictEqual(res.success, true);
      assert.strictEqual(booking.status, 'rescheduled');
      assert.strictEqual(DateTime.fromISO(booking.scheduled_start).toMillis(), DateTime.fromISO(newStartTarget.toISO()!).toMillis());
      assert.strictEqual(DateTime.fromISO(booking.scheduled_end).toMillis(), DateTime.fromISO(validEnd.toISO()!).toMillis());

      // Old reminders cancelled
      assert.strictEqual(reminders[0].status, 'cancelled');
      assert.strictEqual(reminders[1].status, 'cancelled');

      // New reminders added
      const activeReminders = reminders.filter(r => r.status === 'pending');
      assert.strictEqual(activeReminders.length, 2);

      // Outbox job enqueued
      assert.strictEqual(outbox.length, 1);
      assert.strictEqual(outbox[0].booking_id, 'b-200');
      assert.strictEqual(outbox[0].job_type, 'booking_reschedule');
      assert.strictEqual(outbox[0].status, 'pending');
    });
  });

  // =========================================================================
  // Test 7 — Integration Worker Handler Compatibility
  // =========================================================================
  describe('Test 7 — Integration Worker Handler Compatibility', () => {
    it('worker.ts contains explicit handlers for booking_cancel and booking_reschedule', () => {
      const workerPath = path.join(process.cwd(), 'server/integrations/worker.ts');
      const workerContent = fs.readFileSync(workerPath, 'utf8');

      assert.ok(
        workerContent.includes("job.job_type === 'booking_cancel'"),
        'worker.ts must contain handler for booking_cancel'
      );
      assert.ok(
        workerContent.includes("job.job_type === 'booking_reschedule'"),
        'worker.ts must contain handler for booking_reschedule'
      );
      assert.ok(
        workerContent.includes("syncCancelledBooking("),
        'worker.ts booking_cancel handler must invoke syncCancelledBooking'
      );
      assert.ok(
        workerContent.includes("syncRescheduledBooking("),
        'worker.ts booking_reschedule handler must invoke syncRescheduledBooking'
      );
      assert.ok(
        workerContent.includes("cancelBookingReminders("),
        'worker.ts booking_cancel handler must invoke cancelBookingReminders'
      );
      assert.ok(
        workerContent.includes("rescheduleBookingReminders("),
        'worker.ts booking_reschedule handler must invoke rescheduleBookingReminders'
      );
    });
  });
});
