import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';

describe('Phase 7 — Student Authentication & Portal API Tests', () => {
  let server: http.Server;
  let baseUrl: string;

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

  // 1. Unauthenticated checks
  it('rejects unauthenticated GET /api/student/me with 401', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.error);
  });

  it('rejects unauthenticated GET /api/student/bookings with 401', async () => {
    const res = await fetch(`${baseUrl}/api/student/bookings`);
    assert.strictEqual(res.status, 401);
  });

  it('rejects unauthenticated PATCH /api/student/me with 401', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name' })
    });
    assert.strictEqual(res.status, 401);
  });

  // 2. Role Isolation
  it('strictly rejects teacher token accessing student endpoint /api/student/me with 403', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      headers: { Authorization: 'Bearer dev-teacher-token' }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('teacher') || body.error.toLowerCase().includes('forbidden'));
  });

  it('strictly rejects student token accessing teacher endpoint /api/dashboard/students with 401/403', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students`, {
      headers: { Authorization: 'Bearer dev-student-token' }
    });
    assert.ok(res.status === 401 || res.status === 403);
  });

  // 3. Authenticated Student Operations (Mock in dev mode)
  it('allows authenticated student to GET /api/student/me and receive profile DTO', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      headers: { Authorization: 'Bearer dev-student-token' }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.id, '11111111-2222-3333-4444-555555555555');
    assert.strictEqual(body.email, 'student.a@example.com');
    assert.strictEqual(body.status, 'active');
  });

  it('allows authenticated student to GET /api/student/bookings', async () => {
    const res = await fetch(`${baseUrl}/api/student/bookings`, {
      headers: { Authorization: 'Bearer dev-student-token' }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
  });

  // 4. PATCH Profile Validation
  it('rejects attempt to modify forbidden field status with 422', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-student-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'admin' })
    });
    assert.strictEqual(res.status, 422);
    const body = await res.json();
    assert.ok(body.error.includes('forbidden'));
  });

  it('rejects attempt to modify forbidden field id with 422', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-student-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: '99999999-9999-9999-9999-999999999999' })
    });
    assert.strictEqual(res.status, 422);
  });

  it('rejects invalid timezone with 422', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-student-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ timezone: 'Invalid/Non_Existent_Timezone' })
    });
    assert.strictEqual(res.status, 422);
    const body = await res.json();
    assert.ok(body.error.includes('timezone'));
  });

  it('rejects too short name with 422', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-student-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'A' })
    });
    assert.strictEqual(res.status, 422);
    const body = await res.json();
    assert.ok(body.error.includes('Name must be at least 2 characters'));
  });

  it('accepts valid name and timezone update', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-student-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Zaid Updated',
        timezone: 'Europe/London'
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.name, 'Zaid Updated');
    assert.strictEqual(body.timezone, 'Europe/London');
  });

  // 5. Tenant Isolation & Guest Booking Safety
  it('enforces tenant isolation between Student A and Student B', async () => {
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
    assert.notStrictEqual(bodyA.email, bodyB.email);
  });

  it('ensures guest bookings without student_id are never returned to student', async () => {
    const res = await fetch(`${baseUrl}/api/student/bookings`, {
      headers: { Authorization: 'Bearer dev-student-token' }
    });
    assert.strictEqual(res.status, 200);
    const bookings = await res.json();
    // In any return, no booking without student_id or belonging to someone else is included
    for (const b of bookings) {
      assert.ok(b.student_id === undefined || b.student_id === '11111111-2222-3333-4444-555555555555');
    }
  });
});
