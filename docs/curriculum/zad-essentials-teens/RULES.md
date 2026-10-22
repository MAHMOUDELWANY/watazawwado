# Zad Essentials · Teens (12–17): binding rules

Owner decisions for the Teens version, collected in one place (2026-10-22). They sit on top of the general rules in
`../RULES.md` (which win where the two disagree) and `../../../RULES.md` (platform). The story, the 40 lessons and the
challenge games are in `MAP.md`; how every image looks is in `../style/teens.md`. Procedure: the `curriculum-builder`
skill.

## 1. Why this version exists
Most Muslim teens in the West don't know the basics of their deen, and many were pushed into worship without being told
what it is or why. This version roots them in the essentials (ما لا يسع المسلم جهله) **by conviction and knowledge, in
a teen's own style** (owner, 2026-10-21).

## 2. Tone (owner, 2026-10-21)
- **No direct preaching and no heavy fear.** Jannah and the Fire are named honestly, never used as a threat.
- **Story and real-life situations**, concrete and believable. The teen learns without noticing and enjoys it.
- **Burning curiosity:** the learner talks, asks and argues back. Every Spark ends with "What would *you* say?" before
  anything is explained.
- **"Why" before "what":** situation → reasoning → evidence → ruling. The ruling is said clearly, once the wisdom is seen.
- **No word against parents.** The lesson gives the understanding that was missing; it never says "your parents got it
  wrong". The teacher can pass a note to the family in the report.
- Plain modern English, short sentences. `humanizer` on every line.
- **The academy speaks, not one person** (project rule): no lesson centres a named teacher.

## 3. Story world (one connected story, like Kids)
- **Zayn (15)** and **Noor (13)**, brother and sister, at a secondary school in a Western city. Arc: from *because Mum
  said so* to *because I know and I'm convinced*.
- **Ethan** (Zayn's non-Muslim friend, curious and fair, never a villain), **Amira** (Noor's friend, made to pray with no
  explanation; prays by choice by the end, handled gently), **Hamza** (cousin, 22, answers with questions), **Aunt Salma**
  (Noor's go-to for the girls' lessons).
- **The Why List:** the siblings' shared note of questions nobody answered. Each lesson crosses one off and ends with a
  new one (the cliffhanger). A question answered in a later lesson shows a chip with that lesson ("Lesson 11"), so it
  never looks unfinished. Lesson 40 shows the whole list crossed off.
- **Look: anime** (owner, 2026-10-21). Character sheet and base prompt in `../style/teens.md`. Fixed outfits, modest
  dress, no logos or readable text in images.

## 4. Content rules
- **Fiqh:** Shafi'i only, no differences shown.
- **Doubts:** the common online ones (science vs God, evil and suffering, "all religions are the same", "why me Muslim",
  identity, hijab), each answered **inside its related lesson**: reasoning first, then the text; never plant a doubt the
  learner didn't have.
- **Puberty:** one shared lesson (bulugh, ghusl) plus one lesson for young men and one for young women; the teacher picks
  by learner (MAP lessons 16, 17, 18a, 18b).
- **Tadabbur:** on every ayah, the key word's **root and how it shapes the meaning**.
- **Check (Athar):** a challenge game, 3–5 minutes (reply in 30 seconds, spot the flaw, myth or fact, build the argument,
  case file…). No points for worship, no streaks, no leaderboards.
- **Ahd:** a personal challenge the learner picks from two or three options, never an order.
- **Analogies** must hold up to a sharp teen: the owner replaced "the North Pole" with a train with no engine (L2).
  Six-pointed star patterns and minarets in images are fine (owner, 2026-10-21).
- **Evidence:** Quran text from the quran.com connector; hadith grading on Dorar; anything unchecked is "to verify" and
  never shown. No hadith Arabic on a slide until it is verified.

## 5. Slides and motion (owner, 2026-10-22)
- **Premium, out-of-the-box level:** motion as rich as the Kids lessons; a scene build on every idea page; one wow motion
  scene per lesson; colour and life, never a still picture with labels.
- **No thin slides:** no page with only one or two thin sentences. Evidence pages keep the page's key line as a lead-in
  above the ayah or hadith.
- **Text never spills:** every text column auto-fits its box; no text over a painting; scene panels sit below the lesson
  ribbon; images framed so no character is cut in half (`SCENE_FOCUS`).
- **Covers** show the series and version ("Zad Essentials · Teens"), never "45 minutes".
- **Every lesson ends** on the Finish card (leaves full screen, start again or close).
- **Series opening** before Lesson 1: the anime "meet the cast" (`src/curriculum/slides/Opening.tsx`, data in
  `src/curriculum/content/zad-teens/opening.ts`). Cards stay long enough to read (7 s), with Back, Next, Pause and
  clickable progress. A character who joins later gets a card.
- **Before review:** every page is audited headless at its final step (text fit, overlap, motion), plus `tsc`,
  `npm test` and the build.

## 6. Images workflow
- The owner generates images in ChatGPT from the prompts in `../style/teens.md` (steps 1–5): send the setup note first,
  then one prompt per image. Scenes are 4:3; characters and props are transparent (`public/curriculum/zad-teens/`).
- Claude removes stray logos or bodies the owner flags (e.g. the gaming TV in L2 was softened) and records every image in
  `../sources.md`.

## 7. Where things are
| What | Where |
|---|---|
| Lesson map (40 lessons, 5 parts) | `MAP.md` |
| Lesson briefs | `L01-…md`, `L02-…md`, `L03-…md` |
| Page text + Arabic teacher notes | `src/curriculum/content/zad-teens/` |
| Scenes per lesson | `src/curriculum/slides/lessons/t01.tsx`, `t02.tsx`, `t03.tsx` |
| Images | `public/curriculum/zad-teens/` |
| Style guide and image prompts | `../style/teens.md` |
| Status and next step | `../PLAN.md` §0 |
