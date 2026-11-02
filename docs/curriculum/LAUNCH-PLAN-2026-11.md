# Launch plan: 3–4 lessons in every version (2026-11-02 → launch 10–15 November)

Owner, 2026-11-02: before launch every age group of every subject has at least 3–4 lessons, built at the approved
motion-stage standard. Order: versions with no lesson first, then those with one, then two, and the ones with three get
a fourth. One Claude session does all of it (owner's choice). Drafts stay `reviewed: false`; the owner reviews on the site.

Owner's answers the same night:
- **English stays paused** (decision 8, 2026-10-26): no new English lessons.
- **Franco is in.** Claude writes the Franco spelling rules (`franco/RULES.md`); the owner reviews them afterwards.
- **The existing maps are the plan** for launch; the owner's later changes are applied to the lessons.
- **Kids pictures:** a page that needs a new painting or a new pose of the Zad Kids cast waits for the owner's image.
  Claude writes the prompt (self-contained, for a fresh ChatGPT chat) in the report; the rest of the lesson is built.
- **Voice:** every voice clip made so far is deleted (wrong marks or pronunciation). The owner records everything again
  from `voice/RECORDING-SCRIPTS.md` (one take per lesson and voice, with the tone of each line), sends the file, and
  Claude cuts it on the silences. Until then pages show "recording coming". Regenerate the file after each new lesson:
  `npx tsx scripts/curriculum/clips.ts --all > docs/curriculum/voice/RECORDING-SCRIPTS.md`.

## Every version: where it stands and what comes next

| Version (catalog id) | Built | Next lessons for launch (from its MAP) | Look (from its approved/prototype Lesson 1) | New images? |
|---|---|---|---|---|
| Literacy C · Franco (`literacy-c`) | 0 | 1 Numbers That Talk · 2 The Cairo Hamza · 3 Scrape and Gargle · 4 Long and Short | Adults paper stage, a phone chat as the running scene | no |
| Egyptian · Franco (`egyptian-franco`) | 0 | same lessons as Egyptian Adults, every Arabic line in Franco | Egyptian Adults stage | no |
| Egyptian · Adults (`egyptian-adults`) | 1 | 2 Where Are You From? · 3 What's This? · 4 Where Are My Keys? | Cairo building on the paper stage | no |
| Egyptian · Kids (`egyptian-kids`) | 1 | 2 Where Are You From? · 3 What's This? · 4 Where Are My Keys? | Kids paper, Teta's flat | Teta / cousins poses: ask |
| Egyptian · Teens (`egyptian-teens`) | 1 | 2 Where Are You From? · 3 What's This? · 4 Where Are My Keys? | Teens night stage, the club | no |
| Fusha · Kids (`fusha-kids`) | 1 | 2 Is This a Cat? · 3 This One, That One · 4 The Door and a Door | Kids paper + Zad Kids cast | maybe (pets, park) |
| Fusha · 12+ (`fusha-12`) | 1 | 2 Is This Your Room? · 3 Near and Far · 4 The Door and a Door | the institute, paper stage | no |
| Quranic reading rules (`literacy-b-kids`) | 1 | 2 The Alif That Stands Up · 3 Written, Not Read · 4 The Quiet Alif | Kids paper, Mushaf words | no |
| Quran Reading (`quran-reading`) | 1 | 2 The Last Two Surahs · 3 One and Many · 4 Short and Steady | Mushaf page stage | no |
| Tajweed · Level 1 (`tajweed`) | 1 | 2 The Bounce · 3 Four Doors · 4 Merging | sound layers on the ayah | no |
| Reading Arabic · Kids (`literacy-a-kids`) | 2 | 3 ج ح خ · 4 د ذ ر ز | Kids paper, letter train | no |
| Reading Arabic · Teens (`literacy-a-teens`) | 2 | 3 د ذ ر ز · س ش · 4 ص ض ط ظ | night city, Karim's phone | no |
| Reading Arabic · Adults (`literacy-a-adults`) | 2 | 3 د ذ ر ز · س ش · 4 ص ض ط ظ | the shop sign, the Reading Map | no |
| Zad Essentials · Kids (`zad-kids`) | 3 | 4 Muhammad ﷺ, the Messenger | Zad Kids cast on paper | maybe |
| Zad Essentials · Teens (`zad-teens`) | 3 | 4 Can I Trust Him? | Teens night stage | no |
| Zad Essentials · Adults (`zad-adults`) | 3 | 4 The Sentence That Costs Something | Adults paper stage | no |
| Seerah · Kids, Teens & Adults | 4 | done for launch; Episode 5 later (needs the owner's images) | — | yes (later) |
| English · Kids / General / Exams | 1 each | paused by the owner | — | — |

About 37 new lessons. Every lesson: brief → page text (`humanizer`) → Arabic teacher notes → a motion stage per page →
every step screenshotted and checked → tsc, tests, build → commit and push to `main` → log in `PLAN.md` §8.

## Order of work (breadth first, so every version grows together)
1. Franco: rules, Literacy C map and Lesson 1; the Egyptian Franco version showing Egyptian Adults Lesson 1 in Franco.
2. Lesson 2 of every one-lesson version (Egyptian Adults first, so Egyptian Franco gets it too).
3. Lesson 3 of those versions and of Literacy A (three ages); Literacy C Lesson 2.
4. Lesson 4 everywhere, Zad Lesson 4 (three ages), Literacy C Lessons 3–4.
5. After each round: regenerate the recording scripts, list the images needed, report to the owner in Arabic.
