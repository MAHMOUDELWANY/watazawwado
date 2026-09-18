# Workflow 03-A: Package Catalog + Pricing Integration

## Overview
This document outlines the implementation of the read-only Package Catalog integration into the booking flow. The objective is to securely expose the existing `public.package_catalog` records to the frontend and carry an optional package selection through the booking domain, without creating an unauthorized purchase/payment transaction.

## Current Package Model
- **Single Lesson:** Standalone purchase. This remains the default booking behavior.
- **Weekly Package:** Fixed prepaid bundle (not a recurring subscription).
- **Monthly Package:** Fixed prepaid bundle (not a recurring subscription).
- **Credits:** Bookings do not consume credits until the actual lesson is completed.
- **Pricing Authority:** Prices are always calculated server-side. The frontend fetches the catalog and prices for display, but does not provide them as authoritative inputs to the booking creation.

## Implementation Details

### Catalog Source of Truth
The existing `public.package_catalog` table (which is already live in the Production project `fmwxqyroyxgigvpahpri`) acts as the canonical source. No new schema modifications or `package_catalog` tables were fabricated for this release.

### Server-Authoritative Pricing & Validation
- **Read-Only API:** Added a secure server-side proxy (`/api/packages`) to fetch active package offers.
- **Single Lesson Compatibility:** The `create_booking_atomic` RPC remains completely unchanged. `fee_amount_usd` retains its semantic meaning of the *single lesson cost* and is not overridden.
- **Future Pricing Validation:** The actual package purchase and validation logic will be part of the future payment flow (Workflow 03-B/C), ensuring that unverified client package selections cannot bypass single-lesson pricing.

### UI Integration
- **StepLessonType.tsx:** Dynamically fetches and renders the package catalog. The UI falls back to just "Single Lesson" if no active packages are returned.
- **StepReviewSummary.tsx:** Correctly summarizes whether a package was chosen and shows the upfront purchase price if selected, making the intent clear before submission.
- **Booking Flow State:** Stores the `selectedPackageId` optionally.

## What Remains Intentionally Deferred
1. The actual **package payment/checkout flow** (e.g. charging $70 for a monthly package).
2. The creation of `package_entitlements` upon purchase.
3. The consumption logic that subtracts package credits when a lesson is marked completed.
4. Saving the `package_catalog_id` or `package_entitlement_id` directly onto the booking row at creation time. This mapping occurs post-purchase.

## Production Verification Status
- Tests written for UI Integration and Backend API behavior (`test/task-03-a-package-catalog.test.ts`).
- `npm run test`, `npm run lint`, and `tsc --noEmit` pass the relevant booking validation gates without regression.
- No Supabase migration was required, meaning zero risk of production schema drift or RLS regression.
