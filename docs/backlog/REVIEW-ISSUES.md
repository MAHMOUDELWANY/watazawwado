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

## B. Sign-up and choosing a teacher (done 2026-11-06)

4. **Done. Account deletion requests.** Open requests show at the top of the admin home (not only under Reports),
   and the notification links there. "Delete the account" carries a request out in one click
   (`delete_family_account`): the account, its learners and all their data go; payment rows stay, unlinked, for the
   5-year tax record; recordings are removed from Storage first. A child shared with another parent keeps its
   lessons; a package bought for such a child stops the deletion for the team to settle by hand.
5. **Done. Subject first, then teacher.** Adults and each child pick the subject (the shelf already groups Quran,
   the Zad Path and Languages with the detail underneath), then choose among the teachers who teach it.
6. **Done. Who teaches what** lives in the University page licences (`teacher_subjects`), editable by the admin.
   Ustadha Afnan no longer holds Quran reading, Tajweed or memorization; Ustadh Mahmoud and both Ahmed accounts
   teach every subject (owner, 2026-11-06).
7. **Done. Teacher introduction.** Teachers write it in Settings ("Your introduction for families"); the first
   sentence shows on their card. The copy-paste placeholder bio was removed from every account. **Open:** each
   teacher writes theirs.
8. **Done. Badges.** After a 4 or 5 star lesson a family can tap up to 3 quick words (Patient, Explains clearly,
   Great with kids, Encouraging, Well prepared, Makes it fun). A word shows on the card once 3 different families
   chose it, counting finished months only; at most 2 badges per card.
9. **Done. Fully booked teachers are hidden** (no free slot in the next 14 days), unless every teacher of that
   subject is full. **Open:** only one Ahmed account has teaching hours today; Ustadh Mahmoud and Ustadha Afnan must
   add theirs in "My hours" or they will be hidden.

## C. Lessons

10. **Done 2026-11-06.** The Join button appears 5 minutes before the lesson on the home, lessons and calendar
    pages; before that the page says when it will appear.
11. **Homework after every lesson.** It is built: the teacher adds homework in the post-lesson summary, the
    student sees it on the home page, marks it done or sends a recitation, and the teacher reviews it; the 12-hour
    lesson reminder mentions open homework. **Open:** a live walkthrough once a test family has had a lesson.
12. **Microphone on the recitation page** (fixed in code 2026-11-06, commit 8ec0efe). Still to check on a real
    phone once a test account has homework: start recording, leave the page, and the browser's mic indicator
    must go off.

## D. Messages and notifications (done 2026-11-06)

13. **Done. Email language.** Emails already followed the language a person picked with the language button. Now a
    family that never pressed it gets emails in the language they used the site in (saved at sign-in, only when the
    account has no choice yet). English stays the fallback.
14. **Done. Phone notifications in Zaadi's voice**, with Zaadi as the notification picture: the 12-hour and
    2-hour lesson reminders, a teacher's reply to a recitation, a gift received, and a "we miss you" nudge after
    3 weeks without a lesson. The iPhone home-screen explanation was already in the switch.

## E. Security follow-ups (from the 2026-11-06 audit)

15. Done 2026-11-06: per-route rate limits, error catching, session cache, mic release (8ec0efe, 25c3846),
    grants, analytics caps and 54 indexes (migration `20261106000000`, applied by the owner in the SQL editor),
    and the Vercel firewall rate limit now covers bookings, payments and portal writes (30 POSTs a minute per IP,
    Stripe webhook excluded). The free Vercel plan allows only this one rate-limit rule.

## F. User-experience review (owner, 2026-11-07)

16. **Done 2026-11-07. Teachers get no lesson emails or notifications.** Cause: the emails were sent from hr@, which does not reach the inbox (support@, used by "A new student chose you", does). They now come from support@, and the teacher also gets a site notice (bell + phone) for booked, moved and cancelled lessons and a 2-hour reminder by notice and email. Was: A booked lesson emails the student, but the teacher only
    ever gets "A new student chose you". Every lesson event (booked, rescheduled, cancelled, reminders) must reach
    the teacher too.
17. **Done 2026-11-07. "Download your data" gives an unreadable JSON file.** Now a bilingual page that opens in any browser and prints or saves as PDF (`?format=json` still gives the raw copy). Was: It opens as raw text in Notepad or not at all. Families
    need a file they can read.
18. **Done 2026-11-07.** Settings now has "Your photo and ID card": the photo goes on the teacher's card at once, the ID card is private and the admin opens it from the Teachers page. The task links there and ticks when both are in (migration `20261107000000`, applied). Was: **Teacher task "Add your photo and ID card" opens the chat with the admin** instead of the page where the
    teacher uploads the photo and ID.
19. **Done 2026-11-07.** A family account gets one tour (home, children, booking, progress, messages); the learner home tour no longer opens for it. Was: **Two welcome tours on top of each other in a new family account** (the site tour and the family-account
    tour). They must run one after the other, as one tour.
20. **Done 2026-11-07.** Adding a child in Settings now shows the teachers of the chosen subject (male/female tabs, as at sign-up). Booking for a child uses that child's own teacher (it used the account holder's, Ustadh Mahmoud); "Learning Track & Teacher" and the home card show each child's teacher. Existing children keep their teacher; the admin can change one on the student page. Was: **Teacher choice after sign-up is broken.** Adding a child from Settings shows "Choose a teacher" but gives
    no choice and puts the default teacher. A child signed up with Ustadh Ahmed shows Ustadh Mahmoud on the learning
    path and in booking. A daughter who chose a female teacher sees her only in messages, not on the path or in
    booking.
21. **Done 2026-11-07.** Each child gets their own free trial (server, booking page and form); the 5-lost-trials limit stays per account. Was: **One free trial per family.** A family with several children gets one trial lesson in total; each learner
    must get their own.
22. **Open, owner action in Google Cloud.** **Connecting Google Calendar fails** with Google's "Access blocked: authorization error". The site's link is the same one that connected both of the owner's Gmail accounts in September; Google blocks other accounts because the app is in Testing mode (only listed test users may connect). Fix in Google Cloud Console, APIs & Services, OAuth consent screen, Audience: add each teacher's Gmail under Test users (or Publish the app). Also check that Authorized redirect URIs lists `https://watazawwado.academy/api/integrations/google-calendar/callback`.
