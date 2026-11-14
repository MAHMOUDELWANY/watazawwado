# Design: `curriculum-review` skill (expert-panel review of the curriculum)

Date: 2026-11-14. Agreed with the owner in chat (brainstorming). Items marked **(Claude's call)** were chosen by Claude
and not discussed in detail; the owner can overrule them.

## 1. Intent

Before launch the owner wants every lesson of every subject, age band and level reviewed the way a university
curriculum is reviewed by a panel of specialists: harsh, analytical, specific, and constructive (every flaw comes with
its fix). He is short on time, so one call to the skill must do the whole job without him. He will still read the
reports himself and correct the skill, and the skill must learn from those corrections.

The review judges as experts, not as a rule checker. A lesson that follows every rule in `docs/curriculum/RULES.md` can
still fail, and the panel may criticise a rule itself (reported as a "rule challenge", never applied silently).

## 2. Goals

- One skill, `.claude/skills/curriculum-review/`, that works for every subject in `src/curriculum/content/` (Zad
  Essentials, Seerah, Quran reading, Tajweed, literacy, Fusha, Egyptian, English) and every band and level.
- Invoked with any scope: one lesson, one subject+band (a content folder), a whole subject, or the whole curriculum.
  The owner does not need to pick the "best" scope: quality per lesson is the same in all of them.
- A blunt verdict per lesson and per course, with a score, then the findings ranked by severity, each with evidence and
  a concrete fix.
- A report the owner reads in Arabic on phone or computer, plus an English record in the repo for later steps.
- Learns from the owner: a calibration file records what he rejected and what the panel missed.

## 3. Non-goals

- Fixing lessons. Default mode is report-only; the skill stops and waits for the owner to choose. A "find and fix" mode
  is designed in (§9) but locked until the owner says, in writing, that he trusts the reports.
- Reviewing the public site, the student portal or the player chrome, except where a player bug shows inside a lesson.
- Replacing the owner's own review, or setting `reviewed: true`.
- Being the final judge of hadith authenticity or of a fiqh/aqeedah point: the panel flags, the owner decides
  (RULES §1.2).

## 4. Anti-goals (the skill has failed if any of these happen)

- **Generic findings.** "The pacing could be improved" is worthless to the owner. A finding without a location and
  evidence is deleted before the report.
- **Invented flaws.** Harshness must not manufacture problems. Every finding survives a refutation pass (§6.4).
- **Politeness padding.** No praise sandwiches, no "overall a strong lesson". Strengths get at most a short "keep" list,
  because the fixer must know what not to break.
- **Rule-checklist review.** Repeating what `test/curriculum-rules.test.ts` already enforces is not expert review.
- **AI-sounding report text.** The Arabic report is plain, direct Arabic.

## 5. What a finding is

Every finding, from every expert, has all of these or it is dropped:

| Field | Content |
|---|---|
| `id` | Stable id, e.g. `seerah-kids/L03/F07` |
| `where` | Lesson, page index, build step (or "course level"), and viewport if visual |
| `expert` | Which panel member raised it |
| `severity` | `blocker` (must not launch) · `major` · `minor` · `polish` |
| `evidence` | One of: screenshot path + what to look at; the exact quoted line; source book file + page next to our line; the reference checked (connector / Dorar) and what it returned |
| `why` | Why an expert calls it a flaw, naming the principle or study when one is claimed |
| `fix` | The concrete change: rewritten line, redrawn proportion, reordered pages, new recall hook, etc. |
| `confidence` | `confirmed` (reproduced/verified) or `judgement` (expert opinion) |

Claims about research ("retrieval practice", "cognitive load", SLA findings) name the principle and a checkable source;
an expert who cannot name one states it as judgement. No invented citations.

## 6. How a review runs

### 6.1 Scope resolution
The argument resolves to a list of lessons (`src/curriculum/content/<folder>/lNN-*.ts`) grouped by content folder
(subject × band × level). No argument: ask which scope. "Everything": folders one after another, each with its own
report, resumable (a folder with a finished report for the current commit is skipped unless `--redo`).

### 6.2 Evidence pack (once per lesson, shared by all experts)
Built with the existing tools in `scripts/curriculum/` (see its README):
- Page text and teacher notes: `dump.ts`, `dump-evidence.ts`, `audit.ts`.
- Screenshots of **every build step of every page** at desktop and phone width, light and dark, as contact sheets
  (`shots.mjs`, `sheet.py`), from the `curriculum-preview` server.
- A real-time run in the real player (`&player`): swipe/next through the lesson, record console errors, slow or stuck
  transitions, elements covering each other during the slide change, interactions that do not respond. The manual clock
  hides some real-time bugs and invents others (README notes), so anything seen only under the manual clock is
  re-checked in real time before it is reported.
- The lesson brief, the version `MAP.md`, `RULES.md` files and style guide.
- The source material for the subject: `C:\Users\ahmed\Documents\watazawwado-sources\<subject>\` (owner's machine,
  never committed) and the rows of `docs/curriculum/sources.md`. If the folder is missing on this machine, the source
  comparison is reported as **not done**, never silently skipped.

### 6.3 The panel (per lesson)
Nine experts, each an independent reviewer with a fresh context, the same evidence pack, and its own brief
(`experts/<name>.md` in the skill). Each writes findings in the §5 format only.

1. **Subject scholar** — correctness of every ayah, hadith, date, rule and example. Persona depends on the subject:
   aqeedah/fiqh (Shafi'i, Azhari), seerah historian, tajweed/qira'at teacher, Arabic grammarian, language-teaching
   specialist. Verifies Quran through the quran.com connector and hadith on Dorar; unverifiable = flagged for the owner.
2. **Sources and copyright examiner** — opens the source books and compares: copied or closely paraphrased wording,
   borrowed stories, examples, exercises, illustrations or unit order (RULES §1.4: books are scope references only);
   facts that differ from the source; assets and quotes missing from `sources.md`.
3. **Curriculum designer** — outcomes measurable and actually assessed, scope and sequence, prerequisite order, what
   should be added or cut.
4. **Learning scientist** — is the method one that evidence supports for this learner and subject (retrieval, spacing,
   cognitive load, worked examples, dual coding; for languages comprehensible input, output, form-focus)?
5. **Age-band specialist** — vocabulary, sentence length, examples, emotional fit and attention span for Kids 6–11,
   Teens 12–17 or Adults; Western Muslim context.
6. **Story editor** — the driving question, plot, characters, payoff, the cliffhanger; prose quality; anything that
   reads as AI-written (uses the `humanizer` tells).
7. **Art director** — drawing quality (anatomy and proportion of code-drawn figures, parts sticking out), composition,
   hierarchy, typography, palette and identity (crimson/teal/copper/sand/gold, no green), design-system consistency,
   whether the picture serves the idea or decorates, AI-slop look. Uses the design skills as lenses (`impeccable`,
   `taste-skill`, `review-animations`).
8. **Motion and defect tester** — overlaps, clipped or covered elements, glitches during slide change, lag, stuck
   states, broken interactions, RTL/phone layout, reduced motion.
9. **Teacher and parent** — can one teacher run this 1-on-1 on a call in the stated time with these notes? Would a
   parent in the West trust it and pay for it?

The owner's examples in chat (long neck, part sticking out, element over element on swipe, lag, lesson 10 not calling
back to lesson 1, language too hard for the age) are starting points; each expert is told to go beyond them.

### 6.4 Refutation, then the chair
- **Refuter:** a separate reviewer tries to knock down each finding: re-opens the screenshot, re-reads the line,
  re-checks the reference. Findings it disproves are dropped and logged in the English record as "refuted" with the
  reason (so the owner can audit the filter). **(Claude's call.)**
- **Chair:** merges duplicates across experts, resolves contradictions (or reports the disagreement), ranks by severity,
  and issues the verdict.

### 6.5 Course-level review (per content folder, after its lessons)
A second panel pass reads all lesson findings plus the full text of the folder and judges what one lesson cannot show:
- The web: does later material call back to earlier lessons by name ("as we saw in Lesson 1"), are threads and Ahd
  follow-ups honoured, is every cliffhanger answered.
- Progression of difficulty, gaps and repetition, coverage against the level's scope.
- Consistency of cast, look, terms and transliteration across lessons and against the sister bands.
- The design system of this subject and band as a whole: is it the right system for this content and age.

### 6.6 Verdict
Per lesson and per course, no softening:
- **Ready to launch** — no blockers, no majors.
- **Needs fixes** — fixable without rethinking the lesson; lists what must be done before launch.
- **Rebuild** — the concept, structure or look is wrong; patching will not save it.

Plus a score out of 100 with a fixed breakdown **(Claude's call)**: content correctness 25, pedagogy 20, age fit 10,
story and writing 15, visual design 15, motion and defects 10, sources and copyright pass/fail (a confirmed copyright
or authenticity blocker caps the verdict at "Needs fixes" whatever the score).

## 7. Output

- **Owner report (Arabic only):** a private Artifact page, readable on phone and desktop: verdict and score at the top,
  then findings by severity with the screenshot or quote inline and the fix under each, then the short "keep" list, then
  rule challenges, then "not checked" (anything the run could not verify). One page per content folder, with each
  lesson as a section; a single-lesson run makes a single-lesson page. **(Claude's call on the medium.)**
- **Repo record (English):** `docs/curriculum/reviews/<folder>/<YYYY-MM-DD>-LNN.md` and `...-course.md`: the same
  findings with ids, refuted findings, and a `status` per finding (`open` / `accepted` / `rejected` / `fixed`) that the
  owner's decisions update. Screenshots stay out of git (scratch folder; paths noted).
- **Chat:** a few Arabic lines: verdict per lesson, count by severity, the link.
- `PLAN.md` §8 gets one log line per run.

## 8. Calibration (how the skill learns)

`owner-calibration.md` in the skill, read before every run and given to every expert:
- findings the owner rejected, with his reason (do not raise again);
- flaws he found that the panel missed (now mandatory checks);
- his standing taste (what he calls good).
When the owner comments on a report, the same session updates this file and the finding statuses. `curriculum-builder`'s
`owner-feedback.md` is read too, as existing calibration.

## 9. Fix mode (locked)

After the owner marks findings accepted, a later call may fix them through the `curriculum-builder` skill and its
verification, one lesson at a time, then re-review the touched pages. Until the owner unlocks it in writing (recorded in
`owner-calibration.md` with the date), the skill never edits lesson content, even for a trivial fix.

## 10. Constraints

- Follows `docs/curriculum/RULES.md`, never sets `reviewed`, never invents evidence, gradings or studies.
- Project files in English; everything shown to the owner in Arabic.
- Never reads `.env*`; never polls production (review runs on the local preview).
- Source books are read locally and never quoted at length into the repo record: cite file and page, quote at most the
  short phrase needed to show the overlap.
- Cost: nine experts + refuter per lesson is heavy. A whole-curriculum run is long; the skill says so before starting
  and runs folder by folder so it can stop and resume.

## 11. Rollout

1. Build the skill (use `writing-skills`).
2. Pilot on one lesson; the owner reads the report and corrects it; update calibration.
3. Pilot on one full content folder (lesson reports + course report).
4. Then the rest of the curriculum, folder by folder, before launch.

## 12. Left to the builder

- How experts are run (subagents per expert, or a workflow), as long as each expert has a fresh context and the same
  evidence pack.
- Exact layout of the Arabic page and the file naming inside the scratch folder.
- Whether phone screenshots need a change to `shots.mjs` (viewport flag) or a wrapper.
- The wording of each expert brief.
