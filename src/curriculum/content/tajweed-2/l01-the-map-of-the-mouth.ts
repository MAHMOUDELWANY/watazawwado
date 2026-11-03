import type { Lesson } from '../../types';
import { lessonT201TeacherAr } from './l01-teacher-ar.js';

// Rules: docs/curriculum/tajweed/RULES.md. Map: docs/curriculum/tajweed/MAP-level-2.md (Lesson 1: the five areas and
// how to find a letter's point). Brief and evidence log: docs/curriculum/tajweed/L2-01-the-map-of-the-mouth.md.
// Ayat: Uthmani Hafs via the Quran connector (quran.ai, fetched 2026-11-03), unchanged; the reciter (Husary, muallim)
// plays them. Count of points as in Hafs by way of ash-Shatibiyyah: 5 areas, 17 points (Ibn al-Jazari).

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const F = (id: string, text: string) => ({ id, text, voice: 'fusha' as const, emotion: 'clear, slow' });
const FATIHA2 = R('fatiha-2', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', '1:2');
const KAWTHAR1 = R('kawthar-1', 'إِنَّآ أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ', '108:1');

export const lessonT201: Lesson = {
  subject: 'tajweed-2',
  version: 'adults',
  subjectTitle: 'Tajweed · Level 2',
  number: 1,
  title: 'The Map of the Mouth',
  titleAr: 'خريطة المخارج',
  part: 'Level 2 · Where Letters Are Born',
  minutes: 45,
  goal: 'By the end of this lesson, you will name the five areas letters come from and find the home of any letter yourself.',
  reviewed: false,
  teacherAr: lessonT201TeacherAr,
  outcomes: [
    'Names the five areas: the empty space, the throat, the tongue, the lips and the nose (al-jawf, al-halq, al-lisan, ash-shafatan, al-khayshum).',
    'Finds the home of a letter with a hamza before it and a sukoon on it (أَبْ، أَقْ).',
    'Sorts the letters of Al-Fatiha 1:2 into their areas by ear.',
    'Hears the difference in the pairs English speakers mix up: ه / ح, ء / ع, ك / ق.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'Five areas', page: 4 },
    { label: 'Al-Fatiha', page: 9 },
    { label: 'Practice', page: 10 },
    { label: 'My mission', page: 12 },
  ],
  pages: [
    {
      title: 'The Map of the Mouth',
      station: 'spark',
      layout: 'cover',
      scene: 'tm1Cover',
      lines: [],
      explain: [
        'Welcome the learner to Level 2. Level 1 taught the rules you hear; Level 2 teaches where each letter is made.',
        'Ask: when your teacher says "that letter was not right", do you know what to change?',
      ],
    },
    {
      title: 'Same ear, different letters',
      station: 'spark',
      layout: 'story',
      scene: 'tm1Pairs',
      lines: [
        'To an English ear, ه and ح sound like the same h. In Arabic they are two letters from two different depths.',
        'ء and ع can both sound like a small catch in the voice. One is a stop, the other a squeeze deep in the throat.',
        'ك and ق both sound like k. One sits further back than any English sound.',
        'You cannot fix a letter until you know where it lives. Today we draw the map.',
      ],
      say: [F('ah', 'أَهْ'), F('ahh', 'أَحْ'), F('a-hamza', 'أَأْ'), F('a-ain', 'أَعْ'), F('ak', 'أَكْ'), F('aq', 'أَقْ')],
      explain: [
        'Play each pair and ask the learner which one feels deeper. Do not name the places yet.',
        'Most English speakers hear these pairs as one sound at first. That is normal: the ear learns before the tongue.',
      ],
    },
    {
      title: 'Listen, then recite',
      station: 'zad',
      layout: 'evidence',
      scene: 'tm1Listen',
      evidence: {
        arabic: 'لَا تُحَرِّكْ بِهِۦ لِسَانَكَ لِتَعْجَلَ بِهِۦٓ ۝ إِنَّ عَلَيْنَا جَمْعَهُۥ وَقُرْءَانَهُۥ ۝ فَإِذَا قَرَأْنَـٰهُ فَٱتَّبِعْ قُرْءَانَهُۥ',
        meaning: 'Do not move your tongue with it to hurry it. Gathering it and reciting it is upon Us. So when We have recited it, follow its recitation.',
        reference: 'Al-Qiyamah 75:16-18',
      },
      tadabbur: {
        word: 'لِسَانَكَ',
        root: 'ل س ن',
        meaning: 'Your tongue. The word tongue (lisan) comes 25 times in the Quran; here it is the tongue of the Prophet ﷺ receiving the revelation.',
        question: 'Allah taught him to listen first and recite after. What does that say about how you learn to recite?',
        action: 'Before you recite a surah this week, listen to the reciter once and follow him, letter by letter.',
      },
      say: [
        R('qiyamah-16', 'لَا تُحَرِّكْ بِهِۦ لِسَانَكَ لِتَعْجَلَ بِهِۦٓ', '75:16'),
        R('qiyamah-17', 'إِنَّ عَلَيْنَا جَمْعَهُۥ وَقُرْءَانَهُۥ', '75:17'),
        R('qiyamah-18', 'فَإِذَا قَرَأْنَـٰهُ فَٱتَّبِعْ قُرْءَانَهُۥ', '75:18'),
      ],
      lines: [
        'Ibn Kathir explains that the Prophet ﷺ moved his lips quickly while Jibril recited, afraid to lose a word.',
        'Allah told him to be silent and listen; after Jibril left, he recited it exactly as it had been recited to him.',
        'The ear comes first, then the tongue. Every lesson in this level works that way: hear the letter, then find where it lives.',
      ],
      explain: [
        'Play the three ayat. The account of the Prophet ﷺ moving his lips is in al-Bukhari and Muslim from Ibn Abbas, as Ibn Kathir reports.',
        'Link it to the method of the level: the learner always hears the reciter before saying the letter.',
      ],
      teacherNote: 'Tafsir from Ibn Kathir (abridged English), 75:16-18. Keep the story short; the point is "listen, then follow".',
    },
    {
      title: 'Every letter has a home',
      station: 'zad',
      layout: 'concept',
      scene: 'tm1Find',
      lines: [
        'Every letter leaves the body from one place: its makhraj, its exit.',
        'To find it, put a hamza with a fatha before the letter and make the letter still: أَبْ، أَقْ، أَلْ.',
        'Listen to where the sound stops. That spot is the letter\'s home.',
      ],
      say: [F('ab', 'أَبْ'), F('aq', 'أَقْ'), F('al', 'أَلْ')],
      vocab: [{ arabic: 'مَخْرَج', translit: 'makhraj', meaning: 'the exit point of a letter; its home in the mouth or throat' }],
      explain: [
        'Say each one slowly with the learner and hold the still letter: in أَبْ the lips close; in أَقْ the back of the tongue rises.',
        'This test works for every letter. The learner will use it in every lesson of Level 2.',
      ],
      teacherNote: 'Makhraj is the name. "Home" and "exit" are the English handles; use the Arabic word once it is familiar.',
    },
    {
      title: 'Five areas',
      station: 'zad',
      layout: 'concept',
      scene: 'tm1Five',
      lines: [
        'All the letters of Arabic come from five areas.',
        'Three are places you can feel touching: the throat, the tongue and the lips.',
        'Two are open spaces: the empty space inside the mouth and throat, and the nose.',
      ],
      items: ['The empty space · al-jawf', 'The throat · al-halq', 'The tongue · al-lisan', 'The lips · ash-shafatan', 'The nose · al-khayshum'],
      explain: [
        'Let the learner touch their throat, then the tip of their tongue, then their lips while saying أَعْ، أَتْ، أَبْ.',
        'Inside the five areas there are 17 exact points. We visit them one area at a time in the coming lessons.',
      ],
      teacherNote: 'The count of 5 areas and 17 points follows Ibn al-Jazari, as taught in Hafs by way of ash-Shatibiyyah.',
    },
    {
      title: 'The empty space',
      station: 'zad',
      layout: 'concept',
      scene: 'tm1Jawf',
      lines: [
        'The long vowels have no point to touch. They ride the breath through the open mouth until it runs out.',
        'ا after a fatha, و after a damma and ي after a kasra: these three are the madd letters of the jawf.',
        'Al-Kawthar opens with one: إِنَّآ. Hear how the long aa flows, with nothing in the mouth to stop it.',
      ],
      say: [KAWTHAR1],
      explain: [
        'Play the ayah and ask the learner to say a long آ with an open mouth. Nothing touches: that is the jawf.',
        'Their length (two counts and more) was Level 1. Here we only learn where they come from.',
      ],
    },
    {
      title: 'The throat',
      station: 'zad',
      layout: 'concept',
      scene: 'tm1Halq',
      lines: [
        'The throat holds six letters, on three floors.',
        'Deepest: ء and ه. In the middle: ع and ح. Nearest the mouth: غ and خ.',
        'English has ه and the stop of ء. The other four are new to most English speakers, so the throat gets the whole of next lesson.',
      ],
      items: ['ء ه', 'ع ح', 'غ خ'],
      explain: [
        'Say أَهْ، أَحْ، أَخْ one after another: the learner should feel the sound climbing up the throat.',
        'Do not drill them yet. Today is the map; next lesson is the practice.',
      ],
    },
    {
      title: 'The tongue',
      station: 'zad',
      layout: 'concept',
      scene: 'tm1Lisan',
      lines: [
        'The tongue makes eighteen letters, more than every other area put together.',
        'Its back, middle, sides and tip each touch a different part of the roof of the mouth.',
        'Walk from the back to the tip and you pass ق ك, then ج ش ي, then ض ل, then the letters of the tip.',
      ],
      items: ['ق ك', 'ج ش ي', 'ض ل', 'ن ر ط د ت ص ز س ظ ذ ث'],
      explain: [
        'Let the learner say أَقْ then أَتْ and feel the tongue move from the back to the tip.',
        'Each group here is a lesson of its own in Part A.',
      ],
    },
    {
      title: 'The lips and the nose',
      station: 'zad',
      layout: 'concept',
      scene: 'tm1LipsNose',
      lines: [
        'The lips make four letters: ف with the lower lip on the upper teeth, and ب، م، و with both lips.',
        'The nose makes no letter. It gives the ghunnah, the hum of noon and meem.',
        'Hold your nose and say إِنَّ: the hum stops. That is the fifth area at work.',
      ],
      say: [F('af', 'أَفْ'), F('am', 'أَمْ'), KAWTHAR1],
      explain: [
        'Try it together: pinch the nose and say إِنَّ, then let go. The learner will hear the hum come back.',
        'Ghunnah was in Level 1 (The Hum). Here we only point to where it comes from.',
      ],
    },
    {
      title: 'One ayah, the whole map',
      station: 'zad',
      layout: 'concept',
      scene: 'tm1Fatiha',
      lines: [
        'Take the first ayah of Al-Fatiha after the basmalah.',
        'ح، ه and ع come from the throat. ل، د، ر and ن from the tongue. م and ب from the lips.',
        'And the long aa and ee of ٱلْعَـٰلَمِينَ ride the empty space. Four of the five areas in four words.',
        'You recite this ayah at least seventeen times a day. Now you know where every letter of it lives.',
      ],
      say: [FATIHA2],
      explain: [
        'Play the ayah slowly and let the learner point at the area of each letter as it passes.',
        'This is the wow of the lesson: the most recited ayah is a tour of the mouth.',
      ],
    },
    {
      title: 'Which area?',
      station: 'athar',
      layout: 'game',
      scene: 'tm1Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Say each letter with a hamza before it. Which area does it come from?',
        bins: [
          { id: 'halq', label: 'Throat', hint: 'al-halq' },
          { id: 'lisan', label: 'Tongue', hint: 'al-lisan' },
          { id: 'shafatan', label: 'Lips', hint: 'ash-shafatan' },
        ],
        cards: [
          { label: 'ح in ٱلْحَمْدُ', bin: 'halq', why: 'أَحْ: the middle of the throat squeezes. No part of the mouth moves.' },
          { label: 'ق in قُلْ', bin: 'lisan', why: 'أَقْ: the back of the tongue rises to the soft roof of the mouth.' },
          { label: 'ب in رَبِّ', bin: 'shafatan', why: 'أَبْ: both lips close.' },
          { label: 'ع in ٱلْعَـٰلَمِينَ', bin: 'halq', why: 'أَعْ: the middle of the throat, the same floor as ح.' },
          { label: 'ش in شَرِّ', bin: 'lisan', why: 'أَشْ: the middle of the tongue meets the roof of the mouth.' },
          { label: 'ف in ٱلْفَلَقِ', bin: 'shafatan', why: 'أَفْ: the lower lip touches the upper teeth.' },
          { label: 'ه in لِلَّهِ', bin: 'halq', why: 'أَهْ: the deepest floor of the throat.' },
          { label: 'ل in لِلَّهِ', bin: 'lisan', why: 'أَلْ: the edge of the tongue near its tip.' },
        ],
      },
      explain: [
        'A short review, no timer and no points. The result goes into your lesson report.',
        'Ask the learner to say each letter with the hamza test out loud before choosing.',
      ],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Your turn to recite',
      station: 'athar',
      layout: 'question',
      scene: 'tm1Recite',
      lines: [
        'Recite ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ slowly, one word at a time.',
        'After each word, say which areas its letters came from.',
      ],
      say: [FATIHA2],
      interaction: {
        kind: 'ask',
        prompt: 'Recite the ayah to your teacher, word by word. Can you name the area of every letter?',
        reveal: 'Throat, tongue, lips and the empty space. Only the nose was missing.',
      },
      explain: ['Listen for ح and ع especially: if they come out as ه and أ, use the hamza test and try again.'],
      teacherNote: 'Write down any letter the learner mixed up: it tells you which Part A lesson needs the most time.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'tm1Mission',
      lines: [
        'Every day this week, say one of today\'s pairs ten times with the hamza test.',
        'Before you recite, listen to the reciter once, then follow him.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'Which pair will you practise this week?',
        options: ['ه and ح', 'ء and ع', 'ك and ق', 'All three'],
      },
      explain: ['Start the next lesson by hearing the pair they practised.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'tm1Next',
      lines: [
        'Three floors, six letters, and four sounds English does not have.',
        'Next time we go down into the throat, floor by floor.',
      ],
      explain: ['End on the throat. Ask the learner to find a ع and a ح in Al-Fatiha before next lesson.'],
    },
  ],
};
