# Classroom: handoff and progress

Read this first if you are continuing the classroom work in a new session or on another account.

- **Spec (approved by the owner, 2026-11-17):** `docs/superpowers/specs/2026-11-17-classroom-design.md`
- **Plan (Release 1, 15 tasks):** `docs/superpowers/plans/2026-11-17-classroom-release-1.md`
- **Feasibility study and calculator (private artifact):** https://claude.ai/artifact/KE5UvwKsCD3cdndUcRRGqz
- **Branch:** `feat/classroom-r1`, pushed to origin. Locally it is a git worktree at
  `C:\Users\ahmed\OneDrive\Desktop\watazawwado-classroom`. Its `node_modules` is a junction to the main checkout,
  and its `.env` is a hard link to the main checkout's `.env` (never read or print it).
- **How it is built:** one subagent per task with TDD, then a reviewer for security-sensitive tasks. Commits go to
  the branch. `main` gets the branch only at Task 15, shipped with `CLASSROOM_MODE=off`.
- **Owner's standing instruction (2026-11-17 night):** finish all 15 tasks overnight. Save and push progress, and
  keep this file current. When usage runs out, wait for the reset and continue.
- **Env vars already set by the owner (Vercel and local .env):** `CLOUDFLARE_REALTIME_APP_ID`,
  `CLOUDFLARE_REALTIME_APP_TOKEN`, `CLOUDFLARE_TURN_KEY_ID`, `CLOUDFLARE_TURN_KEY_API_TOKEN`,
  `QURAN_FOUNDATION_CLIENT_ID`, `QURAN_FOUNDATION_CLIENT_SECRET`. Not set yet: `CLASSROOM_MODE` (defaults to off)
  and `CLASSROOM_PILOT_TEACHERS`.
- **Supabase project:** `fmwxqyroyxgigvpahpri`. The Task 2 migration
  (`20261117000000_classroom_release_1.sql`) is **not applied yet**. Apply it at release time (Task 15). Its
  constraint names were checked against production on 2026-11-17 and match.

## Progress

| Task | What | Status | Commit |
|---|---|---|---|
| 1 | Room window and lateness rules | done, reviewed | 76f3dcdc |
| 2 | Database migration and types | done, reviewed (not applied) | 562e452d |
| 3 | Cloudflare Realtime server client | done, reviewed | 3517cf2a |
| 4 | Room tickets, roles, media proxy | done, security-reviewed (rate limit + learner-change fixes) | 16eafbc9, 96b6c8ef |
| 5 | Client media engine, adaptive layers | done + fix (recitation bitrate, unsubscribe) | c2d56f7e, fdf0c130 |
| 6 | Waiting room (720p check) | done (not yet seen in a browser; route comes in Task 9) | ce4e3d0d |
| 7 | Lesson timeline, persistence, rejoin | done (85 classroom tests pass) | 578fd38b |
| 8 | Whiteboard, PDF, Arabic keyboard | done (bucket migration 20261118000000 not applied; signed direct uploads up to 20 MB) | acc5bbd6, 25957e0c |
| 9 | The room screen | done, NOT yet seen in a browser (needs migration applied + a booking in its window) | 092e7f08 |
| 10 | Attendance and teacher punctuality | done (gate + admin page mounted; rejoin-after-leave counted) | 6c8b10fb, 8133b71d, 916c810e |
| 11 | Quality records and alerts | done | eafe9d67 |
| 12 | Automatic Zoom fallback | done (manual block-Cloudflare check still to do in a browser) | 4fac2e1f |
| 13 | Observers and rollout switch | done | 10794af0 |
| 14 | Room becomes the lesson link | done (full npm test: 1 pre-existing-in-branch a11y failure in ScreenShare dialog, fix running) | df1c7508 |
| 15 | Rules, legal (owner approves first), security review, ship off, pilot | todo | |

## Notes for the next tasks (learned while building)

- Enter URLs differ by auth: `GET /api/dashboard/classroom/:id/enter` (teacher or admin) and
  `GET /api/student/classroom/:id/enter` (family), both with `?observe=1` for observers. Media calls go to
  `/api/classroom/:id/rtc/*` with the `x-room-ticket` header.
- A child versus an adult learner is told apart by `students.learner_type` ('child' | 'adult'). A child phone
  (`req.childDevice`) can never observe.
- Seats: `teacher` and `learner` (a second device replaces the first, and the old one gets 409 `superseded`). Each
  observer has their own seat.
- Cloudflare session paths live under `/apps/{appId}/sessions/{id}/...`. A 200 can carry per-track `errorCode`. Drop
  port-53 TURN URLs in the browser.
- `remainingMs` in `src/lib/roomWindow.ts` counts to the **hard close**. For the teacher's timer (remaining of the
  booked time and the 5-minute warning), use `lessonEndMs` from `src/lib/lessonWindow.ts`.
- Legal and RULES.md text (Task 15) must be approved by the owner before publishing.
- Mount Task 10 UI in `src/dashboard/DashboardApp.tsx` once Task 9 is committed:
  `import LateReasonGate from './components/LateReasonGate'; import LateReasonsPage from './pages/LateReasonsPage';`,
  render `{!isSuperAdmin && <LateReasonGate />}` next to `<FeedbackHost />`, and add
  `<Route path="/late-reasons" element={isSuperAdmin ? <LateReasonsPage /> : <Navigate to="/dashboard/month" replace />} />`
  next to the `/payroll` route.
- Task 9 shortcuts to finish later: after the teacher stops screen share the learner keeps the old screen tracks until
  the teacher's next session; a rejoin guesses which pane (lesson, board, file) was open.
- Known gap (code review, finding 5, not fixed yet): room presence ends only on `room_left`, which the leave call
  writes. A crashed tab or a phone that dies never sends it, so that side stays "joined" until the lesson ends, and
  attendance counts it as present. Fix later by ending room presence at that side's last quality heartbeat
  (`lesson_quality.updated_at`, sent every 60 s) when no `room_left` follows.
- Before the first real browser test: apply both migrations (`20261117000000_classroom_release_1.sql`,
  `20261118000000_classroom_files_bucket.sql`) and use a booking whose time window is open.
