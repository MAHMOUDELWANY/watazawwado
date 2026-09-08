# Task 0.48: Production Runtime Booking Verification & Live Status Report

## 1. Pre-deployment Production state
Direct live HTTP probes against the production Supabase project `fmwxqyroyxgigvpahpri` (`https://fmwxqyroyxgigvpahpri.supabase.co`) were executed using the production public anon key extracted from the deployed production assets (`index-Cuc0jdQK.js`):

- **`public.services` Table Schema**:
  - `id`: `TEXT` (values: `'quran-reading'`, `'quran-memorization'`, `'english'`, etc.)
  - `hourly_rate_usd`: `NUMERIC(10,2)` (verified values: `7.00`, `10.00`)
  - `trial_allowed`: `BOOLEAN` (verified values: `true`)
  - `price_hourly_usd`: **DOES NOT EXIST** (HTTP 400, Postgres error `42703: column services.price_hourly_usd does not exist`)
  - `trial_eligible`: **DOES NOT EXIST** (HTTP 400, Postgres error `42703: column services.trial_eligible does not exist`)

- **`public.create_booking_atomic(jsonb)` Live Runtime Behavior**:
  - Live probe with a valid trial booking payload to `POST https://fmwxqyroyxgigvpahpri.supabase.co/rest/v1/rpc/create_booking_atomic` returned:
    ```json
    {"code":"42703","details":null,"hint":null,"message":"column \"price_hourly_usd\" does not exist"}
    ```
  - Live probe with a valid regular booking payload returned:
    ```json
    {"code":"42703","details":null,"hint":null,"message":"column \"price_hourly_usd\" does not exist"}
    ```
  - **Verdict**: The live production database function is undeniably executing the stale SQL statement `SELECT id, title, price_hourly_usd, trial_eligible INTO v_service FROM public.services WHERE id = v_service_id;`, which immediately crashes because the live table uses `hourly_rate_usd` and `trial_allowed`.

## 2. Root cause
The production database runtime exhibits an active schema mismatch:
1. The table `public.services` in production project `fmwxqyroyxgigvpahpri` was previously updated or seeded using canonical column names (`hourly_rate_usd`, `trial_allowed`).
2. However, the stored procedure `public.create_booking_atomic(jsonb)` in production was never updated with the Task 0.47 migration (`20260908000005_fix_booking_rpc_service_id_text.sql`).
3. Consequently, any booking submission (whether guest or student, trial or regular) that invokes the RPC crashes with `42703: column "price_hourly_usd" does not exist`.

## 3. Deployment
- **Target Project ID**: `fmwxqyroyxgigvpahpri`
- **Required Forward Migration**: `supabase/migrations/20260908000005_fix_booking_rpc_service_id_text.sql`
- **Application Status**: **BLOCKED (NOT APPLIED TO REMOTE)**
- **Reason**: The automated execution container does not possess `SUPABASE_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` (container contains placeholder `'your-service-role-key'`), or direct Postgres connection strings. Executing `npx supabase db push --project-ref fmwxqyroyxgigvpahpri` yields:
  ```text
  Access token not provided. Supply an access token by running supabase login or setting the SUPABASE_ACCESS_TOKEN environment variable.
  ```
- **Action Required**: An authorized database administrator must apply `20260908000005_fix_booking_rpc_service_id_text.sql` via the Supabase Dashboard SQL Editor or via Supabase CLI with a valid management token.

## 4. Post-deployment live function
- **Service ID Type**: In local verified source migration, `v_service_id` is declared as `TEXT` and extracted as `trim(COALESCE(p_booking->>'service_id', ''))` (preventing `operator does not exist: text = uuid`). On live remote, the function has not yet been replaced.
- **Canonical Service Columns**: Migration `20260908000005` references `hourly_rate_usd` and `trial_allowed`.
- **Security Properties**: Retains `SECURITY DEFINER`, `SET search_path = public, pg_temp`, schema-qualified `extensions.gen_random_bytes`, `extensions.crypt`, and `extensions.gen_salt`.
- **Token Behavior**: Injects both `management_token` and `management_token_hash` into `public.bookings`.

