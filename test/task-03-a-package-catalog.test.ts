import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('Workflow 03-A Package Catalog API exists and fails closed safely', async (t) => {
  const indexTs = fs.readFileSync('api/index.ts', 'utf8');

  // Verify that it doesn't return fake mock data with hardcoded prices
  assert.ok(!indexTs.includes('Weekly Boost Package'), 'Must NOT invent fake packages');
  assert.ok(!indexTs.includes('price_amount: 25'), 'Must NOT invent fake prices');

  // Verify that it returns 500 on database error
  assert.ok(indexTs.includes('res.status(500).json'), 'Must return 5xx on database error');
});

test('Workflow 03-A UI Integration Uses Accessible Patterns', async (t) => {
  const stepLesson = fs.readFileSync('src/components/booking/StepLessonType.tsx', 'utf8');
  assert.ok(stepLesson.includes('<button'), 'Must use interactive button elements');
  assert.ok(stepLesson.includes('role="radio"'), 'Must use proper accessibility roles');
  assert.ok(stepLesson.includes('focus-visible'), 'Must have focus states');
  assert.ok(stepLesson.includes('Available with checkout'), 'Must indicate package is a future purchase');

  const stepReview = fs.readFileSync('src/components/booking/StepReviewSummary.tsx', 'utf8');
  assert.ok(stepReview.includes('Package Selected') || stepReview.includes('Available for purchase at checkout'), 'Review summary correctly labels package as intent');
  assert.ok(!stepReview.includes('Amount to Pay Now'), 'Review summary should not override booking fee amount improperly');
});
