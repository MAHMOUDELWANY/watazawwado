import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LETTERS, lettersIn, WriteLetter } from '../src/curriculum/slides/motion/letters';
import { SUBJECTS } from '../src/curriculum/catalog';

// The letter-writing kit (plan Task 5): letters are SVG strokes, so they draw in writing order and never depend on a font.
describe('Letter-writing kit', () => {
  it('lettersIn finds the distinct letters, without diacritics', () => {
    assert.deepEqual(lettersIn('بَيْتٌ'), ['ب', 'ي', 'ت']);
  });

  it('every letter used by literacy and fusha lessons has stroke paths', () => {
    const lessons = SUBJECTS.filter((s) => /^(literacy-a|fusha)-/.test(s.id)).flatMap((s) => Object.values(s.lessons));
    for (const l of lessons) for (const p of l.pages) for (const v of p.vocab ?? []) {
      for (const ch of lettersIn(v.arabic)) assert.ok(LETTERS[ch], `${l.subject} L${l.number}: no strokes for ${ch} (${v.arabic})`);
    }
  });

  it('an instant letter renders every stroke and dot (reduced motion)', () => {
    for (const ch of Object.keys(LETTERS)) {
      const html = renderToStaticMarkup(React.createElement('svg', null, React.createElement(WriteLetter, { ch, x: 0, y: 0, instant: true })));
      const marks = (html.match(/<path/g) ?? []).length + (html.match(/<circle/g) ?? []).length;
      assert.equal(marks, LETTERS[ch].strokes.length + LETTERS[ch].dots.length, ch);
    }
  });
});
