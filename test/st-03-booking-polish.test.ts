import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { bookingErrorText, OFFLINE_MESSAGE } from '../src/components/booking/bookingErrors.js';

describe('ST-03 booking flow polish (presentation only)', () => {
  it('network failures read as a plain internet problem, not a database outage', () => {
    assert.strictEqual(bookingErrorText('Failed to fetch', true), OFFLINE_MESSAGE);
    assert.strictEqual(bookingErrorText(OFFLINE_MESSAGE, false), 'مقدرناش نوصل للموقع. اتأكد من الإنترنت وحاول تاني.');
    const repo = fs.readFileSync('src/lib/bookingRepository.ts', 'utf8');
    assert.ok(!repo.includes('Database service is currently unavailable'));
    assert.ok(!repo.includes('Invalid date or time scheduling: ${'), 'no raw exception text shown to families');
  });

  it('Arabic users see Arabic for known booking errors, and a plain Arabic sentence otherwise', () => {
    assert.strictEqual(bookingErrorText('This time slot is no longer available. Please select another slot.', false), 'الميعاد ده مبقاش متاح. اختار ميعاد تاني.');
    assert.strictEqual(bookingErrorText('A valid contact email address is required.', false), 'محتاجين إيميل صحيح نتواصل معاك عليه.');
    assert.ok(bookingErrorText('Something odd XYZ', false).startsWith('تعذر إتمام الحجز دلوقتي.'));
    assert.ok(bookingErrorText('Something odd XYZ', false).includes('XYZ'), 'the detail stays for support');
    assert.strictEqual(bookingErrorText('رسالة عربية من السيرفر', false), 'رسالة عربية من السيرفر');
    assert.strictEqual(bookingErrorText('Exact server text', true), 'Exact server text');
    assert.ok(bookingErrorText('', false).length > 0);
  });

  it('a double tap cannot submit the booking twice', () => {
    const flow = fs.readFileSync('src/components/booking/BookingFlow.tsx', 'utf8');
    const fn = flow.slice(flow.indexOf('const handleSubmitBooking'), flow.indexOf('const handlePaymentSuccess'));
    assert.ok(fn.indexOf('if (submittingRef.current) return;') < fn.indexOf('bookingService.submitBooking('));
    assert.ok(fn.includes('submittingRef.current = false;'), 'released after the request, success or failure');
  });

  it('times always carry the time zone and the confirmation speaks Arabic', () => {
    assert.ok(fs.readFileSync('src/components/booking/StepReviewSummary.tsx', 'utf8').includes('{tzName}'));
    assert.ok(fs.readFileSync('src/components/booking/BookingConfirmation.tsx', 'utf8').includes("{isEn ? 'min' : 'دقيقة'}"));
  });
});
