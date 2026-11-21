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

### Order of the management domains (owner 2026-11-21)

Domain by domain, each one finished before the next, ordered so that no domain waits for a later one. Inside a
domain, follow that lane's own `Order:` line. One session per domain, each in its own git worktree; at most two or
three at once, because the backend is one file (`api/index.ts`).

1. **SH** System health: the provider and free-plan audit, backups and alerts. Nothing else is safe before it.
2. **Staff: TU entry path, then ST (staff roles) with HR.** ST-01 (roles and permissions) is needed by SP, SV, FN
   and the admin pages of every later domain.
3. **CP** Compliance and child protection: consent and data rules that later features must respect.
4. **CRM**: CRM-12 is needed by SP and FN.
5. **SP** Support: the SP-01 table is the base of SV-06 and TS-08.
6. **CL** Classroom: merge and finish the branches (`cls/ratings`, `cls/tools`, `cls/quran`); TS, SV, AC and FN read
   its ratings, timeline and quality data.
7. **TS** Teacher and student management.
8. **SV** Supervision.
9. **AC** Academic affairs.
10. **SM** Social media management: FN reads SM-05.
11. **FN** Finance and resources: reads HR, CRM, SM and classroom data, so it comes after them. Exception: FN-07
    (retire the direct PayPal path) runs with domain 1, because it removes a live payment path.
12. **UI** Whole-site interface review, with QA-08 (typeface). UI-01 (the owner's taste and the three directions)
    starts now in its own session, because it needs the owner and blocks nothing.
13. **OA** The Oasis.

The older family-facing lanes (OPS, RN, PA, ST student, TE, AD, PU, NX, CM, MK) keep the order in points 1 to 3
above and run between these domains when a session is free. This order was set from the lanes' `Depends on` lines,
not from a task-by-task check; if a task still waits for a later domain, move that one task and note it here.

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
- Skills: `WATAZAWWADO-new-migration`, `security-and-hardening`.

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

### Additions and order (owner 2026-11-21)

Why: CRM-01 to CRM-08 record what happened. These tasks make the CRM act before a family is lost and at the moments
a family is ready for more. The map follows the journey: before sign-up, the trial, the first 30 days, the steady
learner, after leaving. Web research (2026-11-21) is directional only (adjacent platforms and vendor numbers, no
published data for 1-on-1 tutoring); our own cohort table (CRM-19) is the reference.

Order: CRM-10 → CRM-12 → CRM-15 → CRM-16 → CRM-11 → CRM-17 → CRM-18 → CRM-09 → CRM-19 → CRM-14 → CRM-13 → CRM-20.

Owner decisions 2026-11-21:
- Automatic messages go by email only. WhatsApp stays manual, one tap with a prefilled text.
- Signed up but no trial booked: 3 emails in 7 days (day 1, 3, 7), then stop.
- A loss reason is required when a family is marked lost.
- A second free trial with a different teacher: once per learner, approved by the admin, never automatic (RULES.md §2).
- Pause: up to 4 weeks, once per 6 months, paid lessons are kept. "Lighten" (shorter or fewer lessons) is offered
  beside it (RULES.md §2).
- Win-back: one message 60 days after leaving, no discount.
- A new inquiry gets an instant automatic reply with the booking link; a person answers within one working hour.

Not built, on purpose: an automatic discount to stop a family leaving; countdowns or pressure; automatic WhatsApp
broadcasts; AI text sent without admin approval; machine-learning scores (too little data); teachers selling or
seeing conversion as money; a card required before the free trial; failed-payment recovery (packages are prepaid).

Shared rules for all tasks below:
- Rules with written thresholds that show their number, editable by the super admin (same form as FN-05). Gemini
  may draft a message; the admin approves every send.
- Contact cap (built in CRM-12): one non-transactional message per family per week across every automation, sent
  in the family's daytime, respecting RN-07 preferences.
- No duplication: each task first searches the existing code (`leads`, `server/leadTransitions.ts`, `crm_notes`,
  `crm_tags`, `crm_tasks`, `notification_events`, RN-02 to RN-07 jobs, the classroom ratings, talk time and
  understanding check, `src/lib/leadSource.ts`, referral code) and extends it.

### CRM-09 Family health and the next action
- Priority P1 · Zone 🟢 · Size L · Status todo · Depends on CRM-10, CRM-12, CRM-16
- Do: the stage is computed, not typed: new, first month, steady, at risk, paused, lost. A health level per family
  with its reasons, from existing data: no next lesson booked 48 hours after a lesson, absences, cancellations,
  lessons moved by the teacher, a low rating or questionnaire, low learner talk time, a red understanding check,
  the parent has not opened a report for 3 weeks, a package at 0 for 7 days, a gap between lessons, a goal date in
  2 weeks. An "at risk" list, worst first. One "next action" card per family; the admin records what was done and
  the result.
- Done when: a report shows, per action type, how many families were still active 30 days later.

### CRM-10 Loss and exit reason
- Priority P1 · Zone 🟢 · Size S · Status todo
- Do: moving a family to lost requires a reason (price, times, teacher, level, goal reached, not interested, other
  with text). One exit question by email to the family. A monthly report of reasons by subject, teacher and channel.

### CRM-11 Before the trial: follow-up and unmet demand
- Priority P1 · Zone 🔴 (new scheduled send) · Size M · Status todo · Depends on CRM-12
- Do: signed up with no trial booked: 3 emails in 7 days, then stop. A referred lead is marked priority and gets a
  same-day task. A new inquiry (site form or SM-08) gets the instant reply, and an alert when no person has
  answered within one working hour. Record every slot search that returned nothing (subject, teacher gender asked,
  weekday, hour, time zone): an "unmet demand" report for HR and FN-14.
- Done when: tests prove the sequence stops on booking, on opt-out and after the third email.

### CRM-12 Contact log and contact cap
- Priority P1 · Zone 🔴 (touches every send) · Size M · Status todo
- Do: every message the system sends appears in the family timeline (CRM-01). A "log a call or WhatsApp" button
  with its outcome. The contact cap above, enforced in one place that every non-transactional send goes through.
- Done when: tests prove a second non-transactional message in the same week is held, and transactional ones pass.

### CRM-13 Segments and one-off sends
- Priority P2 · Zone 🔴 (bulk send) · Size M · Status todo · Depends on CRM-12
- Do: saved filters (subject, age band, stage, package state, tag, channel) and one email to a segment, with a
  preview of who receives it, through the contact cap and the preferences.

### CRM-14 Referrals, siblings and the right moment to ask
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on CRM-12
- Do: a board of who invited whom and the credit used. Families with one child enrolled and the "sibling likely"
  tag. A learner in one subject who fits a second. Ask for a referral or a testimonial only at a good moment (a
  finished part or level, a 5 rating, an academy survey of 9 or 10) and never from a family at risk or with an open
  complaint. A shareable certificate at a finished part or level.

### CRM-15 Saving the trial
- Priority P1 · Zone 🔴 (new scheduled send) · Size M · Status todo · Depends on CRM-12
- Do: a "confirm you are coming" button in a reminder 3 hours before the trial; unconfirmed trials are flagged for
  the admin. After a missed trial and the 48-hour wait, one email with a one-tap rebook; a second miss creates a
  task for a person. After an attended trial with no purchase, one question "what stopped you?" (price, times,
  teacher, level). The admin can grant the second trial with a different teacher. The next lesson can be booked from
  the trial's end screen. Trial-to-paid conversion per teacher, admin only, as a count.

### CRM-16 First-month watch
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: for the first 30 days after the first paid lesson: the lesson end screen offers the next booking (with RN-04);
  no next lesson 48 hours after a lesson creates a task from week one; a check-in task after lesson 2; an alert when
  the parent has not opened the first report. The parent portal always shows, without asking: current level, latest
  progress, the next milestone, and "next lesson we will…" after each lesson. The family's goal and its date are
  recorded at the start; 2 weeks before the date the admin gets a task to propose the next goal. For a young child
  the admin sees a suggestion for shorter, more frequent lessons (a suggestion, not a rule).
- First: check what PR and PA tasks already show the parent, and extend those pages.

### CRM-17 Pause or lighten instead of leaving
- Priority P1 · Zone 🔴 (packages and bookings) · Size M · Status todo
- Do: a family can pause with a return date under the rule above, or lighten. A reminder one week before the return
  with a one-tap booking. A calendar of seasons (Ramadan, summer, exam weeks, school start) creates tasks ahead for
  families that paused or left in that season before.
- Done when: a paused family is never counted as retained; the report shows how many paused and how many came back.

### CRM-18 Teacher change handover
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on the HR lane (leave and exit notice)
- Do: when a teacher leaves, takes leave or is replaced: the list of affected families, a required handover note
  per learner (level, last lesson, mistake bank, what works with this learner), an introduction of the new teacher
  to the family, and a task per family until the first lesson with the new teacher is rated.

### CRM-19 Cohort retention table
- Priority P2 · Zone 🟢 · Size M · Status todo
- Do: by month of first paid lesson, the share still active after 1, 2, 3 and 6 months, split by channel, teacher,
  subject and age band. Trial no-show rate and trial-to-paid rate by month. Our targets are set after 3 months of
  data, not from outside benchmarks.

### CRM-20 Win-back
- Priority P3 · Zone 🔴 (new scheduled send) · Size S · Status todo · Depends on CRM-10, CRM-12
- Do: one message 60 days after leaving, worded from the loss reason, no discount; and one before the season in
  which the family first joined. Never to a family that asked not to be contacted.

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
- Owner 2026-11-20: the probation is the teacher's first 10 lessons (no day count).
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

### QA-08 Typeface review of the whole site (owner request 2026-11-21)
- Priority P1 · Zone 🟢 · Size L · Status todo
- **Owner's choice (2026-11-21): (c) Thmanyah Serif Text, bold, for headings in Arabic and English** (he saw the
  three on the real headline). He also sent Madika Arabic ExtraBold to compare; not adopted (see
  `docs/design/TASTE.md`). First step of this task: switch `font-editorial` to Serif Text in both directions.
