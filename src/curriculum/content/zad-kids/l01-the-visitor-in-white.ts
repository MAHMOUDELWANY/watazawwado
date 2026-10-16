import type { Lesson } from '../../types';

// Brief and evidence log: docs/curriculum/zad-essentials-kids/L01-the-visitor-in-white.md
// Arabic text copied unchanged from Sahih Muslim 8 (Dorar, checked 2026-10-16). English meaning is ours.
const MUSLIM_8 = 'Sahih Muslim 8 · narrated by Umar ibn al-Khattab';

export const lesson01: Lesson = {
  subject: 'zad-kids',
  subjectTitle: 'Zad Essentials · Kids',
  number: 1,
  title: 'The Visitor in White',
  part: 'Part 1 · Who Am I, and Who Made Me?',
  minutes: 45,
  reviewed: false,
  outcomes: [
    'Retells the story in three sentences: a stranger came, asked three questions, and it was Jibril.',
    'Knows the three levels of the deen: Islam, Iman and Ihsan.',
    'Sorts at least 5 of 6 deeds into the right door.',
    'Sits close, listens well and asks good questions when learning.',
  ],
  pages: [
    {
      title: 'A strange question',
      scene: 'classroom',
      lines: [
        'Ms. Clarke writes 7 + 5 on the board.',
        '"Who knows the answer?" she asks.',
        'Yusuf leans over to Maryam. "She\'s the teacher. Doesn\'t she know?"',
      ],
      interaction: {
        kind: 'ask',
        prompt: 'Why would a teacher ask something she already knows?',
        reveal: 'So the whole class learns it. Keep that in mind. You will need it soon.',
      },
      teacherNote: 'Let the child guess first. This is the rational step the whole lesson comes back to.',
    },
    {
      title: "Jiddo's story",
      scene: 'jiddo',
      lines: [
        'After school, Yusuf tells Jiddo about it.',
        'Jiddo smiles and puts down his tea. Mishmish the cat climbs onto his lap.',
        '"Something like that happened long ago, in Madinah," he says. "But the one asking was far more surprising."',
      ],
    },
    {
      title: 'Who is he?',
      scene: 'madinah',
      lines: [
        'The Prophet ﷺ was sitting with his companions.',
        'Suddenly a man came in. His clothes were bright white and his hair was very black.',
        'He had no dust on him, as if he lived nearby. Yet nobody there knew him.',
      ],
      evidence: {
        arabic: 'لا يُرى عليه أثرُ السَّفَرِ، ولا يَعرِفُه مِنَّا أحَدٌ',
        meaning: 'No sign of travel could be seen on him, and none of us knew him.',
        reference: MUSLIM_8,
      },
      interaction: {
        kind: 'clues',
        prompt: 'Something does not add up. Tap the two clues.',
        clues: [
          { label: 'No dust from a journey', correct: true },
          { label: 'He came to the masjid', correct: false },
          { label: 'Nobody knew who he was', correct: true },
          { label: 'He wore white clothes', correct: false },
        ],
      },
      teacherNote: 'A stranger from far away would be dusty. Someone from Madinah would be known. Both clues together make the mystery.',
    },
    {
      title: 'How he sat',
      scene: 'sitting',
      lines: [
        'He sat right in front of the Prophet ﷺ, knee to knee.',
        'He rested his hands on his thighs and gave his full attention.',
        'That is how a serious learner sits.',
      ],
      interaction: { kind: 'ask', prompt: 'Show your teacher how you sit when you really want to learn.' },
    },
    {
      title: 'Question one: Islam',
      scene: 'islam',
      lines: ['"O Muhammad, tell me about Islam."', 'The Prophet ﷺ answered with five things a Muslim does.'],
      items: [
        'Say the shahadah: there is no god but Allah, and Muhammad is His Messenger',
        'Pray the salah',
        'Give zakah',
        'Fast in Ramadan',
        'Go on Hajj, if you are able',
      ],
      interaction: { kind: 'ask', prompt: 'Before we hear the answer: what do you think Islam is made of?', reveal: 'Here is what the Prophet ﷺ said.' },
    },
    {
      title: '"You have spoken the truth!"',
      scene: 'islam',
      lines: [
        'The man said, "You have spoken the truth."',
        'The companions were amazed. He asks a question, then says the answer is right?',
        'Remember Ms. Clarke?',
      ],
      interaction: {
        kind: 'ask',
        prompt: 'Why would someone ask a question he already knows the answer to?',
        reveal: 'To teach the people listening. Hold on to that clue.',
      },
    },
    {
      title: 'Question two: Iman',
      scene: 'iman',
      lines: [
        '"Now tell me about Iman."',
        'Iman is what your heart believes. You cannot see it, but it is there, like the roots under a tree.',
      ],
      items: [
        'Allah',
        'His angels',
        'His books',
        'His messengers',
        'The Last Day',
        'Qadar: everything Allah decides, the easy and the hard',
      ],
      interaction: {
        kind: 'ask',
        prompt: 'Islam is what your body does. Iman is what your heart believes. Which one can your friends see?',
        reveal: 'They can see you pray. Only Allah sees what is in your heart.',
      },
    },
    {
      title: 'Question three: Ihsan',
      scene: 'ihsan',
      lines: [
        '"Tell me about Ihsan."',
        'Ihsan means doing your very best because Allah sees you.',
        'Think of a drawing you make for someone you love. You take your time and use your best colours.',
      ],
      evidence: {
        arabic: 'أن تَعبُدَ اللهَ كَأنَّك تَراه، فإن لَم تَكُنْ تَراه فإنَّه يَراك',
        meaning: 'To worship Allah as if you see Him. And if you do not see Him, He sees you.',
        reference: MUSLIM_8,
      },
      interaction: {
        kind: 'ask',
        prompt: 'When nobody is looking, who still sees you?',
        reveal: 'Allah does. And He loves it when you try your best.',
      },
    },
    {
      title: 'Who was that?',
      scene: 'reveal',
      lines: [
        'Then the man stood up and left.',
        'Later the Prophet ﷺ asked Umar, "Do you know who the questioner was?"',
        'Umar said, "Allah and His Messenger know best."',
      ],
      interaction: { kind: 'ask', prompt: 'Who do you think he was?', reveal: 'It was Jibril, the angel. He came to teach them their religion.' },
      evidence: {
        arabic: 'فإنَّه جِبريلُ أتاكُم يُعَلِّمُكُم دينَكُم',
        meaning: 'He was Jibril. He came to teach you your religion.',
        reference: MUSLIM_8,
      },
      teacherNote: 'This is the wow moment. Pause before the reveal and let the child guess.',
    },
    {
      title: 'Three doors',
      scene: 'doors',
      lines: [
        'Jibril asked three questions. Their answers are three doors.',
        'Behind them is everything a Muslim needs to know and do.',
        'In the lessons ahead, we will open them one by one.',
      ],
    },
    {
      title: 'Game: The Three Doors',
      scene: 'doors',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Help Yusuf and Maryam! Send each card through the right door.',
        bins: [
          { id: 'iman', label: 'Iman', hint: 'What I believe' },
          { id: 'islam', label: 'Islam', hint: 'What I do' },
          { id: 'ihsan', label: 'Ihsan', hint: 'My best, because Allah sees me' },
        ],
        cards: [
          { label: 'Praying', bin: 'islam' },
          { label: 'Believing in the angels', bin: 'iman' },
          { label: 'Fasting in Ramadan', bin: 'islam' },
          { label: 'Telling the truth when nobody would find out', bin: 'ihsan' },
          { label: 'Believing in the Last Day', bin: 'iman' },
          { label: 'Doing wudu carefully, without rushing', bin: 'ihsan' },
        ],
      },
      teacherNote: 'Checkpoint for outcomes 2 and 3. Do not hint; note which door was hard.',
    },
    {
      title: 'My Zad',
      scene: 'backpack',
      lines: [
        'Jiddo brings out an old travel backpack.',
        '"Every traveller needs zad, food and supplies for the road. Today you packed your first one: the map of the three doors."',
        'Your mission this week: ask your mum or dad one good question about Allah.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'Pick your question:',
        options: ['How do we know Allah loves us?', 'What is your favourite name of Allah?', 'Why do we pray five times a day?', 'I have my own question'],
      },
    },
    {
      title: 'Next time…',
      scene: 'lego',
      lines: [
        'The next morning, Maryam opens her eyes.',
        'On her floor stands a LEGO castle, with towers, a gate and even a tiny flag.',
        'It was not there last night. Who built it?',
      ],
      interaction: { kind: 'ask', prompt: 'Could a castle build itself?', reveal: 'Find out next time, in Lesson 2: Who Made It All?' },
    },
  ],
};
