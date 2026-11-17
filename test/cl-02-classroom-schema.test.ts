import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const FILE = 'supabase/migrations/20261117000000_classroom_release_1.sql';
const sql = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';

const NEW_TABLES = [
  'lesson_room_state',
  'lesson_timeline_events',
  'lesson_quality',
  'teacher_late_reasons',
  'classroom_incidents',
  'admin_observations',
];

describe('CL-02 classroom schema', () => {
  it('the migration file exists', () => {
    assert.ok(sql.length > 0, `${FILE} is missing`);
  });

  for (const t of NEW_TABLES) {
    it(`${t}: created, RLS on, closed to anon and authenticated`, () => {
      assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${t}\\b`));
      assert.match(sql, new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY`));
      assert.match(sql, new RegExp(`REVOKE ALL ON TABLE public\\.${t} FROM anon, authenticated`));
      assert.doesNotMatch(sql, new RegExp(`CREATE POLICY[^;]*ON public\\.${t}\\b`), 'service-role only: no policies');
    });
  }

  it('widens lesson_attendance_events for the room and observers', () => {
    const source = sql.match(/lesson_attendance_events_source_check CHECK \(([^;]*)\)/)?.[1] ?? '';
    const event = sql.match(/lesson_attendance_events_event_check CHECK \(([^;]*)\)/)?.[1] ?? '';
    const role = sql.match(/lesson_attendance_events_role_check CHECK \(([^;]*)\)/)?.[1] ?? '';
    for (const v of ["'site'", "'zoom'", "'room'"]) assert.ok(source.includes(v), `source keeps ${v}`);
    for (const v of ["'link_opened'", "'waiting_room_joined'", "'room_joined'", "'room_left'", "'room_ended'"]) {
      assert.ok(event.includes(v), `event keeps ${v}`);
    }
    for (const v of ["'teacher'", "'student'", "'unknown'", "'observer'"]) assert.ok(role.includes(v), `role keeps ${v}`);
    assert.match(sql, /DROP CONSTRAINT IF EXISTS lesson_attendance_events_source_check/);
  });

  it('timeline types are exactly the Task 7 list, and payload is capped at 16 kB', () => {
    const m = sql.match(/type TEXT NOT NULL CHECK \(type IN \(([^)]*)\)\)/);
    assert.ok(m, 'timeline type check present');
    const types = m![1].split(',').map(s => s.trim().replace(/'/g, ''));
    assert.deepStrictEqual(types, ['slide', 'board', 'pdf', 'reaction', 'focus', 'quality', 'layout', 'end']);
    assert.match(sql, /octet_length\(payload::text\) <= 16384/);
    assert.match(sql, /ON public\.lesson_timeline_events \(booking_id, occurred_at\)/);
  });

  it('quality is one row per side, late reasons one per booking with a 10–2000 char reason', () => {
    assert.match(sql, /UNIQUE \(booking_id, side\)/);
    assert.match(sql, /booking_id UUID NOT NULL UNIQUE REFERENCES public\.bookings/);
    assert.match(sql, /char_length\(reason\) BETWEEN 10 AND 2000/);
    assert.match(sql, /'pending', 'sent', 'excused', 'deducted'/);
    assert.match(sql, /'connect_timeout', 'ice_failed', 'engine_error', 'provider_error'/);
  });
});
