# Watazawwado

Watazawwado Academy: an online academy with a team of male and female teachers giving 1-on-1 lessons. Subjects (RULES.md §2b): Quran (reading, Tajweed, memorization & revision), the Zad Path (our own curriculum: Zad Essentials and Seerah, Kids / Teens / Adults), the Scholar's Path (classical-book courses, not defined yet), and languages (Fusha, Egyptian Arabic, English). Audience: English-speaking Muslim families in the West. Not a marketplace: each learner has a direct relationship with their own teacher; roles `student`, `parent`, `teacher`, `super_admin`.

**The project is not centred on one person** (owner, 2026-10-18). The academy speaks as "we"/"our team" (RULES.md §6b); every teacher, Ustadh Mahmoud included, is one teacher of the academy. Never write user-facing text, prompts or docs that make Mahmoud the platform. Legitimate exceptions: his own teacher card, the trader named in the legal pages, account emails and data ids.

**Binding owner decisions live in [RULES.md](RULES.md). Read it before any change to booking, pricing, payments, packages, teachers, language or tone; it overrides older docs (including `src/data/master_spec.ts`) where they disagree.** Background product vision: `src/data/master_spec.ts`.

**New account or session? Read [docs/curriculum/HANDOFF-2026-11-03.md](docs/curriculum/HANDOFF-2026-11-03.md) first** (current task: every level started, placement from the curriculum; older context in HANDOFF-2026-10-26.md).

**Curriculum (المنهج) work, any size, even a vague prompt: use the `WATAZAWWADO-curriculum-builder` skill.** Binding rules: [docs/curriculum/RULES.md](docs/curriculum/RULES.md); where we are, decisions and progress log: [docs/curriculum/PLAN.md](docs/curriculum/PLAN.md).

**Curriculum review (any audit, critique or "where are we in the review"): use the `WATAZAWWADO-curriculum-review` skill.** State of every review run, decisions and what waits for the owner: [docs/curriculum/reviews/README.md](docs/curriculum/reviews/README.md). A run always covers several consecutive lessons and is committed to `main` phase by phase.

**Social media, video and marketing content, any size: use the `WATAZAWWADO-content` skill.** Plan: [docs/marketing/PLAN.md](docs/marketing/PLAN.md); binding content rules: [docs/marketing/RULES.md](docs/marketing/RULES.md); shared context for the marketing skills: `.claude/product-marketing.md`.

**Pre-launch backlog:** [docs/backlog/BACKLOG.md](docs/backlog/BACKLOG.md) (order of work at the top); log each finished task in [docs/backlog/LOG.md](docs/backlog/LOG.md). Claude does all of it (owner, 2026-10-20).

**Pre-launch testing (any test, QA, E2E, UX review or security work): read [docs/testing/RULES.md](docs/testing/RULES.md) first**, then your brief in `docs/testing/projects/`. It fixes the server, QA accounts and cleanup so testing works the same on every Claude account.

## Our skills: `WATAZAWWADO-…` (19, owner 2026-11-15)

Every skill we own starts with `WATAZAWWADO-`, so the list is the count. **Before creating a skill, check this list and `ls .claude/skills | grep WATAZAWWADO`; extend an existing one if it fits.** Outside skills below are tools these call, never a replacement for them.

