# Section 08-B: Student Profile & Account Visual UX Refinement

## 1. Overview & Purpose
This document records the visual and structural refinement of the **Student Profile & Account / Settings** experience (`src/student/pages/StudentProfilePage.tsx`).

The refinement brings the student's profile space into full alignment with the **Warm Premium Education** design system of Watazawwado, reinforcing a calm, trustworthy, personal 1-on-1 teaching environment centered around Ustadh Mahmoud.

---

## 2. Information Architecture & Visual Hierarchy

The refined page layout is organized into three balanced visual tiers:

### Tier 1: Identity & Overview Header
- **Profile Context**: Prominent student initial avatar with warm sage styling (`bg-primary/15 border-primary/25 text-primary font-serif font-bold`).
- **Student Identity**: Full name rendered in refined serif typography (`font-serif font-bold`), coupled with account type badge (`Parent Account` or `Student`).
- **Account Metadata**: Displays email and enrollment date (`Member since / تاريخ التسجيل`) formatted via Luxon.
- **Learner Track Badge**: Understated outline badge displaying learner category (Adult/Child) and level (e.g. Beginner).

### Tier 2: Feedback & Status Container
- Dedicated, accessible alert regions (`role="alert"` / `role="status"` with `aria-live="polite"`) providing immediate, calm feedback upon save operations.

### Tier 3: Asymmetric Responsive Workspace (2/3 + 1/3)
- **Left Column (Primary Workspace - 2 cols on lg)**:
  - **Personal Details**: Form controls for Full Name, Account Email (disabled, clearly marked as managed by Supabase Auth), Timezone (IANA) with device detection helper ("Use device timezone"), WhatsApp number with country placeholder, and Country.
  - **Default Booking Preference**: Two interactive radio cards allowing students to toggle between booking for *Myself* and *My Child*, with authoritative backend-gated disabling for child bookings when no linked child/guardian relationship exists.
  - **Save Action**: Elevated primary button with save icon, loading spinner, and minimum 44px touch target.
- **Right Column (Contextual Cards - 1 col on lg)**:
  - **Your Teacher / المعلّم المباشر**: Dignified presentation of Ustadh Mahmoud and the 1-on-1 pedagogical model across Quran, Tajweed, Islamic studies, and Arabic. No fake metrics, no artificial chats.
  - **Learning Track & Goals**: Authoritative display of learner type, current level, primary subject, and student's personal learning goal.
  - **Registered Children / Guardian Context**: Dynamically presented if linked children exist or if the profile belongs to a child learner with guardian records.
  - **Account & Preferences**: Direct controls for interface language (English / العربية), visual theme (Light / Dark mode using centralized `ThemeProvider`), account security summary, and sign-out.

---

## 3. Design System & Token Alignment

All hardcoded color anti-patterns (such as raw `emerald-*`, `rose-*`, `amber-*`, and `bg-black/*`) were audited and replaced with semantic tokens:

| Element | Semantic Token | Light Mode Value | Dark Mode Value |
| :--- | :--- | :--- | :--- |
| Page Surface | `bg-surface` | `#FFFFFF` | `#1A1C1A` |
| Input & Card Fill | `bg-surface-subtle` | `#F0EDE6` | `#222421` |
| Primary Accent | `bg-primary`, `text-primary` | `#8FAE9B` (Sage) | `#8FAE9B` |
| Primary Text | `text-foreground` | `#30332F` (Deep Charcoal) | `#EDEAE1` |
| Secondary Text | `text-muted-foreground` | `#6B6965` | `#9B9890` |
| Standard Border | `border-border` | `#D5D3CC` | `#363833` |
| Error Alert | `bg-destructive/10`, `text-destructive` | `#D16D6A` | `#E57A77` |
| Success Alert | `bg-success/10`, `text-success` | `#6B8E70` | `#7DA082` |

---

## 4. Logical Properties & RTL / LTR Support

Full bidirectional support is implemented using CSS logical properties:
- **Icon Positioning**: `absolute start-3.5 top-3.5 pointer-events-none` (replaces hardcoded `left-3.5`).
- **Input Padding**: `ps-10 pe-4` (replaces `pl-10 pr-4`).
- **Button Margins**: `me-2` / `ms-2` (replaces `mr-2` / `ml-2`).
- **Bilingual Copy**: Fully localized copy in English and Arabic, maintaining natural pedagogical phrasing (e.g. "إشراف تعليمي شخصي (1-على-1)").

---

## 5. Accessibility & Responsiveness Audit

- **Touch Targets**: All interactive buttons, inputs, and toggles enforce `min-h-[44px]` touch targets.
- **Label Associations**: All inputs use explicit `htmlFor` matching corresponding input `id`s (`student-name`, `student-email`, `student-timezone`, `student-whatsapp`, `student-country`).
- **Device Timezone Helper**: One-click timezone detection via `Intl.DateTimeFormat().resolvedOptions().timeZone` reduces friction for international students.
- **Focus Rings**: Clean focus rings (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`).
- **Responsive Adaptability**: Validated across viewport widths from 320px (iPhone SE) to 1440px (Desktop), with 1-column collapse on mobile and 3-column split on desktop.

---

## 6. Architectural Invariants Preserved
- Preserved single-token auth retrieval via `effectiveSession?.access_token`.
- Preserved API contracts for `GET /api/student/me`, `PATCH /api/student/me`, and `/api/student-auth-diagnostic`.
- Zero local token storage or unauthorized token caching.
- Zero database or schema modifications.
