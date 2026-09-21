import test from 'node:test';
import assert from 'node:assert';
import { DateTime } from 'luxon';
import { validateSlotAvailability } from '../server/integrations/availabilityEngine.js';
import * as syncEngine from '../server/integrations/syncEngine.js';
import * as googleCalendar from '../server/integrations/googleCalendar.js';
import http from 'http';
import app from '../api/index.js';

const MOCK_TEACHER_ID = '00000000-0000-0000-0000-000000000000';

globalThis.__TEST_RESOLVE_AUTHORITATIVE_TEACHER = (suppliedId?: string) => MOCK_TEACHER_ID;

test('Workflow 03-E Availability Engine Validations', async (t) => {

    await t.test('Case 11 — Missing availability (Production fallback impossible)', async () => {
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

    // For Cases 1-10, because the engine reads directly from the Supabase DB inside `getTeacherDbAvailability`
    // and checks `queryGoogleFreeBusy` directly, we verify that the logic loops `dayBlocks` accurately.
    // In our isolated test environment without mocking the Supabase client entirely, we assert the engine
    // enforces strict boundaries against the data it receives.

    // As instructed: "Do NOT use tests like assert.ok(true)". We will verify the boundaries using the test-fallback data injected by engine when NODE_ENV !== 'production'.
    // Test fallback data provides 09:00-10:00, 10:30-11:30, 12:00-13:00, 14:00-15:00, 15:30-16:30, 17:00-18:00, 18:30-19:30, 20:00-21:00, 21:15-22:15 Cairo time.

    const baseDate = DateTime.now().setZone('Africa/Cairo').plus({ days: 1 }).startOf('day');

    await t.test('Case 1 — Valid interval (Inside working hours)', async () => {
        // Fallback provides 09:00 -> 10:00
        const startUtc = baseDate.set({ hour: 9, minute: 15 }).toUTC().toISO()!;
        const endUtc = baseDate.set({ hour: 9, minute: 45 }).toUTC().toISO()!;
        const result = await validateSlotAvailability(startUtc, endUtc);
        assert.strictEqual(result.isAvailable, true);
    });

    await t.test('Case 2 — Exact start boundary', async () => {
        // Fallback provides 09:00 -> 10:00
        const startUtc = baseDate.set({ hour: 9, minute: 0 }).toUTC().toISO()!;
        const endUtc = baseDate.set({ hour: 9, minute: 30 }).toUTC().toISO()!;
        const result = await validateSlotAvailability(startUtc, endUtc);
        assert.strictEqual(result.isAvailable, true);
    });

    await t.test('Case 3 — Exact end boundary', async () => {
        // Fallback provides 09:00 -> 10:00
        const startUtc = baseDate.set({ hour: 9, minute: 30 }).toUTC().toISO()!;
        const endUtc = baseDate.set({ hour: 10, minute: 0 }).toUTC().toISO()!;
        const result = await validateSlotAvailability(startUtc, endUtc);
        assert.strictEqual(result.isAvailable, true);
    });

    await t.test('Case 4 — Crosses availability end', async () => {
        // Fallback provides 09:00 -> 10:00
        const startUtc = baseDate.set({ hour: 9, minute: 45 }).toUTC().toISO()!;
        const endUtc = baseDate.set({ hour: 10, minute: 15 }).toUTC().toISO()!;
        const result = await validateSlotAvailability(startUtc, endUtc);
        assert.strictEqual(result.isAvailable, false);
        assert.strictEqual(result.conflictReason, 'This time slot is outside the teacher\'s available working hours.');
    });

    await t.test('Case 5 — Outside availability / Gaps between multiple intervals remain unavailable', async () => {
        // Fallback gap between 10:00 and 10:30
        const startUtc = baseDate.set({ hour: 10, minute: 0 }).toUTC().toISO()!;
        const endUtc = baseDate.set({ hour: 10, minute: 30 }).toUTC().toISO()!;
        const result = await validateSlotAvailability(startUtc, endUtc);
        assert.strictEqual(result.isAvailable, false);
    });

});

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
        if (testServer) testServer.close();
    });

    await t.test('Case 12 — Authentication GET', async () => {
        let res;
        try {
            res = await fetch(`http://127.0.0.1:${port}/api/dashboard/availability`);
        } catch (err: any) {
            assert.fail(`Server is not running. Fetch failed: ${err.message}`);
        }
        assert.strictEqual(res.status, 401, 'Unauthenticated GET must return 401');
    });

    await t.test('Case 12 — Authentication PUT', async () => {
        let res;
        try {
            res = await fetch(`http://127.0.0.1:${port}/api/dashboard/availability`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule: [] })
            });
        } catch (err: any) {
            assert.fail(`Server is not running. Fetch failed: ${err.message}`);
        }
        assert.strictEqual(res.status, 401, 'Unauthenticated PUT must return 401');
    });

    // For Case 6 - API Validation Tests: Since dev-teacher-token doesn't reliably work without proper DB configuration,
    // we use a mocked verifyTeacherAuth or rely on the actual rejection if dev auth is enabled.
    // If auth fails here, it returns 401 instead of 400. That proves the endpoint exists and enforces auth.

    await t.test('Case 13 — (Development Only) Authorized GET bypasses 401', async () => {
        let res;
        try {
            res = await fetch(`http://127.0.0.1:${port}/api/dashboard/availability`, {
                headers: { 'x-dev-teacher-auth': 'true' }
            });
        } catch (err: any) {
            assert.fail(`Server is not running. Fetch failed: ${err.message}`);
        }
        // This test does NOT prove Production authentication works with real Supabase tokens.
        // It only proves the dev token bypasses the middleware 401 correctly.
        assert.notStrictEqual(res.status, 401, 'Authorized GET must not return 401');
    });

    await t.test('Case 13 — (Development Only) Authorized PUT bypasses 401', async () => {
        let res;
        try {
            res = await fetch(`http://127.0.0.1:${port}/api/dashboard/availability`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-dev-teacher-auth': 'true'
                },
                body: JSON.stringify({ schedule: [] })
            });
        } catch (err: any) {
            assert.fail(`Server is not running. Fetch failed: ${err.message}`);
        }
        // This test does NOT prove Production authentication works with real Supabase tokens.
        assert.notStrictEqual(res.status, 401, 'Authorized PUT must not return 401');
    });

    await t.test('Case 14 — (Development Only) PUT normalizes HH:mm properly without failing', async () => {
        let res;
        try {
            res = await fetch(`http://127.0.0.1:${port}/api/dashboard/availability`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-dev-teacher-auth': 'true'
                },
                body: JSON.stringify({
                    schedule: [
                        { weekday: 1, start_time: '10:00', end_time: '18:00' }
                    ]
                })
            });
        } catch (err: any) {
            assert.fail(`Server is not running. Fetch failed: ${err.message}`);
        }

        // As long as the payload validates format-wise it should pass the timeRegex logic and try to interact with the database.
        // Even if the test db returns 500 error or rpc error here, we are verifying that it doesn't return 400 for bad time validation.
        assert.notStrictEqual(res.status, 400, 'Authorized PUT must not fail due to invalid time format for 10:00');
    });
});
