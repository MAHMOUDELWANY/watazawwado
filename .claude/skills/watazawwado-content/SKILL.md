---
name: watazawwado-content
description: Use for ANY Watazawwado social media, video, marketing or content work, even from a short or vague prompt ("next video", "write captions", "script a short", "this week's posts", "محتوى", "فيديو جديد", "بوست", "thumbnail", "carousel", "how are the accounts doing"). Reads the content plan and binding rules, finds the next item, produces it with the installed marketing and social-media skills, checks it against the rules and logs it.
---

# Watazawwado Content

Plans and produces content for the academy's YouTube, Shorts, Instagram, TikTok, Facebook, Telegram and WhatsApp
channels. One request = one finished, checked deliverable (a week's scripts counts as one).

## 1. Read before anything

1. `docs/marketing/PLAN.md`: where we are, pillars, month, open questions.
2. `docs/marketing/RULES.md`: binding content rules and the pre-publish checklist.
3. `docs/marketing/PRODUCTION.md`: formats, script anatomy, safe zones.
4. The last two weeks of `docs/marketing/LOG.md`.
5. Root `RULES.md` §2b, §3, §4, §6, §6b when prices, subjects or voice are involved.

The installed marketing skills read `.claude/product-marketing.md`; the social-media skills ask for `about-me.md` and
`voice.md`: use `.claude/product-marketing.md` as about-me and `docs/marketing/RULES.md` §2 as the voice instead, and
never let `voice-builder` invent a voice or write files to the project root.

## 2. Find the job

- A specific request → do that.
- "Next" / vague → the next undone item for the current month in `PLAN.md` §6, else the next idea in `IDEAS.md`
  that fits the pillar mix (`PLAN.md` §4).
- An `[Open]` question blocks the item (e.g. Ustadha Afnan's appearance) → do something else and ask the owner.

## 3. Produce (pick the tools that fit)

| Deliverable | Use |
|---|---|
| Short / Reel / TikTok script | `PRODUCTION.md` §3 anatomy; `hook-generator` for 6 hooks; `reels-scripting` in supplied-input mode (no Apify) |
| Long YouTube script | `PRODUCTION.md` §5; `video`, `copywriting` |
| Title, description, chapters, tags | `seo-content-brief` / `ai-seo` for the search phrase; `PRODUCTION.md` §5 |
| Thumbnail | `youtube-thumbnail` (brand colours from `docs/design-system.md`) |
| Carousel | `gemini-carousel` brief, or HTML/CSS slides via `graphic-designer`; 1080×1350 |
| Captions for all platforms | `social`, `post-formatter` (adapt: Instagram/TikTok/Facebook, not LinkedIn) |
| Monthly calendar or new series | `content-strategy`, `content-matrix` with our 5 pillars |
| Lead magnet / email follow-up | `lead-magnets`, `emails` (Brevo free plan) |
| Collaborations | `influencer-marketing`, `co-marketing`, `community-marketing` |
| Weekly numbers | `analytics`; write the summary in `LOG.md` |
| Fresh topics | `niche-research` (live web), `customer-research` |

Every script ships with: on-screen text per beat, the spoken line, the shot (face / Mushaf overhead / screen
recording), the caption for each platform, the CTA and the UTM link (`RULES.md` §6).
Arabic and English versions are written, not machine-translated; both follow root RULES.md §6.

## 4. Religious content

Quran text, translation and word counts come from the Quran MCP server (follow its grounding rules first), with
surah:ayah. Hadith only with collection and number and an authentic grade. No rulings. If a fact cannot be verified,
cut it.

## 5. Check, then hand over

1. Run the `RULES.md` §8 checklist item by item; fix, don't flag.
2. Run `humanizer` on every caption and script line.
3. Save deliverables under `docs/marketing/content/YYYY-Wnn/<slug>.md` (scripts, captions, prompts) so the owner can
   film from them; images go next to them.
4. Add a line to `LOG.md`; mark used ideas in `IDEAS.md`; update `PLAN.md` §1 and §9 (starting point, open items) if they
   changed.
5. Tell the owner, in Arabic, what is ready and what they need to do (film, record, approve), shortest first.

Content does not need the owner's review to be **written**; it needs the owner (or the teacher on camera) to film and
publish it. Posting on the accounts is the owner's action unless the owner gives Claude access and asks.
