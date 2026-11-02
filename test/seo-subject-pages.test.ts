import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SUBJECT_PAGES } from '../src/data/subjectPages.js';
import { PUBLIC_PAGES } from '../src/data/seo.js';
import { BOOKABLE_SERVICES } from '../src/booking/mockData.js';

describe('subject landing pages', () => {
  it('every page is a public page with a unique keyword address and working related links', () => {
    const slugs = SUBJECT_PAGES.map((p) => p.slug);
    assert.strictEqual(new Set(slugs).size, slugs.length);
    for (const p of SUBJECT_PAGES) {
      assert.match(p.slug, /^[a-z0-9-]+$/);
      assert.ok(PUBLIC_PAGES.some((x) => x.path === `/learning/${p.slug}`), p.slug);
      for (const r of p.related) assert.ok(slugs.includes(r) && r !== p.slug, `${p.slug} -> ${r}`);
      assert.ok(p.titleEn.length <= 70 && p.descEn.length <= 170, `${p.slug} title/description too long`);
    }
  });

  it('pages cover only bookable subjects, at the price of their band (RULES.md §2b, §3)', () => {
    for (const p of SUBJECT_PAGES) {
      for (const id of p.serviceIds) {
        const s = BOOKABLE_SERVICES.find((b) => b.id === id);
        assert.ok(s, `${p.slug}: ${id} is not bookable`);
        assert.strictEqual(s.hourlyRateUsd, p.rateUsd, `${p.slug}: ${id}`);
      }
      // Any hourly price written in the copy is this page's band.
      const text = JSON.stringify([p.faqEn, p.descEn]);
      for (const m of text.matchAll(/\$(\d+) an hour/g)) assert.strictEqual(Number(m[1]), p.rateUsd, p.slug);
    }
  });
});
