# Content Log

One block per week, newest first. Template:

```
## 2026-Wnn (dates)
Published: <platform – title – link> ...
Best: <post> – why | Worst: <post> – why
Numbers: 3s hold, avg view duration, saves/shares, site clicks, trial bookings (by utm source)
Change next week: <one thing>
```

## 2026-W43 (19–25 Oct)
- Plan, rules, production guide, idea bank and the `watazawwado-content` skill written. Marketing skills
  (coreyhaines31/marketingskills) and social-media skills (charlie947/social-media-skills) installed in
  `.claude/skills` (MIT; our `seo-audit` kept, theirs skipped). Waiting on the owner: `PLAN.md` §9 open questions.
- Owner decisions recorded (`PLAN.md` §9): TikTok renamed @watazawwado.academy (site links updated), only Ustadh
  Mahmoud appears, founding families and lead magnet chosen on delegation, Lesson 1 sample for signed-in accounts
  built (`sampleLesson()` in `src/curriculum/catalog.ts`, shown in `/student/curriculum` once Lesson 1 is reviewed).
- Deep research done: `reports/Online Quran academy market.md` + 5 note files. Plan and rules updated from it.
- Notion **Watazawwado Content Hub** (private draft): https://app.notion.com/p/3fea5208a5168151bcf5d6f042da2bde
  with the strategy summary, a page per platform (ready-to-paste bios, UTM links), the Content Calendar (~98 dated
  items, 31 Oct 2026 – 29 May 2027, 4 views) and Weekly Numbers.
- Week 1 production pack (31 Oct – 8 Nov) written in Notion: overview page (filming day 29 Oct, posting times, daily
  stories, reply templates, hashtags) + full scripts and captions in 10 calendar items, now Status = Scripted.
  Quran text verified with quran.ai (1:1–7, 112:1); the translation server was down, so no English translation goes on
  screen until checked. Rule kept: wrong-vs-right only on syllables, never on ayat.
- 2026-10-20: external five-phase research pack reviewed against the live site and code
  (`reports/2026-10-20 External research review.md`, Notion review page linked from the hub). Adopted its funnel,
  gates and decision rules (`RULES.md` §9, `PLAN.md` §8); 10 new calendar items (8 new series) on free Sundays;
  Weekly Numbers got 5 funnel columns. Found: no UTM/source capture and no analytics on the site, "14 subjects" on
  the homepage, "Islamic studies" on /pricing. 4 owner questions open.
- 2026-10-20 (later): owner answers recorded (`PLAN.md` §9 items 6–8): IELTS B2 so no level claims, owner replies as
  the academy within 12 h, Zad Lessons 1–3 approved, new series approved as ideas. Notion page "Script & Record
  Videos" built from the owner's reference video (Steps / Ideas / Post Calendar / Categories); new Status "Review";
  the 10 Week-1 scripts plus "Our Promises" and the parent-privacy post moved to Review.
- 2026-11-05: Notion Content Hub rebuilt from scratch on the owner's request. The old Content Calendar, Weekly Numbers,
  platform pages, Week-1 plan, research review page and "Script & Record Videos" are in Notion's Trash (restorable for
  30 days). New: hub page on the brand strategy (`BRAND.md`), Content Calendar (Status, Date, Series, Audience, Goal,
  Language, Platforms, CTA) with the first series of 16 items, 9 Nov to 5 Dec (10 "Building Watazawwado" episodes,
  6 teaching), and a new Weekly Numbers (waitlist and ZAAD comments first). All items are Ideas with a brief; full
  scripts are written item by item with `mahmoud-voice`.
- 2026-11-05: Week 1 scripts written into Notion (B1 What I kept seeing as a teacher, T1 the Daad, B2 What parents told me, P1 Five minutes a day), two hooks and two wise lines each, captions per platform, pinned comment, UTM links; all four moved to Review. T1 needs a teacher to confirm the makhraj on camera; B1/B2 need the owner to confirm the stories are his own.
- 2026-11-05: Week 2 scripts written into Notion (B3 a mentor who stays, A1 three phrases for Teta, B4 what annoyed you most, T2 the ح in al-ḥamd with Al-Fatiha 1:2 verified via quran.ai, Saheeh International); all four moved to Review.

