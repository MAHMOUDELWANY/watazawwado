---
name: WATAZAWWADO-release
description: Use when shipping, deploying, pushing to main, releasing, applying migrations to production, rolling back, or doing a production smoke check ("انشر", "ارفع", "deploy", "ship", "push", "release", "production", "rollback", "smoke test"). Our release chain under the owner's standing approval (RULES.md §7): tsc, tests, build, commit, push main, migrations to production Supabase, one smoke check, rollback plan. Never polls production.
---

# Watazawwado Release

Standing approval (owner, 2026-10-18, RULES.md §7): any code or database change that does not need the owner's review is committed, pushed to `main` (= production) after tsc + tests + build pass, with its migrations applied to production Supabase in the same release, then smoke-tested. **Curriculum content still stops for the owner's review.** There is no preview environment (Vercel variables are Production-only): `main` is production and the previous Vercel deployment is the rollback.

## 0. Stop conditions (do not release, tell the owner)

- Curriculum content (المنهج) not yet approved by the owner.
- Any red check below, or a failure you cannot explain. Never skip hooks, never use `--no-verify`.
- A change to a binding rule or price (RULES.md) the owner has not decided.
- `PLACEMENT_BEFORE_BOOKING` must stay as the owner set it (temporary test mode; only he decides when it turns off).
- A migration that drops or rewrites data. Show the owner first.
- Secrets in the diff (`.env*`, keys, tokens, QA passwords). Remove them.

## 1. Pre-flight

1. `git status`; make sure only intended files are changed. Rebase on `origin/main` (worktrees: `git fetch && git rebase origin/main`).
2. **Type check**: `node node_modules/typescript/bin/tsc --noEmit` (plain `npx tsc` does not resolve here).
3. **Tests**: `PORT=<free port> npm test` (starts its own dev server with `ALLOW_DEV_AUTH=true`; uses the real `.env`, so integration tests hit the configured Supabase project). A new feature has tests, a changed feature has its tests updated.
4. **Build**: `npm run build` (Vite + prerender + `build/server.cjs`).
5. **Every change also covers** (RULES.md §6b): SEO (titles, meta, headings, prerendered content, alt text), security (auth, validation, RLS, XSS/CSRF, rate limits), bugs (console, edge cases), and both languages and both directions for any text or layout.
6. If money or bookings were touched, `WATAZAWWADO-booking-payments` §5 (attacker pass) is done.
7. Run `graphify update .` after code changes.

Read each command's real output and exit code; claim "passes" only with that evidence.

## 2. Migrations (same release)

Created with `WATAZAWWADO-new-migration` only (existing files are immutable; a hook blocks edits). Order of operations:
1. Review the SQL: RLS on new tables, `SECURITY DEFINER` functions with a fixed `search_path` and privileges revoked from `public`/`anon`, idempotent where possible.
2. Apply to production Supabase (MCP `apply_migration` or the CLI) **before** the code that needs it is pushed, so the new code never meets the old schema.
3. Run the Supabase advisors afterwards (security and performance) and fix anything new.
4. Update `src/types/database.ts` types.
5. A rollback of the Vercel deployment does **not** roll back the database; for any destructive change keep the old shape working until the next release.

## 3. Ship

1. Commit with a clear message (English), ending with the attribution line the session gives.
2. Push to `main` (the main checkout, or a fast-forward from the worktree branch). Never force-push `main`.
3. Wait for the Vercel deployment to finish (Vercel MCP: deployment state and build logs; do not loop `curl` against production).
4. Log the release in `docs/backlog/LOG.md` and, if it finishes a backlog item, mark it in `docs/backlog/BACKLOG.md`.

## 4. One smoke check (production, read-only, no polling)

A single pass, not a loop (curl loops trigger Vercel's challenge on the owner's IP; production is `watazawwado.academy`):
- `GET /api/health` → `{"status":"ok"}`.
- Open the page(s) you changed in the browser pane; confirm the change is visible and the console is clean (Arabic and English if text changed).
- If a payment, booking or cron path changed: the **System health** page (`/dashboard/health`, super admin) rows are green or understood.
- Do not sign up, pay, or hit auth endpoints on production. Anything needing a signed-in check runs locally on the QA server.

## 5. When it is wrong

Follow `docs/launch-runbook.md` §3: roll back in Vercel (Deployments → last good → Promote / Instant Rollback; seconds), then tell the owner what broke. If the release included a migration, say so: the database stays as migrated, so decide a forward fix. Payments stuck pending: check Stripe and the webhook row; never confirm a paid lesson by hand without the Stripe charge; message the family from the academy WhatsApp.

## 6. Report (Arabic, short)

What shipped, which checks passed (with counts), whether a migration ran, the smoke result, and anything the owner must do (WhatsApp, Stripe, Supabase dashboard settings Claude cannot reach).
