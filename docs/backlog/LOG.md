# Backlog progress log

One entry per finished task, newest first: result, files changed, checks run, what was not checked.

## Done

### Discount codes + invite-a-friend (referral) (2026-10-22)
- Owner request and decisions (RULES.md §4, 2026-10-22): super-admin discount codes (percent or fixed, scope, first purchase, minimum, total and per-family uses, dates); codes stack with package and family savings within a total-savings cap (25% at launch); gift codes skip the cap and may be 100% (confirmed without payment); referral gives account credit to both sides, the inviter's only after the friend's first completed paid lesson.
- How it works: the checkout modal asks `/api/checkout/quote` for the breakdown, then `/api/checkout/apply` writes the code/balance and the new stored price in one locked RPC (`apply_checkout_discount_atomic`), so Stripe verification still matches the stored price to the cent; a total of 0 confirms the booking or activates the package right there. Abandoned checkouts give the code use and balance back (`settle_checkout_redemptions`, run on every apply and after each payment); a refund reverses them (`reverse_checkout_discount`). `?ref=CODE` is kept 30 days (`wz_ref`), sent at onboarding, and a friend's code also works in the code box. Lesson completion calls `qualify_referral` and emails the inviter.
- Screens: checkout modal (code box, breakdown, balance toggle, free confirm), Dashboard → Discounts & invites (codes / invites / settings + manual balance change), student Invite page (`/student/invite`: link, WhatsApp/share, how it works, balance, invites, plain terms), welcome strip on public pages for invited visitors. Terms: new section "Discount codes, invites and account balance", `TERMS_VERSION` 2026-10-22.1.
- Files: `supabase/migrations/20261022000000_discount_codes_and_referrals.sql`, `20261022000001_settle_checkout_redemptions_fix.sql` (both applied to production), `server/pricing/discounts.ts`, `server/routes/growth.ts`, `api/index.ts` (wiring: payment settle, refund reverse, completion, onboarding), `src/components/payment/InstantCheckoutModal.tsx`, `src/dashboard/pages/DiscountsPage.tsx`, `src/student/pages/StudentInvitePage.tsx`, `src/components/public/layout/ReferralWelcome.tsx`, `src/lib/leadSource.ts`, terms page, RULES.md, `docs/pricing/packages.md`, tests `discounts-engine` and `discount-codes-referrals`.
- Checks: tsc pass; build pass; npm test 1381 pass / 0 fail / 5 skipped (new tests 27/27); the database functions were run against production in rolled-back transactions (apply, remove, re-apply, use limit, balance check, arithmetic guard, free package activation with 4 credits, refund returning balance, referral attach/self/duplicate, qualify once) and left no rows; invite strip seen on desktop and phone with a temporary code, then deleted.
- Not checked in a browser: the signed-in checkout modal, admin page and Invite page (no portal login here); covered by code review, tsc and API tests. A real Stripe payment with a code was not made.

