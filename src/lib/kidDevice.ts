/** NX-16: the linked child phone's token. Used only on /kid pages, so a grown-up session on the same browser is never mixed up with it. */
const KEY = 'wz_kid_token';

export const isKidPath = (pathname: string) => pathname === '/kid' || pathname.startsWith('/kid/');

export function kidToken(): string | null {
  if (typeof window === 'undefined' || !isKidPath(window.location.pathname)) return null;
  try { return window.localStorage.getItem(KEY); } catch { return null; }
}

/** This browser is a linked child device (any page), e.g. the installed app opening /student. */
export function isLinkedKidDevice(): boolean {
  try { return typeof window !== 'undefined' && Boolean(window.localStorage.getItem(KEY)); } catch { return false; }
}

export function setKidToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(KEY, token);
    else window.localStorage.removeItem(KEY);
  } catch { /* storage blocked: the phone stays linked for this visit only */ }
}
