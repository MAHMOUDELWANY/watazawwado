# Task 0.47: Production Booking RPC Schema Reconciliation

## A. Initial state
- Production function `create_booking_atomic` still referenced stale columns (`price_hourly_usd`, `trial_eligible`).
- Production `public.services.id` is explicitly of type `TEXT`.
- The previous local migration (`20260908000004_fix_booking_rpc_schema_alignment.sql`) correctly mapped the canonical column names but incorrectly assumed `v_service_id` should be of type `UUID`, casting the input.
- Applying Task 0.45 blindly would have resulted in an `operator does not exist: text = uuid` exception in Production due to the `WHERE id = v_service_id` filter on `public.services`.

## B. Actual Production schema
Based on verified properties for the Production project `fmwxqyroyxgigvpahpri`:
- `public.services.id` -> `TEXT`
- `public.services.hourly_rate_usd` -> `NUMERIC`
- `public.services.trial_allowed` -> `BOOLEAN`
- `public.bookings.management_token` -> `TEXT NOT NULL`

## C. Root cause
The schema misalignment involved two layers:
1. **Stale Columns**: The original RPC used development column names that did not match Production schema.
2. **Incorrect Service ID Type Assumption**: Even after adjusting columns, the local migrations mistakenly typed `v_service_id` as `UUID`. As the payload parameter returned text, a cast to `UUID` caused a conflict with the DB's `TEXT` column.

## D. Corrective migration
A clean forward migration `20260908000005_fix_booking_rpc_service_id_text.sql` was created to overwrite the RPC:
- Declared `v_service_id TEXT;`.
- Assigned via `v_service_id := trim(COALESCE(p_booking->>'service_id', ''));` (removing `::UUID` cast).
- Exclusively uses `hourly_rate_usd` and `trial_allowed` to match the canonical structure.

## E. Security preservation
The corrected RPC preserves all existing robust constraints:
- Ensures server-side student ownership resolution via `auth.uid()`.
- Implements strict Guest isolation, enforcing `student_id = NULL` and actively rejecting spoofed payload overrides.
- Injects both `management_token` and `management_token_hash` into the booking payload.
- Fully qualifies `pgcrypto` cryptographic generation calls under `extensions.` to safely operate under `search_path = public, pg_temp`.

## F. Production deployment
**Deployment Access Limitation:** Production credentials for Supabase project `fmwxqyroyxgigvpahpri` are completely unavailable in the automated AI Studio environment (`.env` does not contain remote production secrets).
Therefore:
- The migration was generated, syntactically verified, and correctly integrated into the local migration chain.
- It was **not applied directly to Production**. 
- Live function definition re-reading was not performed due to lack of network credentials.

## G. Smoke testing
As authorized direct database connections are unavailable, a live Production end-to-end booking smoke test could not be performed.
- Production RPC deployed locally and structurally verified via static tests.
- End-to-end booking smoke test on Production explicitly not performed due to blocked credential access.

## H. Test results
All tests in the regression suite (including `task-0.45`, `task-0.46`, and new `task-0.47` tests) pass successfully. No regressions were observed in frontend booking wizard submission behaviors or the isolated Guest Demo implementations.

## I. Remaining migration drift
Because the AI agent lacks external network authorization to execute direct database CLI migrations against `fmwxqyroyxgigvpahpri`, local source migrations and Production runtime functions are still technically drifting. A human database administrator must manually run `supabase db push` or execute the contents of `20260908000005_fix_booking_rpc_service_id_text.sql` via the Supabase Dashboard SQL Editor to fully synchronize the environments.
