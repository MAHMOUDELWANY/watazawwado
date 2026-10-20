# Backlog progress log

One entry per finished task, newest first: result, files changed, checks run, what was not checked.

## Done

### ST-01 Lesson-day experience (2026-10-20)
- Result: done (main)
- Changed: new `src/student/components/LessonDayCard.tsx` (countdown that updates every 30 s, subject + learner, teacher name, Join in Zoom blue from 10 minutes before until the end, "Before the lesson" from the teacher's last shared next steps, "I'm running late" WhatsApp to the academy number with the booking reference), `StudentHomePage.tsx` (the card leads the page on the lesson's own day for confirmed/rescheduled lessons), `api/index.ts` (`GET /api/student/bookings` adds `teacherName` and `prepareNote` to upcoming lessons; `prepareNote` = latest `lesson_notes.next_steps` for that learner, never private notes), `test/st-01-lesson-day.test.ts`
- Migration: none
- Checks: tsc pass, npm test 1110 pass / 0 fail (5 skipped), build pass.
- Not checked / risks: not opened in a browser (needs a signed-in student with a lesson today). "Lesson day" is the viewer's device day.
### PA-02 Add another child after onboarding (2026-10-20)
- Result: done (main, after `/code-review`)
- Changed: `api/index.ts` (new `POST /api/student/children`: account holder only after onboarding, child 6-17 via `isChildAge`, at most 10 children, catalogue subject and its levels only, teacher = the picked active teacher or routed by gender, guardian link, undo if the link fails, teachers + admin told through `announceNewStudent`; a retry within 10 minutes returns the same child), new `src/student/components/AddChildForm.tsx` (profile page; opens from `#add-child`), `StudentProfilePage.tsx`, `StudentHomePage.tsx` ("Add a child" tile in the family section and a line for personal accounts), `StudentApp.tsx` + `activeLearner.tsx` (profile reloads quietly after a child is added), `test/pa-02-add-child.test.ts`
- Before: there was no way to add a child after onboarding; the home "Add child" link only opened the profile, which listed children without an add option.
- Migration: none
- Checks: tsc pass, npm test 1105 pass / 0 fail (5 skipped), build pass, ESM import scan clean. Review: 5 findings, 4 fixed (portal profile refresh, duplicate on retry, subject/level validation, home entry for personal accounts).
- Not checked / risks: not tried with a real parent session or in the browser. Route tests read the source rather than calling it with a real account.
### PA-01 Child switcher everywhere (2026-10-20)
- Result: done (main)
- Changed: new `src/student/activeLearner.tsx` (context + header `ChildSwitcher`: "Whole family" or one learner, saved under the progress page's key), `src/student/StudentApp.tsx` (provider + switcher in the header, only for accounts with children), `StudentLessonsPage.tsx` (filters by the chosen learner; "For <name>" on each lesson in the whole-family view), `StudentProgressPage.tsx` (header and the page's own child cards stay in sync), `StudentPackagesPage.tsx` (new packages default to the chosen child; list narrowed to them plus account-level packages), `StudentBookingPage.tsx` (a new booking starts for the chosen child), `api/index.ts`, `test/pa-01-child-switcher.test.ts`
- Fixed on the way: `GET /api/student/bookings` returned only the parent's own bookings, so a parent never saw the children's lessons. It now returns the whole family (same `getAuthorizedLearnersForStudent` check as cancel/reschedule) with `studentId` and `learnerName`.
- Migration: none
- Checks: tsc pass, npm test 1099 pass / 0 fail (5 skipped), build pass.
- Not checked / risks: not opened in a browser and not tried with a real parent session (dev tokens return mock data). Home already shows the whole family through the same bookings API. The parent appears in the switcher unless their booking preference is "child".
### CRM-04 Follow-up tasks with due dates (2026-10-20)
- Result: done (main)
- Changed: migration `20261020000002_crm_tasks.sql` (`crm_tasks` with `source` and a unique `dedupe_key`; RLS on, service_role only), `server/routes/crm.ts` (`createCrmTask`; `GET /api/dashboard/admin/crm/tasks` with name + WhatsApp, `GET/POST /api/dashboard/admin/students/:id/crm/tasks`, `PATCH /api/dashboard/admin/crm/tasks/:id`), `api/index.ts` (every attended free trial creates one task for the next day, key `trial:<booking id>`), new `src/dashboard/components/FollowUps.tsx` ("My follow-ups" card on the admin overview: overdue / today / this week in the admin's time zone, WhatsApp prefill from the academy team, Done; add form on the student page inside the admin notes panel), `src/dashboard/pages/OverviewPage.tsx`, `src/dashboard/components/CrmNotesPanel.tsx`, `test/crm-04-follow-up-tasks.test.ts`
- Migration: applied to production 2026-10-20.
- Checks: tsc pass, npm test 1095 pass / 0 fail (5 skipped), build pass; round trip on one real student (automatic task is created once per key, listed with the name, manual task 201, mark done removes it from the list), nothing left behind.
- Not checked / risks: `quiet_learner` and `low_balance` sources exist for RN-06 and later; RN-02 does not create tasks yet. Not opened in the browser (no dev login for the dashboard UI).
### CRM-03 Admin notes and tags per family (2026-10-20)
- Result: done (main)
- Changed: migration `20261020000001_crm_notes_tags.sql` (`crm_notes`, `crm_tags`; RLS on, service_role only), `server/routes/crm.ts` (`GET /api/dashboard/admin/students/:id/crm`, `POST/DELETE .../crm/notes`, `PUT .../crm/tags`, super admin only; `normalizeTags`), new `src/dashboard/components/CrmNotesPanel.tsx` on `StudentDetailPage.tsx` (admin only: tag chips with the four suggested tags in Arabic/English, free tags, notes with delete), `src/types/database.ts`, `test/crm-03-notes-tags.test.ts`
- Migration: applied to production 2026-10-20.
- Checks: tsc pass, npm test 1090 pass / 0 fail (5 skipped; the first run hit the recurring ECONNRESET flake in `phase5g-security`, a rerun passed), build pass; round trip on one real student (add/replace tags, add/read/delete a note, restore), nothing left behind.
- Not checked / risks: notes are per account; the table allows a child id but the panel doesn't offer it yet. Not opened in the browser (no dev login for the dashboard UI). The `phase5g-security` ECONNRESET flake shows up in about 1 of 3 full runs.
### CRM-02 Pipeline board (2026-10-20)
- Result: done (main)
- Changed: new `src/dashboard/components/LeadsBoard.tsx` (one column per lead status with counts; drag a card or use its "Move to" menu, offered moves come from `ALLOWED_LEAD_TRANSITIONS`; days since the lead last changed), `src/dashboard/pages/LeadsPage.tsx` (List / Board switch; search and filters apply to both), `test/crm-02-pipeline-board.test.ts`
- Migration: none. Moves use the existing `PATCH /api/dashboard/leads/:id`, which validates the transition (including the active_student side effects).
- Checks: tsc pass, npm test 1086 pass / 0 fail (5 skipped), build pass. Test proves every offered move is accepted by the server map.
- Not checked / risks: "days in stage" is days since `leads.updated_at` (any edit resets it); a true stage-entered time needs a status history. Not opened in the browser (no dev login for the dashboard UI). Dragging is mouse-only by nature; the menu covers phones and keyboard.
### CRM-01 Family timeline (2026-10-20)
- Result: done (main)
- Changed: new `server/routes/crm.ts` (`buildTimeline`, `GET /api/dashboard/admin/students/:id/timeline`, super admin only), `api/index.ts` (registration), new `src/dashboard/components/FamilyTimeline.tsx` on `StudentDetailPage.tsx` (admin only, filter chips by type, Arabic/English), `test/crm-01-family-timeline.test.ts`
- What it shows (account + children found through `guardians.parent_email`): account created, first contact (lead), AI guide requests, placement started/finished/reviewed, trial and lessons booked/attended/missed/cancelled, payments started/confirmed/refunded, packages and cancelled-lesson credits, refund requests, chats started, teacher notes (family summary only, never private notes), trial follow-up sent.
- Migration: none (read-only, existing tables)
- Checks: tsc pass, npm test 1084 pass / 0 fail (5 skipped), build pass; route run against 5 real students (200, no query errors).
- Not checked / risks: teacher changes are not in the timeline: there is no history table for `assigned_teacher_id` yet. Not opened in the browser (dashboard needs an admin login).
### RN-05 Trial → first paid lesson follow-up (2026-10-20)
- Result: done (main, after `/code-review`)
- Changed: new `server/notifications/trialFollowUp.ts`, run by the reminder cron in production only (`api/index.ts`); `test/rn-05-trial-follow-up.test.ts`
- How: 24 h after an attended (`completed`) free trial, one email + on-site notice to the account that owns the learner (parent for a child): thanks, the teacher's family summary if any, the placement level if taken (admin level first), and "book a single lesson or choose a package" (link /student/book). Once per learner: `notification_events` key `trial_followup:<student id>`. Skipped if the learner already booked a paid lesson or bought a package after the trial. A teacher recording attendance late still triggers it (attendance recorded within 72 h, trial no older than 14 days). A failing email is tried 3 times an hour apart, then only the on-site notice goes out.
- Migration: none
- Checks: tsc pass, npm test 1082 pass / 0 fail (5 skipped), build pass. Review: 6 findings, 5 fixed (retry cap + gap, on-site notice after the last failure, no starving with limit, late-recorded trials, package buyers skipped).
- Not checked / risks: runs only on the live cron, so the first real send is unobserved; check the health page and `notification_events` (`trial_follow_up`) after the first trials. Queries run one learner at a time (fine for current volume).
### RN-03 One-click renew the same package (2026-10-20)
- Result: done (main, after `/code-review`)
- Changed: `src/student/pages/StudentPackagesPage.tsx` ("Renew this package" on each real package card; selects the same catalogue item, lesson length and learner, highlights and scrolls to it; `?renew=<entitlementId>` does the same on load; a note if that package is no longer offered), `server/notifications/lowBalance.ts` (RN-02 notice links to `?renew=`), `test/rn-03-renew-package.test.ts`
- Migration: none. The terms and early-start checkboxes are still required and the server still computes the price (`/api/student/packages/select` unchanged).
- Checks: tsc pass, npm test 1072 pass / 0 fail (5 skipped; one earlier run had an unrelated ECONNRESET in the availability test, a rerun passed), build pass. Review: 6 findings, 5 fixed (scroll after render, clear highlight on length change / purchase, learner must still be listed, empty catalogue isn't "no longer offered", hook import).
- Not checked / risks: not opened in a browser (needs a signed-in account with a package). The tests read the page source rather than render it.
### RN-02 Low-balance notice (on-site + email) (2026-10-20)
- Result: done (main, after `/code-review`)
- Changed: new `server/notifications/lowBalance.ts`; `api/index.ts` calls it after the lesson-outcome RPC, only when a credit was used; `test/rn-02-low-balance.test.ts`
- How: at 2 lessons left and at 0, one on-site notice + email (calm copy, link to /student/packages) to the person who paid (`purchaser_account_id`), naming the learner when it is someone else. Once per threshold: `package_entitlements.metadata.low_balance_<n>_notified_at`, set by a conditional update that also requires an unchanged `updated_at`. Skipped for cancelled-lesson credits, refunded/cancelled packages and refund requests.
- Migration: none
- Checks: tsc pass, npm test 1068 pass / 0 fail (5 skipped), build pass; JSON-path filter checked against the real PostgREST (no rows touched). Review: 6 findings, 4 fixed (payer as recipient, stale-metadata write, notice only when a credit was used, route wiring test).
- Not checked / risks: at most once by design: if the email fails after the claim, that notice is not resent. Plural helpers are duplicated from `PackageBalance.tsx` (the server can't import the React file). Waits for RN-07 to respect notification preferences.
### RN-01 Package balance on every surface (2026-10-20)
- Result: done (main)
- Changed: new `src/student/components/PackageBalance.tsx` (one line per active package: "3 lessons left in your 8-lesson package", length, price band, learner), used on `StudentHomePage.tsx` (replaces the Used/Total grid), `StudentBookingPage.tsx` (above the booking flow) and `StudentPackagesPage.tsx` (under the header); `test/rn-01-package-balance.test.ts`
- Migration: none (reads the existing `GET /api/student/packages`)
- Checks: tsc pass, npm test 1060 pass / 0 fail (5 skipped), build pass. Credits with a refund request are left out of the list.
- Not checked / risks: not opened in a browser (student pages need a signed-in account); Arabic plural forms covered by the unit test.
### OPS-01..05 Launch operations: error capture, health page, cron heartbeat, runbook, placement reminder (2026-10-20)
- Result: done (merged to main 2026-10-20)
- Changed: `server/routes/ops.ts` (`POST /api/client-errors` rate limited 10/min/IP, `GET/DELETE /api/dashboard/app-errors`, `GET /api/dashboard/health`, API 5xx monitor, heartbeats), `api/index.ts` (wiring; heartbeat on each successful reminder-cron run and each signed Stripe webhook), `src/lib/errorReporter.ts` + `src/main.tsx` + `src/components/ErrorBoundary.tsx` (window errors, unhandled rejections, render errors), `src/dashboard/pages/HealthPage.tsx` + `DashboardApp.tsx` (`/dashboard/health`, super admin only, placement test mode banner), `src/types/database.ts`, `docs/launch-runbook.md`, `test/ops.test.ts`
- Migration: `20261020000000_ops_monitoring.sql` (`app_errors` grouped by fingerprint, `record_app_error` RPC, `ops_heartbeats`), applied to production 2026-10-20 (verified: RPC write, read and heartbeat table work with the service key).
- Checks: tsc pass, npm test 1056 pass / 0 fail (5 skipped), build pass. Errors are scrubbed (no query strings, emails or JWTs) and only the account id is kept.
- Not checked / risks: the health page was not opened in a browser (needs a real admin session). The free uptime monitor needs a Vercel Firewall bypass rule for `/api/health` (runbook §2, owner step).


### PR-07 Progress for parents: all children at a glance (2026-10-20)
- Result: done (8eb5c72 on main, merge dbec55e)
- Changed: `server/routes/progress.ts` (`buildFamilyChildOverviewCard`, `isGuardianAccount` + `childrenOverview` on `GET /api/student/progress`), `src/student/pages/StudentProgressPage.tsx` (family overview cards, last-opened child in localStorage, dev `?preview=family` fixture), `src/student/StudentApp.tsx` (dev-only bypass of the auth gate for `/student/progress?preview=...`, guarded by `import.meta.env.DEV`), `test/pr-07-parent-family-view.test.ts`, `docs/backlog/screenshots/pr07-family-ar-light.png`, `docs/backlog/screenshots/pr07-family-en-mobile.png`
- Migration: none
- Checks: tsc pass (0 errors), npm test 1050 pass / 0 fail (5 skipped), build pass, browser check `/student/progress?preview=family` in Arabic light desktop (1440px) and English dark mobile (375px); tapping a child card stores it as last opened; 0 console errors. Screenshots: `docs/backlog/screenshots/pr07-family-ar-light.png`, `docs/backlog/screenshots/pr07-family-en-mobile.png`
- Not checked / risks: Not tested against a real guardian account (no Supabase connection here). Without `?learnerId=`, the API still returns the primary learner's path (the PR-02 contract); the page then opens the remembered child, if there is one. Arabic dark and English light were not captured as screenshots.

### PR-06 Teacher side: record the family summary and milestones after a lesson (2026-10-20)
- Result: done (87ade22 on main)
- Changed: `server/routes/progress.ts`, `api/index.ts`, `src/dashboard/components/PostLessonSummaryEditor.tsx`, `src/dashboard/components/LessonDetailModal.tsx`, `src/dashboard/pages/TodayPage.tsx`, `src/dashboard/pages/StudentDetailPage.tsx`, `src/dashboard/types.ts`, `test/pr-06-teacher-family-summary.test.ts`, `docs/backlog/screenshots/pr06-teacher-summary-ar.png`, `docs/backlog/screenshots/pr06-teacher-summary-en-mobile.png`
- Migration: none (uses live `lesson_notes.family_summary`, `lesson_notes.achievements`, and `learner_milestones`)
- Checks: tsc pass (0 errors), npm test 1046 pass / 0 fail, build pass, browser check `/dashboard/students/:id` verified in Arabic & English, light & dark themes, desktop (1280px) & mobile (375px) (0 console errors; screenshots in `docs/backlog/screenshots/pr06-teacher-summary-ar.png` and `docs/backlog/screenshots/pr06-teacher-summary-en-mobile.png`)
- Not checked / risks: Jalila AI summary drafting is intentionally deferred per task spec.

### PR-03 Progress page: the learning path (2026-10-19)
- Result: done (dc58c80 on main)
- Changed: `src/student/pages/StudentProgressPage.tsx`, `src/student/StudentApp.tsx`, `test/pr-03-progress-page.test.ts`, `docs/backlog/screenshots/pr03-*.png`
- Migration: none
- Checks: tsc pass (0 errors), npm test 1043 pass / 0 fail, build pass, browser check `/student/progress` verified in Arabic & English, light & dark themes, desktop (1280px) & mobile (375px) + zero-lesson empty state (0 console errors; screenshots in `docs/backlog/screenshots/pr03-desktop-ar-path-scrolled.png`, `docs/backlog/screenshots/pr03-desktop-en-dark.png`, `docs/backlog/screenshots/pr03-mobile-375-ar-path-scrolled.png`, `docs/backlog/screenshots/pr03-mobile-375-en-dark.png`)
- Not checked / risks: Auto-scroll to `[data-current-level="true"]` verified in headless Chromium; family overview grid for multi-child guardian accounts is scheduled in PR-07 (currently uses learner switcher pills).

### PR-02 Progress API (read model) (2026-10-19)
- Result: done (27df92a on main)
- Changed: `server/routes/progress.ts`, `test/pr-02-progress-api.test.ts`
- Migration: none
- Checks: tsc pass (0 errors), npm test 1039 pass / 0 fail, build pass, browser check N/A (backend API task)
- Not checked / risks: Smoke-tested locally with dev student/guardian/foreign tokens and zero-lesson student fixture; relies on PR-01 migration (`learner_milestones` and `lesson_notes` columns) already applied to production by Claude.

### PR-01 Progress data model: shared lesson summaries and milestones (2026-10-19)
- Result: done (b7b5060 on main)
- Changed: `supabase/migrations/20261019000000_learner_progress_summaries_milestones.sql`, `src/types/database.ts`, `server/routes/progress.ts`, `api/index.ts`, `test/pr-01-progress-data-model.test.ts`
- Migration: `supabase/migrations/20261019000000_learner_progress_summaries_milestones.sql`, applied to production yes (by Claude on 2026-10-19 after review; Argon had no Supabase connection in this workspace)
- Checks: tsc pass (0 errors), npm test 1032 pass / 0 fail, build pass, browser check N/A (backend + schema task)
- Not checked / risks: Migration file is ready and verified by tests, and existing `/api/dashboard/students/:id/notes` endpoints remain backward-compatible before migration application, but the SQL file must be applied to production Supabase before `/api/student/milestones` or `/api/dashboard/students/:id/milestones` are queried against production.