- Why: the owner saw type that does not look like Thmanyah to him and treats a broken identity rule as the biggest
  fault. Thmanyah is the only typeface, Arabic and English (`docs/design-system.md` §4).
- Found 2026-11-21: the font files are in `public/fonts/thmanyah/` and load on production. The homepage headline
  ("Provision that lasts, for you and your family" / «زادٌ يبقى، لك ولأهل بيتك») is Thmanyah Serif Display at weight
  800, which the browser draws with the Black (900) face because no 800 face exists; in Arabic `.font-editorial` is
  forced to Thmanyah Sans. So it is Thmanyah, but not the style the owner knows from Thmanyah's own website.
- Owner decision needed first: compare, side by side on the real headline in both languages, (a) Serif Display as
  now, (b) Thmanyah Sans for headings, (c) Thmanyah Serif Text, each at the weights Thmanyah's website uses. The
  owner picks; `docs/design-system.md` §4 and the design-system skill are updated to the choice.
- Do, after the choice: review every surface and remove every other face: the public site and its pages, the
  student and family portal, kid mode and the child phone, the teacher dashboard, the admin, the classroom, the
  curriculum slides (all subjects and ages), emails, PDFs and certificates, the Zad mascot, and what is rendered
  outside the site (Remotion videos, HTML films, carousels, published artifacts), which must embed the files.
  Known misses: `sans-serif` in SVG text in curriculum slides (`l03.tsx`, `g-ei3.tsx`, `g-eta1.tsx`,
  `g-eta2.tsx`), Georgia in `ZadRig.tsx`, IBM Plex in `Zad3D.tsx` and `Quad3D.tsx`, Caveat and Aref Ruqaa in
  `TeacherStays.tsx`, the signature face `mrs-saint-delafield-sig.woff2`, the films in `marketing/`. Check that
  every weight used has a real face (no browser-made bold), and that Arabic and English headings match in weight
  and feel. The fallbacks Manrope and IBM Plex Sans Arabic are named in `src/index.css` but must never be what a
  visitor sees.
- Allowed exception: Amiri Quran for verses. Any other exception needs the owner's yes and a line in §4.
- Done when: a test fails the build on a `font-family` or `fontFamily` that is not a Thmanyah variable or the
  Quran face; screenshots of each surface in both languages, phone and desktop, are in the log.

---

## UI: Whole-site interface review (owner request 2026-11-21)

The owner is not happy with how the site looks. Everything designed before the Mobbin subscription is reviewed
again, account type by account type, on phone (390), tablet (768) and desktop (1440), Arabic and English, light and
dark. Every task follows "Before any design" in `docs/design-system.md` (10+ Mobbin references, three prototypes,
the owner picks, `docs/design/TASTE.md` updated). Identity never changes: our palette, Thmanyah, our motifs.
No duplication: improve the existing screens and `src/components/ui/*`; no second component set.

Order: UI-01 → UI-02 → UI-03 → UI-04 → UI-05 → UI-06 → UI-07 → UI-08.

### UI-01 The owner's taste and one direction for the whole site
- Priority P1 · Zone 🟢 · Size L · Status todo
- Do: research on Mobbin (10+ apps and sites: learning, family, premium consumer, Arabic or RTL where it exists);
  show the owner three really different directions on two real screens (the homepage and the family portal home),
  phone and desktop; record what he picks and rejects, with the design term and a plain explanation, in
  `docs/design/TASTE.md`; update `docs/design-system.md` and the `WATAZAWWADO-design-system` skill to the choice.
- Done when: the owner has picked a direction and TASTE.md has at least ten entries.

### UI-02 Public site and the sign-up and booking journey
- Priority P1 · Zone 🟢 · Size L · Status todo · Depends on UI-01
- Do: homepage, subject pages, teachers, pricing, legal, sign-in, onboarding, trial booking and checkout (layout
  only; no change to payment logic). Done when: the owner approves screenshots of each page at the three sizes.

