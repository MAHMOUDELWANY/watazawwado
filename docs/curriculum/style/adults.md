# Style guide: Zad Path · Adults (18+)

Binding for every image and slide look in an Adults lesson (`docs/curriculum/RULES.md` §1.10, §3 "Look: calm, cinematic,
editorial"; `zad-essentials-adults/RULES.md` §5). Draft by Claude, **approved by the owner 2026-10-23**. When
the owner approves it, the first Lesson 1 image becomes the reference image (`public/curriculum/zad-adults/reference.webp`):
when a later image disagrees with it, the reference wins.

## The idea in one line
A quiet documentary film about certainty: real places, real light, real hands and objects, nothing loud. The slide feels
like a well-designed long-form article or a film title sequence, not a children's book and not a social-media post.

## Look
- **Cinematic photographic realism**: a still from a calm documentary or drama, shot on 35mm film. Soft natural light,
  shallow depth of field, gentle film grain, muted colour with one warm accent. Never glossy, never "stock photo",
  never HDR.
- **Two light worlds, used for Then and Now** (MAP.md, "The thread"):
  - **Then** (the Companions, history): warm desert gold and copper, dawn or late-afternoon sun, sand, palm, mud brick,
    lamp and fire light. Places, objects and light only.
  - **Now** (the learner's world): cool teal and blue-hour city light, office glass, a phone screen at night, a kitchen
    at fajr, a train window. The warm accent (a lamp, a prayer mat, sunrise) marks where the deen enters the scene.
  - A Then and Now page sets the two side by side or wipes one into the other; their compositions should rhyme (same
    framing, same direction of light) so the cut feels intended.
- **Brand palette as accents**, never as flat fills in the image: crimson `#C51F24`, teal `#087D91`, copper `#8B4935`,
  gold `#E5A93C`. Base tones: deep ink `#0E1A22` and bone `#EFE8DC`.
- **Islamic details only where they belong**: a mihrab, a worn mushaf on a stand, a prayer mat by a window, geometric
  shadow from a mashrabiya. Never pasted on as decoration.
- **Every image teaches**: one clear subject, a calm area kept free for the slide's text and scene build (say where in
  each prompt: "keep the right third calm and dark").

## People
- **No recurring characters** (Adults RULES §5), so no character sheet, no character library and no series opening.
- People of today appear **anonymous**: seen from behind, in silhouette, hands only, or out of focus. No posed smiling
  faces looking at the camera. This keeps the calm editorial feel and avoids faces that look generated.
- **Never** the face or likeness of a real person, living or dead. A public figure's quote is shown as a typeset quote
  card built in code (name, role, source, year), never with a generated portrait. Recently deceased role models (owner
  approves each one) are shown the same way, or through a place or object tied to their life.
- Modest dress for anyone shown; women's hair and neck covered when they are Muslim women in the scene.

## Never
- No faces or bodies of prophets, Sahaba or Jibril. Historic scenes show the place, the light and objects (a sword laid
  down, dates in a palm, footprints in sand); a person only as a small figure seen from behind at a distance.
- No text, letters, numbers or logos inside generated images; screens show only soft glowing shapes. The slide adds all
  text.
- No real brands, no recognisable real buildings of companies, no mockery of anyone, nothing that promotes the haram.
- No music; sound effects only, few and fitting the scene (RULES §1.10).

## The slide around the image (code, not ChatGPT)
- **The light manuscript (owner's choice, 2026-10-23, binding).** The owner rejected the dark documentary panels: "no
  fonts, no typography, no colours, no site identity". Adults slides use the site's own identity: bone paper with the
  khatam field and two brand lights, every picture inside the homepage's mihrab arch with the teal-gold-copper ring
  (`slides/Arch.tsx`), the last word of each title in the ribbon gradient (crimson → gold → teal), ayat and hadith in deep
  red Thmanyah Display, a gradient rule under the title, labels as light chips. Built in `AdultsLayout` (Slide.tsx).
  The depth camera and rack focus stay, inside the arch. Never go back to dark panels or a generic look.
- **v3 (owner, 2026-10-23): cinematic documentary.** Code-drawn diagrams (columns, steps, rings, arches, gauges) read as
  cheap and are not used. Every idea page has a real still; the camera travels across it to the detail each line names,
  then drifts; one lower-third at a time; until a still arrives, a title card with the Arabic word in light. Drawn-in-code
  stays only for what a photo cannot do (the mist of the wow scene, the notebook's pen line, particles and light).
- **Depth (2026-10-23):** every Adults still comes with a depth map (ChatGPT: "a grayscale depth map of the same image,
  near = white, far = black", saved as `<name>-depth`). `DepthStill` moves the camera in real depth: parallax, dolly,
  rack focus to the subject of each line, distance haze, rays from the light in the photo.
- **v2 (owner, 2026-10-23):** labels are documentary lower-thirds (dark glass, a gold rule, the words sliding out),
  never paper tags; light is volumetric (beams with drifting dust); film grain and a slow light leak on every still;
  depth by perspective and parallax; Arabic sharpens out of a blur. Stills and panels sit in one frame below the lesson
  badge. Sounds: only on the few moments that change the meaning (the reveal, the wow, the notebook).
- **Editorial layout**: large calm serif-style headings in the player's existing fonts (no new font without recording
  its licence in `sources.md`), generous margins, one idea per page, thin rules and small caps for labels.
- **Quote cards**: the quote, then the person's name, role and source (interview, podcast, book, post, year), typed in
  line by line. Every quote recorded in `sources.md` first.
- **Zad al-Yaqeen** (the notebook): drawn in code as a dark leather-bound notebook with bone-coloured pages; the line
  "I am now certain that…" is written in with a pen-line animation on the Ahd page and read back on the next Spark. It is
  a series device, so it may appear in every lesson.
- **Code-drawn elements** wherever they help: sand particles, light rays, a slow push-in (Ken Burns) on a painting,
  parallax depth, a lens on a detail, a timeline that draws itself, pen lines. Primitives: `src/curriculum/slides/Motion.tsx`.
- **Motion feel**: slow and confident (ease-out, longer durations than Kids and Teens), no bounce, no confetti. The wow
  scene of each lesson is the one place to go big.
- Light and dark mode both work: images are designed dark-leaning, so in light mode they sit in a bone frame.

## Base prompt (prefix every Adults scene prompt with this)
> Cinematic photographic still from a calm documentary film, shot on 35mm film, soft natural light, shallow depth of
> field, gentle film grain, muted colours with one warm accent of gold or copper, deep teal shadows, quiet and
> thoughtful mood, 4:3 landscape, no text, no letters, no logos, no faces looking at the camera.

Then add the scene, its light world ("Then: warm desert dawn" or "Now: cool blue-hour city"), what must be visible for
the scene build, and where the calm area for text must be. Save as WebP in `public/curriculum/zad-adults/lNN/` and record
it in `docs/curriculum/sources.md`.

## Kinds of images (RULES.md §1.10)

| Kind | What | Background | Folder | Reuse |
|---|---|---|---|---|
| Scene | A 4:3 still of a place or moment | Full | `lNN/` | One page per lesson only |
| Prop | One object that must move on its own (a key, a sword, a coin, an hourglass) | **Transparent PNG** | `lNN/` | The lesson that needs it |

**Prop prompt (prefix):**
> Same photographic style as the reference image. A single [object], centred, soft studio light from the upper left, a
> gentle shadow under it, **transparent background (PNG)**, nothing else in the image, no text.

If ChatGPT returns a background anyway, ask for "plain pure white background"; Claude removes it with ffmpeg.

## The note to send ChatGPT once, before the first image

> We are making images for an adult Islamic course. Style for every image from now on: cinematic photographic still from
> a calm documentary film, 35mm, soft natural light, film grain, muted colours. Never show the face or body of any
> prophet, any companion of the Prophet, or the angel Jibril: for those, show only the place, the light and objects, or
> at most a small figure in plain clothes seen from behind, far away. People of today appear from behind, in silhouette,
> as hands only, or out of focus; never a real, recognisable person. No text, letters, numbers or logos anywhere; phone
> and laptop screens show only soft glowing shapes. Reply "OK" and wait.

Each lesson's brief lists its images with a ready prompt for each, in the same chat. The first approved Lesson 1 scene is
saved as `reference.webp` and attached to later prompts with "same photographic style as the reference image".
