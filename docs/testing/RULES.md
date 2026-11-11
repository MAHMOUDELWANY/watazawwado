# Pre-launch testing: binding rules

Owner decision, 2026-11-10. Applies to every testing session, whichever Claude account runs it.
Project briefs live in [projects/](projects/); read your brief after this file.

## Why
We are in production with no real users yet. Before launch we test the whole academy ourselves, as hard as a
stranger or an attacker would, so no family, teacher or payment is hurt after launch. Testing used to stall when
the owner switched Claude accounts, because worktrees have no `.env` and the setup lived in chat memory.
Everything a session needs is now written here.

## Role
Act as a senior software engineer, critic and analyst: workflows, design system, every expected and unexpected
scenario, then attacker mindset. Basics first, then raise the severity. Suggest any change, including a full
redesign of a screen or flow, with the reason.

## Environment (same for every account)
- **Code**: your worktree, rebased on `origin/main`.
- **Server**: `preview_start` name `qa-p<N>` (your project's entry in `.claude/launch.json`). It runs `server.ts`
  from the worktree with the main checkout's env files, `--env-file-if-exists=../../../.env.vercel` then
  `--env-file=../../../.env` (`.env` wins: its Stripe/Supabase keys are the local test ones; `.env.vercel` fills in
  Gemini, Brevo, Zoom, Google, cron, VAPID...), and forces `ALLOW_DEV_AUTH=true`, `NODE_ENV=development`,
  `VERCEL_ENV=development`, `PORT`/`APP_URL`/`GOOGLE_REDIRECT_URI` to the project port. Never read, print or copy
  `.env*`. If the main checkout has no `.env`, stop and tell the owner; do not invent values. `.env.vercel` comes
  from `npx vercel env pull .env.vercel --environment=production` in the main checkout (owner).
  Still empty locally (2026-11-10): `LESSON_ROOM_SECRET`, `NOTIFICATION_ADMIN_EMAIL` (optional, has a fallback),
  `LEARNER_SIGNUP_MODE` (unset = open), `VITE_TEACHER_AUTH_DIAGNOSTIC` (optional).
- **Specs** (P2): `e2e/*.api.spec.ts` drive the server and check the database, once (Playwright project `api`);
  every other spec runs on phone/desktop x Arabic/English. One worker only: all specs share the project's few QA
  accounts. `e2e/helpers.ts` has the tokens, free slots, `resetLearnerData()` and a per-call client address (the
  server limits each address to 10 calls a minute per route). `e2e/pages.spec.ts` opens every screen of every role
  and saves a screenshot of each in `qa-shots/pages/<project>/` (gitignored) for the design review.
- **One port per project**, because P2, P3 and P4 run at the same time: P1 3001, P2 3002, P3 3003, P4 3004,
  P5 3005. Run tests against it, never against another session's server.
  (Port 3000 stays free for the owner and for plain `npm test`.)
- HMR and file watching are off on `qa-p<N>` (parallel Vite servers fight over the HMR port): **restart the server
  (`preview_stop` + `preview_start`) after editing code**, or the browser keeps the old code.

## First steps in a brand-new worktree (exact commands)
```bash
cp ../../../package-lock.json . && npm ci        # package-lock.json is gitignored; the main checkout has one
npx playwright install chromium                   # once per machine
```
If `npm ci` says the lock file and `package.json` disagree, the main checkout's lock is older than `main`
(P2-001): copy the lock from the newest testing worktree instead, or run `npm install` here. Do this **before**
`preview_start`: a server started with no local `node_modules` resolves the main checkout's packages and then
fails to load pages once you install.
Then `preview_start` `qa-p<N>`, wait for `curl http://localhost:300N/api/health` to return `{"status":"ok"}`, and:
```bash
npx tsx scripts/qa/create-accounts.ts p<N>        # idempotent; needs the qa-p<N> server running
QA_PROJECT=p<N> npm run e2e                        # smoke: every role signs in (phone/desktop x ar/en)
PORT=300N npm test                                 # unit/API tests on your own port (starts its own server)
TEST_BASE_URL=http://localhost:300N npm run test-only   # same tests against a server you already run
npx tsx scripts/qa/purge.ts p<N>                  # dry run; add --yes to delete
```
- **Database**: the production Supabase project (`fmwxqyroyxgigvpahpri`). Owner allows test writes and deletes.
- **Live site** `watazawwado.academy`: read-only smoke checks only (open pages, read). No sign-up, no password, no
  attack traffic, no request loops (they trigger Vercel's challenge on the owner's IP). Everything else runs on
  your project's `localhost:300N`, which is the same code and the same database.
- **No Chrome** (owner, 2026-11-10): use the built-in browser pane and Playwright only. If a live-site check needs
  a signed-in account, ask the owner to sign in himself in the pane, then continue.
- **Payment**: do not pay. Go through checkout up to the Stripe/PayPal page and stop. Test paid-booking logic by
  calling the server, never by confirming from the client.

## Accounts
- Real QA accounts are made by `scripts/qa/` (built in P1). Never type a password anywhere: sessions are minted
  server-side with the service role and injected into the browser.
- `create-accounts.ts p<N>` makes, through the app's own API: `admin-1` (super_admin "QA Admin PN"; the only direct
  write, a `teacher_accounts` row, since the app has no API for a first admin), `teacher-1` (male "QA Ustadh PN") and
  `teacher-2` (female "QA Ustadha PN"), both added by the QA admin, licensed for all 8 subjects, agreement accepted,
  hours 06:00-23:00 Cairo every day; `student-1` (adult, 30, UK, Quran reading, teacher-1); `parent-1` (guardian 40,
  US, children "QA Kid PN" 8 girl / Quran reading / teacher-2 and "QA Teen PN" 14 boy / Zad / teacher-1).
