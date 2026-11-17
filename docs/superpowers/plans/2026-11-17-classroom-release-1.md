# Classroom Release 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Our own lesson room (video, audio, screen share, synced curriculum, whiteboard) replaces Zoom as the main
lesson link, with Zoom as an automatic hidden fallback, room-based attendance, teacher punctuality, quality records,
and silent observers.

**Architecture:** Cloudflare Realtime is the media engine, wrapped in a `MediaEngine` interface on the client. Our
Express server owns every secret and rule. It issues short-lived room tickets, proxies the Cloudflare session calls,
and generates TURN credentials. The existing NX-12 Supabase broadcast channel carries a typed lesson timeline
(slides, ink, board, reactions, focus, quality). Selected events persist server-side and feed attendance, lateness,
quality alerts and incidents.

**Tech Stack:** React 19, Vite 6, Tailwind 4, React Router 7, Express (`api/index.ts` + `server/routes/*`), Supabase
Postgres and Realtime, Cloudflare Realtime SFU + TURN (HTTPS API), Excalidraw (MIT), pdf.js (Apache-2.0), tests with
`node:test` via `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-classroom-design.md`. Release 1 only. The Quran tab with homework and
the detector (spec §9), Release 2 and Release 3 each get their own plan after this one ships. The report that fills itself from the timeline (spec §6),
the in-lesson mushaf marks and the shared mistake bank arrive with the Quran plan. This plan only persists the
timeline they will read.

## Global Constraints

- Room window: opens **10 minutes before** the start for teacher and learner. Hard close at **booked end + 15
  minutes**, for every length (30, 45, 60) and every lesson type, free trials included. Only the teacher ends earlier.
- The Zoom fallback keeps the current rule in `src/lib/lessonWindow.ts` (teacher 10 early, student 5 early, closes at
  the end). Do not change that file's behaviour.
- Teacher lateness grace: **2 minutes**. Above it, a written free-text reason is mandatory, unless an incident on our
  side was recorded for that lesson.
- Video: 720p pre-check that never blocks entry. Publish cap **1080p**. Adapt down to the lowest layer, then
  audio + content only.
- Quality alert: a teacher's connection failed in **3 lessons within 14 days** (editable constant).
- Focus warning to the teacher after a **10-second** grace. Never shown to guardians.
- Teachers: laptop or desktop with a headset. Learners: any device. Screen share from mobile browsers is not
  possible; hide the button where `navigator.mediaDevices.getDisplayMedia` is missing.
- No recording anywhere. No automatic judgement of a child's feelings.
- Guardian observer: child lessons only, from parent mode (`/student`), never in `/kid`. Receive-only. The teacher
  sees "guardian is watching", and the learner does not.
- Super admin observer: any live lesson, silent, receive-only. Each visit is logged.
- Secrets (server env only): `CLOUDFLARE_REALTIME_APP_ID`, `CLOUDFLARE_REALTIME_APP_TOKEN`,
  `CLOUDFLARE_TURN_KEY_ID`, `CLOUDFLARE_TURN_KEY_API_TOKEN`. Never sent to the browser. Never read or print `.env`.
- Rollout switch: env `CLASSROOM_MODE` = `off` | `pilot` | `on`, and `CLASSROOM_PILOT_TEACHERS` = comma-separated
  teacher user ids. Default `off`.
- Project rules: bilingual AR/EN with RTL, light and dark, 375px, `src/components/ui/*`, no green (success = teal),
  `humanizer` on copy, migrations only via the `new-migration` skill (append-only), Supabase builders have no
  `.catch()`, type check with `node node_modules/typescript/bin/tsc --noEmit`, red zone (`/code-review` before `main`).

## Review Focus

1. **iPhone Safari learner:** remote audio needs one user tap before it plays (autoplay policy). Expected: a clear
   "Tap to hear your teacher" control, then audio. Test in Task 9.
2. **Same role in two tabs or devices** (a parent laptop and a child phone both open the learner room). Expected: the
   newest join replaces the older one, with no duplicate tracks and no double attendance. Test in Task 4 and Task 10.
3. **Booking changed while the room is open** (moved, cancelled, teacher reassigned). Expected: new tickets are
   refused, and the open room ends with a clear message. Test in Task 4.
4. **Drop and rejoin mid-lesson.** Expected: the same slide, board and timer come back, and the reconnect is counted
   in quality, not as a new join. The lateness check is not run again. Test in Task 7 and Task 10.
5. **Room failure makes the teacher late.** Expected: the incident is recorded, the Zoom button appears, and no late
   reason is demanded. Test in Task 12.

---

