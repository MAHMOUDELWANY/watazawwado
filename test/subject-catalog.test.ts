import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SUBJECT_FAMILIES, findSubject, levelsFor } from '../src/components/onboarding/subjects';
import { BOOKING_SERVICES, BOOKABLE_SERVICES } from '../src/booking/mockData';
import { BANKS } from '../server/placement/index';

// RULES.md "Subjects" (2026-10-18): the onboarding shelves and the booking list offer the same subjects.
const shelf = SUBJECT_FAMILIES.flatMap((f) => f.subjects.map((s) => s.id)).sort();
const GENERIC = ['beginner', 'elementary', 'intermediate', 'advanced'];

describe('Subject catalog', () => {
  it('onboarding and booking offer exactly the same subjects', () => {
    assert.deepEqual(shelf, BOOKABLE_SERVICES.map((s) => s.id).sort());
  });

  it('retired subjects still have a label and a placement bank, so old records keep working', () => {
    for (const s of BOOKING_SERVICES.filter((x) => x.hidden)) {
      assert.ok(findSubject(s.id), `${s.id} has no label`);
      assert.ok(BANKS[s.id], `${s.id} has no placement bank`);
    }
  });

  it('every subject offers its own levels, in order, on the generic placement scale', () => {
    for (const id of shelf) {
      const levels = levelsFor(id);
      assert.ok(levels.length >= 1, `${id} has no levels`);
      const idx = levels.map((l) => GENERIC.indexOf(l.id));
      assert.ok(idx.every((i, k) => i >= 0 && (k === 0 || i > idx[k - 1])), `${id}: levels out of order or unknown`);
      assert.ok(BANKS[id], `${id} has no placement bank`);
    }
  });
});
