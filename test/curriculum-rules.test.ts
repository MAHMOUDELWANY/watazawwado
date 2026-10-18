import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SUBJECTS } from '../src/curriculum/catalog';
import { STATIONS } from '../src/curriculum/types';

// The mechanical part of docs/curriculum/RULES.md. A lesson that fails here is not ready for review.
const lessons = SUBJECTS.flatMap((s) => Object.values(s.lessons));
const AYAH_REF = /\b\d{1,3}:\d{1,3}\b/; // "Al-Baqarah 2:197"; hadith references have no surah:ayah

describe('Curriculum lessons follow docs/curriculum/RULES.md', () => {
  it('there is at least one lesson to check', () => assert.ok(lessons.length > 0));

  for (const lesson of lessons) {
    describe(`${lesson.subject} lesson ${lesson.number}`, () => {
      it('has the four stations, in order (§1.5)', () => {
        const order = lesson.pages.map((p) => STATIONS.indexOf(p.station));
        assert.ok(order.every((o) => o >= 0), 'every page needs a valid station');
        for (let i = 1; i < order.length; i++) {
          assert.ok(order[i] >= order[i - 1], `page ${i + 1} (${lesson.pages[i].title}) goes back to an earlier station`);
        }
        for (const s of STATIONS) assert.ok(lesson.pages.some((p) => p.station === s), `missing station: ${s}`);
      });

      it('every page has read-aloud teacher notes, in English and Arabic (§1.8)', () => {
        lesson.pages.forEach((p, i) => assert.ok(p.explain?.some((x) => x.trim()), `page ${i + 1} has no explain`));
        assert.equal(lesson.teacherAr?.length, lesson.pages.length, 'teacherAr needs one entry per page');
        lesson.teacherAr!.forEach((t, i) => assert.ok(t.explain?.some((x) => x.trim()), `page ${i + 1} has no Arabic explain`));
      });

      it('every evidence has a reference, and every ayah a tadabbur stop (§1.2, §1.6)', () => {
        for (const p of lesson.pages) {
          if (!p.evidence) continue;
          assert.ok(p.evidence.reference?.trim(), `${p.title}: evidence without a reference`);
          if (AYAH_REF.test(p.evidence.reference)) {
            const t = p.tadabbur;
            assert.ok(t && t.word && t.root && t.meaning && t.question && t.action, `${p.title}: ayah without a full tadabbur stop`);
          }
        }
      });

      it('has a check in Athar, and ends with the Ahd and a cliffhanger (§1.5)', () => {
        assert.ok(lesson.pages.some((p) => p.station === 'athar' && p.layout === 'game'), 'needs a check page (layout game) in Athar');
        const last = lesson.pages[lesson.pages.length - 1];
        assert.equal(last.layout, 'next', 'the last page is the cliffhanger');
        assert.equal(last.station, 'ahd');
      });

      it('has a goal, outcomes and chapters, and is a draft until the owner approves it (§1.5, §2)', () => {
        assert.ok(lesson.goal.trim() && lesson.outcomes.length && lesson.chapters.length);
        assert.ok(['kids', 'teens', 'adults'].includes(lesson.version));
        assert.equal(typeof lesson.reviewed, 'boolean');
      });
    });
  }
});
