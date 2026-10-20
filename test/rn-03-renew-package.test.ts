import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { lowBalanceNotice } from '../server/notifications/lowBalance.js';

const page = fs.readFileSync('src/student/pages/StudentPackagesPage.tsx', 'utf8');

describe('RN-03 renew the same package', () => {
  it('offers "Renew this package" on real packages only, not on cancelled-lesson credits', () => {
    assert.match(page, /!ent\.isCredit && \(ent\.status === 'active' \|\| ent\.status === 'exhausted'\) && \(\s*<button[\s\S]*?startRenew\(ent, catalogItems\)/);
    assert.ok(page.includes("'Renew this package'") && page.includes("'جدّد نفس الباقة'"));
  });

  it('pre-selects the same catalogue item, lesson length and learner, and never sends a price', () => {
    const fn = page.slice(page.indexOf('const startRenew'), page.indexOf('const handleSelectPackage'));
    assert.ok(fn.includes('c.id === ent.packageCatalogId'), 'matches the same catalogue item');
    assert.ok(fn.includes('setPackageMinutes('), 'selects the same lesson length');
    assert.ok(fn.includes('setSelectedLearnerId(ent.learnerStudentId)'), 'selects the same learner');
    assert.ok(!/price/i.test(fn), 'renewal never touches a price; the server computes it');
  });

  it('still requires the terms and early-start boxes before buying', () => {
    assert.match(page, /canSelect=\{acceptedTerms && acceptedEarlyStart\}\s*onSelect=\{handleSelectPackage\}\s*isRenewTarget=/);
    const payload = page.slice(page.indexOf('const handleSelectPackage'));
    assert.ok(payload.includes('{ packageCatalogId: catalogItem.id, acceptedTerms, acceptedEarlyStart }'));
  });

  it('the low-balance notice links to the renew view of that package', () => {
    assert.strictEqual(lowBalanceNotice(2, 8, null, 'ent-9').link, '/student/packages?renew=ent-9');
    assert.strictEqual(lowBalanceNotice(0, 8, null, 'ent-9').link, '/student/packages?renew=ent-9');
    assert.ok(page.includes("searchParams.get('renew')"));
  });
});
