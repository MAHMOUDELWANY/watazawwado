import type { Lesson } from '../../types';
import { seerahE03TeacherAr } from './l03-teacher-ar.js';

// Seerah · Teens & Adults · Episode 3. Rules: docs/curriculum/seerah/RULES.md. Facts: The Sealed Nectar (English),
// "Back to His Passionate Mother" and "To His Compassionate Grandfather" (pp. 39–40, MSA NIU edition): with his mother
// until six; the visit to Yathrib (500 km, Umm Ayman and Abdul-Muttalib, a month), Aminah's death at al-Abwa; the
// mattress in the shade of the Kaaba and "Leave my grandson" (Ibn Hisham 1/168); Abdul-Muttalib's death at 8 years,
// 2 months and 10 days; Abu Talib's care for forty years; the rain prayer (Ibn Asakir, via Mukhtasar Sirat ar-Rasul:
// "it is reported"). Ayat 93:6–8 fetched with the Quran connector (Uthmani Hafs, 2026-10-27); English meaning ours.
// Hadith: Sahih Muslim 976 (Abu Hurayrah), checked on Dorar 2026-10-27: sahih; only its first sentence is shown.
// Stills: docs/curriculum/seerah/IMAGE-PROMPTS.md (teens-ep03).
const DUHA = 'Ad-Duha 93:6-8';
const MUSLIM_976 = 'Sahih Muslim 976 (Abu Hurayrah)';

