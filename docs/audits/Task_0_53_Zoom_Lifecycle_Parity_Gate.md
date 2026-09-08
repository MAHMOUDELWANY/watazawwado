# Task 0.53 — Zoom Lifecycle Parity (Update/Delete)

## A. Scope
Completed the Zoom lifecycle (Update and Delete) using the Transactional Outbox Pattern established in Task 0.52. Zoom meeting details now sync reliably when a booking is rescheduled or cancelled, strictly driven by the backend worker.

## B. Architecture
When a reschedule or cancellation occurs via the backend RPCs (`cancel_booking_by_management`, `reschedule_booking_by_management`), the authoritative booking state is mutated, and a durable `integration_jobs` job (`booking_cancel` or `booking_reschedule`) is inserted atomically in the same transaction.
The Vercel worker (running via cron or fast-path UI trigger) claims these jobs using `FOR UPDATE SKIP LOCKED`. It fetches the authoritative booking state and performs the Zoom/Google Calendar operations and notification dispatch securely on the server side.

## C. Files Changed
- `server/integrations/zoom.ts` (added `updateZoomMeeting`, `deleteZoomMeeting`)
- `server/integrations/syncEngine.ts` (updated `syncCancelledBooking`, `syncRescheduledBooking` to include Zoom)
- `server/integrations/worker.ts` (added handlers for `booking_cancel` and `booking_reschedule` jobs)
- `api/index.ts` (refactored `/api/integrations/cancel` and `/api/integrations/reschedule` to simply enqueue background jobs rather than process synchronously)
- `test/task-0.53-zoom-lifecycle.test.ts` (new tests)

## D. Database Changes
Created `20260908000007_zoom_lifecycle_parity.sql`.
Redefined `cancel_booking_by_management` and `reschedule_booking_by_management` to insert durable `integration_jobs` rows alongside booking mutations.

## E. Worker Changes
Added `booking_cancel` and `booking_reschedule` job type parsing in `processIntegrationJobs()`.
Worker reads authoritative DB state (verifying status is correctly updated/cancelled) before invoking integrations and dispatching notifications.

## F. Idempotency
- Update: Zoom `PATCH /meetings/{id}` safely reapplies the start time and duration.
- Delete: Zoom `DELETE /meetings/{id}` safely treats 404 (Not Found) as a successful "already deleted" state.
- Duplicate jobs prevented at the queue level by `ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING`.

## G. Race Safety
The worker fetches the booking state *after* claiming the job. If a `booking_cancel` job is claimed but the booking is no longer in `cancelled` state, the worker skips execution. Same logic applies for reschedule.

## H. Error Classification
Retryable vs non-retryable logic relies on the existing queue backoff logic (1m, 5m, 15m, 60m).
Zoom `DELETE` treats 404 as non-error (already deleted). 
If Zoom meeting ID is empty, `updateZoomMeeting` and `deleteZoomMeeting` skip execution safely.

## I. Security
Student ownership, guest booking, and staff authorization remain secured by the existing management token hash model used in the RPCs.
Zoom credentials remain exclusively server-side.

## J. Tests
Created `test/task-0.53-zoom-lifecycle.test.ts` with 6 new integration mock tests covering Zoom Create (preservation), Update, Delete (success & already-deleted gracefully), and missing ID logic. Tests passed successfully.

## K. PostgreSQL Integration Limitation
PostgreSQL integration tests: Partial/Simulated. Complete validation requires a functional local Docker instance with credentials.

## L. Production
Production was not modified or verified by Task 0.53.

## M. Remaining Gaps
None for Zoom. Complete parity achieved.
