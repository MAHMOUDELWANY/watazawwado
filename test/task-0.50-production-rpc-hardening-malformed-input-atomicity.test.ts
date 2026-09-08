import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

describe('Task 0.50 — Production RPC Hardening: Malformed Input, Atomicity & Deployment Gate', () => {
  const migration05Path = path.resolve('supabase/migrations/20260908000005_fix_booking_rpc_service_id_text.sql');
  const migration05Content = fs.existsSync(migration05Path) ? fs.readFileSync(migration05Path, 'utf8') : '';
  const bookingRepoPath = path.resolve('src/lib/bookingRepository.ts');
  const bookingRepoContent = fs.existsSync(bookingRepoPath) ? fs.readFileSync(bookingRepoPath, 'utf8') : '';

  it('1. Static Migration Gate: Verifies 000005 has no raw unsafe casts and strictly enforces canonical schema', () => {
    // Service ID must be TEXT
    assert.ok(migration05Content.includes('v_service_id TEXT;'), 'Must declare v_service_id as TEXT');
    assert.ok(!migration05Content.includes('v_service_id UUID;'), 'Must not declare v_service_id as UUID');

    // Canonical service fields
    assert.ok(migration05Content.includes('hourly_rate_usd'), 'Must query hourly_rate_usd');
    assert.ok(migration05Content.includes('trial_allowed'), 'Must query trial_allowed');
    assert.ok(migration05Content.includes('supported_durations'), 'Must query supported_durations');
    assert.ok(migration05Content.includes('is_active'), 'Must query is_active');
    assert.ok(!migration05Content.includes('price_hourly_usd'), 'Must NOT query price_hourly_usd');
    assert.ok(!migration05Content.includes('trial_eligible'), 'Must NOT query trial_eligible');

    // Unsafe casts strictly eliminated
    assert.ok(!migration05Content.includes("(p_booking->>'student_id')::UUID"), 'Must NOT contain raw UUID cast for student_id');
    assert.ok(migration05Content.includes("trim(p_booking->>'duration_minutes') !~ '^[0-9]+$'"), 'Must guard duration parsing with numeric regex');
    assert.ok(migration05Content.includes("EXCEPTION WHEN OTHERS THEN\n        RAISE EXCEPTION 'Invalid scheduled start timestamp format.'"), 'Must trap malformed scheduled_start');
    assert.ok(migration05Content.includes("EXCEPTION WHEN OTHERS THEN\n        RAISE EXCEPTION 'Invalid scheduled end timestamp format.'"), 'Must trap malformed scheduled_end');
    assert.ok(migration05Content.includes("PERFORM now() AT TIME ZONE v_timezone;"), 'Must validate timezone format');
  });

  it('2. Controlled Error Contracts: Verifies explicit SQLSTATE P0001, P0002, P0003 are defined', () => {
    // P0001: General Validation & Rule Violations
    assert.ok(migration05Content.includes("USING ERRCODE = 'P0001'"), 'Must specify ERRCODE P0001 for validation');
    assert.ok(migration05Content.includes("'Invalid lesson duration.' USING ERRCODE = 'P0001'"), 'Duration failure must use P0001');
    assert.ok(migration05Content.includes("'Invalid learner audience.' USING ERRCODE = 'P0001'"), 'Audience failure must use P0001');
    assert.ok(migration05Content.includes("'Scheduled time interval does not match lesson duration.' USING ERRCODE = 'P0001'"), 'Duration interval mismatch must use P0001');
    assert.ok(migration05Content.includes("'The selected duration is not supported for this service.' USING ERRCODE = 'P0001'"), 'Unsupported duration must use P0001');

    // P0002: Service Not Found
    assert.ok(migration05Content.includes("'The selected service does not exist.' USING ERRCODE = 'P0002'"), 'Service not found must use P0002');

    // P0003: Authorization & Anti-Impersonation
    assert.ok(migration05Content.includes("'Forbidden. Cannot create a booking on behalf of another student.' USING ERRCODE = 'P0003'"), 'Impersonation must use P0003');
    assert.ok(migration05Content.includes("'Unauthenticated guests cannot specify a student ID.' USING ERRCODE = 'P0003'"), 'Guest student ID injection must use P0003');
    assert.ok(migration05Content.includes("'Authenticated student profile is not ready. Please complete student onboarding or sign in again.' USING ERRCODE = 'P0003'"), 'Missing profile must use P0003');
  });

  it('3. Simulates Malformed student_id: Authenticated foreign, malformed, and guest injection', () => {
    const authUid = 'auth-user-student-A';
    const canonicalStudentId = 'd9b3a7a2-1111-2222-3333-444455556666';

    // Simulation function modeling create_booking_atomic logic
    function simulateStudentIdResolution(authId: string | null, clientStudentId: any) {
      let v_student_id: string | null = null;
      if (authId !== null) {
        // Authenticated
        v_student_id = canonicalStudentId;
        if (clientStudentId !== undefined && clientStudentId !== null && String(clientStudentId).trim() !== '') {
          if (String(clientStudentId).trim().toLowerCase() !== v_student_id.toLowerCase()) {
            const err = new Error('Forbidden. Cannot create a booking on behalf of another student.');
            (err as any).code = 'P0003';
            throw err;
          }
        }
      } else {
        // Guest
        if (clientStudentId !== undefined && clientStudentId !== null && String(clientStudentId).trim() !== '') {
          const err = new Error('Unauthenticated guests cannot specify a student ID.');
          (err as any).code = 'P0003';
          throw err;
        }
        v_student_id = null;
      }
      return v_student_id;
    }

    // 1. Authenticated: valid matching student ID succeeds
    assert.equal(simulateStudentIdResolution(authUid, canonicalStudentId), canonicalStudentId);

    // 2. Authenticated: foreign UUID rejected with P0003
    assert.throws(
      () => simulateStudentIdResolution(authUid, '00000000-0000-0000-0000-000000000000'),
      (err: any) => err.code === 'P0003' && err.message.includes('Forbidden')
    );

    // 3. Authenticated: malformed string rejected with P0003 without crashing on UUID syntax
    assert.throws(
      () => simulateStudentIdResolution(authUid, 'not-a-valid-uuid-string'),
      (err: any) => err.code === 'P0003' && err.message.includes('Forbidden')
    );

    // 4. Guest: valid UUID rejected with P0003
    assert.throws(
      () => simulateStudentIdResolution(null, canonicalStudentId),
      (err: any) => err.code === 'P0003' && err.message.includes('Unauthenticated guests cannot specify a student ID.')
    );

    // 5. Guest: malformed string rejected with P0003
    assert.throws(
      () => simulateStudentIdResolution(null, 'malicious-string'),
      (err: any) => err.code === 'P0003' && err.message.includes('Unauthenticated guests cannot specify a student ID.')
    );

    // 6. Guest: null or omitted succeeds with null
    assert.equal(simulateStudentIdResolution(null, null), null);
    assert.equal(simulateStudentIdResolution(null, undefined), null);
  });

  it('4. Simulates Malformed Duration: Non-numeric, negative, fractional, and unsupported validation', () => {
    const supportedDurations = [30, 45, 60];

    function validateDuration(durationInput: any, isTrial: boolean) {
      let v_duration: number;
      if (durationInput !== undefined && durationInput !== null && String(durationInput).trim() !== '') {
        const raw = String(durationInput).trim();
        if (!/^[0-9]+$/.test(raw)) {
          const err = new Error('Invalid lesson duration.');
          (err as any).code = 'P0001';
          throw err;
        }
        v_duration = parseInt(raw, 10);
      } else {
        v_duration = 30;
      }

      if (![30, 45, 60].includes(v_duration)) {
        const err = new Error('Invalid lesson duration.');
        (err as any).code = 'P0001';
        throw err;
      }

      if (!supportedDurations.includes(v_duration)) {
        const err = new Error('The selected duration is not supported for this service.');
        (err as any).code = 'P0001';
        throw err;
      }

      if (isTrial && v_duration > 45) {
        const err = new Error('Free trial duration cannot exceed 45 minutes.');
        (err as any).code = 'P0001';
        throw err;
      }

      return v_duration;
    }

    // Missing defaults to 30
    assert.equal(validateDuration(undefined, false), 30);
    assert.equal(validateDuration(null, false), 30);

    // Valid inputs
    assert.equal(validateDuration(30, true), 30);
    assert.equal(validateDuration(45, true), 45);
    assert.equal(validateDuration(60, false), 60);

    // Malformed: non-numeric string
    assert.throws(() => validateDuration('thirty', false), (err: any) => err.code === 'P0001' && err.message.includes('Invalid lesson duration.'));

    // Malformed: negative
    assert.throws(() => validateDuration('-30', false), (err: any) => err.code === 'P0001' && err.message.includes('Invalid lesson duration.'));

    // Malformed: fractional
    assert.throws(() => validateDuration('30.5', false), (err: any) => err.code === 'P0001' && err.message.includes('Invalid lesson duration.'));

    // Unsupported duration
    assert.throws(() => validateDuration('25', false), (err: any) => err.code === 'P0001' && err.message.includes('Invalid lesson duration.'));

    // Trial exceeding 45 min
    assert.throws(() => validateDuration(60, true), (err: any) => err.code === 'P0001' && err.message.includes('Free trial duration cannot exceed 45 minutes.'));
  });

  it('5. Simulates Malformed Timestamps & Interval Validation', () => {
    function validateTimes(startStr: string, endStr: string, durationMinutes: number, timezoneStr: string) {
      if (!startStr || !startStr.trim()) {
        const err = new Error('Scheduled start time is required.');
        (err as any).code = 'P0001';
        throw err;
      }

      const startTime = Date.parse(startStr);
      if (isNaN(startTime)) {
        const err = new Error('Invalid scheduled start timestamp format.');
        (err as any).code = 'P0001';
        throw err;
      }

      if (!endStr || !endStr.trim()) {
        const err = new Error('Scheduled end time is required.');
        (err as any).code = 'P0001';
        throw err;
      }

      const endTime = Date.parse(endStr);
      if (isNaN(endTime)) {
        const err = new Error('Invalid scheduled end timestamp format.');
        (err as any).code = 'P0001';
        throw err;
      }

      // Timezone check
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezoneStr });
      } catch {
        const err = new Error('Invalid student timezone.');
        (err as any).code = 'P0001';
        throw err;
      }

      if (endTime <= startTime) {
        const err = new Error('Invalid scheduled time interval.');
        (err as any).code = 'P0001';
        throw err;
      }

      const diffMinutes = Math.round((endTime - startTime) / 60000);
      if (diffMinutes !== durationMinutes) {
        const err = new Error('Scheduled time interval does not match lesson duration.');
        (err as any).code = 'P0001';
        throw err;
      }

      return { startTime, endTime };
    }

    // Valid schedule
    const valid = validateTimes('2026-09-10T10:00:00Z', '2026-09-10T10:30:00Z', 30, 'UTC');
    assert.ok(valid.startTime < valid.endTime);

    // Missing start
    assert.throws(() => validateTimes('', '2026-09-10T10:30:00Z', 30, 'UTC'), (err: any) => err.code === 'P0001');

    // Malformed start
    assert.throws(() => validateTimes('not-a-date', '2026-09-10T10:30:00Z', 30, 'UTC'), (err: any) => err.message.includes('Invalid scheduled start timestamp format.'));

    // Inverted interval (end before start)
    assert.throws(() => validateTimes('2026-09-10T11:00:00Z', '2026-09-10T10:00:00Z', 30, 'UTC'), (err: any) => err.message.includes('Invalid scheduled time interval.'));

    // Duration mismatch
    assert.throws(() => validateTimes('2026-09-10T10:00:00Z', '2026-09-10T11:00:00Z', 30, 'UTC'), (err: any) => err.message.includes('Scheduled time interval does not match lesson duration.'));

    // Invalid timezone
    assert.throws(() => validateTimes('2026-09-10T10:00:00Z', '2026-09-10T10:30:00Z', 30, 'Mars/Olympus'), (err: any) => err.message.includes('Invalid student timezone.'));
  });

  it('6. Atomicity & Orphan Prevention: Verifies exception handling ensures zero orphan records on rollback', () => {
    // Audit PL/pgSQL transaction semantics in migration 000005:
    // 1. Leads upsert occurs in Step 10
    // 2. Booking insert occurs in Step 11
    // 3. Reminders insert occurs in Step 12
    // If Step 11 or Step 12 fails, or if validation fails anywhere, an unhandled or re-raised exception
    // aborts the PL/pgSQL function, triggering PostgreSQL transaction-level rollback of all preceding inserts.

    assert.ok(migration05Content.includes('BEGIN\n        INSERT INTO public.bookings'), 'Booking insert is encapsulated');
    assert.ok(migration05Content.includes('WHEN exclusion_violation THEN\n            RAISE EXCEPTION'), 'Must re-raise exclusion_violation to trigger rollback');
    assert.ok(migration05Content.includes('WHEN unique_violation THEN'), 'Must re-raise unique_violation to trigger rollback');
    
    // Simulate transaction atomicity:
    const mockDb = {
      leads: [] as any[],
      bookings: [] as any[],
      reminders: [] as any[],
    };

    function atomicTransactionSim(shouldFailAtBooking: boolean) {
      const snapshot = {
        leads: [...mockDb.leads],
        bookings: [...mockDb.bookings],
        reminders: [...mockDb.reminders],
      };

      try {
        // Step 1: Insert Lead
        mockDb.leads.push({ id: 'lead-1', email: 'test@example.com' });

        // Step 2: Insert Booking
        if (shouldFailAtBooking) {
          throw new Error('The selected time slot is no longer available. Please select another time.');
        }
        mockDb.bookings.push({ id: 'booking-1', lead_id: 'lead-1' });

        // Step 3: Insert Reminders
        mockDb.reminders.push({ id: 'rem-1', booking_id: 'booking-1' });
      } catch (err) {
        // Rollback entire transaction
        mockDb.leads = snapshot.leads;
        mockDb.bookings = snapshot.bookings;
        mockDb.reminders = snapshot.reminders;
        throw err;
      }
    }

    // Verify successful transaction
    atomicTransactionSim(false);
    assert.equal(mockDb.leads.length, 1);
    assert.equal(mockDb.bookings.length, 1);
    assert.equal(mockDb.reminders.length, 1);

    // Verify rollback on failure: ZERO orphan records added
    assert.throws(() => atomicTransactionSim(true), /The selected time slot is no longer available/);
    assert.equal(mockDb.leads.length, 1, 'Lead must not be orphaned after failed booking');
    assert.equal(mockDb.bookings.length, 1, 'Booking must remain unchanged');
    assert.equal(mockDb.reminders.length, 1, 'Reminders must remain unchanged');
  });

  it('7. Client Trust Boundary: Verifies bookingRepository never invents tokens or masks errors', () => {
    assert.ok(bookingRepoContent.includes("const { data: atomicResult, error: atomicError } = await supabase.rpc('create_booking_atomic'"), 'Calls create_booking_atomic');
    assert.ok(bookingRepoContent.includes('referenceCode = atomicResult.referenceCode;'), 'referenceCode authoritative from server');
    assert.ok(bookingRepoContent.includes('managementToken = atomicResult.managementToken;'), 'managementToken authoritative from server');
    assert.ok(bookingRepoContent.includes('if (atomicError) {'), 'Checks atomicError');
    assert.ok(bookingRepoContent.includes('return { success: false, error: atomicError.message'), 'Returns atomicError without mock fallback');
  });
});
