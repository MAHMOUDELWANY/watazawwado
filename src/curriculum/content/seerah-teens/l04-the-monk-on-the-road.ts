import type { Lesson } from '../../types';
import { seerahE04TeacherAr } from './l04-teacher-ar.js';

// Seerah · Teens & Adults · Episode 4. Rules: docs/curriculum/seerah/RULES.md. Facts: The Sealed Nectar (English), "Bahira,
// the Monk" (p. 40, MSA NIU edition, citing Ibn Hisham 1/180–183 and Zad al-Ma'ad 1/17): twelve years old, the journey with
// Abu Talib to Syria, Busra, the monk Bahira (Georges) who had never received them before, "the master of all humans…
// a mercy to all beings", the stones and trees at al-Aqabah, the seal of prophethood, "we learn this from our books", sent
// back to Makkah. The cloud and the leaning shade are in Ibn Ishaq and in the Abu Musa report (at-Tirmidhi 3620): graded
// differently (al-Dhahabi: very munkar for its ending; Ibn Kathir: "has strangeness"), so they are told as "it is reported",
// and the ending with Abu Bakr and Bilal and the seven Romans is left out. The boy clinging to Abu Talib: Ibn Ishaq.
// Ayah 2:146 fetched with the Quran connector (Uthmani Hafs, 2026-10-27); Al-Tafsir al-Muyassar: the scholars of the
// People of the Book recognise Muhammad ﷺ by the description in their books. Stills: IMAGE-PROMPTS.md (teens-ep04).
const BAQARAH = 'Al-Baqarah 2:146';

