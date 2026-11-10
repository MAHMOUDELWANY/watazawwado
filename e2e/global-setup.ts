import type { FullConfig } from '@playwright/test';

/** Fails fast with the fix when the project's server is not running. */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL;
  const ok = await fetch(`${baseURL}/api/health`).then(r => r.ok).catch(() => false);
  if (!ok) {
    throw new Error(`No server at ${baseURL}. Start the qa-${process.env.QA_PROJECT || 'p1'} launch entry (docs/testing/RULES.md), `
      + `then run: npx tsx scripts/qa/create-accounts.ts ${process.env.QA_PROJECT || 'p1'}`);
  }
}
