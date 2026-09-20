# Workflow 04-A: Payment MVP / Manual Verification

## Overview
This document outlines the implementation of the Payment MVP for Watazawwado. The objective is to support the manual verification of payments submitted by students for both individual bookings and package entitlements, preserving the existing Watazawwado architecture and avoiding full-fledged provider APIs like PayPal.

## Business Flow
The process adheres to the requested lifecycle:
- Payment intent creates a pending record or entitlement (`pending_verification` concept mapped to `pending` in the DB).
- Student submits manual payment evidence (e.g., PayPal reference, IBAN reference) using the frontend claim forms.
- Watazawwado creates or updates the `payments` record idempotently, awaiting verification.
- An authorized teacher or admin manually verifies the payment.
- **Upon Verification:**
  - The payment state changes to `confirmed`.
  - For single lessons: The associated booking is marked `confirmed`.
  - For packages: The `activate_package_entitlement_atomic` RPC is called, granting the prepaid credits safely.
- **Upon Rejection:**
  - The payment state changes to `rejected`.
  - No credits are granted, and no bookings are confirmed.

## Database & Architectural Rules
1. **Schema Update:** A migration `20261002000000_phase04_payment_mvp_idempotency.sql` was applied to production. It adds `entitlement_id` to the `payments` table and applies an XOR constraint to ensure a payment targets *either* a booking *or* a package entitlement exactly once.
2. **Idempotency:** Payment claim endpoints in `api/index.ts` guard against duplicate submissions by returning existing pending records rather than creating duplicates.
3. **Security:** Endpoints are properly protected with `verifyTeacherAuth` for confirmations/rejections.

## Explicit Limitations (MVP Constraints)
> This is a temporary MVP payment verification workflow. It is intentionally not a PayPal API/webhook integration.
- No automated bank detection or webhooks.
- No automated refunds or recurring subscription settlements.
- The UI handles `pending_review` clearly and does not display fake "Success" screens upon submission.
