# Curriculum Building Rules (binding)

> Every model, agent or developer that writes, edits or builds curriculum (المنهج) content follows this file. It was
> agreed with the owner on 2026-10-18. Changing a rule needs the owner's explicit approval, recorded here with its date.
> Background and history: `PLAN.md`. Workflow: the `curriculum-builder` skill (`.claude/skills/curriculum-builder`).
> Project-wide rules (pricing, booking, language, tone): `../../RULES.md`.
>
> **Short version.** One step at a time, then stop for the owner's review. Never invent evidence, prices or books. Never
> mark a lesson reviewed. Every lesson has four stations (Spark → Zad → Athar → Ahd), and every ayah gets a tadabbur stop.

Scope: the **Zad Path** (مسار الأثر), our own curricula: Zad Essentials (أول الزاد) and Seerah, each in three versions.
The Scholar's Path (مسار طالب العلم) teaches classical books as courses and has no curriculum of ours (see §6).

## 1. General rules (every Zad Path curriculum, every version)

### 1.1 Mission
- Built on ﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾ (2:197) and ﴿وَأَمَّا مَا يَنفَعُ النَّاسَ فَيَمْكُثُ فِي الْأَرْضِ﴾ (13:17):
  **zad → athar → change**. The learner leaves changed, not only informed. Deeds over words.
- **Identity, pride and conviction in every age band:** the learner is proud to be Muslim, unafraid of anyone's blame, and
  convinced by reasons. If the root is rotten, the tree will not grow.

### 1.2 Evidence and sources (anti-hallucination)
- **Rational argument before textual evidence** in every topic. Scientific facts and miracles only when well established;
  never stretch an ayah to fit a theory.
- **Quran:** text and tafsir from the quran.com connector only. Uthmani text copied unchanged, with surah:ayah.
- **Hadith:** sahih or hasan only (prefer Bukhari and Muslim for kids). Arabic matn from the classical collection;
  reference = book + number (sunnah.com numbering); grading and grader checked on Dorar. Never copy sunnah.com or Dorar
  translations or commentary.
- **English meanings** of ayat and hadith are written by us and reviewed by the owner.
- **No saying attributed to a scholar** without a checkable reference. Recognised differences are shown as differences,
  never as consensus (except where §3 says to teach one view).
- **Unverified = "needs review".** Log it in the lesson brief; never guess. The model is never the final judge of
  authenticity.

### 1.3 Creed and fiqh
- Ahl al-Sunnah wal-Jama'ah, balanced and moderate, with an Azhari foundation in Aqeedah.
- Fiqh: **Shafi'i**. How differences are handled depends on the version (§3).

### 1.4 Copyright and licences
- Three kinds of material, kept apart: (a) evidence and facts, used with exact references; (b) general teaching know-how,
  free to apply; (c) protected expression (an author's wording, stories, examples, exercises, illustrations, detailed unit
  order), **never copied or paraphrased**. Rewording is not a licence.
