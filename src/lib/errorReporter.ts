/** Sends front-end errors to /api/client-errors (OPS-01). Each message once per page load, at most 5 per load. */
const sent = new Set<string>();
const MAX_PER_PAGE = 5;

export function reportClientError(error: unknown): void {
  try {
    const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Non-error thrown');
    const message = err.message || 'Unknown error';
    if (sent.has(message) || sent.size >= MAX_PER_PAGE) return;
    sent.add(message);
    const body = JSON.stringify({ message, stack: err.stack?.slice(0, 4000) || null, path: window.location.pathname });
    // keepalive lets the report finish when the error is followed by a navigation.
    void fetch('/api/client-errors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch {
    // Reporting must never throw.
  }
}

export function installErrorReporter(): void {
  window.addEventListener('error', (event) => reportClientError(event.error || event.message));
  window.addEventListener('unhandledrejection', (event) => reportClientError(event.reason));
}
