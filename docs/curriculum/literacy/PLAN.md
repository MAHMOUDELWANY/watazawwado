# Literacy A · Reading Arabic · the course plan (Kids · Teens · Adults)

Supersedes `MAP.md`, `MAP-teens.md` and `MAP-adults.md`. Owner's rules: `DECISIONS-2026-10-26.md` §5–7, §9, §13.
Status: Claude's draft, 2026-10-26, for the owner's review.

## Goal
At the end the learner **reads anything** in Arabic: with or without vowel marks, any common font, signs, menus,
messages, headlines, a short story. Writing is a light help (the motion shows how to write each letter; the learner
copies it on paper with the teacher), never a separate skill or test.

## Audience and tone
Muslims and non-Muslims, so: neutral everyday words (home, food, the street, school, travel; common words such as مسجد
are fine), neutral praise ("Well done!", "Excellent!", "You read it!"), modest neutral characters, nothing religious as
teaching, nothing indecent.

## The roadmap: a journey the learner walks
Every lesson is a stop on a road: where they came from, where they are, what is next. **Owner, 2026-10-27:** the road
map lives on the version's lessons page in the curriculum (`src/curriculum/Roadmap.tsx`), not as pages inside the
lessons; the journey page was removed from Lesson 1 in every version. Each age has its own journey.

| | Kids (6–11) | Teens (12–17) | Adults (18+) |
|---|---|---|---|
| The journey | **The Letter Train**: a little train crosses a land of six regions (the parts). Each station is a lesson; at each station the learner's ticket gets a stamp and a carriage is added with the new letters riding in it. The last station is **Reading Town**, where every sign can be read. | **Decode the City**: a night city of six districts. Each lesson lights up a block; each district ends with a "level" (a real text to decode). The last district is the skyline, fully lit: the learner can read the whole city. | **The Reading Map**: a clean route on a paper map, from "I can't read a word" to "I read anything", with milestones (first word, first sentence, first menu, first page without marks). |
| Where it appears | The version's lessons page (the road map in the curriculum), not inside lessons (owner, 2026-10-27) | Same | Same |
| Characters | New neutral cast (see `CAST-PROMPTS.md`) | New neutral cast | None: the learner's own route |

## What the books teach us (read 2026-10-26; scope only, never their wording or drills)
| Book | Order it uses | What we take |
|---|---|---|
| *Nour al-Bayan* (modern edition) | Alphabet names once, then every letter **with fatha** from the first unit (picture words, letter positions inside the same unit), then kasra, damma, long vowels, sukoon, tanween, shadda | The learner **reads syllables and words from the first letters**, not after 28 letters; positions taught with the vowel, not as a separate theory |
| *Arabic Bilqalam* | Fatha unit: letters, shapes in positions, letters that do not join, blending two letters, heavy and light letters, hamza forms, words, four-letter words, short sentences; the same cycle for kasra, damma, then long vowels, sukoon, hamzat al-qat' and al-wasl, tanween (three kinds), shadda, al- (sun and moon) | The **cycle** per new mark: sound → letters → blending → words → look-alike words → sentences; heavy/light letters early; sentences after every mark |
| Jannat al-Quran *Arabic & Tajweed* 1 | Alphabet, recognition, positions, connecting letters, then vowels, sukoon, tanween, madd, shadda | A clear English-medium explanation for older learners |
| *Steps for writing the letters* | Stroke order for each letter and its forms | The writing hints (the motion writes the letter, the learner copies) |
| *Fath ar-Rahman* | Quranic words | Not used here (Literacy A is general); kept for Literacy B |

**Our order, from all of them:** a welcome to the language and the cast → the letters by shape family, each read **with
fatha** at once (so the learner reads "ba, ta, tha" in Lesson 2) → joining and positions → the other short vowels and
sukoon → long vowels → tanween → shadda → al- → spelling marks → sentences and a story → reading without marks → the
real world. Every new mark runs the same cycle: hear it → see it on the letters → blend → words → look-alikes →
a sentence.

## Lesson 1 in every version: Welcome to Arabic
A friendly brief on the language before any letter: who speaks it and where, it runs right to left, 28 letters and no
capitals, letters hold hands, dots make letters, short vowels are little marks, a few sounds English does not have
(ح ع ق خ). Then the cast is introduced, as in the Zad series openings (Kids and Teens), and the journey map is shown for
the first time. Ends with the first letter: alif.

## Lesson shape (60 minutes)
1. **Back on the road** (3 min): the journey, where we stopped, a quick replay of last lesson's letters.
2. **A small mystery** (5 min): a word, a sign or a message the learner cannot read yet; by the end of the lesson they can.
3. **Meet the letters** (20 min): each letter appears, plays its sound, shows its shape family and its dots, and is
   written stroke by stroke (copy it on paper with the teacher).
