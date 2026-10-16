import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OTP_LENGTH,
  applyBackspace,
  applyInput,
  emptyDigits,
  isComplete,
  normalizeDigits,
  otpTransition,
  type OtpEvent,
  type OtpPhase,
} from '../src/components/auth/otpLogic';

test('code length is 6', () => {
  assert.equal(OTP_LENGTH, 6);
  assert.deepEqual(emptyDigits(), ['', '', '', '', '', '']);
});

test('normalizeDigits keeps only digits and converts Arabic/Persian numerals', () => {
  assert.equal(normalizeDigits('12 a-3'), '123');
  assert.equal(normalizeDigits('١٢٣۴۵۶'), '123456');
  assert.equal(normalizeDigits(''), '');
});

test('typing a digit fills the box and advances focus', () => {
  const r = applyInput(emptyDigits(), 2, '7');
  assert.deepEqual(r.digits, ['', '', '7', '', '', '']);
  assert.equal(r.focus, 3);
});

test('non-digit input clears the box and keeps focus', () => {
  const r = applyInput(['1', '2', '3', '', '', ''], 1, 'x');
  assert.deepEqual(r.digits, ['1', '', '3', '', '', '']);
  assert.equal(r.focus, 1);
});

test('pasting a full code fills every box from the first, whatever box has focus', () => {
  const r = applyInput(emptyDigits(), 4, 'Your code: 482 913');
  assert.deepEqual(r.digits, ['4', '8', '2', '9', '1', '3']);
  assert.equal(r.focus, 5);
  assert.ok(isComplete(r.digits));
});

test('pasting a longer string keeps the first 6 digits', () => {
  assert.deepEqual(applyInput(emptyDigits(), 0, '12345678').digits, ['1', '2', '3', '4', '5', '6']);
});

test('a short paste fills forward from the focused box without overflowing', () => {
  const r = applyInput(emptyDigits(), 4, '987');
  assert.deepEqual(r.digits, ['', '', '', '', '9', '8']);
  assert.equal(r.focus, 5);
});

test('backspace clears the current box, or steps back when empty', () => {
  assert.deepEqual(applyBackspace(['1', '2', '', '', '', ''], 1), { digits: ['1', '', '', '', '', ''], focus: 1 });
  assert.deepEqual(applyBackspace(['1', '2', '', '', '', ''], 2), { digits: ['1', '', '', '', '', ''], focus: 1 });
  assert.deepEqual(applyBackspace(emptyDigits(), 0), { digits: emptyDigits(), focus: 0 });
});

test('isComplete needs six single digits', () => {
  assert.equal(isComplete(['1', '2', '3', '4', '5', '']), false);
  assert.equal(isComplete(['1', '2', '3', '4', '5', 'a']), false);
  assert.equal(isComplete(['1', '2', '3', '4', '5', '6']), true);
});

const run = (events: OtpEvent[], from: OtpPhase = 'idle') => events.reduce(otpTransition, from);

test('happy path reaches success only after the server verified', () => {
  assert.equal(run(['submit', 'lifted', 'verified', 'converged']), 'success');
});

test('success cannot be reached without a verified result', () => {
  assert.equal(run(['submit', 'lifted', 'converged']), 'orbit');
  assert.equal(run(['verified', 'converged']), 'idle');
  assert.equal(run(['submit', 'verified']), 'lift');
});

test('rejection goes to error, then editing or resubmitting recovers', () => {
  assert.equal(run(['submit', 'lifted', 'rejected']), 'error');
  assert.equal(run(['edit'], 'error'), 'idle');
  assert.equal(run(['submit'], 'error'), 'lift');
});

test('success is terminal', () => {
  assert.equal(run(['rejected', 'edit', 'submit'], 'success'), 'success');
});
