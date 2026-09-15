import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.58-H: Teacher Lifecycle Authorization & Transition Hardening', () => {

  const rpcPath = path.join(process.cwd(), 'supabase/migrations/20260914000002_teacher_lifecycle_rpc_privilege.sql');
  const rpcSql = fs.readFileSync(rpcPath, 'utf8');
  
  const apiPath = path.join(process.cwd(), 'api/index.ts');
  const apiCode = fs.readFileSync(apiPath, 'utf8');

  describe('1. RPC Authorization Checks', () => {
    it('revokes execution from PUBLIC', () => {
      assert.ok(rpcSql.includes('REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;'), 'Must revoke from PUBLIC');
    });

    it('revokes execution from authenticated', () => {
      assert.ok(rpcSql.includes('REVOKE EXECUTE ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT) FROM authenticated;'), 'Must revoke from authenticated');
    });

    it('grants execution ONLY to service_role', () => {
      assert.ok(rpcSql.includes('GRANT EXECUTE ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;'), 'Must grant to service_role');
      assert.ok(!rpcSql.match(/GRANT EXECUTE .* TO authenticated/), 'Must NOT grant to authenticated');
    });
  });

  describe('2. RPC Strict Transition Contract', () => {
    it('enforces only confirmed or rescheduled as valid starting states for outcome', () => {
      assert.ok(rpcSql.includes('IF v_booking.status NOT IN (\'confirmed\', \'rescheduled\') THEN'), 'Strict starting state check');
      assert.ok(rpcSql.includes('RAISE EXCEPTION \'Cannot record outcome for booking in % status.\''), 'Rejects other starting states explicitly');
    });

    it('preserves idempotency behavior for repeated completed / no_show requests', () => {
      assert.ok(rpcSql.includes('IF v_booking.status = p_outcome THEN'), 'Idempotency check exists');
      assert.ok(rpcSql.includes('\'isIdempotent\', true'), 'Idempotent return signature exists');
    });
  });

  describe('3. API Generic PATCH Protection', () => {
    it('enforces strict transition validStatuses list avoiding arbitrary statuses', () => {
      assert.ok(apiCode.includes('const validTransitions = [\'completed\', \'no_show\', \'cancelled\'];'), 'Valid transitions must only be lifecycle/cancellation');
    });

    it('rejects arbitrary status transitions inside validateTeacherLifecycleTransition', () => {
      assert.ok(apiCode.includes('if (!validTransitions.includes(newStatus) && newStatus !== existingBooking.status) {'), 'Must check against strict transition list');
      assert.ok(apiCode.includes('error: `Invalid status transition: ${newStatus}`'), 'Must return 400 error for arbitrary transition');
    });
  });
});
