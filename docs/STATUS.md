# Project status — handoff (2026-10-14)

Read this first in a new session, then `RULES.md` (binding owner decisions) and `CLAUDE.md`.

## Where the code is

- Everything is on `main` and **live in production** (watazawwado.academy) since 2026-10-14. Rollback candidate in Vercel: the previous production deployment (commit 35381f0).
- All database migrations up to `20261014000004` are applied to production Supabase.
- No preview environment: Vercel variables are Production-only by owner choice.

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
- Pricing page and homepage show the approved prices; fake "85% of students" claim removed.
- Only contact number everywhere: WhatsApp +48 508 157 886.
- Emails (Brevo, free plan) redesigned: Arabic + English, logo, brand colours, light/dark, legal footer. Samples in docs/email-previews/. Brevo delivery verified from notification_events (sent OK).
- Production smoke test 2026-10-14: pages 200, 18 packages served, auth required on protected APIs, dev tokens rejected, security headers present.

### Added 2026-10-15
- Emails in one language: English by default, Arabic for people who chose Arabic (cookie + user_language_preferences table). Sender support@watazawwado.academy; Thmanyah font.
- Teachers see no money (API strips payment fields for non-admins; UI hides payment parts). Payment alerts go to the super admin only.
- Teacher 'Ask to reschedule' → student on-site notification; only the admin moves/cancels lessons directly. Dashboard bell + Notifications page for teachers.
- Whole teacher/admin dashboard and staff login bilingual (language shared with the rest of the site). Admin page for pay-later and refund requests.
- Admin can add teachers (invitation email to set a password). Each teacher sets hours in their own time zone.
- Multi-lesson booking code and its RPC removed. Terms: governing law Poland (consumers keep local protection), version 2026-10-15. About page wording per owner.

## Next (in order)

1. Owner tests signed-in flows on production (sign-up, trial, paid booking, cancel → credit, refund request, packages, teacher hours, admin refund/pay-later). Claude cannot create accounts on the live site.
2. Owner tests the teacher dashboard with a real teacher account (add a teacher from the Teachers page).
3. Engineering backlog in RULES.md §8 (AI intake server-side, design system, repo clean-up, Stripe webhook, firewall). Have a lawyer review the terms once.

## Owner actions outside the code

- **Preview has no database:** in Vercel, the Supabase, Stripe, PayPal, Brevo and Gemini variables are set for Production only, so the preview answers "Database integration is not properly configured". To test the preview, tick **Preview** on SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (and Stripe/PayPal, ideally test-mode keys for Preview), then redeploy the preview. Note: there is only one Supabase project, so the preview uses the real database. APP_URL also points previews to the production domain after payment.

- **Revoke the GitHub token** saved inside the git remote URL (`git remote -v` shows it) and sign in with Git Credential Manager instead.
- Zoom variables are now Production-only, so Zoom links won't be created on preview deployments (expected).
- Supabase "leaked password protection" needs Pro; replaced by the free browser check above.
- Vercel shows "billing address missing" on the account.
