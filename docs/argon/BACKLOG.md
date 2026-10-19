# Argon backlog: pre-launch improvements (2026-10-19 → 2026-10-23)

Task list for Antigravity agents (Gemini 4 Argon) while Claude is out of weekly quota. Read `AGENTS.md` first: it says
how to take a task, the green/red zones, the checks and the hard rules. Curriculum and marketing are not in this list
(Claude only).

Approved by the owner on 2026-10-19 through `/plan-ceo-review` (selective expansion): the four big additions are the
learner progress experience (PR), the retention engine (RN), the admin CRM (CRM) and launch operations (OPS). The other
lanes polish what exists for each role.

## How to read a task

- **ID**: lane + number. Lanes: `PR` progress, `RN` retention, `CRM` admin CRM, `OPS` launch ops, `PA` parent,
  `ST` student, `TE` teacher, `AD` super admin, `PU` public site, `QA` quality (tests, accessibility, SEO, performance).
- **Priority**: `P1` before launch, `P2` launch week, `P3` when P1/P2 in your lane are done.
- **Zone**: 🟢 green → `main` after checks; 🔴 red → branch, Claude reviews Friday (AGENTS.md section 4).
- **Size**: S (< 2 h), M (half a day), L (a day or more).
- **Status**: `todo` → `taken (date note)` → `done (sha)` or `review (branch)`; `blocked (reason)`.
- **Every task**, even when not repeated below: check first whether it already exists (search the code; if it exists,
  polish it instead and say so in the log), Arabic and English, RTL, light and dark, 375px, `src/components/ui/*`,
  `humanizer` on all copy, tests for new behaviour, no Mahmoud-centred wording, no invented numbers.
- Pick tasks top-down by priority. Tasks in the same lane that touch the same files are chained with `Depends on`.

## Shared design direction for the new experiences

The owner wants the progress experience to feel like the best consumer learning apps (Duolingo-level polish), in our
own brand: glass surfaces, crimson / teal / copper / gold, khatam and mihrab motifs (`docs/design-system.md`).
Principles every PR/RN task follows:

- **Our rhythm is weekly, not daily.** Lessons are booked a few times a week, so the streak counts consecutive weeks with
  at least one attended lesson ("7-week rhythm"). Never a daily streak, never guilt ("you lost your streak!"), never a
  red alarm. A missed week simply starts a new rhythm; the longest rhythm stays visible.
- **No leaderboards and no comparing children.** Progress is personal. Children's data is private (RULES.md, terms
  "Children & safeguarding").
- **Real data only.** Every number comes from attended lessons, teacher notes, placement results or teacher-set
  milestones. No fake XP that means nothing; if we show points, they map to real things (lessons, verses, rules).
- **Motion with purpose** (`apple-design`, `animate`): a milestone unlock gets one short celebration; everything else is
  calm. Respect `prefers-reduced-motion`.
- **Islamic adab**: no music, no gambling-like mechanics (no loot boxes, spins or random rewards), praise words in our
  voice (for example "زادك الله"), no images of faces in badges.

---

## PR: Learner progress experience (owner priority)

### PR-01 Progress data model: shared lesson summaries and milestones
- Priority P1 · Zone 🟢 (additive migration) · Size M · Status done (b7b5060)
- Files: new migration, `src/types/database.ts`, `api/index.ts` or a new `server/routes/progress.ts`.
- Do: `lesson_notes.private_notes` is teacher-only and must never reach a family. Add what the family view needs:
  a nullable `family_summary text` and `achievements jsonb` on `lesson_notes` (what was covered, in the teacher's words
  for the family), and a new table `learner_milestones` (id, student_id, subject slug, kind
  [`surah_memorized`, `juz_completed`, `level_completed`, `rule_mastered`, `book_completed`, `custom`], title_ar,
  title_en, reached_at, created_by teacher id, lesson_session_id nullable). RLS: the student/guardian of that student
  can read; the assigned teacher and super admin can insert/update; nobody can delete except super admin.
- Done when: migration applied to production (additive only), types updated, RLS test proves a parent cannot read
  another family's milestones and a teacher cannot read private notes of a student who is not theirs.
- Skills: `new-migration`, `security-and-hardening`.

