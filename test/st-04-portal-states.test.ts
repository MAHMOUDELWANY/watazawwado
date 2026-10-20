import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const page = (name: string) => fs.readFileSync(`src/student/pages/${name}.tsx`, 'utf8');

describe('ST-04 loading, empty and error states across the portal', () => {
  it('every portal page that loads data has a loading state and an error state with a retry', () => {
    const pages = ['StudentHomePage', 'StudentLessonsPage', 'StudentProgressPage', 'StudentPackagesPage', 'StudentPaymentsPage',
      'StudentNotificationsPage', 'StudentOffersPage', 'StudentPlacementPage', 'StudentPlacementReportPage', 'StudentProfilePage', 'StudentCurriculumPage'];
    for (const p of pages) {
      const src = page(p);
      assert.ok(/animate-pulse|Skeleton|BrandSpinner|BrandLoader|Loader2/.test(src), `${p}: no loading state`);
      assert.ok(/ErrorState|Try again|إعادة المحاولة|حاول تاني/.test(src), `${p}: no retry on error`);
    }
  });

  it('a failed first load is an error with retry, never an empty page or an empty form', () => {
    assert.ok(page('StudentPlacementPage').includes('if (loadFailed)'));
    assert.ok(page('StudentProfilePage').includes('if (error && !profile)'));
    assert.ok(page('StudentCurriculumPage').includes('onRetry={retry}'));
    assert.ok(page('StudentPlacementReportPage').includes('<ErrorState'));
  });

  it('the offers empty state gives one next step', () => {
    const offers = page('StudentOffersPage');
    assert.ok(offers.includes('<EmptyState') && offers.includes('to="/student/guide"'));
  });
});
