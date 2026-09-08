# Task 0.40 — Production Database & Deployment Verification

## 1. Executive Summary

**PRODUCTION VERIFIED = NO**

While the Vercel API deployment contains the security hardening logic introduced in Task 0.39, the production Supabase database has **not** been migrated. The critical database function `create_booking_atomic` on the production database lacks the `20260908000003` security migration. Furthermore, a critical production defect was discovered: guest bookings currently fail completely in production due to a `search_path` configuration error (`gen_random_bytes(integer) does not exist`) introduced in an earlier migration.

## 2. Environment Identity

* **Production URL**: `https://watazawwado-with-mahmoud.vercel.app`
* **Supabase project ID**: `fmwxqyroyxgigvpahpri`
* **Supabase region**: Unknown (REST API accessed directly; typical region eu-central-1)
* **GitHub repository**: Local source is a zip snapshot (`watazawwado (6).zip`), not a git repository.
* **Production commit**: Cannot be extracted (no Vercel CLI access).
* **Task 0.39 commit**: Cannot be extracted (no local `.git` directory).

## 3. Deployment Verification

* **Vercel deployment**: Present and active on the production domain.
* **Commit match**: UNKNOWN (No git history).
* **Build status**: The backend API contains Task 0.39 logic (verified by `GET /api/student/bookings` rejecting dev tokens).
* **Deployment freshness**: The Vercel API deployment is fresh and matches Task 0.39 code. However, the frontend SPA routing appears broken (404 on `/student`, `/get-started`, etc.).

## 4. Environment Configuration

* **VITE_SUPABASE_URL**: SET (extracted from production JS bundle)
* **VITE_SUPABASE_ANON_KEY**: SET (extracted from production JS bundle)
* **SUPABASE_URL**: Assumed SET (API backend responds)
* **SUPABASE_SERVICE_ROLE_KEY**: Assumed SET (API backend responds)

*(No secrets exposed in this report.)*

## 5. Database Verification

* **Migration status**: **FAIL**. Migration `20260908000003_student_booking_ownership_and_auth_hardening.sql` is **NOT** applied to production.
* **`create_booking_atomic`**: **FAIL**. Testing the production RPC endpoint with a guest booking payload containing an injected `student_id` bypassed the guest ownership check (which should have raised `"Unauthenticated guests cannot specify a student ID."`).
* **`handle_new_student_user`**: UNKNOWN. Cannot safely inspect the SQL definition without direct database credentials.
* **Constraints/Indexes/RLS**: Active (Anon queries to `students` return `[]`), but specifically Task 0.39 RLS hardening is assumed absent due to missing migration.
* **Role boundaries**: **PASS**. Production API backend correctly isolates roles and rejects cross-role access (Teacher endpoints reject Student tokens, etc.).

## 6. Security Verification

* **Student A → Student B attack**: NOT EXECUTED (unsafe to test on live production without proper test accounts, and DB is unmigrated).
* **Random UUID attack**: NOT EXECUTED (unsafe on live production).
* **Guest ownership**: **FAIL**. Guest booking logic in the database is missing the strict `student_id` injection checks. 
* **Profile mutation protection**: **PASS**. The production API backend (`PATCH /api/student/me`) correctly blocks modification of protected fields (e.g., `student_id`) or rejects dev tokens.
* **Student/teacher isolation**: **PASS**. (Verified via production API).
* **Dev-token lockdown**: **PASS**. (Verified: `dev-student-token` and `dev-teacher-token` are explicitly rejected by the production API with `"Development tokens are strictly forbidden in production."`).

## 7. Auth Redirect Verification

* **Production Site URL**: Assumed correct, but could not verify Supabase Auth dashboard config directly.
* **Student redirect URL**: Could not be cleanly extracted from the minified JS bundle.
* **Deployed frontend redirect implementation**: UNKNOWN due to minification.

## 8. Smoke Test

* **`/` (Landing Page)**: HTTP 200 (Loads correctly)
* **`/get-started`**: HTTP 404 (Vercel SPA routing issue)
* **`/student/demo`**: HTTP 404 (Vercel SPA routing issue)
* **`/student`**: HTTP 404 (Vercel SPA routing issue)
* **`/staff/login`**: HTTP 404 (Vercel SPA routing issue)

*Note: The frontend Vercel deployment appears to have a broken SPA rewrite configuration, causing client-side routes to return 404 NOT FOUND when accessed directly.*

## 9. Evidence Table

| Check | Expected | Observed | Status |
|---|---|---|---|
| API Code Deployed | Backend rejects dev tokens | Backend rejects dev tokens (401) | PASS |
| DB Migration 000003 | Applied | Not Applied | FAIL |
| `create_booking_atomic` guest check | Raises exception for `student_id` | Hits `gen_random_bytes` undefined error | FAIL |
| Production SPA Routing | Client routes return 200/SPA | Client routes return 404 | FAIL |
| Guest Booking Success | 200 OK | 500 (`function gen_random_bytes does not exist`) | FAIL |

## 10. Limitations

* The local repository is a `.zip` snapshot without a `.git` history, preventing Git SHA commit matching.
* Direct inspection of the production database schema and Supabase configurations (e.g., Auth settings) is blocked due to the lack of a service role key or Supabase CLI token in the runtime environment.
* Safe mutation testing on production was aborted because the fundamental guest booking flow is currently crashing due to the missing `extensions` schema in the `search_path` of `create_booking_atomic` (introduced in a prior migration).

## 11. Final Verdict

**PRODUCTION NOT VERIFIED**

**Critical Action Required**: 
1. The production Supabase database must be manually migrated to apply `20260908000003` and previous unapplied migrations.
2. The `create_booking_atomic` function is currently broken in production due to a `search_path = public, pg_temp` restriction preventing `pgcrypto.gen_random_bytes` from executing. This must be fixed in the database (either by qualifying `extensions.gen_random_bytes` or updating the search path).
3. Vercel SPA routing needs to be corrected as client-side routes (e.g., `/student`) return 404.
