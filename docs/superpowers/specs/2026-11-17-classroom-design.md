# Watazawwado Classroom: design

Status: draft for the owner's approval (2026-11-17). Brainstormed with the owner across one long session; the
feasibility study and cost calculator live in a private artifact:
https://claude.ai/artifact/KE5UvwKsCD3cdndUcRRGqz. Binding rules still come from `RULES.md` and `CLAUDE.md`.

## 1. Intent

Replace Zoom with our own lesson room inside the site, so teacher, learner and guardian never leave Watazawwado.

Why:
- **Cost:** the classroom runs on bandwidth pricing (Cloudflare Realtime, first 1,000 GB a month free). At 100 teachers
  it costs about $400 a month at 720p, compared with about $1,416 for Zoom licences per teacher.
- **Control and quality:** we own the room's behaviour, rules, records and design. The academy's design quality is a
  reason for this project, so the room must look and feel like ours, not like a video call.
- **Teaching:** the room is built for 1-on-1 Quran, Islamic studies and language lessons. That means synced curriculum,
  a synced mushaf with marked mistakes, a whiteboard, and a report that writes itself from what happened.

What success looks like: lessons run fully on our room for 4 weeks with no failure that the Zoom fallback could not
catch, and the owner then decides Zoom can go.

## 2. Goals, non-goals, anti-goals

Goals:
- Video and audio that adapt to the network, with audio protected first.
- Everything already in NX-12 (synced curriculum slides, pen, highlighter, laser) inside the same room as the video.
- Screen, window and tab sharing from the teacher's laptop, with tab audio.
- A record of every lesson (timeline), feeding attendance, the teacher's report, quality data and alerts.
- An automatic Zoom fallback that appears only when the room fails.
- Quran homework with a mushaf, a reciter to repeat after, and a word-mistake detector (section 9). It is part of this
  plan.

Non-goals (for now):
- Lesson recording. It is parked in `docs/backlog/BACKLOG.md` under PARKED, because storage cost grows with the
  number of teachers.
- Group classes. The design must not block them, but none is built.
- A native mobile app. The design must carry over to one (section 12).
- Admin finance. It is backlog lane FN.

Anti-goals (a failure even if it works):
- The room feels like a generic video call, or like surveillance.
- A lesson is lost because our room failed and the teacher had to improvise a link.
- A child can read a teacher's concern about them.
- Any money or ownership decision comes from the browser.
- Breaking the pages, flows and tests that passed the P1–P4 reviews.

## 3. Constraints

- Stack: Vite + React 19 + Express (`api/index.ts`, `server/`) on Vercel, Supabase Postgres and Realtime. No Next.js.
- Transport: **Cloudflare Realtime** (SFU + TURN) is the only media engine. Keep an engine interface so another engine
  (LiveKit, parked) could be added later without touching screens.
- Fallback: **Zoom**, using the academy's existing single Zoom account (`server/integrations/zoom.ts`,
  `users/me/meetings`). Keep creating a Zoom meeting per booking in the background, as today, so a fallback link
  always exists.
- Teachers teach from a laptop or desktop, with a headset (owner decisions). Learners may join from any device,
  including phones. Screen sharing from mobile browsers is impossible (iOS and Android browsers do not support
  `getDisplayMedia`).
- Bilingual Arabic/English, RTL, light and dark, 375px, `src/components/ui/*`, no green (success = teal), site tokens
  only.
- Supabase Pro and Vercel Pro are required before launch, independent of this project.
- Migrations are append-only, through the `new-migration` skill. Security-definer RPCs for critical writes.
- Children's data: the RULES.md safeguarding rules apply.

## 4. Decisions the owner made (as decided)

Room and timing:
- **Opens 10 minutes before the start** for teacher and learner.
- **Closes at the booked end plus 15 minutes**, whatever the length (30, 45 or 60). Only the teacher ends it earlier.
  At the hard close, the room ends itself.
- The Zoom fallback keeps the **current Zoom window** (`src/lib/lessonWindow.ts`: 5 minutes early, closes at the
  booked end). It is only offered after the room has failed.
- **The room knows the booked length.** A timer shows elapsed and remaining time. It is always visible to the teacher.
  For the learner it is hidden by default and reachable on demand, so the learner does not watch the clock.

