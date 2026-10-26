import type { Lesson } from '../../types';
import { lessonT01TeacherAr } from './l01-teacher-ar.js';

// Rules: docs/curriculum/tajweed/RULES.md. Map: docs/curriculum/tajweed/MAP.md. Brief and evidence log:
// docs/curriculum/tajweed/L01-every-letter-has-a-right.md.
// Ayat: Tanzil Uthmani Hafs through the Quran connector (2026-10-26), unchanged; audio streams from Husary (muallim).
// Hadith: Sahih Muslim 798 (also al-Bukhari 4937), checked on Dorar 2026-10-26: sahih. English meanings are ours.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });

export const lessonT01: Lesson = {
  subject: 'tajweed',
  version: 'adults',
  subjectTitle: 'Tajweed · Level 1',
  number: 1,
  title: 'Every Letter Has a Right',
  titleAr: 'لكلّ حرفٍ حقّه',
  part: 'Level 1',
  minutes: 45,
  goal: 'By the end of this lesson, you will know what tajweed is and why it matters, tell a clear mistake from a hidden one, and begin your recitation the right way.',
  reviewed: false,
  teacherAr: lessonT01TeacherAr,
  outcomes: [
    'Explains tajweed as giving each letter its right and its due.',
    'Knows the command to recite with tarteel (73:4).',
    'Tells a clear mistake (it can change the meaning) from a hidden one (a rule is missed).',
    'Says the isti\'adha before reciting and the basmalah at the start of a surah, and knows the one surah without it.',
    'Recites Al-Ikhlas to the teacher with no clear mistakes.',
  ],
  chapters: [
    { label: 'Why it matters', page: 0 },
    { label: 'Tarteel', page: 2 },
    { label: 'Two kinds of mistakes', page: 5 },
    { label: 'The layers', page: 6 },
    { label: 'How to begin', page: 7 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Every Letter Has a Right',
      station: 'spark',
      layout: 'cover',
      scene: 'tj1Cover',
      lines: [],
      explain: [
        'Welcome the learner. Ask them to recite Al-Ikhlas once, as they normally do. Do not correct anything yet: just listen.',
        'Tell them: by the end of this level, you will hear things in this surah you never noticed before.',
      ],
      teacherNote: 'Note privately the clear mistakes you heard. You will come back to them on page 6.',
    },
    {
      title: 'One letter apart',
      station: 'spark',
      layout: 'story',
      scene: 'tj1Qalb',
      lines: [
        'Say قَلْب, from deep in the throat, and you said "heart".',
        'Move the sound a little forward, كَلْب, and you said "dog".',
        'In Arabic, where a letter comes from can change what a word means.',
        'Now imagine that care on the words of Allah. That care has a name: tajweed.',
      ],
      say: [{ id: 'qalb', text: 'قَلْب', voice: 'fusha', emotion: 'clear, deep' }, { id: 'kalb', text: 'كَلْب', voice: 'fusha', emotion: 'clear' }],
      explain: [
        'Play both words. Let the learner feel where each one starts: ق at the very back, ك a little forward.',
        'This is the hook: tajweed is not decoration. A letter said from the wrong place can change the meaning.',
      ],
    },
    {
      title: 'Not only what, but how',
      station: 'zad',
      layout: 'evidence',
      scene: 'tj1Tarteel',
      evidence: {
        arabic: 'وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا',
        meaning: 'And recite the Quran with tarteel: unhurried, clear, every letter in its place.',
        reference: 'Al-Muzzammil 73:4',
      },
      tadabbur: {
        word: 'تَرْتِيلًا',
        root: 'ر ت ل',
        meaning: 'Measured, distinct recitation. The root appears only four times in the whole Quran.',
        question: 'Allah could have said only "recite". What does it tell you that He also said how?',
        action: 'This week, recite one surah at half your usual speed and listen to each letter.',
      },
      say: [R('muzzammil-4', 'أَوْ زِدْ عَلَيْهِ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا', '73:4')],
      lines: [
        'Allah did not only command recitation. He named the way: tarteel.',
        'The Prophet ﷺ received the Quran from Jibril and taught it to his companions, letter by letter.',
        'It has passed from teacher to student ever since. When you learn tajweed, you join that chain.',
      ],
      explain: [
        'Play the ayah from the reciter. Point out the last word, tarteelan, and how the reciter gives it time.',
        'The chain from teacher to student is called the isnad of recitation. Many teachers today can name every teacher back to the Prophet ﷺ.',
      ],
    },
    {
      title: 'Its right and its due',
      station: 'zad',
      layout: 'concept',
      scene: 'tj1Right',
      lines: [
        'Tajweed means doing something well. In recitation, it means giving every letter two things.',
        'Its right: where it comes from in the mouth, and how it always sounds.',
        'Its due: how it changes when it meets the letters around it.',
      ],
      items: ['Its right: the letter alone', 'Its due: the letter with its neighbours'],
      vocab: [
        { arabic: 'تَجْوِيد', translit: 'tajweed', meaning: 'doing something well; reciting each letter as it should be' },
        { arabic: 'تَرْتِيل', translit: 'tarteel', meaning: 'unhurried, clear recitation' },
      ],
      explain: [
        'Level 2 of this course is about the letter\'s right (where it comes from, its qualities). Level 1, this level, is mostly about its due: the rules that come from neighbours.',
        'Use the قَلْب / كَلْب example again: the difference there is the letter\'s right.',
      ],
    },
    {
      title: 'Stumbling is not failing',
      station: 'zad',
      layout: 'evidence',
      scene: 'tj1Stumble',
      evidence: {
        arabic: 'الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ، وَالَّذِي يَقْرَأُ الْقُرْآنَ وَيَتَتَعْتَعُ فِيهِ وَهُوَ عَلَيْهِ شَاقٌّ لَهُ أَجْرَانِ',
        meaning: 'The one skilled in the Quran will be with the noble, righteous scribes. And the one who reads it haltingly, finding it hard, has two rewards.',
        reference: 'Sahih Muslim 798 (also al-Bukhari 4937), narrated by Aisha',
      },
      lines: [
        'Two people are honoured here, and only one of them is fluent.',
        'The beginner who struggles is not left behind: the effort itself is rewarded.',
        'So start exactly where you are. Each lesson is one step from halting toward skill.',
      ],
      explain: [
        'Many adults feel embarrassed reciting in front of a teacher. This hadith is the answer: the struggle is counted.',
        'Ask: which of the two are you today? Both are good places to be. The aim is to move toward the first.',
      ],
    },
    {
      title: 'Two kinds of mistakes',
      station: 'zad',
      layout: 'concept',
      scene: 'tj1Mistakes',
      lines: [
        'Not every mistake weighs the same.',
        'A clear mistake changes a letter or a vowel. It can change the meaning, so it must be fixed first.',
        'A hidden mistake misses a rule. The meaning stays, but the recitation loses what it should have.',
      ],
      items: ['Clear: لَحْن جَلِيّ', 'Hidden: لَحْن خَفِيّ'],
      vocab: [
        { arabic: 'لَحْن جَلِيّ', translit: 'lahn jaliyy', meaning: 'a clear mistake: a letter or vowel changes' },
        { arabic: 'لَحْن خَفِيّ', translit: 'lahn khafiyy', meaning: 'a hidden mistake: a tajweed rule is missed' },
      ],
      explain: [
        'Go back to the learner\'s first recitation on page 1. Name one clear mistake you heard, if there was one, and fix it now.',
        'Our order in this course: clear mistakes first, always; hidden ones rule by rule.',
      ],
    },
    {
      title: 'The layers inside Al-Ikhlas',
      station: 'zad',
      layout: 'concept',
      scene: 'tj1Layers',
      lines: [
        'Here is a surah you have known for years.',
        'Under the words are layers of sound. Each rule we learn switches one on.',
      ],
      items: ['The bounce: every ayah ends on a still د', 'The silent laam: ٱلصَّمَد is read as-samad', 'The merge: يَكُن لَّهُۥ is read yakul-lahu'],
      say: [
        R('ikhlas-1', 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', '112:1'),
        R('ikhlas-2', 'ٱللَّهُ ٱلصَّمَدُ', '112:2'),
        R('ikhlas-3', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', '112:3'),
        R('ikhlas-4', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', '112:4'),
      ],
      explain: [
        'This is the wow of the lesson. Turn on the layers one by one and play each ayah from the reciter.',
        'The bounce is qalqalah (Lesson 2); the silent laam is the sun letter (Lesson 10); the merge is idgham (Lesson 4). Do not teach them yet: only let the learner hear them.',
      ],
      teacherNote: 'Each layer you switch on here comes back as a full lesson. Promise it, do not teach it.',
    },
    {
      title: 'Before the first word',
      station: 'zad',
      layout: 'evidence',
      scene: 'tj1Istiadha',
      evidence: {
        arabic: 'فَإِذَا قَرَأْتَ ٱلْقُرْءَانَ فَٱسْتَعِذْ بِٱللَّهِ مِنَ ٱلشَّيْطَـٰنِ ٱلرَّجِيمِ',
        meaning: 'When you recite the Quran, seek refuge with Allah from Satan, the outcast.',
        reference: 'An-Nahl 16:98',
      },
      tadabbur: {
        word: 'فَٱسْتَعِذْ',
        root: 'ع و ذ',
        meaning: 'Seek refuge: run to a protector and hold on.',
        question: 'What usually pulls your attention away when you start to recite?',
        action: 'Say the isti\'adha slowly before your next recitation, meaning every word.',
      },
      say: [R('nahl-98', 'فَإِذَا قَرَأْتَ ٱلْقُرْءَانَ فَٱسْتَعِذْ بِٱللَّهِ مِنَ ٱلشَّيْطَـٰنِ ٱلرَّجِيمِ', '16:98'), { id: 'istiadha', text: 'أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', voice: 'fusha', emotion: 'calm, reverent' }],
      lines: [
        'So the recitation opens with a door: أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ.',
        'You say it once, when you begin reading, whether from the start of a surah or the middle.',
      ],
      explain: [
        'Play the ayah, then the isti\'adha. The learner repeats the isti\'adha slowly.',
        'If the reading is interrupted by talk unrelated to the Quran, many teachers ask the reciter to say it again when returning.',
      ],
    },
    {
      title: 'Bismillah, and the one surah without it',
      station: 'zad',
      layout: 'concept',
      scene: 'tj1Basmalah',
      lines: [
        'At the start of every surah, after the isti\'adha, comes the basmalah.',
        'Every surah but one: At-Tawbah, Surah 9, has no basmalah at its start.',
        'Starting from the middle of a surah? The basmalah is allowed there, but not required.',
      ],
      say: [R('fatiha-1', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', '1:1')],
      vocab: [
        { arabic: 'الاسْتِعَاذَة', translit: "al-isti'aadhah", meaning: 'saying "I seek refuge with Allah…" before reciting' },
        { arabic: 'البَسْمَلَة', translit: 'al-basmalah', meaning: 'saying "In the name of Allah, the Most Merciful, the Most Kind"' },
      ],
      explain: [
        'Show the 114 surahs on the stage: the basmalah lights on every one but At-Tawbah.',
        'Ask: in your own Mushaf, find the start of Surah 9. What do you see instead?',
      ],
    },
    {
      title: 'Short review: clear or hidden?',
      station: 'athar',
      layout: 'game',
      scene: 'tj1Review',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Six mistakes a teacher might hear. Is each one clear or hidden?',
        bins: [
          { id: 'clear', label: 'Clear', hint: 'a letter or vowel changes' },
          { id: 'hidden', label: 'Hidden', hint: 'a rule is missed' },
        ],
        cards: [
          { label: 'Reading قَلْب as كَلْب.', bin: 'clear', why: 'A letter changed, and the meaning with it.' },
          { label: 'Reading a fatha as a damma.', bin: 'clear', why: 'A vowel changed: that can change the word.' },
          { label: 'Dropping a letter from a word.', bin: 'clear', why: 'The word is no longer the word that was revealed.' },
          { label: 'Missing the nasal hum on a doubled noon.', bin: 'hidden', why: 'The word stays the same; the ghunnah rule is missed.' },
          { label: 'Not bouncing the د at the end of أَحَد.', bin: 'hidden', why: 'The meaning stays; the qalqalah is missed.' },
          { label: 'Saying the noon in يَكُن لَّهُۥ instead of merging it.', bin: 'hidden', why: 'The meaning stays; the idgham is missed.' },
        ],
      },
      explain: ['A short review, no timer and no points. The result goes into your lesson report.', 'Ask the learner for the reason before they tap.'],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Your turn to recite',
      station: 'athar',
      layout: 'question',
      scene: 'tj1Recite',
      lines: [
        'Isti\'adha, basmalah, then Al-Ikhlas, at the pace of tarteel.',
        'Listen to the reciter once first. Then recite it yourself to your teacher.',
      ],
      say: [R('ikhlas-1', 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', '112:1')],
      interaction: {
        kind: 'ask',
        prompt: 'Recite to your teacher. Today the teacher listens for clear mistakes only. Did you give every letter its time?',
        reveal: 'Ma sha Allah. From the next lesson, we switch on one layer at a time.',
      },
      explain: ['Listen for clear mistakes only and correct them gently, one at a time.', 'Praise the pace if it was unhurried: that is tarteel.'],
      teacherNote: 'Write the clear mistakes in your report so you can check them next lesson.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'tj1Mission',
      lines: [
        'Every day this week: listen to Al-Ikhlas from the reciter once, then recite it yourself.',
        'Listen for the bounce at the end of each ayah. Can you hear it?',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'When will you do it?',
        options: ['After Fajr', 'On the way to work or school', 'Before sleep', 'After another salah'],
      },
      explain: ['Ask next lesson: did they hear the bounce? Most do. That is the doorway to Lesson 2.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'tj1Next',
      lines: [
        'Four ayat, four endings, and every one of them bounces.',
        'Five letters do this whenever they are still: ق ط ب ج د.',
        'Next time: qalqalah, the bounce.',
      ],
      explain: ['End on the five letters. Let the learner try to find them in Al-Falaq before next lesson.'],
    },
  ],
};
