## Overview
This PR implements the Manual Payment Verification MVP to test real business demand with the smallest safe payment workflow.

## Key Features & Business Logic
- **Manual payment verification MVP only:** No PayPal API/OAuth/webhook automation.
- **Proof of Payment:** Payment proof is not stored in the Watazawwado database. Customers can provide proof externally via WhatsApp/Telegram or provide a reference number.
- **State Machine:** Payment remains `pending` until authorized verification.
- **Target Separation:** Booking/payment and package/payment targets are explicitly separated.
- **Server-Authoritative:** Amount and currency are server-authoritative. No client-supplied amount can override canonical pricing.
- **Security:** Student ownership and authentication are strictly enforced.
- **Atomicity:** Atomic payment verification implemented via RPC.
- **Downstream Actions:** Package activation and credit grants occur *only* after verification.
- **Idempotency:** Repeated verifications are idempotent; rejection never activates a package or confirms a booking.
- **Production Status:** Production migrations have been applied and verified.

## Validation Status
- **Tests:** 656 passing, 56 failing tests. (The 56 failing tests are known, pre-existing Google Calendar audit test failures present on `main` and are unrelated to payment features).
- **Lint:** Clean (`npm run lint` / 0 errors).
- **Typecheck:** Clean (`npx tsc --noEmit` / 0 errors).
- **Build:** Success (`npm run build`).
