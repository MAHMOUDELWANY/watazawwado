import type { Lesson } from '../../types';
import { lessonT203TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/tajweed/RULES.md. Map: docs/curriculum/tajweed/MAP-level-2.md (Lesson 3: the back of the
// tongue, ق and ك). Brief and evidence log: docs/curriculum/tajweed/L2-03-the-deepest-tongue.md. Ayat: Uthmani Hafs via
// the Quran connector (quran.ai, fetched 2026-11-03), unchanged; the reciter (Husary, muallim) plays them.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const F = (id: string, text: string) => ({ id, text, voice: 'fusha' as const, emotion: 'clear, slow' });
const IKHLAS1 = R('ikhlas-1', 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', '112:1');
const IKHLAS4 = R('ikhlas-4', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', '112:4');
const KAWTHAR1 = R('kawthar-1', 'إِنَّآ أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ', '108:1');
const FALAQ1 = R('falaq-1', 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', '113:1');
const FIL1 = R('fil-1', 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَـٰبِ ٱلْفِيلِ', '105:1');

export const lessonT203: Lesson = {
  subject: 'tajweed-2',
  version: 'adults',
  subjectTitle: 'Tajweed · Level 2',
  number: 3,
  title: 'The Deepest Tongue',
  titleAr: 'أقصى اللسان: القاف والكاف',
  part: 'Level 2 · Where Letters Are Born',
  minutes: 45,
  goal: 'By the end of this lesson, you will say ق from the very back of the tongue and ك one step forward, and never let one become the other.',
  reviewed: false,
  teacherAr: lessonT203TeacherAr,
  outcomes: [
    'Places ق at the furthest back of the tongue against the soft roof, and ك one step forward and lower.',
    'Gives ق its full, heavy sound and its bounce at a stop; keeps ك light, with a little breath.',
    'Avoids the common slips: ق as k, as a hamza or as g; ك made heavy.',
    'Recites Al-Ikhlas and Al-Kawthar 108:1 with a clear ق and ك.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Two points', page: 2 },
    { label: 'Al-Ikhlas', page: 6 },
    { label: 'Practice', page: 8 },
    { label: 'My mission', page: 10 },
  ],
  pages: [
    {
      title: 'The Deepest Tongue',
      station: 'spark',
      layout: 'cover',
      scene: 'tm3Cover',
      lines: [],
      explain: [
        'Ask about the mission: can the learner say the six throat letters from the bottom floor up?',
        'Tell them: today we climb out of the throat to the first two letters of the tongue.',
      ],
    },
    {
      title: 'A heart or a dog?',
      station: 'spark',
      layout: 'story',
      scene: 'tm3Recall',
      lines: [
        'قَلْب is a heart. كَلْب is a dog. The only difference is the first letter.',
        'قُلْ means say, the first word of Al-Ikhlas. كُلْ means eat.',
        'On the map, ق and ك sit right next to each other, at the very back of the tongue. One small step decides the word.',
      ],
      say: [F('qalb', 'قَلْب'), F('kalb', 'كَلْب'), F('qul', 'قُلْ'), F('kul', 'كُلْ')],
      explain: [
        'Play each pair and let the learner guess the meaning from the sound alone.',
        'Do not explain the difference yet. Let them feel that it matters first.',
      ],
    },
    {
      title: 'Zoom in',
      station: 'zad',
      layout: 'concept',
      scene: 'tm3Zoom',
      lines: [
        'Zoom in on the back of the mouth: the back of the tongue below, the soft roof above it.',
        'ق is made where the furthest back of the tongue rises to the soft roof.',
        'ك is made a small step forward, and a little lower on the tongue.',
      ],
      vocab: [{ arabic: 'أَقْصَى اللِّسَان', translit: 'aqsa al-lisan', meaning: 'the furthest back of the tongue, home of ق and ك' }],
      explain: [
        'Let the learner say أَقْ then أَكْ and feel the touch move forward by a step.',
        'The soft roof (the soft palate) is the soft part behind the hard ridge you can feel with the tongue.',
      ],
      teacherNote: 'The two letters are called lahawiyyah, after al-lahah (the uvula) near their point.',
    },
    {
      title: 'ق: deep and full',
      station: 'zad',
      layout: 'concept',
      scene: 'tm3Qaf',
      lines: [
        'For ق, the back of the tongue rises high and presses firmly.',
        'The sound fills the mouth: ق is one of the heavy letters of Level 1, so it is never thin.',
        'Al-Ikhlas opens with it: قُلْ. The reciter gives that ق its full weight.',
      ],
      say: [F('aq', 'أَقْ'), IKHLAS1],
      explain: [
        'Ask the learner to say قَ with an open throat and a full mouth, then compare with a thin "ka".',
        'If the ق sounds like k, the tongue is too far forward; if it sounds like a hamza, the tongue did not touch at all.',
      ],
    },
    {
      title: 'ك: light, with a breath',
      station: 'zad',
      layout: 'concept',
      scene: 'tm3Kaf',
      lines: [
        'For ك, the tongue touches one step forward and lets a little breath escape after the stop.',
        'It stays light: the mouth does not fill the way it does for ق.',
        'Al-Kawthar 108:1 has two of them in two words: أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ.',
      ],
      say: [F('ak', 'أَكْ'), KAWTHAR1],
      explain: [
        'Hold a hand in front of the mouth on أَكْ: the learner feels a small puff of air. On أَقْ there is none.',
        'That breath is the same "breath only" quality as ه ح خ last lesson.',
      ],
    },
    {
      title: 'Only ق bounces',
      station: 'zad',
      layout: 'concept',
      scene: 'tm3Bounce',
      lines: [
        'ق is one of the five bounce letters of Level 1. ك is not.',
        'Stop on ٱلْفَلَقِ and the ق echoes. Stop on a ك and only a breath follows.',
        'Same corner of the mouth, two exits: a voice that bounces, and a breath that slips out.',
      ],
      say: [FALAQ1],
      explain: [
        'Play the ayah and stop on ٱلْفَلَقِ: the learner should hear the bounce.',
        'This is the wow of the lesson: the throat lesson\'s voice and breath come back here, one step up.',
      ],
    },
    {
      title: 'Both in one surah',
      station: 'zad',
      layout: 'evidence',
      scene: 'tm3Ikhlas',
      evidence: {
        arabic: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ',
        meaning: 'And there is none equal to Him.',
        reference: 'Al-Ikhlas 112:4',
      },
      tadabbur: {
        word: 'كُفُوًا',
        root: 'ك ف أ',
        meaning: 'An equal, a match. This word comes only once in the whole Quran, here, to say that nothing is like Allah.',
        question: 'The surah opens with قُلْ and closes with كُفُوًا. What does it ask of you to say both letters with care?',
        action: 'Recite Al-Ikhlas once a day this week and listen for every ق and ك in it.',
      },
      say: [IKHLAS1, IKHLAS4],
      lines: [
        'Al-Ikhlas starts at the back: قُلْ. It ends one step forward: يَكُن، كُفُوًا.',
        'In four short ayat the tongue travels from one point to the other.',
        'Say كُفُوًا with a ق and it is no longer the word of the ayah.',
      ],
      explain: [
        'Play both ayat. Ask the learner to point at the ق in the first and the two ك in the last.',
        'Stay with the meaning a moment: the one word for "equal" in the whole Quran is used to deny any equal to Allah.',
      ],
    },
    {
      title: 'Four slips',
      station: 'zad',
      layout: 'concept',
      scene: 'tm3Slips',
      lines: [
        'ق said as k: the tongue sits too far forward. Move the touch back.',
        'ق said as a hamza: you will hear it in Cairo, where قَلْب becomes \'alb. In the Quran, never.',
        'ق said as g, and ك made heavy like ق: each letter loses the step that makes it itself.',
      ],
      items: ['ق → k', 'ق → ء', 'ق → g', 'ك → ق'],
      explain: [
        'If the learner also studies Egyptian, make the point clearly: street Cairo drops the ق; the Quran and Fusha keep it.',
        'Model each slip and let the learner name it.',
      ],
    },
    {
      title: 'Which letter makes the word?',
      station: 'athar',
      layout: 'game',
      scene: 'tm3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Each card is a meaning or a moment. Is it ق or ك?',
        bins: [
          { id: 'qaf', label: 'ق', hint: 'the furthest back, full, bounces' },
          { id: 'kaf', label: 'ك', hint: 'one step forward, light, a breath' },
        ],
        cards: [
          { label: 'a heart: …َلْب', bin: 'qaf', why: 'قَلْب is a heart. With ك it would be a dog.' },
          { label: 'a dog: …َلْب', bin: 'kaf', why: 'كَلْب: the light ك, one step forward.' },
          { label: 'say: …ُلْ (the first word of Al-Ikhlas)', bin: 'qaf', why: 'قُلْ, say. كُلْ would mean eat.' },
          { label: 'an equal: …ُفُوًا (Al-Ikhlas 4)', bin: 'kaf', why: 'كُفُوًا, the one word for "equal" in the Quran.' },
          { label: 'it bounces when you stop on it', bin: 'qaf', why: 'ق is a bounce letter; ك is not.' },
          { label: 'a small puff of breath after it', bin: 'kaf', why: 'ك lets a little breath out; ق does not.' },
          { label: 'it fills the mouth: a heavy letter', bin: 'qaf', why: 'ق is heavy; ك stays light.' },
          { label: 'the last word of Al-Falaq 1: ٱلْفَلَ…ِ', bin: 'qaf', why: 'ٱلْفَلَقِ, and at the stop it bounces.' },
        ],
      },
      explain: [
        'A short review, no timer and no points. The result goes into your lesson report.',
        'Ask the learner to say the word with each letter before choosing.',
      ],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Your turn to recite',
      station: 'athar',
      layout: 'question',
      scene: 'tm3Recite',
      lines: [
        'Recite Al-Ikhlas, then the first ayah of Al-Kawthar and of Al-Fil.',
        'Your teacher listens only for ق and ك today.',
      ],
      say: [IKHLAS1, IKHLAS4, KAWTHAR1, FIL1],
      interaction: {
        kind: 'ask',
        prompt: 'Recite to your teacher. Was every ق full and every ك light?',
        reveal: 'Back and full for ق, a step forward and light for ك.',
      },
      explain: ['Al-Fil 105:1 has كَيْفَ and رَبُّكَ: two light ك. Correct only ق and ك today.'],
      teacherNote: 'Note any ق that came out as k or a hamza: it is the most common slip for this learner group.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'tm3Mission',
      lines: [
        'Once a day, say قَلْب and كَلْب, قُلْ and كُلْ, and feel the step.',
        'Recite Al-Ikhlas daily and give its first ق and its last ك their own places.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'When will you recite Al-Ikhlas this week?',
        options: ['After Fajr', 'Before sleeping', 'In my sunnah prayers', 'Another time'],
      },
      explain: ['Start the next lesson with the two pairs.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'tm3Next',
      lines: [
        'Move forward along the tongue to its middle, under the hard roof of the mouth.',
        'Three letters live there: ج، ش، ي. Next time, the middle of the tongue.',
      ],
      explain: ['End on the middle of the tongue. Ask the learner to find a ش in Al-Falaq before next lesson.'],
    },
  ],
};