### PR-02 Progress API (read model)
- Priority P1 · Zone 🟢 · Size M · Status done (27df92a) · Depends on PR-01
- Do: `GET /api/student/progress?learnerId=` returns, per subject: current level and the subject's level list (from
  `src/components/onboarding/subjects.ts`), lessons attended (total, this month), weekly rhythm (current, longest),
  milestones, last 5 family summaries, placement result, next booked lesson. A guardian may pass a child's id only if
  that child is theirs (server check). Never include `private_notes`, prices or teacher-only fields.
- Done when: tests cover own learner, guardian's child, foreign child (403), learner with zero lessons (empty but valid).

### PR-03 Progress page: the learning path
- Priority P1 · Zone 🟢 · Size L · Status todo · Depends on PR-02
- Files: new `src/student/pages/StudentProgressPage.tsx`, route and nav entry in `src/student/StudentApp.tsx`.
- Do: the centrepiece. A vertical path per subject (like a learning-app map) built from the subject's real levels:
  finished levels as filled medallions, the current level glowing with progress inside it, future levels as soft
  outlines, milestones placed on the path as small emblems (khatam star, open mushaf, arch). Tabs or a switcher when the
  learner has several subjects. Header card: weekly rhythm flame-equivalent in our motif (a lamp or a growing date palm,
  not a fire emoji), lessons attended, longest rhythm. Empty state for a new learner that invites the first lesson.
- Done when: looks finished in both languages and themes at 375px and desktop, path scrolls to the current level,
  reduced-motion respected, screenshot in the log.
- Skills: `brainstorming`, `impeccable`, `apple-design`, `animate`, `taste-skill`, `soft-skill`, `mobile-native`.

### PR-04 Milestone celebration and achievements shelf
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on PR-03
- Do: when the page loads and a milestone is new since the last visit (store last-seen per learner), play one short
  celebration (emblem rises, gold light, the praise word), then it settles on an achievements shelf. Shelf shows earned
  emblems in colour and the next reachable ones in outline with what earns them. Design 8–12 emblems in our own SVG.
- Done when: celebration plays once only, can be dismissed, works with reduced motion (static reveal).

### PR-05 Lesson timeline with family summaries
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on PR-02
- Do: below the path, a timeline of attended lessons: date in the viewer's time zone, teacher, subject, the family
  summary and achievements, homework/next steps if shared. Paginate (20 per page).

### PR-06 Teacher side: record the family summary and milestones after a lesson
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on PR-01
- Files: `src/dashboard/pages/TodayPage.tsx` / `StudentDetailPage.tsx`, the lesson notes editor.
- Do: after a lesson, the teacher sees one quick form: private notes (unchanged, labelled "only you and the admin"),
  "for the family" summary, quick-pick achievements for the subject (for Memorization: surah + ayah range; Tajweed: rule;
  Reading: stage/page), and "mark a milestone". Make it fast: under 30 seconds for a typical lesson. Jalila may later
  draft the summary; not in this task.
- Done when: a teacher can only write for their own students' lessons (server check + test).

### PR-07 Progress for parents: all children at a glance
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on PR-03
- Do: for a guardian account, the progress page opens on a family view: one card per child (name, subject, current
  level, rhythm, next lesson, newest milestone) → tap opens that child's path. Remember the last opened child.

### PR-08 Monthly progress report page (printable)
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on PR-02
- Do: `/student/progress/report?month=YYYY-MM&learnerId=`: a branded one-page report per learner per month (lessons
  attended, milestones, teacher summaries condensed, level movement, a short note from the teacher if written). Print
  CSS for A4 and Letter. Label it clearly as a progress report, not a certificate (same rule as placement reports).

### PR-09 Monthly progress email to guardians and adult learners
- Priority P2 · Zone 🔴 (new scheduled send) · Size M · Status todo · Depends on PR-08
- Do: on the 1st of each month (through the existing external cron with `CRON_SECRET`), email each active learner
  (guardian for children) a short summary + link to PR-08. One language per RULES.md §6 (user preference). Brevo free
  plan limit is 300 emails/day: batch and resume safely; never send twice for the same month (store a send record).
  Opt-out link in the footer and a preference in the profile.
- Done when: dry-run mode prints recipients without sending; idempotency test; templates in `server/notifications`.
- Skills: `emails`, `humanizer`.

### PR-10 Progress on the student home page
- Priority P2 · Zone 🟢 · Size S · Status todo · Depends on PR-03
- Do: a compact progress card on `StudentHomePage.tsx` (rhythm, current level, newest milestone) linking to the page.

