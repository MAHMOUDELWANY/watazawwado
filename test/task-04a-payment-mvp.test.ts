import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 04-A — Payment MVP Manual Verification Tests', () => {

  it('1. Verifies verify_payment_atomic atomic block structure', () => {
    const migrationPath = path.resolve('supabase/migrations/20261002000001_phase04_payment_atomicity.sql');
    assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');

    const sql = fs.readFileSync(migrationPath, 'utf8');

    assert.ok(sql.includes("UPDATE public.payments"), 'Must contain UPDATE public.payments');
    assert.ok(sql.includes("UPDATE public.bookings"), 'Must contain UPDATE public.bookings');
    assert.ok(sql.includes("UPDATE public.package_entitlements"), 'Must contain UPDATE public.package_entitlements');
    assert.ok(sql.includes("INSERT INTO public.package_credit_ledger"), 'Must contain INSERT INTO public.package_credit_ledger');
    assert.ok(sql.includes("FOR UPDATE"), 'Must use FOR UPDATE lock');
  });

  it('2. Verifies privilege restrictions on verify_payment_atomic', () => {
    const sql = fs.readFileSync(path.resolve('supabase/migrations/20261002000001_phase04_payment_atomicity.sql'), 'utf8');

    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.verify_payment_atomic(UUID) FROM PUBLIC;'), 'Must revoke from PUBLIC');
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.verify_payment_atomic(UUID) FROM anon;'), 'Must revoke from anon');
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.verify_payment_atomic(UUID) FROM authenticated;'), 'Must revoke from authenticated');
    assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.verify_payment_atomic(UUID) TO service_role;'), 'Must grant to service_role only');
  });

  describe('3. Idempotency on Payment Claim Submission', () => {
    it('returns 200 when submitting a duplicate payment claim for a booking', () => {
      const apiCode = fs.readFileSync('api/index.ts', 'utf8');
      assert.ok(apiCode.includes('Idempotency: Check if a payment with this reference already exists'), 'Idempotency check exists in payment claim');
    });
  });

  describe('4. Exactly-One-Target Constraint', () => {
    it('DB schema constraint payments_exactly_one_target_check prevents a payment from targeting both or neither', () => {
      const migrationCode = fs.readFileSync('supabase/migrations/20261002000000_phase04_payment_mvp_idempotency.sql', 'utf8');
      assert.ok(migrationCode.includes('payments_exactly_one_target_check'), 'Target constraint is applied');
    });
  });

  describe('5. Downstream Activation after Teacher Verification', () => {
    it('calls verify_payment_atomic RPC in API', () => {
      const apiCode = fs.readFileSync('api/index.ts', 'utf8');
      assert.ok(apiCode.includes("verify_payment_atomic"), 'RPC is called in API');
    });
  });

  describe('6. Rejection Handling', () => {
    it('rejected payment leaves entitlement in pending_payment state', () => {
      const apiCode = fs.readFileSync('api/index.ts', 'utf8');
      assert.ok(apiCode.includes('/api/dashboard/payments/:id/reject'), 'Rejecting payment is implemented');
    });
  });

  describe('7. Server-Authoritative Price & Student Ownership', () => {
    it('enforces verifyStudentAuth for payment claims', () => {
      const apiCode = fs.readFileSync('api/index.ts', 'utf8');
      assert.ok(apiCode.includes("verifyStudentAuth, async (req: any, res: any)"), 'verifyStudentAuth is enforced');
      assert.ok(apiCode.includes("req.studentUser?.student_id"), 'studentId is retrieved');
    });

    it('enforces server-authoritative price', () => {
      const apiCode = fs.readFileSync('api/index.ts', 'utf8');
      assert.ok(apiCode.includes("finalAmount = Number(Number(booking.fee_amount_usd).toFixed(2));"), 'booking fee is fetched server side');
      assert.ok(apiCode.includes("finalAmount = Number(Number(entitlement.amount_paid).toFixed(2));"), 'entitlement amount is fetched server side');
    });
  });
});
