import type { Lesson } from '../../types';
import { lessonEKI02TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP-intermediate.md (Kids, Lesson 2: the future
// with هـ: هشوف، هتشوف، هتشوفي، هيشوف؛ the night before the zoo). Egyptian lines recorded by the owner.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });

export const lessonEKI02: Lesson = {
  subject: 'egyptian-kids-2',
  version: 'kids',
  subjectTitle: 'Egyptian Arabic · Kids · Intermediate',
  number: 2,
  title: 'Tomorrow We\'ll Go to the Zoo',
  titleAr: 'بكرة هنروح جنينة الحيوانات',
  part: 'Intermediate',
  minutes: 40,
  goal: 'By the end of this lesson, you will say what you will do tomorrow, and ask a friend what they will do.',
  reviewed: false,
  teacherAr: lessonEKI02TeacherAr,
  outcomes: [
    'Says هشوف + an animal: هشوف الأسد.',
    'Asks a boy هتشوف إيه؟ and a girl هتشوفي إيه؟',
    'Hears the هـ that means tomorrow.',
  ],
  chapters: [
    { label: 'Bedtime', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'Tomorrow', page: 3 },
    { label: 'The zoo game', page: 6 },
    { label: 'Practice', page: 7 },
    { label: 'My mission', page: 9 },
  ],
  pages: [
    {
      title: 'Tomorrow We\'ll Go to the Zoo',
      station: 'spark',
      layout: 'cover',
      scene: 'eki2Cover',
      lines: [],
      explain: [
        'Check the mission: who did you ask, and where did they go? Expect راح / راحت.',
        'Tell them: today is about tomorrow.',
      ],
    },
    {
      title: 'Bedtime',
      station: 'spark',
      layout: 'story',
      scene: 'eki2Bed',
      lines: [
        'It is bedtime at Teta\'s, but nobody can sleep.',
        'Tomorrow is the zoo!',
        'Everyone is thinking about one animal.',
      ],
      explain: ['Ask: what is your favourite animal? Teach its Egyptian name if they want.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'eki2Story',
      lines: [
        'Listen. What will Ziad see?',
        'What will Mariam see?',
        'And Adam? Why does everyone laugh?',
      ],
      say: [
        E('story-1', 'بكرة هنروح جنينة الحيوانات!', 'grandma, excited'),
        E('story-2', 'هشوف الأسد!', 'boy, roaring'),
        E('story-3', 'وأنا هشوف الزرافة!', 'girl, stretching up'),
        E('story-4', 'وآدم هيشوف إيه؟', 'grandma'),
        E('story-5', 'أنا… هاكل آيس كريم!', 'boy, dreamy'),
      ],
      explain: [
        'Play twice. Ask in English: Ziad? (the lion). Mariam? (the giraffe).',
        'Adam? (he will eat ice cream!). Laugh together.',
      ],
      teacherNote: 'Input first: هشوف، هيشوف، هاكل before any rule.',
    },
    {
      title: 'I will see',
      station: 'zad',
      layout: 'concept',
      scene: 'eki2Ana',
      lines: [
        'هشوف means "I will see". The هـ at the start means tomorrow.',
        'Every day is بشوف. Tomorrow is هشوف.',
        'هشوف الأسد! هشوف الزرافة! What will you see?',
      ],
      vocab: [
        { arabic: 'هشوف', translit: 'hashuuf', meaning: 'I will see' },
        { arabic: 'الأسد', translit: 'il-asad', meaning: 'the lion' },
        { arabic: 'الزرافة', translit: 'iz-zaraafa', meaning: 'the giraffe' },
      ],
      say: [E('hashoof', 'هشوف'), E('hashoof-asad', 'هشوف الأسد!'), E('hashoof-zarafa', 'هشوف الزرافة!')],
      explain: ['Show animal pictures; the child says هشوف + the animal.'],
    },
    {
      title: 'Ask a friend',
      station: 'zad',
      layout: 'concept',
      scene: 'eki2Enti',
      lines: [
        'Ask a boy: هتشوف إيه؟',
        'Ask a girl: هتشوفي إيه؟ The little -i again!',
        'Then answer: هشوف…',
      ],
      vocab: [
        { arabic: 'هتشوف إيه؟', translit: 'hatshuuf eh?', meaning: 'what will you see? (to a boy)' },
        { arabic: 'هتشوفي إيه؟', translit: 'hatshuufi eh?', meaning: 'what will you see? (to a girl)' },
      ],
      say: [E('hatshoof', 'هتشوف إيه؟'), E('hatshoofi', 'هتشوفي إيه؟')],
      explain: ['Boy picture or girl picture: the child asks the right question.'],
    },
    {
      title: 'He will, she will',
      station: 'zad',
      layout: 'concept',
      scene: 'eki2Huwa',
      lines: [
        'Ziad will see: زياد هيشوف الأسد.',
        'Mariam will see: مريم هتشوف الزرافة.',
        'هيـ for a boy, هتـ for a girl.',
      ],
      vocab: [
        { arabic: 'هيشوف', translit: 'hayshuuf', meaning: 'he will see' },
        { arabic: 'هتشوف', translit: 'hatshuuf', meaning: 'she will see' },
      ],
      say: [E('ziad-hayshoof', 'زياد هيشوف الأسد.'), E('mariam-hatshoof', 'مريم هتشوف الزرافة.')],
      explain: ['Move toy animals: هيشوف! هتشوف!'],
    },
    {
      title: 'The zoo game',
      station: 'zad',
      layout: 'concept',
      scene: 'eki2Game',
      lines: [
        'Play with your teacher: say هشوف and one animal.',
        'Your teacher repeats it and adds one: هشوف الأسد والزرافة!',
        'Keep going. How long can the zoo get?',
      ],
      say: [E('game', 'هشوف الأسد، والزرافة، والفيل!', 'playful, counting')],
      explain: ['A memory chain game. Add فيل (elephant), قرد (monkey), بطة (duck) as needed.'],
      teacherNote: 'The wow: a whole sentence about tomorrow, and it keeps growing.',
    },
    {
      title: 'Yesterday or tomorrow?',
      station: 'athar',
      layout: 'game',
      scene: 'eki2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Did it happen yesterday, or will it happen tomorrow?',
        bins: [
          { id: 'past', label: 'yesterday', hint: 'رحت' },
          { id: 'future', label: 'tomorrow', hint: 'هـ' },
        ],
        cards: [
          { label: 'هشوف الأسد.', bin: 'future', why: 'هـ: tomorrow.' },
          { label: 'رحت الجنينة.', bin: 'past', why: 'رحت: yesterday.' },
          { label: 'مريم هتشوف الزرافة.', bin: 'future', why: 'هـ: tomorrow.' },
          { label: 'زياد راح المدرسة.', bin: 'past', why: 'راح: yesterday.' },
        ],
      },
      explain: ['Read each card aloud together first.'],
    },
    {
      title: 'Your turn: Teta asks',
      station: 'athar',
      layout: 'question',
      scene: 'eki2Talk',
      lines: [
        'Your teacher is Teta: هتشوف إيه بكرة؟ or هتشوفي إيه بكرة؟',
        'Answer: هشوف… Then ask Teta back!',
      ],
      say: [E('hatshoof-bokra', 'هتشوف إيه بكرة؟', 'grandma, warm'), E('hatshoofi-bokra', 'هتشوفي إيه بكرة؟', 'grandma, to a girl')],
      interaction: { kind: 'ask', prompt: 'Did you start with هـ?', reveal: 'برافو عليك! Ready for the zoo.' },
      explain: ['Praise every هـ.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'eki2Mission',
      lines: [
        'At bedtime tonight, tell someone at home one thing you will do tomorrow: بكرة هـ…',
        'Then ask them: هتعمل إيه بكرة؟',
      ],
      interaction: { kind: 'choose', prompt: 'Who will you tell?', options: ['Mum', 'Dad', 'My brother or sister', 'My teddy'] },
      explain: ['Next time, ask: what did you say, and what did they answer?'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'eki2Next',
      lines: [
        'After the zoo, Teta tells a story about when she was little.',
        'She went to the same zoo… and then something funny happened.',
        'Next time: Teta\'s story, with وبعدين.',
      ],
      say: [E('teta-story', 'لما كنت صغيرة… رحت نفس الجنينة. وبعدين…', 'grandma, storytelling')],
      explain: ['End on Teta\'s story. Ask: what do you think happened?'],
    },
  ],
};
