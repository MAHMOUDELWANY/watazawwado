/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — INTEGRATION & TIMEZONE TEST SUITE
 * File: src/lib/integrationMatrix.test.ts
 * Purpose: Deterministic validation of Timezone Engine, Policy checks,
 *          and Scheduling calculations.
 * ====================================================================
 */

import {
  calculateUtcTimes,
  check3HourPolicyEligibility,
  runTimezoneMatrixAudit,
  getDualDisplayTimes
} from './timezone';

export function runComprehensiveIntegrationTests(): {
  total: number;
  passed: number;
  failed: number;
  results: { testName: string; passed: boolean; details?: string }[];
} {
  const results: { testName: string; passed: boolean; details?: string }[] = [];

  function assert(name: string, condition: boolean, details?: string) {
    results.push({ testName: name, passed: condition, details });
  }

  // 1. Timezone Matrix Generation Test
  try {
    const matrix = runTimezoneMatrixAudit('2026-07-15T14:00:00Z');
    assert('Timezone Matrix Audit Generates All 9 Core Regions', matrix.length === 9);
    
    const toronto = matrix.find((m) => m.timezone === 'America/Toronto');
    assert('Toronto Summer DST is properly detected (EDT)', toronto !== undefined && toronto.isDstActive);
    
    const cairo = matrix.find((m) => m.timezone === 'Africa/Cairo');
    assert('Cairo time reflects Africa/Cairo', cairo !== undefined && cairo.cairoTime.includes('Cairo'));
  } catch (err: any) {
    assert('Timezone Matrix Audit Run', false, err?.message);
  }

  // 2. UTC Start & End Computation
  try {
    const times30 = calculateUtcTimes('2026-09-10', '15:30', 'America/New_York', 30);
    assert('30-min duration end is exactly 30 mins after start', 
      new Date(times30.scheduledEndUtc).getTime() - new Date(times30.scheduledStartUtc).getTime() === 30 * 60 * 1000
    );

    const times45 = calculateUtcTimes('2026-09-10', '10:00', 'Europe/London', 45);
    assert('45-min duration end is exactly 45 mins after start', 
      new Date(times45.scheduledEndUtc).getTime() - new Date(times45.scheduledStartUtc).getTime() === 45 * 60 * 1000
    );

    const times60 = calculateUtcTimes('2026-09-10', '19:00', 'Australia/Sydney', 60);
    assert('60-min duration end is exactly 60 mins after start', 
      new Date(times60.scheduledEndUtc).getTime() - new Date(times60.scheduledStartUtc).getTime() === 60 * 60 * 1000
    );
  } catch (err: any) {
    assert('UTC Calculations', false, err?.message);
  }

  // 3. 3-Hour Cancellation / Rescheduling Policy (Master Spec Section 21)
  try {
    const now = Date.now();
    
    // 5 hours from now -> Must be eligible
    const eligible5h = new Date(now + 5 * 3600 * 1000).toISOString();
    const result5h = check3HourPolicyEligibility(eligible5h);
    assert('Lesson in 5 hours is eligible for self-service action', result5h.eligible === true);

    // 2.5 hours from now -> Must be ineligible (< 3 hours)
    const ineligible2_5h = new Date(now + 2.5 * 3600 * 1000).toISOString();
    const result2_5h = check3HourPolicyEligibility(ineligible2_5h);
    assert('Lesson in 2.5 hours is INELIGIBLE for self-service (< 3 hours)', result2_5h.eligible === false);

    // Past lesson -> Must be ineligible
    const past = new Date(now - 1 * 3600 * 1000).toISOString();
    const resultPast = check3HourPolicyEligibility(past);
    assert('Past lesson is ineligible', resultPast.eligible === false);
  } catch (err: any) {
    assert('3-Hour Policy Checks', false, err?.message);
  }

  // 4. Dual Display Formatting
  try {
    const testUtcIso = '2026-10-15T16:00:00.000Z';
    const dual = getDualDisplayTimes(testUtcIso, 'America/Toronto', 30);
    assert('Dual display contains student local time', !!dual.localTime);
    assert('Dual display contains Cairo time', !!dual.cairoTime);
    assert('Dual display contains timezone offsets', !!dual.studentOffset && !!dual.cairoOffset);
  } catch (err: any) {
    assert('Dual Display Times', false, err?.message);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results
  };
}
