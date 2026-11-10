# P1: Testing foundation

Run first, alone. Every other project depends on it. Suggested model: Opus 5.5, effort high.

Read first: `docs/testing/RULES.md`, root `RULES.md`, `CLAUDE.md`.

## Goal
Any session on any Claude account can start the server, get real QA accounts in every role, sign in without a
password, and wipe its data, from the repo alone.

## Build
1. **Server check.** Start `dev-worktree-env` from a fresh worktree; confirm `/api/health` and that the main
   checkout `.env` is read. Fix the launch config if it fails, and document the exact steps in RULES.md.
2. **`scripts/qa/create-accounts.ts <project>`**: with the service role, creates confirmed auth users (random
   password nobody types) and the matching rows for each role: student (adult), parent with 2 children (one kid,
   one teen), teacher (male, female, with availability), super_admin. Follow how the app itself creates each role
   (signup, intake, teacher invite, admin); do not bypass rules the real flow enforces. Idempotent.
3. **`scripts/qa/session.ts <email>`**: mints a real Supabase session server-side (admin `generateLink` +
   `verifyOtp`, or the equivalent) and prints a ready-to-paste localStorage snippet for key
   `sb-fmwxqyroyxgigvpahpri-auth-token`. Also export it as a function for Playwright.
4. **`scripts/qa/purge.ts <project|all>`**: deletes only `+qa-` accounts and every row that references them
   (bookings, payments, packages, homework, chat, notifications, CRM, curriculum progress...). Dry-run by default,
   `--yes` to delete. Find all referencing tables from `supabase/migrations/`; test it on one account first.
5. **Playwright** as a dev dependency (`@playwright/test`), `e2e/` folder, `playwright.config.ts` with projects
   for phone/desktop x ar/en, base URL `http://localhost:3000`, and a fixture that signs in a role via
   `session.ts`. One smoke spec per role proving sign-in works. Script: `npm run e2e`.
6. **`docs/testing/FLOWS.md`**: the inventory. Build it from the routes in `src/App.tsx`, `src/student`,
   `src/dashboard`, the endpoints in `api/index.ts`, `docs/owner-test-checklist.md` and `docs/workflows/`.
   Columns: id (`AUTH-01`, `BOOK-03`...), flow, roles, E2E spec, API/unit tests, source files, status
   (untested / pass / fail + finding id). Cover at least: sign-up and age rules, intake chat, free trial,
   paid booking up to checkout, packages and credits, discounts and referrals, reschedule/cancel/refund request,
   reminders, meetings (Zoom/Google), homework, recitations, chat and notifications, curriculum player and
   placement, community, teacher dashboard, admin CRM and actions, emails, language switch, legal pages.
7. **Update RULES.md** with anything you learned (exact commands), and add `npm run e2e` to CLAUDE.md commands.

## Done when
From a brand-new worktree: create accounts for `p1`, open the student portal, parent view, teacher dashboard and
admin as real users in the browser pane (screenshots), smoke specs pass, purge leaves zero `+qa-p1` rows.
tsc + `npm test` + build pass; committed and pushed to `main`.
