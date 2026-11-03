import type { Lesson } from '../../types';
import { lessonT301TeacherAr } from './l01-teacher-ar.js';

// Rules: docs/curriculum/tajweed/RULES.md. Map: docs/curriculum/tajweed/MAP-level-3.md (Lesson 1: every madd on one
// ruler, with its counts and order of strength). Brief and evidence log: docs/curriculum/tajweed/L3-01-every-stretch-ranked.md.
// Counts for Hafs from Asim by way of ash-Shatibiyyah. Ayat: Uthmani Hafs via the Quran connector (quran.ai, fetched
// 2026-11-03), unchanged; the reciter (Husary, muallim) plays them.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const FATIHA4 = R('fatiha-4', 'مَـٰلِكِ يَوْمِ ٱلدِّينِ', '1:4');
const FATIHA5 = R('fatiha-5', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', '1:5');
const FATIHA7 = R('fatiha-7', 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', '1:7');
const BAQARAH1 = R('baqarah-1', 'الٓمٓ', '2:1');
const BAQARAH4 = R('baqarah-4', 'وَٱلَّذِينَ يُؤْمِنُونَ بِمَآ أُنزِلَ إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِٱلْـَٔاخِرَةِ هُمْ يُوقِنُونَ', '2:4');
const BAQARAH5 = R('baqarah-5', 'أُو۟لَـٰٓئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُو۟لَـٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ', '2:5');
const QURAYSH2 = R('quraysh-2', 'إِۦلَـٰفِهِمْ رِحْلَةَ ٱلشِّتَآءِ وَٱلصَّيْفِ', '106:2');

export const lessonT301: Lesson = {
  subject: 'tajweed-3',
  version: 'adults',
  subjectTitle: 'Tajweed · Level 3',
  number: 1,
  title: 'Every Stretch, Ranked',
  titleAr: 'المدود كلها ومراتبها',
  part: 'Level 3 · Measure',
  minutes: 50,
  goal: 'By the end of this lesson, you will give every madd its allowed length in Hafs and know which one is stronger when you have to choose.',
  reviewed: false,
  teacherAr: lessonT301TeacherAr,
  outcomes: [
    'Explains the two causes that lengthen a madd: a hamza or a sukoon after the madd letter.',
    'Gives each madd its counts in Hafs by way of ash-Shatibiyyah: natural 2; muttasil and munfasil 4 or 5; lazim 6; \'aridh and leen at a stop 2, 4 or 6; badal 2.',
    'Ranks them by strength: lazim, then muttasil, then \'aridh, then munfasil, then badal.',
    'Keeps one length for each kind through a whole recitation, and never makes muttasil shorter than munfasil.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Two causes', page: 2 },
    { label: 'Ranked', page: 7 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 12 },
  ],
  pages: [
    {
      title: 'Every Stretch, Ranked',
      station: 'spark',
      layout: 'cover',
      scene: 'tr1Cover',
      lines: [],
      explain: [
        'Welcome the learner to Level 3. Level 1 named the madds one lesson at a time; today they all go on one ruler.',
        'Ask: how long is a madd before a hamza? And before a sukoon? Note what the learner remembers.',
      ],
    },
    {
      title: 'One ruler',
      station: 'spark',
      layout: 'story',
      scene: 'tr1Ruler',
      lines: [
        'In Level 1 you met the stretches one by one: two counts, four or five, six.',
        'Each one was its own lesson. Today they meet on one ruler, so you can see them side by side.',
        'A good reciter does not guess a length. They measure it, and they keep the same measure from the first ayah to the last.',
      ],
      explain: [
        'Show the ruler and count the six marks with the learner, one beat each.',
        'A count (haraka) is the time of one short vowel. Keep the beat steady, like a clock, not a race.',
      ],
      teacherNote: 'One count is often shown as folding or opening one finger at a steady pace.',
    },
    {
      title: 'Two causes',
      station: 'zad',
      layout: 'concept',
      scene: 'tr1Causes',
      lines: [
        'Every madd starts with a madd letter: ا، و or ي, resting on the right vowel before it.',
        'If nothing special comes after it, it stays at two counts: the natural madd.',
        'Two things can make it longer: a hamza after it, or a sukoon after it. Every other madd is one of those two.',
      ],
      vocab: [{ arabic: 'سَبَبُ الْمَدّ', translit: 'sabab al-madd', meaning: 'the cause of the madd: a hamza or a sukoon after the madd letter' }],
      explain: [
        'Draw the two causes on the board: ء and ْ. Every name the learner will hear today sits under one of them.',
        'Badal is the exception that proves the rule: its hamza comes before the madd letter, so it stays short.',
      ],
    },
    {
      title: 'Natural: two counts',
      station: 'zad',
      layout: 'concept',
      scene: 'tr1Natural',
      lines: [
        'The natural madd has no cause after it: two counts, never more, never less.',
        'مَـٰلِكِ in Al-Fatiha opens with one: maa, two beats.',
        'Every longer madd is measured against this one.',
      ],
      say: [FATIHA4],
      explain: ['Play the ayah and count the two beats of مَـٰ together.'],
    },
    {
      title: 'Before a hamza',
      station: 'zad',
      layout: 'concept',
      scene: 'tr1Hamza',
      lines: [
        'When a hamza follows the madd letter in the same word, it is muttasil, the joined madd: أُو۟لَـٰٓئِكَ.',
        'When the hamza starts the next word, it is munfasil, the separated madd: بِمَآ أُنزِلَ.',
        'In Hafs by way of ash-Shatibiyyah both take four or five counts. Choose one, and keep it.',
      ],
      say: [BAQARAH5, BAQARAH4],
      explain: [
        'Most teachers take four for both. Five is also correct. What is wrong is changing from ayah to ayah.',
        'A shorter munfasil (two counts) is read through other routes, not ash-Shatibiyyah. It is not our reading here.',
      ],
      teacherNote: 'The rule of consistency: muttasil is never read shorter than munfasil in the same recitation.',
    },
    {
      title: 'Before a sukoon',
      station: 'zad',
      layout: 'concept',
      scene: 'tr1Sukoon',
      lines: [
        'When the sukoon is fixed in the word, the madd is lazim: six counts, always. ٱلضَّآلِّينَ ends Al-Fatiha with one.',
        'The letters at the start of some surahs carry it too: in الٓمٓ, the لام and the ميم each stretch six.',
        'When the sukoon only comes because you stop, the madd is \'aridh: نَسْتَعِينُ at a stop takes two, four or six.',
      ],
      say: [FATIHA7, BAQARAH1, FATIHA5],
      explain: [
        'Lazim is obligatory at six. \'Aridh is a choice the reciter makes and then keeps.',
        'If you read on without stopping, \'aridh disappears: نَسْتَعِينُ becomes a natural two.',
      ],
    },
    {
      title: 'The small stretches',
      station: 'zad',
      layout: 'concept',
      scene: 'tr1Small',
      lines: [
        'Badal: the hamza comes before the madd letter, as in ٱلْـَٔاخِرَةِ. In Hafs it stays at two.',
        'Leen: a still و or ي after a fatha, like ٱلصَّيْفِ. Read on, it has no stretch; at a stop, two, four or six.',
        'Small as they are, they still follow the ruler.',
      ],
      say: [BAQARAH4, QURAYSH2],
      explain: [
        'Let the learner hear ٱلصَّيْفِ with a stop: the reciter gives the ي a gentle length.',
        'Many reciters keep leen at the same length as their \'aridh. Ask the learner to choose with you.',
      ],
    },
    {
      title: 'Ranked by strength',
      station: 'zad',
      layout: 'concept',
      scene: 'tr1Ranked',
      lines: [
        'Not every cause is equally strong. Scholars of recitation rank the madds from strongest to weakest.',
        'Lazim first, then muttasil, then \'aridh, then munfasil, and badal last.',
        'A fixed cause inside one word beats a cause that comes and goes. That is why lazim is always six, and why muttasil may never be shorter than munfasil.',
      ],
      items: ['1 · lazim', '2 · muttasil', '3 · \'aridh', '4 · munfasil', '5 · badal'],
      explain: [
        'This is the wow of the lesson: the ruler is also a ladder. Every later lesson in Part B uses this order.',
        'Keep it simple today. When two causes meet on one letter (Lesson 8), the stronger one decides.',
      ],
      teacherNote: 'Order as in the common teaching of Hafs by way of ash-Shatibiyyah (Taysir ar-Rahman).',
    },
    {
      title: 'One ayah, four stretches',
      station: 'zad',
      layout: 'evidence',
      scene: 'tr1Evidence',
      evidence: {
        arabic: 'وَٱلَّذِينَ يُؤْمِنُونَ بِمَآ أُنزِلَ إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِٱلْـَٔاخِرَةِ هُمْ يُوقِنُونَ',
        meaning: 'And those who believe in what was sent down to you and what was sent down before you, and of the Hereafter they are certain.',
        reference: 'Al-Baqarah 2:4',
      },
      tadabbur: {
        word: 'يُوقِنُونَ',
        root: 'ي ق ن',
        meaning: 'They are certain: yaqeen, a knowledge with no doubt in it. Words from this root come 28 times in the Quran.',
        question: 'The ayah ends on certainty, and you hold its last madd at the stop. What are you certain of?',
        action: 'Recite Al-Baqarah 1 to 5 once this week, slowly, with the same lengths from start to finish.',
      },
      say: [BAQARAH4],
      lines: [
        'Natural in يُؤْمِنُونَ, munfasil twice in بِمَآ أُنزِلَ and وَمَآ أُنزِلَ, badal in ٱلْـَٔاخِرَةِ.',
        'And at the stop, يُوقِنُونَ ends with an \'aridh: two, four or six, as you chose.',
        'One ayah, four kinds of madd, and the ruler keeps them all in proportion.',
      ],
      explain: [
        'Play the ayah. Pause after each madd and ask the learner to name it and give its count.',
        'Stay with the last word: certainty of the Hereafter is how the ayah describes the people of guidance.',
      ],
    },
    {
      title: 'How long?',
      station: 'athar',
      layout: 'game',
      scene: 'tr1Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Eight stretches from Al-Fatiha, Al-Baqarah and Quraysh, read on without stopping. How many counts?',
        bins: [
          { id: 'two', label: '2', hint: 'natural, badal' },
          { id: 'fourfive', label: '4 or 5', hint: 'a hamza after it' },
          { id: 'six', label: '6', hint: 'a fixed sukoon after it' },
        ],
        cards: [
          { label: 'مَـٰ in مَـٰلِكِ', bin: 'two', why: 'Natural madd: nothing after it. Two counts.' },
          { label: 'بِمَآ أُنزِلَ', bin: 'fourfive', why: 'Munfasil: the hamza starts the next word. Four or five.' },
          { label: 'أُو۟لَـٰٓئِكَ', bin: 'fourfive', why: 'Muttasil: the hamza is in the same word. Four or five.' },
          { label: 'ٱلضَّآلِّينَ', bin: 'six', why: 'Lazim: a fixed shadda (a sukoon) after the madd. Always six.' },
          { label: 'الٓمٓ: the لام', bin: 'six', why: 'Lazim in a letter: six counts.' },
          { label: 'ٱلْـَٔاخِرَةِ', bin: 'two', why: 'Badal: the hamza comes first. Two counts in Hafs.' },
          { label: 'ٱلشِّتَآءِ in Quraysh', bin: 'fourfive', why: 'Muttasil: the hamza is in the same word. Four or five.' },
          { label: 'نُو in يُؤْمِنُونَ, reading on', bin: 'two', why: 'Natural: read on, nothing comes after it. Two counts.' },
        ],
      },
      explain: [
        'A short review, no timer and no points. The result goes into your lesson report.',
        'Ask the learner to recite each moment with the count before choosing.',
      ],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Always six?',
      station: 'athar',
      layout: 'question',
      scene: 'tr1Six',
      lines: ['Some stretches are six only when you choose. Some are six every time.'],
      interaction: {
        kind: 'clues',
        prompt: 'Tap every stretch that is always six.',
        clues: [
          { label: 'ٱلضَّآلِّينَ', correct: true },
          { label: 'the ميم of الٓمٓ', correct: true },
          { label: 'نَسْتَعِينُ at a stop', correct: false },
          { label: 'أُو۟لَـٰٓئِكَ', correct: false },
          { label: 'ٱلصَّيْفِ at a stop', correct: false },
        ],
      },
      explain: ['Only lazim is fixed at six. The others are four or five, or a choice at a stop.'],
    },
    {
      title: 'Your turn to recite',
      station: 'athar',
      layout: 'question',
      scene: 'tr1Recite',
      lines: [
        'Recite Al-Fatiha, then Al-Baqarah 1 to 5.',
        'Before you start, say your lengths out loud: munfasil and muttasil, and your \'aridh.',
      ],
      say: [FATIHA7, BAQARAH1, BAQARAH4, BAQARAH5],
      interaction: {
        kind: 'ask',
        prompt: 'Recite to your teacher. Did every madd keep the length you chose?',
        reveal: 'One ruler, the same measure from the first ayah to the last.',
      },
      explain: ['Listen for consistency more than for the exact count: the same kind should sound the same every time.'],
      teacherNote: 'Note the lengths the learner chose in your report; keep them for the rest of Level 3.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'tr1Mission',
      lines: [
        'Choose your lengths with your teacher and write them down.',
        'Every day this week, recite Al-Fatiha and check each madd against your ruler.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'Which length will you keep for muttasil and munfasil?',
        options: ['Four counts', 'Five counts', 'I will decide with my teacher'],
      },
      explain: ['Start the next lesson by hearing Al-Fatiha with the chosen lengths.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'tr1Next',
      lines: [
        'You now know how long to hold. Next: where to let go.',
        'Next time, where a stop keeps the meaning whole, and where it breaks it.',
      ],
      explain: ['End on stopping. Ask the learner to notice the small signs above the ayat of Al-Baqarah 1 to 5.'],
    },
  ],
};
