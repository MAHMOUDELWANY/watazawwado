/**
 * ====================================================================
 * WATAZAWWADO — OFFER PURCHASABILITY RESOLVER (INTENTIONALLY CONSERVATIVE)
 * File: server/pricing/offerPurchasability.ts
 *
 * ROLE
 *   Decide, purely and server-side, whether a teacher-approved offer can be
 *   fulfilled through the EXISTING package purchase architecture.
 *
 * PRODUCT DECISION (this phase — Option C)
 *   The existing package foundation requires:
 *     package_entitlements.package_catalog_id = NOT NULL
 *     FK -> package_catalog, and the price is carried by the catalog/entitlement
 *     purchase model (fixed bundles).
 *   Therefore the existing architecture provides NO verified carrier for an
 *   arbitrary teacher-approved CUSTOM per-lesson price. Custom-price purchase
 *   is INTENTIONALLY DEFERRED.
 *
 * GUARANTEES
 *   - Never manufactures a catalog entry.
 *   - Never trusts a browser-supplied price, catalog id, or entitlement id.
 *   - Never converts a custom price into a fake catalog price.
 *   - Fails closed: any ambiguity => not purchasable.
 *   - Future-ready: if a genuine active catalog row exactly matches the
 *     approved price (and currency), the existing purchase flow is used.
 * ====================================================================
 */

export interface CatalogEntry {
  id: string;
  price_amount: number;
  currency: string | null;
  lesson_count?: number | null;
  is_active?: boolean | null;
}

export interface PurchasabilityOfferInput {
  approved_price_usd: number;
  currency?: string | null;
}

export interface PurchasabilityResult {
  purchasable: boolean;
  packageCatalogId: string | null;
  reason: string;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Resolve purchasability from ACTUAL catalog data.
 *
 * A match requires EXACTLY ONE active catalog row whose price (2dp) equals the
 * approved price (2dp) and whose currency matches. Zero or multiple matches
 * fail closed (ambiguous / absent), producing the deferred, non-purchasable
 * state. This never invents data and never accepts client input as authority.
 */
export function resolveOfferPurchasability(
  offer: PurchasabilityOfferInput,
  activeCatalog: CatalogEntry[]
): PurchasabilityResult {
  const price = Number(offer?.approved_price_usd);
  if (!Number.isFinite(price) || price <= 0) {
    return { purchasable: false, packageCatalogId: null, reason: 'invalid_approved_price' };
  }

  const currency = (offer.currency || 'USD').toUpperCase();
  const catalog = Array.isArray(activeCatalog) ? activeCatalog : [];

  const matches = catalog.filter((row) => {
    if (!row || row.is_active === false) return false;
    const rowCurrency = (row.currency || 'USD').toUpperCase();
    return round2(Number(row.price_amount)) === round2(price) && rowCurrency === currency;
  });

  if (matches.length === 0) {
    return {
      purchasable: false,
      packageCatalogId: null,
      reason: 'no_matching_active_catalog_custom_price_deferred',
    };
  }
  if (matches.length > 1) {
    return {
      purchasable: false,
      packageCatalogId: null,
      reason: 'ambiguous_catalog_match',
    };
  }

  return { purchasable: true, packageCatalogId: matches[0].id, reason: 'matched_active_catalog' };
}

/** Calm, non-commercial, truthful copy for a deferred custom offer. */
export const CUSTOM_OFFER_PURCHASE_UNAVAILABLE = {
  en: 'Ustadh Mahmoud approved this offer, but online purchase for this custom price is not available yet. The custom purchase step will be added once the appropriate purchase structure is approved.',
  ar: 'الأستاذ محمود وافق على العرض ده، لكن إتمام الدفع أونلاين للسعر المخصص ده غير متاح حاليًا. هنضيف خطوة الشراء المخصصة بعد اعتماد البنية المناسبة.',
};
