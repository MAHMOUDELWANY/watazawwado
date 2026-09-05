/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — AUTOMATED EMAIL SERVICE TESTS
 * File: test/emailService.test.ts
 * Role: Comprehensive unit & integration tests for Brevo Email Service,
 *       Template Escaping, and Notification Dispatcher.
 * ====================================================================
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  sendEmail,
  getEmailConfigStatus,
  OFFICIAL_TEACHER_EMAIL,
  DEFAULT_TEACHER_EMAIL
} from '../api/notifications/emailService.js';
import {
  escapeHtml,
  sanitizeUrl,
  renderStudentBookingConfirmation,
  renderStudentTrialConfirmation,
  renderStudentPaymentConfirmed,
  renderTeacherNotification
} from '../api/notifications/emailTemplates.js';
import {
  dispatchNotification,
  clearIdempotencyCache,
  buildIdempotencyKey
} from '../api/notifications/dispatcher.js';

describe('Brevo Email Service Tests', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    clearIdempotencyCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
  });

  // TEST A: Successful Brevo API Delivery
  it('Test A: should successfully format and send transactional email via Brevo HTTP API', async () => {
    process.env.BREVO_API_KEY = 'xkeysib-mock-test-key-123456789';
    process.env.NOTIFICATION_FROM_EMAIL = 'mahmoudelwany98@gmail.com';
    process.env.NOTIFICATION_FROM_NAME = 'Mahmoud Elwany';
    process.env.NOTIFICATION_TEACHER_EMAIL = 'mahmoudelwany98@gmail.com';
    process.env.NODE_ENV = 'production';

    let capturedUrl = '';
    let capturedOptions: any = null;

    globalThis.fetch = (async (url: string, options: any) => {
      capturedUrl = url;
      capturedOptions = options;
      return new Response(JSON.stringify({ messageId: '<mock-brevo-msg-id-999@smtp-relay.mailin.fr>' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }) as any;

    const result = await sendEmail({
      to: 'student@example.com',
      toName: 'Zayd Ahmad',
      subject: 'Lesson Confirmed',
      html: '<p>Welcome Zayd</p>',
      text: 'Welcome Zayd'
    });

    // Assert fetch call
    assert.equal(capturedUrl, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(capturedOptions.method, 'POST');
    assert.equal(capturedOptions.headers['api-key'], 'xkeysib-mock-test-key-123456789');
    assert.equal(capturedOptions.headers['content-type'], 'application/json');

    const parsedBody = JSON.parse(capturedOptions.body);
    assert.equal(parsedBody.sender.email, 'mahmoudelwany98@gmail.com');
    assert.equal(parsedBody.sender.name, 'Mahmoud Elwany');
    assert.equal(parsedBody.to[0].email, 'student@example.com');
    assert.equal(parsedBody.to[0].name, 'Zayd Ahmad');
    assert.equal(parsedBody.subject, 'Lesson Confirmed');
    assert.equal(parsedBody.htmlContent, '<p>Welcome Zayd</p>');
    assert.equal(parsedBody.textContent, 'Welcome Zayd');

    // Assert result
    assert.equal(result.success, true);
    assert.equal(result.status, 'sent');
    assert.equal(result.provider, 'brevo');
    assert.equal(result.messageId, '<mock-brevo-msg-id-999@smtp-relay.mailin.fr>');
  });

  // TEST B: Brevo API Failure & Error Masking
  it('Test B: should gracefully handle Brevo API failure and mask sensitive server secrets', async () => {
    process.env.BREVO_API_KEY = 'xkeysib-secret-internal-key';
    process.env.NODE_ENV = 'production';

    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          code: 'unauthorized',
          message: 'Key xkeysib-secret-internal-key is invalid or expired.'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    const result = await sendEmail({
      to: 'student@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      text: 'Hello'
    });

    assert.equal(result.success, false);
    assert.equal(result.status, 'failed');
    assert.equal(result.provider, 'brevo');
    // Ensure the sensitive API key is NOT leaked in the returned error string
    assert.ok(result.error);
    assert.ok(!result.error.includes('xkeysib-secret-internal-key'));
  });

  // TEST C: Unconfigured Production Behavior
  it('Test C: should return unconfigured error in production when BREVO_API_KEY is missing (never fake sent)', async () => {
    delete process.env.BREVO_API_KEY;
    process.env.NODE_ENV = 'production';

    const status = getEmailConfigStatus();
    assert.equal(status.isConfigured, false);
    assert.equal(status.provider, 'unconfigured');

    const result = await sendEmail({
      to: 'student@example.com',
      subject: 'Production Unconfigured Test',
      html: '<p>Hello</p>',
      text: 'Hello'
    });

    assert.equal(result.success, false);
    assert.equal(result.status, 'unconfigured');
    assert.equal(result.provider, 'unconfigured');
    assert.equal(result.messageId, undefined);
  });

  // TEST D: HTML Escaping & Sanitization
  it('Test D: should strictly escape malicious XSS payloads in email templates', () => {
    const maliciousPayload = {
      learnerName: '<script>alert("xss")</script> Tariq',
      serviceName: 'Quran Recitation & Tajweed <img src=x onerror=alert(1)>',
      date: '2026-10-05',
      timeDisplay: '15:00',
      timezone: 'America/New_York',
      durationMinutes: 45,
      bookingRef: 'REF"><svg/onload=alert(1)>',
      zoomLink: 'javascript:alert(document.cookie)' // Should be stripped by sanitizeUrl
    };

    const rendered = renderStudentBookingConfirmation(maliciousPayload);

    // Assert that raw unescaped script tags are NOT present in HTML
    assert.ok(!rendered.html.includes('<script>alert("xss")</script>'));
    assert.ok(rendered.html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'));

    // Assert that malicious img onerror is escaped
    assert.ok(!rendered.html.includes('<img src=x onerror=alert(1)>'));
    assert.ok(rendered.html.includes('&lt;img src=x onerror=alert(1)&gt;'));

    // Assert that javascript: URLs are stripped
    assert.ok(!rendered.html.includes('javascript:alert'));

    // Assert helper directly
    assert.equal(escapeHtml('<div class="test">Hello & "Bye"</div>'), '&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;Bye&quot;&lt;/div&gt;');
    assert.equal(sanitizeUrl('https://zoom.us/j/123456789'), 'https://zoom.us/j/123456789');
    assert.equal(sanitizeUrl('javascript:alert(1)'), '');
  });

  // TEST E: Notification Dispatcher Integration & Idempotency
  it('Test E: should dispatch notifications and prevent duplicate sends via idempotency', async () => {
    process.env.BREVO_API_KEY = 'xkeysib-mock-key';
    process.env.NODE_ENV = 'production';
    process.env.VITE_SUPABASE_URL = 'https://mock-supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';

    let sendCallCount = 0;
    const memoryDb = new Map<string, any>();

    globalThis.fetch = (async (url: string | URL | globalThis.Request, options?: any) => {
      const urlStr = url.toString();
      
      // Mock Supabase notification_events interactions
      if (urlStr.includes('rpc/claim_notification_event')) {
        const body = options?.body ? JSON.parse(options.body) : null;
        const key = body.p_key;
        const current = memoryDb.get(key);
        if (!current || current.status === 'failed' || current.status === 'pending') {
          const token = `token-${Math.random()}`;
          memoryDb.set(key, { status: 'sending', claim_token: token });
          return new Response(JSON.stringify({ claimed: true, claim_token: token }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ claimed: false, claim_token: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (urlStr.includes('rpc/finalize_notification_event')) {
        const body = options?.body ? JSON.parse(options.body) : null;
        const key = body.p_key;
        const token = body.p_token;
        const status = body.p_status;
        const current = memoryDb.get(key);
        if (current && current.claim_token === token) {
          current.status = status;
          current.claim_token = null;
          return new Response(JSON.stringify(true), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify(false), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('notification_events') && options?.method === 'PATCH') {
        const match = urlStr.match(/idempotency_key=eq\.([^&]+)/);
        const k = match ? decodeURIComponent(match[1]) : null;
        if (k && memoryDb.has(k)) {
          const body = JSON.parse(options.body);
          Object.assign(memoryDb.get(k), body);
          return new Response(JSON.stringify([memoryDb.get(k)]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('notification_events')) {
        const method = options?.method || 'GET';
        const body = options?.body ? JSON.parse(options.body) : null;
        console.log('MOCK DB:', method, urlStr, body);
        
        if (method === 'POST') {
          // Check if insert or upsert
          const key = body.idempotency_key;
          if (memoryDb.has(key)) {
            console.log('MOCK DB: duplicate key', key);
            return new Response(JSON.stringify({ code: '23505', message: 'duplicate key' }), {
              status: 409,
              headers: { 'Content-Type': 'application/json' }
            });
          } else {
            console.log('MOCK DB: inserted key', key);
            memoryDb.set(key, body);
            return new Response(JSON.stringify([body]), { status: 201, headers: { 'Content-Type': 'application/json' } });
          }
        } else if (method === 'GET') {
          // Select single
          const match = urlStr.match(/idempotency_key=eq\.([^&]+)/);
          const key = match ? decodeURIComponent(match[1]) : null;
          console.log('MOCK DB: GET key', key);
          
          let isSingle = false;
          if (options?.headers) {
            if (typeof options.headers.get === 'function') {
              isSingle = (options.headers.get('accept') || '').includes('vnd.pgrst.object');
            } else {
              isSingle = (options.headers['Accept'] || options.headers['accept'] || '').includes('vnd.pgrst.object');
            }
          }
          
          if (key && memoryDb.has(key)) {
            const data = memoryDb.get(key);
            return new Response(JSON.stringify(isSingle ? data : [data]), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify(isSingle ? null : []), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else if (method === 'PATCH') {
          // Update
          const match = urlStr.match(/idempotency_key=eq\.([^&]+)/);
          const key = match ? decodeURIComponent(match[1]) : null;
          console.log('MOCK DB: PATCH key', key, body);
          if (key && memoryDb.has(key)) {
            const current = memoryDb.get(key);
            Object.assign(current, body);
            return new Response(JSON.stringify([current]), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
      
      // Mock Brevo interactions
      if (urlStr.includes('api.brevo.com')) {
        sendCallCount++;
        return new Response(JSON.stringify({ messageId: `msg-${sendCallCount}` }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({}), { status: 200 });
    }) as any;

    const payload: any = {
      eventType: 'TRIAL_BOOKED',
      booking: {
        referenceCode: 'IDEMP-TEST-001',
        serviceName: 'Tajweed Fundamentals',
        learnerName: 'Bilal Khan',
        contactEmail: 'bilal@example.com',
        date: '2026-11-12',
        timeDisplay: '17:00',
        timezone: 'Europe/London',
        durationMinutes: 30,
        zoomLink: 'https://zoom.us/j/999888777'
      }
    };

    // First dispatch -> Should send student email and teacher email (2 sends)
    const result1 = await dispatchNotification(payload);
    assert.equal(result1.success, true);
    assert.equal(result1.studentEmailSent, true);
    assert.equal(result1.teacherEmailSent, true);
    assert.equal(sendCallCount, 2);

    // Second dispatch with same payload -> Should be idempotently skipped
    const result2 = await dispatchNotification(payload);
    assert.equal(result2.success, true);
    assert.equal(result2.idempotentSkipped, true);
    assert.equal(sendCallCount, 2); // No additional network calls
  });

  it('Test F: should NOT mark notification as sent if email dispatch fails completely', async () => {
    process.env.BREVO_API_KEY = 'xkeysib-mock-key';
    process.env.NODE_ENV = 'production';
    process.env.VITE_SUPABASE_URL = 'https://mock-supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';

    const memoryDb = new Map<string, any>();
    
    // Simulate network outage on Brevo
    globalThis.fetch = (async (url: string | URL | globalThis.Request, options?: any) => {
      const urlStr = url.toString();
      
      if (urlStr.includes('rpc/claim_notification_event')) {
        const body = options?.body ? JSON.parse(options.body) : null;
        const key = body.p_key;
        const current = memoryDb.get(key);
        if (!current || current.status === 'failed' || current.status === 'pending') {
          const token = `token-${Math.random()}`;
          memoryDb.set(key, { status: 'sending', claim_token: token });
          return new Response(JSON.stringify({ claimed: true, claim_token: token }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ claimed: false, claim_token: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (urlStr.includes('rpc/finalize_notification_event')) {
        const body = options?.body ? JSON.parse(options.body) : null;
        const key = body.p_key;
        const token = body.p_token;
        const status = body.p_status;
        const current = memoryDb.get(key);
        if (current && current.claim_token === token) {
          current.status = status;
          current.claim_token = null;
          return new Response(JSON.stringify(true), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify(false), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('notification_events')) {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('api.brevo.com')) {
        return new Response(JSON.stringify({ message: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    }) as any;

    const payload: any = {
      eventType: 'BOOKING_CONFIRMED',
      booking: {
        referenceCode: 'FAIL-RETRY-001',
        serviceName: 'Quran Memorization',
        learnerName: 'Omar Farooq',
        contactEmail: 'omar@example.com',
        date: '2026-11-15',
        timeDisplay: '18:00',
        timezone: 'America/Toronto',
        durationMinutes: 60
      }
    };

    const failResult = await dispatchNotification(payload);
    assert.equal(failResult.success, false);
    assert.equal(failResult.studentEmailSent, false);

    // Assert that the record was marked as failed
    const key = buildIdempotencyKey(payload);
    assert.equal(memoryDb.get(key + ':student').status, 'failed');

    // Now restore network and re-attempt -> should NOT be blocked by idempotency
    globalThis.fetch = (async (url: string | URL | globalThis.Request, options?: any) => {
      const urlStr = url.toString();
      
      if (urlStr.includes('rpc/claim_notification_event')) {
        const body = options?.body ? JSON.parse(options.body) : null;
        const key = body.p_key;
        const current = memoryDb.get(key);
        if (!current || current.status === 'failed' || current.status === 'pending') {
          const token = `token-${Math.random()}`;
          memoryDb.set(key, { status: 'sending', claim_token: token });
          return new Response(JSON.stringify({ claimed: true, claim_token: token }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ claimed: false, claim_token: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (urlStr.includes('rpc/finalize_notification_event')) {
        const body = options?.body ? JSON.parse(options.body) : null;
        const key = body.p_key;
        const token = body.p_token;
        const status = body.p_status;
        const current = memoryDb.get(key);
        if (current && current.claim_token === token) {
          current.status = status;
          current.claim_token = null;
          return new Response(JSON.stringify(true), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify(false), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('notification_events')) {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('api.brevo.com')) {
        return new Response(JSON.stringify({ messageId: '<success-retry-789@example.com>' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    }) as any;

    const successResult = await dispatchNotification(payload);
    assert.equal(successResult.success, true);
    assert.equal(successResult.studentEmailSent, true);

    // Should now be marked sent
    assert.equal(memoryDb.get(key + ':student').status, 'sent');
  });
});
