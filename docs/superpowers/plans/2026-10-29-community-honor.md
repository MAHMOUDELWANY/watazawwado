# Community layer: consent, Hall of Honor, class board (plan, 2026-10-29)

Builds the opt-in social layer from the approved design
(`docs/superpowers/specs/2026-10-20-milestone-celebration-design.md`, owner approval 2026-10-20). Backlog tasks
CM-01 to CM-04. Until this ships the rule stays "no leaderboard and no comparing".

## Order

1. **CM-01 Data and consent rules** (🔴 children's data): migration, pure rules in `server/community/community.ts`,
   unit tests.
2. **CM-02 Hall of Honor**: admin nominates a teacher-recorded milestone, the family decides in the portal (or the
   admin records a consent given on WhatsApp), published entries show on `/student/community` for signed-in families
   and students only, and the admin copies the text to post in our families' groups.
3. **CM-03 Class board**: effort-based board for one teacher's learners, opt-in per learner, shown in the portal and on
   the teacher dashboard.
4. **CM-04 Later** (not in this release): photos, family achievements, automatic Tier 1 suggestions from rhythm.

## Decisions taken in this plan (owner can change them)

- **A closed community (owner, 2026-10-29).** The Hall of Honor and the class board live only inside the accounts
  (`/student/community`), for signed-in families and students. Nothing about learners is public. The public page
  `/community` (and `/ar/community`) only describes the community, with a labelled example and no names, and invites
  visitors to book a free trial or sign in.
- **No photos in v1.** Every entry uses one of our emblems. Photos need storage, moderation and a second consent, and
  the design already offers "avatar instead of photo" to everyone. Photos are CM-04.
- **Who decides.** The person who runs the account: the guardian for a linked child, the adult learner for themself.
  If the server cannot be sure (the learner is under 18 or a child with no guardian link to this account), the portal
  does not offer the choice and only the admin can record it, with a note of how and when the family agreed.
- **Name shown.** First name by default, or a short name the family types (nickname or full name, up to 40
  characters). Never a country, age, photo, teacher or surname we chose ourselves.
- **Withdraw any time.** The family can take an entry off the Hall of Honor or leave the class board from the portal;
  the admin can unpublish. Withdrawn entries are never shown again unless the family chooses again.
- **Nothing is posted automatically.** The admin copies a ready text (Arabic and English) and posts it by hand.
- **Class board scope.** Only learners of the same teacher, in the same age group (kids / teens / adults); teens and
  adults are also split by gender when it is on record. A learner sees the board only when they opted in themself
  (reciprocal), and only when at least 3 learners are on it, so nobody is compared with one other person. Order is by
  lessons attended this month, then the weekly rhythm; no rank numbers. The teacher's dashboard view shows all their
  learners (they already see this data) and who joined the board.

## Data (one migration, service-role only like payroll; the API checks who may read or write)

- `honor_entries`: one per milestone (`milestone_id` unique). `status` `awaiting_consent` → `published` | `declined`;
  `published` → `withdrawn` (family) | `removed` (admin). Stores `display_name`, how consent was given
  (`guardian` / `learner` / `admin_recorded` + note), who and when.
- `class_board_members`: one row per learner who joined, with `display_name` and who consented.

## API

- Signed-in accounts `GET /api/student/community/hall`: published entries only (name, titles, kind, subject, month),
  `Cache-Control: private, no-store`.
- Family `GET /api/student/community?learnerId=`; `POST /api/student/community/honor/:id/decision`;
  `POST /api/student/community/honor/:id/withdraw`; `POST /api/student/community/class-board`.
- Admin `GET /api/dashboard/honor`, `POST /api/dashboard/honor/nominate`, `POST /api/dashboard/honor/:id/record-consent`,
  `POST /api/dashboard/honor/:id/remove`.
- Teacher `GET /api/dashboard/class-board` (super admin: `?teacherId=`).

## Done when

tsc, `npm test` and build pass; unit tests cover consent authority, name rules, status changes, board grouping,
minimum size and ordering; Arabic and English, RTL, light and dark, 375 px; humanizer on copy; logged in LOG.md.
