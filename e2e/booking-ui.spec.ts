/**
 * BOOK-01/03 through the real screens, on phone and desktop, in Arabic and English: a learner books the free
 * trial, a parent books for one child, and a paid lesson goes as far as the payment step. After each journey the
 * database is checked. Also the things people really do: a double click on Confirm, Back after booking.
 */
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures.js';
import { db, qaIds, resetLearnerData, TAG } from './helpers.js';

const TIME = /\d{1,2}:\d{2}|[٠-٩]{1,2}:[٠-٩]{2}/;
const CONFIRM = /Confirm Free Trial|تأكيد|أكّد|احجز/;

async function openBooking(page: Page) {
  await page.goto('/student/book');
  await page.getByTestId('booking-continue').waitFor({ state: 'visible', timeout: 90_000 });
}
const next = (page: Page) => page.getByTestId('booking-continue').click();

/** Step 3: a day a few days ahead and a time in the middle of the day, never the preselected first one. */
async function pickTime(page: Page, slotIndex = 14) {
  await expect(page.getByRole('heading', { name: /Pick a time|اختر الموعد/ })).toBeVisible();
  const days = page.locator('button').filter({ hasText: /Nov|Dec|نوفمبر|ديسمبر/ });
  await days.nth(4).click();
  const slots = page.locator('button').filter({ hasText: TIME });
  await expect(slots.nth(slotIndex)).toBeVisible();
  await slots.nth(slotIndex).click();
}

async function activeBookings(studentId: string) {
  const { data } = await db.from('bookings').select('id, status, booking_type, teacher_id, student_id, scheduled_start, fee_amount_usd, reference_code')
    .eq('student_id', studentId).in('status', ['pending', 'confirmed', 'rescheduled']);
  return data || [];
}

test.beforeEach(resetLearnerData);
test.afterAll(resetLearnerData);

test('a learner books the free trial; a double click on Confirm books once', async ({ page, signInAs }) => {
  const q = await qaIds();
  await signInAs('student');
  await openBooking(page);
  await next(page); // what you will learn (the goal comes from the profile)
  await expect(page.getByRole('heading', { name: /Length and plan|المدة والخطة/ })).toBeVisible();
  await next(page); // free trial, 30 minutes is the default
  await pickTime(page);
  await next(page);
  await expect(page.getByRole('heading', { name: /Review and confirm|راجع وأكّد/ }), 'a free trial is not "review and pay"').toBeVisible();
  const confirm = page.getByRole('button', { name: CONFIRM }).last();
  await expect(confirm, 'Confirm stays off until the terms are accepted').toBeDisabled();
  await page.getByRole('checkbox').first().check();
  const created = page.waitForResponse(r => r.url().includes('/api/bookings/create') && r.request().method() === 'POST', { timeout: 60_000 });
  await confirm.dblclick();
  expect((await created).status()).toBe(201);
  await expect(page.getByText(/MHM-[0-9A-F]{6}/).first(), 'the confirmation shows the booking reference').toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  const mine = await activeBookings(q.student.id);
  expect(mine.length, 'one click or two, one lesson').toBe(1);
  expect(mine[0]).toMatchObject({ status: 'confirmed', booking_type: 'trial', teacher_id: q.teacher1 });
  expect(new Date(mine[0].scheduled_start).getUTCHours(), 'the time picked, not the preselected first slot').not.toBe(4);

  // Back after booking must not book again or show a broken form.
  await page.goBack();
  await page.waitForTimeout(1500);
  expect((await activeBookings(q.student.id)).length).toBe(1);
  await page.goto('/student/lessons');
  await expect(page.getByText(mine[0].reference_code).or(page.getByText(new RegExp(`QA Ustadh ${TAG}|أ\\. اختبار ${TAG}`))).first(), 'the lesson is on the lessons page').toBeVisible({ timeout: 30_000 });
});

