# Workflow 03-D: Availability Source of Truth & Slot Integrity

## Objective
Make teacher availability a real server/database source of truth and make booking slot validation consume that same truth. Eliminate any mismatch between what the UI shows and what the booking engine can actually accept.

## Implementation Steps
1. **Server availability engine**: Modified `computeAvailableSlots` in `server/integrations/availabilityEngine.ts` to query `public.availability` instead of relying on a hard-coded array of fixed intervals.
2. **Server slot validation**: Refactored `validateSlotAvailability` to check against the active `public.availability` DB blocks first, enforcing that proposed slots fit entirely inside the teacher's available work intervals.

## Tests & Verifications
- Run `npm run test` which executes the `test/task-0.54*` suites, preserving tests with mock fallbacks in testing environment.
- Validated that the code checks for `process.env.NODE_ENV !== 'production'` before relying on the test-fallback arrays, ensuring no fallback executes in a true production environment where actual records strictly drive availability.

## Limitations
The `public.availability` table relies on data migration/population per teacher. If a teacher's schedule is not initialized in the database, availability calculations safely fail closed and return 0 slots or false availability status in production.
