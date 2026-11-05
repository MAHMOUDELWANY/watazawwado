import { useEffect, useState } from 'react';

/** Launch switch from the server (LEARNER_SIGNUP_MODE). "open" until the API says otherwise, so the site never blocks on it. */
export type Launch = { signupMode: 'open' | 'waitlist'; waveSize: number };

const OPEN: Launch = { signupMode: 'open', waveSize: 20 };
const INVITED_KEY = 'wz-zaad-invited';
let cached: Launch | null = null;
let pending: Promise<Launch> | null = null;

export function loadLaunch(): Promise<Launch> {
  if (cached) return Promise.resolve(cached);
  pending ??= fetch('/api/public/launch')
    .then((r) => (r.ok ? r.json() : OPEN))
    .then((d) => (cached = { signupMode: d.signupMode === 'waitlist' ? 'waitlist' : 'open', waveSize: Number(d.waveSize) || 20 }))
    .catch(() => OPEN);
  return pending;
}

export function useLaunch(): Launch {
  const [launch, setLaunch] = useState<Launch>(cached ?? OPEN);
  useEffect(() => { let on = true; loadLaunch().then((l) => on && setLaunch(l)); return () => { on = false; }; }, []);
  return launch;
}

/** Set when someone opens the invitation link (/zaad?invited=1). The server still checks the invitation on onboarding. */
export function markInvited() { try { localStorage.setItem(INVITED_KEY, '1'); } catch {} }
export function isInvited() { try { return localStorage.getItem(INVITED_KEY) === '1'; } catch { return false; } }

export const zaadPath = (isEn: boolean) => (isEn ? '/zaad' : '/ar/zaad');
