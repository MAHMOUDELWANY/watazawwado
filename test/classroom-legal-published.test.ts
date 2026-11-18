import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FAQS } from '../src/data/content.js';

const read = (p: string) => fs.readFileSync(p, 'utf8');

// docs/classroom/LEGAL-DRAFT.md, approved by the owner and published 2026-11-18.
describe('Classroom legal text is published', () => {
  const pages = {
    terms: read('src/components/public/terms/TermsPage.tsx'),
    privacy: read('src/components/public/privacy/PrivacyPolicyPage.tsx'),
    safety: read('src/components/public/safety/SafetyPage.tsx'),
    agreement: read('src/pages/StaffAgreementPage.tsx'),
  };

  it('every page names our lesson room, observation and no recording', () => {
    for (const [name, s] of Object.entries(pages)) {
      assert.match(s, /lesson room/, `${name}: lesson room`);
      assert.match(s, /observe/, `${name}: observation`);
      assert.match(s, /not recorded|never recorded|do not record/i, `${name}: no recording`);
    }
    assert.match(pages.privacy, /Cloudflare/);
  });

  it('Zoom appears only as the backup link', () => {
    for (const [name, s] of Object.entries(pages)) {
      assert.doesNotMatch(s, /Zoom host|Zoom lessons|usually on Zoom|حصص Zoom|دروس Zoom|مضيف/, name);
    }
    const zoomFaq = FAQS.find((f) => f.question === 'Do I need Zoom?');
    assert.ok(zoomFaq && /technical problem/.test(zoomFaq.answer));
    assert.ok(FAQS.find((f) => f.question === 'Can I join from my phone?'));
    assert.ok(!FAQS.some((f) => f.question !== 'Do I need Zoom?' && /Zoom/.test(`${f.answer} ${f.arabicAnswer}`)));
  });

  it('terms and agreement versions were bumped together, so teachers accept again', () => {
    const api = read('api/index.ts');
    assert.match(api, /const TERMS_VERSION = '2026-11-18\.1'/);
    assert.match(api, /const TEACHER_AGREEMENT_VERSION = '2026-11-18\.1'/);
    assert.match(pages.agreement, /AGREEMENT_VERSION = '2026-11-18\.1'/);
  });

  it('uses the right Arabic brand name', () => {
    for (const s of Object.values(pages)) assert.doesNotMatch(s, /وطن زاد/);
  });
});
