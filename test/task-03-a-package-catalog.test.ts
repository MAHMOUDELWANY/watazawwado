import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('Workflow 03-A Package Catalog API exists', async (t) => {
  const indexTs = fs.readFileSync('api/index.ts', 'utf8');
  assert.ok(indexTs.includes('/api/packages'), '/api/packages endpoint is implemented');
  assert.ok(indexTs.includes("from('package_catalog')"), 'Reads from package_catalog table');
  assert.ok(indexTs.includes("eq('is_active', true)"), 'Only fetches active packages');

  const typesTs = fs.readFileSync('src/booking/types.ts', 'utf8');
  assert.ok(typesTs.includes('PackageCatalogEntry'), 'Types include PackageCatalogEntry');
  assert.ok(typesTs.includes('selectedPackageId'), 'BookingFormData includes selectedPackageId');
});

test('Workflow 03-A UI Integration', async (t) => {
  const stepLesson = fs.readFileSync('src/components/booking/StepLessonType.tsx', 'utf8');
  assert.ok(stepLesson.includes("fetch('/api/packages')"), 'UI fetches packages dynamically');
  assert.ok(stepLesson.includes("Single Lesson"), 'Displays Single Lesson option');

  const stepReview = fs.readFileSync('src/components/booking/StepReviewSummary.tsx', 'utf8');
  assert.ok(stepReview.includes('selectedPackageId'), 'Review summary handles selectedPackageId');
});
