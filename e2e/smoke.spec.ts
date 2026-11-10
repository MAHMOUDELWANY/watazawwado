/**
 * P1 smoke: every role signs in as a real QA account (scripts/qa/create-accounts.ts) and lands on its own area,
 * with the server accepting the session. Runs on phone/desktop x Arabic/English (playwright.config.ts).
 * QA_SHOTS=1 also saves a screenshot per role and project into docs/testing/findings/shots/<project>/.
 */
import { test, expect, apiOk, QA_PROJECT } from './fixtures.js';
import type { Page, TestInfo } from '@playwright/test';

const P = QA_PROJECT.toUpperCase();

async function shot(page: Page, info: TestInfo, role: string) {
  if (process.env.QA_SHOTS !== '1') return;
  await page.waitForTimeout(1500); // let entrance motion settle
  await page.screenshot({ path: `docs/testing/findings/shots/${QA_PROJECT}/smoke-${role}-${info.project.name}.png` });
}

test('student (adult) opens the student portal', async ({ page, signInAs }, info) => {
  await signInAs('student');
  const me = apiOk(page, '/api/student/me');
  await page.goto('/student');
  await me;
  await expect(page).toHaveURL(/\/student(\/|$|\?)/);
  await expect(page.getByText(`QA Ustadh ${P}`).first()).toBeVisible();
  await shot(page, info, 'student');
});

test('parent opens the family portal with both children', async ({ page, signInAs }, info) => {
  await signInAs('parent');
  const me = apiOk(page, '/api/student/me');
  await page.goto('/student');
  await me;
  await expect(page.getByText(`QA Kid ${P}`).first()).toBeAttached();
  await expect(page.getByText(`QA Teen ${P}`).first()).toBeAttached();
  await shot(page, info, 'parent');
});

test('teacher opens the teacher dashboard', async ({ page, signInAs }, info) => {
  await signInAs('teacher');
  const me = apiOk(page, '/api/dashboard/me');
  await page.goto('/dashboard');
  const res = await me;
  expect((await res.json())?.user?.email).toContain(`+qa-${QA_PROJECT}-teacher-1`);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(`QA Ustadh ${P}`).first()).toBeAttached(); // past the loading screen (sidebar is hidden on phones)
  await shot(page, info, 'teacher');
});

test('super admin opens the admin teachers page', async ({ page, signInAs }, info) => {
  await signInAs('admin');
  await page.goto('/dashboard/teachers');
  await expect(page).toHaveURL(/\/dashboard\/teachers/);
  await expect(page.getByText(`QA Ustadha ${P}`).first()).toBeVisible();
  await shot(page, info, 'admin');
});
