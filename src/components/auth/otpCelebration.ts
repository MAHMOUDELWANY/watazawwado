import { useSyncExternalStore } from 'react';

/**
 * While the OTP card checks a code and plays its success sequence, the account already has a
 * session (Supabase verifyOtp signs the user in). Pages that swap their view on sign-in
 * (StudentApp) wait for this flag to clear, so the orbit and the check mark are seen.
 */
let celebrating = false;
const listeners = new Set<() => void>();
const set = (value: boolean) => {
  if (celebrating === value) return;
  celebrating = value;
  listeners.forEach((fn) => fn());
};

export const beginOtpCelebration = () => set(true);
export const endOtpCelebration = () => set(false);
export const isOtpCelebrating = () => celebrating;

export function useOtpCelebrating(): boolean {
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    () => celebrating,
    () => false
  );
}
