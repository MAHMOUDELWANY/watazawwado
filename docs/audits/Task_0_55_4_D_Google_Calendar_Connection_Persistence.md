# TASK 0.55.4-D: GOOGLE CALENDAR CONNECTION PERSISTENCE & FALSE-SUCCESS CORRECTION AUDIT & VERIFICATION

**Document Version:** 1.0.0  
**Date:** 2026-09-08  
**Scope:** Server-Side Calendar Connection Ownership & OAuth Callback Persistence Verification  
**Production Supabase Project:** `fmwxqyroyxgigvpahpri`  
**Classification:** DB Schema Correction & Integration Reliability Remediation  

---

## A. Root Cause Analysis

### 1. Why OAuth succeeded
The Google OAuth flow correctly validated the teacher and acquired valid `access_token` and `refresh_token` payloads. The callback properly authorized the active teacher UUID via the `isTeacherCurrentlyAuthorized` (Task 0.55.4-C) resolution flow.

### 2. Why the DB connection failed
The `public.calendar_connections` table contained the following foreign key constraint:
```sql
calendar_connections_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES profiles(id)
```
When a teacher did not possess a corresponding row in the optional `public.profiles` table (as is the case for natively-provisioned `public.teacher_accounts`), inserting the calendar connection caused a PostgreSQL foreign key violation.

### 3. Why the UI falsely reported success
The callback invoked the `supabase.from('calendar_connections').insert(...)` operation but failed to capture or inspect the returned `.error` property. The HTTP handler blindly progressed and emitted the `GOOGLE_CALENDAR_CONNECTED` `postMessage` back to the parent window, leading the frontend to incorrectly assume the connection was established, even though the database insert failed.

---

## B. Schema Correction

Created Database Migration `20260908000012_calendar_connections_ownership_correction.sql`:

**OLD:**
```sql
calendar_connections.teacher_id → profiles.id
```

**NEW:**
```sql
ALTER TABLE IF EXISTS public.calendar_connections
ADD CONSTRAINT calendar_connections_teacher_id_fkey
FOREIGN KEY (teacher_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
```
The canonical teacher ownership model is now enforced at the database level against `auth.users(id)`.

---

## C. Authorization
The callback correctly validates the teacher via the verified Task 0.55.4-C pipeline:
```text
Supabase Auth
→ email
→ teacher_accounts
→ is_active = true
→ authorized
```

---

## D. Ownership
The stable, canonical owner is established:
```text
Authenticated Teacher UUID (from auth.users)
→ calendar_connections.teacher_id
```

---

## E. False-Success Fix

The Google OAuth callback handler in `api/index.ts` was refactored to require explicit confirmation of successful database updates and inserts.
```typescript
const { data: insertData, error: insertError } = await supabase.from('calendar_connections').insert({
  // payload
}).select('id').single();

if (insertError || !insertData) {
  return res.status(500).send('Database Error: Google Calendar was authorized, but the connection could not be saved to your account. Please try again.');
}
```
If an insert error occurs, the server responds with a 500 status and **strictly prohibits** the emission of the `GOOGLE_CALENDAR_CONNECTED` `postMessage` payload, ensuring the UI accurately reflects failure.

---

## F. RLS
Teacher-only ownership enforcement was previously applied via migration `20260908000011_calendar_connections_security_correction.sql` which correctly verified `teacher_id = auth.uid()` combined with `teacher_accounts.is_active = true`. This RLS alignment perfectly matches the new `auth.users(id)` ownership FK.

---

## G. Tests

New behavioral regression tests successfully implemented in `test/task-0.55.4-d-google-calendar-persistence.test.ts`:

- **Test B:** Valid OAuth exchange and successful DB persistence emits success HTML and `GOOGLE_CALENDAR_CONNECTED`. (**PASS**)
- **Test C:** Failed DB insertion prevents false success, returns HTTP 500, and hides `GOOGLE_CALENDAR_CONNECTED`. (**PASS**)

Full repository test suite run: **350 / 350 tests passed**. (100% pass rate).

---

## H. Production

```text
IMPLEMENTED_NOT_LIVE_VERIFIED
```
Source code updates and database migrations are fully prepared in the repository. They require deployment to Vercel and production execution of the Supabase migration to be fully live verified.

---

## I. Booking Sync
Booking synchronization (Google Calendar event creation on student booking) was not altered in this task. It must be explicitly verified in a subsequent end-to-end task once this connection foundation is confirmed active in production.

---

## J. Scope
- **Confirmed:** No Google credentials regenerated.
- **Confirmed:** No Google Cloud OAuth configuration changed.
- **Confirmed:** No fake profiles created.
- **Confirmed:** No RLS bypass introduced.
- **Confirmed:** No secrets exposed.
- **Confirmed:** No unrelated UI redesign.
- **Confirmed:** No historical migration rewritten.
- **Confirmed:** No legacy Supabase project touched.
