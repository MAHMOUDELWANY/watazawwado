# Style guide: Zad Path · Teens (12–17)

Binding for every image in a Teens lesson (`docs/curriculum/RULES.md` §1.10, §3 "Look: bolder, graphic novel / anime").
Owner's choice, 2026-10-21: **anime**. Story world: `zad-essentials-teens/MAP.md`. The character sheet
(`characters/sheet.webp`, made first) is the reference: when an image disagrees with it, the sheet wins.

## Look
- Modern anime film look: clean confident line art, cel shading with soft gradients, cinematic light (golden hour,
  blue hour, phone-screen glow at night), detailed believable backgrounds of a Western city.
- Natural teen proportions and expressive eyes; **no chibi, no exaggerated features, no fan-service**. Everyone is
  dressed modestly; girls' clothes are loose and their hijab covers hair and neck.
- Brand palette in the scene where it fits: crimson `#C51F24`, teal `#087D91`, copper `#8B4935`, gold `#E5A93C`.
- Islamic details where they belong (mosque youth room, prayer mat at home, a khatam star on a lamp), never pasted on.
- Phones, group chats and notifications are part of the world, but **no real app logos or brand names**, and no
  readable text in the image (the slide adds it).
- Every image teaches: one clear subject, space left for the slide's labels and scene build.

## Characters (fixed)

| Character | Must always have |
|---|---|
| **Zayn (15)** | Short black hair, faded at the sides; light brown skin; dark brown eyes; slim. Olive-green bomber jacket over a white T-shirt, black joggers, white trainers. |
| **Noor (13)**, Zayn's sister | Same skin and eyes as Zayn. **Crimson hijab** (covers hair and neck); oversized cream hoodie; long, loose dark-teal skirt to the ankles; white trainers; phone in a gold case. |
| **Ethan (15)**, Zayn's friend | Messy ginger-blond hair, light freckles, fair skin; navy hoodie with one grey stripe on the sleeves; blue jeans; headphones around his neck. |
| **Amira (13)**, Noor's friend | Olive skin; **light grey hijab**; oversized navy jumper; long, loose black trousers; often one earbud in; a quiet, guarded face. |
| **Hamza (22)**, their cousin | Neat short black beard; black hair; round thin-framed glasses; navy quarter-zip jumper; a university lanyard; calm warm smile. |
| **Aunt Salma** (40s) | Soft beige hijab; plum abaya; kind eyes; a small gold ring. Appears in the girls' lessons. |

## Never
- No faces or bodies of prophets, Sahaba or Jibril. Historic scenes show the place and the light; Jibril only as the
  white-clothed figure seen from behind at a distance (as in the Kids lessons).
- No text inside generated images, no logos.
- No music; sound effects only.

## Base prompt (prefix every Teens scene prompt with this)
> Modern anime film illustration, clean line art, cel shading with soft gradients, cinematic lighting, detailed
> background of a modern Western city, natural teen proportions, modest clothing, palette with deep teal, crimson,
> copper and warm gold accents, 4:3 landscape, no text, no logos.

Then add the characters exactly as in the table above, the scene, and what must be visible for the scene build. In
ChatGPT, attach `characters/sheet.webp` and say "same style and same characters as the reference image". Save as WebP in
`public/curriculum/zad-teens/lNN/` and record it in `docs/curriculum/sources.md`.

## Three kinds of images (RULES.md §1.10)

| Kind | What | Background | Folder | Reuse |
|---|---|---|---|---|
| Scene | A 4:3 painting of a place or moment | Painted | `lNN/` | One page per lesson only |
| Character | One character, one pose, full body | **Transparent PNG** | `characters/` | Every lesson |
| Prop | One object that must move on its own | **Transparent PNG** | `lNN/` | The lesson that needs it |

**Character / prop prompt (prefix):**
> Same style and same character as the reference image. A single [character / object], full body, centred, soft studio
> light from the upper left, a gentle shadow under the feet, **transparent background (PNG)**, nothing else in the
> image, no text.

If ChatGPT returns a background anyway, ask for "plain pure white background"; Claude removes it with ffmpeg.

## Step 1: the character sheet (`characters/sheet.webp`)

