import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

// QA-04: phone fixes found at 360/375/414 px (public pages measured live; portal and dashboard from code).
const read = (f: string) => fs.readFileSync(f, 'utf8');

describe('QA-04 mobile', () => {
  it('footer and related-page links are 44px tall', () => {
    const footer = read('src/components/Footer.tsx');
    assert.ok(!footer.includes('inline-block py-1.5'), 'column links');
    assert.strictEqual((footer.match(/min-h-11/g) || []).length >= 15, true);
    for (const f of ['src/components/public/faq/FAQPage.tsx', 'src/components/public/about/AboutPage.tsx', 'src/components/public/how-it-works/HowItWorksPage.tsx']) {
      assert.ok(!read(f).includes('className="underline hover:text-[#FAF7F2]"'), f);
    }
  });

  it('a 44px touch area exists for controls that look smaller', () => {
    assert.match(read('src/index.css'), /\.tap-44::after \{[^}]*width: max\(100%, 44px\); height: max\(100%, 44px\)/);
    assert.ok(read('src/student/StudentApp.tsx').includes('tap-44 relative w-8 h-8'), 'portal header icons');
  });

  it('app shells use the dynamic viewport height on phones', () => {
    assert.ok(read('src/student/StudentApp.tsx').includes('h-screen supports-[height:100dvh]:h-dvh'));
    assert.strictEqual((read('src/dashboard/DashboardApp.tsx').match(/supports-\[height:100dvh\]:h-dvh/g) || []).length, 2);
  });

  it("the floating guide button waits for a scroll on phones so it does not cover the hero's trial button", () => {
    const g = read('src/components/LearningGuide.tsx');
    assert.ok(g.includes('{!isOpen && revealed && (') && g.includes('window.innerWidth >= 640'));
  });
});
