import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p: string) => fs.readFileSync(p, 'utf8');

describe('Booking after the owner\'s phone review (2026-10-28)', () => {
  const flow = read('src/components/booking/BookingFlow.tsx');

  it('signed-in students are not asked for contact details again; learner, subject and level come from the profile', () => {
    assert.match(flow, /isAuthenticatedStudent \? \(\s*<StepLearner/);
    assert.match(flow, /showStep\(3\) && \(!isAuthenticatedStudent \|\| needsContactDetails\)/);
    const learner = read('src/components/booking/StepLearner.tsx');
    assert.match(learner, /serviceIdForInterest/);
    assert.match(learner, /\/student\/account/);
    assert.doesNotMatch(learner, /whatsapp: e\.target|type="email"/);
  });

  it('one Continue per screen, and the error sits next to it and scrolls into view', () => {
    assert.doesNotMatch(read('src/components/booking/StepLearner.tsx'), /Yes, continue/);
    assert.match(flow, /\{errorBox\}\s*<div className="flex flex-col-reverse/);
    assert.match(flow, /scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/);
  });

  it('the header has no WhatsApp badge or lesson-type pill', () => {
    const header = read('src/components/booking/BookingHeader.tsx');
    assert.doesNotMatch(header, /buildWhatsAppUrl|Regular 1-on-1/);
  });

  it('a released hold is dropped by the open booking flow', () => {
    assert.match(read('src/student/components/PendingPaymentCard.tsx'), /watazawwado:hold-released/);
    assert.match(flow, /addEventListener\('watazawwado:hold-released'/);
  });

  it('the checkout is one panel with one close button', () => {
    const modal = read('src/components/payment/InstantCheckoutModal.tsx');
    assert.doesNotMatch(modal, /glass-dialog/);
    assert.match(modal, /title=\{isAr \? 'الدفع' : 'Payment'\}/);
  });
});