### Task 1: Room window and lateness rules (shared client and server)

**Files:**
- Create: `src/lib/roomWindow.ts`
- Test: `test/cl-01-room-window.test.ts`

**Interfaces:**
- Produces: `ROOM_OPENS_MIN = 10`, `ROOM_CLOSE_GRACE_MIN = 15`, `TEACHER_LATE_GRACE_MIN = 2`;
  `roomJoinState(lesson: LessonTimes, now?: number): 'early' | 'open' | 'ended'`;
  `roomHardCloseMs(lesson: LessonTimes): number`; `remainingMs(lesson: LessonTimes, now: number): number`;
  `teacherLateMinutes(lesson: LessonTimes, firstTeacherJoinIso: string | null): number` (0 when on time or absent);
  `type LessonTimes = { scheduled_start: string; scheduled_end?: string | null; duration_minutes?: number | null; status?: string | null }`.
  It reuses `lessonEndMs` from `src/lib/lessonWindow.ts`.

- [ ] **Step 1: Write failing tests:** a 30-minute lesson starting 10:00Z is `early` at 09:49:59, `open` at
  09:50:00, `open` at 10:44:59, and `ended` at 10:45:00. Same for 60 minutes (ends 11:15). A `cancelled` status is
  always `ended`. `teacherLateMinutes` gives 0 at 10:02:00 and 3 at 10:03:00 (whole minutes, floor), and 0 for `null`.
- [ ] **Step 2: Run** `npx tsx --test test/cl-01-room-window.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `src/lib/roomWindow.ts` with the signatures above.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(classroom): room window and lateness rules (CL)`.

### Task 2: Database for the classroom

**Files:**
- Create (via the `new-migration` skill): `supabase/migrations/<timestamp>_classroom_release_1.sql`
- Modify: `src/types/database.ts` (new tables)
- Test: `test/cl-02-classroom-schema.test.ts` (reads the SQL and asserts on its text, like other migration tests)

**Interfaces:**
- Produces tables. All are service-role only: RLS on, no policies, `REVOKE ALL ... FROM anon, authenticated`.
  - `lesson_attendance_events`: widen the checks: `source` adds `'room'`; `event` adds `'room_joined'`,
    `'room_left'`, `'room_ended'`; `role` adds `'observer'`.
  - `lesson_room_state` (`booking_id` PK → bookings, `snapshot jsonb`, `updated_at`): the last restorable state.
  - `lesson_timeline_events` (`id`, `booking_id`, `type text` with a check on the Task 7 list, `actor_role`,
    `payload jsonb` ≤ 16 kB, `occurred_at`; index `(booking_id, occurred_at)`).
  - `lesson_quality` (`booking_id`, `side` `'teacher'|'student'`, `precheck_720 boolean`, `start_height int`,
    `min_height int`, `degraded_seconds int`, `audio_only_seconds int`, `reconnects int`, `focus_away_seconds int`,
    `updated_at`; unique `(booking_id, side)`).
  - `teacher_late_reasons` (`booking_id` unique, `teacher_user_id`, `late_minutes int`, `reason text` 10–2000
    chars, null until sent, `status` `'pending'|'sent'|'excused'|'deducted'`, `admin_note`, `reviewed_by`,
    `reviewed_at`, `created_at`).
  - `classroom_incidents` (`id`, `booking_id`, `kind` `'connect_timeout'|'ice_failed'|'engine_error'|'provider_error'`,
    `side`, `detail jsonb`, `created_at`, `resolved_at`).
  - `admin_observations` (`id`, `booking_id`, `admin_user_id`, `started_at`, `ended_at`, `notes text`).

- [ ] **Step 1: Write the failing schema test.** Assert the SQL creates each table, enables RLS on each, revokes from
  `anon` and `authenticated`, and that the widened check constraints contain `'room'` and `'observer'`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Write the migration with the `new-migration` skill.** Update `src/types/database.ts`.
- [ ] **Step 4: Run the test, then apply the migration to production Supabase** (owner's standing approval,
  RULES.md §7) and check the tables exist.
- [ ] **Step 5: Commit** `feat(classroom): tables for room state, timeline, quality, lateness, incidents, observations`.

### Task 3: Cloudflare Realtime server client

**Files:**
- Create: `server/integrations/cloudflareRealtime.ts`
- Modify: `.env.example` (add the four variable names, with no values)
- Test: `test/cl-03-cloudflare-client.test.ts` (inject `fetchImpl`, no network)

