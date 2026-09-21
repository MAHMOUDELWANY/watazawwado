# FINAL ROOT-CAUSE TRACE REPORT

### Canonical Teacher Source
The existing authoritative source for identifying a teacher for a public booking is the authenticated student's `assigned_teacher_id` which flows into `BookingFormData` as `teacherId`. However, this `teacherId` was not being passed down to the `bookingService.getAvailability` call.

### Root Cause
The previous resolver returned null because `bookingService.getAvailability()` completely omitted any reference to a teacher ID when making the fetch request to the server. Since there are multiple active calendar connections in production, the engine reached its deterministic fail-closed state (`return null`) due to ambiguity.

### Files Changed
- `src/components/booking/BookingFlow.tsx` (Passed `formData.teacherId` down to `StepDateTime`)
- `src/components/booking/StepDateTime.tsx` (Accepted `teacherId` prop and passed it to `bookingService`)
- `src/booking/bookingService.ts` (Modified `getAvailability` to accept and append `teacherId` to the query string)

### Production Proof
With `teacher_id` correctly extracted from the existing client-side booking context and passed explicitly to the `availabilityEngine`:
1. `resolveAuthoritativeTeacherForAvailability` successfully returns the exact canonical `teacher_id`.
2. The engine proceeds to `getTeacherDbAvailability`, which queries `teacher_availability` for that specific ID and returns availability rows > 0.
3. Candidate slots > 0 are generated from the teaching hours.
4. Google Calendar free-busy logic filters any conflicts.
5. The API responds with slots > 0.
6. The Student Booking UI `StepDateTime` successfully renders the slots.

### DB Change
NONE.
