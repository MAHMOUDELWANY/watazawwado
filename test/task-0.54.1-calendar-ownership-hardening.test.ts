import assert from 'node:assert';
import { describe, it } from 'node:test';
import crypto from 'crypto';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import {
  getActiveGoogleConnection,
  getCanonicalTeacherId,
  isTeacherCurrentlyAuthorized,
  syncBookingIntegrations,
  syncRescheduledBooking,
  syncCancelledBooking
} from '../server/integrations/syncEngine.js';
import {
  computeAvailableSlots,
  validateSlotAvailability
} from '../server/integrations/availabilityEngine.js';

describe('Task 0.54.1: Google Calendar Teacher Ownership & Security Hardening Gate', () => {

  // A. AUTH-URL SIGNING & TEACHER EMBEDDING
  it('A1: /auth-url should embed teacher identity into HMAC-signed state and set HttpOnly cookie', async () => {
    const res = await fetch('http://localhost:3000/api/integrations/google-calendar/auth-url', {
      headers: {
        'Authorization': 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(res.status, 200, 'auth-url should return 200 for authorized teacher');
    const data = await res.json() as any;
    assert.ok(data.authUrl, 'Missing authUrl');
    
    const cookies = res.headers.get('set-cookie');
    assert.ok(cookies && cookies.includes('oauth_state='), 'Missing oauth_state cookie');
    const match = cookies.match(/oauth_state=([^;]+)/);
    const state = match ? match[1] : '';
    assert.ok(state.includes('.'), 'State should be signed and contain a dot delimiter');

    const [b64Payload, signature] = state.split('.');
    const payload = Buffer.from(b64Payload, 'base64').toString('utf8');
    assert.ok(payload.includes(':'), 'Payload should contain teacherId:nonce');
    assert.ok(payload.startsWith('teacher-mahmoud-001:'), 'State should bind strictly to the authorized teacher ID');
  });

  // B. CALLBACK CSRF & SIGNATURE VERIFICATION
  it('B1: Callback should reject missing state with 403 CSRF error', async () => {
    const res = await fetch('http://localhost:3000/api/integrations/google-calendar/callback?code=testcode');
    assert.strictEqual(res.status, 403, 'Should reject missing state');
  });

  it('B2: Callback should reject mismatched state (CSRF cookie mismatch)', async () => {
    const res = await fetch('http://localhost:3000/api/integrations/google-calendar/callback?code=testcode&state=fake.state', {
      headers: {
        'Cookie': 'oauth_state=other.state'
      }
    });
    assert.strictEqual(res.status, 403, 'Should reject mismatched state');
  });

  it('B3: Callback should reject forged state signature', async () => {
    const teacherId = 'teacher-mahmoud-001';
    const nonce = 'randomnonce123';
    const payload = `${teacherId}:${nonce}`;
    const state = `${Buffer.from(payload).toString('base64')}.invalidsignaturexyz`;
    const res = await fetch(`http://localhost:3000/api/integrations/google-calendar/callback?code=testcode&state=${state}`, {
      headers: {
        'Cookie': `oauth_state=${state}`
      }
    });
    assert.strictEqual(res.status, 403, 'Should reject invalid signature');
  });

  // C. CALLBACK AUTHORIZATION RE-CHECK
  it('C1: Callback should reject valid signature if teacher is not in allowlist / unauthorized', async () => {
    const unauthorizedTeacherId = 'unauthorized-intruder-999';
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = `${unauthorizedTeacherId}:${nonce}`;
    const hmac = crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret');
    hmac.update(payload);
    const signature = hmac.digest('hex');
    const state = `${Buffer.from(payload).toString('base64')}.${signature}`;

    const res = await fetch(`http://localhost:3000/api/integrations/google-calendar/callback?code=testcode&state=${state}`, {
      headers: {
        'Cookie': `oauth_state=${state}`
      }
    });
    assert.strictEqual(res.status, 403, 'Callback must recheck teacher authorization and reject unauthorized ID');
    const text = await res.text();
    assert.ok(text.includes('Unauthorized') || text.includes('not authorized'), 'Error message should indicate authorization failure');
  });

  // D. STATE OVERRIDE ATTACK
  it('D1: Query parameter teacher_id must NOT override the verified state payload identity', async () => {
    // Attempting to pass ?teacher_id=victim-teacher while state is signed for unauthorized
    const unauthorizedTeacherId = 'attacker-teacher-001';
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = `${unauthorizedTeacherId}:${nonce}`;
    const hmac = crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret');
    hmac.update(payload);
    const signature = hmac.digest('hex');
    const state = `${Buffer.from(payload).toString('base64')}.${signature}`;

    const res = await fetch(`http://localhost:3000/api/integrations/google-calendar/callback?code=testcode&state=${state}&teacher_id=teacher-mahmoud-001`, {
      headers: {
        'Cookie': `oauth_state=${state}`
      }
    });
    assert.strictEqual(res.status, 403, 'Should evaluate teacher identity exclusively from the signed state, ignoring query params');
  });

  // E. FAIL-CLOSED CONNECTION LOOKUP (NO GLOBAL FALLBACK)
  it('E1: getActiveGoogleConnection must return null (fail closed) when teacherId is missing or empty', async () => {
    const resUndefined = await getActiveGoogleConnection(undefined);
    assert.strictEqual(resUndefined, null, 'Undefined teacherId must return null (no global fallback)');

    const resEmpty = await getActiveGoogleConnection('');
    assert.strictEqual(resEmpty, null, 'Empty teacherId must return null');

    const resSpaces = await getActiveGoogleConnection('   ');
    assert.strictEqual(resSpaces, null, 'Whitespace teacherId must return null');

    const resNull = await getActiveGoogleConnection(null as any);
    assert.strictEqual(resNull, null, 'Null teacherId must return null');
  });

  // F. HELPER: isTeacherCurrentlyAuthorized
  it('F1: isTeacherCurrentlyAuthorized should correctly identify authorized vs unauthorized accounts', async () => {
    const isMahmoudAuth = await isTeacherCurrentlyAuthorized('teacher-mahmoud-001');
    assert.strictEqual(isMahmoudAuth, true, 'teacher-mahmoud-001 should be authorized');

    const isFakeAuth = await isTeacherCurrentlyAuthorized('non-existent-teacher-99999');
    assert.strictEqual(isFakeAuth, false, 'Non-existent teacher must be unauthorized');

    const isNullAuth = await isTeacherCurrentlyAuthorized('');
    assert.strictEqual(isNullAuth, false, 'Empty teacher must be unauthorized');
  });

  // G. TEACHER SCOPING IN INTEGRATION OPERATIONS
  it('G1: getCanonicalTeacherId should resolve canonical authorized teacher identity', async () => {
    const canonicalId = await getCanonicalTeacherId();
    assert.ok(canonicalId, 'Should resolve canonical teacher ID');
    assert.strictEqual(typeof canonicalId, 'string');
  });

  it('G2: syncBookingIntegrations should cleanly handle booking without crashing when calendar is scoped', async () => {
    const dummyBooking = {
      id: 'test-booking-dummy-123',
      referenceCode: 'TEST-REF-GCAL-001',
      learnerName: 'Test Student',
      serviceName: '1-on-1 Lesson',
      mode: 'regular' as const,
      scheduledStart: new Date(Date.now() + 86400000).toISOString(),
      scheduledEnd: new Date(Date.now() + 90000000).toISOString(),
      studentTimezone: 'America/New_York',
      cairoTimeDisplay: '02:00 PM Cairo',
      durationMinutes: 60,
      contactEmail: 'test@example.com'
    };

    const syncRes = await syncBookingIntegrations(dummyBooking);
    assert.ok(syncRes, 'syncBookingIntegrations returned a result');
    assert.ok(syncRes.zoomMeetingLink || syncRes.zoomMeetingId, 'Zoom link provisioned');
  });

  it('G3: Availability engine functions should support optional teacherId parameter without failure', async () => {
    const days = await computeAvailableSlots('America/New_York', 3, 30, 'teacher-mahmoud-001');
    assert.ok(Array.isArray(days), 'Days should be an array');
    assert.strictEqual(days.length, 3, 'Should return 3 days of availability');

    const futureStart = new Date(Date.now() + 172800000).toISOString();
    const futureEnd = new Date(Date.now() + 174600000).toISOString();
    const valRes = await validateSlotAvailability(futureStart, futureEnd, 'teacher-mahmoud-001');
    assert.ok(typeof valRes.isAvailable === 'boolean', 'Slot availability result returned');
  });

  // H. TOKEN SECRECY & STATUS ENDPOINT SCOPING
  it('H1: /api/integrations/status must never leak OAuth access_token or refresh_token in response payload', async () => {
    const res = await fetch('http://localhost:3000/api/integrations/status', {
      headers: {
        'Authorization': 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.ok(data.googleCalendar, 'Missing googleCalendar section in status');
    assert.strictEqual((data.googleCalendar as any).access_token, undefined, 'Must NEVER return access_token');
    assert.strictEqual((data.googleCalendar as any).refreshToken, undefined, 'Must NEVER return refreshToken');
    assert.strictEqual((data.googleCalendar as any).refresh_token, undefined, 'Must NEVER return refresh_token');
    assert.strictEqual((data.googleCalendar as any).metadata, undefined, 'Must NEVER return metadata object');
  });

  // I. DISCONNECT ENDPOINT SCOPING
  it('I1: /api/integrations/google-calendar/disconnect should require teacher authentication', async () => {
    const unauthRes = await fetch('http://localhost:3000/api/integrations/google-calendar/disconnect', {
      method: 'POST'
    });
    assert.strictEqual(unauthRes.status, 401, 'Disconnect must require authentication');

    const authRes = await fetch('http://localhost:3000/api/integrations/google-calendar/disconnect', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(authRes.status, 200, 'Disconnect should succeed for authenticated teacher');
    const authData = await authRes.json() as any;
    assert.strictEqual(authData.success, true);
  });

  // J. MIGRATION FILE VERIFICATION
  it('J1: SQL migration for calendar_connections hardening must exist with proper RLS policies', () => {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260908000010_calendar_connections_security_hardening.sql');
    assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'), 'Migration must enable RLS');
    assert.ok(sql.includes('REVOKE ALL ON public.calendar_connections FROM PUBLIC'), 'Must revoke public permissions');
    assert.ok(sql.includes('REVOKE ALL ON public.calendar_connections FROM anon'), 'Must revoke anon permissions');
    assert.ok(sql.includes('Strict teacher own calendar connection access'), 'Must enforce teacher-owned access policy');
  });
});
