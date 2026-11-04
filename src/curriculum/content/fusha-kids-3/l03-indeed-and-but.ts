import type { Lesson } from '../../types';
import { lessonFK303TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-3.md (Lesson 3: إِنَّ and her sisters; Kids
// take إِنَّ and لَكِنَّ, with إِنَّهُ / لَكِنَّهُ; theme: Mishmish is sure, but...). Zad Kids cast. Every Arabic word fully
// diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFK303: Lesson = {
  subject: 'fusha-kids-3',
  version: 'kids',
  subjectTitle: 'Fusha Arabic · Kids · Level 3',
  number: 3,
  title: 'Indeed and But',
  titleAr: 'إِنَّ وَلَكِنَّ',
  part: 'Level 3',
  minutes: 45,
  goal: 'By the end of this lesson, you will say something for sure with إِنَّ, and argue back with لَكِنَّ.',
  reviewed: false,
  teacherAr: lessonFK303TeacherAr,
  outcomes: [
    'Uses إِنَّ to say something for sure: إِنَّ مِشْمِشًا بَرِيءٌ.',
    'Hears the first word change to ـَ / ـًا after إِنَّ and لَكِنَّ, while the second word stays.',
    'Uses لَكِنَّ for "but": لَكِنَّ ٱلسَّمَكَ فِي فَمِهِ.',
    'Says إِنَّهُ and لَكِنَّهُ about a boy or a "he" thing.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 3 },
    { label: 'إِنَّ and لَكِنَّ', page: 4 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Indeed and But',
      station: 'spark',
      layout: 'cover',
      scene: 'fx3Cover',
      lines: [],
      explain: [
        'Greet in Arabic: السَّلَامُ عَلَيْكُمْ. Ask about the detective mission: what was done at home? Let them say two passives.',
        'Tell them: today Mishmish goes on trial.',
      ],
    },
    {
      title: 'Remember?',
      station: 'spark',
      layout: 'concept',
      scene: 'fx3Recall',
      lines: [
        'Last time: أُكِلَ ٱلسَّمَكُ, the fish was eaten. Nobody said who.',
        'Today everybody has an opinion about who did it, and they are very sure.',
      ],
      say: [W('ukila-samak', 'أُكِلَ ٱلسَّمَكُ.', 'mysterious')],
      explain: ['Two minutes. Ask: who do you think ate the fish? Let them answer in English or Arabic.'],
    },
    {
      title: 'The trial of Mishmish',
      station: 'spark',
      layout: 'story',
      scene: 'fx3Trial',
      lines: [
        'Jiddo sits in his big chair like a judge. Mishmish sits on the rug, very still.',
        'Maryam is on Mishmish\'s side. Yusuf is not.',
        'Each of them has a little word to make their point stronger.',
      ],
      explain: ['Ask the child: when you are really sure about something, how do you say it in English? ("Definitely!", "I\'m sure!")'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fx3Story',
      lines: [
        'Listen twice. What does Maryam say about Mishmish?',
        'What does Yusuf answer?',
        'What does Jiddo decide at the end?',
      ],
      say: [
        W('story-1', 'مَنْ أَكَلَ ٱلسَّمَكَ؟', 'grandfather, like a judge'),
        W('story-2', 'إِنَّ مِشْمِشًا بَرِيءٌ يَا جِدِّي!', 'girl, certain'),
        W('story-3', 'لَكِنَّ ٱلسَّمَكَ فِي فَمِهِ!', 'boy, pointing'),
        W('story-4', 'إِنَّهُ جَائِعٌ، مِسْكِينٌ!', 'girl, pleading'),
        W('story-5', 'إِنَّ مِشْمِشًا ذَكِيٌّ، لَكِنَّهُ لِصٌّ صَغِيرٌ!', 'grandfather, laughing'),
      ],
      explain: [
        'Play the scene twice. Ask in English: what does Maryam say? (Mishmish is innocent). And Yusuf? (but the fish is in his mouth!).',
        'Then: what does Jiddo decide? (Mishmish is clever, but he is a little thief).',
      ],
      teacherNote: 'Input first. Let the child enjoy the argument before any grammar.',
    },
    {
      title: 'إِنَّ: for sure',
      station: 'zad',
      layout: 'concept',
      scene: 'fx3Inna',
      lines: [
        'Start with a plain sentence: مِشْمِشٌ بَرِيءٌ, Mishmish is innocent.',
        'Put إِنَّ in front, and it means: for sure! Mishmish is definitely innocent.',
        'Listen: مِشْمِشٌ became مِشْمِشًا. The first word changed; بَرِيءٌ stayed the same.',
      ],
      vocab: [
        { arabic: 'إِنَّ', translit: 'inna', meaning: 'for sure, indeed' },
        { arabic: 'بَرِيءٌ', translit: 'barīʾ', meaning: 'innocent' },
      ],
      say: [W('mishmish-bari', 'مِشْمِشٌ بَرِيءٌ.'), W('inna', 'إِنَّ', 'strong'), W('inna-mishmishan', 'إِنَّ مِشْمِشًا بَرِيءٌ!', 'certain')],
      explain: [
        'Say the plain sentence calmly, then the إِنَّ sentence with a firm voice and a nod. The child copies both.',
        'Point to the ending of مِشْمِشًا: an "an" sound. Let the child say both words: مِشْمِشٌ, مِشْمِشًا.',
      ],
    },
    {
      title: 'The seesaw',
      station: 'zad',
      layout: 'concept',
      scene: 'fx3Seesaw',
      lines: [
        'Think of إِنَّ as a weight that lands on the first word only.',
        'ٱلسَّمَكُ لَذِيذٌ → إِنَّ ٱلسَّمَكَ لَذِيذٌ. The first word goes from u to a.',
        'The second word does not move: لَذِيذٌ stays لَذِيذٌ.',
      ],
      vocab: [{ arabic: 'لَذِيذٌ', translit: 'ladhīdh', meaning: 'tasty' }],
      say: [W('samak-ladhidh', 'ٱلسَّمَكُ لَذِيذٌ.'), W('inna-samak', 'إِنَّ ٱلسَّمَكَ لَذِيذٌ.', 'very sure')],
      explain: [
        'Balance a pen on your finger: put a coin on one end. Only that end goes down. That is what إِنَّ does to the first word.',
        'Do not use the words اسم and خبر. "First word" and "second word" are enough today.',
      ],
      teacherNote: 'The wow of the lesson: one small word reaches into the sentence and changes only one ending. Children love catching it.',
    },
    {
      title: 'لَكِنَّ: but',
      station: 'zad',
      layout: 'concept',
      scene: 'fx3Lakinna',
      lines: [
        'لَكِنَّ means "but", and it works just like إِنَّ.',
        'ٱلسَّمَكُ فِي فَمِهِ → لَكِنَّ ٱلسَّمَكَ فِي فَمِهِ! But the fish is in his mouth!',
        'Same weight, same first word: ٱلسَّمَكُ becomes ٱلسَّمَكَ.',
      ],
      vocab: [
        { arabic: 'لَكِنَّ', translit: 'lākinna', meaning: 'but' },
        { arabic: 'فَمٌ', translit: 'fam', meaning: 'mouth' },
      ],
      say: [W('lakinna', 'لَكِنَّ', 'strong'), W('lakinna-samak', 'لَكِنَّ ٱلسَّمَكَ فِي فَمِهِ!', 'boy, triumphant')],
      explain: [
        'Play the argument: you say إِنَّ مِشْمِشًا بَرِيءٌ, the child answers لَكِنَّ ٱلسَّمَكَ فِي فَمِهِ! Then swap sides.',
        'The child already met فَمٌ among the five nouns in Level 2. Here فَمِهِ means "his mouth".',
      ],
    },
    {
      title: 'He, for sure',
      station: 'zad',
      layout: 'concept',
      scene: 'fx3Hu',
      lines: [
        'Instead of saying Mishmish again and again, Maryam says إِنَّهُ: he, for sure.',
        'إِنَّهُ جَائِعٌ! He is hungry, for sure!',
        'And Jiddo: لَكِنَّهُ لِصٌّ صَغِيرٌ! But he is a little thief!',
      ],
      vocab: [
        { arabic: 'إِنَّهُ', translit: 'innahu', meaning: 'he, for sure' },
        { arabic: 'لَكِنَّهُ', translit: 'lākinnahu', meaning: 'but he' },
        { arabic: 'جَائِعٌ', translit: 'jāʾiʿ', meaning: 'hungry' },
      ],
      say: [W('innahu-jaai', 'إِنَّهُ جَائِعٌ!', 'girl, pleading'), W('lakinnahu-liss', 'لَكِنَّهُ لِصٌّ صَغِيرٌ!', 'grandfather, laughing')],
      explain: ['Point at Mishmish for هُ. Ask: who is هُ here? (Mishmish).'],
    },
    {
      title: 'Jiddo\'s verdict',
      station: 'zad',
      layout: 'concept',
      scene: 'fx3Verdict',
      lines: [
        'Jiddo puts both words in one sentence: إِنَّ مِشْمِشًا ذَكِيٌّ، لَكِنَّهُ لِصٌّ صَغِيرٌ!',
        'First he is sure of something good. Then لَكِنَّ brings the "but".',
        'Now you can argue in Arabic: say what is true, then say "but".',
      ],
      vocab: [
        { arabic: 'ذَكِيٌّ', translit: 'dhakiyy', meaning: 'clever' },
        { arabic: 'لِصٌّ', translit: 'liṣṣ', meaning: 'a thief' },
      ],
      say: [W('story-5', 'إِنَّ مِشْمِشًا ذَكِيٌّ، لَكِنَّهُ لِصٌّ صَغِيرٌ!', 'grandfather, laughing')],
      explain: ['Make a "good thing, but…" sentence about something at home together: إِنَّ ٱلْبَيْتَ جَمِيلٌ، لَكِنَّهُ صَغِيرٌ.'],
    },
    {
      title: 'Which ending?',
      station: 'athar',
      layout: 'game',
      scene: 'fx3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Fill the gap. Is there إِنَّ or لَكِنَّ before it?',
        bins: [
          { id: 'a', label: 'ٱلْقِطَّ', hint: 'after إِنَّ / لَكِنَّ' },
          { id: 'u', label: 'ٱلْقِطُّ', hint: 'no little word' },
        ],
        cards: [
          { label: 'إِنَّ ___ نَائِمٌ.', bin: 'a', why: 'After إِنَّ the first word takes a: ٱلْقِطَّ.' },
          { label: '___ نَائِمٌ.', bin: 'u', why: 'No little word: ٱلْقِطُّ.' },
          { label: 'لَكِنَّ ___ جَائِعٌ.', bin: 'a', why: 'After لَكِنَّ the first word takes a: ٱلْقِطَّ.' },
          { label: '___ صَغِيرٌ.', bin: 'u', why: 'No little word: ٱلْقِطُّ.' },
          { label: 'إِنَّ ___ ذَكِيٌّ.', bin: 'a', why: 'After إِنَّ: ٱلْقِطَّ.' },
          { label: '___ فِي ٱلْحَدِيقَةِ.', bin: 'u', why: 'No little word: ٱلْقِطُّ.' },
        ],
      },
      explain: ['Let the child read the sentence aloud with the right word before dropping it. The result goes into your report.'],
    },
    {
      title: 'Your turn: the trial',
      station: 'athar',
      layout: 'question',
      scene: 'fx3Talk',
      lines: [
        'Pick a side about something at home: a pet, a sibling, a messy room.',
        'Say one sure thing with إِنَّ. Your teacher answers with لَكِنَّ. Then swap.',
      ],
      say: [W('inna-ghurfa', 'إِنَّ ٱلْغُرْفَةَ نَظِيفَةٌ!', 'certain'), W('lakinna-ghurfa', 'لَكِنَّ ٱلْأَلْعَابَ عَلَى ٱلْأَرْضِ!', 'laughing')],
      interaction: { kind: 'ask', prompt: 'Two rounds each. Did the first word change after إِنَّ and لَكِنَّ?', reveal: 'مُمْتَازٌ! A real Arabic argument.' },
      explain: ['Help with adjectives (نَظِيفٌ، كَبِيرٌ، جَمِيلٌ). Correct only the first word\'s ending; that is the skill.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fx3Mission',
      lines: [
        'At home, say one "good thing, but" sentence about someone in your family.',
        'Like Jiddo: إِنَّ أَخِي ذَكِيٌّ، لَكِنَّهُ... (be kind!)',
      ],
      interaction: { kind: 'choose', prompt: 'Who will it be about?', options: ['My brother or sister', 'My pet', 'Myself', 'A grandparent'] },
      explain: ['Next time, ask for the sentence. Praise kindness as well as grammar.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fx3Next',
      lines: [
        'Maryam\'s class has a project: a poster about the planets, made in teams.',
        'At the end she says proudly: تَعَلَّمْتُ كَثِيرًا، وَتَعَاوَنَّا! I learnt a lot, and we worked together!',
        'Next time: two new verb shapes that start with تَـ.',
      ],
      say: [W('taallamtu', 'تَعَلَّمْتُ كَثِيرًا، وَتَعَاوَنَّا!', 'girl, proud')],
      explain: ['End on the poster. Ask: what do تَعَلَّمْتُ and عَلَّمَ have in common? (the same root, ع ل م).'],
    },
  ],
};
