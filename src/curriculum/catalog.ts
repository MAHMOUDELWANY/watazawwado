import type { Lesson } from './types';
import { lesson01 } from './content/zad-kids/l01-the-visitor-in-white.js';

export interface SubjectEntry {
  id: string;
  title: string;
  titleAr: string;
  audience: string;
  /** Planned lesson titles in order (docs/curriculum/zad-essentials-kids/MAP.md). Built lessons are in `lessons`. */
  plan: string[];
  lessons: Record<number, Lesson>;
}

// Zad Path curricula (docs/curriculum/RULES.md). Zad Essentials and Seerah each get Kids / Teens / Adults entries
// (ids zad-kids, zad-teens, zad-adults, ...), added when the owner approves that version's MAP.md, so the teacher and
// student pages never list an empty curriculum. The Scholar's Path has no curriculum here: its courses (book, sessions,
// price) are defined by the owner first (RULES.md §6).
export const SUBJECTS: SubjectEntry[] = [
  {
    id: 'zad-kids',
    title: 'Zad Essentials · Kids',
    titleAr: 'أول الزاد · للأطفال',
    audience: '6–11',
    plan: [
      'The Visitor in White', 'Who Made It All?', 'Allah Is One', 'Muhammad ﷺ, the Messenger', 'The Unseen Helpers',
      'Letters from Allah', 'The Last Day', 'Allah Knows and Plans', 'A House on Five Pillars', 'Why Am I Here?',
      'Allah Loves the Clean', 'Clean Water, Clean Clothes', 'Wudu Step by Step', 'Keeping My Wudu', 'No Water? Tayammum',
      'Why Do We Pray?', 'Talking to Allah', 'The Call: Adhan & Iqamah', 'Five Meetings a Day', 'Getting Ready',
      'How to Pray (1)', 'How to Pray (2)', 'Musts and Breakers', 'Extras and Oops!', 'Praying Together', 'After Salam',
      'Ramadan Heroes', 'Sharing Is Worship', 'Journey to the House',
      'Allah Sees Me', 'My Parents, My Jannah', "A Father's Advice", 'True Words, Kept Promises',
      'Kind to Every Living Thing', 'Little Sunnahs, Big Love', 'Me, My Friends, My Faith', 'My Zad for the Road',
    ],
    lessons: { 1: lesson01 },
  },
];

export function findLesson(subjectId: string | undefined, number: number): Lesson | undefined {
  return SUBJECTS.find((s) => s.id === subjectId)?.lessons[number];
}
