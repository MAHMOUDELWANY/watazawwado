import test from 'node:test';
import assert from 'node:assert';
import { stripPaymentFields } from '../api/index';
import { renderStudentBookingConfirmation, renderTeacherNotification } from '../server/notifications/emailTemplates';

// RULES.md §1: a teacher's dashboard never receives money fields.
test('stripPaymentFields removes every payment field, deeply', () => {
  const out = stripPaymentFields({
    booking: { id: 'b1', contact_name: 'Yusuf', fee_amount_usd: 9, payment_status: 'paid', payment_plan: 'pay_now', status: 'confirmed' },
    summary: { total_bookings: 3, unpaid_upcoming_count: 1, pending_payments_count: 2 },
    payments: [{ amount: 9 }],
    list: [{ price_paid: 34, currency: 'USD', name: 'x' }]
  });
  assert.deepStrictEqual(out, {
    booking: { id: 'b1', contact_name: 'Yusuf', status: 'confirmed' },
    summary: { total_bookings: 3 },
    list: [{ name: 'x' }]
  });
});

// RULES.md §6: one language per email, English by default.
test('emails render in a single language, English by default', () => {
  const base = { learnerName: 'Yusuf', serviceName: 'Tajweed', date: 'Mon', timeDisplay: '5 PM', timezone: 'Europe/London', durationMinutes: 60, bookingRef: 'MHM-1' };
  const en = renderStudentBookingConfirmation(base);
  assert.match(en.subject, /^Lesson confirmed/);
  assert.ok(!/[؀-ۿ]{3}/.test(en.html.replace(/وتزودوا/g, '')), 'no Arabic text in the English email');
  const ar = renderStudentBookingConfirmation({ ...base, lang: 'ar' });
  assert.match(ar.subject, /تم تأكيد حصتك/);
  assert.match(ar.html, /dir="rtl"/);
  const staff = renderTeacherNotification({ eventType: 'new_booking', summary: 'Yusuf booked a lesson.', details: [['Student', 'الطالب', 'Yusuf']] });
  assert.match(staff.subject, /New lesson booked/);
});
