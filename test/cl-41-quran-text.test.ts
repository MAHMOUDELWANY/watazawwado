import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseTajweed, rulesIn, ruleColor, TAJWEED_RULES } from '../src/lib/quran/tajweed.js';
import { alignWords, flaggedKeys, normalizeArabic, similarity } from '../src/lib/quran/align.js';

// Markup exactly as the Quran Foundation Content API returns it (word and verse forms).
const WORD = 'ا<rule class=madda_necessary>لٓ</rule><rule class=madda_necessary>مٓ</rule>';
const VERSE = 'ذ<tajweed class=madda_normal>َٲ</tajweed>لِكَ <tajweed class=ham_wasl>ٱ</tajweed>لْكِتَ<tajweed class=madda_normal>ـٰ</tajweed>بُ <span class=end>٢</span>';

describe('CL-41 tajweed markup', () => {
  it('splits a word into plain and coloured runs, joining runs of the same rule, text unchanged', () => {
    const parts = parseTajweed(WORD);
    assert.deepStrictEqual(parts, [{ text: 'ا', rule: null }, { text: 'لٓمٓ', rule: 'madda_necessary' }]);
    assert.strictEqual(parts.map((p) => p.text).join(''), 'الٓمٓ');
  });

  it('reads verse markup and drops the ayah number span', () => {
    const parts = parseTajweed(VERSE);
    assert.ok(!parts.some((p) => p.text.includes('٢')));
    assert.deepStrictEqual(parts.filter((p) => p.rule).map((p) => p.rule), ['madda_normal', 'ham_wasl', 'madda_normal']);
    assert.strictEqual(parts.map((p) => p.text).join(''), 'ذَٲلِكَ ٱلْكِتَـٰبُ ');
  });

  it('plain text, quoted classes, unknown rules and entities', () => {
    assert.deepStrictEqual(parseTajweed('بِسۡمِ'), [{ text: 'بِسۡمِ', rule: null }]);
    assert.deepStrictEqual(parseTajweed('<rule class="ghunnah">نّ</rule>'), [{ text: 'نّ', rule: 'ghunnah' }]);
    assert.strictEqual(ruleColor('not_a_rule'), null);
    assert.strictEqual(ruleColor('qalaqah'), TAJWEED_RULES.qalaqah.color);
    assert.deepStrictEqual(parseTajweed('a&amp;b'), [{ text: 'a&b', rule: null }]);
    assert.deepStrictEqual(parseTajweed(''), []);
  });

  it('the legend lists only rules on the page, in a fixed order', () => {
    assert.deepStrictEqual(rulesIn([parseTajweed(VERSE), parseTajweed(WORD)]), ['ham_wasl', 'madda_normal', 'madda_necessary']);
  });
});

const expected = (text: string, verse = '1:1') => text.split(' ').map((w, i) => ({ key: `${verse}:${i + 1}`, text: w }));

describe('CL-41 word alignment', () => {
  it('normalises harakat, alef forms, ta marbuta and Quranic marks', () => {
    assert.strictEqual(normalizeArabic('ٱلرَّحْمَـٰنِ'), 'الرحمن');
    assert.strictEqual(normalizeArabic('الصَّلَاةَ'), normalizeArabic('الصلاه'));
    assert.ok(similarity('العالمين', 'العلمين') >= 0.75);
  });

  it('a clean recitation has no flags', () => {
    const ops = alignWords(expected('الحمد لله رب العالمين'), 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ');
    assert.ok(ops.every((o) => o.kind === 'ok'));
    assert.deepStrictEqual(flaggedKeys(ops), []);
  });

  it('flags a missing word', () => {
    const ops = alignWords(expected('الحمد لله رب العالمين'), 'الحمد رب العالمين');
    assert.deepStrictEqual(flaggedKeys(ops), [{ key: '1:1:2', kind: 'missing' }]);
  });

  it('flags a changed word', () => {
    const ops = alignWords(expected('مالك يوم الدين'), 'مالك يوم القيامه');
    assert.deepStrictEqual(flaggedKeys(ops), [{ key: '1:1:3', kind: 'changed' }]);
    assert.deepStrictEqual(ops[2], { kind: 'changed', key: '1:1:3', heard: 'القيامه' });
  });

  it('flags an extra word on the word before it (and at the start, without a key)', () => {
    const ops = alignWords(expected('اياك نعبد واياك نستعين'), 'اياك نعبد الله واياك نستعين');
    assert.deepStrictEqual(flaggedKeys(ops), [{ key: '1:1:2', kind: 'extra' }]);
    const start = alignWords(expected('اهدنا الصراط'), 'يا اهدنا الصراط');
    assert.deepStrictEqual(start[0], { kind: 'extra', heard: 'يا', after: null });
  });

  it('empty transcript: every word is missing; empty expected: every word is extra', () => {
    assert.deepStrictEqual(alignWords(expected('قل هو'), '').map((o) => o.kind), ['missing', 'missing']);
    assert.deepStrictEqual(alignWords([], 'قل هو').map((o) => o.kind), ['extra', 'extra']);
  });
});
