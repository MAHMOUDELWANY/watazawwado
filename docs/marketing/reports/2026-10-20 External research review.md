# Review of the external research pack (2026-10-20)

The owner shared a five-phase external report (market intelligence, content strategy, launch readiness, pilot
production pack, pilot review framework). Every claim was checked against the live site, the code and our rules on
2026-10-20. Notion page (Arabic, for the owner):
https://app.notion.com/p/3ffa5208a51681f99c88eadefadb43bc

## Verdict

Careful and honest about evidence; its best parts are the funnel measurement (source → paid → retained), publish
gates and decision rules. It was made from outside, without the code or `RULES.md`, so it has six factual errors and
misses our five strongest assets (animated curriculum, teacher report after every class, placement test with
report, the Arab diaspora audience, the Rajab-to-Ramadan booking window). Its content plan (7 of 8 Shorts about
process: lesson length, "ask for a next step") is too weak for accounts starting at zero. We keep our plan and add
what it does well.

## Fact check

| Claim | Finding | Action |
|---|---|---|
| Name "Watazawwadou" | Wrong: Watazawwado | Never copy its text verbatim |
| Homepage "14 subjects" vs 8 on /learning | Correct (`PublicHomepage.tsx:60`) | Fix the homepage |
| Courses "Islamic studies / foundations / English coaching" | Outdated: Islamic studies retired 2026-10-18; the Zad Path. But /pricing still says "العلوم الشرعية" | Fix /pricing copy |
| No social links in the footer | Wrong: 5 icon links (text scrape missed them) | Use the real Facebook URL `profile.php?id=61595353682477`, not the share link |
| "From $9/hour" vs packages $8–8.50 conflicts | Not a conflict (single lesson vs package), but /pricing omits the single-lesson price and the $13 packages | One line on /pricing |
| "IELTS C1" needs proof | Fair; our rule is no credential claims | Owner question |
| No safeguarding page | Partly: rules exist in the terms (no recording, waiting room, teacher hosts) but no parent page | Parent safety page (PU-03 scope) |
| Source tracking needed | Correct and worse than it thought: no UTM capture, no "how did you hear", no analytics at all | Engineering before first post |
| Trial content unclear | Wrong: FAQ and How it works list goal, level, short lesson, plan | None |
| Teens: don't target | We have a Teens 12–17 Zad Path version | Reach via the parent |
| Arab diaspora, Ramadan season | Missing from the report | Keep ours |
| 2 Shorts a week | Too low from zero; capacity point is fair | 4 a week from one filming day |
| Competitor content sample | One video; too thin | Not used |
| Census figures | Correct, context only | None |

## Adopted

Funnel columns in Notion Weekly Numbers (level checks, trials attended, paid families, still learning at 4 weeks, top
questions); the "qualified lead" definition; `utm_content=id<calendar ID>`; green/amber/red publish gates and the
4-week decision rules (`RULES.md` §9, `PLAN.md` §8); 5–8 post-trial family interviews; the "don't post your child's
name" parent post.

## New series (brainstorm, in the Notion calendar as Idea)

Can You Read This? (quiz Short → free level check), Gently (signature calm correction on practice syllables), "After
every class, this lands in your inbox" (demo report), Our Promises (4th pinned post), The mystery visitor (Zad
Lesson 1 teaser, blocked until reviewed), Comment Replies, Dinner Table Ayah (weekly channel card), Teta Call
Challenge (winter break, Arabic). See `IDEAS.md`.

## Open owner questions

1. Is "IELTS C1" backed by a certificate? Otherwise "English at C1 level".
2. Teacher hours available in London and New York evenings (4–8 pm local).
3. Who answers social and WhatsApp messages?
4. Response target: within 12 hours?
