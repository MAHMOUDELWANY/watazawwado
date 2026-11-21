---
name: WATAZAWWADO-curriculum-review
description: Use when the owner asks to review, critique, audit, evaluate or judge curriculum (المنهج) lessons before launch, for any subject, age band or level, even from a short prompt ("راجع المنهج", "راجع دروس كذا", "قيّم زاد للكبار", "review seerah kids", "is this ready?"); when he asks where a review stands ("وصلنا فين في المراجعة", "التقارير فين"); when he answers a review report by finding id; or when accepted findings are fixed and need re-checking.
argument-hint: "[content folder | subject | all] [--from LNN] [--rereview <run>]"
---

# Curriculum review

An expert panel reviews lessons the way a university curriculum is examined: harsh, specific, evidence-backed, and
constructive. The panel judges as experts, not as a rule checker: a lesson can obey `docs/curriculum/RULES.md` and still
fail. Design and reasons: `docs/superpowers/specs/2026-11-14-curriculum-review-skill-design.md`.

**Default mode is report-only. Never edit lesson content, briefs or `reviewed` in a review run.** Fix mode (§9) stays
locked until [owner-calibration.md](owner-calibration.md) records the owner's written unlock.

**Everything a review learns lives in `docs/curriculum/reviews/` on `main`, committed as it happens.** A new session, on
any account, must be able to answer "where are we?" from those files alone. Formats: [state.md](state.md).

## 0. Read first
1. `docs/curriculum/reviews/README.md`: every run, its state and the next step. If a run is open, **resume it from its
   run file**; never restart it or start a second run of the same lessons.
2. [owner-calibration.md](owner-calibration.md): what the owner rejected, what the panel missed, his taste.
3. [panel.md](panel.md): the finding format, the nine expert briefs, refuter, chair, course panel.
4. `docs/curriculum/RULES.md`, the version's `RULES.md`, `MAP.md` and style guide, the lesson briefs.
5. `.claude/skills/curriculum-builder/owner-feedback.md` (flaws the owner already rejected once).

## 1. Scope: a run is a block of consecutive lessons
- **A run covers at least three consecutive built lessons of one content folder** (`src/curriculum/content/<folder>/`),
  or every built lesson if the folder has fewer than three. The course panel (§6) is part of every run: the web between
  lessons is the owner's first question, and one lesson alone cannot answer it.
- Default block: the lesson after the last reviewed one, up to three or four lessons (`--from LNN` to choose). The
  first lesson of a later block is always read with the lessons before it, so callbacks are judged against the real
  earlier text.
- A single lesson is reviewed only in re-review mode (§10).
- Larger scope (a subject, `all`): say how long it takes, then run block by block, folder by folder. Skip a block whose
  run is already reported for the current commit of its lessons.
- Lean mode for speed or big scopes (§4); the lesson stays the unit of quality in both modes.

## 2. Open the run on disk (before any expert)
1. Create the run file `docs/curriculum/reviews/<folder>/<YYYY-MM-DD>-L<a>-L<b>.run.md` from [state.md](state.md):
   scope, mode, lesson commit, phase checklist, carried-forward checks.
2. Add its row to `docs/curriculum/reviews/README.md` with state `running`.
3. Commit both and push to `main` now (`git push origin HEAD:main` from a worktree; commit only review files). Then
   after **every** phase: tick it in the run file, commit, push. A run that dies halfway resumes from the last tick.
4. Copy the carried-forward items into the dispatch brief: the previous run's "not checked" list and the README's
   known course-wide defects. Known defects are tagged `known: CW-n` in findings, not raised again as new.

## 3. Evidence pack (per lesson)
Start `curriculum-preview` (`.claude/launch.json`), then from the repo root:
`sh scripts/curriculum/review-pack.sh <scratch>/review <folder> <lessonNumber>` (run in the background; ~15–20 min a
lesson). It writes page text, build shape, the evidence list, a contact sheet of **every build step of every page**
(desktop), and real-time player runs on phone portrait (default and full screen), phone landscape (full screen) and
desktop dark, with `run.json` (console issues, frame gaps, horizontal overflow). The preview page cannot scroll, so a
non-full-screen landscape run looks cut off: judge phones in full screen. Black frames seen only in the step sheets are
page-clock artefacts. Screenshots stay in the scratch folder, never in git.

Write one dispatch brief per run in the scratch pack (paths, pack layout, these known limits, carried-forward items)
and point every expert at it: the briefs then stay short and identical.

Also gather: the subject's source books in `C:\Users\ahmed\Documents\watazawwado-sources\<subject>\` and the rows of
`docs/curriculum/sources.md`. Missing folder or unreadable book: the source comparison is reported **not done**.

**Tool evidence only.** A hadith number, grading, wording, date or licence term is stated only after a tool returned it
(quran.com connector, a fetched page, a book file). What no tool could reach (Dorar and sunnah.com refuse automated
requests) goes under "not checked" and into the run file's owner-checks list, never into a finding "from memory".