**Interfaces:**
- Produces: `createCloudflareRealtime(opts?: { fetchImpl?: typeof fetch; env?: NodeJS.ProcessEnv })`, which returns
  `{ configured: boolean; newSession(): Promise<{ sessionId: string }>; tracksNew(sessionId: string, body: TracksNewBody): Promise<any>; renegotiate(sessionId: string, sdp: string): Promise<any>; tracksUpdate(sessionId: string, body: unknown): Promise<any>; tracksClose(sessionId: string, body: unknown): Promise<any>; iceServers(ttlSec?: number): Promise<RTCIceServer[]> }`.
  Base URL `https://rtc.live.cloudflare.com/v1`. Calls go to `/apps/{appId}/sessions/new`,
  `/sessions/{id}/tracks/new`, `PUT /sessions/{id}/renegotiate`, `PUT /tracks/update`, `PUT /tracks/close`, with
  `Authorization: Bearer <app token>`. TURN goes to `POST /turn/keys/{keyId}/credentials/generate-ice-servers` with
  `{ ttl }`, default `ttl` 3 hours. A non-2xx response throws `CloudflareRealtimeError` with `status` and
  `errorCode`.

- [ ] **Step 1: Write failing tests:** URLs and headers are built as above; `configured` is false when any variable is
  missing; a 500 response throws `CloudflareRealtimeError` with `status === 500`; `iceServers` returns the
  `iceServers` array from the response.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Check field names against the OpenAPI schema linked from
  developers.cloudflare.com/realtime/sfu/https-api before finishing.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(classroom): Cloudflare Realtime server client`.

### Task 4: Room tickets and the media proxy (who may enter, and how)

**Files:**
- Create: `server/routes/classroom.ts`, `server/classroom/access.ts`
- Modify: `api/index.ts` (register next to `registerLessonRoomRoutes`)
- Test: `test/cl-04-classroom-access.test.ts`

**Interfaces:**
- Consumes: Task 1 `roomJoinState`; Task 3 client; `roomKey()` from `server/routes/lessonRoom.ts`;
  `verifyTeacherAuth`, `verifyStudentAuth`, `getAuthorizedLearnersForStudent`, `canFamilyReadLearner`.
- Produces:
  - `type RoomRole = 'teacher' | 'learner' | 'guardian_observer' | 'admin_observer'`.
  - `decideRoomAccess(input: { booking; requester: { userId: string; role: 'teacher' | 'super_admin' | 'student' | 'parent' }; learners: { id: string; isChild: boolean }[]; wantObserver: boolean; now: number }): { ok: true; role: RoomRole } | { ok: false; status: 403 | 404 | 409 | 423; reason: string }`.
    - 423 when the window is not open (except `admin_observer`, which may join only while the room is open).
    - 409 when the booking status is not `confirmed` or `rescheduled`.
    - `guardian_observer` only for a parent whose learner is a child (`isChild`) and only with `wantObserver`.
  - `signTicket({ bookingId, role, userId, exp }, secret): string` and `verifyTicket(token, secret)`. HMAC-SHA256, exp
    is at most the hard close.
  - Routes:
    - `GET /api/classroom/:id/enter?observe=1` (teacher auth or student auth) →
      `{ role, ticket, roomKey, iceServers, startsAt, hardCloseAt, durationMinutes, learnerName }`. It writes a
      `room_joined` attendance event, except for observers. For `admin_observer` it inserts `admin_observations`. For
      `guardian_observer` it broadcasts nothing itself (the client announces the observer for the teacher's mark).
    - `POST /api/classroom/:id/rtc/session`, `/rtc/tracks`, `/rtc/renegotiate`, `/rtc/update`, `/rtc/close`
      (header `x-room-ticket`). Observers may only send `location: "remote"` track batches; a `local` batch returns
      403.
    - `POST /api/classroom/:id/leave` (ticket) → `room_left` event.
    - Rate limit like other routes.
- Newest join wins: `enter` stores the role's current Cloudflare `sessionId` in `lesson_room_state.snapshot.sessions`,
  and the client of the older session closes when it sees a newer session for its role (Task 7 event `session`).

- [ ] **Step 1: Write failing tests for `decideRoomAccess`:**
  - teacher of the booking inside the window → `teacher`;
  - another teacher → 403;
  - learner's parent with `wantObserver` and an adult learner → 403;
  - a child learner → `guardian_observer`;
  - parent without observe → `learner` (the child takes the lesson on the parent's device);
  - super admin with observe → `admin_observer`;
  - before the window → 423;
  - cancelled → 409.
  - Tickets: a tampered token fails, an expired one fails, and `exp` is never past the hard close.
  - Proxy: an observer posting a `local` track batch gets 403 (route test with a fake client).
  - Two devices: a second `enter` for the same role replaces `snapshot.sessions[side]`, and only the first writes a
    `room_joined` event that counts as the join (Review Focus 2).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `server/classroom/access.ts` (pure) and `server/routes/classroom.ts`. Ticket secret:
  `LESSON_ROOM_SECRET` (same fallback as `lessonRoom.ts`).
- [ ] **Step 4: Run.** Expected: PASS. Then `node node_modules/typescript/bin/tsc --noEmit`.
- [ ] **Step 5: Commit** `feat(classroom): room tickets, roles and Cloudflare proxy`.

### Task 5: Client media engine and network classification

**Files:**
- Create: `src/classroom/engine/types.ts`, `src/classroom/engine/cloudflareEngine.ts`, `src/classroom/engine/quality.ts`
- Test: `test/cl-05-quality.test.ts` (pure functions only)

**Interfaces:**
- Consumes: Task 4 routes (every Cloudflare call goes through our proxy with the ticket).
- Produces:
  - `interface MediaEngine { join(opts: { bookingId: string; ticket: string; iceServers: RTCIceServer[]; role: RoomRole }): Promise<void>; publishCamera(stream: MediaStream): Promise<void>; publishScreen(stream: MediaStream): Promise<void>; stopScreen(): Promise<void>; subscribe(remote: { sessionId: string; trackNames: string[] }): Promise<MediaStream>; setPreferredLayer(layer: Layer): Promise<void>; getStats(): Promise<LinkStats>; leave(): Promise<void>; on(event: 'state' | 'error', cb: (v: any) => void): () => void }`.
  - Track names: `${side}-audio`, `${side}-video`, `${side}-screen` with `side` `'teacher' | 'student'`.
  - Simulcast publish layers by `rid`: `f` = 1080p (cap), `h` = 720p, `q` = 360p, `l` = 180p. The receiver picks a
    layer with `/tracks/update` and `preferredRid`.
  - `type Layer = 'f' | 'h' | 'q' | 'l' | 'audio_only'`; `type Side = 'teacher' | 'student'`;
    `type LinkStats = { outLossPct: number; inLossPct: number; availableInKbps: number; availableOutKbps: number; rttMs: number }`.
  - `pickLayer(s: LinkStats, current: Layer): Layer`. Steps down when packet loss is over 8% or available incoming
    bitrate is below the layer's need. Steps up only after 10 s stable. Needs: f 2.5 Mbps, h 1.2, q 0.5, l 0.15.
    Below 0.15, `audio_only`.
  - `classifyLink(s: LinkStats): 'good' | 'weak' | 'poor'`.
  - `blameSide(local: LinkStats, remoteReport: LinkStats | null): 'me' | 'them' | 'unknown'`. A side is at fault when
    its own outgoing link is weak while the other side's incoming link is fine.
  - Audio constraints: `{ echoCancellation: true, autoGainControl: true, noiseSuppression: !recitationMode }`. Opus
    with `maxaveragebitrate` 64000 normally and 128000 in recitation mode.

- [ ] **Step 1: Write failing tests:**
  - 10% loss at layer `h` → `q`;
  - 3 Mbps clean at `q` → stays `q` before 10 s of stability, then `h`, and never above `f`;
  - 0.1 Mbps → `audio_only`;
  - `blameSide` with my outgoing loss at 15% and their incoming fine → `'me'`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `quality.ts` (pure) and `cloudflareEngine.ts`. The engine uses `RTCPeerConnection` with
  `sendEncodings` for the rids above, and the proxy for every session call. No secrets in the browser.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(classroom): media engine interface, Cloudflare engine, adaptive layers`.

