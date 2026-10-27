import { useEffect, useState } from 'react';

/**
 * Install-as-an-app support (no service worker: nothing is cached, the site just opens in its own window).
 *
 * Chrome and Edge fire `beforeinstallprompt` once, early, often before React mounts. `capturePwaInstall()` runs in
 * main.tsx so the event is kept for whichever button asks for it later (site menu, portal home, teacher dashboard).
 */

type DeferredPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export type InstallPlatform = 'ios-safari' | 'ios-other' | 'android' | 'samsung' | 'mac-safari' | 'desktop' | 'firefox' | 'unknown';

let deferred: DeferredPrompt | null = null;
let installedNow = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

const DISMISS_KEY = 'wz.install.dismissedAt';
/** A dismissed suggestion comes back after two weeks; the explicit menu entries are always there. */
export const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

export function capturePwaInstall(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as DeferredPrompt;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedNow = true;
    notify();
  });
}

/** True inside the installed app window (Android, desktop, and iOS home-screen apps). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
    (navigator as any).standalone === true
  );
}

/** Which install steps to show (pure, so it is testable). */
export function detectPlatform(ua: string): InstallPlatform {
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))) {
    return /CriOS|FxiOS|EdgiOS/i.test(ua) ? 'ios-other' : 'ios-safari';
  }
  if (/Firefox\//i.test(ua) && !/Seamonkey/i.test(ua)) return 'firefox';
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/Android/i.test(ua)) return 'android';
  if (/Macintosh/i.test(ua) && /Safari\//i.test(ua) && !/Chrome|Chromium|Edg\//i.test(ua)) return 'mac-safari';
  if (/Windows|Macintosh|Linux|CrOS/i.test(ua)) return 'desktop';
  return 'unknown';
}

export function wasDismissedRecently(now = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && now - at < DISMISS_FOR_MS;
  } catch {
    return false;
  }
}

export function dismissInstallSuggestion(): void {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* storage blocked */ }
  notify();
}

/** Opens the browser's own install dialog when it offered one. Resolves to true when the person installed. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  notify();
  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice?.outcome === 'accepted';
  } catch {
    return false;
  }
}

export interface PwaInstallState {
  /** Already running as the app, or installed during this visit. */
  installed: boolean;
  /** The browser offered its one-tap install dialog. */
  canPrompt: boolean;
  platform: InstallPlatform;
  /** The person closed the suggestion in the last two weeks. */
  dismissed: boolean;
}

export function usePwaInstall(): PwaInstallState {
  const read = (): PwaInstallState => ({
    installed: installedNow || isStandalone(),
    canPrompt: Boolean(deferred),
    platform: typeof navigator === 'undefined' ? 'unknown' : detectPlatform(navigator.userAgent),
    dismissed: wasDismissedRecently(),
  });
  const [state, setState] = useState<PwaInstallState>(read);
  useEffect(() => {
    const update = () => setState(read());
    listeners.add(update);
    update();
    const mq = window.matchMedia?.('(display-mode: standalone)');
    mq?.addEventListener?.('change', update);
    return () => {
      listeners.delete(update);
      mq?.removeEventListener?.('change', update);
    };
  }, []);
  return state;
}

/** Whether there is anything useful to offer: a one-tap install, or written steps for this browser. */
export function canOfferInstall(s: Pick<PwaInstallState, 'installed' | 'canPrompt' | 'platform'>): boolean {
  if (s.installed) return false;
  if (s.canPrompt) return true;
  // Firefox desktop and iOS browsers other than Safari cannot install a site: say nothing there.
  return s.platform === 'ios-safari' || s.platform === 'android' || s.platform === 'samsung' || s.platform === 'mac-safari' || s.platform === 'desktop';
}

// One install sheet for the whole app, so a menu that closes itself does not take the sheet with it.
let sheetOpen = false;
const sheetListeners = new Set<(open: boolean) => void>();
export function openInstallSheet(): void { sheetOpen = true; sheetListeners.forEach((fn) => fn(true)); }
export function closeInstallSheet(): void { sheetOpen = false; sheetListeners.forEach((fn) => fn(false)); }
export function useInstallSheetOpen(): boolean {
  const [open, setOpen] = useState(sheetOpen);
  useEffect(() => {
    sheetListeners.add(setOpen);
    return () => { sheetListeners.delete(setOpen); };
  }, []);
  return open;
}
