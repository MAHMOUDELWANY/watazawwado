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
