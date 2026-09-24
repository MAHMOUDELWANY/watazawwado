import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import app from '../api/index.js';

describe('Teacher Role Model Finalization Suite', () => {
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

  // 1. super_admin login is accepted by Staff Portal
  it('1. super_admin token accesses /api/dashboard/me with role super_admin', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`, {
      headers: {
        Authorization: 'Bearer dev-super-admin-token'
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.user.role, 'super_admin');
    assert.strictEqual(body.user.appRole, 'super_admin');
    assert.strictEqual(body.user.isTeacher, true);
    assert.strictEqual(body.user.email, 'mahmoudelwany98@gmail.com');
  });

  it('1b. StaffLoginPage accepts super_admin role and does not reject it', () => {
    const staffLoginSrc = fs.readFileSync(path.join(process.cwd(), 'src/pages/StaffLoginPage.tsx'), 'utf-8');
    assert.ok(
      staffLoginSrc.includes("role !== 'teacher' && role !== 'super_admin'"),
      'StaffLoginPage must allow both teacher and super_admin'
    );
  });

  // 2. normal teacher login is accepted by Staff Portal
  it('2. normal teacher token accesses /api/dashboard/me with role teacher', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`, {
      headers: {
        Authorization: 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.user.role, 'teacher');
    assert.strictEqual(body.user.appRole, 'teacher');
    assert.strictEqual(body.user.isTeacher, true);
    assert.strictEqual(body.user.email, 'mhmwdlwany4222@gmail.com');
  });

  // 3. student login cannot enter Teacher Portal
  it('3. student token is rejected from /api/dashboard/me with 403', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`, {
      headers: {
        Authorization: 'Bearer dev-student-token'
      }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(
      body.error.toLowerCase().includes('student') || body.error.toLowerCase().includes('forbidden'),
      'Student should be rejected from teacher portal'
    );
  });

  // 4. unauthorized user cannot access /api/dashboard/*
  it('4. unauthenticated request to /api/dashboard/* is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`);
    assert.strictEqual(res.status, 401);
  });

  it('4b. invalid token to /api/dashboard/* is rejected with 401/403 (or 503 if unconfigured)', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`, {
      headers: {
        Authorization: 'Bearer invalid-token-xyz'
      }
    });
    assert.ok([401, 403, 503].includes(res.status));
  });

  // 5. inactive teacher is blocked
  it('5. inactive teacher account is blocked server-side with 403 TEACHER_INACTIVE', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`, {
      headers: {
        Authorization: 'Bearer dev-inactive-teacher-token'
      }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.diagnosticStage, 'TEACHER_INACTIVE');
  });

  // 6. no teacher signup/create-account route exists publicly
  it('6. public routes have no teacher signup or creation endpoint', () => {
    const apiSrc = fs.readFileSync(path.join(process.cwd(), 'api/index.ts'), 'utf-8');
    assert.ok(!apiSrc.includes('/api/teacher/signup'));
    assert.ok(!apiSrc.includes('/api/staff/signup'));
    assert.ok(!apiSrc.includes('/api/teacher/register'));

    const staffLoginSrc = fs.readFileSync(path.join(process.cwd(), 'src/pages/StaffLoginPage.tsx'), 'utf-8');
    const lower = staffLoginSrc.toLowerCase();
    assert.ok(!lower.includes('create account'));
    assert.ok(!lower.includes('sign up'));
    assert.ok(!lower.includes('register'));
  });

  // 7. client-supplied role cannot elevate a normal account
  it('7. student onboarding rejects role=super_admin with 422', async () => {
    const res = await fetch(`${baseUrl}/api/student/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-student-token'
      },
      body: JSON.stringify({
        name: 'Attacker Student',
        role: 'super_admin'
      })
    });
    assert.strictEqual(res.status, 422);
  });

  it('7b. student profile update rejects role modification with 422', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-student-token'
      },
      body: JSON.stringify({
        role: 'super_admin'
      })
    });
    assert.strictEqual(res.status, 422);
  });

  // 8. teacher role does not gain super_admin-only endpoints
  it('8. teacher token is rejected from /api/dashboard/payments with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/payments`, {
      headers: {
        Authorization: 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('super admin'));
    assert.strictEqual(body.diagnosticStage, 'SUPER_ADMIN_REQUIRED');
  });

  it('8b. teacher token is rejected from /api/dashboard/leads with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/leads`, {
      headers: {
        Authorization: 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('super admin'));
    assert.strictEqual(body.diagnosticStage, 'SUPER_ADMIN_REQUIRED');
  });

  it('8c. teacher token is rejected from /api/dashboard/admin/teachers with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/admin/teachers`, {
      headers: {
        Authorization: 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('super admin'));
    assert.strictEqual(body.diagnosticStage, 'SUPER_ADMIN_REQUIRED');
  });

  it('8d. teacher token is rejected from /api/dashboard/intakes/123/review with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/intakes/123/review`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer dev-teacher-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'approve' })
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('super admin'));
  });

  // 9. super_admin retains teacher workspace access and admin endpoints
  it('9. super_admin accesses /api/dashboard/payments with 200', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/payments`, {
      headers: {
        Authorization: 'Bearer dev-super-admin-token'
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.payments));
  });

  it('9b. super_admin accesses /api/dashboard/leads with 200', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/leads`, {
      headers: {
        Authorization: 'Bearer dev-super-admin-token'
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.leads));
  });

  it('9c. super_admin accesses /api/dashboard/admin/teachers with 200', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/admin/teachers`, {
      headers: {
        Authorization: 'Bearer dev-super-admin-token'
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.teachers));
    assert.strictEqual(body.teachers.length, 2);
  });

  it('9d. super_admin accesses normal teacher operational endpoint /api/dashboard/me with 200', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`, {
      headers: {
        Authorization: 'Bearer dev-super-admin-token'
      }
    });
    assert.strictEqual(res.status, 200);
  });

  it('9e. super_admin accesses teaching operations endpoint /api/dashboard/upcoming with 200', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/upcoming`, {
      headers: {
        Authorization: 'Bearer dev-super-admin-token'
      }
    });
    // In dev without supabase it may return 200 or 503, but not 401/403 auth error
    assert.ok(![401, 403].includes(res.status), 'super_admin must not be rejected with auth error');
  });

  // 10. Exactly one production teacher_accounts row is super_admin and exactly one is teacher
  it('10. Migration assigns mahmoudelwany98@gmail.com as super_admin and mhmwdlwany4222@gmail.com as teacher', () => {
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20261004000000_teacher_role_model_finalization.sql'
    );
    assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Verify canonical account roles in migration
    assert.ok(
      sql.includes("'mahmoudelwany98@gmail.com', 'super_admin'"),
      'mahmoudelwany98@gmail.com must be super_admin'
    );
    assert.ok(
      sql.includes("'mhmwdlwany4222@gmail.com', 'teacher'"),
      'mhmwdlwany4222@gmail.com must be teacher'
    );
    assert.ok(
      sql.includes("role IN ('teacher', 'super_admin')"),
      'Role check constraint must enforce teacher or super_admin'
    );
  });
});
