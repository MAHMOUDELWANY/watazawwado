import type { Lesson } from '../../types';
import { lessonES01TeacherAr } from './l01-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP-sounds.md (Lesson 1: ق → ء and ج → g;
// scope from Egyptian Colloquial, our own scenes). Adults cast (Adam, Amm Sayed, Mona). Adam's Fusha lines play in the
// Fusha clone; every Egyptian line is recorded by the owner (eg).

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });
const F = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonES01: Lesson = {
  subject: 'egyptian-sounds',
  version: 'adults',
  subjectTitle: 'Egyptian Arabic · Sounds',
  number: 1,
  title: 'Where Did the Qaf Go?',
  titleAr: 'القاف راحت فين؟',
  part: 'Sounds',
  minutes: 50,
  goal: 'By the end of this lesson, you will hear and say the two Cairo sounds that change half your Fusha vocabulary: ق as a catch, ج as g.',
  reviewed: false,
  teacherAr: lessonES01TeacherAr,
  outcomes: [
    'Hears ق said as a glottal catch in Cairo: قهوة = \'ahwa, قلب = \'alb.',
    'Hears ج said as a hard g: جميل = gamiil, جديد = gidiid.',
    'Predicts the Cairo form of a Fusha word with ق or ج before hearing it.',
    'Knows the words that keep q: the Quran and formal words.',
  ],
  chapters: [
    { label: 'Lost in Cairo', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'The qaf', page: 3 },
    { label: 'The jiim', page: 6 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Where Did the Qaf Go?',
      station: 'spark',
      layout: 'cover',
      scene: 'es1Cover',
      lines: [],
      explain: [
        'Ask the learner in Fusha: كَيْفَ حَالُكَ؟ Then in Egyptian: إزيّك؟ Which one did they understand faster?',
        'Tell them: this course takes the Fusha they know and gives it a Cairo accent, one sound at a time.',
      ],
    },
    {
      title: 'Fluent in Fusha, lost in Cairo',
      station: 'spark',
      layout: 'story',
      scene: 'es1Lost',
      lines: [
        'Adam studied Fusha in London for two years. He can read a newspaper and follow a lecture.',
        'He lands in Cairo, walks into a coffee shop and orders in perfect Fusha. The waiter grins.',
        'Everyone understands Adam. Adam understands almost nobody. Two sounds are to blame.',
      ],
      explain: ['Ask: have you ever understood a language in a book but not in the street? What made the difference?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'es1Story',
      lines: [
        'Listen twice. What does Adam order? What does the waiter say back?',
        'Adam asks for something else. Where does the waiter send him?',
        'What does Amm Sayed say about Adam\'s Arabic?',
      ],
      say: [
        F('story-1', 'أُرِيدُ قَهْوَةً، مِنْ فَضْلِكَ.', 'polite, careful, like a textbook'),
        E('story-2', 'قهوة؟ حاضر يا باشا!', 'waiter, cheerful'),
        F('story-3', 'وَأُرِيدُ قَلَمًا أَيْضًا.', 'polite, careful'),
        E('story-4', 'قلم؟ عندك الكشك اللي جنبنا.', 'waiter, pointing'),
        E('story-5', 'يا آدم، إنت بتتكلم زي الكتاب! جميل!', 'doorman, laughing warmly'),
      ],
      explain: [
        'Play the scene twice. Ask in English: what did Adam order? (coffee). What did the waiter say? (coffee? right away!).',
        'Then: where is the pen? (the kiosk next door). Sayed: "you speak like a book, lovely!"',
        'Ask: did you hear قهوة the same way twice? Let the learner find the difference before you name it.',
      ],
      teacherNote: 'Input first. The pair Adam / waiter is the whole lesson: the same word in two accents.',
    },
    {
      title: 'The qaf takes a breath',
      station: 'zad',
      layout: 'concept',
      scene: 'es1Qaf',
      lines: [
        'In Fusha, ق is made at the very back of the mouth: qahwa.',
        'In Cairo, the tongue lets go and you hear a small catch in the throat, like the break in "uh-oh": \'ahwa.',
        'It is still written ق. Egyptians read قهوة and say \'ahwa.',
      ],
      vocab: [
        { arabic: 'قهوة', translit: '\'ahwa', meaning: 'coffee; a coffee shop' },
        { arabic: 'قلم', translit: '\'alam', meaning: 'pen' },
      ],
      say: [F('qahwa-f', 'قَهْوَةٌ'), E('ahwa-e', 'قهوة', 'clear'), F('qalam-f', 'قَلَمٌ'), E('alam-e', 'قلم', 'clear')],
      explain: [
        'Say "uh-oh" slowly with the learner. The break in the middle is the Cairo ق (and the hamza).',
        'Play each pair: Fusha, then Egyptian. The learner repeats only the Egyptian one.',
      ],
    },
    {
      title: 'Guess before you hear',
      station: 'zad',
      layout: 'concept',
      scene: 'es1Guess',
      lines: [
        'Now you try. Say each word the Cairo way before you tap it.',
        'قلب → \'alb (heart). قال → \'aal (he said). فوق → foo\' (above).',
        'سوق → suu\' (market). صديق → sadii\' (friend). Every ق you know just got a twin.',
      ],
      vocab: [
        { arabic: 'قلب', translit: '\'alb', meaning: 'heart' },
        { arabic: 'قال', translit: '\'aal', meaning: 'he said' },
        { arabic: 'فوق', translit: 'foo\'', meaning: 'above, upstairs' },
        { arabic: 'سوق', translit: 'suu\'', meaning: 'market' },
        { arabic: 'صديق', translit: 'sadii\'', meaning: 'friend' },
      ],
      say: [E('alb', 'قلب'), E('aal', 'قال'), E('foo', 'فوق'), E('suu', 'سوق'), E('sadii', 'صديق')],
      explain: [
        'Cover the transliteration and let the learner predict. Then tap to check.',
        'فوق also shows a vowel change (oo). It returns in Lesson 4; just copy it today.',
      ],
    },
    {
      title: 'Where the q stays',
      station: 'zad',
      layout: 'concept',
      scene: 'es1Keep',
      lines: [
        'Some words keep the Fusha q, even in Cairo.',
        'The Quran always keeps it: القرآن is il-qur\'aan, and every recitation keeps every ق.',
        'Many formal and news words keep it too: القضية, il-qadiyya, the issue. When in doubt, the everyday word changes and the formal one stays.',
      ],
      vocab: [
        { arabic: 'القرآن', translit: 'il-qur\'aan', meaning: 'the Quran (q kept)' },
        { arabic: 'القضية', translit: 'il-qadiyya', meaning: 'the issue, the case (formal, q kept)' },
      ],
      say: [E('quraan', 'القرآن'), E('qadiyya', 'القضية')],
      explain: [
        'Make it clear: in the Quran nothing changes. This lesson is about everyday speech only.',
        'Some words go both ways depending on the speaker. Do not drill exceptions; the learner will hear them.',
      ],
    },
    {
      title: 'The Cairo g',
      station: 'zad',
      layout: 'concept',
      scene: 'es1Jim',
      lines: [
        'The second sound: Fusha ج (j) is a hard g in Cairo, like "go".',
        'جميل → gamiil (lovely). جنب → gamb (next to). Amm Sayed and the waiter both used it.',
        'جديد → gidiid (new). جامعة → gam\'a (university). Again: same letter, new sound.',
      ],
      vocab: [
        { arabic: 'جميل', translit: 'gamiil', meaning: 'lovely, beautiful' },
        { arabic: 'جنب', translit: 'gamb', meaning: 'next to' },
        { arabic: 'جديد', translit: 'gidiid', meaning: 'new' },
        { arabic: 'جامعة', translit: 'gam\'a', meaning: 'university' },
      ],
      say: [F('jamil-f', 'جَمِيلٌ'), E('gamiil', 'جميل'), E('gamb', 'جنب'), E('gidiid', 'جديد'), E('gama', 'جامعة')],
      explain: [
        'The Quran keeps j here too. In Egyptian recitation you will hear j for ج.',
        'Learners from the Gulf or the Levant may say j or zh; Cairo says g. Both are Arabic; we are learning Cairo.',
      ],
    },
    {
      title: 'Two sounds, a thousand words',
      station: 'zad',
      layout: 'concept',
      scene: 'es1Thousand',
      lines: [
        'Think about how many words you know with ق or ج: hundreds.',
        'You do not need to learn them again. You only switch two sounds, and your Fusha starts to sound like Cairo.',
        'That is the secret of this course: small rules, huge returns.',
      ],
      explain: [
        'Ask the learner for five Fusha words with ق or ج from memory. Say each the Cairo way together.',
        'Celebrate: they just "learnt" five Egyptian words in a minute.',
      ],
      teacherNote: 'The wow of the lesson: the learner\'s Fusha is an asset. Two switches unlock a large part of their vocabulary.',
    },
    {
      title: 'A real sentence',
      station: 'zad',
      layout: 'concept',
      scene: 'es1Sentence',
      lines: [
        'Hear both sounds in one Cairo sentence: أنا عايز أقعد في القهوة اللي جنب الجامعة.',
        'I want to sit in the coffee shop next to the university.',
        'Count them: ق three times as a catch, ج twice as g.',
      ],
      say: [E('sentence', 'أنا عايز أقعد في القهوة اللي جنب الجامعة.', 'relaxed, natural speed')],
      explain: ['Play it twice: first count the ق, then the ج. Then the learner says it, slowly, then at speed.'],
    },
    {
      title: 'Which Cairo sound?',
      station: 'athar',
      layout: 'game',
      scene: 'es1Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'How does Cairo say this word?',
        bins: [
          { id: 'catch', label: 'ء', hint: 'ق becomes a catch' },
          { id: 'g', label: 'g', hint: 'ج becomes g' },
          { id: 'keep', label: 'q', hint: 'keeps the q' },
        ],
        cards: [
          { label: 'قلب', bin: 'catch', why: '\'alb: the everyday ق becomes a catch.' },
          { label: 'جديد', bin: 'g', why: 'gidiid: ج is a hard g in Cairo.' },
          { label: 'القرآن', bin: 'keep', why: 'il-qur\'aan: the Quran keeps its q.' },
          { label: 'سوق', bin: 'catch', why: 'suu\': the everyday ق becomes a catch.' },
          { label: 'جامعة', bin: 'g', why: 'gam\'a: ج is a hard g.' },
          { label: 'قهوة', bin: 'catch', why: '\'ahwa: the most famous Cairo catch.' },
        ],
      },
      explain: ['Ask the learner to say each word aloud the Cairo way before dropping it. The result goes into your report.'],
    },
    {
      title: 'Your turn: the coffee shop',
      station: 'athar',
      layout: 'question',
      scene: 'es1Talk',
      lines: [
        'Your teacher is the waiter. Order a coffee the Cairo way: واحد قهوة، لو سمحت.',
        'Then ask where something is: فين الكشك؟ فين الجامعة؟ Listen for the answer with جنب.',
      ],
      say: [E('wahid-ahwa', 'واحد قهوة، لو سمحت.', 'friendly'), E('fen-gama', 'فين الجامعة؟', 'asking')],
      interaction: { kind: 'ask', prompt: 'Did every ق come out as a catch and every ج as g?', reveal: 'برافو! You sound like Cairo now.' },
      explain: ['Answer in Egyptian with جنب and قريّب. Correct the two sounds only; leave other mistakes for later lessons.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'es1Mission',
      lines: [
        'Make a list of ten Fusha words you already know with ق or ج.',
        'Say each one aloud the Cairo way, every day this week. Bring the hardest one next time.',
      ],
      interaction: { kind: 'choose', prompt: 'Where will you find your ten words?', options: ['My Fusha notes', 'My Fusha textbook', 'Street signs and menus', 'My head, right now'] },
      explain: ['Next time, check the list together. Watch for words that should keep the q.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'es1Next',
      lines: [
        'Adam wants a gold ring for his mother. At the jeweller\'s he says ذَهَب, with the tongue between his teeth.',
        'The jeweller answers: دهب؟ عندنا دهب جميل! Dahab. Where did the "th" go?',
        'Next time: ث and ذ, and how Cairo files them down.',
      ],
      say: [F('dhahab-f', 'ذَهَبٌ'), E('dahab-e', 'دهب؟ عندنا دهب جميل!', 'jeweller, inviting')],
      explain: ['End on the two golds. Ask: what happened to the tongue between the teeth?'],
    },
  ],
};
