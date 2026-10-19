import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE, sampleLesson, findLesson } from '../src/curriculum/catalog';

describe('Free curriculum sample for accounts without a booking', () => {
  const lesson = findLesson(SAMPLE.subject, SAMPLE.number);

  it('points at a built lesson', () => {
    assert.ok(lesson, 'sample lesson must exist');
    assert.ok(SAMPLE.pages > 0 && SAMPLE.pages < lesson!.pages.length, 'sample must stop before the end of the lesson');
  });

  it('is hidden until the owner marks the lesson reviewed, then shows only the opening pages', () => {
    const sample = sampleLesson();
    if (!lesson!.reviewed) return assert.equal(sample, undefined);
    assert.equal(sample!.pages.length, SAMPLE.pages);
    assert.deepEqual(sample!.pages, lesson!.pages.slice(0, SAMPLE.pages));
    assert.deepEqual(sample!.chapters, []);
  });
});
