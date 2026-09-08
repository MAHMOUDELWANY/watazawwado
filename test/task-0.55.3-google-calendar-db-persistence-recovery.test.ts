import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { syncBookingIntegrations } from '../server/integrations/syncEngine.js';
import { generateDeterministicGoogleCalendarEventId, CalendarEventPayload } from '../server/integrations/googleCalendar.js';

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

interface MockCall {
  method: string;
  url: string;
  body?: any;
  headers?: any;
  timestamp: number;
  status: number;
}

class MockGoogleCalendarServer {
  public events = new Map<string, MockEvent>();
  public calls: Array<MockCall> = [];
  public failNextWithTimeout = false;
  public nextGetStatus: number | null = null;
  public searchMiss = false;

  reset() {
    this.events.clear();
    this.calls = [];
    this.failNextWithTimeout = false;
    this.nextGetStatus = null;
    this.searchMiss = false;
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

    // 1. GET /events/{eventId}
    if (method === 'GET' && urlStr.includes('/events/') && !urlStr.includes('/events?')) {
      const eventId = decodeURIComponent(urlStr.split('/events/')[1].split('?')[0]);
      
      if (this.nextGetStatus !== null) {
        const status = this.nextGetStatus;
        this.nextGetStatus = null;
        if (status === 404) {
          const res = new Response(JSON.stringify({ error: { code: 404, message: 'Not Found' } }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
          this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 404 });
          return res;
        }
      }

      if (this.events.has(eventId)) {
        const res = new Response(JSON.stringify(this.events.get(eventId)), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 200 });
        return res;
      }
      const res = new Response(JSON.stringify({ error: { code: 404, message: 'Not Found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
      this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 404 });
      return res;
    }

    // 2. GET /events?q=... (search)
    if (method === 'GET' && urlStr.includes('/events?')) {
      if (this.searchMiss) {
        this.searchMiss = false;
        const res = new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 200 });
        return res;
      }

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
      const res = new Response(JSON.stringify({ items: matched }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 200 });
      return res;
    }

    // 3. POST /events (create)
    if (method === 'POST' && urlStr.includes('/events')) {
      if (this.failNextWithTimeout) {
        this.failNextWithTimeout = false;
        if (body?.id) {
          this.events.set(body.id, {
            ...body,
            htmlLink: `https://calendar.google.com/event?eid=${body.id}`,
            status: 'confirmed'
          });
        }
        this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 0 });
        throw new TypeError('fetch failed: network timeout simulation');
      }

      const eventId = body?.id || `random_${Date.now()}`;
      
      if (this.events.has(eventId)) {
        const res = new Response(
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
        this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 409 });
        return res;
      }

      const created: MockEvent = {
        ...body,
        id: eventId,
        htmlLink: `https://calendar.google.com/event?eid=${eventId}`,
        status: 'confirmed'
      };
      this.events.set(eventId, created);

      const res = new Response(JSON.stringify(created), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 200 });
      return res;
    }

    // 4. PATCH /events/{eventId}
    if (method === 'PATCH' && urlStr.includes('/events/')) {
      const eventId = decodeURIComponent(urlStr.split('/events/')[1].split('?')[0]);
      if (this.events.has(eventId)) {
        const existing = this.events.get(eventId);
        const updated = { ...existing, ...body };
        this.events.set(eventId, updated);
        const res = new Response(JSON.stringify(updated), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 200 });
        return res;
      }
      const res = new Response(JSON.stringify({ error: { code: 404, message: 'Not Found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
      this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 404 });
      return res;
    }

    const res = new Response(JSON.stringify({ ok: true }), { status: 200 });
    this.calls.push({ method, url: urlStr, body, headers, timestamp: Date.now(), status: 200 });
    return res;
  };
}

const mockGoogle = new MockGoogleCalendarServer();

