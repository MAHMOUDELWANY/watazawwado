import type { Lesson } from '../../types';
import { seerahK03TeacherAr } from './l03-teacher-ar.js';

// Seerah · Kids · Episode 3. Rules: docs/curriculum/seerah/RULES.md (Kids: own tone, same facts). Facts as in the Teens &
// Adults Episode 3 (The Sealed Nectar, pp. 39–40; the rain prayer is "it is reported", Ibn Asakir). Ayah 93:6 fetched with
// the Quran connector (Uthmani Hafs, 2026-10-27); audio Husary. Grief is shown by objects (lamps, a stick, a road), never
// up close. Pictures: IMAGE-PROMPTS.md (kids-ep03).

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });

export const seerahK03: Lesson = {
  subject: 'seerah-kids',
  version: 'kids',
  subjectTitle: 'Seerah · Kids',
  number: 3,
  title: 'Three Goodbyes',
  titleAr: 'ثلاثة وداعات',
  part: 'Episode 3 · Three Goodbyes',
  minutes: 40,
  goal: 'By the end of this episode, you will know who looked after the Prophet ﷺ when he lost his mummy and his grandpa, and that Allah never left him alone.',
  reviewed: false,
  teacherAr: seerahK03TeacherAr,
  outcomes: [
    'Tells what happened on the trip to Yathrib.',
    'Names who looked after him: his grandpa Abdul-Muttalib, then his uncle Abu Talib.',
    'Recites Ad-Duha 93:6 and says what it means.',
    'Knows one way to make someone feel at home.',
  ],
  chapters: [
    { label: 'The trip', page: 0 },
    { label: 'Grandpa', page: 5 },
    { label: 'Uncle', page: 7 },
    { label: 'The ayah', page: 10 },
    { label: 'My mission', page: 12 },
  ],
  pages: [
    {
      title: 'Three Goodbyes', station: 'spark', layout: 'cover', scene: 'sk3Cover', lines: [],
      explain: ['"Episode 3!" Show the three lamps. Say gently: this is a story with some sad parts, and a happy thread all the way through.'],
    },
    {
      title: 'A long trip', station: 'spark', layout: 'story', scene: 'sk3Journey',
      lines: [
        'The boy was home with his mummy, Aminah. When he was six, she took him on a long trip.',
        'They rode camels all the way to a green town called Yathrib, very far away.',
        'Umm Ayman, who helped look after him, came too, and so did his grandpa.',
      ],
      explain: ['The Sealed Nectar: 500 km, with Umm Ayman and Abdul-Muttalib.'],
    },
    {
      title: 'The green town', station: 'spark', layout: 'story', scene: 'sk3Palms',
      lines: [
        'Yathrib had palm trees, water and cool shade.',
        'His daddy was buried there. They visited and stayed for a whole month.',
        'Later, this town would get a new name: Madinah!',
      ],
      explain: ['Ask: do you know anyone who lives in Madinah, or has visited it?'],
    },
    {
      title: 'A sad goodbye', station: 'zad', layout: 'story', scene: 'sk3Tent',
      lines: [
        'On the way home, his mummy became very ill.',
        'At a place called al-Abwa, she died.',
        'Now the little boy had no daddy and no mummy. But he was not alone.',
      ],
      explain: ['Say it calmly and briefly. If a child looks upset, pause and reassure them.'],
    },
    {
      title: 'When we feel sad', station: 'zad', layout: 'question', scene: 'sk3Ask',
      lines: ['Everybody feels sad sometimes.'],
      interaction: { kind: 'ask', prompt: 'When you feel sad, who helps you feel better?', reveal: 'Allah puts kind people around us. Let\'s see who looked after the boy.' },
      explain: ['Let children name parents, grandparents, friends, teachers.'],
    },
    {
      title: 'Grandpa\'s special rug', station: 'zad', layout: 'story', scene: 'sk3Rug',
      lines: [
        'His grandpa, Abdul-Muttalib, took him home and loved him very much.',
        'Grandpa had a special rug by the Kaaba. His sons sat around it, but never on it.',
        'The little boy climbed right on! When his uncles moved him, Grandpa said: "Leave my grandson!"',
      ],
      explain: ['Ibn Hisham, in The Sealed Nectar.', 'Ask: what does it feel like when a grown-up makes room for you?'],
    },
    {
      title: 'Goodbye, Grandpa', station: 'zad', layout: 'story', scene: 'sk3Staff',
      lines: [
        'When the boy was eight years old, his grandpa died.',
        'That was the second goodbye. Two lamps had gone out.',
      ],
      explain: ['Point to the lamps on the cover.'],
    },
    {
      title: 'A busy, happy home', station: 'zad', layout: 'story', scene: 'sk3Home',
      lines: [
        'His uncle, Abu Talib, took him into his home.',
        'Abu Talib had lots of children, and he loved the boy like one of them, even more!',
        'He looked after him and protected him for forty years.',
      ],
      explain: ['The Sealed Nectar: Abu Talib preferred him to his own children and protected him for forty years.'],
    },
    {
      title: 'Clouds over the Kaaba', station: 'zad', layout: 'story', scene: 'sk3Clouds',
      lines: [
        'It is said that one year there was no rain in Makkah.',
        'The people asked Abu Talib to pray for rain. He went to the Kaaba with the boy beside him.',
        'And big clouds started to gather in the sky…',
      ],
      explain: ['Reported by Ibn Asakir. Say "it is said".'],
    },
    {
      title: 'Rain!', station: 'zad', layout: 'story', scene: 'sk3Rain',
      lines: [
        'The rain poured down! Streams ran and flowers grew.',
        'Do you remember the dry camel in Halimah\'s tent? Wherever this boy went, blessings came too.',
      ],
      explain: ['Link to Episode 2.'],
    },
    {
      title: 'Allah looked after him', station: 'zad', layout: 'evidence', scene: 'sk3Duha',
      evidence: {
        arabic: 'أَلَمْ يَجِدْكَ يَتِيمًا فَـَٔاوَىٰ',
        meaning: 'Did He not find you an orphan and give you a home?',
        reference: 'Ad-Duha 93:6',
      },
      tadabbur: {
        word: 'فَـَٔاوَىٰ',
        root: 'أ و ي',
        meaning: 'to give someone a home and keep them safe',
        question: 'Who were the people Allah sent to give the boy a home?',
        action: 'Learn this ayah this week and say "Alhamdulillah" for your home.',
      },
      lines: ['Allah remembered the little orphan in the Quran.', 'Tap the ayah and listen.'],
      say: [R('duha-6', 'أَلَمْ يَجِدْكَ يَتِيمًا فَـَٔاوَىٰ', '93:6')],
      explain: ['Play the ayah. Count with the children: Grandpa, Uncle Abu Talib… Allah sent them.'],
    },
    {
      title: 'Check the story', station: 'athar', layout: 'game', scene: 'sk3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Did it happen in the story?',
        bins: [
          { id: 'yes', label: 'It happened', hint: 'in the story' },
          { id: 'no', label: 'Not in the story', hint: 'that is wrong' },
        ],
        cards: [
          { label: 'They rode camels to Yathrib', bin: 'yes', why: 'A very long trip.' },
          { label: 'Grandpa sent him away from the rug', bin: 'no', why: 'He said: "Leave my grandson!"' },
          { label: 'Uncle Abu Talib took him home', bin: 'yes', why: 'And loved him like his own.' },
          { label: 'The boy was left all alone', bin: 'no', why: 'Allah always sent someone.' },
          { label: 'Rain came after the dry year', bin: 'yes', why: 'Streams and flowers!' },
          { label: 'Yathrib was a dry, empty place', bin: 'no', why: 'It had palms and water.' },
        ],
      },
      explain: ['Let the child explain each answer. The result goes into your report.'],
    },
    {
      title: 'My mission', station: 'ahd', layout: 'mission', scene: 'sk3Mission',
      lines: ['Abu Talib made the boy feel at home. You can make someone feel at home too.'],
      interaction: { kind: 'choose', prompt: 'This week, I will make someone feel welcome. Who?', options: ['A new child at school', 'My little brother or sister', 'A guest at home', 'My grandma or grandpa'] },
      explain: ['Ask next time: who did you welcome? What did you do?'],
    },
    {
      title: 'Next time…', station: 'ahd', layout: 'next', scene: 'sk3Next',
      lines: ['Uncle Abu Talib is going on a big trip with lots of camels, far to the north.', 'The boy holds on to him: "Take me with you!"', 'Next time: Episode 4, The Monk on the Road.'],
      explain: ['End on the trip. Do not tell what happens.'],
    },
  ],
};
