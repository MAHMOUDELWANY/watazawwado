import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { planBooking, parseChangeRequest, sanitizeProfile, NO_FAULT } from '../server/routes/teacherChange.js';

// docs/policies/TEACHER-CHANGE.md (owner 2026-11-10)
describe('Teacher change', () => {
  const now = Date.parse('2026-11-10T12:00:00Z');
  const at = (hours: number) => new Date(now + hours * 3600e3).toISOString();
  const base = { status: 'confirmed', booking_type: 'regular', package_entitlement_id: null, payment_plan: 'pay_now', fee_amount_usd: 12 };

  it('keeps lessons starting within 3 hours with the previous teacher', () => {
    assert.strictEqual(planBooking({ ...base, scheduled_start: at(2.9) }, true, now), 'keep_soon');
    assert.strictEqual(planBooking({ ...base, scheduled_start: at(3.1) }, true, now), 'cancel_credit');
  });

  it('returns each later lesson the right way', () => {
    assert.strictEqual(planBooking({ ...base, booking_type: 'trial', scheduled_start: at(30) }, false, now), 'keep_trial');
    assert.strictEqual(planBooking({ ...base, package_entitlement_id: 'p1', scheduled_start: at(30) }, false, now), 'cancel_release');
    assert.strictEqual(planBooking({ ...base, payment_plan: 'pay_later', scheduled_start: at(30) }, false, now), 'cancel_release');
    assert.strictEqual(planBooking({ ...base, status: 'pending', scheduled_start: at(30) }, false, now), 'cancel_release');
    assert.strictEqual(planBooking({ ...base, fee_amount_usd: 0, scheduled_start: at(30) }, false, now), 'cancel_balance');
  });

  it('asks for a reason and a note; families and teachers have their own reasons', () => {
    assert.ok('error' in parseChangeRequest({ reasonType: 'times', note: '' }, 'family'));
    assert.ok('error' in parseChangeRequest({ reasonType: 'learner_attendance', note: 'often absent' }, 'family'), 'teacher-only reason');
    assert.ok('error' in parseChangeRequest({ reasonType: 'quality', note: 'late often' }, 'teacher'), 'family-only reason');
    const ok = parseChangeRequest({ reasonType: 'times', note: 'Evenings only now', handoverNote: 'x' }, 'family');
    assert.ok(!('error' in ok) && ok.handoverNote === null, 'families never write a handover note');
    assert.ok(!NO_FAULT.includes('quality'));
  });

  it('cleans the public profile', () => {
    const p = sanitizeProfile({ studies: '  Al-Azhar  ', credentials: ['Ijazah in Hafs', '', 5], experienceYears: 99, languages: ['Arabic', 'English'] });
    assert.deepStrictEqual(p, { studies: 'Al-Azhar', credentials: ['Ijazah in Hafs'], experienceYears: null, languages: ['Arabic', 'English'] });
  });

  it('families never see a request their teacher started; profiles save by exact email', () => {
    const src = fs.readFileSync('server/routes/teacherChange.ts', 'utf8');
    assert.strictEqual((src.match(/\.eq\('initiator', 'family'\)/g) || []).length, 2, 'family list and withdraw');
    assert.ok(!src.includes(".ilike('email'"), 'no LIKE match on teacher email');
  });

  it('the old chat closes and academy-cancelled credits never count toward the refund limit', () => {
    assert.ok(fs.readFileSync('server/routes/community.ts', 'utf8').includes("thread.closed_at && actor.role !== 'admin'"));
    assert.ok(fs.readFileSync('api/index.ts', 'utf8').includes('!c.metadata?.platform_cancel'));
  });
});
