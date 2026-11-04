import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placementStatus, PLACEMENT_BEFORE_BOOKING } from '../server/routes/community.js';
import { BANKS, LEVELS, LADDERS, buildPlacementTest, rungQuestions, ladderClimb, suggestLevel, normalizeQuestions } from '../server/placement/index.js';
import { levelsFor, findSubject } from '../src/components/onboarding/subjects.js';
import { BOOKING_SERVICES } from '../src/booking/mockData.js';

/** Minimal stand-in for the Supabase query builder: every chain resolves to the table's result. */
function fakeClient(results: { bookings: any; tests: any }) {
  const chain = (result: any): any => new Proxy(() => {}, {
    get: (_t, prop) => (prop === 'then' ? (res: any) => res(result) : () => chain(result))
  });
  return { from: (table: string) => chain(table === 'bookings' ? results.bookings : results.tests) };
}

const learner = { id: 's1', learning_interest: 'tajweed' };

test('placement banks: every site subject has 5+ bilingual questions per level, options aligned', () => {
  for (const s of BOOKING_SERVICES) {
    const bank = BANKS[s.id];
    assert.ok(bank, `missing bank for ${s.id}`);
    for (const level of LEVELS) {
      assert.ok(bank[level].length >= 5, `${s.id}/${level} has too few questions`);
      for (const q of bank[level]) {
        assert.ok(q.q.en && q.q.ar && q.skill.en && q.skill.ar, `${s.id}/${level}: missing text`);
        const en = Array.isArray(q.options) ? q.options : q.options.en;
        const ar = Array.isArray(q.options) ? q.options : q.options.ar;
        assert.equal(en.length, ar.length, `${s.id}: "${q.q.en}" options differ by language`);
        assert.equal(new Set(en).size, en.length, `${s.id}: "${q.q.en}" has duplicate options`);
      }
    }
  }
});

test('placement test: 8 questions around the chosen level, answer tracked after shuffling', () => {
  const qs = buildPlacementTest('english', 'intermediate');
  assert.equal(qs.length, 8);
  assert.deepEqual([...new Set(qs.map(q => q.level))].sort(), ['advanced', 'elementary', 'intermediate']);
  const bank = BANKS.english;
  for (const q of qs) {
    const source = bank[q.level].find(b => b.q.en === q.q.en)!;
    const correct = Array.isArray(source.options) ? source.options[0] : source.options.en[0];
    assert.equal(q.options.en[q.answer], correct);
  }
});

test('placement grading: passing levels in order gives the highest passed level', () => {
  const qs = buildPlacementTest('english', 'elementary');
  const allRight = qs.map(q => q.answer);
  assert.equal(suggestLevel(qs, allRight), 'intermediate');
  const allWrong = qs.map(q => (q.answer + 1) % 4);
  assert.equal(suggestLevel(qs, allWrong), 'beginner');
});

test('placement status: opens after the learner first booking, once per subject', async () => {
  assert.equal((await placementStatus(fakeClient({ bookings: { count: 0 }, tests: { data: [] } }), learner)).status, PLACEMENT_BEFORE_BOOKING ? 'take_now' : 'not_yet');
  assert.equal((await placementStatus(fakeClient({ bookings: { count: 1 }, tests: { data: [] } }), learner)).status, 'take_now');
  assert.equal((await placementStatus(fakeClient({ bookings: { count: 1 }, tests: { data: [{ id: 't', status: 'submitted' }] } }), learner)).status, 'submitted');
  assert.equal((await placementStatus(fakeClient({ bookings: { count: 1 }, tests: { data: [{ id: 't', status: 'reviewed' }] } }), learner)).status, 'reviewed');
  assert.equal((await placementStatus(fakeClient({ bookings: { count: 1 }, tests: { error: { message: 'no table' } } }), learner)).status, 'not_yet');
});

test('placement test: always 8 distinct questions, for every subject and every chosen level', () => {
  for (const id of Object.keys(BANKS).filter((x) => !LADDERS[x])) {
    for (const level of LEVELS) {
      const qs = buildPlacementTest(id, level);
      assert.equal(qs.length, 8, `${id}/${level}`);
      assert.equal(new Set(qs.map(q => q.q.en + [...q.options.en].sort().join('|'))).size, 8, `${id}/${level} repeats a question`);
    }
  }
});

