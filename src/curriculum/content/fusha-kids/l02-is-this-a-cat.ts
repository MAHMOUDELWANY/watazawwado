import type { Lesson } from '../../types';
import { lessonF02TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP.md (Lesson 2: أَ ... ؟ نَعَمْ / لَا; pets and toys).
// The Zad Kids cast (owner, decision 1, 2026-10-26). Every Arabic word is fully diacritized and plays on tap (Fusha clone).

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonF02: Lesson = {
  subject: 'fusha-kids',
  version: 'kids',
  subjectTitle: 'Fusha Arabic · Kids',
  number: 2,
  title: 'Is This a Cat?',
  titleAr: 'أَهَذَا قِطٌّ؟',
  part: 'Level 1',
  minutes: 45,
  goal: 'By the end of this lesson, you will ask "Is this a…?" in Arabic, answer yes or no, and name six animals.',
  reviewed: false,
  teacherAr: lessonF02TeacherAr,
  outcomes: [
    'Follows a short guessing game in Arabic.',
    'Turns هَذَا قِطٌّ into a question with أَ: أَهَذَا قِطٌّ؟',
    'Answers نَعَمْ، هَذَا... or لَا، هَذَا...',
    'Knows six animal words: قِطٌّ، كَلْبٌ، أَرْنَبٌ، حِصَانٌ، دُبٌّ، دِيكٌ.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 3 },
    { label: 'أَ', page: 4 },
    { label: 'نَعَمْ / لَا', page: 5 },
    { label: 'Animals', page: 6 },
    { label: 'Practice', page: 7 },
    { label: 'My mission', page: 10 },
  ],
  pages: [
    {
      title: 'Is This a Cat?',
      station: 'spark',
      layout: 'cover',
      scene: 'fk2Cover',
      lines: [],
      explain: [
        'Greet the child in Arabic: السَّلَامُ عَلَيْكُمْ. Ask about the mission: who played "What is this?" at home?',
        'Tell them: today there is a mystery box, and you can only open it in Arabic.',
      ],
    },
    {
      title: 'Remember?',
      station: 'spark',
      layout: 'concept',
      scene: 'fk2Recall',
      lines: [
        'Three things from last time. Point and ask: مَا هَذَا؟',
        'Answer with هَذَا and the word.',
      ],
      items: ['كِتَابٌ', 'مِفْتَاحٌ', 'كُرْسِيٌّ'],
      say: [W('maa-haadha', 'مَا هَذَا؟', 'curious'), W('haadha-kitab', 'هَذَا كِتَابٌ.'), W('haadha-miftah', 'هَذَا مِفْتَاحٌ.'), W('haadha-kursi', 'هَذَا كُرْسِيٌّ.')],
      explain: ['Two minutes only. Let the child ask you too. Praise every full sentence.'],
    },
    {
      title: 'The mystery box',
      station: 'spark',
      layout: 'story',
      scene: 'fk2Box',
      lines: [
        'Maryam brings a big box with a hole in the top.',
        'Yusuf puts his hand inside. He cannot see anything!',
        'He has to guess what he touches. In Arabic, of course.',
      ],
      explain: [
        'Build the suspense. Ask the child: what could be inside? Let them guess in English for now.',
        'If you can, have a real box or bag with toys ready for the practice later.',
      ],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fk2Story',
      lines: [
        'Listen and watch. You do not need every word.',
        'Yusuf asks. Maryam answers. Listen to the first sound of each question.',
        'Who jumped into the box at the end?',
      ],
      say: [
        W('story-1', 'أَهَذَا كَلْبٌ؟', 'curious, unsure'),
        W('story-2', 'لَا.', 'playful'),
        W('story-3', 'أَهَذَا أَرْنَبٌ؟', 'curious'),
        W('story-4', 'نَعَمْ، هَذَا أَرْنَبٌ!', 'happy'),
        W('story-5', 'أَهَذَا دُبٌّ؟', 'unsure, a little scared'),
        W('story-6', 'لَا، لَا! هَذَا قِطٌّ!', 'laughing'),
      ],
      explain: [
        'Play the whole scene twice. Do not translate yet.',
        'Ask in English: what did Yusuf touch first? Was he right? And who was the last one in the box? (Mishmish, the cat!)',
        'Then ask: which sound did every question start with? Let the child find أَ.',
      ],
      teacherNote: 'Input first: the pictures carry the meaning. Translate only what the child cannot guess.',
    },
    {
      title: 'أَ makes a question',
      station: 'zad',
      layout: 'concept',
      scene: 'fk2Hamza',
      lines: [
        'هَذَا قِطٌّ. This is a cat. That is telling.',
        'Put أَ at the very front, and it becomes asking: أَهَذَا قِطٌّ؟',
        'Your voice goes up at the end, like in English.',
      ],
      vocab: [
        { arabic: 'أَ', translit: 'a', meaning: 'turns a sentence into a yes-or-no question' },
        { arabic: 'أَهَذَا...؟', translit: 'ahādhā...?', meaning: 'is this...?' },
      ],
      say: [W('haadha-qitt', 'هَذَا قِطٌّ.'), W('a-haadha-qitt', 'أَهَذَا قِطٌّ؟', 'asking, voice going up')],
      explain: [
        'Show the trick with your finger: tap the front of the sentence and say أَ.',
        'Read both lines and let the child hear the voice go up on the question.',
      ],
      teacherNote: 'In writing, أَ joins the next word: أَهَذَا. Point it out, but do not drill spelling.',
    },
    {
      title: 'نَعَمْ or لَا',
      station: 'zad',
      layout: 'concept',
      scene: 'fk2Yes',
      lines: [
        'نَعَمْ means yes. لَا means no.',
        'Yes: say نَعَمْ, then the sentence again: نَعَمْ، هَذَا قِطٌّ.',
        'No: say لَا, then the right word: لَا، هَذَا كَلْبٌ.',
      ],
      vocab: [
        { arabic: 'نَعَمْ', translit: 'na‘am', meaning: 'yes' },
        { arabic: 'لَا', translit: 'lā', meaning: 'no' },
      ],
      say: [W('naam', 'نَعَمْ', 'happy'), W('la', 'لَا', 'firm, friendly'), W('naam-qitt', 'نَعَمْ، هَذَا قِطٌّ.', 'happy'), W('la-kalb', 'لَا، هَذَا كَلْبٌ.', 'friendly')],
      explain: [
        'Nod for نَعَمْ, shake your head for لَا. Then ask the child quick questions about things in the room.',
        'A full answer is the goal: not only نَعَمْ, but نَعَمْ، هَذَا...',
      ],
    },
    {
      title: 'Six animals',
      station: 'zad',
      layout: 'concept',
      scene: 'fk2Animals',
      lines: [
        'Here are the animals from the box, and three more.',
        'Tap each one, listen, and say it.',
      ],
      items: ['قِطٌّ: cat', 'كَلْبٌ: dog', 'أَرْنَبٌ: rabbit', 'حِصَانٌ: horse', 'دُبٌّ: bear', 'دِيكٌ: rooster'],
      vocab: [
        { arabic: 'قِطٌّ', translit: 'qiṭṭ', meaning: 'cat' },
        { arabic: 'كَلْبٌ', translit: 'kalb', meaning: 'dog' },
        { arabic: 'أَرْنَبٌ', translit: 'arnab', meaning: 'rabbit' },
        { arabic: 'حِصَانٌ', translit: 'ḥiṣān', meaning: 'horse' },
        { arabic: 'دُبٌّ', translit: 'dubb', meaning: 'bear' },
        { arabic: 'دِيكٌ', translit: 'dīk', meaning: 'rooster' },
      ],
      say: [W('qitt', 'قِطٌّ'), W('kalb', 'كَلْبٌ'), W('arnab', 'أَرْنَبٌ'), W('hisan', 'حِصَانٌ'), W('dubb', 'دُبٌّ'), W('dik', 'دِيكٌ')],
      explain: [
        'Make each animal\'s sound after you say its name; children remember the word with the sound.',
        'Then play: you make the sound, the child says the word.',
      ],
    },
    {
      title: 'Whose shadow?',
      station: 'athar',
      layout: 'question',
      scene: 'fk2Shadow',
      lines: ['A shadow appears behind the curtain. Maryam asks: أَهَذَا كَلْبٌ؟'],
      say: [W('a-haadha-kalb', 'أَهَذَا كَلْبٌ؟', 'curious')],
      interaction: {
        kind: 'clues',
        prompt: 'Look at the shadow. What is the right answer?',
        clues: [
          { label: 'لَا، هَذَا حِصَانٌ.', correct: true },
          { label: 'نَعَمْ، هَذَا كَلْبٌ.', correct: false },
          { label: 'لَا، هَذَا دِيكٌ.', correct: false },
        ],
      },
      explain: ['Let the child say the answer aloud before tapping. The long neck and the tail are the clues.'],
    },
    {
      title: 'Yes or no?',
      station: 'athar',
      layout: 'game',
      scene: 'fk2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Look at the animal, read the question, and answer: نَعَمْ or لَا?',
        bins: [
          { id: 'naam', label: 'نَعَمْ', hint: 'yes' },
          { id: 'la', label: 'لَا', hint: 'no' },
        ],
        cards: [
          { label: 'A cat · أَهَذَا قِطٌّ؟', bin: 'naam', why: 'نَعَمْ، هَذَا قِطٌّ.' },
          { label: 'A dog · أَهَذَا أَرْنَبٌ؟', bin: 'la', why: 'لَا، هَذَا كَلْبٌ.' },
          { label: 'A horse · أَهَذَا حِصَانٌ؟', bin: 'naam', why: 'نَعَمْ، هَذَا حِصَانٌ.' },
          { label: 'A bear · أَهَذَا دِيكٌ؟', bin: 'la', why: 'لَا، هَذَا دُبٌّ.' },
          { label: 'A rabbit · أَهَذَا أَرْنَبٌ؟', bin: 'naam', why: 'نَعَمْ، هَذَا أَرْنَبٌ.' },
          { label: 'A rooster · أَهَذَا قِطٌّ؟', bin: 'la', why: 'لَا، هَذَا دِيكٌ.' },
          { label: 'A book · أَهَذَا كِتَابٌ؟', bin: 'naam', why: 'نَعَمْ، هَذَا كِتَابٌ.' },
          { label: 'A key · أَهَذَا قَلَمٌ؟', bin: 'la', why: 'لَا، هَذَا مِفْتَاحٌ.' },
        ],
      },
      explain: ['Let the child answer with the whole sentence, then sort. The result goes into your report.'],
    },
    {
      title: 'Your turn: the mystery box',
      station: 'athar',
      layout: 'question',
      scene: 'fk2Talk',
      lines: [
        'Now you play the box game, in Arabic only.',
        'One puts a hand in the box and asks أَهَذَا...؟ The other answers نَعَمْ or لَا.',
      ],
      say: [W('a-haadha-dubb', 'أَهَذَا دُبٌّ؟', 'curious'), W('naam-dubb', 'نَعَمْ، هَذَا دُبٌّ.', 'happy')],
      interaction: { kind: 'ask', prompt: 'Play five rounds, then swap. Did every answer start with نَعَمْ or لَا?', reveal: 'مُمْتَازٌ! You asked and answered real questions in Arabic.' },
      explain: [
        'Use real toys or things from the room. If you teach online, hold things behind your back and let the child ask.',
        'Mix in last lesson\'s words: كِتَابٌ، قَلَمٌ، مِفْتَاحٌ.',
      ],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fk2Mission',
      lines: [
        'At home, Yusuf makes his own mystery box for Jiddo.',
        'Jiddo guesses: أَهَذَا قَلَمٌ؟ Yusuf laughs: لَا!',
      ],
      say: [W('a-haadha-qalam', 'أَهَذَا قَلَمٌ؟', 'grandfatherly, playful'), W('la', 'لَا', 'firm, friendly')],
      interaction: {
        kind: 'choose',
        prompt: 'Your mission: make a mystery box at home and play five rounds in Arabic. Who will guess?',
        options: ['Mum', 'Dad', 'My brother or sister', 'Grandma or Grandpa'],
      },
      explain: ['Ask about the box at the start of the next lesson: what was inside, and who guessed right?'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fk2Next',
      lines: [
        'In the park, Jiddo points at a bird far away.',
        'This one is near. That one is far. Arabic has a word for each.',
        'Next time: هَذَا and ذَلِكَ.',
      ],
      say: [W('dhalika', 'ذَلِكَ', 'pointing far, slow')],
      explain: ['End on the far bird. Let the child guess what the new word might mean.'],
    },
  ],
};
