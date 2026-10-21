import type { Lesson } from './types';
import { lesson01 } from './content/zad-kids/l01-the-visitor-in-white.js';
import { lesson02 } from './content/zad-kids/l02-who-made-it-all.js';
import { lesson03 } from './content/zad-kids/l03-allah-is-one.js';
import { lesson01Teens } from './content/zad-teens/l01-the-stranger-with-no-dust.js';
import { lesson02Teens } from './content/zad-teens/l02-did-it-all-just-happen.js';

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
    lessons: { 1: lesson01, 2: lesson02, 3: lesson03 },
  },
  {
    id: 'zad-teens',
    title: 'Zad Essentials · Teens',
    titleAr: 'أول الزاد · للشباب',
    audience: '12–17',
    // docs/curriculum/zad-essentials-teens/MAP.md (approved 2026-10-21); 18a and 18b are one slot, taught by learner.
    plan: [
      'The Stranger with No Dust', 'Did It All Just Happen?', 'One, Not Many', 'Can I Trust Him?', 'The Book That Dares You',
      'Unseen, but Real', 'One Message, Many Messengers', 'The Day Everything Is Weighed',
      'If Allah Is Good, Why Do Bad Things Happen?', 'Five Pillars, One Building', 'Why Am I Here, and Why Islam?',
      'Clean Is Half of It', 'Water, Najasah and the Bathroom', 'Wudu, Done Right', 'What Breaks Wudu',
      'Growing Up: Now It Counts', 'Ghusl: When and How', 'Growing Up Clean (young men / young women)', 'No Water? Tayammum',
      'Why Five Times a Day?', 'Present, Not Just There', 'The Call', 'Five Meetings in a School Day', 'Getting Ready',
      'How to Pray (1)', 'How to Pray (2)', 'Musts and Breakers', 'Extras and Mistakes', 'Praying Together, and Friday',
      'After the Salam, and Missed Prayers',
      "Ramadan: Now It's on Me", "Your Money Isn't Only Yours", 'The Journey of a Lifetime',
      'He Sees Me, Even Offline', 'Parents: Hard, but Worth It', 'Your Tongue and Your Thumbs',
      'Guarding the Gaze and the Heart', 'Friends Who Lift You Up', 'Proud, Not Loud', 'My Zad for the Road',
    ],
    lessons: { 1: lesson01Teens, 2: lesson02Teens },
  },
];

/**
 * Free sample for signed-in accounts without a booking (docs/marketing/PLAN.md §9, owner 2026-10-19): the opening of
 * Lesson 1, stopping on the mystery of the visitor so the learner books to hear the rest. Shown only once the owner
 * has marked the lesson reviewed (docs/curriculum/RULES.md §2).
 */
export const SAMPLE = { subject: 'zad-kids', number: 1, pages: 5 } as const;

export function sampleLesson(): Lesson | undefined {
  const lesson = findLesson(SAMPLE.subject, SAMPLE.number);
  if (!lesson?.reviewed) return undefined;
  return { ...lesson, chapters: [], pages: lesson.pages.slice(0, SAMPLE.pages) };
}

export function findLesson(subjectId: string | undefined, number: number): Lesson | undefined {
  return SUBJECTS.find((s) => s.id === subjectId)?.lessons[number];
}