test('placement: tests saved by the old AI version are read in the bilingual shape', () => {
  const [q] = normalizeQuestions([{ q: 'Old?', options: ['a', 'b', 'c', 'd'], answer: 2, skill: 'Reading' }], 'elementary');
  assert.deepEqual(q.q, { en: 'Old?', ar: 'Old?' });
  assert.deepEqual(q.options.ar, ['a', 'b', 'c', 'd']);
  assert.equal(q.answer, 2);
  assert.equal(q.level, 'elementary');
  assert.equal(q.skill.en, 'Reading');
});

test('placement ladders: one question per lesson 1–3 on each rung, levels the subject offers, options aligned', () => {
  for (const [id, ladder] of Object.entries(LADDERS)) {
    const own = levelsFor(id).map((l) => l.id);
    const order = ladder.rungs.map((r) => LEVELS.indexOf(r.level));
    assert.deepEqual(order, [...order].sort((a, b) => a - b), `${id}: rungs out of order`);
    for (const rung of ladder.rungs) {
      assert.ok(own.includes(rung.level), `${id}: ${rung.level} is not one of its levels`);
      assert.ok(rung.questions.length >= 3, `${id}/${rung.level}: too few questions`);
      for (const q of rung.questions) {
        const en = Array.isArray(q.options) ? q.options : q.options.en;
        const ar = Array.isArray(q.options) ? q.options : q.options.ar;
        assert.ok(q.q.en && q.q.ar && q.skill.en && q.skill.ar && q.lesson >= 1, `${id}: "${q.q.en}" incomplete`);
        assert.equal(en.length, ar.length, `${id}: "${q.q.en}" options differ by language`);
        assert.equal(new Set(en).size, en.length, `${id}: "${q.q.en}" has duplicate options`);
      }
    }
    const first = buildPlacementTest(id, 'advanced');
    assert.equal(first.length, ladder.rungs[0].questions.length, `${id}: starts with the first rung only, whatever the stated level`);
  }
});

test('placement ladder: climbs while at most one miss, stops at two, starts from the first missed lesson', () => {
  const rung = (i: number) => rungQuestions('modern-standard-arabic', i);
  const wrong = (q: { answer: number }) => (q.answer + 1) % 4;
  // Foundations all right, then Level 1 with one miss: keep climbing to rung 2.
  // (Each rungQuestions call shuffles again, so answers are always read from the same list.)
  let qs = [...rung(0), ...rung(1)];
  let ans = qs.map((q, i) => (i === 4 ? wrong(q) : q.answer));
  assert.deepEqual(ladderClimb('modern-standard-arabic', qs, ans), { done: false, next: 2 });
  // Level 2 with lessons 2 and 3 missed: Intermediate, from Lesson 2.
  qs = [...qs, ...rung(2)];
  ans = [...ans, ...qs.slice(6).map((q, i) => (i === 0 ? q.answer : wrong(q)))];
  assert.deepEqual(ladderClimb('modern-standard-arabic', qs, ans), { done: true, level: 'intermediate', lesson: 2 });
  // Everything right on every rung: the top level, first three lessons known.
  const all = [0, 1, 2, 3].flatMap((i) => rung(i));
  assert.deepEqual(ladderClimb('modern-standard-arabic', all, all.map((q) => q.answer)), { done: true, level: 'advanced', lesson: null });
  // Two misses on the first rung: Foundations, from the start.
  const f = rung(0);
  assert.deepEqual(ladderClimb('modern-standard-arabic', f, f.map(wrong)), { done: true, level: 'beginner', lesson: 1 });
});

test('placement ladders: onboarding skips the level question exactly for the subjects the test places', () => {
  const placed = ['quran-reading', 'tajweed', 'modern-standard-arabic', 'egyptian-arabic', 'quran-memorization', 'english', 'zad-essentials', 'seerah']
    .filter((id) => findSubject(id)?.subject.placedByTest).sort();
  assert.deepEqual(placed, Object.keys(LADDERS).sort());
});
