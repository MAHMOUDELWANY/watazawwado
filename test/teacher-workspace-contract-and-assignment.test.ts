import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('Teacher Workspace Contract & Production Alignment Tests', () => {
  const rootDir = process.cwd();

  it('A1: Canonical migration exists and creates teacher workspace foundation', () => {
    const migrationPath = join(rootDir, 'supabase/migrations/20261005000000_teacher_workspace_foundation.sql');
    assert.ok(existsSync(migrationPath), 'Migration 20261005000000_teacher_workspace_foundation.sql must exist');
    const sql = readFileSync(migrationPath, 'utf8');

    // Canonical student columns
    assert.ok(sql.includes('students') && sql.includes('gender'), 'Migration must add students.gender');
    assert.ok(sql.includes('students') && sql.includes('teacher_gender_preference'), 'Migration must add students.teacher_gender_preference');
    assert.ok(!sql.includes('preferred_teacher_gender'), 'Must NOT introduce duplicate preferred_teacher_gender column');

    // Canonical teacher_accounts columns
    assert.ok(sql.includes('teacher_accounts') && sql.includes('display_name'), 'Migration must add teacher_accounts.display_name');
    assert.ok(sql.includes('teacher_accounts') && sql.includes('gender'), 'Migration must add teacher_accounts.gender');

    // Constraints and checks
    assert.ok(sql.includes('students_gender_check'), 'Migration must have students_gender_check');
    assert.ok(sql.includes('students_teacher_gender_pref_check'), 'Migration must have teacher gender preference check');
    assert.ok(sql.includes('teacher_accounts_gender_check'), 'Migration must have teacher_accounts_gender_check');

    // Indexes
    assert.ok(sql.includes('idx_students_assigned_teacher_id'), 'Migration must index assigned_teacher_id');
    assert.ok(sql.includes('idx_teacher_accounts_role_active'), 'Migration must index teacher_accounts role and active state');
  });

  it('A2: No duplicate or conflicting migration files exist', () => {
    const duplicate1 = join(rootDir, 'supabase/migrations/20261005000000_student_gender_and_teacher_preference.sql');
    const duplicate2 = join(rootDir, 'supabase/migrations/20261005000000_student_teacher_assignment_and_gender_preference.sql');
    const duplicate3 = join(rootDir, 'supabase/migrations/20261005000000_teacher_workspace_and_student_assignment.sql');

    assert.ok(!existsSync(duplicate1), 'Duplicate migration 1 must not exist');
    assert.ok(!existsSync(duplicate2), 'Duplicate migration 2 must not exist');
    assert.ok(!existsSync(duplicate3), 'Duplicate migration 3 must not exist');
  });

  it('B1: No email substring heuristics for teacher identity in server codebase', () => {
    const apiCode = readFileSync(join(rootDir, 'api/index.ts'), 'utf8');
    assert.ok(!apiCode.includes("includes('afnan')"), 'api/index.ts must not contain afnan heuristics');
    assert.ok(!apiCode.includes('includes("afnan")'), 'api/index.ts must not contain afnan heuristics');
  });

  it('B2: Single canonical teacher name convention in teacher_accounts and types', () => {
    const typesCode = readFileSync(join(rootDir, 'src/dashboard/types.ts'), 'utf8');
    assert.ok(typesCode.includes('display_name'), 'Dashboard types must include display_name');
    assert.ok(typesCode.includes('teacher_gender_preference'), 'Dashboard types must include teacher_gender_preference');
    assert.ok(!typesCode.includes('preferred_teacher_gender'), 'Dashboard types must not use duplicate preferred_teacher_gender');
  });

  it('C1: Teacher assignment endpoint enforces UUID and resolves server-authoritative teacher metadata', () => {
    const apiCode = readFileSync(join(rootDir, 'api/index.ts'), 'utf8');

    // Endpoint route and authorization
    assert.ok(
      apiCode.includes('/api/dashboard/admin/students/:id/assign-teacher'),
      'Endpoint /api/dashboard/admin/students/:id/assign-teacher must exist'
    );
    assert.ok(
      apiCode.includes('verifyTeacherAuth') && apiCode.includes('requireSuperAdmin'),
      'Endpoint must require super_admin authorization'
    );

    // Metadata resolution function
    assert.ok(apiCode.includes('resolveTeacherMetadata'), 'Must use resolveTeacherMetadata helper');
    assert.ok(apiCode.includes('is_active'), 'Must validate teacher is_active');
    assert.ok(
      apiCode.includes('teacher_accounts') && apiCode.includes('display_name') && apiCode.includes('gender'),
      'Must load canonical metadata from teacher_accounts'
    );
  });

  it('C2: Role scoping is strictly enforced across teacher and admin endpoints', () => {
    const apiCode = readFileSync(join(rootDir, 'api/index.ts'), 'utf8');

    // Scoped endpoints for teacher vs super_admin
    assert.ok(apiCode.includes("req.teacherUser?.role !== 'super_admin'"), 'Must check super_admin vs standard teacher');
    assert.ok(apiCode.includes('assigned_teacher_id'), 'Teacher queries must scope to assigned_teacher_id');
    assert.ok(apiCode.includes('teacher_id'), 'Booking queries must scope to teacher_id');

    // Admin-only endpoints require requireSuperAdmin
    assert.ok(apiCode.includes("app.get('/api/dashboard/admin/teachers', verifyTeacherAuth, requireSuperAdmin"), 'Teachers directory must be Super Admin only');
    assert.ok(apiCode.includes("app.patch('/api/dashboard/admin/teachers/:email/toggle-active', verifyTeacherAuth, requireSuperAdmin"), 'Toggle active must be Super Admin only');
  });

  it('D1: Student self-profile and booking contract remains intact', () => {
    const apiCode = readFileSync(join(rootDir, 'api/index.ts'), 'utf8');
    assert.ok(apiCode.includes("app.get('/api/student/me'"), 'GET /api/student/me must exist');
    assert.ok(apiCode.includes("app.patch('/api/student/me'"), 'PATCH /api/student/me must exist');
    assert.ok(apiCode.includes("app.get('/api/student/bookings'"), 'GET /api/student/bookings must exist');
    assert.ok(apiCode.includes('assignedTeacherName'), 'Student response includes assignedTeacherName derived from metadata');
  });
});
