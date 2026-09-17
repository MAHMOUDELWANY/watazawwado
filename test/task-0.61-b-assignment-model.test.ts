import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const migrationPath = path.join(rootDir, 'supabase/migrations/20260917000001_student_teacher_assignment_model.sql');

describe('Task 0.61-B-X: Student -> Teacher assignment model', () => {
  it('adds the authoritative assigned_teacher_id field to students', () => {
    assert.ok(fs.existsSync(migrationPath), 'Migration should exist');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    assert.ok(sql.includes('ADD COLUMN IF NOT EXISTS assigned_teacher_id UUID'), 'Migration must add assigned_teacher_id to students');
    assert.ok(sql.includes('REFERENCES auth.users(id)'), 'assigned_teacher_id must reference canonical auth.users identity');
    assert.ok(sql.includes('idx_students_assigned_teacher_id'), 'Migration should index the assigned_teacher_id lookup');
  });

  it('resolves authenticated student bookings from assigned_teacher_id instead of calendar connection count', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    assert.ok(sql.includes('WHERE auth_user_id = auth.uid()'), 'Student lookup must remain auth.uid() based');
    assert.ok(sql.includes('SELECT assigned_teacher_id INTO v_assigned_teacher_id'), 'Student branch must resolve assigned_teacher_id');
    assert.ok(sql.includes('Authenticated student is not assigned to a teacher.'), 'Student branch must fail closed when assignment is missing');
    assert.ok(sql.includes('SELECT 1\n            FROM public.teacher_accounts ta'), 'Assignment validation must require active teacher authorization');
  });

  it('keeps teacher and guest flows separate and fail-closed for unassigned students', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    assert.ok(sql.includes('Authenticated student is not assigned to a teacher.'), 'Unassigned student must fail closed with clear error');
    assert.ok(sql.includes('auth.uid() IS NOT NULL'), 'Teacher and student flows must still evaluate auth.uid()');
    assert.ok(sql.includes('v_student_id := NULL;'), 'Guest path continues to allow NULL student_id for unauthenticated guests');
  });
});
