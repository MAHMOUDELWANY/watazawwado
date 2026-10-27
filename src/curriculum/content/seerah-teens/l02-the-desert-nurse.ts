import type { Lesson } from '../../types';
import { seerahE02TeacherAr } from './l02-teacher-ar.js';

// Seerah · Teens & Adults · Episode 2. Rules: docs/curriculum/seerah/RULES.md. Facts: The Sealed Nectar (English),
// "Babyhood" and "Back to His Passionate Mother" (pp. 37–39, MSA NIU edition): Thuwaybah first; Halimah bint Abi Dhu'ayb
// of Banu Sa'd ibn Bakr, her husband al-Harith ibn Abdul-Uzza; the drought, the brown she-donkey, the old she-camel, no
// woman would take the orphan; the milk, the donkey that outran them, the green land (Halimah's account via Ibn Ishaq,
// Ibn Hisham 1/162–164); two years, then kept until four or five; the opening of the chest (Anas, Sahih Muslim 162,
// checked on Dorar 2026-10-27: sahih); returned to his mother. Stills: docs/curriculum/seerah/IMAGE-PROMPTS.md (teens-ep02).
const MUSLIM_162 = 'Sahih Muslim 162 (Anas ibn Malik)';

export const seerahE02: Lesson = {
  subject: 'seerah-teens',
  version: 'adults',
  subjectTitle: 'Seerah · Teens & Adults',
  number: 2,
  title: 'The Desert Nurse',
  titleAr: 'مُرضِعةُ الصحراء',
  part: 'Episode 2 · The Desert Nurse',
  minutes: 60,
  goal: 'By the end of this episode, you will know why the Prophet ﷺ grew up in the desert, how Halimah chose the child nobody wanted, what changed in her life, and what happened in the hills of Banu Sa\'d.',
  reviewed: false,
  teacherAr: seerahE02TeacherAr,
  outcomes: [
    'Explains why Makkan families sent their babies to the desert.',
    'Tells how Halimah came to take the orphan, in order.',
    'Names three blessings that came to Halimah\'s home.',
    'Retells the opening of the chest from Sahih Muslim, and what it prepared him for.',
    'Names one person around them that others pass by, and one way to choose them this week.',
  ],
  chapters: [
    { label: 'The desert', page: 0 },
    { label: 'The orphan', page: 5 },
    { label: 'The blessing', page: 9 },
    { label: 'The hills', page: 13 },
    { label: 'Our turn', page: 16 },
  ],
  pages: [
    {
      title: 'The Desert Nurse', station: 'spark', layout: 'cover', scene: 'se2Cover', lines: [],
      explain: ['Open with last episode\'s cliffhanger: a poor woman, a thin donkey, and a baby nobody wanted. Ask: has anyone ever picked you when nobody else did? How did it feel?'],
    },
    {
      title: 'Why the desert?', station: 'spark', layout: 'concept', scene: 'se2Custom',
      lines: [
        'The noble families of Makkah had a custom: they sent their newborns away to the desert tribes.',
        'Out there the air was clean, the body grew strong, and the children learned the purest Arabic of all.',
        'Town life had its diseases and its bad habits. The desert had space, hardship and good manners.',
        'So every year, bedouin women came to Makkah looking for babies to nurse, and for the reward the families paid.',
      ],
      items: ['The custom: babies raised by desert tribes', 'The gift: strength and pure Arabic'],
      explain: ['The Sealed Nectar, "Babyhood": the custom, the healthy desert air, pure speech and good manners.', 'Before Halimah, the baby was nursed for a few days by Thuwaybah, the freed woman of Abu Lahab.'],
    },
    {
      title: 'A year with no rain', station: 'spark', layout: 'concept', scene: 'se2Drought',
      lines: [
        'That year, the land of Banu Sa\'d had seen no rain. The wells were low; the animals were bones.',
        'A woman called Halimah had a baby of her own who cried all night from hunger.',
        'She had almost no milk. Their old she-camel gave not a single drop.',
      ],
      items: ['The tribe: Banu Sa\'d ibn Bakr', 'The nurse: Halimah bint Abi Dhu\'ayb'],
      explain: ['Halimah tells the story herself, as Ibn Ishaq reports it (Ibn Hisham), quoted in The Sealed Nectar.', 'Let the hunger be felt: this family had nothing to give.'],
    },
    {
      title: 'The slowest in the caravan', station: 'spark', layout: 'concept', scene: 'se2Caravan',
      lines: [
        'The women of Banu Sa\'d set out for Makkah together.',
        'Halimah rode a thin brown she-donkey so weak that it kept the whole caravan waiting.',
        'Her husband, al-Harith, walked beside the old she-camel. Nobody expected much from this family.',
      ],
      explain: ['Plant the detail: the donkey is the slowest. It comes back later in the episode.', 'Her husband: al-Harith ibn Abdul-Uzza, of the same tribe.'],
    },
    {
      title: 'A long hungry night', station: 'spark', layout: 'concept', scene: 'se2Night',
      lines: [
        'On the road they could not sleep: the baby cried, the camel was dry, and they prayed for rain.',
        'Hold on to this picture. Poor, tired, last in line.',
        'In a few days, everything about this family will change, and it will start with one decision.',
      ],
      explain: ['Short page, a pause before the turn of the story.'],
    },
    {
      title: 'The baby nobody wanted', station: 'zad', layout: 'question', scene: 'se2Passed',
      lines: [
        'In Makkah, the women went from door to door. Each was offered the baby Muhammad. Each said no.',
        'The reason was simple: he was an orphan. His father was dead. Who would pay them well?',
      ],
      interaction: { kind: 'ask', prompt: 'Be honest: if you were one of those women, poor and hungry, what would you have done?', reveal: 'By human logic, they were not cruel. They were counting. Keep that in mind for what Halimah does next.' },
      explain: ['Halimah says it plainly in her account: they looked to the reward from the child\'s father, and he had none.', 'Let the learner be honest. The point is that everyone made the "sensible" choice.'],
    },
    {
      title: 'Every woman found a baby', station: 'zad', layout: 'concept', scene: 'se2Lanes',
      lines: [
        'One by one, every woman in the caravan found a child to take home. Except Halimah.',
        'Nobody had offered her a baby from a rich family. Maybe they looked at her donkey and guessed.',
        'The caravan was getting ready to leave. She was about to go home with empty arms.',
      ],
      explain: ['Build the pressure: she is the last one, again.'],
    },
    {
      title: 'One decision', station: 'zad', layout: 'concept', scene: 'se2Doorway',
      lines: [
        'Halimah said to her husband: "I do not want to go back with the others and no baby. I will go to that orphan and take him."',
        'She went back to the house of Aminah and took him in her arms.',
        'She will say later that she took him because there was no one else. But she chose to go back.',
      ],
      items: ['The choice: the child everyone passed by'],
      explain: ['Her words are from her own account (Ibn Ishaq), in The Sealed Nectar.', 'I\'tizaz: a choice made when nobody is clapping is still a choice.'],
    },
    {
      title: 'Perhaps Allah will bless us', station: 'zad', layout: 'concept', scene: 'se2Harith',
      lines: [
        'Her husband did not argue. He did not ask about money.',
        'Remember this man. In one sentence he turned a "no other choice" into an act of trust.',
      ],
      explain: ['Let the quote card breathe; it is the line of the episode.', 'I\'tizaz: support the good choice of the person beside you.'],
    },
    {
      title: 'That same night', station: 'zad', layout: 'concept', scene: 'se2Milk',
      lines: [
        'The moment she held him, Halimah found she had milk. He drank until he was full, and so did her own son.',
        'Both babies slept. For the first time in days, so did she.',
        'Al-Harith went to the old camel and found her udder full. They drank until they were satisfied.',
        'In the morning he said: "Halimah, by Allah, you have taken a blessed child."',
      ],
      items: ['Blessing 1: milk for both babies', 'Blessing 2: the dry camel gives milk'],
      explain: ['Halimah\'s account (Ibn Ishaq), in The Sealed Nectar.', 'Ask: what is barakah? Not "more stuff": more good from the same thing.'],
    },
    {
      title: 'The slowest becomes the fastest', station: 'zad', layout: 'concept', scene: 'se2Donkey',
      lines: [
        'On the way home, the thin donkey that had held everyone back now went ahead of them all.',
        'The other women called out: "Wait for us! Is this not the same donkey you came on?"',
        'Watch the line: last place on the way in, first place on the way home.',
      ],
      items: ['Blessing 3: the weakest animal leads the caravan'],
      explain: ['The Sealed Nectar: the donkey that was lean and almost foundered recovered speed, to the amazement of her companions.'],
    },
    {
      title: 'A green land', station: 'zad', layout: 'concept', scene: 'se2Green',
      lines: [
        'In the land of Banu Sa\'d, the barren earth sprouted grass.',
        'Their sheep came home full of milk, while their neighbours\' flocks came back hungry.',
        'People started telling their shepherds: graze where Halimah\'s sheep graze.',
      ],
      items: ['Blessing 4: the land turns green'],
      explain: ['The Sealed Nectar: the barren land sprouted luxuriant grass and the beasts came back satisfied and full of milk.', 'The detail about the neighbours\' shepherds is in Halimah\'s longer account (Ibn Hisham).'],
    },
    {
      title: 'How barakah works', station: 'zad', layout: 'concept', scene: 'se2Seed',
      lines: [
        'Halimah did not get a rich family\'s reward. She got something money cannot buy.',
        'Her part was small: she chose the child nobody chose. The rest came from Allah.',
        'That is the pattern of this whole series: we do the good thing, and Allah decides how big it grows.',
      ],
      items: ['Your part: the kind choice', 'Allah\'s part: the barakah'],
      explain: ['The integrated lesson: barakah = a kind choice + Allah\'s giving. You cannot control the second half; you can always do the first.', 'Ask: where could you make the "unprofitable" kind choice this week?'],
    },
    {
      title: 'Two more years, please', station: 'zad', layout: 'concept', scene: 'se2Haze',
      lines: [
        'After two years he was weaned, and Halimah took him back to his mother, as agreed.',
        'But she begged Aminah to let him stay: "Look at the sickness in Makkah. Let him come back with us."',
        'Aminah agreed. He went back to the desert and stayed until he was four or five.',
      ],
      items: ['Age 2: weaned', 'Age 4 or 5: still in the desert'],
      explain: ['The Sealed Nectar: two years until weaned; she pleaded because of an illness in Makkah; he stayed until four or five.', 'Ask: what does it tell you that she begged to keep him?'],
    },
    {
      title: 'In the hills of Banu Sa\'d', station: 'zad', layout: 'concept', scene: 'se2Hills',
      lines: [
        'He grew up among the bedouin children: running in the hills, out with the lambs, speaking their clear Arabic.',
        'His foster sister ash-Shayma\' used to carry him and look after him.',
        'Then, one day, while he was playing with the other boys, something happened that the boys never forgot.',
      ],
      explain: ['The Sealed Nectar names his foster siblings: Abdullah, Unaysah and Hudhafah, known as ash-Shayma\'.', 'Slow down before the next page.'],
    },
    {
      title: 'The opening of the chest', station: 'zad', layout: 'evidence', scene: 'se2Basin', contextFirst: true,
      evidence: {
        arabic: 'أَتَاهُ جِبْرِيلُ وَهُوَ يَلْعَبُ مَعَ الْغِلْمَانِ، فَأَخَذَهُ فَصَرَعَهُ، فَشَقَّ عَنْ قَلْبِهِ، فَاسْتَخْرَجَ الْقَلْبَ، فَاسْتَخْرَجَ مِنْهُ عَلَقَةً، فَقَالَ: هَذَا حَظُّ الشَّيْطَانِ مِنْكَ، ثُمَّ غَسَلَهُ فِي طَسْتٍ مِنْ ذَهَبٍ بِمَاءِ زَمْزَمَ، ثُمَّ لَأَمَهُ، ثُمَّ أَعَادَهُ فِي مَكَانِهِ',
        meaning: 'Jibril came to him while he was playing with the boys. He took him, laid him down, opened his chest and took out the heart. He removed a clot from it and said, "This was Satan\'s share of you." Then he washed it in a basin of gold with the water of Zamzam, closed it, and put it back in its place.',
        reference: MUSLIM_162,
      },
      lines: [
        'The boys ran to Halimah shouting that Muhammad had been killed. They found him standing, pale, and unharmed.',
        'Anas, who reports it, said that he later saw the mark of the stitching on his chest.',
        'A heart cleaned in childhood, for a message that would come forty years later.',
      ],
      explain: ['Sahih Muslim 162 (checked on Dorar: sahih). Read the English meaning first, then the Arabic.', 'Jibril is never drawn. On the stage there is only light and a basin of water.'],
      teacherNote: 'Keep it calm and wondrous, not graphic: no surgery images in words. The point is preparation and purity.',
    },
    {
      title: 'What would you wash out?', station: 'athar', layout: 'question', scene: 'se2Vessel',
      lines: [
        'His heart was cleaned by a miracle. Ours are cleaned the slow way: tawbah, dhikr, good company, and time.',
        'Envy, a grudge, a habit you are ashamed of: everyone carries some sediment.',
      ],
      interaction: { kind: 'ask', prompt: 'If you could wash one thing out of your heart this month, what would it be? You do not have to say it aloud.', reveal: 'Name it to Allah tonight in your dua. That is where the washing starts.' },
      explain: ['A private reflection. Do not ask the learner to share it.'],
    },
    {
      title: 'Check the story', station: 'athar', layout: 'game', scene: 'se2Sort',
      lines: [],
      interaction: {
        kind: 'sort', look: 'row',
        prompt: 'What the sources report, and what we draw from it: put each card where it belongs.',
        bins: [
          { id: 'fact', label: 'What happened', hint: 'from the sources' },
          { id: 'lesson', label: 'What it teaches', hint: 'for us' },
        ],
        cards: [
          { label: 'The women refused the baby because he was an orphan', bin: 'fact', why: 'Halimah\'s own account.' },
          { label: 'The kind choice is often the unprofitable one', bin: 'lesson', why: 'Drawn from Halimah\'s decision.' },
          { label: 'The weak donkey outran the caravan', bin: 'fact', why: 'The Sealed Nectar.' },
          { label: 'Barakah is more good from the same thing', bin: 'lesson', why: 'Drawn from the milk and the land.' },
          { label: 'His chest was opened while he played with the boys', bin: 'fact', why: 'Sahih Muslim 162.' },
          { label: 'A heart can be cleaned, and it needs to be', bin: 'lesson', why: 'Drawn from the opening of the chest.' },
        ],
      },
      explain: ['Learners separate the facts from the lessons, as in Episode 1.'],
    },
    {
      title: 'My Zad', station: 'ahd', layout: 'mission', scene: 'se2Mission',
      lines: ['Everyone passed by the orphan. Halimah went back for him.'],
      interaction: {
        kind: 'choose',
        prompt: 'This week, choose one person others pass by, and make room for them. Where?',
        options: ['The lunch table', 'A group chat', 'The masjid', 'At home'],
      },
      explain: ['Ask about it next episode: who was it, and what happened?'],
    },
    {
      title: 'Next time… to be continued', station: 'ahd', layout: 'next', scene: 'se2Next',
      lines: [
        'Halimah, frightened, brings the boy back to his mother for good. He is about six.',
        'Aminah decides to take him on a long journey north, five hundred kilometres. Not everyone will come home.',
        'Next: Episode 3, Three Goodbyes.',
      ],
      explain: ['End on the journey. Do not say what happens at al-Abwa.'],
    },
  ],
};
