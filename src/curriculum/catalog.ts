import type { Lesson } from './types';
import { lesson01 } from './content/zad-kids/l01-the-visitor-in-white.js';
import { lesson02 } from './content/zad-kids/l02-who-made-it-all.js';
import { lesson03 } from './content/zad-kids/l03-allah-is-one.js';
import { lesson01Teens } from './content/zad-teens/l01-the-stranger-with-no-dust.js';
import { lesson02Teens } from './content/zad-teens/l02-did-it-all-just-happen.js';
import { lesson03Teens } from './content/zad-teens/l03-one-not-many.js';
import { lesson01Adults } from './content/zad-adults/l01-the-man-no-one-knew.js';
import { lesson02Adults } from './content/zad-adults/l02-a-world-that-should-not-exist.js';
import { lessonA01 } from './content/literacy-a-kids/l01-dots-make-the-difference.js';
import { lessonF01 } from './content/fusha-kids/l01-what-is-this.js';
import { seerahE01 } from './content/seerah-teens/l01-the-invincible-army.js';
import { lessonB01 } from './content/literacy-b/l01-same-letters-new-marks.js';
import { lessonE01 } from './content/egyptian-adults/l01-ahlan-whats-your-name.js';
import { lesson03Adults } from './content/zad-adults/l03-the-emptiness-fame-cannot-fill.js';

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
    lessons: { 1: lesson01Adults, 2: lesson02Adults, 3: lesson03Adults },
  },
  {
    id: 'literacy-a-kids',
    group: 'literacy',
    title: 'Reading Arabic · Kids',
    titleAr: 'القرائية · للأطفال',
    version: 'Kids',
    versionAr: 'الأطفال',
    audience: '6–11',
    art: '/curriculum/zad-kids/l01/cover.webp',
    parts: [
      { title: 'The Letters', titleAr: 'الحروف', from: 1 },
      { title: 'Letters Change Shape', titleAr: 'الحروف بتغيّر شكلها', from: 10 },
      { title: 'Short Vowels', titleAr: 'الحركات', from: 14 },
      { title: 'Sukoon, Shadda, Tanween', titleAr: 'السكون والشدة والتنوين', from: 19 },
      { title: 'Long Vowels', titleAr: 'المدود', from: 22 },
      { title: 'Reading', titleAr: 'القراءة', from: 27 },
    ],
    // docs/curriculum/literacy/MAP.md (Claude's draft, 2026-10-25, for the owner's review).
    plan: [
      'Dots Make the Difference', 'The Cup Family', 'Little Hooks', 'Teeth and Dots', 'The Big Bowls', 'The Eye Letters',
      'Loops and Tails', 'Round Friends', 'All Twenty-Eight', 'Start, Middle, End', "Letters That Don't Hold Hands",
      'Shapes in Words (1)', 'Shapes in Words (2)', 'Fatha', 'Kasra', 'Damma', 'Three Little Vowels', 'My First Words',
      'Sukoon: the Stop', 'Shadda: Say It Twice', 'Tanween', 'Alif Stretches', 'Waw Stretches', 'Yaa Stretches',
      'Al-: The Sun and Moon Letters', 'Ta Marbuta and Alif Maqsura', 'Short Sentences', 'My First Story', 'I Can Read!',
    ],
    lessons: { 1: lessonA01 },
  },
  {
    id: 'fusha-kids',
    group: 'fusha',
    title: 'Fusha Arabic · Kids',
    titleAr: 'الفصحى · للأطفال',
    version: 'Kids',
    versionAr: 'الأطفال',
    audience: '6–11',
    art: '/curriculum/zad-kids/l01/cover.webp',
    parts: [{ title: 'Level 1', titleAr: 'المستوى الأول', from: 1 }],
    // docs/curriculum/fusha/MAP.md (Claude's draft, 2026-10-25, for the owner's review).
    plan: [
      'What Is This?', 'Is This a Cat?', 'This One, That One', 'The Door and a Door', 'Where Is the Ball?', 'Whose Book?',
      'My Book, Your Book', 'She and He', 'Big and Small', 'Colours', 'Who Are You?', 'Counting to Ten', 'Review and Story',
      'I Went, You Went', 'We Went', 'From and To', 'What Did You Eat?', 'Days of the Week', 'These and Those', 'Many Books',
      'Level 1 Story',
    ],
    lessons: { 1: lessonF01 },
  },
  {
    id: 'seerah-teens',
    group: 'seerah',
    title: 'Seerah · Teens & Adults',
    titleAr: 'السيرة · للشباب والكبار',
    version: 'Teens & Adults',
    versionAr: 'الشباب والكبار',
    audience: '12+',
    art: '/curriculum/zad-adults/l01/cover.webp',
    parts: [{ title: 'Season 1 · Before the Message', titleAr: 'الموسم الأول · قبل البعثة', from: 1 }],
    // docs/curriculum/seerah/MAP.md (Claude's draft, 2026-10-25, for the owner's review).
    plan: [
      'The World in Shadows: The Invincible Army', 'The Shepherd Boy and the Sealed Chest', 'Loss After Loss', 'The Monk Who Knew',
      'The War He Watched', 'The Honest One', 'Khadijah', 'The Black Stone', 'The Cave',
    ],
    lessons: { 1: seerahE01 },
  },
  {
    id: 'literacy-b-kids',
    group: 'quran',
    title: 'Quranic Reading Rules',
    titleAr: 'قواعد القراءة القرآنية',
    version: 'Reading rules',
    versionAr: 'قواعد القراءة',
    audience: '6+',
    art: '/curriculum/zad-kids/l01/cover.webp',
    parts: [{ title: 'Reading the Mushaf', titleAr: 'قراءة المصحف', from: 1 }],
    // docs/curriculum/literacy-quranic/MAP.md (Claude's draft, 2026-10-25, for the owner's review).
    plan: [
      'Same Letters, New Marks', 'The Alif That Stands Up', 'Written, Not Read', 'The Quiet Alif', 'The Sun and the Moon',
      'The Name of Allah', 'The Wavy Line', 'Tanween, the Mushaf Way', 'Where to Stop', 'Stopping on a Word',
      'Letters With Names', 'Reading a Whole Surah',
    ],
    lessons: { 1: lessonB01 },
  },
  {
    id: 'egyptian-adults',
    group: 'egyptian',
    title: 'Egyptian Arabic · Adults',
    titleAr: 'العامية المصرية · للكبار',
    version: 'Adults',
    versionAr: 'الكبار',
    audience: '18+',
    art: '/curriculum/zad-adults/l01/cover.webp',
    parts: [
      { title: 'Beginner · Meeting People', titleAr: 'المبتدئ · التعارف', from: 1 },
      { title: 'Beginner · Around Cairo', titleAr: 'المبتدئ · في القاهرة', from: 12 },
    ],
    // docs/curriculum/egyptian/MAP.md (Claude's draft, 2026-10-26, for the owner's review).
    plan: [
      "Ahlan! What's Your Name?", 'Where Are You From?', "What's This?", 'Where Are My Keys?', 'Numbers and Phones',
      'What Time Is It?', 'How Much?', 'At the Market', 'Where Is It?', 'My Address', 'Review: The First Month',
      'Left, Right, Straight', 'Is There a Pharmacy?', 'Every Day', "Not Now, I'm Busy", 'What Do You Do?',
      'Come In, Have Tea!', 'Are You Free Tonight?', 'A Gift for Mona', 'Taxi, Train, Ticket', 'What Will You Have?',
      'Review: Ready for Cairo',
    ],
    lessons: { 1: lessonE01 },
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
    // Two versions (owner, 2026-10-25): Kids, and one shared version for teens and adults.
    planned: [
      { version: 'Kids', versionAr: 'الأطفال', audience: '6–11' },
    ],
  },
  // Beyond the Zad Path: docs/superpowers/specs/2026-10-25-subjects-curricula-design.md §2.
  {
    id: 'literacy',
    title: 'Reading Arabic',
    titleAr: 'القرائية',
    tagline: 'From the first letter to reading on your own. The door to the Quran, Fusha and Egyptian.',
    taglineAr: 'من أول حرف لحد ما تقرا لوحدك. الباب للقرآن والفصحى والمصري.',
    planned: [
      { version: 'Teens', versionAr: 'الشباب', audience: '12–17' },
      { version: 'Adults', versionAr: 'الكبار', audience: '18+' },
      { version: 'Franco', versionAr: 'فرانكو', audience: '18+' },
    ],
  },
  {
    id: 'quran',
    title: 'Quran',
    titleAr: 'القرآن',
    tagline: 'Reading the Mushaf as it is written, then reciting it with tajweed.',
    taglineAr: 'تقرا المصحف زي ما هو مكتوب، وبعدين تتلوه بالتجويد.',
    planned: [
      { version: 'Quran reading', versionAr: 'قراءة القرآن', audience: '6+' },
      { version: 'Tajweed', versionAr: 'التجويد', audience: '6+' },
    ],
  },
  {
    id: 'egyptian',
    title: 'Egyptian Arabic',
    titleAr: 'العامية المصرية',
    tagline: "The Arabic of Cairo's streets and kitchens: greet, ask, bargain and visit family the way Egyptians do.",
    taglineAr: 'عربي شوارع القاهرة وبيوتها: تسلّم وتسأل وتفاصل وتزور العيلة زي المصريين.',
    // Arabic script in three versions (Adults first) and one Franco version (design §4.6).
    planned: [
      { version: 'Kids', versionAr: 'الأطفال', audience: '6–11' },
      { version: 'Teens', versionAr: 'الشباب', audience: '12–17' },
      { version: 'Franco', versionAr: 'فرانكو', audience: '18+' },
    ],
  },
  {
    id: 'fusha',
    title: 'Fusha Arabic',
    titleAr: 'العربية الفصحى',
    tagline: 'Understand it, then speak it: stories first, rules after, words that come back until they stay.',
    taglineAr: 'افهمها وبعدين اتكلمها: الحكاية الأول، والقاعدة بعدها، والكلمات بترجع لحد ما تثبت.',
    planned: [
      { version: '12+', versionAr: '12 سنة فأكبر', audience: '12+' },
    ],
  },
];

