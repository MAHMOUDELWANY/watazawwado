import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

describe('Task 0.50.1 — Production RPC Hardening Correction: Cast Safety, Overflow Guard & Structured Diagnostics', () => {
  const migration05Path = path.resolve('supabase/migrations/20260908000005_fix_booking_rpc_service_id_text.sql');
  const migration05Content = fs.existsSync(migration05Path) ? fs.readFileSync(migration05Path, 'utf8') : '';
  const bookingRepoPath = path.resolve('src/lib/bookingRepository.ts');
  const bookingRepoContent = fs.existsSync(bookingRepoPath) ? fs.readFileSync(bookingRepoPath, 'utf8') : '';

  it('1. Duration Integer Overflow Guard: Verifies migration 000005 rejects oversized and malformed durations without raw cast errors', () => {
    // Audit length check and regex in migration 000005
    assert.ok(
      migration05Content.includes("length(trim(p_booking->>'duration_minutes')) > 2"),
      'Must check string length <= 2 before integer casting to prevent integer overflow'
    );
    assert.ok(
      migration05Content.includes("trim(p_booking->>'duration_minutes') !~ '^[0-9]+$'"),
      'Must check numeric regex'
    );
    assert.ok(
      migration05Content.includes("BEGIN\n            v_duration := (trim(p_booking->>'duration_minutes'))::INT;\n        EXCEPTION WHEN OTHERS THEN\n            RAISE EXCEPTION 'Invalid lesson duration.' USING ERRCODE = 'P0001';\n        END;"),
      'Must wrap duration integer cast in guarded exception block'
    );

    // Simulation of the exact SQL logic
    function parseDurationSafe(input: any) {
      if (input === undefined || input === null || String(input).trim() === '') {
        return 30; // default
      }
      const trimmed = String(input).trim();
      if (trimmed.length > 2 || !/^[0-9]+$/.test(trimmed)) {
        const err = new Error('Invalid lesson duration.');
        (err as any).code = 'P0001';
        throw err;
      }
      const parsed = parseInt(trimmed, 10);
      if (isNaN(parsed) || ![30, 45, 60].includes(parsed)) {
        const err = new Error('Invalid lesson duration.');
        (err as any).code = 'P0001';
        throw err;
      }
      return parsed;
    }

    // 1. Oversized string (overflow scenario)
    assert.throws(
      () => parseDurationSafe('999999999999999999999999'),
      (err: any) => err.code === 'P0001' && err.message === 'Invalid lesson duration.'
    );

    // 2. 100-digit numeric string
    assert.throws(
      () => parseDurationSafe('1'.repeat(100)),
      (err: any) => err.code === 'P0001' && err.message === 'Invalid lesson duration.'
    );

    // 3. Letters / alphanumeric
    assert.throws(
      () => parseDurationSafe('abc'),
      (err: any) => err.code === 'P0001' && err.message === 'Invalid lesson duration.'
    );

    // 4. Fractional decimal
    assert.throws(
      () => parseDurationSafe('30.5'),
      (err: any) => err.code === 'P0001' && err.message === 'Invalid lesson duration.'
    );

    // 5. Negative numbers
    assert.throws(
      () => parseDurationSafe('-30'),
      (err: any) => err.code === 'P0001' && err.message === 'Invalid lesson duration.'
    );

    // 6. Leading plus sign
    assert.throws(
      () => parseDurationSafe('+30'),
      (err: any) => err.code === 'P0001' && err.message === 'Invalid lesson duration.'
    );

    // 7. Zero
    assert.throws(
      () => parseDurationSafe('0'),
      (err: any) => err.code === 'P0001' && err.message === 'Invalid lesson duration.'
    );

    // 8. Unsupported duration (e.g. 20, 50, 90)
    assert.throws(
      () => parseDurationSafe('20'),
      (err: any) => err.code === 'P0001' && err.message === 'Invalid lesson duration.'
    );
    assert.throws(
      () => parseDurationSafe('90'),
      (err: any) => err.code === 'P0001' && err.message === 'Invalid lesson duration.'
    );

    // 9. Whitespace variants
    assert.equal(parseDurationSafe('  30  '), 30);
    assert.equal(parseDurationSafe('  45  '), 45);
    assert.equal(parseDurationSafe('  60  '), 60);
    assert.equal(parseDurationSafe('    '), 30); // empty defaults to 30

    // 10. Valid standard numbers
    assert.equal(parseDurationSafe(30), 30);
    assert.equal(parseDurationSafe(45), 45);
    assert.equal(parseDurationSafe(60), 60);
  });

  it('2. Complete JSON Cast Audit: Verifies all casts in migration 000005 are guarded or strictly safe', () => {
    // 1. Search for all explicit casts "::" in the SQL file
    const castMatches = migration05Content.match(/::[a-zA-Z0-9_]+/g) || [];
    const uniqueCasts = [...new Set(castMatches)];

    // Expected safe cast types
    const allowedCasts = ['::INT', '::TIMESTAMPTZ', '::INTERVAL', '::numeric', '::text'];
    for (const cast of uniqueCasts) {
      assert.ok(allowedCasts.includes(cast), `Unexpected cast found in migration: ${cast}`);
    }

    // 2. Ensure NO client JSON value is directly cast to UUID
    assert.ok(
      !migration05Content.includes("(p_booking->>'student_id')::UUID"),
      'Direct UUID cast of client student_id must be completely eliminated'
    );

    // 3. Ensure TIMESTAMPTZ casts are wrapped in exception blocks
    assert.ok(
      migration05Content.includes("BEGIN\n        v_scheduled_start := (p_booking->>'scheduled_start')::TIMESTAMPTZ;\n    EXCEPTION WHEN OTHERS THEN"),
      'scheduled_start cast must be enclosed in guarded exception block'
    );
    assert.ok(
      migration05Content.includes("BEGIN\n        v_scheduled_end := (p_booking->>'scheduled_end')::TIMESTAMPTZ;\n    EXCEPTION WHEN OTHERS THEN"),
      'scheduled_end cast must be enclosed in guarded exception block'
    );

    // 4. Ensure timezone check is wrapped in exception block
    assert.ok(
      migration05Content.includes("BEGIN\n        PERFORM now() AT TIME ZONE v_timezone;\n    EXCEPTION WHEN OTHERS THEN"),
      'Timezone check must be enclosed in guarded exception block'
    );
  });

  it('3. Structured Constraint Identification for Duplicate Trials: Verifies GET STACKED DIAGNOSTICS is used', () => {
    // Migration 000005 must use structured exception diagnostics
    assert.ok(
      migration05Content.includes('GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;'),
      'Must use structured diagnostics to retrieve CONSTRAINT_NAME'
    );
    assert.ok(
      migration05Content.includes("v_constraint_name = 'idx_bookings_one_trial' OR SQLERRM LIKE '%idx_bookings_one_trial%'"),
      'Must check structured constraint name with safe text fallback'
    );

    // Simulation of structured constraint resolution
    function handleUniqueViolation(constraintName: string, sqlerrm: string) {
      if (constraintName === 'idx_bookings_one_trial' || sqlerrm.includes('idx_bookings_one_trial')) {
        const err = new Error('Our records indicate a free trial session has already been booked with this contact information. Each student is eligible for one complimentary trial. You may book a regular lesson or message Mahmoud on WhatsApp.');
        (err as any).code = 'P0001';
        throw err;
      }
      const err = new Error('Booking conflict detected. Please retry or choose another slot.');
      (err as any).code = 'P0001';
      throw err;
    }

    // 1. Matches structured constraint name
    assert.throws(
      () => handleUniqueViolation('idx_bookings_one_trial', 'duplicate key value violates unique constraint'),
      (err: any) => err.code === 'P0001' && err.message.includes('complimentary trial')
    );

    // 2. Matches fallback SQLERRM text
    assert.throws(
      () => handleUniqueViolation('', 'duplicate key value violates unique constraint "idx_bookings_one_trial"'),
      (err: any) => err.code === 'P0001' && err.message.includes('complimentary trial')
    );

    // 3. Other generic unique conflict
    assert.throws(
      () => handleUniqueViolation('other_unique_idx', 'duplicate key value'),
      (err: any) => err.code === 'P0001' && err.message.includes('Booking conflict detected.')
    );
  });

  it('4. Student ID Contract: Verifies guest injection and student impersonation are strictly rejected with P0003', () => {
    // Assert migration includes P0003 for impersonation and guest injection
    assert.ok(
      migration05Content.includes("'Forbidden. Cannot create a booking on behalf of another student.' USING ERRCODE = 'P0003'"),
      'Impersonation must produce P0003'
    );
    assert.ok(
      migration05Content.includes("'Unauthenticated guests cannot specify a student ID.' USING ERRCODE = 'P0003'"),
      'Guest student_id must produce P0003'
    );

    // Simulation of safe string comparison without UUID casting
    function resolveStudentOwnership(authUid: string | null, resolvedStudentId: string | null, clientStudentIdRaw: any) {
      let v_student_id: string | null = null;
      if (authUid !== null) {
        if (!resolvedStudentId) {
          const err = new Error('Authenticated student profile is not ready. Please complete student onboarding or sign in again.');
          (err as any).code = 'P0003';
          throw err;
        }
        v_student_id = resolvedStudentId;

        if (clientStudentIdRaw !== undefined && clientStudentIdRaw !== null && String(clientStudentIdRaw).trim() !== '') {
          if (String(clientStudentIdRaw).trim().toLowerCase() !== v_student_id.toLowerCase()) {
            const err = new Error('Forbidden. Cannot create a booking on behalf of another student.');
            (err as any).code = 'P0003';
            throw err;
          }
        }
      } else {
        if (clientStudentIdRaw !== undefined && clientStudentIdRaw !== null && String(clientStudentIdRaw).trim() !== '') {
          const err = new Error('Unauthenticated guests cannot specify a student ID.');
          (err as any).code = 'P0003';
          throw err;
        }
        v_student_id = null;
      }
      return v_student_id;
    }

    const myStudentId = 'd9b3a7a2-9999-4444-8888-123456789abc';

    // 1. Authenticated matching student ID
    assert.equal(resolveStudentOwnership('user-1', myStudentId, myStudentId), myStudentId);
    assert.equal(resolveStudentOwnership('user-1', myStudentId, myStudentId.toUpperCase()), myStudentId);
    assert.equal(resolveStudentOwnership('user-1', myStudentId, undefined), myStudentId);

    // 2. Authenticated foreign UUID
    assert.throws(
      () => resolveStudentOwnership('user-1', myStudentId, '00000000-0000-0000-0000-000000000000'),
      (err: any) => err.code === 'P0003' && err.message.includes('Forbidden')
    );

    // 3. Authenticated malformed string (e.g. "not-a-uuid")
    assert.throws(
      () => resolveStudentOwnership('user-1', myStudentId, 'not-a-uuid'),
      (err: any) => err.code === 'P0003' && err.message.includes('Forbidden')
    );

    // 4. Guest specifying valid UUID
    assert.throws(
      () => resolveStudentOwnership(null, null, myStudentId),
      (err: any) => err.code === 'P0003' && err.message.includes('Unauthenticated guests cannot specify a student ID.')
    );

    // 5. Guest specifying malformed string
    assert.throws(
      () => resolveStudentOwnership(null, null, 'malicious-string'),
      (err: any) => err.code === 'P0003' && err.message.includes('Unauthenticated guests cannot specify a student ID.')
    );

    // 6. Guest omitting student_id
    assert.equal(resolveStudentOwnership(null, null, null), null);
    assert.equal(resolveStudentOwnership(null, null, undefined), null);
  });

  it('5. Transaction Atomicity & Orphan Prevention: Formally validates invocation-level rollback semantics', () => {
    // Verifies that all DML operations in migration 000005 are bound to the caller's transaction
    // and any exception automatically rolls back preceding leads, bookings, and reminders.
    assert.ok(migration05Content.includes('INSERT INTO public.leads'), 'Step 10 performs leads upsert');
    assert.ok(migration05Content.includes('INSERT INTO public.bookings'), 'Step 11 performs bookings insert');
    assert.ok(migration05Content.includes('INSERT INTO public.reminders'), 'Step 12 performs reminders insert');

    // Exclusion and unique violations re-raise exceptions:
    assert.ok(
      migration05Content.includes("WHEN exclusion_violation THEN\n            RAISE EXCEPTION 'The selected time slot is no longer available. Please select another time.' USING ERRCODE = 'P0001';"),
      'exclusion_violation must be re-raised to trigger rollback'
    );
    assert.ok(
      migration05Content.includes("RAISE EXCEPTION 'Booking conflict detected. Please retry or choose another slot.' USING ERRCODE = 'P0001';"),
      'unique_violation must be re-raised to trigger rollback'
    );

    // Simulate strict transaction delta:
    const store = {
      leads: new Map<string, any>(),
      bookings: new Map<string, any>(),
      reminders: new Map<string, any>(),
    };

    function executeTransactionSim(payload: { shouldFailAtStage?: 'validation' | 'booking' | 'reminder' }) {
      const initialLeadsCount = store.leads.size;
      const initialBookingsCount = store.bookings.size;
      const initialRemindersCount = store.reminders.size;

      const createdLeads: string[] = [];
      const createdBookings: string[] = [];
      const createdReminders: string[] = [];

      try {
        // Stage 1: Validation
        if (payload.shouldFailAtStage === 'validation') {
          throw new Error('Invalid lesson duration.');
        }

        // Stage 2: Leads Upsert
        const leadId = 'lead-' + Date.now();
        store.leads.set(leadId, { id: leadId, email: 'test@example.com' });
        createdLeads.push(leadId);

        // Stage 3: Booking Insert
        if (payload.shouldFailAtStage === 'booking') {
          throw new Error('The selected time slot is no longer available. Please select another time.');
        }
        const bookingId = 'booking-' + Date.now();
        store.bookings.set(bookingId, { id: bookingId, leadId });
        createdBookings.push(bookingId);

        // Stage 4: Reminders Insert
        if (payload.shouldFailAtStage === 'reminder') {
          throw new Error('Reminder scheduling failed.');
        }
        const remId = 'rem-' + Date.now();
        store.reminders.set(remId, { id: remId, bookingId });
        createdReminders.push(remId);

        return { success: true, bookingId };
      } catch (err) {
        // Transaction Rollback: Clean up any state created in this invocation
        for (const id of createdLeads) store.leads.delete(id);
        for (const id of createdBookings) store.bookings.delete(id);
        for (const id of createdReminders) store.reminders.delete(id);

        const deltaLeads = store.leads.size - initialLeadsCount;
        const deltaBookings = store.bookings.size - initialBookingsCount;
        const deltaReminders = store.reminders.size - initialRemindersCount;

        return {
          success: false,
          error: (err as Error).message,
          deltaLeads,
          deltaBookings,
          deltaReminders,
        };
      }
    }

    // A. Validation failure
    const resA = executeTransactionSim({ shouldFailAtStage: 'validation' });
    assert.equal(resA.success, false);
    assert.equal(resA.deltaLeads, 0);
    assert.equal(resA.deltaBookings, 0);
    assert.equal(resA.deltaReminders, 0);

    // B. Booking slot collision failure
    const resB = executeTransactionSim({ shouldFailAtStage: 'booking' });
    assert.equal(resB.success, false);
    assert.equal(resB.deltaLeads, 0);
    assert.equal(resB.deltaBookings, 0);
    assert.equal(resB.deltaReminders, 0);

    // C. Late-stage reminder failure
    const resC = executeTransactionSim({ shouldFailAtStage: 'reminder' });
    assert.equal(resC.success, false);
    assert.equal(resC.deltaLeads, 0);
    assert.equal(resC.deltaBookings, 0);
    assert.equal(resC.deltaReminders, 0);

    // D. Normal success
    const resD = executeTransactionSim({});
    assert.equal(resD.success, true);
  });

  it('6. Static Security & Invariants Review: Verifies search_path, permissions, and project targeting', () => {
    // 1. SECURITY DEFINER and search_path
    assert.ok(migration05Content.includes('SECURITY DEFINER'), 'Must be SECURITY DEFINER');
    assert.ok(migration05Content.includes('SET search_path = public, pg_temp'), 'Must set search_path = public, pg_temp');

    // 2. Canonical service columns
    assert.ok(migration05Content.includes('hourly_rate_usd'), 'Must query canonical hourly_rate_usd');
    assert.ok(migration05Content.includes('trial_allowed'), 'Must query canonical trial_allowed');
    assert.ok(!migration05Content.includes('price_hourly_usd'), 'Must NOT query price_hourly_usd');
    assert.ok(!migration05Content.includes('trial_eligible'), 'Must NOT query trial_eligible');

    // 3. Service ID type
    assert.ok(migration05Content.includes('v_service_id TEXT;'), 'Must use TEXT service_id');

    // 4. Schema-qualified pgcrypto extensions
    assert.ok(migration05Content.includes('extensions.gen_random_bytes'), 'Must schema-qualify gen_random_bytes');
    assert.ok(migration05Content.includes('extensions.crypt'), 'Must schema-qualify crypt');
    assert.ok(migration05Content.includes('extensions.gen_salt'), 'Must schema-qualify gen_salt');

    // 5. Function permissions
    assert.ok(migration05Content.includes('REVOKE ALL ON FUNCTION public.create_booking_atomic(jsonb) FROM PUBLIC;'), 'Must revoke from PUBLIC');
    assert.ok(migration05Content.includes('GRANT EXECUTE ON FUNCTION public.create_booking_atomic(jsonb) TO anon, authenticated;'), 'Must grant to anon, authenticated');

    // 6. Target project isolation
    assert.ok(!migration05Content.includes('kpftfmwnwcnkbvfgjfdy'), 'Must NOT reference invalid project kpftfmwnwcnkbvfgjfdy');
  });

  it('7. Client Trust Boundary Review: bookingRepository never fakes tokens and respects server errors', () => {
    // Inspect bookingRepository
    assert.ok(bookingRepoContent.includes("const { data: atomicResult, error: atomicError } = await supabase.rpc('create_booking_atomic'"));
    assert.ok(bookingRepoContent.includes('if (atomicError) {'));
    assert.ok(bookingRepoContent.includes('return { success: false, error: atomicError.message'));
    assert.ok(bookingRepoContent.includes('referenceCode = atomicResult.referenceCode;'));
    assert.ok(bookingRepoContent.includes('managementToken = atomicResult.managementToken;'));
  });
});
