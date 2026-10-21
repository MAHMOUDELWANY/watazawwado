import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('PA-04 family care saving', () => {
  const api = fs.readFileSync('api/index.ts', 'utf8');
  it('the saving comes from the server: catalogue price minus what it charged, only when it applied the discount', () => {
    assert.ok(api.includes('familySaving: ent.metadata?.family_discount && cat?.price_amount != null'));
    assert.ok(api.includes('familySaving: familyDiscount ? Math.round((Number(catalogItem.price_amount) - pricePaid) * 100) / 100 : null'));
    assert.ok(api.includes('Math.round(Number(catalogItem.price_amount) * 0.95 * 100) / 100'), 'the 5% rule itself is unchanged (RULES.md §4)');
  });
  it('the package card shows the line only when there is a saving', () => {
    const page = fs.readFileSync('src/student/pages/StudentPackagesPage.tsx', 'utf8');
    assert.ok(page.includes('{ent.familySaving ? ('));
    assert.ok(page.includes('`Family care: −$${ent.familySaving}`'));
    assert.ok(!/familySaving\s*=\s*[^;]*0\.0?5/.test(page), 'the browser never computes the discount');
  });
});
