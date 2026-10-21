import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { levelsFor } from '../src/components/onboarding/subjects.js';

describe('PU-01 progress showcase', () => {
  const src = fs.readFileSync('src/components/public/how-it-works/ProgressShowcase.tsx', 'utf8');

  it('is clearly an example: badge on both cards and a sample note, no names', () => {
    assert.strictEqual(src.split('<ExampleBadge isEn={isEn} />').length - 1, 2);
    assert.ok(src.includes("'Sample figures to show the layout, not a real student.'"));
    assert.ok(!/learnerName|Yusuf|Maryam|Aisha|Mahmoud|محمود/.test(src), 'no names');
  });

  it('uses the real level names of the example subject', () => {
    assert.ok(src.includes("const EXAMPLE_SUBJECT = 'tajweed';"));
    assert.strictEqual(levelsFor('tajweed').length, 3);
  });

  it('sits on the How it works page', () => {
    const page = fs.readFileSync('src/components/public/how-it-works/HowItWorksPage.tsx', 'utf8');
    assert.ok(page.includes('<ProgressShowcase isEn={isEn} />'));
  });
});
