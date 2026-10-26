import type { Lesson } from '../../types';
import { lessonQ01TeacherAr } from './l01-teacher-ar.js';

// Map: docs/curriculum/quran-reading/MAP.md. Ayat: Tanzil Uthmani Hafs through the Quran connector (2026-10-26),
// unchanged; audio streams from Husary (muallim). English meanings are ours, for the owner's review.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const F1 = R('fatiha-1', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', '1:1');
const F2 = R('fatiha-2', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', '1:2');
const F3 = R('fatiha-3', 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', '1:3');
const F4 = R('fatiha-4', 'مَـٰلِكِ يَوْمِ ٱلدِّينِ', '1:4');
const F5 = R('fatiha-5', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', '1:5');
const F6 = R('fatiha-6', 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', '1:6');
const F7 = R('fatiha-7', 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', '1:7');

export const lessonQ01: Lesson = {
  subject: 'quran-reading',
  version: 'adults',
  subjectTitle: 'Quran Reading',
  number: 1,
  title: 'Reading Al-Fatiha from the Page',
  titleAr: 'نقرأ الفاتحة من المصحف',
  part: 'Juz \'Amma and Al-Fatiha',
  minutes: 40,
  goal: 'By the end of this lesson, you will read Al-Fatiha from the Mushaf, word by word as it is written, and not only from memory.',
  reviewed: false,
  teacherAr: lessonQ01TeacherAr,
  outcomes: [
    'Reads each ayah of Al-Fatiha from the page in three moves: listen, follow, read.',
    'Reads the small (dagger) alif as a long aa in ٱلرَّحْمَـٰنِ، ٱلْعَـٰلَمِينَ، مَـٰلِكِ، ٱلصِّرَٰطَ.',
    'Starts ٱهْدِنَا correctly when beginning from it.',
    'Holds the long stretch of ٱلضَّآلِّينَ.',
    'Reads the whole surah to the teacher, ayah by ayah.',
  ],
  chapters: [
    { label: 'Why read it', page: 0 },
    { label: 'Three moves', page: 2 },
    { label: 'Ayah by ayah', page: 3 },
    { label: 'Practice', page: 8 },
    { label: 'My mission', page: 10 },
  ],
  pages: [
    {
      title: 'Reading Al-Fatiha from the Page',
      station: 'spark',
      layout: 'cover',
      scene: 'qr1Cover',
      lines: [],
      explain: [
        'Welcome the learner. Ask them to open a Mushaf (or the one on screen) at Al-Fatiha.',
        'Tell them: today we read with our eyes, not only from memory.',
      ],
      teacherNote: 'Have a printed Mushaf ready if possible. Reading from paper is the goal of this course.',
    },
    {
      title: 'Seventeen times a day',
      station: 'spark',
      layout: 'story',
      scene: 'qr1Seventeen',
      lines: [
        'You say Al-Fatiha at least seventeen times a day: once in every rak\'ah of the five prayers.',
        'Most of us say it from memory, and lose our place when we try to read it from the page.',
        'Today you read it the way it is written, word by word.',
      ],
      explain: [
        'Count it together: Fajr 2, Dhuhr 4, Asr 4, Maghrib 3, Isha 4. Seventeen.',
        'Ask: if I covered the page and pointed at one word, could you read just that word? That is today\'s skill.',
      ],
    },
    {
      title: 'Three moves',
      station: 'zad',
      layout: 'concept',
      scene: 'qr1Moves',
      lines: [
        'Every passage in this course is read in three moves.',
        'Your eye learns the page; your ear checks it; your voice makes it yours.',
      ],
      items: ['Listen: the reciter reads the ayah once', 'Follow: your finger moves under the words, right to left', 'Read: you read it alone, and your teacher marks it'],
      explain: [
        'Show the three moves with the first ayah: play it, follow it, then the learner reads.',
        'Your marks are simple: smooth, paused, or helped. They are a record of progress, not a grade.',
      ],
    },
    {
      title: 'Ayah 1: the small alif',
      station: 'zad',
      layout: 'concept',
      scene: 'qr1Ayah1',
      lines: [
        'In the name of Allah, the Most Merciful, the Most Kind.',
        'Look above the م of ٱلرَّحْمَـٰنِ: a small alif sits there.',
        'It is read like a full alif, a long aa: ar-raḥmān.',
      ],
      say: [F1],
      explain: [
        'Listen, follow, read. Then point at the small alif and let the learner read only that word.',
        'Literacy B called it the standing alif. It appears many times in the Mushaf.',
      ],
    },
    {
      title: 'Ayat 2 and 3',
      station: 'zad',
      layout: 'concept',
      scene: 'qr1Ayah2',
      lines: [
        'All praise belongs to Allah, Lord of all the worlds; the Most Merciful, the Most Kind.',
        'Find the small alif again, above the ع of ٱلْعَـٰلَمِينَ: al-\'aalameen.',
        'Ayah 3 repeats two words you already read. Read them without the reciter.',
      ],
      say: [F2, F3],
      explain: ['Listen, follow, read, ayah by ayah.', 'For ayah 3, skip the listening: the learner reads first, then checks with the reciter.'],
    },
    {
      title: 'Ayah 4',
      station: 'zad',
      layout: 'concept',
      scene: 'qr1Ayah4',
      lines: [
        'Master of the Day of Judgement.',
        'The first word opens with a small alif after its م: maaliki.',
        'Then يَوْمِ: the waw is still, so it glides, yawmi.',
      ],
      say: [F4],
      explain: ['Listen, follow, read.', 'Let the learner say yawm slowly: the waw with sukoon closes the syllable.'],
    },
    {
      title: 'Ayah 5: say it twice',
      station: 'zad',
      layout: 'concept',
      scene: 'qr1Ayah5',
      lines: [
        'You alone we worship, and You alone we ask for help.',
        'The shadda on the ي of إِيَّاكَ doubles it: iyyaaka, not iyaaka.',
        'The word comes twice in the ayah. Read both the same way.',
      ],
      say: [F5],
      explain: ['Listen, follow, read.', 'If the learner reads iyaaka, let them hear the reciter again and count the two ي sounds.'],
    },
    {
      title: 'Ayat 6 and 7: the long road',
      station: 'zad',
      layout: 'concept',
      scene: 'qr1Ayah6',
      lines: [
        'Guide us to the straight path: the path of those You blessed, not of those under anger, nor of those astray.',
        'Starting at ٱهْدِنَا? Its first alif is read as i: ihdinaa.',
        'A small alif sits on the ر of ٱلصِّرَٰطَ: as-siraat.',
        'The wavy line on ٱلضَّآلِّينَ asks you to hold the sound long.',
      ],
      say: [F6, F7],
      explain: [
        'Ayah 7 is the longest: let the learner follow it twice before reading.',
        'Hamzat al-wasl is read only when you start from it; in the middle of reading it is silent (Literacy B, Lesson 4).',
      ],
    },
    {
      title: 'Short review: the small alif',
      station: 'athar',
      layout: 'game',
      scene: 'qr1Review',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Eight words from Al-Fatiha. Does each one carry a small alif?',
        bins: [
          { id: 'yes', label: 'Small alif', hint: 'read a long aa' },
          { id: 'no', label: 'No small alif', hint: 'read as written' },
        ],
        cards: [
          { label: 'ٱلرَّحْمَـٰنِ', bin: 'yes', why: 'Above the م: ar-raḥmān.' },
          { label: 'ٱلْعَـٰلَمِينَ', bin: 'yes', why: 'Above the ع: al-\'aalameen.' },
          { label: 'مَـٰلِكِ', bin: 'yes', why: 'Above the م: maaliki.' },
          { label: 'ٱلصِّرَٰطَ', bin: 'yes', why: 'On the ر: as-siraat.' },
          { label: 'نَعْبُدُ', bin: 'no', why: 'Every vowel is written: na\'budu.' },
          { label: 'يَوْمِ', bin: 'no', why: 'A still waw, no alif: yawmi.' },
          { label: 'ٱلْمُسْتَقِيمَ', bin: 'no', why: 'The long ee is a written ي.' },
          { label: 'أَنْعَمْتَ', bin: 'no', why: 'Short vowels only: an\'amta.' },
        ],
      },
      explain: ['A short review, no timer and no points. The result goes into your lesson report.', 'Ask the learner to read each word aloud before tapping.'],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Read the whole surah',
      station: 'athar',
      layout: 'question',
      scene: 'qr1Read',
      lines: [
        'Now read all seven ayat from the page, without the reciter.',
        'Your teacher marks each ayah: smooth, paused, or helped.',
      ],
      say: [F1],
      interaction: {
        kind: 'ask',
        prompt: 'Read Al-Fatiha to your teacher, finger under the words. How many ayat were smooth?',
        reveal: 'Next lesson we read it once more as a warm-up. The paused ayat come first.',
      },
      explain: ['Mark each ayah honestly. Most learners have 2 or 3 paused ayat the first time; that is normal.', 'Praise the reading from the page, even where it was slower than from memory.'],
      teacherNote: 'Write the paused ayat in your report: they are next lesson\'s warm-up.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'qr1Mission',
      lines: [
        'Once a day this week, read Al-Fatiha from a Mushaf, not from memory.',
        'Finger under every word. If you lose your place, start the ayah again.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'Where will you keep your Mushaf this week, so you see it?',
        options: ['By my bed', 'On my prayer mat', 'In my bag', 'On my phone\'s home screen'],
      },
      explain: ['Next lesson starts with Al-Fatiha from the page as the warm-up.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'qr1Next',
      lines: [
        'Turn to the last page of the Mushaf.',
        'Two short surahs, full of doubled letters.',
        'Next time: An-Nas and Al-Falaq.',
      ],
      explain: ['Let the learner find the last page now: they will start there next lesson.'],
    },
  ],
};
