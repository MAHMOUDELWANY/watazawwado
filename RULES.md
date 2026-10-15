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
- **[Decided 2026-10-15] Teachers don't move or cancel lessons directly.** They "Ask the student to reschedule"; the student gets an on-site notification and picks a new time. Only the super admin moves or cancels lessons directly.
- **[Decided 2026-10-15] Teacher notifications:** a teacher gets an email and an on-site notification (dashboard bell) when one of their lessons is booked (trial or paid), moved or cancelled.
- **[Decided 2026-10-15] Adding teachers:** the super admin adds a teacher (email, name, gender) on the Teachers page; the teacher receives an invitation email to set a password and signs in at /staff/login. Each teacher's emails go to the email of their teacher account, so no Vercel setting is needed per teacher.
- **[Decided 2026-10-15] Teacher time zones:** each teacher enters weekly hours in their own time zone on "My hours"; students always see times in theirs.
- Roles: `student` (adult learner), `parent` (guardian account managing children), `teacher`, `super_admin`.

## 2. Accounts & booking

- **[Decided] No guests.** Every booking (free trial or paid) requires a signed-in account. There is no anonymous booking path.
- **[Decided] Pay first.** A paid booking is not confirmed — and no confirmation/reference is shown — until payment is verified server-side. While the student is paying, the slot is held for a short time (payment hold); an unpaid hold expires automatically and frees the slot.
- **[Decided] Free trial — one per new student.** Default 30 minutes, maximum 45 minutes (master spec §9).
- **[Decided] Free trial rescheduling.** A trial can be rescheduled **once**, and only **at least 1 hour before** the lesson. Missing the trial (no-show), or cancelling it, means the student must wait **48 hours** before booking again.
- **[Decided 2026-10-14] Free-trial limit.** After **5** cancelled or missed trials, the account can no longer book free trials; paid lessons stay open. Accounts are never deleted automatically (confirmed by the owner 2026-10-14).
- **[Decided 2026-10-14] Cancelling and rescheduling (all lessons):**
  - cancel up to **3 hours** before (a free trial: up to 1 hour before);
  - reschedule up to **1 hour** before, self-service;
  - inside the last hour nothing can be changed; a missed lesson counts as taken (no refund, no credit);
  - real emergencies: the student messages WhatsApp; the super admin may move the lesson as goodwill, at their sole discretion (not a right);
  - if the platform/teacher cancels or fails, the student chooses a free new time, a credit or a refund, and it never counts toward the refund limit.
- **[Decided 2026-10-14] Terms consent.** Before every booking and package purchase the student ticks "I accept the terms and the cancellation & refund policy". The server refuses without it and stores the accepted terms version (`TERMS_VERSION` in `api/index.ts`, `bookings.terms_version/terms_accepted_at`, package `metadata`). Any substantive change to the terms page bumps the version.

- **[Decided 2026-10-16] Learner age.** Onboarding asks for the exact age (not an age range) of the student, or of each child when a parent signs up.
- **[Decided 2026-10-16, changed same day] Placement test after booking.** Every learner takes a short AI placement test (different for each learner, based on the subject and level chosen at onboarding). Students are told before booking that the test follows, and are invited to take it right after booking; it never blocks a booking. The super admin sees the result on the website only (no email), replies, and can continue with the student in the chat. Temporary until an official test per subject is written.
- **[Decided 2026-10-16] Admin alerts on the website only.** New AI-guide requests and placement results reach the super admin as on-site notifications in the site's design (no emails). "Request more info" was removed; the admin continues with the student in the chat instead.
- **[Decided 2026-10-16] Teacher AI assistant is named Jalila (جليلة).**
- **[Decided 2026-10-16] Chat.** Text only. Every account (student, parent, teacher) has a pinned conversation with the super admin; after booking, a student also has a conversation with their teacher (the super admin can read and write in all of them).
- **[Decided 2026-10-16] Zoom host.** The teacher starts every lesson as the Zoom host (fresh host link from the dashboard); students join through the waiting room, so a student who arrives first never becomes the host.

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

## 5. Payments

- **[Decided] Refunds:** a confirmed payment is never deleted. A refund is a recorded action that marks the payment `refunded` and reverses its effect (cancels the lesson or returns package credits), with an audit trail.
- **[Decided 2026-10-14] Paid lesson cancelled in time → lesson credit** (a 1-lesson credit for the same price band and length, bookable any time). The student may instead ask for a refund ("I prefer a refund" → WhatsApp with a ready message stating they agree to wait up to **14 days**, asking for their receiving account, with the terms link). Limit: **3 refunded lessons per account**; above that, credits stay but are not refundable. The owner sends the money and records it with the Refund button on the original payment (this also voids the credit). Lessons taken, missed or cancelled late are not refundable.
- **[Decided 2026-10-14] Unused package lessons** are not refunded automatically; the owner reviews requests case by case (stated in the terms).
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
- **[Decided 2026-10-14] Official contact number:** WhatsApp +48 508 157 886 (Poland). No other number may appear anywhere in the project.

## 7. Engineering rules (always)

- Migrations are append-only (`supabase/migrations/`); use the `new-migration` skill.
- Never trust prices, amounts, IDs or roles sent by the browser.
- Never read, print or edit `.env*` files.
- Supabase query builders have no `.catch()`; use `const { error } = await ...`.
- Errors shown to users must not leak database or provider messages.

- **[Decided 2026-10-15] Governing law:** the terms are governed by Polish law and Polish courts (the owner lives in Poland), while consumers keep the mandatory protection of their own country. Have a lawyer review the terms once.
- **[Decided 2026-10-15] Release process:** no preview environment (Vercel variables are Production-only). Every release: type check + offline tests + build, then push to `main` (= production), then a production smoke test. The previous production deployment stays as the Vercel rollback.

## 8. Open items

Owner decisions: none open right now.

Engineering backlog (no owner decision needed, do when there is time):
- Design system: pages move to `src/components/ui/*` gradually, when they are changed (rule in CLAUDE.md).
