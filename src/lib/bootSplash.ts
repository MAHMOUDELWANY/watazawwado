/**
 * The launch screen in index.html (#boot-splash): shown in the installed app and on the account areas, from the
 * first paint until the page has something real to show. It matches the system splash (same paper colour, same
 * mark), so opening the app goes system splash → our splash → the page, with no white flash and no spinner swap.
 *
 * Page loaders (BrandLoader at page size, the route Suspense fallback) "hold" it, so the splash stays instead of a
 * second, different loader appearing under it. The personal welcome (WelcomeLoader) does not hold it.
 */
let holds = 0;
let gone = false;
let started = false;
const MAX_MS = 8000;

function el(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.getElementById('boot-splash');
}

export function hideBootSplash(): void {
  if (gone) return;
  // The once-a-day brand intro (index.html) gets to finish before the app shows.
  const wait = ((window as any).__bootIntroUntil || 0) - Date.now();
  if (wait > 0) { window.setTimeout(hideBootSplash, wait); return; }
  const node = el();
  gone = true;
  if (!node) return;
  node.classList.add('is-leaving');
  window.setTimeout(() => node.remove(), 320);
}

function maybeHide() {
  if (holds === 0) hideBootSplash();
}

/** Keep the splash while a full-page loader is on screen. Returns the release function. */
export function holdBootSplash(): () => void {
  if (gone || !el()) return () => {};
  holds += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds = Math.max(0, holds - 1);
    // Let the next screen commit first (a loader often hands over to another loader).
    window.requestAnimationFrame(() => window.requestAnimationFrame(maybeHide));
  };
}

/** Called once after the first render: hides the splash when nothing holds it, and never later than MAX_MS. */
export function startBootSplash(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (!el()) { gone = true; return; }
  window.requestAnimationFrame(() => window.requestAnimationFrame(maybeHide));
  window.setTimeout(hideBootSplash, MAX_MS);
}
