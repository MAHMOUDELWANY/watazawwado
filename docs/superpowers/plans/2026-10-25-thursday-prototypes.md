# Thursday Prototypes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Every content task also runs the `curriculum-builder` skill (its §0 read-first list and §4 verify steps).

**Goal:** By Thursday 2026-10-29, one approved-quality prototype lesson each for Literacy B (Kids), Literacy A (Kids), Fusha Level 1 (Kids) and, if time holds, Seerah Episode 1 (Teens + Adults), playable in the existing lesson player with replayable voice clips.

**Architecture:** Every new subject reuses the Zad lesson model (`src/curriculum/types.ts` `Lesson` with the four stations) and the motion-stage player (`StageDef` in `slides/cinema/scenes.tsx`). Two small additions carry the new subjects: voice clips on a page (`say`), and a letter-writing kit for literacy. New curricula are new `GROUPS` and `SUBJECTS` entries in `src/curriculum/catalog.ts`.

**Tech Stack:** React 19, Motion, SVG, TypeScript, node:test via tsx, Vite. Audio: mp3 files under `public/curriculum/<subject>/audio/`, generated with the owner's ElevenLabs clones.

**Spec:** `docs/superpowers/specs/2026-10-25-subjects-curricula-design.md` (approved 2026-10-25).

## Global Constraints

- Books set scope, never wording: no sentence, dialogue, exercise or illustration copied from any book in `C:\Users\ahmed\Documents\watazawwado-sources\` (curriculum RULES §1.4).
- Literacy A has **no religious content**; it uses new neutral characters. Literacy B uses the Zad Kids look and cast.
- Voices: `mahmoud` (English, id `jSOs0gJh7GzUGtEgxVhs`), `Mahmoud Egyptian`, `Mahmoud Fusha`. **The Quran is never voiced by a clone.**
- Every lesson `reviewed: false`. Every page has English `explain` and an Arabic `teacherAr` entry.
- One motion graphic per page that explains by moving (`.claude/skills/curriculum-builder/motion-stage.md`, `owner-feedback.md`). The Prophet ﷺ, companions and angels are never drawn.
- `humanizer` on all English copy. The academy speaks as "we".
- Seerah: facts from *The Sealed Nectar*; weak reports graded on Dorar and marked or dropped; told as a series, never a sermon.
- Verify per lesson: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`, `npx tsx --test test/curriculum-*.test.ts`, `npx vite build`, screenshots of every build step (`scripts/curriculum/README.md`).
- Owner's standing approval (RULES §7): commit and push to `main` after tsc + tests + build pass.

## Review Focus

1. A clip whose mp3 is not there yet (owner has not recorded / clone not made): the page must stay silent with a small "recording coming" mark, never throw or block the build step. → Task 2 test `missing clip file does not throw`.
2. Reduced motion: a letter must still appear complete (no stroke animation) so the lesson remains usable. → Task 5 test `reduced motion renders all strokes at once`.
3. A clip marked as Quran with a clone voice slips in. → Task 2 rules test `Quran clips are never a clone voice`.
4. Arabic glyphs on the stage on a phone: the letter graphics must be SVG paths, not font text, so they render without the font loaded. → Task 5 test `every letter used by literacy lessons has stroke paths`.
5. A new group with no built lesson must not appear as an empty door. → Task 1 test `every group shows at least one track or planned version`.

---

### Task 1: Catalog: the new curricula

**Files:**
- Modify: `src/curriculum/catalog.ts` (GROUPS, SUBJECTS)
- Create: `test/curriculum-catalog.test.ts`

**Interfaces:**
- Produces: group ids `literacy`, `quran`, `fusha`, `seerah` (exists); track ids `literacy-a-kids`, `literacy-b-kids`, `fusha-kids`, `seerah-teens` (Seerah Teens + Adults; `audience: '12+'`). Tracks are added to `SUBJECTS` by the task that builds their first lesson; this task adds the groups with `planned` versions only.

- [ ] **Step 1: Write the failing test** in `test/curriculum-catalog.test.ts`:
  - `new groups exist`: `['literacy','quran','fusha','seerah']` are all in `GROUPS.map(g => g.id)`.
  - `every track belongs to a group`: every `SUBJECTS[i].group` is a `GROUPS` id.
  - `every group shows at least one track or planned version`: `tracksOf(g.id).length + g.planned.length > 0` for every group.
  - `Seerah plans two versions`: seerah `planned` versions are exactly `Kids` and `Teens & Adults` (`audience` `6–11`, `12+`).