### UI-03 Adult learner and guardian portal
- Priority P1 · Zone 🟢 · Size L · Status todo · Depends on UI-01
- Do: every page of `src/student` for the `student` and `parent` roles. Done when: as UI-02.

### UI-04 Kid mode and the child phone
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on UI-03
- Do: the child views, with the one Kids cast. Done when: as UI-02.

### UI-05 Teacher dashboard
- Priority P1 · Zone 🟢 · Size L · Status todo · Depends on UI-01
- Do: every page of `src/dashboard` for the `teacher` role. Done when: as UI-02.

### UI-06 Staff pages (supervision, support, HR)
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on UI-05 and the SP, SV, HR lanes
- Do: the pages those lanes build. Done when: as UI-02.

### UI-07 Super admin
- Priority P2 · Zone 🟢 · Size L · Status todo · Depends on UI-05
- Do: CRM, finance, reports, settings. Operate mode: dense and scannable. Done when: as UI-02.

### UI-08 Classroom, emails and PDFs
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on UI-01
- Do: the room follows `docs/classroom/ROOM-DESIGN.md` (already approved; only gaps); email templates,
  certificates and reports. Done when: as UI-02.

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
  schema; written through `WATAZAWWADO-content` and `humanizer`.

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

## TS: Teacher and student management (owner request 2026-11-21)

Why: the daily management between a learner and their teacher. Hiring, leave and reviews are in HR; the teacher's
entry path is in TU; progress pages are in PR; lesson observation, coaching and complaints are in the Supervision
domain. Teachers never see money. Web research (2026-11-21) is directional only.

Order: TS-10 → TS-11 → TS-12 → TS-05 → TS-04 → TS-02 → TS-03 → TS-06 → TS-07 → TS-01 → TS-08 → TS-09.

Owner decisions 2026-11-21:
- The learner chooses the teacher; the system only orders and recommends. The admin does not assign.
- A teacher sees their own numbers only: no money, no comparison with other teachers.
- A family can ask to change teacher from the portal; the reason is optional.
- Load limit: 10 teaching hours a day and a 10-minute gap between lessons, editable per teacher.
- The checkpoint assessment is at the end of each curriculum part, not every N lessons.
- No lesson during the teacher's prayer times: the system blocks them and the teacher cannot remove the block (TS-10).

No duplication: each task first searches the existing code (`availabilityEngine.ts`, the weekly hours editor TE-03,
the student card TE-02, PR-01 to PR-10, NX-02 homework, CRM-08 teacher load view, HR-05 leave, TU-05 new subject
request, the classroom ratings and talk time, `crm_tasks`) and extends it.

### TS-01 Teacher recommendation at booking
- Priority P2 · Zone 🔴 (booking flow) · Size M · Status todo · Depends on the classroom ratings and TS-04
- Do: order the teacher list for this learner and label the top ones "a good fit": subject licence, teacher gender
  asked for, age band, overlap of free hours in the learner's time zone, load, ratings with the same age band.
  Written weights, no machine learning. For siblings, suggest back-to-back times. The learner still chooses.
- Done when: tests prove the order never hides a teacher and never shows one the learner may not book.

### TS-02 Learning plan and pace
- Priority P1 · Zone 🟢 · Size M · Status todo · Uses the goal recorded in CRM-16
- Do: per learner: goal, target date, lessons per week. A forecast from the real pace ("at this pace: Juz Amma by
  March") and what a different frequency would give (research: three or more short lessons a week work better than
  one long one). Behind the plan: an alert to the teacher and the admin with one suggestion.

### TS-03 Checkpoint assessment
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on the curriculum parts
- Do: at the end of each curriculum part the teacher scores fixed criteria per subject; the result enters progress
  (PR) and goes to the guardian. A weak result suggests revision lessons before the next part.

### TS-04 Learner regularity record
- Priority P1 · Zone 🟢 · Size S · Status todo
- Do: from existing data, as a pattern over the last 8 weeks: attendance, lateness, late cancellations, homework
  done. Shown on the student card (TE-02) and to the admin; feeds CRM-09.

### TS-05 Change-teacher request
- Priority P1 · Zone 🔴 (bookings) · Size M · Status todo · Uses CRM-18 for the handover
- Do: a calm button in the family portal (reason optional); the admin approves, future lessons move, the handover
  note is written. A teacher can ask to stop teaching a learner, with a reason. Package lessons always stay with the
  family. A report of requests per teacher and reason, to see patterns.

### TS-06 "My month" for the teacher
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on the classroom ratings
- Do: a page with the teacher's own numbers: on time, reports sent in time, homework set, lessons cancelled or
  moved by them, absence count, connection, ratings and questionnaire averages, talk-time share. Each number says
  how it is counted and what the standard is. No money, no ranking.

### TS-07 Schedule and load guard
- Priority P1 · Zone 🔴 (availability) · Size M · Status todo · Depends on TS-10
- Do: hours with a booked lesson cannot be removed (the teacher uses HR-05 leave or TS-08 instead). At most 10
  teaching hours a day, a 10-minute gap between lessons, and at most 3 hours of teaching in a row, editable per
  teacher by the admin. The admin sees where demand is above open hours (CRM-11 unmet demand).
- Done when: tests prove the booking engine refuses a slot that breaks a limit.

### TS-08 Teacher requests inbox
- Priority P2 · Zone 🟢 · Size M · Status todo
- Do: one place for a teacher's requests, each with a status: leave (HR-05), a new subject (TU-05), an hours
  change, a problem with a learner, a technical problem. The admin answers there; nothing by private chat.

### TS-09 Announcements with acknowledgement
- Priority P2 · Zone 🟢 · Size S · Status todo
- Do: the admin posts an announcement to teachers; an important one stays on the teacher's home until "I have read
  it". The admin sees who has not.

### TS-10 Prayer times are never bookable
- Priority P1 · Zone 🔴 (availability) · Size M · Status todo
- Do: the teacher sets their city (not only the time zone: prayer times differ inside one zone). The server
  computes the five prayer times for each date (the `adhan` library, MIT; calculation method from a country table,
  the high-latitude rule above 48°; the teacher may pick the method and the Asr school, nothing else) and blocks 30
  minutes from each prayer time in `availabilityEngine.ts`. The block shows in the weekly hours editor as locked.
  Times move every day, so slots are computed per date, never stored per week. A lesson booked before this ships
  that touches a block is kept and listed for the admin.
- Done when: tests prove no slot overlapping a block is offered for cities in three zones, on a daylight-saving
  change day and at a high latitude.
- Owner decisions 2026-11-21: on Friday the Dhuhr block is 60 minutes for male teachers. Nothing is blocked on the
  learner's side; the learner picks their own time.

### TS-11 Reliability promise
- Priority P1 · Zone 🔴 (credits, bookings) · Size M · Status todo · Uses the classroom attendance verdict (3.2, 3.2b)
- Do: when the verdict is "teacher absent": the lesson goes back to the family's balance by itself within the hour,
  an apology goes to the family, and they get a one-tap rebook with first choice of the teacher's next free slots.
  The promise is written on the public site and in the booking confirmation. The absence counts in TS-06 and HR-06.
