import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { findLesson } from '../src/curriculum/catalog.js';
import {
  buildHomeworkPrompt, validateVariants, gradeVariant, publicQuestions, passed, questionCount, earnedBadges, historyOf,
} from '../server/homework/sets.js';

const l = (en: string) => ({ en, ar: `ع ${en}` });

describe('Owner review 2026-11-09: curriculum homework', () => {
  it('the prompt carries only the pages taught, at the learner’s age', () => {
    const lesson = findLesson('zad-adults', 1)!;
    const p = buildHomeworkPrompt({ lesson, from: 1, to: 3, kind: 'part', count: 4, variants: 3 });
    assert.ok(p.includes('### Page 1:') && p.includes('### Page 3:'));
    assert.ok(!p.includes('### Page 4:'), 'page 4 was not taught');
    assert.ok(p.includes('Learner is an adult'));
    assert.ok(p.includes('Never invent a hadith'));
  });

  it('short parts stay short; a whole lesson gets a fuller set', () => {
    assert.strictEqual(questionCount('part', 2), 4);
    assert.strictEqual(questionCount('part', 10), 7);
    assert.ok(questionCount('lesson', 20) >= 7 && questionCount('lesson', 20) <= 10);
  });

  const raw = { variants: [
    { questions: [
      { type: 'mcq', skill: 'understand', page: 2, prompt: l('Why?'), options: [l('a'), l('b'), l('c')], answer: 1, explain: l('Because b.') },
      { type: 'truefalse', skill: 'recall', page: 3, prompt: l('True?'), answerBool: true, explain: l('Yes.') },
      { type: 'order', skill: 'understand', page: 3, prompt: l('Order'), items: [l('one'), l('two'), l('three')], explain: l('1,2,3') },
      { type: 'mcq', skill: 'recall', page: 9, prompt: l('Outside'), options: [l('a'), l('b')], answer: 0, explain: l('x') },
      { type: 'mcq', skill: 'recall', page: 2, prompt: l('Bad'), options: [l('a'), l('b')], answer: 5, explain: l('x') },
    ] },
    { questions: [{ type: 'truefalse', skill: 'recall', page: 2, prompt: l('Too few'), answerBool: false, explain: l('no') }] },
  ] };

  it('drops questions outside the pages or malformed, and versions that are too short', () => {
    const v = validateVariants(raw, 1, 3, 3);
    assert.strictEqual(v.length, 1);
    assert.deepStrictEqual(v[0].questions.map((q) => q.prompt.en), ['Why?', 'True?', 'Order']);
  });

  it('never sends answers to the browser, and order items come shuffled', () => {
    const [v] = validateVariants(raw, 1, 3, 3);
    const pub = publicQuestions(v, 'seed');
    assert.ok(!JSON.stringify(pub).includes('"answer"') && !JSON.stringify(pub).includes('explain'));
    const order: any = pub.find((q) => q.type === 'order');
    assert.notDeepStrictEqual(order.items.map((i: any) => i.key), ['0', '1', '2']);
  });

  it('checks every answer on the server; 80% passes', () => {
    const [v] = validateVariants(raw, 1, 3, 3);
    const all = gradeVariant(v, { v0q0: 1, v0q1: true, v0q2: ['0', '1', '2'] });
    assert.deepStrictEqual([all.score, all.total], [3, 3]);
    const some = gradeVariant(v, { v0q0: 0, v0q1: true, v0q2: ['1', '0', '2'] });
    assert.strictEqual(some.score, 1);
    assert.strictEqual(passed(4, 5), true);
    assert.strictEqual(passed(3, 5), false);
  });

  it('badges come from the learner’s history', () => {
    const h = historyOf([{ status: 'passed', kind: 'lesson', score: 5, total: 5 }, { status: 'submitted', kind: 'part', score: 1, total: 5 }]);
    assert.deepStrictEqual(earnedBadges(h).map((b) => b.id), ['first', 'perfect', 'lesson']);
  });

  it('the homework table is server-only', () => {
    const sql = fs.readFileSync('supabase/migrations/20261109000000_homework_sets.sql', 'utf8');
    assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY') && sql.includes('REVOKE ALL ON TABLE public.homework_sets FROM anon, authenticated'));
  });
});
