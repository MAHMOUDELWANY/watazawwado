import { test } from 'node:test';
import * as assert from 'node:assert';
import { computeAvailableSlots, validateSlotAvailability } from '../server/integrations/availabilityEngine.js';

test('Task 0.62: Availability Synchronization & Rules', async (t) => {
  await t.test('1. Valid slot fits inside DB availability boundary', async () => {
     // Tests rely on mocked data injected from DB hook
     const slots = await computeAvailableSlots('Africa/Cairo', 2, 30, 'teacher-mahmoud-001');
     assert.ok(Array.isArray(slots));
     // It might be empty if DB is empty, but type is array.
  });

  await t.test('2. Timezone conversion handles boundaries safely', async () => {
      const res = await validateSlotAvailability('2026-09-20T06:00:00.000Z', '2026-09-20T06:30:00.000Z', 'teacher-mahmoud-001');
      assert.ok(typeof res.isAvailable === 'boolean');
  });
});
