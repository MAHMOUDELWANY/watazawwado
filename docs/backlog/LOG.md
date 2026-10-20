# Backlog progress log

One entry per finished task, newest first: result, files changed, checks run, what was not checked.

## Done

### OPS-01..05 Launch operations: error capture, health page, cron heartbeat, runbook, placement reminder (2026-10-20)
- Result: done (merged to main 2026-10-20)
- Changed: `server/routes/ops.ts` (`POST /api/client-errors` rate limited 10/min/IP, `GET/DELETE /api/dashboard/app-errors`, `GET /api/dashboard/health`, API 5xx monitor, heartbeats), `api/index.ts` (wiring; heartbeat on each successful reminder-cron run and each signed Stripe webhook), `src/lib/errorReporter.ts` + `src/main.tsx` + `src/components/ErrorBoundary.tsx` (window errors, unhandled rejections, render errors), `src/dashboard/pages/HealthPage.tsx` + `DashboardApp.tsx` (`/dashboard/health`, super admin only, placement test mode banner), `src/types/database.ts`, `docs/launch-runbook.md`, `test/ops.test.ts`
- Migration: `20261020000000_ops_monitoring.sql` (`app_errors` grouped by fingerprint, `record_app_error` RPC, `ops_heartbeats`), applied to production 2026-10-20 (verified: RPC write, read and heartbeat table work with the service key).
- Checks: tsc pass, npm test 1056 pass / 0 fail (5 skipped), build pass. Errors are scrubbed (no query strings, emails or JWTs) and only the account id is kept.
- Not checked / risks: the health page was not opened in a browser (needs a real admin session). The free uptime monitor needs a Vercel Firewall bypass rule for `/api/health` (runbook §2, owner step).


### PR-07 Progress for parents: all children at a glance (2026-10-20)
- Result: done (8eb5c72 on main, merge dbec55e)
- Changed: `server/routes/progress.ts` (`buildFamilyChildOverviewCard`, `isGuardianAccount` + `childrenOverview` on `GET /api/student/progress`), `src/student/pages/StudentProgressPage.tsx` (family overview cards, last-opened child in localStorage, dev `?preview=family` fixture), `src/student/StudentApp.tsx` (dev-only bypass of the auth gate for `/student/progress?preview=...`, guarded by `import.meta.env.DEV`), `test/pr-07-parent-family-view.test.ts`, `docs/backlog/screenshots/pr07-family-ar-light.png`, `docs/backlog/screenshots/pr07-family-en-mobile.png`
- Migration: none
- Checks: tsc pass (0 errors), npm test 1050 pass / 0 fail (5 skipped), build pass, browser check `/student/progress?preview=family` in Arabic light desktop (1440px) and English dark mobile (375px); tapping a child card stores it as last opened; 0 console errors. Screenshots: `docs/backlog/screenshots/pr07-family-ar-light.png`, `docs/backlog/screenshots/pr07-family-en-mobile.png`
- Not checked / risks: Not tested against a real guardian account (no Supabase connection here). Without `?learnerId=`, the API still returns the primary learner's path (the PR-02 contract); the page then opens the remembered child, if there is one. Arabic dark and English light were not captured as screenshots.

### PR-06 Teacher side: record the family summary and milestones after a lesson (2026-10-20)
- Result: done (87ade22 on main)
- Changed: `server/routes/progress.ts`, `api/index.ts`, `src/dashboard/components/PostLessonSummaryEditor.tsx`, `src/dashboard/components/LessonDetailModal.tsx`, `src/dashboard/pages/TodayPage.tsx`, `src/dashboard/pages/StudentDetailPage.tsx`, `src/dashboard/types.ts`, `test/pr-06-teacher-family-summary.test.ts`, `docs/backlog/screenshots/pr06-teacher-summary-ar.png`, `docs/backlog/screenshots/pr06-teacher-summary-en-mobile.png`
- Migration: none (uses live `lesson_notes.family_summary`, `lesson_notes.achievements`, and `learner_milestones`)
- Checks: tsc pass (0 errors), npm test 1046 pass / 0 fail, build pass, browser check `/dashboard/students/:id` verified in Arabic & English, light & dark themes, desktop (1280px) & mobile (375px) (0 console errors; screenshots in `docs/backlog/screenshots/pr06-teacher-summary-ar.png` and `docs/backlog/screenshots/pr06-teacher-summary-en-mobile.png`)
- Not checked / risks: Jalila AI summary drafting is intentionally deferred per task spec.

### PR-03 Progress page: the learning path (2026-10-19)
- Result: done (dc58c80 on main)
- Changed: `src/student/pages/StudentProgressPage.tsx`, `src/student/StudentApp.tsx`, `test/pr-03-progress-page.test.ts`, `docs/backlog/screenshots/pr03-*.png`
- Migration: none
- Checks: tsc pass (0 errors), npm test 1043 pass / 0 fail, build pass, browser check `/student/progress` verified in Arabic & English, light & dark themes, desktop (1280px) & mobile (375px) + zero-lesson empty state (0 console errors; screenshots in `docs/backlog/screenshots/pr03-desktop-ar-path-scrolled.png`, `docs/backlog/screenshots/pr03-desktop-en-dark.png`, `docs/backlog/screenshots/pr03-mobile-375-ar-path-scrolled.png`, `docs/backlog/screenshots/pr03-mobile-375-en-dark.png`)
- Not checked / risks: Auto-scroll to `[data-current-level="true"]` verified in headless Chromium; family overview grid for multi-child guardian accounts is scheduled in PR-07 (currently uses learner switcher pills).

### PR-02 Progress API (read model) (2026-10-19)
- Result: done (27df92a on main)
- Changed: `server/routes/progress.ts`, `test/pr-02-progress-api.test.ts`
- Migration: none
- Checks: tsc pass (0 errors), npm test 1039 pass / 0 fail, build pass, browser check N/A (backend API task)
- Not checked / risks: Smoke-tested locally with dev student/guardian/foreign tokens and zero-lesson student fixture; relies on PR-01 migration (`learner_milestones` and `lesson_notes` columns) already applied to production by Claude.

### PR-01 Progress data model: shared lesson summaries and milestones (2026-10-19)
- Result: done (b7b5060 on main)
- Changed: `supabase/migrations/20261019000000_learner_progress_summaries_milestones.sql`, `src/types/database.ts`, `server/routes/progress.ts`, `api/index.ts`, `test/pr-01-progress-data-model.test.ts`
- Migration: `supabase/migrations/20261019000000_learner_progress_summaries_milestones.sql`, applied to production yes (by Claude on 2026-10-19 after review; Argon had no Supabase connection in this workspace)
- Checks: tsc pass (0 errors), npm test 1032 pass / 0 fail, build pass, browser check N/A (backend + schema task)
- Not checked / risks: Migration file is ready and verified by tests, and existing `/api/dashboard/students/:id/notes` endpoints remain backward-compatible before migration application, but the SQL file must be applied to production Supabase before `/api/student/milestones` or `/api/dashboard/students/:id/milestones` are queried against production.

