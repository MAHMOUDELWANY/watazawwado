---
name: curriculum-review
description: Use when the owner asks to review, critique, audit, evaluate or judge curriculum (المنهج) lessons before launch, for any subject, age band or level, at any scope (one lesson, a subject and band, everything), even from a short prompt ("راجع المنهج", "راجع درس كذا", "قيّم زاد للكبار", "review seerah kids", "is this lesson ready?"). Also when he comments on a review report or asks to fix accepted findings.
argument-hint: "[lesson | content folder | subject | all] [--redo]"
---

# Curriculum review

An expert panel reviews lessons the way a university curriculum is examined: harsh, specific, evidence-backed, and
constructive. The panel judges as experts, not as a rule checker: a lesson can obey `docs/curriculum/RULES.md` and still
fail. Design and reasons: `docs/superpowers/specs/2026-11-14-curriculum-review-skill-design.md`.

**Default mode is report-only. Never edit lesson content, briefs or `reviewed` in a review run.** Fix mode (§7) stays
locked until [owner-calibration.md](owner-calibration.md) records the owner's written unlock.

## 0. Read first
1. [owner-calibration.md](owner-calibration.md): what the owner rejected, what the panel missed, his taste.
2. [panel.md](panel.md): the finding format, the nine expert briefs, refuter, chair, course panel.
3. `docs/curriculum/RULES.md`, the version's `RULES.md`, `MAP.md` and style guide, the lesson briefs.
4. `.claude/skills/curriculum-builder/owner-feedback.md` (flaws the owner already rejected once).

## 1. Scope
Resolve the argument to content folders (`src/curriculum/content/<folder>/`) and their lessons. One lesson, a folder, a
subject (all its folders) or `all`. No argument: ask. Larger than one folder: say how long it will take, then run folder
by folder; skip a folder whose record in `docs/curriculum/reviews/<folder>/` is for the current commit unless `--redo`.
Per-lesson quality is the same at every scope: the lesson is always the unit.

## 2. Evidence pack (per lesson, before any expert)
Start `curriculum-preview` (`.claude/launch.json`), then from the repo root:
`sh scripts/curriculum/review-pack.sh <scratch>/review <folder> <lessonNumber>` (run in the background; ~15–20 min a
lesson). It writes page text, build shape, the evidence list, a contact sheet of **every build step of every page**
(desktop), and real-time player runs on phone portrait, phone landscape and desktop dark, with `run.json` (console
issues, frame gaps, horizontal overflow). Screenshots stay in the scratch folder, never in git.

Also gather: the subject's source books in `C:\Users\ahmed\Documents\watazawwado-sources\<subject>\` and the rows of
`docs/curriculum/sources.md`. Missing folder or unreadable book: the source comparison is reported **not done**.

## 3. Panel (per lesson)
Dispatch the nine experts in [panel.md](panel.md) as independent subagents, in parallel, each with: its brief, the
finding format, the calibration file, the pack path, the lesson file paths, and where to write its findings
(`<pack>/findings/<expert>.md`). Each expert has a fresh context and sees no other expert's findings. An expert returns
only a count and the path. **At most six experts running at once, and finish one lesson before starting the next**
(27 at once exhausted the account's usage limit in minutes and lost every result, 2026-11-14). Findings are files, so
a run that hits the limit resumes by dispatching only the experts whose file is missing. If subagents are unavailable, run the nine briefs one after another yourself and say so in
"not checked".

## 4. Refute, then chair
1. **Refuter** (fresh subagent): tries to knock down every finding by re-opening its evidence. Disproved findings are
   dropped from the owner report and kept in the record as `refuted` with the reason.
2. **Chair** (you): merge duplicates, keep the strongest evidence, resolve or report contradictions, rank by severity,
   score and issue the verdict (§5 of panel.md). Open every blocker's and major's evidence yourself before it ships.

## 5. Course review (per folder, after its lessons)
The course panel in [panel.md](panel.md) reads all lesson text and all surviving findings and judges the web between
lessons, progression, consistency and the design system. Runs even for a one-lesson folder only if asked.

## 6. Output
1. **Repo record (English):** `docs/curriculum/reviews/<folder>/<YYYY-MM-DD>-LNN.md` and `<YYYY-MM-DD>-course.md`:
   verdict, score table, every finding with id and `status: open`, refuted findings, rule challenges, not checked.
2. **Owner report (Arabic only):** one private Artifact page per folder, layout in [report.md](report.md). Plain,
   direct Arabic; `humanizer` tells apply. Screenshots inline as evidence.
3. **Chat (Arabic):** verdict per lesson, counts by severity, the three worst findings, the link.
4. One log line in `docs/curriculum/PLAN.md` §8. Commit the record and skill changes; never the screenshots.

## 7. After the owner reads a report
- He rejects a finding or names a flaw the panel missed: update the finding `status` in the record **and** add the
  lesson to [owner-calibration.md](owner-calibration.md) in the same session.
- Fix mode (locked): only findings he marked accepted, through `curriculum-builder` and its verification, one lesson at
  a time, then re-review the touched pages.

## A finding ships only if
It names lesson, page and step; shows evidence someone else can open; says why an expert calls it a flaw; and gives a
concrete fix. Anything less is deleted, however true it feels.

## Red flags: stop and redo
- A sentence in the report that would fit any lesson ("pacing could improve", "consider more interaction").
- A finding whose evidence you have not opened yourself.
- A research claim with no named principle or source, written as fact.
- Praise used to soften a verdict. The "keep" list is for the fixer, three to six lines, no adjectives.
- Repeating what `test/curriculum-rules.test.ts` already enforces and calling it expert review.
- A flaw seen only under the manual page clock and not re-checked in the real-time run.
- "The owner already approved this lesson" used as a reason to go easy. He asked for the opposite.
- Telling the owner a check was done when the pack or a source was missing.
