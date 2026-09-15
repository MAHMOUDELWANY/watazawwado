/**
 * ====================================================================
 * WATAZAWWADO — TASK 0.58-I HARNESS SELF-TEST SUITE
 * File: test/task-0.58-i-harness.test.ts
 *
 * Verifies that the manual production verification harness:
 * 1. Contains all required gates A through L in its registry.
 * 2. Has real executable functions for every gate (no placeholders).
 * 3. Does not contain assert.ok(true) or fake-passing branches.
 * 4. Fails closed / produces UNVERIFIED when credentials are missing.
 * 5. Strictly conforms to exit code semantics (0=PASS, 1=FAIL, 2=UNVERIFIED).
 * 6. Hardened against false-proof patterns:
 *    - Gate G does NOT use invalid booking rollback.
 *    - Gate H does NOT only check HTTP status.
 *    - Gate I does NOT only check response status / count.
 *    - Gate K is NOT only a bookings GET request labeled E2E.
 *    - Gate L tests both read AND mutation isolation with snapshot equality.
 *    - Gate B (B5) tests client-supplied forged teacher ID behavior.
 *    - Gates C/D/E enforce strict fixture state validation.
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  GATE_REGISTRY,
  validatePreflight,
  calculateExitCode,
  runAllGates,
  isPlaceholder,
  VerificationContext,
  VerificationResult,
  runGateA,
  runGateB,
  runGateC,
  runGateD,
  runGateE,
  runGateF,
  runGateG,
  runGateH,
  runGateI,
  runGateJ,
  runGateK,
  runGateL,
} from './manual/task-0.58-i-production-verification.js';

describe('Task 0.58-I Verification Harness Integrity & Anti-False-Proof Suite', () => {
  const harnessPath = path.resolve('test/manual/task-0.58-i-production-verification.ts');
  const harnessSource = fs.readFileSync(harnessPath, 'utf8');

  it('1. Verifies Gate Registry includes all 12 required gates A through L', () => {
    assert.equal(GATE_REGISTRY.length, 12, 'Must have exactly 12 registered gates');

    const expectedGateIds = [
      'Gate A', 'Gate B', 'Gate C', 'Gate D',
      'Gate E', 'Gate F', 'Gate G', 'Gate H',
      'Gate I', 'Gate J', 'Gate K', 'Gate L',
    ];

    const actualGateIds = GATE_REGISTRY.map(g => g.id);
    for (const id of expectedGateIds) {
      assert.ok(actualGateIds.includes(id), `Registry must contain ${id}`);
    }
  });

  it('2. Verifies each registered gate has an executable function', () => {
    for (const gate of GATE_REGISTRY) {
      assert.equal(typeof gate.run, 'function', `Gate ${gate.id} run property must be an executable function`);
      assert.ok(gate.name && gate.name.length > 0, `Gate ${gate.id} must have a non-empty name`);
      assert.ok(gate.layer && gate.layer.length > 0, `Gate ${gate.id} must specify an architectural layer`);
    }
  });

  it('3. Verifies no placeholder assert.ok(true) exists in the harness implementation', () => {
    assert.ok(
      !harnessSource.includes('assert.ok(true)'),
      'Harness must not contain assert.ok(true) placeholder tautologies'
    );
  });

  it('4. Verifies no fake NOT RUN or simulated success branch converts unrun tests to PASS', () => {
    assert.ok(
      !harnessSource.includes("status: 'PASS' // NOT RUN"),
      'Harness must not manufacture fake PASS status'
    );
    assert.ok(
      !harnessSource.includes("status = 'PASS' /* skipped */"),
      'Harness must not silently turn skipped checks into PASS'
    );
  });

  it('5. Verifies placeholder detection identifies dummy credentials', () => {
    assert.equal(isPlaceholder('your-service-role-key'), true);
    assert.equal(isPlaceholder('https://your-project.supabase.co'), true);
    assert.equal(isPlaceholder('example.com'), true);
    assert.equal(isPlaceholder(''), true);
    assert.equal(isPlaceholder(undefined), true);
    assert.equal(isPlaceholder('dev-teacher-token'), true);

    // Legitimate long tokens/strings should not be flagged as placeholder
    assert.equal(isPlaceholder('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid_token_string_here_long_enough'), false);
  });

  it('6. Verifies missing/placeholder credentials fail preflight validation', () => {
    const emptyCtx: VerificationContext = {
      supabaseUrl: '',
      serviceRoleKey: '',
      databaseUrl: '',
      teacherToken: '',
      studentToken: '',
      testBookingConfirmedId: '',
    };

    const preflight = validatePreflight(emptyCtx);
    assert.equal(preflight.isConfigured, false, 'Preflight must report not configured when items are missing');
    assert.ok(preflight.missingItems.length >= 6, 'Preflight must identify all missing items');
  });

  it('7. Verifies exit code semantics: 0=All PASS, 1=Any FAIL, 2=Any UNVERIFIED (none FAIL)', () => {
    const allPass: VerificationResult[] = [
      { gate: 'Gate A', name: 'A', layer: 'L1', status: 'PASS', evidence: [], errors: [] },
      { gate: 'Gate B', name: 'B', layer: 'L2', status: 'PASS', evidence: [], errors: [] },
    ];
    assert.equal(calculateExitCode(allPass), 0, 'Exit code must be 0 when all gates PASS');

    const oneFail: VerificationResult[] = [
      { gate: 'Gate A', name: 'A', layer: 'L1', status: 'PASS', evidence: [], errors: [] },
      { gate: 'Gate B', name: 'B', layer: 'L2', status: 'FAIL', evidence: [], errors: ['Error'] },
    ];
    assert.equal(calculateExitCode(oneFail), 1, 'Exit code must be 1 when any gate FAILS');

    const unverified: VerificationResult[] = [
      { gate: 'Gate A', name: 'A', layer: 'L1', status: 'UNVERIFIED', evidence: [], errors: ['Blocked'] },
      { gate: 'Gate B', name: 'B', layer: 'L2', status: 'PASS', evidence: [], errors: [] },
    ];
    assert.equal(calculateExitCode(unverified), 2, 'Exit code must be 2 when a gate is UNVERIFIED without failure');

    const failAndUnverified: VerificationResult[] = [
      { gate: 'Gate A', name: 'A', layer: 'L1', status: 'UNVERIFIED', evidence: [], errors: ['Blocked'] },
      { gate: 'Gate B', name: 'B', layer: 'L2', status: 'FAIL', evidence: [], errors: ['Error'] },
    ];
    assert.equal(calculateExitCode(failAndUnverified), 1, 'Exit code must prioritize FAIL (1) over UNVERIFIED (2)');
  });

  it('8. Verifies executing all gates with unconfigured context yields UNVERIFIED, never false PASS', async () => {
    const emptyCtx: VerificationContext = {
      supabaseUrl: '',
      serviceRoleKey: '',
      databaseUrl: '',
      appUrl: 'http://localhost:3000',
      teacherToken: '',
      studentToken: '',
      testBookingConfirmedId: '',
    };

    const results = await runAllGates(emptyCtx);
    assert.equal(results.length, 12, 'Must return results for all 12 gates');

    for (const r of results) {
      assert.ok(
        r.status === 'UNVERIFIED' || r.status === 'FAIL',
        `Gate ${r.gate} must be UNVERIFIED or FAIL when credentials are absent, got ${r.status}`
      );
      assert.notEqual(r.status, 'PASS', `Gate ${r.gate} must never falsely PASS without credentials`);

      // Verify schema
      assert.ok(r.gate, 'Result must have gate');
      assert.ok(r.name, 'Result must have name');
      assert.ok(r.layer, 'Result must have layer');
      assert.ok(Array.isArray(r.evidence), 'Result must have evidence array');
      assert.ok(Array.isArray(r.errors), 'Result must have errors array');
    }
  });

  it('9. Anti-False-Proof Check: Gate G does NOT use dummy/invalid booking rollback as proof', () => {
    // Gate G must not rely on 00000000-0000-0000-0000-000000000000 or fake rollback
    assert.ok(
      !harnessSource.includes("runGateG") || !harnessSource.includes("'00000000-0000-0000-0000-000000000000'::uuid"),
      'Gate G must not use a dummy UUID to fake atomicity'
    );
    // Must test atomicity of booking mutation + lesson_sessions insert
    assert.ok(
      harnessSource.includes('lesson_sessions') && harnessSource.includes('Atomicity VIOLATION'),
      'Gate G must verify that lesson_session failure rolls back booking mutation'
    );
  });

  it('10. Anti-False-Proof Check: Gate H does NOT only check HTTP 200 statuses', () => {
    // Must assert lesson_session_count and identical session ID across repeated calls
    assert.ok(
      harnessSource.includes('lesson_session_count !== 1') &&
      harnessSource.includes('Duplicate lesson_session created'),
      'Gate H must verify lesson_session count and reject duplicate session creation'
    );
    assert.ok(
      harnessSource.includes('lesson_session_ids[0] !== originalSessionId') ||
      harnessSource.includes('Lesson session ID mutated'),
      'Gate H must verify session ID determinism and continuity'
    );
  });

  it('11. Anti-False-Proof Check: Gate I does NOT only check response status / count', () => {
    // Must verify overlapping in-flight execution and query persisted state
    assert.ok(
      harnessSource.includes('Promise.all([p1, p2])'),
      'Gate I must execute concurrent requests with Promise.all'
    );
    assert.ok(
      harnessSource.includes('lesson_session_count !== 1') &&
      harnessSource.includes('Concurrency RACE CONDITION FAILURE'),
      'Gate I must verify no race condition duplicate lesson sessions in persisted database state'
    );
  });

  it('12. Anti-False-Proof Check: Gate K is NOT a simple bookings GET request labeled E2E', () => {
    // Must separate K1 business rules, K2 browser workflow, and K3 children
    assert.ok(
      harnessSource.includes('findLastEligibleBooking') &&
      harnessSource.includes('K1 Business Rule'),
      'Gate K must test business rule K1 using findLastEligibleBooking'
    );
    assert.ok(
      harnessSource.includes('K2 Browser UI workflow: UNVERIFIED') ||
      harnessSource.includes('K2 Browser UI portion'),
      'Gate K must explicitly separate API business logic from UI browser workflow'
    );
    assert.ok(
      harnessSource.includes('K3 child-selection subcase') ||
      harnessSource.includes('K3 Child authorization'),
      'Gate K must explicitly handle guardian/child selection vs self-learning'
    );
  });

  it('13. Anti-False-Proof Check: Gate L tests both read AND mutation isolation with snapshot comparison', () => {
    // Must test L1 profile read, L2 booking read, L3 booking mutation, L4 snapshot equality
    assert.ok(harnessSource.includes('L1 Student A reads Student B profile'), 'Gate L must test L1 profile read isolation');
    assert.ok(harnessSource.includes('L2 Student A reads Student B booking'), 'Gate L must test L2 booking read isolation');
    assert.ok(harnessSource.includes('L3 Student A mutates Student B booking'), 'Gate L must test L3 booking mutation isolation');
    assert.ok(
      harnessSource.includes('L4 Invariant proven: Student B data completely unaffected') ||
      harnessSource.includes('assertSnapshotsEqual'),
      'Gate L must take before/after snapshots of Student B data to assert no corruption'
    );
    assert.ok(harnessSource.includes('L5 Student -> Teacher lifecycle'), 'Gate L must test L5 student -> teacher restriction');
    assert.ok(harnessSource.includes('L6 Guest -> Student endpoint'), 'Gate L must test L6 guest -> student restriction');
    assert.ok(harnessSource.includes('L7 Guest -> Teacher endpoint'), 'Gate L must test L7 guest -> teacher restriction');
  });

  it('14. Anti-False-Proof Check: Gate B (B5) tests client-supplied forged teacher identity', () => {
    assert.ok(
      harnessSource.includes('B5 Unauthorized client-forged teacher_id') &&
      harnessSource.includes('B5 Authenticated request with foreign teacher_id body'),
      'Gate B must explicitly assert B5 client-forged teacher identity behavior'
    );
  });

  it('15. Anti-False-Proof Check: Gates C, D, E enforce strict fixture state validation', () => {
    assert.ok(
      harnessSource.includes('validateBookingFixture'),
      'Harness must define and use validateBookingFixture'
    );
    assert.ok(
      harnessSource.includes('Real customer bookings MUST NEVER be mutated as test fixtures'),
      'Harness must enforce safety check preventing mutation of real customer bookings'
    );
    assert.ok(
      harnessSource.includes('Silently mutating fixture state into required state is forbidden'),
      'Harness must forbid silently mutating fixture into required state'
    );
  });

  it('16. Source audit: Verifies migration SQL preserves SECURITY DEFINER and privilege revocation', () => {
    const rpcMigrationPath = path.resolve('supabase/migrations/20260914000001_teacher_lifecycle_outcome_rpc.sql');
    const privMigrationPath = path.resolve('supabase/migrations/20260914000002_teacher_lifecycle_rpc_privilege.sql');

    const rpcContent = fs.readFileSync(rpcMigrationPath, 'utf8');
    assert.ok(rpcContent.includes('SECURITY DEFINER'), 'RPC migration must specify SECURITY DEFINER');
    assert.ok(rpcContent.includes('SET search_path = public, pg_temp'), 'RPC migration must lock search_path');

    const privContent = fs.readFileSync(privMigrationPath, 'utf8');
    assert.ok(privContent.includes('REVOKE EXECUTE ON FUNCTION public.teacher_record_lesson_outcome'), 'Must revoke execute from public');
    assert.ok(privContent.includes('GRANT EXECUTE ON FUNCTION public.teacher_record_lesson_outcome') && privContent.includes('service_role'), 'Must grant execute only to service_role');
  });

  it('17. Source audit: Verifies API generic PATCH endpoint blocks arbitrary status manipulation', () => {
    const apiIndexPath = path.resolve('api/index.ts');
    const apiContent = fs.readFileSync(apiIndexPath, 'utf8');

    assert.ok(
      apiContent.includes('Cannot set arbitrary booking status via this endpoint.'),
      'api/index.ts must explicitly block arbitrary status modification in generic PATCH'
    );
  });
});
