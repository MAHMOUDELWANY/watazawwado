import type { Lesson } from '../../types';
import { seerahE01TeacherAr } from './l01-teacher-ar.js';

// Seerah · Teens & Adults · Episode 1. Rules: docs/curriculum/seerah/RULES.md. Model: the owner's deck "Episode 1".
// Facts: The Sealed Nectar (English), "The Elephant Raid" and "His Birth" (pp. 33–36 of the MSA NIU edition), which
// cites Ibn Hisham 1/43–56. The camels conversation is Ibn Ishaq (Ibn Hisham), not in The Sealed Nectar: flagged for the
// owner. The signs at the birth are left out: the book calls them disputed. Ayat 105:1–5 Tanzil Uthmani via the Quran
// Foundation API (2026-10-25), unchanged; English meanings ours. Stills: the owner's, from docs/curriculum/seerah/EP01-image-prompts.md.
const AL_FIL = 'Al-Fil 105:1-5';

export const seerahE01: Lesson = {
  subject: 'seerah-teens',
  version: 'adults',
  subjectTitle: 'Seerah · Teens & Adults',
  number: 1,
  title: 'The World in Shadows: The Invincible Army',
  titleAr: 'عالم في الظل: الجيش الذي لا يُهزم',
  part: 'Episode 1 · The Year of the Elephant',
  minutes: 60,
  goal: 'By the end of this episode, you will know the world the Prophet ﷺ was born into, what happened in the Year of the Elephant, and what it says about power, dignity and trust.',
  reviewed: false,
  teacherAr: seerahE01TeacherAr,
  outcomes: [
    'Describes the two empires and the Arabia of Jahiliyyah in a few sentences.',
    'Tells the story of Abraha and the Elephant in order, with its numbers.',
    'Explains tawakkul as full effort plus full surrender, using what Abdul-Muttalib did.',
    'Reads Surat al-Fil with its meaning and links each ayah to the story.',
    'Names one place in their own life where they feel outnumbered, and what holding their values there looks like.',
  ],
  chapters: [
    { label: 'The world', page: 0 },
    { label: 'The threat', page: 4 },
    { label: 'The confrontation', page: 8 },
    { label: 'The miracle', page: 12 },
    { label: 'The new dawn', page: 17 },
  ],
  pages: [
    {
      title: 'The World in Shadows', station: 'spark', layout: 'cover', scene: 'se1Cover', lines: [],
      explain: ['Open like a series: "Episode 1." Ask: what do you think happens when the strongest army of its time marches on a town with no army at all?'],
    },
    {
      title: 'Two titans, one bleeding world', station: 'spark', layout: 'concept', scene: 'se1Empires',
      lines: [
        'In the sixth century, two superpowers split the known world: Byzantine Rome in the west, Sasanian Persia in the east.',
        'They fought for generations, and whole nations paid for it.',
        'Behind the palaces: tyranny, crushing taxes, and ordinary people with no voice.',
      ],
      items: ['The West: Byzantine Rome', 'The East: Sasanian Persia'],
      explain: ['Set the stage quickly: two empires at war, and a world without justice for ordinary people.', "I'tizaz: greatness is not measured by the size of an empire's army."],
    },
    {
      title: 'The age of ignorance', station: 'spark', layout: 'concept', scene: 'se1Jahiliyyah',
      lines: [
        'Between the empires lay Arabia, in what the Quran calls Jahiliyyah, the age of ignorance.',
        'Tribes fought for decades over small insults. The strong took; the weak were sold.',
        'Some buried their newborn daughters alive, out of fear of shame or poverty.',
      ],
      items: ['Might made right', 'The buried daughters'],
      explain: ['Keep it factual and calm; the point is how far people had fallen without guidance.', "I'tizaz: your worth is not measured by wealth, fame or applause."],
      teacherNote: 'Burying daughters: the Quran mentions it (At-Takwir 81:8–9). Mention it without graphic detail.',
    },
    {
      title: 'The sanctuary in the wilderness', station: 'spark', layout: 'concept', scene: 'se1Makkah',
      lines: [
        'In a barren valley stood the Kaaba, built by Ibrahim and Ismail for the worship of One God.',
        'By now it was ringed with idols. But it was still the House everyone respected.',
        'Every year the tribes came on pilgrimage, and Makkah lived on that honour and that trade.',
      ],
      explain: ['Make the stakes clear: the Kaaba is the heart of Arabia, and its honour is what someone will soon try to take.', "I'tizaz: be a sanctuary of honesty when the world around you loses its compass."],
    },
    {
      title: 'The rising threat', station: 'zad', layout: 'concept', scene: 'se1Abraha',
      lines: [
        'In Yemen ruled Abraha, the viceroy of the Abyssinian king.',
        'He watched the Arabs travel past his capital, every year, to a small house in the desert.',
        'And he decided that the pilgrims, and their wealth, would come to him instead.',
      ],
      items: ['The rank: viceroy of Abyssinia in Yemen', 'The motive: envy of the Kaaba'],
      explain: ['Introduce the antagonist with his motive: envy and pride, dressed up as religion.', "I'tizaz: when envy dresses itself as religion, look under the costume."],
    },
    {
      title: 'The super-cathedral', station: 'zad', layout: 'concept', scene: 'se1Qullays',
      lines: [
        'Abraha built a huge church in Sana\'a to pull the pilgrims away from Makkah.',
        'The Arabs did not come. A man from the tribe of Kinana slipped in at night and defiled it.',
        'Abraha was furious. Now he would not just compete with the Kaaba. He would destroy it.',
      ],
      explain: ['The Sealed Nectar: he built a large church in Sana\'a; a man of Kinana defiled it; Abraha swore to demolish the Kaaba.', "I'tizaz: you cannot bribe the human heart with marble."],
      teacherNote: 'The name al-Qullays for the church is in Ibn Hisham; the book only says "a large church".',
    },
    {
      title: 'The superpower challenge', station: 'zad', layout: 'question', scene: 'se1Scales',
      lines: ['Weigh it up: sixty thousand soldiers and war elephants against a town with no standing army and no walls.', 'By human logic, the result is decided before the first arrow flies.'],
      interaction: { kind: 'ask', prompt: 'When something you believe in looks impossible on paper, what do you do: give up, or hold your ground?', reveal: 'Keep your answer. The rest of this episode is about exactly this question.' },
      explain: ['A real dilemma. Let the learner answer honestly, then hold the answer until the end of the episode.'],
    },
    {
      title: 'March of the iron giants', station: 'zad', layout: 'concept', scene: 'se1March',
      lines: [
        'Abraha marched north with an army the sources put at sixty thousand.',
        'With them came war elephants, nine or thirteen, and Abraha chose the biggest for himself.',
        'Arabia had never seen anything like it. Tribe after tribe stood aside.',
      ],
      items: ['Soldiers: 60,000', 'War elephants: 9 or 13'],
      explain: ['Let the numbers land. The Sealed Nectar: sixty thousand warriors; nine or thirteen elephants; the biggest for Abraha.', "I'tizaz: history's loudest armies often hide its quietest fragility."],
      teacherNote: 'Ibn Hisham names the great elephant Mahmud. Mention it only if asked.',
    },
    {
      title: 'The desert siege', station: 'zad', layout: 'concept', scene: 'se1Camp',
      lines: [
        'The army camped at al-Mughammas, just outside Makkah, and took the herds of the valley.',
        'Among them were two hundred camels belonging to Abdul-Muttalib, the chief of Quraysh.',
        'Abraha\'s message: we have not come to fight you, only to destroy the House.',
      ],
      explain: ['From here to the tent is Ibn Ishaq\'s account (Ibn Hisham). Say: "the historians report".', "I'tizaz: tyrants always offer the same deal: give up what is sacred and you will be left alone."],
      teacherNote: 'Owner to confirm: the camels and the tent come from Ibn Ishaq, not from The Sealed Nectar.',
    },
    {
      title: 'Walking out alone', station: 'zad', layout: 'concept', scene: 'se1Walk',
      lines: [
        'Some in Makkah wanted a hopeless battle; others wanted to flee into the desert.',
        'Abdul-Muttalib chose neither. He told the people to take shelter in the mountains.',
        'Then he walked out, alone, to meet Abraha.',
      ],
      items: ['Move 1: protect the people', 'Move 2: face the tyrant with dignity'],
      explain: ['The Sealed Nectar: Quraysh fled to the hilltops. The walk to Abraha: Ibn Ishaq.', "I'tizaz: leadership is not shouting in the storm; it is choosing the wise path when every voice shouts a different fear."],
    },
    {
      title: 'Camels and the Kaaba', station: 'zad', layout: 'concept', scene: 'se1Tent',
      lines: [
        'Abraha was impressed by the old man and came down from his throne to sit beside him.',
        'Then Abdul-Muttalib asked only for his camels. Abraha laughed: you ask about camels, and not about the House I came to destroy?',
        '"I am the owner of the camels. The House has a Lord who will protect it."',
      ],
      explain: ['Let the quote breathe. It is the line of the episode.', "I'tizaz: know exactly what is yours to guard, and exactly what belongs to Allah."],
      teacherNote: 'Ibn Ishaq (Ibn Hisham). Flagged for the owner.',
    },
    {
      title: 'True trust', station: 'zad', layout: 'concept', scene: 'se1Trust',
      lines: [
        'Abdul-Muttalib did not throw stones at an army, and he did not sit and wait either.',
        'He protected his people, he asked for what was his, and he spoke with dignity.',
        'Only when there was nothing left in human hands did he leave the outcome to Allah.',
      ],
      items: ['Half one: 100% effort', 'Half two: 100% surrender'],
      explain: ['The integrated lesson: tawakkul is not passive waiting. It is everything in your power, then trust.', 'Ask: where in your week do you skip one of the two halves?'],
    },
    {
      title: 'The elephant kneels', station: 'zad', layout: 'concept', scene: 'se1Kneel',
      lines: [
        'At dawn the army moved on Makkah. In the valley of Muhassir, the great elephant knelt and would not move.',
        'Turned north, south or east, it rose and went quickly.',
        'Turned toward the Kaaba, it knelt again.',
      ],
      explain: ['The Sealed Nectar: in the valley of Muhassir, between Muzdalifah and Mina; north, south, east it moved; toward the Kaaba it knelt.', "I'tizaz: even the strongest force in the world is a servant of its Creator."],
    },
    {
      title: 'The illusion of control', station: 'zad', layout: 'question', scene: 'se1Spear',
      lines: ['Abraha had the money, the iron and the elephants. And one animal would not take one step.'],
      interaction: { kind: 'ask', prompt: 'What do people today think makes them untouchable? And what happens when one small thing stops working?', reveal: 'Power is borrowed. It can be taken back in a moment.' },
      explain: ['A short reflection. Let the learner give modern examples, without naming and shaming anyone.'],
    },
    {
      title: 'The sky turns black', station: 'zad', layout: 'concept', scene: 'se1Birds',
      lines: [
        'Then Allah sent birds in flocks, small birds like swallows.',
        'Each carried three stones of baked clay: one in its beak, two in its claws.',
      ],
      explain: ['The Sealed Nectar: birds like swallows and sparrows, each with three stones.', "I'tizaz: when the Creator responds, He does not need thunderbolts."],
    },
    {
      title: 'The verdict of the Quran', station: 'zad', layout: 'evidence', scene: 'se1Fil',
      evidence: {
        arabic: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَـٰبِ ٱلْفِيلِ ۝ أَلَمْ يَجْعَلْ كَيْدَهُمْ فِى تَضْلِيلٍ ۝ وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ ۝ تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ ۝ فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍۭ',
        meaning: 'Have you not seen what your Lord did with the people of the elephant? Did He not make their plan go astray, and send against them birds in flocks, pelting them with stones of baked clay, and leave them like straw eaten bare?',
        reference: AL_FIL,
      },
      lines: [
        'The stones struck the soldiers down. The rest fled and died along the road.',
        'Abraha himself was struck, and reached Sana\'a only to die.',
        'And a whole surah keeps the story, recited by Muslims every day for over fourteen centuries.',
      ],
      tadabbur: {
        word: 'كَيْدَهُمْ',
        root: 'ك ي د',
        meaning: 'a hidden, carefully built plan to harm',
        question: 'What looked like a perfect plan, and what did one word of Allah do to it?',
        action: 'Recite Surat al-Fil this week and remember the story behind each ayah.',
      },
      explain: ['Read the surah in Arabic, then the meaning. Map each ayah to a moment of the story.', 'The Sealed Nectar: Abraha had an infection, reached Sana\'a in a miserable state and died soon after.'],
    },
    {
      title: 'Truth outlasts empires', station: 'athar', layout: 'concept', scene: 'se1Aftermath',
      lines: [
        'The army that frightened Arabia vanished in an afternoon. The undefended House still stood.',
        'You may feel outnumbered: at school, online, in a room where nobody shares your prayer or your standards.',
        'Remember the Year of the Elephant. Noise, money and numbers do not decide who is right.',
      ],
      items: ['The loud: an empire vanished', 'The quiet: the Kaaba standing'],
      explain: ['The second integrated lesson: being outnumbered is not being wrong.', "I'tizaz: you are not a stranger in this world. Hold your values; every generation needs someone who does."],
    },
    {
      title: 'Check the story', station: 'athar', layout: 'game', scene: 'se1Sort',
      lines: [],
      interaction: {
        kind: 'sort', look: 'row',
        prompt: 'What the sources report, and what we draw from it: put each card where it belongs.',
        bins: [
          { id: 'fact', label: 'What happened', hint: 'from the sources' },
          { id: 'lesson', label: 'What it teaches', hint: 'the I\'tizaz' },
        ],
        cards: [
          { label: 'Abraha built a church to pull the pilgrims to Sana\'a', bin: 'fact', why: 'The Sealed Nectar.' },
          { label: 'Envy can dress itself up as religion', bin: 'lesson', why: 'Drawn from his motive.' },
          { label: 'The elephant knelt in the valley of Muhassir', bin: 'fact', why: 'The Sealed Nectar.' },
          { label: 'Power is borrowed and can be taken back', bin: 'lesson', why: 'Drawn from the kneeling elephant.' },
          { label: 'Birds carried three stones each', bin: 'fact', why: 'The Sealed Nectar.' },
          { label: 'Tawakkul is full effort, then full trust', bin: 'lesson', why: 'Drawn from what Abdul-Muttalib did.' },
        ],
      },
      explain: ['Learners separate the facts from the lessons: the skill of reading any history honestly.'],
    },
    {
      title: 'The dawn of the orphan', station: 'athar', layout: 'concept', scene: 'se1Cradle',
      lines: [
        'About fifty days later, in the same year, a boy was born in Makkah, on a Monday morning in Rabi al-Awwal.',
        'His father Abdullah had died before he was born.',
        'His grandfather Abdul-Muttalib carried him to the Kaaba, thanked Allah, and named him Muhammad, a name almost no Arab had.',
      ],
      items: ['571 CE · the Year of the Elephant'],
      explain: ['The Sealed Nectar: the Elephant in Muharram, fifty or fifty-five days before the birth; Monday, Rabi al-Awwal, 571 CE; most historians: his father died two months before; named Muhammad by Abdul-Muttalib.', "I'tizaz: history's greatest legacies do not begin in palaces."],
      teacherNote: 'The signs at the birth (the Persian fire, the palace towers) are left out on purpose: the book calls them disputed.',
    },
    {
      title: 'My Zad', station: 'ahd', layout: 'mission', scene: 'se1Mission',
      lines: ['Abdul-Muttalib guarded what was his and trusted Allah with the rest.'],
      interaction: {
        kind: 'choose',
        prompt: 'This week: pick one place where you feel outnumbered, and do your full part there, then leave the result to Allah. Which one?',
        options: ['At school or work', 'Online', 'With friends', 'At home'],
      },
      explain: ['Ask about it next episode: what was the effort, and what was the trust?'],
    },
    {
      title: 'Next time… to be continued', station: 'ahd', layout: 'next', scene: 'se1Next',
      lines: [
        'The baby is given to a poor nurse from the desert tribe of Banu Sa\'d. Why does her life change overnight?',
        'Years later, two figures in white come to the boy in the hills. What do they open, and what do they place inside?',
        'Next: Episode 2, The Shepherd Boy and the Sealed Chest.',
      ],
      explain: ['End on both mysteries. Do not answer them.'],
    },
  ],
};