4. **Play** (15 min): games that train the eye and the ear: find it, tell look-alikes apart, build a word, speed rounds.
5. **Read it** (10 min): the mystery from the start, now read; then new words and, from Part 3, short sentences.
6. **The road** (5 min): the new stamp / block / milestone on the journey, a small mission (find these letters around
   you), and a glimpse of the next stop.

Optional pages (Kids and Teens) let the teacher fit 45 or 60 minutes. Reviews measure focus and progress, lightly.

## The order (all ages, same scope)
Kids go slower (one family per lesson); Teens and Adults share one list at a faster pace.

### Kids · 32 lessons
| Part (region) | # | Lesson | The learner can… |
|---|---|---|---|
| 0 · All Aboard | 1 | Welcome to Arabic | say what is special about Arabic, meet the cast, see the journey, meet alif |
| 1 · The Letters (with fatha) | 2 | ب ت ث | read ba, ta, tha; tell the three by their dots |
| | 3 | ج ح خ | read ja, ha, kha; the breathy ح |
| | 4 | د ذ ر ز | read hooks and tails; first words with letters that do not join (دَرَ، ذَرَ) |
| | 5 | س ش | read sa, sha |
| | 6 | ص ض ط ظ | read the heavy letters (full mouth) against the light ones |
| | 7 | ع غ | read the throat letters |
| | 8 | ف ق | one dot or two; ق is heavy |
| | 9 | ك ل م | read ka, la, ma |
| | 10 | ن ه و ي | read the last letters |
| | 11 | ء and all 28 | the hamza and its seats (أ إ ؤ ئ), the whole alphabet |
| 2 · Letters Hold Hands | 12 | Start, middle, end | read the ب family in its three shapes |
| | 13 | The six that let go | read words with ا د ذ ر ز و |
| | 14 | Every letter joined | find any letter inside a word |
| | 15 | Words with fatha | blend and read two- and three-letter words; tell look-alikes apart |
| 3 · More Little Marks | 16 | Kasra | read bi, ti… and words |
| | 17 | Damma | read bu, tu… and words |
| | 18 | Three vowels together | read mixed words and a first sentence |
| | 19 | Sukoon: the stop | read closed syllables |
| 4 · Stretching | 20 | Alif stretches | read aa |
| | 21 | Yaa stretches | read ii |
| | 22 | Waw stretches | read uu |
| 5 · Special Marks | 23 | Tanween | read -an -in -un |
| | 24 | Shadda | read doubled letters |
| | 25 | Al- and the moon letters | read al- with the l |
| | 26 | Al- and the sun letters | read al- without the l |
| | 27 | ة ى and the small alif | read ة ى and words like هَذَا |
| 6 · Reading Town | 28 | Sentences | read short sentences |
| | 29 | My first story | read a story with marks |
| | 30 | No marks | read common words without marks |
| | 31 | Signs, labels, menus | read the real world |
| | 32 | I can read anything | read a new text alone |

### Teens and Adults · 26 lessons
| Part | # | Lesson | The learner can… |
|---|---|---|---|
| 0 · Start | 1 | Welcome to Arabic | what is special about Arabic, the cast (Teens), the journey, alif |
| 1 · The Letters (with fatha) | 2 | ب ت ث · ج ح خ | read ba ta tha, ja ha kha; the dots rule |
| | 3 | د ذ ر ز · س ش | read hooks, tails and teeth; first words |
| | 4 | ص ض ط ظ | read the heavy letters |
| | 5 | ع غ · ف ق | read the throat letters, one dot or two |
| | 6 | ك ل م · ن ه و ي | read the last letters |
| | 7 | ء and all 28 | the hamza's seats and the whole alphabet |
| 2 · Joining | 8 | Start, middle, end | read joined shapes |
| | 9 | The six that let go | read any joined word |
| | 10 | Words with fatha | blend words; tell look-alikes apart |
| 3 · Vowels | 11 | Kasra and damma | read all short vowels |
| | 12 | Sukoon | read closed syllables |
| | 13 | Long vowels | read aa ii uu |
| | 14 | Tanween | read -an -in -un |
| | 15 | Shadda | read doubled letters |
| | 16 | Al- | sun and moon letters |
| | 17 | Spelling marks | ة ى, hamza, the small alif (هَذَا، لَكِنْ) |
| | 18 | Sentences | read a short paragraph with marks |
| 4 · Without Marks | 19 | Dropping the marks | read common words unmarked |
| | 20 | Patterns and context | read unknown unmarked words |
| | 21 | Fonts and handwriting | read print, signs and simple handwriting |
| 5 · The Real World | 22 | Signs and streets | read signs |
| | 23 | Menus and labels | read a menu and a product |
| | 24 | Messages | read a chat and a note |
| | 25 | Headlines and a short article | read the news |
| | 26 | I can read anything | read a new text alone |

## Status
- Plan, lesson count and journeys approved by the owner 2026-10-26; this order revised the same day from the books.
- The Lesson 1 prototypes of 2026-10-26 are replaced by "Welcome to Arabic" in every version (the cast images come from `CAST-PROMPTS.md`).
