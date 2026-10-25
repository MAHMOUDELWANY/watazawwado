# Curriculum Source Registry

Rules: see `PLAN.md` §3. One row per source. "Verified" = licence read on the official page on the date shown;
"To verify" = not yet confirmed — treat as **not allowed** until checked. Not legal advice; unclear cases go to the owner.
Decision values: Allowed · With conditions · Needs permission · Research only · Unclear.

## A. Quran

| Source | Link | Use | Licence (checked) | Commercial | Modify / redistribute | Decision | Next step |
|---|---|---|---|---|---|---|---|
| Tanzil Quran text | https://tanzil.net/docs/Text_License | Uthmani Arabic text in lessons | CC BY 3.0 + own terms, verified 2026-10-16 | Not excluded | No change to the text; verbatim copies keep the notice; credit + link to tanzil.net | **With conditions** | Download Uthmani text once, store with notice |
| Tanzil translations | https://tanzil.net/trans/ | — | Non-commercial only, verified 2026-10-16 | **No** | — | **Research only** | Do not ship any translation taken from Tanzil |
| Quran Foundation API (quran.com) | https://api-docs.quran.com/legal/developer-terms/ | Live text/audio/translations inside the app | Developer terms, verified 2026-10-16 | Yes, inside the app's UI | No redistribution/datasets; no caching > 1 week except Content Sync; text unaltered | **With conditions** | Third-party translations' own rights unclear — ask QF before relying on one |
| The Clear Quran (Khattab) | https://theclearquran.org | English meaning | Publisher: written consent required, verified 2026-10-16 | Needs consent | — | **Needs permission** | Only if owner wants it: email publisher |
| KFGQPC Hafs font | https://fonts.qurancomplex.gov.sa | Mushaf font | Proprietary, sources disagree, 2026-10-16 | Unclear | No modification | **Unclear** | Use an OFL Quran font instead |
| Amiri Quran / Scheherazade New fonts | https://github.com/aliftype/amiri · https://software.sil.org/scheherazade/ | Quran + Arabic text font | SIL OFL (to verify file) | Expected yes | Font not sold alone | To verify | Read the bundled OFL file |
| King Fahd Complex | https://qurancomplex.gov.sa | Reference for text accuracy | — | — | — | Research only | — |
| Quran MCP tool (this workspace) | connector | Fast verification of ayah text, tafsir, morphology while drafting | Research tool | — | Output not shipped as-is | Research only | Use for checking, ship text from Tanzil |

## B. Hadith

| Source | Link | Use | Licence | Commercial | Decision | Next step |
|---|---|---|---|---|---|---|
| Dorar hadith encyclopedia | https://dorar.net/hadith | Grading + takhrij lookup | FAQ: browse/search only, no copying of the encyclopedia (2026-10-16) | No copying | **Research only** | Record facts (book, number, grading, grader) in our own words |
| Sunnah.com | https://sunnah.com · https://sunnah.com/developers | Book/chapter/number lookup | No licence found; API needs a key (2026-10-16) | Unclear | **Research only** | English translations there belong to their publishers — never copy |
| Classical collections (Bukhari, Muslim, …) | via Shamela/Dorar | Arabic matn | Classical text public domain; modern editions/tahqiq not | Arabic matn yes | With conditions | Cite book + number; write our own English meaning |

## C. Libraries (finding and checking, not copying)

| Source | Link | Use | Licence | Decision |
|---|---|---|---|---|
| Al-Maktaba al-Shamela | https://shamela.ws | Find where a ruling/quote is in classical books | Per edition | Research only |
| OpenITI | https://github.com/OpenITI | Searchable classical texts | Open for research; per-text licence unclear (2026-10-16) | Research only |
| Fihrist | https://www.fihrist.digital | Discover digital texts + rights per book | Page gave no terms (2026-10-16) | To verify |
| Waqfeya | https://waqfeya.net | Locate printed editions | Per book, mostly unclear | Research only |
| Internet Archive | https://archive.org | Old editions | Per item | Research only |

## D. Curriculum design (principles only)

