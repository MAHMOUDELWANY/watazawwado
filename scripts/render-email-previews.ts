/** Writes sample emails to docs/email-previews (run: npx tsx scripts/render-email-previews.ts). */
import { writeFileSync } from 'node:fs';
import {
  renderStudentBookingConfirmation, renderTeacherNotification, renderWelcomeEmail, renderSupabaseAuthTemplate,
} from '../server/notifications/emailTemplates';

const out = (name: string, html: string) => writeFileSync(`docs/email-previews/${name}.html`, html);
const booking = {
  learnerName: 'Maryam', serviceName: 'Tajweed', date: '2026-10-20', timeDisplay: '18:00', timezone: 'Europe/London',
  durationMinutes: 45, bookingRef: 'WZ-4821', zoomLink: 'https://zoom.us/j/123', feeAmount: 6.75, currency: 'USD',
  termsVersion: '2026-10-15.2', termsAcceptedAt: '2026-10-16',
};
out('booking-confirmed', renderStudentBookingConfirmation(booking).html);
out('booking-confirmed-ar', renderStudentBookingConfirmation({ ...booking, learnerName: 'مريم', serviceName: 'التجويد', lang: 'ar' }).html);
out('teacher-alert', renderTeacherNotification({ eventType: 'new_trial', summary: 'Yusuf booked a free trial.', details: [['Student', 'الطالب', 'Yusuf'], ['When', 'الموعد', '2026-10-20 18:00']] }).html);
out('welcome-ar', renderWelcomeEmail({ name: 'مريم', teacherName: 'الأستاذة أفنان', lang: 'ar' }).html);
out('welcome-family-en', renderWelcomeEmail({ name: 'Aisha', teacherName: 'Ustadh Mahmoud', isFamily: true, childNames: ['Omar', 'Sara'] }).html);
out('confirm-signup-supabase', renderSupabaseAuthTemplate('confirm').html);
out('reset-password-supabase', renderSupabaseAuthTemplate('reset').html);
out('invite-user-supabase', renderSupabaseAuthTemplate('invite').html);
