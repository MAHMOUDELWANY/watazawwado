import type { Lesson } from '../../types';
import { lessonT302TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/tajweed/RULES.md. Map: docs/curriculum/tajweed/MAP-level-3.md (Lesson 2: where a stop is
// tamm, kafi, hasan or qabih; where to start again). Brief and evidence log: docs/curriculum/tajweed/L3-02-stop-and-start.md.
// Ayat: Uthmani Hafs via the Quran connector (quran.ai, fetched 2026-11-03), unchanged; the reciter (Husary, muallim) plays them.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const MUHAMMAD19 = R('muhammad-19', 'فَٱعْلَمْ أَنَّهُۥ لَآ إِلَـٰهَ إِلَّا ٱللَّهُ وَٱسْتَغْفِرْ لِذَنۢبِكَ وَلِلْمُؤْمِنِينَ وَٱلْمُؤْمِنَـٰتِ ۗ وَٱللَّهُ يَعْلَمُ مُتَقَلَّبَكُمْ وَمَثْوَىٰكُمْ', '47:19');
const BAQARAH2 = R('baqarah-2', 'ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ', '2:2');
const BAQARAH5 = R('baqarah-5', 'أُو۟لَـٰٓئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُو۟لَـٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ', '2:5');
const BAQARAH6 = R('baqarah-6', 'إِنَّ ٱلَّذِينَ كَفَرُوا۟ سَوَآءٌ عَلَيْهِمْ ءَأَنذَرْتَهُمْ أَمْ لَمْ تُنذِرْهُمْ لَا يُؤْمِنُونَ', '2:6');
const BAQARAH7 = R('baqarah-7', 'خَتَمَ ٱللَّهُ عَلَىٰ قُلُوبِهِمْ وَعَلَىٰ سَمْعِهِمْ ۖ وَعَلَىٰٓ أَبْصَـٰرِهِمْ غِشَـٰوَةٌ ۖ وَلَهُمْ عَذَابٌ عَظِيمٌ', '2:7');
const FATIHA2 = R('fatiha-2', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', '1:2');
const FATIHA3 = R('fatiha-3', 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', '1:3');

export const lessonT302: Lesson = {
  subject: 'tajweed-3',
  version: 'adults',
  subjectTitle: 'Tajweed · Level 3',
  number: 2,
  title: 'Stop and Start',
  titleAr: 'الوقف والابتداء',
  part: 'Level 3 · Measure',
  minutes: 50,
  goal: 'By the end of this lesson, you will choose where to stop so the meaning stays whole, and where to start again so it stays true.',
  reviewed: false,
  teacherAr: lessonT302TeacherAr,
  outcomes: [
    'Names the four kinds of stop: complete (tamm), sufficient (kafi), good (hasan) and wrong (qabih).',
    'Stops at a complete or sufficient place and starts with the next words.',
    'After a good stop in the middle of an ayah, goes back and starts from a sound place.',
    'Never stops or starts where the meaning breaks, and links the Mushaf\'s signs to the kinds of stop.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Four stops', page: 3 },
    { label: 'Starting again', page: 7 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Stop and Start',
      station: 'spark',
      layout: 'cover',
      scene: 'tr2Cover',
      lines: [],
      explain: [
        'Ask about the mission: which lengths did the learner choose, and did they keep them all week?',
        'Tell them: last lesson was how long to hold; today is where to let go.',
      ],
    },
    {
      title: 'One breath in the wrong place',
      station: 'spark',
      layout: 'story',
      scene: 'tr2Breath',
      lines: [
        'You are reciting, your breath runs out, and you stop. Where you stop is not a small thing.',
        'Stop after لَآ إِلَـٰهَ and the words alone say "there is no god". The ayah says the opposite: there is no god except Allah.',
        'The same words, one breath apart. Stopping well is part of reciting well.',
      ],
      say: [MUHAMMAD19],
      explain: [
        'Let the learner feel the shock of it: the stop did not change a letter, only where the sentence ended.',
        'No blame: everyone runs out of breath. Today they learn what to do when it happens.',
      ],
    },
    {
      title: 'Know it first',
      station: 'zad',
      layout: 'evidence',
      scene: 'tr2Know',
      evidence: {
        arabic: 'فَٱعْلَمْ أَنَّهُۥ لَآ إِلَـٰهَ إِلَّا ٱللَّهُ وَٱسْتَغْفِرْ لِذَنۢبِكَ وَلِلْمُؤْمِنِينَ وَٱلْمُؤْمِنَـٰتِ ۗ وَٱللَّهُ يَعْلَمُ مُتَقَلَّبَكُمْ وَمَثْوَىٰكُمْ',
        meaning: 'So know that there is no god except Allah, and ask forgiveness for your sin and for the believing men and women. And Allah knows your moving about and your resting place.',
        reference: 'Muhammad 47:19',
      },
      tadabbur: {
        word: 'فَٱعْلَمْ',
        root: 'ع ل م',
        meaning: 'So know. The ayah begins with knowing; the root of knowledge comes 854 times in the Quran.',
        question: 'The first command here is to know, and what you must know is the line you must never cut. How carefully do you say it?',
        action: 'This week, whenever you say لَآ إِلَـٰهَ إِلَّا ٱللَّهُ, say it in one breath, never split.',
      },
      say: [MUHAMMAD19],
      lines: [
        'The ayah opens with a command to know before it gives anything else.',
        'Its first words are the testimony itself, and they stand or fall as one sentence.',
        'The small ۗ before وَٱللَّهُ marks a good place to breathe: the next sentence starts there.',
      ],
      explain: [
        'Play the ayah. Point at the stopping sign ۗ (stopping is better there) and at the place that must never be cut.',
        'This ayah is the model for the whole lesson: a place to stop, and a place to never stop.',
      ],
    },
    {
      title: 'Four kinds of stop',
      station: 'zad',
      layout: 'concept',
      scene: 'tr2Four',
      lines: [
        'Scholars of recitation judge a stop by what is left behind it and what comes after it.',
        'Complete and sufficient stops end a whole meaning. A good stop ends a phrase that still leans on what follows.',
        'A wrong stop cuts the meaning, or turns it upside down.',
      ],
      vocab: [
        { arabic: 'وَقْف', translit: 'waqf', meaning: 'stopping: cutting the sound at the end of a word, with a breath' },
        { arabic: 'ابْتِدَاء', translit: 'ibtida\'', meaning: 'starting again after a stop' },
      ],
      explain: [
        'Draw four colours, green to red. Every stop the learner makes from now on goes in one of them.',
        'Stopping at the end of an ayah is always allowed and is the practice of the reciters.',
      ],
    },
    {
      title: 'Complete and sufficient',
      station: 'zad',
      layout: 'concept',
      scene: 'tr2Complete',
      lines: [
        'Al-Baqarah 5 ends the passage about the people of guidance: ٱلْمُفْلِحُونَ. The next ayah opens a new group. A complete stop.',
        'Al-Baqarah 6 ends on لَا يُؤْمِنُونَ, and ayah 7 still speaks about the same people. The meaning is whole, but the passage goes on: a sufficient stop.',
        'At both, you stop, breathe, and start straight on with the next words.',
      ],
      say: [BAQARAH5, BAQARAH6, BAQARAH7],
      explain: [
        'Play 2:5 to 2:7 and stop the audio at the two ends. Ask: is the meaning whole here? Does a new subject start?',
        'The difference between complete and sufficient is only how strongly the next part is tied to this one in meaning.',
      ],
    },
    {
      title: 'Good, then go back',
      station: 'zad',
      layout: 'concept',
      scene: 'tr2Good',
      lines: [
        'Stop on ٱلْحَمْدُ لِلَّهِ and the words make sense: all praise is for Allah. A good stop.',
        'But starting again from رَبِّ ٱلْعَـٰلَمِينَ leaves it hanging. So you go back and start from ٱلْحَمْدُ.',
        'At the end of an ayah it is different: you may stop on ٱلْعَـٰلَمِينَ and start ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ, as the reciters do.',
      ],
      say: [FATIHA2, FATIHA3],
      explain: [
        'Model it: stop after لِلَّهِ, breathe, then go back to ٱلْحَمْدُ. This going back is called i\'adah.',
        'Many teachers allow the good stop mid-ayah only when the breath truly runs out.',
      ],
    },
    {
      title: 'Wrong: never stop here',
      station: 'zad',
      layout: 'concept',
      scene: 'tr2Wrong',
      lines: [
        'A wrong stop leaves words that mean something false, or nothing at all.',
        'An-Nisa\' 43 opens with لَا تَقْرَبُوا۟ ٱلصَّلَوٰةَ, and goes on: while you are intoxicated. Stop after ٱلصَّلَوٰةَ and it forbids the prayer itself.',
        'If your breath runs out at a wrong place, stop, breathe, and go back to start before it.',
      ],
      explain: [
        'This ayah is shown as words only; there is no need to play it here. The point is the cut, not the recitation.',
        'Reassure: a wrong stop that you go back to fix is not a sin of recitation. Leaving it is the mistake.',
      ],
    },
    {
      title: 'Where to start',
      station: 'zad',
      layout: 'concept',
      scene: 'tr2Start',
      lines: [
        'Starting again has one rule: start where the meaning starts.',
        'After a complete or sufficient stop, start with the next word. After a good or wrong stop in the middle of an ayah, go back.',
        'Never start on a word that, alone, says something the ayah does not mean.',
      ],
      explain: [
        'Ask the learner to point, in 47:19, where they could start again after a stop at ۗ: وَٱللَّهُ يَعْلَمُ.',
        'Starting is called ibtida\'. Unlike stopping, it is always a choice, never forced by the breath.',
      ],
    },
    {
      title: 'The signs help',
      station: 'zad',
      layout: 'concept',
      scene: 'tr2Signs',
      lines: [
        'The Mushaf marks many of these choices with small signs above the line.',
        'مـ means you must stop. لا means do not stop here. ج means either is fine; صلى joining is better; قلى stopping is better.',
        'And ∴ comes in pairs: stop at one of the two, not both, as in لَا رَيْبَ ۛ فِيهِ ۛ.',
      ],
      say: [BAQARAH2],
      explain: [
        'Play 2:2 twice: stopping after رَيْبَ, then stopping after فِيهِ. Both are right; stopping at both is not.',
        'The signs were set by scholars of the Mushaf; they guide the choice but do not replace understanding.',
      ],
      teacherNote: 'Signs as printed in the Mushaf of the King Fahd Complex (Hafs).',
    },
    {
      title: 'Stop or go on?',
      station: 'athar',
      layout: 'game',
      scene: 'tr2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'You stop at each of these places. What do you do next?',
        bins: [
          { id: 'on', label: 'Start with the next word', hint: 'complete or sufficient' },
          { id: 'back', label: 'Go back, then start', hint: 'good, in the middle of an ayah' },
          { id: 'never', label: 'Never stop here', hint: 'wrong: the meaning breaks' },
        ],
        cards: [
          { label: 'after ٱلْمُفْلِحُونَ (2:5)', bin: 'on', why: 'A complete stop: a new passage begins in 2:6.' },
          { label: 'after لَا يُؤْمِنُونَ (2:6)', bin: 'on', why: 'A sufficient stop: the meaning is whole; 2:7 goes on about them.' },
          { label: 'after لَآ إِلَـٰهَ (47:19)', bin: 'never', why: 'Wrong: alone, the words say the opposite of the ayah.' },
          { label: 'after لَا تَقْرَبُوا۟ ٱلصَّلَوٰةَ (4:43)', bin: 'never', why: 'Wrong: it would forbid the prayer itself.' },
          { label: 'after ٱلْحَمْدُ لِلَّهِ (1:2)', bin: 'back', why: 'Good: the words make sense, but رَبِّ ٱلْعَـٰلَمِينَ cannot start on its own.' },
          { label: 'after لَا رَيْبَ ۛ (2:2)', bin: 'on', why: 'One of the paired signs: stop here, then start فِيهِ هُدًى.' },
          { label: 'at the ۗ in 47:19', bin: 'on', why: 'Stopping is better there; start again with وَٱللَّهُ يَعْلَمُ.' },
        ],
      },
      explain: [
        'A short review, no timer and no points. The result goes into your lesson report.',
        'Ask the learner to say the words up to the stop out loud before choosing.',
      ],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Your turn to recite',
      station: 'athar',
      layout: 'question',
      scene: 'tr2Recite',
      lines: [
        'Recite Al-Baqarah 1 to 7, stopping only where you choose to.',
        'Say each stop out loud before you take it: complete, sufficient or good.',
      ],
      say: [BAQARAH2, BAQARAH5, BAQARAH6, BAQARAH7],
      interaction: {
        kind: 'ask',
        prompt: 'Recite to your teacher. Did every stop keep the meaning whole, and every start begin where the meaning begins?',
        reveal: 'Stop where a meaning ends; start where a meaning begins.',
      },
      explain: ['Listen for the stops, not the letters, today. Keep the madd lengths from Lesson 1.'],
      teacherNote: 'Note any stop the learner took in the middle of an ayah, and whether they went back.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'tr2Mission',
      lines: [
        'In every recitation this week, notice one stopping sign and follow it.',
        'Say لَآ إِلَـٰهَ إِلَّا ٱللَّهُ in one breath, every time.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'Which sign will you look for first?',
        options: ['مـ · must stop', 'قلى · stopping is better', '∴ · the pair', 'All of them'],
      },
      explain: ['Start the next lesson by asking which sign they found and where.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'tr2Next',
      lines: [
        'One letter changes its weight depending on what is around it: heavy here, light there.',
        'Next time: the raa, in every one of its cases.',
      ],
      explain: ['End on raa. Ask the learner to find a raa with a kasra and one with a fatha in Al-Fatiha.'],
    },
  ],
};