---

## RN: Retention engine (no pressure, RULES.md §4)

### RN-01 Package balance on every surface
- Priority P1 · Zone 🟢 · Size S · Status todo
- Do: show remaining lessons per active package (band + length) on the student home page, booking page header and
  packages page in one consistent component. Copy is calm: "3 lessons left in your 8-lesson package".

### RN-02 Low-balance notice (on-site + email)
- Priority P1 · Zone 🔴 (new notification trigger) · Size M · Status todo · Depends on RN-01
- Do: when a package reaches 2 lessons left (and again at 0), create one on-site notice and one email with a renew link.
  Never more than once per threshold per package. No urgency words, no countdowns.
- Done when: tests prove one notice per threshold and none for refunded/expired packages.

### RN-03 One-click renew the same package
- Priority P1 · Zone 🔴 (purchase flow) · Size M · Status todo · Depends on RN-01
- Do: "Renew this package" opens the existing purchase flow pre-filled with the same band, length and size (the server
  still computes the price; terms and early-start checkboxes still required).

### RN-04 Weekly time suggestion ("same time next week")
- Priority P2 · Zone 🟢 · Size M · Status todo
- Do: after a lesson, suggest booking the same weekday and time next week if the teacher is free (read availability from
  the existing engine, never bypass it). One tap opens the booking flow with that slot pre-selected. This is a
  suggestion, not a recurring booking (multi-lesson booking was removed on purpose; do not bring it back).

### RN-05 Trial → first paid lesson follow-up
- Priority P1 · Zone 🔴 (new scheduled send) · Size M · Status todo
- Do: 24 hours after an attended free trial, send one warm email + on-site notice: what the teacher noted (family
  summary if any), the placement result if taken, and how to continue (single lesson or package). Once per learner.

### RN-06 Gentle "we miss you" for quiet learners
- Priority P3 · Zone 🔴 · Size M · Status todo · Depends on RN-05
- Do: a learner with paid history and no booking for 21 days gets one friendly message from "our team" (and the admin
  gets a CRM follow-up task, CRM-04). Never more than once per 60 days.

### RN-07 Notification preferences
- Priority P2 · Zone 🟢 · Size S · Status todo
- Do: in the profile, toggles for progress emails, renewal reminders and "we miss you" (transactional emails such as
  booking confirmations and reminders stay on). Respect them in RN-02, RN-05, RN-06, PR-09.

---

## CRM: Super admin CRM

### CRM-01 Family timeline
- Priority P1 · Zone 🟢 · Size L · Status todo
- Files: `src/dashboard/pages/StudentDetailPage.tsx`, `LeadsPage.tsx`, read-only API.
- Do: one chronological timeline per account (and per child): sign-up, onboarding, intake/AI guide request, placement,
  trial booked/attended/missed, payments, packages, lessons, refunds, teacher changes, chat started, notes. Built from
  existing tables (`leads`, `bookings`, `payments`, `placement_tests`, `chat_threads`, `notification_events`, ...).
  Filters by type. Admin only.

### CRM-02 Pipeline board
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: a kanban view of the existing lead statuses (`server/leadTransitions.ts`: visitor → lead → contacted →
  trial_booked → trial_completed → potential_student → active_student → returning_student / lost). Drag only along
  allowed transitions (the server validates with `ALLOWED_LEAD_TRANSITIONS`). Counts per column, days in stage.

### CRM-03 Admin notes and tags per family
- Priority P1 · Zone 🟢 (additive) · Size M · Status todo
- Do: new table `crm_notes` (account id, child id nullable, body, author, created_at) and `crm_tags` (account id, tag).
  Suggested tags: "sibling likely", "prefers female teacher", "time zone tricky", "pay-later trusted". Admin only (RLS).

### CRM-04 Follow-up tasks with due dates
- Priority P1 · Zone 🟢 (additive) · Size M · Status todo · Depends on CRM-03
- Do: table `crm_tasks` (account, title, due_at, done_at, created_by, source [manual, trial_followup, quiet_learner,
  low_balance]). "My follow-ups" list on the admin overview: overdue, today, this week. One-tap WhatsApp prefill
  (greeting from the Watazawwado team) and "mark done". Auto-create a task after every attended trial.

