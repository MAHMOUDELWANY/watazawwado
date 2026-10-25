# Design: curricula for every subject (beyond the Zad Path)

Date: 2026-10-25 · Status: **approved by the owner 2026-10-25** (with the changes recorded below) · Talk with the owner in Arabic; this file is in English (RULES §7).

## 1. Why

The site launches soon, and the owner's time gets short from Thursday 2026-10-29 (studies, lectures). He wants:

1. At least one **prototype lesson he has approved** for every subject (and every version of it), so he can teach from
   them and market the academy.
2. **One skill per family of subjects** that holds the writing rules, the sources and the design. Later he sends one line
   from his phone ("continue Fusha level 1, lesson 3") from any of his Claude accounts on this machine, and the work comes
   out at the quality of the approved prototype. He reviews when he is free.
3. A teaching method that makes us stand out: the teacher never needs outside material or improvises against our method,
   and the learner never needs anything outside the lesson.

## 2. The map (owner's decisions, 2026-10-25)

```
LITERACY (the entry door)
 ├─ A. General literacy: Arabic letters, reading, writing. No religious content, for Muslims and non-Muslims.
 │     Versions: Kids · Teens · Adults.
 │     ├─► B. Quranic reading rules (Muslims) ─► Quran Reading (no tajweed) ─► Tajweed (3 levels)
 │     ├─► Fusha Arabic, levels 1–3
 │     └─► Egyptian Arabic in Arabic script
 └─ C. Franco literacy (one version, adults) ─► Egyptian Arabic in Franco (one version, adults)

HIFZ & REVISION: no curriculum. An interactive test generator per age band for learners who already memorise.
SEERAH (Zad Path): episodes modelled on the owner's deck, source Ar-Raheeq al-Makhtum, Kids / Teens / Adults.
SCHOLAR'S PATH: postponed.   ENGLISH: goal-based tracks, sources to be researched (§4.7).
```

