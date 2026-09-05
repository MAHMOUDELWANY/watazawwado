import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';

describe('Phase 5D — Student Management API Integration Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      // Bind to ephemeral port for testing
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

  // 1. Authorization checks
  it('rejects unauthenticated requests to GET /api/dashboard/students with 401', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.error && body.error.toLowerCase().includes('authentication required'));
  });

  it('rejects unauthenticated requests to GET /api/dashboard/students/:id with 401', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students/any-id`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.error && body.error.toLowerCase().includes('authentication required'));
  });

  it('rejects unauthenticated requests to POST /api/dashboard/students/:id/notes with 401', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students/any-id/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'test note' })
    });
    assert.strictEqual(res.status, 401);
  });

  it('rejects invalid or forged bearer tokens with 401', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students`, {
      headers: { Authorization: 'Bearer forged-random-token-xyz' }
    });
    assert.strictEqual(res.status, 401);
  });

  // 2. Validation tests using dev-teacher-token in development
  it('allows teacher access and returns students list structure with dev-teacher-token', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students`, {
      headers: { Authorization: 'Bearer dev-teacher-token' }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.students), 'Response should contain students array');
  });

  it('validates PATCH student profile with invalid timezone and rejects with 400', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-teacher-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ timezone: 'Invalid/Zone_Name' })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('timezone'), 'Error message should mention invalid timezone');
  });

  it('validates PATCH student profile with invalid email and rejects with 400', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-teacher-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'bad-email-without-domain' })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('email'), 'Error message should mention invalid email');
  });

  it('validates PATCH student profile with empty name and rejects with 400', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-teacher-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: '   ' })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('name'), 'Error message should mention name cannot be empty');
  });

  it('validates PATCH student profile with invalid status and rejects with 400', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-teacher-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'invalid_status_value' })
    });
    assert.strictEqual(res.status, 400);
  });

  it('validates POST note with empty content and rejects with 400', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students/00000000-0000-0000-0000-000000000000/notes`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer dev-teacher-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: '' })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('content'), 'Error should specify content is required');
  });

  // 3. Parent / Guardian email validation & nullability tests
  it('validates PATCH student profile with invalid parent_email and rejects with 400', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-teacher-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent_name: 'Parent Test',
        parent_email: 'not-an-email'
      })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('parent') || body.error.toLowerCase().includes('email'), 'Error message should mention parent email');
  });

  it('ensures GET /api/dashboard/students never returns parent@guardian.local fallback in directory', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/students`, {
      headers: { Authorization: 'Bearer dev-teacher-token' }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    const rawJson = JSON.stringify(body);
    assert.strictEqual(rawJson.includes('parent@guardian.local'), false, 'Should never contain parent@guardian.local');
  });
});
