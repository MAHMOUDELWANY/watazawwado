# Pre-launch review (2026-11-05)

Scope asked by the owner: copy across the site, Zaadi on the site (not the waitlist switch), a full code,
security, design and brand review "as if we go to production tomorrow". Released to `main` as `ce00428`.
`LEARNER_SIGNUP_MODE` is still `open`, so sign-up works as before and nothing links to `/zaad`.

## Done

### Code review of the release (waitlist and launch switch)
Ten findings, eight fixed:
- The sign-in modal called a hook after an early return (crash risk when the modal is re-opened in place).
- The invite route sent the email even when saving `invited_at` failed (family told "your place is open", then blocked).
- The 72-hour invitation hold was promised but never enforced. Now an invitation opens onboarding for 72 hours;
  the admin page shows "Invite again" after that, which restarts the hold.
- Joining the line with Google left a signed-in account on the device. Now it signs out locally after joining.
- The hash links (`#book`, `#reset-password`) re-opened modals when the launch mode loaded; a click before the mode
  loaded could open the trial modal in waitlist mode. Both fixed (`loadLaunch()` is awaited, cached).
- Duplicate place count query; a hand-styled CTA instead of the shared `Button`.
- Not changed: the route tests that write to the production waitlist run only with `WAITLIST_ROUTE_TESTS=1`;
  the "already in line" reply still tells a caller an email is listed (rate limited, low impact).

### Security pass (whole API)
- Every route without auth middleware was listed and checked: public reads, token-checked booking management,
  Stripe webhook (HMAC with timing-safe compare and a 5-minute window), cron (Bearer, timing-safe, fail-closed),
  dev tokens disabled on production. No hole found.
- Supabase advisors: RLS on every table; the anon-callable functions are the token-checked booking-management RPCs
  (intended). Leaked-password protection needs the paid Supabase plan; the site already checks passwords against
  HaveIBeenPwned on sign-up.
- The learner profile showed developer probes ("Probe /api/student/me", RLS, Supabase wording). Removed; the panel
  now shows the sign-in email and sign out.

### Copy (Arabic in the 80/20 friendly-Fusha style, RULES.md §6)
Rewritten from Egyptian to friendly Fusha: FAQ and subject data, the three articles, SEO titles and descriptions,
every public page, sign-in, onboarding, the intake guide, the waitlist page, booking and payment, the whole student
portal, the kid app, staff sign-in, and the family emails (booking, reminders, cancellations, monthly and weekly
reports, welcome, low balance, quiet learners, discount and refund messages). The homepage AI guide now answers
Arabic in the same style.
Left as they are on purpose:
- Teacher and admin dashboards (staff-facing, Egyptian team).
- Placement question banks and curriculum (curriculum content waits for the owner's review; the Egyptian Arabic
  bank must stay Egyptian).
- Legal pages were already Fusha; only small lines changed.

### Zaadi on the site (joy moments only, BRAND.md §5 and §8)
The welcome screen after sign-in (learners), the onboarding success screen, the certificate page and the kid app home.
Never in payments, refunds or cancellations.

### Brand and design
- The closing bands on Home, About, How it works, Learning, FAQ and Careers were deep green (#05363F), which the owner
  rejected on 2026-11-03. They are now espresso with gold and a crimson glow (`.band-espresso`). The curriculum player
  keeps its approved `.band-deep`.
- Off-palette Tailwind colours (emerald, amber, slate) remain in older dashboard screens; worth a pass in the design
  phase (`/impeccable`), not changed now.

## Checks
- Type check clean; build passes (46 prerendered pages and the sitemap).
- Tests: 2,763 run. The only failures are the 7 old static migration/RPC tests that also fail on `main` before this
  release (`task-0.50*`, `task-0.61-b`, `task-03-b/c`).
- Not verified: visual screenshots on real devices (the review pane was hidden), the production deployment status
  (the Vercel connector has no access to this team's deployments).

## Needs the owner
1. Delete the test rows (`waitlist-test-%@example.com`) from the production waitlist before launch.
2. The Supabase auth email templates (confirm code, password reset) are set in the Supabase dashboard; the new
   wording in `server/notifications/emailTemplates.ts` takes effect there only after pasting it in.
3. The device review (iPhone, Android, tablet, desktop) and the curriculum and placement review.