export const tracksOf = (groupId: string | undefined) => SUBJECTS.filter((s) => s.group === groupId);
export const groupOf = (trackId: string | undefined) => GROUPS.find((g) => g.id === SUBJECTS.find((s) => s.id === trackId)?.group);

/**
 * Samples for every student and parent account (owner, 2026-10-23): the opening of Lesson 1 in each version we have
 * built, drafts included, so the owner sees how lessons look in the student portal before launch. Each stops on the
 * mystery of the visitor, before the answer.
 * shortcut: drafts are shown to students here on the owner's request; remove the unreviewed ones at launch.
 */
export const SAMPLES = [
  { subject: 'zad-kids', number: 1, pages: 5, teaser: 'Who was the visitor in white?', teaserAr: 'مين الضيف اللي لابس أبيض؟' },
  { subject: 'zad-teens', number: 1, pages: 5, teaser: 'Who was the stranger with no dust?', teaserAr: 'مين الغريب اللي مفيش عليه غبار؟' },
  { subject: 'zad-adults', number: 1, pages: 8, teaser: 'Who was the man no one knew?', teaserAr: 'مين الرجل اللي محدش عرفه؟' },
] as const;

export function samples(): { track: SubjectEntry; lesson: Lesson; totalPages: number; teaser: string; teaserAr: string }[] {
  return SAMPLES.flatMap((s) => {
    const track = SUBJECTS.find((t) => t.id === s.subject);
    const lesson = findLesson(s.subject, s.number);
    return track && lesson
      ? [{ track, totalPages: lesson.pages.length, teaser: s.teaser, teaserAr: s.teaserAr, lesson: { ...lesson, chapters: [], pages: lesson.pages.slice(0, s.pages) } }]
      : [];
  });
}

export function findLesson(subjectId: string | undefined, number: number): Lesson | undefined {
  return SUBJECTS.find((s) => s.id === subjectId)?.lessons[number];
}
