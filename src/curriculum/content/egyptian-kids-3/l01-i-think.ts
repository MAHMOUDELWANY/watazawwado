import type { Lesson } from '../../types';
import { lessonEKA01TeacherAr } from './l01-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP-advanced.md (Kids, Lesson 1: opinions with
// أنا شايف / أنا شايفة، أنا كمان، لأ أنا…؛ Teta and the ice-cream cart). Egyptian lines recorded by the owner.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });

export const lessonEKA01: Lesson = {
  subject: 'egyptian-kids-3',
  version: 'kids',
  subjectTitle: 'Egyptian Arabic · Kids · Advanced',
  number: 1,
  title: 'I Think…',
  titleAr: 'أنا شايف…',
  part: 'Advanced',
  minutes: 40,
  goal: 'By the end of this lesson, you will say what you think in Egyptian, and agree or not with a friend, nicely.',
  reviewed: false,
  teacherAr: lessonEKA01TeacherAr,
  outcomes: [
    'Says أنا شايف إن… (a boy) or أنا شايفة إن… (a girl).',
    'Agrees with أنا كمان!',
    'Says a different opinion kindly: لأ، أنا شايف…',
  ],
  chapters: [
    { label: 'Ice cream', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'I think', page: 3 },
    { label: 'Every cone', page: 6 },
    { label: 'Practice', page: 7 },
    { label: 'My mission', page: 9 },
  ],
  pages: [
    {
      title: 'I Think…',
      station: 'spark',
      layout: 'cover',
      scene: 'eka1Cover',
      lines: [],
      explain: [
        'Welcome them to Advanced! Ask in Egyptian: بتحب الآيس كريم؟',
        'Tell them: today everybody gets to say what they think.',
      ],
    },
    {
      title: 'The ice-cream cart',
      station: 'spark',
      layout: 'story',
      scene: 'eka1Cart',
      lines: [
        'A hot afternoon. An ice-cream cart stops outside Teta\'s house.',
        'Chocolate, strawberry, mango. Teta says: one scoop each!',
        'But which flavour is the best? Everybody has an answer.',
      ],
      explain: ['Ask: what is your favourite ice cream? Let them answer in English for now.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'eka1Story',
      lines: [
        'Listen twice. Which flavour does Ziad like best?',
        'And Mariam? Who agrees with Mariam?',
        'What does Teta say at the end?',
      ],
      say: [
        E('story-1', 'أنا شايف إن الشوكولاتة أحلى حاجة!', 'little boy, excited'),
        E('story-2', 'لأ، أنا شايفة إن المانجا أحلى!', 'little girl, sure'),
        E('story-3', 'أنا كمان! المانجا!', 'little boy, happy'),
        E('story-4', 'كل واحد ورأيه، يا حبايبي.', 'grandmother, warm, smiling'),
      ],
      explain: [
        'Play twice. Ask in English: Ziad? (chocolate). Mariam? (mango). Who agrees with her? (Adam).',
        'Then: what does Teta say? (everyone has their own opinion).',
      ],
      teacherNote: 'Input first: شايف، شايفة، أنا كمان all come in the story before any rule.',
    },
    {
      title: 'I think (a boy)',
      station: 'zad',
      layout: 'concept',
      scene: 'eka1Shayef',
      lines: [
        'أنا شايف إن… means "I think that…". Word for word: "I see that…".',
        'Ziad: أنا شايف إن الشوكولاتة أحلى!',
        'A boy says شايف.',
      ],
      vocab: [
        { arabic: 'أنا شايف إن', translit: 'ana shaayif inn', meaning: 'I think that (a boy)' },
        { arabic: 'أحلى', translit: 'aḥla', meaning: 'nicer, the best' },
      ],
      say: [E('shayef', 'أنا شايف إن الشوكولاتة أحلى!')],
      explain: ['Show three pictures (two pets, two games). A boy says أنا شايف إن… أحلى.'],
    },
    {
      title: 'I think (a girl)',
      station: 'zad',
      layout: 'concept',
      scene: 'eka1Shayfa',
      lines: [
        'A girl adds -a: أنا شايفة إن….',
        'Mariam: أنا شايفة إن المانجا أحلى!',
        'شايف for a boy, شايفة for a girl. Listen to the end of the word and you know who is talking.',
      ],
      vocab: [{ arabic: 'أنا شايفة إن', translit: 'ana shayfa inn', meaning: 'I think that (a girl)' }],
      say: [E('shayfa', 'أنا شايفة إن المانجا أحلى!')],
      explain: ['Say a name; they say شايف or شايفة for that child.'],
    },
    {
      title: 'Me too! No, I…',
      station: 'zad',
      layout: 'concept',
      scene: 'eka1Too',
      lines: [
        'Agree? Say أنا كمان! "Me too!"',
        'Think something else? Say لأ، أنا شايف… and give yours.',
        'No shouting, no "you\'re wrong". Just your own flavour.',
      ],
      vocab: [
        { arabic: 'أنا كمان', translit: 'ana kamaan', meaning: 'me too' },
        { arabic: 'لأ، أنا…', translit: 'la\', ana…', meaning: 'no, I…' },
      ],
      say: [E('kaman', 'أنا كمان!'), E('la-ana', 'لأ، أنا شايف إن الفراولة أحلى.')],
      explain: ['Say an opinion. They answer أنا كمان, or لأ، أنا شايف/شايفة….'],
    },
    {
      title: 'Every cone is right',
      station: 'zad',
      layout: 'concept',
      scene: 'eka1Cones',
      lines: [
        'Three children, three cones, three opinions.',
        'Teta: كل واحد ورأيه, "everyone has their own opinion".',
        'Nobody is wrong about ice cream. You just say what you think.',
      ],
      say: [E('kol-wahed', 'كل واحد ورأيه.', 'grandmother, warm')],
      explain: ['Ask: what is something your family never agrees on? Food, a film, a game?'],
      teacherNote: 'The wow: each opinion drops a scoop on its own cone; three different towers, and all of them fine.',
    },
    {
      title: 'Boy or girl?',
      station: 'athar',
      layout: 'game',
      scene: 'eka1Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Who is talking, a boy or a girl?',
        bins: [
          { id: 'boy', label: 'a boy', hint: 'شايف' },
          { id: 'girl', label: 'a girl', hint: 'شايفة' },
        ],
        cards: [
          { label: 'أنا شايف إن القطط حلوة.', bin: 'boy', why: 'شايف: a boy.' },
          { label: 'أنا شايفة إن الكورة حلوة.', bin: 'girl', why: 'شايفة: a girl.' },
          { label: 'أنا شايفة إن البحر أحلى.', bin: 'girl', why: 'شايفة: a girl.' },
          { label: 'أنا شايف إن البيتزا أحلى.', bin: 'boy', why: 'شايف: a boy.' },
        ],
      },
      explain: ['Read each card aloud. Ask: and what do you think?'],
    },
    {
      title: 'Your turn: which is best?',
      station: 'athar',
      layout: 'question',
      scene: 'eka1Talk',
      lines: [
        'Your teacher asks: إيه أحلى لون؟ إيه أحلى حيوان؟',
        'Answer with أنا شايف إن or أنا شايفة إن. Then ask back: وإنت؟ (or وإنتي؟)',
      ],
      say: [E('ahla-lon', 'إيه أحلى لون؟', 'teacher, friendly')],
      interaction: { kind: 'ask', prompt: 'Did you say شايف or شايفة the right way?', reveal: 'برافو! Everyone has their own opinion, and now you can say yours.' },
      explain: ['Three questions. Always ask their opinion back after you give yours.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'eka1Mission',
      lines: [
        'At dinner, ask your family: إيه أحلى أكلة؟',
        'Then say yours: أنا شايف إن… or أنا شايفة إن….',
      ],
      interaction: { kind: 'choose', prompt: 'Who will you ask first?', options: ['Mum', 'Dad', 'A brother or sister', 'Grandma or Grandpa'] },
      explain: ['Next time, they tell you what everyone answered.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'eka1Next',
      lines: [
        'Mango drips on Ziad\'s shirt. Everyone laughs.',
        'Teta wipes it and laughs: على مهلك يا زياد! "Slowly, Ziad!" Then she smiles: she has a saying for this.',
        'Next time: Teta\'s sayings, the little sentences grandmas always say.',
      ],
      say: [E('teta-joke', 'على مهلك يا زياد!', 'grandmother, laughing')],
      explain: ['End on Teta. Ask: does your grandma have a sentence she always says?'],
    },
  ],
};
