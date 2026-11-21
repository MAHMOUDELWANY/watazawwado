# Review state on disk

Two kinds of file keep every review findable from any session. Both are English (project rule), committed to `main`.

## 1. `docs/curriculum/reviews/README.md` (the index)

```markdown
# Curriculum reviews: where we are

Read this first. Skill: `.claude/skills/WATAZAWWADO-curriculum-review`.

## Runs
| Run file | Folder | Lessons | Mode | State | Next step |
| --- | --- | --- | --- | --- | --- |
| [2026-11-17-L01-L03](zad-adults/2026-11-17-L01-L03.run.md) | zad-adults | L1–L3 | full L1, lean L2–L3 | reported | owner decides 5 questions + must-fix ids |

States: `running` → `reported` → `decided` → `fixing` → `fixed` → re-review → `closed`.

## Known course-wide defects
Found once, apply to every lesson until fixed in shared code. Findings cite them as `known: CW-n`.
| Id | Defect | Where it was found | Fixed in |
| --- | --- | --- | --- |

## Waiting for the owner
Decisions and checks only he can do (Dorar numbers, licences, names), with the run they come from.
```

## 2. The run file `docs/curriculum/reviews/<folder>/<YYYY-MM-DD>-L<a>-L<b>.run.md`

```markdown
# Review run · <folder> · L<a>–L<b> · <YYYY-MM-DD>

- Type: review | re-review of <run file>
- Mode: full | lean (per lesson)
- Lesson commit: <hash> (the code the pack was built from)
- Pack (scratch, not in git): <path>
- Owner report: <Artifact link> · Markdown copy: [<date>-report-ar.md](<date>-report-ar.md)

## Phases
- [ ] Run opened (this file + README row), pushed
- [ ] Evidence pack L<a> … L<b>
- [ ] Panel L<a> (experts: 9/9) … one line per lesson
- [ ] Refuter + chair per lesson (records written)
- [ ] Course panel (record written)
- [ ] Arabic report published + Markdown copy committed
- [ ] Chat summary sent, PLAN §8 line

## Verdicts
| Lesson | Verdict | Score | Blockers | Majors | Minors | Record |
| --- | --- | --- | --- | --- | --- | --- |

## Decisions (owner)
| Id | Severity | Decision | Reason | Date | Fixed in |
| --- | --- | --- | --- | --- | --- |

## Owner checks
Things no tool could verify; each needs his answer before launch.

## Carried forward
From the previous run: "not checked" items and known defects this run had to check first.

## Not checked in this run
```

Tick a phase only when its files exist. Commit message: `review(<folder>): L<a>–L<b> <phase>`.
