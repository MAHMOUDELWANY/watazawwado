import test from 'node:test';
import assert from 'node:assert';
import { DateTime } from 'luxon';
import { validateSlotAvailability } from '../server/integrations/availabilityEngine.js';

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

});

import http from 'http';
import app from '../api/index.js';

test('Workflow 03-E Endpoint Security Validations', async (t) => {
    let testServer: http.Server;
    let port = 0;

    t.before(async () => {
        return new Promise<void>((resolve, reject) => {
            testServer = app.listen(0, '127.0.0.1', () => {
                port = (testServer.address() as any).port;
                resolve();
            });
            testServer.on('error', reject);
        });
    });

    t.after(() => {
        if (testServer) {
            testServer.close();
        }
    });

    await t.test('GET /api/dashboard/availability requires auth', async () => {
        let res;
        try {
            res = await fetch(`http://127.0.0.1:${port}/api/dashboard/availability`);
        } catch (err: any) {
            // In GitHub Actions or some environments, fetch fails with "fetch failed" instead of ECONNREFUSED code directly on the error object
            if (err.message === 'fetch failed' || err.code === 'ECONNREFUSED') {
                // If the test server failed to bind or is not running, we must fail the test as requested.
                assert.fail(`Server is not running on ephemeral port ${port}. Endpoints could not be tested.`);
            } else {
                assert.fail('Fetch failed: ' + err.message);
            }
        }
        assert.ok(res, 'Response should exist');
        assert.strictEqual(res.status, 401, 'Expected 401 Unauthorized for unauthenticated GET request');
    });

    await t.test('PUT /api/dashboard/availability requires auth', async () => {
        let res;
        try {
            res = await fetch(`http://127.0.0.1:${port}/api/dashboard/availability`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule: [] })
            });
        } catch (err: any) {
             if (err.message === 'fetch failed' || err.code === 'ECONNREFUSED') {
                assert.fail(`Server is not running on ephemeral port ${port}. Endpoints could not be tested.`);
            } else {
                assert.fail('Fetch failed: ' + err.message);
            }
        }
        assert.ok(res, 'Response should exist');
        assert.strictEqual(res.status, 401, 'Expected 401 Unauthorized for unauthenticated PUT request');
    });
});
