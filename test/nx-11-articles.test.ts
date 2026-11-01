import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ARTICLES } from '../src/data/articles.js';
import { PUBLIC_PAGES } from '../src/data/seo.js';

describe('NX-11 articles', () => {
  it('every article is a public page in both languages, with a unique address', () => {
    const slugs = ARTICLES.map((a) => a.slug);
    assert.strictEqual(new Set(slugs).size, slugs.length);
    for (const a of ARTICLES) {
      assert.match(a.slug, /^[a-z0-9-]+$/);
      assert.ok(PUBLIC_PAGES.some((p) => p.path === `/articles/${a.slug}`), a.slug);
      assert.ok(a.bodyEn.length > 3 && a.bodyAr.length > 3, a.slug);
      assert.ok(!Number.isNaN(Date.parse(a.date)), a.slug);
    }
    assert.ok(PUBLIC_PAGES.some((p) => p.path === '/articles'));
  });

  it('articles state no prices (RULES.md §3: link the pricing page instead)', () => {
    for (const a of ARTICLES) {
      const text = JSON.stringify([a.bodyEn, a.bodyAr, a.descEn, a.descAr]);
      assert.doesNotMatch(text, /\$\s?\d|\d\s?(USD|dollars?|دولار)/i, a.slug);
    }
  });
});
