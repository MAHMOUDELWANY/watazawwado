import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const page = fs.readFileSync('src/student/pages/StudentProfilePage.tsx', 'utf8');
const panel = (id: string) => {
  const start = page.indexOf(`{activeCategory === '${id}' && (`);
  assert.ok(start > 0, `panel ${id} exists`);
  const next = page.indexOf('{activeCategory === ', start + 10);
  return page.slice(start, next > 0 ? next : undefined);
};

describe('ST-05 profile page sections', () => {
  it('has six sections (privacy added by ST-06) and the open one lives in the URL', () => {
    assert.ok(page.includes("const CATEGORY_IDS: CategoryId[] = ['profile', 'learning', 'family', 'preferences', 'privacy', 'security'];"));
    assert.ok(page.includes("searchParams.get('tab')"));
    assert.ok(page.includes('setSearchParams(next, { replace: true })'), 'switching tabs does not flood the back button');
  });

  it('family items moved to their own section, unchanged', () => {
    const family = panel('family');
    assert.ok(family.includes('<AddChildForm isAr={isAr} onAdded={fetchProfile} />'));
    assert.ok(family.includes('linkedChildren.map('));
    assert.ok(family.includes('profile.guardian.parentWhatsapp'));
    assert.ok(!panel('learning').includes('AddChildForm'));
    // Once in the family tab, once behind the adult learner's explicit "Add a child" step (owner 2026-10-28).
    assert.strictEqual(page.split('<AddChildForm').length - 1, 2, 'family tab + adult opt-in');
  });

  it('notifications stay in preferences and sign-out in security', () => {
    assert.ok(panel('preferences').includes('<NotificationPreferences isAr={isAr} />'));
    assert.ok(/signOut|LogOut/.test(panel('security')));
  });

  it('section buttons are announced as tabs', () => {
    assert.strictEqual(page.split('role="tablist"').length - 1, 2);
    assert.strictEqual(page.split('aria-selected={isActive}').length - 1, 2);
    assert.ok(page.includes('role="tabpanel"'));
  });
});
