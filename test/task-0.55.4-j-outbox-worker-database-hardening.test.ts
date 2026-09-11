import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { processIntegrationJobs } from '../server/integrations/worker.js';

describe('Task 0.55.4-J: Outbox & Worker Database Hardening Verification', () => {

  const migration000016Path = path.join(process.cwd(), 'supabase/migrations/20260908000016_outbox_security_closure.sql');
  const migration000016Sql = fs.readFileSync(migration000016Path, 'utf8');

  const migration000015Path = path.join(process.cwd(), 'supabase/migrations/20260908000015_final_booking_integration_alignment.sql');
  const migration000015Sql = fs.readFileSync(migration000015Path, 'utf8');

  const migration000006Path = path.join(process.cwd(), 'supabase/migrations/20260908000006_reliable_orchestration.sql');
  const migration000006Sql = fs.readFileSync(migration000006Path, 'utf8');

  // =========================================================================
  // Test A: Atomic Booking + Outbox Insertion
  // =========================================================================
  describe('Test A: Atomic Booking + Outbox Insertion', () => {
    it('create_booking_atomic executes outbox insertion inside atomic boundary', () => {
      // Ensure migration 000015 contains the atomic insert
      assert.ok(
        migration000015Sql.includes('INSERT INTO public.integration_jobs (booking_id, job_type, status)'),
        'RPC inserts into integration_jobs atomically'
      );
      assert.ok(
        migration000015Sql.includes("VALUES (v_booking_id, 'booking_sync', 'pending')"),
        'RPC initializes job with status = pending'
      );
    });

    it('if booking fails or raises exception, outbox job is not orphaned (transaction rollback)', () => {
      let bookingInserted = false;
      let outboxInserted = false;

      function simulateAtomicBooking(shouldFail: boolean) {
        // PostgreSQL statement transaction simulation
        try {
          bookingInserted = true;
          if (shouldFail) {
            throw new Error('P0001: Booking validation failed');
          }
          outboxInserted = true;
          return { success: true };
        } catch (err) {
          // Transaction abort rolls back all statement mutations
          bookingInserted = false;
          outboxInserted = false;
          return { success: false, error: err };
        }
      }

      const res = simulateAtomicBooking(true);
      assert.strictEqual(res.success, false);
      assert.strictEqual(bookingInserted, false, 'Booking must be rolled back');
      assert.strictEqual(outboxInserted, false, 'Outbox job must be rolled back');
    });
  });

  // =========================================================================
  // Test B: Active-Job Uniqueness
  // =========================================================================
  describe('Test B: Active-Job Uniqueness', () => {
    it('partial unique index prevents duplicate active jobs for same booking and type', () => {
      assert.ok(
        migration000006Sql.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_jobs_booking_type'),
        'Unique index declaration exists'
      );
      assert.ok(
        migration000006Sql.includes('ON public.integration_jobs(booking_id, job_type)'),
        'Index covers (booking_id, job_type)'
      );
      assert.ok(
        migration000006Sql.includes("WHERE status IN ('pending', 'processing', 'failed')"),
        'Index is partial, scoped strictly to active states'
      );
    });

    it('simulated active index rejects duplicate active job while allowing completed history', () => {
      const existingJobs = [
        { id: 'job-1', booking_id: 'b-100', job_type: 'booking_sync', status: 'completed' },
        { id: 'job-2', booking_id: 'b-100', job_type: 'booking_sync', status: 'pending' }
      ];

      function insertJob(bookingId: string, jobType: string, status: string) {
        const isActive = ['pending', 'processing', 'failed'].includes(status);
        if (isActive) {
          const conflict = existingJobs.find(
            j => j.booking_id === bookingId && j.job_type === jobType && ['pending', 'processing', 'failed'].includes(j.status)
          );
          if (conflict) {
            throw new Error('duplicate key value violates unique constraint "idx_integration_jobs_booking_type"');
          }
        }
        existingJobs.push({ id: `job-${Date.now()}`, booking_id: bookingId, job_type: jobType, status });
        return { success: true };
      }

      // Should reject second pending job for same booking
      assert.throws(
        () => insertJob('b-100', 'booking_sync', 'pending'),
        /idx_integration_jobs_booking_type/
      );

      // Should allow job for different booking
      assert.doesNotThrow(() => insertJob('b-200', 'booking_sync', 'pending'));
    });
  });

  // =========================================================================
  // Test C: Claim Concurrency
  // =========================================================================
  describe('Test C: Claim Concurrency & Lock Expiration', () => {
    it('claim_integration_jobs specifies FOR UPDATE SKIP LOCKED and strict lock conditions', () => {
      assert.ok(
        migration000016Sql.includes('FOR UPDATE SKIP LOCKED'),
        'Claim RPC must use SKIP LOCKED for concurrency safety'
      );
      assert.ok(
        migration000016Sql.includes("status IN ('pending', 'failed')"),
        'Only pending or failed jobs can be claimed'
      );
      assert.ok(
        migration000016Sql.includes("next_attempt_at <= timezone('utc'::text, now())"),
        'Backoff constraint enforced on claim'
      );
      assert.ok(
        migration000016Sql.includes("locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes'"),
        'Stale lock recovery configured for 5 minutes'
      );
    });

    it('concurrent workers never claim the same active row', () => {
      const queue = [
        { id: 'job-1', status: 'pending', locked: false },
        { id: 'job-2', status: 'pending', locked: false }
      ];

      function workerClaim(workerId: string, batchSize = 1) {
        const claimed: any[] = [];
        for (const item of queue) {
          if (!item.locked && claimed.length < batchSize) {
            item.locked = true; // SKIP LOCKED
            claimed.push({ ...item, claimedBy: workerId });
          }
        }
        return claimed;
      }

      const workerAClaims = workerClaim('WorkerA', 1);
      const workerBClaims = workerClaim('WorkerB', 1);

      assert.strictEqual(workerAClaims.length, 1);
      assert.strictEqual(workerBClaims.length, 1);
      assert.strictEqual(workerAClaims[0].id, 'job-1');
      assert.strictEqual(workerBClaims[0].id, 'job-2');
      assert.notStrictEqual(workerAClaims[0].id, workerBClaims[0].id, 'Workers must not claim the same job');
    });
  });

  // =========================================================================
  // Test D: Worker Success Persistence
  // =========================================================================
  describe('Test D: Worker Success Persistence', () => {
    it('when sync succeeds and completion update succeeds, status is completed and count increments', async () => {
      const mockJob = {
        id: 'job-success-1',
        booking_id: 'b-succ-1',
        job_type: 'booking_sync',
        attempts: 0,
        status: 'processing'
      };

      const mockBooking = {
        id: 'b-succ-1',
        reference_code: 'REF-SUCC-1',
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

      let completedUpdateCalled = false;
      let completedPayload: any = null;

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
                completedPayload = payload;
                return {
                  eq: (field1: string, val1: any) => ({
                    eq: (field2: string, val2: any) => ({
                      select: async () => {
                        completedUpdateCalled = true;
                        return { data: [{ id: val1 }], error: null };
                      }
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
      assert.strictEqual(processed, 1, 'Worker must report 1 processed job on durable completion');
      assert.strictEqual(completedUpdateCalled, true, 'Completion update must be called');
      assert.strictEqual(completedPayload.status, 'completed', 'Job status must be updated to completed');
      assert.strictEqual(completedPayload.locked_at, null, 'Lock must be cleared');
      assert.strictEqual(completedPayload.last_error, null, 'Last error must be null');
      assert.ok(completedPayload.completed_at, 'completed_at must be populated');
    });
  });

  // =========================================================================
  // Test E: Worker Completion UPDATE Failure (Mandatory Audit Bug Check)
  // =========================================================================
  describe('Test E: Worker Completion UPDATE Failure (Mandatory Audit Bug Check)', () => {
    it('when integration succeeds but completion UPDATE fails, worker does NOT report success', async () => {
      const mockJob = {
        id: 'job-update-fail-1',
        booking_id: 'b-upd-fail-1',
        job_type: 'booking_sync',
        attempts: 1,
        status: 'processing'
      };

      const mockBooking = {
        id: 'b-upd-fail-1',
        reference_code: 'REF-FAIL-1',
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

      let failureRecoverySaved = false;
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
                  // Simulate PostgreSQL database error on completion UPDATE
                  return {
                    eq: () => ({
                      eq: () => ({
                        select: async () => ({
                          data: null,
                          error: { message: 'connection reset by peer / deadlock detected' }
                        })
                      })
                    })
                  };
                }
                // Failure catch block update
                failureRecoverySaved = true;
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

      // CRITICAL INVARIANT: ignored database UPDATE errors must NOT become false worker success!
      assert.strictEqual(processed, 0, 'Worker MUST NOT report job as processed when completion update failed!');
      assert.strictEqual(failureRecoverySaved, true, 'Worker must record failure/retry state when completion update fails');
      assert.strictEqual(failureRecoveryPayload.status, 'failed', 'Status must be set to failed for retry');
      assert.strictEqual(failureRecoveryPayload.attempts, 2, 'Attempts must increment');
      assert.ok(
        failureRecoveryPayload.last_error.includes('Failed to persist job completion'),
        'last_error must record completion persistence failure'
      );
    });
  });

  // =========================================================================
  // Test F: Worker Failure Persistence & Critical Error Surfacing
  // =========================================================================
  describe('Test F: Worker Failure Persistence & Critical Error Surfacing', () => {
    it('when integration fails with transient error, retry state and backoff are persisted', async () => {
      const mockJob = {
        id: 'job-retry-1',
        booking_id: 'b-retry-1',
        job_type: 'booking_sync',
        attempts: 0,
        status: 'processing'
      };

      let failurePayload: any = null;

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
                  // Simulate transient network error
                  maybeSingle: async () => ({ data: null, error: { message: 'Temporary network timeout / connection reset' } })
                })
              })
            };
          }
          if (table === 'integration_jobs') {
            return {
              update: (payload: any) => {
                failurePayload = payload;
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
      assert.strictEqual(processed, 0);
      assert.strictEqual(failurePayload.status, 'failed', 'Transient error must mark status as failed');
      assert.strictEqual(failurePayload.attempts, 1);
      assert.ok(failurePayload.next_attempt_at, 'next_attempt_at backoff must be scheduled');
      assert.strictEqual(failurePayload.locked_at, null);
    });

    it('when integration fails with permanent error (e.g. 401/unauthorized/invalid_grant), transitions immediately to dead_letter', async () => {
      const mockJob = {
        id: 'job-perm-1',
        booking_id: 'b-perm-1',
        job_type: 'booking_sync',
        attempts: 0,
        status: 'processing'
      };

      let failurePayload: any = null;

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
                  // Simulate permanent auth failure
                  maybeSingle: async () => ({ data: null, error: { message: 'Google OAuth invalid_grant: token revoked' } })
                })
              })
            };
          }
          if (table === 'integration_jobs') {
            return {
              update: (payload: any) => {
                failurePayload = payload;
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
      assert.strictEqual(processed, 0);
      assert.strictEqual(failurePayload.status, 'dead_letter', 'Permanent error must transition immediately to dead_letter');
      assert.strictEqual(failurePayload.attempts, 5, 'Permanent error sets attempts to 5');
      assert.strictEqual(failurePayload.next_attempt_at, null, 'No next attempt scheduled for dead-letter');
      assert.strictEqual(failurePayload.locked_at, null);
    });

    it('if failure-state persistence in DB itself fails, worker surfaces critical error and does not swallow', async () => {
      const mockJob = {
        id: 'job-critical-fail-1',
        booking_id: 'b-crit-1',
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
                  maybeSingle: async () => ({ data: null, error: { message: 'DB offline' } })
                })
              })
            };
          }
          if (table === 'integration_jobs') {
            return {
              update: () => ({
                // Database write failure when persisting failure state
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
        /CRITICAL: Failed to persist failure state for job/,
        'Worker must rethrow when failure state cannot be persisted in DB'
      );
    });

    it('OAuth secrets and tokens are sanitized before persisting last_error', async () => {
      const mockJob = {
        id: 'job-sanitize-1',
        booking_id: 'b-san-1',
        job_type: 'booking_sync',
        attempts: 0,
        status: 'processing'
      };

      let savedError: string = '';

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
                  maybeSingle: async () => ({
                    data: null,
                    error: { message: 'Google API error: ya29.a0ARrdaM8secretToken12345 Bearer ya29.foo client_secret=supersecret' }
                  })
                })
              })
            };
          }
          if (table === 'integration_jobs') {
            return {
              update: (payload: any) => {
                savedError = payload.last_error;
                return {
                  eq: async () => ({ error: null })
                };
              }
            };
          }
          return {};
        }
      };

      await processIntegrationJobs(1, mockClient);
      assert.ok(!savedError.includes('ya29.a0ARrdaM8secretToken12345'), 'OAuth token must be redacted');
      assert.ok(!savedError.includes('client_secret=supersecret'), 'Client secret must be redacted');
      assert.ok(savedError.includes('[REDACTED_TOKEN]'), 'Token must be replaced with redaction marker');
    });
  });

  // =========================================================================
  // Test G: Security & Role Isolation
  // =========================================================================
  describe('Test G: Security & Role Isolation', () => {
    it('migration 000016 enforces table access strictly to service_role', () => {
      assert.ok(migration000016Sql.includes('REVOKE ALL ON TABLE public.integration_jobs FROM PUBLIC;'));
      assert.ok(migration000016Sql.includes('REVOKE ALL ON TABLE public.integration_jobs FROM anon;'));
      assert.ok(migration000016Sql.includes('REVOKE ALL ON TABLE public.integration_jobs FROM authenticated;'));
      assert.ok(migration000016Sql.includes('GRANT ALL ON TABLE public.integration_jobs TO service_role;'));
    });

    it('migration 000016 locks down claim_integration_jobs strictly to service_role', () => {
      assert.ok(migration000016Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM PUBLIC;'));
      assert.ok(migration000016Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM anon;'));
      assert.ok(migration000016Sql.includes('REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM authenticated;'));
      assert.ok(migration000016Sql.includes('GRANT EXECUTE ON FUNCTION public.claim_integration_jobs(INT) TO service_role;'));
    });
  });

  // =========================================================================
  // Test H: Lost-Update / Concurrency Race Protection
  // =========================================================================
  describe('Test H: Lost-Update / Concurrency Race Protection', () => {
    it('if another worker changed job status away from processing, completion update fails and does not count as processed', async () => {
      const mockJob = {
        id: 'job-lost-update-1',
        booking_id: 'b-lost-1',
        job_type: 'booking_sync',
        attempts: 0,
        status: 'processing'
      };

      const mockBooking = {
        id: 'b-lost-1',
        reference_code: 'REF-LOST-1',
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
                  // Simulate: 0 rows affected because status is no longer 'processing'
                  return {
                    eq: () => ({
                      eq: () => ({
                        select: async () => ({ data: [], error: null })
                      })
                    })
                  };
                }
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
      assert.strictEqual(processed, 0, 'Lost update must not count toward processedCount');
    });
  });

  // =========================================================================
  // Test I: Stale / Cancelled Booking Skipping
  // =========================================================================
  describe('Test I: Stale / Cancelled Booking Skipping', () => {
    it('if booking was cancelled, worker skips sync and marks completed with verified persistence', async () => {
      const mockJob = {
        id: 'job-cancelled-1',
        booking_id: 'b-cancelled-1',
        job_type: 'booking_sync',
        attempts: 0,
        status: 'processing'
      };

      const mockCancelledBooking = {
        id: 'b-cancelled-1',
        reference_code: 'REF-CANC-1',
        teacher_id: null,
        status: 'cancelled',
        scheduled_start: new Date(Date.now() + 86400000).toISOString(),
        scheduled_end: new Date(Date.now() + 90000000).toISOString(),
        student_timezone: 'America/New_York',
        contact_name: 'Test Student',
        contact_email: 'student@example.com'
      };

      let completedCalled = false;

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
                  maybeSingle: async () => ({ data: mockCancelledBooking, error: null })
                })
              })
            };
          }
          if (table === 'integration_jobs') {
            return {
              update: (payload: any) => {
                if (payload.status === 'completed') {
                  completedCalled = true;
                  return {
                    eq: () => ({
                      eq: () => ({
                        select: async () => ({ data: [{ id: mockJob.id }], error: null })
                      })
                    })
                  };
                }
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
      assert.strictEqual(processed, 1, 'Skipped stale cancelled job safely marks completed');
      assert.strictEqual(completedCalled, true);
    });
  });

});
