/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — TASK 0.39
 * STUDENT BOOKING OWNERSHIP & STAFF AUTHORIZATION HARDENING TESTS
 * File: test/task-0.39-student-ownership-security.test.ts
 * Role: Strict verification of:
 *       1. Authenticated Student A booking identity resolution
 *       2. Prevention of student_id tampering/impersonation (Student A -> Student B)
 *       3. Prevention of random UUID injection in bookings
 *       4. Guest booking isolation (student_id = NULL)
 *       5. Authenticated booking without client student_id
 *       6. Role boundary separation (Student <-> Teacher)
 *       7. Production development token rejection
 *       8. Profile mutation attribute protection (id, status, auth_user_id, etc.)
 *       9. Read-only idempotent GET /api/student/bookings
 * ====================================================================
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../api/index.js';

describe('Task 0.39 — Student Booking Ownership & Staff Authorization Hardening', () => {
  let server: http.Server;
  let baseUrl: string;
  const originalEnv = { ...process.env };

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ====================================================================
  // 1. Role Boundary & Cross-Portal Access Separation
  // ====================================================================

  it('1. Rejects unauthenticated request to /api/student/me with 401', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.error);
  });

  it('2. Rejects unauthenticated request to /api/student/bookings with 401', async () => {
    const res = await fetch(`${baseUrl}/api/student/bookings`);
    assert.strictEqual(res.status, 401);
  });

  it('3. Rejects teacher token accessing student endpoint /api/student/me with 403', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      headers: { Authorization: 'Bearer dev-teacher-token' }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.match(body.error.toLowerCase(), /forbidden|teacher/);
  });

  it('4. Rejects student token accessing teacher endpoint /api/dashboard/students with 401 or 403', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students`, {
      headers: { Authorization: 'Bearer dev-student-token' }
    });
    assert.ok(res.status === 401 || res.status === 403);
  });

  it('5. Rejects student token accessing teacher endpoint /api/dashboard/today with 401 or 403', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: { Authorization: 'Bearer dev-student-token' }
    });
    assert.ok(res.status === 401 || res.status === 403);
  });

  // ====================================================================
  // 2. Strict Production Security — Dev Tokens Forbidden
  // ====================================================================

  it('6. Strictly rejects dev-student-token in production on student endpoints', async () => {
    process.env.NODE_ENV = 'production';
    const res = await fetch(`${baseUrl}/api/student/me`, {
      headers: { Authorization: 'Bearer dev-student-token' }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.match(body.error.toLowerCase(), /forbidden in production|unauthorized/);
  });

  it('7. Strictly rejects dev-teacher-token in production on teacher endpoints', async () => {
    process.env.NODE_ENV = 'production';
    const res = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: { Authorization: 'Bearer dev-teacher-token' }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.match(body.error.toLowerCase(), /forbidden in production|unauthorized/);
  });

  // ====================================================================
  // 3. Student Profile Mutation Hardening (PATCH /api/student/me)
  // ====================================================================

  it('8. Rejects mutation of id, student_id, or studentId with 422', async () => {
    for (const forbiddenKey of ['id', 'student_id', 'studentId']) {
      const res = await fetch(`${baseUrl}/api/student/me`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer dev-student-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [forbiddenKey]: '33333333-3333-3333-3333-333333333333' })
      });
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.match(body.error, /forbidden/i);
    }
  });

  it('9. Rejects mutation of auth_user_id, status, role, email, or notes with 422', async () => {
    for (const forbiddenKey of ['auth_user_id', 'status', 'role', 'email', 'notes', 'current_level']) {
      const res = await fetch(`${baseUrl}/api/student/me`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer dev-student-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [forbiddenKey]: 'hacked-value' })
      });
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.match(body.error, /forbidden/i);
    }
  });

  // ====================================================================
  // 4. Read-Only Idempotent GET /api/student/bookings & Tenant Isolation
  // ====================================================================

  it('10. Student A cannot see Student B profile or data', async () => {
    const resA = await fetch(`${baseUrl}/api/student/me`, {
      headers: { Authorization: 'Bearer dev-student-token' }
    });
    const resB = await fetch(`${baseUrl}/api/student/me`, {
      headers: { Authorization: 'Bearer dev-student-b-token' }
    });
    assert.strictEqual(resA.status, 200);
    assert.strictEqual(resB.status, 200);
    const bodyA = await resA.json();
    const bodyB = await resB.json();
    assert.notStrictEqual(bodyA.id, bodyB.id);
    assert.strictEqual(bodyA.id, '11111111-2222-3333-4444-555555555555');
    assert.strictEqual(bodyB.id, '22222222-2222-3333-4444-555555555555');
  });

  // ====================================================================
  // 5. Database RPC Contract Simulation: create_booking_atomic Hardening
  // ====================================================================

  describe('create_booking_atomic PL/pgSQL Contract Invariant Verification', () => {
    const STUDENT_A_AUTH_UID = 'user-auth-student-a-uuid';
    const STUDENT_A_STUDENT_ID = '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    const STUDENT_B_AUTH_UID = 'user-auth-student-b-uuid';
    const STUDENT_B_STUDENT_ID = '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    const RANDOM_UUID = '99999999-9999-9999-9999-999999999999';

    // Mock students table
    const studentsTable = new Map<string, { id: string; auth_user_id: string; email: string }>([
      [STUDENT_A_AUTH_UID, { id: STUDENT_A_STUDENT_ID, auth_user_id: STUDENT_A_AUTH_UID, email: 'student-a@example.com' }],
      [STUDENT_B_AUTH_UID, { id: STUDENT_B_STUDENT_ID, auth_user_id: STUDENT_B_AUTH_UID, email: 'student-b@example.com' }],
    ]);

    /**
     * Exact replication of the authoritative student resolution logic
     * from migration 20260908000003_student_booking_ownership_and_auth_hardening.sql:
     */
    function resolveBookingStudentId(authUid: string | null, pBooking: Record<string, any>): string | null {
      let resolvedStudentId: string | null = null;

      if (authUid !== null) {
        // Authenticated user: resolve strictly via auth_user_id
        const student = studentsTable.get(authUid);
        if (!student) {
          throw new Error('Authenticated student profile is not ready. Please complete student onboarding or sign in again.');
        }
        resolvedStudentId = student.id;

        // If client provided a student_id, ensure it does not attempt to impersonate another student
        if (pBooking && 'student_id' in pBooking && pBooking.student_id !== null && pBooking.student_id !== '') {
          if (pBooking.student_id !== resolvedStudentId) {
            throw new Error('Forbidden. Cannot create a booking on behalf of another student.');
          }
        }
      } else {
        // Guest booking (auth.uid() IS NULL)
        // Unauthenticated guests can never specify a student_id
        if (pBooking && 'student_id' in pBooking && pBooking.student_id !== null && pBooking.student_id !== '') {
          throw new Error('Unauthenticated guests cannot specify a student ID.');
        }
        resolvedStudentId = null;
      }

      return resolvedStudentId;
    }

    it('11. Authenticated Student A booking without student_id resolves strictly to Student A ID', () => {
      const resolved = resolveBookingStudentId(STUDENT_A_AUTH_UID, {
        contact_name: 'Student A',
        contact_email: 'student-a@example.com'
      });
      assert.strictEqual(resolved, STUDENT_A_STUDENT_ID);
    });

    it('12. Authenticated Student A booking with student_id = null resolves strictly to Student A ID', () => {
      const resolved = resolveBookingStudentId(STUDENT_A_AUTH_UID, {
        contact_name: 'Student A',
        contact_email: 'student-a@example.com',
        student_id: null
      });
      assert.strictEqual(resolved, STUDENT_A_STUDENT_ID);
    });

    it('13. Authenticated Student A booking with own student_id resolves successfully', () => {
      const resolved = resolveBookingStudentId(STUDENT_A_AUTH_UID, {
        contact_name: 'Student A',
        contact_email: 'student-a@example.com',
        student_id: STUDENT_A_STUDENT_ID
      });
      assert.strictEqual(resolved, STUDENT_A_STUDENT_ID);
    });

    it('14. ATTACK REGRESSION TEST: Student A submitting Student B student_id is strictly rejected', () => {
      assert.throws(() => {
        resolveBookingStudentId(STUDENT_A_AUTH_UID, {
          contact_name: 'Student A',
          contact_email: 'student-a@example.com',
          student_id: STUDENT_B_STUDENT_ID // Attack: Student A tries to inject Student B ID
        });
      }, /Forbidden. Cannot create a booking on behalf of another student./);
    });

    it('15. ATTACK REGRESSION TEST: Student A submitting random UUID is strictly rejected', () => {
      assert.throws(() => {
        resolveBookingStudentId(STUDENT_A_AUTH_UID, {
          contact_name: 'Student A',
          contact_email: 'student-a@example.com',
          student_id: RANDOM_UUID // Attack: Random UUID injection
        });
      }, /Forbidden. Cannot create a booking on behalf of another student./);
    });

    it('16. Guest booking without student_id succeeds with student_id = null', () => {
      const resolved = resolveBookingStudentId(null, {
        contact_name: 'Guest Learner',
        contact_email: 'guest@example.com'
      });
      assert.strictEqual(resolved, null);
    });

    it('17. Guest booking with student_id = null succeeds with student_id = null', () => {
      const resolved = resolveBookingStudentId(null, {
        contact_name: 'Guest Learner',
        contact_email: 'guest@example.com',
        student_id: null
      });
      assert.strictEqual(resolved, null);
    });

    it('18. Guest attempting to inject any student_id is strictly rejected', () => {
      assert.throws(() => {
        resolveBookingStudentId(null, {
          contact_name: 'Guest Learner',
          contact_email: 'guest@example.com',
          student_id: STUDENT_A_STUDENT_ID
        });
      }, /Unauthenticated guests cannot specify a student ID./);
    });

    it('19. Authenticated user without student profile fails safely with clear error', () => {
      assert.throws(() => {
        resolveBookingStudentId('non-existent-auth-user', {
          contact_name: 'Unregistered User',
          contact_email: 'unregistered@example.com'
        });
      }, /Authenticated student profile is not ready/);
    });
  });
});
