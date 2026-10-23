import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLES, samples, findLesson } from '../src/curriculum/catalog';

describe('Curriculum samples in the student portal (owner, 2026-10-23)', () => {
  it('one sample per built version, each stopping before the end of its lesson', () => {
    const list = samples();
    assert.equal(list.length, SAMPLES.length);
    SAMPLES.forEach((s, i) => {
      const full = findLesson(s.subject, s.number)!;
      assert.ok(s.pages > 0 && s.pages < full.pages.length, `${s.subject}: sample must stop before the end`);
      assert.deepEqual(list[i].lesson.pages, full.pages.slice(0, s.pages));
      assert.deepEqual(list[i].lesson.chapters, []);
    });
  });
});