describe('Task 0.55.3: Google Calendar DB Persistence Failure Recovery', () => {
  const originalFetch = globalThis.fetch;
  
  let dbState: any = null;
  let persistenceFailureCount = 0;

  beforeEach(() => {
    mockGoogle.reset();
    globalThis.fetch = mockGoogle.handleFetch as any;
    dbState = {
      zoom_meeting_id: null,
      zoom_meeting_link: null,
      google_calendar_event_id: null,
      sync_metadata: null
    };
    persistenceFailureCount = 0;

    // Hook to bypass DB connection check
    (globalThis as any).__TEST_GET_ACTIVE_GOOGLE_CONNECTION = (teacherId: string) => {
      return Promise.resolve({ accessToken: 'mock-token', accountEmail: 'test@example.com' });
    };

    // Hook to provide DB state
    (globalThis as any).__TEST_GET_BOOKING_DB_STATE = (referenceCode: string) => {
      return Promise.resolve(dbState);
    };

    // Hook to mock DB persistence and simulate failures
    (globalThis as any).__TEST_SYNC_DB_PERSISTENCE_HOOK = async (referenceCode: string, payload: any) => {
      if (persistenceFailureCount > 0) {
        persistenceFailureCount--;
        throw new Error('Simulated DB_PERSISTENCE_FAILURE: connection lost');
      }
      
      // Success: write to dbState
      if (payload.google_calendar_event_id !== undefined) {
        dbState.google_calendar_event_id = payload.google_calendar_event_id;
      }
      if (payload.zoom_meeting_id !== undefined) {
        dbState.zoom_meeting_id = payload.zoom_meeting_id;
      }
      if (payload.zoom_meeting_link !== undefined) {
        dbState.zoom_meeting_link = payload.zoom_meeting_link;
      }
      dbState.sync_metadata = payload.sync_metadata;
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mockGoogle.reset();
    
    delete (globalThis as any).__TEST_GET_ACTIVE_GOOGLE_CONNECTION;
    delete (globalThis as any).__TEST_GET_BOOKING_DB_STATE;
    delete (globalThis as any).__TEST_SYNC_DB_PERSISTENCE_HOOK;
  });

  const baseBooking = {
    referenceCode: 'WTZ-2026-TEST-DB',
    teacherId: 'teacher-mahmoud-01',
    learnerName: 'Zayd Al-Ansari',
    serviceName: 'Quran Tajweed & Reading',
    mode: 'trial',
    scheduledStart: '2026-10-25T10:00:00.000Z',
    scheduledEnd: '2026-10-25T10:45:00.000Z',
    studentTimezone: 'America/New_York',
    durationMinutes: 45,
    contactEmail: 'zayd@example.com'
  };

  it('1. 409 Conflict Path: Google POST #1 (200) -> DB fails -> Retry POST #2 (409) -> Deterministic GET recovers event -> DB succeeds', async () => {
    // Inject exactly 1 DB failure
    persistenceFailureCount = 1;
    
    // ATTEMPT 1: Worker executes sync
    const res1 = await syncBookingIntegrations(baseBooking);
    
    // Assert first attempt results
    assert.strictEqual(res1.success, false, 'Sync must fail because DB persistence failed');
    assert.strictEqual(res1.integrationStatus, 'failed', 'Integration status should be failed');
    assert.ok(res1.errors?.some((e: string) => e.includes('Simulated DB_PERSISTENCE_FAILURE')), 'Error array must include the DB persistence error');
    
    // Assert Google state: Event WAS created
    assert.strictEqual(mockGoogle.events.size, 1, 'Fake Google event count MUST be exactly 1 after first attempt');
    const expectedId = generateDeterministicGoogleCalendarEventId(baseBooking.referenceCode, baseBooking.teacherId);
    assert.ok(mockGoogle.events.has(expectedId), 'Event must exist with deterministic ID');
    
    // Assert DB state: Event ID was NOT persisted due to the failure
    assert.strictEqual(dbState.google_calendar_event_id, null, 'DB google_calendar_event_id MUST be null after first attempt failure');
    
    // Simulate read-replica cache miss / eventual consistency on the preemptive GET and search during retry
    mockGoogle.nextGetStatus = 404;
    mockGoogle.searchMiss = true;

    // ATTEMPT 2: Worker retries sync orchestration (since DB state has no google_calendar_event_id)
    const res2 = await syncBookingIntegrations(baseBooking);
    
    // Assert second attempt results
    assert.strictEqual(res2.success, true, 'Retry must succeed');
    assert.strictEqual(res2.integrationStatus, 'synced', 'Integration status should be synced');
    
    // Assert Google state: No duplicate was created
    assert.strictEqual(mockGoogle.events.size, 1, 'Fake Google event count MUST STILL be exactly 1 (no duplicate event created)');
    
    // Assert DB state: Event ID IS NOW persisted
    assert.strictEqual(dbState.google_calendar_event_id, expectedId, 'DB google_calendar_event_id MUST be deterministicEventId after retry success');
    
    // Verify API Calls & Statuses
    const postCalls = mockGoogle.calls.filter(c => c.method === 'POST' && c.url.includes('/events'));
    assert.strictEqual(postCalls.length, 2, 'Exactly TWO HTTP POST requests occur across both attempts (POST #1 creates, POST #2 encounters 409)');
    
    const postStatuses = postCalls.map(c => c.status);
    assert.deepStrictEqual(postStatuses, [200, 409], 'First POST returns HTTP 200, second POST returns HTTP 409 Conflict');

    // Verification of counts as mandated by specification
    const successfulCreations = postCalls.filter(c => c.status === 200).length;
    assert.strictEqual(successfulCreations, 1, 'Successful event creations MUST be exactly 1');

    const conflict409Count = postCalls.filter(c => c.status === 409).length;
    assert.strictEqual(conflict409Count, 1, '409 Conflict count MUST be exactly 1');

    assert.strictEqual(mockGoogle.events.size, 1, 'Final remote event count MUST be exactly 1');
  });

  it('2. Preemptive O(1) GET Path: Google POST #1 (200) -> DB fails -> Retry O(1) GET (200) -> Zero additional POSTs -> DB succeeds', async () => {
    // Inject exactly 1 DB failure
    persistenceFailureCount = 1;
    
    // ATTEMPT 1: Worker executes sync
    const res1 = await syncBookingIntegrations(baseBooking);
    assert.strictEqual(res1.success, false, 'Sync must fail because DB persistence failed');
    assert.strictEqual(mockGoogle.events.size, 1, 'Google Calendar event created on first attempt');
    assert.strictEqual(dbState.google_calendar_event_id, null, 'DB has no event ID recorded yet');
    
    const expectedId = generateDeterministicGoogleCalendarEventId(baseBooking.referenceCode, baseBooking.teacherId);

    // ATTEMPT 2: Worker retries sync with standard immediate read hit
    const res2 = await syncBookingIntegrations(baseBooking);
    assert.strictEqual(res2.success, true, 'Retry must succeed');
    assert.strictEqual(res2.integrationStatus, 'synced', 'Integration status should be synced');
    
    assert.strictEqual(mockGoogle.events.size, 1, 'Google store contains strictly 1 event');
    assert.strictEqual(dbState.google_calendar_event_id, expectedId, 'DB records the deterministic event ID');
    
    const postCalls = mockGoogle.calls.filter(c => c.method === 'POST' && c.url.includes('/events'));
    assert.strictEqual(postCalls.length, 1, 'Preemptive GET finds event, so only 1 POST request is executed across both attempts');
    assert.deepStrictEqual(postCalls.map(c => c.status), [200], 'Only the initial POST returned 200');

    const getCalls = mockGoogle.calls.filter(c => c.method === 'GET' && c.url.includes(expectedId) && !c.url.includes('events?'));
    assert.strictEqual(getCalls.length, 2, 'Two GET calls by ID: Attempt 1 lookup (404) and Attempt 2 recovery (200)');
  });
});