### Task 6: Waiting room (device and network check)

**Files:**
- Create: `src/classroom/WaitingRoom.tsx`
- Modify: `server/routes/classroom.ts` (add `POST /api/classroom/:id/precheck` with the ticket, which upserts
  `lesson_quality.precheck_720` and `start_height` for the caller's side)
- Test: `test/cl-06-precheck.test.ts` (route: an observer's precheck is ignored; a teacher's is stored)

**Interfaces:**
- Consumes: Task 4 `enter` response.
- Produces: `<WaitingRoom role ticket bookingId onReady={(stream: MediaStream, opts: { recitationMode: boolean }) => void} />`.
  It shows a camera preview, a live mic level meter, camera/mic/speaker pickers and a 720p result. The 720p check
  requests `{ width: 1280, height: 720 }` and reads `track.getSettings().height >= 720`. Failing it shows advice and
  never blocks. Teachers see the headset reminder.

- [ ] **Step 1: Write the failing route test.**
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the route and the component. Use `src/components/ui/*`, bilingual copy through
  `humanizer`.
- [ ] **Step 4: Run.** Expected: PASS. Open `/dashboard/room/<id>` in the dev preview: the camera shows, the meter
  moves, and the result is stored.
- [ ] **Step 5: Commit** `feat(classroom): waiting room with 720p check`.

### Task 7: Lesson timeline on the live channel, persistence and rejoin

**Files:**
- Modify: `src/lib/lessonRoom.ts` (add timeline events next to the existing `state` and `ink`)
- Create: `src/classroom/timeline.ts`
- Modify: `server/routes/classroom.ts` (`POST /api/classroom/:id/events`, `GET /api/classroom/:id/state`)
- Test: `test/cl-07-timeline.test.ts`

**Interfaces:**
- Produces:
  - `type RoomEvent = { t: 'session'; side: Side; sessionId: string } | { t: 'slide'; state: RoomState } | { t: 'ink'; ink: RoomInk } | { t: 'board'; sceneVersion: number; elements: unknown[] } | { t: 'pdf'; fileId: string; page: number } | { t: 'pointer'; x: number; y: number } | { t: 'reaction'; kind: 'hand' | 'confused' | 'slower' | 'repeat' | 'thinking' } | { t: 'focus'; away: boolean; at: number } | { t: 'focus_warning_off'; off: boolean } | { t: 'quality'; side: Side; layer: Layer; link: 'good' | 'weak' | 'poor' } | { t: 'observer'; kind: 'guardian'; present: boolean } | { t: 'layout'; mode: 'conversation' | 'content' | 'screen' } | { t: 'end' }`.
  - `isRoomEvent(v: unknown): v is RoomEvent`, with size limits like `isRoomInk`.
  - Persisted types (server allow-list): `slide`, `board` (latest only, into `lesson_room_state.snapshot`), `pdf`,
    `reaction`, `focus`, `quality`, `layout`, `end`. `pointer` and `ink` are not persisted; ink keeps its NX-12
    behaviour.
  - Client batches persisted events every 30 s and on `pagehide` (`navigator.sendBeacon`). Board snapshots are
    debounced to 30 s.
  - `GET /state` → `{ snapshot, remainingMs }` for rejoin.
- Channel security: keep the unguessable HMAC channel key, now handed out only inside a valid ticket. Record this in
  the Task 15 security review.

- [ ] **Step 1: Write failing tests:**
  - `isRoomEvent` accepts each shape and rejects oversize or unknown `t`;
  - the server stores only allow-listed types, and only from the ticket's role (a learner cannot persist `end`;
    observers persist nothing);
  - `GET /state` returns the last board snapshot.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(classroom): typed lesson timeline, persistence and rejoin restore`.

### Task 8: Whiteboard, PDF import and Arabic keyboard

**Files:**
- Create: `src/classroom/board/Board.tsx`, `src/classroom/board/PdfPages.tsx`, `src/classroom/board/ArabicKeyboard.tsx`
- Modify: `package.json` (add `@excalidraw/excalidraw` and `pdfjs-dist`, exact versions at least 2 weeks old;
  lazy-load both)
- Modify: `server/routes/classroom.ts` (`POST /api/classroom/:id/files`, teacher ticket only, PDF/PNG/JPEG ≤ 20 MB,
  stored in a private Supabase Storage bucket `classroom-files`, signed URL for both sides valid until the hard close)
- Test: `test/cl-08-files.test.ts`

**Interfaces:**
- Consumes: Task 7 `board` and `pdf` events.
- Produces:
  - `<Board role sync />`: Excalidraw with RTL text. The teacher edits, and the learner edits only when the teacher
    turns on "learner can draw".
  - `<PdfPages fileUrl page onPage />`: pages render with pdf.js, the page follows the teacher, and annotations reuse
    the board layer.
  - `<ArabicKeyboard onInsert />` with tashkeel keys.

- [ ] **Step 1: Write failing tests:** the files route refuses a learner ticket, refuses `.exe` and oversize files, and
  returns a signed URL that expires no later than the hard close.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Check bundle size: both libraries are loaded only inside the room route.
- [ ] **Step 4: Run.** Expected: PASS. Run `npm run build` and check the main bundle did not grow.
- [ ] **Step 5: Commit** `feat(classroom): whiteboard, synced PDF pages, Arabic keyboard`.

### Task 9: The room screen

**Files:**
- Create: `src/classroom/ClassroomPage.tsx`, `src/classroom/parts/{VideoTiles,Toolbar,Timer,Reactions,Pointer,FocusNotice,NetworkBadge,ScreenShare}.tsx`
- Modify: `src/dashboard/DashboardApp.tsx`, `src/student/StudentApp.tsx`, `src/kid/KidApp.tsx`. The `/room/:id`
  routes render `ClassroomPage` when classroom mode is on for the lesson (Task 13 flag in the `enter` response), and
  keep NX-12 pages otherwise.
- Test: `test/cl-09-room-ui.test.ts` (source assertions, like other UI tests) plus an e2e smoke spec
  `e2e/classroom.spec.ts`

**Interfaces:**
- Consumes: Tasks 4–8.
- Produces the screen. Requirements:
  - **Layouts** `conversation | content | screen`, from the teacher's toolbar or keys `1/2/3`. `M` mutes.
  - **Curriculum:** the existing NX-12 slide player inside the `content` layout.
  - **Screen share:** `getDisplayMedia({ video: true, audio: true })` with a note to tick "share tab audio". The
    button is hidden when unsupported.
  - **Timer:** elapsed and remaining from Task 1. Always visible to the teacher, with a calm warning 5 minutes before
    the booked end. For the learner it sits behind a clock icon and is closed by default. At the hard close the room
    ends for everyone with a message.
  - **End lesson:** teacher only. Sends `end`, then goes to the existing after-lesson flow.
  - **Reactions:** the five kinds, shown softly on the teacher's side.
  - **Pointer:** the teacher's pointer with their name, on the learner's side.
  - **Speaking ring:** a ring around whoever speaks (Web Audio `AnalyserNode` level).
  - **Muted hint:** "You're talking while muted" when the local mic level is high while muted.
  - **Network badge:** good, weak or poor next to each name. Weak-link messages come from `blameSide`: "your
    connection is weak", or (to the teacher) "the learner's connection is weak; ask them to move closer to the
    router".
  - **Recitation mode:** a teacher toggle that re-applies the audio constraints from Task 5 for both sides.
  - **Focus:** `visibilitychange` and `blur`. After 10 s away, the teacher sees "not on the lesson screen · 0:42", and
    the learner sees "your teacher is waiting" on return. The teacher can turn the warning off.
  - **Guardian mark:** a small "guardian is watching" chip for the teacher only, while a guardian observer is
    present.
  - **iOS audio:** a "Tap to hear your teacher" control when `play()` is rejected.
  - **Design:** go through `impeccable` and `apple-design` before building. Site tokens, khatam and arch motifs, no
    green, reduced motion respected.

- [ ] **Step 1: Write the failing source test:**
  - the learner timer starts closed;
  - the focus warning has a 10000 ms grace;
  - `getDisplayMedia` is feature-checked;
  - no `MediaRecorder` anywhere in `src/classroom`;
  - `KidApp` never renders the guardian chip or the observer entry;
  - a "Tap to hear" control exists for a rejected `play()` (Review Focus 1).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Build the screen.**
- [ ] **Step 4: Run the tests, then a two-browser manual check in the dev preview** (teacher in one profile, learner
  in another): video both ways, slide sync, screen share with tab audio, layouts, timer, focus warning, rejoin
  restores. Take screenshots at desktop and 375px, light and dark.
- [ ] **Step 5: Commit** `feat(classroom): the room screen`.

### Task 10: Attendance from the room, and teacher punctuality

**Files:**
- Modify: `server/routes/attendance.ts` (`analyzeAttendance` and `summarizeAttendance` accept `source: 'room'`, and
  `room_joined`/`room_left` count as joined/left. For a booking that used the Zoom fallback, Zoom events count too)
- Create: `server/classroom/lateness.ts`, `src/dashboard/components/LateReasonGate.tsx`,
  `src/dashboard/pages/LateReasonsPage.tsx` (super admin)
- Modify: `server/routes/classroom.ts` (`GET /api/dashboard/late-reasons/pending` for the teacher;
  `POST /api/dashboard/late-reasons/:bookingId` for the teacher; `GET` and `POST /api/admin/late-reasons` for review),
  `src/dashboard/DashboardApp.tsx` (mount the gate above all routes for teachers)
- Test: `test/cl-10-attendance-lateness.test.ts`

**Interfaces:**
- Consumes: Task 1 `teacherLateMinutes`, Task 2 tables, Task 12 incidents.
- Produces:
  - `evaluateLateness({ booking, firstTeacherRoomJoin, incidentBeforeJoin: boolean }): { late: false } | { late: true; minutes: number }`.
    No lateness when `incidentBeforeJoin`.
  - On the teacher's first `room_joined`, the server evaluates and inserts a `teacher_late_reasons` row with status
    `pending` when late. Rejoins never evaluate again.
  - **Gate:** while any row is `pending`, a modal covers the whole teacher dashboard, including the Start buttons, with
    a free-text field (10–2000 chars) and Send. It shows again after sign-in.
  - **Admin review:** list with the lesson, minutes late and reason. Actions: Excuse, or Deduct (amount and note),
    which inserts into `teacher_pay_adjustments` with the reason, the same way existing deductions are made.

- [ ] **Step 1: Write failing tests:**
  - room events produce `held` the same way Zoom events do;
  - a teacher joining at +3 min with no incident → pending row with `late_minutes = 3`;
  - at +1 min → none;
  - +5 min after an incident → none;
  - a rejoin at +20 min after an on-time join → none;
  - a reason under 10 chars → 400;
  - Deduct writes a `teacher_pay_adjustments` row with the note.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(classroom): room attendance and teacher punctuality with admin review`.

