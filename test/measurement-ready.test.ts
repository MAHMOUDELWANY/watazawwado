import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { PUBLIC_PAGES } from '../src/data/seo.js';

const read = (p: string) => fs.readFileSync(p, 'utf8');

describe('ready to measure content (2026-10-20 external research review)', () => {
  it('homepage counts the 8 bookable subjects (RULES.md §2b)', () => {
    const home = read('src/components/public/homepage/PublicHomepage.tsx');
    assert.ok(home.includes("'8 subjects, your own teacher.'") && home.includes('٨ مواد'));
    assert.ok(!home.includes('14 subjects'));
  });

  it('pricing and the booking summary use current subjects, no retired ones or stale copy', () => {
    const pricing = read('src/components/public/pricing/PricingPage.tsx');
    assert.ok(pricing.includes('the Zad Path') && pricing.includes('مسار الأثر') && pricing.includes('$9 an hour'));
    assert.ok(!pricing.includes('العلوم الشرعية') && !pricing.includes('Islamic studies'));
    const review = read('src/components/booking/StepReviewSummary.tsx');
    for (const stale of ['IELTS', 'Advanced Fiqh', 'Super Admin', 'الفقه التخصصي']) assert.ok(!review.includes(stale), stale);
  });

  it('the parent safety page is routed, linked from footer and FAQ, and indexed', () => {
    assert.ok(read('src/App.tsx').includes('<Route path="/safety"'));
    assert.ok(read('src/components/Footer.tsx').includes('to="/safety"'));
    assert.ok(read('src/components/public/faq/FAQPage.tsx').includes('to="/safety"'));
    assert.ok(PUBLIC_PAGES.some((p) => p.path === '/safety'));
    const page = read('src/components/public/safety/SafetyPage.tsx');
    assert.ok(page.includes('/terms#children'), 'points back to the terms it restates');
  });

  it('Vercel Web Analytics runs on public pages only', () => {
    assert.ok(read('src/components/public/layout/PublicLayout.tsx').includes('<Analytics />'));
    assert.ok(!read('src/main.tsx').includes('@vercel/analytics'));
  });
});
