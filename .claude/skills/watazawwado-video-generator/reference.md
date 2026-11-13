# Watazawwado video generator: reference

## 1. Writing the voice-over script (ElevenLabs eleven_v4)

From ElevenLabs' own model guide:
- Tags in square brackets describe **how the line is spoken** (`[curious]`, `[warmly]`, `[softly]`, `[confident]`,
  `[playful]`, `[mischievously]`, `[excited]`, `[dramatically]`), not actions (`[smiling]` is ignored).
- A tag holds until the next one: change it only where the feeling changes.
- Pauses: `[short pause]`, `[pause]`, `[long pause]` and ellipses `…`. Capitals for rare emphasis (`ONE`, `EVERY`).
- Non-verbal touches for realism, sparingly: `[chuckles]`, `[exhales]`.
- Write the academy's name as `وَتَزَوَّدُوا` (it worked with the clone); fallback IPA `/wataˈzawwaduː/`.
- Tags work only on v4/v3. Suggest 2–3 takes; stability 35–40 if the delivery sounds flat.

Shape that worked: hook question to the parent → reason to stay ("stay with me") → proof points named by name →
"first lesson is on us" → link in bio → callback to the hook. Run `humanizer` on every line; no hype words,
no "not X but Y", short sentences. Hand the script over in chat in one ```` ``` ```` block plus the caption.

Current scripts: `marketing/promo-video/SCRIPT.md` (YouTube five-point cut) and `SCRIPT-tiktok.md`.

## 2. Inspirations (owner's reference videos, Downloads, 2026-10-24)

Take ideas, never copy: Duolingo spec ad (one feature per beat, laser light traces, logo slam, tagline end card),
Opal (one glowing element in focus, depth blur, glitch-dissolve of an icon), Apple Health (glass widgets over a
photo, kinetic sentence build), Pinterest (text with a filled highlight box that swaps words, cursor clicking real UI),
Wise (extreme 3D tilted cards, a huge number filling the screen, light sweep, profile card with "Link in bio"),
bento widget grids assembling while the camera pans, "MOTION" kinetic type with counting numbers.

## 3. Ad-reviewer checklist (external review of v4, 2026-10-24)

First readable idea within 0.3 s · no long dark atmosphere · CTA/free lesson shown before the final seconds ·
vary the section pattern · cards big enough for a phone (no camera crops on text) · label example data
("Example: Tajweed, stage 2 of 3") · strong caption contrast · restrained effects 14–20 dB under the voice, silence
before reveals · −14 LUFS, −1 to −1.5 dBTP · a 50–60 s cut for paid social.

## 4. Commands and layout

Project: `marketing/promo-video` (own `package.json`, Remotion 4.0.538; excluded from the root `tsconfig.json`).
- `src/kit.tsx` brand tokens, backdrop, streaks, bursts, shockwave, khatam, `Sfx`.
- `src/captions.tsx` `makeVO(words)` → `wf(word, nth)` (frame of the n-th occurrence), `Captions`.
- `src/Promo.tsx` YouTube cut + exported pieces (`Cam`, `Scene`, `PaperWorld`, `glassLight`, `Cursor`, `Arch`, `Screen`, `Still`).
- `src/TikTok.tsx` TikTok cut. `src/Root.tsx` registers both.
- `public/sfx/wv` Woven SFX, `public/sfx/el` ElevenLabs SFX, `public/sfx/mk` Mixkit, `public/img` art and logo.

```bash
# voice: normalise, then word timings (venv in the scratchpad; decode with ffmpeg because PyAV's open() breaks)
ffmpeg -i in.mp3 -af "loudnorm=I=-15:TP=-1.5:LRA=9" -ar 44100 -b:a 192k public/vo-x.mp3
ffmpeg -i public/vo-x.mp3 -ac 1 -ar 16000 -f f32le vo.f32
uv venv -p 3.12 wenv && uv pip install -p wenv/Scripts/python.exe faster-whisper
wenv/Scripts/python -I .claude/skills/watazawwado-video-generator/scripts/stt.py vo.f32 words.json   # word timings JSON

npx remotion render src/index.ts TikTok draft.mp4 --scale=0.4 --muted      # draft, then a frame contact sheet
npx remotion render src/index.ts TikTok raw.mp4 --crf=18                   # final
ffmpeg -i raw.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 256k final.mp4
ffmpeg -i final.mp4 -c:v libx264 -preset slow -crf 26 -vf scale=720:-2 -c:a copy final-phone.mp4
ffmpeg -i final.mp4 -af ebur128=peak=true -f null -                         # verify loudness and peak
```

Whisper misspellings to fix: Qur + 'an → Quran, Watazawwado, Zad Path, Tajweed, Fusha, digits → words.

## 5. Sound sources

- **Woven SFX** (`woven-sfx` MCP, `npx -y woven-sfx-mcp`): impacts, whooshes, pops, clicks, coins, glitch, typing.
  Files at `https://assets.sfx.woven.video/sfx/<id>.wav`. If the MCP is not loaded in the session:
  `node .claude/skills/watazawwado-video-generator/scripts/woven-mcp.mjs tools/call '{"name":"sfx_search","arguments":{"limit":50}}'`.
- **ElevenLabs** sound effects (Starter plan, `eleven_text_to_sound_v2`): ask for "no music, no instruments".
  One call at a time.
- **Mixkit** free sound effects (free licence, no attribution): download the preview mp3 by id.
- Never extract audio from someone else's video.

## 6. Logo and art

- `public/img/logo-clean.png`: AI cut-out of `public/brand-icon.jpg` (Magnific remove-background), cropped. The old
  `public/logo.png` has bites in the figure; the coloured app tile is not wanted as the logo.
- Characters: `public/curriculum/zad-kids|zad-teens/characters`. Cinematic stills: `zad-adults/l01`.