### Task 11: Quality records and alerts

**Files:**
- Create: `server/classroom/qualityAlerts.ts`
- Modify: `server/routes/classroom.ts` (`POST /api/classroom/:id/quality` with the ticket: the client sends running
  totals every 60 s and on leave), `src/dashboard/pages/TeachersPage.tsx` or the teacher detail view (a "Connection"
  section for the super admin, per month)
- Test: `test/cl-11-quality.test.ts`

**Interfaces:**
- Produces:
  - `QUALITY_ALERT = { lessons: 3, days: 14 }`.
  - `lessonFailedForSide(q: LessonQualityRow): boolean`. True when audio-only for 60 s or more, `min_height` below
    360 for 180 s or more of `degraded_seconds`, or `reconnects >= 3`.
  - `shouldAlert(rows: LessonQualityRow[], now: number): boolean` for the teacher side.
  - When it turns true, the server calls `notifySuperAdmins` once per teacher per 14-day window (dedupe on the latest
    alert time). The monthly view lists every lesson's numbers.

- [ ] **Step 1: Write failing tests:**
  - 2 failed lessons in 14 days → no alert;
  - 3 → alert;
  - 3 spread over 20 days → no alert;
  - a second call in the same window → no duplicate notification.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(classroom): connection quality records and super admin alerts`.

### Task 12: Automatic Zoom fallback

**Files:**
- Create: `src/classroom/parts/FallbackNotice.tsx`, `server/classroom/incidents.ts`
- Modify: `server/routes/classroom.ts` (`POST /api/classroom/:id/incident` with ticket or auth), the Task 3 client
  callers (a provider error records `provider_error` on the server side)
- Test: `test/cl-12-fallback.test.ts`

**Interfaces:**
- Produces:
  - Client detector: no `connected` media state within 20 s of `join`; ICE `failed` twice within 2 minutes; or an
    engine `error`. Any of these posts an incident.
  - `recordIncident(client, { bookingId, kind, side, detail }): Promise<{ fallback: { url: string } | null }>`.
    - It inserts the row and calls `notifySuperAdmins` with the diagnostics.
    - It returns the Zoom link: `zoom_host_url` for the teacher; `studentJoinPath(...)` for the learner, which keeps
      the old Zoom window.
    - It returns `null` when no Zoom meeting exists. The super admin is then told it is urgent.
  - `<FallbackNotice />` appears only after an incident, next to the room entry, with "Continue on Zoom".
  - Pay rule (spec §4): a lesson finished on Zoom counts as held through the Zoom attendance events.
  - Incidents mark `incidentBeforeJoin` for Task 10.

- [ ] **Step 1: Write failing tests:**
  - an incident inserts a row, notifies admins, and returns the host link for the teacher and the join path for the
    learner;
  - no link outside the Zoom window;
  - an observer's incident never returns a link;
  - the Task 10 lateness check is skipped after an incident.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS. Manually block `rtc.live.cloudflare.com` in the dev browser: the Zoom button
  appears within 20 s and the admin gets the notice.
- [ ] **Step 5: Commit** `feat(classroom): automatic incident report and hidden Zoom fallback`.

### Task 13: Observers in the product, and the rollout switch

**Files:**
- Create: `server/classroom/mode.ts`
- Modify: the parent lesson card (`src/student/components/LessonDayCard.tsx` or the parent lessons list) to add
  "Watch the lesson" while live (child learners only, never under `/kid`); the super admin lessons list
  (`src/dashboard/pages/BookingsPage.tsx`) to add "Watch"; the `admin_observations` notes field on the observer view
  (saved with `PATCH /api/classroom/:id/observation`)
- Test: `test/cl-13-mode-observers.test.ts`

**Interfaces:**
- Produces: `classroomEnabledFor(teacherId: string, env = process.env): boolean`. `off` → false; `on` → true;
  `pilot` → `teacherId` is in `CLASSROOM_PILOT_TEACHERS`. The `enter` response includes `classroom: boolean`.
- The observer views reuse `ClassroomPage` with `role` set to an observer: no toolbar, no publish. The admin observer
  shows a private notes box.

- [ ] **Step 1: Write failing tests:**
  - mode parsing (`off`, `on`, `pilot` with and without the id, a missing env → `off`);
  - the parent card shows "Watch" only for a child learner and only while the room is open;
  - the `KidApp` source never imports the observer entry.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(classroom): guardian and admin observers, rollout switch`.

