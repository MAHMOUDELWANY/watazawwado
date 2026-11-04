import type { Lesson } from '../../types';
import { lessonEKA03TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP-advanced.md (Kids, Lesson 3: a short
// Egyptian joke and why it is funny: مرة… / عارفين ليه؟ / عشان…، a word with two meanings, حلوة! / بايخة!). The joke is
// a kind riddle-joke about nobody in particular. Egyptian lines recorded by the owner.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });

export const lessonEKA03: Lesson = {
  subject: 'egyptian-kids-3',
  version: 'kids',
  subjectTitle: 'Egyptian Arabic · Kids · Advanced',
  number: 3,
  title: "Ziad's Joke",
  titleAr: 'نكتة زياد',
  part: 'Advanced',
  minutes: 40,
  goal: 'By the end of this lesson, you will tell a short Egyptian joke, and know why it is funny.',
  reviewed: false,
  teacherAr: lessonEKA03TeacherAr,
  outcomes: [
    'Starts a joke with عارفين ليه…؟ and answers with عشان….',
    'Sees that يلحق has two meanings, and that is the joke.',
    'Reacts with حلوة! or بايخة!',
  ],
  chapters: [
    { label: 'A joke!', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'How a joke works', page: 3 },
    { label: 'Two meanings', page: 6 },
    { label: 'Practice', page: 7 },
    { label: 'My mission', page: 9 },
  ],
  pages: [
    {
      title: "Ziad's Joke",
      station: 'spark',
      layout: 'cover',
      scene: 'eka3Cover',
      lines: [],
      explain: [
        'Check the mission: read the note from your saying jar. What does it mean?',
        'Tell them: today Ziad tells a joke, and then you can tell it too.',
      ],
    },
    {
      title: 'Tell me a joke!',
      station: 'spark',
      layout: 'story',
      scene: 'eka3Ask',
      lines: [
        'Tante Soad is still at the door with her mango.',
        'In Egypt, everybody loves a نكتة, a joke. Grandmas, uncles, little brothers.',
        'Ziad stands up straight. He has been saving this one all week.',
      ],
      say: [E('nokta', 'قول لي نكتة يا زياد!', 'older woman, playful')],
      explain: ['Ask: do you know a joke? Tell it in English first.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'eka3Story',
      lines: [
        'Listen twice. What is the man in the joke doing?',
        'Why is he doing it? Does Adam like the joke?',
        'And Teta? Is it a good joke, or a silly one?',
      ],
      say: [
        E('story-1', 'عارفين ليه واحد بيجري حوالين السرير؟', 'little boy, cheeky'),
        E('story-2', 'ليه؟', 'little girl, curious'),
        E('story-3', 'عشان يلحق النوم!', 'little boy, proud'),
        E('story-4', 'هههه! حلوة أوي!', 'little boy, laughing'),
        E('story-5', 'بايخة… بس ضحكتني!', 'grandmother, laughing'),
      ],
      explain: [
        'Play twice. Ask in English: what is the man doing? (running around the bed). Why? (to catch sleep).',
        'Then: does Adam like it? (yes). Teta? (it is silly, but she laughed).',
      ],
      teacherNote: 'Input first: the whole joke comes before any explaining. Laugh with them even before they get it.',
    },
    {
      title: 'Do you know why…?',
      station: 'zad',
      layout: 'concept',
      scene: 'eka3Why',
      lines: [
        'Many Egyptian jokes start with a question: عارفين ليه…؟ "Do you know why…?"',
        'To one friend: عارف ليه…؟ (a boy), عارفة ليه…؟ (a girl).',
        'Then everybody asks back: ليه؟ "Why?" Now the joke is ready.',
      ],
      vocab: [
        { arabic: 'عارفين ليه؟', translit: '\'arfiin leeh?', meaning: 'do you (all) know why?' },
        { arabic: 'ليه؟', translit: 'leeh?', meaning: 'why?' },
        { arabic: 'بيجري', translit: 'biyigri', meaning: 'is running' },
      ],
      say: [E('arfeen-leh', 'عارفين ليه…؟'), E('leh', 'ليه؟')],
      explain: ['Say عارفين ليه…؟ in a mysterious voice. They answer ليه؟ every time.'],
    },
    {
      title: 'Because…',
      station: 'zad',
      layout: 'concept',
      scene: 'eka3Because',
      lines: [
        'The answer starts with عشان, "because" or "so that".',
        'عشان يلحق النوم: "so he can catch sleep".',
        'Question, ليه؟, عشان…: three pieces, one joke.',
      ],
      vocab: [
        { arabic: 'عشان', translit: '\'ashaan', meaning: 'because, so that' },
        { arabic: 'النوم', translit: 'in-noom', meaning: 'sleep' },
      ],
      say: [E('ashan', 'عشان يلحق النوم!')],
      explain: ['Ask real why-questions (why do you eat? why do you sleep?). They answer with عشان.'],
    },
    {
      title: 'Nice! Silly!',
      station: 'zad',
      layout: 'concept',
      scene: 'eka3React',
      lines: [
        'After a joke, Egyptians react out loud.',
        'حلوة! means "good one!". بايخة! means "that\'s so silly!".',
        'Even بايخة is said with a laugh. Teta: بايخة… بس ضحكتني!',
      ],
      vocab: [
        { arabic: 'حلوة!', translit: 'ḥilwa!', meaning: 'good one!' },
        { arabic: 'بايخة!', translit: 'baykha!', meaning: 'so silly! (a lame joke)' },
      ],
      say: [E('helwa', 'حلوة أوي!'), E('bayekha', 'بايخة!')],
      explain: ['Tell two jokes, one good, one very silly. They react with حلوة or بايخة.'],
    },
    {
      title: 'Two meanings',
      station: 'zad',
      layout: 'concept',
      scene: 'eka3Two',
      lines: [
        'يلحق means "to catch, to get there in time". يلحق الأتوبيس: catch the bus. You run!',
        'People also say يلحق ينام: get some sleep in time. No running at all.',
        'The joke mixes the two: he runs to "catch" sleep. That is why everyone laughs.',
      ],
      vocab: [
        { arabic: 'يلحق', translit: 'yilḥa\'', meaning: 'to catch (in time)' },
        { arabic: 'الأتوبيس', translit: 'il-otobiis', meaning: 'the bus' },
      ],
      say: [E('yel7a2-bus', 'لازم يلحق الأتوبيس!'), E('yel7a2-nom', 'عشان يلحق النوم!')],
      explain: ['Act it out: run for a bus, then "run" for sleep. Let them find the joke themselves.'],
      teacherNote: 'The wow: one word, two pictures. The bus picture slides into the bed picture, and the joke clicks.',
    },
    {
      title: 'Ask or answer?',
      station: 'athar',
      layout: 'game',
      scene: 'eka3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Is this the question part, or the answer part?',
        bins: [
          { id: 'q', label: 'question', hint: 'ليه؟' },
          { id: 'a', label: 'answer', hint: 'عشان…' },
        ],
        cards: [
          { label: 'عارفين ليه…؟', bin: 'q', why: 'It starts the joke.' },
          { label: 'عشان يلحق النوم!', bin: 'a', why: 'The answer: the funny part.' },
          { label: 'ليه؟', bin: 'q', why: 'Everybody asks why.' },
          { label: 'عشان…', bin: 'a', why: 'Answers start with عشان.' },
        ],
      },
      explain: ['After sorting, put the four cards in joke order and tell it together.'],
    },
    {
      title: 'Your turn: tell it!',
      station: 'athar',
      layout: 'question',
      scene: 'eka3Talk',
      lines: [
        'Tell Ziad\'s joke to your teacher: عارفين ليه…؟',
        'Wait for ليه؟, then the answer. Your teacher will say حلوة or بايخة!',
      ],
      say: [E('leh-t', 'ليه؟', 'teacher, curious')],
      interaction: { kind: 'ask', prompt: 'Did you wait for ليه؟ before the answer?', reveal: 'حلوة أوي! You told an Egyptian joke.' },
      explain: ['Laugh, whatever happens. Then swap: you tell it, they react.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'eka3Mission',
      lines: [
        'Tell Ziad\'s joke at home, in Egyptian.',
        'Count the laughs, and listen: did anyone say حلوة or بايخة?',
      ],
      interaction: { kind: 'choose', prompt: 'Who will you tell first?', options: ['Mum', 'Dad', 'A brother or sister', 'A friend'] },
      explain: ['Next time, they tell you who laughed most.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'eka3Next',
      lines: [
        'Tante Soad laughs so much she forgets the mango.',
        'Teta claps: let\'s have a party, with opinions, sayings and jokes!',
        'Next time: the review party at Teta\'s, with everything from this level.',
      ],
      say: [E('hafla', 'يلا نعمل حفلة!', 'grandmother, happy')],
      explain: ['End on the party. Ask: what will you bring to Teta\'s party, a saying or a joke?'],
    },
  ],
};
