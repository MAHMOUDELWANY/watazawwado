import type { Lesson } from '../../types';
import { lessonT03TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/tajweed/RULES.md. Map: docs/curriculum/tajweed/MAP.md (Lesson 3: noon saakinah and tanween,
// izhar). Ayat: Uthmani Hafs through the Quran connector (quran.ai, fetched 2026-11-03), unchanged; audio streams from
// Husary (muallim). English meanings follow Abdel Haleem (same connector), with "Allah" for the divine name.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const I4 = R('ikhlas-4', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', '112:4');
const M2 = R('masad-2', 'مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ', '111:2');
const Q4 = R('quraysh-4', 'ٱلَّذِىٓ أَطْعَمَهُم مِّن جُوعٍ وَءَامَنَهُم مِّنْ خَوْفٍۭ', '106:4');
const QA11 = R('qariah-11', 'نَارٌ حَامِيَةٌۢ', '101:11');
const A1 = R('asr-1', 'وَٱلْعَصْرِ', '103:1');
const A2 = R('asr-2', 'إِنَّ ٱلْإِنسَـٰنَ لَفِى خُسْرٍ', '103:2');
const A3 = R('asr-3', 'إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ', '103:3');
const F2 = R('falaq-2', 'مِن شَرِّ مَا خَلَقَ', '113:2');

export const lessonT03: Lesson = {
  subject: 'tajweed',
  version: 'adults',
  subjectTitle: 'Tajweed · Level 1',
  number: 3,
  title: 'Four Doors',
  titleAr: 'الإظهار',
  part: 'Level 1 · The Essential Rules',
  minutes: 45,
  goal: 'By the end of this lesson, you will know the four doors of the still noon and tanween, and read the first one, izhar, clearly before the six throat letters.',
  reviewed: false,
  teacherAr: lessonT03TeacherAr,
  outcomes: [
    'Knows that a still noon (نْ) and a tanween both end in the same n sound, and that the next letter decides what happens to it.',
    'Names the six throat letters: ء ه ع ح غ خ.',
    'Reads the n clearly, with no extra hum, before a throat letter: izhar (عَنْهُ، مِّنْ خَوْفٍ، كُفُوًا أَحَدٌ).',
    'Spots izhar in the Mushaf from the sukoon on the noon and the stacked tanween.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Four doors', page: 2 },
    { label: 'Izhar', page: 3 },
    { label: 'In the Mushaf', page: 6 },
    { label: 'Mistakes', page: 8 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 12 },
  ],
  pages: [
    {
      title: 'Four Doors',
      station: 'spark',
      layout: 'cover',
      scene: 'tj3Cover',
      lines: [],
      explain: [
        'Ask about the mission: which bounce letters did the learner find in the surahs they know?',
        'Tell them: today a still noon walks up to four doors, and we open the first.',
      ],
    },
    {
      title: 'Warm-up: the bounce',
      station: 'spark',
      layout: 'story',
      scene: 'tj3Recall',
      lines: [
        'Recite the last ayah of Al-Ikhlas, and stop with a full bounce on أَحَدٌ.',
        'Now listen to the middle of the same ayah: كُفُوًا أَحَدٌ. There is an n hiding between them.',
      ],
      say: [I4],
      explain: ['Two minutes of the bounce from last time, then the n between كُفُوًا and أَحَدٌ: ku-fu-wan-a-had. Let the learner hear it before you explain it.'],
    },
    {
      title: 'One n, four doors',
      station: 'zad',
      layout: 'concept',
      scene: 'tj3Doors',
      lines: [
        'A still noon, نْ, and a tanween end in the same sound: n.',
        'What happens to that n depends on the next letter. Tajweed groups the letters into four doors.',
        'Clear (izhar), merged (idgham), swapped (iqlab), hidden (ikhfa). One door per lesson.',
      ],
      items: ['ٱلْإِظْهَار: clear', 'ٱلْإِدْغَام: merged', 'ٱلْإِقْلَاب: swapped', 'ٱلْإِخْفَاء: hidden'],
      explain: [
        'Show the four doors as a map of the next four lessons. Today only the first.',
        'Stress that tanween counts as a still noon here: كُفُوًا أَحَدٌ is ku-fu-wan + a-had.',
      ],
      teacherNote: 'Name all four once, then use only izhar. The names will come back one per lesson.',
    },
    {
      title: 'The six throat letters',
      station: 'zad',
      layout: 'concept',
      scene: 'tj3Throat',
      lines: [
        'Six letters are made deep in the throat: ء ه ع ح غ خ.',
        'Two from the bottom of the throat, two from the middle, two from the top, near the mouth.',
        'A phrase holds them: أَخِي هَاكَ عِلْمًا حَازَهُ غَيْرُ خَاسِرٍ. The first letter of each word.',
      ],
      items: ['ء ه: the deepest', 'ع ح: the middle', 'غ خ: the top'],
      explain: [
        'Let the learner feel each pair: a hand on the throat, ء and ه low, ع and ح in the middle, غ and خ high.',
        'The phrase means "My brother, take knowledge that is held by one who never loses". It is only a memory aid.',
      ],
      teacherNote: 'The makharij come fully in Level 2. Here the three heights are enough to see why these six belong together.',
    },
    {
      title: 'The first door: izhar',
      station: 'zad',
      layout: 'concept',
      scene: 'tj3Izhar',
      lines: [
        'Before a throat letter, the n stays clear. It is said fully, at the tip of the tongue, with no hum held on it.',
        'عَنْهُ: an-hu. The n, then the ه, two clean sounds.',
        'مِّنْ خَوْفٍ: min khawf. The n does not slide into the خ.',
      ],
      say: [M2, Q4],
      explain: [
        'Play each ayah and stop the learner on the word. Ask: did you hear the n complete before the next letter?',
        'Izhar means "making clear". It is the plainest door: say what is written.',
      ],
    },
    {
      title: 'Tanween at the first door',
      station: 'zad',
      layout: 'concept',
      scene: 'tj3Tanween',
      lines: [
        'Tanween follows the same rule. Its n stays clear before a throat letter.',
        'كُفُوًا أَحَدٌ: ku-fu-wan a-had.',
        'نَارٌ حَامِيَةٌ: naa-run haa-mi-yah. A blazing fire, and a clear n before the ح.',
      ],
      say: [I4, QA11],
      explain: ['Read the pair slowly, then at normal speed. The n stays clear even at speed.'],
    },
    {
      title: 'Why the n stays clear',
      station: 'zad',
      layout: 'concept',
      scene: 'tj3Why',
      lines: [
        'The n is made at the front of the mouth. The throat letters are made far behind it.',
        'They are too far apart to blend, so each one is said in its own place.',
      ],
      explain: ['Let the learner say ن then ح with a hand on the throat: the tongue tip, then the throat. Two stations, nothing in between.'],
    },
    {
      title: 'The Mushaf shows you',
      station: 'zad',
      layout: 'concept',
      scene: 'tj3Mushaf',
      lines: [
        'Look at Surah Quraysh, ayah 4. There are two مِّن in it.',
        'مِّنْ خَوْفٍ has a sukoon on the noon: that sign means izhar, say it clear.',
        'مِّن جُوعٍ has no sukoon: that n goes through another door. The page tells you before you recite.',
        'Tanween does the same: two marks stacked straight, as in كُفُوًا أَحَدٌ, mean izhar.',
      ],
      say: [Q4],
      explain: [
        'This is the Madinah Mushaf\'s gift: the sukoon on the noon, and the stacked tanween, mark izhar.',
        'Let the learner find the two مِّن and say which one carries the sukoon.',
      ],
      teacherNote: 'The other doors\' marks (no sukoon, staggered tanween, the small meem) are introduced with their own lessons.',
    },
    {
      title: 'Clear, not humming',
      station: 'zad',
      layout: 'concept',
      scene: 'tj3Mistakes',
      lines: [
        'Mistake one: holding a nasal hum on the n, as if it were a hidden noon. "an-nnn-hu" is too long.',
        'Mistake two: dropping the n. "a-hu" for عَنْهُ loses a letter.',
        'Mistake three: adding a vowel. "a-na-hu" makes the still noon move.',
      ],
      items: ['No long hum', 'No dropped n', 'No added vowel'],
      explain: ['Model each mistake on purpose and let the learner catch you.'],
    },
    {
      title: 'Where is the clear n?',
      station: 'athar',
      layout: 'question',
      scene: 'tj3Spot',
      lines: ['Six word pairs. In which ones does the n stay clear?'],
      interaction: {
        kind: 'clues',
        prompt: 'Tap every pair with izhar: a still noon or tanween before a throat letter.',
        clues: [
          { label: 'عَنْهُ', correct: true },
          { label: 'مِّنْ خَوْفٍ', correct: true },
          { label: 'كُفُوًا أَحَدٌ', correct: true },
          { label: 'نَارٌ حَامِيَةٌ', correct: true },
          { label: 'مِّن جُوعٍ', correct: false },
          { label: 'مِن شَرِّ', correct: false },
        ],
      },
      explain: ['Four pairs have izhar. مِّن جُوعٍ and مِن شَرِّ go through another door: ج and ش are not throat letters.'],
    },
    {
      title: 'Throat letter or not?',
      station: 'athar',
      layout: 'game',
      scene: 'tj3Review',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'What comes after the n? A throat letter means izhar.',
        bins: [
          { id: 'izhar', label: 'Clear (izhar)', hint: 'ء ه ع ح غ خ' },
          { id: 'other', label: 'Another door', hint: 'any other letter' },
        ],
        cards: [
          { label: 'عَنْهُ (111:2)', bin: 'izhar', why: 'ن before ه: a throat letter, izhar.' },
          { label: 'مِّنْ خَوْفٍ (106:4)', bin: 'izhar', why: 'ن before خ: a throat letter, izhar.' },
          { label: 'مِّن جُوعٍ (106:4)', bin: 'other', why: 'ج is not a throat letter: another door.' },
          { label: 'نَارٌ حَامِيَةٌ (101:11)', bin: 'izhar', why: 'Tanween before ح: izhar.' },
          { label: 'مِن شَرِّ (113:2)', bin: 'other', why: 'ش is not a throat letter: another door.' },
          { label: 'كُفُوًا أَحَدٌ (112:4)', bin: 'izhar', why: 'Tanween before ء: izhar.' },
          { label: 'ٱلْإِنسَـٰنَ (103:2)', bin: 'other', why: 'ن before س: another door.' },
        ],
      },
      explain: ['A short review, no timer and no points. The learner recites each pair before choosing.'],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Your turn to recite',
      station: 'athar',
      layout: 'question',
      scene: 'tj3Recite',
      lines: [
        'Recite Al-Asr, then the last ayah of Al-Ikhlas and Quraysh ayah 4.',
        'Your teacher listens for the clear n, and for the bounce from last time.',
      ],
      say: [A1, A2, A3],
      interaction: {
        kind: 'ask',
        prompt: 'Recite to your teacher. Was every n before a throat letter clear, with no hum and no added vowel?',
        reveal: 'The first door is open. Three more to go.',
      },
      explain: [
        'Al-Asr: if the learner joins ayah 2 to 3, خُسْرٍ إِلَّا is izhar (tanween before ء). Most stop at the end of ayah 2; both are correct.',
        'Correct only izhar and qalqalah today.',
      ],
      teacherNote: 'Write the ayat that needed help in your report: they are next lesson\'s warm-up.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'tj3Mission',
      lines: [
        'Find three places in surahs you know where a still noon or tanween meets a throat letter.',
        'Look for the sukoon on the noon: it is your clue.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'Which surahs will you search?',
        options: ['Al-Fatiha', 'Al-Qari\'ah', 'Al-Asr and Quraysh', 'Another surah I know'],
      },
      explain: ['Start the next lesson with the three places they found.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'tj3Next',
      lines: [
        'The second door: when the next letter is one of six, the n disappears into it.',
        'You read one last lesson without naming it: حَبْلٌ مِّن.',
        'Next time: idgham, the merge.',
      ],
      say: [R('zalzalah-7', 'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُۥ', '99:7')],
      explain: ['Play 99:7 and ask the learner to listen for where the n in فَمَن goes.'],
    },
  ],
};
