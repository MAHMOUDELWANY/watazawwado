# Overnight run, 2026-10-21

The owner is away (asleep). Instruction: finish the current task, then a careful security review of the recent
changes, then keep working the backlog. Reviews the owner would normally give are provisionally approved; stop only at
a decision that truly needs the owner (money/pricing rules, legal wording, anything in "Owner decisions needed").
Report at the end, with how to test each item. Update this file after every step so a usage reset loses nothing.

Hard limits for the run: no secrets read or printed, migrations append-only, no messages sent to real users, no
pricing/trial/cancellation changes, no `PLACEMENT_BEFORE_BOOKING` flip, curriculum content not published without the
owner, tests never weakened to pass.

## Plan (in order)

| # | Task | Zone | Status |
|---|------|------|--------|
| 0 | PU-02 conversion audit | 🟢 | done (1652807) |
| 1 | Security review of b850ad2..HEAD (code changes since the last security fix) | 🔴 | done (89463f0) |
| 2 | Fix confirmed security findings, with tests | 🔴 | done (89463f0, 2 migrations applied) |
| 3 | QA-01 e2e smoke tests for the money paths (local only) | 🟢 | done (no-write smoke; full e2e needs a test DB) |
| 4 | QA-02 accessibility audit | 🟢 | done |
| 5 | QA-03 RTL and bilingual sweep | 🟢 | done |
| 6 | QA-04 mobile break test (incl. footer links 20 px from PU-02) | 🟢 | done |
| 7 | PR-04 milestone celebration: plan, then build | 🟢 | done |
| 8 | P2 in order: PR-05, PR-08, PR-10, RN-04, RN-07, CRM-05, CRM-06, CRM-07, PA-03, PA-05, ST-02, ST-05, TE-03, AD-03, PU-03, PU-04, QA-05 | mixed | todo |
| 9 | P2 red-zone (PR-09 scheduled email, ST-06 privacy requests): build behind review, do not send anything | 🔴 | todo |

Each task: tsc, full `npm test`, build, commit, push to main, production smoke (`/api/health` + public pages), log in
`docs/backlog/LOG.md`, flip status in `BACKLOG.md`, then tick it here.

## Progress notes

- 2026-10-21: PU-02 done and live (header/sign-up tap targets 44 px, onboarding error scrolls into view).
- 2026-10-21: SEC-01 done. Teachers could read all payments and edit bookings/guardians/leads/etc. via Supabase REST; locked to super admin; one unescaped PostgREST filter fixed. Owner action: enable leaked password protection in Supabase Auth.
- 2026-10-21: QA-01 done as no-write smoke tests (13 tests). Local Stripe test key is expired: owner action.
- 2026-10-21: QA-02 done (focus trap everywhere, 28 unlabelled fields, dark-theme contrast, dead TeacherAuthModal removed).
- 2026-10-21: QA-03 done (logical sides in booking/packages/payments, bilingual aria labels, booking error banner).
- 2026-10-21: QA-04 done (44px targets public+portal+dashboard, dvh shells, guide button no longer covers hero CTA). P1 complete; next PR-04.
- 2026-10-21: PR-04 done (12 emblems, shelf, one-time age/season-aware celebration). Next: P2 list starting PR-05.
- 2026-10-21: PR-05 (lesson timeline + endpoint) and PR-10 (home progress card) done.
- 2026-10-21: PR-08 monthly report done. Next: PR-09 is red-zone (scheduled email) → after the green P2 list; next green: RN-04.
