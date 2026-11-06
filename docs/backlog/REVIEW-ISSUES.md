# Owner review issues

The owner is reviewing the live site and collecting issues here. **Nothing on this list is built until the owner
says which items to run.** Add new findings at the end of the right group. Mark an item done with the date and
commit, and log it in [LOG.md](LOG.md) as usual.

Order: data clean-up first, then the sign-up path (it decides who reaches a teacher), then lessons, then messages.

## A. Data clean-up before launch (owner asked 2026-11-06)

1. **Done 2026-11-06. Delete every student account and all of its data.** All 12 students are test accounts. This covers bookings,
   payments, packages and credits, notes, homework, recitations, messages, leads and sign-in accounts.
2. **Done 2026-11-06. Delete the teachers Ali Fayed and Mirek** with their sign-in accounts and availability. Keep Ustadh Mahmoud
   (teacher account `mhmwdlwany4222@gmail.com`), Ustadha Afnan, and both Ahmed accounts.
3. **Done 2026-11-06. The super admin is the academy, not a teacher.** Now named "Watazawwado Admin" /
   "إدارة وتزودوا", no photo, no subjects; left out of the family teacher list, automatic teacher routing,
   payroll and teacher load; no "My hours" page. Was: `mahmoudelwany98@gmail.com` keeps the admin role and still
   sees the curriculum, the teachers' materials and everything teachers send for review. It is no longer named
   "Ustadh Mahmoud", has no teacher photo, is never offered to families as a teacher, and gets no teaching tools
   (schedule, lessons, availability). Needs a code check of every place that lists teachers.

   Items 1 and 2 left 5 sign-in accounts: the super admin, Ustadh Mahmoud, Ustadha Afnan and both Ahmeds. A backup of
   every deleted row is on the owner's Desktop in `watazawwado-backups/` (not in the repo: it holds personal data).

## B. Sign-up and choosing a teacher

4. **Account deletion requests are hard to find.** A student's request does reach the super admin, but the list sits
   at the bottom of the Analytics page. (The one open test request was removed with the clean-up.) Move it somewhere the
   owner will see it, with a count badge and an email to the admin when a request comes in.
5. **Subject first, then teacher, in onboarding.** The family picks the subject first, then sees only the teachers
   who teach it. Subjects are shown as big blocks with the detail underneath, for example **Quran**: reading
   (learn to read the Quran), Tajweed, memorization, revision, the full Quran path. Same for the Zad Path and the
   languages (RULES.md §2b).
6. **Who teaches what.** Ustadh Mahmoud: every subject. Ustadha Afnan: every subject except Quran and everything
   under it (reading, Tajweed, memorization, revision). The Ahmed accounts: to be decided by the owner. Store this
   per teacher so the admin can change it, not in code.
7. **A short bio on each teacher card.** Teachers write it at sign-up (the `bio` column already exists). Families
   read it before they choose.
8. **Badges from family feedback**, in the spirit of Preply: small labels on the photo such as "Patient" or
   "Great with kids", earned from reviews, never typed in by the teacher. Needs a rule for how many reviews earn a
   badge.
9. **Fully booked teachers.** Owner leans towards hiding a teacher whose schedule is full, since fewer choices help
   families decide. Alternative: show them greyed out. Decide before building.

## C. Lessons

10. **Zoom link only in the 5 minutes before the lesson.** Today's lesson card opens the join button 10 minutes
    before (`JOIN_OPENS_MIN` in `LessonDayCard.tsx`), but the home and lessons pages may show the link earlier.
    Make it 5 minutes everywhere, with a countdown until then.
11. **Homework after every lesson: explain how it works and check it end to end.** It is built: the teacher adds
    homework in the post-lesson summary, the student sees it in the portal, can mark it done or send a recitation,
    and the teacher reviews it. The owner has not seen it yet because there is no account with a past lesson. Make
    a walkthrough with screenshots (teacher side and student side), then a test booking to see it live.
12. **Microphone on the recitation page** (fixed in code 2026-11-06, commit 8ec0efe). Still to check on a real
    phone once a test account has homework: start recording, leave the page, and the browser's mic indicator
    must go off.

## D. Messages and notifications

13. **Email language.** Emails already follow the language the person chose on the site, and fall back to English.
    Owner wants English for everyone, or the chosen language if that works. Decide which, then check that every
    email template follows it (some may still be sent in one language only).
14. **Phone notifications with Zadi.** Web push is built (the portal has a switch to allow notifications). Next:
    lesson reminders, homework and streak nudges written in Zadi's voice, in the spirit of Duolingo, with Zadi's
    picture as the icon. On iPhone this only works after the family adds the site to the home screen; explain
    that in the switch.

## E. Security follow-ups (from the 2026-11-06 audit)

15. Done 2026-11-06: per-route rate limits, error catching, session cache, mic release (8ec0efe, 25c3846),
    grants, analytics caps and 54 indexes (migration `20261106000000`, applied by the owner in the SQL editor),
    and the Vercel firewall rate limit now covers bookings, payments and portal writes (30 POSTs a minute per IP,
    Stripe webhook excluded). The free Vercel plan allows only this one rate-limit rule.