- [ ] **Step 2:** Run `npx tsx --test test/curriculum-catalog.test.ts`. Expected: FAIL (`literacy` missing).
- [ ] **Step 3:** Add the groups to `GROUPS` with English/Arabic title and tagline in the academy voice (`humanizer`), `planned` per spec §2: literacy (Kids, Teens, Adults, Franco), quran (Quranic reading rules, Quran reading, Tajweed L1–L3), fusha (Kids, 12+); change seerah `planned` to Kids + Teens & Adults.
- [ ] **Step 4:** Run the test. Expected: PASS. Then `tsc` clean.
- [ ] **Step 5:** Commit `feat(curriculum): groups for literacy, quran and fusha; seerah in two versions`.

### Task 2: Voice clips on a page

**Files:**
- Modify: `src/curriculum/types.ts` (add `Voice`, `Clip`, `LessonPage.say`)
- Create: `src/curriculum/slides/Say.tsx`
- Create: `scripts/curriculum/clips.ts`
- Modify: `test/curriculum-rules.test.ts` (clip rules)
- Create: `test/curriculum-say.test.ts`

**Interfaces:**
- Produces:
  - `type Voice = 'en' | 'eg' | 'fusha' | 'owner'` (`owner` = the owner records it himself).
  - `interface Clip { id: string; text: string; voice: Voice; emotion?: string; quran?: boolean }`
  - `LessonPage.say?: Clip[]`
  - `clipUrl(subject: string, lessonNo: number, id: string): string` → `/curriculum/<subject>/audio/l<NN>-<id>.mp3`
  - `<Say subject lesson clip children? />`: wraps any element; click plays the clip (one `HTMLAudioElement` at a time); if the file fails to load it shows a small "recording coming" mark and does nothing else.
  - `npx tsx scripts/curriculum/clips.ts <subjectId> <lessonNo>` prints a markdown list grouped by voice: file name, text, emotion as an ElevenLabs tag (`[warm]`, `[curious]`), ready to paste.

