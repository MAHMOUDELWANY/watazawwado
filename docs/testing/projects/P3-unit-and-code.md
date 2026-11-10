# P3: Code, unit by unit

After P1. Can run in parallel with P2 and P4. Suggested model: Opus 5.5, effort high.

Read first: `docs/testing/RULES.md`, `docs/testing/FLOWS.md`, root `RULES.md`, `CLAUDE.md` (graphify rules).
QA accounts: `qa-p3`.

## Goal
Every function that touches money, time, access or data has tests for normal, edge and hostile input, and the
code behind each flow is reviewed.

## How
1. Map units to flows with `graphify query` / `graphify explain`; add the test file names to each FLOWS.md row.
2. Priority order: `server/pricing`, `server/payment` (Stripe + PayPal verification, webhooks, refunds),
   `availabilityEngine.ts` and booking RPCs (`create_booking_atomic`, `verify_payment_atomic`...), auth helpers
   (`verifyTeacherAuth`, `verifyStudentAuth`, role checks), packages/credits, discounts/referrals, reminders and
   cron, intake, notifications, curriculum progress and placement, then the rest.
3. For each unit test: boundaries (0, negative, huge, empty, null, wrong type), time zones and DST, currency
   rounding, concurrency (two calls at once), idempotency (same webhook twice), and error paths.
4. Database: read every RLS policy and `SECURITY DEFINER` function in `supabase/migrations/` and test each one
   with the anon key and with another user's session. Check `get_advisors` (security + performance).
5. Code review per flow: dead code, swallowed errors, client-trusted values, missing validation, N+1 queries,
   secrets in client bundles. Use the `code-review` skill on each area.
6. Measure: which endpoints in `api/index.ts` have no test at all. List them in the findings file.

## Output
New tests in `test/` (they run in `npm test`), FLOWS.md test columns, `docs/testing/findings/P3.md`.

## Done when
Money/access/booking units fully covered; every endpoint has at least one test or a finding explaining why not;
tsc + tests + build pass; pushed.
