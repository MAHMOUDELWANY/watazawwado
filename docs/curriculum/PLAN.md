# Watazawwado Curriculum — Plan, Rules & Progress

> **Read first.** Any model or developer working on the curriculum (المنهج) must read this file and `RULES.md` before
> proposing or building anything. Status legend as in RULES.md: **[Decided]** = in force, **[Proposed]** = idea from
> discussion awaiting the owner, **[Open]** = question for the owner — never invent an answer. Record every owner
> decision here with its date, and add a line to the Progress log at the end of each session.
> The discussion with the owner happens in chat, in Arabic. Brainstorm reports are not saved as files; only decisions,
> rules, proposals, the source registry and progress live in `docs/curriculum/`.
> **Binding building rules: `RULES.md` (this folder, 2026-10-18). Procedure: the `curriculum-builder` skill.** Where this
> plan and RULES.md disagree, RULES.md wins. All curriculum documentation is written in English (owner, 2026-10-18).

## 0. Where we are (update every session)

Last update: 2026-10-23. History of how we got here: §8 (progress log).

### Zad Essentials · Kids (6–11): `zad-essentials-kids/`
- **Done:** map (37 lessons) approved; Lessons 1, 2, 3 built and **approved by the owner** (`reviewed: true`, open to
  booked students); series opening (Yusuf, Maryam, Jiddo, Mishmish) before Lesson 1.
- **Next:** Lesson 4 (Muhammad ﷺ, the Messenger) brief.
- **Not started:** Lessons 4–37.

### Zad Essentials · Teens (12–17): `zad-essentials-teens/`
- **Binding Teens rules in one file: `zad-essentials-teens/RULES.md`.**
- **Done:** map (40 lessons, 5 parts) approved 2026-10-21; Lessons 1, 2, 3 written, built with all images, and polished
  after the owner's feedback (text fit, richer scenes, Finish card); series opening (Zayn, Noor, Ethan, Amira, Hamza,
  Aunt Salma) before Lesson 1.
- **Waiting for the owner:** review of Lessons 1–3 together (drafts, `reviewed: false`, teacher-only at
  /dashboard/curriculum), and of the cast lines and traits in `src/curriculum/content/zad-teens/opening.ts`.
- **Next after review:** Lesson 4 (Can I Trust Him?) brief.
- **Not started:** Lessons 4–40.

### Zad Essentials · Adults (18+): `zad-essentials-adults/`
- **New session or account? Read `zad-essentials-adults/HANDOFF-2026-10-22.md` first** (the owner's conversation and
  where the work stopped).
- **Binding Adults rules in one file: `zad-essentials-adults/RULES.md`** (owner, 2026-10-22): Muslims with a background
  (new Muslims later, if there is demand); the aim is yaqeen and pride in the deen; 60-minute lessons with every page
  shown, no optional pages; projections from well-known people; role models only from the Companions, history and
  recently deceased Muslims of sound character; more advanced English in the owner's voice.
- **Done:** map approved 2026-10-22 (46 lessons per learner, 5 parts; 20a women / 20b men; notebook Zad al-Yaqeen,
  Then and Now, hand-off questions; money cases defined).
- **Done:** `style/adults.md` approved 2026-10-23 (cinematic documentary look, Then warm / Now cool, anonymous people,
  quotes as code-built cards).
- **Done:** Lesson 1 brief approved 2026-10-23 (Jobs hook, Hanzalah in L1, levels of yaqeen as the course backbone).
  Lesson 1 page text written (31 pages, `src/curriculum/content/zad-adults/`), catalog entry `zad-adults` added.
- **Done:** Lesson 1 page text approved; built pages done 2026-10-23: code scenes for every page
  (`slides/lessons/a01.tsx`), the wow scene "From hearing to seeing", the chain of narrators, the hourglass and the Zad
  al-Yaqeen notebook drawn in code.
