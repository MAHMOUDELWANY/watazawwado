import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { summarizeAttendance } from '../server/routes/attendance.js';
import { bookingErrorText } from '../src/components/booking/bookingErrors.js';

// Owner review 2026-11-07, part 2 (items 23-36).
describe('Owner review part 2', () => {
  it('attendance: who came, from the site link and Zoom events', () => {
    assert.deepStrictEqual(summarizeAttendance([]), { teacher: false, student: false });
    assert.deepStrictEqual(summarizeAttendance([{ event: 'link_opened', role: 'student' }]), { teacher: false, student: true });
    assert.deepStrictEqual(summarizeAttendance([{ event: 'meeting_started', role: 'unknown' }, { event: 'left', role: 'student' }]), { teacher: true, student: false });
    assert.deepStrictEqual(summarizeAttendance([{ event: 'waiting_room_joined', role: 'student' }, { event: 'joined', role: 'teacher' }]), { teacher: true, student: true });
  });

  it('trial errors are translated by what they say, not all as "one trial per student"', () => {
    assert.match(bookingErrorText('Your last free trial was cancelled or missed, so you can book a new one after 09 Nov 2026, 10:00 (UTC).', false), /٤٨ ساعة/);
    assert.match(bookingErrorText('This account has used up its free trials. You are always welcome to book a regular lesson.', false), /كل الحصص التجريبية/);
    assert.match(bookingErrorText('You already have a free trial on this account. Each student gets one free trial', false), /مرة واحدة لكل طالب/);
  });

  it('teacher lesson links come from zoom_meeting_link; teacher emails and calendar point to Start', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.ok(api.includes('const lessonJoinUrl = (b: any)'));
    assert.ok(!api.includes('zoom_meeting_link: b.zoom_host_url || b.zoom_join_url || null'));
    assert.ok(fs.readFileSync('server/notifications/dispatcher.ts', 'utf8').includes("['Start the lesson', 'ابدأ الحصة', 'https://watazawwado.academy/dashboard/today']"));
    assert.ok(fs.readFileSync('server/integrations/googleCalendar.ts', 'utf8').includes('https://watazawwado.academy/dashboard/today'));
  });

  it('survey only after a lesson recorded as held; teachers may report their own absence only from lesson time', () => {
    assert.ok(fs.readFileSync('server/routes/feedback.ts', 'utf8').includes("const RATEABLE_STATUSES = ['completed'];"));
    const payroll = fs.readFileSync('server/routes/payroll.ts', 'utf8');
    assert.ok(payroll.includes("reason === 'teacher_absent' && new Date(booking.scheduled_start).getTime() > Date.now() + 15 * 60 * 1000"));
  });

  it('referral: the friend must pay at least the reward; a balance-paid lesson cancels back to the balance', () => {
    const growth = fs.readFileSync('server/routes/growth.ts', 'utf8');
    assert.strictEqual(growth.split(".gte('amount', minPaid)").length - 1, 2);
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.ok(api.includes("if (paidFromBalance) await reverseCheckoutDiscount(supabase, 'booking', booking.id);"));
  });

  it('confirm dialogs sit above other windows', () => {
    assert.ok(fs.readFileSync('src/components/ui/Feedback.tsx', 'utf8').includes('layerClassName="z-[80]"'));
  });
});
