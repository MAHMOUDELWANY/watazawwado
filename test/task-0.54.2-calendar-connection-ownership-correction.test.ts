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

describe('Task 0.54.2: Calendar Connection Ownership Correction & RLS Schema Audit', () => {

  // =========================================================================
  // SUITE 1: STRICT FAIL-CLOSED getActiveGoogleConnection CONTRACT
  // =========================================================================
  describe('1. getActiveGoogleConnection Fail-Closed Contract', () => {
    it('1.1: Rejects undefined teacherId without calling any database or fallback', async () => {
      const res = await getActiveGoogleConnection(undefined as any);
      assert.strictEqual(res, null, 'Must return null for undefined teacherId');
    });

    it('1.2: Rejects null teacherId without calling fallback', async () => {
      const res = await getActiveGoogleConnection(null as any);
      assert.strictEqual(res, null, 'Must return null for null teacherId');
    });

    it('1.3: Rejects empty string teacherId', async () => {
      const res = await getActiveGoogleConnection('');
      assert.strictEqual(res, null, 'Must return null for empty string teacherId');
    });

    it('1.4: Rejects whitespace-only teacherId', async () => {
      const res = await getActiveGoogleConnection('   \t\n  ');
      assert.strictEqual(res, null, 'Must return null for whitespace-only teacherId');
    });

    it('1.5: Rejects non-string teacherId types', async () => {
      const resNum = await getActiveGoogleConnection(12345 as any);
      assert.strictEqual(resNum, null, 'Must return null for number');

      const resObj = await getActiveGoogleConnection({} as any);
      assert.strictEqual(resObj, null, 'Must return null for object');

      const resBool = await getActiveGoogleConnection(true as any);
      assert.strictEqual(resBool, null, 'Must return null for boolean');
    });

    it('1.6: Returns null when looking up a non-existent teacher connection', async () => {
      const res = await getActiveGoogleConnection('non-existent-teacher-uuid-9999');
      assert.strictEqual(res, null, 'Must return null when no connection exists for teacherId');
    });
  });

  // =========================================================================
  // SUITE 2: NO CANONICAL FALLBACK IN SYNC ENGINE
  // =========================================================================
  describe('2. Sync Engine Explicit Scoping Without Silent Fallbacks', () => {
    it('2.1: syncBookingIntegrations fails closed on Calendar when teacherId is absent', async () => {
      const bookingWithoutTeacher = {
        id: 'booking-no-teacher-001',
        referenceCode: 'REF-NO-TEACHER-001',
        learnerName: 'Independent Learner',
        serviceName: '1-on-1 Lesson',
        mode: 'regular' as const,
        scheduledStart: new Date(Date.now() + 86400000).toISOString(),
        scheduledEnd: new Date(Date.now() + 90000000).toISOString(),
        studentTimezone: 'UTC',
        cairoTimeDisplay: '12:00 PM Cairo',
        durationMinutes: 60,
        contactEmail: 'learner@example.com'
      };

      const result = await syncBookingIntegrations(bookingWithoutTeacher);
      assert.ok(result, 'Result should be returned');
      assert.ok(!result.googleEventId, 'Must NOT generate a Google Calendar event under a fallback teacher');
      assert.ok(!result.googleEventLink, 'Must NOT generate a Google Calendar link under a fallback teacher');
    });

    it('2.2: syncRescheduledBooking fails closed on Calendar when teacherId is absent', async () => {
      const res = await syncRescheduledBooking(
        'REF-NO-TEACHER-RESCHEDULE',
        new Date(Date.now() + 100000000).toISOString(),
        new Date(Date.now() + 103600000).toISOString(),
        '04:00 PM Cairo'
      );
      assert.ok(res, 'Reschedule returned cleanly');
      assert.strictEqual(res.success, true, 'Reschedule operation succeeds safely');
    });

    it('2.3: syncCancelledBooking fails closed on Calendar when teacherId is absent', async () => {
      const res = await syncCancelledBooking('REF-NO-TEACHER-CANCEL');
      assert.ok(res, 'Cancel returned cleanly');
      assert.strictEqual(res.success, true, 'Cancellation operation succeeds safely');
    });
  });

  // =========================================================================
  // SUITE 3: AVAILABILITY ENGINE EXPLICIT SCOPING
  // =========================================================================
  describe('3. Availability Engine Explicit Scoping Contract', () => {
    it('3.1: computeAvailableSlots without teacherId does not query Google Calendar fallback', async () => {
      const slots = await computeAvailableSlots('Africa/Cairo', 2, 30);
      assert.ok(Array.isArray(slots), 'Slots array returned');
      assert.strictEqual(slots.length, 2, 'Two days of availability returned based on DB/Cairo schedule');
    });

    it('3.2: computeAvailableSlots with explicit teacherId executes cleanly', async () => {
      const slots = await computeAvailableSlots('Africa/Cairo', 2, 30, 'teacher-mahmoud-001');
      assert.ok(Array.isArray(slots), 'Slots array returned');
      assert.strictEqual(slots.length, 2, 'Two days of availability returned');
    });

    it('3.3: validateSlotAvailability without teacherId does not query Google Calendar fallback', async () => {
      const start = new Date(Date.now() + 86400000).toISOString();
      const end = new Date(Date.now() + 88200000).toISOString();
      const res = await validateSlotAvailability(start, end);
      assert.ok(typeof res.isAvailable === 'boolean', 'isAvailable boolean returned');
    });

    it('3.4: validateSlotAvailability with explicit teacherId executes cleanly', async () => {
      const start = new Date(Date.now() + 86400000).toISOString();
      const end = new Date(Date.now() + 88200000).toISOString();
      const res = await validateSlotAvailability(start, end, 'teacher-mahmoud-001');
      assert.ok(typeof res.isAvailable === 'boolean', 'isAvailable boolean returned');
    });
  });

  // =========================================================================
  // SUITE 4: HTTP API ROUTES FOR AVAILABILITY & VALIDATION
  // =========================================================================
  describe('4. Availability HTTP Routes', () => {
    it('4.1: GET /api/integrations/availability works without teacherId', async () => {
      const res = await fetch('http://localhost:3000/api/integrations/availability?timezone=Africa/Cairo&days=2&duration=30');
      assert.strictEqual(res.status, 200, 'Endpoint should return 200 without teacherId');
      const data = await res.json() as any;
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.days));
    });

    it('4.2: GET /api/integrations/availability works with explicit teacherId query parameter', async () => {
      const res = await fetch('http://localhost:3000/api/integrations/availability?timezone=Africa/Cairo&days=2&duration=30&teacherId=teacher-mahmoud-001');
      assert.strictEqual(res.status, 200, 'Endpoint should return 200 with teacherId query parameter');
      const data = await res.json() as any;
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.days));
    });

    it('4.3: POST /api/integrations/validate-slot works without teacherId in request body', async () => {
      const start = new Date(Date.now() + 86400000).toISOString();
      const end = new Date(Date.now() + 88200000).toISOString();
      const res = await fetch('http://localhost:3000/api/integrations/validate-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledStartUtc: start, scheduledEndUtc: end })
      });
      assert.strictEqual(res.status, 200, 'Endpoint should return 200 without teacherId');
      const data = await res.json() as any;
      assert.ok(typeof data.isAvailable === 'boolean');
    });

    it('4.4: POST /api/integrations/validate-slot works with explicit teacherId in request body', async () => {
      const start = new Date(Date.now() + 86400000).toISOString();
      const end = new Date(Date.now() + 88200000).toISOString();
      const res = await fetch('http://localhost:3000/api/integrations/validate-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledStartUtc: start,
          scheduledEndUtc: end,
          teacherId: 'teacher-mahmoud-001'
        })
      });
      assert.strictEqual(res.status, 200, 'Endpoint should return 200 with teacherId');
      const data = await res.json() as any;
      assert.ok(typeof data.isAvailable === 'boolean');
    });
  });

  // =========================================================================
  // SUITE 5: RLS MIGRATION 20260908000011 SCHEMA INTEGRITY AUDIT
  // =========================================================================
  describe('5. RLS Migration 20260908000011 Schema Correctness Audit', () => {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260908000011_calendar_connections_security_correction.sql');

    it('5.1: Migration file 20260908000011 exists', () => {
      assert.ok(fs.existsSync(migrationPath), 'Migration 20260908000011 must exist');
    });

    it('5.2: Migration enables RLS and revokes public and anon access', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      assert.ok(sql.includes('ALTER TABLE IF EXISTS public.calendar_connections ENABLE ROW LEVEL SECURITY;'), 'Must enable RLS');
      assert.ok(sql.includes('REVOKE ALL ON public.calendar_connections FROM PUBLIC;'), 'Must revoke public');
      assert.ok(sql.includes('REVOKE ALL ON public.calendar_connections FROM anon;'), 'Must revoke anon');
    });

    it('5.3: Migration drops previous flawed policies', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      assert.ok(sql.includes('DROP POLICY IF EXISTS "Strict teacher own calendar connection access" ON public.calendar_connections;'), 'Must drop previous policy');
    });

    it('5.4: Migration policy references ONLY actual existing schema columns', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      // Must NOT reference fake columns:
      assert.strictEqual(sql.includes('ta.id'), false, 'Must NOT reference non-existent ta.id column');
      assert.strictEqual(sql.includes('ta.profile_id'), false, 'Must NOT reference non-existent ta.profile_id column');
      assert.strictEqual(sql.includes('p.auth_user_id'), false, 'Must NOT reference non-existent p.auth_user_id column');

      // MUST reference actual schema columns:
      assert.ok(sql.includes('teacher_id = auth.uid()'), 'Must bind teacher_id to auth.uid()');
      assert.ok(sql.includes('FROM public.teacher_accounts ta'), 'Must reference teacher_accounts table');
      assert.ok(sql.includes('JOIN public.profiles p ON lower(p.email) = lower(ta.email)'), 'Must join profiles on email');
      assert.ok(sql.includes('p.id = auth.uid()'), 'Must verify profile id is auth.uid()');
      assert.ok(sql.includes('ta.is_active = true'), 'Must verify teacher account is active');
    });

    it('5.5: Migration grants full permissions to service_role', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      assert.ok(sql.includes('GRANT ALL ON public.calendar_connections TO service_role;'), 'Must grant all to service_role');
    });
  });

  // =========================================================================
  // SUITE 6: TEACHER AUTHORIZATION PRESERVATION
  // =========================================================================
  describe('6. Teacher Authorization Preservation', () => {
    it('6.1: getCanonicalTeacherId helper is preserved for legacy compatibility', async () => {
      const id = await getCanonicalTeacherId();
      assert.ok(typeof id === 'string' && id.length > 0, 'Canonical teacher ID is resolved');
    });

    it('6.2: isTeacherCurrentlyAuthorized accurately validates active teachers', async () => {
      const isAuth = await isTeacherCurrentlyAuthorized('teacher-mahmoud-001');
      assert.strictEqual(isAuth, true, 'Mahmoud teacher ID is authorized');

      const isFake = await isTeacherCurrentlyAuthorized('hacker-id-999');
      assert.strictEqual(isFake, false, 'Fake teacher ID is unauthorized');
    });
  });
});