export const seerahE03: Lesson = {
  subject: 'seerah-teens',
  version: 'adults',
  subjectTitle: 'Seerah · Teens & Adults',
  number: 3,
  title: 'Three Goodbyes',
  titleAr: 'ثلاثةُ وداعات',
  part: 'Episode 3 · Three Goodbyes',
  minutes: 60,
  goal: 'By the end of this episode, you will know how the Prophet ﷺ lost his mother and his grandfather as a child, who took him in, and what the Quran says about the orphan Allah sheltered.',
  reviewed: false,
  teacherAr: seerahE03TeacherAr,
  outcomes: [
    'Tells the journey to Yathrib and what happened at al-Abwa.',
    'Describes how Abdul-Muttalib and then Abu Talib cared for him, with one detail each.',
    'Reads Ad-Duha 93:6–8 with its meaning and links ayah 6 to the story.',
    'Explains that every loss in his childhood was followed by someone Allah sent.',
    'Chooses one way to be a shelter for someone this week.',
  ],
  chapters: [
    { label: 'The journey', page: 0 },
    { label: 'The grandfather', page: 6 },
    { label: 'The uncle', page: 11 },
    { label: 'The verdict', page: 14 },
    { label: 'Our turn', page: 16 },
  ],
  pages: [
    {
      title: 'Three Goodbyes', station: 'spark', layout: 'cover', scene: 'se3Cover', lines: [],
      explain: ['Open quietly: "Three lamps. Watch which ones go out." Ask: what do you think is the hardest thing that can happen to a six-year-old?'],
    },
    {
      title: 'Home, at last', station: 'spark', layout: 'concept', scene: 'se3Home',
      lines: [
        'Halimah brought the boy back from the desert for good. He was home with his mother, Aminah.',
        'He had never known his father. For the first time, he had his mother every day.',
        'Two years together, in a small house in Makkah. Remember these two years.',
      ],
      explain: ['The Sealed Nectar: after the opening of the chest, Halimah returned him to his mother, with whom he stayed until he was six.'],
    },
    {
      title: 'Five hundred kilometres north', station: 'spark', layout: 'concept', scene: 'se3Journey',
      lines: [
        'When he was six, Aminah decided to visit the grave of her husband Abdullah, in Yathrib.',
        'It was a journey of about five hundred kilometres, by camel, through the desert.',
        'With them went Umm Ayman, their servant, and the boy\'s grandfather, Abdul-Muttalib.',
      ],
      explain: ['The Sealed Nectar: 500 kilometres, with Umm Ayman and Abdul-Muttalib.', 'Umm Ayman (Barakah) will appear again and again in this series. Introduce her by name.'],
    },
    {
      title: 'A month in Yathrib', station: 'zad', layout: 'concept', scene: 'se3Palms',
      lines: [
        'Yathrib was green: palm gardens, water channels, a cooler air than Makkah.',
        'They stayed a month. The boy saw the city where his father was buried.',
        'He could not know it then, but this city would one day be his home, and it would be called Madinah.',
      ],
      explain: ['The Sealed Nectar: she spent a month there.', 'Plant the seed of the Hijrah: the boy saw Madinah decades before he moved there.'],
    },
    {
      title: 'Al-Abwa', station: 'zad', layout: 'concept', scene: 'se3Tent',
      lines: [
        'On the way back to Makkah, Aminah fell seriously ill.',
        'At a place called al-Abwa, on the road between Makkah and Madinah, she died.',
        'A six-year-old stood by his mother\'s grave, far from home. Now he had no father and no mother.',
      ],
      explain: ['The Sealed Nectar: she had a severe illness and died at al-Abwa.', 'Go slowly. Let silence do the work.'],
    },
    {
      title: 'What does a child carry home?', station: 'zad', layout: 'question', scene: 'se3Footprints',
      lines: [
        'Two sets of footprints left Makkah. Only one small set came back with the travellers.',
        'Grief at six does not have words. It has a quiet face, and questions nobody can answer.',
      ],
      interaction: { kind: 'ask', prompt: 'Think of the hardest goodbye you know, yours or someone close to you. What helped the most?', reveal: 'Usually it is not words. It is someone who stays. Watch who stays in this story.' },
      explain: ['Gentle. If a learner has lost a parent, do not press; let them pass.'],
    },
    {
      title: 'The road home', station: 'zad', layout: 'concept', scene: 'se3WayHome',
      lines: [
        'Abdul-Muttalib brought his grandson back to Makkah.',
        'The old chief of Quraysh had buried his son Abdullah. Now he would raise Abdullah\'s boy.',
        'The Sealed Nectar says this new loss made his love for the boy even stronger.',
      ],
      explain: ['The Sealed Nectar: Abdul-Muttalib brought the boy to Makkah; his recent disaster added to the pains of the past.'],
    },
    {
      title: 'The seat of honour', station: 'zad', layout: 'concept', scene: 'se3Mattress',
      lines: [
        'In the shade of the Kaaba, they laid a mattress for Abdul-Muttalib, the chief.',
        'His sons sat around it out of respect. Nobody sat on it.',
        'Except one small boy, who would climb up and sit right on it. His uncles would pull him away.',
      ],
      explain: ['Ibn Hisham, quoted in The Sealed Nectar.', 'Ask: what does it say about a grandfather when a child feels that free with him?'],
    },
    {
      title: 'Leave my grandson', station: 'zad', layout: 'concept', scene: 'se3Wall',
      lines: [
        'When Abdul-Muttalib saw them, he stopped them.',
        'He sat the boy beside him, patted his back, and was pleased with everything he did.',
        'He preferred him to his own sons, and he never left him alone.',
      ],
      explain: ['Ibn Hisham 1/168, in The Sealed Nectar.', 'I\'tizaz: a child grows tall when someone important makes room for them.'],
    },
    {
      title: 'Eight years, two months, ten days', station: 'zad', layout: 'concept', scene: 'se3Staff',
      lines: [
        'Two years later, Abdul-Muttalib died in Makkah.',
        'The sources give the boy\'s age to the day: eight years, two months and ten days.',
        'The second lamp went out.',
      ],
      items: ['Abdul-Muttalib dies', 'The boy\'s age: 8'],
      explain: ['The Sealed Nectar gives the exact age.', 'Point back to the three lamps of the cover.'],
    },
    {
      title: 'Never alone', station: 'zad', layout: 'concept', scene: 'se3Chain',
      lines: [
        'Count the hands that held him. His mother. Halimah in the desert. His grandfather. And now, his uncle.',
        'Each time one hand let go, another was already there.',
        'That is not luck. It is how Allah looks after the one He is preparing.',
      ],
      items: ['Every loss: someone already waiting', 'Behind them all: Allah'],
      explain: ['The integrated lesson: an orphan is never alone with Allah. Shelter = the people Allah sends + Allah Himself.', 'Ask: who were the "hands" in your own life when something hard happened?'],
    },
    {
      title: 'The uncle\'s house', station: 'zad', layout: 'concept', scene: 'se3Uncle',
      lines: [
        'His uncle Abu Talib, his father\'s full brother, took him in.',
        'He had many children of his own and no great wealth. He put the boy among them, and preferred him to them.',
        'He would protect him for forty years, and judge people by how they treated his nephew.',
      ],
      items: ['Protector: Abu Talib', 'For: 40 years'],
      explain: ['The Sealed Nectar: he took charge of his nephew in the best way, preferred him to his own children, and protected him for forty years.', 'Abu Talib\'s limited means come up later in the Seerah (when Ali is taken in by the Prophet ﷺ).'],
    },
    {
      title: 'A year without rain', station: 'zad', layout: 'concept', scene: 'se3Clouds',
      lines: [
        'It is reported that one year Makkah had no rain, and Quraysh came to Abu Talib: "The valley is dry and the children are hungry. Pray for rain."',
        'Abu Talib went to the Kaaba with a young boy beside him, and stood by its wall.',
        'And then clouds began to gather from every direction.',
      ],
      explain: ['Reported by Ibn Asakir, cited in The Sealed Nectar through Mukhtasar Sirat ar-Rasul. Say "it is reported".'],
      teacherNote: 'Treat this as a reported story, not as a certain fact.',
    },
    {
      title: 'The valley drinks', station: 'zad', layout: 'concept', scene: 'se3Rain',
      lines: [
        'The rain fell hard. Springs flowed again and the town and the land around it turned green.',
        'Do you see the thread? A dry camel in the desert. A dry valley in Makkah. And the same boy, both times.',
      ],
      explain: ['Link to Episode 2: barakah followed him wherever he went.'],
    },
    {
      title: 'The verdict of the Quran', station: 'zad', layout: 'evidence', scene: 'se3Duha',
      evidence: {
        arabic: 'أَلَمْ يَجِدْكَ يَتِيمًا فَـَٔاوَىٰ ۝ وَوَجَدَكَ ضَآلًّا فَهَدَىٰ ۝ وَوَجَدَكَ عَآئِلًا فَأَغْنَىٰ',
        meaning: 'Did He not find you an orphan and give you shelter? And find you unaware of the way and guide you? And find you in need and make you free of need?',
        reference: DUHA,
      },
      lines: [
        'Decades later, Allah reminds him of the boy at al-Abwa and in his uncle\'s house.',
        'Every shelter in this episode, the grandfather, the uncle, the rain, sits inside one word: فَـَٔاوَىٰ.',
        'And the same surah tells him how to treat orphans: never harshly.',
      ],
      tadabbur: {
        word: 'فَـَٔاوَىٰ',
        root: 'أ و ي',
        meaning: 'to take someone in, give them a home and a refuge',
        question: 'Allah did not say "He gave you a house". Who were the people through whom He gave the boy shelter?',
        action: 'Recite Ad-Duha this week, and stop at ayah 6 to thank Allah for one shelter He gave you.',
      },
      explain: ['Read the ayat in Arabic, then the meaning. Ayah 9 (do not treat the orphan harshly) is mentioned, not shown.'],
    },
    {
      title: 'He never forgot her', station: 'athar', layout: 'evidence', scene: 'se3Grave', contextFirst: true,
      evidence: {
        arabic: 'زَارَ النَّبِيُّ ﷺ قَبْرَ أُمِّهِ، فَبَكَى وَأَبْكَى مَنْ حَوْلَهُ',
        meaning: 'The Prophet ﷺ visited his mother\'s grave, and he wept, and made those around him weep.',
        reference: MUSLIM_976,
      },
      lines: [
        'More than fifty years after al-Abwa, he passed that way again, a grown man and the Messenger of Allah.',
        'He stopped at a small grave. The six-year-old was still inside the man.',
        'Being strong never meant not missing someone.',
      ],
      explain: ['Sahih Muslim 976 (checked on Dorar: sahih). Only the first sentence is shown on screen.'],
      teacherNote: 'The rest of the hadith (about seeking forgiveness for her) is for older learners and a separate discussion; do not open it here unless asked.',
    },
    {
      title: 'When you are the one left', station: 'athar', layout: 'concept', scene: 'se3Shoulder',
      lines: [
        'Some of you have lost a parent, a grandparent, a friend. Some of you feel alone in other ways.',
        'This episode is not asking you to be fine. He wept, too.',
        'It is asking you to look for the hands Allah has already placed around you, and to let them hold you.',
      ],
      explain: ['Speak gently and personally. This page is the heart of the episode for some learners.'],
    },
    {
      title: 'Check the story', station: 'athar', layout: 'game', scene: 'se3Sort',
      lines: [],
      interaction: {
        kind: 'sort', look: 'row',
        prompt: 'What the sources report, and what we draw from it: put each card where it belongs.',
        bins: [
          { id: 'fact', label: 'What happened', hint: 'from the sources' },
          { id: 'lesson', label: 'What it teaches', hint: 'for us' },
        ],
        cards: [
          { label: 'Aminah died at al-Abwa when he was six', bin: 'fact', why: 'The Sealed Nectar.' },
          { label: 'Grief and strength can live in the same heart', bin: 'lesson', why: 'Drawn from his visit to her grave.' },
          { label: 'Abdul-Muttalib sat him on his own mattress', bin: 'fact', why: 'Ibn Hisham, in The Sealed Nectar.' },
          { label: 'Making room for a child makes them grow', bin: 'lesson', why: 'Drawn from "Leave my grandson".' },
          { label: 'Abu Talib protected him for forty years', bin: 'fact', why: 'The Sealed Nectar.' },
          { label: 'Allah sends a hand before the last one lets go', bin: 'lesson', why: 'Drawn from the chain of carers.' },
        ],
      },
      explain: ['Learners separate the facts from the lessons, as in the earlier episodes.'],
    },
    {
      title: 'My Zad', station: 'ahd', layout: 'mission', scene: 'se3Mission',
      lines: ['Abu Talib had little money. He gave a home, and his time, and his protection.'],
      interaction: {
        kind: 'choose',
        prompt: 'This week, be someone\'s shelter in one small way. Whose?',
        options: ['A younger sibling or cousin', 'A friend going through something', 'A grandparent', 'Someone new at school or work'],
      },
      explain: ['Ask about it next episode: who was it, and what did you do?'],
    },
    {
      title: 'Next time… to be continued', station: 'ahd', layout: 'next', scene: 'se3Next',
      lines: [
        'Abu Talib joins a trade caravan to Syria. The twelve-year-old holds on to him and will not be left behind.',
        'In Busra, a monk who never greets travellers comes out to meet them. What does he see in the boy?',
        'Next: Episode 4, The Monk on the Road.',
      ],
      explain: ['End on the monk. Do not say what he said.'],
    },
  ],
};