Teacher punctuality:
- The teacher may be up to **2 minutes** late. Later than that, the system **requires a written reason** (free text,
  not a pick list) after the lesson. It is a pop-up that locks the teacher's dashboard, including starting the next
  lesson, until the reason is sent. It cannot be skipped, and signing out and back in shows it again. Writing it takes
  under a minute. If the system recorded that the delay was caused by our room (an incident on our side), no reason
  is asked.
- The reason goes to the super admin for review. The admin decides whether the delay was a real emergency or a pay
  deduction. A deduction flows to payroll (FN-03).

Video quality:
- Before the lesson, the waiting room checks the teacher's camera and network against **720p**. Failing the check
  never blocks entry; the result is recorded.
- In the lesson, quality adapts freely between a **1080p cap** (to limit bandwidth cost) and the lowest usable
  resolution. The last step is audio plus synced content.
- The room tells **whose** network is weak. The teacher's own network: "your connection is weak". The learner's: it
  tells the teacher to ask the learner to check their network.
- Every lesson records connection quality per side. A **monthly report per teacher**, plus a **mid-month alert** to
  the super admin when a teacher's connection failed in 3 lessons within 2 weeks (threshold editable).

Fallback:
- When the system detects that the room cannot start or keep the lesson (cannot connect, repeated media failure,
  Cloudflare unavailable), it **raises the problem to the super admin automatically**, with diagnostics. It then
  **reveals a "Continue on Zoom" button** next to where the teacher entered, and the same for the learner. The button
  is hidden otherwise. Teachers never make their own links.
- Zoom stays as fallback until the owner says the room is safe.
- **Pay and attendance on fallback:** a lesson that finishes on Zoom under the Zoom attendance rules counts as held.
  The teacher is paid, the learner gets no credit, and the teacher makes up the lost minutes as the terms say. A
  lesson that does not happen at all follows the existing RULES.md "what is paid" table. Any case the rules do not
  cover goes to the owner for a decision.

Focus:
- When the learner switches tab, minimises, or leaves the app, after a 10-second grace period the **teacher** sees
  "not on the lesson screen" with the duration. The learner sees a gentle "your teacher is waiting". The teacher can
  turn the warning off when they asked the learner to open something. It is recorded in the timeline. It is not shown
  in guardian reports for now.

Guardian:
- A guardian can open a **silent observer** view of their child's live lesson from parent mode (no camera, no mic, no
  interaction). Children's lessons only, not adult accounts. The **teacher** sees a small "guardian is watching"
  mark, and the child does not. No guardian has to be present at any age.

Super admin:
- The super admin can enter **any live lesson at any time** as a silent observer, without notifying the teacher, to
  see how the teacher runs the lesson. Notes about the teacher go to the teacher's quality record. Each visit is logged
  for the super admin's own audit. Transparency lives in the teacher agreement and the privacy policy ("the academy
  may observe lessons for quality and safeguarding"), not in a live notice. Whether HR or Supervision roles (lane ST)
  also get this is the owner's call later.

Reports and care:
- No automatic detection of a child's feelings or engagement. Teachers are chosen for emotional and social
  intelligence and judge this themselves.
- What a teacher writes about a child's attitude or difficulty goes to the **guardian only**, never to the child. The
  teacher takes the initiative early and keeps it up, as someone who cares for the child. For an **adult** learner,
  such a note goes to the academy (admin), so the academy can support them.
- Teacher training (University, lane TU) teaches this practice.

Recording: not built (section 2).

## 5. Ideas approved for this plan

Release 1 (with the room):
- Audio first: echo cancellation, auto gain, high-quality Opus; video degrades before audio does.
- **Recitation mode** (teacher toggle): turns off the browser's noise suppression and raises audio quality during
  recitation, because noise suppression damages ghunnah and madd.
- Network indicator (good, weak, poor) next to each name, from WebRTC stats.
- "You're talking while muted" hint.
- Ring around whoever is speaking.
- Three layouts: conversation (video large), content (curriculum, mushaf or board large), screen share. Teacher
  keyboard shortcuts for mute and layouts.
- Session timer with a calm 5-minute warning (teacher), per the rules above.
- Rejoin restores the lesson state: same slide, board, mushaf page, remaining time.
- Board state saved every ~30 seconds and on leave, not on every stroke. Live sync over the realtime channel.
- The teacher's pointer is shown on the learner's screen with the teacher's name.
- Reactions: raise hand, "I didn't understand", "slower please", "say it again", "I'm thinking".
- File import: a PDF or images open as synced pages on the board (pdf.js) that both can annotate.
- Whiteboard: Excalidraw (MIT), RTL text, Arabic keyboard with tashkeel.
- Focus warning, as decided.

