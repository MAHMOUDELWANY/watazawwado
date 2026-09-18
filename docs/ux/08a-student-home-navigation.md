# Section 08-A Refinement: Student Home & Navigation UI / Design System Cleanup

## 1. Overview & Scope

This refinement pass performs a targeted cleanup of the Student Portal Home, Navigation, Onboarding, and Auth/Pathway modal UI. In accordance with project requirements:
- Existing screen structures and layouts were strictly preserved.
- Hardcoded color family classes (`rose-*`, `emerald-*`, `amber-*`, `text-white`, `bg-white`) were replaced with canonical semantic design tokens.
- Accessibility for the mobile navigation drawer was elevated to WCAG 2.1 AA dialog specifications.
- RTL/LTR bidirectional layouts and light/dark theme contrast were audited and verified.
- Backend, database, RPCs, and API contracts remain untouched.

---

## 2. Design System Token Standardization

The color tokens defined in `src/index.css` were mapped cleanly across all Student Portal surfaces:

| UI Context | Legacy / Hardcoded Classes | Standardized Semantic Token |
| :--- | :--- | :--- |
| **Error / Destructive** | `text-rose-600`, `bg-rose-500/10`, `border-rose-500/20` | `text-destructive`, `bg-destructive/10`, `border-destructive/20` |
| **Success / Confirmed** | `text-emerald-600`, `bg-emerald-500/10`, `border-emerald-500/20` | `text-success`, `bg-success/10`, `border-success/20` |
| **Notice / Warning / Demo** | `text-amber-600`, `bg-amber-500/10`, `border-amber-500/30` | `text-warning`, `bg-warning/10`, `border-warning/30` |
| **Primary Action Buttons** | `bg-primary text-white hover:bg-primary-hover` | `bg-primary text-primary-foreground hover:bg-primary-hover` |
| **Card / Surface Containers** | `bg-white dark:bg-[#231D28] text-[#362E3B]` | `bg-surface text-foreground border-border shadow-xs` |
| **Subtle Highlights / Inputs** | Custom hardcoded tints | `bg-surface-subtle`, `border-border` |

### Refactored Components
1. **`src/student/StudentApp.tsx`**:
   - Standardized student navigation sidebar and mobile backdrop scrim.
   - Updated profile avatar and active navigation state tokens.
2. **`src/components/StudentAuthModal.tsx`**:
   - Replaced `rose-*` and `emerald-*` error/success blocks with `destructive` and `success` semantic tokens.
   - Updated primary action button to use `text-primary-foreground`.
   - Converted absolute positioning to logical directional properties (`end-5`, `ps-10`).
3. **`src/components/GetStartedModal.tsx`**:
   - Replaced `amber-*` simulated/demo notice tokens with `warning` tokens.
   - Applied `text-primary-foreground` to primary submit and sign-in buttons.
4. **`src/student/pages/StudentOnboardingPage.tsx`**:
   - Replaced error alerts with `text-destructive`, `bg-destructive/10`, `border-destructive/20`.
   - Updated CTA buttons and action steps to `text-primary-foreground`.
5. **`src/student/pages/StudentBookingPage.tsx`**:
   - Replaced verification warning alerts with `warning` tokens.
   - Standardized booking card container (`cardClassName`) from hardcoded hex colors to `bg-surface text-foreground border-border shadow-xs`.
   - Updated repeat booking action buttons to use semantic tokens and logical text alignment (`text-start`).
6. **`src/student/pages/StudentDemoPage.tsx`**:
   - Replaced `amber-*` demo banner and ping indicator with `warning` tokens.
   - Replaced `emerald-*` lesson completion chips and badges with `success` tokens.
   - Standardized modal action buttons and dismiss icons to logical properties (`end-5`).

---

## 3. Mobile Navigation Drawer Accessibility

The mobile navigation drawer in `src/student/StudentApp.tsx` was enhanced to support full dialog accessibility:

1. **Focus Management & Trap**:
   - An `activeElement` ref preserves the user's triggering button before drawer expansion.
   - On open, keyboard focus is programmatically shifted to the drawer container or close button.
   - A `keydown` listener intercepts `Tab` and `Shift+Tab` cycles, trapping keyboard navigation within the drawer elements until dismissed.
   - On close or Escape key press, focus is returned cleanly to the triggering button.
2. **Keyboard Dismissal**:
   - Pressing `Escape` closes the drawer immediately.
3. **Body Scroll Lock**:
   - When the drawer is open on mobile devices, `document.body.style.overflow` is set to `'hidden'` to prevent background page scroll-jacking. Overflow is restored on unmount or close.
4. **Screen Reader Semantics**:
   - Added `role="dialog"`, `aria-modal="true"`, and `aria-label="Student Navigation Sidebar"` (localized to English and Arabic depending on `isAr`).
   - Trigger hamburger button includes explicit `aria-expanded` and `aria-controls="student-sidebar"`.
   - Background main content region receives `aria-hidden={sidebarOpen}` while the drawer is active.
5. **Touch Targets**:
   - Drawer toggle and close buttons meet the minimum touch target requirement of 44×44px (`min-h-[44px] min-w-[44px]`).

---

## 4. Internationalization & Bi-directional (RTL/LTR) Support

All updated components support dynamic switching between Arabic (`rtl`) and English (`ltr`):
- Directional CSS classes were converted to logical CSS properties (`start-0`, `end-0`, `border-e`, `ps-4`, `pe-4`, `text-start`).
- Mobile sidebar sliding transitions respect reading direction:
  - `ltr:-translate-x-full` slides off-screen to the left.
  - `rtl:translate-x-full` slides off-screen to the right.
  - On expansion, `translate-x-0` slides the drawer into view regardless of text direction.
- Close buttons and floating action icons use `end-5` rather than `right-5`.

---

## 5. Theme Support & Contrast Verification

- **Light Mode**: Background surfaces use refined, warm neutrals (`bg-background`, `bg-surface`, `bg-surface-subtle`) with high-contrast text (`text-foreground` and `text-muted-foreground`) achieving WCAG AA contrast.
- **Dark Mode**: Neutral dark tones with soft border delineations (`border-border`) ensure cards and modals retain visual hierarchy without glowing drop-shadows or jarring unstyled white flashes.
- Primary buttons pairing `bg-primary` with `text-primary-foreground` ensure readable contrast across all theme variations.

---

## 6. Verification & Build Integrity

- **TypeScript Compilation**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- **Production Build**: `npm run build` (`compile_applet`) passes with 0 errors.
- **Zero Regressions**: No modifications were made to backend routes, database schemas, RPC functions, or RLS policies.
