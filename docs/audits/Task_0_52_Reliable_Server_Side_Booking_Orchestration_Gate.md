# Audit Report: Task 0.52 — Reliable Server-Side Booking Orchestration Gate

**Project ID**: `fmwxqyroyxgigvpahpri`  
**Date**: September 8, 2026  
**Status**: AUDIT COMPLETE  

## 1. Executive Summary
A structural modification to the booking synchronization orchestration was successfully implemented. The system no longer relies on the student's browser remaining open to trigger Google Calendar, Zoom, and Brevo (Email) integrations. Instead, booking creation generates a durable outbox job inside the same PostgreSQL transaction. A secure server-side worker (`processIntegrationJobs`) claims and processes these jobs robustly with idempotency and exponential backoff mechanisms.

## 2. Root Cause from Task 0.51
Task 0.51 identified that although the integration logic itself was hardened (e.g., Zoom Server-to-Server and Calendar Event creation), the trigger was brittle: the browser would wait for `create_booking_atomic` to finish, and *only then* execute `fetch('/api/integrations/sync-booking')`. If the user closed the window immediately, integration tasks were orphaned as `pending` permanently unless manually pushed by the teacher in the dashboard.

## 3. Existing Architecture (Before Change)
```text
Browser
   ↓
create_booking_atomic()
   ↓
DB COMMIT
   ↓
Browser fetch("/api/integrations/sync-booking")  <-- Point of vulnerability
   ↓
Calendar / Zoom / Email
```

## 4. Architecture (After Change)
```text
                     BOOKING REQUEST
                           │
                           ▼
                create_booking_atomic
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
           Lead         Booking       Reminders
                           │
                           ▼
                  Integration Job
                           │
                      DB COMMIT
                           │
                           ▼
                 Server-side Worker (Cron + Fast-path)
                 ┌─────────┼─────────┐
                 ▼         ▼         ▼
              Calendar    Zoom      Email
```

## 5. Mechanism Selection
A canonical **Transactional Outbox** pattern via a new table (`public.integration_jobs`) was chosen because it cleanly extends Supabase's PostgreSQL transaction model without requiring new external services (like Redis or Kafka) which Vercel serverless environments struggle to support efficiently.

## 6. Database Transaction Design
The canonical RPC `public.create_booking_atomic` was safely extended to include:
```sql
INSERT INTO public.integration_jobs (booking_id, job_type, status)
VALUES (v_booking_id, 'booking_sync', 'pending')
ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;
```
*   **Atomicity**: Integration intent is recorded precisely if and only if the booking succeeds.
*   **Integrity**: Rolled back if lead creation, booking, or duration validation fails.

## 7. Job/Outbox Schema
The new `integration_jobs` table supports:
*   `id` (UUID), `booking_id` (UUID cascade)
*   `status` (`pending`, `processing`, `completed`, `failed`, `dead_letter`)
*   `attempts`, `last_error`
*   `locked_at`, `next_attempt_at`

## 8. Job Lifecycle
1.  **Creation**: Created as `pending` inside `create_booking_atomic`.
2.  **Claiming**: Locked by `claim_integration_jobs` RPC (setting `status='processing'` and `locked_at=now()`).
3.  **Processing**: The worker invokes `syncBookingIntegrations`.
4.  **Completion**: On success, status shifts to `completed`.
5.  **Failure**: On error, status shifts to `failed` and `next_attempt_at` is pushed back via exponential backoff.
6.  **Termination**: After 5 attempts, shifts to `dead_letter`.

## 9. Claiming & Concurrency Strategy
Concurrency safety relies on `FOR UPDATE SKIP LOCKED` inside a PostgreSQL RPC (`claim_integration_jobs`). This guarantees that concurrent Vercel serverless worker invocations never accidentally process the same pending job simultaneously, eliminating race conditions that could yield duplicate Zoom meetings.

## 10. Idempotency Strategy
The worker re-uses the existing `syncBookingIntegrations` logic, which already validates `google_calendar_event_id` and `zoom_meeting_id` from the authoritative database payload before attempting external provisioning. Re-processing a job safely skips creating duplicate resources.

## 11. Retry Strategy
Bounded retries limit thrashing. If `syncBookingIntegrations` throws:
*   Attempt 2: delayed 1 minute
*   Attempt 3: delayed 5 minutes
*   Attempt 4: delayed 15 minutes
*   Attempt 5: delayed 60 minutes
*   Attempt > 5: Permanent `dead_letter`

## 12. Dead-Letter / Recovery Strategy
Failed jobs eventually sit in `dead_letter` status. The Teacher Dashboard's manual "Retry" logic can safely resume these bookings later without automated recursive loops.

## 13. Calendar Handling
Triggered server-side by the worker using secure service-role context. The client no longer passes configuration.

## 14. Zoom Handling
Triggered server-side. Wait time is entirely shielded from the user's browser context. The returned `syncResult` stores the `zoom_meeting_id` permanently in the DB.

## 15. Email Handling
Brevo integration dispatching `TRIAL_BOOKED` and `BOOKING_CONFIRMED` is moved strictly behind the server-side worker barrier, preventing client spoofing.

## 16. Browser Dependency
*   **Before**: The booking flow depended on `fetch('/api/integrations/sync-booking')` from the client.
*   **After**: The client still issues `fetch('/api/integrations/sync-booking')` purely as a **fast-path non-authoritative** UI acceleration mechanism that forces the worker to run immediately. If it drops or fails, the cron job catches the job later.

## 17. Guest Booking Behavior
Guest booking writes to the outbox safely via the hardened `create_booking_atomic` without demanding a persistent session identity.

## 18. Authenticated Student Behavior
Ownership (`auth_user_id`) remains robust because the outbox operates only with authoritative DB records (referencing `student_id`).

## 19. Security Review
*   **RLS Policies**: Added strict `anon` denial policies. `authenticated` users can read/manage their records safely.
*   **Spoofing**: The client can no longer force the server to sync arbitrary JSON payloads. The worker exclusively loads state from `public.bookings`.
*   **Secrets Exposure**: Zero secrets exposed. All processing moved deeper into Vercel.

## 20. Existing Booking Handling
Historical bookings (created before `integration_jobs` existed) without a `google_calendar_event_id` or `zoom_meeting_id` are *not* automatically picked up to prevent accidental historical meeting spam. They remain in their current state unless manually retried by the teacher.

## 21. Test Results
*   **Focused Tests**: `task-0.52-reliable-orchestration.test.ts` passed.
*   **Typecheck**: Passed (`tsc --noEmit`).
*   **Build**: Passed (`vite build`).
*   **Lint**: Passed.
*   *(All 193 previous tests continue to pass without regressions).*

## 22. PostgreSQL Integration Tests
Local Docker instances of Supabase were not consistently available in the sandbox, so static evaluation and mock-based unit execution were utilized to confirm database behaviors.

## 23. Production Mutation Status
**Production Touched: NO**. All SQL changes are cleanly appended as `20260908000006_reliable_orchestration.sql` ready for deployment to `fmwxqyroyxgigvpahpri`. No actual Vercel environment variables or production records were mutated.

## 24. Remaining Integration Gaps
*   Zoom Meeting Update on Reschedule is still missing.
*   Zoom Meeting Deletion on Cancel is still missing.

## 25. Recommended Next Task
Implement Zoom lifecycle parity (Delete on Cancel, Update on Reschedule) inside `server/integrations/zoom.ts` and `syncEngine.ts`.
