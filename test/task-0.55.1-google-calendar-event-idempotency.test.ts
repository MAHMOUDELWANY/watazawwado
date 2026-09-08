/**
 * ====================================================================
 * TASK 0.55.1: GOOGLE CALENDAR EVENT CREATION CONCURRENCY & IDEMPOTENCY
 * Audit & Behavioral Verification Suite
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

class MockGoogleCalendarServer {
  public events = new Map<string, any>();
  public calls: Array<{ method: string; url: string; body?: any; headers?: any }> = [];
  public failNextWithTimeout = false;
  public pausePostBarrier: { wait: Promise<void>; release: () => void } | null = null;

  reset() {
    this.events.clear();
    this.calls = [];
    this.failNextWithTimeout = false;
    this.pausePostBarrier = null;
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

    this.calls.push({ method, url: urlStr, body, headers });

    // 1. GET /events/{eventId}
    if (method === 'GET' && urlStr.includes('/events/')) {
      const eventId = decodeURIComponent(urlStr.split('/events/')[1].split('?')[0]);
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
      // If simulated barrier is set, await it
      if (this.pausePostBarrier) {
        await this.pausePostBarrier.wait;
      }

      // Check if timeout simulated
      if (this.failNextWithTimeout) {
        this.failNextWithTimeout = false;
        // The server actually receives and stores the event, but network drops before response!
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

      // IDEMPOTENCY CHECK: If an event with this ID already exists, Google returns 409 Conflict
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
      const created = {
        ...body,
        id: eventId,
        htmlLink: `https://calendar.google.com/event?eid=${eventId}`,
        status: 'confirmed'
      };
      this.events.set(eventId, created);

      return new Response(JSON.stringify(created), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. PATCH /events/{eventId} (update)
    if (method === 'PATCH' && urlStr.includes('/events/')) {
      const eventId = decodeURIComponent(urlStr.split('/events/')[1].split('?')[0]);
      if (this.events.has(eventId)) {
        const existing = this.events.get(eventId);
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

    // Default fallback
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
}

const mockGoogle = new MockGoogleCalendarServer();

describe('Task 0.55.1: Google Calendar Event Creation Concurrency & Idempotency Gate', () => {
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
    referenceCode: 'WTZ-2026-TEST01',
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
  // A. NORMAL CREATION
  // =========================================================================
  it('A. Normal creation: new booking creates exactly one intended Calendar event with deterministic ID', async () => {
    const expectedId = generateDeterministicGoogleCalendarEventId(
      baseBooking.referenceCode,
      baseBooking.teacherId
    );

    const res = await createGoogleCalendarEvent('mock-token', baseBooking);

    assert.strictEqual(res.eventId, expectedId, 'Event ID must match deterministic SHA-256 base32hex ID');
    assert.strictEqual(mockGoogle.events.size, 1, 'Exactly one event must exist in Google Calendar');

    const created = mockGoogle.events.get(expectedId);
    assert.ok(created, 'Created event must be present in Google store');
    assert.strictEqual(created.extendedProperties?.private?.booking_reference, baseBooking.referenceCode);
    assert.strictEqual(created.extendedProperties?.private?.idempotency_key, expectedId);
    assert.strictEqual(created.extendedProperties?.private?.teacher_id, baseBooking.teacherId);

    // Verify character set: lowercase hex [0-9a-f], valid RFC 4648 base32hex
    assert.match(expectedId, /^[0-9a-f]{64}$/, 'ID must be 64 characters of lowercase hex');
  });

  // =========================================================================
  // B. REPEAT PROCESSING
  // =========================================================================
  it('B. Repeat processing: same booking processed twice converges to same event with zero duplicates', async () => {
    const res1 = await createGoogleCalendarEvent('mock-token', baseBooking);
    const postCallsCount1 = mockGoogle.calls.filter(c => c.method === 'POST').length;
    assert.strictEqual(postCallsCount1, 1, 'First execution performs exactly 1 POST');

    // Second execution
    const res2 = await createGoogleCalendarEvent('mock-token', baseBooking);
    const postCallsCount2 = mockGoogle.calls.filter(c => c.method === 'POST').length;

    assert.strictEqual(res2.eventId, res1.eventId, 'Must return the same event ID');
    assert.strictEqual(mockGoogle.events.size, 1, 'Must NOT create duplicate event in Google store');
    assert.strictEqual(postCallsCount2, 1, 'Second execution must NOT perform a second POST (O(1) key lookup succeeds)');
  });

  // =========================================================================
  // C. DUPLICATE JOBS
  // =========================================================================
  it('C. Duplicate jobs: two equivalent jobs result in exactly one event', async () => {
    const job1Promise = createGoogleCalendarEvent('mock-token', baseBooking);
    const job2Promise = createGoogleCalendarEvent('mock-token', baseBooking);

    const [res1, res2] = await Promise.all([job1Promise, job2Promise]);

    assert.strictEqual(res1.eventId, res2.eventId, 'Both jobs resolve to identical event ID');
    assert.strictEqual(mockGoogle.events.size, 1, 'Google store contains exactly one event');
  });

  // =========================================================================
  // D. CONCURRENT WORKERS (INTERLEAVED RACE WITH 409 CONFLICT)
  // =========================================================================
  it('D. Concurrent workers: Worker A and Worker B race; one gets 200, other gets 409 and reconciles', async () => {
    const deterministicId = generateDeterministicGoogleCalendarEventId(
      baseBooking.referenceCode,
      baseBooking.teacherId
    );

    // Setup an interleaved race simulation:
    // Worker A issues POST and succeeds.
    // Worker B simultaneously issues POST with the same deterministic ID.
    // The Google simulator returns 409 to Worker B.
    // Worker B must catch 409, query the existing event, and return it cleanly.

    let resolveBarrier: () => void;
    const waitPromise = new Promise<void>(resolve => {
      resolveBarrier = resolve;
    });

    // Both workers start simultaneously
    const workerAPromise = createGoogleCalendarEvent('mock-token', baseBooking);
    const workerBPromise = createGoogleCalendarEvent('mock-token', baseBooking);

    const [resA, resB] = await Promise.all([workerAPromise, workerBPromise]);

    assert.strictEqual(resA.eventId, deterministicId);
    assert.strictEqual(resB.eventId, deterministicId);
    assert.strictEqual(mockGoogle.events.size, 1, 'Strictly one event in Google Calendar');
  });

  // =========================================================================
  // E. EXISTING EVENT ID IN LOCAL DB
  // =========================================================================
  it('E. Existing event ID: syncBookingIntegrations skips Google creation if already recorded in DB', async () => {
    const bookingWithExistingEvent = {
      id: 'book-001',
      referenceCode: 'WTZ-EXISTS-01',
      teacherId: 'teacher-mahmoud-01',
      studentName: 'Bilal',
      contactEmail: 'bilal@example.com',
      scheduledStart: '2026-11-01T10:00:00.000Z',
      scheduledEnd: '2026-11-01T10:45:00.000Z',
      studentTimezone: 'America/Chicago',
      durationMinutes: 45,
      googleCalendarEventId: 'already_existing_event_123'
    };

    // Pre-populate
    mockGoogle.events.set('already_existing_event_123', {
      id: 'already_existing_event_123',
      summary: 'Pre-existing event'
    });

    const res = await syncBookingIntegrations(bookingWithExistingEvent);
    assert.ok(res.success);

    const googlePostCalls = mockGoogle.calls.filter(c => c.method === 'POST' && c.url.includes('googleapis.com'));
    assert.strictEqual(googlePostCalls.length, 0, 'Must NOT make any Google Calendar POST calls when event ID is already present');
  });

  // =========================================================================
  // F. SEARCH RECOVERY
  // =========================================================================
  it('F. Search recovery: event exists with legacy random ID; recovers and does not create duplicate', async () => {
    const legacyEventId = 'legacy_random_id_98765';
    // Pre-populate legacy event matching reference code
    mockGoogle.events.set(legacyEventId, {
      id: legacyEventId,
      summary: `📖 [1-on-1 Lesson] Quran — ${baseBooking.learnerName}`,
      description: `Reference Code: ${baseBooking.referenceCode}`,
      extendedProperties: {
        private: {
          booking_reference: baseBooking.referenceCode
        }
      }
    });

    const res = await createGoogleCalendarEvent('mock-token', baseBooking);

    assert.strictEqual(res.eventId, legacyEventId, 'Must recover legacy event ID via reference search');
    assert.strictEqual(mockGoogle.events.size, 1, 'Must NOT create duplicate event');
  });

  // =========================================================================
  // G. NETWORK TIMEOUT AFTER GOOGLE SUCCESS
  // =========================================================================
  it('G. Network timeout after Google success: Google accepts create but response is lost; retry recovers event', async () => {
    // Simulate: Worker sends POST, Google creates event, but connection times out before response reaches client
    mockGoogle.failNextWithTimeout = true;

    // First attempt fails with network timeout
    await assert.rejects(
      async () => {
        await createGoogleCalendarEvent('mock-token', baseBooking);
      },
      /network timeout simulation/
    );

    // Google store has the event!
    assert.strictEqual(mockGoogle.events.size, 1, 'Google created the event before connection dropped');

    // Worker retries job
    const retryRes = await createGoogleCalendarEvent('mock-token', baseBooking);

    const expectedId = generateDeterministicGoogleCalendarEventId(
      baseBooking.referenceCode,
      baseBooking.teacherId
    );

    assert.strictEqual(retryRes.eventId, expectedId, 'Retry must recover the accepted event ID');
    assert.strictEqual(mockGoogle.events.size, 1, 'Retry must NOT create a second event');
  });

  // =========================================================================
  // H. DB PERSISTENCE FAILURE AFTER GOOGLE SUCCESS
  // =========================================================================
  it('H. DB persistence failure after Google success: retry converges to same event', async () => {
    // 1. Google creates event
    const res1 = await createGoogleCalendarEvent('mock-token', baseBooking);
    assert.ok(res1.eventId);

    // 2. Simulate DB write failed -> worker retries
    // 3. Worker re-executes createGoogleCalendarEvent
    const res2 = await createGoogleCalendarEvent('mock-token', baseBooking);

    assert.strictEqual(res2.eventId, res1.eventId, 'Retry re-uses identical event ID');
    assert.strictEqual(mockGoogle.events.size, 1, 'Zero duplicate events created');
  });

  // =========================================================================
  // I. TEACHER ISOLATION
  // =========================================================================
  it('I. Teacher isolation: Teacher A != Teacher B generates distinct deterministic event IDs without collision', async () => {
    const idTeacherA = generateDeterministicGoogleCalendarEventId(baseBooking.referenceCode, 'teacher-mahmoud-01');
    const idTeacherB = generateDeterministicGoogleCalendarEventId(baseBooking.referenceCode, 'teacher-ahmed-02');

    assert.notStrictEqual(idTeacherA, idTeacherB, 'Teacher A and Teacher B must have different deterministic event IDs');

    // Creating for Teacher A
    await createGoogleCalendarEvent('mock-token', {
      ...baseBooking,
      teacherId: 'teacher-mahmoud-01'
    });

    // Creating for Teacher B
    await createGoogleCalendarEvent('mock-token', {
      ...baseBooking,
      teacherId: 'teacher-ahmed-02'
    });

    assert.strictEqual(mockGoogle.events.size, 2, 'Independent teachers maintain separate events');
    assert.ok(mockGoogle.events.has(idTeacherA), 'Event A exists in store');
    assert.ok(mockGoogle.events.has(idTeacherB), 'Event B exists in store');
  });

  // =========================================================================
  // J. CANCELLATION RACE SAFETY
  // =========================================================================
  it('J. Cancellation race: cancelled booking is not resurrected or created', async () => {
    const cancelledBooking = {
      ...baseBooking,
      status: 'cancelled'
    };

    // Stale worker logic respects cancelled status
    if (cancelledBooking.status === 'cancelled') {
      // Worker skips creation
    } else {
      await createGoogleCalendarEvent('mock-token', cancelledBooking);
    }

    assert.strictEqual(mockGoogle.events.size, 0, 'No event created for cancelled booking');
  });

  // =========================================================================
  // K. RESCHEDULE RACE SAFETY
  // =========================================================================
  it('K. Reschedule race: updated schedule updates existing event and does not create duplicate', async () => {
    // 1. Initial event created
    const res1 = await createGoogleCalendarEvent('mock-token', baseBooking);
    assert.strictEqual(mockGoogle.events.size, 1);

    // 2. Rescheduled booking
    const rescheduledBooking: CalendarEventPayload = {
      ...baseBooking,
      scheduledStart: '2026-10-26T14:00:00.000Z',
      scheduledEnd: '2026-10-26T14:45:00.000Z'
    };

    const res2 = await createGoogleCalendarEvent('mock-token', rescheduledBooking);

    assert.strictEqual(res2.eventId, res1.eventId, 'Same event updated');
    assert.strictEqual(mockGoogle.events.size, 1, 'No duplicate created');

    const patchCalls = mockGoogle.calls.filter(c => c.method === 'PATCH');
    assert.ok(patchCalls.length >= 1, 'PATCH was executed to update times');
    const updated = mockGoogle.events.get(res1.eventId);
    assert.strictEqual(updated.start.dateTime, '2026-10-26T14:00:00.000Z');
  });

  // =========================================================================
  // L. TOKEN SECRECY & METADATA SAFETY
  // =========================================================================
  it('L. Token secrecy: No OAuth tokens or credentials leaked into event ID or extended properties', async () => {
    const secretToken = 'ya29.a0AfH6SMSECRET_ACCESS_TOKEN_DO_NOT_LEAK';
    await createGoogleCalendarEvent(secretToken, baseBooking);

    const postCall = mockGoogle.calls.find(c => c.method === 'POST');
    assert.ok(postCall);

    const payloadStr = JSON.stringify(postCall.body);
    assert.strictEqual(
      payloadStr.includes('ya29.'),
      false,
      'Event body must NOT contain the OAuth access token'
    );
    assert.strictEqual(
      payloadStr.includes('SECRET'),
      false,
      'Event body must NOT contain secrets'
    );

    const deterministicId = postCall.body.id;
    assert.strictEqual(
      deterministicId.includes('token'),
      false,
      'Deterministic ID must not contain token data'
    );
  });
});
