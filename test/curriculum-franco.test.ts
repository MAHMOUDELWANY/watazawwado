import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SUBJECTS } from '../src/curriculum/catalog';
import { toFranco, missingFranco } from '../src/curriculum/franco';
import { clipUrl } from '../src/curriculum/slides/clip';

// Egyptian · Franco (docs/curriculum/franco/RULES.md): the Egyptian Adults lessons with every Arabic line in Franco.
describe('Franco track', () => {
  it('mirrors every Egyptian Adults lesson', () => {
    const eg = SUBJECTS.find((s) => s.id === 'egyptian-adults')!;
    const fr = SUBJECTS.find((s) => s.id === 'egyptian-franco')!;
    assert.deepEqual(Object.keys(fr.lessons), Object.keys(eg.lessons));
    assert.deepEqual(fr.plan, eg.plan);
  });

  it('every Arabic word of those lessons has a Franco spelling', () => {
    assert.deepEqual([...missingFranco], []);
    const fr = SUBJECTS.find((s) => s.id === 'egyptian-franco')!;
    const left = JSON.stringify(Object.values(fr.lessons).map((l) => l.pages.map(({ lines, items, vocab, interaction }) => ({ lines, items, vocab, interaction }))));
    assert.doesNotMatch(left, /[؀-ۿ]/);
  });

  it('converts phrases before words, keeps punctuation, and flips arrows', () => {
    assert.equal(toFranco('السلام عليكم ← وعليكم السلام'), 'el salamo 3alaykom → w 3alaykom el salam');
    assert.equal(toFranco('Cairo: اسمَك إيه؟ Your name'), 'Cairo: esmak eh? Your name');
  });

  it('plays the Egyptian Adults recordings', () => {
    assert.equal(clipUrl('egyptian-franco', 1, { id: 'ismi', text: 'اسمي', voice: 'eg' }), '/curriculum/egyptian-adults/audio/l01-ismi.mp3');
  });
});