- **[Owner]** Literacy A has three versions; Franco literacy C has one.
- **[Owner]** Fusha has three levels, not four: its old "Foundations" level is Literacy A. **[Claude's call]** A learner
  who picks Fusha (or Quran, or Egyptian in Arabic script) and cannot read is routed to Literacy A first, inside the same
  booking flow, so we never write the alphabet twice. Quran Reading's old "Foundations" stage becomes A + B.
- **[Owner]** Egyptian in Arabic script: three versions (Kids / Teens / Adults), **Adults first**. Franco: one version.
- **[Owner]** Hifz gets tests, not lessons.
- **[Owner]** Scholar's Path waits.

Onboarding (`src/components/onboarding/subjects.ts`) and the catalog change to match this map; that is engineering work
after the prototypes (§7), not before Thursday.

## 3. Rules that apply to every subject

- **Books set the scope, never the wording** (curriculum RULES §1.4, binding). We take from a book: which letters,
  sounds, rules, vocabulary and grammar a level covers, and in what order. We never copy its sentences, dialogues,
  exercises, drills or illustrations. Several of these books say so on their first page (Bilqalam: "no part may be
  reproduced"; AUC Press and Jannat al-Quran: all rights reserved). "Accurate transfer" means: the facts are exact
  (a tajweed rule, a letter's makhraj, a verb pattern), the presentation is ours.
- Quran text from Tanzil only; ayat and hadith verified as in the Zad Path (sources.md A, B).
- The motion-stage player and its standard (`.claude/skills/curriculum-builder/motion-stage.md`, `owner-feedback.md`)
  are the house style for every subject: one graphic per page that explains the idea by moving, 1600×900, build steps.
- `humanizer` on all English, Arabic teacher notes, `reviewed: false` until the owner approves.
- The academy speaks as "we"; the owner is one teacher (RULES §6b). His recorded voice is "the lesson's voice", not a
  named presenter.

## 3a. Voice and audio — [Owner, 2026-10-25]

- Three ElevenLabs clones of the owner's voice: **"mahmoud"** (English, exists, id `jSOs0gJh7GzUGtEgxVhs`),
  **"Mahmoud Egyptian"** (Egyptian pronunciation) and **"Mahmoud Fusha"** (Modern Standard Arabic). The owner records the
  two Arabic clones from `docs/curriculum/voice/clone-scripts.md`.
- Claude writes every word, sentence or dialogue with its emotion, generates it with the clone of that language and
  places it in the lesson; the learner replays it at any time. Clips that sound wrong (most likely single letters and
  harakat) go on a short list the owner records himself.
- **[Claude's call]** The Quran is never voiced by a clone: ayat use the owner's real recording or a licensed reciter.
- **Comprehensible-input videos** are the owner's later idea (videos hosted elsewhere, linked from the lesson). Until
  then, input stories and dialogues are audio in the matching clone.

## 3b. Look and identity — [Owner, 2026-10-25]

One identity for the whole academy, taken from the site (type, frame, player, khatam, ribbon), with a small change per
curriculum: its own colour accent, motif and cast. Literacy has **new neutral characters** (it serves non-Muslims too).
As with every new look (curriculum-builder §3), 2–3 pages are prototyped and the owner chooses before a lesson is built.

## 3c. Sources and the owner's additions — [Owner, 2026-10-25]

- The books live in `C:\Users\ahmed\Documents\watazawwado-sources\` (moved 2026-10-25: `literacy`, `tajweed`, `fusha`,
  `egyptian`, `english\{phonics,jolly-phonics-stories,courses,method-grammar}`, `seerah`, `reference-islamic`). They are
  listed in `docs/curriculum/sources.md`, never committed (size and copyright), and read as scanned page images, so work
  that reads them runs on this machine (a session here, or Remote Control from the phone), not in a cloud session.
- The books are material, not a cage: the aim is the best course that can be made from all of them, with better
  presentation and explanation. Claude may go beyond them (sources it researches, or books it asks the owner to fetch).
- No "owner's additions" slot. When the owner names a subject, Claude builds it; the owner reviews the finished lesson
  and asks for additions then.

## 4. Each subject

### 4.1 Literacy A: general Arabic literacy (Kids · Teens · Adults)
- **Sources:** Jannat al-Quran *Arabic & Tajweed* Book 1 (alphabet → positions → connecting → harakat → sukoon → shadda
  → tanween → madd: the cleanest English-medium order), *Nour al-Bayan* (sequence of harakat, drill types), *Fath
  ar-Rahman* (blending tables), *Arabic Bilqalam* (inspiration only, 2026-10-16), *Steps for writing the letters*
  (stroke order per form).
- **No religious content:** our own neutral words (house, cat, bread, door). Those books mix Quranic words; we do not.
- **Lesson shape:** the letter is drawn stroke by stroke on the stage (code animation), its sound plays, the learner taps
  any letter, syllable or word to hear it again; blending is shown as letters sliding together. Each lesson ends with a
  short read-aloud the teacher marks.
- **Look:** the academy identity with a literacy accent and new neutral characters (§3b), drawn per age.

### 4.2 Literacy B: Quranic reading rules (Muslims, after A)
- **Sources:** later sections of Jannat Book 1 (hamzat al-wasl, letters not pronounced, waqf), *Nour al-Bayan* and *Fath
  ar-Rahman* (Quranic words), King Fahd Complex mushaf conventions.
- Covers what differs from ordinary script: Uthmani spelling (dagger alif, small letters), waqf signs, the mushaf's
  symbols, letters written but not read. Words from the Quran (Tanzil text).
- **[Owner]** First prototype in the Kids look. **[Claude's call]** One content, the look switched by the learner's age.

### 4.3 Quran Reading (no tajweed)
- Reading fluency from the mushaf: graded passages, short surahs first, the teacher marks fluency. Mostly a practice
  tool (passage + tap-to-hear + teacher marks). Ayah audio per §3a (never a clone).

### 4.4 Tajweed (3 levels)
- **Sources:** Jannat al-Quran *Tajweed* Books 1, 2, 4 (**Book 3 missing**), checked against *Taysir ar-Rahman fi
  Tajweed al-Quran* (Su'ad Abdul-Hamid).
- Levels (2026-10-18): L1 essential rules applied while reciting; L2 makharij and sifat; L3 advanced rules.
- **Lesson shape:** rules as colour layers on real ayat that switch on one by one; makharij on an animated mouth and
  throat; madd lengths as beats.

### 4.5 Fusha Arabic (3 levels; Kids and 12+ versions)
- **[Owner]** The best course Claude can make from all the material, not bound to any one book.
- **Sources:** *Madinah Arabic Reader* 1–6 and 8 (**Book 7 missing**), *Lughatuna al-Fusha* 2–3 (Samia Louis, AUC).
  *Al-Arabiyya Bayna Yadayk* dropped (owner). Jannat *Quranic Arabic* 1–3 as a possible strand (§8).
- **[Claude's call]** Madinah gives the grammar spine (one structure per lesson); Lughatuna the themes, conversation and
  level-2/3 reading. Level 1 ≈ Madinah 1–2; Level 2 ≈ Madinah 3–5 + Lughatuna 2; Level 3 ≈ Madinah 6–8 + Lughatuna 3.
  Confirmed after the full scan.
- **[Owner]** First prototype: **Kids**. Input (stories, dialogues) in Arabic; explanation as top-quality English notes
  around it; Arabic teacher notes.

### 4.6 Egyptian Arabic
- **Arabic script (Kids · Teens · Adults; Adults first)** and **Franco (one version, adults)**, same scope, two scripts.
- **Sources (Samia Louis, AUC):** *Kallimni 'Arabi Bishweesh* (beginner) → *Kallimni 'Arabi* (intermediate) → *Aktar*
  (upper intermediate) → *Mazboot* (advanced) → *fi Kull Haaga* (higher advanced); *Egyptian Colloquial* (sound shifts
  from Fusha); *Egyptian Colloquial Arabic for the Advanced Learner* 1–3.
- **[Claude's call]** Levels: Sounds = the Fusha→Egyptian sound shifts; Beginner = Bishweesh; Intermediate = Kallimni +
  Aktar; Advanced = Mazboot + fi Kull Haaga + Advanced Learner.
- **Franco:** the owner's own spelling rules (given before Literacy C starts). Literacy C teaches that spelling; the
  Franco track reuses the Arabic-script lessons with every Arabic line shown in Franco.

### 4.7 English (goal-based)
- **[Owner]** Several books, not purely academic, built around what the learner wants.
- **[Claude's proposal]** A small shared core, then tracks the learner picks; placement and onboarding ask the goal:
  - **Kids:** *Oxford Phonics World* 1–2 (SB + WB) for the phonics order; *Jolly Phonics* readers (67 decodable stories)
    as the reading input.
  - **General / conversation & travel:** *English File* 4th ed. Beginner, Elementary, Intermediate (spine; no Advanced
    yet), *English for Everyone* (grammar guide, vocabulary), *English Vocabulary in Use* Elementary.
  - **Exams:** *Complete IELTS* Bands 4–5, 5–6.5, 6.5–7.5 (student's books).
  - **Work:** built from the general track with work situations; no business book (owner: work with what we have).
- **Method and grammar reference:** *How to Teach Grammar / Reading / Vocabulary Like a Pro*, *English Grammar: A
  University Course*, *Academic Writing Course*.
- Input audio in the "mahmoud" English clone until the owner's CI videos exist (§3a).

### 4.8 Hifz & Revision: test generator
- For learners who already memorise. A range (surah / pages / juz) → rounds: next ayah, missing word, order the ayat,
  which surah, start reciting from here, similar ayat (mutashabihat). Kids as a game, Teens as a challenge, Adults as a
  clean drill. Text from Tanzil. Results feed the student map; weak ranges come back more often.
- A site feature (code + database), not lesson content.

### 4.9 Seerah (Zad Path): a series, modelled on the owner's deck
- **[Owner]** Source: *The Sealed Nectar* (Ar-Raheeq al-Makhtum, English edition) for the facts and their order; our
  wording. Told like a TV series: gripping, rich in detail, never a sermon. Morals are taught without saying "the
  moral is": each lesson is projected onto a moment of a person in the story and from there onto the learner's life.
- **[Owner]** Two versions: **Kids**, and **Teens + Adults** (one shared language). Kids get their own narrative tone,
  pictures, motion and animation.
- **[Owner]** Images: Claude writes a prompt per slide; the owner generates the image (high quality, cinematic, showing
  what that slide says). The Prophet ﷺ, the companions and angels are never shown (curriculum-builder rule): an empty
  cradle, a lamp, light, a figure from behind at most for others, as the deck does.
- **The deck's grammar (analysed from Episode 1, 20 slides), the Seerah template:**
  - *Episode* = one lesson, about 20 slides, numbered "07 / 20", a running header (EPISODE 01 · THE YEAR OF THE ELEPHANT)
    and acts in the footer (The World in Shadows → The Gathering Storm → The Confrontation → The Miracle → The Aftermath
    → The New Dawn).
  - *Chapter slide* (most slides): kicker "CHAPTER VII — THE INVINCIBLE VANGUARD", a two-line serif title, one Arabic key
    term in gold (جيش الفيل), two or three cards (a label in caps, a short title, one italic line) or stat cards (60,000 /
    13 / Mahmoud), and "The Chronicle" panel: a headline, a drop cap, 3–4 short paragraphs with names and terms in gold,
    ending in one italic **Identity lesson · I'tizaz** line that ties the moment to the learner.
  - *Interlude · Reflection*: a symbolic image (scales, a question mark), "The question" (a dilemma by human logic), a
    paragraph that turns it to the learner's life, ending on a question.
  - *Integrated lesson*: the principle stated as a formula (Tawakkul = 100% effort + 100% surrender), shown through what
    the person in the story did.
  - *Quote card* ("The words that shook a throne") and *Quran verdict card* (Arabic, English meaning, reference).
  - *Stamp slides*: a date and place (CE 570 · عام الفيل); three-sign cards for simultaneous events.
  - *Cliffhanger*: "To be continued", two mysteries as questions, "Coming next: Episode 02 — …".
  - *Story craft*: the antagonist's motive and pride, numbers that build stakes, a reversal, quiet dignity against force;
    every chapter ends on something that makes the next one necessary.
- **Accuracy:** reports with weak chains (e.g. the signs at the birth: the Persian fire, the palace towers) are graded on
  Dorar before use and marked or dropped, per curriculum RULES §1.2. Numbers from the story (60,000, 13 elephants) are
  given as "the sources report".
- We rebuild the deck as motion stages in our player (same look; the stage explains by moving).
- Skill: stays in `curriculum-builder`; a `docs/curriculum/seerah/RULES.md` holds this template.

## 5. The language method (Fusha, Egyptian, English)

1. **Comprehensible input first:** every lesson starts with a story, dialogue or scene the learner can follow from
   pictures, motion and known words, before any rule. Output comes after enough input.
2. **Automatic spaced repetition:** every new word and phrase enters the learner's review deck by itself. The site
   schedules reviews; the teacher opens "today's review" at the start of class with one click; the learner can review
   alone between classes. The teacher never builds cards.
3. **Teacher-proof lessons:** each lesson holds everything for the class (warm-up review, input, practice, conversation
   prompts, homework, answer key, Arabic teacher notes). Nothing is needed from outside.
4. **Flexible:** a lesson stretches from 30 to 60 minutes (optional pages); a goal (travel, exam, work) changes which
   lessons are core.

Item 2 and the review screen are site features (§7).

## 6. Skills (one per family, same shape as curriculum-builder)

| Skill | Covers | Per-subject rules file |
|---|---|---|
| `curriculum-builder` (exists) | Zad Essentials, Seerah | `docs/curriculum/<version>/RULES.md`, `seerah/RULES.md` |
| `literacy-quran-builder` (new) | Literacy A, B, C; Quran Reading; Tajweed | `docs/curriculum/literacy/`, `quran-reading/`, `tajweed/` |
| `language-builder` (new) | Fusha, Egyptian (Arabic script and Franco), English, with §5 | `docs/curriculum/fusha/`, `egyptian/`, `english/` |

Each new skill: read-first list, the source folder and registry rows, the scope-only rule, the page and lesson shape,
the audio rule, the verify steps (screenshots of every step, tests, build) and the owner-feedback file it grows. Each is
written **after** the owner approves its prototype, so it captures the approved result, as `curriculum-builder` did.

## 7. Order of work

**Before Thursday 2026-10-29 (prototypes, one lesson each, motion stage, `reviewed: false`):**
1. Literacy A · Kids, Lesson 1 (2–3 look options for the new characters first).
2. Literacy B · Kids look, Lesson 1.
3. Fusha Level 1 · Kids, Lesson 1.
4. Seerah Episode 1 · Teens + Adults (the deck rebuilt), if the time holds; image prompts to the owner on day one.

Audio: the two Arabic clone scripts go to the owner first; until the clones exist, sound slots are marked and the English
clone covers English lines.

**After Thursday (owner reviews from his phone):** the remaining prototypes (Literacy A Teens/Adults, Literacy C after
the Franco rules, Tajweed L1, Quran Reading, Egyptian Adults, English Kids and General, Seerah Kids); the two new skills
and `seerah/RULES.md`; then site work: onboarding and catalog to the new map, audio playback, the spaced-repetition deck
and review screen, the Hifz test generator.

## 8. Not decided yet (owner's)

- Is Quranic Arabic (understanding the Quran's language) a strand of Fusha for Muslims, a separate subject, or out?
- Missing books: Madinah Reader 7, Jannat Tajweed Book 3, English File Advanced.
- *Minhaj al-Muslim* and Jannat *Islamic Studies* 1–4: reference for Zad Essentials and the Scholar's Path later.
- Prices and session lengths of the new subjects (RULES §3).

## 9. Non-goals and anti-goals

- Non-goals now: Scholar's Path; native app; any new subject outside this map.
- Anti-goals: copying a book's text or exercises; a purely academic language course; lessons that need the teacher to
  bring outside material; a clone voicing the Quran; Seerah told as a sermon; centring one teacher in the text.
