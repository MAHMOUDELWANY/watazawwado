import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { offeredHours, notesRate } from '../server/routes/teacherLoad.js';

describe('CRM-08 teacher load and quality', () => {
  it('counts weekly offered hours from active intervals, midnight included', () => {
    assert.strictEqual(offeredHours([
      { start_time: '16:00:00', end_time: '20:00:00' },
      { start_time: '22:00:00', end_time: '23:59:00' },
      { start_time: '09:00:00', end_time: '10:30:00', is_active: false }
    ]), 6);
    assert.strictEqual(offeredHours([]), 0);
  });

  it('notes rate is a share of completed lessons, unknown when there were none', () => {
    assert.strictEqual(notesRate(0, 0), null);
    assert.strictEqual(notesRate(8, 6), 75);
  });

  it('admin only, and no money anywhere in the view', () => {
    const src = fs.readFileSync('server/routes/teacherLoad.ts', 'utf8');
    assert.ok(src.includes("app.get('/api/dashboard/admin/teacher-load', deps.verifyTeacherAuth, deps.requireSuperAdmin"));
    assert.ok(!/fee_amount|price|payment|amount/i.test(src.replace(/no money/gi, '')), 'no money fields');
  });

  it('a teacher move is logged after the move succeeds', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const rpc = api.indexOf("supabase.rpc('teacher_reschedule_booking'");
    const log = api.indexOf("supabase.from('teacher_lesson_moves').insert(");
    assert.ok(rpc > 0 && log > rpc, 'logged after the RPC');
    const sql = fs.readFileSync('supabase/migrations/20261021000006_teacher_lesson_moves.sql', 'utf8');
    assert.match(sql, /REVOKE ALL ON public\.teacher_lesson_moves FROM anon, authenticated/);
  });
});
