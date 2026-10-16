# Watazawwado Curriculum — Plan, Rules & Progress

> **Read first.** Any model or developer working on the curriculum (المنهج) must read this file and `RULES.md` before
> proposing or building anything. Status legend as in RULES.md: **[Decided]** = in force, **[Proposed]** = idea from
> discussion awaiting the owner, **[Open]** = question for the owner — never invent an answer. Record every owner
> decision here with its date, and add a line to the Progress log at the end of each session.
> The discussion with the owner happens in chat, in Arabic. Brainstorm reports are not saved as files; only decisions,
> rules, proposals, the source registry and progress live in `docs/curriculum/`.

## 0. Where we are (update every session)

- **Done:** scope, mission, age bands, rules (§3, §3a), source registry (`sources.md`), working plan (§7), subject
  name (§1a), fiqh school, Quran/hadith/translation method (§5).
- **Done (A1):** unit map of Zad Essentials · Kids approved → `zad-essentials-kids/MAP.md` (37 lessons, game
  checkpoint every lesson, story world proposed).
- **Done (A2–A3, B1–B2):** Lesson 1 written (`src/curriculum/content/zad-kids/`), lesson player + scenes + game
  (`src/curriculum/`), teacher page at **/dashboard/curriculum** (draft badge while `reviewed: false`).
- **Done (B3–B5):** teacher report after class (pages, evaluation per outcome, note, game result) in the lesson page;
  student map + puzzle at **/student/curriculum** (per learner, parents see each child); locked until the family has a
  confirmed/rescheduled/completed booking; covered pages of **reviewed** lessons open for review. Table
  `curriculum_lesson_reports` (server-only) applied to production 2026-10-16.
- **Now:** owner reviews Lesson 1 and marks it reviewed (then students can open it).
- **Next:** Lesson 2 (Who Made It All?).
- **Not started:** Lessons 2–37, sound effects, the teacher pen/drawing tool.
- **Known limit:** lesson text ships in the site bundle, so the lock is a UI lock (content is not secret). Upgrade to
  server-served lessons if content must be protected.

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
- **[Decided 2026-10-16] Two versions:** **Zad Essentials · Kids** (6–11) and **Zad Essentials · Teens & Adults** (12+).
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
