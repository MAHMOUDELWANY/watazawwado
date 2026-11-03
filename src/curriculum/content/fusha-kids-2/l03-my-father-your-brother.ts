import type { Lesson } from '../../types';
import { lessonFK203TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-2.md (Lesson 3: the five nouns; Kids theme:
// a family photo). Zad Kids cast; the children's father is Ahmad, so Jiddo is أَبُو أَحْمَدَ. Kids meet أَبُو، أَخُو, the
// long i after مَعَ، إِلَى، لِـ, and ذُو. The a-form (أَبَا) and حَمٌ، فَمٌ are 12+. Every Arabic word fully diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFK203: Lesson = {
  subject: 'fusha-kids-2',
  version: 'kids',
  subjectTitle: 'Fusha Arabic · Kids · Level 2',
  number: 3,
  title: 'My Father, Your Brother',
  titleAr: 'أَبِي وَأَخُوكَ',
  part: 'Level 2',
  minutes: 45,
  goal: 'By the end of this lesson, you will name the people in a family photo, the way Arabic families do.',
  reviewed: false,
  teacherAr: lessonFK203TeacherAr,
  outcomes: [
    'Says أَبِي and أَخِي (my father, my brother).',
    'Says أَبُو يُوسُفَ and أَخُو مَرْيَمَ, with the long u before a name.',
    'Hears the long u turn into a long i after مَعَ، إِلَى، لِـ.',
    'Knows what a kunya is (أَبُو أَحْمَدَ) and uses ذُو for "the one with".',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 3 },
    { label: 'Father and brother', page: 4 },
    { label: 'Names and ذُو', page: 7 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'My Father, Your Brother',
      station: 'spark',
      layout: 'cover',
      scene: 'fv3Cover',
      lines: [],
      explain: [
        'Greet in Arabic: السَّلَامُ عَلَيْكُمْ. Ask about the morning mission: which sentence did they say before school?',
        'Tell them: today we open Jiddo\'s old photo album.',
      ],
    },
    {
      title: 'Remember?',
      station: 'spark',
      layout: 'concept',
      scene: 'fv3Recall',
      lines: [
        'Every day, Jiddo goes to the masjid: يَذْهَبُ جِدِّي إِلَى ٱلْمَسْجِدِ.',
        'And you? Say what you do every day, with أَ at the front.',
      ],
      say: [W('yadhhabu-jiddi', 'يَذْهَبُ جِدِّي إِلَى ٱلْمَسْجِدِ.', 'friendly')],
      explain: ['Two minutes. Let the child say one sentence with أَذْهَبُ or أَلْعَبُ. Praise the front letter.'],
    },
    {
      title: 'The old album',
      station: 'spark',
      layout: 'story',
      scene: 'fv3Album',
      lines: [
        'After dinner, Jiddo brings out a dusty photo album.',
        'Inside: black-and-white pictures of a little boy, a young man, and a cat that looks just like Mishmish.',
        'Yusuf and Maryam want to know who everyone is.',
      ],
      explain: ['Ask the child: do you have old family photos at home? Who is in them?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fv3Story',
      lines: [
        'Listen twice. Who is the little boy in the photo?',
        'Who is the young man next to Jiddo?',
        'And the cat? What does Jiddo say about its tail?',
      ],
      say: [
        W('story-1', 'مَنْ هَذَا ٱلْوَلَدُ يَا جِدِّي؟', 'curious boy'),
        W('story-2', 'هَذَا أَحْمَدُ، أَبُو يُوسُفَ وَمَرْيَمَ!', 'warm grandfather, smiling'),
        W('story-3', 'أَبِي صَغِيرٌ!', 'girl, laughing'),
        W('story-4', 'وَمَنْ هَذَا؟', 'curious boy'),
        W('story-5', 'هَذَا أَخِي سَعِيدٌ.', 'warm grandfather, remembering'),
        W('story-6', 'وَهَذَا قِطٌّ ذُو ذَيْلٍ طَوِيلٍ!', 'grandfather, playful'),
      ],
      explain: [
        'Play the scene twice. Ask in English: who is the little boy? (Ahmad, the children\'s father). Why does Maryam laugh? (her dad is small!).',
        'Then: who is the young man? (Jiddo\'s brother Saeed). What about the cat? (it has a long tail).',
      ],
      teacherNote: 'Input first. The photos and the pointing carry the meaning. Do not explain أَبُو yet.',
    },
    {
      title: 'Father',
      station: 'zad',
      layout: 'concept',
      scene: 'fv3Father',
      lines: [
        'أَبٌ: a father. أَبِي: my father.',
        'Before a name, it grows a long u: أَبُو يُوسُفَ, Yusuf\'s father.',
        'So the little boy in the photo is أَحْمَدُ، أَبُو يُوسُفَ, and Maryam says أَبِي, my father.',
      ],
      vocab: [
        { arabic: 'أَبٌ', translit: 'ab', meaning: 'a father' },
        { arabic: 'أَبِي', translit: 'abī', meaning: 'my father' },
        { arabic: 'أَبُو يُوسُفَ', translit: 'abū Yūsuf', meaning: 'Yusuf\'s father' },
      ],
      say: [W('ab', 'أَبٌ'), W('abi', 'أَبِي', 'warm'), W('abu-yusuf', 'أَبُو يُوسُفَ')],
      explain: [
        'Say the three in a row while you point: at a picture of a man (أَبٌ), at your own heart (أَبِي), at a boy\'s picture (أَبُو يُوسُفَ).',
        'Only a few family words do this. أُمٌّ (mother) does not: أُمُّ يُوسُفَ.',
      ],
    },
    {
      title: 'Brother',
      station: 'zad',
      layout: 'concept',
      scene: 'fv3Brother',
      lines: [
        'أَخٌ: a brother. أَخِي: my brother.',
        'Before a name: أَخُو مَرْيَمَ, Maryam\'s brother. That is Yusuf!',
        'Jiddo has a brother too: أَخِي سَعِيدٌ. Same word, same long u before a name.',
      ],
      vocab: [
        { arabic: 'أَخٌ', translit: 'akh', meaning: 'a brother' },
        { arabic: 'أَخِي', translit: 'akhī', meaning: 'my brother' },
        { arabic: 'أَخُو مَرْيَمَ', translit: 'akhū Maryam', meaning: 'Maryam\'s brother' },
      ],
      say: [W('akh', 'أَخٌ'), W('akhi', 'أَخِي', 'warm'), W('akhu-maryam', 'أَخُو مَرْيَمَ')],
      explain: [
        'Ask: Yusuf is أَخُو مَرْيَمَ. Who are you أَخُو or أُخْتُ? (a girl says أُخْتُ, which does not change).',
        'Let the child say it about a real brother: أَنَا أَخُو... or for a girl: أَنَا أُخْتُ...',
      ],
    },
    {
      title: 'After a little word',
      station: 'zad',
      layout: 'concept',
      scene: 'fv3After',
      lines: [
        'Some little words change the long u into a long i: مَعَ (with), إِلَى (to), لِـ (for).',
        'أَبُو أَحْمَدَ, but: يَذْهَبُ يُوسُفُ إِلَى أَبِي أَحْمَدَ.',
        'Careful: أَبِي also means "my father". The name after it tells you which one.',
      ],
      say: [W('ila-abi-ahmad', 'يَذْهَبُ يُوسُفُ إِلَى أَبِي أَحْمَدَ.'), W('maa-akhi-maryam', 'يَلْعَبُ سَامِي مَعَ أَخِي مَرْيَمَ.')],
      explain: [
        'Jiddo is أَبُو أَحْمَدَ. So "Yusuf goes to Jiddo" can be إِلَى أَبِي أَحْمَدَ. Laugh with the child about the name.',
        'Do not drill this. Kids only need to hear that the u becomes an i after these words.',
      ],
    },
    {
      title: 'Named after your child',
      station: 'zad',
      layout: 'concept',
      scene: 'fv3Kunya',
      lines: [
        'Here is a secret about Arab families. Jiddo\'s first son is Ahmad.',
        'So friends call Jiddo أَبُو أَحْمَدَ, "Ahmad\'s father". It is a name of respect, called a kunya.',
        'A mother is called أُمُّ + her child\'s name. What would your parents be called?',
      ],
      vocab: [{ arabic: 'أُمُّ أَحْمَدَ', translit: 'umm Aḥmad', meaning: 'Ahmad\'s mother' }],
      say: [W('abu-ahmad', 'أَبُو أَحْمَدَ', 'respectful'), W('umm-ahmad', 'أُمُّ أَحْمَدَ', 'respectful')],
      explain: [
        'Help the child build their parents\' kunyas: أَبُو + the eldest child\'s name, أُمُّ + the same name.',
        'Many children are proud to find their own name inside their parents\' kunya.',
      ],
      teacherNote: 'The wow of the lesson: the child\'s own name can become part of a parent\'s name.',
    },
    {
      title: 'The one with…',
      station: 'zad',
      layout: 'concept',
      scene: 'fv3Dhu',
      lines: [
        'One more word from the same little family: ذُو, "the one with".',
        'The old cat: قِطٌّ ذُو ذَيْلٍ طَوِيلٍ, a cat with a long tail.',
        'And Jiddo? رَجُلٌ ذُو لِحْيَةٍ بَيْضَاءَ, a man with a white beard.',
      ],
      vocab: [
        { arabic: 'ذُو', translit: 'dhū', meaning: 'the one with' },
        { arabic: 'ذَيْلٌ', translit: 'dhayl', meaning: 'a tail' },
        { arabic: 'لِحْيَةٌ', translit: 'liḥyah', meaning: 'a beard' },
      ],
      say: [W('dhu', 'ذُو'), W('qitt-dhu-dhayl', 'قِطٌّ ذُو ذَيْلٍ طَوِيلٍ.', 'playful'), W('rajul-dhu-lihya', 'رَجُلٌ ذُو لِحْيَةٍ بَيْضَاءَ.', 'warm')],
      explain: [
        'Make it a game: describe something in the room with ذُو and let the child guess. كُرْسِيٌّ ذُو أَرْبَعِ أَرْجُلٍ...',
        'ذُو is for a boy, a man or a masculine thing. Girls and feminine things wait for later.',
      ],
    },
    {
      title: 'Long u or long i?',
      station: 'athar',
      layout: 'game',
      scene: 'fv3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Is there a little word (مَعَ، إِلَى، لِـ) before it? Choose the long u or the long i.',
        bins: [
          { id: 'u', label: 'ـُو', hint: 'no little word' },
          { id: 'i', label: 'ـِي', hint: 'after مَعَ، إِلَى، لِـ' },
        ],
        cards: [
          { label: 'هَذَا أَبُو يُوسُفَ.', bin: 'u', why: 'No little word before it: أَبُو.' },
          { label: 'ذَهَبْتُ إِلَى أَبِي أَحْمَدَ.', bin: 'i', why: 'After إِلَى: أَبِي.' },
          { label: 'يُوسُفُ أَخُو مَرْيَمَ.', bin: 'u', why: 'No little word before it: أَخُو.' },
          { label: 'ٱلْكِتَابُ لِأَخِي مَرْيَمَ.', bin: 'i', why: 'After لِـ: أَخِي.' },
          { label: 'جَلَسَ أَبُو أَحْمَدَ.', bin: 'u', why: 'No little word before it: أَبُو.' },
          { label: 'أَلْعَبُ مَعَ أَخِي سَامِي.', bin: 'i', why: 'After مَعَ: أَخِي.' },
        ],
      },
      explain: ['Let the child find the little word first and point to it. The result goes into your report.'],
    },
    {
      title: 'Your turn: my family photo',
      station: 'athar',
      layout: 'question',
      scene: 'fv3Talk',
      lines: [
        'Show your teacher a family photo, or draw one. Point and say: هَذَا أَبِي، هَذَا أَخِي...',
        'Then tell your teacher your father\'s kunya: أَبِي أَبُو...',
      ],
      say: [W('haadha-abi', 'هَذَا أَبِي.', 'proud'), W('haadha-akhi', 'هَذَا أَخِي.', 'proud')],
      interaction: { kind: 'ask', prompt: 'Two people and one kunya. Did you say them all?', reveal: 'مُمْتَازٌ! Your family, in Arabic.' },
      explain: ['For a mother or sister, give the words: هَذِهِ أُمِّي، هَذِهِ أُخْتِي. Keep the focus on أَبِي، أَخِي and the kunya.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fv3Mission',
      lines: [
        'Tonight, call your father by his kunya: يَا أَبَا... and see if he smiles.',
        'Then draw your family and write أَبِي and أَخِي under the right people.',
      ],
      interaction: { kind: 'choose', prompt: 'Whose kunya will you find out?', options: ['My father', 'My mother', 'My grandfather', 'My uncle'] },
      explain: ['يَا أَبَا is the call form; the child copies it as a whole phrase. Next time, ask how their father reacted.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fv3Next',
      lines: [
        'Saturday morning. Jiddo looks into Yusuf\'s room: toys everywhere.',
        'هَلْ رَتَّبْتَ غُرْفَتَكَ؟ Yusuf looks at the floor: لَا، مَا رَتَّبْتُهَا… بَعْدُ!',
        'Next time: how to say "not", "didn\'t" and "not yet".',
      ],
      say: [W('ma-rattabtuha', 'لَا، مَا رَتَّبْتُهَا… بَعْدُ!', 'guilty boy')],
      explain: ['End on the messy room. Ask: what has the child not done yet today?'],
    },
  ],
};
