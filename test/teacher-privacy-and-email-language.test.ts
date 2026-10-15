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

// Legal review 2026-10-15: the confirmation repeats the accepted terms and, for a paid single lesson, the 14-day withdrawal notice.
test('booking confirmation states the accepted terms and the withdrawal notice', () => {
  const base = { learnerName: 'Yusuf', serviceName: 'Tajweed', date: 'Mon', timeDisplay: '5 PM', timezone: 'Europe/London', durationMinutes: 60, bookingRef: 'MHM-1', termsVersion: '2026-10-15.2', termsAcceptedAt: '2026-10-15T10:00:00Z' };
  const paid = renderStudentBookingConfirmation({ ...base, feeAmount: 9 });
  assert.match(paid.html, /terms version 2026-10-15\.2, which you accepted on 2026-10-15/);
  assert.match(paid.html, /withdraw within 14 days/);
  const pkg = renderStudentBookingConfirmation({ ...base, feeAmount: 9, isPackageLesson: true });
  assert.match(pkg.html, /terms version 2026-10-15\.2/);
  assert.ok(!/withdraw within 14 days/.test(pkg.html), 'package lessons were covered at purchase');
  const old = renderStudentBookingConfirmation({ ...base, termsVersion: '2026-10-15', feeAmount: 9 });
  assert.ok(!/withdraw within 14 days/.test(old.html), 'older bookings had no early-start request');
});

// Each team mailbox sends its own emails; if Brevo rejects that sender, the email still goes out from the default one.
test('team mailbox sender falls back to the default sender on a 400', async () => {
  const { sendEmail } = await import('../server/notifications/emailService');
  const env = { ...process.env };
  const realFetch = globalThis.fetch;
  process.env.BREVO_API_KEY = 'xkeysib-test';
  delete process.env.NOTIFICATION_FROM_EMAIL;
  const bodies: any[] = [];
  globalThis.fetch = (async (_url: string, opts: any) => {
    const body = JSON.parse(opts.body);
    bodies.push(body);
    return body.sender.email === 'finance@watazawwado.academy'
      ? new Response(JSON.stringify({ code: 'invalid_parameter' }), { status: 400 })
      : new Response(JSON.stringify({ messageId: 'm1' }), { status: 201 });
  }) as any;
  try {
    const res = await sendEmail({ to: 'a@example.com', subject: 's', html: '<p>x</p>', text: 'x', from: 'finance' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(bodies.length, 2);
    assert.strictEqual(bodies[0].replyTo.email, 'finance@watazawwado.academy');
    assert.strictEqual(bodies[1].sender.email, 'support@watazawwado.academy');
    assert.strictEqual(bodies[1].replyTo.email, 'finance@watazawwado.academy');
  } finally {
    globalThis.fetch = realFetch;
    process.env = env;
  }
});
