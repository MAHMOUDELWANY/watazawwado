import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import app from '../api/index.js';

describe('Teacher/Staff Entry Security & Workspace Separation Regression Suite', () => {
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

  // (a) Teacher account attempting Student sign-in -> must not enter Student workspace as an ordinary student
  it('(a) Server rejects teacher token attempting student portal APIs with 403', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      headers: {
        Authorization: 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(
      body.error.toLowerCase().includes('teacher') || body.error.toLowerCase().includes('forbidden'),
      'Expected rejection error for teacher calling student API'
    );
  });

  it('(a) Client StudentAuthModal requires student role and prevents teacher session entry', () => {
    const modalSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/StudentAuthModal.tsx'), 'utf-8');
    assert.ok(
      modalSrc.includes("signIn(email, password, 'student')"),
      'StudentAuthModal must pass student as requiredRole to signIn'
    );
    assert.ok(
      modalSrc.includes("role === 'teacher'"),
      'StudentAuthModal must detect if teacher role is returned'
    );
    assert.ok(
      modalSrc.includes('Staff Login') || modalSrc.includes('بوابة المعلم'),
      'StudentAuthModal must instruct teacher accounts to use Staff Login portal'
    );
  });

  it('(a) StudentApp prevents teacher from being accepted as ordinary student', () => {
    const studentAppSrc = fs.readFileSync(path.join(process.cwd(), 'src/student/StudentApp.tsx'), 'utf-8');
    assert.ok(
      studentAppSrc.includes('isTeacherAuthenticated'),
      'StudentApp must check isTeacherAuthenticated'
    );
    assert.ok(
      studentAppSrc.includes("userRole !== 'student'"),
      'StudentApp must reject non-student roles from student workspace'
    );
  });

  // (b) Normal student attempting Staff Login -> rejected
  it('(b) Server rejects student token attempting teacher dashboard APIs with 403', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`, {
      headers: {
        Authorization: 'Bearer dev-student-token'
      }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(
      body.error.toLowerCase().includes('student') || body.error.toLowerCase().includes('forbidden'),
      'Expected rejection error for student calling teacher dashboard API'
    );
  });

  it('(b) Client StaffLoginPage rejects student accounts and signs them out', () => {
    const staffLoginSrc = fs.readFileSync(path.join(process.cwd(), 'src/pages/StaffLoginPage.tsx'), 'utf-8');
    assert.ok(
      staffLoginSrc.includes("signIn(cleanEmail, password, 'teacher')"),
      'StaffLoginPage must pass teacher as requiredRole to signIn'
    );
    assert.ok(
      staffLoginSrc.includes("role !== 'teacher'"),
      'StaffLoginPage must verify returned role is teacher'
    );
    assert.ok(
      staffLoginSrc.includes('signOut'),
      'StaffLoginPage must immediately sign out non-teacher accounts'
    );
  });

  // (c) Inactive teacher account attempting Staff Login -> rejected
  it('(c) Server rejects inactive teacher account token with 403 and diagnostic', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`, {
      headers: {
        Authorization: 'Bearer dev-inactive-teacher-token'
      }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(
      body.error.toLowerCase().includes('inactive'),
      'Expected inactive error message from server'
    );
    assert.strictEqual(body.diagnosticStage, 'TEACHER_INACTIVE');
  });

  it('(c) Client auth helper detects inactive teacher status and blocks access', () => {
    const authSrc = fs.readFileSync(path.join(process.cwd(), 'src/lib/auth.tsx'), 'utf-8');
    assert.ok(
      authSrc.includes('checkServerTeacherAuthDetails'),
      'auth.tsx must provide checkServerTeacherAuthDetails helper'
    );
    assert.ok(
      authSrc.includes('teacherDetails.isInactive'),
      'auth.tsx signIn must handle inactive teacher account rejection'
    );
    assert.ok(
      authSrc.includes('Your teacher account is currently inactive'),
      'auth.tsx must provide clear inactive message'
    );
  });

  // (d) Unauthorized account manually navigating to /teacher -> rejected server-side
  it('(d) Server rejects unauthenticated requests to teacher APIs with 401', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`);
    assert.strictEqual(res.status, 401);
  });

  it('(d) Client DashboardApp blocks unauthorized navigation to /teacher or /dashboard', () => {
    const dashboardAppSrc = fs.readFileSync(path.join(process.cwd(), 'src/dashboard/DashboardApp.tsx'), 'utf-8');
    assert.ok(
      dashboardAppSrc.includes('!isTeacherAuthenticated'),
      'DashboardApp must guard entire workspace with isTeacherAuthenticated'
    );
    assert.ok(
      dashboardAppSrc.includes('/staff/login'),
      'DashboardApp unauthorized view must point to /staff/login'
    );
  });

  // (e) Public visitor has no staff signup/register path
  it('(e) StaffLoginPage contains no signup, register, or account creation UI', () => {
    const staffLoginSrc = fs.readFileSync(path.join(process.cwd(), 'src/pages/StaffLoginPage.tsx'), 'utf-8');
    const lower = staffLoginSrc.toLowerCase();
    assert.ok(!lower.includes('create staff account'), 'Must not contain create staff account');
    assert.ok(!lower.includes('sign up as teacher'), 'Must not contain sign up as teacher');
    assert.ok(!lower.includes('register as teacher'), 'Must not contain register as teacher');
    assert.ok(!lower.includes('create teacher account'), 'Must not contain create teacher account');
  });

  it('(e) Backend has no public staff/teacher registration endpoint', () => {
    const apiSrc = fs.readFileSync(path.join(process.cwd(), 'api/index.ts'), 'utf-8');
    assert.ok(!apiSrc.includes('/api/teacher/signup'), 'Must not have /api/teacher/signup');
    assert.ok(!apiSrc.includes('/api/staff/signup'), 'Must not have /api/staff/signup');
    assert.ok(!apiSrc.includes('/api/teacher/register'), 'Must not have /api/teacher/register');
  });

  // (f) Student signup cannot assign or submit privileged Teacher/Admin role
  it('(f) POST /api/student/onboarding rejects privileged role injection with 422', async () => {
    const res = await fetch(`${baseUrl}/api/student/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-student-token'
      },
      body: JSON.stringify({
        name: 'Test Student',
        role: 'teacher'
      })
    });
    assert.strictEqual(res.status, 422);
    const body = await res.json();
    assert.ok(
      body.error.toLowerCase().includes('forbidden') || body.error.toLowerCase().includes('privileged'),
      'Must reject role assignment in student onboarding'
    );
  });

  it('(f) PATCH /api/student/me rejects role modification with 422', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-student-token'
      },
      body: JSON.stringify({
        role: 'teacher'
      })
    });
    assert.strictEqual(res.status, 422);
    const body = await res.json();
    assert.ok(
      body.error.includes("Modification of field 'role' is strictly forbidden."),
      'Must reject role modification in PATCH /api/student/me'
    );
  });

  // (g) Authorized active Teacher account can still use Staff Login successfully
  it('(g) Authorized teacher token successfully accesses /api/dashboard/me', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/me`, {
      headers: {
        Authorization: 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.user, 'Expected user object in response');
    assert.ok(
      body.user.role === 'teacher' || body.user.role === 'super_admin',
      'Role must be teacher or super_admin'
    );
    assert.strictEqual(body.user.isTeacher, true);
  });

  it('(g) Authorized teacher token passes /api/teacher-auth-diagnostic', async () => {
    const res = await fetch(`${baseUrl}/api/teacher-auth-diagnostic`, {
      headers: {
        Authorization: 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.teacherAuthorization, 'authorized');
    assert.strictEqual(body.stage, 'AUTHORIZED');
  });
});
