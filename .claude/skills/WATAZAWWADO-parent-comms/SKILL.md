---
name: WATAZAWWADO-parent-comms
description: Use for every message the academy sends to families and learners: transactional emails (booking, trial, payment, reschedule, cancellation, reminders, reports, weekly digest, welcome, invitation), Supabase auth emails, WhatsApp replies and prefills, push and on-site notifications, waitlist emails, apology and refund messages, "responses to a worried parent", "رد على ولي أمر", "إيميل", "واتساب", "إشعار", "email template". Applies the nine brand moments and our email system. Also use to review an existing template.
---

# Watazawwado Parent Communications

Every message is a moment in the relationship (`docs/marketing/BRAND.md` §8: people remember the strongest moment and the last one). Words come from `WATAZAWWADO-brand-voice`; money wording from `WATAZAWWADO-booking-payments`; this skill adds the message design and the channel mechanics.

## 1. Channels and who sends what

| Channel | Used for | Mechanics |
|---|---|---|
| **Email (Brevo)** | Booking, trial, payment, reschedule, cancel, reminders, reports, digest, welcome, invitation | Templates in `server/notifications/emailTemplates.ts` (`renderStudentBookingConfirmation`, `…TrialConfirmation`, `…PaymentConfirmed`, `…Cancellation`, `…Reschedule`, `…24hReminder/3h/1h`, `renderMonthlyProgressEmail`, `renderWeeklyDigestEmail`, `renderWelcomeEmail`, `renderSimpleNotice`, `renderSupabaseAuthTemplate`). Sent via `emailService.ts` and the dispatcher. One language per email: English by default, Arabic only if the person chose it (`user_language_preferences`). |
| **Sender mailboxes** | support@ bookings/lessons/complaints/withdrawals; finance@ payments/refunds; hr@ teachers; info@ general/welcome; privacy@ personal data; noreply@ sign-up and password (Supabase Auth SMTP) | Match the mailbox to the topic. Admin alerts go to the admin address only. |
| **On-site notifications / bell** | Reminders 12 h and 2 h, admin alerts (website only, no email), teacher bell | `server/notifications/inbox.ts`; student presentation in `src/student/notificationsPresentation.ts`. |
| **Push** | NX-09 families who opted in | `server/notifications/push.ts`; keep it short and actionable. |
| **WhatsApp** | A human conversation: first reply, payment follow-up, reschedule apology, refund request, pay-later approval | Number +48 508 157 886 only, prefills via `src/lib/whatsapp.ts`. Replies are signed by the Watazawwado team. |
| **Chat** (text only) | Learner ↔ assigned teacher and ↔ admin | Teachers never mention prices or payments. |

## 2. The shape of a transactional email

1. Short subject that names the thing ("Your lesson is confirmed", "Lesson moved to Tuesday").
2. One clear opening line: what happened.
3. One information card: subject, teacher, date and time **in the learner's time zone**, length, Zoom link, booking reference, price only when it is a payment email.
4. One primary button naming its action ("View your lesson", "Choose a new time").
5. A help line with the right mailbox and the WhatsApp link.
6. The standard footer (legal, brand, light and dark mode, Thmanyah). No giant marketing emails, no second CTA, no Zad in payment, cancellation or refund emails.

## 3. Rules that apply to every message

- **We speak, not a person.** Signed "the Watazawwado team"; a teacher message is from the teacher by name.
- **Honest and exact.** Times in the recipient's zone with the zone shown; the reference; the real policy window (cancel ≥3 h, trial ≥1 h; reschedule ≥1 h, another day). Never "payment received" before the server verified it. Never mention a teacher asked for a change to the family (RULES.md §1).
- **No pressure.** No fake urgency, no guilt on cancellation ("Cancel this lesson?" then the consequence). The 72-hour invitation hold is real because the next person is waiting; say so once, plainly, with one reminder.
- **Children**: the guardian is addressed; the child is not named in subject lines or push text; no child data in any URL.
- **Apology (our failure)**: from the team within hours, plain, no excuses, then the choice (new free time, credit or refund) and the 10 extra minutes next lesson as a gift. Never counted against the refund limit.
- **Reports**: one strength, one next step, one sentence about the child as a person, sent the same day (moment 5).
- **Teacher change, leaving, refunds**: follow `docs/policies/TEACHER-CHANGE.md` and RULES.md §5; the reason a family asked for a change never reaches the old teacher.
- **Do not mention** another number, a competitor, or an outcome promise.

## 4. The nine moments (reference; design each message to its moment)

Invitation when a wave opens (Zad: "Your place is open") → first WhatsApp reply (named next step; within 12 h, 4 h during wave weeks) → sign-up and choosing a teacher ("I kept your bag") → first 10 minutes of the trial → first report to a guardian → something went wrong on our side → celebrating progress (Zad celebrates a level, a surah, every 10 lessons; share card) → emails and notifications overall → when someone leaves ("your zaad is saved, come back any time"; one optional one-tap "why?").

## 5. Procedure

1. Name the moment, the recipient (family, adult learner, teacher, admin), the channel and the language(s).
2. Draft in the target language(s) natively, then run the brand-voice tell-removal pass.
3. Implement in the right template or helper; add the English and the Arabic version together; keep one language per send.
4. Preview: `scripts/render-email-previews.ts` writes `docs/email-previews/*.html`; open them in light and dark, phone width, Arabic RTL and English. Check the CTA link, the footer and that nothing leaks a provider message.
5. Tests: add or update the email/notification test (`test/emailService.test.ts` and the flow's own test).
6. Note: emails do not send from a local server; verify by the rows the server writes, and by the preview HTML. Production sends are checked by the System health page and Brevo.

## 6. Review checklist for an existing template

Subject specific and short · one CTA · times with zone · reference present · no price except payment emails · no Zad in money moments · right mailbox · both languages natural · footer present · dark mode readable · no invented numbers · help line points to the right channel.