- First: check what the existing no-show functions already return to the family, and extend them.
- Done when: tests prove the lesson is returned once only, and never while a teacher's appeal is still open.

### TS-12 First-lesson brief
- Priority P1 · Zone 🟢 · Size S · Status todo · Uses the classroom prep mode (1.4) and TE-02
- Do: before the first lesson with a new learner the teacher sees one page: placement result, goal and its date,
  age, the family's notes and preferences, the trial teacher's note if any. "Join the room" for that lesson is
  active only after the page was opened.

---

## SV: Supervision (owner request 2026-11-21)

Why: the quality data exists but is scattered (silent observer, ratings, questionnaires, talk time, lateness,
connection report, NX-13). Nothing tells the supervisor whom to watch, how to score, and how to follow up. Lesson
recording is parked, so supervision works from live observation and from the lesson file. Supervision recommends;
decisions about a teacher belong to HR and the owner. Supervision never sees money. Research (2026-11-21):
observation with feedback improves teaching (Kraft, Blazar and Hogan 2018, 60 causal studies), online as much as in
person; one observation is never enough for a high-stakes decision.

Order: SV-06 → SV-01 → SV-04 → SV-02 → SV-03 → SV-08 → SV-05 → SV-07 → SV-09 → SV-10.

Owner decisions 2026-11-21:
- Observation is silent, with no notice at the time. The teacher always sees the result of every observation: no
  secret notes.
- Frequency: 2 of the first 10 lessons in probation (HR-04), then again after 15, 30 or 90 days by the last score.
- Feedback reaches the teacher within 48 hours.
- No warning from a single observation: at least two signals are needed (HR-06 ladder).
- Complaints: first reply within 24 hours, resolved within 3 working days.
- Refunds: the supervisor recommends, the super admin executes (FN-09).

No duplication: each task first searches the existing code (the silent observer and its visit log, the classroom
timeline, ratings, questionnaires and talk time, the lateness and appeal flow, the connection report, NX-13, NX-15
observed lessons, CRM-08, `crm_tasks`, the admin chat inbox AD-03) and extends it. The full child-protection policy
belongs to the Compliance domain; SV-06 only provides the channel.

### SV-01 Observation form
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on ST-01
- Do: fixed criteria per subject group: preparation, explanation, correcting mistakes, learner engagement, manner
  and patience, use of time (Quran: correction of recitation). Score 1 to 4 each, one strength, one action to
  improve. Filled during or after a silent observation and stored in the teacher's quality record (SV-08).

### SV-02 Smart observation queue
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on SV-01
- Do: a weekly list "watch these", each with its reason and the teacher's next lessons: a teacher in probation, a
  low rating, a complaint, a first lesson with a new learner, a family at risk (CRM-09), a teacher not observed for
  60 days, a re-observation that is due, and a random sample. Written rules, editable by the super admin.

### SV-03 Coaching cycle
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on SV-01
- Do: observation → feedback to the teacher within 48 hours (strength and one action, linked to a University
  unit when one fits) → the teacher acknowledges and may reply → a follow-up observation checks that action. Open
  actions and overdue feedback are listed.

### SV-04 Lesson-file flags
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on the classroom admin lesson view (BUILD-LIST 3.5)
- Do: review without watching. Flags from the lesson data: the teacher spoke over 80% of the time, the lesson ended
  early, no corrections recorded, slides skipped, an empty or very short report, the teacher late. A list of flagged
  lessons for the supervisor, who marks each as fine or needing action.

### SV-05 Report quality sample
- Priority P2 · Zone 🟢 · Size S · Status todo
- Do: a weekly sample of family summaries per teacher, plus those flagged as too short or the same text for
  several learners. The supervisor marks good or needs work, with a note to the teacher.

### SV-06 Complaints register
- Priority P1 · Zone 🔴 (personal data, children) · Size M · Status todo
- Do: a calm "I have a problem" button in the family portal and one for teachers. Each complaint has a category,
  severity, owner, the linked lesson, a first-reply deadline of 24 hours and a resolution deadline of 3 working
  days, and an outcome. Patterns per teacher. A concern about a child's safety goes to the super admin only, at
  once, and is hidden from every other role. An open complaint feeds CRM-09 and blocks referral asks (CRM-14).
- Done when: a restricted role gets 403 from the server on a safeguarding complaint.

### SV-07 Curriculum fidelity
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on the report draft (BUILD-LIST 3.3)
- Do: per teacher and learner, the lessons covered against the curriculum order and the learner's plan (TS-02):
  skipped lessons, parts repeated, pace far from the plan.

### SV-08 Teacher quality record
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on SV-01
- Do: one page per teacher over time: observations and scores, open coaching actions, flags, complaints, ratings
  and questionnaire averages, lateness, absences. It is the input to the quarterly review and the warning ladder
  (HR-06) and shares its numbers with TS-06. Reuse the CRM-08 queries.

### SV-09 Supervisor home
- Priority P2 · Zone 🟢 · Size S · Status todo · Depends on SV-02, SV-03, SV-06
- Do: today's queue, feedback that is overdue, open complaints near their deadline. The super admin sees how many
  observations and reviews each supervisor did.

### SV-10 Calibration
- Priority P3 · Zone 🟢 · Size S · Status todo · Only when there are two supervisors
- Do: two supervisors score the same lesson and compare, to keep the scale the same.

---

## AC: Academic affairs (owner request 2026-11-21)

Why: writing the curriculum has its own track and the owner's review (`docs/curriculum`). This lane manages the
curriculum as a product: is the level right, which lesson is weak, what is ready, when a subject may open for
booking. Approval of curriculum changes stays with the owner. Research (2026-11-21, directional): no placement test
is exact and teacher judgement after the first lessons corrects it; lessons improve through a loop of performance
data and feedback; mastery before advancing helps moderately, so the gate is soft.

Order: AC-01 → AC-02 → AC-04 → AC-09 → AC-06 → AC-03 → AC-05 → AC-08 → AC-07 → AC-10.

Owner decisions 2026-11-21:
- Level correction: the teacher decides within the first 3 lessons; the family is told the reason.
- Mastery: a soft gate. The teacher may advance with a written reason.
- Eid: the first day of each Eid is closed for everyone; the other days are the teacher's choice.
- Verified certificate: yes, showing the first name and the level only, with the family's consent (CM-01).
- No subject is sold before it passes the opening gate (AC-09).

No duplication: each task first searches the existing code (the placement tests, the curriculum catalog and its
`reviewed` flag, slide and timeline events of the classroom, the mistake bank and `quran_marks`, NX-01 review,
NX-04 certificates, NX-08 seasonal programs, TS-02, TS-03, SV-07) and extends it.

### AC-01 Level correction in the first 3 lessons
- Priority P1 · Zone 🟢 · Size S · Status todo
- Do: after each of the first 3 lessons the teacher confirms with one tap: level is right, higher, or lower (a
  reason is required to change). The learner's place moves and the family is told why. A report of how often each
  placement test was corrected and in which direction, to fix the test.

