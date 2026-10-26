# Run 2026-10-26: five new prototype lessons (read after HANDOFF-2026-10-26.md)

The owner asked Claude to continue the curriculum alone while he was at university. Everything is on `main`, drafts
(`reviewed: false`), teacher-only. Preview any page: `curriculum-preview` → `slide.html?subject=<id>&lesson=1&p=<page>`.

| Subject (catalog id) | Lesson 1 | Docs |
|---|---|---|
| Egyptian Arabic · Adults (`egyptian-adults`) | Ahlan! What's Your Name? (14 pages) | `egyptian/` RULES, MAP (22), brief, clips |
| Reading Arabic · Adults (`literacy-a-adults`) | Fewer Shapes Than You Think (13) | `literacy/MAP-adults.md` (24), brief, clips |
| Tajweed · Level 1 (`tajweed`) | Every Letter Has a Right (13) | `tajweed/` RULES, MAP (19), brief with evidence log |
| Quran Reading (`quran-reading`) | Reading Al-Fatiha from the Page (12) | `quran-reading/` MAP (19), brief |
| English · Kids (`english-kids`) | The Snake Sound (11) | `english/` RULES, MAP-kids (24), brief, clips |

Also: Bukhari 5027 (Literacy B L1) and Muslim 798 checked on Dorar: both sahih.

## Waiting
1. The owner's review of the five lessons and their maps (each brief ends with "for the owner to check").
2. Audio: the ElevenLabs connector was not available, so no new clips were generated. Lists per lesson in the
   `*-clips.md` files (Egyptian 38, Literacy Adults 1 + four letter sounds by the owner, Tajweed 2, English 9 words + 3
   sounds). Generate with the clone ids in HANDOFF-2026-10-26.md, then the "recording coming" tags disappear.
3. Open questions: English Kids audience and sound order; Tajweed and Quran Reading at 12+ (Kids look later); Egyptian
   spelling and vowel marks.

## Second run (same day): one Lesson 1 in every remaining version
Owner: "make at least one lesson in every version not done yet; no more videos, I check on the site".

| Version (catalog id) | Lesson 1 |
|---|---|
| Fusha · 12+ (`fusha-12`) | First Day at the Institute (`fusha/MAP-12plus.md`) |
| Reading Arabic · Teens (`literacy-a-teens`) | Crack the Code (`literacy/MAP-teens.md`) |
| Egyptian · Kids (`egyptian-kids`) | Ahlan, Teta! |
| Egyptian · Teens (`egyptian-teens`) | Ezzayak? What's Up, Cairo |
| English · General (`english-general`) | Hello, I'm… (`english/MAP-general.md`) |
| English · Exams (`english-exams`) | Your First Three Minutes (`english/MAP-exams.md`) |
| Seerah · Kids (`seerah-kids`) | The Elephant Who Sat Down |

Still without a lesson: Literacy Franco and Egyptian Franco (they need the owner's Franco spelling rules). Shared
pieces for language lessons: `slides/motion/g-lang.tsx`. No audio was generated in either run.
