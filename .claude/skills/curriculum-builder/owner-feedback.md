# What the owner rejected, and what fixed it

Each row is a real rejection (2026-10-23/24) on Adults Lesson 1. Audit every new or improved lesson against this list.

## Text and storytelling
| Rejected | Fix |
|---|---|
| A line paraphrased the hadith, then the hadith appeared and said it differently: "you make the reader read it twice, as if you had no content" | Show the text first; lines only add something new. The test checks 5-word repeats. |
| One or two lines per page | 3–5 lines per idea page, each one a step of the explanation |
| The hadith shown only in Arabic | English meaning as the hero, Arabic beneath it |
| A list of facts | One question drives the lesson; each page answers the one before (clues, reveal) |
| A card-sorting game for adults | A case file: real moments from a week, answered on a meaningful diagram, the reason after each answer, a result per level |

## Motion and design
| Rejected | Fix |
|---|---|
| Code-drawn diagrams that looked cheap; then a photo with a camera moving "left, right, zoom, for nothing" | A designed stage where the motion explains; the camera moves only to reach something |
| The picture in a small window: "too small for motion graphics" | Full 1600 × 900 stage |
| No site identity: fonts, colours, typography | Thmanyah, ribbon gradient, khatam star and lattice, crimson/gold/teal |
| Flat black pages with no graphics | Dark stage = crimson-to-teal night + khatam lattice + brand lights; every page has a graphic |
| Graphics that did not carry the meaning ("as if you see Him" panels, a planet on the last page) | Tell it with people: a person looks up into light while the day's noise falls away; a person at the foot of the stairs looks up at a sky filling with stars |
| Two blocks for "knees to knees" | Two SVG people: a student comes close, puts the phone away, rests the hands (a teacher and student today; the Prophet ﷺ and Jibril are never drawn) |
| The question card covered the motion graphics while the left side was empty | The question sits in the left column under the lines |
| Figures' heads came apart from their bodies | Fixed neck + SVG-transform head rotation |
| First page looked still when the lesson opened | The player replays the slide when it is seen or goes full screen |
| Plain end-of-lesson page | `LessonEnd`: our night background, the khatam draws itself, chapters light up along a gold line |

## Bug list (check every contact sheet)
- Text over text: title vs docked text, labels vs bubbles, two bubbles, chips vs the lesson badge.
- Anything on the chapter bar (y ≈ 830–870) or under the lesson badge (x > 1374, y < 180).
- A graphic covered by a question or card; a graphic dimmed while it is the point of the step.
- An empty right side on any step after the first; a black or empty stage.
- People: heads attached, hands where the pose says, nobody overlapping a label.
- Arabic: right to left, words in order, never squeezed into an English line.
- Interactions: every button works, the result reaches `onGameResult`, nothing is stuck after an answer.

## Red flags: stop and redesign
- "It looks nice" but you cannot say what the movement means on this step.
- A shape stands in for people or for a concept the learner would recognise instantly as a picture.
- You are about to tell the owner it is done without having looked at every step.
