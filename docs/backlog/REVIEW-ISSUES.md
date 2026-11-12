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
22. **Open, owner action in Google Cloud.** **Connecting Google Calendar fails** with Google's "Access blocked: authorization error". The site's link is the same one that connected both of the owner's Gmail accounts in September; Google blocks other accounts because the app is in Testing mode (only listed test users may connect). Fix in Google Cloud Console, APIs & Services, OAuth consent screen, Audience: add each teacher's Gmail under Test users (or Publish the app). Also check that Authorized redirect URIs lists `https://watazawwado.academy/api/integrations/google-calendar/callback`. **Update 2026-11-08:** the owner checked: the redirect URI is right and the app is In production, so Testing mode is not the cause. Next: retry the connection; if it still fails, read the error code under "Access blocked" (for example `Error 403: disallowed_useragent` = opened inside the WhatsApp/Instagram browser, `Error 400: redirect_uri_mismatch` = the URI the site sends differs).

## G. User-experience review, part 2 (owner, 2026-11-07)

23. **Done 2026-11-07.** New "Homework" page next to "My students": every task of the teacher's students (open / came back / reviewed), what came back (ticked done, recordings with a player), the mastered / needs-review buttons, and "New homework" to set 1-3 tasks at any time, for one of the student's lessons or outside a lesson (the family is notified). Was: **Teachers can't find homework.** A student's homework answer shows only inside the student's details, top left, like a lesson summary. Wanted: a "Homework" tab next to "My students" with past homework, and a way to set new homework at any time (for a lesson or on its own).
24. **Done 2026-11-07.** Already mostly blocked: a lesson paid fully by the gift never rewarded the inviter (only real money counts). The gap left was a small top-up: now the friend must pay at least the inviter's reward ($5) in real money on that lesson. RULES.md and the Invite terms say so. Was: **Referral loop gives free lessons.** Both people get $5 when the friend attends a paid lesson, and a lesson costs $4.50, so the friend's first lesson can be paid with the $5 gift. Five friends give the referrer $25 without anyone paying a dollar.
25. **Done 2026-11-07.** Cause: the teacher pages read link columns that don't exist in the database, so the Start button never showed. They now use the lesson's link, and "Start" opens Zoom as host. Was: **Teacher sees "the link is being prepared" at lesson time** while the student already sees the Zoom link.
26. **Done 2026-11-07.** Cause: with no Start button (item 25) the teacher used the join link from the email or calendar, which makes them a guest; then nobody is host. Item 25 brings Start back, and teacher emails and calendar events now say "start from your dashboard" instead of the join link. The waiting room stays (the Safety page promises it). Was: **Both join Zoom and wait for the host.** Teacher and student both see "Waiting for the host to start this meeting"; the lesson never starts.
27. **Done 2026-11-07.** The Today page says who is there (from the teacher pressing Start, the student opening the link, and Zoom joins): "nobody has joined yet" / "the student is waiting for you" / in progress, and after the end "nobody joined: record what happened". Before "lesson completed" the teacher sees a warning when our records show nobody (or no student) came. Teachers can also record "I could not attend" for their own lesson from the lesson time (unpaid, the student gets the lesson back, the admin is told). The family survey only appears after a lesson recorded as held. Note: Zoom sends no join events yet (the webhook is not set up in Zoom), so this uses the site clicks. Was: **The site doesn't know who attended.** At the start time it says "the lesson is running" whether anyone joined or not. After the end it asks the teacher for a report as if the lesson happened, and the student gets the feedback survey, though neither joined. The report needs "student absent" / "teacher absent", and the survey must not go out for a lesson that did not happen.
28. **Done 2026-11-07.** After the end time, the lesson card and Booking details say the lesson time has ended (and where the report will be) instead of "the Zoom room is being prepared". Was: **Booking details after the lesson ended still say "the Zoom room is being prepared"** instead of saying the lesson is over.
29. **Done 2026-11-07.** Cause: the confirm box opened behind the lesson window. It now opens on top, and the result shows as a message at the top too. Was: **"Technical problem" button shows nothing** until the lesson panel is closed; then the notice appears under the lesson. The confirmation should show at once, above.
30. **Done 2026-11-07.** A trial our side could not hold (technical problem, teacher absent) no longer starts the 48-hour wait or counts toward the 5 lost trials. The Arabic message also said "one trial per student" for every trial error; each now says its real reason. Was: **A trial the teacher cancelled for a technical problem can't be rebooked**: "one trial per student". A trial cancelled by our side must not use up the student's trial.
31. **Done 2026-11-07.** A lesson paid fully from the balance now cancels normally (3+ hours before) and the balance it used goes back. Was: **Cancelling a lesson booked with the $5 gift fails** with "The lesson has no confirmed payment." The gift should come back.
32. **Checked 2026-11-07, works as decided.** The data shows the second trial was booked from a different account 4 minutes later; the 48-hour wait is per account (RULES.md §2). The Arabic error text is fixed (item 30). Was: **Cancelled trial says "wait 48 hours"** before booking another, but a new trial books at once. The message and the rule disagree.
33. **Done 2026-11-07.** Teachers get the yellow dot on Messages (desktop tab, phone bar) when a student writes; it clears once the conversation is opened. Was: **No unread dot for teachers.** Students get a yellow dot on Messages; teachers don't when a student writes.
34. **Done 2026-11-07.** The teacher gets a notice when their student finishes the placement test, and the student page has "Placement and level": the result, the current level, and "set the level" (the card shows who changed it and when; the family is notified, migration `20261107000001`, applied). The student's Learning Track has a placement link, and the result page has "Take the test again". Was: **Placement test changes nothing.** The result ("basic") doesn't reach the learning path (still "beginner"), and the teacher sees no result. The teacher must see it and be able to change the level (with a mark that they did), and the student needs a clear place to see the result and retake the test.
35. **Done 2026-11-07.** For a family account the Learning Track panel showed the parent's own empty fields. It now shows each child (subject, level, teacher, placement link), and only the child picked in the header when one is picked. Was: **Family "whole family" view of the learning path** shows "subject not set" and the default teacher; picking one child shows the same. Each child's subject and teacher must show.
36. **Done 2026-11-07.** Same cause as item 20 (fixed earlier today): Manar was added at 18:10 on 11-06, before that fix. Adding a child now lists the teachers of the subject. Manar was moved to Ustadh Ahmed, as the owner asked. Was: **Family sign-up, second child: no teacher choice.** After picking "male teacher" the form gave no list and put the default teacher (who has no free times), so the child could not be booked.

