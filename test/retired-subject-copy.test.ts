import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { PUBLIC_PAGES } from '../src/data/seo.js';

const read = (p: string) => fs.readFileSync(p, 'utf8');
const STALE = ['Islamic studies', 'Islamic Studies', 'العلوم الشرعية', 'الدراسات الإسلامية'];

// RULES.md §2b: Islamic studies is retired; the Zad Path replaced it (owner, 2026-10-18).
describe('public copy uses the current subject catalog', () => {
  const files = [
    'src/components/public/about/AboutPage.tsx',
    'src/components/public/layout/PublicLayout.tsx',
    'src/components/public/privacy/PrivacyPolicyPage.tsx',
    'src/components/public/terms/TermsPage.tsx',
    'src/components/booking/StepLessonType.tsx',
    'src/student/pages/StudentPackagesPage.tsx',
    'src/student/pages/StudentProfilePage.tsx',
    'index.html',
    'public/site.webmanifest',
    'server/siteFacts.ts',
  ];
  for (const f of files) {
    it(`${f} names no retired subject`, () => {
      const src = read(f);
      for (const s of STALE) assert.ok(!src.includes(s), `${f}: ${s}`);
    });
  }

  it('SEO titles and descriptions drop retired subjects', () => {
    const text = JSON.stringify(PUBLIC_PAGES);
    for (const s of [...STALE, 'Aqeedah', 'Fiqh', 'العقيدة والفقه', 'علوم شرعية']) assert.ok(!text.includes(s), s);
    assert.ok(text.includes('the Zad Path') && text.includes('مسار الأثر'));
  });

  it('About page states no English level or certificate (owner answer, review §9)', () => {
    const about = read('src/components/public/about/AboutPage.tsx');
    for (const s of ['IELTS', 'C1', 'C2']) assert.ok(!about.includes(s), s);
    assert.ok(about.includes('strong English') && about.includes('القوية'));
  });

  it('the terms version was bumped together on server and page', () => {
    const v = read('api/index.ts').match(/const TERMS_VERSION = '([^']+)'/)?.[1];
    assert.ok(v && v !== '2026-10-15.3');
    assert.ok(read('src/components/public/terms/TermsPage.tsx').includes(`Version ${v}`));
  });
});
