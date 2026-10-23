import type { Lesson } from './types';
import { lesson01 } from './content/zad-kids/l01-the-visitor-in-white.js';
import { lesson02 } from './content/zad-kids/l02-who-made-it-all.js';
import { lesson03 } from './content/zad-kids/l03-allah-is-one.js';
import { lesson01Teens } from './content/zad-teens/l01-the-stranger-with-no-dust.js';
import { lesson02Teens } from './content/zad-teens/l02-did-it-all-just-happen.js';
import { lesson03Teens } from './content/zad-teens/l03-one-not-many.js';
import { lesson01Adults } from './content/zad-adults/l01-the-man-no-one-knew.js';

/** A part of a curriculum (a unit in its MAP.md): its title and the number of its first lesson. */
export interface PartEntry { title: string; titleAr: string; from: number }

export interface SubjectEntry {
  id: string;
  /** The subject this curriculum belongs to (GROUPS), e.g. the Kids and Teens versions of Zad Essentials. */
  group: string;
  title: string;
  titleAr: string;
  /** Short name of the version inside its subject ("Kids"), for the curriculum cards. */
  version: string;
  versionAr: string;
  audience: string;
  /** Painting shown on the curriculum's door card (public/curriculum/...). */
  art: string;
  parts: PartEntry[];
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
    group: 'zad-essentials',
    title: 'Zad Essentials · Kids',
    titleAr: 'أول الزاد · للأطفال',
    version: 'Kids',
    versionAr: 'الأطفال',
    audience: '6–11',
    art: '/curriculum/zad-kids/l01/cover.webp',
    parts: [
      { title: 'Who Am I, and Who Made Me?', titleAr: 'مين أنا، ومين خلقني؟', from: 1 },
      { title: 'Clean Inside and Out', titleAr: 'نضيف من جوه ومن بره', from: 11 },
      { title: 'My Salah', titleAr: 'صلاتي', from: 16 },
      { title: 'The Other Pillars', titleAr: 'باقي الأركان', from: 27 },
      { title: 'Ihsan: My Character', titleAr: 'الإحسان: أخلاقي', from: 30 },
    ],
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
    group: 'zad-essentials',
    title: 'Zad Essentials · Teens',
    titleAr: 'أول الزاد · للشباب',
    version: 'Teens',
    versionAr: 'الشباب',
    audience: '12–17',
    art: '/curriculum/zad-teens/l01/doors.webp',
    parts: [
      { title: 'Do I Believe It, or Was I Just Told?', titleAr: 'مؤمن عن اقتناع، ولا عشان اتقالي؟', from: 1 },
      { title: 'Clean, and Growing Up', titleAr: 'الطهارة والبلوغ', from: 12 },
      { title: 'My Salah', titleAr: 'صلاتي', from: 20 },
      { title: 'The Other Pillars', titleAr: 'باقي الأركان', from: 31 },
      { title: "Ihsan: Who I Am When No One's Watching", titleAr: 'الإحسان: أنا مين لما محدش شايفني', from: 34 },
    ],
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
    lessons: { 1: lesson01Teens, 2: lesson02Teens, 3: lesson03Teens },
  },
  {
    id: 'zad-adults',
    group: 'zad-essentials',
    title: 'Zad Essentials · Adults',
    titleAr: 'أول الزاد · للكبار',
    version: 'Adults',
    versionAr: 'الكبار',
    audience: '18+',
    art: '/curriculum/zad-adults/l01/cover.webp',
    parts: [
      { title: 'From Knowing to Certainty', titleAr: 'من المعرفة إلى اليقين', from: 1 },
      { title: 'Clean Before the Meeting', titleAr: 'طهارة قبل اللقاء', from: 16 },
      { title: 'The Meeting', titleAr: 'اللقاء', from: 22 },
      { title: 'The Other Pillars', titleAr: 'باقي الأركان', from: 34 },
      { title: 'Ihsan: The Life That Shows the Certainty', titleAr: 'الإحسان: حياة تشهد باليقين', from: 39 },
    ],
    // docs/curriculum/zad-essentials-adults/MAP.md (approved 2026-10-22); 20a and 20b are one slot, taught by learner.
    plan: [
      'The Man No One Knew', 'A World That Should Not Exist', 'The Emptiness Fame Cannot Fill', 'The Sentence That Costs Something',
      'Knowing Him by His Names', 'The Case for Trust', 'An Open Challenge', 'The Witnesses You Never See', 'One Story, Last Chapter',
      'The Appointment No One Misses', 'The Day Justice Is Done', 'Real Enough to Run Toward', 'Calm Without Giving Up',
      'What Holds the Building', 'Why Islam, and Why Proud',
      'Why Allah Cares About Clean', "Water and Najasah: The Shafi'i Map", 'Wudu, and the Mistakes Most People Make',
      'What Breaks Wudu', 'Clean, Dignified, Certain (women) / The Women in Your Life (men)', 'The Ease Built In',
      'The Line Between', 'Standing Before the King', 'Five Meetings in a Working Day', 'Before You Say Allahu Akbar',
      'Inside the Prayer (1)', 'Inside the Prayer (2)', 'Pillars, Sunnahs and Breakers', 'When You Forget', 'Together, and Friday',
      'On the Road and in Pain', 'The Night Prayer', 'Starting Again',
      'Fasting: The Rulings in Full', 'Ramadan Beyond Hunger', 'Your Wealth Has a Share in It', 'Certain About Rizq', 'The Rehearsal',
      'He Sees You', 'For Whom?', 'The Tongue and the Screen', 'Home', 'Haya: Gaze, Dress and Boundaries', 'Clean Money',
      'Proud, Just and Inviting', 'My Zad for the Road',
    ],
    lessons: { 1: lesson01Adults },
  },
];

/** Subjects of the Zad Path (docs/curriculum/RULES.md): each holds its age versions (SUBJECTS with that `group`).
 *  `planned` versions and subjects show as "coming soon" doors, so the teacher sees where the path is going. */
export interface GroupEntry {
  id: string;
  title: string;
  titleAr: string;
  tagline: string;
  taglineAr: string;
  art?: string;
  planned: { version: string; versionAr: string; audience: string }[];
}

export const GROUPS: GroupEntry[] = [
  {
    id: 'zad-essentials',
    title: 'Zad Essentials',
    titleAr: 'أول الزاد',
    tagline: 'What every Muslim needs to know, by understanding: belief, purity, salah and character.',
    taglineAr: 'ما لا يسع المسلم جهله، بفهم واقتناع: العقيدة والطهارة والصلاة والأخلاق.',
    art: '/curriculum/zad-teens/l01/doors.webp',
    planned: [],
  },
  {
    id: 'seerah',
    title: 'Seerah',
    titleAr: 'السيرة',
    tagline: 'The life of the Prophet ﷺ, told so it changes ours.',
    taglineAr: 'حياة النبي ﷺ، تتحكي عشان تغيّر حياتنا.',
    planned: [
      { version: 'Kids', versionAr: 'الأطفال', audience: '6–11' },
      { version: 'Teens', versionAr: 'الشباب', audience: '12–17' },
      { version: 'Adults', versionAr: 'الكبار', audience: '18+' },
    ],
  },
];

export const tracksOf = (groupId: string | undefined) => SUBJECTS.filter((s) => s.group === groupId);
export const groupOf = (trackId: string | undefined) => GROUPS.find((g) => g.id === SUBJECTS.find((s) => s.id === trackId)?.group);

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
