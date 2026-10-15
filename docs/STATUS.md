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

### Added 2026-10-16
- Stripe webhook `POST /api/payments/stripe/webhook` (checkout.session.completed / async_payment_succeeded): signature checked with `STRIPE_WEBHOOK_SECRET`, session re-read from Stripe, same fulfilment as the return-page verify. Until the secret is set it answers 503 and nothing changes.
- Stripe webhook endpoint created in the live Stripe account and STRIPE_WEBHOOK_SECRET set in Vercel; verified live (unsigned requests get 400).
- Vercel Firewall (set in the dashboard): "Block exploit probes" (deny /.env, /.git, wp-admin, ...) and "Rate limit AI and contact" (POST to /api/intake/turn, /api/intake/complete, /api/learning-guide, /api/contact: 30/min per IP → 429). Both verified live. Each path must be its own list entry in the dashboard.
- Fix: a wrong-amount payment can no longer be confirmed by a page reload or a retry; it stays for manual review.
- AI intake: /api/intake/turn returns a server-signed intakeToken (HMAC with the service key, bound to the account, 24h); /api/intake/complete accepts only that token, never a browser-supplied profile/assessment. This also fixes saving the brief, which always failed before (the client sent an empty assessment).
- Removed the old manual payment system: student payment-claim routes, hard-coded bank details (server/payment/paymentDetails.ts), the unused PaymentInstructionsCard, the public runtime-supabase-diagnostic route, and the root one-off scripts / Task_*.md reports. Admin record/verify/reject payment in the dashboard stays.

