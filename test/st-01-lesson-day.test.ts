import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { isLessonDay, joinState, countdownLabel, runningLateMessage, JOIN_OPENS_MIN } from '../src/student/components/LessonDayCard.js';

const at = (h: number, m = 0) => new Date(2026, 9, 21, h, m);
const iso = (d: Date) => d.toISOString();

describe('ST-01 lesson-day card', () => {
  it('shows only on the lesson\'s own day', () => {
    assert.strictEqual(isLessonDay(iso(at(18)), at(9)), true);
    assert.strictEqual(isLessonDay(iso(new Date(2026, 9, 22, 9)), at(23, 50)), false);
  });

  it('Join opens 10 minutes before and closes when the lesson ends', () => {
    const start = iso(at(18));
    const end = iso(at(18, 45));
    assert.strictEqual(JOIN_OPENS_MIN, 10);
    assert.strictEqual(joinState(start, end, at(17, 49)), 'early');
    assert.strictEqual(joinState(start, end, at(17, 50)), 'open');
    assert.strictEqual(joinState(start, end, at(18, 30)), 'open');
    assert.strictEqual(joinState(start, end, at(18, 45)), 'ended');
  });

  it('counts down in both languages', () => {
    const start = iso(at(18));
    assert.strictEqual(countdownLabel(start, false, at(15, 45)), 'in 2 h 15 min');
    assert.strictEqual(countdownLabel(start, false, at(17, 50)), 'in 10 min');
    assert.strictEqual(countdownLabel(start, true, at(16, 0)), 'بعد ساعتين');
    assert.strictEqual(countdownLabel(start, true, at(16, 50)), 'بعد ساعة و10 دقيقة');
    assert.strictEqual(countdownLabel(start, false, at(18, 5)), 'Started');
  });

  it('the running-late message goes to the team with the booking reference', () => {
    const en = runningLateMessage('WT-12', 'Yusuf', false);
    assert.ok(en.includes('WT-12') && en.includes('Yusuf') && en.includes('running a few minutes late'));
    assert.ok(runningLateMessage(null, null, true).startsWith('السلام عليكم'));
  });

  it('home leads with it on lesson day, and the API sends the teacher name and shared next steps only', () => {
    assert.ok(fs.readFileSync('src/student/pages/StudentHomePage.tsx', 'utf8').includes('<LessonDayCard booking={nextBooking}'));
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const startAt = api.indexOf("app.get('/api/student/bookings'");
    const route = api.slice(startAt, api.indexOf('\napp.', startAt + 10));
    assert.ok(route.includes(".select('student_id, next_steps, created_at')"), 'reads next_steps only');
    assert.ok(!route.includes('private_notes'), 'never private teacher notes');
    assert.ok(route.includes('prepareNote:') && route.includes('teacherName:'));
  });
});
