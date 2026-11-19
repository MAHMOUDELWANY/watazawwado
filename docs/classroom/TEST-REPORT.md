# Classroom: live two-browser test report, 2026-11-19

QA lead run of the lesson room with real media before the owner's live tests. Everything here ran on a local
server against the real Cloudflare Realtime service and the production Supabase database, as the `p5` QA accounts.

## Environment

- **Code:** branch `feat/classroom-r1b` (from c036e2f2/3863be4a), worktree `watazawwado-classroom`.
- **Server:** `server.ts` on `127.0.0.1:3005` with `CLASSROOM_MODE=on`, `ALLOW_DEV_AUTH=true`, `NODE_ENV/VERCEL_ENV=development`,
  env from the worktree `.env` plus the main checkout's `.env.vercel` (same files and order as the `qa-p5` launch entry).
  `localhost:3005` on IPv6 was held by a stray `vite --config zz-preview/vite.config.ts` from an earlier design session, so
  every URL uses `127.0.0.1`.
- **Media:** real Cloudflare Realtime sessions and TURN credentials from the enter call.
- **Browsers:** Playwright Chromium (headless shell 159), one browser, one context per person, launched with
  `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream --auto-select-desktop-capture-source=Entire screen`.
  Every `RTCPeerConnection` is recorded by an init script, so the checks read `getStats()` (inbound bytes, frame height) and
  the remote `<video>`/`<audio>` elements. No app code was added for tests.