### CRM-05 CSV export
- Priority P2 · Zone 🟢 · Size S · Status todo
- Do: export the students list, leads and payments (admin only, server-generated, UTF-8 with BOM so Arabic opens in
  Excel). No private teacher notes, no secrets.

### CRM-06 Search everything
- Priority P2 · Zone 🟢 · Size M · Status todo
- Do: one admin search box (Ctrl+K) across accounts, children, emails, booking references and payments; jump to the
  record.

### CRM-07 Funnel analytics that match reality
- Priority P2 · Zone 🟢 · Size M · Status todo
- Files: `src/dashboard/pages/AnalyticsPage.tsx`.
- Do: sign-ups → onboarding done → trial booked → trial attended → first paid → second month, by week, with the real
  counts behind each step (click to list the people). Remove any number that cannot be traced to data.

### CRM-08 Teacher load and quality view
- Priority P3 · Zone 🟢 · Size M · Status todo
- Do: per teacher: active students, lessons this week, hours offered vs booked, lessons moved by the teacher (with
  reasons), notes completion rate after lessons (PR-06). Admin only; teachers never see money.

---

## OPS: Launch operations (free tools only)

### OPS-01 Error monitoring
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: capture front-end errors (`ErrorBoundary.tsx`, `window.onerror`, unhandled rejections) and API 5xx into a new
  `app_errors` table through a small rate-limited endpoint (no third-party paid service; no personal data beyond the
  account id; strip query strings). Admin page lists them grouped by message with counts and last seen.
- Done when: a thrown test error appears in the list; the endpoint refuses floods (rate limit test).

### OPS-02 System health page
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: `/dashboard/health` (admin only): last successful Brevo send, failed `notification_events` in 24 h, pending
  `integration_jobs` and their age, Google Calendar connections that lost their token, Zoom link creation failures,
  Stripe webhook last received, cron last run. Green / amber / red per row with the fix in one sentence.

### OPS-03 Uptime and cron heartbeat
- Priority P1 · Zone 🟢 · Size S · Status todo
- Do: a public `GET /api/health` (no secrets, no DB details) for a free uptime monitor, and record each reminder-cron
  run so OPS-02 can say "cron has not run for 2 hours". Write the owner's 5-minute setup steps for a free monitor
  (UptimeRobot or similar) in `docs/argon/launch-runbook.md`.

### OPS-04 Launch-day runbook
- Priority P1 · Zone 🟢 · Size S · Status todo
- Do: `docs/argon/launch-runbook.md`: pre-launch checklist (placement test mode off, test accounts removed, emails
  pasted into Supabase, firewall rules on), how to roll back in Vercel, who to message when payments fail, the first
  24 h checks. English.

### OPS-05 Placement test mode switch reminder
- Priority P1 · Zone 🔴 (booking rule) · Size S · Status todo
- Do: `PLACEMENT_BEFORE_BOOKING` is still `true` (temporary). Do not flip it. Add an admin banner on the health page
  showing its current value so the owner remembers to ask for the switch. The flip itself waits for the owner.

---

## PA: Parent experience

### PA-01 Child switcher everywhere
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: in a family account, one clear child switcher in the portal header that filters lessons, progress, packages and
  booking to that child; "All children" view on home. Persist the choice.

### PA-02 Add another child after onboarding
- Priority P1 · Zone 🔴 (account data + age rules) · Size M · Status todo
- Do: confirm a guardian can add a child later from the profile (age 6–17, `src/lib/ageRules.ts`, server enforced),
  choose subject, level and teacher like onboarding. If it exists, make it obvious from the home page.

### PA-03 Family calendar
- Priority P2 · Zone 🟢 · Size M · Status todo
- Do: one week/month view of all children's lessons, colour per child, in the parent's time zone, with join buttons on
  the day. Plus "Add to my calendar" (`.ics` download per lesson and a per-family feed link with a secret token).

### PA-04 Family savings made visible
- Priority P3 · Zone 🟢 · Size S · Status todo
- Do: where packages are bought for a second child, show the 5% family care saving as a line ("Family care: −$X"),
  using the server's computed numbers only.

### PA-05 Parent onboarding tour
- Priority P2 · Zone 🟢 · Size S · Status todo
- Do: first visit of a guardian: a short 4-step tour (children, booking, progress, chat with the team). Skippable,
  shown once, replayable from the help menu.

---

## ST: Student experience

