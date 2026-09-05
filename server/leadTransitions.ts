/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — CANONICAL LEAD LIFECYCLE TRANSITIONS
 * File: server/leadTransitions.ts
 * Purpose: Master Spec Lead Lifecycle Transition Map & Validation Helper
 * ====================================================================
 */

import type { LeadStatus } from '../src/types/database';

export const VALID_LEAD_STATUSES = [
  'visitor',
  'lead',
  'contacted',
  'trial_booked',
  'trial_completed',
  'potential_student',
  'active_student',
  'returning_student',
  'lost'
] as const;

export type ValidLeadStatus = typeof VALID_LEAD_STATUSES[number];

// Master Spec Section 25 & Phase 5C Lead Lifecycle Transition Map
export const ALLOWED_LEAD_TRANSITIONS: Record<ValidLeadStatus, readonly ValidLeadStatus[]> = {
  visitor: ['visitor', 'lead', 'contacted', 'lost'],
  lead: ['lead', 'contacted', 'trial_booked', 'lost'],
  contacted: ['contacted', 'trial_booked', 'potential_student', 'lost'],
  trial_booked: ['trial_booked', 'trial_completed', 'lost'],
  trial_completed: ['trial_completed', 'potential_student', 'active_student', 'lost'],
  potential_student: ['potential_student', 'active_student', 'returning_student', 'lost'],
  active_student: ['active_student', 'returning_student', 'lost'],
  returning_student: ['returning_student', 'active_student', 'lost'],
  lost: ['lost', 'lead', 'contacted', 'trial_booked'] // Teacher-authorized reactivation
};

/**
 * Validates if a requested status transition from currentStatus is permitted
 * according to the canonical ALLOWED_LEAD_TRANSITIONS matrix.
 *
 * @param currentStatus The current status of the lead record
 * @param requestedStatus The target status requested by the teacher/workflow
 * @returns boolean: true if valid transition, false otherwise
 */
export function isAllowedLeadTransition(currentStatus: string, requestedStatus: string): boolean {
  if (!VALID_LEAD_STATUSES.includes(requestedStatus as ValidLeadStatus)) {
    return false;
  }
  const allowed = ALLOWED_LEAD_TRANSITIONS[currentStatus as ValidLeadStatus];
  if (!allowed) {
    return false;
  }
  return allowed.includes(requestedStatus as ValidLeadStatus);
}