| Source | Link | Use | Licence | Decision |
|---|---|---|---|---|
| CAST UDL Guidelines | https://udlguidelines.cast.org | Multiple ways to present/engage/show understanding | To verify | Principles only |
| ERIC | https://eric.ed.gov | Research on sequencing, retrieval practice, assessment | Per article | Principles only |
| DOAJ | https://doaj.org | Open-access papers | Per article | Principles only |
| UNESCO | https://www.unesco.org | Learning frameworks | Per document | Principles only |
| OpenStax | https://openstax.org | How chapters/outcomes/exercises are built | CC BY-NC-SA, verified 2026-10-16 | Principles only (no content) |
| MIT OpenCourseWare | https://ocw.mit.edu | Course structure, assessment design | Mostly CC BY-NC-SA | Principles only |
| Existing Islamic school series (Safar, Weekend Learning, IQRA', Darussalam) | publishers' sites | Table-of-contents study: scope and age sequencing | Commercial, copyrighted | Study TOC only, never content |
| Yaqeen Institute, "Modern Pathways to Doubt in Islam" (Chouhoud, 2016) | https://yaqeeninstitute.org/read/paper/modern-pathways-to-doubt-in-islam | Scope reference: which doubts Western Muslim youth meet (Teens map, 2026-10-21) | Not checked; nothing copied | Research only |

## D2. Quotes used in lessons (Adults RULES §3: public, checkable, quote only, never a role model)

| Quote | Source | Checked | Lesson | Note |
|---|---|---|---|---|
| Steve Jobs: "Remembering that I'll be dead soon is the most important tool I've ever encountered to help me make the big choices in life." | Stanford commencement address, 12 June 2005 | Transcript on rev.com, 2026-10-23 | Adults L1 | Official Stanford page blocked the fetch; check the wording against the Stanford video before the lesson ships |
| Bronnie Ware: "I wish I'd had the courage to live a life true to myself, not the life others expected of me." | "Regrets of the Dying", bronnieware.com/blog/regrets-of-the-dying/ | Read 2026-10-23 | Adults L1 | Short quote with attribution |
| Stephen Hawking (with Leonard Mlodinow): "Because there is a law such as gravity, the universe can and will create itself from nothing." | *The Grand Design* (2010); excerpts reported by AP and Al Jazeera, 2 September 2010 (aljazeera.com/news/2010/9/2/universe-is-self-created-hawking) | Read 2026-10-25 | Adults L2 | Shown as the doubt the lesson answers, with respect; quote only |
| Albert Einstein: "One may say 'the eternal mystery of the world is its comprehensibility.'" | "Physics and Reality", *Journal of the Franklin Institute*, March 1936; reprint in *Dædalus*, Fall 2003 (amacad.org/publication/daedalus/physics-reality) | Read 2026-10-25 | Adults L2 | The popular "most incomprehensible thing…" version is a later rewording; we use the 1936 wording |
| Tom Brady: "I think, God, it's got to be more than this. I mean this can't be what it's all cracked up to be." | *60 Minutes*, CBS, Steve Kroft, 2005; quoted by CBS News 1 Feb 2022 (cbsnews.com/news/tom-brady-retirement-60-minutes-2022-02-01) | Read 2026-10-25 | Adults L3 | Living, not Muslim: quote only |
| Jim Carrey: "I think everybody should get rich and famous and everything they ever dreamed of so they can see that that's not the answer." | Jay Stone, *The Ottawa Citizen*, 16 Dec 2005, F1–F2; traced by Quote Investigator (quoteinvestigator.com/2022/11/09/rich-famous/) | Read 2026-10-25 | Adults L3 | Living, not Muslim: quote only; wording per the Ottawa Citizen print |

## E. Media

| Source | Link | Licence | Commercial | Attribution | Decision |
|---|---|---|---|---|---|
| Kenney (sound effects, UI assets) | https://kenney.nl | CC0, verified 2026-10-16 | Yes | Not required | **Allowed** |
| Wikimedia Commons | https://commons.wikimedia.org/wiki/Commons:REUSE | Per file | Per file | Per file | Check each file |
| Phosphor / Tabler icons | phosphoricons.com · tabler.io/icons | MIT (to verify) | Expected yes | Keep licence file | To verify |
| Freesound (CC0 filter only) | https://freesound.org | Per sound | CC0 ones yes | — | To verify per sound |
| Storyset | https://storyset.com/terms | Free licence with credit (checked 2026-10-17); modify/animate allowed; no resale or redistribution as files | Yes, with credit | Credit required | **With conditions** (add credit on the curriculum page) |
| Adults L1 stills (12: cover, mirror, bedside, street, madinah, stranger, cushions, graves, horizon, lane, monday, night) | owner, ChatGPT, 2026-10-23 → `public/curriculum/zad-adults/l01/*.webp` (WebP q80; `reference.webp` = madinah) | Owner's own generation | Yes | Not required | **Allowed** (OpenAI terms row below) |
| Adults L1 v3 stills + depth maps (16: pillars, window, prayer, hourglass, doorway, above, shelf, listening, train, road, purse, canteen, suitcase, corridor, phone, notebook; each with `-depth`) | owner, ChatGPT, 2026-10-23 → `public/curriculum/zad-adults/l01/*.webp` (stills 1600w q80, depth 800w q88, white = near) | Owner's own generation | Yes | Not required | **Allowed** (OpenAI terms row below) |
| ChatGPT image generation (owner's account) | https://openai.com/policies/terms-of-use | Output belongs to the user under OpenAI terms (to verify current text) | Expected yes | Not required | To verify |
| Our own SVG + Motion animations | — | Ours | Yes | — | **Allowed** (preferred) |
| Kenney packs used in the player: Interface Sounds, UI Audio, Impact Sounds (1.0) | https://kenney.nl/assets | CC0 (License.txt in each pack, checked 2026-10-18) | Yes | Not required | **Replaced** 2026-10-24 by the ElevenLabs set below; was in use from 2026-10-18: 11 clips in `public/curriculum/sfx/` (pop, chime, correct, praise, oops, brick, thud, lock, strike, pen, sparkle), trimmed and converted to mp3. Source clip for each, in that order: drop_002, glass_004, confirmation_002, confirmation_004, error_006, impactPlank_medium_001, impactSoft_heavy_000, switch_003, scratch_004, scratch_005, glass_001 |
| ElevenLabs sound effects (text-to-sound v2), generated for us 2026-10-24 through the owner's ElevenLabs connector, flow eEO5yEwOUDrykZp7thLx | https://elevenlabs.io/app/flows/eEO5yEwOUDrykZp7thLx | ElevenLabs terms for generated audio: commercial use needs a paid plan (owner to confirm the account's plan) | Yes on a paid plan | Not required on a paid plan | **In use** (2026-10-24): 21 clips in `public/curriculum/sfx/` (pop, whoosh, chime, reveal, brick, thud, lock, sparkle, sand, water, pen, strike, poof, correct, oops, praise, riser, impact, stamp, cast-kids, cast-teens), best of 2 takes each, trimmed and levelled to about -18 LUFS. 2026-10-25: the page turn went back to our synthesised one at the owner's request; sparkle, reveal, praise, pen and strike regenerated (3 takes each) after the owner heard hiss/static and an eraser-like rub; the whole set re-processed with noise reduction and a gate |
| Our own synthesised sound effects (`src/curriculum/slides/sfx.ts`, Web Audio API) | — | Ours, generated in code at play time | Yes | — | **Allowed** (2026-10-18) |

## E2. Lesson images (owner, ChatGPT)

| Lesson | Files | Made | Notes |
|---|---|---|---|
| L2 | `public/curriculum/zad-kids/l02/`: crash, sky, lock, camel, park, boat (.webp) | Owner, ChatGPT, 2026-10-18; compressed to WebP by Claude | `lock-base.webp` (key painted out) and `key.webp` (key cut out) made from `lock.webp` with ffmpeg. Style is more 3D than the gouache base prompt; owner accepted the set. |
| L2 batch 2 | `l02/`: cover, baby, desert-sky, desert-mountains, desert-ground, desert-camel, hand, hand-brick, ladybird, magnifier (.webp); `l01/lego.webp` redone with a gold hijab | Owner, ChatGPT, 2026-10-18; converted to WebP by Claude | ChatGPT painted a fake checkerboard behind the camel and the mountains; Claude keyed it out with ffmpeg (a faint checker texture stays in the camel's fur). `look.webp` retired (replaced by the four desert layers). |
| L3 | `public/curriculum/zad-kids/l03/`: cover, sunrise, recite, masjid-night, dua, football (.webp) and compass (prop) | Owner, ChatGPT, delivered 2026-10-19 (prompts in `zad-essentials-kids/L03-allah-is-one.md`) | 16:9, saved unchanged; compass has transparency. Lesson 3 also reuses `l02/boat.webp` once. |
| Character library | `public/curriculum/zad-kids/characters/` (14 poses: Yusuf ×4, Maryam ×4, Jiddo ×3, Mishmish ×3, .webp with transparency) | Owner, ChatGPT, 2026-10-18; converted to WebP by Claude | Reused in every Kids lesson. Jiddo's face differs a little from the Lesson 1 and Lesson 2 paintings. |
| Teens L1 + Teens character library | `public/curriculum/zad-teens/l01/` (13 scenes: doors, canteen, bus, madinah, stranger, cushions, courtyard, noor-room, walk-away, footprints, corridor, zayn-desk, science) and `public/curriculum/zad-teens/characters/` (19 poses) | Owner, ChatGPT, 2026-10-22 (prompts in `style/teens.md`); converted to WebP by Claude | 4:3. Characters arrived transparent and were cropped. A trainer logo on both Ethan images was painted out by Claude. Open: the doors show six-pointed stars and four Madinah scenes show minarets (both flagged to the owner). |
| Teens L2 | `public/curriculum/zad-teens/l02/`: cover, kitchen, newborn, pitch, bench, gaming (.webp) | Owner, ChatGPT, 2026-10-22 (prompts in `style/teens.md` Step 4); converted to WebP by Claude | `gaming`: ChatGPT drew the three game "gods" as women in revealing outfits; Claude blurred the top of the TV into soft lights (sea, sky, sun) so no body shows. `bench`: trainer logo painted out. |
| Teens L3 | `public/curriculum/zad-teens/l03/`: cover, likes, prayer, library (.webp) | Owner, ChatGPT, 2026-10-22 (prompts in `style/teens.md` Step 5; files from `watazawwado-archive/`); converted to WebP by Claude | 4:3, used unchanged. |

## G. Science facts (reference only)

Facts are not owned; we write them in our own words and never copy text or images.

| Source | Link | Use | Checked | Decision |
|---|---|---|---|---|
| San Diego Zoo Wildlife Alliance, "Camel" | https://animals.sandiegozoo.org/animals/camel | Camel facts for Lesson 2 (eyelid, eyelashes, nostrils, feet, water) | 2026-10-18 | Facts only, own words |
| NASA Science, "Universe: Overview" | https://science.nasa.gov/universe/overview/ | "Around 13.8 billion years ago": the universe's beginning (Teens L2) | Read 2026-10-22; fact only, no text copied | Allowed (fact) |

## F. Files the owner needs to download

None yet. Requests will list: name, official link, why, exact pages/chapters, what is extracted.

## H. Course books (scope only, owner's copies, 2026-10-25)

Local folder `C:\Users\ahmed\Documents\watazawwado-sources\` (never committed). All are copyrighted: we take scope,
order and facts; never their wording, exercises, dialogues or illustrations (RULES §1.4). Design:
`docs/superpowers/specs/2026-10-25-subjects-curricula-design.md`.

| Folder | Books | Role |
|---|---|---|
| `literacy` | Arabic Bilqalam (241 slides), Nour al-Bayan (modern ed.), Fath ar-Rahman, Steps for writing the letters | Literacy A/B order, drills, stroke order (Bilqalam: inspiration only) |
| `tajweed` | Jannat al-Quran Arabic & Tajweed / Tajweed Books 1, 2, 4; Taysir ar-Rahman (Su'ad Abdul-Hamid) | Literacy B, Tajweed levels; Taysir to check accuracy |
| `fusha` | Madinah Arabic Reader 1–6, 8; Lughatuna al-Fusha 2–3; Jannat Quranic Arabic 1–3 | Fusha levels 1–3 |
| `egyptian` | Kallimni 'Arabi: Bishweesh, Kallimni, Aktar, Mazboot, fi Kull Haaga; Egyptian Colloquial; ECA for the Advanced Learner 1–3 | Egyptian (Arabic script and Franco) |
| `english\phonics`, `english\jolly-phonics-stories` | Oxford Phonics World 1–2 (SB, WB); 67 Jolly Phonics readers | English Kids |
| `english\courses` | English File 4th ed. Beginner/Elementary/Intermediate; English for Everyone (grammar, vocabulary); Vocabulary in Use Elementary; Complete IELTS 4–5, 5–6.5, 6.5–7.5 | English general and exams |
| `english\method-grammar` | How to Teach Grammar/Reading/Vocabulary Like a Pro; English Grammar: A University Course; Academic Writing Course | Teacher method, grammar reference |
| `seerah` | The Sealed Nectar (Ar-Raheeq al-Makhtum, English); owner's deck Episode 1 | Seerah facts; the deck is the owner's own design model |
| `reference-islamic` | Minhaj al-Muslim vol. 1; Jannat Islamic Studies 1–4 | Reference only (Zad, Scholar's Path later) |