- Sign in a role in the **browser pane**: `npx tsx scripts/qa/session.ts <qa-email>` prints a
  `localStorage.setItem(...)` snippet; open `http://localhost:300N/student/login` (any page of the app), run it with
  the javascript tool, it reloads signed in. Language is the `watazawwado_lang_chosen` cookie (`ar`/`en`), not
  localStorage. In **Playwright** use the `signInAs(role)` fixture from `e2e/fixtures.ts` (`lang` follows the project).
  `session.ts` refuses any email without `+qa-`.
- QA teachers are hidden from the live site (`listPublicTeachers` drops `+qa-` emails when
  `VERCEL_ENV=production`), so real families never see or get routed to them. Always pass a QA `teacherId` when a
  QA learner onboards, or routing picks a real teacher (P1-002).
- Email pattern: `mahmoudelwany98+qa-<project>-<role>-<n>@gmail.com` (for example `+qa-p2-student-1`). Display names
  start with `QA `. Emails do **not** arrive from a local server today: `.env.vercel` holds `[SENSITIVE]` instead of
  the Brevo, Zoom, Gemini, Google and VAPID secrets, and the Stripe test key in `.env` has expired (P2-001). Check the
  rows the server writes (reminders, `user_notifications`, `integration_jobs`) until the owner fills those in.
- Each project uses only its own `qa-<project>` accounts, so parallel sessions never touch each other's data.
- Cleanup: `scripts/qa/purge.ts <project|all>` deletes only accounts whose email contains `+qa-` and their rows
  (dry run by default, `--yes` deletes, then it prints what is left). It follows the live foreign keys: explicit
  deletes for RESTRICT / SET NULL / key-less tables (payments, package ledger and entitlements, referrals, credit,
  chat, notifications, teacher changes, CRM, placement, homework sets, honor, leads, waitlist, guardians, students,
  teacher_accounts), storage files (recitations, honor photos, teacher documents/photos), in-app notices naming a
  QA person, then the auth users (profiles, availability, preferences cascade). Not undone: events already sent to
  Google Calendar, Zoom, Stripe or Brevo. A child is deleted only if every guardian is a QA account.
  Never run `scripts/db_purge_accounts.ts` (it deletes every non-whitelisted account).
- Mock dev tokens (`dev-student-token` and the rest) are for quick UI looks only, never as proof a flow works.

## Coverage
- Every flow in [FLOWS.md](FLOWS.md) for every role (visitor, student, parent, teacher, super_admin).
- Phone (390x844) and desktop (1440x900); Arabic (RTL) and English.
- One flow row = its browser path + its API/unit tests + a review of the source files it touches. When you check a
  flow in the browser, run and review its code in the same pass, and update its row.

## Findings
- One file per project: `docs/testing/findings/<project>.md`.
- Each finding: id (`P2-014`), severity (Critical / High / Medium / Low / Idea), flow id, role, device + language,
  steps to reproduce, expected, actual, screenshot path, suspected file:line, proposed fix.
- Critical = money, data leak, someone acting as someone else, or a booking confirmed without payment.
- Screenshots go in `docs/testing/findings/shots/<project>/`.

## Fixing
- Fix Low/Medium bugs you are sure of in your own branch, with a test. Critical/High: write the finding first,
  then fix with a test that failed before the fix.
- Redesigns and product changes: propose only; the owner picks (see `docs/backlog/REVIEW-ISSUES.md`).
- RULES.md (root) still applies: payments gate bookings, server-side authority, migrations append-only via the
  `new-migration` skill, tsc + tests + build before pushing to `main`.
- Shared files (`api/index.ts`, `server/`, `src/components/ui/`): keep fixes small and commit often to cut merge
  conflicts with parallel sessions; rebase on `origin/main` before each push.

## Reporting
- Talk to the owner in Arabic; files stay English.
- End of each session: update the findings file and FLOWS.md, log in `docs/backlog/LOG.md`, purge your QA data
  unless the next project needs it, and send the owner the summary plus key screenshots.
