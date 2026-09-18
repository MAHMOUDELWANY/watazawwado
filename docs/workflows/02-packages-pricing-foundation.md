# Workflow 02 — Package pricing foundation

## Implemented model

This repository now includes the minimal persistent package-credit foundation required by the approved business rule set.

### Tables

- `package_catalog`: server-authoritative catalog rows containing package type, name, lesson count, price, currency, activity status, and future eligibility metadata.
- `package_entitlements`: account-scoped entitlements showing which parent account acquired a package, the learner context, price paid, acquisition time, and remaining/used credit state.
- `package_credit_ledger`: auditable ledger of grant, completion consumption, no-show consumption, and no-show return events. The ledger is the source of truth for credit activity and is protected from direct browser writes.
- `bookings.package_entitlement_id`: optional booking linkage that allows a booking to be tied to an entitlement without forcing every lesson into a package flow.

### Lifecycle

- Booking creation does not consume a credit.
- Booking confirmation does not consume a credit.
- Reschedule does not create a new credit event.
- Teacher completion consumes exactly one credit for booked lessons tied to a package entitlement.
- Teacher no-show requires an explicit decision: `credit_used` or `credit_returned`.
- Repeated lifecycle calls remain idempotent because the credit ledger keys are unique by booking and activity type.

### Security and RLS

- `package_catalog` is readable by anonymous and authenticated users for active catalog visibility only.
- `package_entitlements` can be read and updated only by the owning authenticated account.
- `package_credit_ledger` cannot be mutated directly from the browser; only server-side SQL functions may write it.
- All package credit logic is enforced server-side through security-definer functions with `SET search_path` fixed to the public schema.
- The teacher outcome RPC remains the authoritative place to apply the lifecycle outcome and corresponding package-credit effects.

### Payment boundary

Payment is intentionally not implemented in this workflow. Package entitlements are stored in a safe future-payment boundary: they remain `pending_payment` until a future payment confirmation path sets them active. No fake payment success is granted from frontend state.

### Production migration reference

The production migration is recorded in the repository as:

- `supabase/migrations/20260918000000_package_credit_foundation.sql`

This migration adds the package tables and the server-side lifecycle enforcement needed to preserve credit integrity.

### Known future decisions

The following remain future business decisions and are intentionally not implemented here:

- expiration policies
- refund windows
- recurring billing or automatic renewal
- late cancellation penalties
- any package eligibility rules beyond the safe, explicit entitlement model

### Validation status

The local implementation includes focused lifecycle validation for explicit no-show credit decisions and the package-credit foundation. Production migration execution was not possible from this environment because Supabase production credentials and deployment access were not available in-session.
