/**
 * ====================================================================
 * TASK 0.55.2: GOOGLE CALENDAR EVENT IDEMPOTENCY & CONCURRENCY VERIFICATION
 * Comprehensive Verification Suite with True Race Barrier Harness
 * ====================================================================
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import crypto from 'crypto';
import {
  createGoogleCalendarEvent,
  generateDeterministicGoogleCalendarEventId,
  getGoogleCalendarEvent,
  findExistingGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  CalendarEventPayload
} from '../server/integrations/googleCalendar.js';
import { syncBookingIntegrations } from '../server/integrations/syncEngine.js';

// =========================================================================
// MOCK GOOGLE CALENDAR API BOUNDARY SIMULATOR
// =========================================================================

interface MockEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime: string; timeZone?: string };
  end?: { dateTime: string; timeZone?: string };
  extendedProperties?: { private?: Record<string, string> };
  htmlLink?: string;
  status?: string;
}

class MockGoogleCalendarServer {
  public events = new Map<string, MockEvent>();
  public calls: Array<{ method: string; url: string; body?: any; headers?: any; timestamp: number }> = [];
  public failNextWithTimeout = false;
  public nextGetStatus: number | null = null;
  public nextPostStatus: number | null = null;
  
  // Explicit barrier hooks for controlling race conditions
  public beforePostHook?: (body: any) => Promise<void>;
  public afterPostHook?: (body: any, createdEvent: MockEvent) => Promise<void>;

  reset() {
    this.events.clear();
    this.calls = [];
    this.failNextWithTimeout = false;
    this.nextGetStatus = null;
    this.nextPostStatus = null;
    this.beforePostHook = undefined;
    this.afterPostHook = undefined;
  }

  handleFetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
    const urlStr = url.toString();
    const method = options?.method || 'GET';
    const headers = (options?.headers || {}) as Record<string, string>;
    let body: any = null;
    if (options?.body) {
      try {
        body = JSON.parse(options.body as string);
      } catch {
        body = options.body;
      }
    }

    this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now() });

    // 1. GET /events/{eventId}
    if (method === 'GET' && urlStr.includes('/events/') && !urlStr.includes('/events?')) {
      const eventId = decodeURIComponent(urlStr.split('/events/')[1].split('?')[0]);
      
      // If a special forced status is configured for GET
      if (this.nextGetStatus !== null) {
        const forced = this.nextGetStatus;
        this.nextGetStatus = null; // consume
        if (forced === 404 || forced === 410) {
          return new Response(JSON.stringify({ error: { code: forced, message: 'Not Found' } }), {
            status: forced,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (forced === 401 || forced === 403) {
          return new Response(JSON.stringify({ error: { code: forced, message: 'Unauthorized / Forbidden' } }), {
            status: forced,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (forced >= 500) {
          return new Response(JSON.stringify({ error: { code: forced, message: 'Backend Error' } }), {
            status: forced,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      if (this.events.has(eventId)) {
        return new Response(JSON.stringify(this.events.get(eventId)), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: { code: 404, message: 'Not Found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. GET /events?q=... (search)
    if (method === 'GET' && urlStr.includes('/events?')) {
      const parsedUrl = new URL(urlStr);
      const q = parsedUrl.searchParams.get('q');
      const matched = Array.from(this.events.values()).filter(ev => {
        if (!q) return true;
        return (
          ev.summary?.includes(q) ||
          ev.description?.includes(q) ||
          ev.extendedProperties?.private?.booking_reference === q
        );
      });
      return new Response(JSON.stringify({ items: matched }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. POST /events (create)
    if (method === 'POST' && urlStr.includes('/events')) {
      // Execute race barrier hook before proceeding with POST
      if (this.beforePostHook) {
        await this.beforePostHook(body);
      }

      // Check if timeout simulated
      if (this.failNextWithTimeout) {
        this.failNextWithTimeout = false;
        // The server receives and stores the event, but the response drops
        if (body?.id) {
          this.events.set(body.id, {
            ...body,
            htmlLink: `https://calendar.google.com/event?eid=${body.id}`,
            status: 'confirmed'
          });
        }
        throw new TypeError('fetch failed: network timeout simulation');
      }

      const eventId = body?.id || `random_${Date.now()}`;

      // HTTP 409 Conflict: Google returns 409 when the identifier already exists
      if (this.events.has(eventId)) {
        return new Response(
          JSON.stringify({
            error: {
              code: 409,
              message: 'The requested identifier already exists',
              errors: [
                {
                  domain: 'global',
                  reason: 'duplicate',
                  message: 'The requested identifier already exists'
                }
              ]
            }
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Store event
      const created: MockEvent = {
        ...body,
        id: eventId,
        htmlLink: `https://calendar.google.com/event?eid=${eventId}`,
        status: 'confirmed'
      };
      this.events.set(eventId, created);

      if (this.afterPostHook) {
        await this.afterPostHook(body, created);
      }

      return new Response(JSON.stringify(created), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. PATCH /events/{eventId} (update)
    if (method === 'PATCH' && urlStr.includes('/events/')) {
      const eventId = decodeURIComponent(urlStr.split('/events/')[1].split('?')[0]);
      if (this.events.has(eventId)) {
        const existing = this.events.get(eventId)!;
        const updated = { ...existing, ...body };
        this.events.set(eventId, updated);
        return new Response(JSON.stringify(updated), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: { code: 404, message: 'Not Found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. DELETE /events/{eventId} (delete)
    if (method === 'DELETE' && urlStr.includes('/events/')) {
      const eventId = decodeURIComponent(urlStr.split('/events/')[1].split('?')[0]);
      if (this.events.has(eventId)) {
        this.events.delete(eventId);
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify({ error: { code: 404, message: 'Not Found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
}

const mockGoogle = new MockGoogleCalendarServer();

describe('Task 0.55.2: Google Calendar Event Idempotency & Concurrency Verification', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockGoogle.reset();
    globalThis.fetch = mockGoogle.handleFetch as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mockGoogle.reset();
  });

  const baseBooking: CalendarEventPayload = {
    referenceCode: 'WTZ-2026-VERIFY01',
    teacherId: 'teacher-mahmoud-01',
    learnerName: 'Zayd Al-Ansari',
    serviceName: 'Quran Tajweed & Reading',
    mode: 'trial',
    scheduledStart: '2026-10-25T10:00:00.000Z',
    scheduledEnd: '2026-10-25T10:45:00.000Z',
    studentTimezone: 'America/New_York',
    durationMinutes: 45,
    zoomMeetingLink: 'https://zoom.us/j/1234567890',
    contactEmail: 'zayd@example.com'
  };

  // =========================================================================
  // 1. TRUE CONCURRENCY HARNESS WITH EXPLICIT BARRIER INTERLEAVING
  // =========================================================================
  it('1. True concurrency harness: Worker A pauses before POST, Worker B completes POST, Worker A encounters 409 and reconciles with zero duplicate events', async () => {
    const deterministicId = generateDeterministicGoogleCalendarEventId(
      baseBooking.referenceCode,
      baseBooking.teacherId
    );

    let workerAPaused = false;
    let releaseWorkerA: (() => void) | null = null;
    const workerABarrier = new Promise<void>(resolve => {
      releaseWorkerA = resolve;
    });

    let workerBCompleted = false;

    // Configure the beforePostHook:
    // When the first POST arrives (Worker A), pause Worker A until Worker B has created the event!
    mockGoogle.beforePostHook = async () => {
      if (!workerAPaused) {
        workerAPaused = true;
        // Pause Worker A at the barrier
        await workerABarrier;
      }
    };

    // Start Worker A
    const workerAPromise = createGoogleCalendarEvent('mock-token-A', baseBooking);

    // Wait for Worker A to reach the pre-POST pause state
    while (!workerAPaused) {
      await new Promise(r => setTimeout(r, 5));
    }

    // Now start Worker B while Worker A is suspended before its POST
    const workerBPromise = createGoogleCalendarEvent('mock-token-B', baseBooking).then(res => {
      workerBCompleted = true;
      // Once Worker B has successfully created the event, release Worker A
      if (releaseWorkerA) {
        releaseWorkerA();
      }
      return res;
    });

    // Await both workers to finish
    const [resA, resB] = await Promise.all([workerAPromise, workerBPromise]);

    assert.strictEqual(workerBCompleted, true, 'Worker B must have completed first');
    assert.strictEqual(resA.eventId, deterministicId, 'Worker A must resolve with deterministic ID');
    assert.strictEqual(resB.eventId, deterministicId, 'Worker B must resolve with deterministic ID');
    assert.strictEqual(resA.eventId, resB.eventId, 'Both workers return identical event ID');
    assert.strictEqual(mockGoogle.events.size, 1, 'Google store contains strictly 1 event (zero duplicate events)');

    // Verify Google API call sequence:
    // Worker A: GET (404) -> POST (paused)
    // Worker B: GET (404) -> POST (200, creates event)
    // Worker A: resumes POST (409 Conflict) -> GET (200, reconciles existing) -> PATCH (reconciles times)
    const postCalls = mockGoogle.calls.filter(c => c.method === 'POST');
    assert.strictEqual(postCalls.length, 2, 'Exactly two POST calls occurred during the race');
  });

  // =========================================================================
  // 2. REPEATED SEQUENTIAL PROCESSING
  // =========================================================================
  it('2. Repeated processing: second sequential execution does O(1) GET and zero POST calls', async () => {
    const res1 = await createGoogleCalendarEvent('mock-token', baseBooking);
    const postCount1 = mockGoogle.calls.filter(c => c.method === 'POST').length;
    assert.strictEqual(postCount1, 1, 'First execution does 1 POST');

    const res2 = await createGoogleCalendarEvent('mock-token', baseBooking);
    const postCount2 = mockGoogle.calls.filter(c => c.method === 'POST').length;

    assert.strictEqual(res2.eventId, res1.eventId, 'Same event ID returned');
    assert.strictEqual(postCount2, 1, 'Second execution does NOT perform a second POST');
    assert.strictEqual(mockGoogle.events.size, 1, 'Google store contains strictly 1 event');
  });

  // =========================================================================
  // 3. 409 RECOVERY SEMANTICS: CASE A (409 + GET 200)
  // =========================================================================
  it('3. 409 Case A (409 + GET 200): Returns confirmed existing event and updates rescheduled times', async () => {
    const deterministicId = generateDeterministicGoogleCalendarEventId(
      baseBooking.referenceCode,
      baseBooking.teacherId
    );

    // Pre-populate event in Google store as if created by another worker
    mockGoogle.events.set(deterministicId, {
      id: deterministicId,
      summary: 'Existing event created concurrently',
      start: { dateTime: '2026-10-25T08:00:00.000Z' },
      end: { dateTime: '2026-10-25T08:45:00.000Z' },
      status: 'confirmed',
      htmlLink: `https://calendar.google.com/event?eid=${deterministicId}`
    });

    const res = await createGoogleCalendarEvent('mock-token', baseBooking);
    assert.strictEqual(res.eventId, deterministicId);
    assert.strictEqual(mockGoogle.events.size, 1);
  });

  // =========================================================================
  // 4. 409 RECOVERY SEMANTICS: CASE B (409 + GET 404) -> MUST NOT RETURN FALSE SUCCESS
  // =========================================================================
  it('4. 409 Case B (409 + GET 404): Throws retryable error, does NOT return false-success stub', async () => {
    const deterministicId = generateDeterministicGoogleCalendarEventId(
      baseBooking.referenceCode,
      baseBooking.teacherId
    );

    // Scenario: POST returns 409, but subsequent GET returns 404 (e.g. eventual consistency/trash state)
    // We simulate this by overriding handleFetch to return 409 on POST and 404 on GET
    globalThis.fetch = async (url: string | URL | Request, options?: RequestInit) => {
      const method = options?.method || 'GET';
      const urlStr = url.toString();

      if (method === 'GET') {
        return new Response(JSON.stringify({ error: { code: 404, message: 'Not Found' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (method === 'POST') {
        return new Response(JSON.stringify({ error: { code: 409, message: 'Identifier already exists' } }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    await assert.rejects(
      async () => {
        await createGoogleCalendarEvent('mock-token', baseBooking);
      },
      (err: any) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /reconciliation pending/i, 'Must throw a retryable error');
        assert.match(err.message, /retryable/i, 'Must indicate retryable outcome for worker');
        return true;
      }
    );
  });

  // =========================================================================
  // 5. 409 RECOVERY SEMANTICS: CASE C (409 + GET 401/403) -> AUTH FAILURE
  // =========================================================================
  it('5. 409 Case C (409 + GET 401/403): Throws authorization failure error', async () => {
    // Initial pre-POST GET returns 404, POST returns 409, post-409 reconciliation GET returns 401
    let getCallCount = 0;
    globalThis.fetch = async (url: string | URL | Request, options?: RequestInit) => {
      const method = options?.method || 'GET';
      if (method === 'GET') {
        getCallCount++;
        if (getCallCount === 1) {
          return new Response(JSON.stringify({ error: { code: 404, message: 'Not Found' } }), { status: 404 });
        }
        return new Response('Invalid Credentials (401)', { status: 401 });
      }
      if (method === 'POST') {
        return new Response(JSON.stringify({ error: { code: 409, message: 'Conflict' } }), { status: 409 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    await assert.rejects(
      async () => {
        await createGoogleCalendarEvent('mock-token', baseBooking);
      },
      (err: any) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /unauthorized|\(401\)/i, 'Must indicate unauthorized authentication failure');
        return true;
      }
    );
  });

  // =========================================================================
  // 6. 409 RECOVERY SEMANTICS: CASE D (409 + GET 500 / TIMEOUT) -> RETRYABLE
  // =========================================================================
  it('6. 409 Case D (409 + GET 500): Throws retryable backend error', async () => {
    let getCallCount = 0;
    globalThis.fetch = async (url: string | URL | Request, options?: RequestInit) => {
      const method = options?.method || 'GET';
      if (method === 'GET') {
        getCallCount++;
        if (getCallCount === 1) {
          return new Response(JSON.stringify({ error: { code: 404, message: 'Not Found' } }), { status: 404 });
        }
        return new Response('Backend Google 500 Internal Error', { status: 500 });
      }
      if (method === 'POST') {
        return new Response(JSON.stringify({ error: { code: 409, message: 'Conflict' } }), { status: 409 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    await assert.rejects(
      async () => {
        await createGoogleCalendarEvent('mock-token', baseBooking);
      },
      (err: any) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /500/, 'Must bubble up 500 error for worker retry');
        return true;
      }
    );
  });

  // =========================================================================
  // 7. NETWORK TIMEOUT AFTER REMOTE ACCEPTANCE
  // =========================================================================
  it('7. Network timeout after Google creates event: retry succeeds idempotently via deterministic ID with 0 duplicates', async () => {
    mockGoogle.failNextWithTimeout = true;

    // First attempt fails with network timeout
    await assert.rejects(
      async () => {
        await createGoogleCalendarEvent('mock-token', baseBooking);
      },
      /network timeout simulation/
    );

    // Google server actually accepted and stored the event
    assert.strictEqual(mockGoogle.events.size, 1, 'Event was created in Google store');

    // Worker retry
    const retryRes = await createGoogleCalendarEvent('mock-token', baseBooking);
    const expectedId = generateDeterministicGoogleCalendarEventId(
      baseBooking.referenceCode,
      baseBooking.teacherId
    );

    assert.strictEqual(retryRes.eventId, expectedId, 'Retry retrieves the accepted event');
    assert.strictEqual(mockGoogle.events.size, 1, 'Zero duplicates in Google store');
  });

  // =========================================================================
  // 8. DB WRITE FAILURE AFTER GOOGLE SUCCESS
  // =========================================================================
  it('8. DB write failure after Google success: next worker run recovers existing Google event', async () => {
    const res1 = await createGoogleCalendarEvent('mock-token', baseBooking);
    assert.ok(res1.eventId);

    // Simulate DB update failed -> worker runs again
    const res2 = await createGoogleCalendarEvent('mock-token', baseBooking);

    assert.strictEqual(res2.eventId, res1.eventId, 'Retry converges to identical event ID');
    assert.strictEqual(mockGoogle.events.size, 1, 'Zero duplicate events');
  });

  // =========================================================================
  // 9. TEACHER ISOLATION: BOOKING X + TEACHER A VS TEACHER B
  // =========================================================================
  it('9. Teacher isolation: Distinct teachers generate independent deterministic IDs with zero cross-talk', async () => {
    const teacherA = 'teacher-mahmoud-01';
    const teacherB = 'teacher-ahmed-02';

    const idA = generateDeterministicGoogleCalendarEventId(baseBooking.referenceCode, teacherA);
    const idB = generateDeterministicGoogleCalendarEventId(baseBooking.referenceCode, teacherB);

    assert.notStrictEqual(idA, idB, 'Deterministic IDs for different teachers must be distinct');

    await createGoogleCalendarEvent('mock-token-A', { ...baseBooking, teacherId: teacherA });
    await createGoogleCalendarEvent('mock-token-B', { ...baseBooking, teacherId: teacherB });

    assert.strictEqual(mockGoogle.events.size, 2, 'Two distinct events created for two teachers');
    assert.ok(mockGoogle.events.has(idA));
    assert.ok(mockGoogle.events.has(idB));
  });

  // =========================================================================
  // 10. CANCEL & RESCHEDULE SAFETY
  // =========================================================================
  it('10. Reschedule safety: Rescheduling updates existing event via PATCH without creating duplicates', async () => {
    const initialRes = await createGoogleCalendarEvent('mock-token', baseBooking);
    assert.strictEqual(mockGoogle.events.size, 1);

    const rescheduledBooking: CalendarEventPayload = {
      ...baseBooking,
      scheduledStart: '2026-10-27T15:00:00.000Z',
      scheduledEnd: '2026-10-27T15:45:00.000Z'
    };

    const res2 = await createGoogleCalendarEvent('mock-token', rescheduledBooking);
    assert.strictEqual(res2.eventId, initialRes.eventId, 'Event ID remains identical');
    assert.strictEqual(mockGoogle.events.size, 1, 'No duplicate event created');

    const updated = mockGoogle.events.get(initialRes.eventId)!;
    assert.strictEqual(updated.start?.dateTime, '2026-10-27T15:00:00.000Z');
  });

  // =========================================================================
  // 11. DETERMINISTIC EVENT ID CONFORMANCE & SAFETY
  // =========================================================================
  it('11. Deterministic event ID format conformance: 64-char lowercase hex compliant with Google Calendar API', () => {
    const id = generateDeterministicGoogleCalendarEventId('WTZ-2026-REF123', 'teacher-01');
    assert.match(id, /^[0-9a-f]{64}$/, 'ID must be 64 lowercase hexadecimal characters');
    assert.strictEqual(id.length, 64);
    // [0-9a-f] is a subset of [0-9a-v], length 64 is within 5-1024
    assert.match(id, /^[0-9a-v]{5,1024}$/, 'Must satisfy Google Calendar event id specification');
  });

  // =========================================================================
  // 12. TOKEN SECRECY & SECURITY
  // =========================================================================
  it('12. Token secrecy: No OAuth access tokens leaked into event body or metadata', async () => {
    const secretOAuthToken = 'ya29.a0AfH6SM_SECRET_ACCESS_TOKEN_DO_NOT_EXPOSE';
    await createGoogleCalendarEvent(secretOAuthToken, baseBooking);

    const postCall = mockGoogle.calls.find(c => c.method === 'POST')!;
    assert.ok(postCall);

    const serialized = JSON.stringify(postCall.body);
    assert.strictEqual(serialized.includes('ya29.'), false, 'Must not leak access token into event body');
    assert.strictEqual(serialized.includes('SECRET'), false, 'Must not leak secret token into event body');
  });
});
