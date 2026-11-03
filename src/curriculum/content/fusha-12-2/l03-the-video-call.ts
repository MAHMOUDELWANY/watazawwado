import type { Lesson } from '../../types';
import { lessonFT203TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-2.md (Lesson 3: the five nouns; 12+ theme: a
// family video call). Institute cast: Sara (her father أَبُو عُمَرَ, her little brother Omar), Yusuf, Ustadh Kareem. The
// three long vowels (u, a, i) with a following noun; حَمٌ and فَمٌ are named, ذُو is used. Every Arabic word fully diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFT203: Lesson = {
  subject: 'fusha-12-2',
  version: 'teens',
  subjectTitle: 'Fusha Arabic · 12+ · Level 2',
  number: 3,
  title: 'The Video Call',
  titleAr: 'مُكَالَمَةُ ٱلْفِيدْيُو',
  part: 'Level 2',
  minutes: 45,
  goal: 'By the end of this lesson, you will introduce a family and greet its members, using the five nouns in all three positions.',
  reviewed: false,
  teacherAr: lessonFT203TeacherAr,
  outcomes: [
    'Names the five nouns: أَبٌ، أَخٌ، حَمٌ، فَمٌ، ذُو.',
    'Uses ـُو، ـَا، ـِي when one of them is followed by another noun: أَبُو عُمَرَ، أَبَا عُمَرَ، أَبِي عُمَرَ.',
    'Links the three long vowels to the three short case vowels of every noun.',
    'Explains and uses a kunya, and uses ذُو for "having".',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'Three positions', page: 3 },
    { label: 'Names and ذُو', page: 8 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'The Video Call',
      station: 'spark',
      layout: 'cover',
      scene: 'fw3Cover',
      lines: [],
      explain: [
        'Check the timetable mission: read two sentences and check their front letters.',
        'Tell them: today Sara\'s family calls during the break, and five little nouns behave like no others.',
      ],
    },
    {
      title: 'Break time',
      station: 'spark',
      layout: 'story',
      scene: 'fw3Break',
      lines: [
        'Break time at the institute. Sara\'s phone rings: her family, on a video call from home.',
        'Yusuf is sitting next to her, so she turns the screen to introduce him.',
        'Listen to how they name each other. The same word ends in three different ways.',
      ],
      explain: ['Ask: how do you introduce a friend to your family? What do you call your friend\'s parents?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fw3Story',
      lines: [
        'Listen twice. Who are the two people on the screen?',
        'What does Sara\'s father call himself? And what does Yusuf call him back?',
        'At the end, what does Ustadh Kareem ask Sara to do?',
      ],
      say: [
        W('story-1', 'هَذَا أَبِي، وَهَذَا أَخِي ٱلصَّغِيرُ عُمَرُ.', 'young woman, introducing'),
        W('story-2', 'أَهْلًا يَا يُوسُفُ! أَنَا أَبُو عُمَرَ.', 'father, warm'),
        W('story-3', 'تَشَرَّفْنَا يَا أَبَا عُمَرَ!', 'young man, polite'),
        W('story-4', 'وَأَنَا أَخُو سَارَةَ!', 'little boy, excited'),
        W('story-5', 'سَلِّمِي عَلَى أَبِي عُمَرَ يَا سَارَةُ.', 'teacher, kind'),
        W('story-6', 'إِنْ شَاءَ ٱللَّهُ، يَا أُسْتَاذُ.', 'young woman'),
      ],
      explain: [
        'Play the scene twice. Ask in English: who is on the screen? (Sara\'s father and little brother Omar). What does the father call himself? (Abu Omar).',
        'Then: write the three forms the learner heard on the board: أَبُو عُمَرَ، أَبَا عُمَرَ، أَبِي عُمَرَ. Same person, three endings. Why?',
      ],
      teacherNote: 'Input first. Let the learner find the three endings on their own before the next page names them.',
    },
    {
      title: 'Five special nouns',
      station: 'zad',
      layout: 'concept',
      scene: 'fw3Five',
      lines: [
        'Five nouns have a habit no other noun has: أَبٌ (father), أَخٌ (brother), حَمٌ (father-in-law), فَمٌ (mouth), ذُو (having).',
        'Alone, they are ordinary: أَبٌ، أَخٌ. With "my", they are ordinary too: أَبِي، أَخِي.',
        'But when another noun follows them, they grow a long vowel at the end: أَبُو عُمَرَ.',
      ],
      vocab: [
        { arabic: 'حَمٌ', translit: 'ḥam', meaning: 'father-in-law (of a wife)' },
        { arabic: 'فَمٌ', translit: 'fam', meaning: 'mouth' },
        { arabic: 'ذُو', translit: 'dhū', meaning: 'having, the one with' },
      ],
      say: [W('ab', 'أَبٌ'), W('akh', 'أَخٌ'), W('ham', 'حَمٌ'), W('fam', 'فَمٌ'), W('dhu', 'ذُو'), W('abu-umar', 'أَبُو عُمَرَ')],
      explain: [
        'In daily speech you will mostly meet أَبٌ، أَخٌ and ذُو this way. حَمٌ is rare; فَمٌ usually stays فَمُ.',
        'Ask the learner to say what happens in three cases: alone, with "my", with a name after.',
      ],
    },
    {
      title: 'The long u',
      station: 'zad',
      layout: 'concept',
      scene: 'fw3U',
      lines: [
        'When the noun is the one doing, or what a sentence is about, it ends in a long u.',
        'أَنَا أَبُو عُمَرَ. جَاءَ أَبُو عُمَرَ. هَذَا أَخُو سَارَةَ.',
        'This is the form you will see most: in names, in introductions, in news.',
      ],
      say: [W('jaa-abu-umar', 'جَاءَ أَبُو عُمَرَ.'), W('akhu-sarah', 'هَذَا أَخُو سَارَةَ.')],
      explain: ['Point out that after هَذَا, after أَنَا, and as the doer after a verb, it is ـُو.'],
    },
    {
      title: 'The long a',
      station: 'zad',
      layout: 'concept',
      scene: 'fw3A',
      lines: [
        'When something is done to the noun, it ends in a long a: رَأَيْتُ أَبَا عُمَرَ, I saw Abu Omar.',
        'And when you call someone with يَا: يَا أَبَا عُمَرَ. That is what Yusuf said.',
        'The person is the same. His job in the sentence changed, so the ending changed.',
      ],
      say: [W('raaytu-aba-umar', 'رَأَيْتُ أَبَا عُمَرَ.'), W('ya-aba-umar', 'يَا أَبَا عُمَرَ!', 'calling, polite')],
      explain: ['Ask: in رَأَيْتُ أَبَا عُمَرَ, who did the seeing? (I). Who was seen? (Abu Omar). The one seen takes ـَا.'],
    },
    {
      title: 'The long i',
      station: 'zad',
      layout: 'concept',
      scene: 'fw3I',
      lines: [
        'After a little word like فِي، مِنْ، إِلَى، عَلَى، مَعَ, it ends in a long i: سَلِّمِي عَلَى أَبِي عُمَرَ.',
        'And after another noun that owns it: بَيْتُ أَخِي سَارَةَ, the house of Sara\'s brother.',
        'Watch out: أَبِي can also be "my father". If a noun follows, it is the long i; if not, it is "my".',
      ],
      say: [W('ala-abi-umar', 'سَلِّمِي عَلَى أَبِي عُمَرَ.'), W('baytu-akhi-sarah', 'بَيْتُ أَخِي سَارَةَ')],
      explain: [
        'Contrast on the board: أَبِي (my father) and أَبِي عُمَرَ (Abu Omar, after a little word).',
        'The learner has now heard all three forms from the dialogue.',
      ],
    },
    {
      title: 'Three jobs, three vowels',
      station: 'zad',
      layout: 'concept',
      scene: 'fw3Jobs',
      lines: [
        'Line up the three: ـُو for the doer, ـَا for the one done to, ـِي after a little word or an owner.',
        'Now look at any ordinary noun: ٱلْوَلَدُ، ٱلْوَلَدَ، ٱلْوَلَدِ. The same three jobs, with short vowels.',
        'The five nouns just say it out loud, with long vowels. Learn them, and the whole case system has a voice.',
      ],
      say: [W('al-waladu', 'ٱلْوَلَدُ'), W('al-walada', 'ٱلْوَلَدَ'), W('al-waladi', 'ٱلْوَلَدِ')],
      explain: [
        'Read the two columns across: أَبُو / ٱلْوَلَدُ, أَبَا / ٱلْوَلَدَ, أَبِي / ٱلْوَلَدِ.',
        'This is a preview; case endings are taught in depth later. Today the learner only needs to see the match.',
      ],
      teacherNote: 'The wow: five odd nouns turn out to be the clearest window into Arabic case endings.',
    },
    {
      title: 'Kunyas and ذُو',
      station: 'zad',
      layout: 'concept',
      scene: 'fw3Kunya',
      lines: [
        'Sara\'s father is called أَبُو عُمَرَ after his first son. That name of respect is a kunya.',
        'Some kunyas became famous names: the Companion known as أَبُو هُرَيْرَةَ, "father of the little cat". Reports say it came from a kitten he kept.',
        'And ذُو means "having": رَجُلٌ ذُو عِلْمٍ, a man of knowledge. It changes like the others: ذَا، ذِي.',
      ],
      vocab: [
        { arabic: 'كُنْيَةٌ', translit: 'kunyah', meaning: 'a name like أَبُو / أُمُّ + a child\'s name' },
        { arabic: 'رَجُلٌ ذُو عِلْمٍ', translit: 'rajulun dhū ʿilm', meaning: 'a man of knowledge' },
      ],
      say: [W('abu-hurayra', 'أَبُو هُرَيْرَةَ', 'warm'), W('dhu-ilm', 'رَجُلٌ ذُو عِلْمٍ.')],
      explain: [
        'Ask the learner to build their own kunya (or a parent\'s): أَبُو / أُمُّ + the eldest child\'s name, or a name they like.',
        'Abu Hurayrah\'s kunya comes from a kitten he carried; mention it briefly as the language point, not as a history lesson.',
      ],
    },
    {
      title: 'Which ending?',
      station: 'athar',
      layout: 'game',
      scene: 'fw3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'What is the noun\'s job? Choose its ending.',
        look: 'row',
        bins: [
          { id: 'u', label: 'ـُو', hint: 'doer / about' },
          { id: 'a', label: 'ـَا', hint: 'done to / يَا' },
          { id: 'i', label: 'ـِي', hint: 'after a little word' },
        ],
        cards: [
          { label: 'هَذَا ___ عُمَرَ.', bin: 'u', why: 'After هَذَا, what the sentence is about: أَبُو عُمَرَ.' },
          { label: 'رَأَيْتُ ___ سَارَةَ فِي ٱلسُّوقِ.', bin: 'a', why: 'He was seen: أَخَا سَارَةَ.' },
          { label: 'ذَهَبْتُ إِلَى بَيْتِ ___ عُمَرَ.', bin: 'i', why: 'After the owner بَيْتِ: أَبِي عُمَرَ.' },
          { label: 'يَا ___ عُمَرَ، كَيْفَ حَالُكَ؟', bin: 'a', why: 'A call with يَا: أَبَا عُمَرَ.' },
          { label: 'جَلَسْتُ مَعَ ___ سَارَةَ.', bin: 'i', why: 'After مَعَ: أَخِي سَارَةَ.' },
          { label: 'جَاءَ ___ عُمَرَ.', bin: 'u', why: 'He is the doer: أَبُو عُمَرَ.' },
        ],
      },
      explain: ['Ask the learner to say the full word aloud for each card (أَبُو، أَخَا، أَبِي...). The result goes into your report.'],
    },
    {
      title: 'Your turn: introductions',
      station: 'athar',
      layout: 'question',
      scene: 'fw3Talk',
      lines: [
        'Introduce two people from your family to your teacher: هَذَا أَبِي، وَهُوَ أَبُو...',
        'Your teacher plays your father on a call. Greet him with his kunya: أَهْلًا يَا أَبَا...',
      ],
      say: [W('ahlan-ya-aba', 'أَهْلًا يَا أَبَا عُمَرَ!', 'warm greeting')],
      interaction: { kind: 'ask', prompt: 'Did you use أَبُو and أَبَا in the right places?', reveal: 'مُمْتَازٌ! A proper Arabic introduction.' },
      explain: ['If the learner prefers not to talk about their own family, they introduce Sara\'s instead.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fw3Mission',
      lines: [
        'Write four sentences about a family you know, with one five-noun in each.',
        'Use all three endings at least once: أَبُو… رَأَيْتُ أَبَا… مَعَ أَبِي…',
      ],
      interaction: { kind: 'choose', prompt: 'Whose family will you write about?', options: ['My own', 'A friend\'s', 'Sara\'s family', 'A family from a story'] },
      explain: ['Next time, read the four sentences together and name the job of each five-noun.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fw3Next',
      lines: [
        'Exam week. Ustadh Kareem asks Yusuf: هَلْ دَرَسْتَ؟',
        'Yusuf has three ways to say no: لَا أَدْرُسُ، مَا دَرَسْتُ، لَمْ أَدْرُسْ. Which one is the honest one?',
        'Next time: three kinds of "not", and what each one really says.',
      ],
      say: [W('lam-adrus', 'لَمْ أَدْرُسْ… بَعْدُ!', 'young man, guilty')],
      explain: ['End on the three "no"s. Ask the learner to guess the difference before next lesson.'],
    },
  ],
};
