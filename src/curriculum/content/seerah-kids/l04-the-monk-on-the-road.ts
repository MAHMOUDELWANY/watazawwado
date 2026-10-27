import type { Lesson } from '../../types';
import { seerahK04TeacherAr } from './l04-teacher-ar.js';

// Seerah · Kids · Episode 4. Rules: docs/curriculum/seerah/RULES.md (Kids: own tone, same facts). Facts as in the Teens &
// Adults Episode 4 (The Sealed Nectar, "Bahira, the Monk"; the cloud and the tree only as "it is said"). Ayah 21:107 fetched
// with the Quran connector (Uthmani Hafs, 2026-10-27); it matches Bahira's words in The Sealed Nectar ("a mercy to all
// beings"); audio Husary. The boy is never drawn. Pictures: IMAGE-PROMPTS.md (kids-ep04).

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });

export const seerahK04: Lesson = {
  subject: 'seerah-kids',
  version: 'kids',
  subjectTitle: 'Seerah · Kids',
  number: 4,
  title: 'The Monk on the Road',
  titleAr: 'الراهب على الطريق',
  part: 'Episode 4 · The Monk on the Road',
  minutes: 40,
  goal: 'By the end of this episode, you will tell the story of the big trip north and the monk who knew the boy was special.',
  reviewed: false,
  teacherAr: seerahK04TeacherAr,
  outcomes: [
    'Tells where the caravan went and who went with it.',
    'Tells what the monk Bahira did and said.',
    'Recites Al-Anbiya 21:107 and says what it means.',
    'Chooses one way to be honest this week, even when nobody is watching.',
  ],
  chapters: [
    { label: 'The trip', page: 0 },
    { label: 'The monk', page: 3 },
    { label: 'The words', page: 8 },
    { label: 'Home again', page: 10 },
    { label: 'My mission', page: 12 },
  ],
  pages: [
    {
      title: 'The Monk on the Road', station: 'spark', layout: 'cover', scene: 'sk4Cover', lines: [],
      explain: ['"Episode 4!" Remind them: Uncle Abu Talib was going on a big trip, and the boy said "Take me with you!"'],
    },
    {
      title: 'A big trip', station: 'spark', layout: 'story', scene: 'sk4Yard',
      lines: [
        'The people of Makkah were traders. They carried things to sell on long camel trips.',
        'Uncle Abu Talib was going far to the north, to a land called Sham.',
        'The boy was twelve years old. He held on to his uncle, so his uncle took him along!',
      ],
      explain: ['The Sealed Nectar: twelve years old, a trade journey with Abu Talib to Syria.'],
    },
    {
      title: 'The long, long road', station: 'spark', layout: 'story', scene: 'sk4Road',
      lines: [
        'They rode for many days and many nights.',
        'Through hot sand, past black rocks, until the land turned green.',
        'At last they came near a town of dark stones called Busra.',
      ],
      explain: ['Trace the road on the picture with your finger, from south to north.'],
    },
    {
      title: 'A monk who never came out', station: 'zad', layout: 'story', scene: 'sk4Monastery',
      lines: [
        'Near Busra lived a monk called Bahira. A monk is a man who prays and reads old books.',
        'Many caravans passed his house. He never came out to say hello.',
        'He was waiting for something special that his books told about.',
      ],
      explain: ['The Sealed Nectar: the monk Bahira had never received them before.'],
    },
    {
      title: 'A little cloud', station: 'zad', layout: 'story', scene: 'sk4Cloud',
      lines: [
        'It is said that, on that hot day, a little cloud moved along with the caravan.',
        'It made a cool shadow over one rider: the boy!',
      ],
      explain: ['Say "it is said": this detail is reported, not certain.'],
    },
    {
      title: 'The tree that leaned', station: 'zad', layout: 'story', scene: 'sk4Tree',
      lines: [
        'When they stopped to rest, it is said that a tree leaned its shade over the boy.',
        'The monk saw it all from his window.',
      ],
      explain: ['Again, "it is said".'],
    },
    {
      title: 'A big dinner', station: 'zad', layout: 'story', scene: 'sk4Feast',
      lines: [
        'For the first time ever, the monk made a big dinner for the whole caravan!',
        'Everyone was surprised. Why was he being so kind today?',
      ],
      explain: ['The Sealed Nectar: he entertained them generously, which he had never done before.'],
    },
    {
      title: 'What is he looking for?', station: 'zad', layout: 'question', scene: 'sk4Ask',
      lines: ['The monk walked around and looked carefully at everyone.'],
      interaction: { kind: 'ask', prompt: 'Who do you think he was looking for?', reveal: 'Let\'s see who he chose!' },
      explain: ['Let the children guess.'],
    },
    {
      title: 'He took his hand', station: 'zad', layout: 'story', scene: 'sk4Door',
      lines: [
        'The monk went straight to the youngest person in the caravan, the boy, and took his hand.',
        'He said: "Allah will send him with a message. He will be a mercy for everyone!"',
        'The monk knew him from the signs in his old books.',
      ],
      explain: ['The Sealed Nectar: "This is the master of all humans. Allah will send him with a Message which will be a mercy to all beings."'],
    },
    {
      title: 'A mercy for everyone', station: 'zad', layout: 'evidence', scene: 'sk4Mercy',
      evidence: {
        arabic: 'وَمَآ أَرْسَلْنَـٰكَ إِلَّا رَحْمَةً لِّلْعَـٰلَمِينَ',
        meaning: 'And We sent you only as a mercy to all the worlds.',
        reference: 'Al-Anbiya 21:107',
      },
      tadabbur: {
        word: 'رَحْمَةً',
        root: 'ر ح م',
        meaning: 'mercy, kindness that cares for others',
        question: 'Who are "all the worlds"? Can you think of people, animals and places he was kind to?',
        action: 'Learn this ayah and do one kind thing for an animal or a person this week.',
      },
      lines: ['Years later, Allah said it in the Quran.', 'Tap the ayah and listen.'],
      say: [R('anbiya-107', 'وَمَآ أَرْسَلْنَـٰكَ إِلَّا رَحْمَةً لِّلْعَـٰلَمِينَ', '21:107')],
      explain: ['Play the ayah. Connect it to the monk\'s words: "a mercy for everyone".'],
    },
    {
      title: 'Back home', station: 'athar', layout: 'story', scene: 'sk4Back',
      lines: [
        'The monk told Uncle Abu Talib: "Take him home and keep him safe."',
        'Abu Talib listened, and sent the boy back to Makkah with some of his men.',
      ],
      explain: ['The Sealed Nectar: Abu Talib obeyed and sent him back to Makkah.'],
    },
    {
      title: 'Check the story', station: 'athar', layout: 'game', scene: 'sk4Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Did it happen in the story?',
        bins: [
          { id: 'yes', label: 'It happened', hint: 'in the story' },
          { id: 'no', label: 'Not in the story', hint: 'that is wrong' },
        ],
        cards: [
          { label: 'The caravan went north to Sham', bin: 'yes', why: 'To trade.' },
          { label: 'The monk always came out to say hello', bin: 'no', why: 'He never came out before.' },
          { label: 'The monk made a big dinner', bin: 'yes', why: 'For the whole caravan.' },
          { label: 'The monk chose the oldest man', bin: 'no', why: 'He chose the youngest: the boy.' },
          { label: 'He said the boy would be a mercy', bin: 'yes', why: 'A mercy for everyone.' },
          { label: 'Abu Talib ignored the monk', bin: 'no', why: 'He listened and sent the boy home.' },
        ],
      },
      explain: ['Let the child explain each answer. The result goes into your report.'],
    },
    {
      title: 'My mission', station: 'ahd', layout: 'mission', scene: 'sk4Mission',
      lines: ['The monk knew the boy by his signs. People know us by what we do.'],
      interaction: { kind: 'choose', prompt: 'This week, I will be honest even when nobody is looking. How?', options: ['Tell the truth', 'Give back what I find', 'Do my own homework', 'Share fairly'] },
      explain: ['Ask next time: what did you do?'],
    },
    {
      title: 'Next time…', station: 'ahd', layout: 'next', scene: 'sk4Next',
      lines: ['The boy is now a teenager.', 'The leaders of Makkah meet at night to make a very special promise…', 'Next time: Episode 5, The Pact of the Just.'],
      explain: ['End on the promise. Do not tell what it is.'],
    },
  ],
};
