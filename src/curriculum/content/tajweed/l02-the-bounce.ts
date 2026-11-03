import type { Lesson } from '../../types';
import { lessonT02TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/tajweed/RULES.md. Map: docs/curriculum/tajweed/MAP.md (Lesson 2: qalqalah, small and big;
// Al-Falaq, Al-Ikhlas). Ayat: Uthmani Hafs via the Quran connector (quran.ai, fetched 2026-11-03), unchanged; the
// reciter (Husary, muallim) plays them. Rule as in Hafs from Asim by way of ash-Shatibiyyah.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const I1 = R('ikhlas-1', 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', '112:1');
const I2 = R('ikhlas-2', 'ٱللَّهُ ٱلصَّمَدُ', '112:2');
const I3 = R('ikhlas-3', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', '112:3');
const I4 = R('ikhlas-4', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', '112:4');
const F1 = R('falaq-1', 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', '113:1');
const F2 = R('falaq-2', 'مِن شَرِّ مَا خَلَقَ', '113:2');
const F3 = R('falaq-3', 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', '113:3');
const F4 = R('falaq-4', 'وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ', '113:4');
const F5 = R('falaq-5', 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', '113:5');
const FIL2 = R('fil-2', 'أَلَمْ يَجْعَلْ كَيْدَهُمْ فِى تَضْلِيلٍ', '105:2');
const MASAD1 = R('masad-1', 'تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ', '111:1');

export const lessonT02: Lesson = {
  subject: 'tajweed',
  version: 'adults',
  subjectTitle: 'Tajweed · Level 1',
  number: 2,
  title: 'The Bounce',
  titleAr: 'القلقلة',
  part: 'Level 1 · The Essential Rules',
  minutes: 45,
  goal: 'By the end of this lesson, you will give the five bouncing letters their small echo when they are still, and their full bounce when you stop on them.',
  reviewed: false,
  teacherAr: lessonT02TeacherAr,
  outcomes: [
    'Names the five letters of qalqalah: ق ط ب ج د (قُطْبُ جَدٍّ).',
    'Gives a small bounce to one of them when it is still in the middle of reading (يَجْعَلْ، يَلِدْ وَلَمْ).',
    'Gives a full bounce when stopping on one of them at the end of an ayah (ٱلْفَلَقِ، أَحَدٌ).',
    'Bounces without adding a vowel, and recites Al-Ikhlas and Al-Falaq with every bounce.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Five letters', page: 2 },
    { label: 'Small and big', page: 4 },
    { label: 'Mistakes', page: 7 },
    { label: 'Practice', page: 8 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'The Bounce',
      station: 'spark',
      layout: 'cover',
      scene: 'tj2Cover',
      lines: [],
      explain: [
        'Ask about the mission: did the learner say the isti\'adha before every recitation this week?',
        'Tell them: today the first layer of Al-Ikhlas switches on for good.',
      ],
    },
    {
      title: 'Remember the first layer?',
      station: 'spark',
      layout: 'story',
      scene: 'tj2Recall',
      lines: [
        'Last time, four ayat of Al-Ikhlas lit up at their ends.',
        'Each ayah stops on a د, and the د does not just stop: it echoes.',
        'Listen to the reciter. Can you hear the little pop at the end?',
      ],
      say: [I1, I2, I3, I4],
      explain: [
        'Play each ayah and ask the learner to clap at the moment of the pop.',
        'Do not name the rule yet; let them describe it in their own words first.',
      ],
    },
    {
      title: 'Five letters that bounce',
      station: 'zad',
      layout: 'concept',
      scene: 'tj2Five',
      lines: [
        'Only five letters do this. Scholars of recitation gathered them in two words: قُطْبُ جَدٍّ.',
        'They bounce only when they are still: a sukoon on them, or a stop at the end.',
        'With a vowel on them, they are read normally. No bounce.',
      ],
      items: ['ق', 'ط', 'ب', 'ج', 'د'],
      explain: [
        'Read the five letters with a sukoon after a fatha: aq, at, ab, aj, ad. Let the learner hear the pop each time.',
        'The memory phrase قُطْبُ جَدٍّ holds all five in order. It is a phrase to remember them, not a rule in itself.',
      ],
      teacherNote: 'Qalqalah is the name. Use "the bounce" until the learner is comfortable, then the Arabic name.',
    },
    {
      title: 'Why they bounce',
      station: 'zad',
      layout: 'concept',
      scene: 'tj2Why',
      lines: [
        'These five letters close the mouth or the throat completely, and they are strong.',
        'When one of them is still, its sound is trapped behind the closed place.',
        'The bounce is the sound escaping: a quick release, like a ball let go after you press it down.',
      ],
      explain: [
        'Let the learner say "ab" slowly with closed lips: they will feel the air waiting, then the small release.',
        'Compare with "am": the meem can hum through the nose, so it does not need to bounce.',
      ],
    },
    {
      title: 'The small bounce',
      station: 'zad',
      layout: 'concept',
      scene: 'tj2Small',
      lines: [
        'In the middle of reading, a still bounce letter gets a small echo.',
        'Al-Fil: يَجْعَلْ. The ج is still, then the reading goes on: yaj-\'al.',
        'Al-Ikhlas: لَمْ يَلِدْ وَلَمْ. When you join it to the next word, the د echoes lightly.',
      ],
      say: [FIL2, I3],
      explain: [
        'Listen to the reciter on يَجْعَلْ: the bounce is short and clean, then the ع follows straight away.',
        'This is qalqalah sughra (the small one).',
      ],
    },
    {
      title: 'The big bounce',
      station: 'zad',
      layout: 'concept',
      scene: 'tj2Big',
      lines: [
        'When you stop at the end of an ayah, the last vowel falls silent and the letter becomes still.',
        'If it is a bounce letter, the echo is clearer: the big bounce.',
        'Al-Falaq ends on bounce letters all the way down: ق، ق، ب، د، د.',
      ],
      say: [F1, F2, F3, F4, F5],
      explain: [
        'Play the five ayat and let the learner point at the last letter of each one before you play it.',
        'This is qalqalah kubra (the big one). The vowel written at the end is not read when you stop; the bounce takes its place.',
      ],
      teacherNote: 'Stopping rules come in full later; here only: stopping makes the last letter still.',
    },
    {
      title: 'The strongest bounce',
      station: 'zad',
      layout: 'concept',
      scene: 'tj2Biggest',
      lines: [
        'Al-Masad opens and ends its ayah on the same letter: تَبَّتْ ... وَتَبَّ.',
        'When you stop on تَبَّ, the ب is doubled and still: hold it, then let it bounce.',
        'The strongest bounce you will meet: a doubled bounce letter at a stop.',
      ],
      say: [MASAD1],
      explain: [
        'Let the learner hear the hold on the doubled ب before the release.',
        'Some teachers call this a third, greatest level. For Level 1 it is enough to hear that it is the strongest.',
      ],
    },
    {
      title: 'Bounce, don\'t add',
      station: 'zad',
      layout: 'concept',
      scene: 'tj2Mistakes',
      lines: [
        'The most common mistake: adding a vowel. يَجْعَلْ becomes "yaja-\'al". That changes the word.',
        'The second: bouncing too hard, like a cough. The echo is light and quick.',
        'The third: forgetting it. A flat "ad" at the end of Al-Ikhlas loses its sound.',
      ],
      items: ['Not "yaja-\'al": no added vowel', 'Not a cough: light and quick', 'Not flat: let it echo'],
      explain: ['Model each mistake on purpose and let the learner catch you. It is easier to hear a mistake in someone else first.'],
    },
    {
      title: 'Where does Al-Falaq bounce?',
      station: 'athar',
      layout: 'question',
      scene: 'tj2Spot',
      lines: ['Stop at the end of every ayah of Al-Falaq. Which last words bounce?'],
      say: [F1, F5],
      interaction: {
        kind: 'clues',
        prompt: 'Tap every ending that bounces when you stop on it.',
        clues: [
          { label: 'ٱلْفَلَقِ', correct: true },
          { label: 'خَلَقَ', correct: true },
          { label: 'وَقَبَ', correct: true },
          { label: 'ٱلْعُقَدِ', correct: true },
          { label: 'حَسَدَ', correct: true },
          { label: 'ٱلنَّاسِ (An-Nas)', correct: false },
        ],
      },
      explain: ['All five endings of Al-Falaq bounce: the surprise of the page. An-Nas, on the next page of the Mushaf, ends on س, which never bounces.'],
    },
    {
      title: 'Small or big?',
      station: 'athar',
      layout: 'game',
      scene: 'tj2Review',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Seven moments in a recitation. Is the bounce small or big?',
        bins: [
          { id: 'small', label: 'Small', hint: 'still in the middle, reading on' },
          { id: 'big', label: 'Big', hint: 'stopping on it' },
        ],
        cards: [
          { label: 'يَجْعَلْ in Al-Fil, reading on', bin: 'small', why: 'The ج is still in the middle of the word: a small bounce.' },
          { label: 'Stopping on ٱلْفَلَقِ', bin: 'big', why: 'A stop makes the ق still: the big bounce.' },
          { label: 'يَلِدْ joined to وَلَمْ', bin: 'small', why: 'You read on without stopping: a small bounce.' },
          { label: 'Stopping on ٱلصَّمَدُ', bin: 'big', why: 'The د becomes still at the stop: the big bounce.' },
          { label: 'Stopping on وَقَبَ', bin: 'big', why: 'The ب becomes still at the stop: the big bounce.' },
          { label: 'Stopping on يُولَدْ', bin: 'big', why: 'The end of the ayah, a stop: the big bounce.' },
          { label: 'Stopping on تَبَّ', bin: 'big', why: 'A doubled ب at a stop: the strongest bounce.' },
        ],
      },
      explain: [
        'A short review, no timer and no points. The result goes into your lesson report.',
        'Ask the learner to recite each moment before choosing.',
      ],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Your turn to recite',
      station: 'athar',
      layout: 'question',
      scene: 'tj2Recite',
      lines: [
        'Recite Al-Ikhlas, then Al-Falaq, stopping at the end of every ayah.',
        'Your teacher listens only for the bounce this time.',
      ],
      say: [I1, F1],
      interaction: {
        kind: 'ask',
        prompt: 'Recite both surahs to your teacher. Did all nine endings bounce, without an added vowel?',
        reveal: 'Nine bounces. The first layer is switched on for good.',
      },
      explain: ['Correct only the bounce today: missing, too hard, or with an added vowel. Note which ayat needed help.'],
      teacherNote: 'Write the ayat that needed help in your report: they are next lesson\'s warm-up.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'tj2Mission',
      lines: [
        'In every salah this week, listen for your own bounces at the end of Al-Ikhlas.',
        'Find three more bounce letters in the surahs you know by heart.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'Which surah will you search for bounce letters?',
        options: ['Al-Fatiha', 'Al-Kawthar', 'Al-Asr', 'Another surah I know'],
      },
      explain: ['Start the next lesson with the bounce letters they found.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'tj2Next',
      lines: [
        'A still noon, or a tanween, meets the next letter.',
        'Four things can happen at that door, depending on who is waiting there.',
        'Next time: the first door, where the noon stays clear.',
      ],
      explain: ['End on the four doors. Ask the learner to find a نْ in Al-Kawthar before next lesson.'],
    },
  ],
};
