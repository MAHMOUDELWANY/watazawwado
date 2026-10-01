# PHASE C AUDIT REPORT

## 1. Current Architecture
The Watazawwado package system consists of:
- `package_catalog`: The source of truth for packages (pricing, lessons, rules).
- `package_entitlements`: Represents a user's purchased package.
- `package_credit_ledger`: An immutable log of credit grants and usage.
- `bookings`: Link directly to `package_entitlement_id`.

## 2. Current Pricing Flow
1. Fetch `package_catalog` (via `GET /api/student/packages`).
2. Choose a package on the frontend UI.
3. Submit a selection via `POST /api/student/packages/select` with `packageCatalogId` and `learnerStudentId`.
4. The backend securely retrieves `lesson_count` and `price_amount` from `package_catalog` and creates a `package_entitlements` record with status `pending_payment`.
5. Upon successful payment verification (handled by teacher via `activate_package_entitlement_atomic` RPC in `api/index.ts` / `PUT /api/dashboard/packages/activate`), the entitlement is activated, and credits are granted via `package_credit_ledger`.

## 3. Gap Analysis
Currently, `package_catalog` assumes a predefined set of static packages (e.g., 4-Lesson, 8-Lesson, 12-Lesson bundles).
The `package_catalog` table structure is:
- `package_type` (weekly, monthly)
- `name`
- `lesson_count` (e.g. 4, 8, 12)
- `price_amount` (e.g. 80, 150)
- `eligibility_rules` (JSONB)

Flexible quantities are not supported natively by `package_catalog` because:
- The catalog is purely a list of explicit predefined rows.
- A parent wanting "3 lessons/week" would need an exact row in the `package_catalog` where `lesson_count=3` and `package_type='weekly'`. If it doesn't exist, they can't buy it.

## 4. Recommended Data Model
The smallest safe evolution is to modify the `package_catalog` table (or how it is used) to support flexible quantity constraints.

Given the prompt constraint: "If the current schema can safely support flexible plans without schema changes: DO NOT create a migration."

We CAN support flexible plans by simply defining a row in `package_catalog` for EVERY allowed quantity.
Example:
- row 1: weekly, 1 lesson, $20
- row 2: weekly, 2 lessons, $40
- row 3: weekly, 3 lessons, $60
- row 4: monthly, 4 lessons, $80
- row 5: monthly, 8 lessons, $150

The UI groups them:
Step 1: Choose Frequency (Weekly / Monthly)
Step 2: Choose Quantity (which just filters the `package_catalog` rows).
Step 3: Choose Learner
Step 4: Show authoritative price (from the matching `package_catalog` row).

This requires ZERO database schema changes. The business owner configures allowed quantities and prices by simply adding rows to `package_catalog`. The server resolves the price by finding the exact `package_catalog` row matching the selected quantity and type.

## 5. Pricing Model
Quantity -> Price should be resolved by mapping the chosen quantity and period to a specific row in the `package_catalog`.
The frontend submits `packageCatalogId` (or `packageType` + `lessonCount` which the server resolves to a `packageCatalogId`).
To keep API compatibility, the frontend should just fetch all active rows from `package_catalog`, group them by `package_type`, and let the user pick a quantity. The selected quantity corresponds to a specific `packageCatalogId`, which is sent to the server. The server verifies the `packageCatalogId` and uses its authoritative `price_amount` and `lesson_count`.

## 6. Historical Pricing
Historical prices are preserved because `package_entitlements` has a `price_paid` column that copies the `price_amount` from `package_catalog` at the time of purchase. Even if the catalog row is changed or deactivated later, the entitlement retains the exact paid price.

## 7. Multi-Child Impact
Phase B learner assignment is preserved. The purchase flow still includes selecting a learner, and `package_entitlements` stores `learner_student_id`.

## 8. Booking Impact
Phase A redemption remains completely unchanged. `package_entitlements` works exactly as before.

## 9. Security Impact
No RLS or RPC changes are required. The server continues to fetch `price_amount` securely from `package_catalog` based on the requested `packageCatalogId`. Client input for price is ignored.

## 10. Migration Required?
NO.
The existing `package_catalog` table has `lesson_count`, `package_type`, and `price_amount`. By treating each allowed quantity as a distinct row in the catalog, we can build a flexible UI on top of the existing data model without any schema changes.

## 11. Implementation Plan
1. Update `GET /api/student/packages` (or create a new endpoint/logic) to return the catalog grouped by `package_type` and sorted by `lesson_count`.
2. Update the frontend UI to present a 4-step wizard:
   - Step 1: Choose frequency (Weekly / Monthly).
   - Step 2: Choose quantity (based on available `lesson_count` for that frequency in the catalog).
   - Step 3: Choose learner.
   - Step 4: Display total price (from the catalog) and proceed to payment/claim.
3. Ensure backend `POST /api/student/packages/select` cleanly handles the existing `packageCatalogId` flow.

## 12. Open Business Decisions
- Does the business want to support a truly arbitrary mathematical formula (e.g., entering "17 lessons")? If so, the catalog-row-per-quantity approach won't scale perfectly, but for reasonable boundaries (e.g., 1-5 weekly, 4-20 monthly), it scales perfectly and avoids complex math logic, proration, and discounts in the DB. Given the prompt's strong stance against inventing behavior, treating each allowed quantity as an explicit catalog row is the safest, most authoritative MVP.