## 2026-11-17
- Owner decision: carousels may carry soft piano notes (`RULES.md` §1.6 exception); no trending in-app sounds. Carousels
  are republished as 9:16 videos with `brand-assets/soft-notes.mp3` next to the silent originals (nothing deleted).
- V1 video version built from the PNG slides in one high-quality encode (`public/social/v1hq/v1.mp4`). Facebook Reel
  scheduled 18 Nov 12:00 Warsaw (Metricool). Instagram and TikTok are Buffer, which was at its 10/10 limit: add them
  after V2 publishes (17 Nov 18:00/20:00). Next: V3, V6, V8, V10 the same way.
- Media check: videos are 1080x1920, 30 fps, H.264 High, 2-3 Mbps (static slides need no more); Metricool does not
  re-encode. Published V1 carousel on Instagram/Facebook cannot be edited and was kept.
- Owner: series order matters (each piece leads into the next), so the V1 video goes out today before V2. V1 video
  moved to 17 Nov 14:15 Warsaw on Facebook (Metricool) and added on Instagram (Reel) and TikTok (Buffer) at the same
  time; V2 follows at 15:00 (FB), 18:00 (IG/YT), 20:00 (TikTok). To fit Buffer's 10-post limit, V8 (23 Nov) and V10
  (25 Nov) Instagram carousels went to Draft. V1 sent on Instagram and TikTok at 14:16-14:17 without errors; V8 and
  V10 then went back to scheduled (23 Nov and 25 Nov, 18:00 Warsaw). Buffer now holds 10/10 scheduled posts.

## 2026-11-20
- Status review for the owner: everything scheduled so far went out on time; numbers tiny (best: V2 YouTube 441 views,
  V1 TikTok carousel 459, FB reels ~200); no comments, saves or shares yet; average watch 4-7 s. Buffer at 10/10.
- Owner decisions: carousel sound is **our own nasheed** (Arabic + English), replacing the piano notes (RULES §1.6,
  draft lyrics and brief in `NASHEED.md`, awaiting owner review). No gradient through three or more hues after a
  viewer compared our colours to the pride flag (RULES §1.8). Our videos repeated text (label on the card + caption
  box); new binding look-and-motion rules from 9 owner references (`PRODUCTION.md` §3b, references in
  `docs/design/INSPIRATION.md`). V6, V8, V10, V11 videos to be remade in the new style once the nasheed exists.
- Owner's two test shots (18-19 Nov): landscape, window light behind or beside the face, low camera in the first.
  Fix: vertical 9:16, light in front, camera at eye level. Owner's voice is back; filming planned 26-27 Nov for B1/T1/P1.

### 2026-11-20 (evening): our nasheed adopted
- Lyrics approved in Arabic and English (anthem: chorus, home, language, resolve, teacher); lyric rules in NASHEED.md.
- ElevenLabs tests (about 10,000 credits) never satisfied the owner (AI-sounding voice, drums over the singer, lyrics
  out of order until `lyrics_type: custom`). The owner made the final takes in Suno from our studio brief.
- Adopted: full AR and EN takes, 5 s stings, 30 s beds in `marketing/brand-assets/nasheed/suno/`.


## 2026-11-21
- Owner: carousels stay carousels in the usual template, with our nasheed added as the sound when they are posted; the
  9:16 video remakes of V6/V8/V10/V11 were not wanted and were removed. RULES §1.6 and PRODUCTION §4 updated.
- Review of the scheduled voiced videos V7, V9, V12 against PRODUCTION §3b and mahmoud-voice: all three use the old
  card look (caption box repeating the card, ribbon progress bar and three-hue number badges, white empty halves).
  V7 also teaches the makharij wrongly (ك "front of the tongue", ق "deep in the throat") and claims "most people fail".
