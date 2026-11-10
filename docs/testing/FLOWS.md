# Flow inventory (pre-launch testing)

Built in P1 (2026-11-10) from the routes in `src/App.tsx`, `src/student`, `src/dashboard`, every endpoint in
`api/index.ts` and `server/routes/` (appendix below), `docs/owner-test-checklist.md` and `docs/workflows/`.
Rules: [RULES.md](RULES.md). One row = its browser path + its API/unit tests + a review of the source files it
touches; update the row (status, spec, finding id) whenever you check it.

Roles: **V** visitor, **S** student (adult), **P** parent (family account), **K** child device, **T** teacher,
**A** super_admin. Status: `untested`, `pass`, `fail (P2-014)`, `smoke` (sign-in only).
E2E specs live in `e2e/`; unit/API tests in `test/`.

## Accounts and access

| id | flow | roles | E2E spec | API/unit tests | source files | status |
|---|---|---|---|---|---|---|
| AUTH-01 | Sign up with email OTP, adult (18+) | V→S | | age-rules-signup, otp-logic, phase7-student-auth | src/components/StudentAuthModal.tsx, src/lib/ageRules.ts, `/api/student/onboarding` | untested |
| AUTH-02 | Family sign-up: guardian 18+, children 6-17, up to 10 | V→P | | age-rules-signup, pa-02-add-child | StudentOnboardingPage.tsx, `/api/student/onboarding`, `/api/student/children` | untested |
| AUTH-03 | Age rules refuse under-18 adult, 18+ child, under-6 child | V | | age-rules-signup | src/lib/ageRules.ts, api/index.ts onboarding | untested |
| AUTH-04 | Sign in (student OTP), sign out, session refresh | S P | e2e/smoke.spec.ts (session only) | student-e2e-session-hardening | src/lib/auth.ts, src/lib/supabase.ts | smoke |
| AUTH-05 | Staff login + set password from invite | T A | | phase5g-security, task-0.55.4-a | /staff/login, /staff/set-password | untested |
| AUTH-06 | Teacher agreement gate (/staff/agreement) | T | | task-teacher-operations-remediation | api/index.ts `/api/dashboard/agreement/accept` | untested |
| AUTH-07 | Role isolation: student token on teacher API and back, inactive teacher | S T A | | phase5g-security, task-0.58-h-authorization | `verifyStudentAuth`, `verifyTeacherAuth`, `requireSuperAdmin` | untested |
| AUTH-08 | Waitlist mode (LEARNER_SIGNUP_MODE=waitlist), invites in waves | V A | | waitlist | server/routes/waitlist.ts, /zaad | untested |
| AUTH-09 | Child device link (kid token, limited routes) | P K | | nx-16-child-devices | server/routes/childDevices.ts, /kid/* | untested |
| AUTH-10 | Privacy: data export / delete request | S P A | | st-06-privacy-requests | server/routes/privacy.ts | untested |
| AUTH-11 | Language switch AR/EN persists (cookie) and reaches emails | all | e2e/smoke.spec.ts (ar/en projects) | qa-03-rtl-bilingual | src/lib/language.ts, `/api/me/language` | smoke |
| AUTH-12 | Smoke: every role opens its own area as a real QA account | S P T A | e2e/smoke.spec.ts | p1-testing-foundation | scripts/qa/*, e2e/fixtures.ts | pass (P1) |

## Intake, placement, offers

| id | flow | roles | E2E spec | API/unit tests | source files | status |
|---|---|---|---|---|---|---|
| INT-01 | AI intake chat (Gemini) to learning profile | V S | | phase05-intake-schema, intake-token, phase-c-ai-security | server/intake/*, server/routes/intake.ts, src/components/intake | untested |
| INT-02 | Admin reviews intake, sends offer | A | | phase05-offers | IntakeReviewPage.tsx, `/api/dashboard/intakes/:id/review` | untested |
| INT-03 | Student sees and accepts an offer | S P | | phase05-purchasability | StudentOffersPage.tsx, `/api/student/offers/:id/accept` | untested |
| INT-04 | Placement test per learner, report, teacher review | S P T | | community-placement, placement-ladder-route | server/placement/*, StudentPlacementPage.tsx, PlacementTestsPage.tsx | untested |
| INT-05 | Teacher choice at onboarding (licensed for subject, gender) | S P | | phase-c-teacher-choice, nx-15-university | `listPublicTeachers`, onboarding routing | untested |
| INT-06 | Admin assigns / changes a learner's teacher | A | | task-0.61-b-assignment-model | `/api/dashboard/admin/students/:id/assign-teacher` | untested |
| INT-07 | Teacher change request (family asks, admin decides, hand-over card) | P S T A | | (see server/routes/teacherChange.ts) | TeacherChangesPage.tsx, server/routes/teacherChange.ts | untested |

## Booking and payments

| id | flow | roles | E2E spec | API/unit tests | source files | status |
|---|---|---|---|---|---|---|
| BOOK-01 | Free trial per learner, confirmed at once | S P | | review-2026-11-07-trial-per-learner | StudentBookingPage.tsx, `/api/bookings/create`, `create_booking_atomic` | untested |
| BOOK-02 | Slots: teacher hours in teacher zone, learner zone shown, conflicts | S P T | | review-2026-11-08-slots, task-production-availability-root-cause-fix | server/integrations/availabilityEngine.ts, AvailabilityPage.tsx | untested |
| BOOK-03 | Paid booking stays pending until payment verified (stop at Stripe) | S P | | qa-01-money-paths-smoke, task-04a-payment-mvp, stripe-webhook-signature | server/payment/stripeService.ts, `/api/payments/create-intent`, `/api/payments/stripe/verify`, webhook | untested |
| BOOK-04 | PayPal checkout up to PayPal page | S P | | b4-embedded-checkout | src/components/payment | untested |
| BOOK-05 | Pay later request, admin approves/declines | S A | | b2-pending-payment-card | `/api/bookings/:ref/pay-later`, PayLaterPage.tsx | untested |
| BOOK-06 | Release a held slot | S P | | | `/api/student/bookings/:id/release-hold` | untested |
| BOOK-07 | Reschedule within window (student) / request (teacher) | S P T | | task-0.55.5-c-a-durable-cancel-reschedule-outbox-restoration | `/api/student/bookings/:id/reschedule`, `/api/dashboard/bookings/:id/reschedule-request` | untested |
| BOOK-08 | Cancel, credit back per RULES | S P | | task-0.58-f-lifecycle | `/api/student/bookings/:id/cancel` | untested |
| BOOK-09 | Refund request (credit) and admin refund | S A | | | `/api/student/credits/:id/refund-request`, `/api/dashboard/payments/:id/refund` | untested |
| BOOK-10 | Repeat last booking / next-week suggestion | S P | | task-0.58-repeat-last-booking, rn-04-next-week-suggestion | server/routes/nextWeekSuggestion.ts | untested |
| BOOK-11 | Admin bulk cancel, move lesson to another teacher | A | | ad-02-bulk-cancel, ad-02b-lesson-teacher-move | server/routes/lessonTeacherMove.ts | untested |
| BOOK-12 | Admin records manual payment, confirm/reject | A | | task-04a-payment-mvp | `/api/dashboard/payments*` | untested |

## Packages, credits, discounts, referrals, gifts

| id | flow | roles | E2E spec | API/unit tests | source files | status |
|---|---|---|---|---|---|---|
| PKG-01 | Package catalog and pricing (server-side) | V S | | package-pricing-catalog-closure, phase05-pricing-engine | server/pricing/*, StudentPackagesPage.tsx | untested |
| PKG-02 | Buy package up to checkout; credits after verified payment | S P | | student-packages-phase-a-redemption, student-packages-phase-b | `/api/student/packages/select`, package_entitlements | untested |
| PKG-03 | Book with package credit (confirms at once), balance, low balance, renew | S P | | rn-01..rn-03 | PackageBalance.tsx, server/notifications/lowBalance.ts | untested |
| PKG-04 | Discount codes (admin creates, checkout applies, per-account limit) | A S | | discount-codes-referrals, discounts-engine | DiscountsPage.tsx, server/pricing/discounts.ts | untested |
| PKG-05 | Referral link, welcome credit, referrer reward | S P | | discount-codes-referrals | StudentInvitePage.tsx, `/api/student/referral` | untested |
| PKG-06 | Gifts and seasonal programs | S P A | | nx-06-gifts, nx-08-programs | server/routes/gifts.ts, programs.ts | untested |
| PKG-07 | Sponsorship: request, donate, admin grants | S P A | | nx-07-sponsorship | server/routes/sponsorship.ts, StudentSponsorPage.tsx | untested |
| PKG-08 | Wallet / account credit ledger | S P | | | StudentWalletPage.tsx | untested |

## Lessons and learning

| id | flow | roles | E2E spec | API/unit tests | source files | status |
|---|---|---|---|---|---|---|
| LES-01 | Lesson day card, join window, lesson room | S P T | | st-01-lesson-day, nx-12-lesson-room, review-2026-11-09-lesson-window | LessonDayCard.tsx, server/routes/lessonRoom.ts | untested |
| LES-02 | Meetings: Zoom link created, Google Calendar event, outbox worker | T S | | task-0.53-zoom-lifecycle, task-0.55* | server/integrations/zoom.ts, googleCalendar.ts, worker.ts | untested |
| LES-03 | Teacher connects / disconnects Google Calendar | T | | task-0.54-google-calendar-oauth, task-0.57-google-oauth-code-exchange-hardening | SettingsPage.tsx, `/api/integrations/google-calendar/*` | untested |
| LES-04 | Attendance, no-show, past lesson handling | T | | review-2026-11-09-past-lesson | server/routes/attendance.ts | untested |
| LES-05 | Lesson notes, summary draft (AI), family summary | T P | | pr-06-teacher-family-summary, nx-13-summary-reminders | server/routes/summaryDraft.ts, StudentDetailPage.tsx | untested |
| LES-06 | Lesson feedback from family, teacher badges | S P | | st-02-lesson-feedback | server/routes/feedback.ts | untested |
| LES-07 | Homework (teacher sets, student does, review) and homework sets from curriculum | T S P | | nx-02-homework, review-2026-11-09-homework-sets | server/homework/sets.ts, homework.ts, homeworkSets.ts | untested |
| LES-08 | Recitations: record, send, teacher replies | S P T | | nx-03-recitations | server/routes/recitations.ts | untested |
| LES-09 | Curriculum player, samples, lesson reports | S P T | | curriculum-* | StudentCurriculumPage.tsx, server/routes/curriculum.ts | untested |
| LES-10 | Progress page, milestones, monthly report, certificates | S P T | | pr-01..pr-10, nx-04-certificates | server/routes/progress.ts, certificates.ts | untested |
| LES-11 | Reminders before lessons (cron), daily review, weekly digest | S P T | | booking-day-and-reminders, cronAuth, nx-10-weekly-digest | server/notifications/reminderEngine.ts, `/api/cron/*` | untested |
| LES-12 | Calendar feed (ICS) per user | S P T | | | server/routes/calendarFeed.ts | untested |

## Messages, notifications, community

| id | flow | roles | E2E spec | API/unit tests | source files | status |
|---|---|---|---|---|---|---|
| MSG-01 | Chat family ↔ teacher, unread counts | S P T | | | src/components/chat, `/api/chat/threads*` | untested |
| MSG-02 | In-app notifications inbox, admin inbox | all | | ad-03-admin-inbox, student-notifications-presentation | server/notifications/inbox.ts, NotificationsPage.tsx | untested |
| MSG-03 | Notification preferences, push subscribe | S P T | | rn-07-notification-preferences, nx-09-push | server/routes/push.ts, accountPreferences.ts | untested |
| MSG-04 | Emails (Brevo): welcome, booking, reminder, monthly; language follows account | S P T A | | emailService | server/notifications/emailService.ts, emailTemplates.ts | untested |
| MSG-05 | WhatsApp links / messages | S P A | | | server/notifications/whatsapp.ts | untested |
| COM-01 | Community feed, consent, later posts | S P A | | cm-01-community-consent, cm-04-community-later | server/routes/community.ts, communityLater.ts | untested |
| COM-02 | Hall of Honor (consent first), class board | S P T A | | | server/routes/honor.ts, ClassBoardPage.tsx | untested |
| COM-03 | Family reviews: invite, write, proof | P A | | nx-05-family-reviews | server/routes/reviews.ts, review.ts | untested |

## Teacher dashboard

| id | flow | roles | E2E spec | API/unit tests | source files | status |
|---|---|---|---|---|---|---|
| TCH-01 | Today, upcoming, schedule, first-week checklist | T | e2e/smoke.spec.ts (opens) | | TodayPage.tsx, UpcomingPage.tsx | smoke |
| TCH-02 | My students, student detail, notes, AI brief | T | | studentManagement | StudentsPage.tsx, StudentDetailPage.tsx | untested |
| TCH-03 | Availability (own time zone) | T | | | AvailabilityPage.tsx, `PUT /api/dashboard/availability` | untested |
| TCH-04 | Trials and trial assessment | T | | rn-05-trial-follow-up | TrialsPage.tsx, `/api/dashboard/trials/:id/assessment` | untested |
| TCH-05 | My month / my pay | T | | my-month, payroll-rules | MyMonthPage.tsx, MyPayPage.tsx | untested |
| TCH-06 | University: training track, licences | T A | | nx-15-university | UniversityPage.tsx, server/routes/university.ts | untested |
| TCH-07 | Settings: intro, photo, ID card, integrations | T | | | SettingsPage.tsx, server/routes/teacherFiles.ts | untested |

## Admin

| id | flow | roles | E2E spec | API/unit tests | source files | status |
|---|---|---|---|---|---|---|
| ADM-01 | Overview, action items, health, app errors | A | | ad-01-admin-action-items, ops | OverviewPage.tsx, HealthPage.tsx | untested |
| ADM-02 | Teachers: add (invite), stop, delete, teacher load | A | e2e/smoke.spec.ts (opens) | admin-delete-teacher, crm-08-teacher-load | TeachersPage.tsx, `/api/dashboard/admin/teachers` | smoke |
| ADM-03 | All students list and detail, teacher names | A | | p1-testing-foundation (P1-005) | StudentsPage.tsx, `/api/dashboard/students` | fail→fixed (P1-005) |
| ADM-04 | CRM: timeline, pipeline, notes, tags, tasks, search, CSV export, funnel | A | | crm-01..crm-07 | server/routes/crm.ts, exports.ts, funnel.ts | untested |
| ADM-05 | Leads | A | | leadTransitions | LeadsPage.tsx, server/leadTransitions.ts | untested |
| ADM-06 | Payroll and payouts | A | | payroll-routes | PayrollPage.tsx, server/payroll/payroll.ts | untested |
| ADM-07 | Settings, services, waitlist waves | A | | waitlist | `/api/dashboard/settings`, WaitlistPage.tsx | untested |
| ADM-08 | Analytics | A T | | phase5f | AnalyticsPage.tsx | untested |

## Public site

| id | flow | roles | E2E spec | API/unit tests | source files | status |
|---|---|---|---|---|---|---|
| PUB-01 | Home, about, how it works, pricing, FAQ in EN and /ar | V | | pu-03-faq, qa-03-rtl-bilingual, qa-05-seo, qa-05b-hreflang | src/components/public/* | untested |
| PUB-02 | Learning subject pages, articles | V | | seo-subject-pages, nx-11-articles | src/components/public/learning, articles | untested |
| PUB-03 | Get started modal / contact form | V | | | GetStartedModal.tsx, `/api/contact` | untested |
| PUB-04 | Legal pages: terms, privacy, safety | V | | | src/components/public/terms, privacy, safety | untested |
| PUB-05 | Careers, community page, certificates verify | V | | | /careers, /community, /certificate/:id | untested |
| PUB-06 | PWA install, offline, performance | V S | | pwa-install, pu-04-performance, st-07-pwa | src/components/pwa | untested |
| PUB-07 | Mobile layout 390x844, accessibility | all | e2e (phone projects) | qa-02-accessibility, qa-04-mobile | | untested |

## Appendix: every endpoint (generated 2026-11-10)

Guard = the middleware on the route line (`admin` = verifyTeacherAuth + requireSuperAdmin). "public/other" includes
cron, webhooks and routes that check auth inside the handler. Regenerate when routes change.

| Endpoint | Method | Guard | Source |
|---|---|---|---|
| `/api/bookings/:referenceCode/pay-later` | POST | student | api/index.ts:5812 |
| `/api/bookings/create` | POST | public/other | api/index.ts:710 |
| `/api/calendar/family/:file` | GET | public/other | server/routes/calendarFeed.ts:58 |
| `/api/certificates/:id` | GET | public/other | server/routes/certificates.ts:52 |
| `/api/chat/threads` | GET | public/other | server/routes/community.ts:407 |
| `/api/chat/threads/:id/messages` | GET | public/other | server/routes/community.ts:426 |
| `/api/chat/threads/:id/messages` | POST | public/other | server/routes/community.ts:439 |
| `/api/chat/threads/open-for` | POST | public/other | server/routes/community.ts:453 |
| `/api/checkout/apply` | POST | student | server/routes/growth.ts:448 |
| `/api/checkout/quote` | POST | student | server/routes/growth.ts:433 |
| `/api/client-errors` | POST | public/other | server/routes/ops.ts:143 |
| `/api/contact` | POST | public/other | api/index.ts:7674 |
| `/api/dashboard/admin/account-credit` | POST | admin | server/routes/growth.ts:722 |
| `/api/dashboard/admin/action-items` | GET | admin | api/index.ts:2567 |
| `/api/dashboard/admin/bookings/:id/move-teacher` | POST | admin | server/routes/lessonTeacherMove.ts:82 |
| `/api/dashboard/admin/crm/tasks` | GET | public/other | server/routes/crm.ts:169 |
| `/api/dashboard/admin/crm/tasks/:taskId` | PATCH | public/other | server/routes/crm.ts:231 |
| `/api/dashboard/admin/discount-codes` | GET | admin | server/routes/growth.ts:558 |
| `/api/dashboard/admin/discount-codes` | POST | admin | server/routes/growth.ts:584 |
| `/api/dashboard/admin/discount-codes/:id` | PATCH | admin | server/routes/growth.ts:607 |
| `/api/dashboard/admin/discount-codes/:id` | DELETE | admin | server/routes/growth.ts:635 |
| `/api/dashboard/admin/export/leads.csv` | GET | public/other | server/routes/exports.ts:88 |
| `/api/dashboard/admin/export/payments.csv` | GET | public/other | server/routes/exports.ts:100 |
| `/api/dashboard/admin/export/students.csv` | GET | public/other | server/routes/exports.ts:64 |
| `/api/dashboard/admin/funnel` | GET | admin | server/routes/funnel.ts:85 |
| `/api/dashboard/admin/growth-settings` | GET | admin | server/routes/growth.ts:688 |
| `/api/dashboard/admin/growth-settings` | PUT | admin | server/routes/growth.ts:699 |
| `/api/dashboard/admin/lesson-feedback` | GET | admin | server/routes/feedback.ts:200 |
| `/api/dashboard/admin/monthly-progress/preview` | GET | admin | api/index.ts:7761 |
| `/api/dashboard/admin/privacy-requests` | GET | admin | server/routes/privacy.ts:209 |
| `/api/dashboard/admin/privacy-requests/:id/delete-account` | POST | admin | server/routes/privacy.ts:234 |
| `/api/dashboard/admin/privacy-requests/:id/done` | POST | admin | server/routes/privacy.ts:222 |
| `/api/dashboard/admin/quiet-learners/preview` | GET | admin | api/index.ts:7783 |
| `/api/dashboard/admin/referrals` | GET | admin | server/routes/growth.ts:651 |
| `/api/dashboard/admin/search` | GET | admin | api/index.ts:2530 |
| `/api/dashboard/admin/sponsorship` | GET | admin | server/routes/sponsorship.ts:180 |
| `/api/dashboard/admin/sponsorship/grant` | POST | admin | server/routes/sponsorship.ts:216 |
| `/api/dashboard/admin/sponsorship/learners` | GET | admin | server/routes/sponsorship.ts:207 |
| `/api/dashboard/admin/sponsorship/requests/:id/decline` | POST | admin | server/routes/sponsorship.ts:252 |
| `/api/dashboard/admin/students/:id/assign-teacher` | PATCH | admin | api/index.ts:3556 |
| `/api/dashboard/admin/students/:id/crm` | GET | public/other | server/routes/crm.ts:248 |
| `/api/dashboard/admin/students/:id/crm/notes` | POST | public/other | server/routes/crm.ts:260 |
| `/api/dashboard/admin/students/:id/crm/notes/:noteId` | DELETE | public/other | server/routes/crm.ts:277 |
| `/api/dashboard/admin/students/:id/crm/tags` | PUT | public/other | server/routes/crm.ts:287 |
| `/api/dashboard/admin/students/:id/crm/tasks` | GET | public/other | server/routes/crm.ts:199 |
| `/api/dashboard/admin/students/:id/crm/tasks` | POST | public/other | server/routes/crm.ts:214 |
| `/api/dashboard/admin/students/:id/timeline` | GET | admin | server/routes/crm.ts:307 |
| `/api/dashboard/admin/teacher-change` | GET | admin | server/routes/teacherChange.ts:252 |
| `/api/dashboard/admin/teacher-change/:id/decide` | POST | admin | server/routes/teacherChange.ts:282 |
| `/api/dashboard/admin/teacher-load` | GET | admin | server/routes/teacherLoad.ts:31 |
| `/api/dashboard/admin/teachers` | GET | admin | api/index.ts:3667 |
| `/api/dashboard/admin/teachers` | POST | admin | api/index.ts:10373 |
| `/api/dashboard/admin/teachers/:email` | DELETE | admin | api/index.ts:3810 |
| `/api/dashboard/admin/teachers/:email/id-card` | GET | admin | server/routes/teacherFiles.ts:100 |
| `/api/dashboard/admin/teachers/:email/toggle-active` | PATCH | admin | api/index.ts:3758 |
| `/api/dashboard/admin/university` | GET | admin | server/routes/university.ts:140 |
| `/api/dashboard/admin/university/:email/:subject` | POST | admin | server/routes/university.ts:151 |
| `/api/dashboard/agreement/accept` | POST | teacher | api/index.ts:2350 |
| `/api/dashboard/analytics` | GET | teacher | api/index.ts:6937 |
| `/api/dashboard/app-errors` | GET | admin | server/routes/ops.ts:156 |
| `/api/dashboard/app-errors/:fingerprint` | DELETE | admin | server/routes/ops.ts:168 |
| `/api/dashboard/availability` | GET | teacher | api/index.ts:7181 |
| `/api/dashboard/availability` | PUT | teacher | api/index.ts:7210 |
| `/api/dashboard/bookings` | GET | teacher | api/index.ts:4224 |
| `/api/dashboard/bookings/:id` | GET | teacher | api/index.ts:4520 |
| `/api/dashboard/bookings/:id` | PATCH | teacher | api/index.ts:4652 |
| `/api/dashboard/bookings/:id/attendance` | GET | teacher | server/routes/attendance.ts:290 |
| `/api/dashboard/bookings/:id/not-held` | POST | teacher | server/routes/payroll.ts:193 |
| `/api/dashboard/bookings/:id/pay-later/:decision` | POST | admin | api/index.ts:5885 |
| `/api/dashboard/bookings/:id/reschedule-request` | POST | teacher | api/index.ts:2306 |
| `/api/dashboard/bookings/:id/zoom-host-url` | GET | teacher | api/index.ts:2273 |
| `/api/dashboard/class-board` | GET | teacher | server/routes/honor.ts:557 |
| `/api/dashboard/curriculum/reports` | POST | teacher | server/routes/curriculum.ts:38 |
| `/api/dashboard/curriculum/students/:id` | GET | teacher | server/routes/curriculum.ts:78 |
| `/api/dashboard/health` | GET | admin | server/routes/ops.ts:177 |
| `/api/dashboard/homework` | GET | teacher | server/routes/homework.ts:138 |
| `/api/dashboard/homework-sets/:id/decision` | POST | teacher | server/routes/homeworkSets.ts:226 |
| `/api/dashboard/homework/:id/review` | POST | teacher | server/routes/homework.ts:226 |
| `/api/dashboard/honor` | GET | admin | server/routes/honor.ts:324 |
| `/api/dashboard/honor/:id/photo` | POST | admin | server/routes/honor.ts:526 |
| `/api/dashboard/honor/:id/record-consent` | POST | admin | server/routes/honor.ts:400 |
| `/api/dashboard/honor/:id/remove` | POST | admin | server/routes/honor.ts:427 |
| `/api/dashboard/honor/family/:id/remove` | POST | admin | server/routes/communityLater.ts:193 |
| `/api/dashboard/honor/nominate` | POST | admin | server/routes/honor.ts:367 |
| `/api/dashboard/honor/photos` | GET | admin | server/routes/honor.ts:510 |
| `/api/dashboard/honor/suggestions` | GET | admin | server/routes/communityLater.ts:106 |
| `/api/dashboard/honor/suggestions/family` | POST | admin | server/routes/communityLater.ts:167 |
| `/api/dashboard/honor/suggestions/learner` | POST | admin | server/routes/communityLater.ts:146 |
| `/api/dashboard/intakes` | GET | admin | api/index.ts:10128 |
| `/api/dashboard/intakes/:id` | GET | admin | api/index.ts:10188 |
| `/api/dashboard/intakes/:id/review` | POST | admin | api/index.ts:10241 |
| `/api/dashboard/leads` | GET | admin | api/index.ts:6738 |
| `/api/dashboard/leads/:id` | PATCH | admin | api/index.ts:7520 |
| `/api/dashboard/lesson-room/:id` | GET | teacher | server/routes/lessonRoom.ts:31 |
| `/api/dashboard/me` | GET | teacher | api/index.ts:2331 |
| `/api/dashboard/me/files` | GET | public/other | server/routes/teacherFiles.ts:38 |
| `/api/dashboard/me/files` | POST | public/other | server/routes/teacherFiles.ts:64 |
| `/api/dashboard/me/files/upload-url` | POST | public/other | server/routes/teacherFiles.ts:45 |
| `/api/dashboard/me/intro` | GET | teacher | api/index.ts:8176 |
| `/api/dashboard/me/intro` | PUT | teacher | api/index.ts:8182 |
| `/api/dashboard/me/lesson-feedback` | GET | teacher | server/routes/feedback.ts:189 |
| `/api/dashboard/me/profile` | GET | teacher | server/routes/teacherChange.ts:108 |
| `/api/dashboard/me/profile` | PUT | teacher | server/routes/teacherChange.ts:114 |
| `/api/dashboard/my-month` | GET | teacher | server/routes/myMonth.ts:40 |
| `/api/dashboard/notifications` | GET | teacher | api/index.ts:2239 |
| `/api/dashboard/onboarding-checklist` | GET | teacher | api/index.ts:2609 |
| `/api/dashboard/overview-metrics` | GET | admin | api/index.ts:6283 |
| `/api/dashboard/pay-later` | GET | admin | api/index.ts:5866 |
| `/api/dashboard/payments` | GET | admin | api/index.ts:4912 |
| `/api/dashboard/payments` | POST | admin | api/index.ts:4981 |
| `/api/dashboard/payments/:id` | DELETE | admin | api/index.ts:5246 |
| `/api/dashboard/payments/:id/confirm` | POST | admin | api/index.ts:5081 |
| `/api/dashboard/payments/:id/refund` | POST | admin | api/index.ts:5988 |
| `/api/dashboard/payments/:id/reject` | POST | admin | api/index.ts:5184 |
| `/api/dashboard/payroll` | GET | admin | server/routes/payroll.ts:74 |
| `/api/dashboard/payroll/adjustments` | POST | admin | server/routes/payroll.ts:111 |
| `/api/dashboard/payroll/adjustments/:id` | DELETE | admin | server/routes/payroll.ts:127 |
| `/api/dashboard/payroll/payouts` | POST | admin | server/routes/payroll.ts:137 |
| `/api/dashboard/payroll/rates/:teacherId` | PUT | admin | server/routes/payroll.ts:91 |
| `/api/dashboard/placement-tests` | GET | admin | server/routes/community.ts:636 |
| `/api/dashboard/placement-tests/:id/review` | POST | admin | server/routes/community.ts:726 |
| `/api/dashboard/programs` | GET | public/other | server/routes/programs.ts:49 |
| `/api/dashboard/programs` | POST | public/other | server/routes/programs.ts:72 |
| `/api/dashboard/programs/:id` | PATCH | public/other | server/routes/programs.ts:83 |
| `/api/dashboard/recitations/:id/reply` | POST | teacher | server/routes/recitations.ts:137 |
| `/api/dashboard/refund-requests` | GET | admin | api/index.ts:5921 |
| `/api/dashboard/review-invites` | POST | public/other | server/routes/reviews.ts:211 |
| `/api/dashboard/review-proofs` | POST | public/other | server/routes/reviews.ts:270 |
| `/api/dashboard/review-proofs/:id/status` | POST | public/other | server/routes/reviews.ts:294 |
| `/api/dashboard/review-proofs/upload-url` | POST | public/other | server/routes/reviews.ts:253 |
| `/api/dashboard/reviews` | GET | public/other | server/routes/reviews.ts:189 |
| `/api/dashboard/reviews/:id/status` | POST | public/other | server/routes/reviews.ts:230 |
| `/api/dashboard/services/:id` | PATCH | admin | api/index.ts:7469 |
| `/api/dashboard/settings` | GET | teacher | api/index.ts:7284 |
| `/api/dashboard/settings` | PATCH | admin | api/index.ts:7419 |
| `/api/dashboard/stats` | GET | teacher | api/index.ts:6359 |
| `/api/dashboard/students` | GET | teacher | api/index.ts:2683 |
| `/api/dashboard/students/:id` | GET | teacher | api/index.ts:2903 |
| `/api/dashboard/students/:id` | PATCH | teacher | api/index.ts:3305 |
| `/api/dashboard/students/:id/ai-brief` | POST | teacher | api/index.ts:3211 |
| `/api/dashboard/students/:id/family-summary-draft` | POST | teacher | server/routes/summaryDraft.ts:56 |
| `/api/dashboard/students/:id/homework` | GET | teacher | server/routes/homework.ts:116 |
| `/api/dashboard/students/:id/homework` | POST | teacher | server/routes/homework.ts:189 |
| `/api/dashboard/students/:id/homework-draft` | POST | teacher | server/routes/homework.ts:261 |
| `/api/dashboard/students/:id/homework-sets` | GET | teacher | server/routes/homeworkSets.ts:200 |
| `/api/dashboard/students/:id/level` | POST | teacher | server/routes/community.ts:686 |
| `/api/dashboard/students/:id/milestones` | GET | teacher | server/routes/progress.ts:1187 |
| `/api/dashboard/students/:id/monthly-draft` | POST | teacher | server/routes/summaryDraft.ts:117 |
| `/api/dashboard/students/:id/notes` | GET | teacher | api/index.ts:3865 |
| `/api/dashboard/students/:id/notes` | POST | teacher | api/index.ts:3912 |
| `/api/dashboard/students/:id/notes/:noteId` | PATCH | teacher | api/index.ts:4011 |
| `/api/dashboard/students/:id/notes/:noteId` | DELETE | teacher | api/index.ts:4108 |
| `/api/dashboard/students/:id/placement` | GET | teacher | server/routes/community.ts:651 |
| `/api/dashboard/students/:id/recitations` | GET | teacher | server/routes/recitations.ts:125 |
| `/api/dashboard/teacher-change` | POST | teacher | server/routes/teacherChange.ts:215 |
| `/api/dashboard/today` | GET | teacher | api/index.ts:2368 |
| `/api/dashboard/trials` | GET | teacher | api/index.ts:6462 |
| `/api/dashboard/trials/:id/assessment` | POST | teacher | api/index.ts:6544 |
| `/api/dashboard/university/me` | GET | teacher | server/routes/university.ts:96 |
| `/api/dashboard/university/me/:subject/start` | POST | teacher | server/routes/university.ts:105 |
| `/api/dashboard/university/me/:subject/step` | POST | teacher | server/routes/university.ts:124 |
| `/api/dashboard/upcoming` | GET | teacher | api/index.ts:2637 |
| `/api/dashboard/waitlist` | GET | admin | server/routes/waitlist.ts:177 |
| `/api/dashboard/waitlist/:id/invite` | POST | admin | server/routes/waitlist.ts:194 |
| `/api/geo` | GET | public/other | api/index.ts:8237 |
| `/api/health` | GET | public/other | api/index.ts:305 |
| `/api/intake/:id` | GET | student | server/routes/intake.ts:252 |
| `/api/intake/complete` | POST | student | server/routes/intake.ts:173 |
| `/api/intake/opening` | GET | public/other | server/routes/intake.ts:113 |
| `/api/intake/turn` | POST | student | server/routes/intake.ts:120 |
| `/api/integrations/availability` | GET | public/other | api/index.ts:1303 |
| `/api/integrations/cancel` | POST | public/other | api/index.ts:1276 |
| `/api/integrations/google-calendar/auth-url` | GET | teacher | api/index.ts:341 |
| `/api/integrations/google-calendar/callback` | GET | public/other | api/index.ts:373 |
| `/api/integrations/google-calendar/disconnect` | POST | teacher | api/index.ts:607 |
| `/api/integrations/reschedule` | POST | public/other | api/index.ts:1251 |
| `/api/integrations/retry-sync` | POST | teacher | api/index.ts:1396 |
| `/api/integrations/status` | GET | teacher | api/index.ts:310 |
| `/api/integrations/sync-booking` | POST | public/other | api/index.ts:1210 |
| `/api/integrations/validate-slot` | POST | public/other | api/index.ts:1372 |
| `/api/join/:id` | GET | public/other | server/routes/attendance.ts:273 |
| `/api/kid/me` | GET | student | server/routes/childDevices.ts:186 |
| `/api/kid/pair` | POST | public/other | server/routes/childDevices.ts:150 |
| `/api/kid/sign-out` | POST | student | server/routes/childDevices.ts:176 |
| `/api/learning-guide` | POST | public/other | server/routes/intake.ts:32 |
| `/api/me/language` | PUT | public/other | server/routes/accountPreferences.ts:14 |
| `/api/me/notifications` | GET | public/other | server/routes/community.ts:376 |
| `/api/me/notifications/read` | POST | public/other | server/routes/community.ts:397 |
| `/api/packages` | GET | public/other | api/index.ts:681 |
| `/api/payments/create-intent` | POST | public/other | api/index.ts:5517 |
| `/api/payments/stripe/verify` | POST | public/other | api/index.ts:5691 |
| `/api/payments/stripe/webhook` | POST | public/other | api/index.ts:5725 |
| `/api/placement/:id/report` | GET | student | server/routes/community.ts:602 |
| `/api/placement/:id/submit` | POST | student | server/routes/community.ts:533 |
| `/api/placement/mine` | GET | student | server/routes/community.ts:467 |
| `/api/placement/start` | POST | student | server/routes/community.ts:481 |
| `/api/public/launch` | GET | public/other | server/routes/waitlist.ts:136 |
| `/api/public/referral/:code` | GET | public/other | server/routes/growth.ts:543 |
| `/api/push/public-key` | GET | public/other | server/routes/push.ts:10 |
| `/api/reviews` | GET | public/other | server/routes/reviews.ts:86 |
| `/api/reviews/invite/:token` | GET | public/other | server/routes/reviews.ts:106 |
| `/api/reviews/invite/:token` | POST | public/other | server/routes/reviews.ts:114 |
| `/api/student-auth-diagnostic` | GET | student | api/index.ts:8142 |
| `/api/student/bookings` | GET | student | api/index.ts:9091 |
| `/api/student/bookings/:id/cancel` | POST | student | api/index.ts:6136 |
| `/api/student/bookings/:id/feedback` | POST | student | server/routes/feedback.ts:141 |
| `/api/student/bookings/:id/live` | GET | student | api/index.ts:6018 |
| `/api/student/bookings/:id/release-hold` | POST | student | api/index.ts:6109 |
| `/api/student/bookings/:id/reschedule` | POST | student | api/index.ts:6034 |
| `/api/student/calendar-feed` | GET | student | server/routes/calendarFeed.ts:22 |
| `/api/student/calendar-feed` | POST | student | server/routes/calendarFeed.ts:31 |
| `/api/student/calendar-feed` | DELETE | student | server/routes/calendarFeed.ts:48 |
| `/api/student/certificates/:id` | GET | student | server/routes/certificates.ts:30 |
| `/api/student/child-devices` | GET | student | server/routes/childDevices.ts:100 |
| `/api/student/child-devices` | POST | student | server/routes/childDevices.ts:115 |
| `/api/student/child-devices/:id` | DELETE | student | server/routes/childDevices.ts:138 |
| `/api/student/children` | POST | student | api/index.ts:8763 |
| `/api/student/community` | GET | student | server/routes/honor.ts:159 |
| `/api/student/community/class-board` | POST | student | server/routes/honor.ts:297 |
| `/api/student/community/family` | GET | student | server/routes/communityLater.ts:203 |
| `/api/student/community/family/:id/decision` | POST | student | server/routes/communityLater.ts:214 |
| `/api/student/community/hall` | GET | student | server/routes/honor.ts:115 |
| `/api/student/community/honor/:id/decision` | POST | student | server/routes/honor.ts:246 |
| `/api/student/community/honor/:id/photo` | POST | student | server/routes/honor.ts:461 |
| `/api/student/community/honor/:id/photo-url` | POST | student | server/routes/honor.ts:442 |
| `/api/student/community/honor/:id/photo/remove` | POST | student | server/routes/honor.ts:494 |
| `/api/student/community/honor/:id/withdraw` | POST | student | server/routes/honor.ts:281 |
| `/api/student/credits/:id/refund-request` | POST | student | api/index.ts:6209 |
| `/api/student/curriculum` | GET | student | server/routes/curriculum.ts:93 |
| `/api/student/gifts/redeem` | POST | student | server/routes/gifts.ts:21 |
| `/api/student/homework` | GET | student | server/routes/homework.ts:285 |
| `/api/student/homework-sets` | GET | student | server/routes/homeworkSets.ts:139 |
| `/api/student/homework-sets/:id/submit` | POST | student | server/routes/homeworkSets.ts:159 |
| `/api/student/homework/:id/done` | POST | student | server/routes/homework.ts:311 |
| `/api/student/lesson-feedback/pending` | GET | student | server/routes/feedback.ts:98 |
| `/api/student/lesson-room/:id` | GET | student | server/routes/lessonRoom.ts:42 |
| `/api/student/me` | GET | student | api/index.ts:7883 |
| `/api/student/me` | PATCH | student | api/index.ts:8886 |
| `/api/student/milestones` | GET | student | server/routes/progress.ts:1607 |
| `/api/student/next-week-suggestion` | GET | student | server/routes/nextWeekSuggestion.ts:20 |
| `/api/student/notification-preferences` | GET | student | server/routes/accountPreferences.ts:39 |
| `/api/student/notification-preferences` | PUT | student | server/routes/accountPreferences.ts:45 |
| `/api/student/offers` | GET | student | api/index.ts:10006 |
| `/api/student/offers/:id/accept` | POST | student | api/index.ts:10048 |
| `/api/student/onboarding` | POST | student | api/index.ts:8244 |
| `/api/student/packages` | GET | student | api/index.ts:9320 |
| `/api/student/packages/ledger` | GET | student | api/index.ts:9655 |
| `/api/student/packages/select` | POST | student | api/index.ts:9516 |
| `/api/student/pay-later` | GET | student | api/index.ts:5798 |
| `/api/student/payments` | GET | student | api/index.ts:9811 |
| `/api/student/privacy/delete-request` | GET | student | server/routes/privacy.ts:160 |
| `/api/student/privacy/delete-request` | POST | student | server/routes/privacy.ts:169 |
| `/api/student/privacy/export` | GET | student | server/routes/privacy.ts:101 |
| `/api/student/programs` | GET | student | server/routes/programs.ts:97 |
| `/api/student/programs/:id/join` | POST | student | server/routes/programs.ts:124 |
| `/api/student/progress` | GET | student | server/routes/progress.ts:1921 |
| `/api/student/progress/report` | GET | student | server/routes/progress.ts:1824 |
| `/api/student/progress/timeline` | GET | student | server/routes/progress.ts:1883 |
| `/api/student/recitations` | POST | student | server/routes/recitations.ts:66 |
| `/api/student/recitations` | GET | student | server/routes/recitations.ts:106 |
| `/api/student/recitations/upload-url` | POST | student | server/routes/recitations.ts:47 |
| `/api/student/referral` | GET | student | server/routes/growth.ts:503 |
| `/api/student/review` | GET | student | server/routes/review.ts:57 |
| `/api/student/review-status` | GET | student | server/routes/reviews.ts:154 |
| `/api/student/review/:id` | POST | student | server/routes/review.ts:87 |
| `/api/student/reviews` | POST | student | server/routes/reviews.ts:166 |
| `/api/student/sponsorship` | GET | student | server/routes/sponsorship.ts:92 |
| `/api/student/sponsorship/donate` | POST | student | server/routes/sponsorship.ts:121 |
| `/api/student/sponsorship/request` | POST | student | server/routes/sponsorship.ts:152 |
| `/api/student/teacher-change` | GET | student | server/routes/teacherChange.ts:127 |
| `/api/student/teacher-change` | POST | student | server/routes/teacherChange.ts:166 |
| `/api/student/teacher-change/:id/withdraw` | POST | student | server/routes/teacherChange.ts:201 |
| `/api/student/teachers` | GET | student | api/index.ts:8194 |
| `/api/teacher-auth-diagnostic` | GET | teacher | api/index.ts:2115 |
| `/api/teacher-pay/me` | GET | teacher | server/routes/payroll.ts:58 |
| `/api/teacher-photos` | GET | public/other | api/index.ts:8213 |
| `/api/waitlist` | POST | public/other | server/routes/waitlist.ts:140 |
| `/api/waitlist/:id/voice` | POST | public/other | server/routes/waitlist.ts:163 |
| `/api/waitlist/google` | POST | public/other | server/routes/waitlist.ts:149 |
| `/api/zoom/webhook` | POST | public/other | server/routes/attendance.ts:242 |
