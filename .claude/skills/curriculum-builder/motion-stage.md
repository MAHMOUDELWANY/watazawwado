# The motion stage (the owner's approved standard, 2026-10-24)

Reference result: Zad Essentials · Adults, Lesson 1 (`content/zad-adults/l01-the-man-no-one-knew.ts`). The owner looked at
the live lesson and said: "عجبني الاستايل ده". Every new or improved lesson aims at this.

## The idea
A page is a full 1600 × 900 designed stage, not a window with a picture. One graphic per page tells the page's idea
step by step, in sync with the build steps: a hero object travels and becomes the diagram; lines draw; blocks rise;
cards collide; numbers count; people move to show attention, distraction, stillness. The camera moves only to reach
something (into Madinah, down under the building of Islam), never to drift.

## Layout (canvas coordinates)
| Area | Where | What |
|---|---|---|
| Header + lesson badge | top, badge at x 1374–1510, y 0–180 | from `Slide.tsx`; keep graphics clear of the badge |
| Title | left 110, top 96; huge on the opening beat, then scale 0.46 | `KineticTitle`, last word in the ribbon gradient |
| Text (ayah/hadith) | hero: left 200, top 250, w 1200; docked: left 110, top 236, w 540 | English meaning first (serif), Arabic beneath, reference; `marks` underline the words the graphic is about |
| Left column | left 110, bottom 120, w 560 | explanation lines (newest 30 px, older 20 px, dimmed), then the question under them |
| Graphic | x 760–1520, y 150–800 | the page's motion graphic |
| Chapter bar | y ≈ 830–870 | nothing may sit on it |
| Big answer cards (clues, choose) | right 110, bottom 104, w 760 | the graphic steps back (scale 0.62, dim) |

## Code map (`src/curriculum/slides/motion/`)
- `Stage.tsx`: `StagePage` (layout, hero/docked text, lines, question placement), `Backdrop` (light paper with the
  khatam lattice; dark = crimson-to-teal night with the lattice and brand lights, never flat black), `Orb`, `FactCard`,
  `bezier`, tokens (`PAPER`, `ink`, `soft`).
- `kit.tsx`: `Figure` (articulated profile person: pose kneel/stand/chair, arms thigh/phone/side/open, `look` turns the
  head about the neck), `Person` (front-facing, `hijab`, `sitting`), `Bubble`, `Chip`, `Big`, `Ar`, `Svg`, `Draw`,
  `Meter`, `Icon`/`Badge` (book, scroll, sun, pen, light, chain, heart, head, mail, bell, chat, clock, coin, bowl, shirt,
  car, phone, house, gift, check, door, globe).
- One graphic per page in `graphics.tsx`, `g-story.tsx`, `g-levels.tsx`, `g-life.tsx`, `g-people.tsx`; signature
  `({ lines, items, interaction, labels, tone }: GraphicProps)`: render by build step (`lines >= n`, `items >= n`).
- `Questions.tsx`: `AdultAsk` (think-first strip in the left column), `LevelsReview` (the review as a case file on
  rings, `why` per card, result per level → teacher report), `ReviewIntro`.
- `LessonEnd.tsx`: end-of-lesson screen for every series.
- Wire a page: `slides/cinema/scenes.tsx` → `stage: { tone: 'light' | 'dark', Graphic, marks?, keepOnAsk? }`
  (`keepOnAsk` when the graphic draws its own answer to the question).
- Brand: `CRIMSON #C51F24`, `GOLD #E5A93C`, `TEAL #0FA3B8`, deep red `#8B1A1E` for Arabic, paper `#F6F1E8`; Thmanyah
  (`--font-display-ar`, `--font-serif`); the khatam star; the ribbon gradient crimson → gold → teal.

## Designing a page's graphic (do this on paper first)
1. Read the page's lines and items. For each build step write: **step → what moves → what it means**.
   - "Islam is the outward building" → an orb lands on an empty plot → the foundation (the two testimonies) rises.
   - "And still, not one of them knew his face" → his lines to the town's people draw, then fail → he is not from here.
   - "On the days you cannot reach that, you are still watched" → a person head-down at a desk stays inside a circle
     of light, then looks up and puts the phone down → the floor you never fall below.
2. Pick a metaphor the learner already understands (a building, a road, rings, a clock, bins, a stair, a notebook, a
   social post, a lunch table). Modern scenes use people; unseen things use light, words, stars.
3. Each step adds one change; previous steps stay (or step back) so the picture accumulates.
4. Light vs dark: paper for most pages; dark for the unseen, the hereafter, night, endings.
5. Labels are short and on the graphic (English, with the Arabic term when it is the key word).

## Motion craft
- motion/react; ease `[0.22, 1, 0.36, 1]`; springs with little bounce; entrances from a blur; draw lines with
  `pathLength`. Durations 0.5–1.4 s; stagger 0.1–0.3 s.
- Never animate SVG geometry attributes (`x1`, `cx`, `d` on lines/circles without `initial={false}`): an SVG attribute
  error stops every animation on the page. Move with transforms or remount with a `key`.
- Rotate SVG groups with an SVG `transform` attribute about an explicit point (see `Head` in `kit.tsx`), not CSS
  transform-origin, or parts drift apart.
- Avoid `AnimatePresence mode="wait"` for content that must swap reliably; key the element and give it an entrance.
- Respect reduced motion (`useReduce()`): skip loops and long travels.
- Sound effects only on key moments (`slides/sfx.ts`); never music.
- The player replays a slide when it comes into view or goes full screen (`LessonPlayer.tsx`), so first pages animate.

## Versions
- Adults: the reference above.
- Kids and Teens: same system and the same rules for text and meaning; their own tone (Kids brighter, playful,
  characters from the library; Teens bolder, faster). Prototype 2–3 pages in the version's tone, send a video, get the
  owner's yes before rolling the lesson out.
