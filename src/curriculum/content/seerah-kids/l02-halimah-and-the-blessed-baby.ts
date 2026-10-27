import type { Lesson } from '../../types';
import { seerahK02TeacherAr } from './l02-teacher-ar.js';

// Seerah · Kids · Episode 2. Rules: docs/curriculum/seerah/RULES.md (Kids: own tone, same facts). Facts as in the Teens &
// Adults Episode 2 (The Sealed Nectar, "Babyhood"; Halimah's account via Ibn Ishaq; Sahih Muslim 162, checked on Dorar).
// The Prophet ﷺ is never drawn, as a baby or as a boy: the pictures show the places, the animals and the light.
// The Zad Kids cast react and ask; the teacher tells the story. Pictures: IMAGE-PROMPTS.md (kids-ep02).

export const seerahK02: Lesson = {
  subject: 'seerah-kids',
  version: 'kids',
  subjectTitle: 'Seerah · Kids',
  number: 2,
  title: 'Halimah and the Blessed Baby',
  titleAr: 'حليمة والطفل المبارك',
  part: 'Episode 2 · Halimah',
  minutes: 40,
  goal: 'By the end of this episode, you will tell how Halimah chose the baby nobody wanted, and the amazing things that happened to her family.',
  reviewed: false,
  teacherAr: seerahK02TeacherAr,
  outcomes: [
    'Tells why babies from Makkah went to live in the desert.',
    'Tells how Halimah chose the baby Muhammad ﷺ when nobody else did.',
    'Names two blessings that came to Halimah\'s family.',
    'Knows that Allah made his heart pure when he was a little boy.',
  ],
  chapters: [
    { label: 'The desert', page: 0 },
    { label: 'The choice', page: 3 },
    { label: 'The blessings', page: 6 },
    { label: 'The heart', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Halimah and the Blessed Baby', station: 'spark', layout: 'cover', scene: 'sk2Cover', lines: [],
      explain: ['"Episode 2!" Remind them: last time a special baby was born. Ask: where do you think babies grew up long ago?'],
    },
    {
      title: 'Babies in the desert', station: 'spark', layout: 'story', scene: 'sk2Dry',
      lines: [
        'Long ago, families in Makkah sent their babies to live with kind ladies in the desert.',
        'In the desert the air was fresh, and children grew up strong and spoke beautiful Arabic.',
        'But this year, there was no rain at all. The animals were thin and hungry.',
      ],
      explain: ['The Sealed Nectar: the custom of sending babies to the desert tribes.', 'Ask: what happens to animals when there is no rain?'],
    },
    {
      title: 'The slowest donkey', station: 'spark', layout: 'story', scene: 'sk2Trip',
      lines: [
        'A group of ladies from the tribe of Banu Sa\'d set off to Makkah to find babies.',
        'One of them was Halimah. Her donkey was so thin and slow that everyone had to wait for her.',
        'Her family was very poor. Even her own baby cried all night because he was hungry.',
      ],
      explain: ['Plant the slow donkey. It will surprise them later!'],
    },
    {
      title: 'Nobody picked him', station: 'zad', layout: 'story', scene: 'sk2Town',
      lines: [
        'In Makkah, every lady was shown the baby Muhammad.',
        'But his daddy had died, so they thought: "Who will give us presents for looking after him?"',
        'So one by one, they all said no.',
      ],
      explain: ['Keep it simple: they wanted a family who could pay them.'],
    },
    {
      title: 'What would you do?', station: 'zad', layout: 'question', scene: 'sk2Ask',
      lines: ['Everybody has found a baby to take home. Everybody except Halimah.'],
      interaction: { kind: 'ask', prompt: 'If everyone left the baby with no daddy, would you take him?', reveal: 'Let\'s see what Halimah did!' },
      explain: ['Let each child answer. Praise kindness.'],
    },
    {
      title: 'Halimah goes back', station: 'zad', layout: 'story', scene: 'sk2Door',
      lines: [
        'Halimah said to her husband: "I don\'t want to go home with no baby. I will take that orphan."',
        'Her husband said: "Good idea! Maybe Allah will give us blessings because of him."',
        'So Halimah went back and picked him up in her arms.',
      ],
      explain: ['Halimah\'s own story (Ibn Ishaq), told in The Sealed Nectar.', 'An orphan is a child whose mummy or daddy has died.'],
    },
    {
      title: 'Milk for everyone!', station: 'zad', layout: 'story', scene: 'sk2Milk',
      lines: [
        'That night, Halimah suddenly had lots of milk for both babies. They drank and fell fast asleep.',
        'Her husband went to their old camel. She had been dry for days. Now she was full of milk!',
        'Everyone drank until they were full. Her husband said: "This is a blessed baby!"',
      ],
      explain: ['Barakah means more good from the same thing. Ask: have you ever had a little thing that went a long way?'],
    },
    {
      title: 'Zoom, little donkey!', station: 'zad', layout: 'story', scene: 'sk2Race',
      lines: [
        'On the way home, guess who was at the very front? The slow little donkey!',
        'The other ladies shouted: "Wait for us! Isn\'t that the same donkey?"',
      ],
      explain: ['Make it fun: the slowest became the fastest.'],
    },
    {
      title: 'The desert turns green', station: 'zad', layout: 'story', scene: 'sk2Green',
      lines: [
        'Back home, the dry land grew green grass.',
        'Halimah\'s sheep came home fat and full of milk every evening.',
        'Everything was better since the blessed baby came.',
      ],
      explain: ['The Sealed Nectar: the barren land sprouted grass and the animals came back full of milk.'],
    },
    {
      title: 'Playing in the hills', station: 'zad', layout: 'story', scene: 'sk2Hills',
      lines: [
        'The baby grew into a little boy. He played in the hills with the other children and the lambs.',
        'Halimah loved him so much that she asked his mummy: "Please let him stay with us a bit longer!"',
        'And he stayed in the desert until he was four or five.',
      ],
      explain: ['The Sealed Nectar: two years, then he stayed until four or five.'],
    },
    {
      title: 'A pure heart', station: 'zad', layout: 'story', scene: 'sk2Basin',
      lines: [
        'One day, while he was playing, the angel Jibril came to him.',
        'Jibril washed his heart with Zamzam water in a golden bowl, to make it pure and clean.',
        'The other boys ran to Halimah, very scared. But he was safe and well.',
      ],
      explain: ['Sahih Muslim 162 (checked on Dorar). Keep it gentle and wondrous; no scary details.', 'Jibril is never drawn: the picture shows only the golden bowl and light.'],
    },
    {
      title: 'Check the story', station: 'athar', layout: 'game', scene: 'sk2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Did it happen in the story?',
        bins: [
          { id: 'yes', label: 'It happened', hint: 'in the story' },
          { id: 'no', label: 'Not in the story', hint: 'that is wrong' },
        ],
        cards: [
          { label: 'Halimah chose the orphan baby', bin: 'yes', why: 'Nobody else did.' },
          { label: 'Halimah was very rich', bin: 'no', why: 'Her family was poor.' },
          { label: 'The old camel gave milk', bin: 'yes', why: 'That same night.' },
          { label: 'The donkey stayed slow', bin: 'no', why: 'It went to the front!' },
          { label: 'The desert turned green', bin: 'yes', why: 'Her sheep came home full.' },
          { label: 'The other ladies took him first', bin: 'no', why: 'They all said no.' },
        ],
      },
      explain: ['Let the child explain each answer. The result goes into your report.'],
    },
    {
      title: 'My mission', station: 'ahd', layout: 'mission', scene: 'sk2Mission',
      lines: ['Halimah chose the one nobody picked. You can do that too.'],
      interaction: { kind: 'choose', prompt: 'This week, I will pick someone who is left out. Where?', options: ['At school', 'At the park', 'At the masjid', 'At home'] },
      explain: ['Ask next time: who did you pick? How did they feel?'],
    },
    {
      title: 'Next time…', station: 'ahd', layout: 'next', scene: 'sk2Next',
      lines: ['The boy goes home to his mummy, Aminah.', 'One day, they go on a long, long trip together on a camel…', 'Next time: Episode 3, Three Goodbyes.'],
      explain: ['End on the trip. Do not tell what happens.'],
    },
  ],
};
