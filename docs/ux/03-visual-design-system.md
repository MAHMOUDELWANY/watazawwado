# WATAZAWWADO — VISUAL DESIGN SYSTEM FOUNDATION

## 1. Design Philosophy
Watazawwado employs a **Warm Premium Education** aesthetic. The design prioritizes humanity, trustworthiness, and calmness. We intentionally avoid excessive glassmorphism, heavy shadows, "SaaS-y" deep purples/neons, and hyper-rounded bubbly interfaces. The result feels structured, serious (without being corporate), and welcoming. 

## 2. Color System
We moved away from hardcoded hex values in scattered components toward a unified semantic token system powered by Tailwind CSS v4 variables mapped directly into the `@theme` directive.

### Semantic Color Roles (Light / Dark)
- **Background (`--background`)**: `#F8F6F0` / `#1A1C1A` — A warm ivory / deep neutral foundation.
- **Foreground (`--foreground`)**: `#30332F` / `#EFEFEF` — Deep charcoal / soft off-white text.
- **Surface (`--surface`)**: `#FFFFFF` / `#242724` — Primary card and modal backgrounds.
- **Surface Subtle (`--surface-subtle`)**: `#F0EDE6` / `#2C302C` — Secondary sections or muted blocks.
- **Muted (`--muted`)**: `#EDEAE1` / `#2C302C` — Disabled or low-emphasis backgrounds.
- **Muted Foreground (`--muted-foreground`)**: `#6B6965` / `#989B98` — Helper text, placeholders, and secondary text.
- **Border (`--border`)**: `#D5D3CC` / `#3A3E3A` — Standard dividers and input borders.
- **Primary (`--primary`)**: `#8FAE9B` — The signature calm sage green.
- **Secondary (`--secondary`)**: `#D9CBB8` / `#3D3E3A` — Warm taupe/gold accents.
- **Destructive (`--destructive`)**: `#D16D6A` — Soft brick red for errors or deletions.
- **Success (`--success`)**: `#6B8E70` — Deeper forest green for positive states.
- **Warning (`--warning`)**: `#DE9B61` — Warm amber/ochre for alerts.
- **Focus (`--focus`)**: `#8FAE9B` — Used for keyboard accessibility focus rings.

## 3. Typography References
(Refer to `02-typography-and-rtl.md` for in-depth scales).
- **Primary Sans:** Plus Jakarta Sans (En) / IBM Plex Sans Arabic (Ar)
- **Display Serif:** Fraunces (En) / Amiri (Ar)

## 4. Spacing Scale
We utilize Tailwind's default harmonious scale (4px increments, e.g., 4, 8, 12, 16, 20, 24, 32). This guarantees consistent rhythm for paddings (`p-*`) and margins (`m-*`) across both RTL and LTR orientations by using logical properties (`ps`, `pe`, `ms`, `me`).

## 5. Radius Scale
To maintain a premium, structured feel (avoiding overly bubbly or harsh square aesthetics):
- **Sm (`rounded-sm`)**: Checkboxes, small tags (6px)
- **Md (`rounded-md`)**: Standard buttons, inputs (8px)
- **Lg (`rounded-lg`)**: Cards, dropdowns, popovers (12px)
- **Xl (`rounded-xl`)**: Modals, large feature blocks (16px)
- **Full (`rounded-full`)**: Badges, avatars, pills.

## 6. Elevation / Shadow Scale
Shadows are used sparingly. We prefer border separation or subtle background contrasts over heavy drop-shadows.
- **`shadow-sm`**: Default card elevation and buttons.
- **`shadow-md`**: Floating dropdowns, navigation headers when scrolled.
- **`shadow-lg`**: Modals and major focused overlays.
- Heavy offset shadows are avoided.

## 7. Component Systems Established

### Buttons (`src/components/ui/Button.tsx`)
A unified `Button` component replaces scattered button classes.
- **Variants:** `primary`, `secondary`, `ghost`, `destructive`, `outline`, `link`.
- **Sizes:** `sm`, `md`, `lg`, `icon`.
- **States:** Includes standard `disabled` opacity and a built-in `isLoading` state (with a spinning loader that correctly margins for RTL/LTR).

### Form Controls (`src/components/ui/Input.tsx`, `Label.tsx`)
- **Inputs** default to 11px height (`h-11`) ensuring comfortable mobile touch targets.
- Features unified focus rings (`focus:ring-2 focus:ring-focus`).
- Includes visual `error` prop support (turns borders/focus rings red).

### Cards (`src/components/ui/Card.tsx`)
Structured with sub-components for consistent anatomy:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- Adheres to `rounded-lg`, `border-border`, and `bg-surface`.

### Badges / Status (`src/components/ui/Badge.tsx`)
- Variants matching the semantic palette: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`.
- Pill-shaped (`rounded-full`) with reduced padding and text scale (`text-xs`).

## 8. Iconography Rules
- We use **Lucide React**.
- Stroke width should ideally remain constant (typically 2px).
- **RTL Mirroring:** Icons representing strict direction (like `ArrowRight`, `ChevronRight`) should utilize `rtl:-scale-x-100`. Universal concepts (Check, Calendar, User, Search) do NOT flip.

## 9. Responsive Principles
- Desktop breakpoints (`lg:`, `xl:`) provide additional grid columns and wider padding (`max-w-7xl mx-auto`).
- Mobile breakpoints assume full-width stacked blocks. Horizontal scrolling is rigorously suppressed (except for intentional swiping carousels, hiding scrollbars).
- Minimum 44px equivalent heights for primary tappable areas are enforced.

## 10. Light / Dark Theme Principles
Dark mode acts as an inversion of the light mode palette, keeping the same hue DNA (warm deep neutrals rather than pure black `#000000`). Text contrast is softened (`#EFEFEF` instead of `#FFFFFF`) to reduce eye strain in low-light contexts.

## 11. Accessibility Rules
- **Contrast:** Verified WCAG AA.
- **Focus:** The global `focus:ring-focus` utility provides a visible ring around active inputs/buttons for keyboard users.
- **Touch Targets:** Modals, Buttons, and Inputs are sized adequately.

## 12. RTL / LTR Rules
- We enforce logical properties throughout the UI layers (`ms-*`, `me-*`, `ps-*`, `pe-*`).
- `Button` loading spinners utilize `rtl:ml-2 rtl:mr-0` to position correctly next to Arabic text.

## 13. Component Reuse Rules
- Engineers should **not** write raw HTML `<button>` or `<input>` tags for standard UI blocks. They must import from `src/components/ui/`.
- This ensures universal compliance with dark mode, RTL, and accessibility requirements.
