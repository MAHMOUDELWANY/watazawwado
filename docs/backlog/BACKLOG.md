# Pre-launch backlog

Approved by the owner on 2026-10-19 (`/plan-ceo-review`, selective expansion). Claude does every task from 2026-10-20
(the Antigravity agents are no longer used). The four big additions are the learner progress experience (PR), the
retention engine (RN), the admin CRM (CRM) and launch operations (OPS); the other lanes polish what exists for each role.
Binding rules: `RULES.md` and `CLAUDE.md`. Progress log: `docs/backlog/LOG.md`.

## Order of work

1. All P1 tasks, top-down (OPS first: small and launch-critical; then RN, CRM, PA, ST, TE, AD, PU, QA).
2. PR-04 (design approved, `docs/superpowers/specs/2026-10-20-milestone-celebration-design.md`): implementation plan,
   then build.
3. The remaining P2 tasks, then P3.

## How to read a task

- **ID**: lane + number. Lanes: `PR` progress, `RN` retention, `CRM` admin CRM, `OPS` launch ops, `PA` parent,
  `ST` student, `TE` teacher, `AD` super admin, `PU` public site, `QA` quality (tests, accessibility, SEO, performance).
- **Priority**: `P1` before launch, `P2` launch week, `P3` when P1/P2 in your lane are done.
- **Zone**: 🟢 green → `main` after tsc, tests and build; 🔴 red (money, booking rules, auth, RLS, RPCs, legal) →
  extra care: full test run plus a `/code-review` before it reaches `main`.
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
- **Progress is personal by default.** Children's data is private (RULES.md, terms "Children & safeguarding"). The owner
  approved (2026-10-20, PR-04 design) an opt-in social layer later: an effort-based class view and an academy Hall of
  Honor, only with explicit guardian or adult consent. Built as CM-01 to CM-03 (below); outside them, still no
  leaderboard and no comparing.
- **Real data only.** Every number comes from attended lessons, teacher notes, placement results or teacher-set
  milestones. No fake XP that means nothing; if we show points, they map to real things (lessons, verses, rules).
- **Motion with purpose** (`apple-design`, `animate`): a milestone unlock gets one short celebration; everything else is
  calm. Respect `prefers-reduced-motion`.
- **Islamic adab**: no music, no gambling-like mechanics (no loot boxes, spins or random rewards), praise words in our
  voice (for example "زادك الله"), no images of faces in badges.

---

## CM: Community layer (owner request 2026-10-29)

Plan: `docs/superpowers/plans/2026-10-29-community-honor.md` (design approved 2026-10-20).

