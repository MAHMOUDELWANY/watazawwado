# Design: curricula for every subject (beyond the Zad Path)

Date: 2026-10-25 · Status: draft for the owner's approval · Talk with the owner in Arabic; this file is in English (RULES §7).

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

- The lessons' voice is the owner's ElevenLabs clone **"mahmoud"** (voice id `jSOs0gJh7GzUGtEgxVhs`). Claude writes each
  word or sentence with its emotion, generates the audio and places it in the lesson.
- **[Claude's call]** Single letter sounds, harakat and makharij are where a synthetic voice is least reliable (ع ح ق ض
  and short vowels). Claude lists every one of those the lesson needs and the owner records them himself; the clone
  speaks words, sentences, dialogues and stories. Any clip that sounds wrong goes on the owner's recording list.
- Generated audio is stored with the lesson and replayable by the learner at any time.

## 3b. Look and identity — [Claude's proposal, owner undecided]

One identity for the whole academy, a world of its own for each subject: the same type, frame, player, khatam and ribbon
everywhere (so every lesson is clearly ours), and per subject family its own colour accent, motif and cast:
Literacy = a playful world of letters with **new neutral characters** (it serves non-Muslims too); Quran (B, reading,
tajweed) = the mushaf's ornament and calm; Languages = everyday places and people of the language (Cairo streets for
Egyptian); Seerah = the cinematic dark-and-gold of the owner's deck; Zad Essentials keeps its approved looks. As with
every new look (curriculum-builder §3), 2–3 pages are prototyped and the owner chooses before a lesson is built.

## 3c. The owner's own content — [Owner, 2026-10-25]

Where the books leave a gap, the owner adds scientific content of his own. Each lesson brief has a line "Owner's
additions" that he fills, or Claude marks the gap for him.

## 4. Each subject

