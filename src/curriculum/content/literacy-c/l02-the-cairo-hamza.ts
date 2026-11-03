import type { Lesson } from '../../types';
import { lessonC02TeacherAr } from './l02-teacher-ar.js';

// Rules and spelling: docs/curriculum/franco/RULES.md. Map: docs/curriculum/franco/MAP.md (Lesson 2: 2 for ء and for
// Cairo's ق; the article el). Words play on tap in the Mahmoud Egyptian clone; the single sound is the owner's own.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });
const O = (id: string, text: string) => ({ id, text, voice: 'owner' as const, emotion: 'clear, slow, twice' });

export const lessonC02: Lesson = {
  subject: 'literacy-c',
  version: 'adults',
  subjectTitle: 'Reading Franco',
  number: 2,
  title: 'The Cairo Hamza',
  titleAr: 'الهمزة القاهرية',
  part: 'Reading Franco',
  minutes: 50,
  goal: 'By the end of this lesson, you will read every 2 in a message, know when it hides a q, and read the article el.',
  reviewed: false,
  teacherAr: lessonC02TeacherAr,
  outcomes: [
    'Says the 2 sound: the little stop in the throat, as in "uh-oh".',
    'Knows that Cairo says 2 where Fusha says q: 2alb (قلب), 2ahwa (قهوة).',
    'Tells 2alb (heart) from kalb (dog), and 2alam (pen) from 3alam (flag).',
    'Reads the article el, always written apart: el beet, el 2ahwa.',
  ],
  chapters: [
    { label: 'The message', page: 0 },
    { label: 'The stop', page: 2 },
    { label: 'Cairo\'s q', page: 3 },
    { label: 'el', page: 5 },
    { label: 'Read it', page: 6 },
    { label: 'Reply', page: 8 },
    { label: 'My mission', page: 9 },
  ],
  pages: [
    {
      title: 'The Cairo Hamza',
      station: 'spark',
      layout: 'cover',
      scene: 'lc2Cover',
      lines: [],
      explain: [
        'Ask about the mission: which three words with 3 or 7 did the learner find, and where?',
        'Read them together. Praise every one; they are now reading real Franco.',
      ],
    },
    {
      title: 'A 2 in the middle',
      station: 'spark',
      layout: 'story',
      scene: 'lc2Message',
      lines: [
        'Tant Hoda writes again. She wants to meet you.',
        'You can read most of it now: 3ala, el. But what is the 2 doing in ne2ablak?',
        'And there is another 2 at the start of 2ahwa.',
      ],
      say: [E('msg-2', 'نقابلك بكرة على القهوة؟', 'warm, inviting, an aunt to her nephew')],
      explain: [
        'Let the learner read the message aloud as far as they can. They know 3ala from last time.',
        'Do not explain 2 yet. Ask: what do you think the 2 sounds like?',
      ],
    },
    {
      title: '2: the little stop',
      station: 'zad',
      layout: 'concept',
      scene: 'lc2Stop',
      lines: [
        'Say "uh-oh". Feel the tiny stop in your throat between uh and oh?',
        'That stop is the hamza, ء. Franco writes it 2, because 2 looks like ء.',
        'so2al is a question. sa2al is "he asked". The 2 is the stop in the middle.',
      ],
      items: ['so2al: a question', 'sa2al: he asked', 'mas2ala: a matter'],
      vocab: [
        { arabic: 'سؤال', translit: 'so2al', meaning: 'a question' },
        { arabic: 'سأل', translit: 'sa2al', meaning: 'he asked' },
        { arabic: 'مسألة', translit: 'mas2ala', meaning: 'a matter, an issue' },
      ],
      say: [O('sound-2', 'ء'), E('so2al', 'سؤال'), E('sa2al', 'سأل'), E('mas2ala', 'مسألة')],
      explain: [
        'Say uh-oh slowly with the learner, then so-2al. The stop is the same.',
        'The 2 looks like ء written fast: that is why Egyptians chose it.',
      ],
    },
    {
      title: 'Where Cairo swallows the q',
      station: 'zad',
      layout: 'concept',
      scene: 'lc2Qaf',
      lines: [
        'Fusha has a deep q, ق. Cairo drops it and says the stop instead.',
        'قلب, heart: Fusha qalb, Cairo 2alb. قهوة, coffee: Cairo 2ahwa.',
        'So a 2 in Franco is often a ق in Arabic: 2alam (pen), 2oul (say), ne2ablak (we meet you).',
        'Religious and formal words keep the q: Qur2an, qibla.',
      ],
      items: ['2alb: heart (قلب)', '2ahwa: coffee (قهوة)', '2alam: pen (قلم)', '2oul: say (قول)'],
      vocab: [
        { arabic: 'قلب', translit: '2alb', meaning: 'heart' },
        { arabic: 'قهوة', translit: '2ahwa', meaning: 'coffee; also a café' },
        { arabic: 'قلم', translit: '2alam', meaning: 'pen' },
        { arabic: 'قول', translit: '2oul', meaning: 'say! (to a man)' },
        { arabic: 'القرآن', translit: 'el Qur2an', meaning: 'the Quran (keeps its q)' },
      ],
      say: [E('2alb', 'قلب'), E('2ahwa', 'قهوة'), E('2alam', 'قلم'), E('2oul', 'قول'), E('el-quran', 'القرآن', 'respectful')],
      explain: [
        'This is the most useful fact of the lesson: a 2 in Franco often means ق.',
        'Qur2an has both: q for the ق (kept, it is a religious word) and 2 for the hamza. Ask the learner to find each one.',
      ],
      teacherNote: 'Many heritage learners already say 2alb at home and qalb in the Quran. Tell them both are right, each in its place.',
    },
    {
      title: 'One stop, a new word',
      station: 'zad',
      layout: 'concept',
      scene: 'lc2Pairs',
      lines: [
        '2alb is a heart. kalb is a dog. Do not mix them up in a message!',
        '2alam is a pen. 3alam is a flag. The 2 and the 3 are different sounds.',
      ],
      items: ['2alb: heart ↔ kalb: dog', '2alam: pen ↔ 3alam: flag'],
      vocab: [
        { arabic: 'كلب', translit: 'kalb', meaning: 'dog' },
        { arabic: 'علم', translit: '3alam', meaning: 'flag' },
      ],
      say: [E('2alb', 'قلب'), E('kalb', 'كلب'), E('2alam', 'قلم'), E('3alam', 'علم')],
      explain: ['Play each pair twice. Then say one word and let the learner point. The heart and the dog always get a laugh.'],
    },
    {
      title: 'el: the',
      station: 'zad',
      layout: 'concept',
      scene: 'lc2El',
      lines: [
        'In Tant Hoda\'s message: el 2ahwa, the coffee. el means "the".',
        'It is always written el, and always apart from the word: el beet, el bab, el 2alb.',
        'Sometimes you hear it change, like esh-shams for el shams. Franco still writes el.',
      ],
      items: ['el beet: the house', 'el bab: the door', 'el 2ahwa: the coffee', 'el shams: the sun'],
      vocab: [
        { arabic: 'البيت', translit: 'el beet', meaning: 'the house, home' },
        { arabic: 'الباب', translit: 'el bab', meaning: 'the door' },
        { arabic: 'القهوة', translit: 'el 2ahwa', meaning: 'the coffee, the café' },
        { arabic: 'الشمس', translit: 'el shams', meaning: 'the sun (said esh-shams)' },
      ],
      say: [E('el-beet', 'البيت'), E('el-bab', 'الباب'), E('el-2ahwa', 'القهوة'), E('el-shams', 'الشمس')],
      explain: [
        'One spelling, many sounds: let the learner hear el shams said esh-shams, but write el.',
        'el beet also means "home": rayeh el beet = going home.',
      ],
    },
    {
      title: 'Read Tant Hoda\'s message',
      station: 'athar',
      layout: 'question',
      scene: 'lc2Read',
      lines: ['Read the whole message aloud. Then tap every word with a 2.'],
      say: [E('msg-2', 'نقابلك بكرة على القهوة؟', 'warm, inviting, an aunt to her nephew')],
      interaction: {
        kind: 'clues',
        prompt: 'ne2ablak bokra 3ala el 2ahwa? Which words have a 2?',
        clues: [
          { label: 'ne2ablak', correct: true },
          { label: '2ahwa', correct: true },
          { label: 'bokra', correct: false },
          { label: '3ala', correct: false },
          { label: 'el', correct: false },
        ],
      },
      explain: [
        'Meaning: Shall we meet tomorrow, over coffee? bokra = tomorrow.',
        'Both 2s here are Cairo\'s ق: نقابلك، القهوة.',
      ],
    },
    {
      title: 'A stop or a swallowed q?',
      station: 'athar',
      layout: 'game',
      scene: 'lc2Review',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Each word has a 2. Is it a real hamza (ء) or Cairo\'s q (ق)?',
        bins: [
          { id: 'hamza', label: 'ء', hint: 'a real stop' },
          { id: 'qaf', label: 'ق', hint: 'Cairo\'s q' },
        ],
        cards: [
          { label: '2alb (heart)', bin: 'qaf', why: 'قلب: Fusha says qalb, Cairo 2alb.' },
          { label: 'so2al (a question)', bin: 'hamza', why: 'سؤال: a real hamza.' },
          { label: '2ahwa (coffee)', bin: 'qaf', why: 'قهوة: Cairo\'s q.' },
          { label: 'sa2al (he asked)', bin: 'hamza', why: 'سأل: a real hamza.' },
          { label: '2alam (pen)', bin: 'qaf', why: 'قلم: Cairo\'s q.' },
          { label: 'mas2ala (a matter)', bin: 'hamza', why: 'مسألة: a real hamza.' },
          { label: 'ne2ablak (we meet you)', bin: 'qaf', why: 'نقابلك: Cairo\'s q.' },
        ],
      },
      explain: ['A short review, no points. The learner says each word aloud before choosing.'],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Write back',
      station: 'athar',
      layout: 'question',
      scene: 'lc2Reply',
      lines: [
        'Say yes to Tant Hoda, and ask what time.',
        'aywa means yes. akeed means of course. el sa3a kam? means what time?',
      ],
      vocab: [
        { arabic: 'أيوه', translit: 'aywa', meaning: 'yes' },
        { arabic: 'أكيد', translit: 'akeed', meaning: 'of course, sure' },
        { arabic: 'الساعة كام؟', translit: 'el sa3a kam?', meaning: 'what time?' },
      ],
      say: [E('reply-2', 'أيوه، أكيد! الساعة كام؟', 'happy, eager')],
      interaction: { kind: 'ask', prompt: 'Write your reply. Did you write el apart, and use a 3?', reveal: 'aywa, akeed! el sa3a kam? Tant Hoda will be delighted.' },
      explain: ['Let the learner write it without looking, then compare. akeed starts with a vowel: no 2 is written at the start of a word.'],
      teacherNote: 'A hamza at the very start of a word is not written in Franco: akeed, ana, enta. Only a stop inside a word gets a 2.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'lc2Mission',
      lines: [
        'Find three words with a 2 in real messages or comments.',
        'For each one, guess: a real stop, or Cairo\'s q?',
      ],
      interaction: { kind: 'choose', prompt: 'Where will you look?', options: ['A family group', 'Comments under Egyptian videos', 'A café or shop page', 'Song titles'] },
      explain: ['Check the three words together at the start of the next lesson.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'lc2Next',
      lines: [
        'Tant Hoda answers fast: 5alas, el sa3a 5amsa!',
        'A new number: 5. And it is not five o\'clock that it means.',
        'Next time: 5, gh, sh, and the Cairo g.',
      ],
      say: [E('5alas', 'خلاص، الساعة خمسة!', 'decided, cheerful')],
      explain: ['End on the 5. Let the learner guess what sound it might stand for.'],
    },
  ],
};
