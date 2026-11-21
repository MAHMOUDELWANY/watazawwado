---
name: WATAZAWWADO-booking-payments
description: Use before ANY change or review touching bookings, lessons, free trials, cancel/reschedule, availability, pricing, packages, discount codes, referrals and credit, Stripe/PayPal, refunds, pay-later, teacher pay, reminders or terms consent ("حجز", "دفع", "سعر", "باقة", "استرداد", "booking", "payment", "refund", "price", "package", "checkout", "trial", "reschedule"). Holds the binding money and booking rules, the server-authority map (which file owns what), the red lines, and the test and review procedure. Money bugs here are Critical.
---

# Watazawwado Booking and Payments

Mistakes here cost families or the academy real money, so every change follows this order: **rules → owning code → change → failing test first → adversarial review → verify**. Read root `RULES.md` §1 to §5 and §2c for the exact numbers; this skill is the map and the discipline. If code and RULES.md disagree, the code is wrong; if RULES.md looks wrong, stop and ask the owner (never invent a rule).

## 1. Red lines (a violation is a Critical finding)

1. **Pay first.** A paid booking stays `pending` and no confirmation or reference is shown until payment is verified server-side (`verify_payment_atomic`). Only these confirm immediately: free trials, package-credit redemptions, 100% gift codes, and pay-later bookings the super admin approves (≥12 paid lessons, WhatsApp step).
2. **Server authority.** Price, discount, availability, ownership, role and lesson length come from the server (`server/pricing/pricingEngine.ts` `lessonFeeUsd`, `discounts.ts`, `offers.ts`, `server/integrations/availabilityEngine.ts`, `verifyStudentAuth`/`verifyTeacherAuth`). Never read an amount, price, id of another user, role, status or `confirmed` flag from the request body or the browser.
3. **Atomic writes.** Money and slots change only through the `SECURITY DEFINER` RPCs: `create_booking_atomic`, `verify_payment_atomic`, `refund_payment_atomic`, `student_cancel_paid_lesson_to_credit`, `release_expired_payment_holds`, `apply_checkout_discount_atomic`, `settle_checkout_redemptions`, `reverse_checkout_discount`, `admin_move_booking_teacher`, `qualify_referral`. Never emulate them with several client-side updates. Schema changes go through `WATAZAWWADO-new-migration`.
4. **Refunds are records.** A confirmed payment is never deleted; refund marks it `refunded` and reverses its effect with an audit trail. The 3-refunded-lessons limit applies only to the optional "I prefer a refund" path, never to a 14-day withdrawal, platform-caused cancellations, or legally required refunds.
5. **Consent is stored.** Every booking and package purchase needs the terms tick (server refuses without it; `TERMS_VERSION` in `api/index.ts` goes into `bookings.terms_version`). A substantive terms change bumps the version. A purchase also needs the separate early-start box (`acceptedEarlyStart`).
6. **Teachers never see money.** The API strips prices, fees, payments, refunds and pay-later data for non-admins; payment alerts go only to the super admin.
7. **Errors never leak** database or provider text to the user.
8. **No same-day bookings** (`isOnLaterDay`): every booking starts tomorrow or later in the student's time zone. Reschedule goes to another day, tomorrow or later.
9. **Idempotent and race-safe.** Webhooks and cron can fire twice; two people can click one slot. Every money or slot path must be safe to repeat and safe in parallel.

## 2. Rule sheet (numbers; verify against RULES.md before relying)

