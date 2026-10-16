// Pure helpers for the OTP screen (kept free of React so they can be unit tested).

export const OTP_LENGTH = 6;

export const emptyDigits = (): string[] => Array(OTP_LENGTH).fill('');

/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits become ASCII; everything else is dropped. */
export function normalizeDigits(text: string): string {
  return (text || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, '');
}

/**
 * Applies typed or pasted text at box `index`. A full-length code (paste/autofill)
 * always fills from the first box; shorter text fills forward from `index`.
 */
export function applyInput(digits: string[], index: number, raw: string): { digits: string[]; focus: number } {
  const clean = normalizeDigits(raw);
  const next = [...digits];
  if (!clean) {
    next[index] = '';
    return { digits: next, focus: index };
  }
  const start = clean.length >= OTP_LENGTH ? 0 : index;
  const chars = clean.slice(0, OTP_LENGTH - start);
  for (let k = 0; k < chars.length; k++) next[start + k] = chars[k];
  return { digits: next, focus: Math.min(start + chars.length, OTP_LENGTH - 1) };
}

/** Backspace clears the current box, or moves back and clears the previous one when empty. */
export function applyBackspace(digits: string[], index: number): { digits: string[]; focus: number } {
  const next = [...digits];
  if (next[index]) {
    next[index] = '';
    return { digits: next, focus: index };
  }
  const prev = Math.max(0, index - 1);
  next[prev] = '';
  return { digits: next, focus: prev };
}

export const isComplete = (digits: string[]): boolean =>
  digits.length === OTP_LENGTH && digits.every((d) => /^\d$/.test(d));

/**
 * idle -> lift -> orbit -> (verified) converge -> success
 *                       -> (rejected) error -> idle (on edit)
 * Success is only reachable from `orbit` through `verified`, i.e. after the server said yes.
 */
export type OtpPhase = 'idle' | 'lift' | 'orbit' | 'converge' | 'success' | 'error';
export type OtpEvent = 'submit' | 'lifted' | 'verified' | 'rejected' | 'converged' | 'edit';

const TRANSITIONS: Record<OtpPhase, Partial<Record<OtpEvent, OtpPhase>>> = {
  idle: { submit: 'lift' },
  lift: { lifted: 'orbit', rejected: 'error' },
  orbit: { verified: 'converge', rejected: 'error' },
  converge: { converged: 'success' },
  success: {},
  error: { submit: 'lift', edit: 'idle' },
};

export function otpTransition(phase: OtpPhase, event: OtpEvent): OtpPhase {
  return TRANSITIONS[phase][event] ?? phase;
}

/** True while the code is in flight or done; inputs are locked. */
export const isBusy = (phase: OtpPhase): boolean => phase !== 'idle' && phase !== 'error';
