/**
 * Playwright fixtures: `signInAs(role)` puts a real Supabase session for the project's QA account into the page
 * before any app code runs (no password, no login form). Accounts come from scripts/qa/create-accounts.ts.
 */
import { test as base, expect, type Page } from '@playwright/test';
import { mintSession, qaEmail, STORAGE_KEY, storageValue, type QaRole } from '../scripts/qa/lib.js';

export const QA_PROJECT = process.env.QA_PROJECT || 'p1';
const sessions = new Map<string, string>(); // one session per role per worker

export type Lang = 'ar' | 'en';

export const test = base.extend<{ lang: Lang; signInAs: (role: QaRole) => Promise<{ email: string }> }>({
  lang: async ({}, use, info) => { await use(info.project.name.endsWith('-en') ? 'en' : 'ar'); },
  signInAs: async ({ page, lang }, use) => {
    await use(async (role: QaRole) => {
      const email = qaEmail(QA_PROJECT, role);
      if (!sessions.has(email)) sessions.set(email, storageValue(await mintSession(email)));
      await page.addInitScript(([key, value, l]) => {
        window.localStorage.setItem(key, value);
        // src/lib/language.ts: the language is the one the person picked (cookie), else English.
        window.localStorage.setItem('watazawwado_lang', l);
        document.cookie = `watazawwado_lang=${l}; path=/`;
        document.cookie = `watazawwado_lang_chosen=${l}; path=/`;
      }, [STORAGE_KEY, sessions.get(email)!, lang]);
      return { email };
    });
  },
});

/** Waits until the page called `path` (prefix) and got a 2xx: proof the server accepted the session. */
export function apiOk(page: Page, path: string) {
  return page.waitForResponse(r => new URL(r.url()).pathname.startsWith(path) && r.request().method() === 'GET' && r.ok(), { timeout: 60_000 });
}

export { expect };