## 4. Panel (per lesson)
Dispatch the nine experts in [panel.md](panel.md) as independent subagents, in parallel, each with: its brief, the
finding format, the calibration file, the pack path, the lesson file paths, and where to write its findings
(`<pack>/findings/<expert>.md`). Each expert has a fresh context and sees no other expert's findings. An expert returns
only a count and the path. Every subagent prompt that explores code carries the project's graphify rule (CLAUDE.md).
**At most six experts running at once, and finish one lesson before starting the next** (27 at once exhausted the
account's usage limit in minutes and lost every result, 2026-11-14). Findings are files, so a run that hits the limit
resumes by dispatching only the experts whose file is missing. Cost: one expert is roughly a sixth of a five-hour usage
window. **Lean mode** (four reviewers holding the nine briefs: scholar + sources · designer + learning + age · story +
teacher · art + motion) costs about a third; use it when the owner asks for speed or the scope is a whole subject, and
say in the report and the run file which mode ran. If subagents are unavailable, run the briefs one after another
yourself and say so in "not checked".

## 5. Refute, then chair
1. **Refuter** (fresh subagent): tries to knock down every finding by re-opening its evidence. Disproved findings are
   dropped from the owner report and kept in the record as `refuted` with the reason.
2. **Chair** (you): merge duplicates, keep the strongest evidence, resolve or report contradictions, rank by severity,
   score and issue the verdict (§5 of panel.md). Open every blocker's and major's evidence yourself before it ships, at
   the lesson commit written in the run file (a lesson edited since the pack was built invalidates its findings).
   `python scripts/curriculum/review-merge.py <pack>/L<n> <folder> <n> <date>` applies the refuter's verdicts, folds
   duplicates, scores, and writes the English record plus `<pack>/L<n>/findings.json`. Check its "Raised" count against
   the number of `### ` headings in the findings files: a malformed heading is silently skipped.

## 6. Course panel (every run, after its lessons)
The course panel in [panel.md](panel.md) reads the text of every lesson in the block **and every earlier lesson of the
folder**, plus all surviving findings, and judges the web between lessons, progression, consistency and the design
system. The owner's first question is always **"does accumulation work?"**: the panel builds a callback ledger (every
later page that recalls an earlier lesson: on the slide or only in the notes; recalled from memory or only told), lists
the callbacks that should exist, and ends with a blunt verdict and the smallest set of line-level changes. It writes
`<pack>/course-findings.md` (English, copied to `docs/curriculum/reviews/<folder>/<date>-course.md`) and
`<pack>/course-ar.json`, which the report script renders as its own section. Write both into the pack root: a subagent
was blocked from creating a new subfolder (2026-11-17).

## 7. Output (all in `docs/curriculum/reviews/<folder>/`, committed)
1. **English records:** `<date>-LNN.md` per lesson and `<date>-course.md`: verdict, score table, every finding with id
   and `status: open`, refuted findings, rule challenges, not checked.
2. **Owner report (Arabic):** one private Artifact page per run, layout in [report.md](report.md). A subagent per lesson
   writes `<pack>/L<n>/findings-ar.json`; the chair writes `<pack>/chair.json`; then
   `python scripts/curriculum/review-report.py <pack> <out.html>` builds the page (it refuses to build while any finding
   lacks Arabic text). Publish it, then keep the same report in git:
   `python scripts/curriculum/review-report-md.py <out.html> docs/curriculum/reviews/<folder>/<date>-report-ar.md`.
3. **Run file:** verdicts, counts, the Artifact link, the decisions table with one row per must-fix id (decision
   empty), the owner-checks list, the "not checked" list. README row state `reported`.
4. **Chat (Arabic):** verdict per lesson, counts by severity, the three worst findings, the link, and the questions the
   owner must answer (decisions, owner checks).
5. One log line in `docs/curriculum/PLAN.md` §8. Commit and push the records, run file, README and skill changes; never
   the screenshots.

## 8. "Where are we?" (any session)
Answer from `docs/curriculum/reviews/README.md` and the open run file: which lessons were reviewed, verdicts, the
report link and its Markdown copy, decisions taken and pending, fixes done, the next step. If the README and git
disagree (a review commit on an unmerged branch: `git log --all -- docs/curriculum/reviews`), say so and bring the
records to `main` before anything else.

## 9. After the owner reads a report
- He answers by id ("اقبل subject-scholar-1، ارفض art-director-18 لأن…"): write each decision, reason and date in the
  run file's decisions table and the finding's `status` in the English record, in the same session; a rejection or a
  missed flaw also goes into [owner-calibration.md](owner-calibration.md). README state `decided` once every must-fix
  id has a decision.
- An accepted rule challenge changes `docs/curriculum/RULES.md` (or the version rules) and `curriculum-builder` only
  with his explicit yes, recorded with its date in both.
- Fix mode (locked): only accepted findings, through `curriculum-builder` and its verification, one lesson at a time;
  tick each id as fixed in the decisions table with its commit. README state `fixing`, then `fixed`.

## 10. Re-review (after fixes)
A new run file of type `re-review` pointing at the original run. For every accepted finding: `fixed`, `partly`,
`not fixed` or `regressed`, with evidence from a fresh pack. Then the motion and art experts look at every page the
fixes touched and the course panel re-checks the callbacks of the whole block. New flaws are new findings. README state
of the original run becomes `closed` when nothing accepted is left open.

## A finding ships only if
It names lesson, page and step; shows evidence someone else can open; says why an expert calls it a flaw; and gives a
concrete fix. Anything less is deleted, however true it feels.

## Red flags: stop and redo
- A run of one lesson that is not a re-review, or a run without the course panel.
- A phase finished but not ticked, committed and pushed; review files living only on a side branch or in scratch.
- A hadith number, grading or licence term written from memory ("I recall", "أذكر").
- A sentence in the report that would fit any lesson ("pacing could improve", "consider more interaction").
- A finding whose evidence you have not opened yourself.
- A research claim with no named principle or source, written as fact.
- Praise used to soften a verdict. The "keep" list is for the fixer, three to six lines, no adjectives.
- Repeating what `test/curriculum-rules.test.ts` already enforces and calling it expert review.
- A flaw seen only under the manual page clock and not re-checked in the real-time run.
- "The owner already approved this lesson" used as a reason to go easy. He asked for the opposite.
- Telling the owner a check was done when the pack or a source was missing.
- Re-raising a known course-wide defect as a new finding in every lesson.
