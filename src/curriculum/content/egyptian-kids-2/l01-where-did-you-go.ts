import type { Lesson } from '../../types';
import { lessonEKI01TeacherAr } from './l01-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP-intermediate.md (Kids, Lesson 1: رحت /
// رحتي / راح / راحت; back at Teta's flat with Ziad and Mariam). Egyptian lines recorded by the owner.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });

export const lessonEKI01: Lesson = {
  subject: 'egyptian-kids-2',
  version: 'kids',
  subjectTitle: 'Egyptian Arabic · Kids · Intermediate',
  number: 1,
  title: 'Where Did You Go, Ziad?',
  titleAr: 'رحت فين يا زياد؟',
  part: 'Intermediate',
  minutes: 40,
  goal: 'By the end of this lesson, you will say where you went, and ask a boy or a girl where they went.',
  reviewed: false,
  teacherAr: lessonEKI01TeacherAr,
  outcomes: [
    'Says رحت + a place: رحت الجنينة.',
    'Asks a boy رحت فين؟ and a girl رحتي فين؟',
    'Says راح for a boy and راحت for a girl.',
  ],
  chapters: [
    { label: 'Home again', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'Who went?', page: 3 },
    { label: 'The song', page: 6 },
    { label: 'Practice', page: 7 },
    { label: 'My mission', page: 9 },
  ],
  pages: [
    {
      title: 'Where Did You Go, Ziad?',
      station: 'spark',
      layout: 'cover',
      scene: 'eki1Cover',
      lines: [],
      explain: [
        'Say hello in Egyptian and ask: إزيّك؟ اسمك إيه؟ A quick warm-up from Beginner.',
        'Tell them: today Teta wants to know where everyone went.',
      ],
    },
    {
      title: 'Home again',
      station: 'spark',
      layout: 'story',
      scene: 'eki1Home',
      lines: [
        'The door opens. Ziad and Mariam run in, hot and happy.',
        'Teta is waiting with lemonade. And where is Adam?',
        'Teta has one question for everybody.',
      ],
      explain: ['Ask: where do you like to go on a hot day?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'eki1Story',
      lines: [
        'Listen. Where did Ziad go?',
        'Where did Mariam go?',
        'And Adam? Why does Teta laugh?',
      ],
      say: [
        E('story-1', 'رحت فين يا زياد؟', 'grandma, warm'),
        E('story-2', 'رحت الجنينة!', 'boy, happy'),
        E('story-3', 'ومريم راحت فين؟', 'grandma'),
        E('story-4', 'أنا رحت مع زياد!', 'girl, cheerful'),
        E('story-5', 'وإنت يا آدم؟', 'grandma'),
        E('story-6', 'أنا… رحت المطبخ!', 'boy, guilty, mouth full'),
      ],
      explain: [
        'Play twice. Ask in English: where did Ziad go? (the garden). Mariam? (with Ziad).',
        'Adam? (the kitchen: he ate the basbousa). Laugh together.',
      ],
      teacherNote: 'Input first: رحت، راحت come before any rule.',
    },
    {
      title: 'I went',
      station: 'zad',
      layout: 'concept',
      scene: 'eki1Ana',
      lines: [
        'رحت means "I went".',
        'Add a place: رحت الجنينة، رحت المدرسة، رحت المطبخ.',
        'Where did you go today? رحت…',
      ],
      vocab: [
        { arabic: 'رحت', translit: 'ruḥt', meaning: 'I went' },
        { arabic: 'الجنينة', translit: 'il-gineena', meaning: 'the garden, the park' },
      ],
      say: [E('rooht', 'رحت'), E('rooht-gneena', 'رحت الجنينة.'), E('rooht-matbakh', 'رحت المطبخ.')],
      explain: ['Point to pictures of places; the child says رحت + the place.'],
    },
    {
      title: 'To a boy, to a girl',
      station: 'zad',
      layout: 'concept',
      scene: 'eki1Enti',
      lines: [
        'Ask a boy: رحت فين؟',
        'Ask a girl: رحتي فين؟ The little -i is for a girl.',
        'Like إنت and إنتي. You already know this one!',
      ],
      vocab: [{ arabic: 'رحتي فين؟', translit: 'ruḥti feen?', meaning: 'where did you go? (to a girl)' }],
      say: [E('rooht-feen', 'رحت فين؟'), E('roohti-feen', 'رحتي فين؟')],
      explain: ['Hold up a boy picture or a girl picture; the child asks the right question.'],
    },
    {
      title: 'He went, she went',
      station: 'zad',
      layout: 'concept',
      scene: 'eki1Huwa',
      lines: [
        'Ziad went: زياد راح.',
        'Mariam went: مريم راحت.',
        'A boy gets nothing at the end. A girl gets -it.',
      ],
      vocab: [
        { arabic: 'راح', translit: 'raaḥ', meaning: 'he went' },
        { arabic: 'راحت', translit: 'raaḥit', meaning: 'she went' },
      ],
      say: [E('ziad-rah', 'زياد راح.'), E('mariam-rahit', 'مريم راحت.')],
      explain: ['Move toy figures across the table: راح! راحت!'],
    },
    {
      title: 'The going song',
      station: 'zad',
      layout: 'concept',
      scene: 'eki1Song',
      lines: [
        'Clap and sing: رحت (me), رحتي (you, a girl), راح (him), راحت (her).',
        'Point at each person as you sing.',
        'Faster! Now with your eyes closed!',
      ],
      say: [E('song', 'رحت، رحتي، راح، راحت!', 'sing-song, clapping')],
      explain: ['Sing it three times, faster each time. Then let the child lead.'],
      teacherNote: 'The wow: four words, one little song, and the child can talk about yesterday.',
    },
    {
      title: 'Boy or girl?',
      station: 'athar',
      layout: 'game',
      scene: 'eki1Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Who went? A boy or a girl?',
        bins: [
          { id: 'boy', label: 'a boy', hint: 'راح' },
          { id: 'girl', label: 'a girl', hint: 'راحت' },
        ],
        cards: [
          { label: 'زياد راح الجنينة.', bin: 'boy', why: 'راح: a boy.' },
          { label: 'مريم راحت المدرسة.', bin: 'girl', why: 'راحت: a girl.' },
          { label: 'آدم راح المطبخ.', bin: 'boy', why: 'راح: a boy.' },
          { label: 'تيتة راحت السوق.', bin: 'girl', why: 'راحت: Teta is a woman.' },
        ],
      },
      explain: ['Read each card aloud together before sorting.'],
    },
    {
      title: 'Your turn: Teta asks',
      station: 'athar',
      layout: 'question',
      scene: 'eki1Talk',
      lines: [
        'Your teacher is Teta: رحت فين النهارده؟ or رحتي فين النهارده؟',
        'Answer: رحت… Then ask your teacher back!',
      ],
      say: [E('rooht-feen-naharda', 'رحت فين النهارده؟', 'grandma, warm'), E('roohti-feen-naharda', 'رحتي فين النهارده؟', 'grandma, to a girl')],
      interaction: { kind: 'ask', prompt: 'Did you say رحت, and ask back with the right ending?', reveal: 'برافو عليك! Teta is proud.' },
      explain: ['Play Teta warmly. Praise every try.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'eki1Mission',
      lines: [
        'At dinner tonight, ask someone at home: رحت فين النهارده؟ or رحتي فين النهارده؟',
        'Tell them where you went too: رحت…',
      ],
      interaction: { kind: 'choose', prompt: 'Who will you ask?', options: ['Mum', 'Dad', 'My brother or sister', 'Grandma or Grandpa'] },
      explain: ['Next time, ask: who did you ask, and where did they go?'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'eki1Next',
      lines: [
        'Teta has a surprise.',
        'بكرة هنروح جنينة الحيوانات! Tomorrow, the zoo!',
        'Next time: how to talk about tomorrow.',
      ],
      say: [E('bokra-zoo', 'بكرة هنروح جنينة الحيوانات!', 'grandma, excited')],
      explain: ['End on the surprise. Ask: which animal do you want to see?'],
    },
  ],
};
