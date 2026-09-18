# Global Components and UI Consistency

## 1. Component Inventory

A thorough audit of the frontend identified repeated patterns across the public landing page, student portal, and teacher dashboard. The objective was to centralize these patterns into robust, semantic primitives under `src/components/ui` without breaking existing custom layouts.

**Findings:**
- **Buttons:** Over 220 custom `<button>` implementations were found across the app, along with ~30 `motion.button` instances.
- **Modals:** 13+ slightly varying modal backdrops and containers (e.g., `bg-black/40`, `bg-[#362E3B]/70`, `bg-[#1E1923]/60`) were identified in `GetStartedModal`, `StudentAuthModal`, and various dashboard modals.
- **Form Controls:** Inputs, selects, and textareas shared similar visual styles but lacked a unified implementation (e.g., repeating focus rings, border definitions, and rounded corners).
- **Cards:** Diverse card-like containers were being created inline with repetitive Tailwind classes (`bg-white rounded-2xl shadow-sm border border-[#E2DDD5]`).
- **Badges / Alerts:** Hardcoded colored boxes for warnings, successes, and info alerts were scattered across the codebase.

## 2. Reusable Primitives

All primitives are located in `src/components/ui/` and leverage the semantic theme tokens established in Section 04 and the motion tokens from Section 05.

### Created / Standardized Components:
- `Button.tsx`
- `Input.tsx`
- `Textarea.tsx`
- `Select.tsx`
- `Card.tsx`
- `Badge.tsx`
- `Alert.tsx`
- `Modal.tsx`
- `Label.tsx`

## 3. Button System
- **File:** `src/components/ui/Button.tsx`
- **Variants:** `primary`, `secondary`, `ghost`, `destructive`, `outline`, `link`
- **Sizes:** `sm`, `md`, `lg`, `icon`
- **Behavior:** 
  - Centralized focus states to use `focus-visible:ring-2 focus-visible:ring-focus` for improved accessibility (preventing mouse-click focus rings).
  - Inherits the `transition-all duration-base ease-premium` for smooth hover and active states (`active:scale-[0.98]`).
  - Native loading support via the `isLoading` prop, which smartly injects an RTL-aware spinner (`rtl:ml-2 rtl:mr-0`).

## 4. Form System
- **Files:** `Input.tsx`, `Textarea.tsx`, `Select.tsx`, `Label.tsx`
- **Styling:** Shared consistent border radius (`rounded-md`), background (`bg-surface`), borders (`border-border`), and typography.
- **Focus States:** Replaced aggressive `focus:ring` behaviors with accessible, semantic focus rings using `focus:border-transparent focus:ring-2 focus:ring-focus`.
- **RTL Support:** Standardized padding in `Select` (e.g., `rtl:pr-3 rtl:pl-10`) to properly mirror chevron placement and text spacing.

## 5. Card System
- **File:** `src/components/ui/Card.tsx`
- **Hierarchy:** Implemented a unified `variant` prop for semantic depth.
  - `default`: Standard container (`bg-surface`).
  - `interactive`: Adds hover shadows and subtle border color shifts.
  - `highlighted`: For feature highlights (`bg-primary/5`).
  - `muted`: Subdued container (`bg-surface-subtle`).
  - `status`: Indicator cards with a distinct left border (`border-l-primary`).

## 6. Badge/Status System
- **File:** `src/components/ui/Badge.tsx`
- **Variants:** `default`, `secondary`, `destructive`, `success`, `warning`, `outline`
- **Behavior:** Stripped hardcoded colors in favor of theme-semantic equivalents (`bg-success`, `text-success-foreground`). Standardized focus rings using `focus-visible`.

## 7. Alert/Notice System
- **File:** `src/components/ui/Alert.tsx`
- **Variants:** `info`, `success`, `warning`, `destructive`
- **Behavior:** Replaces inline "colored boxes". Incorporates standard Lucide icons automatically based on variant, using carefully tuned opacities (e.g., `bg-success/10 text-success border-success/20`) adjusted for contrast in both Light and Dark modes.

