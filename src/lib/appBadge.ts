/**
 * The number on the installed app's icon (owner, 2026-11-10): conversations with new messages stay visible even after
 * the phone's notifications are cleared. Browsers without the Badging API simply skip it.
 */
export function setAppBadge(count: number): void {
  try {
    const nav = navigator as any;
    if (count > 0) nav.setAppBadge?.(count)?.catch?.(() => {});
    else nav.clearAppBadge?.()?.catch?.(() => {});
  } catch { /* not supported */ }
}