- **Prices** per hour: Quran, Tajweed and Islamic studies $10 (list since 2026-11-12); Arabic and English $13; shorter lessons proportional (`rate × minutes / 60`); "from" prices, advanced or specialised work may cost more, set by the teacher after assessment. Founding families: 15% off for 12 months. Packages: `docs/pricing/packages.md` (live in `package_catalog`), one price band and one length per package, family 5% off from the second child.
- **Discounts**: package savings, family 5% and a code can stack, total capped (setting, 25%); gift codes sit outside the cap; used-code terms never change. **Credit** (referral, welcome) is money, not a discount: outside the cap, never cashed out, returns if its booking is refunded or not completed. Referral reward needs the friend to pay at least the reward in real money (no chaining via the welcome gift).
- **Free trial**: one per learner (each child has theirs); 30 min default, 45 max; reschedule once, ≥1 h before; no-show or cancel → wait 48 h; after 5 lost trials the account loses trials (paid stays open).
- **Cancel / reschedule**: cancel ≥3 h before (trial ≥1 h); reschedule ≥1 h before, self-service; last hour nothing changes; missed lesson counts as taken. Platform/teacher failure → student picks new time, credit or refund, never counted in the refund limit. Teacher cancel/move rules and pay table: RULES.md §1 and §2c.
- **Reminders**: email on confirm and 3 h before; on-site 12 h and 2 h before; none after cancel; moved lesson gets new ones only. Reminder cron is external (`CRON_SECRET`).
- **Payment hold**: the slot is held briefly while paying; an unpaid hold expires and frees the slot.
- **Contact number** is only WhatsApp +48 508 157 886.

## 3. Where things live

| Concern | Owner file |
|---|---|
| All `/api/*` routes | `api/index.ts` (one router, ~8.7k lines) and `server/routes/*` |
| Price and discount | `server/pricing/{pricingEngine,discounts,offers,offerPurchasability}.ts` |
| Stripe | `server/payment/stripeService.ts` (webhook, checkout) |
| Availability and calendar | `server/integrations/{availabilityEngine,googleCalendar,syncEngine,zoom}.ts` |
| Reminders and emails | `server/notifications/*` |
| Client-side lesson rules (display only) | `src/lib/lessonRules.ts`, `lessonWindow.ts`, `paymentStatus.ts`, `bookingRepository.ts` |
| Refund/credit flows | RPCs above; routes in `api/index.ts` |
| Teacher pay | `server/payroll`, `server/routes/{payroll,myMonth,retentionBonus}.ts` |

Find exact functions with `graphify query "<question>"` first, then read only those lines.

## 4. Procedure

1. State which rule(s) the change touches, with the RULES.md section. If none covers it, ask the owner; do not decide money policy yourself.
2. Locate the owner file (§3). Fix at the shared server function, not at one caller.
3. Write the **failing test first** for the money or slot behaviour (`test/*.test.ts`; existing examples: `b2-pending-payment-card`, `b4-embedded-checkout`, `booking-day-and-reminders`, `discounts-engine`, `discount-codes-referrals`, `concurrencyOwnership`, `p3-booking-rules`, `e2e/paid-lifecycle.api.spec.ts`). Cover: the happy path, a request that lies (wrong price, other user's id, skipped consent), a repeat call, a parallel call, an expired hold.
4. Change the code; run the tests; then do the **attacker pass** (§5).
5. Money in a test: never pay for real. Go up to the Stripe/PayPal page and stop; test paid logic by calling the server, not by confirming from the client. Use `+qa-` accounts only (`WATAZAWWADO-qa`).
6. Release through `WATAZAWWADO-release`; after deploy, one read-only production smoke check. Production webhook rows and the System health page tell you if Stripe is healthy.

## 5. Attacker pass (do this before saying done)

- Can I confirm a paid lesson without a verified payment? Replay a webhook? Send the success URL by hand?
- Can I change the amount, currency, length, teacher, subject or discount in the request and get it accepted?
- Can I book another family's child, cancel another family's lesson, read another family's payment?
- Can two clients book one slot, or spend one credit/code twice (double-click, parallel tabs, retry after timeout)?
- Can a teacher see a price or payment through any API field, notification or export?
- What happens if Stripe, Zoom, Google or Brevo is down mid-flow: is the family left charged with no lesson, or a lesson with no charge, with no alert?
- Does the error text leak a table, RPC or provider message?
- Is every number on screen and in emails the one the server computed?

## 6. Tell the owner (Arabic, short)

What rule it touches, what changed, what test proves it, and anything that needs his decision. Refunds and withdrawals he sends himself (Refund button on the original payment); never move real money from code.