Source files are the owner's PDFs, read as scanned images. **[Claude's call]** They move from `Downloads` to a fixed
folder outside the repo, `C:\Users\ahmed\Documents\watazawwado-sources\<subject>\`, and are listed in
`docs/curriculum/sources.md` with their scope role. They are never committed (size and copyright). Consequence: work that
reads them must run on this machine (a session here, or Remote Control from the phone), not in a cloud session.

### 4.1 Literacy A: general Arabic literacy (Kids · Teens · Adults)
- **Scope sources:** Jannat al-Quran *Arabic & Tajweed* Book 1 (alphabet → letter positions → connecting → harakat →
  sukoon → shadda → tanween → madd: the cleanest English-medium order), *Nour al-Bayan* (modern edition, sequence of
  harakat and drill types), *Fath ar-Rahman* (blending tables), *Arabic Bilqalam* (inspiration only, as decided
  2026-10-16), *Steps for writing the letters* (stroke order per form).
- **No religious content:** our own neutral words (house, cat, bread, door). Those books mix Quranic words; we do not.
- **Lesson shape:** the letter is drawn stroke by stroke on the stage (code animation), its sound plays in the owner's
  voice, the learner taps any letter, syllable or word to hear it again; blending is shown as letters sliding together.
  Each lesson ends with a short read-aloud the teacher marks.
- **Versions:** Kids keep the Zad Kids look and cast; Teens the Teens look; Adults the calm editorial look.

### 4.2 Literacy B: Quranic reading rules (Muslims, after A)
- **Scope sources:** the later sections of Jannat Book 1 (hamzat al-wasl, letters not pronounced, waqf), *Nour al-Bayan*
  and *Fath ar-Rahman* (Quranic words), King Fahd Complex mushaf conventions.
- Covers what differs from ordinary Arabic script: Uthmani spelling (dagger alif, small letters), waqf signs, the
  mushaf's symbols, letters written but not read. Words come from the Quran (Tanzil text).
- **[Claude's call]** One version with the age look switched by the learner's age, because the content is the same.

### 4.3 Quran Reading (no tajweed)
- Reading fluency from the mushaf: graded passages, short surahs first, the teacher marks fluency. Mostly a practice
  tool (passage + tap-to-hear + teacher marks), little explanation. **[Claude's call]** Audio for whole ayat comes from
  a licensed recitation (sources.md), not from the owner, unless he wants to record.

### 4.4 Tajweed (3 levels)
- **Scope sources:** Jannat al-Quran *Tajweed* Books 1, 2, 4 (**Book 3 missing**), checked for accuracy against
  *Taysir ar-Rahman fi Tajweed al-Quran* (Su'ad Abdul-Hamid).
- Levels as decided 2026-10-18: L1 essential rules applied while reciting; L2 makharij and sifat; L3 advanced rules.
- **Lesson shape:** rules shown as colour layers on real ayat that switch on one by one; makharij on an animated mouth
  and throat; madd lengths as beats; the owner's voice for every example.

### 4.5 Fusha Arabic (3 levels; Kids and 12+ versions)
- **Scope sources:** *Madinah Arabic Reader* 1–6 and 8 (**Book 7 missing**), *Lughatuna al-Fusha* 2–3 (Samia Louis,
  AUC). **[Owner]** *Al-Arabiyya Bayna Yadayk* is dropped. Jannat *Quranic Arabic* 1–3 as a possible strand for Muslims who
  want to understand the Quran (see §8).
- **[Claude's call]** Madinah gives the grammar spine (it is built as one structure per lesson), Lughatuna the themes,
  conversation and level-2/3 reading. Level 1 ≈ Madinah 1–2; Level 2 ≈ Madinah 3–5 + Lughatuna 2;
  Level 3 ≈ Madinah 6–8 + Lughatuna 3. To be confirmed after the full scan.
- Conversations, sounds and new words in the owner's voice; replayable from the lesson at any time.

### 4.6 Egyptian Arabic
- **Arabic script (Kids · Teens · Adults; Adults first)** and **Franco (one version, adults)**, same scope, two scripts.
- **Scope sources (Samia Louis, AUC):** *Kallimni 'Arabi Bishweesh* (beginner) → *Kallimni 'Arabi* (intermediate) →
  *Kallimni 'Arabi Aktar* (upper intermediate) → *Kallimni 'Arabi Mazboot* (advanced) → *Kallimni 'Arabi fi Kull
  Haaga* (higher advanced); *Egyptian Colloquial* (the sounds that change from Fusha to Egyptian); *Egyptian Colloquial
  Arabic for the Advanced Learner* 1–3.
- **[Claude's call]** Levels: Sounds = the Fusha→Egyptian sound shifts; Beginner = Bishweesh; Intermediate = Kallimni +
  Aktar; Advanced = Mazboot + fi Kull Haaga + Advanced Learner.
- **Franco:** the owner's own Franco spelling rules (he gives them before we start Literacy C). Franco literacy C teaches
  that spelling; the Franco Egyptian track then reuses the Arabic-script lessons with every Arabic line shown in Franco.

### 4.7 English (goal-based)
- **[Owner]** Several books, not one; not purely academic; built around what the learner wants.
- **[Claude's proposal]** A small shared core, then tracks the learner picks: Kids (phonics and reading); Conversation &
  travel; School & exams; Work. Placement and onboarding ask the goal. No books received yet: Claude researches the best
  sources per track and brings a shortlist for the owner (scope only, as above); the owner obtains the books.
- Received 2026-10-25 (method and grammar, not a course): *English for Everyone: English Grammar Guide* (DK, Thomas
  Booth), *English Grammar: A University Course*, *How to Teach Grammar / Reading / Vocabulary Like a Pro*, *Academic
  Writing Course*. They serve the grammar reference and the teacher method, not the lesson sequence.

### 4.8 Hifz & Revision: test generator
- For learners who already memorise. The teacher (or learner) picks a range (surah / pages / juz); the generator makes
  rounds: next ayah, complete the missing word, order the ayat, which surah is this, start reciting from here, similar
  ayat (mutashabihat). Kids get it as a game, Teens as a challenge, Adults as a clean drill. Text from Tanzil.
- Results feed the student map: weak ranges come back more often.
- This is a site feature (code + database), not lesson content.

### 4.9 Seerah (Zad Path): from the owner's deck
- **Model:** the owner's deck *Episode 1: The World in Shadows / The Invincible Army* (20 slides, 1440×810). Its
  structure becomes the Seerah lesson template:
  episodes with numbered chapters → each chapter: a title, one Arabic key word in gold, two fact cards, "The Chronicle"
  (the story in 3–4 short paragraphs), an "Identity lesson · I'tizaz" line → interludes with one reflection question →
  "Integrated lessons" (the principle: e.g. tawakkul = full effort + full surrender) → a Quran verdict card → a
  cliffhanger to the next episode. Look: dark, cinematic, gold type, real stills.
- We rebuild it as motion stages in our player (same look, but the stage explains by moving: the empires on a map, the
  army's numbers counting up, the elephant that turns every way but one).
- **Source:** Ar-Raheeq al-Makhtum (English edition, *The Sealed Nectar*, received 2026-10-25) for the facts and their
  order; our wording. Reports the
  book carries with weak chains (for example the signs at the birth: the Persian fire, the palace towers) are graded on
  Dorar before use and marked, or dropped, per curriculum RULES §1.2.
- Versions: Adults = the deck's tone; Teens = same story, identity and dilemmas; Kids = the Kids cast and storybook look.
- Skill: stays in `curriculum-builder` (it is part of the Zad Path).

## 5. The language method (Fusha, Egyptian, English)

1. **Comprehensible input first:** every lesson starts with a story, dialogue or scene the learner can follow from
   pictures, motion and known words, before any rule. Output (speaking, writing) comes after enough input.
2. **Automatic spaced repetition:** every new word and phrase in a lesson enters the learner's review deck by itself.
   The site schedules reviews; the teacher opens "today's review" at the start of class with one click; the learner can
   review alone between classes. The teacher never builds cards.
3. **Teacher-proof lessons:** each lesson holds everything for the class: warm-up review, input, practice, conversation
   prompts, homework and the answer key, with Arabic teacher notes. Nothing is needed from outside.
4. **Flexible:** the same lesson stretches from 30 to 60 minutes (optional pages), and a goal (travel, exam, work)
   changes which lessons are core.

Items 2 and the review screen are site features (§7).

## 6. Skills (one per family, same shape as curriculum-builder)

| Skill | Covers | Per-subject rules file |
|---|---|---|
| `curriculum-builder` (exists) | Zad Essentials, Seerah | `docs/curriculum/<version>/RULES.md` |
| `literacy-quran-builder` (new) | Literacy A, B, C; Quran Reading; Tajweed | `docs/curriculum/literacy/`, `quran-reading/`, `tajweed/` |
| `language-builder` (new) | Fusha, Egyptian (Arabic script and Franco), English, with the method of §5 | `docs/curriculum/fusha/`, `egyptian/`, `english/` |

Each new skill: read-first list, the source registry rows for its books, the scope-only rule, the page and lesson shape,
the audio rule, the verify steps (screenshots of every step, tests, build) and the owner-feedback file it grows. Each is
written **after** the owner approves its prototype, so it captures the approved result, as `curriculum-builder` did.

## 7. Order of work

**Before Thursday 2026-10-29 (prototypes, one lesson each, motion stage, `reviewed: false`):**
1. Literacy A · Kids, Lesson 1.
2. Literacy B, Lesson 1.
3. Fusha Level 1, Lesson 1. **[Claude's call]** The 12+ version first (most adult learners in the West); the input
   (stories, dialogues) is in Arabic, explanations and teacher notes around it are in English for the learner and
   Arabic for the teacher.
4. Seerah Episode 1 · Adults (the deck rebuilt), if the time holds. **[Claude's call]** Built from the deck's facts,
   each checked (Dorar and the classical Seerah sources) until Ar-Raheeq arrives; it reuses the deck's own stills.

**[Claude's call]** Literacy B Lesson 1 uses the Kids look (families are the main audience); Teens and Adults looks follow.

Audio: the prototypes mark every sound slot and ship a recording list for the owner; until he records, the slot shows
"recording coming". **[Claude's call]** No synthetic voice in place of his.

**After Thursday (owner reviews from his phone):** the remaining prototypes (Literacy A Teens/Adults, Literacy C after
the Franco rules, Tajweed L1, Quran Reading, Egyptian Adults, English after the book shortlist, Seerah Kids/Teens); the
two new skills; then site work: onboarding and catalog to the new map, the audio recording and playback pipeline, the
spaced-repetition deck and review screen, the Hifz test generator.

## 8. Not decided yet (owner's)

- Is Quranic Arabic (understanding the Quran's language) a strand of Fusha for Muslims, a separate subject, or out?
- Missing books: Madinah Reader 7, Jannat Tajweed Book 3, the English course books from Claude's shortlist.
- *Minhaj al-Muslim* and Jannat *Islamic Studies* 1–4 arrived with the batch: reference for Zad Essentials and the
  Scholar's Path later, not used now.
- Prices and session lengths of the new subjects (RULES §3).

## 9. Non-goals and anti-goals

- Non-goals now: Scholar's Path; native app; any new subject outside this map.
- Anti-goals: copying a book's text or exercises; a purely academic language course; lessons that need the teacher to
  bring outside material; synthetic audio pretending to be a teacher; centring one teacher in the text.
