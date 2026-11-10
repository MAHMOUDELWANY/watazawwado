/**
 * Mints a real session for a QA account and prints a snippet to paste in the browser console (or use from
 * Playwright via `mintSession`). Usage: npx tsx scripts/qa/session.ts <qa-email> [--json]
 */
import { isMain, mintSession, STORAGE_KEY, storageValue } from './lib.js';

export { mintSession, STORAGE_KEY, storageValue };

/** JS that stores the session where supabase-js reads it, then reloads. */
export function browserSnippet(value: string): string {
  return `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(value)}); location.reload();`;
}

if (isMain(import.meta.url)) {
  const email = process.argv[2];
  if (!email) { console.error('Usage: npx tsx scripts/qa/session.ts <qa-email> [--json]'); process.exit(1); }
  mintSession(email).then(session => {
    const value = storageValue(session);
    console.log(process.argv.includes('--json') ? value : browserSnippet(value));
  }).catch(err => { console.error(err.message); process.exit(1); });
}
