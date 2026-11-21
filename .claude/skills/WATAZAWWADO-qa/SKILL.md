---
name: WATAZAWWADO-qa
description: Use for ANY testing, QA, bug hunt, E2E, UX review, security probing, "test this", "اختبر", "جرّب", "فيه بج؟", "review this flow", before launch or after a change. Runs our pre-launch testing protocol: the qa-p<N> server, +qa- accounts, Playwright, phone/desktop x Arabic/English, finding format and severity, cleanup. Read docs/testing/RULES.md through this skill so the setup is identical on every Claude account.
---

# Watazawwado QA

The binding rules are `docs/testing/RULES.md`; your project brief is in `docs/testing/projects/`; every flow is a row in `docs/testing/FLOWS.md`; findings go to `docs/testing/findings/<project>.md`. This skill is how to run a session so nothing is skipped and nothing real is touched.

## 0. Absolute limits

- Never read, print or copy `.env*`. If the main checkout has no `.env`, stop and tell the owner.
- Never type or ask for a password. Sessions are minted by `scripts/qa/session.ts` for `+qa-` emails only.
- Never pay. Go to the Stripe/PayPal page and stop; test paid logic by calling the server.
- Live site `watazawwado.academy`: read-only smoke only (open, read). No sign-up, no attack traffic, **no request loops** (they trigger Vercel's challenge on the owner's IP).
- Never run `scripts/db_purge_accounts.ts`. Cleanup is `scripts/qa/purge.ts` (dry run, then `--yes`).
- No Chrome extension: the built-in browser pane and Playwright only.
- Local servers run on your own port: P1 3001, P2 3002, P3 3003, P4 3004, P5 3005 (3000 is the owner's).

## 1. Start a session

1. Read `docs/testing/RULES.md`, your brief, the findings file so far, and the FLOWS rows you own.
2. Worktree on `origin/main`. First time only: `cp ../../../package-lock.json . && npm ci`, then `npx playwright install chromium`. Do this **before** `preview_start`.
3. `preview_start` `qa-p<N>`; wait for `/api/health` to answer `{"status":"ok"}`.
4. `npx tsx scripts/qa/create-accounts.ts p<N>` (idempotent): admin, 2 teachers, student, parent with 2 children. Sign in a role in the browser pane with `scripts/qa/session.ts <qa-email>` and the javascript snippet it prints; language is the `watazawwado_lang_chosen` cookie.
5. Smoke: `QA_PROJECT=p<N> npm run e2e`; unit/API: stop the preview server, then `PORT=300N npm test` (not `test-only` against a running qa server).
6. HMR is off on qa servers: **restart the server after every code edit** or the browser shows old code.

## 2. How to test (method)

**Recon before action** (from the strongest external browser-testing method): load the page, wait for it to settle, take a screenshot and read the accessibility tree/DOM, find the real selectors, *then* click. Never guess selectors. Re-check after each navigation.

For each flow row, in this order:
1. **Basics**: the happy path as each role that can reach it (visitor, student, parent, teacher, super_admin).
2. **Matrix**: phone 390x844 and desktop 1440x900 × Arabic (RTL) and English. Check mirrored layout, numbers LTR, no clipped text, no horizontal scroll, 44px targets, focus visible, dark mode, reduced motion.
3. **Unexpected input**: empty, too long, emoji, RTL/LTR mix, double click, back button, refresh mid-flow, two tabs, expired session, offline, slow network.
4. **Rules**: the exact boundary of each time/number rule (cancel at 3 h ± 1 min, reschedule at 1 h, trial limits, age 18 and 6 to 17, refund limit 3, same-day refusal).
5. **Attacker mindset**: change ids, prices, roles in requests; call another role's route; skip a step; replay; race two requests; XSS in every free-text field; check RLS through the API; check that errors leak nothing; check rate limits (10 calls/min/route). Money and permission issues are Critical.
6. **Code review of the same flow** in the same pass: read the files it touches and update the FLOWS row (browser path + API/unit tests + source reviewed).
7. **Design review** with screenshots (`e2e/pages.spec.ts` saves every screen of every role to `qa-shots/pages/<project>/`): hierarchy, consistency with `WATAZAWWADO-design-system`, wording per `WATAZAWWADO-brand-voice`.

Emails do not arrive from a local server; check the rows the server writes (`user_notifications`, reminders, `integration_jobs`) instead. Pass a QA `teacherId` whenever a QA learner onboards, or routing may pick a real teacher.

## 3. Findings

One entry per issue, in the project file: id (`P2-014`), severity, flow id, role, device + language, steps, expected, actual, screenshot (`docs/testing/findings/shots/<project>/`), suspected `file:line`, proposed fix.

- **Critical**: money, data leak, acting as someone else, booking confirmed without payment.
- **High**: a core flow blocked or wrong for a role. **Medium**: wrong but with a workaround. **Low**: polish. **Idea**: product or design suggestion (propose only; owner picks; collect in `docs/backlog/REVIEW-ISSUES.md`).

## 4. Fixing

- Low/Medium you are sure of: fix in your branch with a test.
- Critical/High: write the finding first, then fix with a test that **failed before** the fix. A fix without a failing-first test is not proven.
- Redesigns and product changes: propose, do not build.
- Shared files (`api/index.ts`, `server/`, `src/components/ui/`): small commits, rebase on `origin/main` before each push.

## 5. Finish (all of it, in this order)

1. Run the full verification fresh (`tsc`, `PORT=300N npm test`, e2e smoke) and read the output; claim only what the output shows. Report failures plainly.
2. Update the findings file and FLOWS.md; add a line to `docs/backlog/LOG.md`.
3. `npx tsx scripts/qa/purge.ts p<N>` dry run, then `--yes` unless the next project needs the data. Events already sent to Google, Zoom, Stripe or Brevo are not undone.
4. Tell the owner in Arabic: what was tested, the Critical/High findings first, key screenshots, what needs his decision. Files stay English.