- **Done:** v2 storyline approved 2026-10-23 and applied: 26 pages on one question ("why ask five questions he already
  knows?"), the death/Jobs/Bronnie opening, the 15:99 opener and the Ibn Umar page removed; 15:99 now answers Case 4.
- **Done 2026-10-23:** text first, then what we draw from it (Adults player rule + test); v3 cinematic pass: code-drawn
  diagrams replaced by the documentary `Reel` (real still, camera travels per build step, one lower-third at a time,
  title card until the still arrives).
- **Done 2026-10-23:** the 16 v3 stills with depth maps placed; `DepthStill` (Three.js shader: parallax, dolly, rack focus,
  haze, light rays) drives every idea page, a shot per build step.
- **Waiting for the owner:** review of Lesson 1 in the player; depth maps for the 9 older stills (cover, madinah,
  stranger, cushions, graves, horizon, lane, monday, night) so those pages move in depth too.
- **Next after review:** Lesson 2 (A World That Should Not Exist) brief.

### Seerah and the Scholar's Path
- Seerah (Kids / Teens / Adults): planned, not started. Scholar's Path: books, sessions and prices are the owner's call
  (RULES §6); nothing built.

### The lesson player (shared by every version) — done
- 1600×900 slide canvas, build steps, page turn, scene builds, sounds (`slides/sfx.ts`), praise "Zādak Allāh".
- Bar under the slide: full width, icon tools, red labelled "Full screen" button; language follows the site; no page count.
- Full screen: icon-only tools rail on an arrow handle, teacher's explanation drawer (N), exit icon in the corner strip
  outside the slide, timer 5–60 min (opens over the player), pen / highlighter / laser / stroke eraser / clear page.
- Back / Next on the slide, swipe on touch, rotate hint on phones, Finish card at the end of every lesson.
- Student view is a study kit only (no teacher notes, laser, timer or praise).
- Teacher curriculum page: subject → version → lessons as door cards. Teacher report after class; student map + puzzle.
- Text columns auto-fit (`Fit` in `slides/Slide.tsx`); paintings preloaded; series opening (`slides/Opening.tsx`).

### Known limits
- Lesson text ships in the site bundle, so the student lock is a UI lock. Upgrade to server-served lessons if content
  must be protected.
- Phones checked in a desktop browser at phone size only, never on a real device.

## 1. What we are building

- **[Decided 2026-10-16]** An animated, premium, code-built curriculum (motion graphics, modern, our own code) inside
  the **teacher workspace** and the **student portal**, to engage learners more deeply.
- **[Decided 2026-10-16] Scope — in:** subjects that need explanation and change the heart: Seerah, Fiqh,
  Aqeedah/Tawheed, Quran (meaning, tadabbur), Tajweed, Islamic studies, and the new foundations subject (§1a).
- **[Decided 2026-10-16] Scope — out for now:** memorization/skill subjects: the letters/alphabet (Noorani),
  language learning (Arabic, English), hifz.
- **[Decided 2026-10-16] Age bands:** 6–11, 12–17, 18+. Some content is fixed across bands, some differs (§4.6).
  Age is not the only axis: prior knowledge (beginner / intermediate / advanced) also matters; the existing placement
  test per subject and level is reused for this.
- **Reference the owner sent (2026-10-16):** Bilqalam Institute "Bilqalam Arabic" screen recording — course landing,
  course map (parts → coloured units with progress), 16:9 slide player on lined paper (animated writing, labels),
  teacher toolbar (pen, timer, present, fullscreen, praise overlay with confetti, flash-card drill with shortcuts).
  **Inspiration only — never copy; aim higher.**

### 1a. New foundations subject for children (kids who know nothing yet)

- **[Decided 2026-10-16]** A new subject in the spirit of "ما لا يسع المسلم جهله" under a new name of our own, so a
  parent whose child knows nothing picks it instead of guessing "Fiqh". It holds all the basics: belief, prayer and
  how to pray with its evidence, purification, essential hadith, manners, etc.
- **[Decided 2026-10-16]** Every topic gives the **rational argument before the textual one** (scientific or
  otherwise), then the evidence from Quran/Sunnah; miracles are mentioned where relevant.
- **[Decided 2026-10-16] Names:** Arabic **أول الزاد**; English **Zad Essentials** (chosen by Claude at the owner's
  request: short, strong rhythm, clear to parents, carries the brand word "Zad").
- **[Decided 2026-10-16, changed 2026-10-18] Three versions:** **Zad Essentials · Kids** (6–11), **· Teens** (12–17) and
  **· Adults** (18+), picked automatically from the learner's age. Same spine, lessons and style differ (RULES.md §3).
- **[Decided 2026-10-16] Goal (Kids):** the child's actions and words change, not only knowledge. Booked lesson by
  lesson, so every lesson is self-contained; lessons are designed for **45 minutes** on average, paged so the teacher
  can finish in 30 or stretch to 60. Expected length 3–6 months (~36–40 lessons). The first ~10 lessons give what makes
  a child a Muslim and a Mu'min with understanding.

## 2. Mission & lesson philosophy

- **[Decided 2026-10-16]** Built on ﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾ (البقرة 197) and
  ﴿وَأَمَّا مَا يَنفَعُ النَّاسَ فَيَمْكُثُ فِي الْأَرْضِ﴾ (الرعد 17): **زاد → أثر → تغيير** (provision → impact → change).
  The learner, child or adult, leaves changed. Deeds over words (RULES §6b).
- **[Decided 2026-10-16]** We do not invent religious content. We study existing curricula and trusted sources for
  structure and evidence, then build our own units, wording, examples and activities (never a reworded copy of a book).

## 3. Rules for content (anti-hallucination, sources, licences) — [Decided 2026-10-16]

Owner's brief of 2026-10-16 (pasted in chat) is the working method. Its binding points:

1. **Three kinds of material, kept apart:** (a) evidence and facts (ayat, authentic hadith, verifiable facts) — use with
   exact reference; (b) general teaching know-how (sequencing, active learning, assessment) — free to apply;
   (c) protected expression (an author's wording, stories, activities, questions, illustrations, detailed unit order) —
   never copied or paraphrased into ours. Rewording is not a licence.
2. **Evidence:** every ayah with surah:ayah and Uthmani text from a verified source; every hadith with book + number
   + grading; separate text / explanation / our conclusion; no saying attributed to a scholar without a checkable
   reference; recognised differences of opinion are shown as such, ijtihad is not presented as consensus. The model is
   never the final judge of authenticity; anything unverified is logged as "needs review", never guessed.
3. **Scientific claims / miracles:** only well-established facts, never stretch an ayah to a theory; the claim and its
   source are recorded like any other evidence.
4. **Review before publishing:** shar'i, scientific, pedagogical, language, technical/visual, and IP review. Nothing is
   shown to students without the owner's approval (`reviewed` flag). Sensitive or disputed issues go to a qualified
   shar'i reviewer ([Open] who besides the owner).
5. **Source registry:** `docs/curriculum/sources.md` — per source: name, owner, official link, type, date checked,
   licence, commercial use?, modify/distribute?, attribution?, share-alike?, other limits, proof, decision
   (allowed / with conditions / needs permission / unclear). A PDF online is not a licence. Classical text vs a modern
   edition/tahqiq/translation are checked separately. Same for images, fonts, sounds, AI output.
6. **Per-unit publish checklist:** evidence list, every quote referenced, sources that influenced the unit, licences of
   every text/image/sound/font, permissions where needed, review sign-off.
7. **Token-saving research workflow:** search official pages, tables of contents, licence pages first; ask the owner for
   a PDF only with: name, official link, why, the exact questions, the pages/chapters needed. Never read a whole file by
   default — search keywords, contents, relevant pages. Store findings (question, result, reference, confidence, use,
   open checks, licence) in the registry, not long book text. Never re-research a source already in the registry unless
   the fact is sensitive or changing.
8. **Staged delivery:** structure first → one pilot unit → review → only then expand.
9. **Imagery:** no depiction of prophets or Sahaba. Original cartoon characters (children, family) **with or without
   faces are allowed** for kids (owner, 2026-10-16) — we pick what serves the learner best. Every visual has a teaching
   purpose, not decoration.
10. **Sound:** sound effects only, **no music** (owner, 2026-10-16).
11. **Language:** content is **fully English** (owner, 2026-10-16) — the audience is Muslims in the West — keeping the
    essential Arabic terms every Muslim needs (Arabic script + transliteration + meaning). Ayat and hadith show the
    Arabic text with our own owner-reviewed English meaning (§5.8). UI chrome stays bilingual per RULES §6.
12. **Voice:** natural, warm, human, never sounding AI-written; short (RULES §6b).
13. **Skills (owner, 2026-10-16):** curriculum work uses the project skills in `.claude/skills` first:
    `brainstorming` before designing a unit or lesson, `writing-plans` / `executing-plans` for multi-step builds,
    `humanizer` on every learner- or teacher-facing text before it ships, `taste-skill` / `soft-skill` /
    `redesign-skill` for lesson screens and motion, `verification-before-completion` before calling anything done,
    and the `seo-*` skills for any public curriculum page.
    **[Owner, 2026-10-17]** Emil Kowalski's skills (`apple-design`, `animate`, `review-animations`,
    `improve-animations`, `mobile-native`, `break-ui`, ...) are important design skills for the whole site, the
    curriculum included. `apple-design` is an important one among the design skills, not the lead skill.

## 3a. Engagement & learning psychology — [Decided 2026-10-16]

Every lesson must keep the learner curious and active (owner's request), using learning psychology honestly:

1. **Hook first:** each lesson opens with an attention question, a small mystery or a surprising fact from the
   learner's world, never with a definition.
2. **Questions throughout:** a question or tiny interaction every 1–3 pages (predict, choose, spot, sort, "what would
   you do?"). The learner answers before being told (generation effect).
3. **Cliffhanger ending ("next time on…"):** every lesson ends with a teaser that links to the next lesson — an open
   question, a half-told story, or a puzzle piece the learner can't place yet — like the end of a series episode, so the
   learner wants to come back (curiosity gap, Zeigarnik effect). The teaser is always answered in the next lesson.
3b. **Game checkpoint (owner, 2026-10-16):** every lesson ends with a fun game inside the lesson that quietly checks
   its outcomes (stealth assessment); results feed the teacher report. Every lesson is linked to the one before and
   after; real-life examples from the learner's age (school, friends, home, screens) in every lesson.
4. **Story and characters:** recurring original characters and short stories carry the ideas; abstract → concrete
   (dual coding: words + a meaningful visual together).
5. **Low cognitive load:** one idea per page, few words on screen, the teacher speaks the rest; motion only where it
   explains something.
6. **Remember, not just see:** quick recall of the previous lesson at the start (retrieval practice), spaced review of
   older pages in the student map, mistakes treated as part of learning.
7. **Belonging and growth:** praise effort and progress, never compare children; autonomy (choices), competence
   (small wins), relatedness (family, teacher, community) — self-determination theory.
8. **Peak and end:** each lesson has one memorable "wow" moment and ends on a warm, positive note (peak-end rule).
9. **Visible progress:** the puzzle/map shows how far the learner has come and what is next (goal-gradient).
10. **Love first, honest always (owner, 2026-10-16):** no fear-based teaching, but Jannah and the Fire are both
    mentioned honestly (balance of hope and fear, e.g. الحجر 49–50); the goal is that the child loves the deen.
    No filler: every page adds a new idea or a new action.
11. **Ethics guard:** no dark patterns — no fake urgency, no streak guilt, no punishment for missing a day, no turning
    worship into points. Motivation serves the heart, not screen time.

## 4. Product decisions and proposals

1. **[Decided 2026-10-16] Paged lessons + teacher report → student map:**
   - The curriculum is split into pages. In class the teacher presents; when the lesson ends the teacher sends a report:
     subject, from page X to page Y, and an evaluation.
   - The evaluation feeds a **student map** showing the level: what to reinforce, what the student is good at — seen by
     the student, the parent and the teacher (so a teacher with many students never forgets).
   - The pages covered are automatically added to the student's dashboard; each lesson adds to the last, like a
     **puzzle** that completes into the whole curriculum. Covered pages stay on the site for review.
2. **[Decided 2026-10-16] Access:** teachers and students who have booked see the curriculum. Visitors who have not
   booked see that it exists, but locked.
3. **[Proposed] Four-station lesson arc:** الشرارة (hook) → الزاد (animated explanation) → الأثر (reflection) → العهد
   (one action for the week, followed up next lesson). Owner wants to see the implementation first.
4. **[Proposed] Tree of impact (شجرة الأثر):** roots grow with lessons, fruit with kept commitments (إبراهيم 24).
   Owner likes the idea, decides after seeing it.
5. **[Proposed] Template per subject:** Seerah (animated map, routes, timeline, "what would you do?"); Aqeedah (living
   cards for the Names of Allah); Fiqh (animated steps, scenario simulator, sorting); Tadabbur (word-by-word reveal,
   surah theme map, roots); Tajweed (animated makharij, toggleable rule colours, madd beats). Each lesson gets the
   format that suits it.
6. **[Proposed] Fixed vs varying per band:** fixed = the ayah, the hadith, the ruling/fact. Varies = framing (story /
   dilemma & identity / depth & evidence), vocabulary, interactions, length, visual style.
7. **[Proposed] Lessons are data, not code:** reusable animated blocks (ayah, hadith, timeline, map route, cards,
   sorting, reflection, commitment); Motion + SVG already installed, no heavy deps; responsive on phones.

## 5. Open questions for the owner

1. **[Decided 2026-10-16]** English name: Zad Essentials (§1a).
2. **[Open]** Which curricula the owner has in mind (names/links). The 2026-10-16 brief named none.
3. **[Decided 2026-10-16]** Shar'i review: the owner reviews everything himself.
4. **[Decided 2026-10-16]** No phase starts until the owner approves the working plan (§7).
5. **[Open]** Skills/plugins to add for writing and creative thinking (owner will add after the plan is reviewed).
6. **[Decided 2026-10-16] Fiqh school:** أول الزاد (both versions) teaches one school, **Shafi'i**, with no
   discussion of differences, so learners are not confused. The full adult Fiqh subject is for students of knowledge
   and teaches the wider science (evidence, schools, differences) in depth.
7. **[Decided 2026-10-16] Quran:** the Quran Foundation (quran.com) connector is the source for everything Quranic
   (text, tafsir, translations as reference, word morphology) — no other tafsir source needed. Shipped Arabic text is
   copied unchanged; it matches Tanzil's Uthmani text, kept with Tanzil's credit so storing it in lesson files stays
   within licence (QF terms forbid caching QF API data > 1 week).
8. **[Decided 2026-10-16] English meaning** of ayat and hadith is written by us, helped by quran.com, and reviewed by
   the owner.
9. **[Decided 2026-10-16, delegated to Claude] Hadith method:** only sahih/hasan; prefer Bukhari and Muslim for kids;
   Arabic matn from the classical collection, reference = book + number (sunnah.com numbering), grading and grader
   checked on Dorar; English meaning ours. Never copy sunnah.com/Dorar translations or commentary.

## 6. Phases (from the owner's brief)

1. Vision & standards, learner profiles, measurable outcomes per track.
2. Curriculum map: track → level → unit → lesson → outcomes → content → activity → assessment (per unit: title,
   audience, prerequisites, outcomes, concepts, evidence, lesson count, activities, assessments, mastery, duration,
   review needs).
3. Evidence research & verification.
4. Original content production.
5. Digital experience (animation, interaction, the paged player, teacher report, student map).
6. Quality review (6 reviews) + pilot with a few learners, improve from data.
7. Timeline, roles, tools, costs, risks, acceptance criteria — small testable version first.

## 7. Working plan — [Proposed 2026-10-16, awaiting owner approval]

**[Decided 2026-10-16] Small steps:** the owner never asks for a whole subject; work goes lesson by lesson or unit
by unit, and the owner reviews each before the next (prevents hallucination, best quality).

Two tracks that move together:

**Track A — content (repeat per lesson):**
1. Unit map (once per subject version): unit and lesson titles + one-line outcome each. Owner approves.
2. Lesson brief: outcomes, rational argument, evidence list (ayah/hadith with exact references and grading), sources
   used, open points. Owner checks the evidence.
3. Lesson pages in English: the text of each page + what moves on it. Owner checks wording and meaning.
4. Built pages (animation) in the player. Owner checks the look.
5. Marked `reviewed` → visible to booked students. Logged in §8 and the source registry.

**Track B — platform (built once, used by every lesson):**
1. Lesson player: paged, 16:9, teacher present mode + student review mode, light/dark, phone-friendly.
2. Block library: ayah, hadith, rational-argument, story scene, timeline, cards, sorting, question, reflection.
3. Teacher report after class: subject, from page → to page, evaluation per skill.
4. Student map + puzzle: covered pages added to the student's dashboard; strengths / to-reinforce, seen by student,
   parent, teacher.
5. Access lock: booked students and teachers only; others see it locked.

Storage idea: lesson content as reviewed data files in the repo (versioned with git); progress, reports and
evaluations in Supabase (new migrations when Track B starts).

Order: A1 for أول الزاد (kids) → A2–A3 for its first lesson → B1–B2 enough to show that lesson → owner review →
B3–B5 → continue lesson by lesson.

## 8. Progress log

- **2026-10-16** — Owner shared the Bilqalam reference video (reviewed frame by frame). Scope, mission, age-band idea
  agreed; concepts proposed.
- **2026-10-16** — Owner answered: bands 6–11/12–17/18+; new kids foundations subject; paged lessons + teacher report
  + student map + cumulative puzzle; existing curricula studied, our own wording; cartoon characters allowed, SFX only;
  English content with Arabic terms; tree/commitment pending; booked-only access. Owner's research/licence brief
  adopted as §3/§6. Next: owner's answers to §5, then Phase 1 research.
- **2026-10-16** — Arabic name أول الزاد chosen, two versions (kids / 12+); owner reviews all shar'i content, lesson by
  lesson. Working plan §7 proposed; nothing started.
- **2026-10-16** — Owner's second brief (sources & licences) received. First licence checks done and recorded in
  `sources.md` (Tanzil text OK with conditions; Tanzil translations non-commercial; QF API in-app only; Dorar/Sunnah.com
  research only; KFGQPC font unclear → OFL font; Kenney CC0). Open questions 6–7 added.
- **2026-10-16** — Owner installed skills for planning, writing, design and SEO (superpowers, taste-skill, humanizer,
  claude-seo) and made them the first choice for curriculum work (§3 rule 13).
- **2026-10-16** — Decided: Shafi'i for أول الزاد; quran.com connector for all Quran work; our own English meaning;
  hadith method delegated (§5.9). Next: A1 — unit map of أول الزاد (kids), awaiting owner's go.
- **2026-10-16** — English name Zad Essentials chosen. Engagement & psychology rules added (§3a: hooks, questions,
  cliffhanger endings linking to the next lesson). "Where we are" section (§0) added. Skills installed by the owner are
  not yet in a merged pull request.
- **2026-10-16** — Committed 51bb4bf (plan, skills, old manage-booking modal removed). Map of Zad Essentials · Kids
  approved with the owner's reorder (37 lessons); owner asked for a game checkpoint at the end of every lesson,
  storytelling and real-life examples for 6–11, everything connected. Lesson 1 brief written; Muslim 8 verified on
  Dorar (via the in-app browser — plain web fetch is blocked by Dorar).
- **2026-10-16** — Owner approved the three L1 points (no signs of the Hour, characters, faceless stranger). Built the
  lesson player (16:9, keyboard, full screen, praise, teacher notes, game scoring) and Lesson 1 as data; teacher page
  /dashboard/curriculum. Verified in the browser (desktop + phone). Lesson content is not committed yet.
- **2026-10-16** — Built B3–B5: teacher report, student map/puzzle, booked-only access; migration
  20261016000006 applied to production; API checked live (guards + one write/read, test row deleted).
- **2026-10-16** — Owner: "visuals poor, no control, no way to explain; I read from the lesson and simplify". Rebuilt
  as slide system v2 (see §0). Lesson 1 rewritten: 16 pages, every page has a teacher read-aloud explanation,
  more verified Arabic from Muslim 8, vocabulary chips. Rule: each page carries enough detail for the teacher to read.
- **2026-10-17** — Owner feedback on v2: storytelling and explanation approved; visuals still too simple; full screen did
  not fill; pen crashed the page ("something went wrong"); slides used the reference site's colours, not our brand.
  Fixed: pen crash (state updater read a cleared ref), full screen fills with floating controls, brand applied
  (paper, crimson mihrab lesson tab, arch-framed art, khatam pattern, Thmanyah, sentence case). **[Open]** source of
  professional illustrations (AI image test via Canva looked generic and showed a face; options sent to the owner).
- **2026-10-17** — **[Decided]** illustrations: no paid options. (1) Storyset (free, credit required) for general
  scenes that need motion; (2) owner generates Islamic/historic scenes and the recurring characters in ChatGPT Go from
  Claude's prompts, one style sheet. Files go in `public/curriculum/zad-kids/l01/`. No faces for prophets, companions
  or Jibril.
- **2026-10-17** — Owner delivered 13 ChatGPT paintings for Lesson 1 (cover, classroom, jiddo, madinah, stranger,
  sitting, pillars, roots, drawing, reveal, backpack, lego, character sheet), compressed to WebP in
  `public/curriculum/zad-kids/l01/`; slides show them with a slow camera move, SVG kept as fallback. Known: Maryam's
  hijab is teal in 3 images and gold in the character sheet.
- **2026-10-17** — **[Decided]** the player's language switch changes the teacher's explanation panel only; the slide
  stays English for the student. Arabic teacher notes per page in `content/zad-kids/l01-teacher-ar.ts` (owner to
  review). Full-screen controls are a side rail: right in English, left in Arabic.
- **2026-10-17** — Slide system v3, "illuminated storybook". Two surfaces: Stage (painting fills the slide, light chrome)
  and Paper (notebook). Each page gets a composition from its role (compositionFor in slides/Slide.tsx):
  title (cover), picturebook spread (story), portrait + clue pins (evidence with clues), manuscript (evidence),
  diagram with leader-line labels (concept), spotlight on the deep band (question), luminous (the reveal), arena
  (game), journal spread (mission), cliffhanger. Lesson 1 storyboard: 1 title · 2–4 spreads · 5 portrait · 6
  manuscript · 7 diagram · 8 spotlight · 9 diagram · 10 manuscript · 11 luminous · 12 luminous · 13 diagram · 14
  arena · 15 journal · 16 cliffhanger. Labels are positioned per painting (PINS, CLUE_PINS); new paintings need
  their own pins.
- **2026-10-17** — Owner: v3 drifted into "illustrated slides"; the reference (Bilqalam recording 2026-10-16 155908,
  re-watched frame by frame) explains by **building the picture while the teacher talks** (letter drawn by a pencil,
  labels with leader lines, sound bubble, steps and tiles one by one). Started "scene builds"
  (`slides/Scenes.tsx`): the painting itself acts out the idea, keyed to build steps, from stacked copies of the
  flat image (clip-path reveals, no new art). p7 Islam: the house is a pencil ghost with five empty sockets; each
  click raises one pillar in colour (gold light up the shaft, dust at its foot, number + name); at five the house
  lights up. p9 Iman: the tree stays visible ("what people see"), the soil is dark; each item lights a root from the
  trunk ("hidden in the heart"); at six the light rises into the tree. p5 clues: "No dust?" = magnifying lens on the
  clean hem against the sand; "Who is he?" = red-pen circle drawn round the figure. Paintings print onto the
  notebook (multiply, cream lifted to white). Fixed: in Arabic UI the English slide lost its serif. **Next:** same
  idea per page where it teaches (doors p13, reveal p11–12, sitting p6); a pencil-trace of the Arabic word on vocab
  pages; owner to judge the motion with the pane open (the agent's browser throttles animation).
- **2026-10-17** — Scene builds extended (`slides/Scenes.tsx`), one treatment per idea: p6 posture study (arrow
  "close, knee to knee", hand ringed, Arabic words join the labels with the evidence, the question draws the
  "learning seat"); p10 Ihsan (her card ringed, the heart traced, then the room goes dark, "nobody is looking", and
  only her work keeps its light); p11–12 one veiled courtyard across two pages (the slit opens a little each step, the
  question drawn as a "?" of light; p12 parts the veil, the column blooms, جِبريل is written beside it, then Iman /
  Islam / Ihsan rise out of the light); p13 doors at dusk, arches traced in gold, each item lights its door and hangs
  its Arabic + English name; p15 the bag's star traced, "zad" pinned, the map of the three doors lit with its road,
  and the mission the child picks drops in as a note. Added vocab جِبريل (Jibril, "the angel who brought the Quran")
  to p12 — **owner to review**. Not changed: p2–4, p8, p16 (story/question pages where the painting already carries the
  moment). Verified in the in-app browser during playback, plus reduced motion and phone width.
- **2026-10-17** — Player pass after a visual audit (each change checked in the browser at 1440, 768 and 375 wide,
  phone landscape, Arabic UI, reduced motion). p7: the ghost house has empty sockets (no grey pillars), the newest
  pillar's name is marked, progress reads "Pillar 2 of 5: Salah", the finished house says so. p9: a ground line and
  two brackets ("What people see" / "Hidden in the heart") from step 0, each belief keeps its line of light to the
  trunk, soft fades instead of spotlight circles, root count caption. p11–12: p12's title waits for the veil (it
  spoiled the guess), p11's guess step fades the story behind the question, reveal sparkles rise once. p8: opening
  the answer brings back the classroom painting, "Just like Ms. Clarke". Controls: R now replays only the last build
  step; a new button (Home) starts the page again from step 0. Phones: notes start closed under 1024px, sticky
  one-row toolbar, the slide's words at reading size under small slides, "turn sideways" hint, page grid as a list;
  full screen falls back to filling the window (iPhone, embedded browsers). Fixed: Arabic UI gave slide titles a
  1.5 line height (overflow) and mirrored the page grid's English titles. Not changed: p2–4, p16.
- **2026-10-18** — Owner decided the subject catalog (Zad Path with three age versions of Zad Essentials and Seerah;
  Scholar's Path as courses on classical books, details open) and the curriculum-building rules. Wrote `RULES.md`
  (general rules, four mandatory stations Spark → Zad → Athar → Ahd, tadabbur stop for every ayah, identity and pride
  in every band, 45-minute lessons with optional extra pages, mandatory scene builds, per-band rules for Kids / Teens /
  Adults, agent workflow), the `curriculum-builder` skill, `test/curriculum-rules.test.ts`, and tagged Lesson 1's
  stations. All curriculum documentation is in English from now on (owner).
- **2026-10-18** — Lesson 2 brief written (`zad-essentials-kids/L02-who-made-it-all.md`): 52:35–36, 30:30, 88:17–20
  checked with the quran.com connector (tafsir al-Sa'di, al-Muyassar, al-Wasit; morphology for the tadabbur words);
  fitrah hadith verified on Dorar (Bukhari 1385/1358/1359/4775, Muslim 2658, sahih); camel facts from San Diego Zoo
  (`sources.md` §G). Waiting for the owner's review of 4 open points.
- **2026-10-18** — Owner approved the Lesson 2 brief (first clause of the fitrah hadith, 52:36 included at a child's
  level, pedal-boat cliffhanger, San Diego Zoo). Lesson 2 page text written: 17 pages across the four stations, a
  tadabbur stop on every ayah (52:35, 52:36, 30:30, 88:17-20), Arabic teacher notes, game "Who made it?", Ahd "Clue
  Hunt". tsc + curriculum tests pass. Not checked in the browser (workspace needs a teacher login; scenes come next).
- **2026-10-18** — Owner approved Lesson 2's text. New rule (RULES.md §1.9, §3): English meanings for Kids and Teens in
  simple everyday words; Lesson 1 and 2 meanings simplified. Built-pages step started: 7 image prompts written in the L02
  brief for the owner to generate.
- **2026-10-18** — Lesson 2 built pages. Owner delivered 7 paintings (`l02/`). Scene builds: three ways (cards struck
  through one by one, the third ringed), 52:35 (the same cards come back and the ayah's words land on the two impossible
  ways; the third turns into "Allah made them"), sky (stars come out, the skies and the earth named, one arc: only
  Allah), fitrah (the key slides into the lock: heart and mind / Islam), "Look!" (the four words of 88:17-20 pinned on
  one desert), camel kit and maker's clues (pins). Player: paintings can live in any lesson folder; the cliffhanger keeps
  the painting on the left so people stay clear of the text (Lesson 1 too); cover and game wording no longer Lesson 1
  only. Checked in headless Chromium (Playwright) at 1280 wide and with reduced motion; tsc, 1011 tests and the build
  pass. Not checked: the real teacher workspace (needs a teacher login), phone and dark mode.
- **2026-10-18** — Owner: more striking motion (like the key), no repeated images, sound effects now, all project files in
  English. Rules written (RULES.md §1.10 images and sound, §1.12 English; project RULES.md §7; CLAUDE.md; style guide;
  curriculum-builder skill) and a test that fails when a painting repeats. Built `slides/Motion.tsx` (bursts, sandstorm,
  shooting star, ripples, a toy-brick castle that builds itself and opens its gate, cut-out sprites, lens, depth layers)
  and `slides/sfx.ts` (synthesised sound effects, no files, no music; mute button, key M). Lesson 2 scenes moved to
  `slides/lessons/l02.tsx` with a registry (`slides/lessons/index.ts`): three ways (poof / shivering bricks / the castle
  builds), clues (the gate opens), 52:35 (cards fly in), sky (constellation, shooting star), key (click and sparks), Look!
  (camera tour of the four signs), camel (lens per part: eyelid, sand on lashes, nostrils, feet), crash (bricks fly and
  stay), boat (ripples). Lesson 1 scenes got their sounds. Image batch 2 + character library requested.
- **2026-10-18** — Owner delivered image batch 2. Placed: new cover (stars twinkle in the window, a brick drops), Lesson 1
  castle redone with a gold hijab (sparkles), Yusuf's hand placing bricks as the code castle builds, the hand study
  (fingertips and joints marked, thumb ringed, a scratch heals), the newborn (breathing light, fitrah), the desert in
  four depth layers (each sign comes forward in the ayah's order), the ladybird walking on the leaf, the magnifier
  dropping into the bag. Camel and mountain cut-outs cleaned with ffmpeg (fake checkerboard). Line changed to "Jiddo
  holds up Yusuf's hand" to match the picture. Checked in headless Chromium; tsc, tests and build pass.
- **2026-10-18** — Owner delivered the character library (14 transparent poses, `characters/`). Lesson 2 now uses Jiddo
  (recall), Maryam (thinking, then jumping for joy as the castle stands) and Mishmish (walking through the open gate).
- **2026-10-18** — Lesson 1 motion pass (owner: "apply the effects to Lesson 1 too, I will review both together"):
  cover (doorways glow, motes rise, Yusuf and Maryam from the library wonder at the doors), classroom (chalk underline,
  a "?" by Ms. Clarke, whisper waves), Jiddo's story (steam, Mishmish's hearts, a trail of light to the window), Madinah
  (sun rays, a soft light round the man in white, seen from behind). Scenes in `slides/lessons/l01.tsx`; new primitives
  `Rise`, `SunRays`, `Glow` in `Motion.tsx`. The painting's slow camera move now carries its overlays with it.
- **2026-10-18** — Player polish for the whole series (owner: sounds too much and not fitting; new look and mechanics for
  checkpoints, questions and the game; a praise word of our own; better slide transitions). Sounds: recorded CC0 Kenney
  clips replace most synthesised ones, quieter, no sound on Next, and cues within 0.5 s are arbitrated so only the most
  important plays. Praise: "Zādak Allāh!" with the khatam star drawing itself in gold, the Arabic written right to left
  and motes of light rising (replaces "MashaAllah!" and the confetti). Questions: a khatam "seal", "Think first" card,
  the answer unfolding under a gold rule; choice and clue cards with letter badges. Game: one card at a time from a
  deck, dragged or tapped to a door, instant feedback (the door glows or shakes), first try counted for the teacher's
  report. Page turn: the old slide dims away as the new one drifts in from the direction of travel. Needs review: the
  link of "زادك الله" to the Prophet's words to Abu Bakrah (Bukhari 783) is not verified and is not shown on screen.
- **2026-10-19** — Lesson 3 (Allah Is One), all steps in one pass at the owner's request. Evidence checked: 21:22, 47:19,
  112:1-4 (quran.com connector; al-Sa'di, al-Muyassar; morphology), Bukhari 7375 / Muslim 813, Bukhari 5013, Bukhari 5017
  (Dorar, sahih). 16 pages (one optional), tadabbur on every ayah, game "True or not?", Ahd al-Ikhlas before sleep,
  cliffhanger to Lesson 4 (the football coach). Code scenes in `slides/lessons/l03.tsx`: two captains from above, the
  solar system that wobbles with a second "boss" (wow), the shahada's two halves, one heart with one centre, the khatam
  star of al-Ikhlas in four pieces, the needs chain. Player: a painting not delivered yet shows a warm wash instead of a
  broken image; Arabic vocab no longer wraps mid-phrase. Checked in headless Edge; tsc, tests and build pass. Waiting:
  owner review + 7 images.
- **2026-10-19** — Lesson 3 images delivered (7, 16:9). Placed; player can shift a wide painting's crop per scene
  (`SCENE_FOCUS`); moments re-aimed on the real pictures (sun rays, lamps, du'a light, the coach). Checked in headless Edge.
- **2026-10-19** — Lesson 3 open points settled by Claude at the owner's request: 112:3 taught plainly, its game card
  replaced by "Allah needs help from someone"; only the Prophet's ﷺ answer on screen; as-Samad stays optional; football
  cliffhanger kept; Ahd al-Ikhlas before sleep, with al-Falaq and an-Nas as an invitation.
- **2026-10-20** — Owner approved Lessons 1, 2 and 3 after review; `reviewed: true` set in the three lesson files
  (`src/curriculum/content/zad-kids/`), so they open for booked students and the "mystery visitor" teaser is unblocked.
- **2026-10-21** — Zad Essentials · Teens started (map step, A1). Owner decisions: recurring characters are a brother and
  sister (about 15 and 13) at a Western secondary school; anime look; puberty rulings get one shared lesson (bulugh,
  ghusl) plus one lesson for boys and one for girls, the teacher picks by learner; doubts are the common online ones
  (science and faith, evil and suffering, "all religions are the same", "why am I Muslim?", identity), each answered
  inside its related lesson. Kept from RULES §3: same spine, challenge game, personal-challenge Ahd, Shafi'i only.
- **2026-10-21** — Teens unit map drafted after a short brainstorm with the owner (why the version exists: teens pushed
  into worship without understanding; tone: no preaching, no heavy fear, story-led, curiosity). Web check: Yaqeen's
  "Modern Pathways to Doubt in Islam" used as a scope reference for which doubts to answer. Waiting: owner review.
- **2026-10-21** — Owner approved the Teens map as written. Wrote `style/teens.md` and the Teens L1 brief (Muslim 8 reused;
  Al-Baqarah 2:170 checked on the quran.com website with al-Sa'di because the connector was offline; text to re-copy at
  the page step; tadabbur root note marked needs review). Waiting: owner review.
- **2026-10-21** — Owner approved the Teens style guide and L1 brief (hook and 2:170 kept). Teens L1 page text written: 18 pages
  (two optional), full Muslim 8 matn checked on Dorar, 2:170 tadabbur on يعقلون (plain root meaning only), challenge
  "Three Doors, 60 Seconds", Ahd picked by the learner, cliffhanger to L2 (the Big Bang). `zad-teens` added to the catalog
  (teacher page shows the draft); scene ids added, paintings come at the built step. tsc, full tests and build pass.
- **2026-10-21** — Owner approved the Teens L1 page text and asked for a ChatGPT setup prompt. Wrote `chatgpt-prompts.md`
  (setup message, characters 1–20, L1 scenes 21–33). Built Teens L1: `slides/lessons/t01.tsx` (sand that never lands on
  the stranger = wow, Why List phone, pillars, six around the heart, three doors, footprints circle, Big Bang); curriculum
  files now resolve per subject folder (`asset()` in Art.tsx, `zad-teens/...`). Checked in headless Edge: 18 pages, desktop
  and phone, dark, reduced motion, no console errors. tsc, tests and build pass.
- **2026-10-21** — Owner works from `style/teens.md` directly (sheet done, library in progress). L1 scene prompts moved there as
  Step 3, with a note to send ChatGPT first; `chatgpt-prompts.md` removed.
- **2026-10-22** — Overnight run (owner: "finish L1, then do L2 and L3, give me the image prompts, don't stop"). L1: 32
  images placed (13 scenes, 19 characters; Ethan's trainer logo painted out), motion re-aimed on the real paintings,
  characters added to two code studies. L2 "Did It All Just Happen?" (52:35-36, 30:30, 57:3 + Muslim 2713 new, 88:17-20;
  NASA 13.8 bn years; "who made God?" answered with al-Awwal). L3 "One, Not Many" (21:22, 47:19, 45:23 new, 112, Bukhari
  7375/5013/5017; reuses the Kids L3 solar system and shahada scenes). Image prompts in `style/teens.md` Steps 4–5. The
  Why List is now a shared device (`t01.tsx`). Checked all 48 pages in headless Edge (desktop; phone, dark and reduced
  motion spot-checked), no console errors.
- **2026-10-22** — Owner review: six-pointed stars on the doors and the minarets are fine; L2 "Who made God?" stays, its
  analogy changed to a train with no engine; L3 "modern gods" tone approved. Quran connector back: 2:170 re-copied from it
  (one mark differed from the website copy), 57:3 and 45:23 matched, roots checked. Player (all lessons, Kids too): page
  turns were laggy and noisy (two full slides blurring at once); now one slide at a time, transform + opacity only, no blur
  on paintings. The explanation panel and the full-screen tool rail are now side drawers on an arrow handle, closed by
  default (N / T keys), so the slide gets the full width.
- **2026-10-22** — Teens L2 images delivered (6). Placed; `gaming`: the three game "gods" came out as women in revealing
  outfits, so the top of the TV was blurred into soft lights (sea, sky, sun) and three code glows mark them; `bench`: trainer
  logo painted out. Motion re-aimed on the real paintings; 57:3 shown as its first clause so the page fits. Waiting: owner
  reviews L1 and L2 together; L3 images (`style/teens.md` Step 5).
- **2026-10-22** — Teens L3 images (4) placed from `watazawwado-archive/`; motion re-aimed (sun, hearts from Noor's phone,
  the three lights on the game screen, Zayn's du'a page cropped to keep him in view); ﷺ in the Why List now drawn with the
  Arabic font. All 48 Teens pages checked, no console errors. All three Teens lessons ready for the owner's review.
- **2026-10-22** — Teacher curriculum page reorganised (owner): three levels of arched door cards (the homepage design):
  subjects (Zad Essentials; Seerah coming soon) → age versions (Kids, Teens; Adults coming soon) → lessons grouped by part
  with Ready / Draft / Coming soon. New routes /dashboard/curriculum/:group/:track/:number; old two-part lesson links
  redirect. `GROUPS`, `parts`, `art` added to `catalog.ts`. Player toolbar no longer floats over the slide on desktop.
- **2026-10-22** — Player UX (owner): Back / Next moved out of the tool bar onto the slide's lower corners (Next shows the
  build steps); swipe left/right on phones and tablets; full screen tries to turn phones sideways, and a dismissible
  "turn your phone / full screen" card replaces the old hint; lesson timer 5–60 minutes in steps of 5 (counts down to an
  end time; chip beside the lesson badge turns amber at 5 min, crimson at 1); a real eraser (drag over strokes) with a
  "clear page" button beside it (C key); "start page again" and the bar's Back/Next removed (Home key still restarts).
- **2026-10-22** — Student view of a lesson (portal review and free sample) is a study kit only: pen, highlighter, eraser, page
  grid, replay, sound, full screen, language. The teacher's explanation drawer, teaching tips, laser, timer and praise are
  teacher-only.

- **2026-10-22** — Teens L1–L3 quality pass (owner feedback): text columns auto-fit their box (scale only) so text never
  spills onto the paintings; picturebook and spotlight columns end before the painting; scene panels sit below the lesson
  ribbon; chapter strip stays on one line; evidence pages keep their key line as a lead-in (Teens only). Rebuilt the five
  pillars (coloured shafts, names on the floor, roof drops), the cause chain and the "look up" pitch; StageBg on every
  drawn scene; certainty scene shows what feeds yaqeen. Player: paintings preloaded, a Finish card ends the lesson and
  leaves full screen; Why List marks Q1 "Lesson 11" instead of looking unfinished. All 48 pages audited headless.
- **2026-10-22** — Series opening (owner): anime-style "meet the cast" before Lesson 1 of Kids (Yusuf, Maryam, Jiddo,
  Mishmish) and Teens (Zayn, Noor, Ethan, Amira, Hamza, Aunt Salma); replay from the clapper button. Covers no longer
  show "45 minutes". Rules in RULES §1.10. Character lines and traits are new copy: owner to review.
- **2026-10-22** — Opening pacing (owner): cards stay 7 s (Teens) / 8.5 s (Kids); Back, Next, Pause and clickable progress
  ticks (the current tick fills with the time left); P pauses; cast images decoded before their card.
- **2026-10-22** — Adults started (owner, after brainstorming): audience, aim (yaqeen, pride), 60-minute lessons with no
  optional pages, projections and role-model rules recorded in `zad-essentials-adults/RULES.md`; map drafted
  (`zad-essentials-adults/MAP.md`, 46 lessons) for the owner's review.
- **2026-10-22** — Adults map approved (owner): 46 lessons; notebook renamed Zad al-Yaqeen; money lesson with defined
  cases; Lesson 20 split into 20a (women) and 20b (men, incl. how the Messenger ﷺ treated his wives).
- **2026-10-23** — Adults style guide drafted (`style/adults.md`): calm cinematic documentary-photo look, Then/Now light
  worlds, no recurring characters, anonymous people, no generated likeness of real people, editorial slide rules, base
  prompt. Waiting for the owner's review.
- **2026-10-23** — Owner approved `style/adults.md`. Adults Lesson 1 brief written: Muslim 8 (full matn), Muslim 2750
  (Hanzalah), Muslim 2958 on Dorar; 102:1–8, 15:99, 56:95 with al-Sa'di, Ibn Kathir, Ibn al-Qayyim (levels of yaqeen),
  al-Muyassar via the quran.com connector; quotes from Steve Jobs (Stanford 2005) and Bronnie Ware; «هاذم اللذات» left
  out (disputed grading). Waiting for the owner's review.
- **2026-10-23** — Owner approved the Adults L1 brief and its three open points. Page text written: 31 pages, Arabic
  teacher notes, catalog entry `zad-adults` (46-lesson plan, five parts); test added for "no optional pages" in Adults.
  tsc and curriculum tests pass. Waiting for the owner's review.
- **2026-10-23** — Owner approved the Adults L1 page text. Built pages: 27 code scenes in `slides/lessons/a01.tsx`
  (documentary look, slow motion, few sounds), registered in `lessons/index.ts` and `SCENE_IMAGES`; hourglass drawn in
  code instead of a prop. Every page checked at its final step in a local preview (desktop and phone size, no console
  errors); reduced motion handled in code but not emulated. Waiting for the owner's 12 stills.
- **2026-10-23** — Owner delivered the 12 Adults L1 stills; converted to WebP in `public/curriculum/zad-adults/l01`
  (madinah also saved as `reference.webp`), overlays re-placed to fit them, pen strokes thinned; pages checked with
  headless Chrome at their final step. Lesson 1 complete, waiting for the owner's review.
- **2026-10-23** — Owner reviewed Adults L1 live: motion not premium enough, player looked pushed up and cut. Fixes: v2
  of `slides/lessons/a01.tsx` (documentary lower-thirds, volumetric light and dust, film grain and leaks, perspective
  depth, kinetic type, fewer sounds); every Adults panel and still now sits in one frame below the lesson badge
  (picturebook and portrait compositions framed for `version: 'adults'`); shorter chapter names. Owner also asked for
  samples in the student/parent portal until launch: `SAMPLES` in `catalog.ts` (opening of Lesson 1 for Kids, Teens,
  Adults, drafts included) shown to every account on My curriculum.
- **2026-10-23** — Owner approved the Adults L1 v2 storyline. Page text rewritten in the new order (26 pages, spark =
  the stranger, zad = the questions → reveal → map → knowing vs seeing → Hanzalah → At-Takathur → what the course is
  for, athar = four cases + review, ahd); teacher notes reordered and rewritten to match; five scenes removed (mirror,
  bedside, street, sunset 15:99, narrator chain), the arches scene became the four-part course build; Adults sample
  now 8 pages (ends on "So who is he?").
- **2026-10-23** — Owner: lines paraphrased each ayah/hadith before showing it, and the motion still looked cheap. Adults
  now show the text first, then a line that adds something new (RULES §5, test); the text steps back to a compact form
  when the comment arrives. Owner chose "cinematic documentary": code-drawn diagrams removed for the `Reel` (stills
  with a guided camera, lower-thirds, title-card fallback); 16 new still prompts in the brief; each case got its own
  still slot.
- **2026-10-24** — Owner: the framed window is too small for motion graphics; sent three motion-design references.
  Adults pages now play full-screen as "cinema" scenes (`slides/cinema/`): the still fills the canvas and moves in
  depth (depth maps for every L1 still), a kinetic title that steps back to the corner, the ayah/hadith as a hero card
  that docks when the comment arrives, one subtitle at a time, gold light paths and nodes for steps and pillars, count
  ups, huge Arabic on the wow page, the khatam star as the recurring hero object. The review game keeps the arch layout.
  Not yet checked on a real phone or for real-time frame rate.
