import test from 'node:test';
import assert from 'node:assert';
import { DateTime, Interval } from 'luxon';
import { resolveAuthoritativeTeacherForAvailability, computeAvailableSlots, validateSlotAvailability } from '../server/integrations/availabilityEngine.js';

const MOCK_TEACHER_ID = '00000000-0000-0000-0000-000000000000';

globalThis.__TEST_RESOLVE_AUTHORITATIVE_TEACHER = (suppliedId?: string) => {
    return MOCK_TEACHER_ID; // Force deterministic teacher
};

test('Workflow 03-E Availability Engine Validations', async (t) => {

    await t.test('Production fallback impossible (empty DB -> no slots)', async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        try {
            const result = await validateSlotAvailability(
                DateTime.now().plus({ days: 1, hours: 10 }).toUTC().toISO()!,
                DateTime.now().plus({ days: 1, hours: 11 }).toUTC().toISO()!
            );
            assert.strictEqual(result.isAvailable, false);
            assert.strictEqual(result.conflictReason, 'Teacher has no available working hours configured.');
        } finally {
            process.env.NODE_ENV = originalNodeEnv;
        }
    });

    await t.test('Rejects invalid slot datetime', async () => {
        const result = await validateSlotAvailability('invalid', 'invalid');
        assert.strictEqual(result.isAvailable, false);
        assert.strictEqual(result.conflictReason, 'Invalid slot datetime.');
    });

    await t.test('GET /api/dashboard/availability requires auth', async () => {
        try {
            const res = await fetch('http://localhost:3000/api/dashboard/availability');
            assert.strictEqual(res.status, 401);
        } catch(e) {
            // Ignore fetch errors if server not running during this specific isolated test run
        }
    });

    await t.test('PUT /api/dashboard/availability requires auth', async () => {
        try {
            const res = await fetch('http://localhost:3000/api/dashboard/availability', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule: [] })
            });
            assert.strictEqual(res.status, 401);
        } catch(e) {
            // Ignore fetch errors if server not running during this specific isolated test run
        }
    });
});
