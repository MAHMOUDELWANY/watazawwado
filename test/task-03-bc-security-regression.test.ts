import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 03-B/C — Security and Accounting Regression', () => {

  it('1. Verifies activate_package_entitlement_atomic loop for grant accounting', () => {
    const migrationPath = path.resolve('supabase/migrations/20261001000001_phase03_bc_security_and_accounting_fixes.sql');
    assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');

    const sql = fs.readFileSync(migrationPath, 'utf8');

    assert.ok(sql.includes('FOR i IN 1..v_entitlement.purchased_quantity LOOP'), 'Must contain FOR loop for individual credit grant inserts');
    assert.ok(sql.includes("delta_credits,\n            idempotency_key\n        ) VALUES (\n            p_entitlement_id,\n            v_entitlement.learner_student_id,\n            'grant',\n            1,"), 'delta_credits must be 1 inside the loop to satisfy the check constraint');
  });

  it('2. Verifies privilege restrictions on activate_package_entitlement_atomic', () => {
    const sql = fs.readFileSync(path.resolve('supabase/migrations/20261001000001_phase03_bc_security_and_accounting_fixes.sql'), 'utf8');

    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.activate_package_entitlement_atomic(UUID, TEXT) FROM PUBLIC;'), 'Must revoke from PUBLIC');
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.activate_package_entitlement_atomic(UUID, TEXT) FROM anon;'), 'Must revoke from anon');
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.activate_package_entitlement_atomic(UUID, TEXT) FROM authenticated;'), 'Must revoke from authenticated');
    assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.activate_package_entitlement_atomic(UUID, TEXT) TO service_role;'), 'Must grant to service_role only');
  });

  it('3. Verifies privilege restrictions on create_package_entitlement_atomic', () => {
    const sql = fs.readFileSync(path.resolve('supabase/migrations/20261001000001_phase03_bc_security_and_accounting_fixes.sql'), 'utf8');

    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.create_package_entitlement_atomic(UUID, UUID) FROM PUBLIC;'), 'Must revoke from PUBLIC');
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.create_package_entitlement_atomic(UUID, UUID) FROM anon;'), 'Must revoke from anon');
    assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.create_package_entitlement_atomic(UUID, UUID) TO authenticated;'), 'Must grant to authenticated');
  });

  it('4. Verifies create_booking_atomic package ownership boundaries', () => {
    const sql = fs.readFileSync(path.resolve('supabase/migrations/20261001000001_phase03_bc_security_and_accounting_fixes.sql'), 'utf8');

    assert.ok(sql.includes("IF auth.uid() IS NULL THEN"), 'Must prevent unauthenticated guests from using entitlements');
    assert.ok(sql.includes("IF v_entitlement.purchaser_account_id != auth.uid() AND v_is_teacher = false THEN"), 'Must strictly enforce cross-account usage boundaries');
    assert.ok(sql.includes("IF v_entitlement.learner_student_id IS NOT NULL AND v_entitlement.learner_student_id != v_student_id THEN"), 'Must match explicit learner on entitlement');
  });

  it('5. Verifies teacher_record_lesson_outcome authorization', () => {
    const sql = fs.readFileSync(path.resolve('supabase/migrations/20261001000001_phase03_bc_security_and_accounting_fixes.sql'), 'utf8');

    assert.ok(sql.includes("IF auth.role() = 'authenticated' AND auth.uid() != p_teacher_id THEN"), 'Must explicitly check auth.role and auth.uid to prevent impersonation');
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;'), 'Must revoke from PUBLIC');
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM anon;'), 'Must revoke from anon');
  });

});
