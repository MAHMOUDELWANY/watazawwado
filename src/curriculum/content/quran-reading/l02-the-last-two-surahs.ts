import type { Lesson } from '../../types';
import { lessonQ02TeacherAr } from './l02-teacher-ar.js';

// Map: docs/curriculum/quran-reading/MAP.md (Lesson 2). Ayat: Uthmani Hafs through the Quran connector (quran.ai,
// fetched 2026-11-03), unchanged; audio streams from Husary (muallim). English meanings follow Abdel Haleem (same
// connector), with "Allah" for the divine name, for the owner's review.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const N1 = R('nas-1', 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ', '114:1');
const N2 = R('nas-2', 'مَلِكِ ٱلنَّاسِ', '114:2');
const N3 = R('nas-3', 'إِلَـٰهِ ٱلنَّاسِ', '114:3');
const N4 = R('nas-4', 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ', '114:4');
const N5 = R('nas-5', 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ', '114:5');
const N6 = R('nas-6', 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ', '114:6');
const F1 = R('falaq-1', 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', '113:1');
const F2 = R('falaq-2', 'مِن شَرِّ مَا خَلَقَ', '113:2');
const F3 = R('falaq-3', 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', '113:3');
const F4 = R('falaq-4', 'وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ', '113:4');
const F5 = R('falaq-5', 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', '113:5');

export const lessonQ02: Lesson = {
  subject: 'quran-reading',
  version: 'adults',
  subjectTitle: 'Quran Reading',
  number: 2,
  title: 'The Last Two Surahs',
  titleAr: 'المعوّذتان',
  part: 'Juz \'Amma and Al-Fatiha',
  minutes: 40,
  goal: 'By the end of this lesson, you will read An-Nas and Al-Falaq from the Mushaf and give every doubled letter its two sounds.',
  reviewed: false,
  teacherAr: lessonQ02TeacherAr,
  outcomes: [
    'Reads a letter with a shadda as two sounds: one that closes a syllable, one that opens the next (rab-bi).',
    'Reads ٱلنَّاسِ with the lam silent and the noon doubled.',
    'Reads An-Nas and Al-Falaq ayah by ayah in three moves: listen, follow, read.',
    'Breaks the long word ٱلنَّفَّـٰثَـٰتِ into its beats and reads it smoothly.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'The shadda', page: 2 },
    { label: 'An-Nas', page: 3 },
    { label: 'Al-Falaq', page: 6 },
    { label: 'Practice', page: 8 },
    { label: 'My mission', page: 10 },
  ],
  pages: [
    {
      title: 'The Last Two Surahs',
      station: 'spark',
      layout: 'cover',
      scene: 'qr2Cover',
      lines: [],
      explain: [
        'Ask about the mission: did the learner read Al-Fatiha from the page every day? Which ayah still feels slow?',
        'Tell them: today we open the Mushaf from the very end.',
      ],
    },
    {
      title: 'Warm-up: the paused ayat',
      station: 'spark',
      layout: 'concept',
      scene: 'qr2Warm',
      lines: [
        'Before the new page, read Al-Fatiha once more, finger under every word.',
        'Start with the ayat your teacher marked "paused" last time.',
      ],
      say: [R('fatiha-1', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', '1:1')],
      explain: ['Use the paused ayat from your last report. Three minutes at most; praise every ayah that is now smooth.'],
    },
    {
      title: 'One mark, two sounds',
      station: 'zad',
      layout: 'concept',
      scene: 'qr2Shadda',
      lines: [
        'The small "w" on a letter is a shadda. It means: say this letter twice.',
        'The first one closes a syllable, the second opens the next: rab-bi, not ra-bi.',
        'You will meet it in almost every ayah of these two surahs. Hold it for a moment, then move on.',
      ],
      items: ['بِرَبِّ: bi-rab-bi', 'شَرِّ: shar-ri', 'ٱلنَّاسِ: an-naa-si'],
      say: [N1, F2],
      explain: [
        'Show the shadda as two letters pressed into one. Say rab-bi slowly with a small stop in the middle.',
        'In ٱلنَّاسِ the lam is written but not read: the shadda on the noon tells you the lam melts into it.',
      ],
      teacherNote: 'The sun letters themselves are Literacy B Lesson 5. Here only: lam silent, noon doubled.',
    },
    {
      title: 'An-Nas, ayat 1 to 3',
      station: 'zad',
      layout: 'concept',
      scene: 'qr2Nas1',
      lines: [
        'Say: I seek refuge with the Lord of people, the King of people, the God of people.',
        'The first ayah has two doubled letters: بِرَبِّ and ٱلنَّاسِ.',
        'Ayat 2 and 3 end with the same word. Read them before you hear them.',
      ],
      say: [N1, N2, N3],
      explain: [
        'Listen, follow, read. In ayah 3, point at the small alif on the lam of إِلَـٰهِ: ilaahi.',
        'Let the learner read ayat 2 and 3 first, then check with the reciter.',
      ],
    },
    {
      title: 'An-Nas, ayat 4 to 6',
      station: 'zad',
      layout: 'concept',
      scene: 'qr2Nas4',
      lines: [
        'From the harm of the slinking whisperer, who whispers into the hearts of people, from jinn and people.',
        'Three new doubled letters: ٱلْخَنَّاسِ، ٱلَّذِى، ٱلْجِنَّةِ.',
        'In ٱلَّذِى the lam is doubled: al-ladhee. The small alif at the start is silent when you join.',
      ],
      say: [N4, N5, N6],
      explain: [
        'Ayah 5 is the longest. Follow it twice before reading.',
        'يُوَسْوِسُ and ٱلْوَسْوَاسِ repeat the sound "waswas": let the learner hear the whisper in the word itself.',
      ],
    },
    {
      title: 'A surah that rhymes',
      station: 'zad',
      layout: 'concept',
      scene: 'qr2Rhyme',
      lines: [
        'Look at the end of every ayah in An-Nas.',
        'All six end in the same sound: "-aas".',
        'Five of them end with the same word, ٱلنَّاسِ. Once you can read it, you can finish every ayah.',
      ],
      explain: [
        'Let the learner run a finger down the ends of the six ayat. The pattern makes the surah easy to read and to remember.',
        'The only different ending is ayah 4: ٱلْخَنَّاسِ, which still ends in "-aas".',
      ],
    },
    {
      title: 'Al-Falaq, ayat 1 to 3',
      station: 'zad',
      layout: 'concept',
      scene: 'qr2Falaq1',
      lines: [
        'Say: I seek refuge with the Lord of daybreak, against the harm in what He has created, the harm in the night when darkness gathers.',
        'It opens like An-Nas: قُلْ أَعُوذُ بِرَبِّ. Only the last word changes.',
        'شَرِّ comes in four ayat. The raa is doubled every time: shar-ri.',
      ],
      say: [F1, F2, F3],
      explain: [
        'Listen, follow, read. Let the learner find the four شَرِّ on the page before reading.',
        'In غَاسِقٍ the tanween is read "-in": ghaasiqin. Tanween is the focus of the next lesson.',
      ],
    },
    {
      title: 'Al-Falaq, ayat 4 and 5',
      station: 'zad',
      layout: 'concept',
      scene: 'qr2Falaq4',
      lines: [
        'The harm in witches when they blow on knots, the harm in the envier when he envies.',
        'The hardest word of the lesson: ٱلنَّفَّـٰثَـٰتِ. Two doubled letters and two small alifs.',
        'Break it into beats: an-naf-faa-thaat. Then join them.',
      ],
      say: [F4, F5],
      explain: [
        'Clap the beats: an / naf / faa / thaat. Read it slowly three times, then at normal speed.',
        'Ayah 5 has no shadda: a breather after the hardest word.',
      ],
    },
    {
      title: 'Short review: one sound or two?',
      station: 'athar',
      layout: 'game',
      scene: 'qr2Review',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Eight words from the two surahs. Does each one have a doubled letter?',
        bins: [
          { id: 'two', label: 'Doubled', hint: 'a shadda: say it twice' },
          { id: 'one', label: 'Single', hint: 'no shadda' },
        ],
        cards: [
          { label: 'بِرَبِّ', bin: 'two', why: 'A shadda on the baa: bi-rab-bi.' },
          { label: 'قُلْ', bin: 'one', why: 'A sukoon on the lam, no shadda: qul.' },
          { label: 'شَرِّ', bin: 'two', why: 'A shadda on the raa: shar-ri.' },
          { label: 'خَلَقَ', bin: 'one', why: 'Three single letters: kha-la-qa.' },
          { label: 'ٱلنَّاسِ', bin: 'two', why: 'The lam is silent and the noon is doubled: an-naas.' },
          { label: 'مَلِكِ', bin: 'one', why: 'No shadda: ma-li-ki.' },
          { label: 'ٱلْخَنَّاسِ', bin: 'two', why: 'A shadda on the noon: al-khan-naas.' },
          { label: 'صُدُورِ', bin: 'one', why: 'No shadda: su-doo-ri.' },
        ],
      },
      explain: [
        'A short review, no timer and no points. The result goes into your lesson report.',
        'Ask the learner to read each word aloud before choosing.',
      ],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Read both surahs',
      station: 'athar',
      layout: 'question',
      scene: 'qr2Read',
      lines: [
        'Now read Al-Falaq, then An-Nas, from the page, without the reciter.',
        'Your teacher marks each ayah: smooth, paused, or helped.',
      ],
      say: [F1],
      interaction: {
        kind: 'ask',
        prompt: 'Read both surahs to your teacher, finger under the words. Did every shadda get its two sounds?',
        reveal: 'Eleven ayat from the page. The paused ones are next lesson\'s warm-up.',
      },
      explain: ['Mark each of the eleven ayat honestly. Correct only the shadda and the silent lam today.'],
      teacherNote: 'Write the paused ayat in your report: they are next lesson\'s warm-up.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'qr2Mission',
      lines: [
        'Once a day this week, read Al-Falaq and An-Nas from the Mushaf.',
        'Pick a fixed moment, so the reading finds its place in your day.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'When will you read them this week?',
        options: ['Before I sleep', 'After Fajr', 'After Maghrib', 'On my way to school or work'],
      },
      explain: ['Next lesson starts with these two surahs from the page as the warm-up.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'qr2Next',
      lines: [
        'Turn back one page: Al-Ikhlas and Al-Masad.',
        'Little double marks at the ends of words: an, in, un.',
        'Next time: tanween, and the small letters after it.',
      ],
      say: [R('ikhlas-4', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', '112:4')],
      explain: ['Let the learner find Al-Ikhlas now and spot one tanween before the next lesson.'],
    },
  ],
};