- [ ] **Step 1: Failing tests.** `test/curriculum-say.test.ts`: `clipUrl('literacy-a-kids', 1, 'ba') === '/curriculum/literacy-a-kids/audio/l01-ba.mp3'`; `missing clip file does not throw` (call the play helper with an audio stub whose `play()` rejects; assert it resolves to `'missing'`). In `curriculum-rules.test.ts` add, per lesson: `clip ids are unique and kebab-case` (`/^[a-z0-9-]+$/`), and `Quran clips are never a clone voice` (`quran: true` ⇒ `voice === 'owner'`).
- [ ] **Step 2:** Run both test files. Expected: FAIL (`clipUrl` not defined).
- [ ] **Step 3:** Implement the types, `clipUrl` and `playClip(audio): Promise<'played' | 'missing'>` in `Say.tsx`, the `Say` component, and the script.
- [ ] **Step 4:** Run tests, `tsc`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(curriculum): replayable voice clips on lesson pages`.

### Task 3: Look options for the literacy cast (gate)

**Files:**
- Create: `src/curriculum/slides/motion/g-literacy-looks.tsx` (three options, two pages each: a letter page and a story page)
- Create: `docs/curriculum/style/literacy.md` (written after the owner picks)

**Interfaces:**
- Produces (after the pick): `LiteracyCast` figures in `kit.tsx` style (`Figure`-based, modern, neutral dress, no religious marks), the accent colour token, used by Tasks 6 and 7.

- [ ] **Step 1:** Run `brainstorming`-style thinking privately, then draw three distinct directions inside the academy identity (site type, frame, khatam): e.g. paper-cut letters world, a chalk-and-crayon classroom, a bright toy-block town. Each with a small cast of two kids and an adult.
- [ ] **Step 2:** Preview with `curriculum-preview`, screenshot every step, record a short video (`scripts/curriculum/cast.mjs`), send with `SendUserFile` and ask the owner to pick.
- [ ] **Step 3:** After the pick: keep the chosen option as the cast kit, delete the others, write `style/literacy.md` (palette, cast, motifs, what never appears). Commit `feat(curriculum): literacy look and cast (owner's pick)`.

Tasks 4 and 8 (prompts) run while the owner decides.

### Task 4: Literacy B · Kids, Lesson 1 (Zad Kids look)

**Files:**
- Create: `docs/curriculum/literacy-quranic/MAP.md`, `docs/curriculum/literacy-quranic/L01-<slug>.md` (brief)
- Create: `src/curriculum/content/literacy-b/l01-<slug>.ts`, `l01-teacher-ar.ts`
- Create: `src/curriculum/slides/motion/g-lb1.tsx`
- Modify: `src/curriculum/types.ts` (new `SceneId`s), `src/curriculum/slides/cinema/scenes.tsx`, `src/curriculum/catalog.ts` (track `literacy-b-kids`)

**Interfaces:**
- Consumes: `Clip`, `Say` (Task 2); Zad Kids cast and backdrop (`look: 'kids'`).
- Produces: track `literacy-b-kids` with lesson 1.

- [ ] **Step 1:** MAP: the full list of Literacy B lessons from the scope in spec §4.2 (Uthmani spelling, waqf signs, mushaf symbols, letters written but not read), ordered, 8–14 lessons. Sources: `tajweed\book 1 jannat al quran tajweed.pdf` (later sections), `literacy\نور البيان`, `literacy\فتح الرحمن`; read the relevant pages as images.
- [ ] **Step 2:** Brief for Lesson 1 (curriculum-builder §1): one driving question, stations, the wow, the game, Ahd, cliffhanger.
- [ ] **Step 3:** Page text + Arabic teacher notes; every Quranic word from Tanzil; ayah clips `voice: 'owner', quran: true`; other clips `voice: 'en'`.
- [ ] **Step 4:** Motion graphics, one per page, wired with `onStage({...})` in `scenes.tsx`; add the track to `SUBJECTS`.
- [ ] **Step 5:** Verify (Global Constraints) and fix until clean; generate the clip list into `docs/curriculum/literacy-quranic/L01-clips.md`.
- [ ] **Step 6:** Commit and push `feat(curriculum): Literacy B Kids Lesson 1 (draft)`; log in `docs/curriculum/PLAN.md` §8.

### Task 5: Letter-writing kit

**Files:**
- Create: `src/curriculum/slides/motion/letters.tsx`
- Create: `test/curriculum-letters.test.ts`

**Interfaces:**
- Produces:
  - `LETTERS: Record<string, { strokes: string[]; dots: { x: number; y: number }[] }>`: hand-drawn centreline SVG paths in a 200×200 box, strokes in writing order (right to left), dots last. Isolated forms of the letters Lessons A1 and Fusha 1 need first; extended per lesson.
  - `<WriteLetter ch x y size? delay? speed? />`: draws strokes in order with `Draw`, dots pop in after; with reduced motion (`useReduce()`) renders all strokes at once.
  - `lettersIn(text: string): string[]`: the distinct Arabic letters in a string (diacritics stripped).

- [ ] **Step 1: Failing tests:** `lettersIn('بَيْتٌ')` deep-equals `['ب','ي','ت']`; `every letter used by literacy lessons has stroke paths` (for every `literacy-a-*` and `fusha-*` lesson, every letter in its pages' `vocab[].arabic` is a key of `LETTERS`); `reduced motion renders all strokes at once` (render to static markup with reduced motion on; count `<path` equals strokes + dots).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement; draw paths by eye against `literacy\خطوات كتابة الحروف .pdf` for stroke order only (shapes are ours).
- [ ] **Step 4:** Run tests, `tsc`. Expected: PASS. Screenshot each letter once.
- [ ] **Step 5:** Commit `feat(curriculum): letter-writing kit for literacy`.

### Task 6: Literacy A · Kids, Lesson 1

**Files:**
- Create: `docs/curriculum/literacy/MAP.md` (Kids), `docs/curriculum/literacy/L01-<slug>.md`
- Create: `src/curriculum/content/literacy-a-kids/l01-<slug>.ts`, `l01-teacher-ar.ts`
- Create: `src/curriculum/slides/motion/g-la1.tsx`
- Modify: `types.ts` (SceneIds), `scenes.tsx`, `catalog.ts` (track `literacy-a-kids`)

**Interfaces:**
- Consumes: Task 2 (`Say`), Task 3 (cast, style), Task 5 (`WriteLetter`, `LETTERS`).

- [ ] **Step 1:** MAP: the order alphabet → positions → connecting → harakat → sukoon → shadda → tanween → madd (spec §4.1), built from the four literacy sources; neutral words only.
- [ ] **Step 2:** Brief, then page text with `vocab` for every new letter and word; letter-sound clips `voice: 'owner'` (the owner records single sounds), words and lines `voice: 'en'` for English, Arabic words `voice: 'fusha'`.
- [ ] **Step 3:** Motion graphics: each new letter written on the stage, tap any letter or word to hear it (`Say`), blending as letters sliding together, a read-aloud page the teacher marks, the game in Athar.
- [ ] **Step 4:** Verify, clip list to `docs/curriculum/literacy/L01-clips.md`, commit and push `feat(curriculum): Literacy A Kids Lesson 1 (draft)`, log.

### Task 7: Fusha Level 1 · Kids, Lesson 1

**Files:**
- Create: `docs/curriculum/fusha/RULES.md` (spec §5 method, scope rule, voice rule), `docs/curriculum/fusha/MAP.md` (Level 1), `docs/curriculum/fusha/L01-<slug>.md`
- Create: `src/curriculum/content/fusha-kids/l01-<slug>.ts`, `l01-teacher-ar.ts`
- Create: `src/curriculum/slides/motion/g-fk1.tsx`
- Modify: `types.ts`, `scenes.tsx`, `catalog.ts` (track `fusha-kids`)

**Interfaces:**
- Consumes: Tasks 2, 3, 5. The `vocab` field of every page is the future spaced-repetition deck (spec §5.2); fill it for every new word.

- [ ] **Step 1:** Level 1 map from Madinah Reader 1–2 grammar spine and Lughatuna themes (spec §4.5), not bound to either; read the relevant pages as images.
- [ ] **Step 2:** Brief: input first (an Arabic story or scene the child follows from pictures and motion), then the structure, then practice and a short conversation; English notes around the Arabic.
- [ ] **Step 3:** Page text, Arabic teacher notes, clips (`voice: 'fusha'` for Arabic, `'en'` for English notes).
- [ ] **Step 4:** Motion graphics, verify, clip list, commit and push `feat(curriculum): Fusha Kids Lesson 1 (draft)`, log.

### Task 8: Seerah Episode 1 · Teens & Adults (if time holds)

**Files:**
- Create: `docs/curriculum/seerah/RULES.md` (spec §4.9 template and story craft), `docs/curriculum/seerah/MAP.md` (episode list from *The Sealed Nectar*), `docs/curriculum/seerah/EP01-image-prompts.md`, `docs/curriculum/seerah/EP01-<slug>.md`
- Create: `src/curriculum/content/seerah-teens/l01-<slug>.ts`, `l01-teacher-ar.ts`, `src/curriculum/slides/motion/g-se1.tsx`
- Modify: `types.ts`, `scenes.tsx`, `catalog.ts` (track `seerah-teens`, audience `12+`)

**Interfaces:**
- Consumes: Task 2. Produces the Seerah look (dark, gold, serif) as a `StageDef` tone and backdrop variant reused by later episodes.

- [ ] **Step 1 (day one):** Image prompts, one per slide, cinematic, matching what the slide says, never depicting the Prophet ﷺ or companions; send the file to the owner with `SendUserFile`.
- [ ] **Step 2:** RULES and MAP; Episode 1 text following the deck's grammar, every fact checked against `seerah\English_ArRaheeq_AlMakhtum_THE_SEALED_NECTAR.pdf` (extract with `pdftotext`), weak reports graded on Dorar.
- [ ] **Step 3:** Build when the images arrive (place in `public/curriculum/seerah-teens/ep01/`), verify, commit and push `feat(curriculum): Seerah Episode 1 Teens & Adults (draft)`, log.

### Task 9: Hand-off to the owner

- [ ] **Step 1:** `graphify update .`; restore `.claude/launch.json`; delete scratch preview files.
- [ ] **Step 2:** Record one short video per prototype; send them and every clip list with `SendUserFile`; report in Arabic: what each lesson shows page by page, what needs his voice, what could not be verified (phone, real-time smoothness).
- [ ] **Step 3:** Update `docs/curriculum/PLAN.md` §0 "Where we are" with the new subjects' status.