export const seerahE04: Lesson = {
  subject: 'seerah-teens',
  version: 'adults',
  subjectTitle: 'Seerah · Teens & Adults',
  number: 4,
  title: 'The Monk on the Road',
  titleAr: 'الراهب على الطريق',
  part: 'Episode 4 · The Monk on the Road',
  minutes: 60,
  goal: 'By the end of this episode, you will know what happened on the Prophet\'s ﷺ first journey to Syria, what the monk Bahira saw, and why honest people recognise the truth when it walks past them.',
  reviewed: false,
  teacherAr: seerahE04TeacherAr,
  outcomes: [
    'Tells the journey to Busra and the meeting with Bahira in order.',
    'Separates what The Sealed Nectar reports from the details that are only "reported".',
    'Reads Al-Baqarah 2:146 with its meaning and links it to Bahira.',
    'Explains that recognising the truth needs honest knowledge and the courage to say it.',
    'Chooses one hidden place this week to be honest where nobody is watching.',
  ],
  chapters: [
    { label: 'The road', page: 0 },
    { label: 'The monk', page: 4 },
    { label: 'The words', page: 9 },
    { label: 'The return', page: 14 },
    { label: 'Our turn', page: 15 },
  ],
  pages: [
    {
      title: 'The Monk on the Road', station: 'spark', layout: 'cover', scene: 'se4Cover', lines: [],
      explain: ['Recap in one line: an orphan, a grandfather gone, an uncle who took him in. Ask: have you ever met a stranger who seemed to understand you better than people who knew you?'],
    },
    {
      title: 'A city that lived on the road', station: 'spark', layout: 'concept', scene: 'se4Market',
      lines: [
        'Makkah had no farms and no rivers. It lived on trade.',
        'Every year, its caravans carried leather, cloth and spices south to Yemen and north to Syria.',
        'Abu Talib was getting ready for one of those journeys north, to the markets of Syria.',
      ],
      explain: ['Set the scene: trade was Makkah\'s lifeline, and a caravan journey took weeks.'],
    },
    {
      title: 'Take me with you', station: 'spark', layout: 'concept', scene: 'se4Rope',
      lines: [
        'His nephew was about twelve. He had lost his mother, then his grandfather.',
        'Historians report that when the caravan was ready, the boy held on to his uncle and would not let him go.',
        'Abu Talib could not leave him. So the boy joined the caravan.',
      ],
      explain: ['The Sealed Nectar: twelve years old, a business journey with Abu Talib. The boy holding on: Ibn Ishaq.', 'I\'tizaz: there is no shame in holding on to the people who keep you safe.'],
    },
    {
      title: 'The long road north', station: 'spark', layout: 'concept', scene: 'se4Route',
      lines: [
        'The road ran north for weeks: through the Hejaz, past black lava fields, into the green land of Hawran.',
        'Caravans had used this road for generations. Every stop, every well, every face along it was familiar.',
        'Except that on this journey, something along the road was watching.',
      ],
      explain: ['Use the map: Makkah far south, Busra in the Hawran, under Roman rule.'],
    },
    {
      title: 'Busra', station: 'zad', layout: 'concept', scene: 'se4Busra',
      lines: [
        'Busra was a Roman frontier town of black stone, rich and busy, the first big market on the way.',
        'Near it lived a monk called Bahira. His real name, the sources say, was Georges.',
        'Caravans from Makkah had passed his monastery many times. He had never come out to them.',
      ],
      items: ['The place: Busra, Hawran', 'The monk: Bahira'],
      explain: ['The Sealed Nectar: Busra, part of Syria under the Romans; the monk Bahira, real name Georges, who had never received them before.'],
    },
    {
      title: 'A man who watched the road', station: 'zad', layout: 'concept', scene: 'se4Cell',
      lines: [
        'A monk in those days studied the old books and waited.',
        'From those books, Bahira had learned the signs of a prophet still to come.',
        'Year after year, he looked down at the road. Year after year, nothing.',
      ],
      explain: ['The Sealed Nectar has him say: "We have got to learn this from our books."'],
    },
    {
      title: 'A cloud that followed', station: 'zad', layout: 'concept', scene: 'se4Cloud',
      lines: [
        'It is reported that Bahira saw something strange as the caravan came near.',
        'In the blazing heat, one small cloud moved with the caravan, shading one rider.',
        'And when they stopped, the shade of a tree leaned over to where the boy sat.',
      ],
      explain: ['Ibn Ishaq and the Abu Musa report (at-Tirmidhi). Scholars graded the details differently: say "it is reported".'],
      teacherNote: 'Do not present the cloud and the tree as certain facts. The Sealed Nectar itself mentions only the stones and trees at al-Aqabah and the seal.',
    },
    {
      title: 'The monk who never came out', station: 'zad', layout: 'concept', scene: 'se4Feast',
      lines: [
        'This time Bahira prepared a meal and invited the whole caravan, something he had never done.',
        'The traders were surprised. They had passed his door for years.',
        'Then, while they ate, he walked among them, looking at each one.',
      ],
      explain: ['The Sealed Nectar: he showed great kindness and entertained them lavishly, which he had never done before.'],
    },
    {
      title: 'Why now?', station: 'zad', layout: 'question', scene: 'se4Door',
      lines: [
        'A man who ignored every caravan for years suddenly opens his door and feeds them all.',
        'Something in this caravan was different, and he had been waiting his whole life to see it.',
      ],
      interaction: { kind: 'ask', prompt: 'What do you think he was looking for? And how would he know it when he saw it?', reveal: 'He was looking for a description he had studied all his life. Watch what he does next.' },
      explain: ['Let the learner guess before the reveal on the next page.'],
    },
    {
      title: 'He took his hand', station: 'zad', layout: 'concept', scene: 'se4Scrolls',
      lines: [
        'Bahira stopped in front of the twelve-year-old and took him by the hand.',
        'The traders of Quraysh stared. To them he was Abu Talib\'s orphan nephew.',
        'Out of a whole caravan of grown men, merchants and chiefs, the monk had chosen the youngest.',
      ],
      explain: ['The Sealed Nectar gives his words (on the quote card).', 'I\'tizaz: people may only see your circumstances. Allah sees who you are.'],
    },
    {
      title: '"How do you know?"', station: 'zad', layout: 'concept', scene: 'se4Pass',
      lines: [
        'Abu Talib asked him: how do you know that?',
        'Bahira said that when the caravan came over the pass of al-Aqabah, every stone and tree bowed down, as they bow only for a prophet.',
        'And he knew him by the seal of prophethood below his shoulder, like an apple. "We learn this from our books."',
      ],
      items: ['Sign 1: the stones and trees', 'Sign 2: the seal of prophethood', 'The source: their books'],
      explain: ['The Sealed Nectar, quoting Ibn Hisham.', 'The seal of prophethood is also described in Sahih al-Bukhari and Muslim.'],
    },
    {
      title: 'Seeing what is in front of you', station: 'zad', layout: 'concept', scene: 'se4Lantern',
      lines: [
        'Many people had passed that boy every day in Makkah and saw only an orphan.',
        'Bahira saw more, because he had studied honestly and he was willing to say what he saw.',
        'Knowledge alone is not enough. Many people know the truth and keep quiet.',
      ],
      items: ['Half one: honest knowledge', 'Half two: the courage to say it'],
      explain: ['The integrated lesson: recognising the truth = honest knowledge + the courage to say it.', 'Ask: which half is harder for you?'],
    },
    {
      title: 'The verdict of the Quran', station: 'zad', layout: 'evidence', scene: 'se4Book',
      evidence: {
        arabic: 'ٱلَّذِينَ ءَاتَيْنَـٰهُمُ ٱلْكِتَـٰبَ يَعْرِفُونَهُۥ كَمَا يَعْرِفُونَ أَبْنَآءَهُمْ ۖ وَإِنَّ فَرِيقًا مِّنْهُمْ لَيَكْتُمُونَ ٱلْحَقَّ وَهُمْ يَعْلَمُونَ',
        meaning: 'Those We gave the Scripture recognise him as they recognise their own sons; yet a group of them hide the truth while they know it.',
        reference: BAQARAH,
      },
      lines: [
        'Al-Tafsir al-Muyassar explains: their scholars knew Muhammad ﷺ by the description in their books.',
        'Bahira was one who recognised and spoke. The ayah warns about those who recognise and hide.',
        'The difference between them was never knowledge. It was honesty.',
      ],
      tadabbur: {
        word: 'يَعْرِفُونَهُۥ',
        root: 'ع ر ف',
        meaning: 'to recognise, to know someone when you see them',
        question: 'Why compare it to recognising your own son? What does that say about how clear the description was?',
        action: 'This week, when you know something is right, say it, even if your voice is the only one.',
      },
      explain: ['Read the ayah in Arabic, then the meaning. Al-Tafsir al-Muyassar (fetched): the People of the Book know he is the Messenger by the descriptions in their books.'],
    },
    {
      title: 'Take him home', station: 'zad', layout: 'concept', scene: 'se4Fork',
      lines: [
        'Bahira gave Abu Talib one more piece of advice: take the boy back to Makkah, and do not take him on into Syria.',
        'He feared that some who knew the same books would recognise him too, and wish him harm.',
        'Abu Talib listened. He sent his nephew back to Makkah with some of his men.',
      ],
      explain: ['The Sealed Nectar: he asked Abu Talib to send the boy back for fear of the Jews; Abu Talib obeyed.'],
      teacherNote: 'Keep the warning historical and specific to that time. Do not let it become a general statement about any people today.',
    },
    {
      title: 'Who you are when nobody knows you', station: 'athar', layout: 'concept', scene: 'se4Wallet',
      lines: [
        'At twelve, the Prophet ﷺ was already known to strangers by his character before anyone knew his name.',
        'You are building that too: in shops, in classrooms, online, with people who will never see you again.',
        'Every honest choice you make when nobody is watching is part of how you will be recognised.',
      ],
      explain: ['Bring it to the learner\'s week: lost things returned, the right change given back, an honest answer on a test.'],
    },
    {
      title: 'Check the story', station: 'athar', layout: 'game', scene: 'se4Sort',
      lines: [],
      interaction: {
        kind: 'sort', look: 'row',
        prompt: 'What The Sealed Nectar reports, and what is only "reported": put each card where it belongs.',
        bins: [
          { id: 'fact', label: 'In The Sealed Nectar', hint: 'the core story' },
          { id: 'lesson', label: 'What it teaches', hint: 'for us' },
        ],
        cards: [
          { label: 'Bahira had never come out to the caravans before', bin: 'fact', why: 'The Sealed Nectar.' },
          { label: 'Honest knowledge needs the courage to speak', bin: 'lesson', why: 'Drawn from Bahira.' },
          { label: 'He knew him by the seal of prophethood', bin: 'fact', why: 'The Sealed Nectar.' },
          { label: 'People may see only your circumstances', bin: 'lesson', why: 'Drawn from the traders who saw an orphan.' },
          { label: 'Abu Talib sent him back to Makkah', bin: 'fact', why: 'The Sealed Nectar.' },
          { label: 'Good advice is worth following', bin: 'lesson', why: 'Drawn from Abu Talib.' },
        ],
      },
      explain: ['The cloud and the tree are left out of the sort on purpose: they are reported, not in the core account.'],
    },
    {
      title: 'My Zad', station: 'ahd', layout: 'mission', scene: 'se4Mission',
      lines: ['Bahira spoke the truth he knew. The boy was known by his character before anyone knew his name.'],
      interaction: {
        kind: 'choose',
        prompt: 'This week, be honest in one place where nobody would ever find out. Where?',
        options: ['A test or homework', 'Money and change', 'Something I found', 'What I say online'],
      },
      explain: ['Ask about it next episode, privately if the learner prefers.'],
    },
    {
      title: 'Next time… to be continued', station: 'ahd', layout: 'next', scene: 'se4Next',
      lines: [
        'He is fifteen. A war breaks out in the sacred months, and he is on the battlefield beside his uncles.',
        'Then the noblest men of Makkah meet at night and make a promise that he will still praise as a prophet.',
        'Next: Episode 5, The Pact of the Just.',
      ],
      explain: ['End on the promise. Do not say what it was.'],
    },
  ],
};
