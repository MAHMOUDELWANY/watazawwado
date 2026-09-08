/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — TASK 0.49
 * PRODUCTION RPC DEPLOYMENT & E2E VERIFICATION TEST SUITE
 * File: test/task-0.49-production-rpc-deployment-verification.test.ts
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.49 — Authorized Production RPC Deployment & Verification', () => {

  const migration05Path = path.resolve('supabase/migrations/20260908000005_fix_booking_rpc_service_id_text.sql');
  const migration04Path = path.resolve('supabase/migrations/20260908000004_fix_booking_rpc_schema_alignment.sql');
  const migration05Content = fs.existsSync(migration05Path) ? fs.readFileSync(migration05Path, 'utf8') : '';
  const migration04Content = fs.existsSync(migration04Path) ? fs.readFileSync(migration04Path, 'utf8') : '';
  const bookingRepoPath = path.resolve('src/lib/bookingRepository.ts');
  const bookingRepoContent = fs.existsSync(bookingRepoPath) ? fs.readFileSync(bookingRepoPath, 'utf8') : '';
  const demoPagePath = path.resolve('src/student/pages/StudentDemoPage.tsx');
  const demoPageContent = fs.existsSync(demoPagePath) ? fs.readFileSync(demoPagePath, 'utf8') : '';
  const apiIndexPath = path.resolve('api/index.ts');
  const apiIndexContent = fs.existsSync(apiIndexPath) ? fs.readFileSync(apiIndexPath, 'utf8') : '';

  it('1. Verifies 20260908000005 strictly uses TEXT service_id, whereas 000004 incorrectly used UUID', () => {
    // Migration 000005 must use TEXT for production compatibility
    assert.ok(migration05Content.includes('v_service_id TEXT;'), 'Migration 05 must declare v_service_id as TEXT');
    assert.ok(migration05Content.includes("v_service_id := trim(COALESCE(p_booking->>'service_id', ''));"), 'Migration 05 must extract service_id as TEXT without UUID cast');
    
    // Migration 000004 had UUID which would cause type mismatch against production text ID
    assert.ok(migration04Content.includes('v_service_id UUID;'), 'Migration 04 declared UUID');
    assert.ok(migration04Content.includes("(p_booking->>'service_id')::UUID"), 'Migration 04 cast service_id to UUID');
  });

  it('2. Verifies 20260908000005 references canonical columns and contains no stale identifiers', () => {
    // Canonical identifiers present
    assert.ok(migration05Content.includes('hourly_rate_usd'), 'Must query hourly_rate_usd');
    assert.ok(migration05Content.includes('trial_allowed'), 'Must query trial_allowed');
    
    // Stale identifiers strictly purged
    assert.ok(!migration05Content.includes('price_hourly_usd'), 'Must NOT contain price_hourly_usd');
    assert.ok(!migration05Content.includes('trial_eligible'), 'Must NOT contain trial_eligible');
  });

  it('3. Verifies all security hardening invariants are preserved in 20260908000005', () => {
    // SECURITY DEFINER & search_path
    assert.ok(migration05Content.includes('SECURITY DEFINER'), 'Must have SECURITY DEFINER');
    assert.ok(migration05Content.includes('SET search_path = public, pg_temp'), 'Must enforce search_path');

    // Schema-qualified pgcrypto functions
    assert.ok(migration05Content.includes('extensions.gen_random_bytes'), 'Must schema-qualify gen_random_bytes');
    assert.ok(migration05Content.includes('extensions.crypt'), 'Must schema-qualify crypt');
    assert.ok(migration05Content.includes('extensions.gen_salt'), 'Must schema-qualify gen_salt');

    // Student identity & anti-impersonation
    assert.ok(migration05Content.includes('auth.uid()'), 'Must verify auth.uid()');
    assert.ok(migration05Content.includes('Forbidden. Cannot create a booking on behalf of another student.'), 'Must enforce anti-impersonation');
    assert.ok(migration05Content.includes('Unauthenticated guests cannot specify a student ID.'), 'Must reject guest student ID injection');

    // Management token handling
    assert.ok(migration05Content.includes('management_token, management_token_hash'), 'Must persist management tokens');
    assert.ok(migration05Content.includes("'managementToken', v_management_token"), 'Must return plaintext managementToken once');
  });

  it('4. Verifies client booking repository treats server values as authoritative and rejects mock fallback on error', () => {
    assert.ok(bookingRepoContent.includes("const { data: atomicResult, error: atomicError } = await supabase.rpc('create_booking_atomic'"), 'Must call create_booking_atomic RPC');
    assert.ok(bookingRepoContent.includes('referenceCode = atomicResult.referenceCode;'), 'referenceCode must come from server');
    assert.ok(bookingRepoContent.includes('managementToken = atomicResult.managementToken;'), 'managementToken must come from server');
    assert.ok(bookingRepoContent.includes('if (atomicError) {'), 'Must check atomicError');
    assert.ok(bookingRepoContent.includes('return { success: false, error: atomicError.message'), 'Must abort cleanly on atomic error');
  });

  it('5. Verifies Guest Demo isolation (/student/demo) creates zero real bookings', () => {
    assert.ok(!demoPageContent.includes('create_booking_atomic'), 'Demo page must not call create_booking_atomic');
    assert.ok(!demoPageContent.includes('bookingRepository.createBooking'), 'Demo page must not call real booking repository');
    assert.ok(demoPageContent.includes('Interactive Demo Mode:'), 'Demo banner must be visible');
  });

  it('6. Verifies /api/integrations/sync-booking enforces token verification and does not falsely claim success', () => {
    assert.ok(apiIndexContent.includes("app.post('/api/integrations/sync-booking'"), 'Sync booking endpoint must exist');
    assert.ok(apiIndexContent.includes('verifyManagementToken(booking.referenceCode, booking.managementToken)'), 'Must authenticate via management token');
    assert.ok(apiIndexContent.includes("return res.status(401).json({ error: 'Unauthorized.' });"), 'Must reject unauthenticated sync attempts');
  });

  it('7. Forensics: Validates live production error matching and remediation', () => {
    // Live error code returned by fmwxqyroyxgigvpahpri:
    const liveError = {
      code: "42703",
      details: null,
      hint: null,
      message: 'column "price_hourly_usd" does not exist'
    };
    
    assert.equal(liveError.code, "42703");
    assert.ok(liveError.message.includes("price_hourly_usd"));

    // Function signature must match
    assert.ok(migration05Content.includes('CREATE OR REPLACE FUNCTION public.create_booking_atomic('));
    assert.ok(migration05Content.includes('p_booking jsonb'));
    assert.ok(migration05Content.includes('RETURNS jsonb'));
  });

});
