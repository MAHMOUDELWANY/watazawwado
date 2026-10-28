# Launch plan: assignment, wallet, booking, teacher pay (2026-10-28)

Owner request 2026-10-28. Investigation first, then owner decisions D1–D8 and S1–S4 below. Order of work at the end.

## What the code does today

| Area | Today | Gap |
|------|-------|-----|
| Teacher at sign-up | RULES.md §1 (2026-10-16) already says: the learner picks a teacher at onboarding, is assigned at once (no admin approval), the teacher gets an email + notice, a chat opens, the admin gets a notice and can reassign any time. | Onboarding still has hard-coded "Ustadh Mahmoud / Ustadha Afnan" fallback cards (`StudentOnboardingPage.tsx:60-61`). The admin notice should carry everything about the new learner. |
| "Talk to Ustadh Mahmoud on WhatsApp" | The student home teacher card. | Replaced by "Message your teacher" (site chat) in audit batch 2. Academy WhatsApp links remain on Packages/Payments (support), reviewed in the wallet work. |
| Admin welcome | Copy is admin-specific ("Getting the academy ready"). | The splash renders before the role is known, so the admin briefly gets the teacher line "Your students are waiting for you". Bug. |
| Teacher analytics | Removed from teachers in audit batch 1 (it was the sales funnel). | Teachers need their own month: lessons, hours, students, summaries, rating. No money of students. |
| Teacher pay | Nothing: no tables, pages or emails. | Full payroll needed. |
| Credits | Package lessons (Packages page), lesson credits from in-time cancellations, account balance from referrals/codes (Invite page and inside checkout). | No single place shows them. |
| Pending payments | A paid lesson is held 35 min while unpaid. | Not shown anywhere except inside the booking flow; the "you have a pending payment" pop-up blocks booking. |
| Booking | 7 steps; "single lesson or package" sends you off-flow by a small link. | Too many steps, packages hidden, credits unexplained. |
| Checkout | Our summary modal, then redirect to Stripe Checkout. Back from Stripe leaves our page stuck on "redirecting". | Bug (page restored from the back-forward cache keeps its loading state); crowded modal. |

## Owner decisions (2026-10-28)

- **D1** Several teachers of the chosen gender: the learner sees their cards (photo, name, short bio) and picks one; assigned at once.
- **D2** Teacher pay: a fixed hourly rate per teacher, set by the admin; a lesson counts by its length (45 min = 0.75 h).
- **D3** One student page **Wallet (محفظتي)** replaces Packages + Payments: balance at the top (package lessons, lesson credits, account balance in $), pending payments with Pay/Cancel, then history. A small balance card on home.
- **D4** Booking in 4 steps: (1) subject (and learner for a family), (2) length + single lesson or package using the same envelope cards as the public pricing, (3) time, (4) review and pay. Buying a package pays once and books the first lesson from it. Credits are applied automatically and said in words.
- **D6** Payroll is monthly: the statement closes at month end; the admin may add a bonus or deduction with a reason; the admin records the transfer (method + reference) between the 1st and 5th; the teacher gets a payslip email. The transfer itself happens outside the site.
- **D7** Each teacher has their own pay currency (e.g. EGP or USD); statements use it.
- **D8** Card payment inside our page (Stripe Payment Element: card, Apple Pay, Google Pay) with PayPal beside it; no redirect.

## Lesson outcomes, pay and credit (D5, S1–S4) — goes into RULES.md, the teacher agreement and the student terms

| Case | Teacher paid? | Student |
|------|---------------|---------|
| Lesson held (completed) | Yes, full length | Lesson used |
| Free trial | **No** | Free |
| Student cancels in time (3 h+) | No | Lesson credit |
| Student breaks the policy: no-show (not in within 15 min), late cancel, missed after a move | **Yes** | Lesson used |
| Student late | Yes, full length | The lesson ends on time; the teacher is encouraged (not obliged) to add time if free so the student gets at least 30 minutes in total |
| Teacher absent or cancels inside 3 h without moving (S1) | No | Lesson credit; admin alerted (may add a deduction by hand if it repeats) |
| Technical problem on our side, lesson not held (S3) | No | Lesson credit (teacher records "technical problem" in the lesson window) |
| Pay-later lesson not yet paid by month end (S4) | Yes | The academy collects |
| Lesson paid from a package or credit | Yes (same hourly rate) | Credit used |

## Work, in order

Status 2026-10-28: A to F shipped (see docs/backlog/LOG.md). F published as approved by the owner.

**A. Bugs before anything (small)**
1. Admin splash waits for the role (no teacher line for the admin).
2. Checkout: reset the "redirecting" state when the page is restored from back/forward (`pageshow` persisted) and let the dialog close without a reload.
3. Onboarding: remove the hard-coded teacher fallback; show a clear message if no teacher is available.

**B. Booking + Wallet (student side, launch critical)** — D3, D4, D8
- Wallet page and home balance card; old `/student/packages` and `/student/payments` redirect to it.
- Pending payment = a card on home, Lessons and Wallet ("held until 14:35 · Pay · Cancel"), and the first screen of booking instead of a blocking pop-up.
- Booking rebuilt in 4 steps, envelope cards in step 2, credits shown and applied, Stripe Payment Element + PayPal in step 4, one clear success screen.
- Phone, tablet and desktop layouts; the review step lists exactly what is paid.

**C. Teacher assignment** — D1
- Onboarding: gender → real teacher cards of that gender (photo, name, bio) → pick → assigned.
- Admin notice with the learner's details, subject, level and chosen teacher; the placement result attaches to the same student page when it arrives. Reassign stays on the student page.

**D. Teacher pay** — D2, D5–D7, S1–S4 (needs a migration)
- Data: pay rate + currency per teacher; monthly statements; statement lines from lessons by the outcome table; adjustments; payouts.
- Lesson window: outcomes "teacher absent" and "technical problem" (with the credit rules above).
- Admin: rates on Faculty; Payroll page per month (lines, adjustments, mark paid with method/reference) → payslip email.
- Teacher: "My pay" page: this month so far (grows with each lesson), counted lessons, past payslips and their status.

**E. Teacher "My month"** — lessons, hours, active students, summaries written on time, rating. No student money.

**F. Policy texts** — RULES.md, teacher agreement (new version, teachers re-accept), student terms (late arrival, technical problem, teacher absence). The owner reads the final wording before it goes live.

## Size and risk
- A: small. B: large (booking is the money path; Stripe test mode end to end before release). C: medium. D: large (new tables, money math with tests). E: small. F: text, owner review.
- Payments: Stripe Payment Element keeps card data on Stripe; server still sets the amount (CLAUDE.md "Server-side authority").

NO UNRESOLVED DECISIONS
