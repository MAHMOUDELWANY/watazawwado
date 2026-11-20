# Classroom: the whole build, one list (owner, 2026-11-20)

The owner's rule: no "release 1 / release 2" split. Everything the classroom needs is built now, correctly, so the
owner can test the whole workflow from booking to report. Later work is only improvement of finished features.
Design (look and feel) waits until the owner connects the Mobbin MCP; until then every new screen uses our existing
components and tokens and stays simple. Parked by owner decision, not built: lesson recording, automatic emotion or
engagement detection.

This file replaces the Release 1/2/3 split in the spec (`docs/superpowers/specs/2026-11-17-classroom-design.md` §5) and
the "phases" in `AUDIT-2026-11-20.md` §E. The spec stays the source for behaviour details.

Status: ✅ done and live · 🔨 building · ⏳ queued

## 1. Before the lesson

| # | Item | Status |
|---|---|---|
| 1.1 | Room window: opens 10 min early, hard close at end + 15 | ✅ |
| 1.2 | Lesson links point to our room (dashboard, portal, kid phone, emails); Zoom only as fallback | ✅ |
| 1.3 | Child phone enters the room as the learner | ✅ (2026-11-20) |
| 1.4 | **Teacher prep mode:** from the lesson card, any time before the lesson, the teacher opens the lesson (slides opened at the learner's place, files uploaded, private notes), all kept for the room; then "Join the room" | ⏳ |
| 1.5 | **Waiting room:** camera and mic permission help when blocked (per browser, how to allow, retry that really asks), camera preview, mic level, speaker test, network test (speed and latency to our media server), 720p check, never blocks entry, results recorded | ⏳ |
| 1.6 | **Parent PIN:** a parent sets a 4-digit PIN; parent-only things (Watch the lesson, and the existing parent pages when a child uses the parent's device) ask for it | ⏳ |

## 2. In the lesson

| # | Item | Status |
|---|---|---|
| 2.1 | Video and audio over Cloudflare, adaptive quality up to 1080p, audio first, recitation mode | ✅ (camera fixed 2026-11-20; re-test live) |
| 2.2 | Screen share, PDF and image upload seen by both, synced slides with pen, highlighter, laser | ✅ |
| 2.3 | Slides open on the booked subject at the learner's place | ✅ (2026-11-20) |
| 2.4 | Timer (teacher always, learner on demand), 5-minute warning, focus warning (teacher only) | ✅ |
| 2.5 | Guardian silent observer (teacher sees it, child does not), super admin silent observer (logged) | ✅ |
| 2.6 | Zoom fallback on an incident on our side | ✅ |
| 2.7 | **Our own whiteboard** (replaces Excalidraw): built on the slide pen; pen, highlighter, eraser, shapes, arrows, Arabic text with tashkeel keyboard, laser, undo, pages, annotate PDF pages and images, synced live and saved for rejoin | ⏳ |
| 2.8 | **Talk time:** teacher and learner speaking time from both mic levels, shown to the teacher, saved for the report | ⏳ |
| 2.9 | Network indicator per side, "talking while muted", speaking ring, reactions, pointer | ✅ |
| 2.10 | **Teaching tools:** correction card (said X → correct Y) into one mistake bank; understanding check (green, amber, red per lesson part); lesson stages bar from the lesson plan; play an audio file; shared YouTube player; shadowing (teacher records a line, learner repeats and compares); warm-up prompts from the last lesson; learner comfort (larger text, warm or dark) | ⏳ |
| 2.11 | **Practice tools:** hide or show tashkeel, fill the blanks, unscramble words, quick games (question wheel, word matching, no gambling-like mechanics), role-play cards | ⏳ |
| 2.12 | **Picture-in-picture video** when the teacher switches tab (Chrome, Edge) and **background blur** | ⏳ |
| 2.13 | Ending early asks why (2+ min early, 10+ characters) | ✅ (2026-11-20) |

## 3. After the lesson

| # | Item | Status |
|---|---|---|
| 3.1 | Teacher late more than 2 min: blocking reason popup; admin excuses or deducts | ✅ (fixed 2026-11-20; re-test live) |
| 3.2 | **Automatic attendance verdict:** from room joins and leaves under the attendance policy (RULES.md "what is paid", 15-minute no-show), the lesson is marked completed, learner no-show or teacher no-show by itself; Zoom-fallback lessons by Zoom attendance | ⏳ |
| 3.3 | **Report draft that fills itself:** slides covered (lesson, page X to Y, from time on each page and pen use), files shared, corrections, talk time; the teacher edits and sends; files appear for the learner in the report | ⏳ |
| 3.4 | **Rating:** after the lesson the learner (the parent for a child) rates it 1–5 with an optional note; private to the academy; the teacher sees their own average only | ⏳ |
| 3.5 | **Admin lesson view:** per lesson, the timeline, attendance verdict, lateness and early-end reasons, quality, observations, rating | ⏳ |
| 3.6 | Monthly connection report per teacher and mid-month alert | ✅ |

## 4. The Quran tab (spec §9)

| # | Item | Status |
|---|---|---|
| 4.1 | Mushaf with tajweed colours (Quran Foundation API, keys on the server) | ⏳ |
| 4.2 | In the lesson: synced mushaf, teacher marks mistaken words; marks reach the learner with the report and feed the mistake bank | ⏳ |
| 4.3 | Homework opens at the assigned pages; listen and repeat with a reciter and word highlighting | ⏳ |
| 4.4 | Word-mistake detector in the browser (open model, licence checked); devices that cannot run it send the recording to the teacher (NX-03) | ⏳ |
| 4.5 | Automatic tajweed hints: only after 100 teacher-marked recordings reach 90% agreement (an accuracy test, not a launch item) | ⏳ |

## 5. Design (waits for the Mobbin MCP)

The look of the room, waiting room, prep mode, observer views and admin pages. Prototype 2–3 looks with our identity,
the owner picks, then apply.

## How it is built

Work runs in parallel in separate git worktrees (before / in / after the lesson, then the Quran tab), each with tests.
Every piece is merged, type-checked, tested and built, then checked on a Vercel preview with a real camera, a real mic and
the child phone before `main`. The owner gets one end-to-end test script at the end.