### CM-01 Consent rules and data
- Priority P2 · Zone 🔴 (children's data) · Size M · Status done (PR #39)
- Do: `honor_entries` and `class_board_members` (service-role only); who decides (guardian for a child, the adult
  learner for themself, otherwise only the admin with a note); the name shown; status changes; withdraw any time.

### CM-02 Hall of Honor
- Priority P2 · Zone 🔴 · Size M · Status done (PR #39) · Depends on CM-01
- Do: admin puts a milestone forward, the family decides on `/student/community` (or the admin records a consent given
  on WhatsApp). Closed community (owner 2026-10-29): the hall is only inside the accounts; the public `/community` page
  describes it with no names. Post text to copy into our families' groups by hand.

### CM-03 Class board
- Priority P2 · Zone 🔴 · Size M · Status done (PR #39) · Depends on CM-01
- Do: opt-in per learner; same teacher, same age group (teens and adults also same gender); reciprocal; shown from 3
  members; ordered by lessons this month then weekly rhythm, no rank numbers. Teacher page `/dashboard/class-board`.

### CM-04 Later
- Priority P3 · Status done (2026-11-02, see LOG)
- Photos (with a second consent and storage), family achievements, Tier 1 suggestions from lesson counts and rhythm.

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
- Priority P1 · Zone 🟢 · Size L · Status done (dc58c80) · Depends on PR-02
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
- Priority P2 · Zone 🟢 · Size M · Status done · Depends on PR-03
- Design: `docs/superpowers/specs/2026-10-20-milestone-celebration-design.md`. This task builds only the celebration and
  the shelf; the leaderboard, Hall of Honor, consent flow and parent email in that design are separate later tasks.
- Do: when the page loads and a milestone is new since the last visit (localStorage per learner), play one short
  celebration (emblem rises, gold light, praise word fitted to age group and Islamic season), then it settles on an
  achievements shelf. Shelf shows earned emblems in colour and the next reachable ones in outline with what earns them.
  Design 8–12 emblems in our own SVG. No sound.
- Done when: plays once only, can be dismissed, static reveal with reduced motion, Kids / Teens / Adults variants,
  seasonal wording, screenshots in both languages and themes.

### PR-05 Lesson timeline with family summaries
- Priority P2 · Zone 🟢 · Size M · Status done · Depends on PR-02
- Do: below the path, a timeline of attended lessons: date in the viewer's time zone, teacher, subject, the family
  summary and achievements, homework/next steps if shared. Paginate (20 per page).

### PR-06 Teacher side: record the family summary and milestones after a lesson
- Priority P1 · Zone 🟢 · Size M · Status done (87ade22) · Depends on PR-01
- Files: `src/dashboard/pages/TodayPage.tsx` / `StudentDetailPage.tsx`, the lesson notes editor.
- Do: after a lesson, the teacher sees one quick form: private notes (unchanged, labelled "only you and the admin"),
  "for the family" summary, quick-pick achievements for the subject (for Memorization: surah + ayah range; Tajweed: rule;
  Reading: stage/page), and "mark a milestone". Make it fast: under 30 seconds for a typical lesson. Jalila may later
  draft the summary; not in this task.
- Done when: a teacher can only write for their own students' lessons (server check + test).

### PR-07 Progress for parents: all children at a glance
- Priority P1 · Zone 🟢 · Size M · Status done (8eb5c72) · Depends on PR-03
- Do: for a guardian account, the progress page opens on a family view: one card per child (name, subject, current
  level, rhythm, next lesson, newest milestone) → tap opens that child's path. Remember the last opened child.

### PR-08 Monthly progress report page (printable)
- Priority P2 · Zone 🟢 · Size M · Status done · Depends on PR-02
- Do: `/student/progress/report?month=YYYY-MM&learnerId=`: a branded one-page report per learner per month (lessons
  attended, milestones, teacher summaries condensed, level movement, a short note from the teacher if written). Print
  CSS for A4 and Letter. Label it clearly as a progress report, not a certificate (same rule as placement reports).

### PR-09 Monthly progress email to guardians and adult learners
- Priority P2 · Zone 🔴 (new scheduled send) · Size M · Status done · Depends on PR-08
- Do: on the 1st of each month (through the existing external cron with `CRON_SECRET`), email each active learner
  (guardian for children) a short summary + link to PR-08. One language per RULES.md §6 (user preference). Brevo free
  plan limit is 300 emails/day: batch and resume safely; never send twice for the same month (store a send record).
  Opt-out link in the footer and a preference in the profile.
- Done when: dry-run mode prints recipients without sending; idempotency test; templates in `server/notifications`.
- Skills: `emails`, `humanizer`.

### PR-10 Progress on the student home page
- Priority P2 · Zone 🟢 · Size S · Status done · Depends on PR-03
- Do: a compact progress card on `StudentHomePage.tsx` (rhythm, current level, newest milestone) linking to the page.

---

## RN: Retention engine (no pressure, RULES.md §4)

### RN-01 Package balance on every surface
- Priority P1 · Zone 🟢 · Size S · Status done
- Do: show remaining lessons per active package (band + length) on the student home page, booking page header and
  packages page in one consistent component. Copy is calm: "3 lessons left in your 8-lesson package".

### RN-02 Low-balance notice (on-site + email)
- Priority P1 · Zone 🔴 (new notification trigger) · Size M · Status done · Depends on RN-01
- Do: when a package reaches 2 lessons left (and again at 0), create one on-site notice and one email with a renew link.
  Never more than once per threshold per package. No urgency words, no countdowns.
- Done when: tests prove one notice per threshold and none for refunded/expired packages.

### RN-03 One-click renew the same package
- Priority P1 · Zone 🔴 (purchase flow) · Size M · Status done · Depends on RN-01
- Do: "Renew this package" opens the existing purchase flow pre-filled with the same band, length and size (the server
  still computes the price; terms and early-start checkboxes still required).

### RN-04 Weekly time suggestion ("same time next week")
- Priority P2 · Zone 🟢 · Size M · Status done
- Do: after a lesson, suggest booking the same weekday and time next week if the teacher is free (read availability from
  the existing engine, never bypass it). One tap opens the booking flow with that slot pre-selected. This is a
  suggestion, not a recurring booking (multi-lesson booking was removed on purpose; do not bring it back).

### RN-05 Trial → first paid lesson follow-up
- Priority P1 · Zone 🔴 (new scheduled send) · Size M · Status done
- Do: 24 hours after an attended free trial, send one warm email + on-site notice: what the teacher noted (family
  summary if any), the placement result if taken, and how to continue (single lesson or package). Once per learner.

### RN-06 Gentle "we miss you" for quiet learners
- Priority P3 · Zone 🔴 · Size M · Status done · Depends on RN-05
- Do: a learner with paid history and no booking for 21 days gets one friendly message from "our team" (and the admin
  gets a CRM follow-up task, CRM-04). Never more than once per 60 days.

### RN-07 Notification preferences
- Priority P2 · Zone 🟢 · Size S · Status done
- Do: in the profile, toggles for progress emails, renewal reminders and "we miss you" (transactional emails such as
  booking confirmations and reminders stay on). Respect them in RN-02, RN-05, RN-06, PR-09.

---

## CRM: Super admin CRM

### CRM-01 Family timeline
- Priority P1 · Zone 🟢 · Size L · Status done
- Files: `src/dashboard/pages/StudentDetailPage.tsx`, `LeadsPage.tsx`, read-only API.
- Do: one chronological timeline per account (and per child): sign-up, onboarding, intake/AI guide request, placement,
  trial booked/attended/missed, payments, packages, lessons, refunds, teacher changes, chat started, notes. Built from
  existing tables (`leads`, `bookings`, `payments`, `placement_tests`, `chat_threads`, `notification_events`, ...).
  Filters by type. Admin only.

### CRM-02 Pipeline board
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: a kanban view of the existing lead statuses (`server/leadTransitions.ts`: visitor → lead → contacted →
  trial_booked → trial_completed → potential_student → active_student → returning_student / lost). Drag only along
  allowed transitions (the server validates with `ALLOWED_LEAD_TRANSITIONS`). Counts per column, days in stage.

### CRM-03 Admin notes and tags per family
- Priority P1 · Zone 🟢 (additive) · Size M · Status done
- Do: new table `crm_notes` (account id, child id nullable, body, author, created_at) and `crm_tags` (account id, tag).
  Suggested tags: "sibling likely", "prefers female teacher", "time zone tricky", "pay-later trusted". Admin only (RLS).

### CRM-04 Follow-up tasks with due dates
- Priority P1 · Zone 🟢 (additive) · Size M · Status done · Depends on CRM-03
- Do: table `crm_tasks` (account, title, due_at, done_at, created_by, source [manual, trial_followup, quiet_learner,
  low_balance]). "My follow-ups" list on the admin overview: overdue, today, this week. One-tap WhatsApp prefill
  (greeting from the Watazawwado team) and "mark done". Auto-create a task after every attended trial.

### CRM-05 CSV export
- Priority P2 · Zone 🟢 · Size S · Status done
- Do: export the students list, leads and payments (admin only, server-generated, UTF-8 with BOM so Arabic opens in
  Excel). No private teacher notes, no secrets.

### CRM-06 Search everything
- Priority P2 · Zone 🟢 · Size M · Status done
- Do: one admin search box (Ctrl+K) across accounts, children, emails, booking references and payments; jump to the
  record.

### CRM-07 Funnel analytics that match reality
- Priority P2 · Zone 🟢 · Size M · Status done
- Files: `src/dashboard/pages/AnalyticsPage.tsx`.
- Do: sign-ups → onboarding done → trial booked → trial attended → first paid → second month, by week, with the real
  counts behind each step (click to list the people). Remove any number that cannot be traced to data.

### CRM-08 Teacher load and quality view
- Priority P3 · Zone 🟢 · Size M · Status done
- Do: per teacher: active students, lessons this week, hours offered vs booked, lessons moved by the teacher (with
  reasons), notes completion rate after lessons (PR-06). Admin only; teachers never see money.

---

## OPS: Launch operations (free tools only)

### OPS-01 Error monitoring
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: capture front-end errors (`ErrorBoundary.tsx`, `window.onerror`, unhandled rejections) and API 5xx into a new
  `app_errors` table through a small rate-limited endpoint (no third-party paid service; no personal data beyond the
  account id; strip query strings). Admin page lists them grouped by message with counts and last seen.
- Done when: a thrown test error appears in the list; the endpoint refuses floods (rate limit test).

### OPS-02 System health page
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: `/dashboard/health` (admin only): last successful Brevo send, failed `notification_events` in 24 h, pending
  `integration_jobs` and their age, Google Calendar connections that lost their token, Zoom link creation failures,
  Stripe webhook last received, cron last run. Green / amber / red per row with the fix in one sentence.

### OPS-03 Uptime and cron heartbeat
- Priority P1 · Zone 🟢 · Size S · Status done
- Do: a public `GET /api/health` (no secrets, no DB details) for a free uptime monitor, and record each reminder-cron
  run so OPS-02 can say "cron has not run for 2 hours". Write the owner's 5-minute setup steps for a free monitor
  (UptimeRobot or similar) in `docs/launch-runbook.md`.

### OPS-04 Launch-day runbook
- Priority P1 · Zone 🟢 · Size S · Status done
- Do: `docs/launch-runbook.md`: pre-launch checklist (placement test mode off, test accounts removed, emails
  pasted into Supabase, firewall rules on), how to roll back in Vercel, who to message when payments fail, the first
  24 h checks. English.

### OPS-05 Placement test mode switch reminder
- Priority P1 · Zone 🔴 (booking rule) · Size S · Status done
- Do: `PLACEMENT_BEFORE_BOOKING` is still `true` (temporary). Do not flip it. Add an admin banner on the health page
  showing its current value so the owner remembers to ask for the switch. The flip itself waits for the owner.

---

## PA: Parent experience

### PA-01 Child switcher everywhere
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: in a family account, one clear child switcher in the portal header that filters lessons, progress, packages and
  booking to that child; "All children" view on home. Persist the choice.

### PA-02 Add another child after onboarding
- Priority P1 · Zone 🔴 (account data + age rules) · Size M · Status done
- Do: confirm a guardian can add a child later from the profile (age 6–17, `src/lib/ageRules.ts`, server enforced),
  choose subject, level and teacher like onboarding. If it exists, make it obvious from the home page.

### PA-03 Family calendar
- Priority P2 · Zone 🟢 · Size M · Status done
- Do: one week/month view of all children's lessons, colour per child, in the parent's time zone, with join buttons on
  the day. Plus "Add to my calendar" (`.ics` download per lesson and a per-family feed link with a secret token).

### PA-04 Family savings made visible
- Priority P3 · Zone 🟢 · Size S · Status done
- Do: where packages are bought for a second child, show the 5% family care saving as a line ("Family care: −$X"),
  using the server's computed numbers only.

### PA-05 Parent onboarding tour
- Priority P2 · Zone 🟢 · Size S · Status done
- Do: first visit of a guardian: a short 4-step tour (children, booking, progress, chat with the team). Skippable,
  shown once, replayable from the help menu.

---

## ST: Student experience

### ST-01 Lesson-day experience
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: on lesson day the home page leads with one card: countdown, teacher, subject, "Join" button active from
  10 minutes before (Zoom blue `.btn-zoom`), what to prepare (from last lesson's next steps), and a "running late"
  WhatsApp prefill to the team.

### ST-02 Post-lesson moment
- Priority P2 · Zone 🟢 (additive) · Size M · Status done
- Do: after the lesson ends, a one-tap rating (how was it) and optional comment, stored for the admin (new table
  `lesson_feedback`, admin-only read; teacher sees only an average after 5 ratings). Then show the family summary
  when the teacher writes it.

### ST-03 Booking flow polish
- Priority P1 · Zone 🟢 (UI only, no rule changes) · Size M · Status done
- Files: `src/student/pages/StudentBookingPage.tsx` (1,082 lines).
- Do: audit with `impeccable` and `break-ui`: step clarity, time-zone labels on every time, slow network states,
  double-tap protection on submit, back button keeps the draft, errors in plain words. Do not change any booking rule
  (red zone); only presentation.

### ST-04 Empty, loading and error states across the portal
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: every portal page gets a designed loading skeleton, an empty state with one next action, and an error state with
  retry. Use `src/components/EmptyState.tsx`.

### ST-05 Profile page split
- Priority P2 · Zone 🟢 · Size M · Status done
- Files: `src/student/pages/StudentProfilePage.tsx` (1,061 lines).
- Do: split into sections or tabs (account, learners, language and notifications, privacy) with no behaviour change.
  Tests still pass.

### ST-06 Self-service privacy requests
- Priority P2 · Zone 🔴 (personal data) · Size M · Status done
- Do: "Download my data" (JSON of the account's own data) and "Delete my account" request (creates a request for the
  admin, emails privacy@, explains "within one month" per the privacy policy). No automatic hard delete.

### ST-07 Install as an app (PWA basics)
- Priority P3 · Zone 🟢 · Size S · Status done
- Do: `public/site.webmanifest` exists; complete it (name, short name, theme colours, maskable icons, start URL
  `/student`) and add an install hint on mobile. No service worker caching of API responses.

---

## TE: Teacher experience

### TE-01 Today page as a cockpit
- Priority P1 · Zone 🟢 · Size M · Status done
- Files: `src/dashboard/pages/TodayPage.tsx`.
- Do: the next lesson leads (student, age, subject, level, last family summary and next steps, "Start as host"), then
  the rest of today, then notes still missing from past lessons (feeds PR-06).

### TE-02 Student card for teachers
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: in the teacher's student view: goals from onboarding, placement result, milestones, last 5 lessons, chat shortcut.
  No money anywhere (test that payment fields are absent for a teacher token).

### TE-03 Weekly hours editor polish
- Priority P2 · Zone 🟢 · Size M · Status done
- Files: `src/dashboard/pages/AvailabilityPage.tsx`.
- Do: drag to paint hours on a week grid, copy a day to other days, preview in the student's time zone ("a student in
  London sees 4–6 pm"). Same data shape; the availability engine is not touched.

### TE-04 Teacher onboarding checklist
- Priority P1 · Zone 🟢 · Size S · Status done
- Do: a first-week checklist on the dashboard: accept agreement, set hours, connect Google Calendar, add photo and bio,
  test Zoom host link. Each item links to where it is done and ticks itself from real data.

### TE-05 Jalila drafts the family summary
- Priority P3 · Zone 🟢 · Size M · Status done · Depends on PR-06
- Do: a "Draft with Jalila" button that turns the teacher's private notes into a warm family summary in the family's
  language. The teacher edits and saves; nothing is sent automatically. Send Gemini the first name only (privacy rule).

---

## TU: Teacher onboarding and University (owner request 2026-11-17)

Content plan and progress: `docs/teacher-university/PLAN.md`. Builds on NX-15 (subject licences) and TE-04 (checklist).
Order: TU-01, TU-02, TU-08, TU-03 first (the entry path), then TU-04, TU-05, then TU-06, TU-07, and TU-09 (design) last. Content must be reviewed first
(RULES.md: curriculum content waits for the owner). Do not build the course UI before the first unit of a curriculum
is finished and the owner says "build".

### TU-01 Invite a teacher with their subject(s)
- Priority P1 · Zone 🔴 (auth, invites) · Size M · Status todo
- Do: in the super admin invite form, choose one or more subjects (the 8 subject ids from NX-15) at the moment of the
  invite; stored with the invite and applied when the teacher accepts. The admin can add or remove subjects later.
  A teacher teaches only licensed subjects. Test: the invite carries the subjects; an unlicensed subject is refused
  by the server.

### TU-02 First sign-in path: password, agreement, profile (mandatory), tour
- Priority P1 · Zone 🔴 (auth, legal) · Size L · Status todo · Depends on TU-01
- Do: the order after the invite link: set a password, read and accept the agreement, then a **mandatory profile
  step that cannot be skipped**: name, assigned subject(s) shown and locked, short bio, experience, photo, what is
  shown publicly (decide fields below). Then the guided tour of the teacher dashboard, then the home page with the
  setup checklist. The profile does not go public until the admin approves it.
- Decided (owner, 2026-11-17): no bookings and no public profile until the teacher finishes the whole path (course,
  test, and any stage that needs staff). When the last stage needs no staff, the teacher opens automatically
  (profile public, bookings on). Stages that need staff are part of the visible progress.
- Decided: extra fields are languages spoken and qualifications or ijazah (optional). No intro video for now (idea
  kept for later: it would favour teachers who are good on camera). Photo is mandatory with written standards shown
  at upload: clear, good light, face visible, not AI, current (looks like the teacher today, so a child is not
  surprised on the first lesson).
- Experience and every other field is free text in the teacher's own words. No fixed headings on the public page (see TU-08).

### TU-03 Setup checklist on the teacher home: add "your subject course"
- Priority P1 · Zone 🟢 · Size S · Status todo · Depends on TU-02 (extends TE-04)
- Do: the checklist shows the first thing to do: start the course of the assigned subject, with progress; items tick
  from real data. Locked subjects are not shown here.

### TU-04 University: one mandatory course per subject group
- Priority P1 · Zone 🟢 · Size L · Status todo · Depends on TU-03 and the content
- Do: three groups: Quran, Islamic sciences, Languages. A teacher sees the course of each group they are licensed
  for (mandatory) and the others as locked. Each course is one connected course: the teaching-craft modules applied
  to our curriculum, with each subject's own section (hifz, tajweed, Zad, Seerah, age bands, Fusha, Egyptian,
  English). Progress per module; the existing NX-15 steps stay (curriculum, guide, test, observed lesson). A new
  course unlocks only after the subject is added or approved.
- Content: `docs/teacher-university/` (shared text plus an application layer per group).

### TU-05 Request a new subject and the qualification path
- Priority P2 · Zone 🔴 (permissions) · Size L · Status todo · Depends on TU-04
- Do: a locked subject shows "Request this subject". The request reaches the admin. The path is professional:
  entry check, the subject's course, a test on that course (unit questions plus a short final, 80% pass, see TU-06; scenario questions from our
  curriculum), an interview, a mock lesson observed by the admin, then approval. The teacher sees progress through
  each stage; the admin records result and a note at each stage. Approval grants the subject and opens its course.
- Decided (owner, 2026-11-17): interviews, mock lessons and approvals are done by the new staff roles (HR and
  Supervision, see lane ST), not only the super admin. Super admin can do everything they can.

### TU-06 Course test per subject group
- Priority P2 · Zone 🔴 (grants a licence) · Size M · Status todo · Depends on TU-04
- Decided (owner, 2026-11-17): not one big test at the end. The course is units (stages) like Preply, with visible
  progress. Each unit ends with questions that come straight from that unit's points. The final test is short, with
  indirect questions that test understanding and emotional intelligence (how the teacher would react), not recall.
  Free-text answers are marked by AI: "good" or notes on how to improve. All answers and feedback are stored and the
  teacher can reopen them any time. Pass mark 80%.
- Do: question bank per unit plus a short final scenario set, per group, drawn from the course. Server-side marking
  and storage; the score cannot be set from the browser; retakes allowed with a record. A pass records
  `test_passed_at` on the existing track row. AI marking must not change the pass rule silently: store the rubric
  and the model output with each answer.

### TU-07 Self-observation and reflection tools inside the course
- Priority P3 · Zone 🟢 · Size M · Status todo · Depends on TU-04
- Do: the self-observation form (teacher talking time), the lesson plan template and the reflection page as
  fill-in tools inside the course; the teacher's recorded-lesson consent line included. Private to the teacher.

### TU-08 Teacher profile: review before publishing, and a public page that shows only what exists
- Priority P1 · Zone 🔴 (public content, review gate) · Size M · Status todo · Depends on TU-02
- Do: (1) a profile is never published on submit: it goes to review (HR, or super admin), is approved or returned with a
  note ("remove this, add that"), and an edit by the teacher after approval goes back to review. (2) While writing, the
  teacher sees short tips next to each field (what families look for, length, tone), to reduce review rounds.
  (3) The public page is built from what the teacher filled: a section (ijazah, languages, qualifications...) appears
  only if it has content, no empty headings. The teacher's own words lead; the system picks what to highlight per
  teacher (their subjects, what they are strong in) instead of a fixed template.
- Design note: fields are optional data, sections are optional render blocks; the card on the teachers list uses
  the same rule.

### TU-09 Design pass for the teacher entry path, the course and the public profile
- Priority P2 · Zone 🟢 · Size L · Status todo · Last, after the backend items (backlog order: backend first, design last)
- Do: design (do not just build) these screens: the course player (cards, progress, motion tied to meaning, mobile
  first), the first sign-in steps (agreement, mandatory profile with tips, photo standards, tour, home checklist), the
  subject-request progress view, and the public teacher page built only from filled fields. Use `brainstorming`, then
  `impeccable`, `apple-design` and the motion skills; site tokens only, no green, check desktop and phone.
  Videos and motion graphics stay last and voiced (Zad in each piece).

---

## ST: Staff roles: HR and Supervision (owner request 2026-11-17)

Why: the super admin area (CRM, teachers, customers, courses, finance) is too big for one screen and one person.
The owner will work as super admin, and also sign in as HR or Supervision to see only that domain, so it does not
scatter attention; later staff can run these accounts.

### ST-01 Two restricted staff roles with permission sets
- Priority P2 · Zone 🔴 (new roles, RLS, auth) · Size L · Status todo
- Do: add roles `hr` and `supervision` (migration via `new-migration`, server checks in `verifyAdminAuth` style, RLS).
  Permissions are a named set per role, not hard-coded screens. Suggested split:
  - **HR:** teacher invites, onboarding progress, profile review, interviews, mock lessons, subject requests, contracts.
  - **Supervision:** lesson quality, observed lessons, course test review, complaints and refunds, teacher follow-up.
  - **Both restricted from:** revenue, profit, payouts, pricing, site-wide numbers and reports, other staff, settings.
  - Super admin has every permission. The owner can change a role's set without a code change if feasible (decide in design).
- Test: a restricted account gets 403 from the server on a forbidden route, not only a hidden button.

### ST-02 Reorganize the admin area by domain
- Priority P2 · Zone 🟢 · Size L · Status todo · Depends on ST-01 design
- Do: the super admin dashboard grouped by domain (People: teachers, students, parents; Teaching: lessons,
  courses, University; Money: payments, packages, reports; Growth: CRM, marketing), with links between related items
  (a teacher's page shows their lessons, their course progress and their reviews). Each role sees only its domains.
  Start with a design pass (impeccable, brainstorming) before building; the owner decides the grouping.

---

## HR: Human resources (owner request 2026-11-20)

HR owns the teacher from application to leaving: hiring, onboarding, the file, leave, periodic review, ending.
Lesson quality belongs to Supervision; money belongs to Finance (HR never sees it, ST-01). The basics are the TU lane
and ST-01; this lane adds what they lack.

**No duplication (owner 2026-11-20):** the code was not checked when this lane was written. Each task starts by
searching for what already exists (teacher invites, the agreement and its versions, `server/routes/lessonTeacherMove.ts`,
subject licences NX-15, the checklist TE-04, the retention numbers of MK-02) and extends it instead of building a second one.

Order: TU-01 → TU-02 → TU-08 → TU-03 (entry path), then ST-01 with HR-01, then HR-03 with HR-02 (and TU-05), then
HR-04, HR-05, HR-06, HR-07, HR-08.

### HR-01 Teacher file
- Priority P2 · Zone 🔴 (personal data, RLS) · Size M · Status todo · Depends on ST-01
- Do: one page per teacher for HR and super admin: agreement versions accepted and when, ijazah and certificates
  (optional uploads), child-safeguarding declaration (mandatory, owner 2026-11-20), licensed subjects, key dates, HR
  notes. No identity document is collected (owner 2026-11-20). Private bucket, never public.

### HR-02 Scorecards for the interview and the mock lesson
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on ST-01 · Built with TU-05
- Do: one fixed set of criteria per stage (1–5 each plus a note), the same for every candidate; the result and who
  scored it are stored on the candidate or subject request.

### HR-03 Public "Teach with us" form and the applicant pipeline
- Priority P2 · Zone 🔴 (public form, personal data) · Size L · Status todo · Depends on ST-01
- Owner 2026-11-20: built with the rest, not postponed.
- Do: a public form in both languages (name, contact, country, subjects, experience in the applicant's own words,
  optional certificate upload, consent to keep the data). Stages in the admin: applied → screening → interview →
  mock lesson → offer → invited; a rejected applicant gets a kind email. "Invited" uses the existing invite of TU-01
  with the subjects filled in. Rate limit and a honeypot field; applications are deleted after a set period if not hired.

### HR-04 Probation period
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on TU-02 and the classroom ratings
- Proposed, waiting for the owner: the first 10 lessons or 30 days, whichever ends later.
- Do: a new teacher is marked "on probation": their lessons are listed first for Supervision, and the teacher sees
  nothing different. At the end HR records one decision with a note: confirm, extend once, or end.

### HR-05 Leave and substitute
- Priority P2 · Zone 🔴 (bookings) · Size L · Status todo
- Owner 2026-11-20: planned leave is requested at least 15 days ahead; an emergency is allowed and recorded with a reason.
- Do: the teacher requests dates; HR approves or refuses; for each booked lesson in the range HR picks a substitute
  (reusing the existing teacher move) or the family is asked to reschedule, with an email. Availability is closed for
  the approved dates.

### HR-06 Quarterly review and the warning ladder
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on the classroom ratings and MK-02
- Do: per teacher and quarter, numbers pulled automatically (ratings, punctuality, lessons given, learners kept) and
  a written review by HR that the teacher can read. Ladder, each step recorded with a date and reason: note → written
  warning → pause (no new bookings) → end.

### HR-07 Ending a teacher's work
- Priority P3 · Zone 🔴 (auth, bookings) · Size M · Status todo · Depends on HR-05
- Do: a checklist that cannot be closed half-done: learners moved or informed, future lessons handled, public profile
  hidden, access closed, last pay marked for Finance, reason for leaving recorded.

### HR-08 Capacity report
- Priority P3 · Zone 🟢 · Size S · Status todo
- Do: hours offered against hours booked per subject, teacher gender and time zone band, so we know when to hire.

---

## AD: Super admin (beyond the CRM)

### AD-01 Admin overview that answers "what needs me today"
- Priority P1 · Zone 🟢 · Size M · Status done · Depends on CRM-04, OPS-02
- Files: `src/dashboard/pages/OverviewPage.tsx`.
- Do: lead with action items: follow-ups due, pay-later requests, refund requests, placement results to review, unread
  chats, system health warnings, lessons in the next 24 h without a Zoom link. Then the numbers.

### AD-02 Bulk actions on bookings
- Priority P3 · Zone 🔴 · Size M · Status done (cancel + move to another teacher, AD-02b)
- Do: select several lessons → move to another teacher or cancel with a reason (reuses the existing single-lesson
  server paths and their notifications; no new rules).

### AD-03 Chat inbox for the admin
- Priority P2 · Zone 🟢 · Size M · Status done
- Do: one inbox across all conversations: unread first, filter by teacher/family, quick replies (saved snippets in
  both languages), jump to the family timeline (CRM-01).

---

## PU: Public site

### PU-01 Progress showcase section
- Priority P2 · Zone 🟢 · Size M · Status done · Depends on PR-03
- Do: a homepage / how-it-works section that shows the progress path and monthly report with sample data clearly
  labelled as an example (no fake names or fake results presented as real).

### PU-02 Conversion audit of the trial path
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: run `cro` + `signup` on home → get started → sign-up → onboarding → trial booked. Fix friction (copy, order,
  number of fields, mobile tap targets). Record before/after screenshots in the log.

### PU-03 FAQ and trust content for Western parents
- Priority P2 · Zone 🟢 · Size S · Status done
- Do: add answers families ask (safeguarding and who is in the lesson, female teacher for daughters, time zones, what
  happens if a lesson is missed, how progress is shared). Facts must match RULES.md; Arabic 50/50 style per §6.

### PU-04 Performance pass on public pages
- Priority P2 · Zone 🟢 · Size M · Status done
- Do: measure LCP/CLS/INP on home, pricing, about at mobile; lazy-load below-the-fold images and the welcome audio,
  check font loading, remove unused CSS/JS. Report numbers before and after.

---

## QA: Quality, tests, accessibility, SEO

### QA-01 End-to-end smoke tests for the money paths (local only)
- Priority P1 · Zone 🟢 · Size L · Status done
- Do: automated browser tests against the local dev server with dev auth for: sign-up/onboarding (adult and family),
  free trial booking, paid booking reaching Stripe Checkout (stop there; Stripe test mode only if configured locally),
  package page, cancel and reschedule windows, teacher move with reason, admin refund button visibility. Never against
  production.
- Skills: `webapp-testing`, `test-guard`.

### QA-02 Accessibility audit
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: keyboard-only pass on booking, onboarding, portal and dashboard; focus rings visible; labels on inputs; contrast
  in both themes; `aria-live` for toasts; modals trap focus (`src/components/FocusTrap.tsx`). Fix what fails.

### QA-03 RTL and bilingual sweep
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: grep for `left`/`right`, `ml-`/`mr-`/`pl-`/`pr-` in `src/` and replace with logical classes; find hard-coded
  English or Arabic strings that skip the language system; icons that point the wrong way in RTL.

### QA-04 Mobile break test
- Priority P1 · Zone 🟢 · Size M · Status done
- Do: run `break-ui` and `mobile-native` on every portal and dashboard page at 360/375/414 px: overflow, tap targets
  under 44px, sticky elements covering buttons, keyboard covering inputs.

### QA-05 SEO and hreflang check
- Priority P2 · Zone 🟢 · Size M · Status done
- Do: titles, descriptions, canonical, hreflang ar/en, Organization and Course structured data, sitemap and robots, OG
  images for each public page; prerendered content present (`scripts/prerender-seo.ts`).
- Skills: `seo`, `seo-hreflang`, `seo-schema`, `seo-technical`.

### QA-05b English URLs with hreflang
- Priority P2 · Zone 🟢 · Size M · Status done
- Do: every public page also at `/en/...` (Arabic stays at the plain paths, x-default = Arabic), self canonical,
  ar/en/x-default hreflang in the page and the sitemap, the language toggle switches between matching URLs; no
  forced browser-language redirect; portal and dashboard untouched.

### QA-06 Repo cleanup of root one-off files
- Priority P3 · Zone 🟢 · Size S · Status done
- Do: the root has old scratch and report files (`diff.txt`, `temp_css.txt`, `scratch_handoff*.txt`, `test-*.js`,
  `test_regex.cjs`, `test_tailwind.html`, `avail.json`, `pr_body.md`, old `Task_*` and `FINAL_REPORT.md` reports).
  Check each is unused (grep imports and package scripts), then move the unused ones to `../watazawwado-archive/`
  outside the repo (do not delete). List what moved in the log.

### QA-07 Split `api/index.ts` safely (prep only)
- Priority P3 · Zone 🔴 · Size L · Status done (pilot merged; next moves follow docs/api-split-plan.md)
- Do: propose (in `docs/api-split-plan.md`) how to move route groups out of `api/index.ts` into
  `server/routes/*` with zero behaviour change, and move one low-risk group as a pilot on a branch with all tests
  green. Review the pilot before more moves.

---

## NX: Next level (owner request 2026-11-01)

Ideas approved by the owner on 2026-11-01 as strong. **Not started:** the owner picks one last development before
launch after a discussion; the rest come after launch, top-down. Every task still follows "How to read a task" and the
shared design direction (weekly rhythm, real data, no guilt, Islamic adab).

### NX-01 Daily review between lessons (spaced repetition)
- Priority P2 · Zone 🟢 · Size L · Status done for memorized ayat (Fusha words and Tajweed rules wait for approved curriculum)
- Do: a 5-minute "today's review" built from what the teacher really covered: memorized ayat, Fusha words, Tajweed
  rules. Spaced-repetition scheduling per learner; cards come from approved curriculum content. Already listed in
  `docs/curriculum/HANDOFF-2026-10-26.md` (site work). No daily streak; it feeds the weekly rhythm only.

### NX-02 Homework set by the teacher after each lesson
- Priority P1 (owner's pick before launch, 2026-11-01) · Zone 🟢 · Size M · Status done · Pairs with NX-01
- Design: `docs/superpowers/specs/2026-11-01-homework-design.md`.
- Do: the teacher adds short tasks in the lesson window ("recite these ayat", "read this page"); the learner ticks them
  off; guardians see them; the next lesson window shows what was done.

### NX-03 Recitation recordings with teacher feedback
- Priority P2 · Zone 🟢 · Size L · Status done (written replies; owner 2026-11-02: kept 30 days, privacy policy line added)
- Do: the learner records a recitation on the phone; the assigned teacher replies with a voice or text note before the
  next lesson. Private storage, only the learner, guardian, teacher and super admin can play it; retention period and
  privacy policy line needed (children's audio).

### NX-04 Certificates and an ijazah path
- Priority P2 · Zone 🟢 · Size M · Status done for certificates; the ijazah path page waits for the owner (who may issue an ijazah)
- Do: a branded printable certificate when a teacher-set milestone is reached (juz, level, book), with a verify link.
  A clear ijazah-with-sanad path page for the subjects where it applies. Who may issue an ijazah is an owner decision.

### NX-05 Real reviews from families
- Priority P2 · Zone 🟢 · Size M · Status done (owner decided 2026-11-01: one-time review links, portal reviews, screenshots with consent; the admin publishes)
- Do: a short rating after lessons; after a few lessons ask for a public review with consent. No children's photos.

### NX-06 Gift lessons
- Priority P2 · Zone 🔴 (money) · Size M · Status done (seasonal, owner 2026-11-01)
- Do: buy a package as a gift (Eid, Ramadan, a relative); the receiver redeems it into their wallet.

### NX-07 Sponsor a learner (sadaqah)
- Priority P3 · Zone 🔴 (money) · Size M · Status done (2026-11-02, see LOG)
- Do: a family pays lessons for a learner who cannot; who qualifies and how it is shown are owner decisions.

### NX-08 Seasonal programs
- Priority P2 · Zone 🟢 · Size M · Status done
- Do: dated programs (Ramadan challenge, summer revision, a shared khatma) with a start, an end and a sign-up.

### NX-09 Push notifications
- Priority P3 · Zone 🟢 · Size M · Status done (VAPID keys set on Vercel 2026-11-02)
- Do: web push for lesson reminders and today's review, opt-in, respecting notification preferences (RN-07).

### NX-10 Weekly digest for guardians
- Priority P3 · Zone 🟢 · Size S · Status done by email (owner 2026-11-01: "بالإيميل ببلاش"; WhatsApp would need the paid Business API)
- Do: one weekly message: lessons attended, the teacher's summary, the homework.

### NX-11 Blog and articles for search
- Priority P2 · Zone 🟢 · Size M · Status done (3 articles; more are added in `src/data/articles.ts`)
- Do: bilingual articles for Western Muslim families (teaching Quran abroad, Fusha for kids, ...), with hreflang and
  schema; written through `watazawwado-content` and `humanizer`.

### NX-12 Lesson room inside the site
- Priority P3 · Zone 🟢 · Size L · Status done (slides, pen, highlighter and laser in sync)
- Do: the teacher and learner see the same curriculum slides in sync during the lesson, with simple annotation; video
  stays on Zoom at first.

### NX-13 Teacher summary compliance
- Priority P2 · Zone 🟢 · Size S · Status done
- Do: remind teachers who have not written a family summary; show the on-time rate (already on "My month") to the
  admin per teacher, so the progress pages never stay empty.

### NX-14 Design review of the public site and the portal
- Priority P2 · Zone 🟢 · Size M · Status todo
- Do: page by page with `impeccable`, phone and dark mode, to bring the site and portal up to the curriculum's level
  (motion, motifs, feel). Screenshots before and after.

### NX-15 Watazawwado University: teacher subject licences and growth
- Priority P2 · Zone 🟢 · Size L · Status done (2026-11-02; test and observed lesson recorded by the admin, teacher guide still to write, see LOG)
- Owner idea (2026-11-01): as the academy hires, each teacher teaches only the subjects they are strong in (for
  example Quran and Tajweed only). A teacher who shows promise in another subject is trained for it inside
  "Watazawwado University" and earns that subject.
- Today: no teacher-to-subject link exists in the schema; any active teacher can be assigned any subject.
- Do (after the discussion): per-teacher subject permissions enforced by the server on assignment and booking;
  a training track per subject (our curriculum, the teacher guide, a test, an observed lesson) that unlocks the subject;
  admin view of who may teach what.

### NX-16 A child's own phone, linked to the parent's account
- Priority P2 · Zone 🔴 (children's data and access) · Size L · Status done (2026-11-02; v1 without QR, PIN or child messages, see LOG)
- Owner idea (2026-11-01): a child with their own phone, without the parent's phone nearby, should still have the
  app on their phone through a safe system.
- Proposed design (from ClassDojo, Waterford, RoosterMoney):
  - The parent stays the account holder. The child has no email and no password of their own.
  - In the portal Family tab the parent taps "Set up a phone for <child>" and gets a one-time 6-digit code and QR,
    valid for 15 minutes.
  - On the child's phone, watazawwado.academy/kid (or the installed app) takes the code or scans the QR, and that phone
    becomes a "child device" for that one learner. An optional 4-digit PIN guards it.
  - The child device sees only that child's lessons and join button, homework, today's review, recitations and the
    lesson room.
  - The child device has no payments, booking, settings or other children.
  - Messages to the teacher are on or off, as the parent chooses. The academy can read them, as today.
  - The parent sees a list of linked phones (name, last used) and can remove one at once, and is notified when a
    phone is linked.
- Technical:
  - New table `child_devices`: learner, hashed token, name, last seen, revoked.
  - A `verifyChildDevice` check on a small set of child routes.
  - The token is stored on the device. It lasts long and can be revoked.
  - No Supabase user for the child.
- Teens (13+) might later get their own email login instead. Privacy policy needs a line on child devices.

## MK: From the brand and growth strategy (owner 2026-11-12)

### MK-01 Price $9 → $10 and the founding discount
- Priority P1 · Zone 🔴 (money) · Size M · Status done (2026-11-12; founding: 15% for 12 months, owner 2026-11-12)
- RULES.md §3 (2026-11-12): Quran, Tajweed and Islamic studies $10/h; languages $13/h. Update the pricing engine,
  packages, every price shown on the site (both languages), emails and FAQ; replace the 20%/90-day founding code with
  the chosen founding discount for 12 months (inside the 25% cap). Tests for the new amounts. Bump `TERMS_VERSION` if
  the terms quote prices.

### MK-02 Quarterly retention bonus for teachers
- Priority P1 · Zone 🔴 (money) · Size M · Status done (2026-11-12)
- RULES.md §2c (2026-11-12). Super admin only (teachers never see it): per teacher and quarter, learners taught,
  learners who left with the reason, full-price hours and the resulting pool (+10% of list per full-price hour),
  eligibility checks (minimum learners setting, default 5), a top-up field, and "pay as bonus", which uses the
  existing monthly bonus with a written reason. Add the bonus wording to the teacher agreement (new version, teachers
  accept again): it exists, it rewards keeping learners and good work, the amount varies.

### MK-03 About page: the owner's real credentials
- Priority P1 · Zone 🟢 · Size S · Status done (2026-11-12)
- Approved proof rules (`docs/marketing/STRATEGY-DISCUSSION.md`, 2026-11-12): add to Ustadh Mahmoud's card and the
  About page, both languages: ijazah in the Quran (Hafs 'an 'Asim, wording exactly as on the certificate; ask the
  owner for it), Al-Azhar secondary graduate, "100+ students in person, about 25 online, most in the US", currently
  studying the seven Qira'at. Never: Preply, the former institute's award, an English level. Content may only state
  what this page states (content RULES §3.5).

### MK-04 Homepage copy from the strategy
- Priority P1 · Zone 🟢 · Size S · Status done (2026-11-12)
- `docs/marketing/STRATEGY.md` §4. Keep the headline "Provision that lasts…". Remove the visible kicker above it
  (no hidden text; subjects stay in `<title>`, meta description and the hero paragraph). Add the hero sub-line
  "Pick your teacher from real profiles. After every class, we tell you how it went, before you have to ask." and a
  caption by the teacher photos ("You choose. See each teacher's story before you book."). Add one line for young
  adults ("Drifted? Start where you are. No lectures."). Arabic versions, humanizer, desktop and 375px.

---

## SM: Social media management inside the admin (owner request 2026-11-20)

Why: the owner runs social media himself and does not want to open Metricool, Buffer or Notion to know how things
are going. Everything is seen and managed from the admin, in our design. Metricool and Buffer stay as hidden engines
for publishing; Notion is retired after SM-06 (kept read-only for a month, then closed). Replies to comments and
messages stay manual in the apps (no automatic replies, no budget).

Checked 2026-11-20: Buffer's API works on the free plan with a personal key, analytics included (about 100 requests
per 15 min, 250 per day, 3,000 per 30 days; channels: Instagram, TikTok, YouTube). Metricool's API is paid only
(Advanced plan), its free plan keeps 30 days; it holds Facebook, Threads and Google Business. Both keep about a
month of history, so our daily sync is what builds the history. First-touch source tracking already exists
(`src/lib/leadSource.ts`, `students.lead_source`, shown in the CRM); a `testimonials` table exists since the phase 3
schema (check before SM-07). Not verified: that Meta grants page insights to our own app without app review.

Order: SM-01 to SM-09 as numbered. Backend first, design last. The owner pastes API keys into Vercel himself.

### SM-01 Tables for social numbers
- Priority P2 · Zone 🟢 · Size S · Status todo
- Do: `social_daily_stats` (channel, date, followers, views, reach, interactions, posts) and `social_posts` (channel,
  external id, title, published_at, metrics, hook, season, parent post, link code). Super admin only (RLS).

### SM-02 Daily Buffer sync
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on SM-01 · Needs: the owner's Buffer API key in Vercel
- Do: the existing cron pulls posts and metrics for Instagram, TikTok and YouTube once a day and upserts them. Stay
  far below the free limits. Test with a recorded response.

### SM-03 Daily Facebook sync from Meta
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on SM-01 · Needs: a one-time approval from the owner's Facebook account
- Do: read page and post insights from the Meta Graph API with a page token. Fallback if Meta refuses without app
  review: a daily Claude task that reads Metricool through its connector and writes the same tables.

### SM-04 Admin page "Social media"
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on SM-02
- Do: one card per channel, 30 and 90 day trend, best and worst posts. Existing components and tokens; design last.

### SM-05 Post codes, short links and the per-post funnel
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on SM-01
- Do: each post gets a code; `/go/<code>` counts the click and redirects with UTM tags (`utm_content` = the code),
  reusing the existing first-touch capture. Report per post: clicks, sign-ups, free trials, paid.

### SM-06 Content board (replaces Notion)
- Priority P2 · Zone 🟢 · Size L · Status todo · Depends on SM-01
- Do: idea → script → review → scheduled → published, with the owner's approve / change button, and the fields hook,
  season (Ramadan, Hajj, back to school; prepared 6 weeks ahead) and "derived from" (long video → shorts → carousel →
  article → email). Import the Notion content. Scheduling itself stays with Claude through the connectors at first.

### SM-07 Testimonials with consent
- Priority P2 · Zone 🔴 (public content, consent) · Size M · Status todo · Depends on the ratings branch (`cls/ratings`); covers NX-05
- Do: after a 5-star rating, ask for a written review and explicit consent to publish. Shown with the first name
  and the country as a flag image (owner 2026-11-20; not an emoji, Windows does not draw flag emoji). Bank in the admin.

### SM-08 "Lead from a message" quick form
- Priority P3 · Zone 🟢 · Size S · Status todo
- Do: in the CRM, a short form that turns a DM or comment into a lead with its channel as the source.

### SM-09 Weekly report
- Priority P3 · Zone 🟢 · Size M · Status todo · Depends on SM-04, SM-05
- Do: on the same page, and a short email every Monday: channel numbers next to ours (trials, paid, cost per trial),
  top and bottom 3 posts.

---

## CL: Classroom (owner request 2026-11-17)

The whole lane is planned in `docs/superpowers/specs/2026-11-17-classroom-design.md`, built by the classroom
session, not picked from here. It is listed so other sessions know about it and do not overlap.

### CL-01 Super admin silent observer in any live lesson
- Priority P1 · Zone 🔴 (privacy, room credentials) · Size M · Status todo (classroom plan, Release 1)
- Do: from the admin lessons list, "watch" any live lesson at any time, receive-only, with no notice to the
  teacher. Notes go to the teacher's quality record, and each visit is logged. The teacher agreement and the privacy
  policy state that the academy may observe lessons for quality and safeguarding. Later, the owner decides whether HR
  or Supervision (lane ST) get it.

---

## FN: Admin finance and business advisor (owner request 2026-11-17)

Why: the owner funds the academy himself and wants every number visible on the platform, with plain advice, so no
loss surprises him. Feasibility study and calculator (private artifact):
https://claude.ai/artifact/KE5UvwKsCD3cdndUcRRGqz. Manual ledger until FN-02 exists: `docs/business/LEDGER.md`.
Fits the "Money" domain of ST-02 (super admin only; HR and Supervision never see it). The classroom itself (and the
old NX-12) is planned separately: `docs/superpowers/specs/2026-11-17-classroom-design.md`.

### FN-01 Stripe money sync
- Priority P1 · Zone 🔴 (money) · Size L · Status todo
- Do: import every Stripe balance transaction (gross, fee, net, currency, conversion) and payout, by webhook plus a
  daily catch-up job; reconcile each month against Stripe's payout reconciliation report. Settlement currencies at
  2026-11-17: USD (default), EUR and GBP to nsave accounts, PLN to Erste. Alert the admin before a refund can make the
  balance negative (Stripe then debits the bank account). Amounts come from Stripe, never computed in the browser.

### FN-02 Expenses, subscriptions and debts
- Priority P1 · Zone 🔴 (money) · Size M · Status todo
- Do: an admin page to record costs once (recurring ones repeat by themselves): run the site (Vercel, Supabase,
  Brevo, domain, Cloudflare, Gemini API), dev and content tools (Claude, ChatGPT, ElevenLabs, Gemini Pro, Meshy),
  marketing, staff, and any debt with its schedule. Seed it from `docs/business/LEDGER.md`, including the startup
  spending to date (~$204).

### FN-03 Teacher pay transfers on record
- Priority P1 · Zone 🔴 (money) · Size M · Status todo · Builds on the existing Payroll page
- Do: next to each month's calculated pay, record the actual transfer (method, date, reference, currency). The
  owner's own teacher pay is recorded like any teacher's, so platform profit stays separate from his teaching income.
  Lateness deductions decided in the classroom lateness review flow show here.

### FN-04 Monthly profit, reserve and allocation
- Priority P1 · Zone 🔴 (money) · Size M · Status todo · Depends on FN-01 to FN-03
- Do: per month: revenue, teacher pay, bonus pool, payment fees, subscriptions, other costs, net, margin, profit per
  lesson hour, break-even hours. Reserve in months of fixed costs (target 3). The owner sets the split of net
  (for example marketing, tools, scholarships) and the page shows what each bucket has.

### FN-05 The advisor: rules that say what to look at
- Priority P2 · Zone 🟢 · Size L · Status todo · Depends on FN-04 and the classroom quality data
- Do: a "3 things that need you today" card and mid-month alerts, from written rules with thresholds (no AI
  guessing), each showing the number it is based on. Examples: fixed costs up 20% month on month; reserve reached
  3 months, ads can start with $X; net has been twice a support salary for 2 months; a teacher's connection failed in
  3 lessons in 2 weeks; a teacher was late more than 2 minutes again; learners with no booking for 2 weeks; a
  subscription with no recorded use for 60 days. Rules and thresholds editable by the super admin.

### FN-06 Monthly business report
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on FN-04
- Do: on the 1st of each month, a report page (and a short email to the super admin): money (FN-04), lessons and
  hours, new and leaving learners, teacher quality (lateness, connection, report compliance), compared with the
  month before.

---

## PARKED: ideas kept for later (owner 2026-11-17; agents: do not build)

When the owner asks "what ideas haven't we done yet?", read this list. Each has notes in the classroom feasibility
artifact and design document.

- **Lesson recording (teacher-only).** Dropped for now because of storage cost when many teachers use it. Draft rules
  if revived: teacher-only button framed as "your library", guardian consent once, visible indicator, view-only for
  children's lessons, auto-delete after 30 days with up to 5 pinned, 10 hours per teacher per month, admin opens a
  recording only for a formal safeguarding complaint (logged, teacher told). Recorded in the teacher's browser,
  stored on Cloudflare R2.
- **Audio bookmark** (save the last 30 seconds of a moment). Depends on recording consent.
- **Live captions** (speech to text on screen). Chrome sends audio to Google; off by default, consent needed.
- **LiveKit as a second fallback** behind Zoom; the classroom keeps an engine interface so it can be added.
- **Direct peer-to-peer video for 1-on-1** to cut bandwidth cost 70–80%; worth it only at scale.
- **Self-hosted media server** (LiveKit on Hetzner) when Cloudflare bandwidth costs grow.
- **Automatic tajweed hints for students**, if the accuracy test with our teachers falls below 90%.
- **Low-light camera enhancement** and **region capture** (share part of a page).

---

## Owner decisions needed (agents: do not start these)

- Referral or "invite a family" reward: amount and rules are a pricing decision (RULES.md §4).
- Reviews and testimonials collection on the public site: consent wording and where they appear.
- Switching `PLACEMENT_BEFORE_BOOKING` back to `false`.
- Any change to prices, packages, cancellation windows or trial rules.
