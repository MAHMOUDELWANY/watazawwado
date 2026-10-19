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

## E. Media

| Source | Link | Licence | Commercial | Attribution | Decision |
|---|---|---|---|---|---|
| Kenney (sound effects, UI assets) | https://kenney.nl | CC0, verified 2026-10-16 | Yes | Not required | **Allowed** |
| Wikimedia Commons | https://commons.wikimedia.org/wiki/Commons:REUSE | Per file | Per file | Per file | Check each file |
| Phosphor / Tabler icons | phosphoricons.com · tabler.io/icons | MIT (to verify) | Expected yes | Keep licence file | To verify |
| Freesound (CC0 filter only) | https://freesound.org | Per sound | CC0 ones yes | — | To verify per sound |
| Storyset | https://storyset.com/terms | Free licence with credit (checked 2026-10-17); modify/animate allowed; no resale or redistribution as files | Yes, with credit | Credit required | **With conditions** (add credit on the curriculum page) |
| ChatGPT image generation (owner's account) | https://openai.com/policies/terms-of-use | Output belongs to the user under OpenAI terms (to verify current text) | Expected yes | Not required | To verify |
| Our own SVG + Motion animations | — | Ours | Yes | — | **Allowed** (preferred) |
| Kenney packs used in the player: Interface Sounds, UI Audio, Impact Sounds (1.0) | https://kenney.nl/assets | CC0 (License.txt in each pack, checked 2026-10-18) | Yes | Not required | **In use** (2026-10-18): 11 clips in `public/curriculum/sfx/` (pop, chime, correct, praise, oops, brick, thud, lock, strike, pen, sparkle), trimmed and converted to mp3. Source clip for each, in that order: drop_002, glass_004, confirmation_002, confirmation_004, error_006, impactPlank_medium_001, impactSoft_heavy_000, switch_003, scratch_004, scratch_005, glass_001 |
| Our own synthesised sound effects (`src/curriculum/slides/sfx.ts`, Web Audio API) | — | Ours, generated in code at play time | Yes | — | **Allowed** (2026-10-18) |

## E2. Lesson images (owner, ChatGPT)

| Lesson | Files | Made | Notes |
|---|---|---|---|
| L2 | `public/curriculum/zad-kids/l02/`: crash, sky, lock, camel, park, boat (.webp) | Owner, ChatGPT, 2026-10-18; compressed to WebP by Claude | `lock-base.webp` (key painted out) and `key.webp` (key cut out) made from `lock.webp` with ffmpeg. Style is more 3D than the gouache base prompt; owner accepted the set. |
| L2 batch 2 | `l02/`: cover, baby, desert-sky, desert-mountains, desert-ground, desert-camel, hand, hand-brick, ladybird, magnifier (.webp); `l01/lego.webp` redone with a gold hijab | Owner, ChatGPT, 2026-10-18; converted to WebP by Claude | ChatGPT painted a fake checkerboard behind the camel and the mountains; Claude keyed it out with ffmpeg (a faint checker texture stays in the camel's fur). `look.webp` retired (replaced by the four desert layers). |
| L3 | `public/curriculum/zad-kids/l03/`: cover, sunrise, recite, masjid-night, dua, football (.webp) and compass (prop) | Owner, ChatGPT, delivered 2026-10-19 (prompts in `zad-essentials-kids/L03-allah-is-one.md`) | 16:9, saved unchanged; compass has transparency. Lesson 3 also reuses `l02/boat.webp` once. |
| Character library | `public/curriculum/zad-kids/characters/` (14 poses: Yusuf ×4, Maryam ×4, Jiddo ×3, Mishmish ×3, .webp with transparency) | Owner, ChatGPT, 2026-10-18; converted to WebP by Claude | Reused in every Kids lesson. Jiddo's face differs a little from the Lesson 1 and Lesson 2 paintings. |

## G. Science facts (reference only)

Facts are not owned; we write them in our own words and never copy text or images.

| Source | Link | Use | Checked | Decision |
|---|---|---|---|---|
| San Diego Zoo Wildlife Alliance, "Camel" | https://animals.sandiegozoo.org/animals/camel | Camel facts for Lesson 2 (eyelid, eyelashes, nostrils, feet, water) | 2026-10-18 | Facts only, own words |

## F. Files the owner needs to download

None yet. Requests will list: name, official link, why, exact pages/chapters, what is extracted.
