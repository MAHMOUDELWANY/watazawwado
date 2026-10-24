---
name: curriculum-builder
description: Use for ANY curriculum (المنهج) work in this project, even from a short or vague prompt ("continue the curriculum", "next lesson", "كمّل المنهج", "طوّر الدرس", "fix lesson 3", "add a page", "the motion is bad"): unit maps, lesson briefs, page text, slides, motion graphics, scenes, images, games and reviews, teacher notes, any age version (Kids, Teens, Adults), Zad Essentials (أول الزاد), Seerah.
argument-hint: "[optional: curriculum, lesson or step]"
---

# Curriculum builder

Binding rules: `docs/curriculum/RULES.md` (wins over this skill; tell the owner if they disagree). This skill is the
procedure plus the owner's standard for the result: **every page is a designed motion stage where the motion explains
the idea**. The bar and the system are in [motion-stage.md](motion-stage.md); every mistake the owner has already
rejected, with its fix, is in [owner-feedback.md](owner-feedback.md). Read both before building or improving any page.

## 0. Read first
1. `docs/curriculum/PLAN.md` §0 and the last log entries (§8).
2. `docs/curriculum/RULES.md`, the version's `RULES.md` and `MAP.md`, the lesson brief, the version style guide
   (`docs/curriculum/style/<version>.md`).
3. `docs/curriculum/sources.md` before researching any source.
4. [motion-stage.md](motion-stage.md) and [owner-feedback.md](owner-feedback.md).

## 1. Find the step
- Named step: do it (earlier steps reviewed). Vague prompt: do PLAN §0 "Next". If the owner is still reviewing, say so.
- New lesson: `map → brief → page text → built pages → ready for review`, one step per turn.
- **Improving an existing lesson** ("طوّر"): audit it against owner-feedback.md first (text and motion), list what fails
  per page, then fix text and stages together.

## 2. Page text (`src/curriculum/content/<subject>/lxx-*.ts` + `lxx-teacher-ar.ts`)
- One question drives the lesson; each page answers the one before (a story, clues, a reveal), not a list of facts.
- **Text first:** an ayah or hadith appears before any line about it; lines never restate it (the test checks 5-word
  runs). Each line adds something new: a consequence, a contrast, a question, a modern case.
- **3 to 5 lines per idea page.** One or two lines is too thin for the owner.
- English is the learner's language: the meaning in English leads, the Arabic sits beneath it.
- Every ayah/hadith verified (quran.com connector; Dorar in the in-app browser) and logged; unverified = "needs review".
- Stations spark → zad → athar → ahd; a question every 1–3 pages; one wow; a review page; Ahd; cliffhanger.
- `humanizer` on all English; Arabic teacher notes in the warm 50/50 style. `reviewed: false` always.

## 3. Built pages: the motion stage
Follow [motion-stage.md](motion-stage.md): one graphic per page in `src/curriculum/slides/motion/`, wired in
`slides/cinema/scenes.tsx` with `stage: { tone, Graphic, marks?, keepOnAsk? }`. Before writing a graphic, write one
sentence per build step: *what the learner sees move, and what that movement means*. If a step's motion has no meaning,
redesign it. People are articulated SVG figures (`Figure`, `Person` in `kit.tsx`), modern and faceless; **the Prophet ﷺ,
the companions and Jibril are never drawn**: show them as words, points of light, or the same manners in a person today.
A new version or a new look: prototype 2–3 pages, send a video, wait for the owner's yes, then roll out.

Use: `brainstorming` (before a new lesson or look), `apple-design`, `animate`, `emil-design-eng`, `review-animations`,
`impeccable`, `taste-skill`, `humanizer`, `verification-before-completion`. Owner's reference videos: read them frame by
frame with ffmpeg (`fps=2,tile=6x6`).

## 4. Verify (every time, before telling the owner anything)
1. `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` (worktree: `../../../node_modules/...`),
   `tsx --test test/curriculum-*.test.ts`, `vite build`.
2. Start `curriculum-preview` (`.claude/launch.json`), then **screenshot every step of every page you touched** with
   `node scripts/curriculum/shots.mjs` and read contact sheets (`scripts/curriculum/sheet.py`); usage in
   `scripts/curriculum/README.md`.
3. Check each sheet against the bug list in [owner-feedback.md](owner-feedback.md) (overlaps, covered graphics,
   detached heads, empty stages, black screens, text over the chapter bar). Fix and re-shoot until clean.
4. Interactions (reviews, clues, choices): click through them; confirm in real time, not only with the manual clock.
5. Larger changes: record a video (`scripts/curriculum/cast.mjs` + ffmpeg) and send it with `SendUserFile`.

## 5. Ship and report
- Code: commit, push to `main` after tsc + tests + build (owner's standing approval, RULES §7); confirm it is live.
  Content stays `reviewed: false` until the owner approves.
- Log in `PLAN.md` §8 (date, what changed, what waits for review); update the style guide when a design rule changes.
- Restore `.claude/launch.json` and delete any scratch preview files before committing. `graphify update .`
- Tell the owner in Arabic: what changed (page by page, by what it shows), what needs his review, what you could not
  verify (phone, real-time smoothness).

## Never
- Set `reviewed: true`; invent evidence, gradings, tafsir or numbers; copy a book's wording or exercises.
- Ship a page you have not seen at every step.
- Move the camera, add a shape or animate anything that does not explain something on that page.
