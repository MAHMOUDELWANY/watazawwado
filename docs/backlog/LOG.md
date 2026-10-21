# Backlog progress log

One entry per finished task, newest first: result, files changed, checks run, what was not checked.

## Done

### QA-03 RTL and bilingual sweep (2026-10-21)
- Result: done (main). Swept `src/` (curriculum slides excluded: a fixed 16:9 canvas laid out on purpose).
- Fixed: physical margins/paddings that ignored the reading direction → logical (`ms-`, `pe-`, `ps-`, `start-`) in the booking flow (stepper link, date step, service list, time-zone search field and its icon), the packages and payments pages. Six hard-coded English accessible names → bilingual (booking header close, checkout close, shared Modal close, loading spinner, sign-up steps). The booking page's error banner mixed Arabic and English ("تحديث الجلسة / Retry", an Arabic-only sign-in message, and the raw server error with English after it): now one plain sentence and a "Try again" button in the visitor's language, without the raw error. The side menu border now sits on its inner edge in both directions.
- Checked and fine: every arrow/chevron flips in Arabic (by condition or `rtl:`); `left-1/2`-style centring and symmetric `left-0 right-0` bars; `Select` and `AccountDropdown` already handle RTL. Live on production in English: /, /pricing, /learning, /faq, /about, /how-it-works, /safety, /terms show Arabic only in the language button, the brand name, the Quran verses (marked `lang=ar`) and decorative letters.
- Tests: new `test/qa-03-rtl-bilingual.test.ts` (no physical ml/mr/pl/pr or text-left/right outside `rtl:` pairs; no hard-coded English `aria-label`).
- Migration: none
- Checks: tsc pass; npm test 1175 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: signed-in pages in English were reviewed from code only; text inside API error messages shown to students is English on the server for some routes (covered for booking by ST-03's `bookingErrorText`).

### QA-02 Accessibility audit (2026-10-21)
- Result: done (main). Public pages checked live (keyboard and an in-page scan for unnamed buttons/links/fields, missing alt, duplicate ids, h1 count, dialog names) on /, /pricing, /learning, /faq, /about, /how-it-works, /safety, /staff/login, the trial sheet, the sign-up form and the site menu; portal and dashboard checked from code (owner rule).
- Fixed: `FocusTrap` rewritten (focus moves in on open, Tab/Shift+Tab wrap even when focus started outside, focusables recomputed on every Tab, Escape, focus returns to the opener, nested dialogs handled by a stack). Before, the trial sheet let Tab escape to the page, ignored Escape and never moved focus in. Now used by the trial sheet, sign-up/sign-in, site menu (also gets role=dialog and a name), time-zone picker, and the dashboard booking, lead, trial, payment and student-edit dialogs. Dialog titles are h2 (pages keep one h1). 15 portal/dashboard fields and 13 booking-flow fields had no programmatic label: labels now point at their fields (`htmlFor`/`id`) or carry `aria-label`. Header logo link had its focus outline removed with nothing in its place: now `focus-ring`. Duplicate `id="theme-toggle-btn"` removed (the tour now picks the visible one by `data-tour`). Dark theme: error text was 4.21:1, now `#EC4046` (4.9:1 on the background, 4.5:1 on cards) with dark text on red fills; white on the crimson fill was 4.34:1, that fill is now `#DD2A30` (4.7:1). Dead `TeacherAuthModal` and `teacherRepository` removed (unreachable, read tables directly).
- Measured: light and dark tokens: foreground 17.8:1, muted text 8.4–10.7:1, accent 6.3:1, teal 4.5–6.4:1.
- Tests: new `test/qa-02-accessibility.test.ts` (every field in `src/` has a name; every `role="dialog"` uses FocusTrap; trap behaviours; no second h1 in dialogs; no duplicate theme id). `phase-d-remediation` updated to the new trap's code for the same two behaviours.
- Migration: none
- Checks: tsc pass; npm test 1172 pass / 1 fail (the old FocusTrap string check, then updated and passing) / 5 skipped; build pass.
- Not checked / risks: no screen reader was run; there is no toast system to give `aria-live` (inline messages use `role="alert"`); contrast was checked on the tokens, not on every glass surface or gradient; signed-in pages were not keyboard-tested live.

### QA-01 Smoke tests for the money paths (2026-10-21)
- Result: done (main), with a deliberate limit. The local server uses the production database, and a real booking there would make the production cron create a Zoom meeting, a teacher calendar event and emails. So `test/qa-01-money-paths-smoke.test.ts` walks every money path up to the first write, with dev auth and booking ids that match no row: booking validation (duration, trial length, time zone, email, name, guardian, slot), checkout (Stripe only, a known booking only, no amount read from the browser), payment confirmation only through a verified Stripe session or a signed webhook, every student money route 401 without a token and 403 for a teacher, cancel/move of a lesson that is not yours → 404, packages data from the server catalogue, refund and pay-later admin-only, and no money keys in the teacher Today/Upcoming responses.
- Window rules moved into `server/booking/studentWindows.ts` (same checks, same messages, same order) and unit tested: trial cancel 1 h, other lessons 3 h, move up to 1 h, a trial moved once, a pending/finished lesson can be neither moved nor cancelled; teacher moves need a reason before the RPC; a move lands on a later day in the student's time zone.
- Found: the Stripe test key in the local `.env` is expired (Stripe answers "Expired API Key"), so no local checkout can reach Stripe. Owner: create a new test key in the Stripe dashboard and put it in `.env`; check the production key works with one real checkout before launch.
- Migration: none
- Checks: tsc pass; npm test 1168 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: the write path (create booking → Stripe test checkout → webhook → confirmed, sign-up/onboarding writes) needs a separate test database (a second free Supabase project with the migrations applied, wired through `.env.test`), owner decision. The dev teacher may have no lessons, in which case the no-money walk checks empty lists; TE-02's test covers the student card.

### SEC-01 Security review of the recent changes and the live database (2026-10-21)
- Result: done (89463f0). Owner asked for a careful security pass before more backlog work. Scope: every code change in b850ad2..HEAD (OPS, RN, CRM, PA, ST, TE, AD, PU), plus production RLS policies, table/column grants and the Supabase security advisor.
- Found and fixed (applied to production, verified as a real teacher session inside a rolled-back transaction):
  - High: any active teacher could read every `payments` row straight through Supabase REST with their own token (policy from 2026-10-13, before the 2026-10-15 rule "teachers never see money"). Now super admin only. Teacher sees 0 of 2 rows.
  - High: the teacher policy on `bookings` is FOR ALL, so a teacher token could UPDATE their bookings directly (e.g. set an unpaid booking to confirmed) and read `fee_amount_usd` and the management token. Browser roles now have no writes on bookings, payments or package_entitlements, and the fee and token columns are not granted.
  - High: twelve "Teacher allowlist access" FOR ALL policies let any teacher read and change every parent's contacts (guardians), every lead, other teachers' hours (availability), the AI facts (ai_knowledge), testimonials and blog posts, profiles, reminders, goals, progress, sessions. Now super admin only. Public reads and students' own reads unchanged.
  - Medium: `package_entitlements` teacher read exposed `price_paid`; the policy now matches nothing (the API strips money for teachers).
  - Medium: `/api/dashboard/students/:id` put the stored email raw into a PostgREST `or()` filter (an `_` in an email matches other families' bookings). Now quoted and wildcard-escaped; a new test fails on any future unescaped `ilike` filter.
- Checked and fine: new routes are guarded (admin routes `requireSuperAdmin`, `/api/student/children` rate limited and scoped, CRM ids validated); Stripe webhook heartbeat runs after the signature check; lead source sanitised (known keys, short plain strings, host/path only); new emails escape names and text; no `dangerouslySetInnerHTML`, `eval` or open redirect added; students store and receive only the Zoom join link (0 host links in the database); new tables are RLS-on, service-role only; students can update only 7 harmless columns of their own row; email confirmation is on (0 unconfirmed accounts), so email-based family linking holds; the browser's 4 RPCs are SECURITY DEFINER and token-checked.
- Migrations: `20261021000000_browser_roles_money_lockdown.sql`, `20261021000001_teacher_allowlist_to_super_admin.sql` (both applied).
- Checks: tsc pass; npm test 1155 pass / 0 fail / 5 skipped; build pass; production /api/health ok, /pricing renders, admin API 401 without a token.
- Owner action (a security setting, so not changed by Claude): Supabase → Authentication → enable leaked password protection. Keep "Confirm email" on: family linking relies on verified emails.
- Not fixed (low): `/api/client-errors` is public and rate limited per IP per instance, so many IPs could still add many distinct error rows; the old `Teacher scoped access` policies on students/bookings join `auth.users` and simply error for browser roles (fail closed, unused). `src/components/TeacherAuthModal.tsx` and `src/lib/teacherRepository.ts` are dead code that read tables directly; left for QA-06.

### PU-02 Conversion audit of the trial path (2026-10-21)
- Result: done (main). Walked home → trial CTA → "your first lesson is on us" sheet → sign-up form at 375×812 in the local preview; onboarding (signed in) reviewed from code per the owner rule (no browser sign-in).
- Found and fixed: header theme, language and menu buttons were 32–41 px tall (now 44 px, `ThemeToggle.tsx`, `Navbar.tsx`, no horizontal overflow at 375 px); sign-up sheet close/back and show-password buttons were 36 px (now 44 px, password field padding widened, `StudentAuthModal.tsx`); onboarding errors render above the form, out of view on a phone after tapping Continue at the bottom, so they now scroll into view and are announced (`role="alert"`, `StudentOnboardingPage.tsx`).
- Kept as is: the funnel copy is already short and honest (30 min free, no card, choose a male or female teacher); sign-up asks name, email, password and an 18+ tick (family: guardian age), and onboarding pre-fills the name and the guardian age from sign-up, so nothing is asked twice; "How did you hear about us" is optional; the age tick's whole row is the tap target.
- Screenshots: before, header buttons 32×32 / 53×33 / 41×32 and sheet buttons 36×36 (measured in the preview); after, 44×44 / 53×44 / 44×44 and 44×44. Images were taken in the session, not saved to the repo.
- Migration: none
- Checks: tsc pass; npm test 1149 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: onboarding steps 2–3 and the trial booking itself were not clicked through (signed-in); footer legal links stay 20 px tall (low traffic, left for QA-04).

### MK-02 Retired "Islamic studies" removed from public copy (2026-10-20)
- Result: done (main). Follow-up to MK-01; catalog per RULES.md §2b.
- Changed: `AboutPage.tsx` (intro and both teacher cards name the Zad Path; "strong English" with no level or certificate, owner's answer on the Notion review page §9), `PublicLayout.tsx` meta description, `src/data/seo.ts` (home title/description/h1, /learning description now lists the current catalog), `PrivacyPolicyPage.tsx` intro, `TermsPage.tsx` (agreement intro and prices: $9 = Quran, Tajweed and the Zad Path; $13 = Fusha, Egyptian Arabic and English) with `TERMS_VERSION` 2026-10-15.3 → 2026-10-20.1 in `api/index.ts` and the page label, `StepLessonType.tsx` 60-minute note, student portal `StudentPackagesPage.tsx` package band labels and `StudentProfilePage.tsx` plan line, `/learning` search placeholder (Fiqh → Seerah, Fusha), `index.html` (title, meta, Open Graph, Twitter, JSON-LD), `public/site.webmanifest`, AI chat facts `server/siteFacts.ts` ($9/$13 bands) and the homepage guide and Jalila prompts, new `test/retired-subject-copy.test.ts`.
- Migration: none
- Checks: tsc pass; build pass, no prerendered page in `dist/` names Islamic studies or IELTS C1; npm test 1124 pass / 7 fail / 5 skipped, the 7 being the CRLF checkout artefacts noted in MK-01 (migration source regexes, files untouched); production 2026-10-20: /, /about, /terms, /privacy, /learning all 200 with no "Islamic studies" or IELTS and the Zad Path present, /terms shows version 2026-10-20.1, web manifest updated, /api/health 200.
- Not checked / risks: still mentioning retired subjects, not public: dashboard `SettingsPage.tsx` price note, `LeadDetailModal.tsx`/`TrialDetailModal.tsx` subject lists, `src/booking/mockData.ts` retired service rows (inactive), `StudentOffersPage.tsx` fallback label for old offers, onboarding `subjects.ts` retired rows (kept by design), `metadata.json` (AI Studio file, centres one teacher), `.claude/product-marketing.md` one-liner, RULES.md §3/§6b wording, placement bank `islamic.ts`.

### MK-01 Ready to measure content before the first post (2026-10-20)
- Result: done (main). From the external research review (`docs/marketing/reports/2026-10-20 External research review.md`).
- Changed: new `src/lib/leadSource.ts` (first-touch UTM tags + referrer host + landing path in localStorage `wz_first_touch`, only from a visit that carries any; sanitizer; "How did you hear about us?" options), `src/main.tsx`, `src/student/pages/StudentOnboardingPage.tsx` (optional question, sends both), `api/index.ts` (onboarding saves `heard_about` and `lead_source` once, never overwritten; `/api/dashboard/leads` adds `acquisition` per lead by email), `server/routes/crm.ts` (timeline "Account created" shows the source), `src/dashboard/pages/LeadsPage.tsx` + `src/dashboard/components/LeadsBoard.tsx` (source badge and filter), `@vercel/analytics` in `PublicLayout.tsx` (public pages only, cookie-free) + privacy page lines, copy fixes (homepage 8 subjects, /pricing Zad Path + single-lesson and $13 package line, booking summary pricing note, /pricing SEO description), new `/safety` parent page (`src/components/public/safety/SafetyPage.tsx`, only facts from the terms §Children, RULES.md §2 Zoom host and the privacy policy; linked from the footer, the FAQ and the sitemap), tests `test/lead-source.test.ts`, `test/measurement-ready.test.ts`.
- Migration: `20261020000003_lead_source.sql` (`students.lead_source jsonb`, `students.heard_about text` with a check), applied to production 2026-10-20.
- Checks: tsc pass; npm test 1111 pass / 7 fail / 5 skipped in the worktree, the 7 being CRLF checkout artefacts (same 4 files 22/22 pass after an LF re-checkout); build pass (9 pages prerendered); local static preview at 375px RTL (/safety, /pricing, homepage, first touch kept across pages); production: /safety 200 and in sitemap, /pricing copy live, `/_vercel/insights/script.js` 200, migration columns present.
- Not checked / risks: Admin views (CRM timeline, leads source badge and filter) not opened in the browser (no admin login here). Accounts that finished onboarding before today have no source. Other pages still say "Islamic studies" (About, layout meta, privacy, terms, home SEO title); left for a copy pass, the terms need a version bump.

### AD-01 Admin overview that answers "what needs me today" (2026-10-21)
- Result: done (main)
- Changed: `api/index.ts` (new `GET /api/dashboard/admin/action-items`, super admin only: follow-ups due by end of today, pay-later requests, refund requests, placement results waiting for review, unread support chats, health warnings, lessons in the next 24 h without a Zoom link; each with a count and a link, using the same filters as the page it opens), `server/routes/ops.ts` (health checks moved into `computeHealth()` so the health page and the overview share them), new `src/dashboard/components/ActionItems.tsx` (leads `OverviewPage.tsx`; only items with a count, or "Nothing needs you right now"), `test/ad-01-admin-action-items.test.ts`
- Migration: none
- Checks: tsc pass, npm test 1149 pass / 0 fail (5 skipped), build pass; route called against real data (3 placement results to review, 2 health warnings), health page unchanged after the refactor.
- Not checked / risks: unread chats are compared in code over support threads active in the last 30 days (500 at most). Dashboard not opened in a browser (owner rule).
### TE-04 Teacher onboarding checklist (2026-10-21)
- Result: done (main)
- Changed: `api/index.ts` (new `GET /api/dashboard/onboarding-checklist`: agreement = current `TEACHER_AGREEMENT_VERSION` (admin exempt), hours = an active `availability` row, calendar = an active Google `calendar_connections` row, photo = `teacher_accounts.photo_url`, Zoom = a booking of this teacher with a real Zoom link), new `src/dashboard/components/TeacherChecklist.tsx` (on Today until everything is done; each item links to where it is done), `TodayPage.tsx`, `test/te-04-teacher-checklist.test.ts`
- Migration: none
- Checks: tsc pass, npm test 1146 pass / 0 fail (5 skipped), build pass; route called with the teacher token against real data.
- Not checked / risks: there is no per-teacher bio field (the `bio` setting is global), so the item is "photo and card"; teachers can't upload a photo themselves, the item points them to Messages to send it to the admin. "Zoom tested" is inferred from a lesson having a Zoom link, not from a click. Dashboard not opened in a browser (owner rule).
### TE-02 Student card for teachers (2026-10-20)
- Result: done (main)
- Already there: goals from onboarding, milestones, lesson history and notes on `StudentDetailPage.tsx`.
- Added: `GET /api/dashboard/students/:id` returns the latest submitted/reviewed `placement` (level, score, reviewed or not) and `chat_thread_id` (the teacher's lesson chat with this family, or the admin's support chat); the page shows a placement line and "Message the family" (`/dashboard/messages?thread=...`). Files: `api/index.ts`, `src/dashboard/pages/StudentDetailPage.tsx`, `src/dashboard/types.ts`, `test/te-02-teacher-student-card.test.ts`
- Money: the test calls the route with the teacher token for a real student assigned to that teacher and walks the whole response for any fee/price/amount/payment/refund/currency key: none.
- Migration: none
- Checks: tsc pass, npm test 1144 pass / 0 fail (5 skipped), build pass. Dashboard not opened in a browser (owner rule).
### TE-01 Today page as a cockpit (2026-10-20)
- Result: done (main)
- Changed: `api/index.ts` (`GET /api/dashboard/today` adds `summary.next_lesson_context`: the learner's age, level, subject and the latest family summary + next steps; and `missing_notes`: the teacher's completed lessons of the last 14 days with no family summary, up to 10, with the learner's own name), `src/dashboard/pages/TodayPage.tsx` (the next lesson card now leads the page, above the numbers, with age, level, "last time (to the family)" and next steps next to the existing Start-as-host button; "Summaries still to write" after today's lessons, each linking to the student page where the PR-06 editor is), `src/dashboard/types.ts`, `test/te-01-today-cockpit.test.ts`
- Migration: none. Private teacher notes are never read by this route.
- Checks: tsc pass, npm test 1129 pass / 0 fail (5 skipped), build pass; route called in-process against real data (200, no errors) and the new PostgREST filters checked directly.
- Not checked / risks: there were no lessons today and no completed lessons in the last 14 days, so the filled-in card and list were not seen with data. Dashboard not opened in a browser (owner rule).
### ST-04 Empty, loading and error states across the portal (2026-10-20)
- Result: done (main)
- Audit (from the code, 11 data pages): all had a loading state; home, lessons, progress, packages, payments, notifications and booking already had an error with retry and empty states with a next step.
- Fixed: new shared `src/components/ErrorState.tsx` (plain message + "Try again", pairs with `EmptyState`). Curriculum and its lesson view (red text, no retry), placement report (red text), placement test (a failed load showed an empty page), profile (a failed load showed an empty form under a banner) and offers (error without retry; empty state now `EmptyState` with "Talk to the guide") now use it. Files: those pages + `test/st-04-portal-states.test.ts`
- Migration: none
- Checks: tsc pass, npm test 1125 pass / 0 fail (5 skipped), build pass. Not opened in a browser (signed-in pages; verified from code by owner rule).
### ST-03 Booking flow polish (2026-10-20)
- Result: done (main), presentation only, no booking rule touched
- Audit (from the code): step header, availability skeleton + retry, time zone on every time (date step banner, summary, confirmation) and the saved draft were already in place.
- Fixed: double tap could start two submits before React disabled the button (`submittingRef` guard in `BookingFlow.tsx`); a network failure said "Database service is currently unavailable" (now "check your internet"); a raw exception text could show for a bad time; booking errors were English for Arabic users (new `src/components/booking/bookingErrors.ts`: Arabic for the known messages, a plain Arabic sentence plus the detail otherwise); "min" on the Arabic confirmation. Files: `BookingFlow.tsx`, `bookingErrors.ts`, `BookingConfirmation.tsx`, `src/lib/bookingRepository.ts`, `test/st-03-booking-polish.test.ts`
- Not changed on purpose: the browser back button leaves the booking page rather than going back one step (the draft brings the family back to the same step); step-by-step history would mean managing history next to React Router.
- Checks: tsc pass, npm test 1114 pass / 0 fail (5 skipped), build pass. Not opened in a browser (signed-in page; verified from code by owner rule).
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

