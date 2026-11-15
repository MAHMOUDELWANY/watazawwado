# Achievement badges: the full set (owner, 2026-11-14)

Status: approved by the owner (2026-11-15). On the live site in trial mode at /badges (and /ar/badges): not given to learners yet.
Trial page: `src/components/public/badges/BadgesPreviewPage.tsx` (the clockwork reveal plays silent; sound effects wait).
Renders: `scripts/badges/build_shelf.py` → `public/badges/shelf/*.webp`.

## Why
The learner should feel achievement, progress and that their effort is seen. The badge is a record of something that
really happened: a lesson attended, a surah memorised, a level finished, homework done.

## Rules
- Effort and real milestones only: never ability, speed, scores or ranking. No points, no "best student", nothing is
  taken away after a missed week (rhythm counts the longest run), no badges for payments or packages.
- One badge for every age. Ages differ in the moment of receiving it (below), not in the badge.
- A badge that can happen many times (a surah, a juz, a level) is one badge with a count (×7); tapping it lists them.
- A learner sees only the subject badges of subjects they study.
- Our palette only (crimson, teal, copper, sand, gold, espresso); no green, no purple.
- "Full marks" is removed (owner, 2026-11-14): it rewards ability, not effort.

## The set: 24 badges, 5 families, 3 tiers

Shape = family, metal = tier, colour = subject.

| Family (shape) | Badges (tier) |
|---|---|
| Lessons (round coin, crimson field) | First lesson (copper), 10 (copper), 25 (gold), 50 (gold), 100 (grand) |
| Rhythm (shamsa, teal field) | 4 weeks (copper), 12 (gold), 26 (gold, new), 52 (grand) |
| Subject milestones (khatam star, gem = subject) | Quran: surah ×N (gold), tajweed rule ×N (gold), juz ×N (grand), khatma ×N (grand, new). Zad Path level ×N (grand, teal, new). Language level ×N (grand, amber). Scholar's Path book ×N (grand, sand) |
| Teacher's recognition (mihrab arch) | one badge ×N (gold), the teacher writes the reason |
| Homework (hex zellige tile, espresso field) | First homework (copper), 10 (copper), 25 (gold, new), 50 (grand, new), whole lesson mastered ×N (gold), came back and remembered ×N (gold), tried again and made it ×N (gold, new) |

Tiers: copper = beginnings; gold = middle; grand = gold + clockwork rings, ribbons and a crown gem. Grand badges get the
cinematic clockwork reveal for children (`2026-11-12-badge-reveal-clockwork-design.md`).

Subject gem colours: Quran crimson ruby, Zad Path teal, languages copper amber, Scholar's Path sand gold.

## Ages
- Child: clockwork reveal for grand badges, sound effects (no music), Zad presents it, honour card "بارك الله فيك يا {name}".
- Teen: shorter motion, no Zad, no sound.
- Adult: calm card; printable certificate for big milestones.
- Wording follows the age; parents see each child's shelf and get a notice for a grand badge.

## Calls made by Claude (owner to check)
- The five shapes per family.
- 50 lessons and 12 weeks are gold, not grand (this differs from the 2026-11-12 RULES.md line, which gave them the reveal).
- Teacher's recognition is gold.
- Numbers drawn in Arabic digits on the Arabic site, Latin on the English site (two renders per numbered badge).
- Names in Fusha.

## Open for the owner
1. Are five shapes clear on a phone, or one shape for all?
2. Khatma: one badge for reading and memorising, or two?
3. Icons inside each badge, or one fixed symbol per subject?

## Data still missing (for the builder)
Milestone kinds `khatma` and Zad level (automatic from the curriculum or teacher-recorded); 26-week rhythm step; homework
counts 25/50 and a "passed on a retry" flag in the homework history. The homework badges live on the unmerged
`claude/3d-character-gamification-7dff2f` line of work (commit a5abba55), not on `main`.
