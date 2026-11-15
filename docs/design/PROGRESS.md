# Progress design system

Owner, 2026-11-15: one design system for the progress page (`/student/progress`) that works for every account type,
every device and the lessons. It sits on top of the site system (`docs/design-system.md`, skill
`WATAZAWWADO-design-system`), the XP system (`docs/design/XP.md`) and the badge set
(`docs/superpowers/specs/2026-11-14-achievement-badges-design.md`). Code: `src/student/components/progress/ds/`.

## The idea: the clockwork

The big badges are built like a clock: rings that mesh, ticks, a gem that locks in last. The progress page uses the same
language, so a learner sees one world from the first lesson to the biggest badge:

- the **level dial** is the badge's dial ring: one arc per level, ticks for the lessons inside it;
- finished things are **gold**, the thing you are on now is **crimson with a gold ring**, what is ahead is a **faint
  shadow** of its final shape (never a dashed outline, never a grey box);
- a badge earned is a piece that **locks into place** (the celebration); on the shelf it stays in colour.

Progress is never teal (teal means "done / success" in forms) and never green.

## Who sees what

| Account | Header | Main | Side | Tone |
|---|---|---|---|---|
| Child 6–11 (own device or kid space) | Arch hero, level dial, three medallions | The road (`ProgressRoad`) | Hoopoe companion, newest badge, next lesson | Warm, short words, praise by name |
| Teen 12–17 | Arch hero, level dial | The calm view (`ProgressCalm`) | Badges summary, next lesson | Direct, no mascot on the page |
| Adult learner | Arch hero, level dial | The calm view | Badges summary, next lesson | Calm, readable in five seconds |
| Parent, family overview | One card per child: mini dial, level, rhythm, newest badge | Opening a card shows that child's page | | About the child, third person |
| Parent viewing a child | As the child's age group, words in third person | | Companion (child only) | Third person ("Yusuf earned…") |
| Teacher (dashboard student view) | Same dial and badge art, read-only | Lesson summaries | | Plain report |

Age group comes from `ageGroupFor(age, learnerType)` (kids < 12, teens < 18). The companion shows only for a child (and,
in demo mode, on a parent's page so the family can see it).

## Layout

- **Phone (390)**: one column. Hero → companion (child) → subject chips → path → badges → lesson timeline → report link.
  Nothing scrolls sideways; chips scroll inside their own row.
- **Tablet (768)**: hero dial beside the words; badges shelf four across.
- **Desktop (≥ 1024)**: two columns. Main (path, timeline) and a sticky side column (companion, badges summary, next
  lesson). Max width follows the portal shell.

## Parts

| Part | What it is | Rules |
|---|---|---|
| `ProgressHero` | Mihrab-arch surface on the khatam field: greeting, subject, level dial, three medallions | One per page. Words come from `WATAZAWWADO-brand-voice` |
| `LevelDial` | SVG ring, one arc per level, a tick per lesson in the current level, centre shows "level 2 of 5" | Draws in the reading direction (clockwise LTR, anticlockwise RTL). Numbers in Arabic digits on the Arabic site |
| `Medallion` | A small badge render with a number under it (lessons, weeks in a row, badges earned) | Uses the badge art, never a lucide icon |
| `BadgeArt` | The rendered badge image for an emblem id, earned or not | Not earned: a faint shadow of the same badge (`grayscale`, low contrast, 35–45 % opacity) |
| `AchievementsShelf` | The shelf grouped by family, counts on repeating badges (×7), tap for a close-up | Only the subjects the learner studies. No ranking, no points |
| `BadgeSheet` | Close-up: big badge, name, what earns it, when, the teacher's note, certificate link | Opens from the shelf and the hero medallions |
| `MilestoneCelebration` | The moment a badge is earned (once per badge per device) | See motion |

## Motion (tokens from the site system win)

- Page arrival: the hero dial draws its gold arc once (700 ms), nothing else moves on load.
- Celebration by age: kids spring up with light rays and gentle falling stars (2 s); teens rise with a halo (1.5 s);
  adults and parents a quiet fade (1 s). A child's Quran grand badge (a juz, a khatma, a Quran level) plays the clockwork
  reveal, silent until the sound effects are ready.
- One loop at most in view (the companion's idle). Reduced motion: everything appears at once, no rays, no video.

## Tie to the lessons

- The road's stops and the dial's arcs are the curriculum levels of the subject (`subject.levels`).
- Ticks in the current arc are lessons done in that level; the next lesson card links to booking or the lesson player.
- Homework badges come from `/api/student/homework-sets`; lesson and rhythm badges from `/api/student/progress`;
  subject badges from the milestones a teacher records after a lesson.

## Colour and type

Only site tokens: paper/espresso surfaces, `--gold` / `--gold-deep` / `--gold-soft` for progress, `--crimson` for "now"
and the one main action, `--copper` for small marks, `--sand` for the khatam field. Display type `font-display`,
numbers tabular. Literal hex only inside the dial's SVG gradients.

## Done means

Phone and desktop, light and dark, Arabic and English, child and adult account, keyboard focus, reduced motion, no
console errors, screenshots to the owner.
