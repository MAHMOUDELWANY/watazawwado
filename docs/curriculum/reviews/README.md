# Curriculum reviews: where we are

Read this first in any session that touches curriculum review. Skill:
`.claude/skills/WATAZAWWADO-curriculum-review` (formats in its `state.md`). Every run has a run file with its phases,
verdicts, the owner's decisions and what was not checked; the English records and the Arabic report sit beside it.

## Runs
| Run file | Folder | Lessons | Mode | State | Next step |
| --- | --- | --- | --- | --- | --- |
| [2026-11-17-L01-L03](zad-adults/2026-11-17-L01-L03.run.md) | zad-adults | L1–L3 | L1 full, L2–L3 lean | reported | owner answers the 5 questions and accepts / rejects the majors by id |

States: `running` → `reported` → `decided` → `fixing` → `fixed` → re-review → `closed`.

## Known course-wide defects
Found once; they sit in shared player or style code, so fixing them once fixes every lesson. Later findings cite them
as `known: CW-n` instead of raising them again.

| Id | Defect | Found in | Fixed in |
| --- | --- | --- | --- |
| CW-1 | Title gradient (gold to teal) puts a green letter in every title | zad-adults L1 art-director-1 | |
| CW-2 | Dark "warm night" background has an olive glow bottom right | zad-adults L1 art-director-2 | |
| CW-3 | Tadabbur blocks are in the data but no component renders them | zad-adults L1 curriculum-designer-1 | |
| CW-4 | "Think first" card comes after the stage has drawn the answer | zad-adults L1–L3 learning-scientist-1 | |
| CW-5 | Phone portrait: slide ~26% of screen height, text 3–6 px, half the screen empty | zad-adults L1 motion-defects-3 | |
| CW-6 | Phone landscape: bottom ~85 px of every slide cut off | zad-adults L1 motion-defects-1 | |
| CW-7 | Prev/Next buttons sit on the slide content (phone and desktop) | zad-adults L1 motion-defects-2, -6 | |
| CW-8 | No safe area above the chapter bar; stage art touches it | zad-adults L2 motion-defects-5, L3 motion-defects-3 | |
| CW-9 | Quote layer drawn over the dimmed previous scene | zad-adults L1 motion-defects-5, L2 -4, L3 -1 | |
| CW-10 | Page change passes through a flat grey-brown frame | zad-adults L1 motion-defects-12 | |
| CW-11 | Player toolbar stays light in dark mode | zad-adults L1 motion-defects-13 | |
| CW-12 | Code-drawn figures: long neck, missing or one-tube arms, style changes per page | zad-adults L1 art-director-8 | |
| CW-13 | Animated title words have no real spaces (screen readers read one word) | zad-adults L1 motion-defects-14 | |

## Waiting for the owner
- zad-adults L1–L3: the 5 decisions, the majors by id, and the owner checks (Dorar numbers, licences, two names):
  [run file](zad-adults/2026-11-17-L01-L03.run.md#owner-checks).