- Privacy policy payment line now says Stripe/PayPal only. Lawyer brief: docs/legal-review-brief.md. Owner test checklist (Arabic): docs/owner-test-checklist.md. Old GitHub branches deleted; unmerged ones kept as archive/* tags.

- PayPal removed as a separate gateway (button, SDK, /api/payments/paypal/capture, /api/payments/config, server/payment/paypalService.ts). PayPal is offered inside Stripe Checkout. Old payments with method paypal stay readable. The dead Payment-methods tab in dashboard settings is hidden (API still accepts the stored legacy value).
- Sign-up/password change in Arabic now shows the leaked-password message instead of "email may be in use".

### Added 2026-10-16 (owner test feedback, 17 items) — deployed, migrations applied
- Migrations 20261016000000 + 20261016000001 are applied in production.
- Speed: booking sync (Calendar/Zoom/emails) runs after the reply via waitUntil (@vercel/functions); the portal no longer reloads the whole page on every click or when the tab regains focus (auth keeps the same user; profile loads once).
- Booking: draft kept in the tab (terms tab, packages page, Stripe cancel all come back to the same step, "Start over" banner); step 1 asks to confirm the onboarding subject/level; "Book again" uses that exact lesson; Cairo time removed from the summary; Zoom-link-pending text explains email + My Lessons + waiting room.
- Lessons: "Reschedule or cancel" opens the self-service panel (was WhatsApp-only text); Join Zoom button in crimson→Zoom-blue (.btn-zoom).
- Onboarding requires exact age (self / each child). Learners take an AI placement test after booking (/student/placement, never blocks booking); admin reviews at /dashboard/placement (on-site only) and continues in chat. Request-more-info button removed. Teacher assistant named Jalila.
- Chat (text only): /student/messages and /dashboard/messages, pinned admin conversation for every account, teacher conversation after booking. Inbox (user_notifications) on the notifications pages.
- Intake "request more info" now sends the question to the student's chat + email and keeps the request in the list.
- Refund: student gets an on-site notice + email (up to 14 days).
- Teacher invite lands on /staff/set-password to choose a password. Supabase Auth → URL configuration must allow https://watazawwado.academy/staff/set-password (or /**).
- Teacher dashboard: "Start as host" fetches a fresh Zoom host link (/api/dashboard/bookings/:id/zoom-host-url). AI assistant page (/dashboard/assistant, first version).
- Homepage AI guide answers from current site facts (server/siteFacts.ts + FAQ) and invites interested visitors to the free trial.

### Added 2026-10-15 (legal review applied)
- Terms version 2026-10-15.2: 14-day withdrawal section with model form, packages refundable within 14 days, 3-refund limit only for the optional credit refund, fairer late-cancel/no-show wording, softer liability clause, no exclusive Polish courts, ODR link removed (platform closed 20 July 2025), new Children & safeguarding, AI assistant and Complaints sections.
- Separate early-start checkbox on paid single bookings and package purchases; server refuses without it (EARLY_START_REQUIRED). Package metadata stores early_start_accepted_at; for bookings the terms_version proves it.
- Privacy: controller, legal basis per purpose, retention periods, all GDPR rights + UODO, transfers outside the EEA, children, deletion "within one month" instead of 48 hours.
- Jalila sends Gemini the student's first name only.
- Teacher agreement (version 2026-10-15) at /staff/agreement: shown right after a new teacher sets a password; every teacher must accept the current version before any dashboard API works (verifyTeacherAuth → 403 AGREEMENT_REQUIRED; super admin exempt). Stored in teacher_accounts.agreement_version/agreement_accepted_at (migration 20261016000002, applied). Teachers page shows who accepted.
- Booking confirmation email repeats the accepted terms version/date + link and, for paid single lessons, the early-start / 14-day withdrawal notice.
- Trader block in the terms: Mahmoud Said Elwany Abdelaal, ul. Stefana Czarnieckiego, Wrocław (not a registered business: no CEIDG/NIP; never publish the PESEL). Owner may add the house number and postal code in `TRADER`.
- Team mailboxes (server/notifications/emailService.ts MAILBOXES): support@ bookings/lessons/reminders/complaints, finance@ payment receipts + refund notices, hr@ emails to teachers, info@ welcome email + general contact, privacy@ data requests. If Brevo rejects a mailbox as sender, the email is resent from support@ with Reply-To that mailbox.
- check_trial_eligibility RPC no longer callable by anon/authenticated (migration 20261016000003, applied). The *_by_management RPCs stay: token-checked and used by the payment-return and manage-booking pages.
- Welcome recitation: shared player (src/lib/welcomeAudio.ts). Homepage tries to play on the first visit of a session; if the browser blocks it, the first time ever an animated hint asks to tap the sound button (any tap starts it). Menu has "Play the welcome recitation" (unlimited); floating stop button on all public pages; site tour step explains it.
- Two teachers: Ustadh Mahmoud (mhmwdlwany4222@gmail.com) and Ustadha Afnan (invite pending: n.ankhaled1052003@gmail.com, female). Extra teacher account mhmwdlwany42@gmail.com deleted (no lessons/students). Afnan's photo: public/ustadha-afnan.jpg (640) + teacher-afnan-avatar.jpg (160); shown on the homepage hero, the About page (her bio: same subjects as Mahmoud, wide teaching experience, C1 English; no subject line under either photo on the homepage, by owner request) and onboarding. Lesson-flow texts say "your teacher"; owner/contact/payment-review texts still name Mahmoud.
- Public redesign (2026-10-15): khatam pattern + brand lights (.khatam-field, .brand-lights), mihrab arches (.arch-top, .arch-tile, .portrait-frame), logo ribbon gradient (.text-ribbon), PageHero on every inner public page, verse band on the homepage (Amiri Quran loaded only for the verse letters). Next owner step: redesign the account areas (student portal, then teacher dashboard) in the same language.
- Public texts corrected: no guest booking; reschedule up to 1 hour, cancel up to 3 hours (FAQ, how it works, pricing, footer).
- scripts/db_wipe_students.ts moved out of the repo to ../watazawwado-archive/.

## Next (in order)

1. Owner runs docs/owner-test-checklist.md on production (Claude cannot create accounts on the live site).
2. Owner tests the teacher dashboard with a real teacher account (add a teacher from the Teachers page).
3. Send docs/legal-review-brief.md to a lawyer; apply the answers to the terms/privacy pages (bump TERMS_VERSION). Design system moves gradually (CLAUDE.md rule).

## Owner actions outside the code


- **Preview has no database:** in Vercel, the Supabase, Stripe, PayPal, Brevo and Gemini variables are set for Production only, so the preview answers "Database integration is not properly configured". To test the preview, tick **Preview** on SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (and Stripe/PayPal, ideally test-mode keys for Preview), then redeploy the preview. Note: there is only one Supabase project, so the preview uses the real database. APP_URL also points previews to the production domain after payment.

- **Revoke the GitHub token** saved inside the git remote URL (`git remote -v` shows it) and sign in with Git Credential Manager instead.
- Zoom variables are now Production-only, so Zoom links won't be created on preview deployments (expected).
- Supabase "leaked password protection" needs Pro; replaced by the free browser check above.
- Vercel shows "billing address missing" on the account.
