# Watazawwado

Watazawwado Academy: an online academy with a team of male and female teachers giving 1-on-1 lessons. Subjects (RULES.md §2b): Quran (reading, Tajweed, memorization & revision), the Zad Path (our own curriculum: Zad Essentials and Seerah, Kids / Teens / Adults), the Scholar's Path (classical-book courses, not defined yet), and languages (Fusha, Egyptian Arabic, English). Audience: English-speaking Muslim families in the West. Not a marketplace: each learner has a direct relationship with their own teacher; roles `student`, `parent`, `teacher`, `super_admin`.

**The project is not centred on one person** (owner, 2026-10-18). The academy speaks as "we"/"our team" (RULES.md §6b); every teacher, Ustadh Mahmoud included, is one teacher of the academy. Never write user-facing text, prompts or docs that make Mahmoud the platform. Legitimate exceptions: his own teacher card, the trader named in the legal pages, account emails and data ids.

**Binding owner decisions live in [RULES.md](RULES.md). Read it before any change to booking, pricing, payments, packages, teachers, language or tone; it overrides older docs (including `src/data/master_spec.ts`) where they disagree.** Background product vision: `src/data/master_spec.ts`.

**Curriculum (المنهج) work, any size, even a vague prompt: use the `curriculum-builder` skill.** Binding rules: [docs/curriculum/RULES.md](docs/curriculum/RULES.md); where we are, decisions and progress log: [docs/curriculum/PLAN.md](docs/curriculum/PLAN.md).

## Skills (use these first)

Owner's priority skills in `.claude/skills`. Reach for them before generic approaches, and always in curriculum work:
- Thinking/planning: `brainstorming` (before any new feature, page or lesson), `writing-plans`, `executing-plans`, `verification-before-completion`.
- Writing: `humanizer` on all user-facing copy (site, emails, curriculum); `writing-skills` when making skills.
- Design: `taste-skill`, `soft-skill`, `redesign-skill`, `minimalist-skill`, `output-skill`, `impeccable` (design/audit/polish commands for any UI).
- Motion and feel (Emil Kowalski's set, MIT), for the whole site and the curriculum alongside the design skills above: `apple-design` (important), `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-performance`, `mobile-native`, `break-ui`, `emil-design-eng`. Also present but off-stack: `animate-expo`, `write-swift`, `ask-sonner`.
- SEO: the `seo` hub and `seo-*` leaves (bilingual site, so `seo-hreflang` matters). Their Python helpers live in `.claude/skills/seo/scripts` and need Python plus its requirements; the guidance works without them.

## Stack

- **Frontend**: React 19, Vite 6, Tailwind 4, React Router 7, Motion, lucide-react. Bilingual Arabic/English (`src/lib/language.ts`, default `ar`, so RTL matters).
  - Public site: `src/components`, `src/App.tsx`
  - Student portal: `src/student`
  - Teacher dashboard: `src/dashboard`
- **Backend**: one Express router in `api/index.ts` (~8.7k lines, all `/api/*` routes). Deployed as a single Vercel function (`vercel.json` rewrites `/api/*` → `api/index`). Domain logic lives in `server/` (`payment`, `pricing`, `intake`, `integrations`, `notifications`).
- **Database**: Supabase Postgres. Schema is only in `supabase/migrations/`; TS types in `src/types/database.ts`. Critical writes go through `SECURITY DEFINER` RPCs (`create_booking_atomic`, `verify_payment_atomic`, ...).
- **Integrations**: Stripe + PayPal, Google Calendar, Zoom, Brevo email, WhatsApp, Gemini (`@google/genai`) for the AI intake chat and learning guide. Reminders are sent by an external HTTP cron authenticated with `CRON_SECRET`.

## Commands

- `npm run dev` — Express + Vite middleware on http://localhost:3000 (`server.ts`). Dev auth tokens (`dev-teacher-token`, etc.) only work with `ALLOW_DEV_AUTH=true`, never on a production deployment.
- `npm test` — starts the dev server (with `ALLOW_DEV_AUTH=true`), then runs `test/*.test.ts`. It uses the real `.env`, so integration tests hit the configured Supabase project. Use `npm run test-only` when the server is already running.
- `npm run build` — Vite build + esbuild bundle of `server.ts` to `build/server.cjs` (kept out of `dist/`, which is served publicly).
- Type check: `node node_modules/typescript/bin/tsc --noEmit` (`npx tsc` does not resolve in this repo). A Stop hook reports type errors in files you changed.

## Rules

- **Payments gate bookings.** Regular paid bookings stay `pending` until payment is verified server-side; free trials and package-credit redemptions confirm immediately. Never confirm a paid booking from client input.
- **Server-side authority.** Prices, availability, and ownership are computed on the server (`server/pricing`, `availabilityEngine.ts`, `verifyTeacherAuth` / `verifyStudentAuth`). Don't trust amounts or IDs from the request body.
- **Migrations are append-only.** Existing files in `supabase/migrations/` may be applied in production; a hook blocks edits. Use the `new-migration` skill for any schema change.
- **Secrets.** Never read, print, or edit `.env*` (a hook blocks edits). `.env.example` lists the variable names.
- **UI components.** New or edited UI uses `src/components/ui/*` (Button, Input, Select, Textarea, Card, Badge, Modal). Move a page to them when you change it; no mass rewrite.
- **HeroUI v3 is a reference library, not part of the current site** (owner, 2026-10-17). `@heroui/react` + `@heroui/styles` are installed but imported nowhere. Never change existing pages or components to use it, and never add its CSS globally. For new UI/UX work from now on, look at HeroUI first (API via the `heroui-react` MCP in `.mcp.json`, not memory): if one of its components or patterns is better than what you would build, use it or take the idea. When you first use a component, import its CSS selectively in `src/index.css` (`@import "@heroui/styles/utilities"; @import "@heroui/styles/variants"; @import "@heroui/styles/themes/default" layer(theme);` once, then `@import "@heroui/styles/components/<name>.css" layer(components);` per component, never the full `@heroui/styles`, which doubles the CSS), and check that existing pages look unchanged. It reads our `--accent`/`--background`/`--border` tokens; HeroUI-only tokens like `--default` need mapping to the brand. (`npx heroui-cli` is the v2 tool and does not apply.)
- **Supabase query builders have no `.catch()`.** Use `const { error } = await ...` instead.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
