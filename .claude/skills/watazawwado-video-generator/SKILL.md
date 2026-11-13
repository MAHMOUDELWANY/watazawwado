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