### AC-02 Teacher feedback on lessons
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: a "problem here" button on any slide (error, unclear, too long, too hard, sound) and one tap after teaching
  a lesson: too easy, right, too hard, and whether the time was enough. A review queue per lesson for the
  curriculum work; the teacher sees when their note was handled.

### AC-03 Lesson analytics
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on AC-02 and the classroom timeline
- Do: per lesson: times taught, real time against planned time, red understanding checks, the mistakes that repeat
  across learners (mistake bank, `quran_marks`), checkpoint items most often failed (flag items passed by over 80%
  or under 30%), teacher feedback. A ranked list "lessons to revise".

### AC-04 Curriculum readiness map
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: per track and level: lessons planned, built, reviewed by the owner, voiced. For each unbuilt lesson, how many
  learners will reach it and when, so the next lesson to build is clear. This is the source for FN-13 and FN-14.

### AC-05 Lesson versions
- Priority P2 · Zone 🟢 · Size S · Status todo
- Do: a change to a lesson that was already taught gets a version number and a short change note; teachers who
  teach it are notified. A learner's finished lessons stay finished.

### AC-06 Mastery rule
- Priority P1 · Zone 🟢 · Size S · Status todo · Depends on TS-03
- Do: the checkpoint result suggests "continue" or "revise first" with the weak criteria listed. The teacher may
  continue anyway with a written reason, which the supervisor can see (SV-08).

### AC-07 Academic calendar
- Priority P2 · Zone 🔴 (availability) · Size M · Status todo · Uses the block mechanism of TS-10
- Do: one calendar of seasons and programs (Ramadan, summer, school start, exam weeks, NX-08 programs) and closed
  days (the first day of each Eid for everyone). CRM-17 seasons and the SM content calendar read from it.

