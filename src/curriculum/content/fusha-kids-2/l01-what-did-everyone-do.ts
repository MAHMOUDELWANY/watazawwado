import type { Lesson } from '../../types';
import { lessonFK201TeacherAr } from './l01-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-2.md (Lesson 1: the past verb with every
// person; Kids theme: the family's busy Saturday). Zad Kids cast (Maryam, Yusuf, Jiddo, Mishmish). Sound verbs only
// (ذَهَبَ، كَتَبَ، أَكَلَ، شَرِبَ، لَعِبَ، جَلَسَ). Every Arabic word fully diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFK201: Lesson = {
  subject: 'fusha-kids-2',
  version: 'kids',
  subjectTitle: 'Fusha Arabic · Kids · Level 2',
  number: 1,
  title: 'What Did Everyone Do?',
  titleAr: 'مَاذَا فَعَلَ ٱلْجَمِيعُ؟',
  part: 'Level 2',
  minutes: 45,
  goal: 'By the end of this lesson, you will say what you, your family and your friends did, with the right ending on the verb.',
  reviewed: false,
  teacherAr: lessonFK201TeacherAr,
  outcomes: [
    'Hears that the end of the past verb tells who did it.',
    'Says ذَهَبْتُ، ذَهَبْتَ، ذَهَبْتِ، ذَهَبَ، ذَهَبَتْ، ذَهَبْنَا، ذَهَبْتُمْ، ذَهَبُوا.',
    'Moves the same endings to new verbs: كَتَبَ، أَكَلَ، شَرِبَ، لَعِبَ.',
    'Tells a teacher three things they did last weekend.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'The ending', page: 3 },
    { label: 'Practice', page: 8 },
    { label: 'My mission', page: 10 },
  ],
  pages: [
    {
      title: 'What Did Everyone Do?',
      station: 'spark',
      layout: 'cover',
      scene: 'fv1Cover',
      lines: [],
      explain: [
        'Greet in Arabic: السَّلَامُ عَلَيْكُمْ. Welcome the child to Level 2.',
        'Ask: what did you do last Saturday? Let them answer in English first.',
      ],
    },
    {
      title: 'A busy Saturday',
      station: 'spark',
      layout: 'story',
      scene: 'fv1Saturday',
      lines: [
        'It is Saturday evening. Jiddo, Maryam, Yusuf and Mishmish sit down to dinner.',
        'Everyone went somewhere today. Jiddo wants to hear about it.',
        'Listen carefully: each person says the same verb, but it does not sound the same.',
      ],
      explain: ['Show the four characters and ask the child to guess where each one went today.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fv1Story',
      lines: [
        'Listen twice. Where did each one go?',
        'Now listen for the verb. Does it end the same way every time?',
        'Who did not go anywhere at all?',
      ],
      say: [
        W('story-1', 'أَيْنَ ذَهَبْتُمُ ٱلْيَوْمَ؟', 'warm grandfather'),
        W('story-2', 'ذَهَبْتُ إِلَى ٱلْمَلْعَبِ.', 'proud boy'),
        W('story-3', 'وَأَنَا ذَهَبْتُ إِلَى ٱلْمَكْتَبَةِ.', 'happy girl'),
        W('story-4', 'وَأُمِّي ذَهَبَتْ إِلَى ٱلسُّوقِ.', 'girl'),
        W('story-5', 'وَمِشْمِشٌ؟', 'curious grandfather'),
        W('story-6', 'مِشْمِشٌ ذَهَبَ إِلَى ٱلْحَدِيقَةِ!', 'laughing boy'),
        W('story-7', 'وَأَنَا جَلَسْتُ فِي ٱلْبَيْتِ!', 'laughing grandfather'),
      ],
      explain: [
        'Play the scene twice. Ask in English: where did Yusuf go? Maryam? Mum? Mishmish?',
        'The surprise: Jiddo asked everyone, but he stayed at home. Let the child laugh with him.',
      ],
      teacherNote: 'Input first: let the pictures carry the meaning. Do not explain the endings until the next page.',
    },
    {
      title: 'The ending tells who',
      station: 'zad',
      layout: 'concept',
      scene: 'fv1Ending',
      lines: [
        'The verb starts the same every time: ذَهَبَـ, went.',
        'Then the ending tells you who: ذَهَبْتُ, I went. ذَهَبَ, he went.',
        'And ذَهَبَتْ, she went. One little sound at the end changes the person.',
      ],
      vocab: [
        { arabic: 'ذَهَبْتُ', translit: 'dhahabtu', meaning: 'I went' },
        { arabic: 'ذَهَبَ', translit: 'dhahaba', meaning: 'he went' },
        { arabic: 'ذَهَبَتْ', translit: 'dhahabat', meaning: 'she went' },
      ],
      say: [W('dhahabtu', 'ذَهَبْتُ'), W('dhahaba', 'ذَهَبَ'), W('dhahabat', 'ذَهَبَتْ')],
      explain: [
        'Tap the stem, then each ending. Point at yourself for ذَهَبْتُ, at a boy for ذَهَبَ, at a girl for ذَهَبَتْ.',
        'The child may already know ذَهَبَ from Level 1. Today it gets its whole family.',
      ],
    },
    {
      title: 'You, a boy; you, a girl',
      station: 'zad',
      layout: 'concept',
      scene: 'fv1You',
      lines: [
        'When Jiddo asks Yusuf, he says أَيْنَ ذَهَبْتَ؟ with a fatha at the end.',
        'When he asks Maryam, he says أَيْنَ ذَهَبْتِ؟ with a kasra.',
        'Arabic listens to who you are talking to, boy or girl.',
      ],
      vocab: [
        { arabic: 'ذَهَبْتَ', translit: 'dhahabta', meaning: 'you went (to a boy)' },
        { arabic: 'ذَهَبْتِ', translit: 'dhahabti', meaning: 'you went (to a girl)' },
      ],
      say: [W('ayna-dhahabta', 'أَيْنَ ذَهَبْتَ؟', 'grandfather, to a boy'), W('ayna-dhahabti', 'أَيْنَ ذَهَبْتِ؟', 'grandfather, to a girl')],
      explain: ['Ask the child أَيْنَ ذَهَبْتَ؟ or أَيْنَ ذَهَبْتِ؟, then let them ask you back with the right ending.'],
    },
    {
      title: 'We, you all, they',
      station: 'zad',
      layout: 'concept',
      scene: 'fv1Many',
      lines: [
        'For a group, the endings grow: ذَهَبْنَا, we went.',
        'ذَهَبْتُمْ, you all went. That is what Jiddo asked at dinner.',
        'ذَهَبُوا, they went. Listen for the long oo at the end.',
      ],
      vocab: [
        { arabic: 'ذَهَبْنَا', translit: 'dhahabnā', meaning: 'we went' },
        { arabic: 'ذَهَبْتُمْ', translit: 'dhahabtum', meaning: 'you all went' },
        { arabic: 'ذَهَبُوا', translit: 'dhahabū', meaning: 'they went' },
      ],
      say: [W('dhahabna', 'ذَهَبْنَا'), W('dhahabtum', 'ذَهَبْتُمْ'), W('dhahabu', 'ذَهَبُوا')],
      explain: ['Make a circle with your arms for "we", point at the screen for "you all", point away for "they".'],
    },
    {
      title: 'Eight people, one verb',
      station: 'zad',
      layout: 'concept',
      scene: 'fv1Eight',
      lines: [
        'Here they all are: eight people, eight endings, one verb.',
        'Now change the verb: كَتَبَ, wrote. The endings jump across and fit perfectly.',
        'كَتَبْتُ, I wrote. كَتَبَتْ, she wrote. كَتَبُوا, they wrote. Learn the endings once, use them with every verb.',
      ],
      say: [W('katabtu', 'كَتَبْتُ'), W('katabat', 'كَتَبَتْ'), W('katabu', 'كَتَبُوا')],
      explain: [
        'This is the wow of the lesson: the endings are a set of keys that open every past verb.',
        'Let the child try one ending on كَتَبَ by themselves.',
      ],
    },
    {
      title: 'Three more verbs',
      station: 'zad',
      layout: 'concept',
      scene: 'fv1Verbs',
      lines: [
        'Three verbs from a Saturday: أَكَلَ ate, شَرِبَ drank, لَعِبَ played.',
        'Put the endings on: أَكَلْتُ، شَرِبْتُ، لَعِبْتُ.',
        'Yusuf says لَعِبْتُ كُرَةً. Maryam says شَرِبْتُ عَصِيرًا. What did you do?',
      ],
      items: ['أَكَلَ: ate', 'شَرِبَ: drank', 'لَعِبَ: played'],
      vocab: [
        { arabic: 'أَكَلَ', translit: 'akala', meaning: 'he ate' },
        { arabic: 'شَرِبَ', translit: 'shariba', meaning: 'he drank' },
        { arabic: 'لَعِبَ', translit: 'la‘iba', meaning: 'he played' },
        { arabic: 'كُرَةٌ', translit: 'kura', meaning: 'a ball' },
        { arabic: 'عَصِيرٌ', translit: '‘aṣīr', meaning: 'juice' },
      ],
      say: [W('akaltu', 'أَكَلْتُ'), W('sharibtu', 'شَرِبْتُ'), W('laibtu', 'لَعِبْتُ'), W('laibtu-kura', 'لَعِبْتُ كُرَةً.', 'proud boy'), W('sharibtu-asir', 'شَرِبْتُ عَصِيرًا.', 'happy girl')],
      explain: ['Mime each verb and let the child say it with ـْتُ. Then swap: the child mimes and you guess.'],
    },
    {
      title: 'Who did it?',
      station: 'athar',
      layout: 'game',
      scene: 'fv1Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Listen to the ending. Who did it?',
        bins: [
          { id: 'me', label: 'أَنَا', hint: 'I' },
          { id: 'one', label: 'هُوَ / هِيَ', hint: 'he or she' },
          { id: 'many', label: 'نَحْنُ / هُمْ', hint: 'we or they' },
        ],
        cards: [
          { label: 'ذَهَبْتُ', bin: 'me', why: 'ـْتُ: I went.' },
          { label: 'لَعِبَ', bin: 'one', why: 'ـَ: he played.' },
          { label: 'أَكَلَتْ', bin: 'one', why: 'ـَتْ: she ate.' },
          { label: 'شَرِبْنَا', bin: 'many', why: 'ـْنَا: we drank.' },
          { label: 'كَتَبْتُ', bin: 'me', why: 'ـْتُ: I wrote.' },
          { label: 'ذَهَبُوا', bin: 'many', why: 'ـُوا: they went.' },
          { label: 'جَلَسَتْ', bin: 'one', why: 'ـَتْ: she sat.' },
        ],
      },
      explain: ['Let the child read each card out loud before sorting. The result goes into your report.'],
    },
    {
      title: 'Your turn: my Saturday',
      station: 'athar',
      layout: 'question',
      scene: 'fv1Talk',
      lines: [
        'Tell your teacher about your last Saturday.',
        'Say three things with ـْتُ: ذَهَبْتُ…، أَكَلْتُ…، لَعِبْتُ…',
      ],
      say: [W('ayna-dhahabta', 'أَيْنَ ذَهَبْتَ؟', 'grandfather, to a boy'), W('ayna-dhahabti', 'أَيْنَ ذَهَبْتِ؟', 'grandfather, to a girl')],
      interaction: { kind: 'ask', prompt: 'Your teacher asks أَيْنَ ذَهَبْتَ؟ or أَيْنَ ذَهَبْتِ؟ Answer with three sentences.', reveal: 'مُمْتَازٌ! You told your Saturday in Arabic.' },
      explain: ['Accept any place word the child knows; help with new ones. The goal is the ending ـْتُ, three times.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fv1Mission',
      lines: [
        'At dinner tonight, ask your family: أَيْنَ ذَهَبْتُمُ ٱلْيَوْمَ؟',
        'Then tell them where you went: ذَهَبْتُ إِلَى…',
      ],
      say: [W('story-1', 'أَيْنَ ذَهَبْتُمُ ٱلْيَوْمَ؟', 'warm grandfather')],
      interaction: { kind: 'choose', prompt: 'Who will you ask first?', options: ['Mum', 'Dad', 'My brother or sister', 'Grandma or Grandpa'] },
      explain: ['Next time, ask what the family answered.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fv1Next',
      lines: [
        'Saturday is over. On Monday, Yusuf goes to school, like every Monday.',
        'Not ذَهَبَ, went, but يَذْهَبُ, goes. Listen: the change is at the start this time.',
        'Next time: the verb for every day.',
      ],
      say: [W('yadhhabu', 'يَذْهَبُ', 'clear')],
      explain: ['End on يَذْهَبُ. Let the child hear that the new sound is at the beginning of the word.'],
    },
  ],
};
