import { test } from 'node:test';
import assert from 'node:assert/strict';
import { badgesFrom } from '../src/lib/teacherBadges.js';

test('a tag becomes a badge only after 3 different families chose it', () => {
  const rows = [
    { submitted_by: 'a', tags: ['patient', 'fun'] },
    { submitted_by: 'a', tags: ['patient'] },
    { submitted_by: 'b', tags: ['patient', 'fun'] },
    { submitted_by: 'c', tags: ['patient', 'bogus'] },
    { submitted_by: null, tags: ['fun'] }
  ];
  assert.deepEqual(badgesFrom(rows), ['patient']);
});

test('at most two badges, most chosen first', () => {
  const rows = ['a', 'b', 'c', 'd'].map((s) => ({ submitted_by: s, tags: ['clear', 'kids', 'fun'] }));
  rows.push({ submitted_by: 'e', tags: ['kids'] });
  assert.deepEqual(badgesFrom(rows).length, 2);
  assert.equal(badgesFrom(rows)[0], 'kids');
});
