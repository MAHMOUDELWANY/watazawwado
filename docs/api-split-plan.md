# Plan: split `api/index.ts` safely (QA-07)

Status: plan + one pilot (2026-10-21). The pilot is on branch `refactor/qa-07-pilot-calendar-feed` (not merged);
review it before any more moves.

## Why

`api/index.ts` is ~10.4k lines with most `/api/*` routes, their helpers and shared middleware. It is hard to review,
and every change re-reads the whole file. Newer work already lives in `server/routes/*` as `registerXRoutes(app,
deps)` modules (community, crm, exports, funnel, ops, curriculum, progress, feedback, privacy, teacherLoad,
summaryDraft). The split continues that pattern; it does not change any behaviour.

## Rules for every move

1. One route group per change, nothing else in the same commit (no renames, no fixes, no new features).
2. Copy the handlers byte for byte; only `getSupabaseAdminClient()` → `deps.getClient()` and shared middleware
   (`verifyStudentAuth`, `verifyTeacherAuth`, `requireSuperAdmin`, `rateLimit`) → `deps.*`. Helpers used only by the
   group move with it; helpers used elsewhere stay and are passed in `deps`.
3. Keep the same paths, methods, middleware order, status codes and error texts. Route order only matters when two
   paths overlap: check with `grep "app\.(get|post|patch|put|delete|all)\('/api/<prefix>"` before moving, and register
   the module at the same relative place if anything overlaps.
4. Tests that read source text of `api/index.ts` for a moved group are pointed at the new file in the same commit (the
   assertions stay the same).
5. tsc, full `npm test` and build green; production smoke of the moved routes after release (status codes for
   signed-out calls are the cheapest check).
6. Money, booking and auth paths (red zone) move last and only after the owner has reviewed one green-zone move.

## Order (low risk first)

| Step | Group | Approx. lines | Risk | Notes |
|---|---|---|---|---|
| Pilot | Family calendar feed (`/api/student/calendar-feed`, `/api/calendar/family/:file`) | 100 | Low | Done on the branch; self-contained, tests in `pa-03`. |
| 2 | Notification preferences, language (`/api/student/notification-preferences`, `/api/me/language`) | 80 | Low | Small, read/write own rows. |
| 3 | Next-week suggestion, progress timeline/report wiring already in `progress.ts` | 60 | Low | Uses `validateSlotAvailability` (pass in `deps`). |
| 4 | Intake and learning guide (`/api/intake/*`, `/api/learning-guide`) | 400 | Medium | Gemini calls; keep model names as they are. |
| 5 | Dashboard leads, trials, intakes (`/api/dashboard/leads`, `/trials`, `/intakes`) | 600 | Medium | Admin only. |
| 6 | Dashboard students and notes (`/api/dashboard/students/*`) | 900 | Medium | Teacher scope checks must move intact. |
| 7 | Availability and integrations (`/api/dashboard/availability`, `/api/integrations/*`) | 900 | High | Calendar/Zoom side effects. |
| 8 | Student bookings, packages, credits (`/api/student/bookings`, `/packages`, `/credits`, `/pay-later`) | 1500 | Red | Money and booking rules; owner review first. |
| 9 | Payments and webhooks (`/api/payments/*`, Stripe/PayPal) | 1200 | Red | Raw body handling for webhooks must stay exactly as is. |
| 10 | Cron (`/api/cron/process-reminders`) | 100 | Red | Keep the CRON_SECRET check first. |

What stays in `api/index.ts` at the end: app creation, global middleware (CORS, JSON, rate limiter, error monitor),
shared auth middleware, and the `register*Routes` calls in one block.

## How to review the pilot

```bash
git diff main...refactor/qa-07-pilot-calendar-feed
```

Expected: `server/routes/calendarFeed.ts` holds the four routes unchanged apart from `deps.*`; `api/index.ts` loses
them plus two now-unused imports; `test/pa-03-family-calendar.test.ts` reads the new file. Tests: 1306 pass, 0 fail.
If it looks right, merge the branch into `main` and continue with step 2.
