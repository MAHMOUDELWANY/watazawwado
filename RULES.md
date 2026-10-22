# Watazawwado — Product & Engineering Rules

These rules are decided by the owner and are binding for every developer and every AI model working on this project. If code and this file disagree, the code is wrong. Changing a rule requires the owner's explicit approval; record the change here with its date.

Status legend: **[Decided]** = in force. **[Open]** = still to be decided with the owner — do not invent an answer.

---

## 1. Platform & teachers

- **[Decided 2026-10-14] Multi-teacher platform.** The platform supports several male and female teachers so it can grow. Every teacher:
  - sets their own weekly availability inside the website (teacher dashboard);
  - connects their own Google Calendar; lessons sync to the calendar of the teacher who teaches them;
  - can only be double-booked against their own lessons (one teacher's lesson never blocks another teacher's slot);
  - receives notifications for their own lessons. The super admin sees everything.
- **[Decided 2026-10-14] Changing teacher.** The super admin can move a student to another teacher at any time (Students → student → Assigned teacher). New bookings go to the new teacher; lessons already booked stay with the teacher they were booked with until the admin moves or cancels them.
- **[Decided 2026-10-15] Teachers never see money.** A teacher's dashboard shows no prices, fees, payments, refunds or pay-later data (the API strips them for non-admins). Payment alerts go only to the super admin.
- **[Decided 2026-10-15, changed same day] Teachers move their own lessons, never cancel them.** From the dashboard a teacher moves one of their lessons to tomorrow or a later day (student's time zone), with a **required reason**. The student gets an email (the reschedule email) and an on-site notice with the reason; the super admin gets an on-site notice. Moving **less than 3 hours** before the lesson is still allowed, but the dashboard then opens WhatsApp to the admin with a ready message (student, booking ref, old/new time, reason) so the admin can follow up and apologise to the family. Only the super admin cancels. "Ask the student to reschedule" stays available. The teacher agreement says this (version 2026-10-15.2).
- **[Decided 2026-10-15] Teacher notifications:** a teacher gets an email and an on-site notification (dashboard bell) when one of their lessons is booked (trial or paid), moved or cancelled.
- **[Decided 2026-10-15] Adding teachers:** the super admin adds a teacher (email, name, gender) on the Teachers page; the teacher receives an invitation email to set a password and signs in at /staff/login. Each teacher's emails go to the email of their teacher account, so no Vercel setting is needed per teacher.
- **[Decided 2026-10-15] Teacher time zones:** each teacher enters weekly hours in their own time zone on "My hours"; students always see times in theirs.
- **[Decided 2026-10-15] Teacher agreement.** Every teacher reads and accepts the teacher agreement (/staff/agreement) after setting a password and again whenever its version changes; the dashboard is blocked until then. Pay is agreed separately in writing.
- **[Decided 2026-10-22] Deleting a teacher.** Besides Stop (deactivate), the super admin can delete a teacher for good from the Teachers page after typing their email: the account, login, profile, hours and calendar link are removed and their students become unassigned. Refused while they have upcoming lessons (move them first) and for super admins or yourself. Past lessons, payments and reports stay as records with no teacher.
- Roles: `student` (adult learner), `parent` (guardian account managing children), `teacher`, `super_admin`.

## 2. Accounts & booking

- **[Decided] No guests.** Every booking (free trial or paid) requires a signed-in account. There is no anonymous booking path.
- **[Decided] Pay first.** A paid booking is not confirmed — and no confirmation/reference is shown — until payment is verified server-side. While the student is paying, the slot is held for a short time (payment hold); an unpaid hold expires automatically and frees the slot.
- **[Decided] Free trial — one per new student.** Default 30 minutes, maximum 45 minutes (master spec §9).
- **[Decided] Free trial rescheduling.** A trial can be rescheduled **once**, and only **at least 1 hour before** the lesson. Missing the trial (no-show), or cancelling it, means the student must wait **48 hours** before booking again.
- **[Decided 2026-10-14] Free-trial limit.** After **5** cancelled or missed trials, the account can no longer book free trials; paid lessons stay open. Accounts are never deleted automatically (confirmed by the owner 2026-10-14).
- **[Decided 2026-10-14] Cancelling and rescheduling (all lessons):**
  - cancel up to **3 hours** before (a free trial: up to 1 hour before);
  - reschedule up to **1 hour** before, self-service; the new time is on **another day, tomorrow or later** (student's time zone), never the same day;
  - inside the last hour nothing can be changed; a missed lesson counts as taken (no refund, no credit);
  - real emergencies: the student messages WhatsApp; the super admin may move the lesson as goodwill, at their sole discretion (not a right);
  - if the platform/teacher cancels or fails, the student chooses a free new time, a credit or a refund, and it never counts toward the refund limit.
- **[Decided 2026-10-15] No same-day bookings.** Every booking (trial, paid, package) starts tomorrow at the earliest in the student's time zone; today's times are not shown and the server refuses them (`isOnLaterDay`).
- **[Decided 2026-10-15] Lesson reminders.** Email to the student when the booking is confirmed and **3 hours** before; on-site notices **12 hours** and **2 hours** before. A cancelled lesson gets no more reminders; a moved lesson gets new ones for the new time only.
- **[Decided 2026-10-14] Terms consent.** Before every booking and package purchase the student ticks "I accept the terms and the cancellation & refund policy". The server refuses without it and stores the accepted terms version (`TERMS_VERSION` in `api/index.ts`, `bookings.terms_version/terms_accepted_at`, package `metadata`). Any substantive change to the terms page bumps the version.

- **[Decided 2026-10-16] Learner age.** Onboarding asks for the exact age (not an age range) of the student, or of each child when a parent signs up.
- **[Decided 2026-10-16] Age limits.** A personal account is for learners aged **18+** (the sign-up form requires "I confirm I am 18 or older"). A family account is opened by a guardian aged **18+**: the sign-up form asks the guardian's age and refuses under 18 **before the account is created**, so no verification email is sent. Children in a family account are **6 to 17**. The same limits are enforced by onboarding and the server (`src/lib/ageRules.ts`).
- **[Decided 2026-10-16] Choosing a teacher at sign-up.** Onboarding lists the real active teachers (`teacher_accounts`, role `teacher`, with photo and Arabic name), so every new teacher appears automatically. The learner is assigned to the teacher they pick; that teacher gets an email and an on-site notice with the onboarding details, a chat opens between the account and the teacher, and the super admin gets an on-site notice. The super admin can still move the student to another teacher (the new teacher is notified and a chat with them opens).
- **[Decided 2026-10-16] Country at onboarding** is detected from the device's time zone (then the hosting edge's IP country), never a fixed default.
- **[Decided 2026-10-16, changed same day] Placement test after the free trial.** Every new learner takes a short placement test in the subject and at the level chosen at onboarding. It opens after the learner's free trial is booked, is taken once per subject, and never blocks a booking. Questions come from fixed bilingual question banks for every subject and level on the site (server/placement/banks, 2 questions below the chosen level, 3 at it, 3 above, shuffled per student) and are shown in the language chosen on the site. The result appears right away as a branded, printable report (clearly "not a certificate"). The super admin sees it on the website only (no email), adds a note, and can continue in the chat.
- **[Decided 2026-10-17] TEMPORARY test mode before launch.** So the owner can review every subject and level, the placement test is open before booking, any subject and level can be picked, and it can be retaken (`PLACEMENT_BEFORE_BOOKING = true` in `server/routes/community.ts`). Switch it back to `false` when the owner asks; the rule above then applies again.
- **[Decided 2026-10-16] Admin alerts on the website only.** New AI-guide requests and placement results reach the super admin as on-site notifications in the site's design (no emails). "Request more info" was removed; the admin continues with the student in the chat instead.
- **[Decided 2026-10-16] Teacher AI assistant is named Jalila (جليلة).**
- **[Decided 2026-10-16, changed same day] Chat.** Text only. Every account (student, parent, teacher) has a pinned conversation with the super admin; from sign-up, a student also has a conversation with their assigned teacher (and any teacher they book with). The super admin can read and write in all of them.
- **[Decided 2026-10-16] Zoom host.** The teacher starts every lesson as the Zoom host (fresh host link from the dashboard); students join through the waiting room, so a student who arrives first never becomes the host.

## 2b. Subjects

- **[Decided 2026-10-18] The subject catalog.** Single source of truth in code: `src/components/onboarding/subjects.ts`
  (families, subjects, levels per subject) with `BOOKABLE_SERVICES` in `src/booking/mockData.ts`; the database mirrors it
  in `services.is_active`.
  - **Quran ($9):** Quran Reading (two stages: Foundations → Reading the Mushaf), Tajweed (three levels), Memorization &
    Revision (one subject; the learner states the goal: start, add more, or keep it firm).
  - **The Zad Path (مسار الأثر, $9):** our own curriculum. Zad Essentials (أول الزاد) and Seerah, each in three versions
    picked automatically from the learner's age: Kids 6–11, Teens 12–17, Adults 18+. No level to choose.
  - **The Scholar's Path (مسار طالب العلم):** courses on the recognised classical books (Fiqh, Aqeedah, Hadith, ...),
    each with a fixed number of sessions, outcomes and a set book, four levels, any age; the matn in Arabic, explanation
    in Arabic or English. **Books, sessions and prices are not decided yet;** nothing is shown or bookable until the
    owner defines them.
  - **Languages ($13):** Fusha Arabic (Foundations → Beginner → Intermediate → Advanced, conversation in every level;
    kids and 12+ versions), Egyptian Arabic (sounds first, then levels; Franco and Arabic script together; one design for
    all ages), English (kids: phonics and reading; 12+: CEFR A1–C1).
- **[Decided 2026-10-18] Levels are decided per subject**, not one scale for all. Paths are entered by level; only the
  version (Kids / Teens / Adults) follows age. Onboarding shows a subject's own levels; placement banks keep the four
  generic levels underneath.
- **[Decided 2026-10-18] Retired subjects** (rows kept, `is_active = false`, never deleted, so old bookings and reports
  still resolve): Revision (merged into Memorization & Revision), Arabic basics and Conversation (merged into Fusha),
  Islamic studies, Fiqh and Aqeedah (hidden until the Scholar's Path courses exist).
- **[Decided 2026-10-18] Books as scope only.** Commercial books (Jannat Al Quran for reading and tajweed, Al-Arabiyya
  Bayna Yadayk for Fusha, Kallimni 'Arabi for Egyptian) set what a level covers; the sequence, wording, examples and
  exercises are ours (`docs/curriculum/RULES.md` §1.4).
- **[Decided 2026-10-18] Tadabbur** is not a subject; it is a pillar of every Zad Path lesson (`docs/curriculum/RULES.md` §1.6).

## 3. Pricing

- **[Decided 2026-10-14] Hourly rates (60 minutes):**
  - Quran, Tajweed, and all Islamic studies (Aqeedah, Fiqh, Seerah, …): **$9 / hour**.
  - Arabic (MSA / Fusha, Egyptian Arabic) and English: **from $13 / hour** (most cases are $13).
- **[Decided] Shorter lessons are strictly proportional:** fee = hourly rate × minutes / 60.
  - $9 band: 30 min = $4.50, 45 min = $6.75, 60 min = $9.
  - $13 band: 30 min = $6.50, 45 min = $9.75, 60 min = $13.
- **[Decided] Higher prices for non-standard teaching.** Advanced, specialized, complex or intensive needs (including advanced levels of a $9 subject such as Fiqh) may cost more. The price is set by the teacher after assessing the learner (intake review / offer), never invented automatically. The website must say this clearly: prices are "from" prices for standard lessons.
- The server is the only authority for every price (`server/pricing/pricingEngine.ts` → `lessonFeeUsd`). The browser only displays prices.

## 4. Packages & discounts

- **[Decided] Packages are built on the hourly rates above,** with real, modest discounts for buying more lessons and a family discount for siblings in the same account.
- **[Decided] Commercial principles:** discounts must be sustainable (never selling below cost of the owner's time), clearly explained, and honest. Use positive framing (per-lesson price, "you save $X", family care) — never fake urgency, fake scarcity, hidden fees or pressure. Parents and students should feel the platform is their safe place, not a seller chasing money.
- **[Decided 2026-10-14] Package table approved by the owner:** `docs/pricing/packages.md` (live in `package_catalog`). A package is for one price band ($9 or $13) and one lesson length (30/45/60); the server enforces both. Family care: 5% off a package for a second (third…) child, applied by the server.
- **[Decided 2026-10-22] Discount codes:** the super admin creates codes (Dashboard → Discounts & invites): percent or fixed amount, for lessons, packages or both, with optional first-purchase-only, minimum order, total uses, uses per family and dates. A code stacks with package savings and the family 5%, but total savings on one order stay within a cap of the full price (a setting, 25% at launch). A **gift** code is outside the cap and may cover the whole price (100% allowed): the booking is confirmed or the package activated with no payment. A used code's terms never change; it can only be switched off, given an end date or a lower use limit. The server prices everything (`server/pricing/discounts.ts`).
- **[Decided 2026-10-22] Invite a friend (referral):** every family has a personal link (`/?ref=CODE`) on its Invite page. The friend gets account credit when they join (once, new accounts only, never your own code); the inviter gets credit only after the friend's first **paid** lesson is completed (the free trial does not count), up to a yearly limit. Amounts and the limit are settings (USD 5 / 5, 10 a year at launch). Credit is money, not a discount: it is used automatically at checkout (the family can switch it off), sits outside the cap, cannot be cashed out, and comes back if a booking it paid for is refunded or not completed.

## 5. Payments

- **[Decided] Refunds:** a confirmed payment is never deleted. A refund is a recorded action that marks the payment `refunded` and reverses its effect (cancels the lesson or returns package credits), with an audit trail.
- **[Decided 2026-10-14] Paid lesson cancelled in time → lesson credit** (a 1-lesson credit for the same price band and length, bookable any time). The student may instead ask for a refund ("I prefer a refund" → WhatsApp with a ready message stating they agree to wait up to **14 days**, asking for their receiving account, with the terms link). Limit: **3 refunded lessons per account**; above that, credits stay but are not refundable. The owner sends the money and records it with the Refund button on the original payment (this also voids the credit). Lessons taken, missed or cancelled late are not refundable.
- **[Decided 2026-10-15, after legal review] 14-day withdrawal.** A consumer may withdraw from a lesson or package within 14 days of buying. Before paying, a separate early-start checkbox is required (server refuses without it: `acceptedEarlyStart`). On withdrawal the owner refunds what was not delivered; package lessons already taken are charged at the package price per lesson. Withdrawals never count toward the refund limit.
- **[Decided 2026-10-14, narrowed 2026-10-15] Unused package lessons after 14 days** are not refunded automatically; the owner reviews requests case by case (stated in the terms).
- **[Decided 2026-10-15] The 3-lesson refund limit** applies only to the optional "I prefer a refund" for a lesson credit; never to a 14-day withdrawal, to lessons the platform cancels or fails, or to refunds the law requires.
- **[Decided] Pay later (trusted students).** Students with **at least 12 paid lessons** may choose "pay later" at checkout. The booking is then held as *awaiting approval*, the student is sent to WhatsApp (mandatory), and the super admin approves or rejects it from the dashboard. Nobody else can complete a booking without paying.
- **[Decided] Unpaid lessons are never confirmed or completed,** except pay-later bookings approved by the super admin.

## 6. Language & tone

- **[Decided] Everything is bilingual (Arabic + English)** for every account type — student, parent, teacher, admin — on every page, email and message.
- **[Decided] Tone:** friendly, warm and close to everyday speech in both languages; not stiff or overly formal, never boring.
- **[Decided 2026-10-14] Arabic style: a 50/50 mix** — simple standard Arabic with a warm Egyptian touch (e.g. "احجز حصتك", "بتوفّر", "عايز"), the way a friendly Egyptian teacher writes. Legal pages (terms, privacy) stay in clear simple standard Arabic so they are unambiguous.
- Arabic is right-to-left: use logical CSS (`ms-`/`me-`/`ps-`/`pe-`/`start`/`end`), never `left`/`right`.

- **[Decided 2026-10-15] Emails** are sent through Brevo (free plan) in ONE language: English by default, Arabic only for people who chose Arabic on the site (saved in a cookie and, when signed in, on their account in `user_language_preferences`). Logo, brand colours, Thmanyah font, light/dark mode and a legal footer. Templates: `server/notifications/emailTemplates.ts`.
- **[Decided 2026-10-15] Email senders:** booking/schedule emails come from support@watazawwado.academy (Vercel `NOTIFICATION_FROM_EMAIL`); sign-up and password emails come from noreply@watazawwado.academy through Supabase Auth's own SMTP settings. Super admin alerts go to `NOTIFICATION_ADMIN_EMAIL` (falls back to `NOTIFICATION_TEACHER_EMAIL`).
- **[Decided 2026-10-15] About page wording:** no degree claims and few Azhar mentions; describe the teaching as balanced and moderate, without extremism, with an Azhari foundation in Aqeedah, following Ahl al-Sunnah wal-Jama'ah.
- **[Decided 2026-10-15] Team mailboxes:** support@ (bookings, lessons, complaints, withdrawals), finance@ (payments, refunds), hr@ (teachers), info@ (general, welcome), privacy@ (personal data). Emails are sent from the mailbox that matches them.
- **[Decided 2026-10-15, changed 2026-10-16] Welcome recitation:** plays on the first homepage visit when the browser allows; otherwise a one-time animated hint asks to tap the sound button. It is replayed only from the button under the verse on the homepage (not from the menu).
- **[Decided 2026-10-14] Official contact number:** WhatsApp +48 508 157 886 (Poland). No other number may appear anywhere in the project.

## 6b. Voice, writing and mission

- **[Decided 2026-10-15] Mission.** The academy is built on two verses: ﴿وتزودوا فإن خير الزاد التقوى﴾ (its name) and ﴿وأما ما ينفع الناس فيمكث في الأرض﴾. It exists to benefit people and leave a lasting mark on a life, not only to earn money or share information. Deeds over words. The user should feel this on the site.
- **[Decided 2026-10-15] Writing tone.** Warm, wise and deep, with a family feeling (this is the student's home), and still professional. Engaging, never salesy, no hype.
- **[Decided 2026-10-15] Write little.** Short headlines and short paragraphs everywhere; every sentence earns its place.
- **[Decided 2026-10-15] We teach more than Quran and Arabic** (Tajweed, Islamic studies, English too). Headlines must not reduce the academy to one or two subjects.
- **[Decided 2026-10-15] Design ambition.** Every design request aims for the best, most memorable result, in the brand palette (crimson, teal, copper, gold) and in both light and dark mode; use the design skills.
- **[Decided 2026-10-16] How design work is done.** Every design task: (1) load the design skills (frontend-design, artifact/design guidance) first; (2) research inspiration on the internet and in free libraries (e.g. Dribbble/Mobbin-style references, unDraw, Storyset, Lottie free, Phosphor/Tabler icons, CodePen) and the references the owner sends; inspiration, never blind copying; (3) prefer our own SVG/CSS over new dependencies, respect licences (no attribution-required assets without the attribution); (4) follow `docs/design-system.md`; (5) video references from the owner are read frame by frame with FFmpeg (installed via winget), not guessed.
- **[Decided 2026-10-16] Design system.** Glass, calm and precise, inspired by Apple (layered translucent surfaces, soft depth, generous spacing, crisp type), in the brand palette and Islamic geometric motifs (khatam star, mihrab arch, the logo ribbon). The source of truth is `docs/design-system.md`; the site should feel like a masterpiece.
- **[Decided 2026-10-16] The academy speaks, not one person.** Public pages, emails and messages speak as Watazawwado ("we", "our team"); teachers, Ustadh Mahmoud included, appear as teachers of the academy. The owner stays in the background (legal pages still name the trader where the law requires it). WhatsApp prefills greet the Watazawwado team, not a person.
- **[Decided 2026-10-16] Every change also covers:** SEO (titles, meta, headings, prerendered content, alt text, performance), cyber security (auth, input validation, secrets, RLS, XSS/CSRF, rate limits), bugs and errors (type check, console, edge cases), and tests: a new feature gets tests, a changed feature gets its tests updated.

## 7. Engineering rules (always)

- Migrations are append-only (`supabase/migrations/`); use the `new-migration` skill.
- Never trust prices, amounts, IDs or roles sent by the browser.
- Never read, print or edit `.env*` files.
- Supabase query builders have no `.catch()`; use `const { error } = await ...`.
- Errors shown to users must not leak database or provider messages.

- **[Decided 2026-10-15] Governing law:** the terms are governed by Polish law and Polish courts (the owner lives in Poland), while consumers keep the mandatory protection of their own country. Have a lawyer review the terms once.
- **[Decided 2026-10-18] Act without asking, except curriculum content.** Any change to code or the database that does not need the owner's review is done without asking: Claude commits it, pushes it to `main` (production) after the type check, tests and build pass, applies database migrations to production Supabase in the same release, and smoke-tests production. Curriculum content (المنهج) still stops for the owner's review (`docs/curriculum/RULES.md` §2). Every change still passes the type check and tests before it is committed.
- **[Decided 2026-10-18] Project files are written in English.** Every file added to or saved in the project (plans,
  rules, docs, briefs, notes, curriculum or not) is in English, so every agent reads it the same way. Chat with the owner
  stays in Arabic; user-facing Arabic text (site copy, Arabic teacher notes) is content, not documentation.
- **[Decided 2026-10-15] Release process:** no preview environment (Vercel variables are Production-only). Every release: type check + offline tests + build, then push to `main` (= production), then a production smoke test. The previous production deployment stays as the Vercel rollback.

## 8. Open items

Owner decisions: none open right now.

Engineering backlog (no owner decision needed, do when there is time):
- Design system: pages move to `src/components/ui/*` gradually, when they are changed (rule in CLAUDE.md).

## 9. Curriculum

- **[Decided 2026-10-16]** All curriculum (المنهج) decisions, rules and progress live in `docs/curriculum/PLAN.md`. Read it before any curriculum work and record new owner decisions there.
- **[Decided 2026-10-18]** The binding curriculum-building rules are `docs/curriculum/RULES.md`; any curriculum work uses the `curriculum-builder` skill. All project documentation is written in English (owner, 2026-10-18); the site itself stays bilingual (§6).
