/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — TASK 0.47
 * PRODUCTION RPC SCHEMA RECONCILIATION TESTS
 * File: test/task-0.47-production-rpc-schema-reconciliation.test.ts
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.47 — Production Booking RPC Type/Schema Reconciliation', () => {

  const migrationPath = path.resolve('supabase/migrations/20260908000005_fix_booking_rpc_service_id_text.sql');
  const migrationContent = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

  it('1. Verifies 20260908000005 migration uses canonical columns hourly_rate_usd and trial_allowed', () => {
    assert.ok(migrationContent.includes('hourly_rate_usd'), 'Canonical column hourly_rate_usd must be used');
    assert.ok(migrationContent.includes('trial_allowed'), 'Canonical column trial_allowed must be used');

    // Ensure deprecated columns are completely removed from the migration
    assert.ok(!migrationContent.includes('price_hourly_usd'), 'Deprecated column price_hourly_usd must NOT exist in active migration');
    assert.ok(!migrationContent.includes('trial_eligible'), 'Deprecated column trial_eligible must NOT exist in active migration');
  });

  it('2. Verifies v_service_id is declared as TEXT', () => {
    // Ensures text = uuid mismatch is prevented
    assert.ok(migrationContent.match(/v_service_id\s+TEXT;/i), 'v_service_id must be declared as TEXT for Production compatibility');
    assert.ok(!migrationContent.match(/v_service_id\s+UUID;/i), 'v_service_id must NOT be declared as UUID');
  });

  it('3. Verifies v_service_id is extracted without UUID casting', () => {
    assert.ok(
      migrationContent.includes("v_service_id := trim(COALESCE(p_booking->>'service_id', ''));") || 
      migrationContent.includes("v_service_id := COALESCE(p_booking->>'service_id', '');"),
      'v_service_id extraction must not cast to UUID'
    );
    assert.ok(!migrationContent.includes("v_service_id := (p_booking->>'service_id')::UUID;"), 'Must avoid UUID casting');
  });

  it('4. Verifies management_token and management_token_hash remain inserted', () => {
    assert.ok(migrationContent.includes('management_token, management_token_hash'), 'Insert must contain management_token');
    assert.ok(migrationContent.includes('v_management_token, v_management_token_hash'), 'Insert must contain token variables');
  });

  it('5. Verifies pgcrypto calls are schema-qualified with extensions.', () => {
    assert.ok(migrationContent.includes('extensions.gen_random_bytes'), 'pgcrypto calls must use extensions.gen_random_bytes');
    assert.ok(migrationContent.includes('extensions.crypt'), 'pgcrypto calls must use extensions.crypt');
    assert.ok(migrationContent.includes('extensions.gen_salt'), 'pgcrypto calls must use extensions.gen_salt');
  });

  it('6. Verifies authenticated student ownership logic remains present', () => {
    assert.ok(migrationContent.includes('IF auth.uid() IS NOT NULL THEN'), 'Must check auth.uid()');
    assert.ok(migrationContent.includes('WHERE auth_user_id = auth.uid()'), 'Must resolve student via auth_user_id');
    assert.ok(migrationContent.includes('Cannot create a booking on behalf of another student.'), 'Must prevent impersonation');
  });

  it('7. Verifies guest student_id rejection remains present', () => {
    assert.ok(migrationContent.includes('Unauthenticated guests cannot specify a student ID.'), 'Must reject supplied student_id for guests');
    assert.ok(migrationContent.includes('v_student_id := NULL;'), 'Guest student_id must default to NULL');
  });

});
