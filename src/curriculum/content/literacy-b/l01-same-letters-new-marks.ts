import type { Lesson } from '../../types';
import { lessonB01TeacherAr } from './l01-teacher-ar.js';

// Brief and evidence log: docs/curriculum/literacy-quranic/L01-same-letters-new-marks.md
// Ayat: Tanzil Uthmani text through the Quran Foundation API (2026-10-25), unchanged; audio streams from Husary (muallim).
// Hadith: Sahih al-Bukhari 5027, checked on Dorar 2026-10-26: sahih (narrated by Uthman ibn Affan). English meanings are ours, for the owner to review.
// Every graphic is drawn in code (slides/motion/g-lb1.tsx); the cast are the Zad Kids cut-outs.

export const lessonB01: Lesson = {
  subject: 'literacy-b-kids',
  version: 'kids',
  subjectTitle: 'Quranic Reading Rules',
  number: 1,
  title: 'Same Letters, New Marks',
  titleAr: 'نفس الحروف، علامات جديدة',
  part: 'Reading the Mushaf',
  minutes: 45,
  goal: 'By the end of this lesson, you will know your way around a page of the Mushaf and spot the little helper marks that storybooks do not have.',
  reviewed: false,
  teacherAr: lessonB01TeacherAr,
  outcomes: [
    'Names the parts of a Mushaf page: the surah name, the basmala, the ayah circles and the juz marker.',
    'Knows that the circle closes an ayah and its number counts the ayat.',
    'Spots three helper marks (ٱ, ـٰ, ۥ) in real words of the Quran.',
    'Sorts at least 6 of 8 marks into "in my storybook too" and "Mushaf helper".',
    'Opens the Mushaf at home with someone in the family and finds the marks.',
  ],
  chapters: [
    { label: 'The puzzle', page: 0 },
    { label: 'Why it matters', page: 3 },
    { label: 'The page map', page: 4 },
    { label: 'The helpers', page: 6 },
    { label: 'Practice', page: 8 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Same Letters, New Marks',
      station: 'spark',
      layout: 'cover',
      scene: 'lbCover',
      lines: [],
      explain: [
        'Welcome the child and say the title together: Same Letters, New Marks.',
        'Tell them: you already read Arabic. Today we open the Mushaf and find out what is new in it.',
      ],
      teacherNote: 'Keep the cover short. Have a real Mushaf next to you if you can.',
    },
    {
      title: 'Yusuf gets stuck',
      station: 'spark',
      layout: 'story',
      scene: 'lbStuck',
      lines: [
        'Yusuf reads his storybook without stopping once.',
        'Then Jiddo hands him the Mushaf.',
        'He stops at the very first line. "Jiddo, these letters have little marks I have never seen!"',
      ],
      explain: [
        'Read the story with feeling. Yusuf is a good reader, and that is the point: even good readers meet something new in the Mushaf.',
        'On the last step, point to the glowing marks in the word on the stage and ask the child if they have seen them before.',
      ],
    },
    {
      title: 'What are they?',
      station: 'spark',
      layout: 'question',
      scene: 'lbGuess',
      lines: ['The letters are the same twenty-eight letters you know.', 'But some words wear tiny extra marks.'],
      interaction: {
        kind: 'ask',
        prompt: 'What do you think these tiny marks are for?',
        reveal: 'They are helpers! They tell us how to read each word exactly the way the Quran was taught.',
      },
      explain: [
        'Let the child guess freely. Any guess is welcome: decoration, mistakes, secret codes.',
        'Then reveal: they are helpers. Each one tells the reader how to say the word, so everyone reads the Quran the same way.',
      ],
      teacherNote: 'Do not explain any mark yet. The page is only the question.',
    },
    {
      title: 'The best of you',
      station: 'zad',
      layout: 'evidence',
      scene: 'lbBest',
      evidence: {
        arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
        meaning: 'The best of you are those who learn the Quran and teach it.',
        reference: 'Sahih al-Bukhari 5027, narrated by Uthman ibn Affan',
      },
      lines: [
        'Right now, learning to read the Mushaf, you are on that list.',
        'And one day you will teach it to someone else, maybe a little brother or sister.',
        'Remember the name of the man who told us this: Uthman. You will meet him again in a minute.',
      ],
      explain: [
        'Read the hadith slowly, English then Arabic. Let the child repeat the Arabic after you, word by word.',
        'Make it personal: learning the Mushaf is not homework, it is a way to be among the best.',
        'Plant the name Uthman, may Allah be pleased with him. He comes back on the wow page.',
      ],
      teacherNote: 'Sahih al-Bukhari 5027.',
    },
    {
      title: 'A page has a map',
      station: 'zad',
      layout: 'concept',
      scene: 'lbMap',
      lines: ['Every page of the Mushaf is laid out the same way.', 'Learn the map once and you will never feel lost.'],
      items: ['The surah name, in its frame', 'Bismillah, before the surah starts', 'A circle at the end of every ayah', 'The juz marker, in the margin'],
      say: [
        { id: 'fatiha-1', text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', voice: 'reciter', quran: true, ayah: '1:1' },
      ],
      explain: [
        'Show each part on the stage, then find the same part in your real Mushaf.',
        'The surah name sits in a decorated frame at the top. Bismillah comes before every surah except At-Tawbah.',
        'The circles end the ayat. The juz marker in the margin tells you which of the thirty parts you are in.',
        'Tap Bismillah on the stage to hear it recited.',
      ],
    },
    {
      title: 'The circle at the end',
      station: 'zad',
      layout: 'concept',
      scene: 'lbCircle',
      lines: [
        'The circle closes an ayah, like a full stop closes a sentence.',
        'The number inside counts the ayat: one, two, three...',
        'Al-Fatiha has seven circles, so it has seven ayat.',
        'When you reach a circle, it is a good place to stop and breathe.',
      ],
      say: [
        { id: 'fatiha-2', text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', voice: 'reciter', quran: true, ayah: '1:2' },
      ],
      explain: [
        'Count the circles of Al-Fatiha together on the stage as they light up.',
        'Stopping at the circle is the easiest place to stop. Where else we may stop comes in a later lesson.',
      ],
    },
    {
      title: 'Meet the helpers',
      station: 'zad',
      layout: 'concept',
      scene: 'lbHelpers',
      lines: ['Here are three helpers you will see on almost every page.', 'Each one changes how you say the word.'],
      items: ['A little head on the alif: skip me when you join', 'An alif standing on a letter: stretch the sound', 'A tiny waw after a letter: stretch it into "oo"'],
      say: [
        { id: 'fatiha-3', text: 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', voice: 'reciter', quran: true, ayah: '1:3' },
        { id: 'ikhlas-4', text: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', voice: 'reciter', quran: true, ayah: '112:4' },
      ],
      explain: [
        'Show each helper on its word. Do not teach the full rule yet: just the one-line job of each helper.',
        'Hamzat al-wasl (ٱ) is the little head on the alif: when we join it to the word before, we skip it.',
        'The standing alif (ـٰ) says: stretch this letter with an "aa" sound, as in ar-Rahmaan.',
        'The small waw (ۥ) after lahu says: stretch it into "oo", lahoo.',
        'Tap each word to hear the reciter, and listen for the stretch.',
      ],
      teacherNote: 'Lessons 2 and 4 teach these helpers properly. Here they are only introduced.',
    },
    {
      title: 'Nearly 1,400 years, one spelling',
      station: 'zad',
      layout: 'concept',
      scene: 'lbUthman',
      lines: [
        'After the Prophet ﷺ, Uthman (may Allah be pleased with him) had the Quran written out in copies, all spelled the same way.',
        'He sent them to the great cities: Makkah, Sham, Kufa and Basra, and kept one in Madinah.',
        'Your Mushaf follows that same spelling. That is why it looks a little different from a storybook.',
        'The helper marks were added so every child, in every country, reads it the way it was taught.',
      ],
      explain: [
        'This is the wow of the lesson. Trace the copies travelling from Madinah to the cities, then all the way to the Mushaf on your table.',
        'Link back to the hadith: the same Uthman who told us "the best of you learn the Quran and teach it".',
        'The point for the child: the marks are not extra work, they are a map so nobody gets the Quran wrong.',
      ],
      teacherNote: 'Keep to what the sources agree on: the copies, the cities, one spelling. Do not give a number of copies.',
    },
    {
      title: 'Spot the helpers',
      station: 'athar',
      layout: 'question',
      scene: 'lbSpot',
      lines: ['These words are all from Al-Fatiha.'],
      interaction: {
        kind: 'clues',
        prompt: 'Tap every word that has a helper mark.',
        clues: [
          { label: 'ٱلْعَـٰلَمِينَ', correct: true },
          { label: 'رَبِّ', correct: false },
          { label: 'مَـٰلِكِ', correct: true },
          { label: 'يَوْمِ', correct: false },
          { label: 'ٱلصِّرَٰطَ', correct: true },
          { label: 'نَعْبُدُ', correct: false },
        ],
      },
      explain: [
        'Let the child look closely before tapping. Ask them to point at the helper they found.',
        'Al-aalameen and as-siraat have two helpers each: the little head and the standing alif. Maaliki has the standing alif.',
      ],
    },
    {
      title: 'Storybook or Mushaf?',
      station: 'athar',
      layout: 'game',
      scene: 'lbSort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Which marks are in your storybook too, and which are Mushaf helpers?',
        bins: [
          { id: 'book', label: 'In my storybook too', hint: 'Every Arabic book has these' },
          { id: 'mushaf', label: 'Mushaf helper', hint: 'You meet these in the Mushaf' },
        ],
        cards: [
          { label: 'Fatha ـَ', bin: 'book', why: 'Every vowelled book uses it.' },
          { label: 'Kasra ـِ', bin: 'book', why: 'Every vowelled book uses it.' },
          { label: 'Sukoon ـْ', bin: 'book', why: 'You learned it in reading Arabic.' },
          { label: 'Shadda ـّ', bin: 'book', why: 'It doubles a letter in any book.' },
          { label: 'Little head ٱ', bin: 'mushaf', why: 'Hamzat al-wasl, written this way in the Mushaf.' },
          { label: 'Standing alif ـٰ', bin: 'mushaf', why: 'The Mushaf writes a long aa this way.' },
          { label: 'Tiny waw ۥ', bin: 'mushaf', why: 'It stretches the sound to "oo".' },
          { label: 'Ayah circle ۝', bin: 'mushaf', why: 'Only the Quran has ayat.' },
        ],
      },
      explain: [
        'Let the child sort on their own. After each card, read the reason together.',
        'The result goes into your report: anything they missed comes back at the start of Lesson 2.',
      ],
    },
    {
      title: 'Read with the reciter',
      station: 'athar',
      layout: 'question',
      scene: 'lbAlong',
      lines: ['Now listen to the second ayah, and follow each word with your finger.', 'Listen for the stretch on the standing alif.'],
      say: [
        { id: 'fatiha-2b', text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', voice: 'reciter', quran: true, ayah: '1:2' },
      ],
      interaction: {
        kind: 'ask',
        prompt: 'Now you read it. Did you skip the little head and stretch the standing alif?',
        reveal: 'Al-hamdu lillahi rabbil-aalameen. Mabrook, you just read the Mushaf way!',
      },
      explain: [
        'Tap the ayah to play it. Then the child reads it alone, slowly.',
        'Praise one thing they did well, then fix only one thing.',
      ],
    },
    {
      title: 'My Zad: the Mushaf mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'lbMission',
      lines: ['Jiddo smiles and opens the Mushaf at Al-Fatiha.', '"This week, you are the guide. Show the family the map of the page."'],
      interaction: {
        kind: 'choose',
        prompt: 'Your mission: open the Mushaf with someone at home, and find three ayah circles and one standing alif. Who will you show?',
        options: ['Mum', 'Dad', 'My brother or sister', 'Grandma or Grandpa'],
      },
      explain: [
        'The child teaches what they learned: that is the hadith of the lesson in action.',
        'Ask about it at the start of the next lesson: what did they find, and who did they show?',
      ],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'lbNext',
      lines: [
        'Maryam points at a tiny alif standing on top of a letter.',
        '"Why is it standing up there, and not in the line?"',
        'Next time: the alif that stands up, and how far to stretch it.',
      ],
      explain: ['End on the mystery. Do not answer it: it is the start of Lesson 2.'],
    },
  ],
};
