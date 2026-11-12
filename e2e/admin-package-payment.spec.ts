/**
 * P3-018, BOOK-12: the super admin records a package a family paid for outside the site. The form lists the unpaid
 * packages, choosing one fills its price, and saving activates the package. No card is charged.
 */
import { test, expect } from './fixtures.js';
import { call, db, qaIds, resetLearnerData, tokenFor, TAG } from './helpers.js';

test.beforeAll(resetLearnerData);
test.afterAll(resetLearnerData);

test('the admin records a package payment from the bookings page', async ({ page, signInAs, lang }, info) => {
  const q = await qaIds();
  const packs: any[] = (await call(null, 'GET', '/api/packages')).json.data;
  const pack = packs.filter(p => Number(p.eligibility_rules?.hourly_rate) === 9 && Number(p.eligibility_rules?.duration_minutes) === 30).sort((a, b) => a.lesson_count - b.lesson_count)[0];
  const chosen = await call(await tokenFor('student'), 'POST', '/api/student/packages/select', { packageCatalogId: pack.id, acceptedTerms: true, acceptedEarlyStart: true });
  expect(chosen.status, JSON.stringify(chosen.json)).toBe(201);
  const entitlementId = chosen.json.entitlement.id as string;

  await signInAs('admin');
  await page.goto('/dashboard/bookings');
  await page.getByRole('button', { name: lang === 'ar' ? 'سجّل دفع باقة' : 'Record a package payment' }).click();
  const dialog = page.getByRole('dialog');
  const save = dialog.getByRole('button', { name: lang === 'ar' ? 'احفظ الدفع' : 'Save payment' });
  await expect(save, 'nothing can be saved before a package is chosen').toBeDisabled();
  const select = dialog.locator('#rpm-package');
  await expect(select.locator(`option[value="${entitlementId}"]`)).toContainText(`QA Student ${TAG}`);
  await select.selectOption(entitlementId);
  await expect(dialog.locator('#rpm-amount'), 'the price of the package is filled in').toHaveValue(String(Number(pack.price_amount)));
  await expect(dialog.locator('#rpm-currency')).toHaveValue('USD');
  await page.screenshot({ path: `docs/testing/findings/shots/p3/P3-018-package-payment-${info.project.name}.png` });

  await save.click();
  await expect(dialog).toBeHidden();
  await expect.poll(async () => (await db.from('package_entitlements').select('status').eq('id', entitlementId).single()).data?.status).toBe('active');
  const { data: pays } = await db.from('payments').select('status, entitlement_id').eq('student_id', q.student.id);
  expect(pays).toEqual([{ status: 'confirmed', entitlement_id: entitlementId }]);
});
