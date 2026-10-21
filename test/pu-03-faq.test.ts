import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FAQS } from '../src/data/content.js';

const find = (q: string) => FAQS.find((f) => f.question === q);

describe('PU-03 FAQ for Western parents', () => {
  it('answers the questions families ask, in both languages', () => {
    for (const q of ['Can I choose a female teacher?', 'What happens if we miss a lesson?', 'How will I know how my child is doing?', 'Can I manage all my children in one account?', 'How do time zones work?']) {
      const f = find(q);
      assert.ok(f, q);
      assert.ok(f!.arabicQuestion && /[؀-ۿ]/.test(f!.arabicAnswer || ''), `${q} has Arabic`);
    }
  });

  it('matches RULES.md facts', () => {
    const missed = find('What happens if we miss a lesson?')!;
    assert.match(missed.answer, /counts as taken/, 'RULES §2: a missed lesson counts as taken');
    assert.match(missed.answer, /new time, a lesson credit or a refund/, 'RULES §2: platform cancels → choice');
    const family = find('Can I manage all my children in one account?')!;
    assert.match(family.answer, /6 to 17/, 'RULES §2 age limits');
    assert.match(family.answer, /5% off/, 'RULES §4 family care');
    const cancel = find('What is the cancellation and rescheduling policy?')!;
    assert.match(cancel.answer, /3 hours before/);
    assert.match(cancel.answer, /1 hour before/);
  });

  it('speaks as the academy and promises no monthly email that does not exist yet', () => {
    for (const f of FAQS) {
      assert.ok(!/mahmoud|محمود/i.test(`${f.answer} ${f.arabicAnswer}`), f.question);
    }
    assert.ok(!/monthly email|by email every month/i.test(find('How will I know how my child is doing?')!.answer));
  });
});