| Area | Skills |
|---|---|
| Words and look | `WATAZAWWADO-brand-voice` (any user-facing text, EN/AR), `WATAZAWWADO-design-system` (any UI), `WATAZAWWADO-parent-comms` (emails, WhatsApp, notifications) |
| Product and money | `WATAZAWWADO-booking-payments` (bookings, prices, refunds), `WATAZAWWADO-teacher-ops` (teachers, pay, dashboard), `WATAZAWWADO-new-migration` (schema) |
| Quality and shipping | `WATAZAWWADO-qa` (testing), `WATAZAWWADO-release` (deploy), `WATAZAWWADO-islamic-content-check` (verses, hadith, Tajweed), `WATAZAWWADO-seo-bilingual` (SEO) |
| Curriculum | `WATAZAWWADO-curriculum-builder`, `WATAZAWWADO-curriculum-review` |
| Marketing | `WATAZAWWADO-content` (social, video), `WATAZAWWADO-marketing` (strategy), `WATAZAWWADO-video-generator` (promo video), `WATAZAWWADO-mahmoud-voice` (on-camera scripts) |
| Work management | `WATAZAWWADO-backlog` (BACKLOG/LOG), `WATAZAWWADO-handoff` (session handover), `WATAZAWWADO-review-issues` (owner's review list) |

## Nothing stays only on your machine (owner, 2026-11-21)

Work agreed with the owner must never live only in one session, one account or an unmerged branch. On 2026-11-15 a set of 12 new skills was committed to a side branch and never reached `main`, so later sessions could not see it. To prevent that:

- **Anything discussed, approved and built reaches `main`** (skills, docs, rules, code, config): commit, push, and merge to `main` in the same session. Finished work is never left on a side branch, in a worktree or uncommitted.
- **Unfinished work gets a handoff, not silence.** Before a session ends or hits a limit, commit what exists and write or update a handoff (`WATAZAWWADO-handoff` skill; see `docs/STATUS.md`) saying what is done, what is not, and which branch holds it. If the branch cannot go to `main` yet, the handoff on `main` must name it.
- **Never tell the owner something is "done" until `git branch --contains <commit>` lists `main`.** Say "on branch X, not on main" otherwise.
- **Start of every session:** run `git fetch && git branch -a --no-merged main` and `git status --short`. Unmerged branches with owner-approved work get merged or reported before new work starts.
- **Use a temporary worktree to merge** when the main checkout has uncommitted edits; never `git checkout -- .` there.

## Skills (use these first)

Owner's priority skills in `.claude/skills`. Reach for them before generic approaches, and always in curriculum work:
- Thinking/planning: `brainstorming` (before any new feature, page or lesson), `writing-plans`, `executing-plans`, `verification-before-completion`.
- Writing: `humanizer` on all user-facing copy (site, emails, curriculum); `writing-skills` when making skills.
- Design: `taste-skill`, `soft-skill`, `redesign-skill`, `minimalist-skill`, `output-skill`, `impeccable` (design/audit/polish commands for any UI).
- Motion and feel (Emil Kowalski's set, MIT), for the whole site and the curriculum alongside the design skills above: `apple-design` (important), `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-performance`, `mobile-native`, `break-ui`, `emil-design-eng`. Also present but off-stack: `animate-expo`, `write-swift`, `ask-sonner`.
- Marketing and social media (MIT, installed 2026-10-19 from coreyhaines31/marketingskills and charlie947/social-media-skills): `content-strategy`, `social`, `video`, `copywriting`, `lead-magnets`, `emails`, `hook-generator`, `reels-scripting`, `youtube-thumbnail`, `content-matrix`, `niche-research` and more; always through `WATAZAWWADO-content`.
- SEO: the `seo` hub and `seo-*` leaves (bilingual site, so `seo-hreflang` matters). Their Python helpers live in `.claude/skills/seo/scripts` and need Python plus its requirements; the guidance works without them.

## Stack

- **Frontend**: React 19, Vite 6, Tailwind 4, React Router 7, Motion, lucide-react. Bilingual Arabic/English (`src/lib/language.ts`, default `ar`, so RTL matters).
  - Public site: `src/components`, `src/App.tsx`
  - Student portal: `src/student`
  - Teacher dashboard: `src/dashboard`
- **Backend**: one Express router in `api/index.ts` (~10.5k lines, all `/api/*` routes). Deployed as a single Vercel function (`vercel.json` rewrites `/api/*` → `api/index`). Domain logic lives in `server/` (`payment`, `pricing`, `intake`, `integrations`, `notifications`).
- **Database**: Supabase Postgres. Schema is only in `supabase/migrations/`; TS types in `src/types/database.ts`. Critical writes go through `SECURITY DEFINER` RPCs (`create_booking_atomic`, `verify_payment_atomic`, ...).
- **Integrations**: Stripe + PayPal, Google Calendar, Zoom, Brevo email, WhatsApp, Gemini (`@google/genai`) for the AI intake chat and learning guide. Reminders are sent by an external HTTP cron authenticated with `CRON_SECRET`.

## Commands

- `npm run dev` — Express + Vite middleware on http://localhost:3000 (`server.ts`). Dev auth tokens (`dev-teacher-token`, etc.) only work with `ALLOW_DEV_AUTH=true`, never on a production deployment.
- `npm test` — starts the dev server (with `ALLOW_DEV_AUTH=true`), then runs `test/*.test.ts`. It uses the real `.env`, so integration tests hit the configured Supabase project. Use `npm run test-only` when the server is already running.
- `npm run e2e` — Playwright smoke specs in `e2e/` against a running `qa-p<N>` server (`QA_PROJECT=p2 npm run e2e`), signed in as real QA accounts from `scripts/qa/create-accounts.ts`. `PORT=3002 npm test` runs the unit/API tests on another port. Setup and accounts: docs/testing/RULES.md.
- `npm run build` — Vite build + esbuild bundle of `server.ts` to `build/server.cjs` (kept out of `dist/`, which is served publicly).
- Type check: `node node_modules/typescript/bin/tsc --noEmit` (`npx tsc` does not resolve in this repo). A Stop hook reports type errors in files you changed.

## Rules

- **Payments gate bookings.** Regular paid bookings stay `pending` until payment is verified server-side; free trials and package-credit redemptions confirm immediately. Never confirm a paid booking from client input.
- **Server-side authority.** Prices, availability, and ownership are computed on the server (`server/pricing`, `availabilityEngine.ts`, `verifyTeacherAuth` / `verifyStudentAuth`). Don't trust amounts or IDs from the request body.
- **Owner's standing approval (2026-10-18, RULES.md §7):** for any code or database change that does not need review, don't ask: commit, push to `main` after tsc + tests + build pass, apply migrations to production Supabase in the same release, then smoke-test production. Only curriculum content waits for the owner's review.
- **Migrations are append-only.** Existing files in `supabase/migrations/` may be applied in production; a hook blocks edits. Use the `WATAZAWWADO-new-migration` skill for any schema change.
- **Secrets.** Never read, print, or edit `.env*` (a hook blocks edits). `.env.example` lists the variable names.
- **Project files in English** (owner, 2026-10-18, RULES.md §7). Plans, rules, docs and briefs saved in the repo are written
  in English; talk to the owner in Arabic. Arabic UI copy and Arabic teacher notes are content and stay Arabic.
- **UI components.** New or edited UI uses `src/components/ui/*` (Button, Input, Select, Textarea, Card, Badge, Modal). Move a page to them when you change it; no mass rewrite.
- **HeroUI v3 is a reference library, not part of the current site** (owner, 2026-10-17). `@heroui/react` + `@heroui/styles` are installed but imported nowhere. Never change existing pages or components to use it, and never add its CSS globally. For new UI/UX work, look at HeroUI first (API via the `heroui-react` MCP in `.mcp.json`, not memory): if one of its components or patterns is better than what you would build, use it or take the idea. When you first use a component, import its CSS selectively in `src/index.css` (`@import "@heroui/styles/utilities"; @import "@heroui/styles/variants"; @import "@heroui/styles/themes/default" layer(theme);` once, then `@import "@heroui/styles/components/<name>.css" layer(components);` per component, never the full `@heroui/styles`, which doubles the CSS), and check that existing pages look unchanged. It reads our `--accent`/`--background`/`--border` tokens; HeroUI-only tokens like `--default` need mapping to the brand. (`npx heroui-cli` is the v2 tool and does not apply.)
- **Supabase query builders have no `.catch()`.** Use `const { error } = await ...` instead.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
