import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';
import { verifyServerTeacherStatus } from '../src/lib/auth.js';

describe('Task: Teacher Operations Remediation — Pass 1 + Pass 2', () => {
  let server: http.Server;
  let baseUrl: string;
  let originalEnv: NodeJS.ProcessEnv;

  before(async () => {
    originalEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(() => {
    process.env = originalEnv;
    server.close();
  });

  describe('1. Server-Authoritative Teacher Role Gating', () => {
    it('verifyServerTeacherStatus returns true when /api/dashboard/me returns role = teacher', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async (url: any) => {
          if (String(url).includes('/api/dashboard/me')) {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                user: { email: 'newteacher@example.com' },
                role: 'teacher'
              })
            } as any;
          }
          return { ok: false, status: 404 } as any;
        };

        const isTeacher = await verifyServerTeacherStatus('mock-token-xyz');
        assert.strictEqual(isTeacher, true, 'Should resolve teacher status from server');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('verifyServerTeacherStatus returns false when /api/dashboard/me returns 401/403 or non-teacher', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async (url: any) => {
          if (String(url).includes('/api/dashboard/me')) {
            return {
              ok: false,
              status: 403,
              json: async () => ({ error: 'Forbidden' })
            } as any;
          }
          return { ok: false, status: 404 } as any;
        };

        const isTeacher = await verifyServerTeacherStatus('mock-student-token');
        assert.strictEqual(isTeacher, false, 'Should reject non-teacher');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('verifyServerTeacherStatus returns false gracefully when fetch throws', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () => {
          throw new Error('Network failure');
        };

        const isTeacher = await verifyServerTeacherStatus('token-err');
        assert.strictEqual(isTeacher, false, 'Should fail closed on network error');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('2. Teacher Lesson Outcome Endpoint Contract', () => {
    it('PATCH /api/dashboard/bookings/:id rejects unauthenticated calls with 401', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/bookings/00000000-0000-0000-0000-000000000001`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      assert.strictEqual(res.status, 401, 'Unauthenticated request must be rejected with 401');
    });

    it('PATCH /api/dashboard/bookings/:id accepts completed status with covered_material and notes', async () => {
      // With dev token in test/dev environment
      const res = await fetch(`${baseUrl}/api/dashboard/bookings/00000000-0000-0000-0000-000000000001`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-teacher-token'
        },
        body: JSON.stringify({
          status: 'completed',
          covered_material: 'Surah Al-Mulk Ayahs 1-15, Tajweed rules of Ghunnah',
          notes: 'Excellent recitation and memorization retention.'
        })
      });

      // The status will be 200 or 500/503 depending on DB mock, but NOT 400 or 401
      assert.notStrictEqual(res.status, 401, 'Authenticated dev teacher must not receive 401');
      assert.notStrictEqual(res.status, 400, 'Payload with covered_material must be accepted as valid');
    });

    it('PATCH /api/dashboard/bookings/:id accepts no_show status with explicit credit decision', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/bookings/00000000-0000-0000-0000-000000000001`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-teacher-token'
        },
        body: JSON.stringify({
          status: 'no_show',
          no_show_credit_decision: 'returned',
          consume_package_credit: false,
          notes: 'Student did not join Zoom room after 15 minutes.'
        })
      });

      assert.notStrictEqual(res.status, 401, 'Authenticated dev teacher must not receive 401');
      assert.notStrictEqual(res.status, 400, 'Payload with explicit credit decision must be accepted');
    });
  });

  describe('3. Booking Detail Endpoint with Lesson Session Context', () => {
    it('GET /api/dashboard/bookings/:id requires teacher authentication', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/bookings/00000000-0000-0000-0000-000000000001`);
      assert.strictEqual(res.status, 401, 'Must reject unauthenticated request with 401');
    });
  });
});
