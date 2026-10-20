# Milestone Celebration & Social Recognition System

**Date**: 2026-10-20  
**Status**: Design  
**Approved by**: the owner (2026-10-20, in chat)  
**Target**: PR-04 (student progress page), with hooks for PR-06 (teacher post-lesson) and future parent/community features

---

## Intent

Build a celebration system that recognizes learner achievements in a way that feels authentic to Islamic pedagogy, respects cultural sensitivities, motivates continued effort without creating unhealthy pressure, and adapts to the learner's age and the seasonal Islamic context.

### Why Now

The progress page (PR-03) shows the learning path and current level, but it doesn't celebrate the moment of reaching a milestone. Research shows that **immediate acknowledgment** strengthens intrinsic motivation (Deci & Ryan, self-determination theory), and **progress visualization** sustains long-term engagement (goal gradient effect, Kivetz et al. 2006). Islamic educational tradition has always recognized achievement through **verbal praise** and **symbolic recognition** — we're translating that into a digital experience that feels warm, not gamified.

---

## Goals

1. **Celebrate milestones authentically**: use Islamic framing (du'a, praise), quiet dignity for adults, playful warmth for children.
2. **One-time celebration**: the full animation plays once per milestone (first visit to the progress page after it's earned), then settles into a permanent shelf.
3. **Age-appropriate tone**: different animation style and wording for Kids (7–11), Teens (12–17), Adults (18+).
4. **Seasonal awareness**: celebration text and emblem styling adapt to Ramadan, Dhul Hijjah, Eids.
5. **Social recognition at two levels**:
   - **Teacher's class leaderboard**: effort-based (lessons attended, weekly rhythm, milestones), visible to that teacher's students only.
   - **Academy-wide Hall of Honor**: major achievements (Tier 1) published on the website and community channels (WhatsApp/Facebook/Telegram), with **explicit consent** from parent or adult learner.
6. **Privacy-first**: consent required for public posting, optional avatar for girls/women, no country shown.
7. **Parent engagement**: parents receive immediate notification when their child earns a milestone, and see a parent-specific celebration (more detailed, calmer) when they open the progress page.
8. **Family achievements**: recognize when an entire family collectively reaches a milestone (e.g., 100 lessons combined).

---

## Non-Goals

- ❌ **Ability-based competition** ("fastest memorizer") — only effort-based metrics.
- ❌ **Rank-focused leaderboard** ("you are 5th") — instead, "you are all striving together in goodness."
- ❌ **Celebration for every tiny step** — dilutes the meaning of real milestones.
- ❌ **Auto-posting achievements without consent** — child safety and cultural sensitivity require explicit opt-in.
- ❌ **Photos of girls/women without their choice** — always offer avatar alternative for Teens/Adults (fئة 2 & 3).

---

## Anti-Goals (What Would Make This a Failure)

- Families feel the academy is pushing their children into unhealthy competition or comparison.
- Celebrations feel like AI slop or generic gamification (badges from a SaaS onboarding flow).
- Girls/women feel uncomfortable because their photo was published without consultation.
- A child's achievement is posted publicly and the family didn't consent.
- The system creates **hasad** (envy) instead of **tanafus** (striving together in goodness).

---

## Constraints

- **Technical**: localStorage tracks last-seen milestone per learner (so a parent with multiple children doesn't miss any child's celebration). Works offline (celebration plays even if API is slow).
- **Performance**: emblem SVGs are inline (<10KB each), animations use `transform` and `opacity` only (GPU-accelerated), respect `prefers-reduced-motion`.
- **Bilingual**: all text in Arabic and English.
- **Accessibility**: keyboard-navigable, screen-reader announcements for milestone earned.
- **Free tools only**: no paid animation library or illustration packs.

---

## User Roles & Permissions

| Role | Responsibility |
|------|----------------|
| **Teacher** | Records milestone after lesson (PR-06 already built). For Teens/Adults female students, asks preferred name and whether to use avatar instead of photo. |
| **Super Admin** | Approves Tier 1 milestones for Hall of Honor publication. Requests consent from parent (for child) or learner (if adult). |
| **Parent/Guardian** | Receives immediate email/notification when child earns milestone. Consents to public posting (yes with photo, yes without photo, or no). |
| **Adult Learner** | Decides for themselves (posting and photo). |

---

## Milestone Tiers

### Tier 1: Hall of Honor (Academy-Wide, Public)

**Major, qualitative achievements** that deserve community-wide recognition:

#### Quran:
- Complete memorization of a juz (30 pages)
- Memorization of a long surah (3+ pages): Al-Kahf, Maryam, Yasin, etc.
- Mastery of all tajweed rules (certified by teacher)

#### Zad Essentials (Our curriculum: Kids/Teens/Adults tracks):
- Completion of the entire Zad Path (all units for that age group)
- Mastery of the Tawheed unit
- Completion of Seerah from birth of the Prophet ﷺ to his passing

#### Seerah:
- Completion of the full Seerah journey (Makkan → Madinan → Battles → Farewell)

#### Languages (Arabic Fusha, Egyptian Arabic, English):
- Completion of 5 units (sustained progress)
- Passing a full-level exam (certified proficiency jump)

#### Rhythm (Consistency):
- 52-week streak (full year without missing a week)
- 100 lessons lifetime
- 200 lessons lifetime

### Tier 2: Teacher's Class (Visible to Teacher's Students Only)

**Intermediate achievements** that matter within the learning circle:

#### Quran:
- Memorization of a medium surah (2 pages)
- Mastery of a single tajweed rule

#### Zad Essentials:
- Completion of one unit
- Mastery of one lesson

#### Seerah:
- Completion of one phase (Makkan period, Madinan period, Battles)

#### Languages:
- Completion of one unit
- Demonstrated skill in one area (reading, writing, conversation)

#### Rhythm:
- 4-week streak (one month consistent)
- 25 lessons lifetime

---

## Celebration Experience (Age-Appropriate)

### Kids (7–11 years): Playful & Warm

**Animation**:
- Emblem rises from bottom with a gentle **bounce** (spring physics: `type: "spring", stiffness: 200, damping: 15`)
- **Golden glow** pulses outward (radial gradient, `animate opacity 0 → 0.6 → 0`)
- **Confetti** (20–30 small geometric shapes: stars, crescents) falls gently, fades out
- Duration: **2 seconds**

**Text**:
- Arabic: **"ماشاء الله! أحسنت يا بطل!"** (boy) / **"ماشاء الله! أحسنتِ يا بطلة!"** (girl)
- English: **"MashaAllah! Excellent work, champion!"**

**Sound**:
- **None.** The backlog's Islamic adab rule forbids music; we do not ship celebration sounds.

---

### Teens (12–17 years): Balanced & Respectful

**Animation**:
- Emblem **rises smoothly** from center (no bounce)
- **Golden glow** appears as a soft halo (no pulsing)
- **No confetti**
- Duration: **1.5 seconds**

**Text**:
- Arabic: **"بارك الله فيك، إنجاز رائع"** / **"ماشاء الله، تقدم ممتاز"**
- English: **"BarakAllahu feek, excellent achievement"**

**Sound**:
- **None**

---

### Adults (18+ years): Minimal & Dignified

**Animation**:
- Emblem **fades in** (no upward motion)
- **Soft golden glow** (static, no animation)
- **No confetti**, no bounce
- Duration: **1 second**

**Text**:
- Arabic: **"تقدم ملحوظ، نسأل الله القبول"** / **"بارك الله فيك"**
- English: **"Notable progress — may Allah accept it from you"**

**Sound**:
- **None**

---

## Seasonal Adaptation

The celebration text and emblem styling adapt to the Islamic calendar:

| Season | Emblem Addition | Text Suffix (Arabic) | Text Suffix (English) |
|--------|-----------------|----------------------|-----------------------|
| **Ramadan** | Subtle crescent in background glow | "تقبل الله منك في هذا الشهر المبارك" | "May Allah accept from you in this blessed month" |
| **Dhul Hijjah (first 10 days)** | Faint Kaaba silhouette in bg | "بارك الله فيك في هذه الأيام المباركة" | "May Allah bless you in these blessed days" |
| **Eid al-Fitr / Eid al-Adha** | - | "كل عام وأنت بخير، تقبل الله منا ومنك" | "Eid Mubarak — may Allah accept from us and you" |
| **Rest of year** | - | (standard text per age group) | (standard text per age group) |

**Implementation note**: The backend (`GET /api/student/progress`) includes a `currentIslamicSeason` field (computed server-side from Hijri calendar). The frontend selects the appropriate text variant.

---

## Emblem Design (8–12 SVGs, 96×96, Islamic House Style)

Each emblem is a **custom SVG** in Watazawwado's visual language:
- **Palette**: Gold (`#E5A93C`), Teal (`#087D91`), Paper (`#FAF7F2`), Ink (`#8B4935`)
- **Geometry**: Islamic patterns (arabesque, geometric tessellations), no figurative imagery
- **Style**: Hand-drawn feel (not perfectly symmetrical), warm and inviting

### Emblem Examples (Builder designs the full set):

1. **Quran Completion (Juz)**: Open Mushaf with geometric border, gold spine
2. **Tajweed Mastery**: Stylized Arabic letter with tajweed marks (hamza, madd, ghunnah symbols)
3. **Seerah Journey**: Minaret silhouette with crescent, or date palm (Madinah reference)
4. **Zad Path Complete**: Lantern (fanoos) glowing, or an open book with light rays
5. **Language Proficiency**: Calligraphic letter (ا for Arabic, A for English) in decorative frame
6. **Rhythm Streak (4 weeks)**: Four crescents in a row
7. **Rhythm Streak (52 weeks)**: Full calendar wheel with 52 segments, all lit
8. **100 Lessons**: Number "100" in Arabic calligraphic style, with laurel-like geometric pattern

The **Achievements Shelf** shows:
- **Earned emblems**: full color, glowing slightly on hover
- **Next reachable emblems**: outline only (stroke, no fill), with tooltip: "Earn this by: [description]"

---

## Parent Experience

When a **child** earns a milestone:

### 1. Immediate Notification
- **Email** (Brevo): "أحمد حقق إنجازاً جديداً: حفظ سورة الكهف 🎉" / "Ahmed earned a new milestone: Memorized Surah Al-Kahf 🎉"
- **Optional SMS** (if parent provided phone and opted in — not in PR-04, future feature)

### 2. Parent-Specific Celebration (When Parent Opens Progress Page)
Instead of the playful kid animation, parent sees:

**A detailed card**:
- Header: "أحمد حقق إنجازاً جديداً منذ يومين" / "Ahmed earned a new milestone 2 days ago"
- Emblem (same as child saw, but static — no animation)
- Details:
  - "أتم 10 دروس هذا الشهر" / "Completed 10 lessons this month"
  - "تقدم ممتاز في أحكام التجويد" / "Excellent progress in tajweed rules"
  - "معلّمه يشيد بانتظامه وحماسه" / "His teacher praises his consistency and enthusiasm" (the teacher's own words from the family summary, never invented)
- **Progress chart**: bar chart showing lessons per month for last 3 months
- Button: **"شارك هذا الإنجاز"** / **"Share this achievement"** (see Consent Flow below)

---

## Teacher's Class Leaderboard

**Visible on**: Teacher dashboard (future — not PR-04), and optionally in student portal (under a "Your classmates" section, if teacher enables it)

**Shows** (for that teacher's students only):
- Current weekly rhythm streak
- Lessons this month
- Total lessons (lifetime)
- Milestones earned

**Ordered by**: Effort (lessons attended), not speed or ability

**Framing**: Top of the leaderboard says:
- Arabic: **"نتنافس في الخير — وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ"** (Quran 83:26)
- English: **"Striving together in goodness — for this let the competitors compete"**

**No explicit ranks**: instead of "1st, 2nd, 3rd", show:
- "Leading this month: Ahmed (15 lessons), Sara (14 lessons), …"
- Or just list names in order without numbers

---

## Hall of Honor (Academy-Wide, Public)

**URL**: `https://watazawwado.academy/hall-of-honor` (new page, not in PR-04)

**Shows**: Tier 1 milestones only, after consent granted

### Entry Format:

```
[Photo/Avatar] [Name]
حفظ جزء عمّ كاملاً
Memorized Juz 'Amma in full

اللهم تقبل منه ومن جميع طلاب الأكاديمية
May Allah accept from him and all students of the academy

[Date: October 2026]
```

**Pinning**: The most recent Tier 1 achievement stays **pinned at the top** until another Tier 1 achievement in the same category is posted (e.g., another Quran juz completion replaces it, but a Seerah completion doesn't).

**Community Posting**: Super Admin manually posts to WhatsApp/Facebook/Telegram groups (copy-paste format provided by the system, not auto-posted — keeps it human and intentional).

---

## Consent & Privacy Flow

### For Children (under 18):

1. **Teacher records milestone** in post-lesson form (PR-06, already built)
2. **System checks**: Is this Tier 1? → Yes
3. **Super Admin receives notification**: "Ahmed earned Tier 1 milestone: Memorized Surah Al-Kahf. Request consent for Hall of Honor?"
4. **Super Admin contacts parent** (via email or direct message):
   - "Would you like Ahmed's achievement to be featured in our Hall of Honor (website and community channels)?"
   - Options:
     - ✅ **Yes, with photo**
     - ✅ **Yes, with avatar** (emblem or neutral illustration)
     - ❌ **No, keep it private**
   - "What name would you like displayed? (full name, first name only, or a nickname)"
5. **Parent responds** → Super Admin marks consent in the system
6. **If approved**: achievement goes live on Hall of Honor page

### For Adults (18+):

- Same flow, but Super Admin asks the **learner directly** (not parent)

### For Teens/Adult Females (Fئة 2 & 3):

- **Teacher asks during lesson**: "Would you like your photo shown if your achievement is featured, or would you prefer an avatar?"
- Teacher records preference in the system

---

## Family Achievements

When the **entire family** collectively reaches a milestone (e.g., 100 lessons combined, or every child completed a unit):

**Celebration**:
- Appears on parent's progress page (family overview, PR-07 already built)
- Emblem: **Family tree** or **Multiple lanterns** (one per child)
- Text:
  - Arabic: **"ماشاء الله! أسرة [اسم الأسرة] أتمت 100 درساً معاً"**
  - English: **"MashaAllah! The [Family Name] family completed 100 lessons together"**

**Tier**: Always **Tier 1** (Hall of Honor eligible, but requires consent from *all* family members if photos are involved)

---

## Technical Implementation (Left to Builder)

### Storage:
- **localStorage key**: `watazawwado_last_seen_milestone_{learnerId}` (stores the `id` of the last milestone the user saw celebrated)
- **API response**: `GET /api/student/progress` already includes `milestones[]` (PR-02 built this). Add:
  - `currentIslamicSeason: "ramadan" | "dhul-hijjah" | "eid-fitr" | "eid-adha" | "normal"`
  - `unseenMilestones: []` (milestones earned since last visit — computed server-side by comparing `milestones[].reached_at` with a `last_progress_visit` timestamp stored in `student_accounts`)

### Animation:
- **Motion library**: Already using `motion` (Framer Motion fork). Use `<motion.div>` with `initial`, `animate`, `exit` props.
- **Reduced motion**: Check `const prefersReduced = useReducedMotion()` (Motion hook). If `true`:
  - Skip all animations (emblems appear instantly)
  - Show static "New milestone earned" card instead

### Sound:
- None (no music, per the backlog's Islamic adab rule).

### Emblems:
- **Inline SVG components** (not `<img>` tags — allows dynamic color theming for dark mode)
- Store in `src/student/components/emblems/` (e.g., `QuranJuzEmblem.tsx`, `TajweedMasteryEmblem.tsx`)
- Each emblem accepts `active: boolean` prop (full color vs outline)

### Achievements Shelf:
- **Grid layout**: CSS Grid, responsive (4 columns on desktop, 2 on mobile)
- **Earned emblems**: `opacity: 1`, slight glow on hover (box-shadow with gold color)
- **Locked emblems**: `opacity: 0.3`, stroke-only, tooltip on hover: "حفظ 5 أجزاء لكسب هذا الوسام" / "Memorize 5 juz to earn this emblem"

---

## Builder Decisions (Yours to Make)

- Exact spring physics values (if age-group presets don't feel right, tweak them)
- Which 8–12 specific milestones get emblems (I listed examples; you pick the final set based on what data model supports and what feels complete)
- Confetti particle count and colors (keep it subtle)
- Whether to show a "Skip celebration" button (recommended for Teens/Adults, so they can dismiss it if in a hurry)
- Celebration modal vs inline (I'm guessing **modal** overlay for the first-time celebration, then emblem settles into the shelf — but inline could work too if it doesn't disrupt the page flow)

---

## Success Metrics (Owner Will Track Post-Launch)

- **Learner retention**: do students with milestones celebrated have higher weekly rhythm in the following month?
- **Parent engagement**: do parents open the progress page more often after receiving milestone notifications?
- **Community sentiment**: do families feel the Hall of Honor is inspiring, or does it create pressure? (qualitative feedback via WhatsApp groups and direct messages)
- **Consent rate**: what % of parents consent to Tier 1 posting? (if low, investigate: is it unclear, or do they genuinely prefer privacy?)

---

## What's Out of Scope (Not PR-04)

- ❌ **Teacher's class leaderboard page** (future: `TeacherClassLeaderboard.tsx`)
- ❌ **Hall of Honor page** (`HallOfHonorPage.tsx`) — just the celebration experience in PR-04
- ❌ **Super Admin consent workflow UI** (manual for now: Super Admin sends email, marks consent in a Google Sheet or Notion; future: `SuperAdminConsentDashboard.tsx`)
- ❌ **Family achievement auto-detection** (requires new backend logic to sum lessons across family members; can be added later)

---

## Next Steps

After this design is approved:
1. **Builder writes implementation plan** (using `superpowers:writing-plans` skill)
2. **Builder designs the 8–12 emblem SVGs** (or uses the existing 6 from PR-03 as a starting point and adds more)
3. **Builder implements PR-04**: celebration experience + achievements shelf on `StudentProgressPage.tsx`
4. **Future PRs** will add: Hall of Honor page, Teacher leaderboard, Super Admin consent UI, Family achievements

---

**End of Design Document**
