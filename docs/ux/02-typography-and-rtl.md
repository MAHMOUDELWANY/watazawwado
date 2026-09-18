# WATAZAWWADO — TYPOGRAPHY & RTL FOUNDATION

## 1. Current Implementation Audit
- **Current Arabic Font:** `IBM Plex Sans Arabic` (Primary UI), `Amiri` (Display)
- **Current English Font:** `Plus Jakarta Sans` (Primary UI), `Fraunces` (Display)
- **Font Loading Method:** Google Fonts (`<link>` in `index.html`) using `display=swap` for performance.
- **Current Font Weights:** 
  - `Amiri`: 400, 700
  - `Fraunces`: Variable 300..600
  - `IBM Plex Sans Arabic`: 300, 400, 500, 600, 700
  - `Plus Jakarta Sans`: 300, 400, 500, 600, 700
- **RTL Strategy:** `[dir="rtl"]` selector applies `var(--font-arabic)` directly on the root/components, effectively switching the base font.

## 2. Final Font Selection
- **Primary UI (Sans):** `Plus Jakarta Sans` (English) + `IBM Plex Sans Arabic` (Arabic)
- **Display / Editorial (Serif):** `Fraunces` (English) + `Amiri` (Arabic)

## 3. Font Sources & Licenses
- **Sources:** Google Fonts
- **Licenses:** All selected fonts (Plus Jakarta Sans, IBM Plex Sans Arabic, Fraunces, Amiri) are open-source and licensed under the SIL Open Font License (OFL), which permits commercial and product use.

## 4. Font Loading Strategy
- Preconnect tags to `fonts.googleapis.com` and `fonts.gstatic.com` are used.
- `display=swap` is utilized to ensure text remains visible while web fonts load.
- Only the specific required weights (300-700) are requested to minimize payload.

## 5. Weight Strategy
- **400 (Regular):** Body text, secondary labels.
- **500 (Medium):** Standard buttons, active tabs, prominent secondary text.
- **600 (SemiBold):** Section headings, primary buttons, highlighted numbers.
- **700 (Bold):** Major hero headings, strong emphasis (used sparingly).

## 6. Type Scale (Semantic)
Watazawwado uses a semantic scale (powered by Tailwind's defaults) applied carefully:
- **Display:** `text-4xl` / `text-5xl` (36px - 48px) — Used for Hero sections.
- **H1:** `text-3xl` (30px) — Page titles.
- **H2:** `text-2xl` (24px) — Section titles.
- **H3:** `text-xl` (20px) — Card titles, modal headers.
- **Body:** `text-base` (16px) — Primary reading text.
- **Body-sm / Label:** `text-sm` (14px) — Secondary reading text, input labels.
- **Caption:** `text-xs` (12px) — Tertiary information, fine print.

## 7. Line Heights
- **English:** Default Tailwind line-heights (1.5 for body, 1.2-1.3 for headings).
- **Arabic:** A global override of `1.7` is applied via `[dir="rtl"]` to comfortably clear the taller ascenders, descenders, and diacritics of `IBM Plex Sans Arabic` and `Amiri`. Headings should ideally be scaled to `1.4` or `1.5` for Arabic.

## 8. Letter-Spacing Rules
- **English:** Subtle negative tracking (`tracking-tight`) is acceptable for large Display/H1 headings. Subtle positive tracking (`tracking-wide`) is acceptable for uppercase micro-labels.
- **Arabic:** **NEVER** apply tight/negative letter-spacing to Arabic. A CSS rule has been added to globally reset Tailwind's tracking classes to `normal` when `[dir="rtl"]` is active.

## 9. RTL Rules
- **Layout:** Flex and grid layouts automatically mirror when using logical properties (e.g., `ms-4` instead of `ml-4`, `ps-4`, `pe-4`).
- **Icons:** Directional icons (arrows, chevrons) must be flipped horizontally in RTL contexts (`rtl:-scale-x-100`).
- **Do NOT Mirror:** Logos, photographs, media controls, LTR-specific strings (emails, URLs).

## 10. Mixed-Direction Rules
When mixing Arabic and English/Numbers (e.g., "Saturday · 7:00 مساءً" or "EGP 1,200"):
- Use bidirectional isolation (`<span dir="ltr">`) for strict LTR strings like phone numbers, LTR brand names, or specific currency formats embedded within Arabic text.
- Ensure the trailing punctuation in mixed strings remains logically placed by utilizing proper HTML bidi attributes (`dir="auto"` or `&lrm;` / `&rlm;` markers if absolutely necessary).

## 11. Form & Button Rules
- **Forms:** Inputs must use 16px minimum text size to prevent iOS Safari auto-zoom. Arabic placeholders must not be vertically clipped; ensure padding accommodates the 1.7 line-height.
- **Buttons:** Use `text-base` or `text-sm` with `font-medium`. Padding must be symmetric and account for Arabic's optical center.

## 12. Dark-Mode Rules
- **Contrast:** The text color palette transitions from `#362E3B` (light mode) to `#F5E6D3` (dark mode). 
- **Subtle Text:** Muted text uses `#6B5B73` (light) and `#D5D0CA` (dark).
- Gray-on-gray combinations are strictly forbidden to maintain readability.

## 13. Accessibility Rules
- WCAG AA contrast ratio is enforced across all text elements.
- Touch targets on mobile interfaces are a minimum of 44x44px.
- Focus rings remain enabled and visible for keyboard navigation.

## 14. Performance Rules
- Font requests are batched into a single Google Fonts URL.
- Variable fonts (`Fraunces`) are used where possible to reduce HTTP requests.

## 15. Real Watazawwado Specimen
### English (Plus Jakarta Sans)
- **H1:** Ready for your next lesson?
- **Body:** Choose what works for you.
- **Action:** Book this lesson again

### Arabic (IBM Plex Sans Arabic)
- **H1:** جاهز للدرس الجاي؟
- **Body:** اختار خطة التعلم اللي تناسبك.
- **Action:** احجز نفس الدرس تاني

### Mixed
- `Qur'an — 45 دقيقة`
- `<span dir="ltr">EGP 1,200</span>`

## 16. Rejected Alternatives
- *Cairo + Poppins:* Rejected because it feels too generic and lacks the editorial maturity needed for the "Serious + Professional" aspect of Watazawwado.
- *Reem Kufi:* Rejected for UI usage as it is strictly a display face and severely harms dense UI readability.
