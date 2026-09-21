# FINAL ROOT-CAUSE TRACE REPORT

### Root Cause
The public Student Booking availability pipeline resolves `teacher_id` to `null` because there are multiple active calendar connections in Production and the UI request does not supply a `teacherId`. The engine explicitly fails closed in this scenario, preventing any `teacher_availability` database query from executing.

### Proof
In `server/integrations/availabilityEngine.ts`:
```typescript
export async function resolveAuthoritativeTeacherForAvailability(
  suppliedTeacherId?: string
): Promise<string | null> {
...
    const { data: conns, error } = await supabase
      .from('calendar_connections')
      .select('teacher_id')
      .eq('provider', 'google_calendar')
      .eq('is_active', true);
...
    if (conns.length === 1) { ... }

    if (cleanSupplied) { ... }

    // Multiple connections and no teacherId -> fail closed
    return null;
}
```
Production observation: The prompt confirms there are multiple active Google Calendar connections for different accounts. When the Student Booking UI calls `bookingService.getAvailability()` without a `teacherId` query parameter, `suppliedTeacherId` is `undefined`, and `conns.length > 1`. The function therefore reaches `return null;`.

### Zero-Slot Point
In `server/integrations/availabilityEngine.ts` inside `computeAvailableSlots`:
```typescript
  let dbAvailability: any[] = [];
  if (cleanTeacherId) {
    dbAvailability = await getTeacherDbAvailability(cleanTeacherId);
  }
```
Because `cleanTeacherId` is `null`, `dbAvailability` is never queried and remains `[]`. When iterating over the days, `dayBlocks` is extracted from `dbAvailability` which is empty. The `while` loop that generates slot intervals never runs, resulting in 0 candidate slots and 0 final slots.

### Minimal Fix
None yet, as instructed to "Do NOT modify code until the exact zero-slot point is proven" and "Do not report 'fixed' until the Student Booking UI actually displays real slots". The minimal fix will involve either providing the explicit `teacherId` in the API request from the frontend, or establishing a deterministic primary teacher resolution (which was previously reverted per instructions).

### DB Change
None.

### Production Verification
Run the public student booking UI in production (or make a GET request to `/api/integrations/availability?timezone=Africa/Cairo`) and verify whether the payload includes `teacherId`. If it does not, supply the `teacherId` to verify slots are returned.
