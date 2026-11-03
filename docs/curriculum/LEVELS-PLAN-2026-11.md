# Every level started, and a placement test built from the curriculum (2026-11-03)

Owner, 2026-11-03: every subject offers levels at onboarding, but only the first level has lessons. Start every level
that is already defined, in every subject and age group, with at least its first 3 lessons. Then build the placement
test from those lessons: the learner does not pick a level; the test reads their answers and suggests a level (and a
starting lesson) to the learner and to the teacher, as a first analysis.

## 1. The levels, as already defined (RULES.md §2b, `src/components/onboarding/subjects.ts`, design §4)

| Subject | Levels at onboarding | Built today | To start now (3 lessons each) |
|---|---|---|---|
| Quran Reading | Foundations → Reading the Mushaf | Foundations = Literacy A (3 ages) + Literacy B; Reading the Mushaf = Quran Reading L1–3 | none |
| Tajweed | Level 1 · Level 2 (makharij, sifat) · Level 3 (advanced rules) | Level 1, L1–3 | Level 2, Level 3 (12+) |
| Fusha | Foundations · Beginner · Intermediate · Advanced | Foundations = Literacy A; Beginner = Fusha Level 1 (Kids, 12+), L1–3 | Intermediate (Level 2) and Advanced (Level 3), Kids and 12+ |
| Egyptian | Sounds · Beginner · Intermediate · Advanced | Beginner, Kids/Teens/Adults (+ Franco), L1–3 | Sounds (12+, see §3), Intermediate and Advanced for Kids, Teens, Adults; Franco mirrors Adults |
| Memorization & Revision | a goal, not a level (start, add more, keep firm) | practice, no lessons | none: the placement asks what is memorised and checks reading |
| Zad Essentials, Seerah | none: the version follows age | 3–4 lessons per version | none: no placement level |
| English | paused (decision 8) | — | none |

**New lessons:** Tajweed 6 · Fusha 12 · Egyptian 3 (Sounds) + 18 (Intermediate, Advanced × 3 ages) = **39 lessons**, each
with its level map first.

## 2. Scope of each new level (books as scope only; sequence, wording, examples and exercises are ours)

- **Tajweed Level 2 (makharij and sifat):** Jannat al-Quran *Tajweed* Book 2, checked against *Taysir ar-Rahman*. First
  three lessons: the five areas of the mouth and throat (a map), the throat letters in detail, the tongue letters
  (with the deepest ones: ق ك). Animated mouth and throat; every example on a real ayah.
- **Tajweed Level 3 (advanced rules):** Jannat Book 4 (Book 3 is missing), checked against *Taysir ar-Rahman*. First
  three lessons: madd and its kinds in full, stopping and starting (waqf and ibtida'), the rules of raa (tafkheem and
  tarqeeq).
- **Fusha Level 2 (Intermediate):** Madinah Reader 3–5 + *Lughatuna al-Fusha* 2. First three lessons: the past verb
  with every person (review → fluency), the present verb, the five nouns (أبو، أخو...). Kids and 12+ versions with the
  same casts as Level 1.
- **Fusha Level 3 (Advanced):** Madinah Reader 6 and 8 + *Lughatuna* 3. First three lessons: the verb forms (أوزان),
  the passive, inna and her sisters. Kids and 12+.
- **Egyptian Sounds (12+):** for learners who know Fusha. *Egyptian Colloquial* (sound shifts). Three lessons: ق → ء
  and ج → g; ث → t/s and ذ → d/z; vowels that shorten and the Cairo stress.
- **Egyptian Intermediate:** *Kallimni 'Arabi* + *Aktar*. First three lessons: the past tense (I went, you went),
  the future with هـ, telling a story in Egyptian. Kids, Teens, Adults, each in its own world (Teta's flat, the club,
  the Cairo building).
- **Egyptian Advanced:** *Mazboot*, *fi Kull Haaga*, *Advanced Learner*. First three lessons: opinions and arguing
  politely, idioms and proverbs in context, fast natural speech (a voice note at street speed). Kids get a lighter
  Advanced (stories and jokes); Teens and Adults the full one.

## 3. Claude's calls (the owner can change them)

1. **Fusha "Foundations" is Literacy A**, so its placement checks reading and writing the alphabet; Fusha Level 1 is
   "Beginner", Level 2 "Intermediate", Level 3 "Advanced".
2. **Egyptian Sounds is 12+ only:** it serves learners who already know Fusha; children start at Beginner.
3. **No placement for Zad, Seerah and English** (no levels, or paused). Memorization keeps a short self-report and a
   reading check, with no level.

## 4. The placement test, rebuilt (after the lessons exist)

- **No level to pick.** One test per subject (and age version where the content differs). It starts at the first
  level and climbs: a few questions per level, taken from that level's lessons in their order (words, rules, a line to
  read, a sentence to understand). Two misses in a level stop the climb.
- **The result is a suggestion, not a verdict:** the level, and the lesson to start from inside it (the first lesson
  whose questions were missed), with what the learner already knows and what they missed, per skill. Shown to the
  learner and to the teacher (the teacher sees it on the student's page and can change the level after the trial).
- **Questions come from the lessons,** so every question points to the lesson that teaches it; the banks in
  `server/placement/banks` are replaced subject by subject. Recited or spoken parts (Quran, Tajweed, speaking) are
  marked "the teacher checks this in the trial".
- RULES.md §2 gets the new decision when the engine ships; onboarding stops asking for a level for subjects whose
  placement is live.

## 5. Order of work

1. Tajweed Level 2 and Level 3 (maps, 3 lessons each).
2. Fusha Level 2 and Level 3, Kids and 12+ (maps, 3 lessons each).
3. Egyptian Sounds (12+), then Intermediate and Advanced for Adults (Franco follows), Teens, Kids.
4. The placement engine and the new question banks, subject by subject, as each subject's levels are ready.
5. Round 4 (Lesson 4 of every Level 1) after that.

Progress is logged in `PLAN.md` §8 as usual.
