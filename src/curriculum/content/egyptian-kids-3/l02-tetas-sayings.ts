import type { Lesson } from '../../types';
import { lessonEKA02TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP-advanced.md (Kids, Lesson 2: two or three
// kind sayings at Teta's). Taught as the people's sayings, never as religious text. Egyptian lines recorded by the owner.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });

export const lessonEKA02: Lesson = {
  subject: 'egyptian-kids-3',
  version: 'kids',
  subjectTitle: 'Egyptian Arabic · Kids · Advanced',
  number: 2,
  title: "Teta's Sayings",
  titleAr: 'أمثال تيتة',
  part: 'Advanced',
  minutes: 40,
  goal: 'By the end of this lesson, you will understand three sayings Teta always uses, and say one at the right time.',
  reviewed: false,
  teacherAr: lessonEKA02TeacherAr,
  outcomes: [
    'Understands في التأني السلامة (slow is safe).',
    'Understands إيد لوحدها ما تسقفش (we do it together).',
    'Understands الجار قبل الدار (neighbours matter).',
  ],
  chapters: [
    { label: "Teta's jar", page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'Three sayings', page: 3 },
    { label: 'The jar', page: 6 },
    { label: 'Practice', page: 7 },
    { label: 'My mission', page: 9 },
  ],
  pages: [
    {
      title: "Teta's Sayings",
      station: 'spark',
      layout: 'cover',
      scene: 'eka2Cover',
      lines: [],
      explain: [
        'Check the mission: what is the best food at home? Who said what?',
        'Tell them: today Teta opens her jar of sayings.',
      ],
    },
    {
      title: "Teta's jar",
      station: 'spark',
      layout: 'story',
      scene: 'eka2Jar',
      lines: [
        'After the ice cream, Teta takes down an old glass jar.',
        'Inside are little paper notes. On each one, a saying her own Teta used to say.',
        'A saying is a short sentence that people have said for a very long time.',
      ],
      explain: ['Ask: does someone in your family say the same little sentence again and again?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'eka2Story',
      lines: [
        'Listen twice. Ziad runs and drops his cone. What does Teta say?',
        'The room is a mess. What does Teta say now?',
        'Who gets the last of the mango?',
      ],
      say: [
        E('story-1', 'على مهلك يا زياد! في التأني السلامة.', 'grandmother, gentle'),
        E('story-2', 'يا تيتة، الأوضة كركبة!', 'little girl, upset'),
        E('story-3', 'إيد لوحدها ما تسقفش. يلا كلنا مع بعض!', 'grandmother, cheerful'),
        E('story-4', 'خدوا المانجا دي لطنط سعاد. الجار قبل الدار.', 'grandmother, warm'),
      ],
      explain: [
        'Play twice. Ask in English: what does Teta say when Ziad runs? (slow down). The mess? (let\'s all do it together).',
        'Then: who gets the mango? (Tante Soad, the neighbour).',
      ],
      teacherNote: 'Input first: the three sayings come in the story before any meaning. Let them guess from what happens.',
    },
    {
      title: 'Slow is safe',
      station: 'zad',
      layout: 'concept',
      scene: 'eka2Slow',
      lines: [
        'في التأني السلامة: "in going slowly, there is safety".',
        'Ziad ran, and the ice cream fell. The turtle walks slowly, and gets there.',
        'Teta says it when you rush: homework, stairs, ice cream.',
      ],
      vocab: [
        { arabic: 'في التأني السلامة', translit: 'fit-ta\'anni is-salaama', meaning: 'slow and careful is safe' },
        { arabic: 'على مهلك', translit: '\'ala mahlak', meaning: 'slowly! take your time' },
      ],
      say: [E('taanni', 'في التأني السلامة.'), E('ala-mahlak', 'على مهلك!')],
      explain: ['Walk a toy fast and it falls; walk it slowly and it arrives. They say the saying.'],
    },
    {
      title: 'Together',
      station: 'zad',
      layout: 'concept',
      scene: 'eka2Clap',
      lines: [
        'إيد لوحدها ما تسقفش: "one hand alone can\'t clap".',
        'Try it! One hand: no sound. Two hands: clap!',
        'The messy room is quick when everyone helps.',
      ],
      vocab: [
        { arabic: 'إيد', translit: 'iid', meaning: 'hand' },
        { arabic: 'ما تسقفش', translit: 'ma tsa\'\'afsh', meaning: 'can\'t clap' },
      ],
      say: [E('eed', 'إيد لوحدها ما تسقفش.')],
      explain: ['Clap with one hand, then two. Let them say the saying first.'],
    },
    {
      title: 'Neighbours first',
      station: 'zad',
      layout: 'concept',
      scene: 'eka2Jaar',
      lines: [
        'الجار قبل الدار: "the neighbour before the house".',
        'A nice house is good. A kind neighbour is better.',
        'So Teta always shares with Tante Soad next door.',
      ],
      vocab: [
        { arabic: 'الجار', translit: 'il-gaar', meaning: 'the neighbour' },
        { arabic: 'الدار', translit: 'id-daar', meaning: 'the house, the home' },
      ],
      say: [E('gaar', 'الجار قبل الدار.')],
      explain: ['Ask: who are your neighbours? What could you share with them?'],
    },
    {
      title: "Teta's jar",
      station: 'zad',
      layout: 'concept',
      scene: 'eka2Notes',
      lines: [
        'Three notes come out of the jar, and three things happen at home.',
        'Running on the stairs · a messy room · fresh mango.',
        'Each note flies to its moment. Now you know when Teta will say each one.',
      ],
      say: [E('three', 'في التأني السلامة. إيد لوحدها ما تسقفش. الجار قبل الدار.')],
      explain: ['Point to each moment. They say the saying before the note lands.'],
      teacherNote: 'The wow: the notes fly from the jar to the right moment. A saying is a key for a moment.',
    },
    {
      title: 'Which saying?',
      station: 'athar',
      layout: 'game',
      scene: 'eka2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'What would Teta say?',
        bins: [
          { id: 'slow', label: 'في التأني السلامة', hint: 'slowly!' },
          { id: 'eed', label: 'إيد لوحدها…', hint: 'together' },
          { id: 'gaar', label: 'الجار قبل الدار', hint: 'neighbours' },
        ],
        cards: [
          { label: 'Ziad runs down the stairs.', bin: 'slow', why: 'Slow is safe.' },
          { label: 'Five toys to tidy, three children.', bin: 'eed', why: 'Everyone helps.' },
          { label: 'Teta made too many cookies.', bin: 'gaar', why: 'Share with the neighbour.' },
          { label: 'Mariam writes her homework too fast.', bin: 'slow', why: 'Slowly is better.' },
          { label: 'Carrying a big box together.', bin: 'eed', why: 'Two hands to clap.' },
          { label: 'Tante Soad is sick today.', bin: 'gaar', why: 'Neighbours look after each other.' },
        ],
      },
      explain: ['Read each moment like a little story. Ask them to say the saying aloud.'],
    },
    {
      title: 'Your turn: be Teta',
      station: 'athar',
      layout: 'question',
      scene: 'eka2Talk',
      lines: [
        'Your teacher tells you a little moment. You are Teta now!',
        'Answer with the right saying, in your best Teta voice.',
      ],
      say: [E('rushing', 'أنا بجري على السلم!', 'little boy, rushing')],
      interaction: { kind: 'ask', prompt: 'Did each saying fit the moment?', reveal: 'برافو يا تيتة الصغيرة! You know Teta\'s jar now.' },
      explain: ['Three moments. Laugh at the Teta voice; it helps them remember.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'eka2Mission',
      lines: [
        'Ask a grandparent or a parent: what saying do you always say?',
        'Write it on a little paper note, and start your own jar.',
      ],
      interaction: { kind: 'choose', prompt: 'Who will you ask?', options: ['Grandma', 'Grandpa', 'Mum', 'Dad'] },
      explain: ['Next time, they read the note from their jar and explain it.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'eka2Next',
      lines: [
        'Tante Soad loves the mango. She laughs and says: Ziad, tell me a joke!',
        'Ziad stands up: عارفين ليه…؟ "Do you know why…?"',
        'Next time: Ziad\'s joke, and why everybody laughs.',
      ],
      say: [E('arfeen', 'عارفين ليه…؟', 'little boy, cheeky')],
      explain: ['End on Ziad. Ask: do you know a joke?'],
    },
  ],
};
