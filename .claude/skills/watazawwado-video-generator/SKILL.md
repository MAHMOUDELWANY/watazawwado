---
name: watazawwado-video-generator
description: Use when the owner wants a Watazawwado promo, motion-graphics, explainer or ad video (Reels, TikTok, Shorts, YouTube, website), a new cut or edit of one, a voice-over script for ElevenLabs, or says "اعمل فيديو", "فيديو إعلاني", "موشن جرافيك", "زي فيديو دولينجو", "نسخة تيك توك/يوتيوب".
---

# Watazawwado Video Generator

Motion-graphics videos for the academy, built in code (Remotion) from the owner's own voice-over, in the site's
identity. Content rules still come from `watazawwado-content` and `docs/marketing/RULES.md`; this skill is the
production method, the owner's taste and the lessons learned (session of 2026-10-24).

## The pipeline (in this order)

| # | Step | Done when |
|---|---|---|
| 1 | Discuss first if the owner says "ناقشني": plan only, no build | Owner approves the plan |
| 2 | Script in chat, in the ElevenLabs v4 format ([reference.md §1](reference.md)) | Owner has a copy-paste code block |
| 3 | Owner records it with his voice clone ("mahmoud", eleven_v4) | Newest `Downloads/ElevenLabs_*mahmoud*_v4.mp3` found (the attached file may be an older one: check timestamps) |
| 4 | Loudness-normalise the VO, transcribe word timings locally (faster-whisper), fix spellings | `src/words-*.json` matches the script |
| 5 | Build scenes in `marketing/promo-video` (Remotion), reuse `kit.tsx`, `captions.tsx` (`makeVO`), shared pieces exported from `Promo.tsx` | Draft renders |
| 6 | Draft at `--scale=0.4 --muted`, review a contact sheet of frames | No overlaps, captions readable, every scene on its word |
| 7 | Final render, `loudnorm=I=-14:TP=-1.5:LRA=11`, a 720p phone copy (< 30 MB), copy the 1080p file to Downloads | ebur128 shows ≈ −14 LUFS and ≤ −1.5 dB peak, no silence > 1.2 s except the end card |
| 8 | Send the phone copy with `SendUserFile`, commit on the video branch, log in `docs/marketing/LOG.md` | Owner has the file; nothing published |

Commands, file layout and the measured recipes are in [reference.md §4](reference.md).

## The retention method (owner, 2026-11-13: binding for every teaching video)

From a reference the owner chose ("How to make boring content addictive", a marketer with 22 years in branding;
contact sheet `docs/design/inspiration/motion-explainer/retention-method.jpg`). The topic is never boring; the way in
is. Every script follows four steps, in this order:

| Step | Rule | In a Fix-one-letter video |
|---|---|---|
| 1. **A moment, not a topic** | Open on a situation the viewer recognises in the first 2 s, never "today we learn X" or "5 tips for Y". | "You've said the word *Arabic* a thousand times. You've probably never said its first letter." |
| 2. **Give the problem a consequence** | Say why it matters to *them*: what it costs or changes. This is where most creators lose people. | Miss the sound and the word changes: *he knew* becomes *he was in pain*. |
| 3. **Show the moment it changed** | The turn: what was wrong, what works instead. It makes them curious about the fix. | "The fix isn't in your mouth. It's in your throat." |
| 4. **Something they can do** | A concrete exercise for tonight, never vague advice. Saveable. | Hand on the throat, "aah", squeeze, feel the buzz; ten times tonight. |

Checklist before any script ships: Did I start with a moment someone recognises? Did I explain why it matters? Did I
show what changed? Did I give one thing to do today?

Craft that goes with it (from the same reference, adapted to our paper look):
- **Open loop in the first 5 s** ("stay for step 3", "this one changes the meaning") so the viewer waits for a payoff.
- **Step tracker** on screen (●○○○ / "step 2"), so people feel progress and stay to the end.
- **Pattern break every 4–6 s**: a full-screen typographic card (big two-word line, one word in serif italic), a
  colour flip, black-and-white for "the boring way", a speech-bubble prop ("so what?"), a number or timer card.
- **Props that make it concrete**: a notepad with the exercise written by hand, a timer ("tonight: 10×"), before → after.
- **Sound follows motion**: a whoosh on every slide, a pop on every sticker, a pen scratch on every underline or X,
  a riser into the reveal, a soft "correct" on the payoff. Effects 14–20 dB under the voice, never over Arabic letters.
- **The ending asks for one action** (save or send, whichever fits the goal) and the brand sign-off "Pack your zaad".

**Use the method, not her examples (owner, 2026-11-13).** Her "something to try tonight" or "step 2 ●●○○" are examples,
not templates. Brainstorm our own version for every video before writing: the task should hook into the viewer's real
life (V2: "every time you say *Arabic*, start it from your throat"), the ending should close the loop the hook opened
(V2: ×1,000 → ×1,001, "make the next one count"), and a self-check beats a homework list (V2: the hand test).

**House frame for every motion video (owner, 2026-11-13):**
- A **progress ribbon around the frame** (crimson → copper → gold → teal) that runs clockwise from the top centre and
  closes on the last frame, so the viewer always sees how much is left.
- The **logo pressed into the paper** top-right: a soft round dent, low opacity, multiply; never a square sticker.
- A **zaad bag tracker** top-left instead of a step counter: it collects one token per step and, at "Pack your zaad",
  flies to the centre, grows and zips shut.
- Hands and bodies are drawn as real shapes (palm, joined fingers, thumb, sleeve) with a white sticker outline;
  silhouettes stay faceless.

## The owner's taste (binding)

- **Script:** a hook a parent recognises in the first second, an open loop paid off at the end, value first so it
  never feels like an ad. Name our real differentiators (Zad Path · مسار الأثر in Kids/Teens/Adults, a report after
  every class, progress stage by stage, placement test, male or female teacher who stays, your time zone, any device,
  family discount, invite-a-friend credit, codes, first lesson free). **Never a price.** The CTA sends people to the
  site: "your first lesson is on us, link in bio". No "ask in the comments" CTA.
- **Length:** TikTok/Reels: two points, about 50–70 s. YouTube/website: the longer five-point cut is fine.
- **Look:** the site's paper world (Thmanyah type, ribbon gradient, khatam, arch, glass) with dark cinematic beats for
  contrast. Logo: `public/img/logo-clean.png` only. Curriculum art from `public/curriculum` (check `reviewed`).
- **Motion:** lots of it, and creative: a moving 3D camera, one focus at a time, kinetic "box" type, huge counting
  numbers, light streaks, bursts, devices, a link-in-bio tap. Change the reveal pattern between sections.
- **Captions:** word-synced, lower third, key words in the gradient, unspoken words hidden, readable on paper.
- **Sound:** no music (RULES §1.6). Sound effects from Woven SFX, ElevenLabs and Mixkit, never ripped from reference
  videos. Few strong hits on key moments, one soft whoosh per cut, silence before reveals, no tonal drone.

## Common mistakes (all happened once)

- Cutting VO clips with `-ss` after `-i` plus `afade st=`: the clips came out silent. Check every audio file's level.
- Firing ElevenLabs calls in parallel: 429 rate limit. Run them one at a time.
- A white `text-shadow` under gradient-clipped text makes key words look pale on paper.
- Sending a > 30 MB file: it never reaches the owner's phone. Send the 720p copy.
- Claiming a video is checked without listening: say plainly what was measured (levels, silences, frames).
