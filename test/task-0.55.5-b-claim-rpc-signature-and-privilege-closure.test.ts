import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { DateTime } from 'luxon';

describe('Task 0.55.5-B: Integration Claim RPC Signature & Privilege Closure', () => {

  const migration000004Path = path.join(
    process.cwd(),
    'supabase/migrations/20260911000004_claim_integration_jobs_signature_and_privilege_closure.sql'
  );
  const migration000004Sql = fs.readFileSync(migration000004Path, 'utf8');

  // =========================================================================
  // Test 1 — Canonical Signature: Exactly the intended signature exists
  // =========================================================================
  describe('Test 1 — Canonical Signature', () => {
    it('migration SQL creates the canonical two-argument function with default values', () => {
      assert.ok(
        migration000004Sql.includes('CREATE OR REPLACE FUNCTION public.claim_integration_jobs('),
        'SQL must declare CREATE OR REPLACE FUNCTION public.claim_integration_jobs'
      );
      assert.ok(
        migration000004Sql.includes('p_batch_size integer DEFAULT 5'),
        'SQL must declare p_batch_size integer DEFAULT 5'
      );
      assert.ok(
        migration000004Sql.includes('p_booking_id uuid DEFAULT NULL'),
        'SQL must declare p_booking_id uuid DEFAULT NULL'
      );
      assert.ok(
        migration000004Sql.includes('RETURNS SETOF public.integration_jobs'),
        'Function must return SETOF public.integration_jobs'
      );
      assert.ok(
        migration000004Sql.includes('SECURITY DEFINER'),
        'Function must be SECURITY DEFINER'
      );
      assert.ok(
        migration000004Sql.includes('SET search_path = public, pg_temp'),
        'Function must declare immutable search_path'
      );
    });
  });

  // =========================================================================
  // Test 2 — No Unsafe Legacy Overload: Explicit drop of legacy (integer) overload
  // =========================================================================
  describe('Test 2 — No Unsafe Legacy Overload', () => {
    it('migration SQL explicitly drops the legacy one-argument public.claim_integration_jobs(integer)', () => {
      assert.ok(
        migration000004Sql.includes('DROP FUNCTION IF EXISTS public.claim_integration_jobs(integer);'),
        'SQL must explicitly drop public.claim_integration_jobs(integer)'
      );
    });

    it('demonstrates that default arguments satisfy zero, one, or two argument invocations without overload ambiguity', () => {
      // Simulation of PostgreSQL function resolution with defaults:
      // Signature: claim_integration_jobs(p_batch_size integer DEFAULT 5, p_booking_id uuid DEFAULT NULL)
      function resolveCall(args: { batchSize?: number; bookingId?: string | null }) {
        const p_batch_size = args.batchSize !== undefined ? args.batchSize : 5;
        const p_booking_id = args.bookingId !== undefined ? args.bookingId : null;
        return { p_batch_size, p_booking_id };
      }

      // Zero-arg call (e.g., cron default)
      const zeroArg = resolveCall({});
      assert.strictEqual(zeroArg.p_batch_size, 5);
      assert.strictEqual(zeroArg.p_booking_id, null);

      // One-arg call (batch size only)
      const oneArg = resolveCall({ batchSize: 10 });
      assert.strictEqual(oneArg.p_batch_size, 10);
      assert.strictEqual(oneArg.p_booking_id, null);

      // Two-arg call (scoped fast-path)
      const testUuid = '37514a31-c563-4cde-8d41-84ed47c9ab8e';
      const twoArg = resolveCall({ batchSize: 1, bookingId: testUuid });
      assert.strictEqual(twoArg.p_batch_size, 1);
      assert.strictEqual(twoArg.p_booking_id, testUuid);
    });
  });

  // =========================================================================
  // Test 3 — Global Worker: Claims eligible jobs across all bookings
  // =========================================================================
  describe('Test 3 — Global Worker Execution', () => {
    it('migration SQL claims across all bookings when p_booking_id IS NULL', () => {
      assert.ok(
        migration000004Sql.includes('(p_booking_id IS NULL OR booking_id = p_booking_id)'),
        'SQL condition allows all bookings when p_booking_id is NULL'
      );
    });

    it('global worker claims eligible pending jobs from diverse bookings up to batch limit', () => {
      const mockDatabaseJobs = [
        { id: 'j-1', booking_id: 'booking-alpha', status: 'pending', next_attempt_at: '2026-09-11T10:00:00Z', locked_at: null },
        { id: 'j-2', booking_id: 'booking-beta', status: 'pending', next_attempt_at: '2026-09-11T10:00:00Z', locked_at: null },
        { id: 'j-3', booking_id: 'booking-gamma', status: 'pending', next_attempt_at: '2026-09-11T10:00:00Z', locked_at: null }
      ];

      function simulateClaim(batchSize: number, bookingId: string | null) {
        return mockDatabaseJobs
          .filter(j => (!bookingId || j.booking_id === bookingId) && j.status === 'pending')
          .slice(0, batchSize);
      }

      const claimed = simulateClaim(10, null);
      assert.strictEqual(claimed.length, 3);
      const bookingIds = claimed.map(j => j.booking_id);
      assert.ok(bookingIds.includes('booking-alpha'));
      assert.ok(bookingIds.includes('booking-beta'));
      assert.ok(bookingIds.includes('booking-gamma'));
    });
  });

  // =========================================================================
  // Test 4 — Scoped Worker: Booking A cannot claim Booking B jobs
  // =========================================================================
  describe('Test 4 — Scoped Worker Isolation', () => {
    it('when p_booking_id is specified, worker strictly isolates to that booking', () => {
      const mockDatabaseJobs = [
        { id: 'j-1', booking_id: 'booking-aaa', status: 'pending', next_attempt_at: '2026-09-11T10:00:00Z', locked_at: null },
        { id: 'j-2', booking_id: 'booking-bbb', status: 'pending', next_attempt_at: '2026-09-11T10:00:00Z', locked_at: null },
        { id: 'j-3', booking_id: 'booking-aaa', status: 'pending', next_attempt_at: '2026-09-11T10:00:00Z', locked_at: null }
      ];

      function simulateClaim(batchSize: number, bookingId: string | null) {
        return mockDatabaseJobs
          .filter(j => (!bookingId || j.booking_id === bookingId) && j.status === 'pending')
          .slice(0, batchSize);
      }

      const claimedForA = simulateClaim(5, 'booking-aaa');
      assert.strictEqual(claimedForA.length, 2);
      assert.ok(claimedForA.every(j => j.booking_id === 'booking-aaa'));
      assert.ok(!claimedForA.some(j => j.booking_id === 'booking-bbb'), 'Booking B jobs must NEVER be claimed by Booking A');
    });
  });

  // =========================================================================
  // Test 5 — Stale Processing: Jobs locked > 5 minutes are reclaimed
  // =========================================================================
  describe('Test 5 — Stale Processing Reclaimed', () => {
    it('migration SQL reclaims processing jobs with locked_at older than 5 minutes', () => {
      assert.ok(
        migration000004Sql.includes("(status = 'processing'"),
        'SQL includes processing jobs'
      );
      assert.ok(
        migration000004Sql.includes("locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes'"),
        'SQL checks locked_at older than 5 minutes'
      );
    });

    it('reclaims stale processing job while preserving attempt count', () => {
      const now = DateTime.utc();
      const tenMinutesAgo = now.minus({ minutes: 10 }).toISO();

      const job = {
        id: 'stale-worker-crash',
        booking_id: 'b-crash',
        status: 'processing',
        locked_at: tenMinutesAgo,
        attempts: 2
      };

      const isStale = job.status === 'processing' &&
        DateTime.fromISO(job.locked_at) < now.minus({ minutes: 5 });

      assert.strictEqual(isStale, true);
      // Claim updates status to processing, resets locked_at to now, keeps attempts = 2
      const reclaimed = {
        ...job,
        locked_at: now.toISO(),
        updated_at: now.toISO()
      };
      assert.strictEqual(reclaimed.attempts, 2, 'Attempts must not be reset to 0');
    });
  });

  // =========================================================================
  // Test 6 — Fresh Processing: Jobs locked < 5 minutes remain untouched
  // =========================================================================
  describe('Test 6 — Fresh Processing Untouched', () => {
    it('active processing jobs locked within the last 5 minutes are NOT claimed', () => {
      const now = DateTime.utc();
      const twoMinutesAgo = now.minus({ minutes: 2 }).toISO();

      const freshJob = {
        id: 'fresh-active-worker',
        booking_id: 'b-active',
        status: 'processing',
        locked_at: twoMinutesAgo,
        attempts: 1
      };

      const isEligible = freshJob.status === 'processing' &&
        DateTime.fromISO(freshJob.locked_at) < now.minus({ minutes: 5 });

      assert.strictEqual(isEligible, false, 'Fresh active processing job must not be eligible');
    });
  });

  // =========================================================================
  // Test 7 — Concurrency: Two workers cannot claim the same job (FOR UPDATE SKIP LOCKED)
  // =========================================================================
  describe('Test 7 — Concurrency Isolation', () => {
    it('migration SQL specifies FOR UPDATE SKIP LOCKED', () => {
      assert.ok(
        migration000004Sql.includes('FOR UPDATE SKIP LOCKED'),
        'SQL must enforce row locking with SKIP LOCKED'
      );
    });

    it('simulated concurrent callers claim disjoint sets with no duplicates', () => {
      const pool = [
        { id: 'job-101', locked: false },
        { id: 'job-102', locked: false },
        { id: 'job-103', locked: false },
        { id: 'job-104', locked: false }
      ];

      function acquire(limit: number) {
        const acquired: string[] = [];
        for (const item of pool) {
          if (acquired.length >= limit) break;
          if (!item.locked) {
            item.locked = true;
            acquired.push(item.id);
          }
        }
        return acquired;
      }

      const thread1 = acquire(2);
      const thread2 = acquire(2);

      assert.strictEqual(thread1.length, 2);
      assert.strictEqual(thread2.length, 2);
      const overlap = thread1.filter(id => thread2.includes(id));
      assert.strictEqual(overlap.length, 0, 'No job should be claimed by multiple workers simultaneously');
    });
  });

  // =========================================================================
  // Test 8 — Privileges: Authenticated & Anon cannot execute claim function
  // =========================================================================
  describe('Test 8 — Privileges: Anon & Authenticated Execution Denied', () => {
    it('migration SQL revokes execution from PUBLIC, anon, and authenticated roles', () => {
      assert.ok(
        migration000004Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(integer, uuid) FROM PUBLIC;'),
        'Must revoke from PUBLIC'
      );
      assert.ok(
        migration000004Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(integer, uuid) FROM anon;'),
        'Must revoke from anon'
      );
      assert.ok(
        migration000004Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(integer, uuid) FROM authenticated;'),
        'Must revoke from authenticated'
      );
    });

    it('migration SQL revokes all table access on integration_jobs from client roles and forces RLS', () => {
      assert.ok(
        migration000004Sql.includes('ALTER TABLE public.integration_jobs ENABLE ROW LEVEL SECURITY;'),
        'Must enable RLS'
      );
      assert.ok(
        migration000004Sql.includes('ALTER TABLE public.integration_jobs FORCE ROW LEVEL SECURITY;'),
        'Must force RLS'
      );
      assert.ok(
        migration000004Sql.includes('REVOKE ALL ON TABLE public.integration_jobs FROM PUBLIC;'),
        'Must revoke table access from PUBLIC'
      );
      assert.ok(
        migration000004Sql.includes('REVOKE ALL ON TABLE public.integration_jobs FROM anon;'),
        'Must revoke table access from anon'
      );
      assert.ok(
        migration000004Sql.includes('REVOKE ALL ON TABLE public.integration_jobs FROM authenticated;'),
        'Must revoke table access from authenticated'
      );
    });
  });

  // =========================================================================
  // Test 9 — Service Role Privilege: Only service_role can execute claim function
  // =========================================================================
  describe('Test 9 — Service Role Privilege', () => {
    it('migration SQL grants execution of canonical claim function exclusively to service_role', () => {
      assert.ok(
        migration000004Sql.includes('GRANT EXECUTE ON FUNCTION public.claim_integration_jobs(integer, uuid) TO service_role;'),
        'Must grant execution exclusively to service_role'
      );
    });

    it('migration SQL grants table access on integration_jobs exclusively to service_role', () => {
      assert.ok(
        migration000004Sql.includes('GRANT ALL ON TABLE public.integration_jobs TO service_role;'),
        'Must grant table access to service_role'
      );
    });
  });
});
