import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SUBJECTS, findLesson } from '../src/curriculum/catalog';
import { scoreSort } from '../src/curriculum/LessonPlayer';
import type { Interaction } from '../src/curriculum/types';

const lessons = SUBJECTS.flatMap((s) => Object.values(s.lessons));

describe('Curriculum lesson data follows the plan rules', () => {
  it('Zad Essentials · Kids has the 37 approved lessons in its plan', () => {
    assert.equal(SUBJECTS.find((s) => s.id === 'zad-kids')?.plan.length, 37);
  });

  for (const lesson of lessons) {
    describe(`${lesson.subject} lesson ${lesson.number}`, () => {
      it('ends with a game checkpoint before the closing pages, and a cliffhanger last (PLAN §3a)', () => {
        assert.ok(lesson.pages.some((p) => p.interaction?.kind === 'sort'), 'needs a game checkpoint');
        assert.match(lesson.pages[lesson.pages.length - 1].title, /next time/i);
      });

      it('every sort card points to a real door', () => {
        for (const p of lesson.pages) {
          if (p.interaction?.kind !== 'sort') continue;
          const bins = new Set(p.interaction.bins.map((b) => b.id));
          for (const c of p.interaction.cards) assert.ok(bins.has(c.bin), `${c.label} → ${c.bin}`);
        }
      });

      it('every Arabic evidence has a reference and an English meaning', () => {
        for (const p of lesson.pages) {
          if (!p.evidence) continue;
          assert.ok(p.evidence.arabic && p.evidence.meaning && p.evidence.reference, p.title);
        }
      });

      it('learner text has no em/en dashes (humanizer rule)', () => {
        const text = JSON.stringify(lesson.pages.map(({ teacherNote, ...rest }) => rest));
        assert.ok(!/[–—]/.test(text), 'replace dashes in learner-facing copy');
      });
    });
  }

  it('unknown lessons resolve to nothing', () => {
    assert.equal(findLesson('zad-kids', 99), undefined);
    assert.equal(findLesson('nope', 1), undefined);
  });
});

describe('Game checkpoint scoring', () => {
  const game: Extract<Interaction, { kind: 'sort' }> = {
    kind: 'sort',
    prompt: '',
    bins: [{ id: 'a', label: 'A', hint: '' }, { id: 'b', label: 'B', hint: '' }],
    cards: [{ label: '1', bin: 'a' }, { label: '2', bin: 'a' }, { label: '3', bin: 'b' }],
  };

  it('counts correct cards per door', () => {
    assert.deepEqual(scoreSort(game, { 0: 'a', 1: 'b', 2: 'b' }), { a: { correct: 1, total: 2 }, b: { correct: 1, total: 1 } });
  });

  it('an unplaced card counts as not correct', () => {
    assert.deepEqual(scoreSort(game, { 2: 'b' }), { a: { correct: 0, total: 2 }, b: { correct: 1, total: 1 } });
  });
});
