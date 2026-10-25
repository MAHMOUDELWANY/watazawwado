import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asset } from '../src/curriculum/slides/Art';

describe('Curriculum asset paths', () => {
  it('a subject folder path is used as it is', () => {
    assert.equal(asset('seerah-teens/ep01/cover.webp'), '/curriculum/seerah-teens/ep01/cover.webp');
    assert.equal(asset('zad-teens/l01/doors.webp'), '/curriculum/zad-teens/l01/doors.webp');
  });
  it('a bare path is a Kids file', () => assert.equal(asset('l02/sky.webp'), '/curriculum/zad-kids/l02/sky.webp'));
});
