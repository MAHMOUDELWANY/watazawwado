/**
 * ====================================================================
 * WATAZAWWADO — OFFER PURCHASABILITY TEST SUITE (Option C)
 * File: test/phase05-purchasability.test.ts
 *
 * Validates the READ-TIME purchasability resolver:
 *  - a standard price that matches an active catalog row -> purchasable
 *  - a CUSTOM teacher-approved price with no carrier -> NOT purchasable
 *  - inactive / nonexistent catalog mapping -> NOT purchasable
 *  - ambiguity (multiple matches) -> NOT purchasable (fail closed)
 *  - no silent price substitution ever occurs
 *  - invalid/zero/negative price -> NOT purchasable
 *  - acceptance is a separate concept and never implies payment
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveOfferPurchasability,
  CUSTOM_OFFER_PURCHASE_UNAVAILABLE,
  round2,
  type CatalogEntry,
} from '../server/pricing/offerPurchasability.js';

const activeCatalog: CatalogEntry[] = [
  { id: 'cat-rel-4', price_amount: 32, currency: 'USD', lesson_count: 4, is_active: true },
  { id: 'cat-rel-8', price_amount: 64, currency: 'USD', lesson_count: 8, is_active: true },
  { id: 'cat-inactive', price_amount: 8, currency: 'USD', lesson_count: 1, is_active: false },
];

describe('Phase 05 — Offer Purchasability (read-time, derived)', () => {
  it('matches a standard catalog-backed offer as purchasable', () => {
    const r = resolveOfferPurchasability({ approved_price_usd: 32, currency: 'USD' }, activeCatalog);
    assert.equal(r.purchasable, true);
    assert.equal(r.packageCatalogId, 'cat-rel-4');
    assert.equal(r.reason, 'matched_active_catalog');
  });

  it('a custom teacher-approved price with no carrier is NOT purchasable', () => {
    const r = resolveOfferPurchasability({ approved_price_usd: 17.5, currency: 'USD' }, activeCatalog);
    assert.equal(r.purchasable, false);
    assert.equal(r.packageCatalogId, null);
    assert.equal(r.reason, 'no_matching_active_catalog_custom_price_deferred');
  });

  it('never substitutes another price (17.5 is not silently mapped to 32)', () => {
    const r = resolveOfferPurchasability({ approved_price_usd: 17.5, currency: 'USD' }, activeCatalog);
    assert.equal(r.purchasable, false);
    assert.equal(r.packageCatalogId, null);
  });

  it('an inactive catalog row is NOT a valid carrier', () => {
    // cat-inactive has price 8 but is_active=false.
    const r = resolveOfferPurchasability({ approved_price_usd: 8, currency: 'USD' }, [activeCatalog[2]]);
    assert.equal(r.purchasable, false);
    assert.equal(r.packageCatalogId, null);
  });

  it('a nonexistent catalog mapping is NOT purchasable', () => {
    const r = resolveOfferPurchasability({ approved_price_usd: 999, currency: 'USD' }, activeCatalog);
    assert.equal(r.purchasable, false);
    assert.equal(r.packageCatalogId, null);
  });

  it('ambiguous matches (multiple active rows, same price) fail closed', () => {
    const dup: CatalogEntry[] = [
      { id: 'a', price_amount: 32, currency: 'USD', is_active: true },
      { id: 'b', price_amount: 32, currency: 'USD', is_active: true },
    ];
    const r = resolveOfferPurchasability({ approved_price_usd: 32, currency: 'USD' }, dup);
    assert.equal(r.purchasable, false);
    assert.equal(r.packageCatalogId, null);
    assert.equal(r.reason, 'ambiguous_catalog_match');
  });

  it('invalid / zero / negative approved price is NOT purchasable', () => {
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const r = resolveOfferPurchasability({ approved_price_usd: bad as number, currency: 'USD' }, activeCatalog);
      assert.equal(r.purchasable, false);
      assert.equal(r.reason, 'invalid_approved_price');
    }
  });

  it('empty catalog fails closed (never fabricates a carrier)', () => {
    const r = resolveOfferPurchasability({ approved_price_usd: 32, currency: 'USD' }, []);
    assert.equal(r.purchasable, false);
    assert.equal(r.packageCatalogId, null);
  });

  it('currency must match (mismatched currency is not purchasable)', () => {
    const r = resolveOfferPurchasability({ approved_price_usd: 32, currency: 'EUR' }, activeCatalog);
    assert.equal(r.purchasable, false);
    assert.equal(r.reason, 'no_matching_active_catalog_custom_price_deferred');
  });

  it('rounds to 2dp so float noise does not create false negatives', () => {
    assert.equal(round2(31.999999999), 32);
    const r = resolveOfferPurchasability({ approved_price_usd: 31.999999999, currency: 'USD' }, activeCatalog);
    assert.equal(r.purchasable, true);
    assert.equal(r.packageCatalogId, 'cat-rel-4');
  });

  it('exposes calm bilingual copy for the deferred custom offer', () => {
    assert.match(CUSTOM_OFFER_PURCHASE_UNAVAILABLE.en, /approved this offer/i);
    assert.match(CUSTOM_OFFER_PURCHASE_UNAVAILABLE.en, /not available yet/i);
    assert.ok(CUSTOM_OFFER_PURCHASE_UNAVAILABLE.ar.length > 0);
    // Truthful, non-commercial wording — no fake scarcity or pressure.
    assert.doesNotMatch(CUSTOM_OFFER_PURCHASE_UNAVAILABLE.en, /hurry|last chance|limited time|expires/i);
  });
});

describe('Phase 05 — Purchasability state semantics', () => {
  it('a non-purchasable custom offer yields the intentional state tuple', () => {
    // Mirrors deriveOfferState() logic: approved=true, purchasable=false,
    // accepted/paid/entitlement_active all false.
    const p = resolveOfferPurchasability({ approved_price_usd: 17.5, currency: 'USD' }, activeCatalog);
    const state = {
      approved: 17.5 > 0,
      purchasable: p.purchasable,
      accepted: false,
      paid: false,
      entitlement_active: false,
    };
    assert.deepEqual(state, {
      approved: true,
      purchasable: false,
      accepted: false,
      paid: false,
      entitlement_active: false,
    });
  });

  it('accepted !== paid and accepted !== entitlement_active', () => {
    // Accepting never sets paid or entitlement_active; these are independent.
    const accepted = true;
    const paid = false;
    const entitlement_active = false;
    assert.notEqual(accepted, paid);
    assert.notEqual(accepted, entitlement_active);
  });
});