### ST-01 Lesson-day experience
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: on lesson day the home page leads with one card: countdown, teacher, subject, "Join" button active from
  10 minutes before (Zoom blue `.btn-zoom`), what to prepare (from last lesson's next steps), and a "running late"
  WhatsApp prefill to the team.

### ST-02 Post-lesson moment
- Priority P2 · Zone 🟢 (additive) · Size M · Status todo
- Do: after the lesson ends, a one-tap rating (how was it) and optional comment, stored for the admin (new table
  `lesson_feedback`, admin-only read; teacher sees only an average after 5 ratings). Then show the family summary
  when the teacher writes it.

### ST-03 Booking flow polish
- Priority P1 · Zone 🟢 (UI only, no rule changes) · Size M · Status todo
- Files: `src/student/pages/StudentBookingPage.tsx` (1,082 lines).
- Do: audit with `impeccable` and `break-ui`: step clarity, time-zone labels on every time, slow network states,
  double-tap protection on submit, back button keeps the draft, errors in plain words. Do not change any booking rule
  (red zone); only presentation.

### ST-04 Empty, loading and error states across the portal
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: every portal page gets a designed loading skeleton, an empty state with one next action, and an error state with
  retry. Use `src/components/EmptyState.tsx`.

### ST-05 Profile page split
- Priority P2 · Zone 🟢 · Size M · Status todo
- Files: `src/student/pages/StudentProfilePage.tsx` (1,061 lines).
- Do: split into sections or tabs (account, learners, language and notifications, privacy) with no behaviour change.
  Tests still pass.

### ST-06 Self-service privacy requests
- Priority P2 · Zone 🔴 (personal data) · Size M · Status todo
- Do: "Download my data" (JSON of the account's own data) and "Delete my account" request (creates a request for the
  admin, emails privacy@, explains "within one month" per the privacy policy). No automatic hard delete.

### ST-07 Install as an app (PWA basics)
- Priority P3 · Zone 🟢 · Size S · Status todo
- Do: `public/site.webmanifest` exists; complete it (name, short name, theme colours, maskable icons, start URL
  `/student`) and add an install hint on mobile. No service worker caching of API responses.

---

## TE: Teacher experience

### TE-01 Today page as a cockpit
- Priority P1 · Zone 🟢 · Size M · Status todo
- Files: `src/dashboard/pages/TodayPage.tsx`.
- Do: the next lesson leads (student, age, subject, level, last family summary and next steps, "Start as host"), then
  the rest of today, then notes still missing from past lessons (feeds PR-06).

### TE-02 Student card for teachers
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: in the teacher's student view: goals from onboarding, placement result, milestones, last 5 lessons, chat shortcut.
  No money anywhere (test that payment fields are absent for a teacher token).

### TE-03 Weekly hours editor polish
- Priority P2 · Zone 🟢 · Size M · Status todo
- Files: `src/dashboard/pages/AvailabilityPage.tsx`.
- Do: drag to paint hours on a week grid, copy a day to other days, preview in the student's time zone ("a student in
  London sees 4–6 pm"). Same data shape; the availability engine is not touched.

### TE-04 Teacher onboarding checklist
- Priority P1 · Zone 🟢 · Size S · Status todo
- Do: a first-week checklist on the dashboard: accept agreement, set hours, connect Google Calendar, add photo and bio,
  test Zoom host link. Each item links to where it is done and ticks itself from real data.

### TE-05 Jalila drafts the family summary
- Priority P3 · Zone 🟢 · Size M · Status todo · Depends on PR-06
- Do: a "Draft with Jalila" button that turns the teacher's private notes into a warm family summary in the family's
  language. The teacher edits and saves; nothing is sent automatically. Send Gemini the first name only (privacy rule).

---

## AD: Super admin (beyond the CRM)

### AD-01 Admin overview that answers "what needs me today"
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on CRM-04, OPS-02
- Files: `src/dashboard/pages/OverviewPage.tsx`.
- Do: lead with action items: follow-ups due, pay-later requests, refund requests, placement results to review, unread
  chats, system health warnings, lessons in the next 24 h without a Zoom link. Then the numbers.

### AD-02 Bulk actions on bookings
- Priority P3 · Zone 🔴 · Size M · Status todo
- Do: select several lessons → move to another teacher or cancel with a reason (reuses the existing single-lesson
  server paths and their notifications; no new rules).

### AD-03 Chat inbox for the admin
- Priority P2 · Zone 🟢 · Size M · Status todo
- Do: one inbox across all conversations: unread first, filter by teacher/family, quick replies (saved snippets in
  both languages), jump to the family timeline (CRM-01).

---

## PU: Public site

### PU-01 Progress showcase section
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on PR-03
- Do: a homepage / how-it-works section that shows the progress path and monthly report with sample data clearly
  labelled as an example (no fake names or fake results presented as real).

### PU-02 Conversion audit of the trial path
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: run `cro` + `signup` on home → get started → sign-up → onboarding → trial booked. Fix friction (copy, order,
  number of fields, mobile tap targets). Record before/after screenshots in the log.

### PU-03 FAQ and trust content for Western parents
- Priority P2 · Zone 🟢 · Size S · Status todo
- Do: add answers families ask (safeguarding and who is in the lesson, female teacher for daughters, time zones, what
  happens if a lesson is missed, how progress is shared). Facts must match RULES.md; Arabic 50/50 style per §6.

### PU-04 Performance pass on public pages
- Priority P2 · Zone 🟢 · Size M · Status todo
- Do: measure LCP/CLS/INP on home, pricing, about at mobile; lazy-load below-the-fold images and the welcome audio,
  check font loading, remove unused CSS/JS. Report numbers before and after.

---

## QA: Quality, tests, accessibility, SEO

### QA-01 End-to-end smoke tests for the money paths (local only)
- Priority P1 · Zone 🟢 · Size L · Status todo
- Do: automated browser tests against the local dev server with dev auth for: sign-up/onboarding (adult and family),
  free trial booking, paid booking reaching Stripe Checkout (stop there; Stripe test mode only if configured locally),
  package page, cancel and reschedule windows, teacher move with reason, admin refund button visibility. Never against
  production.
- Skills: `webapp-testing`, `test-guard`.

### QA-02 Accessibility audit
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: keyboard-only pass on booking, onboarding, portal and dashboard; focus rings visible; labels on inputs; contrast
  in both themes; `aria-live` for toasts; modals trap focus (`src/components/FocusTrap.tsx`). Fix what fails.

### QA-03 RTL and bilingual sweep
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: grep for `left`/`right`, `ml-`/`mr-`/`pl-`/`pr-` in `src/` and replace with logical classes; find hard-coded
  English or Arabic strings that skip the language system; icons that point the wrong way in RTL.

### QA-04 Mobile break test
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: run `break-ui` and `mobile-native` on every portal and dashboard page at 360/375/414 px: overflow, tap targets
  under 44px, sticky elements covering buttons, keyboard covering inputs.

### QA-05 SEO and hreflang check
- Priority P2 · Zone 🟢 · Size M · Status todo
- Do: titles, descriptions, canonical, hreflang ar/en, Organization and Course structured data, sitemap and robots, OG
  images for each public page; prerendered content present (`scripts/prerender-seo.ts`).
- Skills: `seo`, `seo-hreflang`, `seo-schema`, `seo-technical`.

### QA-06 Repo cleanup of root one-off files
- Priority P3 · Zone 🟢 · Size S · Status todo
- Do: the root has old scratch and report files (`diff.txt`, `temp_css.txt`, `scratch_handoff*.txt`, `test-*.js`,
  `test_regex.cjs`, `test_tailwind.html`, `avail.json`, `pr_body.md`, old `Task_*` and `FINAL_REPORT.md` reports).
  Check each is unused (grep imports and package scripts), then move the unused ones to `../watazawwado-archive/`
  outside the repo (do not delete). List what moved in the log.

### QA-07 Split `api/index.ts` safely (prep only)
- Priority P3 · Zone 🔴 · Size L · Status todo
- Do: propose (in `docs/argon/api-split-plan.md`) how to move route groups out of `api/index.ts` into
  `server/routes/*` with zero behaviour change, and move one low-risk group as a pilot on a branch with all tests
  green. Claude reviews before more moves.

---

## Owner decisions needed (agents: do not start these)

- Referral or "invite a family" reward: amount and rules are a pricing decision (RULES.md §4).
- Reviews and testimonials collection on the public site: consent wording and where they appear.
- Switching `PLACEMENT_BEFORE_BOOKING` back to `false`.
- Any change to prices, packages, cancellation windows or trial rules.
