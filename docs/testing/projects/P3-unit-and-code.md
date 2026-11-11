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

## Carry-over from P2 (2026-11-11, read before starting)
P2 drove 34 flows end to end and found the database and the code disagree in places. Do these first:
1. **Database vs migrations.** Two functions the server calls, `teacher_reschedule_booking` and
   `teacher_cancel_booking`, exist in `supabase/migrations/20260908000008_*.sql` but not in production (P2-009). The
   unique trial indexes also differed from what the code assumed (P2-003). Compare production with the migrations
   for every table, column, index, constraint, RLS policy and function (`pg_proc`, `pg_indexes`, `pg_policies`,
   `information_schema`), and list each difference. Every `supabase.rpc('<name>')` in `api/` and `server/` must
   exist; add a test that reads the names from the source and checks them against a list kept in `test/`.
2. **Tests that only read source text** (for example `review-2026-11-07-trial-per-learner` passed while a
   second child could not book at all). For each flow, add one that really inserts rows.
3. **Money.** P2-008 (an admin can confirm any amount); package selection piles up unpaid rows (P2-019); the
   refund path with a real Stripe refund; webhook signature with a real event body; a payment in a currency other
   than USD; a discount code with a per-account limit; gift codes; low-balance notice.
4. **Untested journeys** (their screens open clean in `e2e/pages.spec.ts`, the logic is not driven): placement
   test and teacher review, homework and homework sets, recitations, curriculum player and reports, progress
   report and certificates, lesson room join window and attendance (Zoom webhook), lesson feedback, community and
   Hall of Honor, family reviews, referrals, gifts, sponsorship, payroll and payouts, CRM, leads, waitlist waves,
   university licences, teacher settings and files, bulk cancel, moving a lesson to another teacher, pay-later
   approval, privacy delete request, staff invite and set-password, the sign-up code.
5. **Local secrets** (P2-001): without real Brevo, Zoom, Gemini, Google, VAPID and a valid Stripe test key, emails,
   meetings and AI cannot be exercised. Ask the owner for the values (or test-mode ones) before testing those.
6. **Daylight saving.** No change falls inside the 60-day booking window until late March; use fixed clocks in unit
   tests for `isOnLaterDay`, `nextWeekSlot`, reminders and availability around the 2027 changes in London, New York
   and Cairo.
Details and the list of open items are in `docs/testing/findings/p2.md` (end of file).
