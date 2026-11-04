import type { Lesson } from '../../types';
import { lessonEKI03TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP-intermediate.md (Kids, Lesson 3: telling a
// story with وبعدين، فجأة، في الآخر; Teta's story of the monkey and her hat). Egyptian lines recorded by the owner.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });

export const lessonEKI03: Lesson = {
  subject: 'egyptian-kids-2',
  version: 'kids',
  subjectTitle: 'Egyptian Arabic · Kids · Intermediate',
  number: 3,
  title: 'Teta\'s Story',
  titleAr: 'حكاية تيتة',
  part: 'Intermediate',
  minutes: 40,
  goal: 'By the end of this lesson, you will tell a little story in Egyptian, with "and then", "suddenly" and "in the end".',
  reviewed: false,
  teacherAr: lessonEKI03TeacherAr,
  outcomes: [
    'Joins two things with وبعدين.',
    'Starts the surprise with فجأة.',
    'Ends the story with في الآخر.',
  ],
  chapters: [
    { label: 'Story time', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'Story words', page: 3 },
    { label: 'The strip', page: 6 },
    { label: 'Practice', page: 7 },
    { label: 'My mission', page: 9 },
  ],
  pages: [
    {
      title: 'Teta\'s Story',
      station: 'spark',
      layout: 'cover',
      scene: 'eki3Cover',
      lines: [],
      explain: [
        'Check the mission: what did you say at bedtime, and what did they answer? Expect هـ.',
        'Tell them: today Teta tells a story, and then it is your turn.',
      ],
    },
    {
      title: 'Story time',
      station: 'spark',
      layout: 'story',
      scene: 'eki3Sofa',
      lines: [
        'After the zoo, everyone sits on Teta\'s sofa.',
        'Teta smiles. "When I was little, I went to this zoo too."',
        'Ziad and Mariam lean in. A story!',
      ],
      explain: ['Ask: do your grandparents tell you stories? What about?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'eki3Story',
      lines: [
        'Listen. What did little Teta give the monkey?',
        'What did the monkey take?',
        'How did the story end?',
      ],
      say: [
        E('story-1', 'لما كنت صغيرة، رحت جنينة الحيوانات.', 'grandma, storytelling'),
        E('story-2', 'شفت القرد، وبعدين اديته موزة.', 'grandma, smiling'),
        E('story-3', 'وفجأة… القرد خد الطاقية بتاعتي!', 'grandma, dramatic'),
        E('story-4', 'يا خبر! وبعدين؟', 'boy, excited'),
        E('story-5', 'في الآخر… رجّعلي الطاقية، وكل الموزة!', 'grandma, laughing'),
      ],
      explain: [
        'Play twice. Ask in English: what did Teta give? (a banana). What did the monkey take? (her hat).',
        'How did it end? (he gave the hat back and ate the banana). Laugh together.',
      ],
      teacherNote: 'Input first: وبعدين، فجأة، في الآخر carry the story.',
    },
    {
      title: 'And then',
      station: 'zad',
      layout: 'concept',
      scene: 'eki3Then',
      lines: [
        'وبعدين means "and then".',
        'شفت القرد، وبعدين اديته موزة. First one thing, then the next.',
        'When you want more of a story, ask: وبعدين؟',
      ],
      vocab: [{ arabic: 'وبعدين', translit: 'wi ba\'deen', meaning: 'and then' }],
      say: [E('wbaadeen', 'شفت القرد، وبعدين اديته موزة.'), E('wbaadeen-q', 'وبعدين؟')],
      explain: ['Say a sentence; the child says وبعدين؟ Then swap.'],
    },
    {
      title: 'Suddenly!',
      station: 'zad',
      layout: 'concept',
      scene: 'eki3Sudden',
      lines: [
        'فجأة means "suddenly!"',
        'Say it slowly, with big eyes: وفجأة… القرد خد الطاقية!',
        'Everyone gasps: يا خبر!',
      ],
      vocab: [
        { arabic: 'فجأة', translit: 'fag\'a', meaning: 'suddenly' },
        { arabic: 'يا خبر!', translit: 'ya khabar!', meaning: 'oh no! / wow!' },
      ],
      say: [E('fagaa', 'وفجأة… القرد خد الطاقية!', 'dramatic'), E('ya-khabar', 'يا خبر!', 'gasp')],
      explain: ['Act it out: big eyes, a pause, then the surprise.'],
    },
    {
      title: 'In the end',
      station: 'zad',
      layout: 'concept',
      scene: 'eki3End',
      lines: [
        'في الآخر means "in the end".',
        'في الآخر رجّعلي الطاقية. The hat came back!',
        'And the banana? The monkey ate it.',
      ],
      vocab: [{ arabic: 'في الآخر', translit: 'fil-aakhir', meaning: 'in the end' }],
      say: [E('fel-akher', 'في الآخر رجّعلي الطاقية.')],
      explain: ['Ask: how did your last day out end? في الآخر…'],
    },
    {
      title: 'The story strip',
      station: 'zad',
      layout: 'concept',
      scene: 'eki3Strip',
      lines: [
        'Four pictures, three story words.',
        'Say the story along the strip: رحت… وبعدين… وفجأة… في الآخر…',
        'Now you can tell any story, like Teta!',
      ],
      say: [E('strip', 'رحت جنينة الحيوانات، وبعدين اديت القرد موزة. وفجأة خد الطاقية! في الآخر رجّعها.', 'storytelling, lively')],
      explain: ['Point at each picture and tell it together. Then the child tells it alone.'],
      teacherNote: 'The wow: three little words turn four pictures into a story.',
    },
    {
      title: 'Which word?',
      station: 'athar',
      layout: 'game',
      scene: 'eki3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Which story word fits?',
        bins: [
          { id: 'sudden', label: 'فجأة', hint: 'a surprise' },
          { id: 'end', label: 'في الآخر', hint: 'the end' },
        ],
        cards: [
          { label: '___ القطة نطّت!', bin: 'sudden', why: 'A surprise: فجأة.' },
          { label: '___ نمت.', bin: 'end', why: 'The last thing: في الآخر.' },
          { label: '___ المطر نزل!', bin: 'sudden', why: 'A surprise: فجأة.' },
          { label: '___ رجعنا البيت.', bin: 'end', why: 'The end of the day: في الآخر.' },
        ],
      },
      explain: ['Read each card aloud with the word in place.'],
    },
    {
      title: 'Your turn: tell Teta',
      station: 'athar',
      layout: 'question',
      scene: 'eki3Talk',
      lines: [
        'Now you tell Teta a story. It can be true or made up!',
        'Start with رحت… then وبعدين… then فجأة… and في الآخر…',
      ],
      say: [E('wbaadeen-2', 'وبعدين؟', 'grandma, eager')],
      interaction: { kind: 'ask', prompt: 'Did your story have all three words?', reveal: 'برافو عليك! What a story!' },
      explain: ['Ask وبعدين؟ after each sentence. Gasp at فجأة. Praise every try.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'eki3Mission',
      lines: [
        'Draw your story in four pictures, like the strip.',
        'Tell it to someone at home in Egyptian, with وبعدين، فجأة، في الآخر.',
      ],
      interaction: { kind: 'choose', prompt: 'What will your story be about?', options: ['An animal', 'A trip', 'School', 'Something funny'] },
      explain: ['Next time, bring the drawing and tell the story.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'eki3Next',
      lines: [
        'The whole family goes to the beach.',
        'رحنا البحر! "We went to the sea!"',
        'Next time: "we went" and "they went".',
      ],
      say: [E('rohna', 'رحنا البحر!', 'children, happy')],
      explain: ['End on the beach. Ask: what changed in رحنا?'],
    },
  ],
};
