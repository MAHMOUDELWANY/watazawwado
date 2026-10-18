---
name: curriculum-builder
description: Use for ANY curriculum (المنهج) work in this project, even from a short or vague prompt ("continue the curriculum", "next lesson", "كمّل المنهج", "fix lesson 3", "add a page"): unit maps, lesson briefs, lesson pages, slides, scenes, images, games, teacher notes, Zad Essentials (أول الزاد), Seerah, any age version. Finds the next step, does exactly one step, checks it, and stops for the owner's review.
argument-hint: "[optional: curriculum, lesson or step]"
---

# Curriculum builder

The binding rules are in `docs/curriculum/RULES.md`. This skill is the procedure; it never overrides those rules. If the
two disagree, RULES.md wins and you tell the owner.

## 0. Read before doing anything
1. `docs/curriculum/PLAN.md` §0 ("Where we are": done / now / next).
2. `docs/curriculum/RULES.md` in full.
3. The version's `MAP.md` (e.g. `docs/curriculum/zad-essentials-kids/MAP.md`) and the lesson brief you will touch.
4. `docs/curriculum/sources.md` before researching any source (never re-research a source already there).

## 1. Find the step
- If the prompt names a step, do that step (after checking its earlier steps were reviewed).
- If the prompt is vague, do **the "Next" item in PLAN §0**. If §0 says the owner is still reviewing something, do not
  start new work: say what is waiting for review and ask.
- Order per lesson (never skip, never merge two steps in one turn):
  `map → brief → page text → built pages → ready for review`.

## 2. Do exactly one step

### Map (once per curriculum version)
Units and lesson titles, one-line outcome each, rational step, evidence to find, check type; spine shared with the other
versions (RULES §3). Run `brainstorming` first.

### Brief (`docs/curriculum/<version>/Lxx-<slug>.md`)
Outcomes; the rational step; the evidence table (exact reference, grading, where checked, date); sources used; open points;
owner decisions. Quran via the quran.com connector (read its grounding rules first); hadith grading on Dorar (the in-app
browser works where plain fetch is blocked). Anything unverified is written as "needs review".
No page counts or page text in the brief.

### Page text (`src/curriculum/content/<subject>/lxx-<slug>.ts` + `lxx-teacher-ar.ts`)
Checklist:
- [ ] Stations in order: spark → zad → athar → ahd; every page has `station`.
- [ ] Spark: hook from the learner's world; from lesson 2: recall + last week's Ahd.
- [ ] Rational step before the evidence; a question every 1–3 pages; one "wow" moment.
- [ ] Every ayah: `evidence` with `reference` "Surah name surah:ayah" and a `tadabbur` (word, root, meaning, question,
      action) from recognised tafsir.
- [ ] Every page has `explain` with points the teacher can branch from; `teacherAr` has one entry per page.
- [ ] Sized for 45 minutes; extra slide content marked `optional: true`, no filler, no repetition.
- [ ] Check page (`layout: 'game'`), Ahd page, cliffhanger page (`layout: 'next'`).
- [ ] Age-band rules (RULES §3): characters, doubts, fiqh differences, tadabbur depth, Ahd style.
- [ ] Identity and pride in being Muslim woven in where it fits.
- [ ] `humanizer` run on all English text; Arabic notes in the project's warm 50/50 style (RULES.md §6).
- [ ] `reviewed: false`.

### Built pages
Scene builds on every idea page (one file per lesson in `src/curriculum/slides/lessons/`, primitives in
`slides/Motion.tsx`), the version's look and style guide (`docs/curriculum/style/<version>.md`), no depiction of
prophets, Sahaba or Jibril. Checklist (RULES §1.10):
- [ ] Storyboard first: every page gets its own visual; no image twice in a lesson (except consecutive pages of one scene
      and the doors / backpack devices). The test fails otherwise.
- [ ] Images table in the brief: scenes (4:3 paintings), characters from the library (transparent, reused), props
      (transparent), each with a ready ChatGPT prompt. Ask the owner only for what is missing.
- [ ] Add code-drawn elements freely (bricks, particles, pen lines, lens, parallax). The wow moment is a motion scene.
- [ ] Sound effects (`slides/sfx.ts`) on every key motion; never music.
Record every asset and licence in `sources.md`. Use the design and motion skills (`apple-design`, `animate`,
`taste-skill`, `impeccable`, `review-animations`). All files written in English.

## 3. Verify (always)
- `node node_modules/typescript/bin/tsc --noEmit`
- `npm test` (at least `test/curriculum-rules.test.ts` and `test/curriculum-lesson-player.test.ts`).
- Built pages: open the lesson at `/dashboard/curriculum` in the browser; desktop and phone, light and dark, reduced
  motion; no console errors. The in-app browser pane pauses animation while hidden; use headless Playwright for motion.
- Run `verification-before-completion` before saying the step is done.

## 4. Record and stop
- Update `PLAN.md §0` and add one line to the progress log (§8) with the date.
- Run `graphify update .`
- Tell the owner (in Arabic, plainly) what was done, what to review, and what you could not verify. **Stop.** Do not start
  the next step until the owner reviews.

## Never
- Set `reviewed: true` (only the owner approves).
- Invent evidence, gradings, tafsir, prices, books or session counts.
- Copy or paraphrase a book's wording, examples, exercises or detailed order (scope reference only).
- Publish anything to students or push to production without the owner asking.