Release 2:
- Floating video when the teacher switches tab (Document Picture-in-Picture; Chrome and Edge only).
- Background blur on the device.
- Correction card ("said X → correct Y") without interrupting, feeding the mistake bank.
- Understanding check: the learner taps green, amber or red at the end of each lesson part.
- Lesson stages bar from the curriculum lesson plan (review → lesson → practice → close).
- Talk-time ratio (teacher only, language lessons), feeding the teacher's monthly report.
- Play an audio file in the room, ducked under the teacher's voice.
- Shared YouTube player (teacher controls play, pause and seek for both).
- Shadowing: the teacher records a short line, and the learner repeats and compares.
- Warm-up prompts for the teacher from the last lesson and level.
- Learner comfort: dark, warm, larger text, on the learner's side only.

Release 3:
- Text tools: hide or show tashkeel, fill the blanks, unscramble words (strong for Fusha).
- Quick games (question wheel, word matching), aligned with the curriculum games plan. No gambling-like mechanics
  (RULES / backlog design direction).
- Role-play cards (one side for the teacher, one for the learner).
- Teacher-given stars recorded in the existing Hall of Honor system: badges only, never discounts.
- Shareable milestone card: badge and name only, no faces.

## 6. Architecture (decided at this level; details left to the builder)

**One lesson timeline.** Every action in the room is a typed event on one realtime channel: slide change, ink, board
change, mushaf mark, correction, new word, reaction, focus change, quality sample, join and leave, fallback raised. The
room's live state is the fold of these events. Selected events are persisted as the lesson's timeline. A new tool
later means a new event type and a new panel, without changing the core.

**Reuse what exists:**
- NX-12 room (`src/lib/lessonRoom.ts`, `server/routes/lessonRoom.ts`, `src/dashboard/pages/LessonRoomPage.tsx`):
  synced slides, pen, highlighter, laser.
- Curriculum player and catalog (`src/curriculum`).
- Homework (NX-02), daily review (NX-01), recitation recordings with teacher replies (NX-03, 30-day retention).
- The after-lesson flow (`AfterLessonFlow.tsx`, `PostLessonSummaryEditor.tsx`): family summary, private notes,
  achievements, homework, next steps.
- Attendance (`server/routes/attendance.ts`), today fed by Zoom webhooks plus site opens.

**Media:** Cloudflare Realtime sessions and tracks. Credentials are issued by our server only, for the teacher and
learner of that booking (plus a receive-only observer for the guardian), valid only inside the room's open window.
Simulcast and bandwidth caps implement the 1080p ceiling and adaptation.

**Signalling and sync:** Supabase Realtime. The current NX-12 channel name is an HMAC of the booking id on a public
broadcast channel. The builder decides whether to move to Supabase private channels with authorization, or to keep
the unguessable key with server-issued short-lived tokens. Either way, the security review must cover it.

**Attendance and pay:** join and leave times come from our room (server-side events or verified client events), with
the existing 15-minute student no-show rule and the RULES.md "what is paid" table. Teacher lateness over 2 minutes
creates the mandatory reason flow (section 4). Zoom attendance stays active for lessons that used the fallback.

**Reports, three audiences:**
- Learner-facing: what we covered (slides, mushaf pages), new words, corrections and mistakes to review, homework.
  Shown in the learner portal and in the curriculum progress. This is the "report fills itself" from the timeline.
  The teacher reviews it and sends.
- Guardian-only: the family summary plus concern notes about the child. Never visible in the child's view or to the
  child's device (NX-16 child phone included).
- Private: teacher plus admin (existing private notes), and concern notes about an adult learner.

The builder must check what the learner and child views show today, and keep the existing family summary behaviour
unless this split requires a change.

**Quality data:** per lesson and side: start resolution, lowest resolution, minutes degraded, minutes audio-only,
reconnects, the 720p pre-check result, focus-away totals, teacher lateness. The monthly teacher report and the alerts
read from it. FN-05 also uses it later.

**Fallback detector:** client and server signals (room failed to connect within N seconds, repeated ICE failures,
Cloudflare API errors) raise an incident to the super admin (notification plus record). The incident reveals the Zoom
button for that booking. The Zoom meeting already exists per booking.

## 7. Zoom removal plan (what changes)