## H. Real-user review by persona (P4, 2026-11-12)

From `docs/testing/findings/p4.md` (nine personas on phone and desktop, Arabic and English). P4-001 and P4-002 (wrong
lesson times on Home and right after onboarding) are already fixed in the P4 branch; the rest wait for the owner's
pick.

1. **Teacher choice you can trust** (P4-003/004/005) [product part built 2026-11-12; data still with the owner]: a real intro and photo for Ahmed, hours for Ustadh Mahmoud or his
   photo out of the hero, a female Quran teacher before wave 1; no pre-selected gender or teacher.
2. **The right rules at consent** (P4-006) [built 2026-11-12]: trial rules and the real reminder times on the review step and confirmation.
3. **A checkout that cannot be misread** (P4-014/015/018) [built 2026-11-12; split savings lines open]: one summary line beside the amount; tappable consent rows.
4. **One thing at a time for a new family** (P4-007) [built 2026-11-12]: no install banner, tour and push modal before the first booking.
5. **Booking v2** (P4-008/009/021) [built 2026-11-12]: three steps, nothing wrongly pre-selected, Arabic dates, the sibling's trial next.
6. **A child's way in** (P4-025/026/027/028) [built 2026-11-12 except the child mode on the parent's phone]: code option inside sign-in, one-field code, a kid space for children.
7. **One voice, meanings first** (P4-010/023/031/032) [built 2026-11-12 except the full Arabic 80/20 pass]: rewrite onboarding, booking and tour; "New to Islam? Start here".
8. **Prices first, no loops** (P4-016/017) [built 2026-11-12]: prices at the top of /pricing, 30-minute packages, wallet link to packages.
9. **One navigation** (P4-020/035) [built 2026-11-12; leave requests not in the queue yet]: one top bar for portal and teachers; one admin queue and a labelled menu.
10. **Access for everyone** (P4-022/024/029/037/038) [built 2026-11-12 except P4-038]: 44 px targets, large text, skip link, recitation control,
    "Ask a parent to join" for teens.
11. Quick wins [built 2026-11-12 except P4-019, which needs the trader's full address from the owner]: green in the ribbon gradient (P4-039), one-tap language gate (P4-011), trader's full address (P4-019),
    learner card on the trial (P4-033), type hours first on phones (P4-034), QA accounts out of admin numbers (P4-036).
