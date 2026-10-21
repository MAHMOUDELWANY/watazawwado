import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { BOOKABLE_SERVICES } from '../src/booking/mockData.js';

describe('QA-05 SEO', () => {
  const script = fs.readFileSync('scripts/prerender-seo.ts', 'utf8');

  it('the subjects page gets Course structured data from the live catalogue', () => {
    assert.ok(script.includes("if (page.path === '/learning')"));
    assert.ok(script.includes('BOOKABLE_SERVICES.map('));
    assert.ok(script.includes("courseMode: 'Online'"));
    for (const s of BOOKABLE_SERVICES) assert.ok([9, 13].includes(s.hourlyRateUsd as number), `${s.id} matches RULES.md §3`);
  });

  it('the built page carries valid JSON-LD when a build is present', (t) => {
    if (!fs.existsSync('dist/learning.html')) return t.skip('no build');
    const html = fs.readFileSync('dist/learning.html', 'utf8');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const list = blocks.find((b) => b['@type'] === 'ItemList');
    assert.ok(list, 'ItemList present');
    assert.strictEqual(list.itemListElement.length, BOOKABLE_SERVICES.length);
    assert.strictEqual(list.itemListElement[0].item.provider['@id'], 'https://watazawwado.academy/#org');
  });

  it('account areas stay out of search', () => {
    const robots = fs.readFileSync('public/robots.txt', 'utf8');
    for (const p of ['/student', '/dashboard', '/api/']) assert.ok(robots.includes(`Disallow: ${p}`));
    assert.ok(script.includes('noindex, nofollow'), 'the SPA shell is noindex');
  });
});
