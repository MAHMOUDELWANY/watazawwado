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
- **Server**: `preview_start` name `dev-worktree-env`. It runs `server.ts` from the worktree with
  `--env-file=../../../.env` (the main checkout's `.env`) and `ALLOW_DEV_AUTH=true`. Never read, print or copy `.env`.
  If the main checkout has no `.env`, stop and tell the owner; do not invent values.
- **Database**: the production Supabase project (`fmwxqyroyxgigvpahpri`). Owner allows test writes and deletes.
- **Live site** `watazawwado.academy`: read-only smoke checks only (open pages, read). No sign-up, no password, no
  attack traffic, no request loops (they trigger Vercel's challenge on the owner's IP). Everything else runs on
  `localhost:3000`, which is the same code and the same database.
- **Payment**: do not pay. Go through checkout up to the Stripe/PayPal page and stop. Test paid-booking logic by
  calling the server, never by confirming from the client.

## Accounts
- Real QA accounts are made by `scripts/qa/` (built in P1). Never type a password anywhere: sessions are minted
  server-side with the service role and injected into the browser.
- Email pattern: `mahmoudelwany98+qa-<project>-<role>-<n>@gmail.com` (for example `+qa-p2-student-1`). Emails really
  arrive, so a session can check them with the Gmail tools. Display names start with `QA `.
- Each project uses only its own `qa-<project>` accounts, so parallel sessions never touch each other's data.
- Cleanup: `scripts/qa/purge.ts <project|all>` deletes only accounts whose email contains `+qa-` and their rows.
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
