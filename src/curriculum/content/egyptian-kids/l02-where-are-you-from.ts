import type { Lesson } from '../../types';
import { lessonEK02TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP.md (Kids: summer at Teta's; Lesson 2 =
// منين؟ أنا من... and ـي / ـية). Every Arabic line plays on tap in the Mahmoud Egyptian clone.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });

export const lessonEK02: Lesson = {
  subject: 'egyptian-kids',
  version: 'kids',
  subjectTitle: 'Egyptian Arabic · Kids',
  number: 2,
  title: 'Where Are You From?',
  titleAr: 'إنت منين؟',
  part: 'Beginner',
  minutes: 40,
  goal: 'By the end of this lesson, you will say where you are from, ask your friends, and say "Egyptian" for a boy and a girl.',
  reviewed: false,
  teacherAr: lessonEK02TeacherAr,
  outcomes: [
    'Asks إنت منين؟ to a boy and إنتي منين؟ to a girl.',
    'Answers أنا من... with a country.',
    'Says مصري for a boy and مصرية for a girl.',
  ],
  chapters: [
    { label: 'The question', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'From where', page: 3 },
    { label: 'Boy or girl', page: 5 },
    { label: 'Practice', page: 6 },
    { label: 'My mission', page: 8 },
  ],
  pages: [
    {
      title: 'Where Are You From?',
      station: 'spark',
      layout: 'cover',
      scene: 'ek2Cover',
      lines: [],
      explain: [
        'Say أهلاً! and wait for أهلاً بيك / بيكي. Ask about the mission: who did the child say hello to?',
        'Tell them: today Mariam asks Adam her question.',
      ],
    },
    {
      title: 'Mariam\'s question',
      station: 'spark',
      layout: 'story',
      scene: 'ek2Question',
      lines: [
        'At breakfast, Mariam looks at Adam.',
        'She asks: إنت منين؟',
        'Adam does not know the word yet. Do you?',
      ],
      say: [E('inta-minen', 'إنت منين؟', 'curious girl')],
      explain: ['Let the child guess. Many find فين (where) from the end of منين.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'ek2Listen',
      lines: [
        'Listen twice. Who is from where?',
        'Adam answers, then he asks Mariam back.',
        'And Ziad does not want to be left out!',
      ],
      say: [
        E('d-1', 'إنت منين يا آدم؟', 'curious girl'),
        E('d-2', 'أنا من إنجلترا. وإنتي؟', 'proud boy'),
        E('d-3', 'أنا من مصر!', 'happy girl'),
        E('d-4', 'وأنا كمان من مصر!', 'loud, excited boy'),
      ],
      explain: [
        'Play the whole scene twice. Then ask in English: where is Adam from? And Mariam and Ziad?',
        'كمان means "too". Ziad says: me too!',
      ],
    },
    {
      title: 'From + where',
      station: 'zad',
      layout: 'concept',
      scene: 'ek2Minen',
      lines: [
        'من means from. فين means where.',
        'Put them together: منين? From where?',
        'To answer, say أنا من and your country.',
      ],
      vocab: [
        { arabic: 'منين؟', translit: 'minēn?', meaning: 'from where?' },
        { arabic: 'أنا من...', translit: 'ana min...', meaning: 'I am from...' },
        { arabic: 'كمان', translit: 'kamān', meaning: 'too, also' },
      ],
      say: [E('min', 'من'), E('fen', 'فين'), E('minen', 'منين؟', 'curious'), E('ana-min', 'أنا من...', 'proud')],
      explain: ['Ask the child منين؟ and help them answer أنا من + their country. Clap when it is right!'],
    },
    {
      title: 'Four countries',
      station: 'zad',
      layout: 'concept',
      scene: 'ek2Map',
      lines: [
        'Here are four countries on the map.',
        'Tap each one and say it.',
      ],
      items: ['مصر: Egypt', 'إنجلترا: England', 'أمريكا: America', 'كندا: Canada'],
      vocab: [
        { arabic: 'مصر', translit: 'maṣr', meaning: 'Egypt' },
        { arabic: 'إنجلترا', translit: 'ingiltira', meaning: 'England' },
        { arabic: 'أمريكا', translit: 'amrīka', meaning: 'America' },
        { arabic: 'كندا', translit: 'kanada', meaning: 'Canada' },
      ],
      say: [E('masr', 'مصر'), E('ingiltira', 'إنجلترا'), E('amrika', 'أمريكا'), E('kanada', 'كندا')],
      explain: ['Add the child\'s own country if it is not here. Point to it on a real map if you have one.'],
    },
    {
      title: 'A boy, a girl',
      station: 'zad',
      layout: 'concept',
      scene: 'ek2Masri',
      lines: [
        'Teta smiles: Ziad مصري. Mariam مصرية.',
        'For a boy, the word ends in ـي. For a girl, in ـية.',
        'And Adam? إنجليزي!',
      ],
      vocab: [
        { arabic: 'مصري / مصرية', translit: 'maṣri / maṣriyya', meaning: 'Egyptian (a boy / a girl)' },
        { arabic: 'إنجليزي / إنجليزية', translit: 'ingilīzi / ingilīziyya', meaning: 'English (a boy / a girl)' },
      ],
      say: [E('ziad-masri', 'زياد مصري.', 'warm grandma'), E('mariam-masriyya', 'مريم مصرية.', 'warm grandma'), E('adam-ingilizi', 'وآدم إنجليزي!', 'amused grandma')],
      explain: ['Point at a boy, then a girl, and let the child say مصري or مصرية. Then do the same with their own country.'],
    },
    {
      title: 'Boy or girl?',
      station: 'athar',
      layout: 'game',
      scene: 'ek2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Which word fits? مصري for a boy, مصرية for a girl.',
        bins: [
          { id: 'boy', label: 'مصري', hint: 'a boy' },
          { id: 'girl', label: 'مصرية', hint: 'a girl' },
        ],
        cards: [
          { label: 'Ziad', bin: 'boy', why: 'Ziad is a boy: مصري.' },
          { label: 'Mariam', bin: 'girl', why: 'Mariam is a girl: مصرية.' },
          { label: 'Teta', bin: 'girl', why: 'Teta is a woman: مصرية.' },
          { label: 'Gedo (grandpa)', bin: 'boy', why: 'Gedo is a man: مصري.' },
          { label: 'The baker, a man', bin: 'boy', why: 'A man: مصري.' },
          { label: 'Mariam\'s friend Salma', bin: 'girl', why: 'A girl: مصرية.' },
        ],
      },
      explain: ['Let the child say the full sentence: زياد مصري، مريم مصرية. The result goes into your report.'],
    },
    {
      title: 'Play: where are you from?',
      station: 'athar',
      layout: 'question',
      scene: 'ek2Talk',
      lines: ['Your teacher is Mariam, then Ziad.', 'Ask منين؟, answer أنا من..., and say مصري or مصرية!'],
      say: [E('inta-minen', 'إنت منين؟', 'curious girl'), E('inti-minen', 'إنتي منين؟', 'curious boy')],
      interaction: { kind: 'ask', prompt: 'Play twice: once you ask, once you answer. Did you say إنتي to Mariam?', reveal: 'برافو! You just talked about countries in Egyptian Arabic.' },
      explain: ['Swap roles. If the child is a girl, the teacher asks إنتي منين؟; if a boy, إنت منين؟'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'ek2Mission',
      lines: ['Ask someone at home: إنت منين؟ or إنتي منين؟', 'Then tell them: أنا من...'],
      interaction: { kind: 'choose', prompt: 'Who will you ask?', options: ['Mum', 'Dad', 'Grandma or Grandpa', 'My brother or sister'] },
      explain: ['Ask about it next time: what did they answer?'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'ek2Next',
      lines: ['Teta opens a big old box.', 'Adam points: إيه ده؟ What is this?', 'Next time: ده and دي, things in Teta\'s flat.'],
      say: [E('eh-da', 'إيه ده؟', 'curious boy')],
      explain: ['End on the box. What could be inside?'],
    },
  ],
};
