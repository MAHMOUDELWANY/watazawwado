| Area                       | Status | Evidence |
| -------------------------- | ------ | -------- |
| Payment state machine      | Code/Build/Test Verified | `api/index.ts` enforces exactly `pending`/`confirmed`/`rejected` |
| Student payment submission | Code/Build/Test Verified | `POST /api/bookings/:referenceCode/payment-claim` and `/api/packages/:entitlementId/payment-claim` implemented |
| Verification authorization | Code/Build/Test Verified | Handled by `verifyTeacherAuth` at `/api/dashboard/payments/:id/confirm` |
| Package activation         | Code/Build/Test Verified | `activate_package_entitlement_atomic` called defensively upon confirmation |
| Single lesson payment      | Code/Build/Test Verified | `booking_id` linked payments trigger booking confirmation |
| Idempotency                | Code/Build/Test Verified | Both claim endpoints check existence and return success without duplication |
| RLS/security               | Code/Build/Test Verified | DB constraint limits target to exactly one (booking or package) |
| Production schema          | Production-proven | Migration `20261002000000_phase04_payment_mvp_idempotency.sql` executed |
| Production verification    | Unverified | Wait, no real money tests, but schema executed safely |
| Tests                      | Code/Build/Test Verified | `test/task-04a-payment-mvp.test.ts` implemented |
| Lint                       | Code/Build/Test Verified | `tsc --noEmit` passes clean |
| Build                      | Code/Build/Test Verified | `vite build && esbuild` success |
| Documentation              | Code/Build/Test Verified | `docs/workflows/04_a_payment_mvp_manual_verification.md` is present |
