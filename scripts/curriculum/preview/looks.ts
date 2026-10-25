// The literacy look options (plan Task 3) as a preview-only lesson: ?looks&p=0..5. Never in the catalog.
import type { Lesson, LessonPage, SceneId } from '../../../src/curriculum/types';

const meet = (scene: SceneId, look: string): LessonPage => ({
  title: `Meet Baa · ${look}`, station: 'zad', layout: 'concept', scene,
  lines: ['This is Baa.', 'It looks like a little boat, with one dot underneath.', 'Say it with me: b!', 'Baa starts the word بَيْت, house.'],
  explain: ['Look option for the literacy cast.'],
});
const word = (scene: SceneId, look: string): LessonPage => ({
  title: `Three Letters, One House · ${look}`, station: 'zad', layout: 'concept', scene,
  lines: ['Lina and Sam find letters on the floor.', 'Lina picks up ب. Sam finds ي and ت.', 'Put them side by side and they hold hands.', 'Bayt means house. Three letters built one!'],
  explain: ['Look option for the literacy cast.'],
});

export const LOOKS: Lesson = {
  subject: 'literacy-looks', version: 'kids', subjectTitle: 'Reading Arabic · Kids', number: 1,
  title: 'Look options', titleAr: 'اختيارات الشكل', part: 'Literacy', minutes: 5, goal: 'Pick a look.',
  outcomes: ['—'], chapters: [{ label: 'A', page: 0 }, { label: 'B', page: 2 }, { label: 'C', page: 4 }], reviewed: false,
  pages: [meet('lkA1', 'A'), word('lkA2', 'A'), meet('lkB1', 'B'), word('lkB2', 'B'), meet('lkC1', 'C'), word('lkC2', 'C')],
};
