/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — LEAD TRANSITIONS & ATOMICITY TEST SUITE
 * File: test/leadTransitions.test.ts
 * Purpose: Validation of canonical lead transition matrix and helper
 *          enforcing zero bypass in trial assessment and lead update.
 * ====================================================================
 */

import {
  ALLOWED_LEAD_TRANSITIONS,
  VALID_LEAD_STATUSES,
  isAllowedLeadTransition
} from '../server/leadTransitions.js';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, details?: string) {
  results.push({ name, passed: condition, details });
  if (!condition) {
    console.error(`❌ FAILED: ${name}`, details || '');
  } else {
    console.log(`✅ PASSED: ${name}`);
  }
}

console.log('\n--- Running Lead Lifecycle Transition Matrix Audit ---');

// 1. Valid Transitions
assert(
  'Valid: trial_booked -> trial_completed is permitted',
  isAllowedLeadTransition('trial_booked', 'trial_completed') === true
);

assert(
  'Valid: trial_completed -> potential_student is permitted',
  isAllowedLeadTransition('trial_completed', 'potential_student') === true
);

assert(
  'Valid: trial_completed -> active_student is permitted',
  isAllowedLeadTransition('trial_completed', 'active_student') === true
);

assert(
  'Valid: lead -> contacted is permitted',
  isAllowedLeadTransition('lead', 'contacted') === true
);

assert(
  'Valid: lead -> trial_booked is permitted',
  isAllowedLeadTransition('lead', 'trial_booked') === true
);

assert(
  'Valid: potential_student -> active_student is permitted',
  isAllowedLeadTransition('potential_student', 'active_student') === true
);

assert(
  'Valid: lost -> lead (reactivation) is permitted',
  isAllowedLeadTransition('lost', 'lead') === true
);

assert(
  'Valid: Idempotent status (trial_booked -> trial_booked) is permitted',
  isAllowedLeadTransition('trial_booked', 'trial_booked') === true
);

// 2. Invalid Transitions (must be rejected)
assert(
  'Invalid: lead -> returning_student is strictly rejected',
  isAllowedLeadTransition('lead', 'returning_student') === false
);

assert(
  'Invalid: visitor -> active_student is strictly rejected',
  isAllowedLeadTransition('visitor', 'active_student') === false
);

assert(
  'Invalid: visitor -> trial_completed is strictly rejected',
  isAllowedLeadTransition('visitor', 'trial_completed') === false
);

assert(
  'Invalid: trial_booked -> returning_student is strictly rejected',
  isAllowedLeadTransition('trial_booked', 'returning_student') === false
);

assert(
  'Invalid: active_student -> visitor is strictly rejected',
  isAllowedLeadTransition('active_student', 'visitor') === false
);

// 3. Unknown or invalid statuses
assert(
  'Invalid: arbitrary/invented status is rejected',
  isAllowedLeadTransition('lead', 'super_student') === false
);

assert(
  'Invalid: empty status string is rejected',
  isAllowedLeadTransition('lead', '') === false
);

assert(
  'Invalid: unmapped source status is rejected',
  isAllowedLeadTransition('nonexistent_state', 'active_student') === false
);

// 4. Matrix Integrity
assert(
  'All 9 canonical statuses are defined in VALID_LEAD_STATUSES',
  VALID_LEAD_STATUSES.length === 9 &&
  ['visitor', 'lead', 'contacted', 'trial_booked', 'trial_completed', 'potential_student', 'active_student', 'returning_student', 'lost'].every(s => VALID_LEAD_STATUSES.includes(s as any))
);

assert(
  'All 9 canonical statuses have defined transitions in ALLOWED_LEAD_TRANSITIONS',
  Object.keys(ALLOWED_LEAD_TRANSITIONS).length === 9
);

const passedCount = results.filter(r => r.passed).length;
const failedCount = results.filter(r => !r.passed).length;

console.log(`\nResults: ${passedCount} passed, ${failedCount} failed of ${results.length} total tests.\n`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