### Task 14: Make the room the lesson link

**Files:**
- Modify:
  - `server/routes/attendance.ts` (`/api/join/:id`: when `classroomEnabledFor(booking.teacher_id)`, redirect to
    `/student/room/:id` using the Task 1 window; otherwise keep today's Zoom behaviour);
  - `src/dashboard/components/StartLessonButton.tsx` (open `/dashboard/room/:id` when the classroom is on, using
    `roomJoinState`);
  - `src/student/components/LessonDayCard.tsx`, `src/student/pages/StudentHomePage.tsx`,
    `src/student/pages/StudentLessonsPage.tsx` (join → room);
  - `server/notifications/emailTemplates.ts` and `reminderEngine.ts` (button copy "Join on Watazawwado"; the link
    stays `/api/join/:id`);
  - `server/integrations/syncEngine.ts` (the calendar event location is the site join link; Zoom meetings are still
    created).
- Test: `test/cl-14-links.test.ts`

**Interfaces:**
- Consumes: Task 1, Task 13.
- With the mode on, every learner and teacher entry point leads to the room. Zoom links are reachable only through
  Task 12.

- [ ] **Step 1: Write failing tests:**
  - `/api/join/:id` redirects to `/student/room/:id` when the teacher is in pilot, and to Zoom when the mode is off;
  - the window is `roomJoinState` for the room path and `lessonJoinState` for the Zoom path;
  - the reminder template copy is bilingual.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Grep for `zoom_meeting_link`, `zoomMeetingLink`, `zoom_join_url` and `zoom_host_url`,
  and list every remaining user-facing use in the commit message. Each one must be either switched or intentionally
  the fallback.
- [ ] **Step 4: Run the full `npm test`.** Expected: PASS, with existing Zoom tests updated only where the mode is on.
- [ ] **Step 5: Commit** `feat(classroom): the room becomes the lesson link (behind CLASSROOM_MODE)`.

### Task 15: Rules, legal copy, security review and pilot

**Files:**
- Modify:
  - `RULES.md` (replace the 2026-10-16 "Zoom host" rule with the room rules in spec §4);
  - the terms, privacy, safety and FAQ pages (find them with `graphify query "terms privacy safety faq pages"`): our
    room, guardian and academy observation for quality and safeguarding, data recorded (attendance, connection
    quality, focus-away time, timeline), no recording, Zoom as fallback;
  - the teacher agreement text (lateness rule, headset and laptop, observation);
  - `docs/backlog/LOG.md`.
- Test: the full suite.

- [ ] **Step 1: Draft** the RULES.md and legal text (`humanizer`, English and Arabic), and **send it to the owner for
  approval**. Do not publish legal text unapproved.
- [ ] **Step 2: Security review:** `/code-review` on the branch, plus a check of:
  - ticket forgery, expiry and replay;
  - observer publish attempts;
  - the channel key exposure path;
  - file upload types and sizes;
  - rate limits;
  - no Cloudflare secret in the client bundle (`grep` the built `dist/`).
- [ ] **Step 3: Verify:** `node node_modules/typescript/bin/tsc --noEmit`, `npm test`, `npm run build`, and
  `QA_PROJECT=p2 npm run e2e` with the classroom spec. All pass.
- [ ] **Step 4: Ship with `CLASSROOM_MODE=off`.** Apply the migration to production in the same release, deploy, and
  smoke-test production (owner's standing approval). Then set `pilot` with Ahmed's test teacher account and give
  Ahmed a test checklist:
  - desktop Chrome, Safari Mac, iPhone, Android;
  - weak network (Chrome throttling);
  - screen and tab share;
  - fallback (block Cloudflare);
  - rejoin;
  - lateness;
  - observers.
- [ ] **Step 5: Commit and log** `docs(classroom): rules, legal and pilot notes`. Report to the owner in Arabic. Then
  pilot Mahmoud's and Afnan's real lessons. Zoom stays the fallback until the owner says otherwise.
