/**
 * Page sweep: every screen of every role opens as a real QA account, on phone and desktop, in Arabic and English.
 * Per page: no crash screen, no failed API call, no console error, no sideways scroll, the right text direction.
 * A full-page screenshot of each lands in qa-shots/pages/<project>/ (gitignored) for the design review (PUB-07, AUTH-11).
 */
import fs from 'node:fs';
import type { Page, TestInfo } from '@playwright/test';
import { test, expect } from './fixtures.js';
import type { QaRole } from '../scripts/qa/lib.js';

const STUDENT = ['', '/lessons', '/book', '/progress', '/progress/report', '/calendar', '/wallet', '/wallet?tab=packages', '/wallet?tab=payments',
  '/notifications', '/offers', '/invite', '/sponsor', '/community', '/messages', '/placement', '/curriculum', '/homework', '/account', '/guide'];
const TEACHER = ['', '/today', '/upcoming', '/trials', '/students', '/homework', '/bookings', '/availability', '/notifications', '/month', '/pay',
  '/class-board', '/university', '/settings', '/messages', '/assistant', '/curriculum', '/placement', '/analytics'];
const ADMIN = ['/overview', '/leads', '/waitlist', '/teacher-changes', '/intakes', '/teachers', '/students', '/bookings', '/analytics', '/pay-later',
  '/payroll', '/honor', '/programs', '/reviews', '/sponsorship', '/discounts', '/health', '/settings', '/notifications', '/placement'];
const PUBLIC = ['', '/get-started', '/about', '/how-it-works', '/learning', '/pricing', '/faq', '/privacy', '/terms', '/safety', '/community', '/careers', '/articles'];

// Not ours to fix here, or expected on a local server (docs/testing/findings/p2.md, P2-001).
const NOISE = [/\[vite\]/i, /WebSocket/i, /favicon/i, /Download the React DevTools/i, /sw\.js|service ?worker/i, /net::ERR_ABORTED/i,
  /vercel.*(insights|analytics)|_vercel\//i, /googletagmanager|google-analytics/i, /stripe/i,
  // A request cut short by the sweep moving on, and the browser's own line for a failed call (counted below as `api`).
  /Failed to fetch/i, /Failed to load resource/i];

type Problem = { path: string; kind: string; detail: string };

async function sweep(page: Page, info: TestInfo, role: string, base: string, routes: string[], lang: 'ar' | 'en') {
  const problems: Problem[] = [];
  let current = '';
  page.on('console', m => { if (m.type() === 'error' && !NOISE.some(re => re.test(m.text()))) problems.push({ path: current, kind: 'console', detail: m.text().slice(0, 300) }); });
  page.on('pageerror', e => problems.push({ path: current, kind: 'pageerror', detail: String(e.message).slice(0, 300) }));
  page.on('response', r => {
    const u = new URL(r.url());
    // P2-006: every learner page asks the staff API who they are and gets 403; known, logged once in the findings.
    if (u.pathname === '/api/dashboard/me' && r.status() === 403 && base !== '/dashboard') return;
    if (u.pathname.startsWith('/api/') && r.status() >= 400) problems.push({ path: current, kind: `api ${r.status()}`, detail: `${r.request().method()} ${u.pathname}` });
  });
  const dir = `qa-shots/pages/${info.project.name}`; // not test-results: Playwright empties that on every run
  fs.mkdirSync(dir, { recursive: true });
  for (const route of routes) {
    current = `${base}${route}`;
    await test.step(current, async () => {
      await page.goto(current, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      await page.waitForFunction(() => document.body.innerText.trim().length > 60, null, { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(1200); // entrance motion, and Zad's tour on the home page
      await page.getByRole('button', { name: /^(تخطي|Skip)$/ }).click({ timeout: 800 }).catch(() => {});
      const state = await page.evaluate(() => ({
        crash: /Something went wrong|حدث خطأ غير متوقع/.test(document.body.innerText),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
        blank: document.body.innerText.trim().length < 20,
        url: location.pathname,
      }));
      if (state.crash) problems.push({ path: current, kind: 'crash', detail: 'error boundary shown' });
      if (state.blank) problems.push({ path: current, kind: 'blank', detail: 'almost no text on the page' });
      if (state.overflow > 2) problems.push({ path: current, kind: 'overflow', detail: `page is ${state.overflow}px wider than the screen` });
      if (state.dir !== (lang === 'ar' ? 'rtl' : 'ltr')) problems.push({ path: current, kind: 'direction', detail: `dir=${state.dir} for ${lang}` });
      if (!state.url.startsWith(base.split('?')[0]) && base !== '' && base !== '/ar') problems.push({ path: current, kind: 'redirect', detail: `ended at ${state.url}` });
      await page.screenshot({ path: `${dir}/${role}${(route || '/home').replace(/[/?=]/g, '_')}.png`, fullPage: true }).catch(() => {});
    });
  }
  fs.writeFileSync(`${dir}/${role}.problems.json`, JSON.stringify(problems, null, 1));
  await info.attach(`${role}-problems`, { body: JSON.stringify(problems, null, 1), contentType: 'application/json' });
  expect(problems, `${problems.length} problem(s), see qa-shots/pages/${info.project.name}/${role}.problems.json`).toEqual([]);
}

test.describe.configure({ timeout: 8 * 60_000 });

for (const [role, base, routes] of [
  ['student', '/student', STUDENT], ['parent', '/student', STUDENT], ['teacher', '/dashboard', TEACHER], ['admin', '/dashboard', ADMIN],
] as [QaRole, string, string[]][]) {
  test(`${role}: every page opens clean`, async ({ page, signInAs, lang }, info) => {
    await signInAs(role);
    await sweep(page, info, role, base, routes, lang);
  });
}

test('visitor: every public page opens clean', async ({ page, lang }, info) => {
  await sweep(page, info, 'visitor', lang === 'ar' ? '/ar' : '', PUBLIC, lang);
});
