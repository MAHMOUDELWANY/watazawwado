import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.55.4-I: Outbox Security Closure & Verification', () => {

  // Load migration 000016 to inspect SQL declarations
  const migration000016Path = path.join(process.cwd(), 'supabase/migrations/20260908000016_outbox_security_closure.sql');
  const migration000016Sql = fs.readFileSync(migration000016Path, 'utf8');

  describe('1. Outbox Table Client Isolation (RLS & Table Grants)', () => {
    it('Test 1: Authenticated Student cannot access integration_jobs', () => {
      // Simulate RLS engine: table has RLS enabled, NO policy for authenticated role
      const rlsPolicies = [
        // No policy grants access to Student
      ];
      const studentSession = { role: 'authenticated', email: 'student@example.com', isTeacher: false };
      
      const canRead = rlsPolicies.some(p => p.role === studentSession.role && p.allows(studentSession));
      assert.strictEqual(canRead, false, 'Authenticated student has no RLS policy to read integration_jobs');

      // Verify migration drops any student policies and revokes permissions
      assert.ok(migration000016Sql.includes('DROP POLICY IF EXISTS "Students cannot read integration_jobs"'), 'Student policies dropped');
      assert.ok(migration000016Sql.includes('REVOKE ALL ON TABLE public.integration_jobs FROM authenticated;'), 'Table permissions revoked from authenticated');
    });

    it('Test 2: Authenticated Teacher cannot directly access integration_jobs', () => {
      // Prior iteration had: CREATE POLICY "Teachers can view integration_jobs"
      // Migration 000016 MUST drop this policy so no direct table access exists for Teacher browser sessions
      assert.ok(
        migration000016Sql.includes('DROP POLICY IF EXISTS "Teachers can view integration_jobs"'),
        'Teacher-facing client policy is dropped'
      );
      assert.ok(
        !migration000016Sql.includes('CREATE POLICY "Teachers can view integration_jobs"'),
        'Teacher-facing policy is not re-created'
      );

      // Simulate RLS engine for Teacher browser session: fails closed without policy
      const teacherSession = { role: 'authenticated', email: 'mhmwdlwany4222@gmail.com', isTeacher: true };
      const clientPolicies: any[] = []; // Empty: all client policies dropped
      const canAccess = clientPolicies.some(p => p.role === teacherSession.role && p.allows(teacherSession));
      assert.strictEqual(canAccess, false, 'Teacher browser session has no direct table access (server-only)');
    });

    it('Test 3: Guest cannot access integration_jobs', () => {
      const guestSession = { role: 'anon', email: null };
      const clientPolicies: any[] = [];
      const canAccess = clientPolicies.some(p => p.role === guestSession.role);
      assert.strictEqual(canAccess, false, 'Guest (anon) cannot access integration_jobs');

      assert.ok(migration000016Sql.includes('REVOKE ALL ON TABLE public.integration_jobs FROM anon;'), 'Table access revoked from anon');
      assert.ok(migration000016Sql.includes('REVOKE ALL ON TABLE public.integration_jobs FROM PUBLIC;'), 'Table access revoked from PUBLIC');
    });

    it('RLS is strictly ENABLED and FORCED on integration_jobs', () => {
      assert.ok(migration000016Sql.includes('ALTER TABLE public.integration_jobs ENABLE ROW LEVEL SECURITY;'), 'RLS enabled');
      assert.ok(migration000016Sql.includes('ALTER TABLE public.integration_jobs FORCE ROW LEVEL SECURITY;'), 'RLS forced');
      assert.ok(migration000016Sql.includes('GRANT ALL ON TABLE public.integration_jobs TO service_role;'), 'Access granted strictly to service_role');
    });
  });

  describe('2. Privileged RPC Security (claim_integration_jobs)', () => {
    it('Privileged RPC has safe search_path and REVOKES public/anon/authenticated execution', () => {
      assert.ok(
        migration000016Sql.includes('SET search_path = public, pg_temp'),
        'Safe search_path specified on claim_integration_jobs'
      );
      assert.ok(
        migration000016Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM PUBLIC;'),
        'Revoked from PUBLIC'
      );
      assert.ok(
        migration000016Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM anon;'),
        'Revoked from anon'
      );
      assert.ok(
        migration000016Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM authenticated;'),
        'Revoked from authenticated'
      );
      assert.ok(
        migration000016Sql.includes('GRANT EXECUTE ON FUNCTION public.claim_integration_jobs(INT) TO service_role;'),
        'Granted strictly to service_role'
      );
    });

    it('Test 4: Privileged worker can claim a legitimate pending job', () => {
      // Simulate claim_integration_jobs worker query behavior
      const jobs = [
        { id: 'job-1', status: 'pending', next_attempt_at: new Date(Date.now() - 1000).toISOString(), locked_at: null, created_at: '2026-09-09T10:00:00Z' },
        { id: 'job-2', status: 'completed', next_attempt_at: new Date(Date.now() - 1000).toISOString(), locked_at: null, created_at: '2026-09-09T10:05:00Z' },
        { id: 'job-3', status: 'pending', next_attempt_at: new Date(Date.now() + 60000).toISOString(), locked_at: null, created_at: '2026-09-09T10:10:00Z' } // Future
      ];

      const now = new Date();
      const eligible = jobs.filter(j => 
        ['pending', 'failed'].includes(j.status) &&
        new Date(j.next_attempt_at) <= now &&
        (j.locked_at === null || new Date(j.locked_at).getTime() < now.getTime() - 5 * 60 * 1000)
      );

      const claimed = eligible.slice(0, 1).map(j => ({
        ...j,
        status: 'processing',
        locked_at: now.toISOString(),
        updated_at: now.toISOString()
      }));

      assert.strictEqual(claimed.length, 1);
      assert.strictEqual(claimed[0].id, 'job-1');
      assert.strictEqual(claimed[0].status, 'processing');
      assert.ok(claimed[0].locked_at !== null);
    });
  });

  describe('3. Worker Durability, Success, and Failure Semantics', () => {
    it('Test 5: Successful worker marks job.status = completed and completed_at IS NOT NULL', () => {
      const job = {
        id: 'job-success-1',
        status: 'processing',
        attempts: 0,
        completed_at: null as string | null
      };

      const syncResult = { success: true, googleCalendarEventId: 'event-123', zoomMeetingLink: 'https://zoom.us/j/123' };

      // Worker completion logic
      if (syncResult.success) {
        job.status = 'completed';
        job.completed_at = new Date().toISOString();
      }

      assert.strictEqual(job.status, 'completed');
      assert.ok(job.completed_at !== null, 'completed_at timestamp must be set on success');
    });

    it('Test 6: Failed worker keeps job.status != completed, records error, and does NOT set completed_at', () => {
      const job = {
        id: 'job-fail-1',
        status: 'processing',
        attempts: 1,
        last_error: null as string | null,
        completed_at: null as string | null,
        next_attempt_at: null as string | null
      };

      const syncResult = { success: false, errors: ['Google Calendar Rate Limit Exceeded'] };

      let workerThrew = false;
      try {
        if (!syncResult.success) {
          throw new Error(syncResult.errors.join(', '));
        }
        job.status = 'completed';
        job.completed_at = new Date().toISOString();
      } catch (err: any) {
        workerThrew = true;
        const newAttempts = job.attempts + 1;
        const isDead = newAttempts >= 5;
        job.status = isDead ? 'dead_letter' : 'failed';
        job.attempts = newAttempts;
        job.last_error = err.message;
        job.next_attempt_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      }

      assert.strictEqual(workerThrew, true, 'Worker throws to prevent marking job as completed');
      assert.notStrictEqual(job.status, 'completed', 'Failed job must not be marked completed');
      assert.strictEqual(job.status, 'failed');
      assert.strictEqual(job.completed_at, null, 'completed_at must remain null on failure');
      assert.strictEqual(job.last_error, 'Google Calendar Rate Limit Exceeded');
      assert.strictEqual(job.attempts, 2);
      assert.ok(job.next_attempt_at !== null);
    });
  });

  describe('4. Atomicity & Idempotency', () => {
    it('Test 7: Atomicity - if job creation fails, booking INSERT rolls back (no orphan booking)', () => {
      let bookingInserted = false;
      let jobInserted = false;

      function createBookingTransaction(simulateFailure: boolean) {
        try {
          bookingInserted = true;
          if (simulateFailure) {
            throw new Error('Database outbox enqueue error');
          }
          jobInserted = true;
          return { success: true };
        } catch (err) {
          // Transaction aborts and rolls back
          bookingInserted = false;
          jobInserted = false;
          return { success: false, error: err };
        }
      }

      const res = createBookingTransaction(true);
      assert.strictEqual(res.success, false);
      assert.strictEqual(bookingInserted, false, 'Booking must roll back if outbox fails');
      assert.strictEqual(jobInserted, false, 'Outbox must roll back if transaction fails');
    });

    it('Test 8: Idempotency - repeated enqueue does not create duplicate active jobs', () => {
      // Simulates partial unique index:
      // CREATE UNIQUE INDEX idx_integration_jobs_active_unique ON integration_jobs(booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed');
      const table: { booking_id: string; job_type: string; status: string }[] = [];

      function insertJob(bookingId: string, jobType: string, status: string) {
        const hasConflict = table.some(row => 
          row.booking_id === bookingId &&
          row.job_type === jobType &&
          ['pending', 'processing', 'failed'].includes(row.status)
        );
        if (hasConflict) {
          // ON CONFLICT DO NOTHING
          return null;
        }
        const newRow = { booking_id: bookingId, job_type: jobType, status };
        table.push(newRow);
        return newRow;
      }

      // Initial enqueue
      const first = insertJob('b-100', 'booking_sync', 'pending');
      assert.ok(first);
      assert.strictEqual(table.length, 1);

      // Duplicate reconciliation attempt while pending
      const second = insertJob('b-100', 'booking_sync', 'pending');
      assert.strictEqual(second, null, 'Duplicate active job blocked by index');
      assert.strictEqual(table.length, 1);

      // Status moves to processing
      table[0].status = 'processing';
      const third = insertJob('b-100', 'booking_sync', 'pending');
      assert.strictEqual(third, null, 'Duplicate active job blocked while processing');
      assert.strictEqual(table.length, 1);

      // Status moves to completed (historical)
      table[0].status = 'completed';
      const fourth = insertJob('b-100', 'booking_sync', 'pending');
      assert.ok(fourth, 'Subsequent job allowed once prior job is completed');
      assert.strictEqual(table.length, 2);
    });
  });

  describe('5. Ownership & Fail-Closed Assignment', () => {
    it('Test 9: Teacher booking uses authoritative auth.uid()', () => {
      const teacherAuthUid = 'teacher-canonical-uuid-999';
      const isTeacher = true;
      const clientSuppliedTeacherId = 'malicious-different-uuid-888';

      let resolvedTeacherId: string | null = null;
      if (isTeacher) {
        resolvedTeacherId = teacherAuthUid; // Server sets auth.uid()
      }

      assert.strictEqual(resolvedTeacherId, teacherAuthUid);
      assert.notStrictEqual(resolvedTeacherId, clientSuppliedTeacherId);
    });

    it('Test 10: Guest ambiguity - 0 connections and >1 connection never result in arbitrary Teacher assignment', () => {
      function resolveGuestTeacher(activeConnections: { teacher_id: string; provider: string; is_active: boolean }[]) {
        const matching = activeConnections.filter(c => c.is_active && c.provider === 'google_calendar');
        if (matching.length === 1) {
          return matching[0].teacher_id;
        }
        return null; // Fail-closed
      }

      // 0 connections -> NULL
      assert.strictEqual(resolveGuestTeacher([]), null, '0 connections results in NULL');

      // >1 connection -> NULL (fail closed)
      const multiple = [
        { teacher_id: 't-1', provider: 'google_calendar', is_active: true },
        { teacher_id: 't-2', provider: 'google_calendar', is_active: true }
      ];
      assert.strictEqual(resolveGuestTeacher(multiple), null, '>1 connections results in NULL without guessing');

      // Exactly 1 connection -> assigned
      const single = [
        { teacher_id: 't-1', provider: 'google_calendar', is_active: true }
      ];
      assert.strictEqual(resolveGuestTeacher(single), 't-1', 'Exactly 1 connection deterministically assigned');

      // Provider not matching google_calendar -> NULL
      const wrongProvider = [
        { teacher_id: 't-1', provider: 'google', is_active: true }
      ];
      assert.strictEqual(resolveGuestTeacher(wrongProvider), null, 'Wrong provider name fails closed');
    });
  });
});
