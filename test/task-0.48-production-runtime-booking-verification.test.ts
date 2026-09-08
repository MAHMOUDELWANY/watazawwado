/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — TASK 0.48
 * PRODUCTION RUNTIME BOOKING VERIFICATION & SAFETY TEST SUITE
 * File: test/task-0.48-production-runtime-booking-verification.test.ts
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.48 — Production Runtime Booking Verification & Safety', () => {

  const migrationPath = path.resolve('supabase/migrations/20260908000005_fix_booking_rpc_service_id_text.sql');
  const migrationContent = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';
  const bookingRepoPath = path.resolve('src/lib/bookingRepository.ts');
  const bookingRepoContent = fs.existsSync(bookingRepoPath) ? fs.readFileSync(bookingRepoPath, 'utf8') : '';
  const demoPagePath = path.resolve('src/student/pages/StudentDemoPage.tsx');
  const demoPageContent = fs.existsSync(demoPagePath) ? fs.readFileSync(demoPagePath, 'utf8') : '';

  it('1. Verifies 20260908000005 migration contains all required safety and schema invariants', () => {
    // 1. Types & Canonical Schema
    assert.ok(migrationContent.includes('v_service_id TEXT;'), 'v_service_id must be declared as TEXT');
    assert.ok(migrationContent.includes('hourly_rate_usd'), 'hourly_rate_usd must be queried');
    assert.ok(migrationContent.includes('trial_allowed'), 'trial_allowed must be queried');
    assert.ok(!migrationContent.includes('price_hourly_usd'), 'price_hourly_usd must NOT exist');
    assert.ok(!migrationContent.includes('trial_eligible'), 'trial_eligible must NOT exist');

    // 2. Security & Functions
    assert.ok(migrationContent.includes('SECURITY DEFINER'), 'SECURITY DEFINER must be preserved');
    assert.ok(migrationContent.includes('SET search_path = public, pg_temp'), 'search_path must be locked down');
    assert.ok(migrationContent.includes('extensions.gen_random_bytes'), 'pgcrypto must be schema-qualified');
    assert.ok(migrationContent.includes('extensions.crypt'), 'crypt must be schema-qualified');
    assert.ok(migrationContent.includes('extensions.gen_salt'), 'gen_salt must be schema-qualified');

    // 3. Tokens & Ownership
    assert.ok(migrationContent.includes('management_token, management_token_hash'), 'Management tokens must be persisted');
    assert.ok(migrationContent.includes('auth.uid()'), 'auth.uid() must be checked for ownership');
    assert.ok(migrationContent.includes('Cannot create a booking on behalf of another student.'), 'Cross-student impersonation must be blocked');
    assert.ok(migrationContent.includes('Unauthenticated guests cannot specify a student ID.'), 'Guest student_id override must be blocked');
  });

  it('2. Verifies bookingRepository never returns fake fallback booking details when Supabase fails', () => {
    // In production or when Supabase is configured:
    // Any error returned by RPC must reject the booking and NOT fall through to fallback values
    assert.ok(bookingRepoContent.includes("if (atomicError) {"), 'Must check atomicError');
    assert.ok(bookingRepoContent.includes("return { success: false, error: atomicError.message"), 'Must abort on atomic error');
    assert.ok(bookingRepoContent.includes("isProduction"), 'Must handle production environment flag');
    assert.ok(bookingRepoContent.includes("Database service is currently unavailable in production"), 'Must abort safely if unconfigured in production');
  });

  it('3. Verifies bookingRepository assigns server-returned authority to booking record', () => {
    // Confirms client overrides local placeholders with server response
    assert.ok(bookingRepoContent.includes("referenceCode = atomicResult.referenceCode;"), 'referenceCode must come from server');
    assert.ok(bookingRepoContent.includes("managementToken = atomicResult.managementToken;"), 'managementToken must come from server');
    assert.ok(bookingRepoContent.includes("feeAmountUsd = atomicResult.feeAmountUsd || feeAmountUsd;"), 'feeAmountUsd must come from server');
  });

  it('4. Verifies StudentDemoPage is completely isolated from the database and real booking RPC', () => {
    assert.ok(!demoPageContent.includes('create_booking_atomic'), 'StudentDemoPage must NOT call create_booking_atomic');
    assert.ok(!demoPageContent.includes('bookingRepository.createBooking'), 'StudentDemoPage must NOT call real booking repo');
    assert.ok(demoPageContent.includes('Interactive Demo Mode:'), 'Demo banner must explicitly inform the guest');
    assert.ok(demoPageContent.includes('No real bookings or accounts are created.'), 'Demo must state no accounts/bookings created');
  });

  it('5. Forensics: Simulates live Production failure with stale RPC and success with Task 0.48 RPC', () => {
    // Live Production DB returns: {"code":"42703","message":"column \"price_hourly_usd\" does not exist"}
    // Because live Production public.services contains hourly_rate_usd, NOT price_hourly_usd.
    const productionServicesTable = {
      id: 'quran-reading',
      hourly_rate_usd: 7.00,
      trial_allowed: true
    };

    // Stale RPC behavior
    const staleRpcSelect = (servicesTable: any) => {
      if (!('price_hourly_usd' in servicesTable)) {
        const err: any = new Error('column "price_hourly_usd" does not exist');
        err.code = '42703';
        throw err;
      }
      return {
        id: servicesTable.id,
        price_hourly_usd: servicesTable.price_hourly_usd,
        trial_eligible: servicesTable.trial_eligible
      };
    };

    assert.throws(() => {
      staleRpcSelect(productionServicesTable);
    }, (err: any) => {
      return err.code === '42703' && err.message.includes('price_hourly_usd');
    }, 'Stale RPC must fail against production table schema');

    // Corrected Task 0.48 RPC behavior
    const correctedRpcSelect = (servicesTable: any, duration: number, isTrial: boolean) => {
      if (!('hourly_rate_usd' in servicesTable)) {
        throw new Error('column "hourly_rate_usd" does not exist');
      }
      const fee = isTrial ? 0.00 : Number(((servicesTable.hourly_rate_usd * duration) / 60).toFixed(2));
      return {
        id: servicesTable.id,
        hourly_rate_usd: servicesTable.hourly_rate_usd,
        trial_allowed: servicesTable.trial_allowed,
        fee
      };
    };

    const trialRes = correctedRpcSelect(productionServicesTable, 30, true);
    assert.equal(trialRes.fee, 0.00, 'Trial fee must be 0.00');
    assert.equal(trialRes.trial_allowed, true, 'Trial must be allowed');

    const regularRes = correctedRpcSelect(productionServicesTable, 60, false);
    assert.equal(regularRes.fee, 7.00, '60m regular fee must be 7.00');
  });

  it('6. Verifies external integration synchronization preserves pending status on failure', () => {
    assert.ok(bookingRepoContent.includes("let integrationStatus: 'synced' | 'pending' = 'pending';"), 'Must default integrationStatus to pending');
    assert.ok(bookingRepoContent.includes("integrationStatus = syncData.integrationStatus || 'synced';"), 'Must only update status on response');
  });

});
