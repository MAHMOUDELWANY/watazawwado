# Watazawwado: instructions for Antigravity agents (Gemini 4 Argon and others)

You are working on the live product of Watazawwado Academy: an online academy where a team of male and female
teachers gives 1-on-1 lessons (Quran, the Zad Path, languages) to English-speaking Muslim families in the West.
Production is https://watazawwado.academy. **Pushing to `main` deploys to real families within minutes.**

This file is the entry point for every non-Claude agent. Claude Code reads `CLAUDE.md`; you read this. Both point to
the same binding rules.

## 1. Read before any change (in this order)

1. `RULES.md`: binding owner decisions (booking, pricing, payments, teachers, language, tone). If code and RULES.md
   disagree, the code is wrong. Never invent an answer to an `[Open]` item.
2. `CLAUDE.md`: stack, commands and engineering rules. Everything in it applies to you, except the Claude-only tools
   (hooks, MCP names, `graphify` is optional for you).
3. `docs/argon/BACKLOG.md`: your task list. Work only on tasks from it unless the owner asks for something else.
4. `docs/STATUS.md`: what is live and what is next.
5. `docs/design-system.md` before any UI work.

## 2. Who owns what (until Claude's weekly reset, Friday 2026-10-23)

| Area | Owner |
|---|---|
| Curriculum (المنهج): `docs/curriculum/**`, `src/curriculum/**`, `public/curriculum/**`, the curriculum player and lesson content | **Claude only. Do not edit, not even a typo.** |
| Marketing content, Notion content calendar, `docs/marketing/**` | Claude only |
| Payments, Stripe webhook, refunds, pricing engine, booking RPCs, auth, RLS policies | You may work on them **only on a branch** (red zone, section 4); Claude reviews and merges |
| Everything else in `docs/argon/BACKLOG.md` | You |

If a task needs a curriculum or marketing change, stop, write it in `docs/argon/LOG.md` under "Needs Claude", and move on.

## 3. How to take and finish a task

1. Open `docs/argon/BACKLOG.md`, pick the highest-priority task whose status is `todo` and whose `Depends on` tasks are
   `done`. Change its status to `taken (<date> <short agent note>)` and commit that one-line change first, alone
   (`git pull --rebase` before and push right after), so other agents see it is taken. Never take a task that is
   already `taken`.
2. Create a branch: `argon/<task-id>-<slug>` (for example `argon/P-03-progress-path`).
3. Read the files the task lists, then the skills it lists (section 6). Plan in a few lines before editing.
4. Make the smallest complete change: callers, tests, types, both languages (Arabic and English), RTL, light and dark
   mode, mobile width (375px).
