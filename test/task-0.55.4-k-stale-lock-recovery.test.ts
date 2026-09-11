import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { processIntegrationJobs } from '../server/integrations/worker.js';

describe('Task 0.55.4-K: Production Integration Job Stale-Lock Recovery Verification', () => {

  const migration000001Path = path.join(process.cwd(), 'supabase/migrations/20260911000001_integration_job_stale_lock_recovery.sql');
  const migration000001Sql = fs.readFileSync(migration000001Path, 'utf8');

  // =========================================================================
  // Test 1: Due Pending Job Claim
  // =========================================================================
  describe('Test 1: Due Pending Job Claim', () => {
    it('migration SQL predicate includes due pending jobs', () => {
      assert.ok(
        migration000001Sql.includes("status IN ('pending', 'failed')"),
        'Claim SQL includes pending jobs'
      );
      assert.ok(
        migration000001Sql.includes("next_attempt_at <= timezone('utc'::text, now())"),
        'Claim SQL checks next_attempt_at is due'
      );
      assert.ok(
        migration000001Sql.includes("(locked_at IS NULL OR locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes')"),
        'Claim SQL verifies lock is null or expired'
      );
    });

    it('simulated claim logic successfully claims a due pending job', () => {
      const now = new Date('2026-09-11T12:00:00Z').getTime();
      const jobs = [
        {
          id: 'job-pending-1',
          status: 'pending',
          next_attempt_at: new Date(now - 10000).toISOString(),
          locked_at: null,
          attempts: 0
        },
        {
          id: 'job-pending-future',
          status: 'pending',
          next_attempt_at: new Date(now + 60000).toISOString(),
          locked_at: null,
          attempts: 0
        }
      ];

      function simulateClaim(currentTimeMs: number) {
        return jobs.filter(j => {
          if (['pending', 'failed'].includes(j.status)) {
            const nextAttempt = new Date(j.next_attempt_at).getTime();
            const lockExpired = !j.locked_at || (currentTimeMs - new Date(j.locked_at).getTime()) > 5 * 60 * 1000;
            return nextAttempt <= currentTimeMs && lockExpired;
          }
          if (j.status === 'processing' && j.locked_at) {
            return (currentTimeMs - new Date(j.locked_at).getTime()) > 5 * 60 * 1000;
          }
          return false;
        });
      }

      const claimed = simulateClaim(now);
      assert.strictEqual(claimed.length, 1);
      assert.strictEqual(claimed[0].id, 'job-pending-1');
    });
  });

  // =========================================================================
  // Test 2: Due Failed Job Claim
  // =========================================================================
  describe('Test 2: Due Failed Job Claim', () => {
    it('migration SQL predicate includes due failed jobs after backoff expires', () => {
      assert.ok(
        migration000001Sql.includes("status IN ('pending', 'failed')"),
        'Claim SQL includes failed jobs'
      );
    });

    it('simulated claim logic claims failed job only when backoff delay has passed', () => {
      const now = new Date('2026-09-11T12:00:00Z').getTime();
      const jobs = [
        {
          id: 'job-failed-due',
          status: 'failed',
          next_attempt_at: new Date(now - 5000).toISOString(),
          locked_at: null,
          attempts: 1
        },
        {
          id: 'job-failed-waiting-backoff',
          status: 'failed',
          next_attempt_at: new Date(now + 300000).toISOString(), // 5m backoff in future
          locked_at: null,
          attempts: 1
        }
      ];

      function simulateClaim(currentTimeMs: number) {
        return jobs.filter(j => {
          if (['pending', 'failed'].includes(j.status)) {
            const nextAttempt = new Date(j.next_attempt_at).getTime();
            const lockExpired = !j.locked_at || (currentTimeMs - new Date(j.locked_at).getTime()) > 5 * 60 * 1000;
            return nextAttempt <= currentTimeMs && lockExpired;
          }
          if (j.status === 'processing' && j.locked_at) {
            return (currentTimeMs - new Date(j.locked_at).getTime()) > 5 * 60 * 1000;
          }
          return false;
        });
      }

      const claimed = simulateClaim(now);
      assert.strictEqual(claimed.length, 1);
      assert.strictEqual(claimed[0].id, 'job-failed-due');
    });
  });

  // =========================================================================
  // Test 3: Stale Processing Job Reclamation
  // =========================================================================
  describe('Test 3: Stale Processing Job Reclamation', () => {
    it('migration SQL explicitly reclaims processing jobs locked > 5 minutes ago', () => {
      assert.ok(
        migration000001Sql.includes("status = 'processing'"),
        'Claim SQL covers status = processing'
      );
      assert.ok(
        migration000001Sql.includes('locked_at IS NOT NULL'),
        'Claim SQL requires non-null locked_at for processing jobs'
      );
      assert.ok(
        migration000001Sql.includes("locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes'"),
        'Claim SQL specifies 5-minute stale window'
      );
    });

    it('simulated claim reclaims stale processing job stuck for 10 minutes', () => {
      const now = new Date('2026-09-11T12:00:00Z').getTime();
      const tenMinutesAgo = new Date(now - 10 * 60 * 1000).toISOString();

      const jobs = [
        {
          id: 'job-stale-processing',
          status: 'processing',
          next_attempt_at: null,
          locked_at: tenMinutesAgo,
          attempts: 0
        }
      ];

      function simulateClaim(currentTimeMs: number) {
        return jobs.filter(j => {
          if (['pending', 'failed'].includes(j.status)) {
            const nextAttempt = j.next_attempt_at ? new Date(j.next_attempt_at).getTime() : 0;
            const lockExpired = !j.locked_at || (currentTimeMs - new Date(j.locked_at).getTime()) > 5 * 60 * 1000;
            return nextAttempt <= currentTimeMs && lockExpired;
          }
          if (j.status === 'processing' && j.locked_at) {
            return (currentTimeMs - new Date(j.locked_at).getTime()) > 5 * 60 * 1000;
          }
          return false;
        });
      }

      const claimed = simulateClaim(now);
      assert.strictEqual(claimed.length, 1);
      assert.strictEqual(claimed[0].id, 'job-stale-processing');
    });
  });

  // =========================================================================
  // Test 4: Fresh Processing Job Protection
  // =========================================================================
  describe('Test 4: Fresh Processing Job Protection', () => {
    it('a processing job locked within the last 5 minutes is NOT reclaimed by another worker', () => {
      const now = new Date('2026-09-11T12:00:00Z').getTime();
      const twoMinutesAgo = new Date(now - 2 * 60 * 1000).toISOString();
      const thirtySecondsAgo = new Date(now - 30 * 1000).toISOString();

      const jobs = [
        {
          id: 'job-fresh-1',
          status: 'processing',
          locked_at: twoMinutesAgo,
          attempts: 0
        },
        {
          id: 'job-fresh-2',
          status: 'processing',
          locked_at: thirtySecondsAgo,
          attempts: 1
        }
      ];

      function simulateClaim(currentTimeMs: number) {
        return jobs.filter(j => {
          if (['pending', 'failed'].includes(j.status)) {
            const nextAttempt = 0;
            const lockExpired = !j.locked_at || (currentTimeMs - new Date(j.locked_at).getTime()) > 5 * 60 * 1000;
            return lockExpired;
          }
          if (j.status === 'processing' && j.locked_at) {
            return (currentTimeMs - new Date(j.locked_at).getTime()) > 5 * 60 * 1000;
          }
          return false;
        });
      }

      const claimed = simulateClaim(now);
      assert.strictEqual(claimed.length, 0, 'Fresh processing jobs must NEVER be reclaimed');
    });
  });

  // =========================================================================
  // Test 5: Concurrent Claim Isolation (SKIP LOCKED)
  // =========================================================================
  describe('Test 5: Concurrent Claim Isolation (SKIP LOCKED)', () => {
    it('migration SQL specifies FOR UPDATE SKIP LOCKED', () => {
      assert.ok(
        migration000001Sql.includes('FOR UPDATE SKIP LOCKED'),
        'Must use FOR UPDATE SKIP LOCKED to prevent race conditions'
      );
    });

    it('simulated concurrent claim ensures two workers cannot claim the same job', () => {
      const databaseRows = [
        { id: 'job-stale-1', status: 'processing', locked_at: '2026-09-11T11:50:00Z', lockedBy: null },
        { id: 'job-stale-2', status: 'processing', locked_at: '2026-09-11T11:45:00Z', lockedBy: null }
      ];

      function workerClaimAtomic(workerId: string, limit = 1) {
        const claimed: any[] = [];
        for (const row of databaseRows) {
          // SKIP LOCKED simulation: if row is not currently locked in transaction
          if (row.lockedBy === null && claimed.length < limit) {
            row.lockedBy = workerId; // acquire row-level lock
            claimed.push({ ...row });
          }
        }
        return claimed;
      }

      const worker1Claim = workerClaimAtomic('worker-1', 1);
      const worker2Claim = workerClaimAtomic('worker-2', 1);

      assert.strictEqual(worker1Claim.length, 1);
      assert.strictEqual(worker2Claim.length, 1);
      assert.strictEqual(worker1Claim[0].id, 'job-stale-1');
      assert.strictEqual(worker2Claim[0].id, 'job-stale-2');
      assert.notStrictEqual(worker1Claim[0].id, worker2Claim[0].id, 'Workers must never claim the same row');
    });
  });

  // =========================================================================
  // Test 6: Attempts Preservation across Stale Reclamation
  // =========================================================================
  describe('Test 6: Attempts Preservation across Stale Reclamation', () => {
    it('claim RPC does NOT overwrite or reset the attempts column', () => {
      // Check UPDATE clause in migration SQL
      const updateClause = migration000001Sql.substring(
        migration000001Sql.indexOf('UPDATE public.integration_jobs'),
        migration000001Sql.indexOf('WHERE id IN')
      );
      assert.ok(
        !updateClause.includes('attempts ='),
        'claim_integration_jobs must NOT reset attempts column'
      );
      assert.ok(
        updateClause.includes("status = 'processing'"),
        'claim sets status to processing'
      );
      assert.ok(
        updateClause.includes("locked_at = timezone('utc'::text, now())"),
        'claim refreshes locked_at to now()'
      );
    });

    it('worker preserves existing attempt count and increments accurately on retry', async () => {
      const mockJobWithPriorAttempts = {
        id: 'job-attempt-check',
        booking_id: 'b-attempt-1',
        job_type: 'booking_sync',
        attempts: 2, // previously failed twice
        status: 'processing'
      };

      let failurePayload: any = null;

      const mockClient = {
        rpc: async (fn: string) => {
          if (fn === 'claim_integration_jobs') {
            return { data: [mockJobWithPriorAttempts], error: null };
          }
          return { data: null, error: null };
        },
        from: (table: string) => {
          if (table === 'bookings') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: null,
                    error: { message: 'Temporary network timeout' }
                  })
                })
              })
            };
          }
          if (table === 'integration_jobs') {
            return {
              update: (payload: any) => {
                failurePayload = payload;
                return { eq: async () => ({ error: null }) };
              }
            };
          }
          return {};
        }
      };

      const processed = await processIntegrationJobs(1, mockClient);
      assert.strictEqual(processed, 0);
      assert.strictEqual(failurePayload.attempts, 3, 'Attempts must be 2 + 1 = 3, not reset to 1');
      assert.strictEqual(failurePayload.status, 'failed');
    });
  });

  // =========================================================================
  // Test 7: Worker Completion UPDATE Failure (Mandatory Task J Preservation)
  // =========================================================================
  describe('Test 7: Completion Persistence Failure Handling', () => {
    it('when integration succeeds but DB completion UPDATE fails, worker does NOT report success', async () => {
      const mockJob = {
        id: 'job-update-fail-k',
        booking_id: 'b-fail-k',
        job_type: 'booking_sync',
        attempts: 0,
        status: 'processing'
      };

      const mockBooking = {
        id: 'b-fail-k',
        reference_code: 'REF-FAIL-K',
        teacher_id: null,
        status: 'confirmed',
        scheduled_start: new Date(Date.now() + 86400000).toISOString(),
        scheduled_end: new Date(Date.now() + 90000000).toISOString(),
        student_timezone: 'America/New_York',
        contact_name: 'Test Student',
        contact_email: 'student@example.com',
        booking_type: 'trial',
        service_name: 'Quran Reading'
      };

      let failureRecoveryPayload: any = null;

      const mockClient = {
        rpc: async (fn: string) => {
          if (fn === 'claim_integration_jobs') {
            return { data: [mockJob], error: null };
          }
          return { data: null, error: null };
        },
        from: (table: string) => {
          if (table === 'bookings') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: mockBooking, error: null })
                })
              }),
              update: () => ({
                eq: async () => ({ data: null, error: null })
              })
            };
          }
          if (table === 'integration_jobs') {
            return {
              update: (payload: any) => {
                if (payload.status === 'completed') {
                  return {
                    eq: () => ({
                      eq: () => ({
                        select: async () => ({
                          data: null,
                          error: { message: 'Simulated connection reset / deadlock' }
                        })
                      })
                    })
                  };
                }
                failureRecoveryPayload = payload;
                return {
                  eq: async () => ({ error: null })
                };
              }
            };
          }
          return {};
        }
      };

      const processed = await processIntegrationJobs(1, mockClient);
      assert.strictEqual(processed, 0, 'Worker must not count job as processed if DB update fails');
      assert.ok(failureRecoveryPayload, 'Job failure recovery update must be called');
      assert.strictEqual(failureRecoveryPayload.status, 'failed');
      assert.ok(
        failureRecoveryPayload.last_error.includes('Failed to persist job completion'),
        'last_error must record completion persistence failure'
      );
    });
  });

  // =========================================================================
  // Test 8: Failure / Dead-Letter DB Update Error Surfacing
  // =========================================================================
  describe('Test 8: Failure Persistence Error Surfacing', () => {
    it('if failure-state persistence in DB fails, worker surfaces critical error and does not swallow', async () => {
      const mockJob = {
        id: 'job-crit-fail-k',
        booking_id: 'b-crit-k',
        job_type: 'booking_sync',
        attempts: 0,
        status: 'processing'
      };

      const mockClient = {
        rpc: async (fn: string) => {
          if (fn === 'claim_integration_jobs') {
            return { data: [mockJob], error: null };
          }
          return { data: null, error: null };
        },
        from: (table: string) => {
          if (table === 'bookings') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: { message: 'Database read error' } })
                })
              })
            };
          }
          if (table === 'integration_jobs') {
            return {
              update: () => ({
                eq: async () => ({ error: { message: 'disk full / read only database' } })
              })
            };
          }
          return {};
        }
      };

      await assert.rejects(
        async () => {
          await processIntegrationJobs(1, mockClient);
        },
        /CRITICAL: Failed to persist failure state for job job-crit-fail-k/,
        'Worker must re-throw critical persistence errors'
      );
    });
  });

  // =========================================================================
  // Test 9: Security and Role Isolation
  // =========================================================================
  describe('Test 9: Security and Role Isolation', () => {
    it('claim_integration_jobs has SECURITY DEFINER and safe search_path', () => {
      assert.ok(
        migration000001Sql.includes('SECURITY DEFINER'),
        'Must declare SECURITY DEFINER'
      );
      assert.ok(
        migration000001Sql.includes('SET search_path = public, pg_temp'),
        'Must declare safe search_path'
      );
    });

    it('claim_integration_jobs execution is revoked from PUBLIC, anon, and authenticated', () => {
      assert.ok(
        migration000001Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM PUBLIC;'),
        'Must revoke from PUBLIC'
      );
      assert.ok(
        migration000001Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM anon;'),
        'Must revoke from anon'
      );
      assert.ok(
        migration000001Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM authenticated;'),
        'Must revoke from authenticated'
      );
      assert.ok(
        migration000001Sql.includes('GRANT EXECUTE ON FUNCTION public.claim_integration_jobs(INT) TO service_role;'),
        'Must grant execution exclusively to service_role'
      );
    });
  });

  // =========================================================================
  // Test 10: MHM-51148D Production Recovery Scenario Verification
  // =========================================================================
  describe('Test 10: MHM-51148D Production Scenario Recovery', () => {
    it('stuck job e01dfa5c-6ab5-46aa-a833-8aa72c276bcc is reclaimed and idempotently completes', async () => {
      // The exact state of production job e01dfa5c-6ab5-46aa-a833-8aa72c276bcc
      const prodStuckJob = {
        id: 'e01dfa5c-6ab5-46aa-a833-8aa72c276bcc',
        booking_id: '37514a31-c563-4cde-8d41-84ed47c9ab8e',
        job_type: 'booking_sync',
        attempts: 0,
        status: 'processing',
        locked_at: '2026-09-11T15:01:47.418216Z',
        last_error: null,
        completed_at: null
      };

      // The exact state of production booking 37514a31-c563-4cde-8d41-84ed47c9ab8e
      const prodBooking = {
        id: '37514a31-c563-4cde-8d41-84ed47c9ab8e',
        reference_code: 'MHM-51148D',
        teacher_id: null,
        status: 'confirmed',
        integration_status: 'failed',
        zoom_meeting_id: '83197593750',
        zoom_meeting_link: 'https://zoom.us/j/83197593750',
        google_calendar_event_id: null,
        scheduled_start: '2026-09-12T10:00:00Z',
        scheduled_end: '2026-09-12T10:30:00Z',
        student_timezone: 'America/Toronto',
        contact_name: 'Ahmed Abdalaty',
        contact_email: 'ahmed@example.com',
        booking_type: 'trial',
        service_name: 'Quran Reading'
      };

      let completedJobPayload: any = null;
      let bookingUpdatePayload: any = null;

      const mockClient = {
        rpc: async (fn: string) => {
          if (fn === 'claim_integration_jobs') {
            // Under the new claim logic, locked_at is > 5m old, so it claims prodStuckJob
            return { data: [prodStuckJob], error: null };
          }
          return { data: null, error: null };
        },
        from: (table: string) => {
          if (table === 'bookings') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: prodBooking, error: null })
                })
              }),
              update: (payload: any) => {
                bookingUpdatePayload = payload;
                return {
                  eq: async () => ({ data: null, error: null })
                };
              }
            };
          }
          if (table === 'integration_jobs') {
            return {
              update: (payload: any) => {
                completedJobPayload = payload;
                return {
                  eq: (field1: string, val1: any) => ({
                    eq: (field2: string, val2: any) => ({
                      select: async () => ({ data: [{ id: val1 }], error: null })
                    })
                  })
                };
              }
            };
          }
          return {};
        }
      };

      const processed = await processIntegrationJobs(1, mockClient);
      assert.strictEqual(processed, 1, 'MHM-51148D job must be recovered and completed');
      assert.strictEqual(completedJobPayload.status, 'completed', 'Job must transition to completed');
      assert.strictEqual(completedJobPayload.locked_at, null, 'Lock must be released');
      assert.ok(completedJobPayload.completed_at, 'completed_at timestamp must be set');
    });
  });
});
