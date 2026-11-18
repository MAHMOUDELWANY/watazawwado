import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import express from 'express';
import { registerAttendanceRoutes } from '../server/routes/attendance.js';
import { renderStudent1hReminder, renderStudent3hReminder, renderStudentBookingConfirmation } from '../server/notifications/emailTemplates.js';
import { lessonJoin } from '../src/student/components/LessonDayCard.js';

const read = (p: string) => fs.readFileSync(p, 'utf8');
const ZOOM = 'https://us02web.zoom.us/j/123456789';
const MIN = 60_000;
const iso = (ms: number) => new Date(ms).toISOString();

describe('CL-14 /api/join/:id', () => {
  let server: http.Server;
  let base: string;
  const now = Date.now();
  // Ids: live now (both windows open), just ended (only the room is still open), not yet open, room teacher without Zoom.
  const ids = {
    live: '11111111-1111-4111-8111-111111111111',
    ended: '22222222-2222-4222-8222-222222222222',
    early: '33333333-3333-4333-8333-333333333333',
    noZoom: '44444444-4444-4444-8444-444444444444',
    zoomTeacher: '55555555-5555-4555-8555-555555555555',
  };
  const lesson = (id: string, startMs: number, extra: object = {}) => ({
    id, teacher_id: 'pilot-teacher', zoom_meeting_link: ZOOM, status: 'confirmed', duration_minutes: 30,
    scheduled_start: iso(startMs), scheduled_end: iso(startMs + 30 * MIN), ...extra,
  });
  const rows = [
    lesson(ids.live, now - 10 * MIN),
    lesson(ids.ended, now - 40 * MIN),
    lesson(ids.early, now + 12 * MIN),
    lesson(ids.noZoom, now - 10 * MIN, { zoom_meeting_link: null }),
    lesson(ids.zoomTeacher, now - 10 * MIN, { teacher_id: 'zoom-teacher' }),
  ];
  const opened: any[] = [];
  const db = {
    from(t: string) {
      let id = '';
      const b: any = {
        select: () => b,
        eq: (_c: string, v: string) => { id = v; return b; },
        maybeSingle: async () => ({ data: t === 'bookings' ? rows.find((r) => r.id === id) ?? null : null, error: null }),
        upsert: async (row: any) => { opened.push(row); return { error: null }; },
      };
      return b;
    },
  };

  before(async () => {
    const app = express();
    registerAttendanceRoutes(app, {
      getClient: () => db,
      verifyTeacherAuth: (_q: any, _s: any, next: any) => next(),
      rateLimit: (_q: any, _s: any, next: any) => next(),
      classroomEnabled: (teacherId) => teacherId === 'pilot-teacher',
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const go = async (id: string, query = '') => {
    const res = await fetch(`${base}/api/join/${id}${query}`, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0' } });
    return { status: res.status, location: res.headers.get('location') };
  };

  it('a pilot teacher: the link opens our room, and the room records the join (not the link)', async () => {
    assert.deepStrictEqual(await go(ids.live), { status: 302, location: `/student/room/${ids.live}` });
    assert.strictEqual(opened.length, 0);
  });
  it('the room path uses the room window: open 15 minutes after the end, closed until 10 minutes before', async () => {
    assert.strictEqual((await go(ids.ended)).location, `/student/room/${ids.ended}`);
    assert.strictEqual((await go(ids.early)).location, `/student/lessons?lesson=${ids.early}&join=early`);
  });
  it('the room needs no Zoom meeting', async () => {
    assert.strictEqual((await go(ids.noZoom)).location, `/student/room/${ids.noZoom}`);
  });
  it('?zoom=1 (the Task 12 fallback) and a teacher outside the pilot keep the Zoom path and its window', async () => {
    assert.strictEqual((await go(ids.live, '?zoom=1')).location, ZOOM);
    assert.strictEqual((await go(ids.zoomTeacher)).location, ZOOM);
    assert.strictEqual(opened.length, 2);
    // Zoom closes at the end of the lesson.
    assert.strictEqual((await go(ids.ended, '?zoom=1')).location, `/student/lessons?lesson=${ids.ended}&join=ended`);
  });
});

describe('CL-14 email and reminder buttons', () => {
  const base = { learnerName: 'Yusuf', serviceName: 'Quran', timeDisplay: '10:00 AM', timezone: 'Europe/London', bookingRef: 'WZ-1', zoomLink: 'https://watazawwado.academy/api/join/x' };
  it('with the room on, the button says Join on Watazawwado, in both languages; the link is unchanged', () => {
    for (const render of [renderStudent1hReminder, renderStudent3hReminder]) {
      const en = render({ ...base, classroom: true, lang: 'en' });
      const ar = render({ ...base, classroom: true, lang: 'ar' });
      assert.match(en.html, /Join on Watazawwado/);
      assert.match(ar.html, /ادخل الحصة على وتزودوا/);
      assert.doesNotMatch(en.html, /Join on Zoom/);
      assert.match(en.html, /https:\/\/watazawwado\.academy\/api\/join\/x/);
    }
    const confirm = renderStudentBookingConfirmation({ ...base, date: 'Fri', durationMinutes: 30, classroom: true, lang: 'en' });
    assert.match(confirm.html, /Join on Watazawwado/);
  });
  it('with the room off, the button still says Join on Zoom', () => {
    assert.match(renderStudent1hReminder({ ...base, lang: 'en' }).html, /Join on Zoom/);
    assert.match(renderStudent1hReminder({ ...base, lang: 'ar' }).html, /ادخل الحصة على Zoom/);
  });
  it('reminders and confirmations send the site join link and the flag when the room is on', () => {
    assert.match(read('server/notifications/reminderEngine.ts'), /classroomEnabledFor\(b\.teacher_id\)\s*\?\s*\{ zoomLink: siteJoinPath\(b\.id\), classroom: true \}/);
    assert.match(read('server/integrations/worker.ts'), /classroomEnabledFor\(booking\.teacher_id\) \? \{ zoomLink: siteJoinPath\(booking\.id\), classroom: true \}/);
    assert.match(read('server/notifications/dispatcher.ts'), /classroom: booking\.classroom/);
  });
});

describe('CL-14 site entry points', () => {
  const NOW = new Date('2026-11-20T10:40:00Z');
  const b = { id: 'b1', scheduledStart: '2026-11-20T10:00:00Z', scheduledEnd: '2026-11-20T10:30:00Z', durationMinutes: 30, status: 'confirmed', zoomMeetingLink: ZOOM };
  it('learner cards: our room with the room window when the flag is on, Zoom with its window when off', () => {
    assert.deepStrictEqual(lessonJoin({ ...b, classroom: true }, NOW), { room: true, href: '/student/room/b1', hasLink: true, state: 'open' });
    assert.deepStrictEqual(lessonJoin(b, NOW), { room: false, href: ZOOM, hasLink: true, state: 'ended' });
    assert.strictEqual(lessonJoin({ ...b, classroom: true }, new Date('2026-11-20T09:49:00Z')).state, 'early');
    assert.strictEqual(lessonJoin({ ...b, classroom: true, status: 'cancelled' }, NOW).state, 'ended');
  });
  it('the home page, the lessons page and the lesson-day card all use it', () => {
    assert.match(read('src/student/pages/StudentHomePage.tsx'), /lessonJoin\(nextBooking, now\)/);
    assert.match(read('src/student/pages/StudentLessonsPage.tsx'), /joinTarget\(b, now\)/);
    assert.match(read('src/student/components/LessonDayCard.tsx'), /const join = lessonJoin\(booking, now\)/);
  });
  it('the teacher Start button opens our room in the room window when the flag is on', () => {
    const src = read('src/dashboard/components/StartLessonButton.tsx');
    assert.match(src, /\/dashboard\/room\/\$\{encodeURIComponent\(lesson\.id\)\}/);
    assert.match(src, /room \? roomJoinState\(lesson, now\)/);
  });
  it('the teacher calendar event points at our room when the flag is on; the Zoom meeting is still made', () => {
    const sync = read('server/integrations/syncEngine.ts');
    assert.match(sync, /classroomEnabledFor\(targetTeacherId\) \? \{ location: `\$\{siteOrigin\(\)\}\/dashboard\/room\/\$\{booking\.id\}` \}/);
    assert.match(sync, /createOrProvisionZoomMeeting\(/);
    assert.match(read('server/integrations/googleCalendar.ts'), /booking\.location \? \{ location: booking\.location \}/);
  });
});
