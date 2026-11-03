import type { Lesson } from '../../types';
import { lessonEK03TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP.md (Kids: summer at Teta's; Lesson 3 =
// إيه ده؟ / إيه دي؟, ده and دي, the ـة tell). Every Arabic line plays on tap in the Mahmoud Egyptian clone.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });

export const lessonEK03: Lesson = {
  subject: 'egyptian-kids',
  version: 'kids',
  subjectTitle: 'Egyptian Arabic · Kids',
  number: 3,
  title: 'Teta\'s Old Box',
  titleAr: 'إيه ده؟',
  part: 'Beginner',
  minutes: 40,
  goal: 'By the end of this lesson, you will ask "what is this?" and name six things, with ده or دي.',
  reviewed: false,
  teacherAr: lessonEK03TeacherAr,
  outcomes: [
    'Asks إيه ده؟ and إيه دي؟',
    'Says ده for most things and دي for words that end in ـة.',
    'Names six things from Teta\'s box.',
  ],
  chapters: [
    { label: 'The box', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'ده and دي', page: 3 },
    { label: 'In the box', page: 5 },
    { label: 'Practice', page: 6 },
    { label: 'My mission', page: 8 },
  ],
  pages: [
    {
      title: 'Teta\'s Old Box',
      station: 'spark',
      layout: 'cover',
      scene: 'ek3Cover',
      lines: [],
      explain: [
        'Ask the child: إنت منين؟ / إنتي منين؟ and wait for أنا من...',
        'Ask about the mission: who did they ask, and what did that person answer?',
      ],
    },
    {
      title: 'The big box',
      station: 'spark',
      layout: 'story',
      scene: 'ek3Box',
      lines: [
        'Teta brings a big old box from her room.',
        'She opens it. Adam points inside: إيه ده؟',
        'إيه means "what". What does ده mean?',
      ],
      say: [E('eh-da', 'إيه ده؟', 'curious boy')],
      explain: ['Let the child guess ده from the pointing finger.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'ek3Listen',
      lines: [
        'Listen twice. What is in the box?',
        'Mariam finds something too. Does she ask the same way?',
        'And what does Ziad find at the bottom?',
      ],
      say: [
        E('l-1', 'إيه ده يا تيتة؟', 'curious boy'),
        E('l-2', 'ده كتاب قديم.', 'warm grandma'),
        E('l-3', 'وإيه دي؟', 'curious girl'),
        E('l-4', 'دي صورة بابا وهو صغير!', 'warm grandma, laughing'),
        E('l-5', 'ودي كورة!', 'excited boy'),
      ],
      explain: [
        'Play the scene twice. Ask in English: what is in the box? (a book, a photo, a ball).',
        'Children love the photo of Dad as a little boy. Ask: who is in the photo?',
      ],
    },
    {
      title: 'ده and دي',
      station: 'zad',
      layout: 'concept',
      scene: 'ek3DaDi',
      lines: [
        'ده and دي both mean "this".',
        'Some words are boys: ده كتاب. Some words are girls: دي صورة.',
      ],
      vocab: [
        { arabic: 'ده', translit: 'da', meaning: 'this (a boy word)' },
        { arabic: 'دي', translit: 'di', meaning: 'this (a girl word)' },
        { arabic: 'إيه ده؟', translit: 'ēh da?', meaning: 'what is this?' },
      ],
      say: [E('da', 'ده'), E('di', 'دي'), E('da-kitab', 'ده كتاب.'), E('di-sura', 'دي صورة.')],
      explain: ['Play the clips and let the child point: boy word or girl word?'],
    },
    {
      title: 'The ـة tail',
      station: 'zad',
      layout: 'concept',
      scene: 'ek3Ta',
      lines: [
        'Look at the end of the word. Does it have a little round tail, ـة?',
        'ـة means a girl word: دي صورة، دي كورة.',
        'No tail? Usually ده: ده كتاب، ده قلم.',
      ],
      vocab: [
        { arabic: 'صورة', translit: 'ṣūra', meaning: 'photo, picture' },
        { arabic: 'كورة', translit: 'kōra', meaning: 'ball' },
        { arabic: 'كتاب', translit: 'kitāb', meaning: 'book' },
        { arabic: 'قلم', translit: 'alam', meaning: 'pen' },
      ],
      say: [E('di-sura', 'دي صورة.'), E('di-kora', 'دي كورة.'), E('da-kitab', 'ده كتاب.'), E('da-alam', 'ده قلم.')],
      explain: ['Draw ـة on paper. Every time the child sees it in a word, they shout دي!'],
    },
    {
      title: 'What\'s in the box?',
      station: 'zad',
      layout: 'concept',
      scene: 'ek3Things',
      lines: [
        'Six things come out of Teta\'s box.',
        'Tap each one. Say ده or دي before you hear it!',
      ],
      items: ['ده كتاب', 'ده قلم', 'ده مفتاح', 'دي صورة', 'دي كورة', 'دي عروسة'],
      vocab: [
        { arabic: 'مفتاح', translit: 'muftāḥ', meaning: 'key' },
        { arabic: 'عروسة', translit: '‘arūsa', meaning: 'doll' },
      ],
      say: [E('da-kitab', 'ده كتاب.'), E('da-alam', 'ده قلم.'), E('da-muftah', 'ده مفتاح.'), E('di-sura', 'دي صورة.'), E('di-kora', 'دي كورة.'), E('di-arusa', 'دي عروسة.')],
      explain: ['Bring real things if you can: a book, a pen, a key, a ball. The child holds each one and names it.'],
    },
    {
      title: 'ده or دي?',
      station: 'athar',
      layout: 'game',
      scene: 'ek3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Help Teta tidy the box. ده or دي?',
        bins: [
          { id: 'da', label: 'ده', hint: 'a boy word' },
          { id: 'di', label: 'دي', hint: 'a girl word' },
        ],
        cards: [
          { label: 'كتاب (book)', bin: 'da', why: 'No tail: ده كتاب.' },
          { label: 'صورة (photo)', bin: 'di', why: 'A ـة tail: دي صورة.' },
          { label: 'قلم (pen)', bin: 'da', why: 'No tail: ده قلم.' },
          { label: 'كورة (ball)', bin: 'di', why: 'A ـة tail: دي كورة.' },
          { label: 'مفتاح (key)', bin: 'da', why: 'No tail: ده مفتاح.' },
          { label: 'عروسة (doll)', bin: 'di', why: 'A ـة tail: دي عروسة.' },
        ],
      },
      explain: ['Let the child say the full sentence each time. The result goes into your report.'],
    },
    {
      title: 'Play: the mystery bag',
      station: 'athar',
      layout: 'question',
      scene: 'ek3Talk',
      lines: ['Your teacher hides things in a bag.', 'Pull one out and ask: إيه ده؟ Then answer: ده... or دي...'],
      say: [E('eh-da', 'إيه ده؟', 'curious boy'), E('eh-di', 'إيه دي؟', 'curious girl')],
      interaction: { kind: 'ask', prompt: 'Play five rounds. Then swap: you hide, your teacher guesses.', reveal: 'برافو! You can ask about anything now.' },
      explain: ['Use a real bag or a box on camera. Keep the surprise.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'ek3Mission',
      lines: ['Find three things at home. Show them to someone and say: ده... or دي...', 'Can you find one with a ـة tail?'],
      interaction: { kind: 'choose', prompt: 'Where will you look?', options: ['My toy box', 'My school bag', 'The kitchen', 'My room'] },
      explain: ['Next time, ask the child to show one of the three things on camera.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'ek3Next',
      lines: ['Next morning, Ziad cannot find his ball anywhere!', 'He shouts: فين الكورة؟', 'Next time: where is it? and whose is it?'],
      say: [E('fen-ilkora', 'فين الكورة؟', 'worried boy')],
      explain: ['End on the hunt. Where could the ball be?'],
    },
  ],
};
