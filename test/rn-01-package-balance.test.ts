import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { activeBalances, balanceLine, arLessons } from '../src/student/components/PackageBalance.js';

const base = { id: 'a', status: 'active', purchasedQuantity: 8, remainingCredits: 3 };

describe('RN-01 package balance', () => {
  it('lists only active packages with lessons left and no pending refund', () => {
    const list = activeBalances([
      base,
      { ...base, id: 'b', remainingCredits: 0 },
      { ...base, id: 'c', status: 'exhausted', remainingCredits: 2 },
      { ...base, id: 'd', status: 'pending_payment' },
      { ...base, id: 'e', isCredit: true, purchasedQuantity: 1, remainingCredits: 1, refundRequestedAt: '2026-10-20T10:00:00Z' }
    ]);
    assert.deepStrictEqual(list.map((e) => e.id), ['a']);
    assert.deepStrictEqual(activeBalances(null), []);
  });

  it('says it calmly in both languages', () => {
    assert.strictEqual(balanceLine(base, false), '3 lessons left in your 8-lesson package');
    assert.strictEqual(balanceLine({ ...base, remainingCredits: 1 }, false), '1 lesson left in your 8-lesson package');
    assert.strictEqual(balanceLine(base, true), 'باقي 3 حصص في باقة الـ 8 حصص');
    assert.strictEqual(balanceLine({ ...base, purchasedQuantity: 12, remainingCredits: 2 }, true), 'باقي حصتين في باقة الـ 12 حصة');
    assert.strictEqual(arLessons(1), 'حصة واحدة');
    assert.strictEqual(balanceLine({ ...base, isCredit: true, purchasedQuantity: 1, remainingCredits: 1 }, false), '1 lesson left from a cancelled-lesson credit');
  });

  it('is used on the home, booking and packages pages', () => {
    for (const page of ['StudentHomePage', 'StudentBookingPage', 'StudentPackagesPage']) {
      const src = fs.readFileSync(`src/student/pages/${page}.tsx`, 'utf8');
      assert.ok(src.includes('<PackageBalance'), `${page} does not render <PackageBalance>`);
    }
  });
});
