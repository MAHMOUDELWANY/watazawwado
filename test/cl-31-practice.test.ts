import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isUnscrambled, lines, makeBlanks, matchColumns, nextWheel, normalize, parsePairs, sameWord, scramble, seeded, shuffle, stripTashkeel } from '../src/classroom/tools/practice.js';

describe('CL-31 practice tools', () => {
  it('hides tashkeel and keeps the letters', () => {
    assert.strictEqual(stripTashkeel('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'), 'بسم الله الرحمن الرحيم');
    assert.strictEqual(stripTashkeel('كِتَابٌ'), 'كتاب');
    assert.strictEqual(stripTashkeel('Hello'), 'Hello');
  });

  it('the same seed gives the same order on both screens', () => {
    assert.deepStrictEqual(shuffle([1, 2, 3, 4, 5], 42), shuffle([1, 2, 3, 4, 5], 42));
    const r = seeded(1);
    const v = r();
    assert.ok(v >= 0 && v < 1);
  });

  it('blanks hide about a third of the real words, at least one, the same per seed', () => {
    const text = 'The cat sat on the warm mat by the door';
    const a = makeBlanks(text, 5);
    assert.deepStrictEqual(a, makeBlanks(text, 5));
    assert.strictEqual(a.map((p) => p.word).join(' '), text);
    const hidden = a.filter((p) => p.blank).length;
    assert.ok(hidden >= 1 && hidden <= 4, String(hidden));
    assert.strictEqual(makeBlanks('a', 1).filter((p) => p.blank).length, 0, 'one-letter words are never blanked');
    assert.strictEqual(makeBlanks('word', 1).filter((p) => p.blank).length, 1);
  });

  it('answers ignore tashkeel, case and punctuation', () => {
    assert.ok(sameWord('اللَّهِ', 'الله'));
    assert.ok(sameWord('Mat,', 'mat'));
    assert.ok(!sameWord('mat', ''));
    assert.ok(!sameWord('mat', 'cat'));
    assert.strictEqual(normalize('  «كِتَابٌ»  '), 'كتاب');
  });

  it('unscramble always changes the order when it can, and checks the answer', () => {
    for (let seed = 0; seed < 50; seed++) {
      const out = scramble('one two three', seed);
      assert.notStrictEqual(out.join(' '), 'one two three');
      assert.deepStrictEqual([...out].sort(), ['one', 'three', 'two']);
    }
    assert.deepStrictEqual(scramble('same same', 3), ['same', 'same']);
    assert.ok(isUnscrambled('ذَهَبَ الوَلَدُ', ['ذهب', 'الولد']));
    assert.ok(!isUnscrambled('ذهب الولد', ['الولد', 'ذهب']));
  });

  it('matching shuffles the right column away from the pairing', () => {
    const pairs: [string, string][] = [['kitab', 'book'], ['qalam', 'pen']];
    for (let seed = 0; seed < 20; seed++) {
      const { left, right } = matchColumns(pairs, seed);
      assert.deepStrictEqual(left, ['kitab', 'qalam']);
      assert.deepStrictEqual(right, ['pen', 'book']);
    }
    assert.deepStrictEqual(matchColumns([['a', 'b']], 1), { left: ['a'], right: ['b'] });
  });

  it('the wheel picks a question not asked yet, then starts over; no rewards', () => {
    assert.strictEqual(nextWheel(0, []), -1);
    assert.strictEqual(nextWheel(3, [0, 2], () => 0.99), 1);
    const all = new Set<number>();
    const asked: number[] = [];
    for (let i = 0; i < 4; i++) { const n = nextWheel(4, asked, Math.random); assert.ok(!asked.includes(n)); asked.push(n); all.add(n); }
    assert.strictEqual(all.size, 4);
    const again = nextWheel(4, asked, () => 0);
    assert.ok(again >= 0 && again < 4);
  });

  it('reads typed lines and word pairs', () => {
    assert.deepStrictEqual(lines('a\n\n b \r\nc'), ['a', 'b', 'c']);
    assert.deepStrictEqual(parsePairs('kitab = book\nqalam - pen\nbad line\nبيت: house'), [['kitab', 'book'], ['qalam', 'pen'], ['بيت', 'house']]);
  });
});