### RN-02 follow-up: admin task when a package is used up (2026-10-21)
- Closes the gap noted under CRM-04 ("RN-02 does not create tasks yet"). When a package reaches 0 lessons (once, inside the existing claim), the admin gets one CRM follow-up task due in 2 days, "Package used up: check in about renewing (for <learner>)", on the paying account's own student record (else the learner's), source `low_balance`, dedupe key `low_balance:0:<package id>`. Nothing at 2 lessons left (the family's notice covers that). The DB check on `crm_tasks.source` already allows `low_balance`.
- Files: `server/notifications/lowBalance.ts`, `test/rn-02-low-balance.test.ts` (new case).
- Checks: tsc pass; npm test 1322 pass / 0 fail / 5 skipped; build pass.

### QA-07 step 3: next-week suggestion moved (2026-10-21)
- `GET /api/student/next-week-suggestion` (RN-04) moved unchanged to `server/routes/nextWeekSuggestion.ts`; it imports `validateSlotAvailability` and `nextWeekSlot` directly and gets `getAuthorizedLearnersForStudent` and `resolveTeacherMetadata` in `deps`. The RN-04 source check now reads the new file (same assertions).
- Checks: tsc pass; npm test 1321 pass / 0 fail / 5 skipped; build pass.

### QA-07 step 2: account language and email choices moved (2026-10-21)
- `PUT /api/me/language`, `GET`/`PUT /api/student/notification-preferences` moved unchanged (only `deps.*`) to `server/routes/accountPreferences.ts`; the `preferences.js` import moved with them. No catch-all route sits before these paths, so registration order is safe.
- Checks: tsc pass; npm test 1321 pass / 0 fail / 5 skipped; build pass.

### Integration of round 2: QA-07 pilot, QA-05b, AD-02b (2026-10-21) — done
- QA-07 pilot merged into main (family calendar routes in `server/routes/calendarFeed.ts`), together with the English subject text per RULES §2b (`src/booking/mockData.ts`, migration `20261021000007` already applied) and the privacy policy text on AI help for teachers and switching emails off.
- QA-05b English URLs: every public page also at `/en/...` with `lang="en" dir="ltr"`, English title and description, self canonical, ar/en/x-default hreflang (x-default = Arabic) and the same alternates in `sitemap.xml` (18 URLs). Opening an `/en` address picks English and keeps it; the toggle moves between matching addresses; an unknown `/en/*` goes to `/en`. Checked in `dist/`: `en/pricing.html`, `pricing.html`, `en.html` (tags, and the rendered body is in the right language).
- AD-02b move booked lessons to another teacher (single on the lesson screen, bulk in the Lessons bar), super admin only. The server checks the new teacher's hours, calendar and lessons; `admin_move_booking_teacher` locks the lesson and changes only `teacher_id`, and the per-teacher exclusion constraint refuses overlaps. Same time, price, payment and Zoom meeting (academy account; the host link follows `bookings.teacher_id`). The old Google event is removed (the admin is told if that fails) and a booking_sync job puts the lesson on the new teacher's calendar; the family and both teachers are told, no prices shown. Migration `20261021000010` applied to production after review. Merge fix: the teacher select got an aria-label (QA-02 test).
- Checks: tsc pass; npm test 1321 pass / 0 fail / 5 skipped; build pass (9 pages x 2 languages prerendered).
- Not checked: a real move on production (needs two teachers with calendars); Search Console pick-up of the `/en` URLs.

### QA-07 Split `api/index.ts` safely (prep only) (2026-10-21) — review (pilot merged, see above)
- Plan: `docs/api-split-plan.md` (rules for zero-behaviour-change moves, the order from low risk to red zone, what stays in `api/index.ts`).
- Pilot (branch `refactor/qa-07-pilot-calendar-feed`, pushed, NOT merged): the four PA-03 family calendar routes moved to `server/routes/calendarFeed.ts` unchanged apart from `deps.*`; two unused imports removed from `api/index.ts`; the PA-03 test reads the new file. tsc pass; npm test 1306 pass / 0 fail / 5 skipped; build pass.
- Owner/reviewer: look at the branch diff; if fine, merge it and continue with step 2 of the plan.

### AD-02 Bulk actions on bookings (2026-10-21) — cancel only
- Result: done for cancelling (main). On Lessons, the super admin sees a checkbox on every lesson still ahead (pending, confirmed or moved); picking some shows a bar: write one reason (the family sees it), confirm, and each lesson is cancelled through the same single-lesson request as the lesson screen, one after the other, so the server applies its usual rules, credits and emails to each. The bar reports how many were cancelled and how many failed.
- Not done: "move to another teacher". There is no single-lesson path that moves a booked lesson to another teacher (only the student's assigned teacher can change, and booked lessons stay with their teacher per RULES.md §1); building one means new rules for Zoom host, calendars and availability, so it needs its own task and the owner's go-ahead.
- Files: `src/dashboard/components/BulkCancelBar.tsx`, `src/dashboard/pages/BookingsPage.tsx`, `test/ad-02-bulk-cancel.test.ts`.
- Checks: tsc pass; npm test 1306 pass / 0 fail / 5 skipped; build pass. Red zone: no server change, the server's cancel rules are untouched.

### RN-06 Gentle "we miss you" for quiet learners (2026-10-21) — built, OFF until the owner switches it on
- Result: done (main), sending nothing. Once a day (09:00 UTC hour) the reminder cron would find learners with a paid lesson in the last 6 months, the last one 21+ days ago and nothing booked since; a family is skipped while another child still has lessons. Each account gets one note from our team ("We miss you" / "وحشتونا", on the site, and by email unless follow-ups are switched off), and the admin gets a CRM follow-up task (source `quiet_learner`, due in 2 days). Never more than once per account per 60 days.
- Safety: runs only with `QUIET_LEARNER_EMAILS=on` in Vercel (production); 50 accounts per run; idempotent keys in `notification_events`. Dry run: Analytics → ""We miss you" notes" → "Preview the list" (reads only).
- Reviewed (red zone): only reads plus the claimed send; filters escaped; no money; no new table.
- Files: `server/notifications/quietLearners.ts`, `api/index.ts` (cron hook + preview route), `src/dashboard/components/MonthlyProgressPreview.tsx` (QuietLearnersPreview), `AnalyticsPage.tsx`, `test/rn-06-quiet-learners.test.ts`.
- Checks: tsc pass; npm test 1304 pass / 0 fail / 5 skipped; build pass.
- Owner action to turn it on: check the preview and wording, then add `QUIET_LEARNER_EMAILS` = `on` in Vercel (Production) and redeploy.

### QA-06 Repo cleanup of root one-off files (2026-10-21)
- Result: done (main). Checked each root file against code, package scripts and config (none used them) and scanned them for secrets (none). Moved, not deleted, to `../watazawwado-archive/root-files-2026-10-21/` (outside the repo, next to it on the owner's PC): `FINAL_REPORT.md`, `README_WORKFLOW_03A.md`, `SUPABASE_VERIFICATION_CHECKLIST.md`, `TASK_0_58_I_VERIFICATION_REPORT.md`, `add-tour.js`, `avail.json`, `diff.txt`, `get_zoom_docs.ts`, `pr_body.md`, `run_local.ts`, `scratch_handoff.txt`, `scratch_handoff_utf8.txt`, `temp_css.txt`, `test-auth.js`, `test-brevo.ts`, `test-identity.js`, `test-me.ts`, `test-syntax.js`, `test_regex.cjs`, `test_tailwind.html`. They remain in git history.
- Kept: `GEMINI.md` (agent instructions), `metadata.json` (AI Studio file), `README.md`, configs.
- Checks: tsc pass; npm test 1299 pass / 0 fail / 5 skipped; build pass.

### TE-05 Jalila drafts the family summary (2026-10-21)
- Result: done (main). In the after-lesson editor, under the family summary: "Draft with Jalila" / "اكتبها مع جليلة" (active once private notes are written). It sends the notes as typed, the next step and the subject to Gemini with the learner's first name only, and puts a 1-2 sentence draft in the family's language (the account's saved language, English by default) into the family summary box. If a summary is already there it asks before replacing it. Nothing is saved or sent by the draft: the teacher edits and saves as before.
- The prompt tells Jalila to use only facts from the notes, invent nothing, and leave out what is not for the family (criticism, health, behaviour, family or money matters). Only the student's own teacher or the admin can ask; rate limited.
- Files: `server/routes/summaryDraft.ts`, `api/index.ts`, `src/dashboard/components/PostLessonSummaryEditor.tsx`, `test/te-05-jalila-summary-draft.test.ts`.
- Checks: tsc pass; npm test 1299 pass / 0 fail / 5 skipped; build pass.
- Not checked: a real Gemini call (needs the production key and a teacher login). Privacy note: private notes go to Google Gemini, as Jalila's lesson brief already does; the privacy policy should mention AI help for teachers if it does not yet.

### CRM-08 Teacher load and quality view (2026-10-21)
- Result: done (main). Analytics page (super admin) → "Teachers: load and care": per active teacher, active students, lessons this week (from Monday, UTC), hours booked this week vs weekly hours offered (from "My hours"), lessons the teacher moved in the last 30 days with the latest reasons, and how often the family summary was written after completed lessons (last 30 days). No money anywhere.
- Teacher moves were only kept inside admin notices; a new server-only table `teacher_lesson_moves` now records each move (booking, teacher, old/new time, reason) right after the move succeeds (best effort: a logging failure never blocks the move). Counts start from today.
- Migration: `20261021000006_teacher_lesson_moves.sql` (applied; server only, grants checked).
- Files: `server/routes/teacherLoad.ts`, `api/index.ts` (move log + registration), `src/dashboard/components/TeacherLoad.tsx`, `AnalyticsPage.tsx`, `test/crm-08-teacher-load.test.ts`.
- Checks: tsc pass; npm test 1296 pass / 0 fail / 5 skipped; build pass; production columns checked.

### PA-04 Family savings made visible (2026-10-21)
- Result: done (main). A package bought for a second (third...) child now shows "Family care: −$X" / "رعاية الأسرة: −$X" on its card in My packages. X is computed by the server only: the catalogue price minus what the server charged, and only when the server applied the family discount (`metadata.family_discount`). The select response also returns `familySaving`. The 5% rule itself is unchanged (RULES.md §4); the page already explained family care.
- Files: `api/index.ts`, `src/student/pages/StudentPackagesPage.tsx`, `test/pa-04-family-saving.test.ts`.
- Checks: tsc pass; npm test 1292 pass / 0 fail / 5 skipped; build pass.

### ST-07 Install as an app (PWA basics) (2026-10-21)
- Result: done (main). The manifest now opens the portal (`start_url` `/student`, scope `/`, an `id`) and has maskable icons (192 and 512, the logo inside the safe zone on the site's cream background) next to the existing ones. On a phone, the portal home shows a small dismissible card "Keep Watazawwado on your home screen": Android/Chrome get an "Add it" button (the browser's own install prompt); iPhone Safari gets the two steps (Share → Add to Home Screen). Hidden on wide screens, inside the installed app, and after "Not now". No service worker, nothing cached.
- Files: `public/site.webmanifest`, `public/maskable-192x192.png`, `public/maskable-512x512.png`, `src/student/components/InstallHint.tsx`, `StudentHomePage.tsx`, `test/st-07-pwa.test.ts`.
- Checks: tsc pass; npm test 1290 pass / 0 fail / 5 skipped; build pass.
- Not checked: installing on a real phone (owner test below).

### PU-01 Progress showcase section (2026-10-21)
- Result: done (main). How it works now shows "You always know where things stand": two cards, each with an EXAMPLE / مثال badge. (1) The learning path for Tajweed with its real three levels from the subject catalogue (first done, second in progress with a half bar, third next). (2) The monthly report: lessons attended, weeks in a row, a new milestone, and a teacher's note, with "Sample figures to show the layout, not a real student." No names anywhere. Checked in the browser: English light desktop, Arabic RTL dark at 375 px, no horizontal overflow; it is in the prerendered page.
- Files: `src/components/public/how-it-works/ProgressShowcase.tsx`, `HowItWorksPage.tsx`, `test/pu-01-progress-showcase.test.ts`.
- Checks: tsc pass; npm test 1287 pass / 0 fail / 5 skipped; build pass.
- Owner review (provisionally approved): the sample numbers and the sample teacher note (Tajweed: noon sakinah, then meem sakinah). Not added to the homepage, to keep it short.

### Red-zone review of PR-09 and ST-06 (2026-10-21)
- Reviewed both diffs line by line (BACKLOG rule: red zone gets a review). Fixed: (1) a double tap on "Send the deletion request" could hit the one-open-request index and show an error; the second request now returns the open one. (2) On the 1st-5th the cron rebuilt the recipient list on every run even after the month was finished; a finished month is now marked once (`monthly_progress_done:<month>`) and later runs stop at one read. Known limit: a lesson the teacher records as attended after the month is marked finished is not counted in that month's email.
- No other findings: every route checks the account (students: own learners only; admin routes: super admin), no raw `select('*')`, no deletes, both tables server-only, the team email and the monthly email cannot send outside production.
- Checks: tsc pass; npm test 1284 pass / 0 fail / 5 skipped; build pass.

### ST-06 Self-service privacy requests (2026-10-21)
- Result: done (main). New profile tab "Privacy & your data" (`/student/account?tab=privacy`):
  - "Download my data": one JSON file with the account's own data and its children's (learners, guardians, goals, lessons, payments, packages, the teacher's notes for the family, placement results, ratings, conversations, site notices, email and language preferences). Every column is on an allow-list; tokens, Zoom/calendar ids, payment references, teachers' private notes and placement answer keys never leave. The file says to write to privacy@ for anything else. Rate limited; only real signed-in accounts.
  - "Delete my account": a confirm box and an optional reason create one open request (one per account), notify the super admin on the site and email privacy@ (production only). The family sees "we received it on <date>; within one month". Nothing is deleted automatically.
- Admin: Analytics page → "Account deletion requests" with the due date (one month), a link to the student, and "Mark handled" (only after deleting by hand).
- Migration: `20261021000005_privacy_requests.sql` (applied; server only, checked on production grants).
- Files: `server/routes/privacy.ts`, `api/index.ts`, `src/student/components/PrivacyRequests.tsx`, `StudentProfilePage.tsx`, `src/dashboard/components/AdminPrivacyRequests.tsx`, `AnalyticsPage.tsx`, `test/st-06-privacy-requests.test.ts`, `test/st-05-profile-split.test.ts` (six tabs now).
- Checks: tsc pass; npm test 1283 pass / 0 fail / 5 skipped; build pass.
- Owner review (provisionally approved): what the export includes and leaves out (teachers' private notes are left out; under GDPR a person may ask for them, handled by privacy@), and the wording. How to delete an account by hand is not automated on purpose.

### PR-09 Monthly progress email (2026-10-21) — built, OFF until the owner switches it on
- Result: done (main), sending nothing. On the 1st to 5th of each month the reminder cron would send one short email per account about last month: for an adult "You took N lessons with us last month", for a family one line per child, then a button to that month's PR-08 report and, in the footer, a link to switch these emails off (profile → preferences, RN-07). One language per account (RULES.md §6). Only accounts with an attended lesson that month; accounts with progress emails off are skipped.
- Safety: it runs only when `MONTHLY_PROGRESS_EMAILS=on` is set in Vercel (production). Never twice for the same month (`notification_events` key `monthly_progress:<month>:<account>`, claimed atomically; a failed send is retried by a later run); at most 150 per run so booking emails keep room in the Brevo free quota (300/day).
- Dry run: Analytics page → "Monthly progress emails" → "Preview recipients" (super admin) lists who would get it for last month, without sending or recording anything.
- Files: `server/notifications/monthlyProgress.ts`, `server/notifications/emailTemplates.ts` (`renderMonthlyProgressEmail`), `api/index.ts` (cron hook + preview route), `src/dashboard/components/MonthlyProgressPreview.tsx`, `AnalyticsPage.tsx`, `test/pr-09-monthly-progress.test.ts` (switch, month window, dry run writes nothing, no double send, retry, batch, escaping).
- Checks: tsc pass; npm test 1279 pass / 0 fail / 5 skipped; build pass.
- Owner action to turn it on: review the preview and wording, then add `MONTHLY_PROGRESS_EMAILS` = `on` in Vercel → Settings → Environment Variables (Production) and redeploy.

### QA-05 SEO and hreflang check (2026-10-21)
- Checked every prerendered public page (home, about, how it works, subjects, pricing, FAQ, safety, privacy, terms): unique title and description, canonical, robots index/follow (the app shell `spa.html` is noindex), one H1, every image has alt text, Organization + WebSite JSON-LD, og:image, sitemap with the 9 public pages, robots.txt blocking account areas and the API. All fine.
- Added: Course structured data on `/learning` (an ItemList of the 8 bookable subjects from the live catalogue, provider = the academy, online, "from" hourly price 9 or 13 USD as RULES.md §3).
- Found, not changed (needs a decision, see the report): (1) hreflang cannot be added because Arabic and English share the same URL (language is a client setting, default Arabic). Crawlers get an English title and description over an Arabic body with `lang=ar`. For English searches by Western families, separate English URLs (e.g. `/en/pricing`) with hreflang ar/en/x-default would be the real fix; it touches routing, prerendering and the sitemap. (2) Every page shares one og:image; per-page images need design work. (3) The English subject name says "English Language (Conversation, IELTS & Academic)"; RULES.md §2b describes English as phonics/reading for kids and CEFR A1–C1 for 12+, so the IELTS mention may need the owner's check. (4) Google shows FAQ rich results only for government and health sites, so no FAQPage markup was added.
- Files: `scripts/prerender-seo.ts`, `test/qa-05-seo.test.ts`.
- Checks: tsc pass; npm test 1272 pass / 0 fail / 5 skipped; build pass; JSON-LD parsed from the built page.

### PU-04 Performance pass on public pages (2026-10-21)
- Measured on production with Chrome DevTools traces: phone 390x844, 4x slower CPU, Fast 4G, cold cache.
- Before: home LCP 7.8 s (the teacher photo: downloaded at 2.3 s, painted at 7.8 s), CLS 0. Cause: the prerendered photos carried `opacity:0` from their entrance animation, so they stayed invisible until the JavaScript ran and replaced the prerendered page. Also every hashed bundle, font and image was served with `max-age=0`, so repeat visits re-checked every file.
- Fix: the hero photos slide in without fading (still a gentle entrance; reduced motion unchanged). `vercel.json`: hashed `/assets/*` cached for a year (immutable), `/fonts/*` 30 days, images/mp3 1 day with stale-while-revalidate; HTML and the API unchanged (still revalidate).
- After: home LCP 2.4 s, CLS 0; about LCP 1.7 s, CLS 0; pricing: the heading first paints at 2.3 s (FCP) but lab LCP reads 5.4 s because React re-draws the prerendered page (`createRoot` in `src/main.tsx`) and the new heading measures 4% larger. Users already see it at 2.3 s.
- Already fine, left as is: below-the-fold portraits are lazy; fonts use swap and are not preloaded on purpose; the welcome recitation loads only when it plays (owner rule §6, autoplay).
- Recommended next (not done, needs care): hydrate the prerendered page (`hydrateRoot`) instead of re-rendering it, which removes the pricing re-paint and saves work on every page; risk is hydration mismatches from language/theme read from storage, so it needs its own task and checks. The homepage loads Supabase (226 kB) and motion early; deferring them is a larger refactor.
- Files: `src/components/public/homepage/TeacherDuo.tsx`, `vercel.json`, `test/pu-04-performance.test.ts`.
- Checks: tsc pass; npm test 1269 pass / 0 fail / 5 skipped; build pass; production headers verified with curl.

### PU-03 FAQ and trust content for Western parents (2026-10-21)
- Result: done (main). The FAQ already covered one-on-one lessons, safety (sit in, Zoom host + waiting room, no recording), time zones and cancelling. Added three answers: "What happens if we miss a lesson?" (reminders; a missed lesson counts as taken; emergencies via WhatsApp as goodwill; if we cancel you choose a new time, credit or refund), "How will I know how my child is doing?" (family summary after lessons, progress per subject, printable monthly report, chat), "Can I manage all my children in one account?" (one family account, children 6 to 17, one family calendar, 5% off a second child's package). The female-teacher answer now mentions daughters and changing teacher. Every fact is checked against RULES.md §2 and §4 in a test; no monthly email is promised (PR-09 is not live).
- Files: `src/data/content.ts`, `test/pu-03-faq.test.ts`.
- Checks: tsc pass; npm test 1267 pass / 0 fail / 5 skipped; build pass.
- Owner review (provisionally approved per the overnight instruction): the new Arabic and English wording.

### AD-03 Chat inbox for the admin (2026-10-21)
- Result: done (main). The admin's Messages page (which already listed every conversation) is now an inbox: unread first, then newest; search by family or teacher name; filter by type (support / lessons) and by teacher; an unread count. In a conversation: a "Family timeline" link to the CRM-01 student page, and quick replies (4 built-in in Arabic and 4 in English, written as "we"), inserted into the draft and never sent by themselves; "Save as quick reply" keeps the admin's own replies, removable. Families and teachers see their chat exactly as before.
- Server: the thread list adds the owner's student id for the admin only.
- Files: `server/routes/community.ts`, `src/components/chat/ChatPanel.tsx`, `src/components/chat/quickReplies.ts`, `test/ad-03-admin-inbox.test.ts`.
- Checks: tsc pass; npm test 1264 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: dashboard page not opened (owner rule). The admin's own replies are kept in that browser only (fine for one admin; a table if several admins should share them).

### TE-03 Weekly hours editor polish (2026-10-21)
- Result: done (main). "My teaching hours" now opens with a week grid of half-hour cells: press and drag with a mouse or pen to paint hours on or off (also across days); on a phone a tap toggles a cell and a swipe still scrolls; every cell is a keyboard button with a spoken day and time. Below it: copy one day's hours onto chosen days (replaces those days), and a preview "a student in London / New York / Chicago / Los Angeles / Toronto / Berlin / Sydney sees your hours like this" for the coming week, so daylight saving is right and day changes show (e.g. 02:00 Cairo is Sunday in Los Angeles). The exact-minute list editor stays underneath for odd times; painting a day only rewrites that day.
- Same data shape and the same `PUT /api/dashboard/availability`; the availability engine and server validation are untouched (end of day is saved as 23:59, which the server already accepts).
- Files: `src/dashboard/lib/weeklyHours.ts`, `src/dashboard/components/WeekHoursGrid.tsx`, `src/dashboard/pages/AvailabilityPage.tsx`, `test/te-03-weekly-hours.test.ts`.
- Checks: tsc pass; npm test 1259 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: dashboard page not opened (owner rule), drag behaviour verified by code and helper tests only. Painting a day with non-half-hour times (e.g. 09:10) rounds that day out to whole half hours.

### ST-05 Profile page split (2026-10-21)
- Result: done (main). The page already had tabs (personal details, learning track, booking & preferences, security); the family items (add a child, the children list with "Book for", the responsible guardian) were inside the learning tab and now have their own "Family" / "العيلة" tab, moved unchanged. The open tab is in the URL (`/student/account?tab=family|learning|preferences|security`) so links and reloads land on it, without adding history entries. Section buttons are announced as tabs (tablist/tab/tabpanel, aria-selected). Preferences description now mentions emails (RN-07 lives there). The privacy section comes with ST-06.
- Files: `src/student/pages/StudentProfilePage.tsx`, `test/st-05-profile-split.test.ts`.
- Checks: tsc pass; npm test 1253 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: signed-in page not opened (owner rule).

### ST-02 Post-lesson moment (2026-10-21)
- Result: done (main). After a lesson ends (completed, or confirmed and past its end; up to 7 days), the portal home shows "How was the <subject> lesson with <child>?" with five stars: one tap saves the rating. Then an optional comment (only our team reads it) and the teacher's family summary for that lesson, or a note that it will come soon. "Hide" keeps it away for that lesson on this browser. Follows the child switcher.
- Who sees what: the super admin sees each rating and comment and every teacher's average (Analytics page, "After-lesson ratings"). A teacher sees only their own average on the Today page, counted over finished calendar months that each hold 5+ ratings (security review fix: a live average would let a teacher work out one family's rating by comparing before and after a lesson); comments never reach teachers. A rating can be changed only during the month it was given, so a closed month never moves (second review fix). Residual: deleting a booking or a student removes its rating from a closed month (admin-only actions). Only the account that owns the lesson can rate it; the same account can change its rating, another cannot overwrite it.
- Migration: `20261021000004_lesson_feedback.sql` (applied; table readable and writable by the server only, checked on production grants).
- Files: `server/routes/feedback.ts`, `api/index.ts` (registration), `src/student/components/LessonFeedbackCard.tsx`, `StudentHomePage.tsx`, `src/dashboard/components/LessonFeedbackPanels.tsx`, `AnalyticsPage.tsx`, `TodayPage.tsx`, `test/st-02-lesson-feedback.test.ts`.
- Checks: tsc pass; npm test 1248 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: signed-in pages not opened (owner rule); no real rating was written (would need a real family account and a finished lesson). `src/types/database.ts` does not list tonight's new tables (it has not been kept in step for recent tables either).

### PA-05 Parent onboarding tour (2026-10-21)
- Result: done (main). A family account (a guardian with linked children) gets a 4-step tour on its first portal visit after onboarding: the child switcher, booking, progress, and messages to our team. It uses the existing spotlight tour (skip, Esc, arrows), opens about a second after the page settles, never over the sign-in modal, and is stored as seen per account on this browser once closed or skipped. The help button ("Tour Guide" / "دليل الاستخدام") replays it; adult learners keep the general tour. On phones the progress step shows as a centred card (that link lives in the menu).
- Files: `src/student/familyTour.ts`, `src/student/StudentApp.tsx` (messages tab is now a tour target), `test/pa-05-family-tour.test.ts`.
- Checks: tsc pass; npm test 1242 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: signed-in page not opened (owner rule); "seen" lives in the browser, so a parent on a second device sees it once more there.

### PA-03 Family calendar (2026-10-21)
- Result: done (main). New portal page `/student/calendar` (sidebar: "Calendar" / "تقويم العيلة"): all the family's lessons in a week view (one column per day; stacked on phones) or a month view (dots per child; a day opens its week), one colour per child with a legend, times in the viewer's time zone (shown on the page), today highlighted. On the lesson day the Join button appears when the join window opens (same rule as the lesson-day card). Each upcoming lesson has "Add to my calendar" (an .ics file made in the browser).
- Subscription link: "Get my calendar link" creates a private feed URL (`/api/calendar/family/<token>.ics`) for Google/Apple/Outlook. 32 random bytes; only the SHA-256 is stored (`calendar_feed_tokens`), the link is shown once; "Make a new link" revokes the old one, "Turn the link off" deletes it. The feed lists confirmed lessons from 30 days back to 180 ahead with subject and first name only, never Zoom links (joining stays on the site); malformed or unknown tokens get a plain 404; rate limited; `noindex`.
- Shared `src/lib/ics.ts` (RFC 5545: UTC times, escaping, 75-octet folding that keeps Arabic characters whole).
- Migration: `20261021000003_calendar_feed_tokens.sql` (applied).
- Also: a few test files written tonight through the shell had double backslashes collapsed; the one that became looser (RLS lockdown regex) is fixed, the others were checked and are exact.
- Files: `api/index.ts`, `src/lib/ics.ts`, `src/student/pages/StudentCalendarPage.tsx`, `StudentApp.tsx`, `test/pa-03-family-calendar.test.ts`.
- Checks: tsc pass; npm test 1238 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: signed-in page not opened (owner rule); if Vercel's firewall challenges bots, calendar apps fetching the feed could be blocked: test the link once in Google Calendar after launch and allow `/api/calendar/family/*` if needed; a leaked link shows lesson times and first names until it is turned off.

### CRM-07 Funnel analytics that match reality (2026-10-21)
- Result: done (main). Reports page (admin): a table of accounts by sign-up week (Cairo weeks, last 8) through signed up → set-up done → trial booked → trial attended → first payment → second month, with real counts only. Clicking a number lists the accounts behind it, each linking to the student page. A family counts once: the account plus the children whose guardian email is the account's. Trial booked ignores cancelled trials; first payment = a payment received (confirmed, or refunded later); second month = paid lessons attended at least 28 days apart. The existing lead-based report was checked: its numbers are all computed from leads/bookings/payments (no estimates), so it stays.
- Server: `server/routes/funnel.ts` (pure `buildAccountFunnel` + `GET /api/dashboard/admin/funnel?weeks=`, admin only).
- Also fixed: the recurring ECONNRESET in `task-0.55-google-calendar-deep-audit` (3 times tonight). Cause: Node 24 clients keep connections alive and reused an idle socket the dev server had just closed after its 5-second default. `server.ts` (local dev server only; production runs on Vercel functions) now keeps idle sockets for 65 s (`headersTimeout` 66 s). Two full runs in a row after the fix: 1230 pass, 0 fail.
- Files: `server/routes/funnel.ts`, `api/index.ts`, `src/dashboard/components/AccountFunnel.tsx`, `AnalyticsPage.tsx`, `server.ts`, `test/crm-07-account-funnel.test.ts`.
- Migration: none
- Checks: tsc pass; npm test 1230 pass / 0 fail / 5 skipped (twice); build pass.
- Not checked / risks: the dashboard page was not opened live (owner rule); guardian emails are matched as stored (lower case from the site's forms).

### CRM-06 Search everything (2026-10-21)
- Result: done (main). Super admin presses Ctrl/Cmd+K (or the search icon in the dashboard header) and types a name, email, phone, booking reference or payment id/reference. Results cover accounts, children (found through their parent's name or email), bookings, payments and leads, grouped by type; arrow keys move, Enter opens the record (the student page for accounts, children, bookings and payments; the leads page for leads), Escape closes. Focus-trapped dialog with listbox semantics. The page-name search in the header stays as it was.
- Server: `GET /api/dashboard/admin/search?q=` (admin only, 2–80 characters, 8 per type, 30 in total). Every filter value goes through `pgrstValue(escapeLike(...))`; a raw id is used only after a UUID check. Queries with filter syntax (`a,b),status.eq.x`, `%_*"\`) return normally.
- Found and fixed while building: the shortcut hook was first placed after the dashboard's early returns (a React hooks-order bug); moved above them, and the test pins it.
- Files: `api/index.ts`, `src/dashboard/components/CommandSearch.tsx`, `src/dashboard/DashboardApp.tsx`, `test/crm-06-search-everything.test.ts`.
- Migration: none
- Checks: tsc pass; npm test 1226 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: the dashboard was not opened live (signed-in, owner rule); leads open the list, not one lead (the leads page has no deep link yet).

### CRM-05 CSV export (2026-10-21)
- Result: done (main). Admin-only downloads: students (with parent contact for children, teacher name, subject, level, onboarding, how they heard about us, first-touch utm_source) and payments from the Students page; leads from the Leads page. Built on the server (`server/routes/exports.ts`, `GET /api/dashboard/admin/export/{students,leads,payments}.csv`), UTF-8 with a BOM so Arabic opens correctly in Excel, up to 5000 rows each.
- Safety: no notes columns at all (teacher private notes, admin notes, lead/payment notes), no tokens; a cell that starts with = + - @ or a tab gets a leading apostrophe so a name like `=HYPERLINK(...)` can never run as a formula (CSV injection); `Cache-Control: no-store`. 401 without sign-in, 403 for teachers.
- Files: `server/routes/exports.ts`, `api/index.ts`, `src/dashboard/lib/dashboardApi.ts` (`dashboardDownload`), `src/dashboard/components/ExportCsvButton.tsx`, `StudentsPage.tsx`, `LeadsPage.tsx`, `test/crm-05-csv-export.test.ts`.
- Migration: none
- Checks: tsc pass; npm test 1222 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: the dashboard buttons were not clicked live (signed-in, owner rule); more than 5000 rows would be cut (far above today's numbers).

### RN-07 Notification preferences (2026-10-21)
- Result: done (main). Profile → Preferences now has three switches that save at once: progress emails (for PR-09), renewal reminders (RN-02 low balance) and follow-ups (RN-05 trial follow-up, and RN-06 later). Booking, lesson-reminder and payment emails are not listed and always go (the page says so). A switch stops only the email; the notice on the site still appears. One choice per account, so a parent's choice covers all their children.
- Server: new table `notification_preferences` (per auth user, all on by default, RLS on, service role only); `server/notifications/preferences.ts` (`loadPreferences`, `emailAllowed`, `sanitizePreferences`; a read error never silences an email); `notifyUser` takes an optional `preference` and skips just the email when it is off; RN-02 passes `renewal_reminders`; RN-05 checks `follow_ups` before emailing and still records the on-site notice. `GET/PUT /api/student/notification-preferences` (signed-in family only, rate limited, only the three keys as booleans).
- Migration: `20261021000002_notification_preferences.sql` (applied).
- Tests: new `test/rn-07-notification-preferences.test.ts`; RN-05 test gains "follow-ups off → on-site notice only, once"; RN-02 test checks the renewal-reminders switch is passed.
- Checks: tsc pass; npm test 1217 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: the signed-in profile page was not opened (owner rule); there is no unsubscribe link in those emails yet (they point to the profile page through the site).

### RN-04 "Same time next week?" (2026-10-21)
- Result: done (main). After a lesson attended in the last 7 days, the student home shows "Same time next week?" with the day, time (viewer's time zone), teacher and learner, a "Book it" button and "Not now" (remembered per suggested time). "Book it" opens the booking flow as "book again" for that lesson with that time chosen (`/student/book?repeat=<id>&slot=<UTC start>`); the family still reviews, pays or uses a credit, and confirms. Nothing is booked automatically and there is no recurring booking.
- Server: `GET /api/student/next-week-suggestion?learnerId=` (signed-in family only; 403 for teachers and for learners outside the family; read-only). It takes the latest completed lesson of the last 7 days, adds one week at the same clock time in the student's time zone (so a daylight-saving change does not shift it), needs at least 24 hours of notice (never jumps to the week after), skips learners who already have a lesson booked in the next 8 days, and asks the existing `validateSlotAvailability` engine whether the teacher is free.
- Booking flow: the suggested time arrives as a placeholder slot; the date step selects the live slot with that exact start from the engine's list (or the day's first free slot if it was just taken). Ordinary bookings are untouched (the swap only applies to the placeholder).
- Files: `server/booking/studentWindows.ts` (`nextWeekSlot`), `api/index.ts`, `src/student/components/NextWeekSuggestion.tsx`, `StudentHomePage.tsx`, `StudentBookingPage.tsx` (`suggestedSlotFrom`), `StepDateTime.tsx`, `test/rn-04-next-week-suggestion.test.ts`.
- Migration: none
- Checks: tsc pass; npm test 1211 pass / 0 fail / 5 skipped on the second run (first run: one ECONNRESET in `task-0.55-google-calendar-deep-audit`, the known flake: those tests make the local server call Google with a fake code); build pass.
- Not checked / risks: signed-in pages checked from code and tests (owner rule); the suggestion is computed when home loads, so a slot taken in between is caught by the live list and again by the server at booking.

### PR-08 Monthly progress report page (2026-10-21)
- Result: done (main). `/student/progress/report?month=YYYY-MM&learnerId=` (a "Monthly report" button on the progress page opens it for the learner on screen): a one-page report in the placement report's identity: lessons attended, minutes and weeks with a lesson that month, where each subject stands (current level), the month's milestones, the teacher's summaries condensed (six latest, max 320 characters each), the latest next step, and the list of lesson dates. Previous/next month buttons (no future months). Footer: "This is a progress report, not a certificate." in both languages. Print / save as PDF prints only the report, in colour, with no fixed paper size so it fits A4 and Letter.
- Server: `GET /api/student/progress/report` (family check like the progress page; 401/403 otherwise), pure `buildMonthlyReport` buckets dates in the learner's time zone (a lesson at 23:30 UTC on 31 October counts as November in Cairo). `buildLessonTimeline` can now return every lesson (`page: -1`, server only); the public timeline endpoint clamps the page to 1 or more.
- Level movement: shown as the current level per subject plus any level/book milestones of the month; there is no level history table to compare against.
- Files: `server/routes/progress.ts`, `src/student/pages/StudentProgressReportPage.tsx`, route in `StudentApp.tsx`, link in `StudentProgressPage.tsx`, print rule in `src/index.css`, `test/pr-08-monthly-report.test.ts`.
- Migration: none
- Checks: tsc pass; npm test 1206 pass / 0 fail / 5 skipped on the second run (first run: one ECONNRESET in the Google Calendar callback test, a known flake, unrelated); build pass.
- Not checked / risks: the signed-in page and its print preview were not opened (owner rule); a very long month (20+ lessons) may run onto a second printed page.

### PR-05 Lesson timeline and PR-10 progress on home (2026-10-21)
- Result: done (main).
- PR-05: under the path on the progress page, every attended lesson newest first: date and time in the viewer's time zone, subject, teacher, a free-trial tag, the teacher's family summary, achievements as chips, and "for next time". 20 per page with "Show older lessons". New `GET /api/student/progress/timeline?learnerId=&page=` (same family check as the progress page: 401 without sign-in, 403 for teachers and for a learner outside the family). Built by the pure `buildLessonTimeline` in `server/routes/progress.ts` from attended sessions and completed bookings (each lesson once; missed/cancelled skipped); only family-safe note fields are selected, never `private_notes`. Arabic counts read naturally (حصة واحدة، حصتين، ٥ حصص، ٢٥ حصة).
- PR-10: a compact card on the student home page right after the lesson-day card: the rhythm lantern with weeks in rhythm, subject and current level, the newest milestone; it opens the progress page for the learner chosen in the header. Lazy-loaded so home stays light; if progress cannot load, the card simply is not shown.
- Files: `server/routes/progress.ts`, `src/student/components/progress/LessonTimeline.tsx`, `src/student/components/progress/HomeProgressCard.tsx`, `StudentProgressPage.tsx`, `StudentHomePage.tsx`; tests `test/pr-05-lesson-timeline.test.ts`, `test/pr-10-home-progress-card.test.ts`.
- Migration: none
- Checks: tsc pass; npm test 1201 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: signed-in pages checked from code and tests only (owner rule); the timeline reads up to 1000 rows per table for a learner (enough for years of weekly lessons).

### PR-04 Milestone celebration and achievements shelf (2026-10-21)
- Result: done (main). Built from the approved design (`docs/superpowers/specs/2026-10-20-milestone-celebration-design.md`); leaderboard, Hall of Honor, consent flow and parent email stay separate tasks, as the backlog says.
- What it does: the progress page now ends with an achievements shelf of 12 emblems in our own SVG (first lesson; 10/25/50/100 lessons; a weekly rhythm of 4, 12 and 52 weeks; a surah, a juz, a tajweed rule, a level or book), plus any custom teacher recognition. Earned ones are in colour with the teacher's own title or the date; the rest are outlines that say what earns them. Effort only, no ranking. When something new appears, one short celebration plays: kids get a spring rise, a gold pulse and about two dozen falling stars and crescents (2 s); teens a smooth rise with a halo; adults and parents looking at a child a quiet fade with a still glow. No sound. Reduced motion shows it all at once. It can be closed (button, X, Escape, backdrop), traps focus, and tells how many more emblems are new.
- Plays once: a per-learner list of seen achievements in localStorage (`watazawwado_seen_achievements_<learnerId>`), so a parent with several children misses nobody. First visit on a device: everything already earned counts as seen silently, except a teacher milestone from the last 14 days. No storage available → no celebration (it would repeat every visit).
- Words: Kids "ما شاء الله! أحسنت يا بطل!" / "…أحسنتِ يا بطلة!", teens "بارك الله فيك، إنجاز رائع", adults "تقدّم ملحوظ، نسأل الله أن يتقبّل منك" (gendered), parents "<name> حقق/حققت إنجاز جديد. ما شاء الله!"; English equivalents. Seasonal line for Ramadan, the first nine days of Dhul Hijjah and both Eids, with a faint crescent or Kaaba outline behind the emblem. Season computed on the server from the Umm al-Qura calendar in the learner's time zone (`src/lib/islamicSeason.ts`, `currentIslamicSeason` on `GET /api/student/progress`); the read model now also returns the learner's age and gender for the tone.
- Files: `src/student/components/achievements/` (achievements.ts, AchievementEmblems.tsx, AchievementsShelf.tsx, MilestoneCelebration.tsx, useProgressAchievements.tsx), `src/lib/islamicSeason.ts`, `server/routes/progress.ts`, `StudentProgressPage.tsx` (shelf + overlay; also fixed a dev-preview race that showed the error card), dev fixture `?preview=kid`, `.emblem-locked` in `src/index.css`, new `test/pr-04-milestone-celebration.test.ts` (15 tests).
- Screenshots (taken in the session, local preview): adult celebration in Arabic, dark; kids celebration in Arabic, dark; adult celebration in English; shelf in Arabic dark and English light; shelf at 375 px (2 columns, no overflow).
- Migration: none
- Checks: tsc pass; npm test 1192 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: the real signed-in page was not opened (owner rule); seen-state lives per device, so a second device shows a recent teacher milestone once more; the emblem numerals are Western digits in both languages; owner review of the 12 emblem drawings and the Arabic praise lines is welcome.

### QA-04 Mobile break test (2026-10-21)
- Result: done (main). Public pages measured live on production at 360×740 (home, pricing, learning, faq, about, how-it-works, safety, terms, privacy, staff sign-in): no horizontal overflow on any page. Portal and dashboard checked from code (owner rule).
- Fixed: footer column and legal links 20–32 px tall → 44 px; "related pages" links on FAQ/About/How it works 20 px → 44 px; pricing "try a free lesson first" 29 px and "questions about paying?" 18 px → 44 px; staff sign-in: forgot-password, show-password, student-area link, theme button → 44 px. Portal: header language and messages/notifications icons, copy-reference button (a new `tap-44` class gives a 44 px touch area without changing the look), and seven text buttons (pay/confirm, details, book again, pay now, ask our team, remove child, retry) → `min-h-11`. Dashboard: 48 small buttons/links get `tap-44` (look unchanged). The portal and dashboard shells used `h-screen` (100vh), which is taller than a phone's visible area when the address bar shows; now `100dvh` where supported. The floating learning-guide button covered the hero's trial button on a 360×740 phone; on phones it now appears after a short scroll.
- Checked and fine: the mobile tab bar has matching bottom padding plus the safe-area inset; the only fixed element on the public home is the header.
- Tests: new `test/qa-04-mobile.test.ts`.
- Migration: none
- Checks: tsc pass; npm test 1179 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: signed-in pages were not rendered on a phone; overlap of neighbouring `tap-44` areas is a few pixels where buttons sit 6 px apart (the later one wins); the keyboard covering inputs was reviewed from code only (no bottom-fixed inputs in the portal; the guide chat panel uses `100dvh`).

### QA-03 RTL and bilingual sweep (2026-10-21)
- Result: done (main). Swept `src/` (curriculum slides excluded: a fixed 16:9 canvas laid out on purpose).
- Fixed: physical margins/paddings that ignored the reading direction → logical (`ms-`, `pe-`, `ps-`, `start-`) in the booking flow (stepper link, date step, service list, time-zone search field and its icon), the packages and payments pages. Six hard-coded English accessible names → bilingual (booking header close, checkout close, shared Modal close, loading spinner, sign-up steps). The booking page's error banner mixed Arabic and English ("تحديث الجلسة / Retry", an Arabic-only sign-in message, and the raw server error with English after it): now one plain sentence and a "Try again" button in the visitor's language, without the raw error. The side menu border now sits on its inner edge in both directions.
- Checked and fine: every arrow/chevron flips in Arabic (by condition or `rtl:`); `left-1/2`-style centring and symmetric `left-0 right-0` bars; `Select` and `AccountDropdown` already handle RTL. Live on production in English: /, /pricing, /learning, /faq, /about, /how-it-works, /safety, /terms show Arabic only in the language button, the brand name, the Quran verses (marked `lang=ar`) and decorative letters.
- Tests: new `test/qa-03-rtl-bilingual.test.ts` (no physical ml/mr/pl/pr or text-left/right outside `rtl:` pairs; no hard-coded English `aria-label`).
- Migration: none
- Checks: tsc pass; npm test 1175 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: signed-in pages in English were reviewed from code only; text inside API error messages shown to students is English on the server for some routes (covered for booking by ST-03's `bookingErrorText`).

### QA-02 Accessibility audit (2026-10-21)
- Result: done (main). Public pages checked live (keyboard and an in-page scan for unnamed buttons/links/fields, missing alt, duplicate ids, h1 count, dialog names) on /, /pricing, /learning, /faq, /about, /how-it-works, /safety, /staff/login, the trial sheet, the sign-up form and the site menu; portal and dashboard checked from code (owner rule).
- Fixed: `FocusTrap` rewritten (focus moves in on open, Tab/Shift+Tab wrap even when focus started outside, focusables recomputed on every Tab, Escape, focus returns to the opener, nested dialogs handled by a stack). Before, the trial sheet let Tab escape to the page, ignored Escape and never moved focus in. Now used by the trial sheet, sign-up/sign-in, site menu (also gets role=dialog and a name), time-zone picker, and the dashboard booking, lead, trial, payment and student-edit dialogs. Dialog titles are h2 (pages keep one h1). 15 portal/dashboard fields and 13 booking-flow fields had no programmatic label: labels now point at their fields (`htmlFor`/`id`) or carry `aria-label`. Header logo link had its focus outline removed with nothing in its place: now `focus-ring`. Duplicate `id="theme-toggle-btn"` removed (the tour now picks the visible one by `data-tour`). Dark theme: error text was 4.21:1, now `#EC4046` (4.9:1 on the background, 4.5:1 on cards) with dark text on red fills; white on the crimson fill was 4.34:1, that fill is now `#DD2A30` (4.7:1). Dead `TeacherAuthModal` and `teacherRepository` removed (unreachable, read tables directly).
- Measured: light and dark tokens: foreground 17.8:1, muted text 8.4–10.7:1, accent 6.3:1, teal 4.5–6.4:1.
- Tests: new `test/qa-02-accessibility.test.ts` (every field in `src/` has a name; every `role="dialog"` uses FocusTrap; trap behaviours; no second h1 in dialogs; no duplicate theme id). `phase-d-remediation` updated to the new trap's code for the same two behaviours.
- Migration: none
- Checks: tsc pass; npm test 1172 pass / 1 fail (the old FocusTrap string check, then updated and passing) / 5 skipped; build pass.
- Not checked / risks: no screen reader was run; there is no toast system to give `aria-live` (inline messages use `role="alert"`); contrast was checked on the tokens, not on every glass surface or gradient; signed-in pages were not keyboard-tested live.

### QA-01 Smoke tests for the money paths (2026-10-21)
- Result: done (main), with a deliberate limit. The local server uses the production database, and a real booking there would make the production cron create a Zoom meeting, a teacher calendar event and emails. So `test/qa-01-money-paths-smoke.test.ts` walks every money path up to the first write, with dev auth and booking ids that match no row: booking validation (duration, trial length, time zone, email, name, guardian, slot), checkout (Stripe only, a known booking only, no amount read from the browser), payment confirmation only through a verified Stripe session or a signed webhook, every student money route 401 without a token and 403 for a teacher, cancel/move of a lesson that is not yours → 404, packages data from the server catalogue, refund and pay-later admin-only, and no money keys in the teacher Today/Upcoming responses.
- Window rules moved into `server/booking/studentWindows.ts` (same checks, same messages, same order) and unit tested: trial cancel 1 h, other lessons 3 h, move up to 1 h, a trial moved once, a pending/finished lesson can be neither moved nor cancelled; teacher moves need a reason before the RPC; a move lands on a later day in the student's time zone.
- Found: the Stripe test key in the local `.env` is expired (Stripe answers "Expired API Key"), so no local checkout can reach Stripe. Owner: create a new test key in the Stripe dashboard and put it in `.env`; check the production key works with one real checkout before launch.
- Migration: none
- Checks: tsc pass; npm test 1168 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: the write path (create booking → Stripe test checkout → webhook → confirmed, sign-up/onboarding writes) needs a separate test database (a second free Supabase project with the migrations applied, wired through `.env.test`), owner decision. The dev teacher may have no lessons, in which case the no-money walk checks empty lists; TE-02's test covers the student card.

### SEC-01 Security review of the recent changes and the live database (2026-10-21)
- Result: done (89463f0). Owner asked for a careful security pass before more backlog work. Scope: every code change in b850ad2..HEAD (OPS, RN, CRM, PA, ST, TE, AD, PU), plus production RLS policies, table/column grants and the Supabase security advisor.
- Found and fixed (applied to production, verified as a real teacher session inside a rolled-back transaction):
  - High: any active teacher could read every `payments` row straight through Supabase REST with their own token (policy from 2026-10-13, before the 2026-10-15 rule "teachers never see money"). Now super admin only. Teacher sees 0 of 2 rows.
  - High: the teacher policy on `bookings` is FOR ALL, so a teacher token could UPDATE their bookings directly (e.g. set an unpaid booking to confirmed) and read `fee_amount_usd` and the management token. Browser roles now have no writes on bookings, payments or package_entitlements, and the fee and token columns are not granted.
  - High: twelve "Teacher allowlist access" FOR ALL policies let any teacher read and change every parent's contacts (guardians), every lead, other teachers' hours (availability), the AI facts (ai_knowledge), testimonials and blog posts, profiles, reminders, goals, progress, sessions. Now super admin only. Public reads and students' own reads unchanged.
  - Medium: `package_entitlements` teacher read exposed `price_paid`; the policy now matches nothing (the API strips money for teachers).
  - Medium: `/api/dashboard/students/:id` put the stored email raw into a PostgREST `or()` filter (an `_` in an email matches other families' bookings). Now quoted and wildcard-escaped; a new test fails on any future unescaped `ilike` filter.
- Checked and fine: new routes are guarded (admin routes `requireSuperAdmin`, `/api/student/children` rate limited and scoped, CRM ids validated); Stripe webhook heartbeat runs after the signature check; lead source sanitised (known keys, short plain strings, host/path only); new emails escape names and text; no `dangerouslySetInnerHTML`, `eval` or open redirect added; students store and receive only the Zoom join link (0 host links in the database); new tables are RLS-on, service-role only; students can update only 7 harmless columns of their own row; email confirmation is on (0 unconfirmed accounts), so email-based family linking holds; the browser's 4 RPCs are SECURITY DEFINER and token-checked.
- Migrations: `20261021000000_browser_roles_money_lockdown.sql`, `20261021000001_teacher_allowlist_to_super_admin.sql` (both applied).
- Checks: tsc pass; npm test 1155 pass / 0 fail / 5 skipped; build pass; production /api/health ok, /pricing renders, admin API 401 without a token.
- Owner action (a security setting, so not changed by Claude): Supabase → Authentication → enable leaked password protection. Keep "Confirm email" on: family linking relies on verified emails.
- Not fixed (low): `/api/client-errors` is public and rate limited per IP per instance, so many IPs could still add many distinct error rows; the old `Teacher scoped access` policies on students/bookings join `auth.users` and simply error for browser roles (fail closed, unused). `src/components/TeacherAuthModal.tsx` and `src/lib/teacherRepository.ts` are dead code that read tables directly; left for QA-06.

### PU-02 Conversion audit of the trial path (2026-10-21)
- Result: done (main). Walked home → trial CTA → "your first lesson is on us" sheet → sign-up form at 375×812 in the local preview; onboarding (signed in) reviewed from code per the owner rule (no browser sign-in).
- Found and fixed: header theme, language and menu buttons were 32–41 px tall (now 44 px, `ThemeToggle.tsx`, `Navbar.tsx`, no horizontal overflow at 375 px); sign-up sheet close/back and show-password buttons were 36 px (now 44 px, password field padding widened, `StudentAuthModal.tsx`); onboarding errors render above the form, out of view on a phone after tapping Continue at the bottom, so they now scroll into view and are announced (`role="alert"`, `StudentOnboardingPage.tsx`).
- Kept as is: the funnel copy is already short and honest (30 min free, no card, choose a male or female teacher); sign-up asks name, email, password and an 18+ tick (family: guardian age), and onboarding pre-fills the name and the guardian age from sign-up, so nothing is asked twice; "How did you hear about us" is optional; the age tick's whole row is the tap target.
- Screenshots: before, header buttons 32×32 / 53×33 / 41×32 and sheet buttons 36×36 (measured in the preview); after, 44×44 / 53×44 / 44×44 and 44×44. Images were taken in the session, not saved to the repo.
- Migration: none
- Checks: tsc pass; npm test 1149 pass / 0 fail / 5 skipped; build pass.
- Not checked / risks: onboarding steps 2–3 and the trial booking itself were not clicked through (signed-in); footer legal links stay 20 px tall (low traffic, left for QA-04).

### MK-02 Retired "Islamic studies" removed from public copy (2026-10-20)
- Result: done (main). Follow-up to MK-01; catalog per RULES.md §2b.
- Changed: `AboutPage.tsx` (intro and both teacher cards name the Zad Path; "strong English" with no level or certificate, owner's answer on the Notion review page §9), `PublicLayout.tsx` meta description, `src/data/seo.ts` (home title/description/h1, /learning description now lists the current catalog), `PrivacyPolicyPage.tsx` intro, `TermsPage.tsx` (agreement intro and prices: $9 = Quran, Tajweed and the Zad Path; $13 = Fusha, Egyptian Arabic and English) with `TERMS_VERSION` 2026-10-15.3 → 2026-10-20.1 in `api/index.ts` and the page label, `StepLessonType.tsx` 60-minute note, student portal `StudentPackagesPage.tsx` package band labels and `StudentProfilePage.tsx` plan line, `/learning` search placeholder (Fiqh → Seerah, Fusha), `index.html` (title, meta, Open Graph, Twitter, JSON-LD), `public/site.webmanifest`, AI chat facts `server/siteFacts.ts` ($9/$13 bands) and the homepage guide and Jalila prompts, new `test/retired-subject-copy.test.ts`.
- Migration: none
- Checks: tsc pass; build pass, no prerendered page in `dist/` names Islamic studies or IELTS C1; npm test 1124 pass / 7 fail / 5 skipped, the 7 being the CRLF checkout artefacts noted in MK-01 (migration source regexes, files untouched); production 2026-10-20: /, /about, /terms, /privacy, /learning all 200 with no "Islamic studies" or IELTS and the Zad Path present, /terms shows version 2026-10-20.1, web manifest updated, /api/health 200.
- Not checked / risks: still mentioning retired subjects, not public: dashboard `SettingsPage.tsx` price note, `LeadDetailModal.tsx`/`TrialDetailModal.tsx` subject lists, `src/booking/mockData.ts` retired service rows (inactive), `StudentOffersPage.tsx` fallback label for old offers, onboarding `subjects.ts` retired rows (kept by design), `metadata.json` (AI Studio file, centres one teacher), `.claude/product-marketing.md` one-liner, RULES.md §3/§6b wording, placement bank `islamic.ts`.

### MK-01 Ready to measure content before the first post (2026-10-20)
- Result: done (main). From the external research review (`docs/marketing/reports/2026-10-20 External research review.md`).
- Changed: new `src/lib/leadSource.ts` (first-touch UTM tags + referrer host + landing path in localStorage `wz_first_touch`, only from a visit that carries any; sanitizer; "How did you hear about us?" options), `src/main.tsx`, `src/student/pages/StudentOnboardingPage.tsx` (optional question, sends both), `api/index.ts` (onboarding saves `heard_about` and `lead_source` once, never overwritten; `/api/dashboard/leads` adds `acquisition` per lead by email), `server/routes/crm.ts` (timeline "Account created" shows the source), `src/dashboard/pages/LeadsPage.tsx` + `src/dashboard/components/LeadsBoard.tsx` (source badge and filter), `@vercel/analytics` in `PublicLayout.tsx` (public pages only, cookie-free) + privacy page lines, copy fixes (homepage 8 subjects, /pricing Zad Path + single-lesson and $13 package line, booking summary pricing note, /pricing SEO description), new `/safety` parent page (`src/components/public/safety/SafetyPage.tsx`, only facts from the terms §Children, RULES.md §2 Zoom host and the privacy policy; linked from the footer, the FAQ and the sitemap), tests `test/lead-source.test.ts`, `test/measurement-ready.test.ts`.
- Migration: `20261020000003_lead_source.sql` (`students.lead_source jsonb`, `students.heard_about text` with a check), applied to production 2026-10-20.
- Checks: tsc pass; npm test 1111 pass / 7 fail / 5 skipped in the worktree, the 7 being CRLF checkout artefacts (same 4 files 22/22 pass after an LF re-checkout); build pass (9 pages prerendered); local static preview at 375px RTL (/safety, /pricing, homepage, first touch kept across pages); production: /safety 200 and in sitemap, /pricing copy live, `/_vercel/insights/script.js` 200, migration columns present.
- Not checked / risks: Admin views (CRM timeline, leads source badge and filter) not opened in the browser (no admin login here). Accounts that finished onboarding before today have no source. Other pages still say "Islamic studies" (About, layout meta, privacy, terms, home SEO title); left for a copy pass, the terms need a version bump.

### AD-01 Admin overview that answers "what needs me today" (2026-10-21)
- Result: done (main)
- Changed: `api/index.ts` (new `GET /api/dashboard/admin/action-items`, super admin only: follow-ups due by end of today, pay-later requests, refund requests, placement results waiting for review, unread support chats, health warnings, lessons in the next 24 h without a Zoom link; each with a count and a link, using the same filters as the page it opens), `server/routes/ops.ts` (health checks moved into `computeHealth()` so the health page and the overview share them), new `src/dashboard/components/ActionItems.tsx` (leads `OverviewPage.tsx`; only items with a count, or "Nothing needs you right now"), `test/ad-01-admin-action-items.test.ts`
- Migration: none
- Checks: tsc pass, npm test 1149 pass / 0 fail (5 skipped), build pass; route called against real data (3 placement results to review, 2 health warnings), health page unchanged after the refactor.
- Not checked / risks: unread chats are compared in code over support threads active in the last 30 days (500 at most). Dashboard not opened in a browser (owner rule).
### TE-04 Teacher onboarding checklist (2026-10-21)
- Result: done (main)
- Changed: `api/index.ts` (new `GET /api/dashboard/onboarding-checklist`: agreement = current `TEACHER_AGREEMENT_VERSION` (admin exempt), hours = an active `availability` row, calendar = an active Google `calendar_connections` row, photo = `teacher_accounts.photo_url`, Zoom = a booking of this teacher with a real Zoom link), new `src/dashboard/components/TeacherChecklist.tsx` (on Today until everything is done; each item links to where it is done), `TodayPage.tsx`, `test/te-04-teacher-checklist.test.ts`
- Migration: none
- Checks: tsc pass, npm test 1146 pass / 0 fail (5 skipped), build pass; route called with the teacher token against real data.
- Not checked / risks: there is no per-teacher bio field (the `bio` setting is global), so the item is "photo and card"; teachers can't upload a photo themselves, the item points them to Messages to send it to the admin. "Zoom tested" is inferred from a lesson having a Zoom link, not from a click. Dashboard not opened in a browser (owner rule).
### TE-02 Student card for teachers (2026-10-20)
- Result: done (main)
- Already there: goals from onboarding, milestones, lesson history and notes on `StudentDetailPage.tsx`.
- Added: `GET /api/dashboard/students/:id` returns the latest submitted/reviewed `placement` (level, score, reviewed or not) and `chat_thread_id` (the teacher's lesson chat with this family, or the admin's support chat); the page shows a placement line and "Message the family" (`/dashboard/messages?thread=...`). Files: `api/index.ts`, `src/dashboard/pages/StudentDetailPage.tsx`, `src/dashboard/types.ts`, `test/te-02-teacher-student-card.test.ts`
- Money: the test calls the route with the teacher token for a real student assigned to that teacher and walks the whole response for any fee/price/amount/payment/refund/currency key: none.
- Migration: none
- Checks: tsc pass, npm test 1144 pass / 0 fail (5 skipped), build pass. Dashboard not opened in a browser (owner rule).
### TE-01 Today page as a cockpit (2026-10-20)
- Result: done (main)
- Changed: `api/index.ts` (`GET /api/dashboard/today` adds `summary.next_lesson_context`: the learner's age, level, subject and the latest family summary + next steps; and `missing_notes`: the teacher's completed lessons of the last 14 days with no family summary, up to 10, with the learner's own name), `src/dashboard/pages/TodayPage.tsx` (the next lesson card now leads the page, above the numbers, with age, level, "last time (to the family)" and next steps next to the existing Start-as-host button; "Summaries still to write" after today's lessons, each linking to the student page where the PR-06 editor is), `src/dashboard/types.ts`, `test/te-01-today-cockpit.test.ts`
- Migration: none. Private teacher notes are never read by this route.
- Checks: tsc pass, npm test 1129 pass / 0 fail (5 skipped), build pass; route called in-process against real data (200, no errors) and the new PostgREST filters checked directly.
- Not checked / risks: there were no lessons today and no completed lessons in the last 14 days, so the filled-in card and list were not seen with data. Dashboard not opened in a browser (owner rule).
### ST-04 Empty, loading and error states across the portal (2026-10-20)
- Result: done (main)
- Audit (from the code, 11 data pages): all had a loading state; home, lessons, progress, packages, payments, notifications and booking already had an error with retry and empty states with a next step.
- Fixed: new shared `src/components/ErrorState.tsx` (plain message + "Try again", pairs with `EmptyState`). Curriculum and its lesson view (red text, no retry), placement report (red text), placement test (a failed load showed an empty page), profile (a failed load showed an empty form under a banner) and offers (error without retry; empty state now `EmptyState` with "Talk to the guide") now use it. Files: those pages + `test/st-04-portal-states.test.ts`
- Migration: none
- Checks: tsc pass, npm test 1125 pass / 0 fail (5 skipped), build pass. Not opened in a browser (signed-in pages; verified from code by owner rule).
### ST-03 Booking flow polish (2026-10-20)
- Result: done (main), presentation only, no booking rule touched
- Audit (from the code): step header, availability skeleton + retry, time zone on every time (date step banner, summary, confirmation) and the saved draft were already in place.
- Fixed: double tap could start two submits before React disabled the button (`submittingRef` guard in `BookingFlow.tsx`); a network failure said "Database service is currently unavailable" (now "check your internet"); a raw exception text could show for a bad time; booking errors were English for Arabic users (new `src/components/booking/bookingErrors.ts`: Arabic for the known messages, a plain Arabic sentence plus the detail otherwise); "min" on the Arabic confirmation. Files: `BookingFlow.tsx`, `bookingErrors.ts`, `BookingConfirmation.tsx`, `src/lib/bookingRepository.ts`, `test/st-03-booking-polish.test.ts`
- Not changed on purpose: the browser back button leaves the booking page rather than going back one step (the draft brings the family back to the same step); step-by-step history would mean managing history next to React Router.
- Checks: tsc pass, npm test 1114 pass / 0 fail (5 skipped), build pass. Not opened in a browser (signed-in page; verified from code by owner rule).
### ST-01 Lesson-day experience (2026-10-20)
- Result: done (main)
- Changed: new `src/student/components/LessonDayCard.tsx` (countdown that updates every 30 s, subject + learner, teacher name, Join in Zoom blue from 10 minutes before until the end, "Before the lesson" from the teacher's last shared next steps, "I'm running late" WhatsApp to the academy number with the booking reference), `StudentHomePage.tsx` (the card leads the page on the lesson's own day for confirmed/rescheduled lessons), `api/index.ts` (`GET /api/student/bookings` adds `teacherName` and `prepareNote` to upcoming lessons; `prepareNote` = latest `lesson_notes.next_steps` for that learner, never private notes), `test/st-01-lesson-day.test.ts`
- Migration: none
- Checks: tsc pass, npm test 1110 pass / 0 fail (5 skipped), build pass.
- Not checked / risks: not opened in a browser (needs a signed-in student with a lesson today). "Lesson day" is the viewer's device day.
### PA-02 Add another child after onboarding (2026-10-20)
- Result: done (main, after `/code-review`)
- Changed: `api/index.ts` (new `POST /api/student/children`: account holder only after onboarding, child 6-17 via `isChildAge`, at most 10 children, catalogue subject and its levels only, teacher = the picked active teacher or routed by gender, guardian link, undo if the link fails, teachers + admin told through `announceNewStudent`; a retry within 10 minutes returns the same child), new `src/student/components/AddChildForm.tsx` (profile page; opens from `#add-child`), `StudentProfilePage.tsx`, `StudentHomePage.tsx` ("Add a child" tile in the family section and a line for personal accounts), `StudentApp.tsx` + `activeLearner.tsx` (profile reloads quietly after a child is added), `test/pa-02-add-child.test.ts`
- Before: there was no way to add a child after onboarding; the home "Add child" link only opened the profile, which listed children without an add option.
- Migration: none
- Checks: tsc pass, npm test 1105 pass / 0 fail (5 skipped), build pass, ESM import scan clean. Review: 5 findings, 4 fixed (portal profile refresh, duplicate on retry, subject/level validation, home entry for personal accounts).
- Not checked / risks: not tried with a real parent session or in the browser. Route tests read the source rather than calling it with a real account.
### PA-01 Child switcher everywhere (2026-10-20)
- Result: done (main)
- Changed: new `src/student/activeLearner.tsx` (context + header `ChildSwitcher`: "Whole family" or one learner, saved under the progress page's key), `src/student/StudentApp.tsx` (provider + switcher in the header, only for accounts with children), `StudentLessonsPage.tsx` (filters by the chosen learner; "For <name>" on each lesson in the whole-family view), `StudentProgressPage.tsx` (header and the page's own child cards stay in sync), `StudentPackagesPage.tsx` (new packages default to the chosen child; list narrowed to them plus account-level packages), `StudentBookingPage.tsx` (a new booking starts for the chosen child), `api/index.ts`, `test/pa-01-child-switcher.test.ts`
- Fixed on the way: `GET /api/student/bookings` returned only the parent's own bookings, so a parent never saw the children's lessons. It now returns the whole family (same `getAuthorizedLearnersForStudent` check as cancel/reschedule) with `studentId` and `learnerName`.
- Migration: none
- Checks: tsc pass, npm test 1099 pass / 0 fail (5 skipped), build pass.
- Not checked / risks: not opened in a browser and not tried with a real parent session (dev tokens return mock data). Home already shows the whole family through the same bookings API. The parent appears in the switcher unless their booking preference is "child".
### CRM-04 Follow-up tasks with due dates (2026-10-20)
- Result: done (main)
- Changed: migration `20261020000002_crm_tasks.sql` (`crm_tasks` with `source` and a unique `dedupe_key`; RLS on, service_role only), `server/routes/crm.ts` (`createCrmTask`; `GET /api/dashboard/admin/crm/tasks` with name + WhatsApp, `GET/POST /api/dashboard/admin/students/:id/crm/tasks`, `PATCH /api/dashboard/admin/crm/tasks/:id`), `api/index.ts` (every attended free trial creates one task for the next day, key `trial:<booking id>`), new `src/dashboard/components/FollowUps.tsx` ("My follow-ups" card on the admin overview: overdue / today / this week in the admin's time zone, WhatsApp prefill from the academy team, Done; add form on the student page inside the admin notes panel), `src/dashboard/pages/OverviewPage.tsx`, `src/dashboard/components/CrmNotesPanel.tsx`, `test/crm-04-follow-up-tasks.test.ts`
- Migration: applied to production 2026-10-20.
- Checks: tsc pass, npm test 1095 pass / 0 fail (5 skipped), build pass; round trip on one real student (automatic task is created once per key, listed with the name, manual task 201, mark done removes it from the list), nothing left behind.
- Not checked / risks: `quiet_learner` and `low_balance` sources exist for RN-06 and later; RN-02 does not create tasks yet. Not opened in the browser (no dev login for the dashboard UI).
### CRM-03 Admin notes and tags per family (2026-10-20)
- Result: done (main)
- Changed: migration `20261020000001_crm_notes_tags.sql` (`crm_notes`, `crm_tags`; RLS on, service_role only), `server/routes/crm.ts` (`GET /api/dashboard/admin/students/:id/crm`, `POST/DELETE .../crm/notes`, `PUT .../crm/tags`, super admin only; `normalizeTags`), new `src/dashboard/components/CrmNotesPanel.tsx` on `StudentDetailPage.tsx` (admin only: tag chips with the four suggested tags in Arabic/English, free tags, notes with delete), `src/types/database.ts`, `test/crm-03-notes-tags.test.ts`
- Migration: applied to production 2026-10-20.
- Checks: tsc pass, npm test 1090 pass / 0 fail (5 skipped; the first run hit the recurring ECONNRESET flake in `phase5g-security`, a rerun passed), build pass; round trip on one real student (add/replace tags, add/read/delete a note, restore), nothing left behind.
- Not checked / risks: notes are per account; the table allows a child id but the panel doesn't offer it yet. Not opened in the browser (no dev login for the dashboard UI). The `phase5g-security` ECONNRESET flake shows up in about 1 of 3 full runs.
### CRM-02 Pipeline board (2026-10-20)
- Result: done (main)
- Changed: new `src/dashboard/components/LeadsBoard.tsx` (one column per lead status with counts; drag a card or use its "Move to" menu, offered moves come from `ALLOWED_LEAD_TRANSITIONS`; days since the lead last changed), `src/dashboard/pages/LeadsPage.tsx` (List / Board switch; search and filters apply to both), `test/crm-02-pipeline-board.test.ts`
- Migration: none. Moves use the existing `PATCH /api/dashboard/leads/:id`, which validates the transition (including the active_student side effects).
- Checks: tsc pass, npm test 1086 pass / 0 fail (5 skipped), build pass. Test proves every offered move is accepted by the server map.
- Not checked / risks: "days in stage" is days since `leads.updated_at` (any edit resets it); a true stage-entered time needs a status history. Not opened in the browser (no dev login for the dashboard UI). Dragging is mouse-only by nature; the menu covers phones and keyboard.
### CRM-01 Family timeline (2026-10-20)
- Result: done (main)
- Changed: new `server/routes/crm.ts` (`buildTimeline`, `GET /api/dashboard/admin/students/:id/timeline`, super admin only), `api/index.ts` (registration), new `src/dashboard/components/FamilyTimeline.tsx` on `StudentDetailPage.tsx` (admin only, filter chips by type, Arabic/English), `test/crm-01-family-timeline.test.ts`
- What it shows (account + children found through `guardians.parent_email`): account created, first contact (lead), AI guide requests, placement started/finished/reviewed, trial and lessons booked/attended/missed/cancelled, payments started/confirmed/refunded, packages and cancelled-lesson credits, refund requests, chats started, teacher notes (family summary only, never private notes), trial follow-up sent.
- Migration: none (read-only, existing tables)
- Checks: tsc pass, npm test 1084 pass / 0 fail (5 skipped), build pass; route run against 5 real students (200, no query errors).
- Not checked / risks: teacher changes are not in the timeline: there is no history table for `assigned_teacher_id` yet. Not opened in the browser (dashboard needs an admin login).
### RN-05 Trial → first paid lesson follow-up (2026-10-20)
- Result: done (main, after `/code-review`)
- Changed: new `server/notifications/trialFollowUp.ts`, run by the reminder cron in production only (`api/index.ts`); `test/rn-05-trial-follow-up.test.ts`
- How: 24 h after an attended (`completed`) free trial, one email + on-site notice to the account that owns the learner (parent for a child): thanks, the teacher's family summary if any, the placement level if taken (admin level first), and "book a single lesson or choose a package" (link /student/book). Once per learner: `notification_events` key `trial_followup:<student id>`. Skipped if the learner already booked a paid lesson or bought a package after the trial. A teacher recording attendance late still triggers it (attendance recorded within 72 h, trial no older than 14 days). A failing email is tried 3 times an hour apart, then only the on-site notice goes out.
- Migration: none
- Checks: tsc pass, npm test 1082 pass / 0 fail (5 skipped), build pass. Review: 6 findings, 5 fixed (retry cap + gap, on-site notice after the last failure, no starving with limit, late-recorded trials, package buyers skipped).
- Not checked / risks: runs only on the live cron, so the first real send is unobserved; check the health page and `notification_events` (`trial_follow_up`) after the first trials. Queries run one learner at a time (fine for current volume).
### RN-03 One-click renew the same package (2026-10-20)
- Result: done (main, after `/code-review`)
- Changed: `src/student/pages/StudentPackagesPage.tsx` ("Renew this package" on each real package card; selects the same catalogue item, lesson length and learner, highlights and scrolls to it; `?renew=<entitlementId>` does the same on load; a note if that package is no longer offered), `server/notifications/lowBalance.ts` (RN-02 notice links to `?renew=`), `test/rn-03-renew-package.test.ts`
- Migration: none. The terms and early-start checkboxes are still required and the server still computes the price (`/api/student/packages/select` unchanged).
- Checks: tsc pass, npm test 1072 pass / 0 fail (5 skipped; one earlier run had an unrelated ECONNRESET in the availability test, a rerun passed), build pass. Review: 6 findings, 5 fixed (scroll after render, clear highlight on length change / purchase, learner must still be listed, empty catalogue isn't "no longer offered", hook import).
- Not checked / risks: not opened in a browser (needs a signed-in account with a package). The tests read the page source rather than render it.
### RN-02 Low-balance notice (on-site + email) (2026-10-20)
- Result: done (main, after `/code-review`)
- Changed: new `server/notifications/lowBalance.ts`; `api/index.ts` calls it after the lesson-outcome RPC, only when a credit was used; `test/rn-02-low-balance.test.ts`
- How: at 2 lessons left and at 0, one on-site notice + email (calm copy, link to /student/packages) to the person who paid (`purchaser_account_id`), naming the learner when it is someone else. Once per threshold: `package_entitlements.metadata.low_balance_<n>_notified_at`, set by a conditional update that also requires an unchanged `updated_at`. Skipped for cancelled-lesson credits, refunded/cancelled packages and refund requests.
- Migration: none
- Checks: tsc pass, npm test 1068 pass / 0 fail (5 skipped), build pass; JSON-path filter checked against the real PostgREST (no rows touched). Review: 6 findings, 4 fixed (payer as recipient, stale-metadata write, notice only when a credit was used, route wiring test).
- Not checked / risks: at most once by design: if the email fails after the claim, that notice is not resent. Plural helpers are duplicated from `PackageBalance.tsx` (the server can't import the React file). Waits for RN-07 to respect notification preferences.
### RN-01 Package balance on every surface (2026-10-20)
- Result: done (main)
- Changed: new `src/student/components/PackageBalance.tsx` (one line per active package: "3 lessons left in your 8-lesson package", length, price band, learner), used on `StudentHomePage.tsx` (replaces the Used/Total grid), `StudentBookingPage.tsx` (above the booking flow) and `StudentPackagesPage.tsx` (under the header); `test/rn-01-package-balance.test.ts`
- Migration: none (reads the existing `GET /api/student/packages`)
- Checks: tsc pass, npm test 1060 pass / 0 fail (5 skipped), build pass. Credits with a refund request are left out of the list.
- Not checked / risks: not opened in a browser (student pages need a signed-in account); Arabic plural forms covered by the unit test.
### OPS-01..05 Launch operations: error capture, health page, cron heartbeat, runbook, placement reminder (2026-10-20)
- Result: done (merged to main 2026-10-20)
- Changed: `server/routes/ops.ts` (`POST /api/client-errors` rate limited 10/min/IP, `GET/DELETE /api/dashboard/app-errors`, `GET /api/dashboard/health`, API 5xx monitor, heartbeats), `api/index.ts` (wiring; heartbeat on each successful reminder-cron run and each signed Stripe webhook), `src/lib/errorReporter.ts` + `src/main.tsx` + `src/components/ErrorBoundary.tsx` (window errors, unhandled rejections, render errors), `src/dashboard/pages/HealthPage.tsx` + `DashboardApp.tsx` (`/dashboard/health`, super admin only, placement test mode banner), `src/types/database.ts`, `docs/launch-runbook.md`, `test/ops.test.ts`
- Migration: `20261020000000_ops_monitoring.sql` (`app_errors` grouped by fingerprint, `record_app_error` RPC, `ops_heartbeats`), applied to production 2026-10-20 (verified: RPC write, read and heartbeat table work with the service key).
- Checks: tsc pass, npm test 1056 pass / 0 fail (5 skipped), build pass. Errors are scrubbed (no query strings, emails or JWTs) and only the account id is kept.
- Not checked / risks: the health page was not opened in a browser (needs a real admin session). The free uptime monitor needs a Vercel Firewall bypass rule for `/api/health` (runbook §2, owner step).


### PR-07 Progress for parents: all children at a glance (2026-10-20)
- Result: done (8eb5c72 on main, merge dbec55e)
- Changed: `server/routes/progress.ts` (`buildFamilyChildOverviewCard`, `isGuardianAccount` + `childrenOverview` on `GET /api/student/progress`), `src/student/pages/StudentProgressPage.tsx` (family overview cards, last-opened child in localStorage, dev `?preview=family` fixture), `src/student/StudentApp.tsx` (dev-only bypass of the auth gate for `/student/progress?preview=...`, guarded by `import.meta.env.DEV`), `test/pr-07-parent-family-view.test.ts`, `docs/backlog/screenshots/pr07-family-ar-light.png`, `docs/backlog/screenshots/pr07-family-en-mobile.png`
- Migration: none
- Checks: tsc pass (0 errors), npm test 1050 pass / 0 fail (5 skipped), build pass, browser check `/student/progress?preview=family` in Arabic light desktop (1440px) and English dark mobile (375px); tapping a child card stores it as last opened; 0 console errors. Screenshots: `docs/backlog/screenshots/pr07-family-ar-light.png`, `docs/backlog/screenshots/pr07-family-en-mobile.png`
- Not checked / risks: Not tested against a real guardian account (no Supabase connection here). Without `?learnerId=`, the API still returns the primary learner's path (the PR-02 contract); the page then opens the remembered child, if there is one. Arabic dark and English light were not captured as screenshots.

### PR-06 Teacher side: record the family summary and milestones after a lesson (2026-10-20)
- Result: done (87ade22 on main)
- Changed: `server/routes/progress.ts`, `api/index.ts`, `src/dashboard/components/PostLessonSummaryEditor.tsx`, `src/dashboard/components/LessonDetailModal.tsx`, `src/dashboard/pages/TodayPage.tsx`, `src/dashboard/pages/StudentDetailPage.tsx`, `src/dashboard/types.ts`, `test/pr-06-teacher-family-summary.test.ts`, `docs/backlog/screenshots/pr06-teacher-summary-ar.png`, `docs/backlog/screenshots/pr06-teacher-summary-en-mobile.png`
- Migration: none (uses live `lesson_notes.family_summary`, `lesson_notes.achievements`, and `learner_milestones`)
- Checks: tsc pass (0 errors), npm test 1046 pass / 0 fail, build pass, browser check `/dashboard/students/:id` verified in Arabic & English, light & dark themes, desktop (1280px) & mobile (375px) (0 console errors; screenshots in `docs/backlog/screenshots/pr06-teacher-summary-ar.png` and `docs/backlog/screenshots/pr06-teacher-summary-en-mobile.png`)
- Not checked / risks: Jalila AI summary drafting is intentionally deferred per task spec.

### PR-03 Progress page: the learning path (2026-10-19)
- Result: done (dc58c80 on main)
- Changed: `src/student/pages/StudentProgressPage.tsx`, `src/student/StudentApp.tsx`, `test/pr-03-progress-page.test.ts`, `docs/backlog/screenshots/pr03-*.png`
- Migration: none
- Checks: tsc pass (0 errors), npm test 1043 pass / 0 fail, build pass, browser check `/student/progress` verified in Arabic & English, light & dark themes, desktop (1280px) & mobile (375px) + zero-lesson empty state (0 console errors; screenshots in `docs/backlog/screenshots/pr03-desktop-ar-path-scrolled.png`, `docs/backlog/screenshots/pr03-desktop-en-dark.png`, `docs/backlog/screenshots/pr03-mobile-375-ar-path-scrolled.png`, `docs/backlog/screenshots/pr03-mobile-375-en-dark.png`)
- Not checked / risks: Auto-scroll to `[data-current-level="true"]` verified in headless Chromium; family overview grid for multi-child guardian accounts is scheduled in PR-07 (currently uses learner switcher pills).

### PR-02 Progress API (read model) (2026-10-19)
- Result: done (27df92a on main)
- Changed: `server/routes/progress.ts`, `test/pr-02-progress-api.test.ts`
- Migration: none
- Checks: tsc pass (0 errors), npm test 1039 pass / 0 fail, build pass, browser check N/A (backend API task)
- Not checked / risks: Smoke-tested locally with dev student/guardian/foreign tokens and zero-lesson student fixture; relies on PR-01 migration (`learner_milestones` and `lesson_notes` columns) already applied to production by Claude.

### PR-01 Progress data model: shared lesson summaries and milestones (2026-10-19)
- Result: done (b7b5060 on main)
- Changed: `supabase/migrations/20261019000000_learner_progress_summaries_milestones.sql`, `src/types/database.ts`, `server/routes/progress.ts`, `api/index.ts`, `test/pr-01-progress-data-model.test.ts`
- Migration: `supabase/migrations/20261019000000_learner_progress_summaries_milestones.sql`, applied to production yes (by Claude on 2026-10-19 after review; Argon had no Supabase connection in this workspace)
- Checks: tsc pass (0 errors), npm test 1032 pass / 0 fail, build pass, browser check N/A (backend + schema task)
- Not checked / risks: Migration file is ready and verified by tests, and existing `/api/dashboard/students/:id/notes` endpoints remain backward-compatible before migration application, but the SQL file must be applied to production Supabase before `/api/student/milestones` or `/api/dashboard/students/:id/milestones` are queried against production.


### UX-27 Install as an app, launch screen, new sign-in dialog, logout door, Today layout (2026-10-27)
- Result: done on branch `ux/app-install-auth-today` (not pushed from the cloud session: no push access there)
- Changed: `src/lib/pwaInstall.ts`, `src/components/pwa/InstallApp.tsx` (install sheet, menu row, card, phone nudge), `src/lib/bootSplash.ts`, `index.html` (launch screen, theme-color per scheme), `public/site.webmanifest` (paper colours, launch_handler, shortcuts), `src/components/StudentAuthModal.tsx` + `src/index.css` (opaque sheet, Google first, account type as one question), `src/lib/auth.tsx` + `src/dashboard/DashboardApp.tsx` (no "Teacher Workspace" dead end: a log-out lands on /student, a student goes to /student, others to /staff/login), `src/dashboard/pages/TodayPage.tsx` (one stats strip, compact empty day, coming 7 days, week strip, shortcuts; Inbox and month calendar removed as duplicates of the tabs and bell), entries in Navbar, StudentApp, StudentHomePage, DashboardApp drawer, `test/qa-02-accessibility.test.ts` (title is now a plain h2)
- Checks: esbuild syntax pass on every changed file; type check with stubbed libraries shows no new errors; source tests qa-02, qa-04, phase-d, retired-subject-copy pass; screenshots of the sign-in dialog (phone/desktop, ar/en), install sheet, /student door and Today (phone/desktop, empty/full, dark) checked in a stubbed preview
- Not checked / risks: full `npm test`, `tsc` and `npm run build` could not run in the cloud session (npm registry blocked); run them before pushing. No service worker added (ST-07 rule kept).

## 2026-10-27 — Owner feedback on the app/auth branch
- Sign-in dialog, desktop: a two-panel window. On one side, a gold mihrab drawn line by line with the khatam turning in its crown, the verse inside and three promises underneath. On the other, the form, which fits the window with no scroll (name and email side by side). Arabic and English, light and dark checked.
- Phones: the sheet scrolls by touch and the page behind is locked while it is open.
- Welcome recitation: the "tap the sound button" hint is gone; only a mute button shows, in the site header, while it plays.
- Install: every "Get the app" opens the browser's own install dialog straight away where one exists (Chrome, Edge, Samsung Internet, Opera). `public/sw.js` caches nothing; it is there so those browsers offer the dialog. iPhone/iPad, Mac Safari and Firefox on Android get the short gesture sheet, because those browsers do not let a site install itself. The phone nudge now sits above the learning-guide button.