- **Accounts:** `scripts/qa/create-accounts.ts p5` (teacher-1 male with the adult student-1; teacher-2 female with the
  parent-1's child "QA Kid P5"; admin-1). Sessions minted server-side, no passwords.
- **Lessons:** `scripts/qa/classroom-booking.ts p5 --offset-min=N [--learner=student|kid]` inserts a confirmed lesson
  (reference `QA-CL-…`, contact email of the QA learner, no payment rows) and removes earlier `QA-CL` lessons of that teacher,
  because one teacher cannot hold two overlapping lessons. `--cancel=<id>` and `--delete=<id>` act on QA lessons only.
  `purge.ts` now also removes the room files (`classroom-files/<bookingId>/…`); every room table cascades from `bookings`.
- **Spec:** `e2e/classroom-live.spec.ts`, Playwright project `classroom`, only when `QA_CLASSROOM=1`:
  `QA_PROJECT=p5 QA_CLASSROOM=1 QA_BASE_URL=http://127.0.0.1:3005 npx playwright test --project=classroom`.
  Fixture: `e2e/fixtures/classroom-two-pages.pdf`. Screenshots: `docs/classroom/shots/e2e-*.png`.
- **Machine:** about 1.7–2.8 GB free memory; one server, browsers closed between groups.

## Scenarios

| # | Scenario | Result | Evidence |
|---|---|---|---|
| 1 | Teacher and adult learner join (lesson now+2 min): waiting room, join, remote video plays (`readyState ≥ 2`), inbound video and audio bytes grow on both sides, remote audio element live | pass | `e2e-01-teacher.png`, `e2e-01-learner.png` |
| 2 | Layout switch to content, slide sync (teacher Next → learner `data-room-page` moves), named pointer, board drawing reaches the learner's canvas, 2-page PDF upload shown to the learner and page 2 followed | pass after fix 1 | `e2e-02-learner-slides.png`, `e2e-02-learner-board.png`, `e2e-02-teacher-pdf.png`, `e2e-02-learner-pdf.png` |
| 3 | Teacher shares the screen, learner plays the screen track (> 700 px wide), stop returns the learner to the file | pass | `e2e-03-learner-screen.png` |
| 4 | Learner tab hidden > 10 s → teacher sees "Not on the lesson screen"; teacher turns the warning off; no "welcome back" for the learner | pass | `e2e-04-teacher-focus.png` |
| 5 | Learner reloads mid-lesson → same pane and PDF page 2 restored, video both ways again, two learner `room_joined` rows | pass | `e2e-05-learner-rejoined.png` |
| 6 | Second learner device joins → old one shows "open on another device"; teacher keeps receiving video from the new one | pass | `e2e-06-old-device.png` |
| 7 | Teacher 3 min late → after End lesson the late-reason gate shows, Escape does not close it, a 4-character reason is disabled in the form and refused by the server (400), a real reason is accepted; the admin sees it on `/dashboard/late-reasons` | pass after fix 3 | `e2e-07-late-gate.png`, `e2e-07-admin-late-reasons.png` |
| 8 | Teacher ends the lesson → learner sees "The lesson has ended", enter again is 423, attendance summary has teacher joins and together minutes | pass | `e2e-08-learner-ended.png` |
| 9 | Guardian observer (parent-1 "Watch" on the kid's lesson) → teacher sees "Guardian watching", the kid view does not, the observer page has no sending tracks, and the server refuses a publish from an observer ticket (403) | pass | `e2e-09-teacher-guardian-chip.png`, `e2e-09-kid-view.png` |
| 10 | Super admin observer → notes autosave into `admin_observations.notes`; teacher sees no guardian chip | pass | `e2e-10-admin-observer.png` |
| 11 | Teacher's `/api/classroom/*/rtc/*` aborted → incident recorded (`engine_error`, teacher), "Continue on Zoom" shown, QA admin got "Zoom was offered"; a lesson with no real Zoom link gives no fallback link and the urgent notice | pass after fixes 4 and 5 | `e2e-11-teacher-fallback.png` |
| 12 | Weak learner uplink: DevTools throttling (300 kbps, 300 ms) plus the learner's senders capped at 40 kbps → teacher's received video drops (358 → 38 kbps), video keeps flowing, recovers when lifted | pass, partly (see "Could not be tested") | `e2e-12-teacher-weak.png` |
| 13 | Enter 20 min before the start → 423 and "not open" on screen; lesson cancelled while in the room → "This lesson was cancelled" (shown about 1 s after the cancel) | pass after fix 6 | `e2e-13-too-early.png`, `e2e-13-cancelled.png` |
| 14 | Arabic RTL learner on a 375×812 phone: waiting room, room, content layout; `dir=rtl`, no sideways scroll, video plays | pass | `e2e-14-phone-ar-waiting.png`, `e2e-14-phone-ar-room.png`, `e2e-14-phone-ar-content.png` |

Full run of all 14 in one go: see the end of this file.

## Bugs found and fixed

| # | Severity | Bug | Fix | Commit |
|---|---|---|---|---|
| 1 | High | The full-screen "Tap to hear the learner" card covered the teacher's whole room although sound was allowed. `play()` also rejects with `AbortError` when a resubscribe swaps the stream, and any rejection showed the card; it never went away on a later successful play. | Only `NotAllowedError` shows the card; a successful play hides it (`isAutoplayBlock` in `roomWiring.ts`). Test: `test/cl-19-live-findings.test.ts`. | 352386d1 |
| 2 | High | A fresh room dropped to "Poor" and "Video paused to keep the sound clear" on a perfect local link, and 720p was never reached. Chrome's `availableIncomingBitrate` follows what already flows (live readings: 347 kbps two seconds after joining, then a plateau at 650–770 kbps while 360p flows); the picker and `classifyLink` took it as a hard limit. | The estimate counts only under stress (loss over 2% or RTT over 300 ms); climbing to the top layer uses the existing zero-loss guard. After the fix the teacher received 720p. Tests: `cl-19`, `cl-05` updated (the old cases now say "under stress"). | 1bd7a872 |
| 3 | High | A new teacher who joined late got Zad's welcome tour on top of the mandatory late-reason gate; the tour covered the gate's Send button. | The tour waits while the gate has pending reasons (`LateReasonGate onPendingChange`). Test: `cl-19`. | 358e5cb2 |
| 4 | Critical (Task 12 dead) | Every incident call failed with 500: `recordIncident` selected `bookings.zoom_host_url`, which is not a column (the host link is `sync_metadata.zoomStartUrl`). No incident row, no admin notice, no Zoom button, in production too. The unit tests' fake database accepted any column. Also a join that fails on our side before the connect clock (blocked network) never reported anything. | Read `sync_metadata.zoomStartUrl`; the page reports a failed join or publish as `engine_error` (the detector still skips superseded/ended/unauthorized). Tests: `cl-12` fixtures now use the real column; `cl-19`. | c8a6111e |
| 5 | Medium | `bookings.zoom_meeting_link` has a column default `https://zoom.us/j/mahmoud-teaching-room`, which is no meeting. A lesson still holding it was offered a "Continue on Zoom" button to nowhere, and the admins got the calm notice instead of the urgent one. | The fallback treats the placeholder as no Zoom. Test: `cl-12`. | dc8a00f1 |
| 6 | Medium | A lesson cancelled during the room showed "The room has closed · the lesson time is over". The engine's next media call hears 409 `ended` and stops as `ended`, which the page mapped to "closed" before the 30 s state poll could say "cancelled". | On engine `ended`, the page asks `/state` for the reason first and falls back to "closed". Test: `cl-19`. | d5f97e92 |
| 7 | Low (QA tooling) | QA scripts could not find `.env.vercel` from a sibling worktree, and `create-accounts.ts` used the old agreement version `2026-11-12.1` (now `2026-11-18.1`), so teacher accounts could not be made. | `lib.ts` finds the main checkout from the worktree's `.git` file; version updated. | 1a349ae9 |

## Fixed after the run (2026-11-19, unit/source tests in `test/cl-07`, `cl-17`, `cl-20`)

- **Notes belong to their page** (b1a99a48). Board events carry a `surface` (`fileId#page`); the snapshot keeps one scene
  per page in `boards` (whiteboard stays `board`, up to 30 file pages saved), the "learner can draw" switch once for the
  room. Each PDF page or picture mounts its own Board with that page's latest scene, live and after rejoin.
- **The series opening plays on both screens** (dbf3bd60). The slide state carries `opening`; the learner's player follows
  it instead of closing it, and closes when the teacher skips or finishes it.
- **The learner's room player shows no slide controls** (24c3682e). In follow mode: no tool rail, no back/next, no swipes,
  no shortcuts, on every screen size.
- **A starved line with no loss is flagged** (fe48da16). The engine measures the camera's sent frame rate (only while the
  camera is on), decoded frames a second and incoming jitter. Under 10 fps sent is weak (under 5 poor) and blames the
  sender ("your connection is weak" to the learner, "theirs" to the teacher); few frames decoded while the other side sends
  plenty blames the receiver's download; jitter over 50/150 ms is weak/poor. The early incoming estimate still counts only
  under stress (1bd7a872). Not re-run live: scenario 12 still needs a real check (owner's checklist item 3).
- Scenario 2 in the spec now expects the learner to see the opening and no slide controls. Not re-run: the p5 QA accounts
  were purged after the run (`create-accounts.ts p5` first).

## Still open

- **`zoom_meeting_link` placeholder default in the database.** Real lessons in the last 30 days all have real links, but any
  booking whose Zoom creation fails keeps the placeholder, and the student join link would lead to it. Worth a migration to
  drop the default (outside the classroom).
- Two notice slots (wide and phone) are both in the DOM; one is hidden by CSS. Screen readers in some browsers may read
  both. Low.

## What could not be tested here (owner's live checklist)

1. **Real phones:** iPhone Safari (tap-to-hear on first sound, speaker vs earpiece, camera switching, background tab and
   lock screen, rotating the phone) and Android Chrome (same, plus the phone layout with a real thumb).
2. **Safari and Firefox on desktop:** simulcast layer count, `setSinkId` (speaker choice), screen share and tab audio.
3. **Real weak networks:** DevTools throttling does not touch WebRTC media, so the layer step-down on loss, the "your
   connection is weak / theirs is weak" blame and the audio-only fallback were only proven in unit tests. Test on a phone
   hotspot with a weak signal, and by walking away from the Wi-Fi.
4. **Switching networks mid-lesson** (Wi-Fi to mobile data) and **laptop sleep**: the room should say "Reconnecting…" and
   come back.
5. **Bluetooth and USB devices:** AirPods connecting or disconnecting mid-lesson, unplugging a USB camera or mic, and
   revoking camera/mic permission mid-lesson ("Microphone lost" notice and recovery).
6. **Real Cloudflare outage** from the user's network (block `*.cloudflare.com` in the router or hosts file) for the Zoom
   fallback on both sides, with a lesson that has a real Zoom meeting.
7. **Two real people's sound:** echo, the recitation mode (noise suppression off, higher Opus bitrate) on a real voice.
8. **Long lesson:** a full 60-minute lesson for memory, battery and the 5-minute warning, then the room's hard close 15
   minutes after the end.
9. **The real Brevo/WhatsApp/push notices** for the admin incident and the late reason (local `.env.vercel` holds
   placeholders, so only the in-app rows were checked).

## Cleanup

QA lessons are deleted by the spec's `afterAll`; accounts and the rest by `npx tsx scripts/qa/purge.ts p5 --yes`.

## Full run (all 14 in one go, after every fix)

`14 passed (7.5m)`. Logged values from that run:

- Scenario 1: teacher received 360p at 20 fps 3 s after joining (it climbs after 10 s of clean link), learner the same; two
  live remote audio elements on each side.
- Scenario 8: attendance summary `{"teacher":true,"student":true,"held":false,"togetherMinutes":2,"requiredMinutes":20,"joins":{"teacher":1,"student":2}}`
  (held is false because the test lesson ended after 2 of 30 minutes, which is right).
- Scenario 11: incident `engine_error` on the teacher's side.
- Scenario 12: teacher's received video 314 kbps before, 40 kbps under the cap, back up after; no notice shown then; fixed in fe48da16 (see "Fixed after the run").
- Scenario 13: "This lesson was cancelled" about 0.9 s after the cancel.
