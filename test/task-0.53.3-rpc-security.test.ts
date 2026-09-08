import assert from 'node:assert';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.53.3: Teacher Lifecycle RPC Security Hardening', () => {
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260908000009_teacher_lifecycle_security_hardening.sql');
  let sql = '';

  it('Migration file should exist', () => {
    assert.ok(fs.existsSync(migrationPath), 'Migration file not found');
    sql = fs.readFileSync(migrationPath, 'utf8');
  });

  it('Should revoke EXECUTE from PUBLIC on teacher_cancel_booking', () => {
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_cancel_booking(UUID, TEXT, TEXT) FROM PUBLIC;'), 'Missing REVOKE FROM PUBLIC on cancel');
  });

  it('Should revoke EXECUTE from anon on teacher_cancel_booking', () => {
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_cancel_booking(UUID, TEXT, TEXT) FROM anon;'), 'Missing REVOKE FROM anon on cancel');
  });

  it('Should revoke EXECUTE from authenticated on teacher_cancel_booking', () => {
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_cancel_booking(UUID, TEXT, TEXT) FROM authenticated;'), 'Missing REVOKE FROM authenticated on cancel');
  });

  it('Should grant EXECUTE to service_role on teacher_cancel_booking', () => {
    assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.teacher_cancel_booking(UUID, TEXT, TEXT) TO service_role;'), 'Missing GRANT TO service_role on cancel');
  });

  it('Should revoke EXECUTE from PUBLIC on teacher_reschedule_booking', () => {
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_reschedule_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC;'), 'Missing REVOKE FROM PUBLIC on reschedule');
  });

  it('Should revoke EXECUTE from anon on teacher_reschedule_booking', () => {
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_reschedule_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) FROM anon;'), 'Missing REVOKE FROM anon on reschedule');
  });

  it('Should revoke EXECUTE from authenticated on teacher_reschedule_booking', () => {
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_reschedule_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) FROM authenticated;'), 'Missing REVOKE FROM authenticated on reschedule');
  });

  it('Should grant EXECUTE to service_role on teacher_reschedule_booking', () => {
    assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.teacher_reschedule_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO service_role;'), 'Missing GRANT TO service_role on reschedule');
  });
});