Zoom touches about 92 files. The new room becomes the primary link everywhere; Zoom becomes the hidden fallback:
- Lesson links in emails, reminders and the calendar event (`emailTemplates`, `reminderEngine`, `syncEngine`).
- The "start lesson" button for teachers and the join page for learners (`StartLessonButton`, learner lesson pages).
- RULES.md "Zoom host" rule: replaced by the room rules in section 4. The owner approves the RULES.md text.
- Legal and help pages (terms, privacy, safety, FAQ): mention our room, the observer view, the data recorded, and Zoom
  as fallback. The owner approves the legal text.
- Attendance and pay: the room becomes the source, and Zoom is used only for fallback lessons.

Rollout: build behind a switch. Test with Ahmed (UX tester) first, then real lessons for Mahmoud and Afnan with the
fallback ready. The owner decides when Zoom goes.

## 8. Safety and security (must be in the plan and its review)

- Server-issued, short-lived room credentials. Only the booking's teacher and learner, the guardian observer, and
  the super admin observer. A room exists only in its time window.
- No recording anywhere.
- Children: concern notes are guardian-only. The observer is receive-only. The focus warning is not shown to
  guardians.
- Rate limits on room endpoints. The security review covers the realtime channel and the Cloudflare credential
  endpoint.
- Full test run, `/code-review`, and a security check before `main`, as red-zone work.

## 9. Quran homework and the mistake detector (part of this plan)

**A full Quran tab**, built our way, for learners in any Quran track (reading, tajweed, memorisation, revision), and
also for Islamic studies and Fusha learners. Nobody else sees it. It has every feature below:
- **Mushaf with tajweed colours** (Uthmani text with tajweed markup, from the Quran Foundation Content API, which
  allows use inside a paid app; credentials stay on the server). The whole Quran, with homework opening straight at the
  assigned surah or pages.
- **Listen and repeat:** a known reciter with word highlighting (Quran Foundation audio and timing).
- **Detector:** the learner records the assigned part. An open model flags missing, changed or extra words, and the
  learner sees the result. They can send the recording to the teacher through the existing NX-03 flow. Model licence
  must allow commercial use (check before choosing). It runs in the browser where the device allows, or on a small
  server.
- **Automatic tajweed hints:** never shown to teachers. Shown to learners only after an accuracy test: our teachers
  mark 100 recordings, and hints ship (labelled "experimental") only at 90% or better agreement.
- **In the lesson:** a synced mushaf where the teacher marks and highlights mistaken words. The marks reach the learner
  after the teacher sends the report, like curriculum progress. They feed one **mistake bank** shared with language
  corrections, which drives review (NX-01) and homework (NX-02).

## 10. Left to the builder

- Exact Cloudflare Realtime integration, simulcast layers and adaptation thresholds.
- Event schema and which events persist.
- Private channel vs token-protected channel (section 6).
- Detection thresholds for the fallback and quality alerts. Starting values are in section 4, and they are editable.
- Choice of the open recitation model (licence first).
- The visual design of the room, timer and observer view. It goes through the design skills (`brainstorming`,
  `impeccable`, `apple-design`). Site identity, no green.

## 11. Builder check: calls made, and questions for the owner

Answered by the owner (2026-11-17): fallback pay, observer visibility, late-reason blocking, room vs Zoom windows,
order (classroom first, then the Quran tab with homework and the detector), and super admin observation (all in
section 4). The owner opens the Cloudflare and Quran Foundation accounts.

Calls made by Claude (the owner can overrule them):
- **Child and guardian on one account:** the guardian-only notes and the observer button live only behind the
  existing parent gate (the kid mode's parent-only gate in `src/kid/KidApp.tsx`), and never on a linked child phone
  (NX-16). The learner's join uses the child's profile. The observer is a separate receive-only credential.
- **Success gate:** Release 1 is what the 4-week trial judges.
- **Room window:** the 10-early / end + 15 window applies to every lesson type in our room, free trials included.
  `src/lib/lessonWindow.ts` keeps the Zoom rule for the fallback, and the room gets its own window function. Its
  server checks, reminders and tests are updated.
- **Detector hosting:** in the browser only (free). A device that cannot run the model shows "send your recording to
  your teacher" (the NX-03 flow) instead.

## 12. Later: the app

Cloudflare Realtime uses standard WebRTC, which runs in React Native and native iOS/Android. Keep room logic (events,
roles, timing, quality) separate from screens, and keep all rules on the server, so the app reuses them. Teacher screen
sharing from a phone becomes possible in the native app (ReplayKit, MediaProjection).