> Modern anime film character design sheet, clean line art, cel shading with soft gradients, plain light cream
> background, no text, no logos. Six characters standing side by side, full body, front three-quarter view, natural
> proportions, modest clothing:
> 1. Zayn, 15-year-old boy, short black hair faded at the sides, light brown skin, dark brown eyes, slim, olive-green
> bomber jacket over a white T-shirt, black joggers, white trainers.
> 2. Noor, his 13-year-old sister, same skin and eyes, crimson hijab covering hair and neck, oversized cream hoodie,
> long loose dark-teal skirt to the ankles, white trainers, holding a phone in a gold case.
> 3. Ethan, 15-year-old boy, messy ginger-blond hair, light freckles, fair skin, navy hoodie with one grey stripe on the
> sleeves, blue jeans, headphones around his neck.
> 4. Amira, 13-year-old girl, olive skin, light grey hijab covering hair and neck, oversized navy jumper, long loose
> black trousers, one earbud in, quiet guarded expression.
> 5. Hamza, 22-year-old man, neat short black beard, round thin-framed glasses, navy quarter-zip jumper, university
> lanyard, calm warm smile.
> 6. Aunt Salma, woman in her 40s, soft beige hijab, plum abaya, kind eyes.

## Step 2: character library (`public/curriculum/zad-teens/characters/`, made once, reused in every lesson)

| File | Pose |
|---|---|
| `zayn-stand.png` | standing, hands in jacket pockets, relaxed |
| `zayn-phone.png` | looking down at his phone, frowning slightly |
| `zayn-think.png` | hand on the back of his neck, looking up, thinking |
| `zayn-shrug.png` | both palms up, shrugging, unsure |
| `zayn-point.png` | pointing to the right, confident grin |
| `noor-stand.png` | standing, holding her phone, three-quarter view |
| `noor-type.png` | typing on her phone with both thumbs, focused |
| `noor-think.png` | finger on her chin, eyes narrowed, curious |
| `noor-surprised.png` | eyebrows up, hand over her mouth |
| `noor-happy.png` | laughing, one fist up |
| `ethan-stand.png` | standing, one hand holding a backpack strap |
| `ethan-ask.png` | one open hand forward, asking a question, friendly |
| `amira-stand.png` | standing, arms crossed, looking away |
| `amira-smile.png` | small honest smile, arms relaxed |
| `hamza-stand.png` | standing, relaxed, smiling |
| `hamza-explain.png` | one open hand raised, explaining |
| `hamza-phone.png` | replying on his phone, smiling |
| `salma-stand.png` | standing, hands folded, warm smile |
| `salma-explain.png` | one hand raised gently, explaining |

**How the owner makes them:** one ChatGPT chat. First the sheet (Step 1). Then attach the sheet and, for each pose:
"Same style and same character as the reference image: [name and description from the table]. Full body, [pose]. Soft
studio light from the upper left, a gentle shadow under the feet. Transparent background (PNG), nothing else in the
image, no text." The owner sends the results in table order; Claude names them, removes any painted background with
ffmpeg and saves them as WebP.

## Step 3: Lesson 1 scenes (`public/curriculum/zad-teens/l01/`)

Same ChatGPT chat as Steps 1 and 2. **Before the first scene, send this note** (once):

> Now we switch from character cut-outs to full scenes. For every scene from now on: 4:3 landscape, a full painted
> background (no transparency), the same anime style as the sheet. When a scene names one of our characters, draw them
> exactly as on the attached sheet. Never show the face or body of any prophet, any companion of the Prophet, or the
> angel Jibril: when I say "the stranger", show only a small figure in white clothes seen from behind, far away. No text,
> letters, numbers or logos anywhere; phone screens show only soft glowing shapes. Reply "OK" and wait.

Then send each prompt below as it is, one at a time, and attach the sheet (Step 1) with the prompts that name a
character. Send the results back with their file names.

