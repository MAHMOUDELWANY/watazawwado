# Project status — handoff (2026-10-14)

Read this first in a new session, then `RULES.md` (binding owner decisions) and `CLAUDE.md`.

## Where the code is

- Branch `release/2026-10-14-owner-rules` (commit 25b6b56 and later) holds all work. Pushed to GitHub; Vercel builds a **preview** from it.
- `main` and production are still the **old code**. Do not merge to `main` (= production deploy) until the owner tests the preview and says go.
- All database migrations up to `20261014000004` are **already applied to production Supabase** and are compatible with the old live code.

## Done

- Security review and fixes (access control, payments, RLS, tokens, error leaks, OAuth, cron, headers).
- RULES.md with all owner decisions; CLAUDE.md points to it.
- Booking: sign-in required, pay first with a 35-min hold, per-teacher overlap, trial rules (reschedule once ≥1h, 48h cooldown, max 5 lost trials → no more free trials).
- Cancel ≥3h (trial ≥1h), reschedule ≥1h, nothing in the last hour; emergency note → WhatsApp; admin can move any lesson from the dashboard.
- Paid lesson cancelled in time → lesson credit (`student_cancel_paid_lesson_to_credit`). "I prefer a refund" → WhatsApp ready message (14 days, receiving account, terms link), max 3 refunded lessons per account. Admin Refund button on the original payment also voids the credit.
- Approved packages live: $9 and $13 bands × 4/8/12 lessons × 30/45/60 min; band + length enforced on booking; family 5% applied by the server.
- Terms consent checkbox before booking and package purchase; server refuses without it; version stored (`TERMS_VERSION` in `api/index.ts`).
- Terms page rewritten; privacy policy lists Stripe/PayPal, Gemini, HIBP, WhatsApp.
- Free leaked-password check (HIBP k-anonymity) on sign-up and password change (`src/lib/pwnedPassword.ts`).
- Teacher "My hours" page, pay later (12+ paid lessons, admin approval), refunds, teacher reassignment (already existed; now reports lessons still with the old teacher).
- Pricing page and homepage show the approved prices; fake "85% of students" claim removed; WhatsApp number unified to +48508157886.

## Next (in order)

1. Owner tests the Vercel preview (sign-up, trial, paid booking with Stripe test, cancel → credit, refund request, packages). Fix what they find, then merge to `main`.
2. Make the whole site bilingual with the 50/50 friendly tone, starting with the teacher/admin dashboard (English-only today; its language toggle is broken: local state in `DashboardApp`).
3. Clean-up: remove the dead multi-lesson plan code (`MultiLessonPlan.tsx`, `/api/student/multi-lesson-plan`, its RPC) now that packages are bought on the packages page.
4. Admin list for pay-later requests and refund requests (API for pay-later exists; refund requests are marked in `package_entitlements.metadata.refund_requested_at`).
5. Open questions in RULES.md §8 (governing law in terms, trial-limit confirmation, teachers outside Egypt, emails language, AI intake trust, etc.).

## Owner actions outside the code

- **Preview has no database:** in Vercel, the Supabase, Stripe, PayPal, Brevo and Gemini variables are set for Production only, so the preview answers "Database integration is not properly configured". To test the preview, tick **Preview** on SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (and Stripe/PayPal, ideally test-mode keys for Preview), then redeploy the preview. Note: there is only one Supabase project, so the preview uses the real database. APP_URL also points previews to the production domain after payment.

- **Revoke the GitHub token** saved inside the git remote URL (`git remote -v` shows it) and sign in with Git Credential Manager instead.
- Zoom variables are now Production-only, so Zoom links won't be created on preview deployments (expected).
- Supabase "leaked password protection" needs Pro; replaced by the free browser check above.
- Vercel shows "billing address missing" on the account.
