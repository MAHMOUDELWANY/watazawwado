import { test } from 'node:test';
import assert from 'node:assert/strict';
import { badgesFrom } from '../src/lib/teacherBadges.js';

test('a tag becomes a badge only after 3 different learners chose it', () => {
  const rows = [
    { student_id: 'a', tags: ['patient', 'fun'] },
    { student_id: 'a', tags: ['patient'] },
    { student_id: 'b', tags: ['patient', 'fun'] },
    { student_id: 'c', tags: ['patient', 'bogus'] },
    { student_id: null, tags: ['fun'] }
  ];
  assert.deepEqual(badgesFrom(rows), ['patient']);
});

test('at most two badges, most chosen first', () => {
  const rows = ['a', 'b', 'c', 'd'].map((s) => ({ student_id: s, tags: ['clear', 'kids', 'fun'] }));
  rows.push({ student_id: 'e', tags: ['kids'] });
  assert.deepEqual(badgesFrom(rows).length, 2);
  assert.equal(badgesFrom(rows)[0], 'kids');
});