## 5. Guest booking smoke test
- **Execution Status**: **PERFORMED AGAINST LIVE REMOTE — FAILED (E2E BLOCKED)**
- **Forensic Response**:
  ```text
  POST https://fmwxqyroyxgigvpahpri.supabase.co/rest/v1/rpc/create_booking_atomic
  Payload: { "p_booking": { "contact_name": "Test Guest", "service_id": "quran-reading", ... } }
  Result: HTTP 400 {"code":"42703","message":"column \"price_hourly_usd\" does not exist"}
  ```
- **Student ID Behavior**: In the local contract, `student_id` is enforced to `NULL` for guests. Because the remote function fails at the service lookup step, persistence of the booking was blocked by the remote Postgres error.
- **Tokens**: No tokens were exposed or written to logs.

## 6. Authenticated student smoke test
- **Execution Status**: **BLOCKED**
- **Reason**: Live database function crashes prior to ownership execution due to error `42703`.
- **Local Contract Verification**: Verified through static test suite (`test/task-0.39-student-booking-ownership-and-auth-hardening.test.ts` and `test/task-0.48-production-runtime-booking-verification.test.ts`):
  - Valid authenticated user resolves to authenticated `student_id`.
  - Foreign student ID yields `P0003: Forbidden. Cannot create a booking on behalf of another student.`
  - Guest specifying student ID yields `P0003: Forbidden. Unauthenticated guests cannot specify a student ID.`

## 7. Demo isolation
- **Demo Path**: `/student/demo`
- **RPC Invocation**: **ZERO**. `StudentDemoPage.tsx` does not call `create_booking_atomic` or `bookingRepository.createBooking`.
- **Database Mutations**: **NONE**. The demo operates in memory with mock static state and displays an explicit banner: `"Interactive Demo Mode: Exploring as Guest with sample data. No real bookings or accounts are created."`

## 8. Integration verification
- **Endpoint**: `/api/integrations/sync-booking`
- **Behavior**: Client repository initializes `integrationStatus: 'pending'`. Only upon successful HTTP response from the integration sync endpoint is `integrationStatus` updated. If sync fails, the booking confirmation reflects `'pending'` and does not claim false sync success.

## 9. Test results
- Full repository test suite passes with **136 passing tests** across **19 test suites** (0 failures, 0 skipped).
- Covers all ownership hardening, guest isolation, demo separation, schema invariants, and forensic regression tests.

## 10. Build / lint / typecheck
- **Lint (`tsc --noEmit`)**: PASS (0 errors)
- **Build (`vite build && esbuild server.ts`)**: PASS (produced `dist/index.html`, `dist/assets/`, and bundled `dist/server.cjs` in 8.22s)
- **Applet Compilation (`compile_applet`)**: SUCCESS

## 11. Migration drift
- **Local Migration Chain**:
  - `20260908000004_fix_booking_rpc_schema_alignment.sql`
  - `20260908000005_fix_booking_rpc_service_id_text.sql`
- **Remote Production State**:
  - `create_booking_atomic` remains on the pre-Task-0.47 definition referencing `price_hourly_usd`.
  - Migration history table on remote cannot be inspected without service role or CLI credentials.

## 12. Remaining risks
1. **Live Booking Failure**: Until migration `20260908000005_fix_booking_rpc_service_id_text.sql` is executed on project `fmwxqyroyxgigvpahpri`, real booking submissions through the website will fail with `column "price_hourly_usd" does not exist`.
2. **Credential Gap**: The execution environment does not have direct write access to the production Supabase database, requiring manual administrator intervention via the Supabase Dashboard SQL editor.

---

### PRODUCTION VERIFICATION BLOCKED
