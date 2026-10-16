/**
 * Who may open which account (owner decision 2026-10-16). Shared by the sign-up form,
 * onboarding and the server, so the browser and the API apply the same limits.
 *
 * - A personal (adult) account is for learners aged 18 or over.
 * - A family account is opened by a guardian aged 18 or over.
 * - Each child in a family account is 6 to 17 years old (an 18+ learner opens their own account).
 */
export const ADULT_MIN_AGE = 18;
export const GUARDIAN_MIN_AGE = 18;
export const CHILD_MIN_AGE = 6;
export const CHILD_MAX_AGE = 17;
export const MAX_AGE = 100;

/** A whole number of years typed as digits ("24"), or null. Accepts numbers too (API input). */
export function parseAge(value: unknown): number | null {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d{1,3}$/.test(text)) return null;
  return Number(text);
}

export const isAdultAge = (value: unknown) => {
  const age = parseAge(value);
  return age !== null && age >= ADULT_MIN_AGE && age <= MAX_AGE;
};

export const isGuardianAge = (value: unknown) => {
  const age = parseAge(value);
  return age !== null && age >= GUARDIAN_MIN_AGE && age <= MAX_AGE;
};

export const isChildAge = (value: unknown) => {
  const age = parseAge(value);
  return age !== null && age >= CHILD_MIN_AGE && age <= CHILD_MAX_AGE;
};

export type SignupAgeProblem = 'confirm_adult' | 'guardian_age' | null;

/**
 * The sign-up form's age gate, checked before the account is created (so no verification email
 * is sent for an account that may not exist): a personal account confirms 18+, a family account
 * gives the guardian's age (18+).
 */
export function signupAgeProblem(input: { accountType: 'self' | 'family'; confirmedAdult?: boolean; guardianAge?: unknown }): SignupAgeProblem {
  if (input.accountType === 'family') return isGuardianAge(input.guardianAge) ? null : 'guardian_age';
  return input.confirmedAdult ? null : 'confirm_adult';
}

/** Remembers the sign-up choice on this device for onboarding (Google sign-up has no metadata). */
export const SIGNUP_CHOICE_KEY = 'wz_signup_choice';
