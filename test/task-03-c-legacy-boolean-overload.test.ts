import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 03-C — Security: Drop Legacy Teacher Outcome Overload', () => {

  it('1. Verifies the legacy boolean overload is dropped', () => {
    const migrationPath = path.resolve('supabase/migrations/20261001000002_drop_legacy_teacher_outcome.sql');
    assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');

    const sql = fs.readFileSync(migrationPath, 'utf8');

    assert.ok(sql.includes('DROP FUNCTION IF EXISTS public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN);'), 'Must explicitly drop boolean overload');
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.teacher_record_lesson_outcome('), 'Must recreate canonical function');
    assert.ok(sql.includes('p_no_show_credit_decision TEXT DEFAULT \'returned\''), 'Must use TEXT p_no_show_credit_decision');
  });

  it('2. Verifies canonical function authorization', () => {
    const sql = fs.readFileSync(path.resolve('supabase/migrations/20261001000002_drop_legacy_teacher_outcome.sql'), 'utf8');

    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;'), 'Must revoke from PUBLIC');
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM anon;'), 'Must revoke from anon');
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM authenticated;'), 'Must revoke from authenticated');
    assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;'), 'Must grant to service_role only');
  });

  it('3. Verifies API calls use the string decision', () => {
    const apiSource = fs.readFileSync(path.resolve('api/index.ts'), 'utf8');

    assert.ok(!apiSource.includes('p_consume_package_credit'), 'API must not pass legacy boolean parameter');
    assert.ok(apiSource.includes('p_no_show_credit_decision:'), 'API must pass correct text decision');
  });

});
