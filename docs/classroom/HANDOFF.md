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
- **Supabase project:** `fmwxqyroyxgigvpahpri`. The Task 2 migration (APPLIED 2026-11-18, with the files bucket migration)
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
| 15 | Rules, legal (owner approves first), security review, ship off, pilot | code shipped to main with CLASSROOM_MODE off; both migrations applied 2026-11-18; legal draft in docs/classroom/LEGAL-DRAFT.md WAITING for owner approval; pilot not started | 7fc78a08 |

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

## Next steps (after 2026-11-18 ship)

1. Owner approves `docs/classroom/LEGAL-DRAFT.md`, then publish it into RULES.md, terms, privacy, safety, FAQ and the
   teacher agreement.
2. Before the pilot, fix the known gap: room presence without `room_left` (a crashed tab counts as present until the
   lesson ends). Plan: end room presence at the side's last quality heartbeat (60 s).
3. First real browser test (no one has seen the room on screen yet): set `CLASSROOM_MODE=pilot` and
   `CLASSROOM_PILOT_TEACHERS=<Ahmed's QA teacher id>` in Vercel, then book a test lesson and run the checklist in plan
   Task 15 step 4 (desktop Chrome, Safari Mac, iPhone tap-to-hear, Android, weak network, screen and tab share, PDF
   upload, block Cloudflare for the Zoom fallback, rejoin, lateness gate, guardian and admin observers).
4. Then real lessons for Mahmoud and Afnan with the Zoom fallback. Zoom stays until the owner says otherwise.
5. Later plans: the Quran tab with homework and the detector (spec §9), Release 2, Release 3.

## Phase 2 (started 2026-11-18): owner approved the legal text; finish, review, design, test

Branch `feat/classroom-r1b` (from main b65ad113), same worktree. Owner's ask: finish what is missing, review every
line of logic and architecture, run every scenario Claude can run itself, redesign the room ("legendary" design
for learner, teacher and super admin observer, with web inspirations), then report and give the owner a live
checklist.

| Step | Status |
|---|---|
| Publish approved legal text (RULES.md, terms, privacy, safety, FAQ, teacher agreement) | done (91208939) |
| Fix presence on tab crash (heartbeats) | done (room_heartbeat, last heartbeat + 90 s) |
| Deep logic and architecture review (read-only report) | done: docs/classroom/REVIEW-2026-11-18.md (2 blockers, 6 high, 8 medium, 4 low) |
| Design research and brief (`docs/classroom/DESIGN-BRIEF.md`) | done |
| Redesign the room and observer views | done (screenshots in docs/classroom/shots/) |
| Fix review findings | done: all 20 (see REVIEW-2026-11-18.md) |
| Real two-browser scenarios on a local server with QA accounts and fake media | done 2026-11-19: 14/14 pass (`e2e/classroom-live.spec.ts`, `QA_CLASSROOM=1`); 6 bugs fixed, see TEST-REPORT.md |
| Report + owner's live checklist (`docs/classroom/TEST-REPORT.md`) | done (live checklist in its "could not be tested" section) |
| Ship phase 2 to main (CLASSROOM_MODE still off) | done 2026-11-19: tsc clean, 262 classroom tests pass, build passes |

### Next: start the pilot (owner or next session)

1. In Vercel set `CLASSROOM_MODE=pilot` and `CLASSROOM_PILOT_TEACHERS=<teacher id>` (id from `teacher_accounts`), then redeploy.
2. Book a test lesson with that teacher and run the live checklist in `docs/classroom/TEST-REPORT.md`.
3. The QA p5 accounts were purged after the E2E run; recreate them (`scripts/qa/create-accounts.ts`) before re-running
   `QA_CLASSROOM=1` E2E.

## 2026-11-20: one build, no release split (owner)

The owner rejected phases: everything in `docs/classroom/BUILD-LIST.md` is built now; design waits for the Mobbin MCP.
Parallel worktrees (branches from ed56d78e, node_modules junction + .env hard link like this one):
`wt-cls-before` (1.4 prep mode, 1.5 waiting room, 1.6 parent PIN), `wt-cls-after` (3.2 verdict, 3.3 report draft,
3.4 rating, 3.5 admin lesson view), `wt-cls-board` (2.7 own whiteboard, 2.8 talk time). Next: 2.10–2.12 teaching
tools, then the Quran tab (4.x). Each branch is merged here, migrations applied, verified on a Vercel preview with a real
camera and the child phone, then shipped.

### Status 2026-11-20 (usage limit hit)
- `cls/before` done (63c05dfc..27cc2597; migration 20261120100000_classroom_before_lesson.sql, not applied). Sent back to
  add: email PIN reset, "hand to my child" kid mode on the parent device, real names for in-room uploads.
- `cls/after` done (210d3829..a6c17b45; migration 20261120000010_classroom_after_lesson.sql, not applied). Owner
  questions: "nobody came" -> admin decides?; rating editable within the month or once only?
- `cls/board` (own whiteboard + talk time) still running at the limit.
- Next: merge the three branches into feat/classroom-r1b, resolve ClassroomPage conflicts, tsc + cl tests + build, apply
  both migrations, verify on a Vercel preview with real camera and child phone, ship; then 2.10-2.12 and the Quran tab.

### 2.10-2.12 teaching tools (`cls/tools`, worktree `wt-cls-tools`, 2026-11-20)
- Built from 18bfd196: tool events in `src/lib/roomTools.ts` (correction, check, check_answer, stage, media, practice,
  practice_answer live only, shadow), saved by the teacher (the learner only saves check_answer), kept in the room
  snapshot under `tools` for rejoin and re-sent on hello. UI in `src/classroom/tools/*`; wiring in `ClassroomPage.tsx`.
- Mistake bank: table `learner_mistakes` (every room correction, one per booking + correction id), read by the daily
  review (`GET /api/student/review` -> `mistakes`, "Learned" button), the homework prompt (this lesson's corrections) and
  the room warm-up (`GET /api/classroom/:id/warmup`, teacher only). Corrections and checks show in the report draft.
- Migration `20261120200000_classroom_teaching_tools.sql` (NOT applied): timeline CHECK + learner_mistakes + audio mime
  types on the classroom-files bucket. It must run after 20261120100001 from `cls/before`.
- Merge notes: `feat/classroom-r1b` exports FILE_ID/FILE_EXT and lists room files by FILE_ID; audio uses its own
  AUDIO_FILE_ID so it stays out of document lists and reports. Expect ClassroomPage/Toolbar conflicts (small, additive).
- Not seen in a browser yet: check YouTube sync, audio ducking, shadowing on Safari (MediaRecorder gives audio/mp4),
  automatic PiP on tab switch (Chrome 134+), and blur on a weak laptop (it should turn itself off).
