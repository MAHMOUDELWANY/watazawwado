# How a Watazawwado Video Is Made

The craft side of `PLAN.md`. Free tools only: phone camera, CapCut or DaVinci Resolve (free), Canva (free), YouTube
Studio, Meta Business Suite (free scheduling for Instagram + Facebook), TikTok's own scheduler.

## 1. Setup (once)

- **Camera**: the phone's back camera, 4K or 1080p at 30 fps, locked exposure and focus (long-press on the screen).
  Film vertical 9:16 for Shorts, horizontal 16:9 for YouTube. When both are needed from one take, film 16:9 4K with
  the face centred and crop 9:16 in the edit.
- **Sound beats picture**: a wired or cheap wireless lavalier mic (about $15–25). Quiet room, soft things around
  (curtains, carpet, books) to stop echo. Record 10 s of silence at the start of each session for noise removal.
- **Light**: face a window (daylight in front, never behind). Evenings: one soft lamp at 45° in front, slightly above
  eye level.
- **Frame**: camera at eye level, eyes on the top third line, a little headroom. Background: tidy, a bookshelf or a
  plain wall with one brand touch (a khatam-star print, the Mushaf on a stand). No clutter, no other people.
- **Look**: neat, calm colours; avoid stripes and pure white. Same look per series helps recognition.
- **Mushaf shots**: overhead (phone on a stand above the page), finger or a pen pointing at the word being read.
- **Screen recordings** (site, curriculum, booking): browser at 100%, demo account, notifications off, cursor large.

## 2. Filming day (once a week, ~3 hours)

1. Claude prepares the week's scripts the day before (`watazawwado-content` skill).
2. Film long video first (energy is highest), then the standalone Shorts.
3. Each Short: 3 takes of the hook, then the body once or twice. Say the hook looking into the lens.
4. Leave 1 second of silence before and after each take (clean cuts).
5. Back up the files the same day (cloud folder per week: `2026-W45/`).

## 3. Anatomy of a Short / Reel / TikTok (20–45 s)

| Time | Part | Rule |
|---|---|---|
| 0–2 s | **Hook** | The problem or the surprise, said and written on screen at once. Start mid-sentence; no "Assalamu alaikum, today we…" (greet in the caption or at the end instead) |
| 2–25 s | **One idea** | One letter, one rule, one tip. Show, don't describe: the mouth, the Mushaf, the screen |
| last 3–5 s | **Payoff + one CTA** | Repeat the fix, then "Follow for one letter a day" or "Full lesson on our channel" |

- Captions burned in, 2–5 words at a time, large, high contrast, inside the safe zone (§4).
- Cut every pause and breath; a cut every 2–4 s. No zoom effects that feel like trends.
- Arabic words on screen in a clear Naskh font with full tashkeel when it matters; English transliteration beside it.
- Loop: the last line can flow back into the first.

**Hook patterns** (fill with real content; generate variations with `hook-generator`, then humanize):
- "If you say ‹word› like this, the meaning changes."
- "English speakers make this mistake in Al-Fatiha."
- "Your child is bored in Quran class? Try this."
- "This one word is in the Quran ‹N› times." (count verified with the Quran MCP `fetch_word_concordance`)
- "How to say ‹phrase› to your Teta in Egyptian Arabic."

## 4. Formats and safe zones

| Asset | Size | Notes |
|---|---|---|
| Short / Reel / TikTok | 1080×1920 | Keep text out of the top 250 px and bottom 400 px, and the right 150 px (buttons) |
| YouTube video | 1920×1080 (or 4K) | Chapters in the description |
| YouTube thumbnail | 1280×720 | Face (or the Mushaf/letter) + 2–4 big words; readable at phone size |
| Instagram carousel | 1080×1350 | 6–10 slides; slide 1 = hook, last = save/share + CTA |
| Telegram / WhatsApp card | 1080×1080 | One idea, logo small |

Brand: crimson, teal, copper, gold on warm paper, Islamic geometry, Thmanyah font for Latin/Arabic UI text
(`docs/design-system.md`). Same caption style in every video of a series.

## 5. Anatomy of a long YouTube video (6–12 min)

1. **Cold open (0–20 s):** the promise + a quick glimpse of the payoff.
2. **Intro (5 s):** "I'm ‹name›, a teacher at Watazawwado." Short brand sting.
3. **Body:** 3–5 steps, each with a chapter, an example on screen and a mini practice ("pause and try it now").
4. **Recap (30 s).**
5. **CTA (15 s):** one action: "If you want a teacher to listen to you read, book a free trial lesson; link in the
   description." End screen with the next video in the playlist.

Title: the search phrase people actually type ("How to pronounce ع (ayn) correctly"), under 60 characters.
Description: 2 lines summary with the keyword, chapters, verified references, the UTM link, playlist link.
Pinned comment: a question that invites practice ("Write the word you find hardest").

## 6. Repurposing one long video

Long video → 3–5 Shorts (best moments, each with its own hook) → 1 carousel (the steps) → 1 Telegram/WhatsApp card →
Instagram stories (poll: "Which letter is hardest for you?") → later a section of an email.

## 7. Posting and replies

- Post when the audience is awake: for North America + UK, roughly 17:00–21:00 UK time on weekdays and late morning UK
  time on weekends. Check YouTube/Instagram analytics after 4 weeks and adjust.
- Same day: reply to every comment in the first hour (brief, warm, a question back). Religious rulings → `RULES.md` §1.4.
- Every comment like "how much?" or "do you teach kids?" gets a short public answer and the trial link (no DM push).

## 8. Weekly review (10 minutes, in `LOG.md`)

Published list, best/worst post with the reason, 3-second hold and average view duration, saves/shares, site clicks,
trial bookings by source, one change for next week.