| File | Prompt (paste as is) |
|---|---|
| `doors` | Three tall arched wooden doors side by side in a softly lit space, Islamic geometric carving on each, warm gold light leaking from under them; the left door glows teal, the middle crimson, the right gold. Mysterious and inviting. No people. |
| `canteen` | (attach the sheet) A busy secondary-school canteen at lunchtime. Zayn sits at a table looking at his phone, unsure what to type; Ethan sits opposite, grinning, leaning in as if he just asked a question. Other students blurred in the background. |
| `bus` | (attach the sheet) Evening, inside a city bus. Zayn sits by the window typing a note on his phone, the screen lighting his face; city lights blur outside. Leave the middle of the picture fairly calm. |
| `madinah` | Madinah at dawn, long ago: a simple old mosque of mud brick and palm trunks, palm trees, a soft golden sunrise in the upper right, a quiet courtyard with woven mats. No people. |
| `stranger` | The desert edge of old Madinah, wind blowing sand across the frame. In the centre, a little below the middle, small and far away, seen only from behind: a figure in bright white clothes walking towards the town; the sand seems to pass around him without touching him. No face visible. |
| `cushions` | Close view inside an old mosque: two plain cushions on a woven mat, placed very close and facing each other, soft light from a high window falling between them. No people. |
| `courtyard` | A shaded courtyard in old Madinah at midday: palm leaves casting patterned shadows on the sand and woven mats, quiet and calm. No people. |
| `noor-room` | (attach the sheet) Night, Noor's bedroom: her phone lies face down on the desk, a folded prayer mat on the chair, a small lamp glowing on the right; Noor sits on her bed, calm and thoughtful. |
| `walk-away` | Old Madinah, late morning: in the centre, far away and small, seen only from behind, the figure in white walks away along a path between palm trees into bright light. No face visible. |
| `footprints` | Desert sand seen from above: many footprints, each step pressed into the one before, going round in one big closed circle that fills the picture. No people. |
| `corridor` | (attach the sheet) A school corridor between lockers: Noor and Amira stand together on the left, Amira with her arms crossed; on the right, a small group of students laughing and pointing. Tense but not violent. |
| `zayn-desk` | (attach the sheet) Night, Zayn at his desk on the left of the picture: a notebook open, his phone beside it glowing softly, a desk lamp, his face determined. Keep the right side calm and dark. |
| `science` | (attach the sheet) A school science classroom: a big picture of the Big Bang (a glowing burst of light and galaxies, no text) on the screen at the front, top centre; Zayn sits near the back on the left, looking at his phone, thoughtful. |

The five pillars, the six articles of Iman, the three doors on the "Three doors" page and the Why List phone are drawn in
code: no image needed. Claude saves the scenes as WebP; `SCENE_IMAGES` in `src/curriculum/slides/Slide.tsx` maps them to
the pages.

## Step 4: Lesson 2 scenes (`public/curriculum/zad-teens/l02/`)

Same chat and same rules as Step 3 (the note to ChatGPT is sent once and still applies). Attach the sheet with the
prompts that name a character.

| File | Prompt (paste as is) |
|---|---|
| `cover` | (attach the sheet) Night on a city rooftop. Zayn and Noor sit side by side in the lower middle, seen from behind, looking up at a huge starry sky that fills the top two thirds of the picture, the Milky Way across it. Calm and full of wonder. |
| `kitchen` | (attach the sheet) A warm family kitchen. Noor stands on the left with oven gloves, proud; a freshly baked cake sits in the middle of the counter with a little steam rising; Zayn stands on the right, one hand up, explaining something like a scientist. Cheerful. |
| `newborn` | Close-up: a newborn baby's tiny hand wrapped around an adult's finger, in the centre of the picture, soft warm morning light, a blanket in cream and teal. No faces visible. |
| `pitch` | Sunset over an empty football pitch at the edge of a town: a wide glowing sky in the top half, low hills on the right side, the grass spreading out wide in front, a single ball on the grass. No people. |
| `bench` | (attach the sheet) School playground at break. Zayn and Ethan sit on a bench on the left half of the picture; Zayn talks with his hands, confident; Ethan listens, curious. Keep the lower right of the picture calm and plain. |
| `gaming` | (attach the sheet) Evening, a cosy living room. Zayn and Ethan sit on a sofa with game controllers, seen from slightly behind. A big TV in the upper middle shows a fantasy game: three glowing mythical figures, one made of sea water, one of sky and wind, one of sunlight (no text on screen). Keep the lower middle calm. |

## Step 5: Lesson 3 scenes (`public/curriculum/zad-teens/l03/`)

| File | Prompt (paste as is) |
|---|---|
| `cover` | A modern city skyline at dawn with one large sun rising exactly in the centre behind the buildings, golden light spreading across the whole sky. No people. |
| `likes` | (attach the sheet) Noor sits on a bench, holding her phone in front of her in the middle of the picture; soft glowing hearts and round notification bubbles (no text, no logos) float up from the phone; her face is thoughtful, a little unsure. |
| `prayer` | (attach the sheet) Night, Zayn's bedroom. Zayn sits on a prayer mat on the left after prayer, hands raised in du'a, eyes lowered, calm; a small lamp glows. Keep the lower right of the picture calm and plain. |
| `library` | (attach the sheet) A school library with tall shelves. Ethan holds a thick book open and asks a question with a friendly, challenging look; Zayn listens, thinking. Both on the left half; keep the right side calm. |

`science.webp` (Lesson 1) is reused once in Lesson 2 and `gaming.webp` (Lesson 2) once in Lesson 3; no new image needed
for those pages.
