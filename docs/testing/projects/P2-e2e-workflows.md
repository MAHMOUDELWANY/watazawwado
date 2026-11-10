# P2: End-to-end workflows (front + back together)

After P1. Can run in parallel with P3 and P4. Suggested model: Opus 5.5, effort high.

Read first: `docs/testing/RULES.md`, `docs/testing/FLOWS.md`, root `RULES.md`. QA accounts: `qa-p2`.

## Goal
Every flow in FLOWS.md works for every role it serves, on phone and desktop, in Arabic and English, and the
database ends in the right state. Basics first, then edge cases.

## How
1. For each flow, in FLOWS.md order: write a Playwright spec in `e2e/` that drives the real UI and then checks
   the database (via the service role) and emails (Gmail tools, `+qa-p2` inbox) for the expected result.
2. In the same pass, run that flow's API tests and read its source files. Note gaps for P3 in the row.
3. Then break it like a real user would: back button mid-flow, double-click submit, two tabs, refresh during
   checkout, slow network, wrong timezone, daylight-saving week, expired session, switching language mid-flow,
   a parent booking for the wrong child, booking the last free slot from two accounts at once.
4. Checkout: go to the Stripe/PayPal page and stop. Then verify the booking stays `pending`, the slot hold
   expires, abandoned checkout is handled, and nothing confirms without server-side verification.
5. Emails and notifications: right person, right language, right time zone, links work.
6. Look at every screen against `docs/design-system.md` and `docs/ux/`: tokens, spacing, RTL mirroring,
   text overflow in Arabic, empty/loading/error states, focus and keyboard use. Log design issues as findings too.

## Output
`e2e/` specs (kept, runnable with `npm run e2e`), FLOWS.md statuses, `docs/testing/findings/P2.md`,
screenshots. Fixes per RULES.md.

## Done when
Every FLOWS.md row has a spec and a status; all Critical/High fixed or waiting for the owner; summary sent.
