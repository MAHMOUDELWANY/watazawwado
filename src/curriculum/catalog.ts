import type { Lesson } from './types';
import { lesson01 } from './content/zad-kids/l01-the-visitor-in-white.js';
import { lesson02 } from './content/zad-kids/l02-who-made-it-all.js';
import { lesson03 } from './content/zad-kids/l03-allah-is-one.js';
import { lesson01Teens } from './content/zad-teens/l01-the-stranger-with-no-dust.js';
import { lesson02Teens } from './content/zad-teens/l02-did-it-all-just-happen.js';
import { lesson03Teens } from './content/zad-teens/l03-one-not-many.js';
import { lesson01Adults } from './content/zad-adults/l01-the-man-no-one-knew.js';
import { lesson02Adults } from './content/zad-adults/l02-a-world-that-should-not-exist.js';
import { lessonA01 } from './content/literacy-a-kids/l01-welcome-to-arabic.js';
import { lessonA02 } from './content/literacy-a-kids/l02-dots-make-the-difference.js';
import { lessonF01 } from './content/fusha-kids/l01-what-is-this.js';
import { seerahE01 } from './content/seerah-teens/l01-the-invincible-army.js';
import { seerahE02 } from './content/seerah-teens/l02-the-desert-nurse.js';
import { seerahE03 } from './content/seerah-teens/l03-three-goodbyes.js';
import { seerahE04 } from './content/seerah-teens/l04-the-monk-on-the-road.js';
import { lessonB01 } from './content/literacy-b/l01-same-letters-new-marks.js';
import { lessonAA01 } from './content/literacy-a-adults/l01-welcome-to-arabic.js';
import { lessonAA02 } from './content/literacy-a-adults/l02-fewer-shapes-than-you-think.js';
import { lessonT01 } from './content/tajweed/l01-every-letter-has-a-right.js';
import { lessonQ01 } from './content/quran-reading/l01-reading-al-fatiha.js';
import { lessonEN01 } from './content/english-kids/l01-the-snake-sound.js';
import { lessonE01 } from './content/egyptian-adults/l01-ahlan-whats-your-name.js';
import { lessonFT01 } from './content/fusha-12/l01-first-day.js';
import { lessonAT01 } from './content/literacy-a-teens/l01-welcome-to-arabic.js';
import { lessonAT02 } from './content/literacy-a-teens/l02-crack-the-code.js';
import { lessonEK01 } from './content/egyptian-kids/l01-ahlan-teta.js';
import { lessonET01 } from './content/egyptian-teens/l01-ezzayak.js';
import { lessonEG01 } from './content/english-general/l01-hello-im.js';
import { lessonEX01 } from './content/english-exams/l01-your-first-three-minutes.js';
import { seerahK01 } from './content/seerah-kids/l01-the-elephant-who-sat-down.js';
import { seerahK02 } from './content/seerah-kids/l02-halimah-and-the-blessed-baby.js';
import { seerahK03 } from './content/seerah-kids/l03-three-goodbyes.js';
import { seerahK04 } from './content/seerah-kids/l04-the-monk-on-the-road.js';
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
    art: '/curriculum/banners/zad-kids.webp',
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
    art: '/curriculum/banners/zad-teens.webp',
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
    art: '/curriculum/banners/zad-adults.webp',
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
    art: '/curriculum/banners/literacy-a-kids.webp',
    parts: [
      { title: 'All Aboard', titleAr: 'يلا نركب', from: 1 },
      { title: 'The Letters', titleAr: 'الحروف', from: 2 },
      { title: 'Letters Hold Hands', titleAr: 'الحروف بتمسك إيد بعض', from: 12 },
      { title: 'More Little Marks', titleAr: 'علامات صغيرة كمان', from: 16 },
      { title: 'Stretching', titleAr: 'المدود', from: 20 },
      { title: 'Special Marks', titleAr: 'علامات مميزة', from: 23 },
      { title: 'Reading Town', titleAr: 'مدينة القراءة', from: 28 },
    ],
    // docs/curriculum/literacy/PLAN.md (the Letter Train, 32 lessons; approved 2026-10-26).
    plan: [
      'Welcome to Arabic', 'ب ت ث', 'ج ح خ', 'د ذ ر ز', 'س ش', 'ص ض ط ظ', 'ع غ', 'ف ق', 'ك ل م', 'ن ه و ي', 'ء and All 28',
      'Start, Middle, End', 'The Six That Let Go', 'Every Letter Joined', 'Words with Fatha',
      'Kasra', 'Damma', 'Three Vowels Together', 'Sukoon: the Stop',
      'Alif Stretches', 'Yaa Stretches', 'Waw Stretches',
      'Tanween', 'Shadda', 'Al- and the Moon Letters', 'Al- and the Sun Letters', 'ة ى and the Small Alif',
      'Sentences', 'My First Story', 'No Marks', 'Signs, Labels, Menus', 'I Can Read Anything',
    ],
    lessons: { 1: lessonA01, 2: lessonA02 },
  },
  {
    id: 'literacy-a-adults',
    group: 'literacy',
    title: 'Reading Arabic · Adults',
    titleAr: 'القرائية · للكبار',
    version: 'Adults',
    versionAr: 'الكبار',
    audience: '18+',
    art: '/curriculum/banners/literacy-a-adults.webp',
    parts: [
      { title: 'Start', titleAr: 'البداية', from: 1 },
      { title: 'The Letters', titleAr: 'الحروف', from: 2 },
      { title: 'Joining', titleAr: 'اتصال الحروف', from: 8 },
      { title: 'Vowels and Marks', titleAr: 'الحركات والعلامات', from: 11 },
      { title: 'Without Marks', titleAr: 'من غير تشكيل', from: 19 },
      { title: 'The Real World', titleAr: 'القراءة في الحياة', from: 22 },
    ],
    // docs/curriculum/literacy/PLAN.md (Teens and Adults share one list, 26 lessons; approved 2026-10-26).
    plan: [
      'Welcome to Arabic', 'ب ت ث · ج ح خ', 'د ذ ر ز · س ش', 'ص ض ط ظ', 'ع غ · ف ق', 'ك ل م · ن ه و ي', 'ء and All 28',
      'Start, Middle, End', 'The Six That Let Go', 'Words with Fatha',
      'Kasra and Damma', 'Sukoon', 'Long Vowels', 'Tanween', 'Shadda', 'Al-', 'Spelling Marks', 'Sentences',
      'Dropping the Marks', 'Patterns and Context', 'Fonts and Handwriting',
      'Signs and Streets', 'Menus and Labels', 'Messages', 'Headlines and a Short Article', 'I Can Read Anything',
    ],
    lessons: { 1: lessonAA01, 2: lessonAA02 },
  },
  {
    id: 'fusha-kids',
    group: 'fusha',
    title: 'Fusha Arabic · Kids',
    titleAr: 'الفصحى · للأطفال',
    version: 'Kids',
    versionAr: 'الأطفال',
    audience: '6–11',
    art: '/curriculum/banners/fusha-kids.webp',
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
    art: '/curriculum/banners/seerah-teens.webp',
    parts: [
      { title: 'Season 1 · Before the Light', titleAr: 'الموسم الأول · قبل النور', from: 1 },
      { title: "Season 2 · Iqra'", titleAr: 'الموسم الثاني · اقرأ', from: 9 },
      { title: 'Season 3 · The Road to Madinah', titleAr: 'الموسم الثالث · الطريق إلى المدينة', from: 21 },
      { title: 'Season 4 · Building Madinah', titleAr: 'الموسم الرابع · بناء المدينة', from: 26 },
      { title: 'Season 5 · Trials and Victory', titleAr: 'الموسم الخامس · المحن والنصر', from: 32 },
      { title: 'Season 6 · The Farewell', titleAr: 'الموسم السادس · الوداع', from: 43 },
    ],
    // docs/curriculum/seerah/MAP.md (46 episodes in 6 seasons, approved by the owner 2026-10-26).
    plan: [
      "The Invincible Army", "The Desert Nurse", "Three Goodbyes", "The Monk on the Road", "The Pact of the Just", "Al-Amin", "Khadijah", "The Stone and the Cave", "Read!", "The First Believers", "On the Mountain of Safa", "Under the Sun of Makkah", "The Offers", "The Lion of Allah", "The Man Who Came to Kill", "To the Just King", "The Boycott", "The Year of Sorrow", "Ta'if", "The Night Journey", "The Pledges of Aqabah", "The Plot", "The Cave of Thawr", "The Chase", "The Moon Rose Over Us", "The First Masjid", "Brothers", "A City of Neighbours", "Ahl as-Suffah", "The Prophet ﷺ at Home", "Ramadan and the First Eid", "Badr", "Uhud", "The Trench", "The Treaty", "Letters to Kings", "Khaybar", "Mu'tah", "The Conquest of Makkah", "Hunayn", "Tabuk", "The Year of Delegations", "The Farewell Hajj", "The Last Days", "\"Whoever Worshipped Muhammad…\"", "The Light Continues",
    ],
    lessons: { 1: seerahE01, 2: seerahE02, 3: seerahE03, 4: seerahE04 },
  },
  {
    id: 'literacy-b-kids',
    group: 'quran',
    title: 'Quranic Reading Rules',
    titleAr: 'قواعد القراءة القرآنية',
    version: 'Reading rules',
    versionAr: 'قواعد القراءة',
    audience: '6+',
    art: '/curriculum/banners/literacy-b-kids.webp',
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
    id: 'english-kids',
    group: 'english',
    title: 'English · Kids',
    titleAr: 'الإنجليزي · للأطفال',
    version: 'Kids',
    versionAr: 'الأطفال',
    audience: '5–9',
    art: '/curriculum/banners/english-kids.webp',
    parts: [{ title: 'Phonics Level 1', titleAr: 'الفونكس · المستوى الأول', from: 1 }],
    // docs/curriculum/english/MAP-kids.md (Claude's draft, 2026-10-26, for the owner's review).
    plan: [
      'The Snake Sound', 'Pins and Pans', 'Review: My First Sentence', 'Kick and Cat', 'Run, Mum!', 'Up and Down',
      'Fish and Bat', 'Review: A Short Story', 'Rain and Boat', 'Pie and Bee', 'Jam and Fork', 'Zip and Win',
      'Sing and Van', 'Book and Moon', 'Yes and Box', 'Chip and Ship', 'This and Thin', 'Queen and Out', 'Coin and Cue',
      'Her and Car', 'Tricky Words (1)', 'Tricky Words (2)', 'Two Short Stories', 'I Can Read English',
    ],
    lessons: { 1: lessonEN01 },
  },
  {
    id: 'quran-reading',
    group: 'quran',
    title: 'Quran Reading',
    titleAr: 'قراءة القرآن',
    version: 'Quran reading',
    versionAr: 'قراءة القرآن',
    audience: '12+',
    art: '/curriculum/banners/quran-reading.webp',
    parts: [{ title: "Juz 'Amma and Al-Fatiha", titleAr: 'جزء عمّ والفاتحة', from: 1 }],
    // docs/curriculum/quran-reading/MAP.md (Claude's draft, 2026-10-26, for the owner's review).
    plan: [
      'Reading Al-Fatiha from the Page', 'The Last Two Surahs', 'One and Many', 'Short and Steady', 'Gifts and Losses',
      'Journeys', 'Time', 'The Race', 'The Shaking', 'The Clear Proof', 'The Night of Power', 'The Fig', 'Relief',
      'The Night', 'The Sun', 'The Dawn', 'The Overwhelming', 'The Night Visitor', "Juz 'Amma Recital",
    ],
    lessons: { 1: lessonQ01 },
  },
  {
    id: 'tajweed',
    group: 'quran',
    title: 'Tajweed · Level 1',
    titleAr: 'التجويد · المستوى الأول',
    version: 'Tajweed',
    versionAr: 'التجويد',
    audience: '12+',
    art: '/curriculum/banners/tajweed.webp',
    parts: [{ title: 'Level 1 · The Essential Rules', titleAr: 'المستوى الأول · الأحكام الأساسية', from: 1 }],
    // docs/curriculum/tajweed/MAP.md (Claude's draft, 2026-10-26, for the owner's review).
    plan: [
      'Every Letter Has a Right', 'The Bounce', 'Four Doors', 'Merging', 'The Hidden Swap', 'Hiding', 'All Four Doors',
      'Lips Together', 'The Hum', 'Sun and Moon', 'The Name Allah', 'Two Counts', 'When Hamza Follows', 'More Stretches',
      'The Longest Stretch', 'Heavy and Light', 'Raa', 'Where to Stop', 'Level 1 Recital',
    ],
    lessons: { 1: lessonT01 },
  },
  {
    id: 'egyptian-adults',
    group: 'egyptian',
    title: 'Egyptian Arabic · Adults',
    titleAr: 'العامية المصرية · للكبار',
    version: 'Adults',
    versionAr: 'الكبار',
    audience: '18+',
    art: '/curriculum/banners/egyptian-adults.webp',
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
  {
    id: 'fusha-12',
    group: 'fusha',
    title: 'Fusha Arabic · 12+',
    titleAr: 'الفصحى · 12 سنة فأكبر',
    version: '12+',
    versionAr: '12 سنة فأكبر',
    audience: '12+',
    art: '/curriculum/banners/fusha-12.webp',
    parts: [{ title: 'Level 1', titleAr: 'المستوى الأول', from: 1 }],
    // docs/curriculum/fusha/MAP-12plus.md (Claude's draft, 2026-10-26, for the owner's review).
    plan: [
      'First Day at the Institute', 'Is This Your Room?', 'Near and Far', 'The Door and a Door', 'Where Is the Library?',
      'Whose Is This?', 'My Phone, Your Laptop', 'A New Building', 'Who Are You?', 'Numbers and Prices',
      'Review: My First Week', 'Where Did You Go?', 'We Went Together', 'From and To', 'What Did You Eat?', 'My Week',
      'Classmates', 'Many Books', 'Level 1 Story',
    ],
    lessons: { 1: lessonFT01 },
  },
  {
    id: 'literacy-a-teens',
    group: 'literacy',
    title: 'Reading Arabic · Teens',
    titleAr: 'القرائية · للشباب',
    version: 'Teens',
    versionAr: 'الشباب',
    audience: '12–17',
    art: '/curriculum/banners/literacy-a-teens.webp',
    parts: [
      { title: 'Start', titleAr: 'البداية', from: 1 },
      { title: 'The Letters', titleAr: 'الحروف', from: 2 },
      { title: 'Joining', titleAr: 'اتصال الحروف', from: 8 },
      { title: 'Vowels and Marks', titleAr: 'الحركات والعلامات', from: 11 },
      { title: 'Without Marks', titleAr: 'من غير تشكيل', from: 19 },
      { title: 'The Real World', titleAr: 'القراءة في الحياة', from: 22 },
    ],
    // docs/curriculum/literacy/PLAN.md (Teens and Adults share one list, 26 lessons; approved 2026-10-26).
    plan: [
      'Welcome to Arabic', 'ب ت ث · ج ح خ', 'د ذ ر ز · س ش', 'ص ض ط ظ', 'ع غ · ف ق', 'ك ل م · ن ه و ي', 'ء and All 28',
      'Start, Middle, End', 'The Six That Let Go', 'Words with Fatha',
      'Kasra and Damma', 'Sukoon', 'Long Vowels', 'Tanween', 'Shadda', 'Al-', 'Spelling Marks', 'Sentences',
      'Dropping the Marks', 'Patterns and Context', 'Fonts and Handwriting',
      'Signs and Streets', 'Menus and Labels', 'Messages', 'Headlines and a Short Article', 'I Can Read Anything',
    ],
    lessons: { 1: lessonAT01, 2: lessonAT02 },
  },
  {
    id: 'egyptian-kids',
    group: 'egyptian',
    title: 'Egyptian Arabic · Kids',
    titleAr: 'العامية المصرية · للأطفال',
    version: 'Kids',
    versionAr: 'الأطفال',
    audience: '6–11',
    art: '/curriculum/banners/egyptian-kids.webp',
    parts: [{ title: "Beginner · Summer at Teta's", titleAr: 'المبتدئ · الصيف عند تيتة', from: 1 }],
    // docs/curriculum/egyptian/MAP.md, Kids section (Claude's draft, 2026-10-26, for the owner's review).
    plan: [
      'Ahlan, Teta!', 'Where Are You From?', "What's This?", 'Where Are My Keys?', 'Numbers and Phones',
      'What Time Is It?', 'How Much?', 'At the Market', 'Where Is It?', 'My Address', 'Review: The First Month',
    ],
    lessons: { 1: lessonEK01 },
  },
  {
    id: 'egyptian-teens',
    group: 'egyptian',
    title: 'Egyptian Arabic · Teens',
    titleAr: 'العامية المصرية · للشباب',
    version: 'Teens',
    versionAr: 'الشباب',
    audience: '12–17',
    art: '/curriculum/banners/egyptian-teens.webp',
    parts: [{ title: 'Beginner · Summer in Cairo', titleAr: 'المبتدئ · صيف في القاهرة', from: 1 }],
    // docs/curriculum/egyptian/MAP.md, Teens section (Claude's draft, 2026-10-26, for the owner's review).
    plan: [
      "Ezzayak? What's Up, Cairo", 'Where Are You From?', "What's This?", 'Where Are My Keys?', 'Numbers and Phones',
      'What Time Is It?', 'How Much?', 'At the Market', 'Where Is It?', 'My Address', 'Review: The First Month',
    ],
    lessons: { 1: lessonET01 },
  },
  {
    id: 'english-general',
    group: 'english',
    title: 'English · General',
    titleAr: 'الإنجليزي · عام',
    version: 'General',
    versionAr: 'عام',
    audience: '12+',
    art: '/curriculum/banners/english-general.webp',
    parts: [{ title: 'Level 1', titleAr: 'المستوى الأول', from: 1 }],
    // docs/curriculum/english/MAP-general.md (Claude's draft, 2026-10-26, for the owner's review).
    plan: [
      "Hello, I'm…", 'Where Are You From?', 'Numbers and Phones', 'My Things', 'Family', 'My Day', 'Her Day', 'Time',
      'Review: A Week in London', 'Food and Drink', 'How Much?', 'Where Is It?', 'Can You…?', 'Yesterday', 'Last Weekend',
      'A Trip', 'Plans', 'Level 1 Review',
    ],
    lessons: { 1: lessonEG01 },
  },
  {
    id: 'english-exams',
    group: 'english',
    title: 'English · Exams (IELTS)',
    titleAr: 'الإنجليزي · الامتحانات (IELTS)',
    version: 'Exams',
    versionAr: 'الامتحانات',
    audience: '16+',
    art: '/curriculum/banners/english-exams.webp',
    parts: [{ title: 'Band 4–5 → 5.5', titleAr: 'من 4–5 لـ 5.5', from: 1 }],
    // docs/curriculum/english/MAP-exams.md (Claude's draft, 2026-10-26, for the owner's review).
    plan: [
      'Your First Three Minutes', 'Listen for the Gap', 'Skim, Then Scan', 'Describe the Trend', 'Two Minutes Alone',
      'Signposts', 'True, False, Not Given', 'Have Your Say', 'Why Do You Think So?', 'Mock Test 1',
    ],
    lessons: { 1: lessonEX01 },
  },
  {
    id: 'seerah-kids',
    group: 'seerah',
    title: 'Seerah · Kids',
    titleAr: 'السيرة · للأطفال',
    version: 'Kids',
    versionAr: 'الأطفال',
    audience: '6–11',
    art: '/curriculum/banners/seerah-kids.webp',
    parts: [
      { title: 'Season 1 · Before the Light', titleAr: 'الموسم الأول · قبل النور', from: 1 },
      { title: "Season 2 · Iqra'", titleAr: 'الموسم الثاني · اقرأ', from: 9 },
      { title: 'Season 3 · The Road to Madinah', titleAr: 'الموسم الثالث · الطريق إلى المدينة', from: 21 },
      { title: 'Season 4 · Building Madinah', titleAr: 'الموسم الرابع · بناء المدينة', from: 26 },
      { title: 'Season 5 · Trials and Victory', titleAr: 'الموسم الخامس · المحن والنصر', from: 32 },
      { title: 'Season 6 · The Farewell', titleAr: 'الموسم السادس · الوداع', from: 43 },
    ],
    // docs/curriculum/seerah/MAP.md (same 46 episodes as Teens & Adults, told for children; approved 2026-10-26).
    plan: [
      "The Elephant Who Sat Down", "Halimah and the Blessed Baby", "Three Goodbyes", "The Monk on the Road", "The Pact of the Just", "Al-Amin", "Khadijah", "The Stone and the Cave", "Read!", "The First Believers", "On the Mountain of Safa", "Under the Sun of Makkah", "The Offers", "The Lion of Allah", "The Man Who Came to Kill", "To the Just King", "The Boycott", "The Year of Sorrow", "Ta'if", "The Night Journey", "The Pledges of Aqabah", "The Plot", "The Cave of Thawr", "The Chase", "The Moon Rose Over Us", "The First Masjid", "Brothers", "A City of Neighbours", "Ahl as-Suffah", "The Prophet ﷺ at Home", "Ramadan and the First Eid", "Badr", "Uhud", "The Trench", "The Treaty", "Letters to Kings", "Khaybar", "Mu'tah", "The Conquest of Makkah", "Hunayn", "Tabuk", "The Year of Delegations", "The Farewell Hajj", "The Last Days", "\"Whoever Worshipped Muhammad…\"", "The Light Continues",
    ],
    lessons: { 1: seerahK01, 2: seerahK02, 3: seerahK03, 4: seerahK04 },
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
    art: '/curriculum/banners/zad-essentials.webp',
    planned: [],
  },
  {
    id: 'seerah',
    title: 'Seerah',
    titleAr: 'السيرة',
    tagline: 'The life of the Prophet ﷺ, told so it changes ours.',
    taglineAr: 'حياة النبي ﷺ، تتحكي عشان تغيّر حياتنا.',
    art: '/curriculum/banners/seerah.webp',
    // Two versions (owner, 2026-10-25): Kids, and one shared version for teens and adults.
    planned: [],
  },
  // Beyond the Zad Path: docs/superpowers/specs/2026-10-25-subjects-curricula-design.md §2.
  {
    id: 'literacy',
    title: 'Reading Arabic',
    titleAr: 'القرائية',
    tagline: 'From the first letter to reading on your own. The door to the Quran, Fusha and Egyptian.',
    taglineAr: 'من أول حرف لحد ما تقرا لوحدك. الباب للقرآن والفصحى والمصري.',
    art: '/curriculum/banners/literacy.webp',
    planned: [
      { version: 'Franco', versionAr: 'فرانكو', audience: '18+' },
    ],
  },
  {
    id: 'quran',
    title: 'Quran',
    titleAr: 'القرآن',
    tagline: 'Reading the Mushaf as it is written, then reciting it with tajweed.',
    taglineAr: 'تقرا المصحف زي ما هو مكتوب، وبعدين تتلوه بالتجويد.',
    art: '/curriculum/banners/quran.webp',
    planned: [
    ],
  },
  {
    id: 'egyptian',
    title: 'Egyptian Arabic',
    titleAr: 'العامية المصرية',
    tagline: "The Arabic of Cairo's streets and kitchens: greet, ask, bargain and visit family the way Egyptians do.",
    taglineAr: 'عربي شوارع القاهرة وبيوتها: تسلّم وتسأل وتفاصل وتزور العيلة زي المصريين.',
    art: '/curriculum/banners/egyptian.webp',
    // Arabic script in three versions (Adults first) and one Franco version (design §4.6).
    planned: [
      { version: 'Franco', versionAr: 'فرانكو', audience: '18+' },
    ],
  },
  {
    id: 'english',
    title: 'English',
    titleAr: 'الإنجليزي',
    tagline: 'English for what you need it for: reading for children, everyday conversation, exams or work.',
    taglineAr: 'إنجليزي للي إنت محتاجه: قراءة للأطفال، كلام يومي، امتحانات أو شغل.',
    art: '/curriculum/banners/english.webp',
    // Goal-based tracks (design §4.7).
    planned: [
    ],
  },
  {
    id: 'fusha',
    title: 'Fusha Arabic',
    titleAr: 'العربية الفصحى',
    tagline: 'Understand it, then speak it: stories first, rules after, words that come back until they stay.',
    taglineAr: 'افهمها وبعدين اتكلمها: الحكاية الأول، والقاعدة بعدها، والكلمات بترجع لحد ما تثبت.',
    art: '/curriculum/banners/fusha.webp',
    planned: [
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
