import type { Lesson } from '../../types';
import { lessonFK301TeacherAr } from './l01-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-3.md (Lesson 1: verb patterns, Kids take
// Forms II and III; theme: Jiddo teaches Yusuf to fix a bike). Zad Kids cast. Every Arabic word fully diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFK301: Lesson = {
  subject: 'fusha-kids-3',
  version: 'kids',
  subjectTitle: 'Fusha Arabic · Kids · Level 3',
  number: 1,
  title: 'One Root, Many Verbs',
  titleAr: 'جَذْرٌ وَاحِدٌ وَأَفْعَالٌ كَثِيرَةٌ',
  part: 'Level 3',
  minutes: 45,
  goal: 'By the end of this lesson, you will turn "knew" into "taught" and "played" into "played with", by changing the shape of a verb.',
  reviewed: false,
  teacherAr: lessonFK301TeacherAr,
  outcomes: [
    'Knows that three root letters carry a verb\'s meaning (ع ل م = knowing).',
    'Makes the فَعَّلَ shape with a shadda: عَلِمَ → عَلَّمَ (knew → taught).',
    'Makes the فَاعَلَ shape with a long ā: لَعِبَ → لَاعَبَ (played → played with).',
    'Says مَنْ عَلَّمَكَ؟ and answers عَلَّمَنِي...',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 3 },
    { label: 'Roots and shapes', page: 4 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'One Root, Many Verbs',
      station: 'spark',
      layout: 'cover',
      scene: 'fx1Cover',
      lines: [],
      explain: [
        'Greet in Arabic: السَّلَامُ عَلَيْكُمْ. Welcome to Level 3! Ask: who taught you to ride a bike, or to swim?',
        'Tell them: today one tiny mark turns "knew" into "taught".',
      ],
    },
    {
      title: 'Remember?',
      station: 'spark',
      layout: 'concept',
      scene: 'fx1Recall',
      lines: [
        'In Level 2 you learnt verbs in pairs: كَتَبَ يَكْتُبُ, he wrote, he writes.',
        'Look inside كَتَبَ: three letters, ك ت ب. They are the heart of the word.',
      ],
      say: [W('kataba-yaktubu', 'كَتَبَ يَكْتُبُ', 'clear')],
      explain: ['Two minutes. Ask the child to find the three letters inside كِتَابٌ too. Same letters, same idea: writing.'],
    },
    {
      title: 'The broken bike',
      station: 'spark',
      layout: 'story',
      scene: 'fx1Bike',
      lines: [
        'Yusuf\'s bike will not move. The chain has slipped off.',
        'Jiddo rolls up his sleeves. He does not fix it for Yusuf. He shows him how.',
        'By the evening, Yusuf can fix it himself, and Maryam wants to know who helped.',
      ],
      explain: ['Ask the child: what is the difference between fixing something for someone, and teaching them to fix it?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fx1Story',
      lines: [
        'Listen twice. What is wrong with the bike?',
        'Who taught Yusuf? Who helped?',
        'And who played with Mishmish?',
      ],
      say: [
        W('story-1', 'يَا جِدِّي، ٱلدَّرَّاجَةُ لَا تَمْشِي!', 'sad boy'),
        W('story-2', 'تَعَالَ، أُعَلِّمُكَ.', 'warm grandfather'),
        W('story-3', 'مَنْ عَلَّمَكَ يَا يُوسُفُ؟', 'curious girl'),
        W('story-4', 'جِدِّي عَلَّمَنِي!', 'proud boy'),
        W('story-5', 'وَأَنَا سَاعَدْتُ جِدِّي!', 'girl, cheeky'),
        W('story-6', 'وَأَنَا لَاعَبْتُ مِشْمِشًا!', 'girl, laughing'),
      ],
      explain: [
        'Play the scene twice. Ask in English: what was wrong? (the bike would not move). Who taught Yusuf? (Jiddo).',
        'Then: who helped Jiddo? (Maryam). Who did she play with? (Mishmish).',
      ],
      teacherNote: 'Input first. The pictures carry "taught", "helped" and "played with". Do not explain the shapes yet.',
    },
    {
      title: 'Three letters',
      station: 'zad',
      layout: 'concept',
      scene: 'fx1Root',
      lines: [
        'Most Arabic words grow from three letters, called a root (جَذْرٌ).',
        'ع ل م is the root of knowing: عَلِمَ, he knew.',
        'The root is like a seed. The shape around it decides what grows.',
      ],
      vocab: [
        { arabic: 'جَذْرٌ', translit: 'jadhr', meaning: 'a root' },
        { arabic: 'عَلِمَ', translit: 'ʿalima', meaning: 'he knew' },
      ],
      say: [W('jadhr', 'جَذْرٌ'), W('alima', 'عَلِمَ', 'clear')],
      explain: ['Say the root letters by their names: عَيْن، لَام، مِيم. Then say عَلِمَ slowly and let the child hear all three.'],
    },
    {
      title: 'The shadda shape',
      station: 'zad',
      layout: 'concept',
      scene: 'fx1Two',
      lines: [
        'Put a shadda on the middle letter, and the verb now does it to someone else.',
        'عَلِمَ, he knew. عَلَّمَ, he taught: he made someone know.',
        'فَهِمَ, he understood. فَهَّمَ, he explained: he made someone understand.',
      ],
      vocab: [
        { arabic: 'عَلَّمَ', translit: 'ʿallama', meaning: 'he taught' },
        { arabic: 'فَهِمَ', translit: 'fahima', meaning: 'he understood' },
        { arabic: 'فَهَّمَ', translit: 'fahhama', meaning: 'he explained (made understand)' },
      ],
      say: [W('allama', 'عَلَّمَ', 'clear, pressing the shadda'), W('fahima', 'فَهِمَ'), W('fahhama', 'فَهَّمَ', 'pressing the shadda'), W('allama-jiddi', 'عَلَّمَ جِدِّي يُوسُفَ.')],
      explain: [
        'Press the shadda with your voice: عَلْ-لَمَ. Let the child feel the letter held twice.',
        'Act it: you "know" (tap your head), then you "teach" (tap your head, then point at the child).',
      ],
    },
    {
      title: 'The long ā shape',
      station: 'zad',
      layout: 'concept',
      scene: 'fx1Three',
      lines: [
        'Put a long ā after the first letter, and now you do it with someone.',
        'لَعِبَ, he played. لَاعَبَ, he played with someone.',
        'Maryam says: لَاعَبْتُ مِشْمِشًا. She played with Mishmish. And سَاعَدَ means he helped someone.',
      ],
      vocab: [
        { arabic: 'لَاعَبَ', translit: 'lāʿaba', meaning: 'he played with (someone)' },
        { arabic: 'سَاعَدَ', translit: 'sāʿada', meaning: 'he helped' },
      ],
      say: [W('laiba', 'لَعِبَ'), W('laaba', 'لَاعَبَ', 'stretching the ā'), W('laabtu-mishmish', 'لَاعَبْتُ مِشْمِشًا.', 'laughing girl'), W('saada', 'سَاعَدَ')],
      explain: [
        'Stretch the ā with your arms: لَاااعَبَ. Two hands come together: with someone.',
        'سَاعَدَ has the same long ā and the same "someone else" feeling: you help a person.',
      ],
    },
    {
      title: 'Shapes are moulds',
      station: 'zad',
      layout: 'concept',
      scene: 'fx1Mould',
      lines: [
        'Think of each shape as a biscuit cutter. The root is the dough.',
        'Arabic uses three model letters for the cutter: فَعَلَ, فَعَّلَ, فَاعَلَ.',
        'Drop any root in, and out comes a new verb: دَرَسَ, دَرَّسَ. He studied, he taught a subject.',
      ],
      vocab: [
        { arabic: 'دَرَسَ', translit: 'darasa', meaning: 'he studied' },
        { arabic: 'دَرَّسَ', translit: 'darrasa', meaning: 'he taught (a subject)' },
      ],
      say: [W('faala', 'فَعَلَ'), W('faala-2', 'فَعَّلَ'), W('faala-3', 'فَاعَلَ'), W('darasa', 'دَرَسَ'), W('darrasa', 'دَرَّسَ')],
      explain: [
        'Draw three biscuit cutters on paper: فَعَلَ، فَعَّلَ، فَاعَلَ. Put the letters د ر س into each one with the child.',
        'Not every root fits every cutter. Arabic speakers learn which ones are real words, the way we learn real English words.',
      ],
      teacherNote: 'The wow of the lesson: Arabic is built like a kitchen, roots and cutters. A child who sees this has a key to thousands of words.',
    },
    {
      title: 'Every Saturday',
      station: 'zad',
      layout: 'concept',
      scene: 'fx1Present',
      lines: [
        'These shapes have a present too, and it starts with a new sound: يُـ, with a u.',
        'Jiddo teaches Yusuf every Saturday: يُعَلِّمُ. Maryam helps: تُسَاعِدُ.',
        'And I? أُعَلِّمُ, I teach. Jiddo said it at the start: تَعَالَ، أُعَلِّمُكَ.',
      ],
      vocab: [
        { arabic: 'يُعَلِّمُ', translit: 'yuʿallimu', meaning: 'he teaches' },
        { arabic: 'يُسَاعِدُ', translit: 'yusāʿidu', meaning: 'he helps' },
      ],
      say: [W('yuallimu', 'يُعَلِّمُ'), W('tusaidu', 'تُسَاعِدُ'), W('uallimu', 'أُعَلِّمُ')],
      explain: [
        'Compare with Level 2: يَذْهَبُ starts with ya; يُعَلِّمُ starts with yu. The u is a clue: this verb has a shape.',
        'Keep it to hearing. The full present of these shapes comes in the next lessons.',
      ],
    },
    {
      title: 'Which cutter?',
      station: 'athar',
      layout: 'game',
      scene: 'fx1Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Which shape made this verb?',
        bins: [
          { id: 'one', label: 'فَعَلَ', hint: 'plain' },
          { id: 'two', label: 'فَعَّلَ', hint: 'shadda: to someone' },
          { id: 'three', label: 'فَاعَلَ', hint: 'long ā: with someone' },
        ],
        cards: [
          { label: 'عَلَّمَ', bin: 'two', why: 'A shadda on the middle letter: he taught.' },
          { label: 'لَاعَبَ', bin: 'three', why: 'A long ā after the first letter: he played with.' },
          { label: 'دَرَسَ', bin: 'one', why: 'Plain shape: he studied.' },
          { label: 'سَاعَدَ', bin: 'three', why: 'A long ā after the first letter: he helped.' },
          { label: 'فَهَّمَ', bin: 'two', why: 'A shadda on the middle letter: he explained.' },
          { label: 'عَلِمَ', bin: 'one', why: 'Plain shape: he knew.' },
        ],
      },
      explain: ['Let the child say each verb and hold the shadda or stretch the ā before choosing. The result goes into your report.'],
    },
    {
      title: 'Your turn: who taught you?',
      station: 'athar',
      layout: 'question',
      scene: 'fx1Talk',
      lines: [
        'Think of something you can do: ride a bike, swim, read Arabic.',
        'Your teacher asks: مَنْ عَلَّمَكَ؟ You answer: عَلَّمَنِي أَبِي... or عَلَّمَتْنِي أُمِّي...',
      ],
      say: [W('man-allamaka', 'مَنْ عَلَّمَكَ؟', 'curious'), W('allamani-abi', 'عَلَّمَنِي أَبِي.', 'proud')],
      interaction: { kind: 'ask', prompt: 'Two things, two teachers. Did you use عَلَّمَنِي?', reveal: 'مُمْتَازٌ! Now say thank you to them.' },
      explain: ['عَلَّمَتْنِي is for a woman teacher (the ت of "she" from Level 2). Give it as a whole phrase if the child needs it.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fx1Mission',
      lines: [
        'Be Jiddo this week: teach someone at home one Arabic word.',
        'Then tell your teacher next time: عَلَّمْتُ أُخْتِي كَلِمَةً. I taught my sister a word.',
      ],
      interaction: { kind: 'choose', prompt: 'Who will you teach?', options: ['My brother or sister', 'Mum or Dad', 'A grandparent', 'A friend'] },
      explain: ['Next time, ask which word they taught, and let them say عَلَّمْتُ + the person.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fx1Next',
      lines: [
        'Crash! Jiddo\'s favourite vase lies in pieces on the floor.',
        'Nobody says who did it. Jiddo just says: كُسِرَتِ ٱلْمَزْهَرِيَّةُ. The vase was broken.',
        'Next time: how Arabic talks about things that happened when we do not say who did them.',
      ],
      say: [W('kusirat', 'كُسِرَتِ ٱلْمَزْهَرِيَّةُ!', 'grandfather, surprised')],
      explain: ['End on the broken vase. Ask: who do you think broke it? Mishmish is looking very innocent.'],
    },
  ],
};
