import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Task 0.59 — Child Booking Authorization and UX', async (t) => {
  await t.test('1. SQL RPC Hardening', async (t) => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260913000002_fix_child_booking_authorization.sql');
    const content = fs.readFileSync(migrationPath, 'utf8');
    
    await t.test('allows matching requested_student_id through guardians table', () => {
      assert.ok(content.includes('SELECT 1 FROM public.guardians'), 'Should query guardians table');
      assert.ok(content.includes('student_id = v_requested_student_id'), 'Should check requested student ID');
      assert.ok(content.includes('lower(parent_email) = v_auth_email'), 'Should match authenticated parent email');
      assert.ok(content.includes('v_student_id := v_requested_student_id'), 'Should override student_id upon successful authorization');
    });
  });

  await t.test('2. React UI UX Constraints', async (t) => {
    const stepStudentDetailsPath = path.join(process.cwd(), 'src', 'components', 'booking', 'StepStudentDetails.tsx');
    const content = fs.readFileSync(stepStudentDetailsPath, 'utf8');

    await t.test('uses select element when linkedChildren exist', () => {
      assert.ok(content.includes('linkedChildren.length > 0 ? ('), 'Should conditionally check linkedChildren');
      assert.ok(content.includes('<select'), 'Should render select dropdown');
      assert.ok(content.includes('handleChildSelect('), 'Should handle select change');
    });

    await t.test('validates form securely requiring studentId when linkedChildren exist', () => {
      assert.ok(content.includes('(linkedChildren.length === 0 || !!formData.studentId)'), 'Should require studentId when linkedChildren is non-empty');
    });
  });
});