5. Verify, all of them, every time:
   - `node node_modules/typescript/bin/tsc --noEmit` (`npx tsc` does not work in this repo): zero new errors.
   - `npm test` (starts the dev server with `ALLOW_DEV_AUTH=true`, then runs `test/*.test.ts`). It must end with
     0 failures. A new feature gets a test; a changed feature gets its test updated.
   - `npm run build` succeeds.
   - UI tasks: open the page in the dev server (`npm run dev`, http://localhost:3000) in Arabic and English, light and
     dark, desktop and 375px, and look at it. Check the browser console for errors.
6. Finish according to the zone (section 4), then set the task status to `done (<commit sha>)` or
   `review (<branch>)` and add an entry to `docs/argon/LOG.md`.

If you are stuck for more than three attempts on the same error, stop, write what you tried in `docs/argon/LOG.md`
under "Blocked", set the task back to `todo`, and pick another task. Never leave the build or tests broken on `main`.

## 4. Zones: where your work goes

**Green zone → `main` (live).** UI, copy, layout, animation, accessibility, SEO, empty and loading states, new read-only
pages, new tests, docs, refactors without behaviour change, additive database changes (new table, new nullable
column, new index) with RLS. After all checks in step 5 pass: merge your branch into `main` (fast-forward or merge
commit, never force-push), `git pull --rebase`, re-run `tsc` and `npm test` if anything new came in, push. Then
smoke-test production: open https://watazawwado.academy in the browser (plain curl gets a 403 from the bot challenge)
and check the pages you changed.

**Red zone → branch only, Claude reviews on Friday.** Anything that touches money, booking rules, identity or existing
data:
- `server/payment/**`, `server/pricing/**`, the Stripe webhook, refunds, packages purchase, pay later;
- booking create/cancel/reschedule/hold logic, availability engine, trial rules, reminders schedule;
- auth, sessions, roles, `verifyTeacherAuth` / `verifyStudentAuth`, RLS policies, `SECURITY DEFINER` RPCs;
- a migration that alters or drops anything existing, backfills data, or changes an RPC;
- terms, privacy and any legal text (also bumps `TERMS_VERSION`, owner decision).
Push the branch, set the task to `review (<branch>)`, list the branch in `docs/argon/LOG.md` under "Waiting for Claude".
Do not merge it yourself.

When unsure which zone a change is in, it is red.

## 5. Hard rules (break one and the task is failed)

- **Never edit an existing file in `supabase/migrations/`.** It may already be applied in production. Schema changes
  are new files only, named `YYYYMMDDHHMMSS_short_name.sql` with a later timestamp than every existing file. Follow
  `.agents/skills/new-migration/SKILL.md` (header, RLS on every new table, function privileges, `search_path`).
  Update `src/types/database.ts` to match.
- **Applying migrations to production Supabase:** only green-zone (additive) migrations, only after the code that uses
  them passes tests, applied in the same release as the push. Never run `DELETE`, `UPDATE`, `DROP`, `TRUNCATE` or
  `ALTER ... DROP` against production. Never touch auth users or payments rows. Red-zone migrations wait for Claude.
- **Never read, print, edit or commit `.env*` files** (`.env.example` is the only exception). Never paste a key, token
  or password anywhere, including logs and commit messages.
- **Server-side authority.** Prices, availability, ownership and roles are computed on the server. Never trust amounts,
  IDs or roles from the request body. Paid bookings stay `pending` until payment is verified server-side.
- **Teachers never see money** (no prices, payments, refunds in anything a teacher can open).
- **Supabase query builders have no `.catch()`**: use `const { error } = await ...`.
- **Errors shown to users never leak database or provider messages.**
- **No new dependency** for something a few lines can do. Check `package.json` first. HeroUI (`@heroui/react`) is
  reference-only: never import it into existing pages, never add its full CSS (rules in `CLAUDE.md`).
- **UI components:** new or edited UI uses `src/components/ui/*` (Button, Input, Select, Textarea, Card, Badge, Modal).
- **Bilingual, RTL-first.** Default language is Arabic. Use logical CSS (`ms-`/`me-`/`ps-`/`pe-`/`start`/`end`), never
  `left`/`right`. Every user-facing string exists in Arabic and English (`src/lib/language.ts`).
- **The academy speaks, not one person.** Write "we", "our team", "your teacher". Never make Ustadh Mahmoud the
  platform in UI, emails or prompts (allowed: his own teacher card, the trader block in legal pages, data ids).
- **Only contact number:** WhatsApp +48 508 157 886. No other number anywhere.
- **No fake urgency, fake scarcity, fake testimonials or invented numbers.** Parents must feel this is a safe place.
- **Never force-push, never rewrite `main` history, never delete branches you did not create.**
- **Never commit with `--no-verify`.** `scripts/git-hooks/pre-commit` blocks edits to existing migrations and `.env*`
  files. If it is not active in your clone, run `git config core.hooksPath scripts/git-hooks` once.
- **Never create accounts or enter real credentials on the live site.** Test with the dev auth tokens locally
  (`dev-teacher-token` etc., only with `ALLOW_DEV_AUTH=true`).
- **Files you save in the repo are in English** (plans, docs, notes, commit messages). Arabic UI copy is content and
  stays Arabic. Talk to the owner in Arabic.

## 6. Skills (in `.agents/skills/`)

Read a skill's `SKILL.md` before the work it covers. The project skills mirrored from Claude's set:

| Work | Skills |
|---|---|
| Before any new feature or page | `brainstorming`, then `writing-plans`; `executing-plans` while building; `verification-before-completion` before saying done |
| Any UI (design, redesign, polish, audit) | `impeccable` first, then `taste-skill`, `soft-skill`, `minimalist-skill`, `redesign-skill`, `frontend-design` |
| Motion and feel | `apple-design` (important), `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-performance`, `emil-design-eng` |
| Mobile and edge cases | `mobile-native`, `break-ui` |
| Any user-facing text (site, emails) | `humanizer` (always), `copywriting`, `copy-editing` |
| Onboarding, retention, conversion | `onboarding`, `churn-prevention`, `cro`, `signup`, `emails` |
| Database | `new-migration` |
| SEO (bilingual site) | `seo`, `seo-page`, `seo-technical`, `seo-schema`, `seo-hreflang`, `seo-images`, `ai-seo` |
| Tests and code quality | `webapp-testing`, `test-guard`, `clean-code-guard`, `docs-guard` |

The other skills already in `.agents/skills/` (general engineering skills like `test-driven-development`,
`security-and-hardening`, `performance-optimization`) are useful too. The `curriculum-builder` and
`watazawwado-content` skills are intentionally **not** here: that work belongs to Claude.

The copies in `.agents/skills/` are local (git-ignored). If a listed skill is missing (fresh clone) or the project
skills changed, run `node scripts/sync-agent-skills.mjs`. Never edit the copies directly; edit `.claude/skills/` and
re-sync.

## 7. Stack in one screen

- Frontend: React 19, Vite 6, Tailwind 4, React Router 7, Motion, lucide-react. Public site `src/components`,
  `src/App.tsx`; student/parent portal `src/student`; teacher and admin dashboard `src/dashboard`.
- Backend: one Express router `api/index.ts` (~8.7k lines, all `/api/*`), deployed as one Vercel function. Domain logic
  in `server/` (`payment`, `pricing`, `intake`, `integrations`, `notifications`, `placement`, `routes`).
  `api/index.ts` is large and shared: keep edits small and local, add new routes in `server/routes/*` where possible.
- Database: Supabase Postgres. Schema only in `supabase/migrations/`; TS types in `src/types/database.ts`.
- Integrations: Stripe (PayPal inside Stripe Checkout), Google Calendar, Zoom, Brevo email, WhatsApp links, Gemini.
- Roles: `student`, `parent`, `teacher`, `super_admin`.

## 8. Reporting

Every finished, blocked or review task gets an entry in `docs/argon/LOG.md` (template inside). Keep it factual: what
changed, files, checks run with their result, what you did not check. Claude reads this log first on Friday.
