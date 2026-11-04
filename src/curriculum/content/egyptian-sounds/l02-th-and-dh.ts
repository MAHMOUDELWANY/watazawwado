import type { Lesson } from '../../types';
import { lessonES02TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP-sounds.md (Lesson 2: ث → t / s, ذ → d / z,
// ظ → d / z; the jeweller and the market). Adults cast. Adam's Fusha lines play in the Fusha clone; Egyptian lines are
// recorded by the owner (eg).

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });
const F = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonES02: Lesson = {
  subject: 'egyptian-sounds',
  version: 'adults',
  subjectTitle: 'Egyptian Arabic · Sounds',
  number: 2,
  title: 'Th and Dh',
  titleAr: 'التاء والدال',
  part: 'Sounds',
  minutes: 50,
  goal: 'By the end of this lesson, you will know what Cairo does with the "th" sounds of Fusha, and when it chooses t or s, d or z.',
  reviewed: false,
  teacherAr: lessonES02TeacherAr,
  outcomes: [
    'Says everyday ث words with t: تلاتة، كتير، تلج.',
    'Says everyday ذ words with d: دهب، ديل.',
    'Uses s and z for "book" words: ثورة = sawra, ذكي = zaki, مثلاً = masalan.',
    'Hears ظ as d in old words (ضهر) and z in book words (ظريف).',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 3 },
    { label: 'Th → t, dh → d', page: 4 },
    { label: 'Book words', page: 6 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Th and Dh',
      station: 'spark',
      layout: 'cover',
      scene: 'es2Cover',
      lines: [],
      explain: [
        'Check the mission: the ten words. Say the hardest one together the Cairo way.',
        'Tell them: today the tongue stops peeking out between the teeth.',
      ],
    },
    {
      title: 'Remember?',
      station: 'spark',
      layout: 'concept',
      scene: 'es2Recall',
      lines: [
        'Last time: ق became a catch (\'ahwa) and ج became g (gamiil).',
        'Today: the sounds Fusha makes with the tongue between the teeth, ث and ذ.',
      ],
      say: [E('ahwa', 'قهوة'), E('gamiil', 'جميل')],
      explain: ['Two minutes. Ask for two ق words and two ج words, Cairo style.'],
    },
    {
      title: 'Gold for his mother',
      station: 'spark',
      layout: 'story',
      scene: 'es2Gold',
      lines: [
        'Adam wants to send his mother a gold ring. Amm Sayed takes him to a jeweller he trusts.',
        'Adam asks in careful Fusha. The jeweller answers fast, smiling.',
        'Then they bargain, and Adam does better than he expected.',
      ],
      explain: ['Ask: have you ever bargained in a shop? How does it start?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'es2Story',
      lines: [
        'Listen twice. What does Adam want? What is the first price?',
        'What does Adam say about the price?',
        'What does the jeweller call Adam, and what is the final price?',
      ],
      say: [
        F('story-1', 'أُرِيدُ خَاتَمًا مِنَ ٱلذَّهَبِ.', 'polite, careful'),
        E('story-2', 'دهب؟ عندنا دهب جميل. بتلات آلاف.', 'jeweller, inviting'),
        F('story-3', 'ثَلَاثَةُ آلَافٍ؟ هَذَا كَثِيرٌ!', 'surprised'),
        E('story-4', 'إنت ذكي يا أستاذ! خلاص، بألفين وتمنمية.', 'jeweller, laughing'),
        E('story-5', 'مبروك يا آدم! أمك هتفرح.', 'doorman, warm'),
      ],
      explain: [
        'Play the scene twice. Ask in English: what does Adam want? (a gold ring). First price? (three thousand).',
        'Then: what does the jeweller call him? (clever). Final price? (two thousand eight hundred).',
        'Ask: did the jeweller say "dhahab" like Adam?',
      ],
      teacherNote: 'Input first. The pairs ذهب / دهب and ثلاثة / تلات carry the lesson.',
    },
    {
      title: 'Th becomes t',
      station: 'zad',
      layout: 'concept',
      scene: 'es2Tha',
      lines: [
        'In Fusha, ث is said with the tongue between the teeth: thalaatha.',
        'In everyday Cairo words, the tongue stays inside and you hear t: تلاتة, talaata (three).',
        'So كثير is كتير (kitiir, a lot), and ثلج is تلج (talg, ice). Egyptians often even write them with ت.',
      ],
      vocab: [
        { arabic: 'تلاتة', translit: 'talaata', meaning: 'three (ثلاثة)' },
        { arabic: 'كتير', translit: 'kitiir', meaning: 'a lot, many (كثير)' },
        { arabic: 'تلج', translit: 'talg', meaning: 'ice (ثلج)' },
      ],
      say: [F('thalatha-f', 'ثَلَاثَةٌ'), E('talata', 'تلاتة'), E('kitir', 'كتير'), E('talg', 'تلج')],
      explain: [
        'Let the learner feel it: put a finger on the lips and say thalaatha (tongue touches the finger), then talaata (it does not).',
        'تلج also shows ج → g from Lesson 1: two shifts in one word.',
      ],
    },
    {
      title: 'Dh becomes d',
      station: 'zad',
      layout: 'concept',
      scene: 'es2Dhal',
      lines: [
        'The same thing happens to ذ: in everyday words it becomes d.',
        'ذهب → دهب, dahab (gold). ذيل → ديل, deel (tail).',
        'Look at jewellers\' signs in Cairo: many of them say دهب, the way people say it.',
      ],
      vocab: [
        { arabic: 'دهب', translit: 'dahab', meaning: 'gold (ذهب)' },
        { arabic: 'ديل', translit: 'deel', meaning: 'tail (ذيل)' },
      ],
      say: [F('dhahab-f', 'ذَهَبٌ'), E('dahab', 'دهب'), E('deel', 'ديل')],
      explain: ['ديل also shows ay → ee, which returns in Lesson 4. Just copy it today.'],
    },
    {
      title: 'Book words: s and z',
      station: 'zad',
      layout: 'concept',
      scene: 'es2Book',
      lines: [
        'But some words with ث and ذ become s and z instead.',
        'ثورة → sawra (revolution). مثلاً → masalan (for example). ذكي → zaki (clever): that is what the jeweller called Adam.',
        'These are "book" words: they came into everyday speech later, from reading, news and religion, and Egyptians said them with the nearest sound they had.',
      ],
      vocab: [
        { arabic: 'ثورة', translit: 'sawra', meaning: 'revolution' },
        { arabic: 'مثلاً', translit: 'masalan', meaning: 'for example' },
        { arabic: 'ذكي', translit: 'zaki', meaning: 'clever' },
      ],
      say: [E('sawra', 'ثورة'), E('masalan', 'مثلاً'), E('zaki', 'ذكي')],
      explain: [
        'Rule of thumb: old, homely words take t / d; learned words take s / z. It is a guide, not a law.',
        'Ask: which one would "three" be, everyday or book? (everyday: t).',
      ],
    },
    {
      title: 'And ظ?',
      station: 'zad',
      layout: 'concept',
      scene: 'es2Zha',
      lines: [
        'ظ follows the same two paths.',
        'Old everyday words: d. ظهر (back) is ضهر, dahr: "my back hurts" is ضهري واجعني.',
        'Book words: z. ظريف is zariif (charming, funny). ظابط, zaabit, a police officer.',
      ],
      vocab: [
        { arabic: 'ضهر', translit: 'dahr', meaning: 'back (ظهر)' },
        { arabic: 'ظريف', translit: 'zariif', meaning: 'charming, funny' },
      ],
      say: [E('dahr', 'ضهري واجعني.', 'tired, rubbing back'), E('zariif', 'ظريف')],
      explain: ['Do not drill ظ. One example of each path is enough for recognition.'],
    },
    {
      title: 'Two layers',
      station: 'zad',
      layout: 'concept',
      scene: 'es2Layers',
      lines: [
        'Picture Cairo Arabic as two layers, like the city itself.',
        'The old street layer took ث and ذ long ago and turned them into t and d.',
        'The newer book layer came in through schools and news, and turned them into s and z. Knowing which layer a word lives in tells you how to say it.',
      ],
      explain: [
        'Sort a few words aloud together: تلاتة (street), ثقافة (book: saqaafa), دهب (street), إذاعة (book: izaa\'a).',
        'This is the same pattern the learner saw with ق in Lesson 1: everyday changes, formal keeps or borrows.',
      ],
      teacherNote: 'The wow: one idea explains three letters and the q exceptions of Lesson 1. The learner can now guess, not just memorise.',
    },
    {
      title: 'Which sound?',
      station: 'athar',
      layout: 'game',
      scene: 'es2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Street word (t / d) or book word (s / z)?',
        bins: [
          { id: 'street', label: 't · d', hint: 'everyday street word' },
          { id: 'book', label: 's · z', hint: 'book word' },
        ],
        cards: [
          { label: 'ثلاثة', bin: 'street', why: 'talaata: an everyday number, t.' },
          { label: 'ذهب', bin: 'street', why: 'dahab: everyday, d.' },
          { label: 'ذكي', bin: 'book', why: 'zaki: a learned word, z.' },
          { label: 'ثورة', bin: 'book', why: 'sawra: from news and history, s.' },
          { label: 'كثير', bin: 'street', why: 'kitiir: everyday, t.' },
          { label: 'مثلاً', bin: 'book', why: 'masalan: a learned word, s.' },
        ],
      },
      explain: ['Ask the learner to say each word aloud the Cairo way before choosing. The result goes into your report.'],
    },
    {
      title: 'Your turn: bargain',
      station: 'athar',
      layout: 'question',
      scene: 'es2Talk',
      lines: [
        'Your teacher is the jeweller. Ask the price: ده بكام؟',
        'Answer every price with ده كتير! and bargain down to a price with تلاتة or تمانية in it.',
      ],
      say: [E('bikam', 'ده بكام؟', 'curious'), E('kitir-awi', 'ده كتير أوي!', 'shocked, playful')],
      interaction: { kind: 'ask', prompt: 'Did you say كتير with t, not th?', reveal: 'برافو! You bargained like a Cairene.' },
      explain: ['Play it with real numbers. Correct ث and ذ only; tamaniya / talaata should come out with t.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'es2Mission',
      lines: [
        'Find three Egyptian signs, menus or captions online where ث or ذ is written as ت or د.',
        'Bring one street word and one book word you heard this week.',
      ],
      interaction: { kind: 'choose', prompt: 'Where will you look?', options: ['Shop signs in photos of Cairo', 'Egyptian menus', 'Egyptian social media captions', 'A film or series'] },
      explain: ['Next time, sort their words into the two layers together.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'es2Next',
      lines: [
        'On the metro, Adam reads the station sign aloud in Fusha, every vowel in place.',
        'The announcement says it shorter, with the weight in a different place.',
        'Next time: short vowels and the Cairo stress, the music of the city.',
      ],
      say: [E('mahatta', 'المحطة الجاية: السادات.', 'metro announcer')],
      explain: ['End on the metro. Ask: where did the announcer put the weight in محطة?'],
    },
  ],
};
