import type { Lesson } from '../../types';
import { lessonQ03TeacherAr } from './l03-teacher-ar.js';

// Map: docs/curriculum/quran-reading/MAP.md (Lesson 3). Ayat: Uthmani Hafs through the Quran connector (quran.ai,
// fetched 2026-11-03), unchanged; audio streams from Husary (muallim). English meanings follow Abdel Haleem (same
// connector), with "Allah" for the divine name, for the owner's review.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const I1 = R('ikhlas-1', 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', '112:1');
const I2 = R('ikhlas-2', 'ٱللَّهُ ٱلصَّمَدُ', '112:2');
const I3 = R('ikhlas-3', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', '112:3');
const I4 = R('ikhlas-4', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', '112:4');
const M1 = R('masad-1', 'تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ', '111:1');
const M2 = R('masad-2', 'مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ', '111:2');
const M3 = R('masad-3', 'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ', '111:3');
const M4 = R('masad-4', 'وَٱمْرَأَتُهُۥ حَمَّالَةَ ٱلْحَطَبِ', '111:4');
const M5 = R('masad-5', 'فِى جِيدِهَا حَبْلٌ مِّن مَّسَدٍۭ', '111:5');

export const lessonQ03: Lesson = {
  subject: 'quran-reading',
  version: 'adults',
  subjectTitle: 'Quran Reading',
  number: 3,
  title: 'One and Many',
  titleAr: 'الإخلاص والمسد',
  part: 'Juz \'Amma and Al-Fatiha',
  minutes: 40,
  goal: 'By the end of this lesson, you will read Al-Ikhlas and Al-Masad from the Mushaf, read every tanween, and stop on it correctly.',
  reviewed: false,
  teacherAr: lessonQ03TeacherAr,
  outcomes: [
    'Reads the three tanween marks as -un, -in and -an.',
    'Stops on a tanween: -un and -in drop to a still letter, -an becomes a long aa.',
    'Lets the n melt when the next letter carries a shadda (حَبْلٌ مِّن: hablum-min).',
    'Reads Al-Ikhlas and Al-Masad ayah by ayah in three moves: listen, follow, read.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Tanween', page: 2 },
    { label: 'Al-Ikhlas', page: 3 },
    { label: 'Stopping', page: 5 },
    { label: 'Al-Masad', page: 6 },
    { label: 'Practice', page: 8 },
    { label: 'My mission', page: 10 },
  ],
  pages: [
    {
      title: 'One and Many',
      station: 'spark',
      layout: 'cover',
      scene: 'qr3Cover',
      lines: [],
      explain: [
        'Ask about the mission: did the learner read Al-Falaq and An-Nas every day? At what moment?',
        'Tell them: today we turn back one page, to Al-Ikhlas and Al-Masad.',
      ],
    },
    {
      title: 'Warm-up: the paused ayat',
      station: 'spark',
      layout: 'concept',
      scene: 'qr3Warm',
      lines: [
        'Read Al-Falaq and An-Nas once, from the page.',
        'Start with the ayat your teacher marked "paused" last time.',
      ],
      say: [R('falaq-1', 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', '113:1')],
      explain: ['Use the paused ayat from your last report. Three minutes at most.'],
    },
    {
      title: 'Two marks, one n',
      station: 'zad',
      layout: 'concept',
      scene: 'qr3Tanween',
      lines: [
        'A doubled vowel mark at the end of a word is tanween. It adds an n you hear but do not see.',
        'Two dammas: -un. Two kasras: -in. Two fathas: -an.',
        'The two fathas usually come with an alif after them. Inside the ayah, that alif is silent.',
      ],
      items: ['أَحَدٌ: a-ha-dun', 'لَهَبٍ: la-ha-bin', 'نَارًا: naa-ran'],
      say: [I1, M3],
      explain: [
        'Write a ب three times with the three tanween marks: بٌ بٍ بً. Read them bun, bin, ban.',
        'Then point at أَحَدٌ in Al-Ikhlas and لَهَبٍ in Al-Masad.',
      ],
      teacherNote: 'What happens to the n before certain letters is tajweed (the Tajweed course). Here only: read the n, and the one melt the page itself shows with a shadda.',
    },
    {
      title: 'Al-Ikhlas, ayat 1 and 2',
      station: 'zad',
      layout: 'concept',
      scene: 'qr3Ikhlas1',
      lines: [
        'Say: He is Allah, the One; Allah, the Eternal.',
        'Ayah 1 ends on a tanween: أَحَدٌ, a-ha-dun.',
        'In ayah 2, both words start with a silent hamzat al-wasl, and ٱلصَّمَدُ has a shadda: as-sa-ma-du.',
      ],
      say: [I1, I2],
      explain: [
        'Listen, follow, read. Joining ayah 1 to ayah 2: a-ha-dun-al-laa-hu. When you stop, it is a-had.',
        'The stopping rule has its own page; for now let the learner hear the reciter stop.',
      ],
    },
    {
      title: 'Al-Ikhlas, ayat 3 and 4',
      station: 'zad',
      layout: 'concept',
      scene: 'qr3Ikhlas3',
      lines: [
        'He begot no one, nor was He begotten; no one is comparable to Him.',
        'Ayah 3 is four short words, two pairs: lam ya-lid, wa lam yoo-lad.',
        'Ayah 4: يَكُن لَّهُۥ joins into one sound, ya-kul-la-hoo. The shadda on the lam tells you.',
      ],
      say: [I3, I4],
      explain: [
        'لَهُۥ has a small waw: read hu with a long u, hoo (Literacy B, the small letters).',
        'كُفُوًا has tanween with the alif: ku-fu-wan.',
      ],
      teacherNote: 'The small meem after أَحَدٌۢ is a sign for joining into the next surah. We stop at the end of the surah, so it is not read today.',
    },
    {
      title: 'Stopping on tanween',
      station: 'zad',
      layout: 'concept',
      scene: 'qr3Stop',
      lines: [
        'When you stop at the end of an ayah, the n goes.',
        '-un and -in stop on a still letter: أَحَدٌ ← a-had, لَهَبٍ ← la-hab.',
        '-an becomes a long aa: كُفُوًا ← ku-fu-waa. That is why the alif is written.',
      ],
      items: ['أَحَدٌ ← a-had', 'لَهَبٍ ← la-hab', 'كُفُوًا ← ku-fu-waa'],
      say: [I4, M1],
      explain: [
        'Read each word twice: once in the middle (with the n), once at a stop.',
        'Most ayat in these two surahs end on a tanween, so this rule is used on almost every line.',
      ],
    },
    {
      title: 'Al-Masad, ayat 1 to 3',
      station: 'zad',
      layout: 'concept',
      scene: 'qr3Masad1',
      lines: [
        'May the hands of Abu Lahab be ruined, and may he be ruined; his wealth and gains will not help him; he will burn in a flaming fire.',
        'Ayah 1 has a tanween in the middle: لَهَبٍ وَتَبَّ, la-ha-bin-wa-tab.',
        'Ayah 3 has two: نَارًا and لَهَبٍ. Read the first with its n, stop on the second.',
      ],
      say: [M1, M2, M3],
      explain: [
        'Listen, follow, read. تَبَّتْ and تَبَّ both have a shadda: tab-bat, tab.',
        'مَالُهُۥ has the small waw again: maa-lu-hoo.',
      ],
    },
    {
      title: 'Al-Masad, ayat 4 and 5',
      station: 'zad',
      layout: 'concept',
      scene: 'qr3Masad4',
      lines: [
        'And his wife, the firewood-carrier, with a palm-fibre rope around her neck.',
        'حَمَّالَةَ has a shadda: ham-maa-la-ta.',
        'حَبْلٌ مِّن: the shadda on the meem swallows the n. Read hab-lum-min, not hab-lun-min.',
      ],
      say: [M4, M5],
      explain: [
        'The page shows the melt for you: no sign on the n, a shadda on the next letter. Trust the shadda.',
        'The surah ends on مَسَدٍ: stop on ma-sad.',
      ],
      teacherNote: 'This is the one melt we read today, because the Mushaf writes it with a shadda. The rest of the tanween rules belong to the Tajweed course.',
    },
    {
      title: 'Short review: -un, -in or -an?',
      station: 'athar',
      layout: 'game',
      scene: 'qr3Review',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Seven words from the two surahs. Which tanween does each one end in?',
        bins: [
          { id: 'un', label: '-un', hint: 'two dammas ٌ' },
          { id: 'in', label: '-in', hint: 'two kasras ٍ' },
          { id: 'an', label: '-an', hint: 'two fathas ً' },
        ],
        cards: [
          { label: 'أَحَدٌ', bin: 'un', why: 'Two dammas: a-ha-dun.' },
          { label: 'لَهَبٍ', bin: 'in', why: 'Two kasras: la-ha-bin.' },
          { label: 'نَارًا', bin: 'an', why: 'Two fathas, with the alif: naa-ran.' },
          { label: 'كُفُوًا', bin: 'an', why: 'Two fathas, with the alif: ku-fu-wan.' },
          { label: 'حَبْلٌ', bin: 'un', why: 'Two dammas: hab-lun (and it melts into مِّن).' },
          { label: 'مَسَدٍ', bin: 'in', why: 'Two kasras: ma-sa-din; at the stop, ma-sad.' },
          { label: 'غَاسِقٍ', bin: 'in', why: 'Two kasras, from Al-Falaq: ghaa-si-qin.' },
        ],
      },
      explain: ['A short review, no timer and no points. The learner reads each word aloud before choosing.'],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Read both surahs',
      station: 'athar',
      layout: 'question',
      scene: 'qr3Read',
      lines: [
        'Now read Al-Ikhlas, then Al-Masad, from the page, without the reciter.',
        'Your teacher marks each ayah: smooth, paused, or helped.',
      ],
      say: [I1],
      interaction: {
        kind: 'ask',
        prompt: 'Read both surahs to your teacher, finger under the words. Did every tanween get its n, and every stop drop it?',
        reveal: 'Nine ayat from the page. The paused ones are next lesson\'s warm-up.',
      },
      explain: ['Mark each of the nine ayat honestly. Correct only tanween and stopping today.'],
      teacherNote: 'Write the paused ayat in your report: they are next lesson\'s warm-up.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'qr3Mission',
      lines: [
        'Once a day this week, read Al-Ikhlas from the Mushaf, then Al-Masad.',
        'Three times, read Al-Ikhlas slowly and listen for every n.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'When will you read them this week?',
        options: ['Before I sleep', 'After Fajr', 'After Maghrib', 'In my sunnah prayers'],
      },
      explain: ['Al-Ikhlas is short enough to read in prayer: suggest it, gently. Next lesson starts with these two surahs.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'qr3Next',
      lines: [
        'One more page back: An-Nasr and Al-Kafirun.',
        'A wavy line over some letters, and long vowels that stretch.',
        'Next time: long vowels and the madd sign.',
      ],
      say: [R('nasr-1', 'إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ', '110:1')],
      explain: ['Let the learner find the wavy line in جَآءَ before the next lesson.'],
    },
  ],
};