### AC-08 Level standard and verified certificate
- Priority P2 · Zone 🔴 (public page, children's data) · Size M · Status todo · Extends NX-04
- Do: a level is complete when all its lessons are done and its checkpoint is passed. The certificate carries a
  link to a public page that confirms it (first name and level only, shown only with consent).

### AC-09 Subject opening gate
- Priority P1 · Zone 🔴 (booking) · Size S · Status todo
- Do: a checklist per subject: map written, a set number of lessons reviewed, placement test, the teacher course
  in the University (TU-04), at least one licensed teacher, price band. The subject cannot be booked until every
  item is ticked; the server enforces it.

### AC-10 Learning results report
- Priority P3 · Zone 🟢 · Size M · Status todo · Depends on TS-02 and TS-03
- Do: per subject and age band: average pace, checkpoint pass rate, time to finish a level, review retention
  (NX-01). Real numbers only, usable in marketing once the sample is large enough to be honest.

---

## SP: Support (owner request 2026-11-21)

Why: the owner treats support as a core of the brand. Supervision is about the quality of teaching; support solves
a family's or a teacher's problem (sign-in, booking, payment, technical). One person does both for now, in one
system: support is a separate permission in the ST-01 sets, given to the `supervision` role at the start, so the
two can be split later without new code. Complaints (SV-06) and teacher requests (TS-08) are categories in the
same inbox, not separate systems. Research (2026-11-21, directional): one bad experience loses many customers;
low effort for the customer matters more than delight; a good recovery restores satisfaction but does not reliably
raise loyalty, so prevention comes first; a bot that does not hand over to a person is the most hated pattern.

Order: SP-01 → SP-03 → SP-02 → SP-06 → SP-05 → SP-04 → SP-08 → SP-09 → SP-10 → SP-07.

Owner decisions 2026-11-21:
- Support is done by the supervision account with its own permission. Refunds go to the super admin (FN-09).
- Reply times: a lesson emergency gets the automatic fix at once and a person within 15 minutes in coverage hours;
  everything else gets a first reply within 12 hours.
- Coverage hours: the owner sets them (not set yet); outside them the system answers with the honest expected time.
- Goodwill: one make-up lesson per family per 3 months without asking the owner.
- The AI helper answers from the help articles only, and "talk to a person" is always visible.
- Channels: the portal and email are official; WhatsApp is manual and logged (CRM-12); no phone support.

Not built, on purpose: a bot that blocks the way to a person; hiding the contact route; closing a ticket without the
customer's confirmation; a discount as an apology; phone support.

No duplication: each task first searches the existing code (the admin chat inbox AD-03 and `chat_threads`, the
family timeline CRM-01, `crm_tasks`, `notification_events`, push notifications NX-09, the classroom fix-it pages
and Zoom fallback, the PU-03 FAQ, the Gemini learning guide, self-service privacy requests ST-06) and extends it.
SV-06 and TS-08 are built on the SP-01 table.

### SP-01 One inbox
- Priority P1 · Zone 🔴 (personal data, new role permission) · Size L · Status todo · Depends on ST-01
- Do: every request in one list: the portal help button, email, the existing chat, complaints, teacher requests.
  Each has a category, priority, owner, status, deadline, and the linked family, lesson or payment, with the family
  timeline beside it so nobody asks the customer twice. The customer sees the status of their request in the
  portal and confirms it is solved before it closes.
- Done when: a role without the support permission gets 403 from the server; a safeguarding complaint stays hidden
  from the support permission (SV-06).

### SP-02 Help that knows the context
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on SP-01
- Do: the help button knows the page and shows the fix for that page first (cannot join, payment, booking,
  balance). A request attaches by itself: browser, device, the last error, the booking or payment id.

### SP-03 Lesson emergency
- Priority P1 · Zone 🔴 (credits, room) · Size M · Status todo · Depends on SP-01
- Do: during a lesson window a "problem now" button for the family and the teacher: the fix-it steps and the
  fallback link at once, an urgent push to the person on duty, and when the verdict is "incident on our side" the
  lesson returns to the balance by the existing rule (with TS-11).
- Done when: tests prove the urgent alert is sent once per lesson and the lesson is never returned twice.

### SP-04 Help centre
- Priority P2 · Zone 🟢 · Size M · Status todo · Extends PU-03
- Do: searchable articles in Arabic and English, written from real requests, each with "did this solve it?".
  The AI helper answers only from these articles, says so when it does not know, and always shows "talk to a
  person", which opens SP-01 with the conversation attached.

### SP-05 Saved replies and drafts
- Priority P2 · Zone 🟢 · Size S · Status todo · Depends on SP-01
- Do: saved replies for repeated requests in both languages, and a Gemini draft in the family's language that the
  person edits and sends. Nothing is sent without a person. Copy follows the brand voice.

### SP-06 Service standards and hours
- Priority P1 · Zone 🟢 · Size S · Status todo · Depends on SP-01
- Do: reply deadlines by priority (owner decisions above) and coverage hours set by the super admin. The customer
  is told the honest expected time when they send a request ("it is night for our team; we reply by ..."). Requests
  near their deadline are highlighted.

### SP-07 Every request is a defect
- Priority P2 · Zone 🟢 · Size S · Status todo · Depends on SP-10
- Do: a monthly list of the top 10 request reasons. Each one gets a decision recorded beside it: a self-service
  button, a fix at the root, or a help article. The count per reason is followed month to month.

### SP-08 Proactive support
- Priority P2 · Zone 🔴 (new sends) · Size M · Status todo · Depends on SP-01 and CRM-12
- Do: the system opens the request before the customer writes: repeated failed joins, a failed payment, a room
  error. The family is told when the teacher is running late. A site banner during an incident. These messages
  are transactional and pass the contact cap.

### SP-09 Goodwill within limits
- Priority P2 · Zone 🔴 (credits) · Size S · Status todo · Depends on SP-01
- Do: the support permission may grant one make-up lesson per family per 3 months, with a reason; the server
  enforces the limit and every grant is logged and shown to the super admin. No discounts.
- Done when: tests prove the second grant inside 3 months is refused for the support permission.

### SP-10 Support measures
- Priority P2 · Zone 🟢 · Size S · Status todo · Depends on SP-01
- Do: one tap after a solved request: "was it easy to get this solved?". First-reply time, time to solve, reopened
  requests, requests per 100 lessons, reasons. An open request or a bad answer feeds CRM-09.

---

## CP: Compliance and child protection (owner request 2026-11-21)

Why: our learners include children of families in the West, taught 1-on-1 online by an adult: the highest-risk
setting in every safeguarding guide. This lane is a practical plan from official sources, not legal advice; the
open legal questions are listed in CP-11 for a lawyer. Sources (2026-11-21): the amended US COPPA Rule (compliance
date 22 April 2026: a written retention policy, no indefinite storage of children's data); the UK Children's Code
(15 standards: best interests of the child, high privacy by default, data minimisation, easy tools to report and
delete); GDPR Article 8 (consent age 13 to 16 by country, reasonable effort to verify the parent); NSPCC guidance
for tutors (a written policy before starting, a named safeguarding lead, vetting).

Order: CP-01 → CP-02 → CP-03 → CP-04 → CP-07 → CP-05 → CP-06 → CP-08 → CP-09 → CP-10 → CP-11.

Owner decisions 2026-11-21:
- Safeguarding lead: the owner, with a female deputy for concerns about girls.
- Vetting is required for every teacher before any lesson with a learner under 18, renewed every 2 years, and
  applies to current teachers too.
- On a safeguarding report the teacher is paused from lessons with minors at once until the review ends: a
  precaution, not a verdict, and the teacher agreement says so.
- A guardian can always read their child's conversation with the teacher.
- Under 13: no account of their own (as now). 13 to 17: the account belongs to the guardian.
- Retention: lesson files and audio are deleted 12 months after the learner's last lesson. The rule "accounts are
  never deleted automatically" stays.
- Lawyer: one fixed-fee session after CP-01 to CP-07 are drafted.

No duplication: each task first searches the existing code and documents (the teacher's safeguarding declaration
in HR-01, CM-01 consent, ST-06 privacy requests, NX-16 child devices, the guardian observer and the observer visit
log, NX-03 30-day deletion, SV-06, the terms consent records, the legal pages and their "Children & safeguarding"
section, `chat_threads`) and extends it.

### CP-01 Safeguarding policy and its lead
- Priority P1 · Zone 🔴 (legal, public content) · Size M · Status todo
- Do: a public page in Arabic and English: the policy, the safeguarding lead and the deputy and how to reach them
  directly, how to raise a concern and what happens next. A teacher code of conduct: no contact outside the
  platform, no personal accounts, no gifts, camera and setting rules, and what to do when a child tells the teacher
  about harm (report to the lead, do not investigate). Signed with the teacher agreement (TU-02) and taught in the
  University.

### CP-02 Teacher vetting record
- Priority P1 · Zone 🔴 (personal data, bookings) · Size M · Status todo · Extends HR-01 and HR-03
- Do: identity check, a criminal record certificate from the country of residence, two references, each with its
  date and renewal date; documents stored privately, visible to the super admin and HR only. The server refuses a
  booking of a learner under 18 with a teacher whose vetting is incomplete or expired.
- Done when: tests prove the refusal, and that an adult learner can still book.

### CP-03 Safeguarding case handling
- Priority P1 · Zone 🔴 (children, personal data) · Size M · Status todo · Depends on SV-06
- Do: a case file only the super admin and the deputy can open: steps taken, times, who was told, the decision.
  One action pauses the teacher from lessons with minors and moves or cancels the affected lessons with a neutral
  message to families. Recording a lesson is allowed only for a formal case, logged, and the teacher is told.

### CP-04 Communication boundary
- Priority P1 · Zone 🔴 (children, messaging) · Size M · Status todo
- Do: all teacher and child contact stays in the platform. A message between a teacher and a minor that contains a
  phone number, a link or a social handle is flagged to the safeguarding lead. The guardian can read the child's
  conversation at any time, and the child and the teacher are told so.

### CP-05 Consent ledger
- Priority P1 · Zone 🔴 (legal) · Size M · Status todo · Extends CM-01
- Do: per child: who consented, when, to what, and to which version of the terms and the privacy policy. A changed
  version asks for consent again. Age rules enforced by the server (under 13, 13 to 17).

### CP-06 Data map and retention schedule
- Priority P1 · Zone 🔴 (personal data, deletion) · Size M · Status todo
- Do: a written document: each kind of data, why it is kept, for how long. A scheduled job deletes lesson files
  and audio 12 months after the learner's last lesson (NX-03 keeps its 30 days). Every run is logged.
- Done when: tests prove nothing of an active learner is deleted.

### CP-07 Third-party register
- Priority P1 · Zone 🔴 (personal data) · Size M · Status todo
- Do: first, check what is sent to Gemini (the family-summary draft, the learning guide, the intake chat) and
  remove children's names and identifying details from it. Then a register of every service that touches
  children's data (Supabase, Vercel, Cloudflare, Brevo, Gemini, Stripe and any other found), what it receives,
  where it is stored, and its data processing agreement.

### CP-08 Privacy by default for children
- Priority P2 · Zone 🔴 (children) · Size M · Status todo
- Do: child pages and the child phone carry no tracking beyond what the lesson needs; a simple page for the child
  "what we know about you"; a written impact assessment (DPIA) kept with the policies.

### CP-09 Rights requests
- Priority P2 · Zone 🔴 (personal data) · Size S · Status todo · Extends ST-06
- Do: export of a family's data on request, and each deletion or access request tracked against its one-month
  deadline in the support inbox (SP-01).

### CP-10 Access log and breach plan
- Priority P2 · Zone 🔴 (auth) · Size M · Status todo · Depends on ST-01
- Do: a log of which staff account opened which child's record; two-step sign-in for the super admin and staff
  roles; a written breach plan (who does what, the 72-hour notice in the EU and UK).

### CP-11 Quarterly review and the lawyer's questions
- Priority P2 · Zone 🟢 · Size S · Status todo · After CP-01 to CP-07
- Do: a checklist reviewed every 3 months (vetting renewals, open cases, retention runs, the register). Questions
  for the lawyer, not decided here: does COPPA apply to us; do we need a representative in the EU or the UK; which
  country's law governs the contract; is our way of verifying the guardian enough.

---

## SH: System health (owner request 2026-11-21)

Why: OPS-01 to OPS-04 and QA-01 exist (error monitoring, health page, uptime and cron heartbeat, runbook, money
smoke tests). This lane covers what would stop the academy or lose data. Checked 2026-11-21: the Supabase
organisation is on the free plan (no point-in-time recovery; Supabase advises free projects to keep their own
exports). Vercel's fair use guidelines restrict the Hobby plan to non-commercial use; our Vercel plan was not
verified. The list of risks is not complete: SH-01 is the real audit.

Order: SH-01 → SH-02 → SH-12 → SH-11 → SH-03 → SH-05 → SH-04 → SH-07 → SH-13 → SH-14 → SH-06 → SH-15 → SH-10 →
SH-09 → SH-08.

Owner decisions 2026-11-21:
- Vercel: if we are on Hobby, move to Pro (about $20 a month) on the day real payments open, not before.
- Supabase: our own free backup now; move to Pro (about $25 a month) when monthly revenue covers it, with a rule
  in the advisor (FN-05) to remind the owner.
- Backups live outside Supabase in private storage, encrypted, kept 30 days. A restore test every 3 months.
- A release is held while a lesson is live or starts within 15 minutes.
- Alerts: push and email for urgent ones, a daily digest for the rest.

No duplication: each task first searches the existing code (OPS-01 to OPS-04, the health page, the cron heartbeat,
QA-01, `e2e/`, the Stripe webhook handlers, `vercel.json`, the security-audit skill) and extends it.

### SH-01 Provider audit
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: one table of every service we depend on (Vercel, Supabase, Cloudflare, Stripe, Brevo, Gemini, Zoom, Google
  Calendar, the domain and DNS, GitHub, the cron service, any other found): our plan, its limits, its terms on
  commercial use and on what it does with our data (Gemini's free tier in particular, with CP-07), the region
  where data is stored, the cost at 50 and at 200 learners, and what happens to us if it stops. Confirm the Vercel
  plan and whether the Zoom fallback account cuts a lesson at 40 minutes. Every risk found becomes a task or a
  recorded decision. Feeds FN-02 and FN-13.

### SH-02 Backups we own
- Priority P1 · Zone 🔴 (all data) · Size M · Status todo
- Do: a nightly export of the database and the storage buckets, encrypted, to private storage outside Supabase,
  kept 30 days, with an alert when a night is missed. A written restore procedure.
- Done when: a restore into a fresh project was done and checked once, and the next test date is recorded.

### SH-03 Check after every release
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: after each production release an automatic check, run once from the release pipeline (never a polling loop
  from the owner's network): an API route answers, sign-in, the slot list, creating a checkout session in test
  mode, entering the room. A failure alerts at once with the rollback step. The classroom is also checked on iPhone
  Safari before a classroom release.

### SH-04 Register of scheduled jobs
- Priority P1 · Zone 🟢 · Size S · Status todo · Extends OPS-03
- Do: every scheduled job (reminders, RN and CRM sends, the retention deletion, the Stripe catch-up, backups, the
  integrity check) is listed with its heartbeat; a job that did not run alerts. A new job cannot ship without its
  entry.

### SH-05 Alerts and incident record
- Priority P1 · Zone 🟢 · Size M · Status todo
- Do: priorities for alerts (payment, sign-in or the room down: push and email now; the rest in a daily digest).
  Each incident gets a record: start, end, families and lessons affected, the lessons returned (SP-03), the cause
  and one fix. Drives the site banner of SP-08.

### SH-06 Release safety
- Priority P2 · Zone 🟢 · Size M · Status todo
- Do: a release waits while a lesson is live or starts within 15 minutes. One documented step returns production to
  the previous version. Red-zone changes ship behind a switch that the super admin can turn off.

### SH-07 Limits watch
- Priority P1 · Zone 🟢 · Size M · Status todo · Depends on SH-01
- Do: for each limit found in SH-01 (database size, storage, emails per day, room minutes, Gemini requests,
  function usage) the share used, with an alert at 70%. Brevo's daily email limit first, because the CRM and
  support lanes add automatic emails. Feeds the advisor: "upgrade X now, it costs Y a month".

### SH-08 Performance budget
- Priority P3 · Zone 🟢 · Size S · Status todo
- Do: targets for page speed on a phone, the time to enter the room and API response time; an alert when a release
  makes one worse.

### SH-09 Monthly security hygiene
- Priority P2 · Zone 🔴 (security) · Size S · Status todo
- Do: a monthly run: dependency updates, the Supabase security advisors, a check of RLS on new tables, key rotation
  dates. Findings become tasks.

### SH-10 Disaster plan
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on SH-01
- Do: per provider, what we do when it is down. Recovery of the owner's accounts (two-step backup codes, a second
  owner where the service allows). A document that lets the academy keep running when the owner is not available.
  Stripe is the only way money comes in: write what we do if the account is paused for review.

### SH-11 Nightly integrity check
- Priority P1 · Zone 🔴 (money, bookings) · Size M · Status todo
- Do: every night the system checks rules that must always hold and alerts on any break: no confirmed paid booking
  without a verified payment; a package balance equals bought minus used; no teacher booked twice at one time; no
  lesson inside a prayer block (TS-10); no minor with a teacher whose vetting is incomplete (CP-02); no lesson
  returned twice; booked times still correct across a daylight-saving change in either time zone.
- Done when: each rule has a test that plants a broken record and sees the alert.

### SH-12 Email reaches the inbox
- Priority P1 · Zone 🟢 · Size S · Status todo
- Do: check and fix SPF, DKIM and DMARC for the sending domain; watch bounces and spam complaints from Brevo; a
  monthly inbox test to Gmail, Outlook and iCloud. Without this the CRM and support emails are wasted.

### SH-13 Spending caps
- Priority P1 · Zone 🟢 · Size S · Status todo · Depends on SH-01
- Do: a spending limit and a billing alert on every usage-priced service, so a bug cannot produce a large bill.
  The monthly total goes to FN-02.

### SH-14 Abuse protection
- Priority P2 · Zone 🔴 (auth, bookings) · Size M · Status todo
- Do: rate limits on sign-up, sign-in and the public forms; bot protection on sign-up; detection of many accounts
  taking free trials from one device or payment method; limits on the AI helper per account.

### SH-15 Move the project out of OneDrive
- Priority P2 · Zone 🟢 · Size S · Status todo · Needs the owner at his computer
- Do: the working copy lives in a OneDrive folder, which has already caused build failures. Move it to a normal
  folder, with the owner, after everything is pushed; update the paths in the handoff documents.

---

## OA: The Oasis: a learning tree and real giving (owner idea 2026-11-21)

Owner's idea, recorded so it is not lost; not designed yet. For adult learners and guardians: a tree in their
"oasis" grows through their learning. When it reaches its full size the academy gives in their name, from its
own money: either a donation to Gaza relief or a real fruit-bearing tree planted. Shown in the community.
Adults want a purpose behind the effort. A version for children is not decided.

### OA-01 The Oasis
- Priority P2 · Zone 🔴 (money, public claims) · Size L · Status todo (open owner decisions below; `brainstorming` first)
- Do, as proposed by Claude and to be confirmed:
  - The tree grows only from real learning (lessons done, checkpoints passed) and is full when a curriculum level
    is complete (AC-08). It never shrinks or wilts: no guilt, no daily streaks.
  - At full size the learner chooses: a donation to Gaza relief or a planted tree, and may dedicate it to someone.
  - The academy gives from its own revenue through a registered charity; it does not collect donations. The money
    comes from a "giving" bucket of the monthly split (FN-04). If the bucket is empty the gift waits in a queue
    and the learner is told the honest date.
  - Proof for every gift: the charity's receipt or certificate, shown to the learner.
  - A community grove with real totals only, first names with consent (CM-01), no ranking.
  - The teacher of the learner is named in the gift too.
- Owner decisions 2026-11-21: Claude's proposals above are accepted. The real trees are planted in Egypt, with a
  local tree-planting association as a partner (cheaper than Europe, and such groups exist). The Oasis is an
  environment, not identity: its trees and land are drawn in natural colours, green included; this is the one
  exception to "no green", and the controls, type and frames around it stay in our palette and Thmanyah. It is
  made for adults: calm and real, not a children's game. The children's version waits until the adult one is live.
- Design references (Mobbin, 2026-11-21): Forest (one tree in a round frame with a progress ring; an isometric
  plot that fills with the trees earned; a species picker; planting together in a room) and Tolan (a soft 3D
  landscape). Take the structure, not the look: prototype 2 to 3 looks first (owner's standing rule).
- Still open: the amount per tree (decided when learner numbers are known; Claude proposes a figure from Egyptian
  prices then) and the partner associations.
- For a lawyer (CP-11): how we may describe the giving in marketing, and any limits on giving to Gaza relief from
  where the trader is registered.
- Wording of any hadith or ayah about planting or charity goes through `WATAZAWWADO-islamic-content-check`.

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

### Additions and order (owner 2026-11-20)

Order: FN-01 → FN-07 → FN-02 → FN-03 → FN-08 → FN-04, then FN-09 and FN-10, then FN-05, FN-06, FN-11, FN-12.

Owner decisions 2026-11-20:
- Reports are in USD. A transfer or cost in another currency is stored with its own amount and the rate of its day.
- Refunds go back to the original payment method through Stripe from the Refund button; a manual transfer stays only
  for cases where that is not possible (RULES.md §5).
- Stripe is the only payment provider (owner 2026-11-21). PayPal is offered only as a payment method inside Stripe
  checkout, so all money arrives in Stripe and FN-01 covers all of it. There is no separate PayPal account to sync.
- There is no accountant yet: FN-10 exports a general CSV, adjusted when one is hired. Tax and legal invoice rules
  are not decided here.

No duplication: each task first searches the existing code (Payroll page, Refund button, Stripe webhooks,
`payments` and package tables, discount and referral credit code, `docs/business/LEDGER.md`) and extends it.

### FN-07 Retire the direct PayPal path
- Priority P1 · Zone 🔴 (money) · Size S · Status todo
- Do: find any direct PayPal code left from before PayPal moved inside Stripe (checkout button, server routes,
  webhook, env names, legal and help text). Confirm no learner can reach it, then remove it, and make docs and
  CLAUDE.md say Stripe only. Check that a PayPal payment made through Stripe checkout confirms the booking and
  refunds like a card payment.
- Done when: no direct PayPal route answers in production, and the payment tests pass.

### FN-08 Money received but not yet earned
- Priority P1 · Zone 🔴 (money) · Size S · Status todo
- Do: a report from existing tables, no new ones: unused package lessons at their package price, lesson credits,
  referral and welcome credit balances, pay-later bookings awaiting payment. FN-04 shows cash and earned revenue
  separately using it.

### FN-09 Refund and dispute register
- Priority P1 · Zone 🔴 (money) · Size M · Status todo
- Do: the Refund button refunds through Stripe to the original method (manual transfer as the fallback,
  recorded with method and reference). A list of open refund and withdrawal requests with days left of the 14.
  A Stripe dispute (chargeback) alerts the super admin at once and shows its deadline, amount and fee.
- Done when: tests prove a refund reverses the lesson or credits once only, and never refunds more than was paid.

### FN-10 Receipts and accountant export
- Priority P2 · Zone 🔴 (money) · Size M · Status todo
- Do: a numbered receipt (PDF) for every payment, in the family portal and the payment email. A monthly CSV export:
  payments, fees, refunds, teacher pay, expenses.

### FN-11 Cost per new learner and learner value
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on FN-02 and SM-05
- Do: per channel and month: marketing spend, sign-ups, trials, paying learners, cost per paying learner, and what a
  learner has paid to date. Also the monthly cost of discounts, family 5% and referral credit.

### FN-12 Three-month forecast
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on FN-04 and FN-08
- Do: expected cash for the next 3 months from active packages and booked lessons, recurring costs and teacher pay
  due on the 1st to 5th; warns a month ahead when cash would fall under the reserve target.

### Resources (owner 2026-11-21)

Owner decision: "Resources" is not a domain of its own, because every domain has its resources. It is one read-only
page that reads from the other domains, plus rules in the FN-05 advisor. It stores nothing new. Super admin only.
Build after FN-04, FN-05 and the CRM lane.

### FN-13 Academy resources page
- Priority P2 · Zone 🟢 · Size M · Status todo · Depends on FN-02, FN-04, FN-08, the HR lane and the CRM lane
- Do: one admin page with five blocks, each linking to its own domain page: money (cash, reserve in months, net and
  its split, from FN-04 and FN-08); subscriptions and tools (cost, renewal date, unused for 60 days, from FN-02);
  teachers (available hours against booked hours per teacher and per subject, from availability and bookings);
  learners (active, package ending soon, stopped, from the CRM lane); content (lessons ready against lessons needed
  per track, from the curriculum catalog).
- First: search the existing admin pages and reports for these numbers and reuse their queries; add no table.
- Done when: every number on the page equals the number on its own domain page.

### FN-14 Capacity and usage rules for the advisor
- Priority P2 · Zone 🟢 · Size S · Status todo · Depends on FN-05 and FN-13
- Do: add rules to FN-05, same form (written threshold, shows its number, editable by the super admin): a teacher
  booked over 85% of available hours for 2 weeks (start hiring); a subject with learners and only one teacher (no
  cover); reserve over the target (amount free for marketing); a subscription unused for 60 days (cancel, saving per
  month); a track where learners will reach a lesson that is not ready within 4 weeks.

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