test('a parent books the trial for the child they picked, with that child\'s teacher', async ({ page, signInAs }) => {
  const q = await qaIds();
  await signInAs('parent');
  await openBooking(page);
  // Without a child chosen the form must not move on (P2-020).
  await page.locator('textarea').first().fill('QA: wants a steady weekly lesson');
  await next(page);
  await expect(page.getByRole('heading', { name: /What you will learn|ماذا ستتعلّم/ }), 'the form went on with no child chosen').toBeVisible();
  await page.locator('button', { hasText: `QA Teen ${TAG}` }).first().click();
  await page.locator('textarea').first().fill('');
  await next(page);
  // No goal yet: the form says so in the page's language and stays on the step.
  await expect(page.getByRole('heading', { name: /What you will learn|ماذا ستتعلّم/ })).toBeVisible();
  await page.locator('textarea').first().fill('QA: wants a steady weekly lesson');
  await next(page);
  await expect(page.getByRole('heading', { name: /Length and plan|المدة والخطة/ })).toBeVisible();
  await next(page);
  await pickTime(page, 16);
  await next(page);
  await page.getByRole('checkbox').first().check();
  const created = page.waitForResponse(r => r.url().includes('/api/bookings/create') && r.request().method() === 'POST', { timeout: 60_000 });
  await page.getByRole('button', { name: CONFIRM }).last().click();
  const res = await created;
  expect(res.status(), await res.text()).toBe(201);
  await expect(page.getByText(/MHM-[0-9A-F]{6}/).first()).toBeVisible({ timeout: 30_000 });
  const teen = await activeBookings(q.teen);
  expect(teen.length).toBe(1);
  expect(teen[0]).toMatchObject({ status: 'confirmed', booking_type: 'trial', teacher_id: q.teacher1, student_id: q.teen });
  expect((await activeBookings(q.kid)).length, 'nothing was booked for the other child').toBe(0);
  expect((await activeBookings(q.parent.id)).length, 'nothing was booked for the parent').toBe(0);
});

test('a paid lesson stops at payment: held, unpaid, and the screen says what to do', async ({ page, signInAs }) => {
  const q = await qaIds();
  await signInAs('student');
  await openBooking(page);
  await next(page);
  await page.getByText(/Regular 1-on-1 Lesson|درس فردي منتظم/).first().click();
  await next(page);
  await pickTime(page, 18);
  await next(page);
  await expect(page.getByRole('heading', { name: /Review and pay|راجع وادفع/ })).toBeVisible();
  await expect(page.getByText(/\$\s?4\.50?|4\.50?\s?\$/).first(), 'the price of a 30-minute Quran lesson is shown before paying').toBeVisible();
  for (const box of await page.getByRole('checkbox').all()) await box.check();
  const created = page.waitForResponse(r => r.url().includes('/api/bookings/create') && r.request().method() === 'POST', { timeout: 60_000 });
  await page.getByRole('button', { name: /Proceed to Payment|Confirm & Pay|المتابعة إلى الدفع|تأكيد وحجز الدرس/ }).first().click();
  const res = await created;
  expect(res.status(), await res.text()).toBe(201);
  await page.waitForTimeout(6000); // the payment step: Stripe's page or form, or our message when the gateway is down
  const held = await activeBookings(q.student.id);
  expect(held.length).toBe(1);
  expect(held[0].status, 'never confirmed before the server verifies a payment').toBe('pending');
  expect(Number(held[0].fee_amount_usd)).toBe(4.5);
  const atStripe = /stripe\.com/.test(page.url()) || await page.locator('iframe[src*="stripe"], iframe[name*="stripe" i]').count() > 0;
  test.info().annotations.push({ type: 'payment step', description: atStripe ? 'Stripe opened' : 'Stripe did not open on this machine (P2-001)' });
  if (!atStripe) {
    const text = await page.locator('body').innerText();
    expect(text, 'a raw provider or server error reached the family').not.toMatch(/sk_test|Expired API Key|Failed to initialize payment gateway|Internal Server Error|undefined|\[object/);
    expect(text, 'the family is told the payment did not start and what to do').toMatch(/pay|payment|try again|WhatsApp|الدفع|ادفع|حاول|واتساب/i);
  }
  // Nothing on the screen may call an unpaid lesson confirmed.
  await page.goto('/student/lessons');
  await page.waitForTimeout(2500);
  await expect(page.getByText(/awaiting payment|waiting for payment|complete your payment|في انتظار الدفع|مستني الدفع|أكمل الدفع|ادفع/i).first(), 'the unpaid hold is shown as unpaid').toBeVisible({ timeout: 20_000 });
});
