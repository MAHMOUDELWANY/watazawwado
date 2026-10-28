# App redesign plan: student portal + teacher workspace

Owner request 2026-10-28. Scope: the signed-in app (`src/student`, `src/dashboard`) on phone, tablet and desktop.
Status: plan approved in direction (D1-D4 below); no code changed yet. Each phase ships on its own.

## Owner decisions (2026-10-28)

| ID | Decision |
|----|----------|
| D1 | Work in phases; each phase ships and is checked on its own. |
| D2 | Jalila stops being a page. AI moves into the places the teacher already works (see Phase 4). |
| D3 | Progress: build 3 small prototypes first; the owner picks one before we build. |
| D4 | Calm, simple look with the brand colours, but **not super-minimal**. Owner's 22-point UX checklist applies (audit below). Also: an animated app opening and a proper offline screen. |

## What the code shows today (audit)

- **Teacher nav is long.** Teachers see 12 items (`src/dashboard/DashboardApp.tsx:237-248`); the super admin 20 (`:214-233`). Overview, Today, Schedule and Bookings overlap.
- **Student nav repeats itself.** `curriculum` is a header tab *and* in the More drawer; calendar/progress/guide/invite sit in both the rail and More (`src/student/StudentApp.tsx:384-386`).
- **Settings leaks internals to teachers.** Teachers see a "Booking rules" tab that cites `RULES.md` (`SettingsPage.tsx`, Policy tab), and `IntegrationsManager` shows Brevo and env-var names like `BREVO_API_KEY` / `ZOOM_ACCOUNT_ID` to every role (`src/components/dashboard/IntegrationsManager.tsx:338,354-400`). `TeacherAuthDiagnosticPanel` is mounted for all roles (`DashboardApp.tsx:578`).
- **Jalila is a separate free-text page** (`AssistantPage.tsx`). The one useful AI piece, "Draft with Jalila" for the family summary, is buried in `PostLessonSummaryEditor.tsx:785`.
- **Progress page is 1,784 lines** (`StudentProgressPage.tsx`) with several emblem systems; there is also a separate road map (commit 4ae1cde) and a progress report page.
- **Loading:** 21 files use a spinner, 8 use skeletons. **No toast system** (0 files). 16 `window.confirm`/`alert` calls in the app.
- **Offline:** `public/sw.js` returns a plain one-line notice. **Opening:** the installed app shows the OS splash (logo on `#FAF7F2`) then `WelcomeLoader`.

## Owner's UX checklist: where we stand

| # | Principle | Today | Plan |
|---|-----------|-------|------|
| 1 | Colour psychology | Brand teal/gold/cream, used loosely | Teal = action/trust, gold = achievement only, red = errors only |
| 2 | Split long forms into steps with progress | Onboarding yes; booking, profile, add-child no | Stepper for booking and add-child |
| 3 | Type, search, scroll | Admin command search only | Search in student list, lessons, teacher's students |
| 4 | Input masks | Phone input only | Phone, time, amounts, dates |
| 5 | Clear, actionable button text | Mixed ("Prepare", "Save") | Verb + object ("Book this lesson") |
| 6 | Spacing groups related items | Uneven | Spacing scale, grouped cards |
| 7 | Avoid super-minimal | n/a | Keep brand arch/khatam accents, warm surfaces |
| 8 | Short nav labels | Some long ("Discounts & invites") | One or two words |
| 9 | Toasts | **Missing** | One shared toast (HeroUI or small in-house) |
| 10 | Skeleton screens | 8 of ~29 loading states | Skeletons everywhere data loads |
| 11 | Empty states | 3 files | Every list gets one with a next action |
| 12 | Widgets | Home cards | "Next lesson", "Credits left", "This week" widgets |
| 13 | Make progress visible | Exists but hard to read | Phase 2 |
| 14 | "Other" option instead of long forms | Rare | Add where lists are long |
| 15 | Solid ending | Booking/payment end screens plain | Clear success screens with next step |
| 16 | Links look clickable | Mixed | Underline/colour rule |
| 17 | Full-width buttons (phone) | Mixed | Primary buttons full width on phone |
| 18 | Proper toggles | Checkboxes for on/off | Switch for on/off settings |
| 19 | Reduce cognitive load | Long navs, many icons | Fewer items, one primary action per screen |
| 20 | Clean spacing | Cramped phone, empty desktop | Phase 1 |
| 21 | 60/30/10 colour | Not applied | Cream 60 / ink-teal 30 / gold 10 |
| 22 | Instant errors | On submit mostly | Inline validation on blur |

## Phases

### Phase 1: Clean up (ships first) — done 2026-10-28 (see docs/backlog/LOG.md)
Shipped: items 1, 2 and 4 in full; item 3 as phone padding only. The two-column tablet/desktop layouts move to Phase 3, where each page is redesigned anyway.
1. **Settings by role.** Teacher sees: Google Calendar connect, time zone, theme. Nothing else. Super admin keeps a "System" section with integrations status, health, booking rules. No env-var names or `RULES.md` text in any teacher-facing UI. Gate `TeacherAuthDiagnosticPanel` to super admin. Server already checks roles; this is a UI fix.
2. **Navigation.** Teacher: 5 items (Today, Students, Schedule, Messages, More). Merge Overview into Today; Bookings into Schedule. Student: no item appears twice; phone bottom bar = Home, Lessons, Book, Progress, More.
3. **Layout and spacing.** Phone: larger gaps, full-width primary buttons, 44px taps. Tablet/desktop: two-column layouts (main + side panel) with a max content width, instead of one stretched column.
4. **Toasts + skeletons + empty states** as shared components; replace `window.confirm`/`alert` with the Modal.

### Phase 2: Progress — done 2026-10-28
Owner's pick: B (calm board) for adults and parents, A (road) for children, C (journey log) for teachers.
Three prototypes (road-map based, calm number dashboard, timeline). Owner picks one. Then one shared progress component used by the student page and the teacher's student detail, replacing the current 1,784-line page.

### Phase 3: Look and feel
Plain background (drop `brand-lights` glow in the app), icons only in navigation, 60/30/10 colour, switches, input masks, button copy pass with the `humanizer` skill.
**App opening:** OS splash cannot animate (Android builds it from the manifest). We set the manifest/iOS startup colours to match, then hand off to a short animated brand intro (khatam draws in, ~700 ms, skipped on reduced motion and on repeat opens the same day).
**Offline screen:** branded page in `sw.js` (logo, arch, Arabic + English, retry, auto-retry when back online).

### Phase 4: AI for teachers (Jalila inside the work)
Remove the Jalila page and nav item. Add:
- **Before a lesson** (Today card): two-line brief from the last notes and the curriculum position.
- **After a lesson:** keep and surface "Draft the family summary" from private notes.
- **Monthly:** draft of the progress report for the teacher to edit.
Server: reuse `server/routes/summaryDraft.ts` pattern; keep the teacher-review-before-send rule. Retire `/api/dashboard/ai-assistant` once nothing calls it.

## Not in scope
Public website pages; curriculum content; pricing/booking rules; any database change (none needed so far).

## Risks
- Signed-in pages cannot be opened by Claude here; checks come from code, tsc, tests and the owner on the live site.
- Nav changes move buttons people already know; Phase 1 notes the moves in release notes to teachers.

## GSTACK REVIEW REPORT

| Run | Status | Findings |
|-----|--------|----------|
| plan-ceo-review (2026-10-28) | Direction approved (D1-D4) | Settings leak, duplicate nav, Jalila placement, missing toasts/empty states |

VERDICT: Proceed with Phase 1 after owner go-ahead.

NO UNRESOLVED DECISIONS
