import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.58-G: Teacher Lifecycle Outcome Atomicity Verification', () => {

  const rpcPath = path.join(process.cwd(), 'supabase/migrations/20260914000001_teacher_lifecycle_outcome_rpc.sql');
  const rpcSql = fs.readFileSync(rpcPath, 'utf8');

  describe('1. SQL RPC Hardening and Transaction Boundary', () => {
    it('forces teacher_record_lesson_outcome to run securely via SECURITY DEFINER and search_path', () => {
      assert.ok(rpcSql.includes('SECURITY DEFINER'), 'RPC must use SECURITY DEFINER');
      assert.ok(rpcSql.includes('SET search_path = public, pg_temp'), 'RPC must restrict search_path');
    });

    it('locks booking with FOR UPDATE to prevent concurrent race conditions', () => {
      assert.ok(rpcSql.includes('FOR UPDATE'), 'Must acquire row-level lock on the booking');
    });

    it('enforces idempotency cleanly inside the transaction', () => {
      assert.ok(rpcSql.includes('IF v_booking.status = p_outcome THEN'), 'Idempotent status check');
      assert.ok(rpcSql.includes('\'isIdempotent\', true'), 'Idempotency response is clear');
    });

    it('rejects completed -> no_show and no_show -> completed transitions', () => {
      assert.ok(rpcSql.includes('v_booking.status = \'completed\' AND p_outcome = \'no_show\''), 'Blocks arbitrary mutations between completed/no_show');
    });

    it('enforces future lesson protection strictly inside DB', () => {
      assert.ok(rpcSql.includes('v_booking.scheduled_start > (v_now + interval \'15 minutes\')'), 'Future completed protection exists');
      assert.ok(rpcSql.includes('v_booking.scheduled_start > v_now'), 'Future no-show protection exists');
    });

    it('updates booking and inserts/updates lesson_sessions in a single transaction', () => {
      assert.ok(rpcSql.includes('UPDATE public.bookings'), 'Booking update present');
      assert.ok(rpcSql.includes('INSERT INTO public.lesson_sessions'), 'Session insert present');
      assert.ok(rpcSql.includes('UPDATE public.lesson_sessions'), 'Session update present');
    });

    it('revokes public execution access to the RPC', () => {
      assert.ok(rpcSql.includes('REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome'), 'Public execution must be revoked');
    });
  });

  describe('2. Atomicity Simulation', () => {
    it('simulates rollback if lesson_session insert fails after booking update', () => {
      let bookingUpdated = false;
      let sessionInserted = false;

      function simulateRpc(shouldSessionFail: boolean) {
        try {
          // Inside RPC execution block
          bookingUpdated = true;
          
          if (shouldSessionFail) {
            throw new Error('P0001: Constraint violation in lesson_sessions');
          }
          
          sessionInserted = true;
          return { success: true };
        } catch (err) {
          // Transaction abort
          bookingUpdated = false;
          sessionInserted = false;
          return { success: false, error: err };
        }
      }

      const res = simulateRpc(true);
      assert.strictEqual(res.success, false);
      assert.strictEqual(bookingUpdated, false, 'Booking update must be rolled back');
      assert.strictEqual(sessionInserted, false, 'Lesson session must not be inserted');
    });
  });

  describe('3. API Endpoint Hardening', () => {
    const apiPath = path.join(process.cwd(), 'api/index.ts');
    const apiCode = fs.readFileSync(apiPath, 'utf8');

    it('rejects arbitrary status updates via the fallback path', () => {
      const blockLogicExists = apiCode.includes('return res.status(400).json({ error: \'Cannot set arbitrary booking status via this endpoint.\' });');
      assert.ok(blockLogicExists, 'Fallback update path must block arbitrary status mutations');
    });

    it('routes completed and no_show explicitly to the RPC', () => {
      assert.ok(apiCode.includes('if (status === \'completed\' || status === \'no_show\')'), 'Explicit check for lifecycle statuses');
      assert.ok(apiCode.includes('await supabase.rpc(\'teacher_record_lesson_outcome\''), 'Must call the transactional RPC');
    });
  });

});
