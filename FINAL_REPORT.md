# DIAGNOSTIC REPORT

### Root Cause
The `availability` table is not queried properly. In `getTeacherDbAvailability` inside `server/integrations/availabilityEngine.ts`, it queries the table `availability`. However, earlier prompts indicated that the UI saves availability into `teacher_availability` (specifically mentioning foreign keys failing on the `teacher_availability` insert due to empty `public.profiles`).

### Evidence
`getTeacherDbAvailability` does this:
```typescript
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true);
```
But the table name used elsewhere in the system is likely `teacher_availability`, which is what the `update_teacher_availability` RPC updates.

### Zero-Slot Point
Inside `getTeacherDbAvailability(teacherId: string)`, the `supabase.from('availability')` fetch either fails silently returning `[]` or queries a deprecated table that is empty, resulting in `dbAvailability` being an empty array. Since it is an empty array, the `computeAvailableSlots` function iterates over an empty `dayBlocks` list and generates zero slots.

### Minimal Fix
Change the table name in `getTeacherDbAvailability` from `availability` to `teacher_availability`.

### DB Change
None.

### Production Verification
Run the public student booking UI in production. It should now display slots based on the availability configured in the teacher dashboard.
