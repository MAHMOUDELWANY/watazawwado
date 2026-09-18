# WATAZAWWADO — THEME SYSTEM (LIGHT & DARK)

## 1. Theme Architecture
- **Global Provider:** Replaced page-level theme management with a global `ThemeProvider` (`src/components/ThemeProvider.tsx`) wrapping the entire application routing tree in `src/App.tsx`.
- **State Management:** Leverages the React Context API (`useTheme` hook) to provide `theme` and `toggleTheme` universally across the platform.
- **CSS Strategy:** Utilizes Tailwind CSS v4's class-based dark mode (`@custom-variant dark (&:where(.dark, .dark *));`). The Provider injects `.dark` onto the `document.documentElement`.
- **System Preference Fallback:** If a user has never set a preference, the system reads `window.matchMedia('(prefers-color-scheme: dark)')` to respect their OS setting.

## 2. Light Theme Principles
- **Atmosphere:** Warm, bright, calm, and premium.
- **Tokens:** Employs the "Warm Ivory" semantic palette.
  - Background: `#F8F6F0`
  - Text: `#30332F`
- **Execution:** Avoids sterile SaaS aesthetics (no pure white backgrounds). Relies on subtle elevation and border contrast.

## 3. Dark Theme Principles
- **Atmosphere:** Deep, calm, and premium.
- **Tokens:** Employs the "Deep Charcoal" semantic palette.
  - Background: `#1A1C1A`
  - Text: `#EFEFEF`
- **Execution:** Avoids pure `#000000` or aggressive neon glows. Dark surfaces (`#242724`) provide depth without excessive layering.

## 4. Semantic Token Mapping
We mapped raw colors to structural properties. (Full breakdown in `03-visual-design-system.md`).
All new theme contexts natively pull from `--background`, `--foreground`, `--surface`, `--border`, and `--muted`.

## 5. Theme Persistence
- **Storage:** Persisted locally via `localStorage` using the key `mahmoud_theme`.
- **Hydration:** Synchronous `useState` initialization ensures the correct theme is calculated immediately to prevent visual flashing.

## 6. Theme Toggle Locations
Theme switching is now accessible from the three primary application surfaces:
1. **Public Landing:** Global `Navbar` (top right).
2. **Student Portal:** `StudentApp.tsx` sidebar (bottom, above Sign Out).
3. **Teacher Dashboard:** `DashboardApp.tsx` sidebar (bottom, above Sign Out).

## 7. RTL/LTR Considerations
The theme architecture is entirely independent of layout direction (`dir="rtl"` / `dir="ltr"`). `ThemeProvider` exclusively targets color classes.

## 8. Accessibility
- All theme toggle controls utilize semantic `<button>` tags.
- Dynamic `aria-label` tags (`Switch to dark mode` / `Switch to light mode`) ensure screen-reader compliance.
- Icons (`Moon` / `Sun`) are accompanied by clear text labels in the sidebars to prevent ambiguity.

## 9. Limitations
- **Legacy Components:** While the foundational theme engine is global, some legacy marketing components (e.g., `Hero.tsx`, legacy modals) still use hardcoded Tailwind hex strings (like `dark:bg-[#1E1923]`). These will be gracefully modernized in upcoming UI refactoring phases to consume the new semantic variables (`bg-background`, `bg-surface`).

## 10. Supabase Impact
- **No Supabase/database changes were required.** Theme state remains strictly a frontend client-preference mechanism.
