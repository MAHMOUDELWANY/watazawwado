# "Pack your zaad" waitlist: design (2026-11-05)

Product decisions are the owner's (`docs/marketing/BRAND.md` §5–8, `RULES.md` §2 "Launch in waves"); the approved look
is the prototype `src/prototypes/PackYourZaadPrototype.tsx` with Zaadi `src/prototypes/ZaadiRig.tsx`. This file holds
the technical calls, all Claude's.

## Goal

Visitors pick one track, say who it is for, leave an email (or Google), and get an honest place in line for wave 1
(20 places). Until a wave opens, new learner accounts are by invitation. The owner invites from the dashboard.

## Off switch (so the live site does not change during the owner's review)

- `LEARNER_SIGNUP_MODE` env: `open` (default, today's behaviour) or `waitlist`. `WAVE_SIZE` env, default 20.
- `GET /api/public/launch` returns `{ signupMode, waveSize, waveLabel }`; the site reads it.
- In `open` mode nothing changes except that `/zaad` exists. The owner flips the env var on Vercel to launch.

## Data (`waitlist_entries`, new migration)

`id uuid`, `email citext unique`, `track` (`quran` | `zad` | `arabic` | `english`), `who` (`me` | `child`), `lang`
(`en` | `ar`), `source` (utm string, ≤ 80), `pains text[]` (from a fixed list), `note text` (≤ 500), `wave int default 1`,
`invited_at`, `joined_at` (account created), `secret` (random, for the voice update), `created_at`.
RLS on, no policies: only the server (service role) reads or writes. Place in line = number of entries created at or
before this one.

## API

- `POST /api/waitlist` (rate-limited): email + track + who + lang + source. Upsert by email (a second join keeps the
  first place and returns it). Returns `{ place, waveSize, entryId, secret }`. Sends the confirmation email (Brevo,
  `renderSimpleNotice`), never blocking the response. Honeypot field rejects bots.
- `POST /api/waitlist/google` with the user's Supabase bearer token: same, email from the verified user.
- `POST /api/waitlist/:id/voice` with `secret`: pains (whitelist) and note.
- Admin (super admin only): `GET /api/dashboard/waitlist` (entries by place, counts by track, pain tally) and
  `POST /api/dashboard/waitlist/:id/invite` (sets `invited_at`, sends the invitation email with the sign-up link).

## Invite-only sign-up (only in `waitlist` mode)

- The sign-up view of the auth modal shows "Join the line" (link to `/zaad`) instead of the form, unless the visitor
  came from an invitation link (`/zaad?invited=1` stores a flag) or already has an account.
- Server guard: `POST /api/student/onboarding` refuses with `403 waitlist` when the account's email is not an invited
  waitlist entry. Teachers, the super admin and existing learners are untouched. On success `joined_at` is set.
- Sign-in for existing accounts never changes.

## Front end

- Route `/zaad` (and `/ar/zaad`), lazy, inside the public layout: the prototype made real (both themes, English and
  Arabic copy in the 80/20 style), Zaadi rig moved to `src/components/zaadi/`.
- In `waitlist` mode every "Book your free trial" CTA on public pages points to `/zaad` with the label "Pack your
  zaad". CLOSER copy edits (hero subline, "Sound familiar?", FAQ answers) ship in the same release.

## Not in this release

Share image download (share uses the Web Share API with text and link; the image comes later), the founding-families
code (made when the wave date is set), the 72-hour hold timer (the invitation email states it; enforcement later).

## Tests

Unit: place calculation, input parsing (track/who/pains whitelist, note length, honeypot). Route tests for join
idempotency, voice secret check, admin-only access, and the onboarding guard in both modes.
