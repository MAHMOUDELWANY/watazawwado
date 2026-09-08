# Task 0.43 — Public Navigation + Legacy Student Login Cleanup

## Executive Summary
This task resolved the frontend routing and navigation architecture by removing legacy public "Student Portal" navigation links and disabling the legacy behavior where an old URL hash (like `#student-login`) would unexpectedly trap public visitors in the login modal upon refresh. The routing has been cleanly separated so that public users use `/get-started` for sign-up and guest booking, while existing students can directly sign in from there or reach the dashboard natively via `/student`.

## Changed
1. **`src/components/Navbar.tsx`**: Removed the hardcoded `Student Portal` link (with `href="#student-login"`) from the desktop and mobile navigation menus.
2. **`src/components/Footer.tsx`**: Removed the `Student Portal` text and `href="#student-login"` link from the footer links list.
3. **`src/LandingPage.tsx`**: Removed `#student-login`, `#student`, `#teacher`, `#admin`, and `#portal` from the `handleHashCheck` listener. The landing page no longer unexpectedly opens login modals upon refresh when these legacy hashes are in the URL. Kept `#reset-password` and `type=recovery` for valid Supabase password resets, and `#manage` / `#reschedule` for booking management.
4. **`src/pages/StaffLoginPage.tsx`**: Replaced the `to="/#student-login"` link at the bottom (for active students) with `to="/student"`, properly delegating it to the actual React Router student path.
5. **`src/student/pages/StudentDemoPage.tsx`**: Updated the fallback navigation inside `handleOpenSignup` from `navigate('/#student-login')` to `navigate('/get-started')`.
6. **`src/dashboard/DashboardApp.tsx`**: Changed the "Go to Login" fallback button for teachers from `to="/#teacher"` to `to="/staff/login"`.

## Not Changed
- **Booking architecture:** The existing real 6-step booking wizard and direct guest booking functionalities remain fully intact.
- **Guest booking:** Unauthenticated users can still book smoothly without account creation.
- **Supabase authentication:** Student identity architecture and database invariants were preserved perfectly; `StudentAuthModal` uses real Supabase auth.
- **Teacher authentication:** `/staff/login` remains the primary staff portal.
- **Demo:** `/student/demo` remains a risk-free interactive guest experience.
- **Visual design:** Colors, typography, spacing, branding, and motion remain completely unmodified.

## Validation
- **Lint**: PASS (0 errors)
- **Typecheck**: (Skipped; `npm run typecheck` script does not exist in `package.json`, but `npm run lint` leverages `tsc --noEmit` which completed successfully).
- **Build**: PASS (Vite bundled successfully without errors).
- **Tests**: PASS (111 tests passed across 15 suites, with 0 failures).
- **Source validation**: PASS.
- **Production deployment**: NOT VERIFIED (Environment lacks authorized Vercel tokens to automatically push the live deployment).

## Remaining Issues
None. Codebase is clean and ready for live deployment by an authorized administrator.