## 8. Dialog/Modal System
- **File:** `src/components/ui/Modal.tsx`
- **Behavior:** Created a definitive global Modal primitive using `framer-motion` (`AnimatePresence`).
- **Features:** 
  - Standardized backdrop (`bg-black/50 backdrop-blur-sm`).
  - Built-in Escape key listener and body scroll locking.
  - Accessible `role="dialog"` and focus management context.
  - Dynamic `maxWidth` support.
  - Unified header/footer zones and close button behavior.

## 9. Drawer/Sheet System
- **Implementation:** Mobile navigations in `StudentApp` and `DashboardApp`.
- **RTL Integration:** Replaced hardcoded LTR transitions (`-translate-x-full`) with logical RTL-aware transitions (`rtl:translate-x-full ltr:-translate-x-full`) and `start-0` placements to ensure sidebars slide from the correct edge in Arabic.

## 10. Dropdown/Menu System
- Menus and dropdowns rely on semantic UI primitives. The custom popovers (such as language switchers or profile menus) should incrementally adopt the `Card` primitive as their surface foundation.

## 11. Tooltip Policy
- **Policy:** Tooltips are NOT globally implemented as a library, adhering to the project's minimalist approach. Information should remain visible in the UI rather than hidden behind hover states, ensuring mobile touch accessibility.

## 12. Tabs/Accordion Policy
- Currently managed via bespoke components where needed. Standardized `Card` and `Button` primitives should serve as the building blocks for future Accordions.

## 13. Page-Header Patterns
- Headers across the dashboard and student portal share a standard layout: `flex items-center justify-between px-4 sm:px-6`. Future refactors will continue mapping these to a `Header` macro-component if redundancy increases.

## 14. Loading/Empty/Error/Success States
- Standardized via the `Alert` component (for errors/successes) and the `isLoading` prop in the `Button` component (for localized loading states).

## 15. Navigation-Item Pattern
- Navigation items standardizing around the `ghost` variant of the `Button` component or bespoke `nav` anchors with shared `hover:text-primary transition-colors` paradigms.

## 16. Typography Consistency
- Form elements, buttons, and alerts strictly utilize `--font-sans` (and Arabic equivalents based on `dir="rtl"` layout). Modals utilize `--font-serif` for prominent titles, ensuring brand voice is carried into functional UI.

## 17. Spacing Consistency
- Forms use baseline sizing (`h-11` for standard inputs/buttons) to provide minimum 44px touch targets. Padding is normalized (`px-4 py-2`).

## 18. Theme Compatibility
- Tested against Light/Dark environments. Replaced arbitrary hardcoded grays (e.g., `bg-stone-100`) in foundational primitives with `bg-surface` and `border-border` to auto-adapt to theme changes.

## 19. Motion Compatibility
- Components inherit `--duration-base` and `--ease-premium`. All global primitives are inherently reduced-motion compliant due to the `@media (prefers-reduced-motion: reduce)` override in `src/index.css`.

## 20. RTL/LTR Rules
- Primitives employ logical properties where CSS natively supports it (`start-0`, `rtl:pr-3`, `rtl:ml-2`) to avoid layout breakage when switching to Arabic. Modals position close buttons using `end-4`.

## 21. Responsive Rules
- Primitives use standard Tailwind breakpoints. Touch targets are maintained at ~44px (e.g., standard input/button height is 44px / 2.75rem). Modal width is governed by screen constraints with natural horizontal/vertical scroll handling.

## 22. Accessibility Rules
- Mouse click rings suppressed in favor of `focus-visible`.
- Built-in ARIA roles (`role="dialog"`, `role="alert"`).
- Keyboard shortcuts standard (Escape for Modals).

## 23. Known Limitations
- The codebase still contains ~200 custom buttons and numerous custom modals (e.g., `GetStartedModal`, `TrialBookingModal`). These were intentionally left intact to avoid business logic disruption and regression risk. Future workflow overhauls can swap these out for the new `Modal` and `Button` primitives one by one.
