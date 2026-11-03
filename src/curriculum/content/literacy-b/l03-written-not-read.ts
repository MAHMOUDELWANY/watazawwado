import type { Lesson } from '../../types';
import { lessonB03TeacherAr } from './l03-teacher-ar.js';

// Map: docs/curriculum/literacy-quranic/MAP.md (Lesson 3). Quran text: Uthmani Hafs via the Quran connector (quran.ai,
// fetched 2026-11-03, unchanged); meanings: Abdel Haleem via the same connector; root of وَعَمِلُوا۟ from the connector's
// morphology. Ayat play the reciter (Husary muallim).

const Q = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const QURAYSH3 = Q('quraysh-3', 'فَلْيَعْبُدُوا۟ رَبَّ هَـٰذَا ٱلْبَيْتِ', '106:3');
const ASR3 = Q('asr-3', 'إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ', '103:3');
const KAFIRUN4 = Q('kafirun-4', 'وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ', '109:4');

export const lessonB03: Lesson = {
  subject: 'literacy-b-kids',
  version: 'kids',
  subjectTitle: 'Quranic Reading Rules',
  number: 3,
  title: 'Written, Not Read',
  titleAr: 'يُكتب ولا يُقرأ',
  part: 'Reading the Mushaf',
  minutes: 45,
  goal: 'By the end of this lesson, you will skip the letters the Mushaf writes but the reciter does not say, and you will know them by their little zero.',
  reviewed: false,
  teacherAr: lessonB03TeacherAr,
  outcomes: [
    'Finds the small round zero (۟) on a letter and does not read that letter.',
    'Reads words like فَلْيَعْبُدُوا۟ and ءَامَنُوا۟ ending on "oo", with no "a" after it.',
    'Reads أَنَا۠ as a short "ana" in the middle of an ayah, because of its oval zero (۠).',
    'Tells a helper that is read (ۥ ـٰ) from a mark that is skipped (۟ ۠).',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'The little zero', page: 3 },
    { label: 'Al-Asr', page: 5 },
    { label: 'أَنَا', page: 6 },
    { label: 'Practice', page: 7 },
    { label: 'My mission', page: 10 },
  ],
  pages: [
    {
      title: 'Written, Not Read',
      station: 'spark',
      layout: 'cover',
      scene: 'lb3Cover',
      lines: [],
      explain: [
        'Ask about the mission: did the child find the four standing alifs in Al-Fatiha? Let them point at each one.',
        'Tell them: today some letters are invisible to the ear. They are on the page, but nobody says them.',
      ],
    },
    {
      title: 'Remember the stretches?',
      station: 'spark',
      layout: 'concept',
      scene: 'lb3Recall',
      lines: [
        'Three helpers that stretch, from last time.',
        'Say the stretch before it lights up: aa, oo or ee?',
      ],
      items: ['ٱلرَّحْمَـٰنِ: aa', 'لَهُۥ: oo', 'طَعَامِهِۦ: ee'],
      explain: ['Two minutes only. Two claps for every stretch.'],
    },
    {
      title: 'The silent alif',
      station: 'spark',
      layout: 'story',
      scene: 'lb3Mystery',
      lines: [
        'Yusuf reads Surah Quraysh with Jiddo, and stops at the first word.',
        'There is an alif at the end, with a tiny circle on top. "Falya\'budooa?"',
        'Jiddo plays the reciter. Listen: does he say that alif?',
      ],
      say: [QURAYSH3],
      explain: [
        'Let the child read the word their own way first, then play the reciter. He says "falya\'budoo" and goes straight on.',
        'Ask: where did the alif go? Let the child guess before you explain.',
      ],
    },
    {
      title: 'The little zero',
      station: 'zad',
      layout: 'concept',
      scene: 'lb3Zero',
      lines: [
        'The tiny circle is a little zero: ۟. It means "zero sound". Do not read this letter.',
        'So فَلْيَعْبُدُوا۟ is read "fal-ya\'-bu-doo". The word ends on "oo".',
        'The letter stays in the Mushaf because the Companions wrote it that way. We keep the writing, and skip the sound.',
      ],
      explain: [
        'Draw a zero in the air with your finger. Every time the child sees it on a letter: "zero sound, skip it".',
        'The Mushaf is written the way the Companions wrote it, in the time of Uthman, may Allah be pleased with him. That is why some letters are written but not read.',
      ],
      teacherNote: 'The rasm uthmani was introduced in Lesson 1 (the Uthman page). Keep this to one sentence.',
    },
    {
      title: 'After "they": an extra alif',
      station: 'zad',
      layout: 'concept',
      scene: 'lb3Group',
      lines: [
        'Where does the silent alif live? Very often after a waw that means "they".',
        'ءَامَنُوا۟: they believed. وَعَمِلُوا۟: and they did. Both end on "oo".',
        'See "they" at the end of a word, look for the little zero, and stop on the "oo".',
      ],
      items: ['ءَامَنُوا۟: aa-ma-noo', 'وَعَمِلُوا۟: wa-\'a-mi-loo', 'وَتَوَاصَوْا۟: wa-ta-waa-saw'],
      say: [ASR3],
      explain: [
        'Read each word with the child, finger under it, and lift the finger at the zero.',
        'وَتَوَاصَوْا۟ ends "saw": the waw has a sukoon and the alif after it is silent.',
      ],
    },
    {
      title: 'Al-Asr: they believed, and they did',
      station: 'zad',
      layout: 'evidence',
      scene: 'lb3Asr',
      evidence: {
        arabic: 'إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ',
        meaning: 'except for those who believe, do good deeds, urge one another to the truth, and urge one another to steadfastness.',
        reference: 'Surah Al-Asr 103:3 (translation: Abdel Haleem)',
      },
      tadabbur: {
        word: 'وَعَمِلُوا۟',
        root: 'ع م ل',
        meaning: 'and they did: عَمِل (to do, to work) and ـوا۟ (they), with its silent alif',
        question: 'Allah first says they believed, then that they did good. What good thing did you do today?',
        action: 'Do one good deed before you sleep, and help someone else do one too: that is the reminding in this ayah.',
      },
      lines: [
        'Four silent alifs in one ayah! Count the little zeros.',
        'Believing is not alone in this ayah: doing good comes right after it.',
      ],
      say: [ASR3],
      explain: [
        'Read the meaning first, then play the ayah and let the child count four zeros.',
        'Link to life: the ayah joins believing with doing. Ask the child for one good deed they can do today.',
      ],
    },
    {
      title: 'أَنَا: long on paper, short in the ayah',
      station: 'zad',
      layout: 'concept',
      scene: 'lb3Ana',
      lines: [
        'أَنَا means "I". Its last alif wears an oval zero: أَنَا۠.',
        'In the middle of an ayah it is read short: "ana", not "anaa".',
        'Listen to Surah Al-Kafirun: وَلَآ أَنَا۠ عَابِدٌ. The reciter says "wa laa ana \'aabid".',
      ],
      say: [KAFIRUN4],
      explain: [
        'Point at the oval zero. It is a cousin of the round one: this alif is skipped when you read on.',
        'If you ever stop on أَنَا, the alif is said. That is rare in Juz \'Amma; keep it for later.',
      ],
      teacherNote: 'The oval zero (۠) marks a letter skipped when joining and read when stopping. One example is enough today.',
    },
    {
      title: 'Read it or skip it?',
      station: 'athar',
      layout: 'question',
      scene: 'lb3Spot',
      lines: ['Some marks say "read me longer". Some say "skip me". Which words have a letter you skip?'],
      interaction: {
        kind: 'clues',
        prompt: 'Find the three words with a letter you do not read.',
        clues: [
          { label: 'فَلْيَعْبُدُوا۟', correct: true },
          { label: 'ءَامَنُوا۟', correct: true },
          { label: 'أَنَا۠', correct: true },
          { label: 'لَهُۥ', correct: false },
          { label: 'ٱلرَّحْمَـٰنِ', correct: false },
        ],
      },
      explain: ['لَهُۥ and ٱلرَّحْمَـٰنِ have helpers that are read: they stretch. The zeros are the ones you skip.'],
    },
    {
      title: 'Stretch or skip?',
      station: 'athar',
      layout: 'game',
      scene: 'lb3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Each word has a little mark. Does it make you stretch, or skip?',
        bins: [
          { id: 'stretch', label: 'Stretch', hint: 'ـٰ ۥ ۦ' },
          { id: 'skip', label: 'Skip', hint: '۟ ۠' },
        ],
        cards: [
          { label: 'وَعَمِلُوا۟', bin: 'skip', why: 'A little zero on the alif: skip it, "wa-\'a-mi-loo".' },
          { label: 'مَـٰلِكِ', bin: 'stretch', why: 'A standing alif: stretch "maa".' },
          { label: 'أَنَا۠', bin: 'skip', why: 'An oval zero: "ana", short, when you read on.' },
          { label: 'يَرَهُۥ', bin: 'stretch', why: 'A small waw: stretch "hoo".' },
          { label: 'فَلْيَعْبُدُوا۟', bin: 'skip', why: 'A little zero on the alif: "fal-ya\'-bu-doo".' },
          { label: 'هَـٰذَا', bin: 'stretch', why: 'A standing alif: "haa-dhaa".' },
          { label: 'وَتَوَاصَوْا۟', bin: 'skip', why: 'A little zero on the alif: "wa-ta-waa-saw".' },
        ],
      },
      explain: ['Let the child read each word aloud first, then sort. The result goes into your report.'],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Read with the reciter',
      station: 'athar',
      layout: 'question',
      scene: 'lb3Along',
      lines: ['Listen to Surah Quraysh, ayah 3, then read it yourself.', 'Skip the zero, stretch the standing alif.'],
      say: [QURAYSH3],
      interaction: { kind: 'ask', prompt: 'Read it alone. Did you stop on "doo" and stretch "haa"?', reveal: 'Wonderful! You read exactly what the reciter reads.' },
      explain: ['Play the ayah once, then let the child read. Praise the skipped alif first: it is the new skill.'],
    },
    {
      title: 'My Zad: the zero hunt',
      station: 'ahd',
      layout: 'mission',
      scene: 'lb3Mission',
      lines: ['Surah Al-Asr hides four little zeros in one ayah.', 'Find them in your Mushaf and read the ayah to someone at home.'],
      interaction: {
        kind: 'choose',
        prompt: 'Your mission: find the four zeros in Al-Asr. Who will you read it to?',
        options: ['Mum', 'Dad', 'My brother or sister', 'Grandma or Grandpa'],
      },
      explain: ['Check the four zeros at the start of next lesson: ءَامَنُوا۟، وَعَمِلُوا۟، وَتَوَاصَوْا۟، وَتَوَاصَوْا۟.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'lb3Next',
      lines: [
        'Maryam spots an alif with a tiny "s" on its head at the start of ٱلْحَمْدُ.',
        'Sometimes the reciter says it, sometimes he slides right past it.',
        'Next time: the quiet alif, and when it wakes up.',
      ],
      say: [Q('fatiha-2', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', '1:2')],
      explain: ['End on the mystery. Let the child find the little head on the alif of ٱلْحَمْدُ.'],
    },
  ],
};
