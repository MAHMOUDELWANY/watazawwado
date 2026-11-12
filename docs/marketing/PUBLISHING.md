# Publishing and social-account management

Set up 2026-11-12 with the owner. Claude schedules; nothing is published without the owner's approval of the batch.
Strategy: `STRATEGY.md`; content rules: `RULES.md`; procedure: `watazawwado-content`.

## 1. Accounts and tools

| Platform | Tool | Account | ID |
|---|---|---|---|
| Instagram (Business) | Buffer | @watazawwado.academy | channel `6af5f3e362b70b94b00b1804` |
| TikTok | Buffer | @watazawwado.academy | channel `6af5f44e62b70b94b00b1de4` |
| YouTube (Shorts) | Buffer | Watazawwado Academy | channel `6af5f53962b70b94b00b2aa3` |
| Facebook page | Metricool | Watazawwado Academy | brand `8064719`, page `1419425884578231` |
| Threads | Metricool | watazawwado.academy | brand `8064719` |
| Google Business Profile | Metricool | Watazawwado Academy | brand `8064719` |

Buffer organisation `6af5f27405b6372653a75d65` ("My organization"), timezone Europe/Warsaw. Free plan: 3 channels,
**10 scheduled posts at a time**, 100 ideas. Metricool timezone Europe/Warsaw.

## 2. What goes where

| Format | Instagram | TikTok | YouTube | Facebook | Threads | Google Business |
|---|---|---|---|---|---|---|
| Video (motion or filmed) | Reel | Video | Short | Reel | – | – |
| Carousel | Carousel | Photo post | – | Album post | – | – |
| Written post | Image post | Photo post | – | Post | Text post | – |
| Weekly update (what we built, wave news) | – | – | – | – | – | "What's new", once a week |

Same piece adapted per platform: captions per platform, one CTA, UTM link (RULES §6). No "AI" label (owner,
2026-11-12) unless a platform's form requires it.

## 3. Times

Default slot **16:00 Europe/Warsaw** (10:00 New York, 15:00 London): the audience is the US, UK and Europe.
Metricool's general best times for Europe peak at 10:00–12:00 Warsaw, but that is not our audience; we test 16:00 vs
20:00 after two weeks of our own numbers. Buffer's default queue times are random; posts are scheduled at a fixed time
(`customScheduled`), not added to the queue.

## 4. Workflow

1. Claude produces the piece and puts it in its Notion Content Calendar page, Status **Review**.
2. The owner approves (or edits in Notion).
3. Claude makes the files public (the site: `public/social/<id>/...` deployed to `watazawwado.academy/social/...`).
   Buffer and Metricool need public URLs; local files and Notion file links do not work.
4. Claude creates the posts: Buffer as drafts, Metricool for review, each at its date and time.
5. **The owner approves the week's batch once.** Then Claude schedules. Buffer's 10-post limit means scheduling 2–3
   days at a time.
6. The owner answers comments and messages; "comment ZAAD" runs on ManyChat.
7. Every week Claude pulls the numbers (Buffer analytics, Metricool) into Notion Weekly Numbers and sets the items to
   **Published**.

Learned on the first post (V1, 2026-11-12):
- Media goes public by a small commit of only `public/social/<id>/` on top of `origin/main` (temporary worktree), then
  one check after the deploy (~4 min). Never a polling loop against production.
- Buffer's free plan has **no first comment**: the owner posts the pinned comment by hand after publishing.
- Buffer drafts keep their date; Metricool posts with `draft: true` stay drafts. Approval = Claude switches them to
  scheduled.

Never: publish without the batch approval, delete a published post without asking, reply to comments as the owner.
