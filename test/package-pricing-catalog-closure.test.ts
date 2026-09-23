/**
 * ====================================================================
 * WATAZAWWADO — PACKAGE PRICING SOURCE-OF-TRUTH CLOSURE
 * File: test/package-pricing-catalog-closure.test.ts
 *
 * STATIC/SOURCE verification that the package catalog is the ONLY source
 * of package prices, and that no stale hardcoded / synthetic fallback can
 * fabricate prices again. These inspect source; they do NOT prove live
 * production behaviour (no production credentials here).
 *
 * Invariants:
 *  - the old hardcoded client fallback catalog is gone
 *  - the server no longer fabricates a synthetic catalog when Supabase is off
 *  - the UI renders the server catalog exactly (price/currency/lesson_count)
 *  - the UI shows a truthful unavailable state (never fabricated rows)
 *  - package selection sends ONLY the package identity, never a price
 *  - weekly / monthly grouping is present
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pagePath = path.join(root, 'src/student/pages/StudentPackagesPage.tsx');
const apiPath = path.join(root, 'api/index.ts');

const page = fs.readFileSync(pagePath, 'utf-8');
const api = fs.readFileSync(apiPath, 'utf-8');

// Isolate the GET /api/student/packages handler for server-side assertions.
const handlerStart = api.indexOf("app.get('/api/student/packages'");
const handlerEnd = api.indexOf("app.post('/api/student/packages/select'", handlerStart);
const packagesHandler = api.slice(handlerStart, handlerEnd > handlerStart ? handlerEnd : undefined);

describe('Package pricing closure — no stale hardcoded fallback', () => {
  it('StudentPackagesPage.tsx no longer defines a fallbackCatalog', () => {
    assert.ok(!page.includes('fallbackCatalog'), 'fallbackCatalog must be removed');
  });

  it('does not contain the obsolete fallback ids', () => {
    for (const stale of ['catalog-4-lessons', 'catalog-8-lessons', 'catalog-12-lessons']) {
      assert.ok(!page.includes(stale), `stale fallback id must be gone: ${stale}`);
    }
  });

  it('does not contain the obsolete fabricated price values as price_amount', () => {
    for (const stale of ['price_amount: 80', 'price_amount: 150', 'price_amount: 215']) {
      assert.ok(!page.includes(stale), `stale fabricated price must be gone: ${stale}`);
    }
  });
});

describe('Package pricing closure — server never fabricates a catalog', () => {
  it('the packages handler has no synthetic catalog rows', () => {
    for (const stale of ['catalog-4-lessons', 'catalog-8-lessons', 'catalog-12-lessons']) {
      assert.ok(!packagesHandler.includes(stale), `server must not fabricate: ${stale}`);
    }
  });

  it('the packages handler has no hardcoded 80 / 150 / 215 price rows', () => {
    assert.ok(!packagesHandler.includes('price_amount: 80'));
    assert.ok(!packagesHandler.includes('price_amount: 150'));
    assert.ok(!packagesHandler.includes('price_amount: 215'));
  });

  it('when Supabase is unavailable it returns a truthful 503, not fake rows', () => {
    assert.ok(packagesHandler.includes("if (!supabaseAdmin)"), 'must guard missing admin client');
    assert.ok(packagesHandler.includes('PACKAGE_CATALOG_UNAVAILABLE'), 'must expose an unavailable code');
    assert.ok(packagesHandler.includes('catalogAvailable: false'), 'must signal catalog unavailable');
    // The unavailable branch must not carry a non-empty catalog.
    assert.match(packagesHandler, /catalogAvailable:\s*false[\s\S]{0,400}?catalog:\s*\[\]/, 'unavailable branch must return an empty catalog');
  });

  it('a catalog read error fails truthfully (no fabrication)', () => {
    assert.ok(packagesHandler.includes('catalogError'), 'must handle catalog read errors');
  });
});

describe('Package pricing closure — UI is server-catalog authoritative', () => {
  it('reads the catalog only from the server payload', () => {
    assert.match(page, /const catalogItems = Array\.isArray\(data\.catalog\) \? data\.catalog : \[\]/, 'catalog must come from server payload only');
  });

  it('renders price from the server row (price_amount) and never computes a price', () => {
    assert.ok(page.includes('cat.price_amount') || page.includes('price_amount'), 'must render server price_amount');
    // No client-side assignment of an authoritative price.
    assert.ok(!/price_amount\s*[:=]/.test(page), 'client must not assign price_amount');
  });

  it('renders currency and lesson_count from the server row', () => {
    assert.ok(page.includes('cat.currency') || page.includes('cat?.currency'), 'must use server currency');
    assert.ok(page.includes('lesson_count'), 'must use server lesson_count');
  });

  it('shows a truthful unavailable state when the catalog is empty', () => {
    assert.ok(page.includes('packages-unavailable'), 'must have an unavailable state node');
    assert.ok(page.includes('الباقات غير متاحة حالياً'), 'must include AR unavailable copy');
    assert.ok(page.includes('Packages are temporarily unavailable'), 'must include EN unavailable copy');
  });

  it('does not throw a generic error on unavailable catalog; surfaces server message', () => {
    assert.ok(page.includes('catalogAvailable: false'), 'client must mark catalog unavailable');
    assert.ok(page.includes('error_ar'), 'client must read server AR unavailable message');
  });
});

describe('Package pricing closure — purchase identity only, no client price', () => {
  it('select submits only packageCatalogId (+ learner), never a price', () => {
    assert.match(page, /payload[^=]*=\s*\{\s*packageCatalogId:\s*catalogItem\.id\s*\}/, 'select payload must be identity-only');
    // Isolate the request payload object and prove it carries no price fields.
    const fnIdx = page.indexOf('handleSelectPackage');
    const bodyIdx = page.indexOf('JSON.stringify(payload)', fnIdx);
    const payloadDecl = page.slice(fnIdx, page.indexOf('const res = await fetch', fnIdx));
    assert.ok(!/price_amount/.test(payloadDecl), 'select payload must not carry a client price');
    assert.ok(!/pricePaid/.test(payloadDecl), 'select payload must not carry a paid price');
    assert.ok(bodyIdx > -1, 'must send JSON.stringify(payload)');
  });

  it('calls the existing purchase endpoint unchanged', () => {
    assert.ok(page.includes("'/api/student/packages/select'"), 'must use existing select endpoint');
  });
});

describe('Package pricing closure — weekly / monthly grouping', () => {
  it('groups by the real package_type', () => {
    assert.ok(page.includes('package_type'), 'must use server package_type for grouping');
    assert.ok(page.includes("weekly: ['Weekly', 'أسبوعية']"), 'must label weekly AR/EN');
    assert.ok(page.includes("monthly: ['Monthly', 'شهرية']"), 'must label monthly AR/EN');
  });

  it('exposes grouping test ids for verification', () => {
    assert.ok(page.includes('package-group-'), 'must expose per-group test ids');
  });
});
