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
6. The Notion **Watazawwado Content Hub** (https://app.notion.com/p/3fea5208a5168151bcf5d6f042da2bde): the dated
   Content Calendar (data source `collection://96ad53ef-3a27-4d1e-a955-89e1ada5885e`) and Weekly Numbers
   (`collection://640f0993-1ba6-4d7a-983e-12689dfee88e`). Read the calendar through the Notion connector when it is
   connected; if not, work from `PLAN.md` §6 and tell the owner to update the hub.

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
| **Any spoken script (always)** | `mahmoud-voice`: the six moves, word choice per audience, stage cues, owner's edits log |
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
3. Write each deliverable (script table, shot notes, captions per platform, pinned comment) into the body of its item
   page in the Notion Content Calendar, where the owner reviews and films from it (owner, 2026-10-19). Directions to
   the owner in Arabic, spoken lines in the video's language. Images and exports go in the week's Drive folder.
   A week's overview (filming day, posting times, stories, reply templates) is its own page under the hub.
4. Move the item's Status in the Notion calendar to **Review** (the owner reads it in the Steps tab of the hub page
   "Script & Record Videos"; after approval it becomes Scripted → Filmed → Edited → Scheduled → Published) and put the deliverable path in its Notes. Add a
   line to `LOG.md`; mark used ideas in `IDEAS.md`; update `PLAN.md` §1 and §9 (starting point, open items) if they
   changed.
5. Tell the owner, in Arabic, what is ready and what they need to do (film, record, approve), shortest first.

Content does not need the owner's review to be **written**; it needs the owner (or the teacher on camera) to film and
publish it. Posting on the accounts is the owner's action unless the owner gives Claude access and asks.