- Commercial books (Jannat Al Quran, Kallimni 'Arabi, Al-Arabiyya Bayna Yadayk, ...) are **scope references only**: what a
  level should cover. The sequence, wording, examples and exercises are ours.
- Every source (text, image, font, sound, AI output) is recorded in `sources.md` with its licence before it is used.

### 1.5 Lesson structure: four mandatory stations
Every lesson, in every version, has the four stations in this order. Each page is tagged with its `station`.

| Station | Purpose | Must contain |
|---|---|---|
| **Spark** (الشرارة) | Hook | A question, mystery or surprising fact from the learner's world, never a definition. From lesson 2 on: a quick recall of the last lesson and a check on last week's Ahd. |
| **Zad** (الزاد) | Explanation | The rational step, then the evidence, built up step by step. A question or interaction every 1–3 pages. One "wow" moment. |
| **Athar** (الأثر) | Tadabbur and application | A tadabbur stop for every ayah (§1.6), real-life application, and the check (game or case questions, §3). |
| **Ahd** (العهد) | Commitment | One concrete action for the week, chosen by the learner where possible, followed up in the next lesson's Spark. Then the cliffhanger to the next lesson. |

Also in every lesson: the goal, measurable outcomes, chapters (`chapters`) for the tracker, and a link to the lessons before
and after. Every cliffhanger is answered in the next lesson.

### 1.6 Tadabbur pillar
Tadabbur is not a separate subject; it is part of how every lesson is made. **Every ayah shown in a lesson gets a tadabbur
stop** (`tadabbur` on the page that shows it):
1. **One key word**, with its meaning and root.
2. **The question** "What is this ayah telling *me*?"
3. **One practical action.**
Sources: recognised tafsir through the quran.com connector only; no personal tafsir. Depth grows with age (§3).

### 1.7 Length and density
- A lesson is designed for **45 minutes** on average.
- Every page carries **strong ideas the teacher can branch from**: never thin, never crammed.
- To fill a 60-minute lesson, extra content goes **on the slides themselves** (extra pages, deeper tadabbur, a second game),
  never as filler in the teacher notes, and never repeating what was said. Extra pages are marked `optional: true`; the
  teacher skips them in a 30-minute lesson.

### 1.8 Teacher notes
- Every page has `explain`: the read-aloud detail behind the slide, with points the teacher can branch from.
- Every lesson has `teacherAr`: one Arabic entry per page (title, explain, note). The slide itself stays English.
- `teacherNote` is for short tips on how to teach a page.

### 1.9 Language and voice
- Content is **in English** (the audience is Muslim families in the West), keeping essential Arabic terms with Arabic
  script, transliteration and meaning. Ayat and hadith appear in Arabic with our English meaning.
- **The English meaning fits the learner's mind (owner, 2026-10-18).** For the young versions (Kids and Teens) the
  meaning of an ayah or hadith is written in simple, everyday words the learner already knows, in short sentences, never
  heavy or formal English ("made" rather than "created", "the skies" rather than "the heavens"). It stays faithful to the
  Arabic and to the tafsir; simple never means changed. Per band: see "Meaning of ayat and hadith" in §3.
- Voice: warm, wise, human and short. Never sounds AI-written. Run the `humanizer` skill on every learner- or
  teacher-facing text before it ships.

### 1.10 Visuals, motion and sound
- **Premium, out-of-the-box level for every version (owner, 2026-10-22).** Motion as rich as the Kids lessons, no slide
  with only one or two thin sentences, no text over a painting or outside its box. Before a lesson goes to review, every
  page is checked headless at its final step. The player design of 2026-10-22 (full-width bar, icon-only full-screen
  rail, exit icon in the corner outside the slide) is the baseline for the whole series.
- **Series opening (owner, 2026-10-22).** Every version with recurring characters (Kids, Teens) opens its first lesson
  with an anime-style "meet the cast" sequence, good enough to use in ads: cold open with the series title, one hard-cut
  card per character (name, Arabic name, age, one line, three traits, speed lines), the whole cast together with the
  series tagline, then the episode title and Start. Code: `src/curriculum/slides/Opening.tsx`; data:
  `src/curriculum/content/<subject>/opening.ts`, attached to Lesson 1 as `opening`. A character who joins later gets a
  card. Skip is always visible; the clapper button in the player replays it.
- **No lesson length on covers (owner, 2026-10-22).** The cover shows the series and version, never "45 minutes".
- **Never depict** prophets, Sahaba or Jibril (no face, no body). Show the place, the light, or a figure from behind at a
  distance, as Lesson 1 does.
- Any image style that serves the lesson is allowed (painting, anime, characters with faces, photographs). The goal is a
  learner who is curious, attentive and enjoying it. Every visual has a teaching purpose, never decoration.
- **Scene builds are mandatory** on every page that explains an idea: the picture itself acts the idea out step by step
  while the teacher talks (see `src/curriculum/slides/Scenes.tsx`). Story pages may use the painting with gentle motion.
- One player, brand palette (crimson, teal, copper, gold) and Islamic motifs for every version; each version has its own
  look (§3). Light and dark mode, phone-friendly, reduced motion respected.
- **Image consistency:** each version has a style guide in `style/<version>.md` (palette, character sheet, base prompt).
  Claude writes image prompts from it; the owner generates images (ChatGPT); each image is checked against the guide
  before it enters a lesson. Files go in `public/curriculum/<subject>/<lesson>/`.
- **No image is used twice in a lesson (owner, 2026-10-18).** Repeating a picture is boring and shows nothing new.
  Allowed: two consecutive pages that continue one scene (Lesson 1's veil), and the series devices (the three doors on the
  recall page, Jiddo's backpack on the Ahd page). `test/curriculum-rules.test.ts` enforces it.
- **Three kinds of images (owner, 2026-10-18).** Claude asks for exactly what a scene needs:
  1. **Scenes:** 4:3 paintings of a place or a moment (people in them stay still).
  2. **Character library:** the recurring characters in many poses on a transparent background, made once and reused in
     every lesson so they can enter, move, point and react. Reusing a character is allowed; reusing a painting is not.
  3. **Props:** objects that must move on their own (a key, a magnifier), transparent background.
  If ChatGPT cannot give transparency, a plain white background, which Claude removes with ffmpeg.
- **Claude adds code-drawn elements** wherever they make a scene better, without asking: bricks that build, particles
  (sand, stars, sparks), pen lines, a magnifying lens, zoom on a detail, parallax depth. Primitives:
  `src/curriculum/slides/Motion.tsx`.
- **The wow moment of every lesson is a motion scene** (like the key sliding into the lock), never a still picture with
  labels.
- **Every lesson brief has an "Images" table:** file, kind (scene / character / prop), transparent or not, description,
  page, and a prompt ready to paste into ChatGPT.
- **Sound effects only, no music, and few of them (owner, 2026-10-18: "too much, make them fit the scene").** Recorded
  CC0 effects (Kenney, `public/curriculum/sfx/`, listed in `sources.md`) with a few soft synthesised ones, all in
  `src/curriculum/slides/sfx.ts`. One sound per moment: cues that land within half a second are arbitrated by
  importance, so a step never stacks sounds. No sound on a plain Next click. The teacher can mute them in the player.
- **Our praise word is "Zādak Allāh!" (زادك الله, may Allah give you more)** (owner asked for a word of our own,
  2026-10-18), drawn from *zad*; it replaces "MashaAllah!" in the player.

### 1.11 Learning psychology
Hook first; questions throughout (the learner answers before being told); story and characters where the version allows;
low cognitive load per idea; retrieval of the last lesson; one memorable moment and a warm ending; visible progress (student
map and puzzle). **No dark patterns:** no fake urgency, no streak guilt, no punishment for missing a day, no turning
worship into points. Love first; Jannah and the Fire are both mentioned honestly (e.g. 15:49–50).

### 1.12 Source of truth
- **Lesson content:** the code (`src/curriculum/content/<subject>/`) is the source of truth.
- **Lesson brief** (`docs/curriculum/<curriculum>/Lxx-*.md`): outcomes, evidence table, sources, open points and owner
  decisions only. No page counts or page text (they drift).
- **Unit map** (`MAP.md`): lesson titles, outcomes, evidence and threads.
- **Where we are:** `PLAN.md §0`. **Decisions and history:** `PLAN.md`.
- **All curriculum files are written in English** (plans, rules, briefs, maps, style guides; owner, 2026-10-18). The
  Arabic teacher notes (`lxx-teacher-ar.ts`) are content and stay Arabic.

## 2. Workflow (how any agent works, even from a vague prompt)

1. **Read first:** `PLAN.md §0`, this file, the version's `MAP.md` and the lesson brief.
2. **Do one step only**, the next one in this order, then stop and ask the owner to review:
   1. Unit map (once per curriculum version): unit and lesson titles + one-line outcome each.
   2. Lesson brief: outcomes, rational step, evidence list with exact references and grading, sources, open points.
   3. Lesson pages: the text of every page, with stations, `explain`, tadabbur and Arabic teacher notes.
   4. Built pages: scenes, scene builds, images, game.
   5. Ready for review: tests pass, checked in the browser, `§0` updated.
3. **Never:** set `reviewed: true` (only the owner approves); publish anything to students; invent evidence, prices, books or
   session counts; start the next lesson before the owner has reviewed the current step.
4. **Same session:** update `PLAN.md §0` and add a line to the progress log (`PLAN.md §8`).
5. **Skills:** `brainstorming` before a new lesson or unit; `humanizer` on every text; `apple-design`, `animate`,
   `taste-skill`, `impeccable` and the other design skills for slides; `verification-before-completion` before calling
   anything done.
6. **Checks:** `test/curriculum-rules.test.ts` enforces the mechanical rules (stations, explain, Arabic notes, references,
   tadabbur, check, cliffhanger). A lesson that fails it is not ready.

## 3. Rules per age band

| | Kids 6–11 | Teens 12–17 | Adults 18+ |
|---|---|---|---|
| **Characters** | Yusuf (9), Maryam (7), their grandfather Jiddo and Mishmish the cat; the Zad backpack | New characters their own age (not Yusuf's family) | No recurring characters |
| **Stories** | Scenes from their life: school, home, friends, screens | Dilemmas that puzzle them: school, friends, social media, identity | True stories and real-life cases |
| **Check (Athar)** | A game checkpoint (types in `zad-essentials-kids/MAP.md`) | A challenge game | Case questions and a short review |
| **Doubts (shubuhat)** | Not raised | Answered inside the related lesson: rational first, then textual; never planting a doubt the learner did not have | As teens, in more depth |
| **Fiqh differences** | None (Shafi'i only) | None (Shafi'i only) | Shafi'i; where a recognised difference exists, one line: other views exist, ask your teacher |
| **Meaning of ayat and hadith** | Words a 6–11 child uses every day, short sentences, no formal English | Plain modern English, short sentences | Faithful and fuller, still plain English |
| **Tadabbur depth** | One word, one simple question, one small deed | The word's root and how it shapes the meaning | Root, context and tafsir notes |
| **Ahd** | A small deed, often with the family | A personal challenge | A habit or decision |
| **Look** | Illustrated storybook (the current slide system) | Bolder: graphic novel / anime | Calm, cinematic, editorial |
| **Excluded** | Signs of the Hour; explicit doubts; details of ghusl beyond Friday/Eid | — | — |

All three versions share **the same spine** (Zad Essentials: the hadith of Jibril and its three doors, five parts: Iman →
Taharah → Salah → the other pillars → Ihsan). Lessons are added or merged per version according to age (e.g. full ghusl
for teens and adults). Each version has its own `MAP.md`.

## 4. Lesson data (what the code expects)

`src/curriculum/types.ts`. Per lesson: `version`, `goal`, `outcomes`, `chapters`, `reviewed`, `pages`, `teacherAr`. Per
page: `station`, `layout`, `scene`, `lines`, `explain`, optional `evidence` (with `reference`), `tadabbur`, `vocab`,
`interaction`, `optional`, `teacherNote`. The game uses `layout: 'game'`; the cliffhanger uses `layout: 'next'`.

## 5. Publishing checklist (per lesson)

- [ ] Every ayah and hadith has an exact reference; hadith grading checked on Dorar; nothing marked "needs review" remains.
- [ ] Sources and licences of every text, image, sound and font are in `sources.md`.
- [ ] `humanizer` run on all text; Arabic teacher notes complete.
- [ ] `npm test` passes, including `curriculum-rules.test.ts`.
- [ ] Checked in the browser: desktop, phone, light and dark, reduced motion.
- [ ] The owner reviewed it and set `reviewed: true` (or asked Claude to, in writing).

## 6. The Scholar's Path (no curriculum of ours)

Courses on recognised classical books (matn always in Arabic; explanation in Arabic or English, learner's choice), each
with a fixed number of sessions, clear outcomes and a set book, at four levels (Preparatory → Beginner → Intermediate →
Advanced), any age. **Books, session counts and prices are decided by the owner only**; until then the catalog holds an
empty slot and nothing is shown to students.
